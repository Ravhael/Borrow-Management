import React from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Paper,
  Typography,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Warehouse as WarehouseIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { loginTheme } from '../../themes/loginTheme' 
import { GudangStats } from '../../types/gudangProfile';
import LoanStatCards from '../shared/LoanStatCards';
import { UserStats } from '../../types/userDashboard';

interface GudangProfileHeroHeaderProps {
  gudangStats: GudangStats;
  loanStats?: UserStats | null;
}

const GudangProfileHeroHeader: React.FC<GudangProfileHeroHeaderProps> = ({ gudangStats: _gudangStats, loanStats }) => {
  return (
    <Fade in={true} timeout={800}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
          color: 'white',
          py: { xs: 3, md: 3 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'4\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.1,
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '1200px', mx: 'auto', px: { xs: 1, md: 4 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: { xs: 2, md: 4 }, gap: { xs: 1, sm: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WarehouseIcon sx={{ fontSize: { xs: 32, md: 48 }, mr: { xs: 2, md: 3 }, opacity: 0.9, color: 'white' }} />
              <Box>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.4rem', sm: '2rem', md: '2.3rem' },
                    mb: { xs: 1, md: 2 },
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Gudang Profile
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 400,
                    fontSize: { xs: '0.95rem', sm: '1rem', md: '1.25rem' },
                    opacity: 0.9,
                    maxWidth: { xs: '100%', sm: '600px' },
                    lineHeight: 1.4,
                  }}
                >
                  Manage warehouse operations, track inventory, and ensure efficient logistics and supply chain management.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: { xs: 3, sm: 4 } }}>
            <LoanStatCards stats={loanStats} />
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default GudangProfileHeroHeader;