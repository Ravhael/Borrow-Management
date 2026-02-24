import React from 'react'
import {
  Typography,
  Box,
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

interface ReturnNotificationsProps {
  loan: LoanData
}

const ReturnNotifications: React.FC<ReturnNotificationsProps> = ({ loan }) => {
  // If there are no returnNotifications, nothing to show
  if (!loan.returnNotifications) return null

  // combine entitas and companies to compute earliest date
  const merged = { ...(loan.returnNotifications.entitas || {}), ...(loan.returnNotifications.companies || {}) }

  return (
    <TimelineItem>
      <TimelineOppositeContent sx={{ m: 'auto 0' }}>
        <Typography variant="body2" color="text.secondary">
          {getEarliestNotificationDate(merged)}
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
          sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(255, 152, 0, 0.04)', border: '1px solid rgba(255, 152, 0, 0.2)' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EmailIcon sx={{ mr: 1, color: getTimelineColor('notification') }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Email Notifikasi Barang Sudah Dikembalikan
            </Typography>
          </Box>
          <Stack spacing={1}>
            {loan.returnNotifications.entitas && (
              <NotificationDetails
                notifications={{ [loan.entitasId]: loan.returnNotifications.entitas[loan.entitasId] }}
                title={`Entitas ${loan.entitasId}`}
              />
            )}
            {loan.company && loan.company.length > 0 && loan.returnNotifications.companies && (
              <NotificationDetails
                notifications={loan.returnNotifications.companies}
                title="Company (Semua Role)"
              />
            )}
          </Stack>
        </Paper>
      </TimelineContent>
    </TimelineItem>
  )
}

export default ReturnNotifications
