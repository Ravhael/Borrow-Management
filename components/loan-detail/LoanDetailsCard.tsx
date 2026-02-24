import React from 'react'
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Divider,
  Zoom,
} from '@mui/material'
import { Assignment as AssignmentIcon } from '@mui/icons-material'
import LoanDetails from './LoanDetails'
import { LoanData } from '../../types/loanDetail'

interface LoanDetailsCardProps {
  loan: LoanData
  submitting: boolean
  onApprove: () => void
  onReject: () => void
  onWarehouseProcess: () => void
  onWarehouseReject: () => void
  onWarehouseReturn: () => void
  onSubmitDraft: () => void
  onShowHistory: () => void
  currentUserRole?: string | null
  currentUserCompanies?: string[]
  currentUserId?: string | null
  currentUserEmail?: string | null
}

const LoanDetailsCard: React.FC<LoanDetailsCardProps> = ({
  loan,
  submitting,
  onApprove,
  onReject,
  onWarehouseProcess,
  onWarehouseReject,
  onWarehouseReturn,
  onSubmitDraft,
  onShowHistory,
  currentUserRole,
  currentUserCompanies,
  currentUserId,
  currentUserEmail,
}) => {
  return (
    <Zoom in={true} style={{ transitionDelay: '300ms' }}>
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          border: '1px solid rgba(46, 125, 50, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #2e7d32, #4caf50)',
          }
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2, md: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
            <Avatar sx={{ bgcolor: '#2e7d32', mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 }, width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}>
              <AssignmentIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                Status Peminjaman
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                Ringkasan status dan tindakan terkait peminjaman
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />
            <LoanDetails
            loan={loan}
            submitting={submitting}
            onApprove={onApprove}
            onReject={onReject}
              currentUserRole={currentUserRole}
              currentUserCompanies={currentUserCompanies}
              currentUserId={currentUserId}
              currentUserEmail={currentUserEmail}
            onWarehouseProcess={onWarehouseProcess}
            onWarehouseReject={onWarehouseReject}
            onWarehouseReturn={onWarehouseReturn}
            onSubmitDraft={onSubmitDraft}
            onShowHistory={onShowHistory}
          />
        </CardContent>
      </Card>
    </Zoom>
  )
}

export default LoanDetailsCard