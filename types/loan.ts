import { PickupMethod } from '../utils/pickupMethods'

export interface LoanData {
  id: string
  submittedAt: string
  borrowerName: string
  entitasId: string
  borrowerPhone: string
  needType: string
  company: string[]
  outDate: string
  useDate: string
  returnDate: string
  productDetailsText: string
  pickupMethod: PickupMethod
  note: string
  approvalAgreementFlag: boolean
  isDraft: boolean
  approvals?: {
    companies: Record<string, {
      approved: boolean;
      approvedBy?: string;
      approvedAt?: string;
      rejectionReason?: string;
      note?: string; // additional per-company note/catatan
    }>;
  }
  warehouseStatus?: {
    status: string;
    processedAt?: string;
    processedBy?: string;
    rejectionReason?: string;
    returnedAt?: string;
    returnedBy?: string;
    note?: string;
    returnStatus?: {
      status: string;
      previousStatus?: string;
      note?: string;
      processedAt?: string;
      processedBy?: string;
      photoResults?: { filename: string; url: string }[];
    };
  };
  // Optional explicit status stored in the DB (new column 'loanStatus')
  loanStatus?: string
  userId?: string
  totalDenda?: {
    daysOverdue?: number
    fineAmount?: number
    updatedAt?: string
  } | null
}

export interface LoanMetrics {
  total: number
  draft: number
  pending: number
  approved: number
  rejected: number
  borrowed: number
  returned: number
}