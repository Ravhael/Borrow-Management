import React from 'react'
import { Box, Paper, Typography, Zoom } from '@mui/material'
import {
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  FactCheck as FactCheckIcon
} from '@mui/icons-material'
import { UserStats } from '../../types/userDashboard'

const defaultStats: UserStats = {
  totalLoans: 0,
  activeLoans: 0,
  overdueLoans: 0,
  completedLoans: 0,
  totalFine: 0,
  pendingApprovals: 0,
  waitingApprovals: 0
}

const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value ?? 0)
const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
}).format(Math.max(0, value ?? 0))

export interface LoanStatCardsProps {
  stats?: UserStats | null
  animationDelay?: number
}

const LoanStatCards: React.FC<LoanStatCardsProps> = ({ stats, animationDelay = 200 }) => {
  const safeStats = stats ?? defaultStats
  const statCards = [
    {
      label: 'Total Pengajuan',
      caption: 'Seluruh permintaan',
      value: safeStats.totalLoans,
      formatter: formatNumber,
      icon: <AssessmentIcon style={{ fontSize: '1em' }} />
    },
    {
      label: 'Menunggu Approval',
      caption: 'Marketing/Gudang',
      value: safeStats.waitingApprovals ?? 0,
      formatter: formatNumber,
      icon: <FactCheckIcon style={{ fontSize: '1em' }} />
    },
    {
      label: 'Peminjaman Aktif',
      caption: 'Sedang berlangsung',
      value: safeStats.activeLoans,
      formatter: formatNumber,
      icon: <DashboardIcon style={{ fontSize: '1em' }} />
    },
    {
      label: 'Total Denda',
      caption: 'Akumulasi denda',
      value: safeStats.totalFine,
      formatter: formatCurrency,
      icon: <PaymentIcon style={{ fontSize: '1em' }} />
    },
    {
      label: 'Peminjaman Ditolak',
      caption: 'Permintaan ditolak',
      value: safeStats.rejectedLoans ?? 0,
      formatter: formatNumber,
      icon: <CancelIcon style={{ fontSize: '1em' }} />
    },
    {
      label: 'Peminjaman Selesai',
      caption: 'Sudah dikembalikan',
      value: safeStats.completedLoans,
      formatter: formatNumber,
      icon: <CheckCircleIcon style={{ fontSize: '1em' }} />
    },
    {
      label: 'Overdue Peminjaman',
      caption: 'Butuh perhatian',
      value: safeStats.overdueLoans,
      formatter: formatNumber,
      icon: <ScheduleIcon style={{ fontSize: '1em' }} />
    }
  ]

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(7, minmax(100px, 1fr))',
          sm: 'repeat(7, minmax(120px, 1fr))',
          md: 'repeat(7, minmax(140px, 1fr))',
          lg: 'repeat(7, minmax(160px, 1fr))'
        },
        gap: { xs: 1, sm: 2 },
        mt: { xs: 2, sm: 3 },
        width: '100%'
      }}
    >
      {statCards.map((card, index) => (
        <Zoom in={true} style={{ transitionDelay: `${animationDelay + index * 100}ms` }} key={card.label}>
          <Paper
            sx={{
              p: { xs: 0.8, sm: 1.2 },
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 1,
              textAlign: 'center',
              minHeight: { xs: 78, sm: 92 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ color: 'white', mb: 0.4, fontSize: { xs: 14, sm: 18 } }}>
              {card.icon}
            </Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: 'white', mb: 0.4, fontSize: { xs: '1rem', sm: '1.3rem' } }}
            >
              {card.formatter(card.value)}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.3, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
              {card.label}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
              {card.caption}
            </Typography>
          </Paper>
        </Zoom>
      ))}
    </Box>
  )
}

export default LoanStatCards
