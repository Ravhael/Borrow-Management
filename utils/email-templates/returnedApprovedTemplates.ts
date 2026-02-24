import { getEffectiveReturnDate } from '../loanHelpers'
import {
  buildBorrowerEmailHtml,
  calculateInclusiveDays,
  escapeHtml,
  formatDateDisplay,
  formatDateRangeDisplay,
  formatDateTimeDisplay,
  getEntitasName,
  extractApprovedExtendDates,
  extractLatestApprovedExtendDate,
  normalizeDateInput,
  removeApprovalCta,
} from './shared'
import type { BorrowerEmailTemplateParams } from './shared'

export type ReturnBlockInfo = {
  processedBy?: string
  processedAt?: string
  note?: string
  audienceLabel?: string
  plannedDurationLabel?: string
  actualDurationLabel?: string
  latenessLabel?: string
  // optional human-friendly condition note (e.g. 'Dikembalikan Lengkap')
  conditionNote?: string
}

const NO_LOAN_HTML = `
      <div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB.</div>`

const NEED_DETAILS_VISIBLE_TYPES = new Set(['DEMO_PRODUCT', 'BARANG_BACKUP', 'LAINNYA'])

type BorrowerEmailCore = Omit<BorrowerEmailTemplateParams, 'headerHtml' | 'footerHtml' | 'heroBadgeLabel'>

type BorrowerPayloadResult = {
  payload: BorrowerEmailCore
}

type ReturnApprovedEmailConfig = {
  loan: any
  isUpdate: boolean
  audienceLabel: string
  heroBadgeLabel: string
  info?: ReturnBlockInfo
}

export function formatReturnTimestamp(value?: string): string {
  const base = value ?? Date.now()
  const formatted = formatDateTimeDisplay(base)
  if (formatted !== '-') return formatted
  return typeof value === 'string' ? value : '-'
}

export function formatDurationRange(useDate?: string, returnDate?: string): string {
  if (!useDate && !returnDate) return '-'
  const label = formatDateRangeDisplay(useDate, returnDate)
  const days = calculateInclusiveDays(useDate, returnDate)
  return days ? `${label} (${days} Hari)` : label
}

export function formatLateDays(plannedEnd?: string, actualReturn?: string): string {
  const planned = normalizeDateInput(plannedEnd)
  const actual = normalizeDateInput(actualReturn)
  if (!planned || !actual) return '-'
  const plannedUtc = Date.UTC(planned.getFullYear(), planned.getMonth(), planned.getDate())
  const actualUtc = Date.UTC(actual.getFullYear(), actual.getMonth(), actual.getDate())
  const diffDays = Math.floor((actualUtc - plannedUtc) / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? `${diffDays} Hari` : '0 Hari'
}

export function renderReturnedBlock(info: ReturnBlockInfo = {}): string {
  const label = info.audienceLabel ? `(${info.audienceLabel} copy)` : ''
  const headingSuffix = label ? ` ${escapeHtml(label)}` : ''
  const subtext = (info.audienceLabel || '').toLowerCase().includes('entitas')
    ? 'Notifikasi ini dikirimkan sebagai bukti bahwa barang telah kembali ke gudang.'
    : 'Notifikasi ini dikirimkan untuk menginformasikan bahwa barang telah kembali ke gudang.'
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:linear-gradient(90deg,#eef6ff,#f8fbff);border-radius:10px;border:1px solid rgba(13,71,161,0.12);padding:12px;margin-bottom:18px;color:#05233f;font-family:Inter, Arial, sans-serif;">
      <tr>
        <td width="60" style="padding:8px;vertical-align:top;">
          <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#1976d2,#0d47a1);display:inline-block;line-height:44px;text-align:center;color:white;font-weight:800;font-size:18px;">↺</div>
        </td>
        <td style="padding:8px 8px 8px 4px;vertical-align:top;">
          <div style="font-weight:800;font-size:16px;color:#0b3f2b;margin-bottom:8px;">Barang Peminjaman Telah Dikembalikan${headingSuffix}</div>
          <div style="font-size:12px;color:#0b3f2b;opacity:0.85;margin-bottom:8px;">${escapeHtml(subtext)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;color:#153d2a;">
            <tr>
              <td style="width:210px;padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Dikonfirmasi oleh</td>
              <td style="padding:6px 8px;">${escapeHtml(info.processedBy || 'Warehouse Team')}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Pada Tanggal & Waktu</td>
              <td style="padding:6px 8px;">${escapeHtml(formatReturnTimestamp(info.processedAt))}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Rencana Peminjaman</td>
              <td style="padding:6px 8px;">${escapeHtml(info.plannedDurationLabel || '-')}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Realisasi Peminjaman (Aktual)</td>
              <td style="padding:6px 8px;">${escapeHtml(info.actualDurationLabel || '-')}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Keterlambatan / Denda</td>
              <td style="padding:6px 8px;">${escapeHtml(info.latenessLabel || '-')}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Kondisi Barang</td>
              <td style="padding:6px 8px;">${escapeHtml(info.conditionNote || '-')}</td>
            </tr>
            ${info.note ? `<tr><td style="padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Catatan Gudang</td><td style="padding:6px 8px;"><div style="background:rgba(255,255,255,0.9);padding:8px;border-radius:6px;border:1px solid rgba(0,0,0,0.04);color:#0a3626;white-space:pre-wrap;">${escapeHtml(info.note)}</div></td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
  `
}

export function makeReturnedHtml(baseHtml: string, info?: ReturnBlockInfo): string {
  if (typeof baseHtml !== 'string') return baseHtml
  const block = renderReturnedBlock(info)
  let out = baseHtml.replace('Permintaan Peminjaman', 'Status Pengembalian Peminjaman')
  out = out.replace(/<div style="background:#f6fbff[\s\S]*?<\/div>\s*<section/, `${block}<section`)
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

function buildReturnBlockInfo(loan: any, audienceLabel: string, overrides?: ReturnBlockInfo): ReturnBlockInfo {
  const plannedStart = loan?.useDate || loan?.startDate
  // Prefer latest approved extend date when present (use raw ISO date for calculations)
  const extendReturnDates = extractApprovedExtendDates(loan)
  const latestExtendRaw = extractLatestApprovedExtendDate(loan)
  const plannedEnd = latestExtendRaw || loan?.returnDate || loan?.endDate

  const processedAt = overrides?.processedAt
    || loan?.returnStatus?.processedAt
    || loan?.returnStatus?.returnedAt
    || loan?.warehouseStatus?.returnedAt
    || getEffectiveReturnDate(loan)
    || latestExtendRaw
    || plannedEnd
    || new Date().toISOString()

  // compute lateness days and fine
  const normalize = (v?: string | null) => {
    if (!v) return null
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return null
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  const plannedDay = normalize(plannedEnd)
  const processedDay = normalize(processedAt)
  let lateDays = 0
  if (plannedDay && processedDay) {
    const diff = Math.floor((processedDay.getTime() - plannedDay.getTime()) / (1000 * 60 * 60 * 24))
    lateDays = diff > 0 ? diff : 0
  }
  const fineAmount = lateDays > 0 ? lateDays * 100000 : 0
  const fineLabel = fineAmount > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(fineAmount) : '-'
  const combinedLateness = `${lateDays} Hari${fineAmount > 0 ? ` / ${fineLabel}` : ' / -'}`

  // If an override is provided but doesn't include fine info, append the computed fine
  let finalLatenessLabel = combinedLateness
  if (overrides?.latenessLabel && typeof overrides.latenessLabel === 'string') {
    const overrideHasFine = /Rp|IDR|\//i.test(overrides.latenessLabel)
    finalLatenessLabel = overrideHasFine ? overrides.latenessLabel : `${overrides.latenessLabel} / ${fineLabel}`
  }

  return {
    audienceLabel,
    processedBy: overrides?.processedBy || loan?.returnStatus?.processedBy || loan?.warehouseStatus?.processedBy || 'Warehouse Team',
    processedAt,
    note: overrides?.note || loan?.returnStatus?.note || loan?.warehouseStatus?.note,
    plannedDurationLabel: overrides?.plannedDurationLabel || formatDurationRange(plannedStart, plannedEnd),
    actualDurationLabel: overrides?.actualDurationLabel || formatDurationRange(plannedStart, processedAt),
    latenessLabel: finalLatenessLabel,
    // prefer explicit override, then returnStatus.condition, then warehouse status condition
    conditionNote: overrides?.conditionNote || loan?.returnStatus?.condition || loan?.returnStatus?.conditionNote || loan?.warehouseStatus?.condition || undefined,
  }
}

function buildReturnApprovedEmail(config: ReturnApprovedEmailConfig) {
  if (!config.loan) return NO_LOAN_HTML
  const { payload } = buildBorrowerPayload(config.loan)
  const headerHtml = renderReturnedBlock(buildReturnBlockInfo(config.loan, config.audienceLabel, config.info))
  const html = buildBorrowerEmailHtml({
    ...payload,
    isUpdate: config.isUpdate,
    headerHtml,
    heroBadgeLabel: config.heroBadgeLabel,
  })
  return removeApprovalCta(html)
}

export const generateReturnedAppBorrowerEmail = (
  loan: any,
  _extra: any[] = [],
  info?: ReturnBlockInfo,
  isUpdate = true
) => buildReturnApprovedEmail({ loan, isUpdate, info, audienceLabel: 'Borrower', heroBadgeLabel: 'BRW' })

export const generateReturnedAppCompanyEmail = (
  loan: any,
  _extra: any[] = [],
  info?: ReturnBlockInfo,
  isUpdate = true
) => buildReturnApprovedEmail({ loan, isUpdate, info, audienceLabel: 'Company', heroBadgeLabel: 'ADM' })

export const generateReturnedAppEntitasEmail = (
  loan: any,
  _extra: any[] = [],
  info?: ReturnBlockInfo,
  isUpdate = true
) => buildReturnApprovedEmail({ loan, isUpdate, info, audienceLabel: 'Entitas', heroBadgeLabel: 'PJM' })
