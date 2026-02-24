export interface GudangProfileData {
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

export interface GudangPerformance {
  itemsManaged: number;
  transactionsHandled: number;
  accuracyRate: number;
  efficiencyScore: number;
  awards: number;
  certifications: string[];
}

export interface GudangStats {
  totalInventory: number;
  activeTransactions: number;
  accuracyRate: number;
  monthlyValue: number;
}

export interface GudangInventoryItem {
  id: string;
  category: string;
  itemsCount: number;
  totalValue: number;
  lastUpdated: string;
}

export interface GudangActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

export interface GudangProfileProps {
  profile: GudangProfileData;
  performance: GudangPerformance;
  gudangStats: GudangStats;
  inventory: GudangInventoryItem[];
  activities: GudangActivityItem[];
  isEditing: boolean;
  onProfileUpdate: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}