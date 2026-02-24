import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  Paper,
} from '@mui/material'
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab'
import {
  Close as CloseIcon,
  Assessment as AssessmentIcon,
  Done as DoneIcon,
} from '@mui/icons-material'
import { LoanData } from '../../types/loanDetail'
import { getOverallStatus, formatDate } from '../../utils/loanHelpers'
import LoanSubmission from './timeline-items/LoanSubmission'
import SubmitNotifications from './timeline-items/SubmitNotifications'
import ApprovalStatus from './timeline-items/ApprovalStatus'
import ApprovalNotifications from './timeline-items/ApprovalNotifications'
import ExtensionHistory from './timeline-items/ExtensionHistory'
import WarehouseStatus from './timeline-items/WarehouseStatus'
import ReminderNotifications from './timeline-items/ReminderNotifications'
import ReturnNotifications from './timeline-items/ReturnNotifications'
import CurrentStatus from './timeline-items/CurrentStatus'

interface HistoryModalProps {
  loan: LoanData
  isOpen: boolean
  onClose: () => void
}

const HistoryModal: React.FC<HistoryModalProps> = ({ loan, isOpen, onClose }) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
            <AssessmentIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
              Riwayat Pengajuan Peminjaman
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              ID: {loan.id} • Status: {getOverallStatus(loan)}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Timeline position="alternate">
            <LoanSubmission loan={loan} />
            <SubmitNotifications loan={loan} />
            <ApprovalStatus loan={loan} />
            <ApprovalNotifications loan={loan} />
            <WarehouseStatus loan={loan} />
            <ExtensionHistory loan={loan} />
            <ReturnNotifications loan={loan} />
            <ReminderNotifications loan={loan} />
            <CurrentStatus loan={loan} />











          </Timeline>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <DoneIcon sx={{ mr: 1, color: '#4caf50' }} />
            <Typography variant="body2" sx={{ color: '#666' }}>
              Riwayat lengkap pengajuan peminjaman
            </Typography>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default HistoryModal