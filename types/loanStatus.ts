// Centralized canonical status names used across the app for Loan lifecycle, approvals, warehouse.
// We keep the string values in Indonesian to preserve existing DB values and UI labels.

export const LOAN_LIFECYCLE = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Menunggu Approval',
  PARTIALLY_APPROVED: 'Sebagian Disetujui',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan'
} as const

export type LoanLifecycleStatus = typeof LOAN_LIFECYCLE[keyof typeof LOAN_LIFECYCLE]

export const WAREHOUSE_STATUS = {
  PENDING: 'Menunggu Gudang',
  PROCESSED: 'Diproses',
  BORROWED: 'Dipinjam',
  RETURNED: 'Dikembalikan',
  REJECTED: 'Ditolak Gudang'
} as const

export type WarehouseStatus = typeof WAREHOUSE_STATUS[keyof typeof WAREHOUSE_STATUS]

export const APPROVAL_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
} as const

export type ApprovalStatus = typeof APPROVAL_STATUS[keyof typeof APPROVAL_STATUS]

export const RETURN_STATUS_TOKENS = {
  FOLLOW_UP: 'return_followup'
} as const

export const CUSTOM_RETURN_STATUS = {
  FOLLOW_UP: 'Perlu Tindak Lanjut'
} as const

// Helpful mapping for UI labels / descriptions (Indonesian)
export const STATUS_DESCRIPTIONS: Record<string, string> = {
  [LOAN_LIFECYCLE.DRAFT]: 'Draft: Pengajuan belum diserahkan',
  [LOAN_LIFECYCLE.PENDING_APPROVAL]: 'Menunggu persetujuan dari pihak terkait',
  [LOAN_LIFECYCLE.PARTIALLY_APPROVED]: 'Sebagian disetujui — beberapa perusahaan belum menyetujui',
  [LOAN_LIFECYCLE.APPROVED]: 'Pengajuan disetujui oleh semua pihak',
  [LOAN_LIFECYCLE.REJECTED]: 'Pengajuan ditolak oleh salah satu pihak',
  [LOAN_LIFECYCLE.CANCELLED]: 'Pengajuan dibatalkan oleh pemohon atau admin',

  [WAREHOUSE_STATUS.PENDING]: 'Menunggu proses gudang',
  [WAREHOUSE_STATUS.PROCESSED]: 'Sedang diproses oleh gudang',
  [WAREHOUSE_STATUS.BORROWED]: 'Barang sedang dipinjam',
  [WAREHOUSE_STATUS.RETURNED]: 'Barang telah dikembalikan',
  [WAREHOUSE_STATUS.REJECTED]: 'Ditolak oleh gudang',
  [CUSTOM_RETURN_STATUS.FOLLOW_UP]: 'Barang dikembalikan namun membutuhkan tindak lanjut gudang'
}

export default {
  LOAN_LIFECYCLE,
  WAREHOUSE_STATUS,
  APPROVAL_STATUS,
  STATUS_DESCRIPTIONS,
  RETURN_STATUS_TOKENS,
  CUSTOM_RETURN_STATUS
}
