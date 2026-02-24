import type { ReminderCardData } from '../utils/dueDateReminderBuilder'
import type { MarketingStats } from './marketingDashboard'

export type DashboardStats = MarketingStats

export interface RecentRequest {
  id: string
  requesterName: string
  company: string
  requestDate: string
  status: 'pending' | 'approved' | 'rejected'
  urgency: 'low' | 'medium' | 'high'
}

export type DueDateReminder = ReminderCardData

export interface StatCardProps {
  label: string
  value: number
  icon: string
  color: string
}

export interface SummaryStatProps {
  label: string
  value: number | string
  color: string
  trend: string
  trendType: 'up' | 'down'
}

export interface HeroHeaderProps {
  stats: DashboardStats
  title?: string
}

export interface SummaryStatisticsProps {
  stats: DashboardStats
}

export interface DueDateRemindersProps {
  dueDateReminders: DueDateReminder[]
  formatDate: (dateString: string) => string
}

export interface RecentRequestsProps {
  recentRequests: RecentRequest[]
  search: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
  formatDate: (dateString: string) => string
}

export interface ActiveLoanInfo {
  totalActive: number
  nextBorrower?: string | null
  nextCompany?: string | null
  nextReturnDate?: string | null
  needType?: string | null
  loanId?: string | null
  status?: ActiveLoanStatus | null
  topLoans?: ActiveLoanSummary[]
}

export type ActiveLoanStatusSource = 'warehouse' | 'lifecycle'

export interface ActiveLoanStatus {
  label: string
  source: ActiveLoanStatusSource
}

export interface ActiveLoanSummary {
  loanId?: string | null
  borrower?: string | null
  company?: string | null
  entitasId?: string | null
  entitasLabel?: string | null
  returnDate?: string | null
  needType?: string | null
  status?: ActiveLoanStatus | null
  loanStatus?: string | null
  warehouseStatus?: { status?: string | null } | null
  returnStatus?: { status?: string | null } | null
  extendStatus?: any
}