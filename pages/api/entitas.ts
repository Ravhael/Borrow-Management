import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { requireCrudPermission } from '../../utils/authorization'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Fetch entitas rows from DB (code is the external value used by the app)
      const rows = await prisma.entitas.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          emails: true,
          isActive: true,
          directorateId: true
        }
      })

      const data = rows.map((r: any) => ({
        id: r.id,
        value: r.code,
        label: r.name,
        description: r.description ?? '',
        isActive: r.isActive ?? true,
        directorateId: r.directorateId ?? null,
        emails: r.emails ?? { Head: '', Finance: '', Admin: '', Others: '' }
      }))

      return res.status(200).json(data)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { action, data } = req.body

  try {
    // For create/update actions we require admin role (create/update removed from permission model)
    const role = (await import('../../config/roleConfig')).getCanonicalRole
    if (action === 'create') {
      const s = (await import('next-auth/next')).getServerSession
      const authOptions = (await import('./auth/[...nextauth]')).authOptions
      const session = (await s(req, res, authOptions as any)) as any
      if (!session?.user?.id) return res.status(401).json({ message: 'Not authenticated' })
      const r = (await import('../../config/roleConfig')).getCanonicalRole(session.user.role)
      if (!(r === 'admin' || r === 'superadmin')) return res.status(403).json({ message: 'Forbidden' })

      await prisma.entitas.create({
        data: {
          name: data.label || data.name || '',
          code: data.value || data.code,
          description: data.description ?? '',
          emails: data.emails ?? { Head: '', Finance: '', Admin: '', Others: '' },
          isActive: data.isActive ?? true,
          directorateId: data.directorateId ?? 0
        }
      })
      return res.status(200).json({ message: 'Success' })
    }

    if (action === 'update') {
      // Data must include identifier (id or oldValue/code)
      const identifier = data.id ?? data.oldValue ?? data.code
      if (!identifier) return res.status(400).json({ message: 'Missing identifier for update' })

      // If identifier is numeric, treat as id; otherwise treat as code
      const where: any = typeof identifier === 'number' || /^\\d+$/.test(String(identifier)) ? { id: Number(identifier) } : { code: String(identifier) }

      // require admin role or ownership for update
      const s = (await import('next-auth/next')).getServerSession
      const authOptions = (await import('./auth/[...nextauth]')).authOptions
      const session = (await s(req, res, authOptions as any)) as any
      if (!session?.user?.id) return res.status(401).json({ message: 'Not authenticated' })
      const found = await prisma.entitas.findFirst({ where })
      if (!found) return res.status(404).json({ message: 'Not found' })
      const r = (await import('../../config/roleConfig')).getCanonicalRole(session.user.role)
      if (!(r === 'admin' || r === 'superadmin')) {
        // ownership semantics don't apply to entitas; deny
        return res.status(403).json({ message: 'Forbidden' })
      }

      await prisma.entitas.update({
        where,
        data: {
          name: data.label ?? data.name,
          code: data.value ?? data.code,
          description: data.description ?? undefined,
          emails: data.emails ?? undefined,
          isActive: data.isActive ?? undefined,
          directorateId: data.directorateId ?? undefined
        }
      })

      return res.status(200).json({ message: 'Success' })
    }

    if (action === 'delete') {
      const identifier = data.id ?? data.value ?? data.code
      if (!identifier) return res.status(400).json({ message: 'Missing identifier for delete' })
      const where: any = typeof identifier === 'number' || /^\d+$/.test(String(identifier)) ? { id: Number(identifier) } : { code: String(identifier) }
      const permDel = await requireCrudPermission({ req, res, action: 'delete', resourceName: 'entitas' })
      if (!permDel) return

      await prisma.entitas.delete({ where })
      return res.status(200).json({ message: 'Success' })
    }

    if (action === 'bulk-delete') {
      const values = Array.isArray(data.values) ? data.values : []

      const permDelMany = await requireCrudPermission({ req, res, action: 'delete', resourceName: 'entitas' })
      if (!permDelMany) return

      // try to delete by code list
      await prisma.entitas.deleteMany({ where: { code: { in: values as string[] } } })
      return res.status(200).json({ message: 'Success' })
    }

    if (action === 'bulk-status-update') {
      const values = Array.isArray(data.values) ? data.values : []
      const isActive = !!data.isActive
      // Require admin role for bulk updates (update permission is not part of the current CRUD model)
      const s = (await import('next-auth/next')).getServerSession
      const authOptions = (await import('./auth/[...nextauth]')).authOptions
      const session = (await s(req, res, authOptions as any)) as any
      if (!session?.user?.id) return res.status(401).json({ message: 'Not authenticated' })
      const r = (await import('../../config/roleConfig')).getCanonicalRole(session.user.role)
      if (!(r === 'admin' || r === 'superadmin')) return res.status(403).json({ message: 'Forbidden' })

      await prisma.entitas.updateMany({ where: { code: { in: values as string[] } }, data: { isActive } })
      return res.status(200).json({ message: 'Success' })
    }

    return res.status(400).json({ message: 'Invalid action' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// (now database-driven) - previous file I/O helper removed