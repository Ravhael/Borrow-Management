export interface AdminProfileData {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  joinDate: string;
  lastLogin: string;
  avatar: string;
}

export interface AdminSecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: string;
}

export interface AdminActivityItem {
  action: string;
  time: string;
  icon: string;
}

export interface AdminProfileProps {
  profile: AdminProfileData;
  securitySettings: AdminSecuritySettings;
  activityItems: AdminActivityItem[];
  isEditing: boolean;
  onProfileUpdate: (field: string, value: string) => void;
  onSecurityUpdate: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onPasswordChange: () => void;
}