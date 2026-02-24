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
  removeApprovalCta,
} from './shared'

export type ExtendRequestInfo = {
  requestBy?: string
  requestAt?: string
  requestedReturnDate?: string
  note?: string
}

const NO_LOAN_HTML = `
      <div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB.</div>`

const NEED_DETAILS_VISIBLE_TYPES = new Set(['DEMO_PRODUCT', 'BARANG_BACKUP', 'LAINNYA'])

const AUDIENCE_NOTES = {
  marketing: 'Permintaan perpanjangan ini perlu ditinjau dan di-approve / reject oleh Marketing.',
  company: 'Email ini dikirim sebagai salinan untuk Admin/Company agar dapat memantau permintaan perpanjangan.',
  entitas: 'Salinan informasi ini dikirimkan kepada Entitas terkait agar mengetahui jadwal terbaru.',
  borrower: 'Email ini mengonfirmasi bahwa permintaan perpanjangan Anda telah diterima dan sedang diproses.',
} as const

type BorrowerEmailCore = Omit<BorrowerEmailTemplateParams, 'headerHtml' | 'footerHtml' | 'heroBadgeLabel' | 'isUpdate'>
type BorrowerPayloadResult = {
  payload: BorrowerEmailCore
}

type ExtendEmailBuilderConfig = {
  loan: any
  extendInfo?: ExtendRequestInfo
  isUpdate: boolean
  heroBadgeLabel: string
  footerHtml?: string
  audienceNote?: string
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

function buildExtendEmail(config: ExtendEmailBuilderConfig): string {
  if (!config.loan) return NO_LOAN_HTML
  const { payload } = buildBorrowerPayload(config.loan)
  const headerHtml = buildExtendSummaryBlock(config.extendInfo, { audienceNote: config.audienceNote })
  return buildBorrowerEmailHtml({
    ...payload,
    isUpdate: config.isUpdate,
    headerHtml,
    footerHtml: config.footerHtml,
    heroBadgeLabel: config.heroBadgeLabel,
  })
}

const buildMarketingFooter = (loan: any) => {
  const formLabel = loan?.id || loan?.form_number || '-'
  const detailPathTarget = loan?.id || loan?.form_number
  const approvalLink = detailPathTarget
    ? `${getAppBaseUrl()}/peminjaman/${detailPathTarget}`
    : `${getAppBaseUrl()}/peminjaman`
  return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;padding-top:18px;border-top:1px dashed rgba(16,40,67,0.06);margin-top:22px;">
            <tr>
              <td align="center">
                <table role="presentation" width="900" cellpadding="0" cellspacing="0" style="width:100%;max-width:900px;margin:0 auto;border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0;text-align:center;font-size:13px;color:#3a5568;opacity:0.95;vertical-align:middle;padding-right:12px;">Silakan tinjau & proses permintaan perpanjangan ini pada System FormFlow (Form #${formLabel}):</td>
                    <td style="padding:10px 0;text-align:center;vertical-align:middle;">
                      <a href="${approvalLink}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                        <div style="display:inline-block;background:linear-gradient(135deg,#1976d2,#0d47a1);color:white;padding:10px 14px;border-radius:8px;font-weight:700;">Buka Approvals</div>
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
  `
}

export function formatExtendTimestamp(value?: string, dateOnly = false): string {
  if (!value) return '-'
  const formatted = dateOnly ? formatDateDisplay(value) : formatDateTimeDisplay(value)
  return formatted === '-' ? value : formatted
}

export function buildExtendSummaryBlock(extendInfo?: ExtendRequestInfo, options?: { audienceNote?: string }): string {
  const submittedBy = escapeHtml(extendInfo?.requestBy || '-')
  const submittedAt = escapeHtml(formatExtendTimestamp(extendInfo?.requestAt))
  const requestedReturn = escapeHtml(formatExtendTimestamp(extendInfo?.requestedReturnDate, true))
  const noteCopy = escapeHtml(options?.audienceNote ?? AUDIENCE_NOTES.marketing)
  const requestNote = extendInfo?.note ? `<div style="font-size:13px;color:#24425f;line-height:1.5;margin-top:10px;"><div style="font-weight:700;color:#0b2545;margin-bottom:6px;">Catatan Pengajuan Perpanjangan</div><div style="background:rgba(255,255,255,0.9);padding:8px;border-radius:6px;border:1px solid rgba(0,0,0,0.04);white-space:pre-wrap;color:#1e2f4c;">${escapeHtml(extendInfo.note)}</div></div>` : ''
  const audienceNoteHtml = `
    <div style="margin-top:10px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:10px;background:linear-gradient(90deg,#fff7e6,#fff1f0);border-radius:6px;border:1px solid rgba(255,193,7,0.12);">
            <div style="display:flex;align-items:flex-start;gap:8px;">
              <div style="flex-shrink:0;padding-top:2px;">
                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='12' cy='12' r='10' fill='#FFC107'/><path d='M10.2 15.2L16 9.4' stroke='#fff' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>
              </div>
              <div style='font-size:13px;color:#7a4d00;line-height:1.4;font-weight:700;'>${noteCopy}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `
  return `
    <div style="background:#f6fbff;border-radius:8px;border:1.5px solid rgba(13,71,161,0.12);padding:12px 14px;margin-bottom:14px;color:#0d2b4e;">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:#0b2545;">Permintaan Perpanjangan</div>
      <div style="font-size:13px;color:#24425f;line-height:1.5;">Diajukan oleh: <strong>${submittedBy}</strong></div>
      <div style="font-size:13px;color:#24425f;line-height:1.5;">Diajukan tanggal : <strong>${submittedAt}</strong></div>
      <div style="font-size:13px;color:#24425f;line-height:1.5;">Tanggal pengembalian yang diajukan: <strong>${requestedReturn}</strong></div>
      ${requestNote}
      ${audienceNoteHtml}
    </div>
  `
}

export function replaceIntroBlock(source: string, replacement: string): string {
  const marker = '<div style="background:#f6fbff'
  const start = source.indexOf(marker)
  if (start === -1) return source
  let depth = 0
  let idx = start
  while (idx < source.length) {
    if (source.startsWith('<div', idx)) {
      depth += 1
      const close = source.indexOf('>', idx)
      if (close === -1) break
      idx = close + 1
      continue
    }
    if (source.startsWith('</div>', idx)) {
      depth -= 1
      idx += 6
      if (depth === 0) {
        return source.slice(0, start) + replacement + source.slice(idx)
      }
      continue
    }
    idx += 1
  }
  return source
}

export function applyExtendSubmitCopy(
  html: string,
  audience: 'marketing' | 'admin',
  extendInfo?: ExtendRequestInfo
): string {
  if (typeof html !== 'string') return html
  let out = html.replace(/Permintaan Peminjaman/gi, match => match.replace('Peminjaman', 'Perpanjangan'))
  const submitSummary = buildExtendSummaryBlock(extendInfo, {
    audienceNote: AUDIENCE_NOTES[audience === 'marketing' ? 'marketing' : 'company'],
  })
  if (audience === 'marketing') {
    out = out.replace('Permintaan Tinjau & Persetujuan', 'Permintaan Perpanjangan')
  } else {
    out = out.replace('Notifikasi Permintaan Peminjaman', 'Notifikasi Permintaan Perpanjangan')
  }
  out = replaceIntroBlock(out, submitSummary)
  return out
}

export const generateExtendSubBorrowerEmail = (loan: any, extendInfo?: ExtendRequestInfo, isUpdate = false) => {
  const html = buildExtendEmail({
    loan,
    extendInfo,
    isUpdate,
    heroBadgeLabel: 'BRW',
    audienceNote: AUDIENCE_NOTES.borrower,
  })
  return removeApprovalCta(html)
}

export const generateExtendSubCompanyEmail = (loan: any, extendInfo?: ExtendRequestInfo, isUpdate = false) => {
  const html = buildExtendEmail({
    loan,
    extendInfo,
    isUpdate,
    heroBadgeLabel: 'ADM',
    audienceNote: AUDIENCE_NOTES.company,
  })
  return removeApprovalCta(html)
}

export const generateExtendSubEntitasEmail = (loan: any, extendInfo?: ExtendRequestInfo, isUpdate = false) => {
  const html = buildExtendEmail({
    loan,
    extendInfo,
    isUpdate,
    heroBadgeLabel: 'PJM',
    audienceNote: AUDIENCE_NOTES.entitas,
  })
  return removeApprovalCta(html)
}

export const generateExtendSubMarketingEmail = (loan: any, extendInfo?: ExtendRequestInfo, isUpdate = false) => {
  return buildExtendEmail({
    loan,
    extendInfo,
    isUpdate,
    heroBadgeLabel: 'MKT',
    audienceNote: AUDIENCE_NOTES.marketing,
    footerHtml: buildMarketingFooter(loan),
  })
}
