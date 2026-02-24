import type { ReminderCardData } from '../utils/dueDateReminderBuilder';
export interface MarketingStats {
  totalLoans: number;
  activeLoans: number;
  returnedComplete: number;
  returnedIncomplete: number;
  returnedDamaged: number;
  overdueLoans: number;
  totalApproved?: number;
  totalRejected?: number;
  totalRequests?: number;
  pendingApprovals?: number;
  approvedToday?: number;
  rejectedToday?: number;
}

export interface MarketingActivity {
  id: string;
  type: 'campaign_created' | 'lead_generated' | 'conversion' | 'email_sent';
  amount: number;
  date: string;
  status: 'active' | 'completed' | 'pending';
  description: string;
}

export type DueDateReminder = ReminderCardData;

export interface MarketingHeroHeaderProps {
  currentUser: any;
  stats: MarketingStats;
}

export interface DueDateRemindersProps {
  reminders: DueDateReminder[];
}

export interface RecentActivitiesProps {
  activities: MarketingActivity[];
}