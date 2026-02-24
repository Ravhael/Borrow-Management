import { ActiveLoanInfo, ActiveLoanSummary } from '../types/dashboard'
import {
  LOAN_LIFECYCLE,
  WAREHOUSE_STATUS,
  RETURN_STATUS_TOKENS,
  CUSTOM_RETURN_STATUS
} from '../types/loanStatus'
import { getEffectiveReturnDate } from './loanHelpers'
import { entitasOptions } from '../data/entitas'

type LoanShape = {
  id?: string | number
  borrowerName?: string
  borrowerFullName?: string
  company?: string | string[] | null
  needType?: string | null
  returnDate?: string | null
  useDate?: string | null
  outDate?: string | null
  submittedAt?: string | null
  status?: string | null
  loanStatus?: string | null
  warehouseStatus?: {
    status?: string | null
  } | null
  returnStatus?: {
    status?: string | null
  } | null
  extendStatus?: any
}

const INACTIVE_WAREHOUSE_STATUSES = new Set([
  String(WAREHOUSE_STATUS.RETURNED).toLowerCase(),
  String(WAREHOUSE_STATUS.REJECTED).toLowerCase()
])

const INACTIVE_LIFECYCLE_STATUSES = new Set([
  'ditolak',
  'rejected',
  'dibatalkan',
  'cancelled',
  'draft'
])

const normalize = (value?: string | null) => (value ? String(value).trim().toLowerCase() : '')

const includesFollowUpToken = (value?: string | null) => {
  const normalized = normalize(value)
  if (!normalized) return false
  return (
    normalized.includes(RETURN_STATUS_TOKENS.FOLLOW_UP) ||
    normalized.includes('followup') ||
    normalized.includes('follow-up') ||
    normalized.includes(CUSTOM_RETURN_STATUS.FOLLOW_UP.toLowerCase())
  )
}

const createStatusLookup = (values: string[]) => {
  const lookup = new Map<string, string>()
  values.forEach((value) => lookup.set(normalize(value), value))
  return lookup
}

const toTitleCase = (value: string) =>
  value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

const WAREHOUSE_STATUS_LOOKUP = createStatusLookup(Object.values(WAREHOUSE_STATUS))
const LIFECYCLE_STATUS_LOOKUP = createStatusLookup(Object.values(LOAN_LIFECYCLE))

const WAREHOUSE_STATUS_FALLBACKS = new Map<string, string>([
  ['pending', WAREHOUSE_STATUS.PENDING],
  ['waiting', WAREHOUSE_STATUS.PENDING],
  ['processed', WAREHOUSE_STATUS.PROCESSED],
  ['borrowed', WAREHOUSE_STATUS.BORROWED],
  ['returned', WAREHOUSE_STATUS.RETURNED],
  ['rejected', WAREHOUSE_STATUS.REJECTED]
])

const LIFECYCLE_STATUS_FALLBACKS = new Map<string, string>([
  ['draft', LOAN_LIFECYCLE.DRAFT],
  ['pending', LOAN_LIFECYCLE.PENDING_APPROVAL],
  ['pending approval', LOAN_LIFECYCLE.PENDING_APPROVAL],
  ['approved', LOAN_LIFECYCLE.APPROVED],
  ['partially approved', LOAN_LIFECYCLE.PARTIALLY_APPROVED],
  ['rejected', LOAN_LIFECYCLE.REJECTED],
  ['cancelled', LOAN_LIFECYCLE.CANCELLED],
  ['canceled', LOAN_LIFECYCLE.CANCELLED]
])

const resolveLabelFromLookup = (
  rawValue: string | null | undefined,
  lookup: Map<string, string>,
  fallbacks: Map<string, string>
) => {
  if (!rawValue) return null
  const normalized = normalize(rawValue)
  if (!normalized) return null
  return lookup.get(normalized) || fallbacks.get(normalized) || toTitleCase(rawValue)
}

const getLoanStatusInfo = (loan: LoanShape): ActiveLoanInfo['status'] => {
  // If a borrower-initiated return is in progress prefer showing that over the raw warehouse label
  try {
    const rs = String(loan?.loanStatus || loan?.status || '').toLowerCase()
    const returnStatus = String(((loan as any)?.returnStatus)?.status || '').toLowerCase()
    const requestArray: string[] = Array.isArray((loan as any).returnRequest) ? ((loan as any).returnRequest as any[]).map((r:any) => String(r?.status || '').toLowerCase()) : []

    const hasFollowUpFlag =
      includesFollowUpToken(loan?.loanStatus) ||
      includesFollowUpToken(loan?.status) ||
      includesFollowUpToken(((loan as any)?.returnStatus)?.status) ||
      requestArray.some((entry) => includesFollowUpToken(entry))

    if (hasFollowUpFlag) {
      return { label: CUSTOM_RETURN_STATUS.FOLLOW_UP, source: 'warehouse' }
    }

    // If any entry indicates a completed return, prefer showing that explicitly
    if (returnStatus.includes('completed') || requestArray.some(s => s.includes('completed') || s.includes('dikembalikan') || s.includes('selesai'))) {
      return { label: 'completed', source: 'lifecycle' }
    }

    // If warehouse accepted the return request
    if (returnStatus.includes('returnaccepted') || requestArray.some(s => s.includes('returnaccepted') || s.includes('accept'))) {
      return { label: 'returnAccepted', source: 'lifecycle' }
    }

    // If a return was explicitly rejected
    if (returnStatus.includes('return_rejected') || requestArray.some(s => s.includes('return_rejected') || s.includes('reject') || s.includes('tolak'))) {
      return { label: 'Pengembalian Ditolak', source: 'warehouse' }
    }

    // Older/borrower-submitted states or in-progress return requested
    const hasOpenRequest =
      rs.includes('returnrequest') ||
      rs.includes('submitted') ||
      returnStatus.includes('returnrequest') ||
      requestArray.some((s) => ['submitted', 'returnrequested', 'pending', 'approved'].some((k) => s.includes(k)))
    if (hasOpenRequest) {
      return { label: 'Permintaan Pengembalian', source: 'lifecycle' }
    }
  } catch (e) {}

  const warehouseLabel = resolveLabelFromLookup(
    loan?.warehouseStatus?.status || null,
    WAREHOUSE_STATUS_LOOKUP,
    WAREHOUSE_STATUS_FALLBACKS
  )
  if (warehouseLabel) {
    return { label: warehouseLabel, source: 'warehouse' }
  }

  const lifecycleLabel = resolveLabelFromLookup(
    loan?.status || loan?.loanStatus || null,
    LIFECYCLE_STATUS_LOOKUP,
    LIFECYCLE_STATUS_FALLBACKS
  )
  if (lifecycleLabel) {
    return { label: lifecycleLabel, source: 'lifecycle' }
  }

  return null
}

export const isLoanActive = (loan: LoanShape) => {
  // If the loan has an explicit completed return or completed top-level status, treat as inactive
  try {
    const top = normalize(loan?.loanStatus || loan?.status || '')
    const rs = normalize((loan as any)?.returnStatus?.status)
    if (top.includes('complete') || top.includes('selesai')) return false
    if (rs.includes('complete') || rs.includes('selesai') || rs.includes('completed')) return false
    const reqs = Array.isArray((loan as any).returnRequest) ? ((loan as any).returnRequest as any[]).map(r => normalize(String(r?.status || ''))) : []
    if (reqs.some(s => s.includes('complete') || s.includes('completed') || s.includes('selesai'))) return false
  } catch (e) {}

  const warehouseStatus = normalize(loan?.warehouseStatus?.status)
  if (warehouseStatus) {
    return !INACTIVE_WAREHOUSE_STATUSES.has(warehouseStatus)
  }

  const lifecycle = normalize(loan?.status || loan?.loanStatus)
  if (!lifecycle) return true
  return !INACTIVE_LIFECYCLE_STATUSES.has(lifecycle)
}

// getEffectiveReturnDate now lives in utils/loanHelpers and handles extension-aware return date selection

const parseDateValue = (value?: string | null) => {
  if (!value) return Number.NaN
  const direct = Date.parse(value)
  if (!Number.isNaN(direct)) return direct
  const fallback = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (fallback) {
    const day = Number(fallback[1])
    const month = Number(fallback[2])
    let year = Number(fallback[3])
    if (year < 100) year += 2000
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      const ts = Date.UTC(year, Math.max(0, month - 1), day)
      if (!Number.isNaN(ts)) return ts
    }
  }
  return Number.NaN
}

const parseLoanIdTimestamp = (loanId?: string | number | null) => {
  if (!loanId) return 0
  const asString = String(loanId)
  const match = asString.match(/(\d{4})(\d{2})(\d{2})/)
  if (!match) return 0
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const base = Date.UTC(year, Math.max(0, month - 1), day)
  const suffix = asString.match(/-(\d+)/)
  const suffixValue = suffix ? Number(suffix[1]) : 0
  return (Number.isNaN(base) ? 0 : base) + (Number.isNaN(suffixValue) ? 0 : suffixValue)
}

const getSubmissionTimestamp = (loan: LoanShape) => {
  const candidates = [
    loan.submittedAt,
    (loan as any)?.createdAt,
    (loan as any)?.updatedAt,
    loan.useDate,
    loan.outDate,
    loan.returnDate
  ]
  for (const value of candidates) {
    const parsed = parseDateValue(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return parseLoanIdTimestamp(loan.id)
}

const formatCompany = (company: LoanShape['company']) => {
  if (Array.isArray(company)) return company.join(', ')
  return company || null
}

const resolveEntitasLabelFromId = (entitasId?: string | number | null): string | null => {
  if (!entitasId) return null
  const asStr = String(entitasId)
  const direct = entitasOptions.find((e) => String(e.id) === asStr || String(e.value) === asStr)
  if (direct) return direct.label
  return null
}

const buildLoanSummary = (loan: LoanShape): ActiveLoanSummary => ({
  loanId: loan.id ? String(loan.id) : null,
  borrower: loan.borrowerName || loan.borrowerFullName || null,
  company: formatCompany(loan.company),
  entitasId: (loan as any).entitasId || null,
  entitasLabel:
    (loan as any).entitasName || (loan as any).entitasLabel || resolveEntitasLabelFromId((loan as any).entitasId) || null,
  // prefer effective return date (approved extension) when present
  returnDate: getEffectiveReturnDate(loan) || null,
  needType: loan.needType || null,
  status: getLoanStatusInfo(loan),
  loanStatus: loan.loanStatus || loan.status || null,
  warehouseStatus: loan.warehouseStatus || null,
  returnStatus: (loan as any).returnStatus || null,
  extendStatus: (loan as any).extendStatus || null
})

export const buildActiveLoanInfo = (loans: LoanShape[] | unknown): ActiveLoanInfo => {
  if (!Array.isArray(loans) || loans.length === 0) {
    return { totalActive: 0 }
  }

  const activeLoans = loans.filter(isLoanActive)
  if (!activeLoans.length) {
    return { totalActive: 0 }
  }

  const sortedActive = [...activeLoans].sort((a, b) => getSubmissionTimestamp(b) - getSubmissionTimestamp(a))
  const loanSummaries = sortedActive.map(buildLoanSummary)
  const nextLoan = loanSummaries[0]

  return {
    totalActive: activeLoans.length,
    nextBorrower: nextLoan?.borrower || null,
    nextCompany: nextLoan?.company || null,
    nextReturnDate: nextLoan?.returnDate || null,
    needType: nextLoan?.needType || null,
    loanId: nextLoan?.loanId || null,
    status: nextLoan?.status || null,
    topLoans: loanSummaries
  }
}
