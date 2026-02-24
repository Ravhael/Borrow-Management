import { LoanData } from '../types/loan'
import { getNeedTypeLabel } from './needTypes'
import { CUSTOM_RETURN_STATUS, LOAN_LIFECYCLE, RETURN_STATUS_TOKENS, WAREHOUSE_STATUS } from '../types/loanStatus'

const normalizeStatus = (value?: string | null) => (value ? String(value).trim().toLowerCase() : '')

const includesReturnRejection = (value?: string | null) => {
  const normalized = normalizeStatus(value)
  if (!normalized) return false
  if (normalized.includes('return_rejected') || normalized.includes('returnrejected') || normalized.includes('return rejected')) {
    return true
  }
  const mentionsReturn = normalized.includes('return') || normalized.includes('pengembalian')
  const mentionsReject = normalized.includes('reject') || normalized.includes('tolak')
  return mentionsReturn && mentionsReject
}

const includesReturnCompletion = (value?: string | null) => {
  const normalized = normalizeStatus(value)
  if (!normalized) return false
  return (
    normalized.includes('completed') ||
    normalized.includes('complete') ||
    normalized.includes('dikembali') ||
    normalized.includes('returned') ||
    normalized.includes('selesai')
  )
}

const includesReturnPending = (value?: string | null) => {
  const normalized = normalizeStatus(value)
  if (!normalized) return false
  return (
    normalized.includes('returnrequest') ||
    normalized.includes('return_requested') ||
    normalized.includes('returnrequested') ||
    normalized.includes('submitted') ||
    normalized.includes('pending') ||
    normalized.includes('permintaan') ||
    normalized.includes('approved')
  )
}

const includesReturnAccepted = (value?: string | null) => {
  const normalized = normalizeStatus(value)
  if (!normalized) return false
  if (
    normalized.includes('returnaccepted') ||
    normalized.includes('return accepted') ||
    normalized.includes('return_accepted')
  ) {
    return true
  }
  if (normalized.includes('dikembalikan') && normalized.includes('tidak') && normalized.includes('lengkap')) {
    return true
  }
  if (normalized.includes('diterima') && normalized.includes('gudang')) {
    return true
  }
  return false
}

const deriveReturnStatusOverride = (loan: LoanData): string | null => {
  try {
    const rs = normalizeStatus((loan as any).returnStatus?.status)
    if (rs) {
      if (rs.includes(RETURN_STATUS_TOKENS.FOLLOW_UP) || rs.includes('followup') || rs.includes('follow-up')) return CUSTOM_RETURN_STATUS.FOLLOW_UP
      if (includesReturnCompletion(rs)) return WAREHOUSE_STATUS.RETURNED
      if (includesReturnAccepted(rs)) return 'Dikembalikan Tidak Lengkap'
      if (includesReturnRejection(rs)) return 'Pengembalian Ditolak'
      if (includesReturnPending(rs) || rs.includes('pengembalian')) return 'Permintaan Pengembalian'
    }
  } catch (e) {}

  try {
    const reqs = Array.isArray((loan as any).returnRequest) ? (loan as any).returnRequest : []
    if (reqs.length) {
      const entries = reqs.filter((r: any) => r && r.status)
      const latest = entries[entries.length - 1]
      const latestStatus = normalizeStatus(latest?.status)
      if (latestStatus) {
        if (latestStatus.includes(RETURN_STATUS_TOKENS.FOLLOW_UP) || latestStatus.includes('followup') || latestStatus.includes('follow-up')) return CUSTOM_RETURN_STATUS.FOLLOW_UP
        if (includesReturnCompletion(latestStatus)) return WAREHOUSE_STATUS.RETURNED
        if (includesReturnAccepted(latestStatus)) return 'Dikembalikan Tidak Lengkap'
        if (includesReturnRejection(latestStatus)) return 'Pengembalian Ditolak'
        if (includesReturnPending(latestStatus) || latestStatus.includes('pengembalian')) return 'Permintaan Pengembalian'
      }

      const anyCompletion = entries.some((r: any) => includesReturnCompletion(r?.status))
      if (anyCompletion) return WAREHOUSE_STATUS.RETURNED

      const anyFollowUp = entries.some((r: any) => {
        const s = normalizeStatus(r?.status)
        return s.includes(RETURN_STATUS_TOKENS.FOLLOW_UP) || s.includes('followup') || s.includes('follow-up')
      })
      if (anyFollowUp) return CUSTOM_RETURN_STATUS.FOLLOW_UP

      const anyAccepted = entries.some((r: any) => includesReturnAccepted(r?.status))
      if (anyAccepted) return 'Dikembalikan Tidak Lengkap'

      const anyRejected = entries.some((r: any) => includesReturnRejection(r?.status))
      if (anyRejected) return 'Pengembalian Ditolak'

      const anyPending = entries.some((r: any) => includesReturnPending(r?.status))
      if (anyPending) return 'Permintaan Pengembalian'
    }
  } catch (e) {}

  return null
}

export const getLoanStatus = (loan: LoanData) => {
  const returnOverride = deriveReturnStatusOverride(loan)
  if (returnOverride) return returnOverride

  // If an explicit loanStatus value exists on the row (DB column), prefer it.
  // Map common English or alternate strings into the canonical LOAN_LIFECYCLE values
  if (loan.loanStatus && typeof loan.loanStatus === 'string' && loan.loanStatus.trim() !== '') {
    const raw = loan.loanStatus.trim()
    const s = raw.toUpperCase()
    switch (s) {
      case 'APPROVED':
      case 'DISETUJUI':
        return LOAN_LIFECYCLE.APPROVED
      case 'REJECTED':
      case 'DITOLAK':
        return LOAN_LIFECYCLE.REJECTED
      case 'DRAFT':
        return LOAN_LIFECYCLE.DRAFT
        case 'BORROWED':
        case 'DIPINJAM':
          return WAREHOUSE_STATUS.BORROWED
        case 'RETURNED':
        case 'DIKEMBALIKAN':
          return WAREHOUSE_STATUS.RETURNED
        case 'RETURNREQUESTED':
        case 'RETURN_REQUESTED':
        case 'PENGEMBALIAN_DIMINTA':
        case 'PERMINTAAN_PENGEMBALIAN':
          // Friendly display for a borrower-initiated return request stored on loanStatus
          return 'Permintaan Pengembalian'
        case 'RETURN_REJECTED':
        case 'RETURNREJECTED':
        case 'REQUEST_REJECTED':
        case 'RETURN REJECTED':
          return 'Pengembalian Ditolak'
        case 'RETURNACCEPTED':
        case 'RETURN ACCEPTED':
        case 'RETURN_ACCEPTED':
          return 'Dikembalikan Tidak Lengkap'
        case 'RETURN_FOLLOWUP':
        case 'RETURN FOLLOWUP':
        case 'RETURN-FOLLOWUP':
        case 'PERLU TINDAK LANJUT':
          return CUSTOM_RETURN_STATUS.FOLLOW_UP
      case 'PENDING':
      case 'PENDING_APPROVAL':
      case 'MENUNGGU':
      case 'MENUNGGU_APPROVAL':
        return LOAN_LIFECYCLE.PENDING_APPROVAL
      default:
        // Unknown custom values: return original string so UI can show it
        return raw
    }
  }
  // If warehouse has processed the loan, use warehouse status
  if (loan.warehouseStatus) {
    const ws = String(loan.warehouseStatus.status || '').toLowerCase()
    if (includesReturnRejection(ws)) return 'Pengembalian Ditolak'
    if (ws.includes('returnrequested') || ws.includes('return_requested') || ws.includes('submitted')) {
      return 'Permintaan Pengembalian'
    }
    return loan.warehouseStatus.status
  }

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

export const getStatusColor = (loan: LoanData): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  const status = getLoanStatus(loan)
  switch (status) {
    case LOAN_LIFECYCLE.DRAFT: return 'default'
    case LOAN_LIFECYCLE.APPROVED: return 'success'
    case LOAN_LIFECYCLE.REJECTED: return 'error'
    case WAREHOUSE_STATUS.BORROWED: return 'info'
    case WAREHOUSE_STATUS.RETURNED: return 'success'
    case WAREHOUSE_STATUS.REJECTED: return 'error'
    case CUSTOM_RETURN_STATUS.FOLLOW_UP: return 'warning'
    case CUSTOM_RETURN_STATUS.FOLLOW_UP: return 'warning'
    case 'Dikembalikan Tidak Lengkap': return 'success'
    // Show an informational color for return-requested / custom statuses containing 'pengembalian' or 'returnrequested'
    default:
      try {
        const text = String(status || '').toLowerCase()
        // Show a green "success" chip for return-related statuses to make them more visible
        // on the /peminjaman listing (treat return requests as positive/acknowledged state)
        if (text.includes(RETURN_STATUS_TOKENS.FOLLOW_UP) || text.includes('followup') || text.includes('follow-up') || text.includes(CUSTOM_RETURN_STATUS.FOLLOW_UP.toLowerCase())) return 'warning'
        if (includesReturnRejection(status as string)) return 'error'
        if (text.includes('whrejected') || text.includes('wh rejected')) return 'error'
        if (
          text.includes('returnaccepted') ||
          text.includes('return accepted') ||
          text.includes('return_accepted') ||
          text.includes('dikembalikan tidak lengkap')
        ) {
          return 'success'
        }
        if (text.includes('pengembalian') || text.includes('returnrequested') || text.includes('return_requested')) return 'info'
        if (text.includes('reject')) return 'error'
        // Treat explicit 'completed' / 'complete' / 'selesai' values as success (green)
        if (text.includes('complete') || text.includes('completed') || text.includes('selesai')) return 'success'
      } catch (e) {}
      return 'warning'
  }
}

export const getStatusIcon = (status: string) => {
  switch (status) {
    case LOAN_LIFECYCLE.DRAFT: return 'Edit'
    case LOAN_LIFECYCLE.APPROVED: return 'CheckCircle'
    case LOAN_LIFECYCLE.REJECTED: return 'Cancel'
    case WAREHOUSE_STATUS.BORROWED: return 'Inventory'
    case WAREHOUSE_STATUS.RETURNED: return 'Assignment'
    case 'Permintaan Pengembalian': return 'Pending'
    case 'Dikembalikan Tidak Lengkap': return 'Assignment'
    case 'Pengembalian Ditolak': return 'Cancel'
    default: return 'Pending'
  }
}

const marketingStatusOverrides: Record<string, string> = {
  [LOAN_LIFECYCLE.APPROVED.toLowerCase()]: 'Disetujui Marketing',
  [LOAN_LIFECYCLE.REJECTED.toLowerCase()]: 'Ditolak Marketing',
  ['returnaccepted']: 'Dikembalikan Tidak Lengkap',
  ['return accepted']: 'Dikembalikan Tidak Lengkap',
  ['return_accepted']: 'Dikembalikan Tidak Lengkap'
}

export const formatLifecycleStatusLabel = (value?: string | null): string => {
  if (value === null || typeof value === 'undefined') return ''
  const trimmed = String(value).trim()
  if (!trimmed) return ''
  const normalized = trimmed.toLowerCase()
  return marketingStatusOverrides[normalized] || trimmed
}

// getNeedTypeLabel provided by utils/needTypes.ts

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const calculateMetrics = (loans: LoanData[]) => {
  return {
    total: loans.length,
    draft: loans.filter(loan => getLoanStatus(loan) === LOAN_LIFECYCLE.DRAFT).length,
    pending: loans.filter(loan => getLoanStatus(loan) === LOAN_LIFECYCLE.PENDING_APPROVAL).length,
    approved: loans.filter(loan => getLoanStatus(loan) === LOAN_LIFECYCLE.APPROVED).length,
    rejected: loans.filter(loan => {
      const s = String(getLoanStatus(loan) || '').toLowerCase()
      // Exclude return-related rejections (e.g. 'return_rejected', 'pengembalian', 'pengembalian ditolak')
      if (includesReturnRejection(s) || s.includes('pengembalian')) return false

      // Use the formatted lifecycle label for detecting marketing rejects (formatLifecycleStatusLabel maps 'Ditolak' -> 'Ditolak Marketing')
      const formattedLabel = formatLifecycleStatusLabel(String(getLoanStatus(loan) || '')).toLowerCase()
      const rawWarehouseStatus = String((loan as any).warehouseStatus?.status || '').toLowerCase()
      const isMarketingReject = formattedLabel.includes('ditolak marketing') || (formattedLabel.includes('ditolak') && formattedLabel.includes('marketing'))

      // Warehouse/WH reject: look for warehouse tokens or explicit warehouse rejected status
      const isWarehouseReject = rawWarehouseStatus.includes('reject') || rawWarehouseStatus.includes('wh') || rawWarehouseStatus.includes('ditolak gudang') || rawWarehouseStatus.includes('whrejected') || s === WAREHOUSE_STATUS.REJECTED.toLowerCase()

      return Boolean(isMarketingReject || isWarehouseReject)
    }).length,
    // Count loans that are waiting for approval: either pending approval lifecycle or marketing-approved (Disetujui Marketing)
    waiting: loans.filter(loan => {
      const status = getLoanStatus(loan)
      const s = String(status || '').toLowerCase()
      const formatted = formatLifecycleStatusLabel(String(status || '')).toLowerCase()
      if (s === LOAN_LIFECYCLE.PENDING_APPROVAL.toLowerCase()) return true
      if (formatted.includes('disetujui marketing')) return true
      return false
    }).length,
    borrowed: loans.filter(loan => getLoanStatus(loan) === WAREHOUSE_STATUS.BORROWED).length,
    returned: loans.filter(loan => getLoanStatus(loan) === WAREHOUSE_STATUS.RETURNED).length,
  }
}