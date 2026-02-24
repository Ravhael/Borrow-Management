import React from 'react';
import { Box, Typography, Fade } from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  WarningAmber as WarningAmberIcon,
  ReportProblem as ReportProblemIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { GudangHeroHeaderProps } from '../../types/gudangDashboard';
import { loginTheme } from '../../themes/loginTheme'
import StatCardsRow from '../shared/StatCardsRow';

const GudangHeroHeader: React.FC<GudangHeroHeaderProps> = ({ currentUser, stats }) => {
  const statCards = [
    {
      label: 'Total Pengajuan',
      caption: 'Seluruh permintaan',
      value: stats.totalLoans,
      icon: <AssessmentIcon />,
      accent: '#fef08a',
      delay: 200
    },
    {
      label: 'Peminjaman Aktif',
      caption: 'Sedang berlangsung',
      value: stats.activeLoans,
      icon: <DashboardIcon />,
      accent: '#c7d2fe',
      delay: 280
    },
    {
      label: 'Peminjaman Ditolak',
      caption: 'Permintaan ditolak',
      value: stats.totalRejected ?? 0,
      icon: <ReportProblemIcon />,
      accent: '#fecaca',
      delay: 320
    },
    {
      label: 'Peminjaman Terlambat',
      caption: 'Berpotensi denda',
      value: stats.overdueLoans,
      icon: <AccessTimeIcon />,
      accent: '#bae6fd',
      delay: 360
    },
    {
      label: 'Dikembalikan Lengkap',
      caption: 'Barang kembali utuh',
      value: stats.returnedComplete,
      icon: <AssignmentTurnedInIcon />,
      accent: '#bbf7d0',
      delay: 440
    },
    {
      label: 'Dikembalikan Tidak Lengkap',
      caption: 'Butuh verifikasi ulang',
      value: stats.returnedIncomplete,
      icon: <WarningAmberIcon />,
      accent: '#fed7aa',
      delay: 440
    },
    {
      label: 'Dikembalikan Rusak/Cacat',
      caption: 'Perlu tindakan khusus',
      value: stats.returnedDamaged,
      icon: <ReportProblemIcon />,
      accent: '#fecaca',
      delay: 600
    }
  ]

  return (
    <Fade in={true} timeout={800}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
          color: 'white',
          py: { xs: 6, md: 3 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.1,
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '1200px', mx: 'auto', px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DashboardIcon sx={{ fontSize: { xs: 40, md: 48 }, mr: 3, opacity: 0.9 }} />
              <Box>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '2.3rem' },
                    mb: 2,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Selamat Datang,
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 400,
                    fontSize: { xs: '1rem', md: '1.25rem' },
                    opacity: 0.9,
                    maxWidth: '600px',
                    lineHeight: 1.4,
                  }}
                >
                  Berikut adalah ringkasan peminjaman. Kelola dan pantau seluruh aktivitas peminjaman secara efektif dan terintegrasi.
                </Typography>
              </Box>
            </Box>
            
          </Box>

          {/* Key Stats Row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(7, minmax(90px, 1fr))',
                sm: 'repeat(7, minmax(100px, 1fr))',
                md: 'repeat(7, minmax(120px, 1fr))',
                lg: 'repeat(7, minmax(140px, 1fr))'
              },
              gap: 2,
              mt: 4,
              width: '100%'
            }}
          >
            <StatCardsRow cards={statCards} maxColumns={7} gap={2} />
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default GudangHeroHeader;