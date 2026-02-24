import type { LoanData as DashboardLoan } from '../types/loan'
import type { LoanData as DetailLoan } from '../types/loanDetail'
import { getEffectiveReturnDate, getOverallStatus } from './loanHelpers'
import { isLoanActive } from './activeLoanHelpers'
import { apiFetch } from './basePath'

export type LoanFineSource = (DashboardLoan | DetailLoan | (DashboardLoan & DetailLoan) | Record<string, any>) & {
  id?: string | null
  totalDenda?: {
    fineAmount?: number | null
    daysOverdue?: number | null
    updatedAt?: string | null
  } | null
}

export interface FineComputationResult {
  fineAmount: number
  daysOverdue: number
  updatedAt: string
}

const DAY_IN_MS = 1000 * 60 * 60 * 24

const OVERDUE_STATUS_TOKENS = new Set(
  [
    'dipinjam',
    'permintaan pengembalian',
    'perlu tindak lanjut',
    'return follow up',
    'return followup',
    'dikembalikan tidak lengkap',
    'pengembalian ditolak',
    'gudang follow up'
  ].map(label => label.toLowerCase())
)

const toStartOfDay = (date: Date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export const isStatusEligibleForFine = (status?: string | null) => {
  if (!status) return false
  const normalized = status.trim().toLowerCase()
  if (!normalized) return false
  if (OVERDUE_STATUS_TOKENS.has(normalized)) return true
  if (normalized.includes('dipinjam')) return true
  if (normalized.includes('pengembalian') && !normalized.includes('diterima') && !normalized.includes('selesai')) return true
  if (normalized.includes('follow') && normalized.includes('up')) return true
  return false
}

const coerceDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export const computeFineForLoan = (loan: LoanFineSource, now: Date = new Date()): FineComputationResult | null => {
  if (!loan || loan.isDraft) return null
  const status = getOverallStatus(loan as any)
  if (!isStatusEligibleForFine(status)) return null

  const returnStatusMeta = (loan as any)?.returnStatus || {}
  if (returnStatusMeta?.noFine) return null
  const finePaused = Boolean(returnStatusMeta?.finePaused)
  const finePauseDate = finePaused && returnStatusMeta?.processedAt ? new Date(returnStatusMeta.processedAt) : null
  const finePauseDay = finePauseDate && !Number.isNaN(finePauseDate.getTime()) ? toStartOfDay(finePauseDate) : null

  const effectiveReturn = getEffectiveReturnDate(loan as any)
  if (!effectiveReturn) return null

  const dueDate = coerceDate(effectiveReturn)
  if (!dueDate) return null

  const loanStillActive = isLoanActive(loan as any)
  if (!loanStillActive && !finePaused) return null

  const dueDay = toStartOfDay(dueDate)
  const todayDay = toStartOfDay(now)
  const referenceDay = finePauseDay && finePauseDay < todayDay ? finePauseDay : todayDay

  if (referenceDay <= dueDay) {
    return null
  }

  const diffDays = Math.floor((referenceDay.getTime() - dueDay.getTime()) / DAY_IN_MS)
  if (diffDays <= 0) {
    return null
  }

  return {
    fineAmount: diffDays * 100000,
    daysOverdue: diffDays,
    updatedAt: now.toISOString()
  }
}

export const needsFineUpdate = (loan: LoanFineSource, computed: FineComputationResult | null) => {
  if (!loan?.id || !computed) return false
  const existing = loan.totalDenda || null
  if (!existing) return true
  const sameDays = Number(existing.daysOverdue) === computed.daysOverdue
  const sameFine = Number(existing.fineAmount) === computed.fineAmount
  return !(sameDays && sameFine)
}

export const collectFineUpdates = (loans: LoanFineSource[], now: Date = new Date()) => {
  if (!Array.isArray(loans)) return []
  const seen = new Set<string>()
  return loans.reduce<Array<{ id: string; totalDenda: FineComputationResult }>>((acc, loan) => {
    if (!loan?.id) return acc
    if (seen.has(loan.id)) return acc
    seen.add(loan.id)

    const computed = computeFineForLoan(loan, now)
    if (!computed) return acc
    if (!needsFineUpdate(loan, computed)) return acc

    acc.push({ id: loan.id, totalDenda: computed })
    return acc
  }, [])
}

export const pushFineUpdates = async (loans: LoanFineSource[], now: Date = new Date()) => {
  const updates = collectFineUpdates(loans, now)
  if (!updates.length) return

  try {
    await apiFetch('/api/loans/fines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updates })
    })
  } catch (err) {
    console.warn('Failed to sync loan fines', err)
  }
}

export const pushFineUpdateForLoan = async (loan: LoanFineSource, now: Date = new Date()) => {
  if (!loan) return
  await pushFineUpdates([loan], now)
}
