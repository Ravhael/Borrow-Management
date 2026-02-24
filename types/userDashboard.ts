import React from 'react';
import type { ReminderCardData } from '../utils/dueDateReminderBuilder';

export interface UserStats {
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  completedLoans: number;
  totalFine: number;
  pendingApprovals: number;
  rejectedLoans?: number;
  waitingApprovals?: number;
}

export interface LoanActivity {
  id: string;
  type: 'loan_request' | 'payment' | 'approval' | 'rejection';
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'paid' | 'overdue';
  description: string;
}

export type DueDateReminder = ReminderCardData;

export interface UserHeroHeaderProps {
  currentUser: any;
  stats: UserStats;
}

export interface DueDateRemindersProps {
  dueDateReminders: DueDateReminder[];
  formatDate: (dateString: string) => string;
}

export interface RecentActivitiesProps {
  loanActivities: LoanActivity[];
  formatDate: (dateString: string) => string;
  formatCurrency: (amount: number) => string;
  getActivityIcon: (type: string) => React.ReactElement;
  getStatusColor: (status: string) => string;
}