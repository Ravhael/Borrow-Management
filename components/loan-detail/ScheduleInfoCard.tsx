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
import { AccessTime as AccessTimeIcon } from '@mui/icons-material'
import ScheduleInfo from './ScheduleInfo'
import { getDurationInfo, getEffectiveReturnDate } from '../../utils/loanHelpers'
import { LoanData } from '../../types/loanDetail'

interface ScheduleInfoCardProps {
  loan: LoanData
  currentUserRole?: string | null
  currentUserCompanies?: string[]
}

const ScheduleInfoCard: React.FC<ScheduleInfoCardProps> = ({ loan, currentUserRole, currentUserCompanies }) => {
  return (
    <Zoom in={true} style={{ transitionDelay: '400ms' }}>
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          border: '1px solid rgba(237, 108, 2, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #ed6c02, #ff9800)',
          }
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2, md: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
            <Avatar sx={{ bgcolor: '#ed6c02', mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 }, width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}>
              <AccessTimeIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
            </Avatar>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                  Jadwal & Waktu
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                  Timeline peminjaman barang
                </Typography>
              </Box>

              {/* show duration next to the schedule title */}
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}>
                <Typography variant="caption" sx={{ color: '#666', display: 'block', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>Durasi Peminjaman</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                  {(() => {
                    const startCandidate = loan.useDate || loan.outDate
                    if (!startCandidate) return 'N/A'
                    const effectiveEnd = getEffectiveReturnDate(loan as any)
                    const info = getDurationInfo(startCandidate, effectiveEnd ?? loan.returnDate)
                    return info?.label ?? 'N/A'
                  })()}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Divider sx={{ mb: { xs: 2, sm: 3 } }} />
          <ScheduleInfo loan={loan} currentUserRole={currentUserRole} currentUserCompanies={currentUserCompanies} />
        </CardContent>
      </Card>
    </Zoom>
  )
}

export default ScheduleInfoCard