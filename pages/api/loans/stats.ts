import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { prisma } from '../../../lib/prisma'
import { authOptions } from '../auth/[...nextauth]'
import { getCanonicalRole } from '../../../config/roleConfig'
import { getEffectiveReturnDate } from '../../../utils/loanHelpers'
import { isLoanActive } from '../../../utils/activeLoanHelpers'
import { formatLifecycleStatusLabel } from '../../../utils/peminjamanHelpers'

const pendingStatuses = new Set(['pending', 'pending approval', 'pending_approval', 'menunggu approval'])
const normalizeStatus = (value: any) => (typeof value === 'string' ? value.trim().toLowerCase() : '')
const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}
const msPerDay = 1000 * 60 * 60 * 24
const privilegedRoles = new Set(['admin', 'superadmin'])
const getQueryValue = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

const COMPLETED_KEYWORDS = ['returned', 'dikembalikan', 'completed']

const loanStatSelect = {
  id: true,
  userId: true,
  isDraft: true,
  loanStatus: true,
  warehouseStatus: true,
  returnStatus: true,
  returnRequest: true,
  extendStatus: true,
  submittedAt: true,
  useDate: true,
  outDate: true,
  returnDate: true,
  totalDenda: true
} as const

const collectStatus = (input: any, collector: string[]) => {
  if (!input) return
  if (Array.isArray(input)) {
    input.forEach((entry) => collectStatus(entry, collector))
    return
  }

  if (typeof input === 'string') {
    collector.push(normalizeStatus(input))
    return
  }

  if (typeof input === 'object') {
    collector.push(normalizeStatus((input as any)?.status))
  }
}

const isLoanCompleted = (loan: any) => {
  const statuses: string[] = []
  collectStatus(loan?.loanStatus, statuses)
  collectStatus(loan?.warehouseStatus, statuses)
  collectStatus(loan?.returnStatus, statuses)
  collectStatus(loan?.returnRequest, statuses)
  collectStatus(loan?.extendStatus, statuses)

  return statuses.some((status) =>
    Boolean(status) && COMPLETED_KEYWORDS.some((keyword) => status!.includes(keyword))
  )
}

const buildStats = (loans: any[]) => {
  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  let activeLoans = 0
  let overdueLoans = 0
  let totalFine = 0
  let pendingApprovals = 0
  let completedLoans = 0
  let waitingApprovals = 0

  loans.forEach((loan) => {
    const canonicalStatus = normalizeStatus(loan?.loanStatus)
    if (pendingStatuses.has(canonicalStatus)) {
      pendingApprovals += 1
    }

    // Count 'Menunggu Approval' including 'Disetujui Marketing'
    try {
      const formatted = String(formatLifecycleStatusLabel(loan?.loanStatus)).toLowerCase()
      if (pendingStatuses.has(canonicalStatus) || formatted.includes('disetujui marketing')) {
        waitingApprovals += 1
      }
    } catch (e) {}

    const fineAmount = toNumber((loan?.totalDenda as any)?.fineAmount)
    if (fineAmount > 0) {
      totalFine += fineAmount
    }

    if (isLoanCompleted(loan)) {
      completedLoans += 1
    }

    if (!isLoanActive(loan)) return

    activeLoans += 1

    const effectiveReturn = getEffectiveReturnDate(loan)
    if (!effectiveReturn) return

    const due = new Date(effectiveReturn)
    if (Number.isNaN(due.getTime())) return

    const daysLeft = Math.floor((due.getTime() - todayMidnight.getTime()) / msPerDay)
    if (daysLeft < 0) {
      overdueLoans += 1
    }
  })

  return {
    totalLoans: loans.length,
    activeLoans,
    overdueLoans,
    completedLoans,
    totalFine,
    pendingApprovals,
    waitingApprovals
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })

  try {
    const session = (await getServerSession(req, res, authOptions as any)) as any
    if (!session?.user) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const role = getCanonicalRole(session.user.role)
    let whereClause: any = undefined
    const ownerUserId = getQueryValue(req.query.ownerUserId) || getQueryValue(req.query.userId)
    const sessionUserId = String(session.user.id)

    if (ownerUserId) {
      if (ownerUserId !== sessionUserId && !privilegedRoles.has(role)) {
        return res.status(403).json({ message: 'Tidak memiliki akses untuk data ini' })
      }
      whereClause = { userId: ownerUserId }
    } else if (role === 'marketing') {
      const userId = sessionUserId
      if (!userId) return res.status(401).json({ message: 'Not authenticated' })
      const owned = await prisma.mktCompany.findMany({ where: { userId }, select: { value: true } })
      const ownedValues = owned.map((o) => o.value)
      if (!ownedValues.length) {
        return res.status(200).json({ totalLoans: 0, activeLoans: 0, overdueLoans: 0, completedLoans: 0, totalFine: 0, pendingApprovals: 0, waitingApprovals: 0 })
      }
      whereClause = { company: { hasSome: ownedValues } }
    } else if (role === 'regular') {
      const userId = sessionUserId
      if (!userId) return res.status(401).json({ message: 'Not authenticated' })
      whereClause = whereClause ? { AND: [whereClause, { userId }] } : { userId }
    }

    const loans = await prisma.loan.findMany({
      where: whereClause,
      select: loanStatSelect
    })

    const stats = buildStats(loans)
    return res.status(200).json(stats)
  } catch (error) {
    console.error('Error fetching loan stats:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data' })
  }
}
