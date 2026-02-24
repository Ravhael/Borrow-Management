import { getEffectiveReturnDate } from '../loanHelpers'
import { getAppBaseUrl } from '../getAppBaseUrl'
import type { BorrowerEmailTemplateParams, ApprovalInfo } from './shared'
import {
  buildBorrowerEmailHtml,
  escapeHtml,
  formatDateDisplay,
  formatDateTimeDisplay,
  formatDateRangeDisplay,
  calculateInclusiveDays,
  getEntitasName,
  removeApprovalCta,
} from './shared'

const NO_LOAN_HTML = `
  <div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB.</div>`

const NEED_DETAILS_VISIBLE_TYPES = new Set(['DEMO_PRODUCT', 'BARANG_BACKUP', 'LAINNYA'])

type BorrowerEmailCore = Omit<BorrowerEmailTemplateParams, 'headerHtml' | 'footerHtml' | 'heroBadgeLabel'>

type WarehouseEmailConfig = {
  loan: any
  approvalInfo?: ApprovalInfo
  isUpdate: boolean
  fallbackApproverName?: string
  footerHtml?: string
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

function buildBorrowerPayload(loan: any): { payload: BorrowerEmailCore } {
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

  return {
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
    },
  }
}

function renderWarehouseBlock(info?: ApprovalInfo): string {
  const at = formatDateTimeDisplay(info?.approvedAt ?? Date.now())
  // compute a friendly duration label and include total days when possible
  const DURATION_SPLITTER = /\s*(?:→|->|—|–|s\/d|s\.d\.|sd|hingga|sampai|to)\s*/i
  const getDurationRangeParts = (source?: string) => {
    if (!source) return {}
    const segments = String(source).split(DURATION_SPLITTER).map(s => s.trim()).filter(Boolean)
    if (segments.length >= 2) return { start: segments[0], end: segments[1] }
    return {}
  }
  const { start, end } = getDurationRangeParts(info?.duration)
  const formattedRange = start || end ? formatDateRangeDisplay(start, end) : info?.duration ?? ''
  const totalDays = calculateInclusiveDays(start, end)
  const durationWithTotal = (formattedRange || '-') + (totalDays ? ` (${totalDays} Hari)` : '')
  

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:linear-gradient(90deg,#e8f9ee,#f4fff8);border-radius:10px;border:1px solid rgba(33,150,83,0.12);padding:12px;margin-bottom:18px;color:#07341f;font-family:Inter, Arial, sans-serif;">
      <tr>
        <td width="60" style="padding:8px;vertical-align:top;">
          <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#43a047,#66bb6a);display:inline-block;line-height:44px;text-align:center;color:white;font-weight:800;font-size:18px;">✓</div>
        </td>
        <td style="padding:8px 8px 8px 4px;vertical-align:top;">
          <div style="font-weight:800;font-size:16px;color:#0b3f2b;margin-bottom:8px;">Peminjaman Telah di Proses</div>
          <div style="font-size:12px;color:#0b3f2b;opacity:0.85;margin-bottom:8px;">Notifikasi ini menunjukkan permintaan peminjaman telah diproses oleh gudang.</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;color:#153d2a;">
            <tr>
              <td style="width:160px;padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Diproses oleh</td>
              <td style="padding:6px 8px;">${escapeHtml(info?.approverName ?? '-')}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Pada Tanggal & Waktu</td>
              <td style="padding:6px 8px;">${escapeHtml(at)}</td>
            </tr>

            ${info?.note ? `<tr><td style="padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Catatan</td><td style="padding:6px 8px;"><div style="background:rgba(255,255,255,0.9);padding:8px;border-radius:6px;border:1px solid rgba(0,0,0,0.04);color:#0a3626;white-space:pre-wrap;">${escapeHtml(info.note)}</div></td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
  `
}

function buildWarehouseEmail(config: WarehouseEmailConfig) {
  if (!config.loan) return NO_LOAN_HTML
  const { payload } = buildBorrowerPayload(config.loan)
  // Prefer explicit approvalInfo but fall back to loan.warehouseStatus in DB/payload when available
  const effectiveApprovalInfo: ApprovalInfo = config.approvalInfo ? config.approvalInfo : (() => {
    try {
      const ws: any = config.loan?.warehouseStatus || {}
      return {
        approverName: ws?.processedBy || ws?.processed_by || undefined,
        approvedAt: ws?.processedAt || ws?.processed_at || undefined,
        note: ws?.note || undefined,
      }
    } catch (e) { return {} as ApprovalInfo }
  })()
  const headerHtml = renderWarehouseBlock(effectiveApprovalInfo)
  const html = buildBorrowerEmailHtml({
    ...payload,
    isUpdate: config.isUpdate,
    headerHtml,
    footerHtml: config.footerHtml,
    heroBadgeLabel: 'GUD',
  })
  return removeApprovalCta(html)
}

export const generateWarehouseBorrowerEmail = (loan: any, _extra: any[] = [], isUpdate = false, approvalInfo?: ApprovalInfo) =>
  buildWarehouseEmail({ loan, isUpdate, approvalInfo })

export const generateWarehouseCompanyEmail = (loan: any, _extra: any[] = [], isUpdate = false, approvalInfo?: ApprovalInfo) =>
  buildWarehouseEmail({ loan, isUpdate, approvalInfo })

export const generateWarehouseEntitasEmail = (loan: any, _extra: any[] = [], isUpdate = false, approvalInfo?: ApprovalInfo) =>
  buildWarehouseEmail({ loan, isUpdate, approvalInfo })

export function makeWarehouseHtml(baseHtml: string, approver = 'Gudang', approvedAt?: string, duration = '', note?: string): string {
  if (typeof baseHtml !== 'string') return baseHtml
  const at = formatDateTimeDisplay(approvedAt ?? Date.now())
  const durationDisplay = duration || '-'

  return baseHtml
    .replace('Permintaan Peminjaman', 'Proses Gudang')
    .replace('Permintaan Tinjau & Persetujuan', 'Tindakan Gudang')
    .replace('Notifikasi Permintaan Peminjaman', 'Notifikasi Gudang')
    .replace('{{APPROVER_NAME}}', approver)
    .replace('{{APPROVED_AT}}', at)
    .replace('{{APPROVAL_DURATION}}', durationDisplay)
    .replace('{{APPROVAL_NOTE}}', note ?? '-')
}


