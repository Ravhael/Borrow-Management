import { getEffectiveReturnDate } from '../loanHelpers'
import { formatDurationRange } from './returnedApprovedTemplates'
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
import type { BorrowerEmailTemplateParams } from './shared'
import { replaceIntroBlock } from './extendRequestTemplates'

export type CompletedInfo = {
  completedBy?: string
  completedAt?: string
  durationLabel?: string
  actualDurationLabel?: string
  latenessAndFineLabel?: string
  conditionNote?: string
  note?: string
}

const NO_LOAN_HTML = `
      <div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB.</div>`

const NEED_DETAILS_VISIBLE_TYPES = new Set(['DEMO_PRODUCT', 'BARANG_BACKUP', 'LAINNYA'])

type BorrowerEmailCore = Omit<BorrowerEmailTemplateParams, 'headerHtml' | 'footerHtml' | 'heroBadgeLabel'>

type BorrowerPayloadResult = {
  payload: BorrowerEmailCore
}

type CompletedEmailConfig = {
  loan: any
  isUpdate: boolean
  audienceLabel: string
  heroBadgeLabel: string
  info?: CompletedInfo
}

export function formatCompletedTimestamp(value?: string): string {
  const base = value ?? Date.now()
  const formatted = formatDateTimeDisplay(base)
  if (formatted !== '-') return formatted
  return typeof value === 'string' ? value : '-'
}

export function renderCompletedBlock(audienceLabel: string, info?: CompletedInfo): string {
  const label = audienceLabel.toLowerCase()
  const subCopy = label.includes('borrower')
    ? 'Salinan ini dikirimkan kepada peminjam sebagai bukti bahwa proses peminjaman telah selesai.'
    : 'Dokumentasi resmi bahwa permintaan peminjaman ini sudah dinyatakan selesai.'
  const doneBy = escapeHtml(info?.completedBy || 'Warehouse Team')
  const doneAt = escapeHtml(formatCompletedTimestamp(info?.completedAt))
  const plannedDuration = info?.durationLabel
    ? `<tr><td style="padding:6px 8px;font-weight:700;color:#0b3f2b;width:210px;vertical-align:top;">Rencana Peminjaman</td><td style="padding:6px 8px;color:#0a3324;">${escapeHtml(info.durationLabel)}</td></tr>`
    : ''
  const actualDuration = info?.actualDurationLabel
    ? `<tr><td style="padding:6px 8px;font-weight:700;color:#0b3f2b;width:210px;vertical-align:top;">Realisasi Peminjaman (Aktual)</td><td style="padding:6px 8px;color:#0a3324;">${escapeHtml(info.actualDurationLabel)}</td></tr>`
    : ''
  const latenessRow = info?.latenessAndFineLabel
    ? `<tr><td style="padding:6px 8px;font-weight:700;color:#0b3f2b;width:210px;vertical-align:top;">Keterlambatan / Denda</td><td style="padding:6px 8px;color:#0a3324;">${escapeHtml(info.latenessAndFineLabel)}</td></tr>`
    : ''
  const conditionRow = info?.conditionNote
    ? `<tr><td style="padding:6px 8px;font-weight:700;color:#0b3f2b;width:210px;vertical-align:top;">Kondisi Barang</td><td style="padding:6px 8px;color:#0a3324;">${escapeHtml(info.conditionNote)}</td></tr>`
    : ''
  const noteRow = info?.note
    ? `<tr><td style="padding:6px 8px;font-weight:700;color:#0b3f2b;width:210px;vertical-align:top;">Catatan</td><td style="padding:6px 8px;color:#0a3324;"><div style="background:rgba(255,255,255,0.9);padding:8px;border-radius:6px;border:1px solid rgba(0,0,0,0.04);white-space:pre-wrap;">${escapeHtml(info.note)}</div></td></tr>`
    : ''

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:linear-gradient(90deg,#e6fff3,#f6fff9);border-radius:10px;border:1px solid rgba(33,150,83,0.18);padding:12px;margin-bottom:18px;color:#0a3324;font-family:Inter, Arial, sans-serif;">
      <tr>
        <td width="60" style="padding:8px;vertical-align:top;">
          <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#2e7d32,#1b5e20);display:inline-block;line-height:44px;text-align:center;color:white;font-weight:800;font-size:18px;">✓</div>
        </td>
        <td style="padding:8px 8px 8px 4px;vertical-align:top;">
          <div style="font-weight:800;font-size:16px;color:#0b3f2b;margin-bottom:6px;">Status Peminjaman Selesai (${escapeHtml(audienceLabel)})</div>
          <div style="font-size:12px;color:#0a3324;opacity:0.85;margin-bottom:10px;">${escapeHtml(subCopy)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;color:#0a3324;">
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b3f2b;width:210px;vertical-align:top;">Diselesaikan oleh</td>
              <td style="padding:6px 8px;color:#0a3324;">${doneBy}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Pada Tanggal & Waktu</td>
              <td style="padding:6px 8px;color:#0a3324;">${doneAt}</td>
            </tr>
            ${plannedDuration}
            ${actualDuration}
            ${latenessRow}
            ${conditionRow}
            ${noteRow}
          </table>
        </td>
      </tr>
    </table>
  `
}

export function makeCompletedHtml(baseHtml: string, audienceLabel: string, info?: CompletedInfo): string {
  if (typeof baseHtml !== 'string') return baseHtml
  const block = renderCompletedBlock(audienceLabel, info)
  let out = baseHtml.replace(/Permintaan Peminjaman/gi, 'Status Peminjaman Selesai')
  out = replaceIntroBlock(out, block)
  out = removeApprovalCta(out)
  return out
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

const normalizeText = (value?: string | null) => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export function buildCompletedInfo(loan: any, overrides?: CompletedInfo): CompletedInfo {
  const plannedStart = loan?.useDate || loan?.startDate
  // Prefer latest approved extend date when present (use raw ISO date for accurate range calculations)
  const latestExtendRaw = extractLatestApprovedExtendDate(loan)
  const plannedEnd = latestExtendRaw || loan?.returnDate || loan?.endDate || getEffectiveReturnDate(loan)
  const completedAt = overrides?.completedAt
    || loan?.returnStatus?.completedAt
    || loan?.returnStatus?.returnedAt
    || loan?.warehouseStatus?.returnedAt
    || loan?.returnStatus?.processedAt
    || loan?.warehouseStatus?.processedAt
    || latestExtendRaw
    || plannedEnd
    || new Date().toISOString()

  // compute lateness days and fine
  const parseDateOnly = (v?: string | null) => {
    if (!v) return null
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return null
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  const plannedDay = parseDateOnly(plannedEnd)
  const completedDay = parseDateOnly(completedAt)
  let lateDays = 0
  if (plannedDay && completedDay) {
    const diff = Math.floor((completedDay.getTime() - plannedDay.getTime()) / (1000 * 60 * 60 * 24))
    lateDays = diff > 0 ? diff : 0
  }

  // If returnStatus explicitly disables fines (e.g., condition indicates no fine), do not apply fines
  const disableFines = Boolean(loan?.returnStatus?.noFine)
  const fineAmount = disableFines ? 0 : (lateDays > 0 ? lateDays * 100000 : 0)
  const fineLabel = fineAmount > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(fineAmount) : '-'
  const latenessAndFineLabel = `${lateDays} Hari${fineAmount > 0 ? ` / ${fineLabel}` : ' / -'}`

  return {
    completedBy: overrides?.completedBy
      || normalizeText(loan?.returnStatus?.processedBy)
      || normalizeText(loan?.warehouseStatus?.processedBy)
      || normalizeText(loan?.warehouseStatus?.returnedBy)
      || 'Warehouse Team',
    completedAt,
    durationLabel: overrides?.durationLabel || formatDurationRange(plannedStart, plannedEnd),
    actualDurationLabel: overrides?.actualDurationLabel || formatDurationRange(plannedStart, completedAt),
    latenessAndFineLabel: overrides?.latenessAndFineLabel || latenessAndFineLabel,
    conditionNote: overrides?.conditionNote
      || normalizeText(loan?.returnStatus?.condition)
      || normalizeText(loan?.returnStatus?.conditionNote)
      || normalizeText(loan?.warehouseStatus?.condition),
    note: overrides?.note || normalizeText(loan?.returnStatus?.note) || normalizeText(loan?.warehouseStatus?.note),
  }
}

function buildCompletedEmail(config: CompletedEmailConfig) {
  if (!config.loan) return NO_LOAN_HTML
  const { payload } = buildBorrowerPayload(config.loan)
  const headerHtml = renderCompletedBlock(config.audienceLabel, buildCompletedInfo(config.loan, config.info))
  const html = buildBorrowerEmailHtml({
    ...payload,
    isUpdate: config.isUpdate,
    headerHtml,
    heroBadgeLabel: config.heroBadgeLabel,
  })
  return removeApprovalCta(html)
}

export const generateCompletedBorrowerEmail = (
  loan: any,
  _extra: any[] = [],
  info?: CompletedInfo,
  isUpdate = true
) => buildCompletedEmail({ loan, isUpdate, info, audienceLabel: 'Borrower', heroBadgeLabel: 'BRW' })

export const generateCompletedCompanyEmail = (
  loan: any,
  _extra: any[] = [],
  info?: CompletedInfo,
  isUpdate = true
) => buildCompletedEmail({ loan, isUpdate, info, audienceLabel: 'Company', heroBadgeLabel: 'ADM' })

export const generateCompletedEntitasEmail = (
  loan: any,
  _extra: any[] = [],
  info?: CompletedInfo,
  isUpdate = true
) => buildCompletedEmail({ loan, isUpdate, info, audienceLabel: 'Entitas', heroBadgeLabel: 'PJM' })
