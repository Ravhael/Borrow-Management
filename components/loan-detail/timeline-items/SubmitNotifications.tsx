import React from 'react'
import {
  Typography,
  Box,
  Avatar,
  Chip,
  Paper,
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
  Email as EmailIcon,
} from '@mui/icons-material'
import { LoanData } from '../../../types/loanDetail'
import { getTimelineColor, getEarliestNotificationDate } from '../utils/timelineHelpers'
import NotificationDetails from '../NotificationDetails'

const getTimelineIcon = (type: string) => {
  switch (type) {
    case 'notification': return <EmailIcon />
    default: return <EmailIcon />
  }
}

interface SubmitNotificationsProps {
  loan: LoanData
}

const SubmitNotifications: React.FC<SubmitNotificationsProps> = ({ loan }) => {
  if (loan.isDraft || !loan.submitNotifications) {
    return null
  }

  return (
    <TimelineItem>
      <TimelineOppositeContent sx={{ m: 'auto 0' }}>
        <Typography variant="body2" color="text.secondary">
          {getEarliestNotificationDate(loan.submitNotifications!.companies)}
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
            <EmailIcon sx={{ mr: 1, color: getTimelineColor('notification') }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Email Notifikasi Pengajuan
            </Typography>
          </Box>
          {loan.company && loan.company.length > 0 && (
            <NotificationDetails
              notifications={loan.submitNotifications.companies}
              title="Company (Semua Role kecuali Warehouse)"
              filterRoles={(role) => role !== 'Warehouse'}
            />
          )}
          {loan.borrowerEmail && (
            <Box sx={{ mt: 2 }}>
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
        </Paper>
      </TimelineContent>
    </TimelineItem>
  )
}

export default SubmitNotifications