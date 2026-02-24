import { CUSTOM_RETURN_STATUS, LOAN_LIFECYCLE, WAREHOUSE_STATUS } from '../types/loanStatus'
import { getNeedTypeLabel } from './needTypes'
import { getLoanStatus, getEffectiveReturnDate } from './loanHelpers'
import { isLoanActive } from './activeLoanHelpers'

export type ReminderStatus = 'pending' | 'upcoming' | 'overdue'

export interface ReminderCardData {
  id: string
  loanId: string
  borrowerName: string
  entitasLabel: string
  needTypeLabel: string
  productDetailsText: string
  outDate: string
  dueDate: string
  daysLeft: number | null
  status: ReminderStatus
  approvalLabel: string
  isApproved: boolean
  totalFine?: number
}

interface BuildOptions {
  limit?: number
  windowDays?: number
}

const RETURN_REQUEST_LABEL = 'Permintaan Pengembalian'

const ACTIVE_EXTENSION_STATUSES = [
  'diperpanjang',
  'perpanjangan ditolak',
  'perpanjang ditolak'
]

const REMINDER_EXCLUDED_LOAN_STATUSES = new Set<string>([
  CUSTOM_RETURN_STATUS.FOLLOW_UP,
  LOAN_LIFECYCLE.APPROVED,
  LOAN_LIFECYCLE.PENDING_APPROVAL
].map((label) => label.toLowerCase()))

const APPROVED_STATUS_SET = new Set<string>([
  LOAN_LIFECYCLE.APPROVED,
  LOAN_LIFECYCLE.PARTIALLY_APPROVED,
  WAREHOUSE_STATUS.BORROWED,
  WAREHOUSE_STATUS.PROCESSED,
  WAREHOUSE_STATUS.RETURNED,
  CUSTOM_RETURN_STATUS.FOLLOW_UP,
  RETURN_REQUEST_LABEL,
  ...ACTIVE_EXTENSION_STATUSES
].map((label) => label.toLowerCase()))

const EXCLUDED_STATUS_SET = new Set<string>([
  WAREHOUSE_STATUS.RETURNED
].map((label) => label.toLowerCase()))

const msPerDay = 1000 * 60 * 60 * 24

const normalizeDate = (value?: string) => {
  if (!value) return ''
  return value
}

export function buildDueDateReminders(loans: any[], options?: BuildOptions): ReminderCardData[] {
  const limit = options?.limit ?? 10
  // reminder window: only show reminders up to this many days before the due date
  // default is 7 days so dashboards are empty when the return date is > 7 days away
  const windowDays = options?.windowDays ?? 7
  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const mapped = (loans || [])
    .filter((loan) => {
      if (!loan || loan.isDraft) return false
      if (!isLoanActive(loan)) return false
      // ensure there is an effective return date (either original or approved extension)
      const effective = getEffectiveReturnDate(loan)
      return !!effective
    })
    .map((loan) => {
      // prefer the last approved extension's requestedReturnDate (if any) when computing due dates
      const effectiveReturn = getEffectiveReturnDate(loan)
      const dueDate = effectiveReturn ? new Date(effectiveReturn) : null
      // Use Math.floor to compute whole-day difference; this ensures overdue counts (negative values) are correct
      const daysLeft = dueDate ? Math.floor((dueDate.getTime() - todayMidnight.getTime()) / msPerDay) : null
      const canonicalStatus = String(getLoanStatus(loan) || '').toLowerCase()
      if (EXCLUDED_STATUS_SET.has(canonicalStatus)) return null
      if (REMINDER_EXCLUDED_LOAN_STATUSES.has(canonicalStatus)) return null
      const isApproved = APPROVED_STATUS_SET.has(canonicalStatus) || isLoanActive(loan)
      const reminderStatus: ReminderStatus = !isApproved
        ? 'pending'
        : (daysLeft !== null && daysLeft < 0 ? 'overdue' : 'upcoming')

      let totalFine: number | undefined
      if (reminderStatus === 'overdue' && daysLeft !== null) {
        const daysOverdue = Math.abs(daysLeft)
        totalFine = daysOverdue * 100000
      } else if (loan.totalDenda && typeof loan.totalDenda.fineAmount === 'number') {
        totalFine = loan.totalDenda.fineAmount
      }

      const entitasLabel = loan.entitasName
        || loan.entitasLabel
        || (typeof loan.entitas === 'object' && loan.entitas?.name)
        || loan.entitasId
        || '-'

      const needTypeLabel = getNeedTypeLabel(loan.needType) || loan.needType || '-'
      const loanStartDate = loan.useDate || loan.outDate || loan.startDate || loan.borrowDate || ''

      return {
        id: `REM${loan.id}`,
        loanId: loan.id,
        borrowerName: loan.borrowerName || 'Unknown Borrower',
        entitasLabel,
        needTypeLabel,
        productDetailsText: loan.productDetailsText || loan.productName || 'Tidak ada detail',
        outDate: normalizeDate(loanStartDate),
        dueDate: normalizeDate(effectiveReturn),
        daysLeft,
        status: reminderStatus,
        approvalLabel: reminderStatus === 'pending' ? 'Belum disetujui' : (reminderStatus === 'overdue' ? 'Terlambat' : 'Sudah disetujui'),
        isApproved,
        ...(typeof totalFine === 'number' ? { totalFine } : {})
      } as ReminderCardData
    })
    .filter((reminder): reminder is ReminderCardData => Boolean(reminder))
    .filter((reminder) => {
      if (reminder.daysLeft === null) return false
      if (reminder.status === 'overdue') return true
      if (reminder.status === 'pending') return false
      // Only show reminders when the return date is at most windowDays away and not yet overdue
      return reminder.daysLeft <= windowDays && reminder.daysLeft >= 0
    })

  const pending = mapped.filter((item) => item.status === 'pending')
  const approved = mapped
    .filter((item) => item.status !== 'pending')
    .sort((a, b) => {
      if (a.daysLeft === null && b.daysLeft === null) return 0
      if (a.daysLeft === null) return 1
      if (b.daysLeft === null) return -1
      return a.daysLeft - b.daysLeft
    })

  const ordered = [...pending, ...approved]
  return limit ? ordered.slice(0, limit) : ordered
}
