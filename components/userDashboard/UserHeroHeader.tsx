import React from 'react';
import {
  Box,
  Typography,
  Fade
} from '@mui/material';
import { Dashboard as DashboardIcon } from '@mui/icons-material'
import { UserHeroHeaderProps } from '../../types/userDashboard';
import { loginTheme } from '../../themes/loginTheme'
import LoanStatCards from '../shared/LoanStatCards'
const UserHeroHeader: React.FC<UserHeroHeaderProps> = ({ currentUser, stats }) => {
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
                    fontSize: { xs: '1.5rem', md: '2.5rem' },
                    mb: 2,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Halo, {currentUser?.name ?? currentUser?.email ?? 'there'}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 400,
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    opacity: 0.9,
                    maxWidth: '600px',
                    lineHeight: 1.4,
                  }}
                >
                  Berikut adalah ringkasan permintaan peminjaman dan aktivitas Anda. Pantau status peminjaman dan kelola barang yang sedang atau pernah Anda pinjam.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Key Stats Row */}
          <LoanStatCards stats={stats} />
        </Box>
      </Box>
    </Fade>
  );
};

export default UserHeroHeader;