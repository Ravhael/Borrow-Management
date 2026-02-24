export interface MarketingProfileData {
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joinDate: string;
  employeeId: string;
  manager: string;
  location: string;
}

export interface MarketingStatsData {
  activeCampaigns: number;
  totalLeads: number;
  conversionRate: number;
  monthlyRevenue: number;
}

export interface MarketingProfileHeroHeaderProps {
  marketingStats: MarketingStatsData;
}

export interface MarketingProfileInfoProps {
  profile: MarketingProfileData;
  isEditing: boolean;
  onProfileUpdate: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEditToggle: () => void;
}

// Performance / Campaigns sections intentionally removed from profile page.