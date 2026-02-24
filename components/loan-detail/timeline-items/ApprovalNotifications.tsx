import React from 'react'
import {
  Typography,
  Box,
  Avatar,
  Chip,
  Paper,
  Stack,
} from '@mui/material'
import {
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab'
import {
  Send as SendIcon,
  Email as EmailIcon,
} from '@mui/icons-material'
import { LoanData } from '../../../types/loanDetail'
import { getLoanStatus } from '../../../utils/loanHelpers'
import { LOAN_LIFECYCLE } from '../../../types/loanStatus'
import { getTimelineColor, getEarliestNotificationDate } from '../utils/timelineHelpers'
import NotificationDetails from '../NotificationDetails'

const getTimelineIcon = (type: string) => {
  switch (type) {
    case 'notification': return <SendIcon />
    default: return <SendIcon />
  }
}

interface ApprovalNotificationsProps {
  loan: LoanData
}

const ApprovalNotifications: React.FC<ApprovalNotificationsProps> = ({ loan }) => {
  if (!loan.approvalNotifications || getLoanStatus(loan) === LOAN_LIFECYCLE.PENDING_APPROVAL) {
    return null
  }

  return (
    <TimelineItem>
      <TimelineOppositeContent sx={{ m: 'auto 0' }}>
        <Typography variant="body2" color="text.secondary">
          {getEarliestNotificationDate({ ...loan.approvalNotifications!.entitas, ...loan.approvalNotifications!.companies })}
        </Typography>
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineDot sx={{ bgcolor: getTimelineColor('notification') }}>
          {getTimelineIcon('notification')}
        </TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent sx={{ py: '12px', px: 2 }}>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'rgba(255, 152, 0, 0.04)',
            border: '1px solid rgba(255, 152, 0, 0.2)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SendIcon sx={{ mr: 1, color: getTimelineColor('notification') }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {/* Determine whether approval emails were for approvals or rejections by inspecting per-company approval results
                  This avoids relying on getLoanStatus which may reflect other lifecycle changes. */}
              {(() => {
                const approvals = loan.approvals?.companies || {}
                const anyRejected = Object.values(approvals).some((a: any) => a?.approved === false && a?.rejectionReason)
                return `Email Notifikasi ${anyRejected ? 'Penolakan' : 'Approval'}`
              })()}
            </Typography>
          </Box>
          <Stack spacing={1}>
            <NotificationDetails
              notifications={{ [loan.entitasId]: loan.approvalNotifications.entitas[loan.entitasId] }}
              title={`Entitas ${loan.entitasId}`}
            />
            {loan.company && loan.company.length > 0 && (
              <NotificationDetails
                notifications={loan.approvalNotifications.companies}
                title={`Company ${getLoanStatus(loan) === LOAN_LIFECYCLE.APPROVED ? 'Approval' : 'Approval'} Notifications`}
              />
            )}
            {loan.borrowerEmail && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
                  Email Peminjam:
                </Typography>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 1,
                  bgcolor: 'rgba(21, 101, 192, 0.02)',
                }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1.5, bgcolor: 'rgba(21, 101, 192, 0.1)' }}>
                    <EmailIcon sx={{ fontSize: '0.875rem', color: '#1565c0' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                      {loan.borrowerName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {loan.borrowerEmail}
                    </Typography>
                  </Box>
                  <Chip
                    label="Penerima Notifikasi"
                    color="info"
                    size="small"
                    variant="filled"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  />
                </Box>
              </Box>
            )}
          </Stack>
        </Paper>
      </TimelineContent>
    </TimelineItem>
  )
}

export default ApprovalNotifications