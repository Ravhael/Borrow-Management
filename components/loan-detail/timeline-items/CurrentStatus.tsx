import React from 'react'
import {
  Typography,
  Box,
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
  Assessment as AssessmentIcon,
} from '@mui/icons-material'
import { LoanData } from '../../../types/loanDetail'
import { getTimelineColor, formatDate, getStatusColor } from '../utils/timelineHelpers'
import { getLoanStatus, getOverallStatus } from '../../../utils/loanHelpers'

const getTimelineIcon = (type: string) => {
  switch (type) {
    case 'current': return <AssessmentIcon />
    default: return <AssessmentIcon />
  }
}

interface CurrentStatusProps {
  loan: LoanData
}

const CurrentStatus: React.FC<CurrentStatusProps> = ({ loan }) => {
  const displayStatus = loan.loanStatus && loan.loanStatus.trim() ? getLoanStatus(loan) : getOverallStatus(loan)
  const chipColor = getStatusColor(getOverallStatus(loan)) as any

  return (
    <TimelineItem>
      <TimelineOppositeContent sx={{ m: 'auto 0' }}>
        <Typography variant="body2" color="text.secondary">
          {formatDate(new Date().toISOString())}
        </Typography>
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineDot sx={{ bgcolor: getTimelineColor('current') }}>
          {getTimelineIcon('current')}
        </TimelineDot>
      </TimelineSeparator>
      <TimelineContent sx={{ py: '12px', px: 2 }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
            color: 'white',
            border: '2px solid rgba(0, 188, 212, 0.3)'
          }}
        >
          <Box sx={{ color: 'black', display: 'flex', alignItems: 'center', mb: 2 }}>
            <AssessmentIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Status Saat Ini
            </Typography>
          </Box>
          <Box sx={{ color: 'black', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1">
              Status:
            </Typography>
            <Chip
              label={displayStatus}
              color={chipColor}
              variant="filled"
              sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
            />
          </Box>
        </Paper>
      </TimelineContent>
    </TimelineItem>
  )
}

export default CurrentStatus