import { PickupMethod } from '../utils/pickupMethods'

export interface LoanData {
  id: string
  submittedAt: string
  borrowerName: string
  entitasId: string
  borrowerPhone: string
  borrowerEmail?: string
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
  lainnya?: string
  needDetails?: Record<string, any>
  approvals?: {
    companies: Record<string, {
      approved: boolean;
      approvedBy?: string;
      approvedAt?: string;
      rejectionReason?: string;
      note?: string;
    }>;
  }
  submitNotifications?: {
    companies: Record<string, Record<string, {
      sent: boolean;
      sentAt?: string;
      email: string;
    }>>;
  };
  approvalNotifications?: {
    entitas: Record<string, Record<string, {
      sent: boolean;
      sentAt?: string;
      email: string;
    }>>;
    companies: Record<string, Record<string, {
      sent: boolean;
      sentAt?: string;
      email: string;
    }>>;
    borrower?: {
      sent: boolean;
      sentAt?: string;
      email: string;
    };
  };
  returnNotifications?: {
    entitas: Record<string, Record<string, {
      sent: boolean;
      sentAt?: string;
      email: string;
    }>>;
    companies: Record<string, Record<string, {
      sent: boolean;
      sentAt?: string;
      email: string;
    }>>;
    borrower?: {
      sent: boolean;
      sentAt?: string;
      email: string;
    };
  };
  // extension notifications were previously stored as a single object
  // with entitas/companies/borrower keys. We are migrating to a new
  // structured array containing two distinct objects:
  // - extendSubmitNotifications: { companies: { <company>: { Admin, Marketing } } }
  // - extendApproveNotifications: { entitas, companies, borrower }
  // To remain backwards compatible, allow either the legacy object shape
  // OR the new array/object shape.
  // allow either legacy object shape OR the new array shape (unspecified entries)
  extendNotification?: any[] | {
    entitas?: Record<string, Record<string, { sent: boolean; sentAt?: string; email: string }>>;
    companies?: Record<string, Record<string, { sent: boolean; sentAt?: string; email: string }>>;
    borrower?: { sent: boolean; sentAt?: string; email: string } | null;
  };
  // notification details per reminder period are now nested inside reminderStatus[<key>].notifications
  reminderStatus?: {
    [key: string]: {
      sent: boolean;
      sentAt?: string;
      type: string;
      notifications?: {
        borrower?: {
          sent: boolean;
          sentAt?: string;
          email: string;
        };
        entitas?: Record<string, Record<string, {
          sent: boolean;
          sentAt?: string;
          email: string;
        }>>;
        companies?: Record<string, Record<string, {
          sent: boolean;
          sentAt?: string;
          email: string;
        }>>;
      };
    };
  };
  warehouseStatus?: {
    status: string;
    processedAt?: string;
    processedBy?: string;
    rejectionReason?: string;
    returnedAt?: string;
    returnedBy?: string;
    note?: string;
  };
  // optional structured returnStatus introduced to record return processing results
  returnStatus?: {
    status: string;
    previousStatus?: string;
    note?: string;
    processedAt?: string;
    processedBy?: string;
    photoResults?: { filename: string; url: string }[];
  };

  // history of borrower-submitted return requests saved as JSON on the loan
  // each entry captures who requested the return, optional photos, and processing state
  returnRequest?: Array<{
    id: string;
    requestedAt: string; // ISO string
    requestedBy?: string | null;
    note?: string | null;
    photoResults?: { filename: string; url: string }[];
    // lifecycle status for the request. Common values used by APIs/UI: 'submitted', 'approved', 'rejected', 'confirmed'
    status?: 'submitted' | 'approved' | 'rejected' | 'confirmed' | string | null;
    // when an admin processed the request these can be set
    processedAt?: string | null; // ISO
    processedBy?: string | null;
    processedNote?: string | null;
  }>;
  // extension processing mirrors returnStatus — used to capture extension handling results
  // NOTE: processedAt/processedBy replaced with requestAt/requestBy
  // extendStatus now stores an array of requests — each element is an extend request object
  extendStatus?: Array<{
    note?: string;
    // optional original requested return date (date-only string 'YYYY-MM-DD')
    requestedReturnDate?: string | null;
    requestAt?: string | null;
    requestBy?: string | null;
    reqStatus?: string | null; // e.g. 'Diminta Perpanjangan'
    photoResults?: { filename: string; url: string }[];
    approveAt?: string | null;
    approveBy?: string | null;
    approveNote?: string | null; // note added by approver when approving/rejecting
    approveStatus?: string | null; // e.g. 'approved' / 'rejected' / ''
  }>;
  previousStatus?: string | null;
  userId?: string;
  // optional explicit status from DB
  loanStatus?: string;
  totalDenda?: {
    daysOverdue?: number;
    fineAmount?: number;
    updatedAt?: string | null;
  } | null;
}