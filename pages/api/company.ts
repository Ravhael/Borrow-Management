import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { getCanonicalRole } from '../../config/roleConfig'
import { requireCrudPermission } from '../../utils/authorization'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // authenticate + role gating
      const session = (await getServerSession(req, res, authOptions as any)) as any
      if (!session?.user?.id) return res.status(401).json({ message: 'Not authenticated' })

      const role = getCanonicalRole(session.user?.role)

      // allow caller to request the full company list explicitly (useful for UI like the /form page)
      const qAll = String(req.query.all ?? '').toLowerCase()
      if (qAll === 'true') {
        const companies = await prisma.mktCompany.findMany({ orderBy: { label: 'asc' } })
        return res.status(200).json(companies)
      }

      if (role === 'marketing') {
        // marketing users only see companies they own
        const companies = await prisma.mktCompany.findMany({ where: { userId: String(session.user.id) }, orderBy: { label: 'asc' } })
        return res.status(200).json(companies)
      }

      // non-marketing: full list
      const companies = await prisma.mktCompany.findMany({ orderBy: { label: 'asc' } })
      return res.status(200).json(companies)
    } catch (error) {
      console.error('Error fetching MktCompany from DB:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { action, data } = req.body

  try {
    const session = (await getServerSession(req, res, authOptions as any)) as any
    if (!session?.user?.id) return res.status(401).json({ message: 'Not authenticated' })

    // Enforce permission via role checks (Create/Update removed from permission model)

    if (action === 'create') {
      const role = getCanonicalRole(session.user.role)
      if (!(role === 'admin' || role === 'superadmin')) return res.status(403).json({ message: 'Forbidden' })

      // Validate whId when provided: must be an existing user with warehouse role
      if (data.whId) {
        const dep = await prisma.user.findUnique({ where: { id: data.whId } })
        if (!dep || String(dep.roleid) !== '002') return res.status(400).json({ message: 'Invalid warehouse user' })
      }

      await prisma.mktCompany.create({
        data: {
          value: data.value,
          label: data.label,
          // allow an optional owner user id
          userId: data.userId ?? null,
          whId: data.whId ?? null,
          description: data.description ?? null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          emails: data.emails || {}
        }
      })
    } else if (action === 'update') {
        const targetValue = data.oldValue
        const found = await prisma.mktCompany.findUnique({ where: { value: targetValue } })
        if (!found) return res.status(404).json({ message: 'Not found' })

        // require admin role or ownership for updates
        const role = getCanonicalRole(session.user.role)
        if (!(role === 'admin' || role === 'superadmin')) {
          if (String(found.userId) !== String(session.user.id)) return res.status(403).json({ message: 'Forbidden' })
        }

        // Validate whId when provided: must be an existing user with warehouse role
        if (data.whId) {
          const dep = await prisma.user.findUnique({ where: { id: data.whId } })
          if (!dep || String(dep.roleid) !== '002') return res.status(400).json({ message: 'Invalid warehouse user' })
        }

      await prisma.mktCompany.update({
        where: { value: data.oldValue },
        data: { value: data.value, label: data.label, userId: data.userId ?? null, whId: data.whId ?? null, description: data.description ?? null, isActive: data.isActive, emails: data.emails }
      })
    } else if (action === 'delete') {
      const found = await prisma.mktCompany.findUnique({ where: { value: data.value } })
        if (!found) return res.status(404).json({ message: 'Not found' })

        const perm = await requireCrudPermission({ req, res, action: 'delete', resourceOwnerId: String(found.userId), resourceName: 'company' })
        if (!perm) return

        await prisma.mktCompany.delete({ where: { value: data.value } })
    } else if (action === 'toggle-status') {
      const found = await prisma.mktCompany.findUnique({ where: { value: data.value } })
      if (!found) return res.status(404).json({ message: 'Not found' })

      const role = getCanonicalRole(session.user.role)
      if (!(role === 'admin' || role === 'superadmin')) {
        if (String(found.userId) !== String(session.user.id)) return res.status(403).json({ message: 'Forbidden' })
      }

      await prisma.mktCompany.update({ where: { value: data.value }, data: { isActive: !found.isActive } })
    } else if (action === 'bulk-delete') {
      // If user lacks global delete, require ownership of all companies
      const perm = await requireCrudPermission({ req, res, action: 'delete', resourceName: 'company' })
      if (!perm) {
        // check ownership for marketing role fallback
        const found = await prisma.mktCompany.findMany({ where: { value: { in: data.values } } })
        const notOwned = found.some(f => String(f.userId) !== String(session.user.id))
        if (notOwned) return res.status(403).json({ message: 'Forbidden' })
      }

      await prisma.mktCompany.deleteMany({ where: { value: { in: data.values } } })
    } else if (action === 'bulk-status-update') {
      const role = getCanonicalRole(session.user.role)
      if (!(role === 'admin' || role === 'superadmin')) {
        const found = await prisma.mktCompany.findMany({ where: { value: { in: data.values } } })
        const notOwned = found.some(f => String(f.userId) !== String(session.user.id))
        if (notOwned) return res.status(403).json({ message: 'Forbidden' })
      }

      await prisma.mktCompany.updateMany({ where: { value: { in: data.values } }, data: { isActive: data.isActive } })
    } else {
      return res.status(400).json({ message: 'Invalid action' })
    }

    return res.status(200).json({ message: 'Success' })
  } catch (error) {
    console.error('Error handling company action:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}