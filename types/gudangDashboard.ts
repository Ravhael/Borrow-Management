import type { ReminderCardData } from '../utils/dueDateReminderBuilder';
import type { MarketingStats } from './marketingDashboard';

export type GudangStats = MarketingStats;

export interface GudangActivity {
  id: string;
  type: 'campaign_created' | 'lead_generated' | 'conversion' | 'email_sent';
  amount: number;
  date: string;
  status: 'active' | 'completed' | 'pending';
  description: string;
}

export type DueDateReminder = ReminderCardData;

export interface GudangHeroHeaderProps {
  currentUser: any;
  stats: GudangStats;
}

export interface DueDateRemindersProps {
  reminders: DueDateReminder[];
}

export interface RecentActivitiesProps {
  activities: GudangActivity[];
}