import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { getCanonicalRole } from '../../config/roleConfig'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Optionally include privileged roles when requested by admin UI
      const includePrivileged = String(req.query.includePrivileged || '').toLowerCase() === 'true'

      let roles
      if (includePrivileged) {
        roles = await prisma.role.findMany({ orderBy: { name: 'asc' } })
      } else {
        roles = await prisma.role.findMany({
          where: {
            NOT: [
              { name: { equals: 'Admin', mode: 'insensitive' } },
              { name: { equals: 'Superadmin', mode: 'insensitive' } }
            ]
          },
          orderBy: { name: 'asc' }
        })
      }
      return res.status(200).json({ ok: true, roles })
    }

    // For write operations, require authenticated admin / superadmin
    const session = (await getServerSession(req, res, authOptions as any)) as any
    if (!session?.user?.id) return res.status(401).json({ ok: false, error: 'Not authenticated' })
    const callerRole = getCanonicalRole(session.user?.role)
    if (!(callerRole === 'admin' || callerRole === 'superadmin')) return res.status(403).json({ ok: false, error: 'Forbidden' })

    if (req.method === 'POST') {
      const { id, name, description, permissions } = req.body
      // Accept `menuGroups` from older clients as alias for `allowedMenus`
      const allowedMenus = req.body.allowedMenus ?? req.body.menuGroups ?? []
      if (!name) return res.status(400).json({ ok: false, error: 'Name is required' })
      const roleId = id && String(id).trim() !== '' ? String(id).trim() : String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')

      // check uniqueness
      const exists = await prisma.role.findUnique({ where: { id: roleId } })
      if (exists) return res.status(409).json({ ok: false, error: 'Role id already exists' })

      const created = await prisma.role.create({ data: { id: roleId, name, description: description ?? '', permissions: permissions ?? [], allowedMenus: allowedMenus ?? [] } })
      return res.status(201).json({ ok: true, role: created })
    }

    if (req.method === 'PUT') {
      const id = String(req.query.id || '')
      if (!id) return res.status(400).json({ ok: false, error: 'Role id is required' })
      const { name, description, permissions } = req.body
      // Accept `menuGroups` from older clients as alias for `allowedMenus`
      const allowedMenus = req.body.allowedMenus ?? req.body.menuGroups ?? undefined
      const found = await prisma.role.findUnique({ where: { id } })
      if (!found) return res.status(404).json({ ok: false, error: 'Role not found' })
      const updated = await prisma.role.update({ where: { id }, data: { name: name ?? found.name, description: description ?? found.description, permissions: permissions ?? found.permissions, allowedMenus: allowedMenus ?? found.allowedMenus } })
      return res.status(200).json({ ok: true, role: updated })
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id || '')
      if (!id) return res.status(400).json({ ok: false, error: 'Role id is required' })
      // prevent deletion if there are users assigned
      const assigned = await prisma.user.findFirst({ where: { roleid: id } })
      if (assigned) return res.status(400).json({ ok: false, error: 'Role is assigned to users and cannot be deleted' })
      await prisma.role.delete({ where: { id } })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (err: any) {
    console.error('/api/roles error:', err)
    return res.status(500).json({ ok: false, error: err?.message ?? 'server-error' })
  }
}
