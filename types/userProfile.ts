export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  phone?: string;
  directorate?: string | null;
  entitasId?: string;
  entitas?: string | null;
  companyId?: string;
  isActive: boolean;
}

export interface UserFormData {
  name: string;
  email: string;
  username: string;
  role: string;
  phone?: string;
  directorateId?: number | string | null;
  entitasId: string;
  companyId: string;
  isActive: boolean;
}

export interface UserStatsData {
  totalRequests: number;
  activeLoans: number;
  completedPayments: number;
  upcomingPayments: number;
}

export interface ToastData {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

export interface UserProfileHeroHeaderProps {
  userStats: UserStatsData;
}

export interface UserProfileInfoProps {
  currentUser: UserProfileData | null;
  formData: UserFormData;
  isEditing: boolean;
  isLoading: boolean;
  onInputChange: (field: string, value: string | boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  onEditToggle: () => void;
}