import { getEffectiveReturnDate } from '../loanHelpers'
import { getAppBaseUrl } from '../getAppBaseUrl'
import type { ApprovalInfo, BorrowerEmailTemplateParams } from './shared'
import {
  buildBorrowerEmailHtml,
  calculateInclusiveDays,
  formatDateDisplay,
  formatDateRangeDisplay,
  formatDateTimeDisplay,
  getEntitasName,
  extractApprovedExtendDates,
  renderApprovedBlockHtml,
  removeApprovalCta,
} from './shared'

const NO_LOAN_HTML = `
      <div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB.</div>`

const NEED_DETAILS_VISIBLE_TYPES = new Set(['DEMO_PRODUCT', 'BARANG_BACKUP', 'LAINNYA'])

type BorrowerEmailCore = Omit<BorrowerEmailTemplateParams, 'headerHtml' | 'footerHtml' | 'heroBadgeLabel' | 'isUpdate'>
type BorrowerPayloadResult = {
  payload: BorrowerEmailCore
  defaultDurationLabel: string
}

type ApprovedEmailBuilderConfig = {
  loan: any
  isUpdate: boolean
  approvalInfo?: ApprovalInfo
  heroBadgeLabel?: string
  fallbackApproverName: string
  footerHtml?: string
}

const hasApprovalInfo = (info?: ApprovalInfo) => {
  if (!info) return false
  return Boolean(info.approverName || info.approvedAt || info.duration || info.note)
}

const deriveMarketingApprovalInfo = (loan: any): ApprovalInfo | undefined => {
  const companies = loan?.approvals?.companies
  if (!companies) return undefined
  const keys = Object.keys(companies)
  if (!keys.length) return undefined
  const preferred = keys.find(key => {
    const entry = companies[key]
    return entry && (entry.approved === true || entry.approvedAt)
  }) || keys[0]
  const entry = companies[preferred]
  if (!entry) return undefined
  return {
    approverName: entry.approvedBy || entry.approved_by || undefined,
    approvedAt: entry.approvedAt || entry.approved_at || undefined,
    note: entry.note || undefined,
  }
}

const formatDateValue = (value?: string | null): string => formatDateDisplay(value ?? null)

const pickDetailValue = (...values: Array<any>): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
    if (value !== undefined && value !== null) {
      const str = String(value).trim()
      if (str) return String(value)
    }
  }
  return '-'
}

const normalizeDurationLabel = (duration?: string | null, fallback?: string) => {
  if (duration && String(duration).trim()) return String(duration)
  return fallback || '-'
}

function buildBorrowerPayload(loan: any): BorrowerPayloadResult {
  const submittedAt = formatDateTimeDisplay(loan?.submittedAt)
  const borrowerName = pickDetailValue(loan?.borrowerName)
  const entitasName = loan?.entitasId ? getEntitasName(loan.entitasId) : '-'
  const borrowerPhone = pickDetailValue(loan?.borrowerPhone)
  const rawNeedType = String(loan?.needType || '').trim()
  const needType = rawNeedType || '-'
  const showNeedDetailsSection = NEED_DETAILS_VISIBLE_TYPES.has(rawNeedType.toUpperCase())
  const needDetails = loan?.needDetails || {}
  const customerName = pickDetailValue(needDetails?.customerName, needDetails?.namaCustomer)
  const companyName = pickDetailValue(needDetails?.companyName, needDetails?.namaPerusahaan)
  const address = pickDetailValue(needDetails?.address, needDetails?.alamat)
  const phone = pickDetailValue(needDetails?.phone, needDetails?.telepon)
  const marketingCompany = Array.isArray(loan?.company)
    ? loan.company.map((item: any) => String(item || '').trim()).filter(Boolean).join(', ') || '-'
    : '-'
  const outDate = formatDateValue(loan?.outDate)
  const useDate = formatDateValue(loan?.useDate)
  const effectiveReturn = getEffectiveReturnDate(loan)
  const returnDateSource = loan?.returnDate || loan?.endDate || effectiveReturn || null
  const returnDate = formatDateValue(returnDateSource)
  const productDetails = pickDetailValue(loan?.productDetailsText, loan?.productDetails)
  const pickupMethod = pickDetailValue(loan?.pickupMethod)
  const note = typeof loan?.note === 'string' && loan.note.trim() ? loan.note : '-'
  const formNumber = loan?.id || loan?.form_number || '-'
  const startDurationRaw = loan?.useDate || loan?.startDate || loan?.outDate || null
  const defaultDurationLabel = formatDateRangeDisplay(startDurationRaw, returnDateSource)
  const extendReturnDates = extractApprovedExtendDates(loan)

  return {
    defaultDurationLabel,
    payload: {
      submittedAt,
      formNumber,
      borrowerName,
      entitasName,
      borrowerPhone,
      needType,
      showNeedDetailsSection,
      customerName,
      companyName,
      address,
      phone,
      marketingCompany,
      outDate,
      useDate,
      returnDate,
      productDetails,
      pickupMethod,
      note,
      extendReturnDates,
    },
  }
}

function buildApprovedEmail(config: ApprovedEmailBuilderConfig) {
  if (!config.loan) return NO_LOAN_HTML
  const { payload, defaultDurationLabel } = buildBorrowerPayload(config.loan)
  const approvedBlock = renderApprovedBlockHtml({
    approverName: config.approvalInfo?.approverName || config.fallbackApproverName,
    approvedAt: config.approvalInfo?.approvedAt,
    duration: normalizeDurationLabel(config.approvalInfo?.duration, defaultDurationLabel),
    note: config.approvalInfo?.note,
  })

  return buildBorrowerEmailHtml({
    ...payload,
    isUpdate: config.isUpdate,
    headerHtml: approvedBlock,
    footerHtml: config.footerHtml,
    heroBadgeLabel: config.heroBadgeLabel,
  })
}

/**
 * Compute duration days between a textual date range formatted as `start → end`.
 */
const DURATION_SPLITTER = /\s*(?:→|->|—|–|s\/d|s\.d\.|sd|hingga|sampai|to)\s*/i

const getDurationRangeParts = (source?: string): { start?: string; end?: string } => {
  if (!source) return {}
  const segments = String(source)
    .split(DURATION_SPLITTER)
    .map(part => part.trim())
    .filter(Boolean)
  if (segments.length >= 2) {
    return { start: segments[0], end: segments[1] }
  }
  return {}
}

export function computeDurationDays(durationText?: string): number | undefined {
  const { start, end } = getDurationRangeParts(durationText)
  const days = calculateInclusiveDays(start, end)
  return days === null ? undefined : days ?? undefined
}

/**
 * Transform a marketing-style HTML into its "approved" variant (borrower/entitas/marketing copy).
 */
export function makeApprovedHtml(
  baseHtml: string,
  approver = 'Marketing Team',
  approvedAt?: string,
  duration = '',
  note?: string
): string {
  if (typeof baseHtml !== 'string') return baseHtml

  const at = formatDateTimeDisplay(approvedAt ?? Date.now())
  const durationDisplay = (() => {
    if (!duration) return '-'
    const { start, end } = getDurationRangeParts(duration)
    const formatted = start || end ? formatDateRangeDisplay(start, end) : duration
    const days = computeDurationDays(duration)
    return formatted + (days ? ` (${days} Hari)` : '')
  })()

  return baseHtml
    .replace('Permintaan Peminjaman', 'Status Peminjaman Disetujui')
    .replace('Permintaan Tinjau & Persetujuan', 'Persetujuan Peminjaman')
    .replace('Notifikasi Permintaan Peminjaman', 'Notifikasi Persetujuan Peminjaman')
    .replace('{{APPROVER_NAME}}', approver)
    .replace('{{APPROVED_AT}}', at)
    .replace('{{APPROVAL_DURATION}}', durationDisplay)
    .replace('{{APPROVAL_NOTE}}', note ?? '-')
}

export function stripApprovalCta(html: string): string {
  return removeApprovalCta(html)
}

export const generateApprovedBorrowerEmail = (loan: any, _extra: any[] = [], isUpdate = false, approvalInfo?: ApprovalInfo) => {
  return buildApprovedEmail({
    loan,
    isUpdate,
    approvalInfo,
    heroBadgeLabel: 'BRW',
    fallbackApproverName: 'Marketing Approver',
  })
}

export const generateApprovedCompanyEmail = (loan: any, _extra: any[] = [], isUpdate = false, approvalInfo?: ApprovalInfo) => {
  return buildApprovedEmail({
    loan,
    isUpdate,
    approvalInfo,
    heroBadgeLabel: 'ADM',
    fallbackApproverName: 'Marketing Approver',
  })
}

export const generateApprovedEntitasEmail = (loan: any, _extra: any[] = [], isUpdate = false, approvalInfo?: ApprovalInfo) => {
  const effectiveApproval = hasApprovalInfo(approvalInfo) ? approvalInfo : deriveMarketingApprovalInfo(loan)
  return buildApprovedEmail({
    loan,
    isUpdate,
    approvalInfo: effectiveApproval,
    heroBadgeLabel: 'PJM',
    fallbackApproverName: 'Marketing Approver',
  })
}

export const generateApprovedWarehouseEmail = (loan: any, _extra: any[] = [], isUpdate = false, approvalInfo?: ApprovalInfo) => {
  const showCta = approvalInfo?.showApprovalCta ?? true
  const formLabel = loan?.id || loan?.form_number || '-'
  const linkQuery = loan?.id ? `?id=${loan.id}` : ''
  const gudangLink = loan?.id
    ? `${getAppBaseUrl()}/peminjaman/${loan.id}?mode=warehouse`
    : `${getAppBaseUrl()}/peminjaman${linkQuery ? `${linkQuery}&mode=warehouse` : '?mode=warehouse'}`
  const footerHtml = showCta && loan
    ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;padding-top:18px;border-top:1px dashed rgba(16,40,67,0.06);margin-top:22px;">
            <tr>
              <td align="center">
                <table role="presentation" width="900" cellpadding="0" cellspacing="0" style="width:100%;max-width:900px;margin:0 auto;border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0;text-align:center;font-size:13px;color:#3a5568;opacity:0.95;vertical-align:middle;padding-right:12px;">Silakan buka halaman Gudang (Form #${formLabel}) untuk menindaklanjuti persetujuan ini:</td>
                    <td style="padding:10px 0;text-align:center;vertical-align:middle;">
                      <a href="${gudangLink}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                        <div style="display:inline-block;background:linear-gradient(135deg,#0d47a1,#002171);color:white;padding:10px 14px;border-radius:8px;font-weight:700;">Buka Gudang</div>
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
    `
    : undefined

  return buildApprovedEmail({
    loan,
    isUpdate,
    approvalInfo,
    heroBadgeLabel: 'GUD',
    fallbackApproverName: 'Warehouse Approver',
    footerHtml,
  })
}
