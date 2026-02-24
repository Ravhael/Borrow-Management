import { LOAN_LIFECYCLE, WAREHOUSE_STATUS } from '../../../types/loanStatus'

export const getStatusColor = (status: string) => {
  switch (status) {
    case LOAN_LIFECYCLE.APPROVED:
    case WAREHOUSE_STATUS.BORROWED:
    case WAREHOUSE_STATUS.RETURNED:
      return 'success'
    case LOAN_LIFECYCLE.REJECTED:
    case WAREHOUSE_STATUS.REJECTED:
      return 'error'
    case LOAN_LIFECYCLE.PENDING_APPROVAL:
    case WAREHOUSE_STATUS.PROCESSED:
      return 'warning'
    default:
      return 'default'
  }
}

export const getTimelineColor = (type: string) => {
  switch (type) {
    case 'submission': return '#2196f3'
    case 'extension': return '#1976d2'
    case 'notification': return '#ff9800'
    case 'approval': return '#4caf50'
    case 'warehouse': return '#9c27b0'
    case 'reminder': return '#4caf50'
    case 'current': return '#00bcd4'
    default: return '#757575'
  }
}

export const getEarliestNotificationDate = (notifications: any) => {
  let earliestDate: string | null = null
  Object.values(notifications).forEach((entityNotifications: any) => {
    Object.values(entityNotifications).forEach((roleNotifications: any) => {
      Object.values(roleNotifications).forEach((notification: any) => {
        if (notification.sent && notification.sentAt && (!earliestDate || notification.sentAt < earliestDate)) {
          earliestDate = notification.sentAt
        }
      })
    })
  })
  return earliestDate ? formatDate(earliestDate) : 'Dalam Proses'
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}