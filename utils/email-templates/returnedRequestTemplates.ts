import { getEffectiveReturnDate } from '../loanHelpers'
import { getAppBaseUrl } from '../getAppBaseUrl'
import type { BorrowerEmailTemplateParams } from './shared'
import {
  buildBorrowerEmailHtml,
  escapeHtml,
  formatDateDisplay,
  formatDateTimeDisplay,
  getEntitasName,
  extractApprovedExtendDates,
  extractLatestApprovedExtendDate,
  removeApprovalCta,
} from './shared'
import { replaceIntroBlock } from './extendRequestTemplates'

export type ReturnRequestInfo = {
  requestBy?: string
  requestAt?: string
  plannedReturnDate?: string
  pickupPlan?: string
  handlingNote?: string
  note?: string
  plannedDurationLabel?: string
  actualDurationLabel?: string
  latenessLabel?: string
}

export type ReturnRequestOptions = {
  keepApprovalCta?: boolean
}

const NO_LOAN_HTML = `
      <div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB.</div>`

const NEED_DETAILS_VISIBLE_TYPES = new Set(['DEMO_PRODUCT', 'BARANG_BACKUP', 'LAINNYA'])

type BorrowerEmailCore = Omit<BorrowerEmailTemplateParams, 'headerHtml' | 'footerHtml' | 'heroBadgeLabel'>
type BorrowerPayloadResult = {
  payload: BorrowerEmailCore
}

type ReturnRequestEmailConfig = {
  loan: any
  requestInfo?: ReturnRequestInfo
  isUpdate: boolean
  audienceLabel: string
  heroBadgeLabel: string
  footerHtml?: string
  keepApprovalCta?: boolean
  audienceNote?: string
}

export function formatReturnRequestTimestamp(value?: string, dateOnly = false): string {
  if (!value) return '-'
  const formatted = dateOnly ? formatDateDisplay(value) : formatDateTimeDisplay(value)
  return formatted === '-' ? value : formatted
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
  const extendReturnDates = extractApprovedExtendDates(loan)

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
      extendReturnDates,
    },
  }
}

const buildWarehouseFooter = (loan: any) => {
  const formLabel = loan?.id || loan?.form_number || '-'
  // Link directly to the loan detail page in warehouse mode so receivers go to the expected review page
  const approvalLink = loan?.id ? `${getAppBaseUrl()}/peminjaman/${loan.id}?mode=warehouse` : `${getAppBaseUrl()}/peminjaman?mode=warehouse`
  return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;padding-top:18px;border-top:1px dashed rgba(16,40,67,0.06);margin-top:22px;">
            <tr>
              <td align="center">
                <table role="presentation" width="900" cellpadding="0" cellspacing="0" style="width:100%;max-width:900px;margin:0 auto;border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0;text-align:center;font-size:13px;color:#3a5568;opacity:0.95;vertical-align:middle;padding-right:12px;">Silakan tinjau & proses permintaan pengembalian ini pada System FormFlow (Form #${formLabel}):</td>
                    <td style="padding:10px 0;text-align:center;vertical-align:middle;">
                      <a href="${approvalLink}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                        <div style="display:inline-block;background:linear-gradient(135deg,#1976d2,#0d47a1);color:white;padding:10px 14px;border-radius:8px;font-weight:700;">Proses Approval</div>
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
  `
}

function buildReturnRequestEmail(config: ReturnRequestEmailConfig) {
  if (!config.loan) return NO_LOAN_HTML
  const { payload } = buildBorrowerPayload(config.loan)
  const headerHtml = buildReturnRequestBlock(config.audienceLabel, config.requestInfo, config.loan, config.audienceNote)
  const html = buildBorrowerEmailHtml({
    ...payload,
    isUpdate: config.isUpdate,
    headerHtml,
    footerHtml: config.footerHtml,
    heroBadgeLabel: config.heroBadgeLabel,
  })
  return config.keepApprovalCta ? html : removeApprovalCta(html)
}

export function buildReturnRequestBlock(audienceLabel: string, info?: ReturnRequestInfo, loan?: any, audienceNote?: string): string {
  const audience = audienceLabel.toLowerCase()
  const leadCopy = audience.includes('warehouse')
    ? 'Warehouse menerima permintaan pengembalian berikut. Mohon tinjau dan proses pada sistem FormFlow.'
    : 'Informasi ini dikirimkan untuk memberi tahu bahwa peminjam mengajukan pengembalian barang.'

  const audienceNoteHtml = audienceNote ? `
    <tr>
      <td colspan="2" style="padding-top:10px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:10px;background:linear-gradient(90deg,#fffaf0,#fff4e6);border-radius:6px;border:1px solid rgba(255,149,0,0.08);">
              <div style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#7a4d00;line-height:1.4;font-weight:700;">
                <div style="flex-shrink:0;padding-top:2px;">⚠</div>
                <div>${escapeHtml(audienceNote)}</div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : ''
  const reqBy = escapeHtml(info?.requestBy || '-')
  const reqAt = escapeHtml(formatReturnRequestTimestamp(info?.requestAt))
  // Prefer the latest approved extend date on the loan if present; otherwise use the requested planned return date
  const extendReturnDates = loan ? extractApprovedExtendDates(loan) : []
  const latestExtendRaw = loan ? extractLatestApprovedExtendDate(loan) : null
  const plannedReturnLabel = latestExtendRaw
    ? formatReturnRequestTimestamp(latestExtendRaw, true)
    : info?.plannedReturnDate
      ? formatReturnRequestTimestamp(info.plannedReturnDate, true)
      : '-'
  const plannedReturn = escapeHtml(plannedReturnLabel)
  const pickupPlan = info?.pickupPlan
    ? `<tr><td style="padding:6px 8px;font-weight:700;color:#0b2545;width:210px;vertical-align:top;">Rencana Pengembalian</td><td style="padding:6px 8px;color:#1e2f4c;">${escapeHtml(info.pickupPlan)}</td></tr>`
    : ''
  const handlingNote = info?.handlingNote
    ? `<tr><td style="padding:6px 8px;font-weight:700;color:#0b2545;width:210px;vertical-align:top;">Koordinasi Gudang</td><td style="padding:6px 8px;color:#1e2f4c;">${escapeHtml(info.handlingNote)}</td></tr>`
    : ''
  const note = info?.note
    ? `<tr><td style="padding:6px 8px;font-weight:700;color:#0b2545;width:210px;vertical-align:top;">Catatan Pengajuan Pengembalian</td><td style="padding:6px 8px;color:#1e2f4c;"><div style="background:rgba(255,255,255,0.9);padding:8px;border-radius:6px;border:1px solid rgba(0,0,0,0.04);white-space:pre-wrap;">${escapeHtml(info.note)}</div></td></tr>`
    : ''

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:linear-gradient(90deg,#fff4e6,#fffaf3);border-radius:10px;border:1px solid rgba(255,149,0,0.18);padding:12px;margin-bottom:18px;color:#1e2f4c;font-family:Inter, Arial, sans-serif;">
      <tr>
        <td width="60" style="padding:8px;vertical-align:top;">
          <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#ff9800,#f57c00);display:inline-block;line-height:44px;text-align:center;color:white;font-weight:800;font-size:18px;">↺</div>
        </td>
        <td style="padding:8px 8px 8px 4px;vertical-align:top;">
          <div style="font-weight:800;font-size:16px;color:#4a2a00;margin-bottom:4px;">Permintaan Pengembalian (${escapeHtml(audienceLabel)})</div>
          <div style="font-size:12px;color:#5c3810;opacity:0.9;margin-bottom:10px;">${escapeHtml(leadCopy)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;color:#1e2f4c;">
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b2545;width:210px;vertical-align:top;">Diajukan oleh</td>
              <td style="padding:6px 8px;color:#1e2f4c;">${reqBy}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b2545;vertical-align:top;">Pada Tanggal & Waktu</td>
              <td style="padding:6px 8px;color:#1e2f4c;">${reqAt}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b2545;vertical-align:top;">Target Pengembalian</td>
              <td style="padding:6px 8px;color:#1e2f4c;">${plannedReturn}</td>
            </tr>
            ${audienceNoteHtml}
            ${note}
          </table>
        </td>
      </tr>
    </table>
  `
}

export function applyReturnRequestCopy(
  baseHtml: string,
  audienceLabel: string,
  info?: ReturnRequestInfo,
  options: ReturnRequestOptions = {}
): string {
  if (typeof baseHtml !== 'string') return baseHtml
  const label = audienceLabel.toLowerCase()
  const block = buildReturnRequestBlock(audienceLabel, info)
  let out = baseHtml.replace(/Permintaan Peminjaman/gi, 'Permintaan Pengembalian')

  if (label === 'warehouse') {
    out = out.replace('Notifikasi Permintaan Peminjaman', 'Persetujuan Pengembalian Barang')
  } else {
    out = out.replace('Permintaan Tinjau & Persetujuan', 'Permintaan Pengembalian Barang')
    out = out.replace('Notifikasi Permintaan Peminjaman', 'Notifikasi Pengembalian Barang')
  }

  if (label === 'company') {
    out = out.replace(/entitas peminjam/gi, 'company terkait')
  }

  out = replaceIntroBlock(out, block)

  if (!options.keepApprovalCta) {
    out = removeApprovalCta(out)
  }

  return out
}

export const generateReturnedSubpBorrowerEmail = (
  loan: any,
  extra: any[] = [],
  requestInfo?: ReturnRequestInfo,
  isUpdate = true
) => {
  return buildReturnRequestEmail({
    loan,
    requestInfo,
    isUpdate,
    audienceLabel: 'Borrower',
    heroBadgeLabel: 'BRW',
  })
}

export const generateReturnedSubCompanyEmail = (
  loan: any,
  extra: any[] = [],
  requestInfo?: ReturnRequestInfo,
  isUpdate = true
) => {
  return buildReturnRequestEmail({
    loan,
    requestInfo,
    isUpdate,
    audienceLabel: 'Company',
    heroBadgeLabel: 'ADM',
  })
}

export const generateReturnedSubEntitasEmail = (
  loan: any,
  extra: any[] = [],
  requestInfo?: ReturnRequestInfo,
  isUpdate = true
) => {
  return buildReturnRequestEmail({
    loan,
    requestInfo,
    isUpdate,
    audienceLabel: 'Entitas',
    heroBadgeLabel: 'PJM',
  })
}

export const generateReturnedSubWarehouseEmail = (
  loan: any,
  extra: any[] = [],
  requestInfo?: ReturnRequestInfo,
  isUpdate = true
) => {
  return buildReturnRequestEmail({
    loan,
    requestInfo,
    isUpdate,
    audienceLabel: 'Warehouse',
    heroBadgeLabel: 'WHS',
    footerHtml: buildWarehouseFooter(loan),
    keepApprovalCta: true,
    audienceNote: 'Permintaan pengembalian ini perlu ditinjau dan di-approve / reject oleh Gudang.'
  })
}
