import { getEffectiveReturnDate } from '../loanHelpers'
import { buildBorrowerEmailHtml, formatDateDisplay, formatDateTimeDisplay, getEntitasName, removeApprovalCta, extractApprovedExtendDates } from './shared'
import type { BorrowerEmailTemplateParams } from './shared'
import { formatReturnTimestamp } from './returnedApprovedTemplates'
import {
  ReminderAfterInfo,
  computeDaysUntil,
  formatReminderCountdown,
  renderReminderAfterBlock
} from './reminderShared'

const NO_LOAN_HTML = `
      <div style="padding:16px;font-family:Arial, sans-serif;color:#8a4a00;background:#fff2e1;border-radius:6px;border:1px solid rgba(255,152,0,0.25)">No persisted loan found — preview requires a loan stored in the DB.</div>`

const NEED_DETAILS_VISIBLE_TYPES = new Set(['DEMO_PRODUCT', 'BARANG_BACKUP', 'LAINNYA'])

type BorrowerEmailCore = Omit<BorrowerEmailTemplateParams, 'headerHtml' | 'footerHtml' | 'heroBadgeLabel'>

type BorrowerPayloadResult = {
  payload: BorrowerEmailCore
}

type ReminderAfterEmailConfig = {
  loan: any
  isUpdate: boolean
  audienceLabel: string
  heroBadgeLabel: string
  info?: ReminderAfterInfo
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

function buildAfterInfo(loan: any, audienceLabel: string, overrides?: ReminderAfterInfo): ReminderAfterInfo {
  const plannedReturn = getEffectiveReturnDate(loan) || loan?.returnDate || loan?.endDate
  const borrowerName = overrides?.borrowerName || loan?.borrowerName || loan?.name || 'Peminjam'
  const daysLeft = computeDaysUntil(plannedReturn)

  const daysLeftNumber = typeof daysLeft === 'number' ? daysLeft : undefined
  const daysLate = typeof daysLeft === 'number' && daysLeft < 0 ? Math.abs(daysLeft) : 0
  const finePerDay = 100_000
  const accumulatedFineAmount = daysLate * finePerDay
  const formatRupiah = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
  const accumulatedFineLabel = daysLate > 0 ? formatRupiah(accumulatedFineAmount) : undefined

  const defaults: ReminderAfterInfo = {
    audienceLabel,
    returnDateLabel: plannedReturn ? formatReturnTimestamp(plannedReturn) : '-',
    daysLeftLabel: formatReminderCountdown(daysLeft),
    daysLeftNumber: daysLeftNumber,
    accumulatedFineLabel,
    autoScheduleLabel: 'H+1 • H+3 • H+7',
    manualHint: 'Pengingat setelah jatuh tempo. Segera koordinasikan pengembalian bersama borrower.',
    borrowerName,
  }

  return { ...defaults, ...overrides }
}

function buildReminderAfterEmail(config: ReminderAfterEmailConfig) {
  if (!config.loan) return NO_LOAN_HTML
  const { payload } = buildBorrowerPayload(config.loan)
  const info = buildAfterInfo(config.loan, config.audienceLabel, config.info)
  const headerHtml = renderReminderAfterBlock(info)
  const html = buildBorrowerEmailHtml({
    ...payload,
    isUpdate: config.isUpdate,
    headerHtml,
    heroBadgeLabel: config.heroBadgeLabel,
  })
  return removeApprovalCta(html)
}

export const generateReminderAfterBorrowerEmail = (
  loan: any,
  _extra: any[] = [],
  overrides?: ReminderAfterInfo,
  isUpdate = false
) => buildReminderAfterEmail({ loan, isUpdate, info: overrides, audienceLabel: 'Borrower (H+ Reminder)', heroBadgeLabel: 'BRW' })

export const generateReminderAfterCompanyEmail = (
  loan: any,
  _extra: any[] = [],
  overrides?: ReminderAfterInfo,
  isUpdate = false
) => buildReminderAfterEmail({ loan, isUpdate, info: overrides, audienceLabel: 'Company (H+ Reminder)', heroBadgeLabel: 'ADM' })

export const generateReminderAfterEntitasEmail = (
  loan: any,
  _extra: any[] = [],
  overrides?: ReminderAfterInfo,
  isUpdate = false
) => buildReminderAfterEmail({ loan, isUpdate, info: overrides, audienceLabel: 'Entitas (H+ Reminder)', heroBadgeLabel: 'PJM' })
