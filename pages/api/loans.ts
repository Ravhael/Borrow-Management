import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { getCanonicalRole } from '../../config/roleConfig'

const MAX_PAGE_SIZE = 500
const privilegedRoles = new Set(['admin', 'superadmin'])

const getQueryValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

const warehouseLoanSelect = {
  id: true,
  submittedAt: true,
  borrowerName: true,
  entitasId: true,
  borrowerPhone: true,
  borrowerEmail: true,
  needType: true,
  company: true,
  outDate: true,
  useDate: true,
  returnDate: true,
  productDetailsText: true,
  pickupMethod: true,
  note: true,
  approvalAgreementFlag: true,
  isDraft: true,
  approvals: true,
  warehouseStatus: true,
  loanStatus: true,
  userId: true
} as const

const firstQueryValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

const parseTakeParam = (value: string | string[] | undefined) => {
  const parsed = Number.parseInt(firstQueryValue(value) ?? '', 10)
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(parsed, MAX_PAGE_SIZE)
  }
  return undefined
}

// Runtime now uses the Loans DB table via Prisma — data/loans.json is a seed fixture only

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'DELETE') return res.status(405).json({ message: 'Method not allowed' })

  try {
    if (req.method === 'GET') {
      const view = firstQueryValue(req.query.view)
      const takeParam = parseTakeParam(req.query.take)
      const effectiveTake = view === 'warehouse' ? (takeParam ?? Math.min(200, MAX_PAGE_SIZE)) : takeParam
      const statusFilter = firstQueryValue(req.query.status)
      const ownerUserId = getQueryValue(req.query.ownerUserId) || getQueryValue(req.query.userId)

      // Respect role-based visibility according to the role permissions (read scope)
      const session = (await getServerSession(req, res, authOptions as any)) as any
      const sessionUserId = session?.user?.id ? String(session.user.id) : null

      // Determine read permission value from role or user-level permissions
      const { normalizePermissions } = await import('../../utils/authorization')
      const perms = normalizePermissions((session?.user?.role as any)?.permissions ?? (session?.user as any)?.permissions ?? null)
      const readVal = perms.read

      let whereClause: any = statusFilter ? { loanStatus: statusFilter } : undefined

      if (ownerUserId) {
        if (!sessionUserId) return res.status(401).json({ message: 'Not authenticated' })
        // Only allow asking for arbitrary owner user id if requester is admin/superadmin or has All read
        const isPrivileged = readVal === 'All' || ['admin','superadmin'].includes(getCanonicalRole(session?.user?.role))
        if (ownerUserId !== sessionUserId && !isPrivileged) {
          return res.status(403).json({ message: 'Tidak memiliki akses untuk data ini' })
        }
        whereClause = whereClause ? { AND: [whereClause, { userId: ownerUserId }] } : { userId: ownerUserId }
      } else if (readVal === 'MarketingOwner') {
        const userId = String(session?.user?.id)
        if (!userId) return res.status(401).json({ message: 'Not authenticated' })
        // Find the company values owned by this marketing user
        const owned = await prisma.mktCompany.findMany({ where: { userId }, select: { value: true } })
        const ownedValues = owned.map(o => o.value)
        // If user owns no companies, they shouldn't see any loans
        whereClause = whereClause ? { AND: [whereClause, { company: { hasSome: ownedValues } }] } : { company: { hasSome: ownedValues } }
      } else if (readVal === 'OwnMarketing') {
        const entitasCode = (session?.user as any)?.entitas?.code ?? null
        if (!entitasCode) {
          console.warn('[loans GET] OwnMarketing: User has no entitas code, returning empty array')
          return res.status(200).json([])
        }
        const matchedCompanies = await prisma.mktCompany.findMany({ where: { value: { startsWith: entitasCode, mode: 'insensitive' } }, select: { value: true } })
        const matchedValues = matchedCompanies.map(c => c.value)
        console.log('[loans GET] OwnMarketing: entitasCode=%s matchedCount=%d matchedValues=%o', entitasCode, matchedValues.length, matchedValues)
        if (!matchedValues.length) {
          // no companies associated with this entitas
          return res.status(200).json([])
        }
        // prefer a mapping-based match when available (loanMappings relation), fallback to company string array
        const condition = {
          OR: [
            { loanMappings: { some: { mktCompany: { value: { in: matchedValues } } } } },
            { company: { hasSome: matchedValues } }
          ]
        }
        whereClause = whereClause ? { AND: [whereClause, condition] } : condition
        console.log('[loans GET] OwnMarketing whereClause: %o', whereClause)
      } else if (readVal === 'WarehouseOwner') {
        const userId = String(session?.user?.id)
        if (!userId) return res.status(401).json({ message: 'Not authenticated' })
        const owned = await prisma.mktCompany.findMany({ where: { whId: userId }, select: { value: true } })
        const ownedValues = owned.map(o => o.value)
        whereClause = whereClause ? { AND: [whereClause, { company: { hasSome: ownedValues } }] } : { company: { hasSome: ownedValues } }
      } else if (readVal === 'OwnEntitas') {
        const entitasCode = (session?.user as any)?.entitas?.code ?? null
        // Debug logging to help diagnose empty result issues
        console.log('[loans GET] OwnEntitas filter:', { 
          userId: sessionUserId, 
          entitasCode, 
          sessionUserEntitas: (session?.user as any)?.entitas,
          hasEntitas: !!(session?.user as any)?.entitas
        })
        if (!entitasCode) {
          // cannot determine entitas for this user; return empty set
          console.warn('[loans GET] OwnEntitas: User has no entitas code, returning empty array')
          return res.status(200).json([])
        }
        whereClause = whereClause ? { AND: [whereClause, { entitasId: entitasCode }] } : { entitasId: entitasCode }
        console.log('[loans GET] OwnEntitas whereClause:', JSON.stringify(whereClause, null, 2))
      } else if (readVal === 'Owner') {
        // fall back to owner-only
        const userId = String(session?.user?.id)
        if (!userId) return res.status(401).json({ message: 'Not authenticated' })
        whereClause = whereClause ? { AND: [whereClause, { userId }] } : { userId }
      } else if (readVal === 'Disable') {
        return res.status(403).json({ message: 'Tidak memiliki akses untuk data ini' })
      }

      const loans = await prisma.loan.findMany({
        orderBy: { submittedAt: 'desc' },
        select: view === 'warehouse' ? warehouseLoanSelect : undefined,
        take: effectiveTake,
        where: whereClause
      })
      return res.status(200).json(loans)
    } else if (req.method === 'DELETE') {
      // Bulk delete: respect role & user-level delete permissions (All / Own)
      const { ids } = req.body

      // Debug incoming request
      console.debug('[loans DELETE] received body:', req.body)

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Array of loan IDs is required' })
      }

      const session = (await getServerSession(req, res, authOptions as any)) as any
      const sessionUserId = session?.user?.id ? String(session.user.id) : null
      console.debug('[loans DELETE] sessionUserId=%s sessionRole=%o', sessionUserId, session?.user?.role)
      if (!sessionUserId) return res.status(401).json({ message: 'Not authenticated' })

      const role = getCanonicalRole(session?.user?.role)
      // Admin/superadmin shortcut
      if (role === 'admin' || role === 'superadmin') {
        try {
          const idsArr = ids.map((i: any) => String(i))
          // first delete join rows to avoid FK constraint violations
          await prisma.loanMktCompany.deleteMany({ where: { loanId: { in: idsArr } } })
          const result = await prisma.loan.deleteMany({ where: { id: { in: idsArr } } })
          return res.status(200).json({ message: `${result.count} loan(s) deleted successfully`, deletedCount: result.count })
        } catch (err) {
          console.error('[loans DELETE] admin deleteMany failed', err)
          return res.status(500).json({ message: 'Failed to delete loans' })
        }
      }

      // Determine delete permission from role/user
      const { normalizePermissions } = await import('../../utils/authorization')
      const perms = normalizePermissions((session?.user?.role as any)?.permissions ?? (session?.user as any)?.permissions ?? null)
      const deleteVal = perms.delete
      console.debug('[loans DELETE] perms=%o deleteVal=%s idsCount=%d', perms, deleteVal, Array.isArray(ids) ? ids.length : 0)

      const idsArr = ids.map((i: any) => String(i))

      if (deleteVal === 'All') {
        try {
          // ensure join rows are removed first
          await prisma.loanMktCompany.deleteMany({ where: { loanId: { in: idsArr } } })
          const result = await prisma.loan.deleteMany({ where: { id: { in: idsArr } } })
          return res.status(200).json({ message: `${result.count} loan(s) deleted successfully`, deletedCount: result.count })
        } catch (err) {
          console.error('[loans DELETE] deleteMany failed', err)
          return res.status(500).json({ message: 'Failed to delete loans' })
        }
      }

      if (deleteVal === 'Own') {
        // Fetch the target loans and ensure the session user owns ALL of them
        try {
          const targetLoans = await prisma.loan.findMany({ where: { id: { in: idsArr } }, select: { id: true, userId: true } })
          const notOwned = targetLoans.some(l => String(l.userId) !== sessionUserId)
          if (notOwned) return res.status(403).json({ message: 'Forbidden: you can only delete your own loans' })

          const result = await prisma.loan.deleteMany({ where: { id: { in: idsArr } } })
          return res.status(200).json({ message: `${result.count} loan(s) deleted successfully`, deletedCount: result.count })
        } catch (err) {
          console.error('[loans DELETE] Own delete failed', err)
          return res.status(500).json({ message: 'Failed to delete loans' })
        }
      }

      // No delete permission
      return res.status(403).json({ message: 'Not allowed' })
    }
  } catch (error) {
    console.error('Error processing loans:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan saat memproses data' })
  }
}