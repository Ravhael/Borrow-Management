import { WAREHOUSE_STATUS } from '../types/loanStatus'

export type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'

export type ExtendStatusDisplay = {
  label: string
  color: ChipColor
  badgeCount?: number
  tooltip?: string
}

const normalizeValue = (value?: string | null) => (value ? String(value).trim().toLowerCase() : '')

const isInactiveLoanContext = (loan: any) => {
  const candidates = [
    normalizeValue(loan?.loanStatus),
    normalizeValue(loan?.warehouseStatus?.status),
    normalizeValue(loan?.returnStatus?.status)
  ].filter(Boolean)

  if (!candidates.length) return false

  return candidates.some(status => (
    status.includes('dikembali') ||
    status.includes('returned') ||
    status.includes('selesai') ||
    status.includes('complete') ||
    status.includes('cancel') ||
    status.includes('batal') ||
    status.includes('tolak') ||
    status.includes('reject')
  ))
}

export const getExtendStatusDisplay = (loan: any): ExtendStatusDisplay | null => {
  const extendRaw = loan?.extendStatus
  const entries = Array.isArray(extendRaw) ? extendRaw.filter(Boolean) : extendRaw ? [extendRaw] : []
  if (!entries.length || isInactiveLoanContext(loan)) return null

  const latest = entries[entries.length - 1]
  if (!latest) return null

  const normalizeApprove = normalizeValue(latest?.approveStatus)
  const rejectionCount = entries.reduce((count: number, entry: any) => (
    normalizeValue(entry?.approveStatus).includes('tolak') ? count + 1 : count
  ), 0)

  if (!normalizeApprove) {
    return {
      label: 'Perpanjang Diajukan',
      color: 'warning',
      tooltip: 'Permintaan perpanjangan sedang menunggu keputusan'
    }
  }

  if (normalizeApprove.includes('setuj')) {
    const approvedCount = entries.reduce((count: number, entry: any) => (
      normalizeValue(entry?.approveStatus).includes('setuj') ? count + 1 : count
    ), 0)
    const badgeValue = Math.max(approvedCount, 1)
    return {
      label: 'Diperpanjang',
      color: 'info',
      badgeCount: badgeValue,
      tooltip: badgeValue > 1 ? `${badgeValue}x permintaan perpanjangan disetujui` : 'Perpanjangan disetujui Marketing'
    }
  }

  if (normalizeApprove.includes('tolak')) {
    const badgeValue = Math.max(rejectionCount, 1)
    return {
      label: WAREHOUSE_STATUS.BORROWED,
      color: 'success',
      badgeCount: badgeValue,
      tooltip: badgeValue > 1
        ? `${badgeValue}x permintaan perpanjangan ditolak`
        : 'Permintaan perpanjangan ditolak'
    }
  }

  return null
}
