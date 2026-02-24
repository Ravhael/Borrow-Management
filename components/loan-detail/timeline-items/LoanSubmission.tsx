import React from 'react'
import {
  Typography,
  Box,
  Paper,
  Chip,
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
  Edit as EditIcon,
} from '@mui/icons-material'
import { LoanData } from '../../../types/loanDetail'
import { getTimelineColor, formatDate } from '../utils/timelineHelpers'
import { LOAN_LIFECYCLE } from '../../../types/loanStatus'
import { getNeedTypeLabel } from '../../../utils/needTypes'

const getTimelineIcon = (type: string) => {
  switch (type) {
    case 'submission': return <EditIcon />
    default: return <EditIcon />
  }
}

interface LoanSubmissionProps {
  loan: LoanData
}

const LoanSubmission: React.FC<LoanSubmissionProps> = ({ loan }) => {
  return (
    <TimelineItem>
      <TimelineOppositeContent sx={{ m: 'auto 0' }}>
        <Typography variant="body2" color="text.secondary">
          {formatDate(loan.submittedAt)}
        </Typography>
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineDot sx={{ bgcolor: getTimelineColor('submission') }}>
          {getTimelineIcon('submission')}
        </TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent sx={{ py: '12px', px: 2 }}>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'rgba(33, 150, 243, 0.04)',
            border: '1px solid rgba(33, 150, 243, 0.2)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EditIcon sx={{ mr: 1, color: getTimelineColor('submission') }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Pengajuan Dibuat
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>Peminjam:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{loan.borrowerName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>Entitas:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{loan.entitasId}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>Jenis Kebutuhan:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{getNeedTypeLabel(loan.needType)}</Typography>
              </Box>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>Company:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {Array.isArray(loan.company) ? loan.company.join(', ') : loan.company}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>Status Awal:</Typography>
                <Chip
                  label={loan.isDraft ? LOAN_LIFECYCLE.DRAFT : LOAN_LIFECYCLE.PENDING_APPROVAL}
                  color={loan.isDraft ? 'default' : 'warning'}
                  size="small"
                  variant="filled"
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </TimelineContent>
    </TimelineItem>
  )
}

export default LoanSubmission