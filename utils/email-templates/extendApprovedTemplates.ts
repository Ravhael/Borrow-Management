import { getEffectiveReturnDate } from '../loanHelpers'
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

export type ExtendDecisionInfo = {
  approveBy?: string
  approveAt?: string
  durationLabel?: string
  duration?: string
  requestedDuration?: string
  approveStatus?: string
  approveNote?: string
}

export type ExtendDecisionSummary = {
  severity: 'success' | 'info' | 'warning' | 'error'
  message: string
}

const NO_LOAN_HTML = `
      <div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB.</div>`

const NEED_DETAILS_VISIBLE_TYPES = new Set(['DEMO_PRODUCT', 'BARANG_BACKUP', 'LAINNYA'])

type BorrowerEmailCore = Omit<BorrowerEmailTemplateParams, 'headerHtml' | 'footerHtml' | 'heroBadgeLabel'>
type BorrowerPayloadResult = {
  payload: BorrowerEmailCore
}

type ExtendApprovedEmailConfig = {
  loan: any
  extendInfo?: ExtendDecisionInfo
  isUpdate: boolean
  heroBadgeLabel: string
  audienceLabel: string
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

function buildExtendApprovedEmail(config: ExtendApprovedEmailConfig): string {
  if (!config.loan) return NO_LOAN_HTML
  const { payload } = buildBorrowerPayload(config.loan)
  const headerHtml = buildExtendDecisionBlock(config.audienceLabel, config.extendInfo)
  const html = buildBorrowerEmailHtml({
    ...payload,
    isUpdate: config.isUpdate,
    headerHtml,
    footerHtml: config.footerHtml,
    heroBadgeLabel: config.heroBadgeLabel,
  })
  return removeApprovalCta(html)
}

export function buildExtendDecisionBlock(audienceLabel: string, extendInfo?: ExtendDecisionInfo): string {
  const decidedBy = escapeHtml(extendInfo?.approveBy || '-')
  const decidedAt = escapeHtml(formatExtendTimestamp(extendInfo?.approveAt))
  const totalDuration = escapeHtml(extendInfo?.durationLabel || extendInfo?.duration || extendInfo?.requestedDuration || '-')
  const audienceNote = audienceLabel.toLowerCase().includes('borrower')
    ? 'Informasi ini dikirimkan agar peminjam mengetahui status terbaru.'
    : 'Salinan ini ditujukan untuk arsip Entitas & Company.'
  const statusRaw = String(extendInfo?.approveStatus || '').toLowerCase()
  const heading = statusRaw.includes('tolak')
    ? 'Permintaan Perpanjangan Ditolak.'
    : statusRaw.includes('setuj')
      ? 'Permintaan Perpanjangan Disetujui.'
      : 'Permintaan Perpanjangan Telah Di Approve.'
  const multiRequestNote = 'Catatan: Permintaan perpanjangan dapat diajukan lebih dari satu kali.'
  const approveNoteBlock = extendInfo?.approveNote
    ? `
      <div style="font-size:13px;line-height:1.45;margin-top:10px;">
        <div style="font-weight:700;color:#0b3f2b;margin-bottom:6px;">Catatan Persetujuan Perpanjangan</div>
        <div style="background:rgba(255,255,255,0.9);padding:10px;border-radius:6px;border:1px solid rgba(0,0,0,0.04);white-space:pre-wrap;color:#1e2f4c;">${escapeHtml(extendInfo.approveNote)}</div>
      </div>
    `
    : ''

  return `
    <div style="background:#e8f9ee;border-radius:8px;border:1.5px solid rgba(13,71,161,0.12);padding:18px 20px;margin-bottom:14px;color:#0b3f2b;">
      <div style="font-size:15px;font-weight:700;margin-bottom:8px;">${escapeHtml(heading)}</div>
      <div style="font-size:13px;line-height:1.45;margin-bottom:6px;">${escapeHtml(audienceNote)}</div>
      <div style="font-size:13px;line-height:1.45;margin-bottom:6px;">Disetujui oleh : <strong>${decidedBy}</strong></div>
      <div style="font-size:13px;line-height:1.45;margin-bottom:6px;">Disetujui pada tanggal : <strong>${decidedAt}</strong></div>
      <div style="font-size:13px;line-height:1.45;">Total Durasi Peminjaman : <strong>${totalDuration}</strong></div>
      ${approveNoteBlock}
    </div>
  `
}

export function formatExtendTimestamp(value?: string): string {
  if (!value) return '-'
  const formatted = formatDateTimeDisplay(value)
  return formatted === '-' ? value : formatted
}

export function makeExtendDecisionHtml(
  baseHtml: string,
  audienceLabel: string,
  extendInfo?: ExtendDecisionInfo
): string {
  if (typeof baseHtml !== 'string') return baseHtml
  const block = buildExtendDecisionBlock(audienceLabel, extendInfo)
  let out = baseHtml
    .replace('Permintaan Peminjaman', 'Informasi Perpanjangan')
    .replace('Permintaan Perpanjangan', `Status Perpanjangan (${audienceLabel})`)
  out = replaceIntroBlock(out, block)
  out = removeApprovalCta(out)
  return out
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

export function describeExtendDecision(extendInfo?: ExtendDecisionInfo): ExtendDecisionSummary {
  if (!extendInfo) {
    return { severity: 'warning', message: 'Belum ada data permintaan perpanjangan yang bisa dipreview. Ajukan perpanjangan terlebih dahulu.' }
  }
  const status = String(extendInfo.approveStatus || '').toLowerCase()
  if (status.includes('setuj')) {
    return { severity: 'success', message: 'Permintaan perpanjangan terbaru telah disetujui — email konfirmasi siap dikirim.' }
  }
  if (status.includes('tolak')) {
    return { severity: 'error', message: 'Permintaan perpanjangan terbaru ditolak — gunakan template di bawah untuk menginformasikan peminjam serta entitas.' }
  }
  return { severity: 'info', message: 'Permintaan perpanjangan terbaru masih menunggu keputusan. Preview menampilkan versi menunggu.' }
}

export const generateExtendAppBorrowerEmail = (
  loan: any,
  extendInfo?: ExtendDecisionInfo,
  isUpdate = true
) =>
  buildExtendApprovedEmail({
    loan,
    extendInfo,
    isUpdate,
    heroBadgeLabel: 'BRW',
    audienceLabel: 'Borrower',
  })

export const generateExtendAppCompanyEmail = (
  loan: any,
  extendInfo?: ExtendDecisionInfo,
  isUpdate = true
) =>
  buildExtendApprovedEmail({
    loan,
    extendInfo,
    isUpdate,
    heroBadgeLabel: 'ADM',
    audienceLabel: 'Admin/Company',
  })

export const generateExtendAppEntitasEmail = (
  loan: any,
  extendInfo?: ExtendDecisionInfo,
  isUpdate = true
) =>
  buildExtendApprovedEmail({
    loan,
    extendInfo,
    isUpdate,
    heroBadgeLabel: 'PJM',
    audienceLabel: 'Entitas',
  })
