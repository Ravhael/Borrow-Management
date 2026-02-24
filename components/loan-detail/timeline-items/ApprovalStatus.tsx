import React from 'react'
import {
  Typography,
  Box,
  Chip,
  Paper,
  Stack,
  Alert,
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
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { LoanData } from '../../../types/loanDetail'
import { getStatusColor, getTimelineColor, formatDate } from '../utils/timelineHelpers'
import { LOAN_LIFECYCLE } from '../../../types/loanStatus'

const getTimelineIcon = (type: string) => {
  switch (type) {
    case 'approval': return <CheckCircleIcon />
    default: return <CheckCircleIcon />
  }
}

interface ApprovalStatusProps {
  loan: LoanData
}

const ApprovalStatus: React.FC<ApprovalStatusProps> = ({ loan }) => {
  if (!loan.approvals?.companies || Object.keys(loan.approvals.companies).length === 0) {
    return null
  }

  return (
    <TimelineItem>
      <TimelineOppositeContent sx={{ m: 'auto 0' }}>
        <Typography variant="body2" color="text.secondary">
          {Object.values(loan.approvals.companies).some((a: any) => a.approvedAt) ?
            formatDate(Object.values(loan.approvals.companies).find((a: any) => a.approvedAt)?.approvedAt) :
            'Dalam Proses'}
        </Typography>
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineDot sx={{ bgcolor: getTimelineColor('approval') }}>
          {getTimelineIcon('approval')}
        </TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent sx={{ py: '12px', px: 2 }}>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'rgba(76, 175, 80, 0.04)',
            border: '1px solid rgba(76, 175, 80, 0.2)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircleIcon sx={{ mr: 1, color: getTimelineColor('approval') }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Status Approval
            </Typography>
          </Box>
          {/* Removed aggregated approval notes to avoid duplication — per-company notes are already rendered below */}

          <Stack spacing={2}>
            {Object.entries(loan.approvals.companies).map(([companyName, approval]: [string, any]) => (
              <Box key={companyName} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {companyName}
                  </Typography>
                  <Chip
                    label={
                      approval.approved === true ? LOAN_LIFECYCLE.APPROVED :
                      approval.approved === false && approval.rejectionReason ? LOAN_LIFECYCLE.REJECTED :
                      LOAN_LIFECYCLE.PENDING_APPROVAL
                    }
                    color={getStatusColor(
                      approval.approved === true ? LOAN_LIFECYCLE.APPROVED :
                      approval.approved === false && approval.rejectionReason ? LOAN_LIFECYCLE.REJECTED :
                      LOAN_LIFECYCLE.PENDING_APPROVAL
                    ) as any}
                    variant="filled"
                  />
                </Box>
                {approval.approvedBy && (
                  <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                    Oleh: {approval.approvedBy}
                  </Typography>
                )}
                {approval.approvedAt && (
                  <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                    Pada: {formatDate(approval.approvedAt)}
                  </Typography>
                )}
                {approval.rejectionReason && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Alasan Penolakan:</strong> {approval.rejectionReason}
                    </Typography>
                  </Alert>
                )}
                {approval.note && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Catatan:</strong> {approval.note}
                    </Typography>
                  </Alert>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      </TimelineContent>
    </TimelineItem>
  )
}

export default ApprovalStatus