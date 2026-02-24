import { LoanData } from '../types/loanDetail'
import { CUSTOM_RETURN_STATUS, LOAN_LIFECYCLE, RETURN_STATUS_TOKENS, WAREHOUSE_STATUS } from '../types/loanStatus'
import { getNeedTypeLabel } from './needTypes'
import { getPickupMethodLabel as _getPickupMethodLabel } from './pickupMethods'

export const getLoanStatus = (loan: LoanData) => {
  // If explicit DB column loanStatus exists, prefer that value (map common variants)
  if (loan.loanStatus && typeof loan.loanStatus === 'string' && loan.loanStatus.trim() !== '') {
    const s = loan.loanStatus.trim().toUpperCase()
    switch (s) {
      case 'PENDING':
      case 'PENDING_APPROVAL':
      case 'MENUNGGU':
      case 'MENUNGGU_APPROVAL':
        return LOAN_LIFECYCLE.PENDING_APPROVAL
      case 'DRAFT':
        return LOAN_LIFECYCLE.DRAFT
      case 'APPROVED':
      case 'DISETUJUI':
        return LOAN_LIFECYCLE.APPROVED
      case 'REJECTED':
      case 'DITOLAK':
        return LOAN_LIFECYCLE.REJECTED
      case 'BORROWED':
      case 'DIPINJAM':
        // loan.loanStatus contains a warehouse state -> map to warehouse constant
        return WAREHOUSE_STATUS.BORROWED
      case 'RETURNREQUESTED':
      case 'RETURN_REQUESTED':
      case 'RETURN REQUESTED':
      case 'PENGEMBALIAN_DIMINTA':
      case 'PERMINTAAN_PENGEMBALIAN':
        // canonicalize borrower-initiated return request as a readable label
        return 'Permintaan Pengembalian'
      case 'RETURNED':
      case 'DIKEMBALIKAN':
        return WAREHOUSE_STATUS.RETURNED
      case 'RETURN_FOLLOWUP':
      case 'RETURN FOLLOWUP':
      case 'RETURN-FOLLOWUP':
      case 'PERLU TINDAK LANJUT':
        return CUSTOM_RETURN_STATUS.FOLLOW_UP
      default:
        // unknown value: return it directly so UI can surface it
        return loan.loanStatus
    }
  }
  // For detail page, always show marketing approval status, not warehouse status
  if (loan.isDraft) return LOAN_LIFECYCLE.DRAFT

  if (!loan.approvals?.companies) return LOAN_LIFECYCLE.PENDING_APPROVAL

  const companies = Object.keys(loan.approvals.companies)
  if (companies.length === 0) return LOAN_LIFECYCLE.PENDING_APPROVAL

  const allApproved = companies.every(company => loan.approvals!.companies[company].approved === true)
  const anyRejected = companies.some(company => loan.approvals!.companies[company].approved === false && loan.approvals!.companies[company].rejectionReason)

  if (anyRejected) return LOAN_LIFECYCLE.REJECTED
  if (allApproved) return LOAN_LIFECYCLE.APPROVED
  return LOAN_LIFECYCLE.PENDING_APPROVAL
}

export const getStatusClass = (loan: LoanData) => {
  const status = getLoanStatus(loan)
  switch (status) {
    case LOAN_LIFECYCLE.DRAFT: return 'status-draft'
    case LOAN_LIFECYCLE.APPROVED: return 'status-approved'
    case LOAN_LIFECYCLE.REJECTED: return 'status-rejected'
    default: return 'status-pending'
  }
}

export const getOverallStatus = (loan: LoanData) => {
  // Prefer explicit DB loanStatus when present, otherwise fall back to warehouse status or derived marketing status
  if (loan.loanStatus && typeof loan.loanStatus === 'string' && loan.loanStatus.trim() !== '') {
    // return canonical mapped value (e.g. LOAN_LIFECYCLE.APPROVED) where possible
    return getLoanStatus(loan)
  }

  // If there is an active return in progress, prefer showing a borrower-return label so
  // dashboards don't continue to show 'Dipinjam' while a return request is pending.
  try {
    const rs = String(loan.returnStatus?.status || '').toLowerCase()
    if (rs.includes(RETURN_STATUS_TOKENS.FOLLOW_UP)) {
      return CUSTOM_RETURN_STATUS.FOLLOW_UP
    }
    if (rs.includes('returnrequest') || rs.includes('pengembalian') || rs.includes('permintaan')) {
      return 'Permintaan Pengembalian'
    }
  } catch (e) {}

  // If borrower-submitted returnRequest entries exist and are in an active state, show the pending return label
  try {
    const reqs = Array.isArray((loan as any).returnRequest) ? (loan as any).returnRequest : []
    if (reqs.some((r: any) => String(r?.status || '').toLowerCase().includes(RETURN_STATUS_TOKENS.FOLLOW_UP))) {
      return CUSTOM_RETURN_STATUS.FOLLOW_UP
    }
    if (reqs.some((r: any) => {
      const s = String(r?.status || '').toLowerCase()
      return ['submitted', 'returnrequested', 'pending', 'approved'].includes(s)
    })) {
      return 'Permintaan Pengembalian'
    }
  } catch (e) {}

  if (loan.warehouseStatus) {
    return loan.warehouseStatus.status
  }

  return getLoanStatus(loan)
}

export const getOverallStatusClass = (loan: LoanData) => {
  const status = getOverallStatus(loan)
  switch (status) {
    case LOAN_LIFECYCLE.DRAFT: return 'status-draft'
    case LOAN_LIFECYCLE.APPROVED: return 'status-approved'
    case LOAN_LIFECYCLE.REJECTED: return 'status-rejected'
    case WAREHOUSE_STATUS.BORROWED: return 'status-borrowed'
    case WAREHOUSE_STATUS.REJECTED: return 'status-rejected'
    case WAREHOUSE_STATUS.RETURNED: return 'status-returned'
    case WAREHOUSE_STATUS.PENDING: return 'status-pending'
    case 'Permintaan Pengembalian': return 'status-pending'
    case CUSTOM_RETURN_STATUS.FOLLOW_UP: return 'status-pending'
    default: return 'status-pending'
  }
}

export const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Keep a helper for full datetime formatting when time is required (e.g., emails)
export const formatDateTime = (dateStr: string | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Returns the effective return date for a loan — prefer the last approved extension's requestedReturnDate
 * when present, otherwise fall back to `loan.returnDate`, then `loan.useDate` or `loan.submittedAt`.
 */
export const getEffectiveReturnDate = (loan: any): string | null => {
  try {
    const extendAll: any = loan?.extendStatus
    const entries = Array.isArray(extendAll) ? extendAll : (extendAll ? [extendAll] : [])
    const approvedEntries = entries.filter((e: any) => String(e?.approveStatus || '').toLowerCase().includes('setujui'))
    const lastApproved = approvedEntries.length > 0 ? approvedEntries[approvedEntries.length - 1] : null
    if (lastApproved?.requestedReturnDate) return String(lastApproved.requestedReturnDate)
  } catch (err) {
    // ignore malformed extendStatus
  }
  return loan?.returnDate || loan?.useDate || loan?.submittedAt || null
}

/**
 * Compute a human-friendly duration info between two ISO date strings.
 * Returns null if either date is missing or invalid. The calculation normalizes both
 * dates to local-midnight so the result counts full calendar days and uses an inclusive count.
 */
export const getDurationInfo = (start?: string | null, end?: string | null) => {
  if (!start || !end) return null
  const s = new Date(start)
  const e = new Date(end)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null
  const msPerDay = 1000 * 60 * 60 * 24
  const startMid = new Date(s.getFullYear(), s.getMonth(), s.getDate())
  const endMid = new Date(e.getFullYear(), e.getMonth(), e.getDate())
  const diffDays = Math.floor((endMid.getTime() - startMid.getTime()) / msPerDay)
  const days = diffDays >= 0 ? diffDays + 1 : Math.abs(diffDays) + 1
  const startLabel = formatDate(start).split(',')[0]
  const endLabel = formatDate(end).split(',')[0]
  return { label: `${days} hari`, range: `${startLabel} — ${endLabel}`, days, start: start, end: end }
}

// centralized getNeedTypeLabel is provided by utils/needTypes.ts

// Re-export centralized pickup method label helper for backwards compat
export const getPickupMethodLabel = _getPickupMethodLabel