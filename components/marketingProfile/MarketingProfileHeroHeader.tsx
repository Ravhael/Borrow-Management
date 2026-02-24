import React from 'react';
import {
  Box,
  Button,
  Typography,
  Fade,
} from '@mui/material';
import Link from 'next/link';
import {
  Campaign as CampaignIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { loginTheme } from '../../themes/loginTheme' 
import { MarketingStatsData } from '../../types/marketingProfile';
import LoanStatCards from '../shared/LoanStatCards';
import { UserStats } from '../../types/userDashboard';

interface MarketingProfileHeroHeaderProps {
  marketingStats: MarketingStatsData;
  loanStats?: UserStats | null;
}

const MarketingProfileHeroHeader: React.FC<MarketingProfileHeroHeaderProps> = ({
  marketingStats: _marketingStats,
  loanStats
}) => {
  return (
    <Fade in={true} timeout={800}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
          color: 'white',
          py: { xs: 3, sm: 4, md: 6 },
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
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '1200px', mx: 'auto', px: { xs: 1, sm: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 2, sm: 3, md: 4 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CampaignIcon sx={{ fontSize: { xs: 28, sm: 36, md: 48 }, mr: { xs: 1.5, sm: 3 }, opacity: 0.9 }} />
              <Box>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.3rem', sm: '1.7rem', md: '2.3rem' },
                    mb: { xs: 1, sm: 2 },
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Marketing Profile
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 400,
                    fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.25rem' },
                    opacity: 0.9,
                    maxWidth: '600px',
                    lineHeight: 1.4,
                  }}
                >
                  Track your marketing performance, manage campaigns, and drive business growth through strategic initiatives.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Button
                component={Link}
                href="/form"
                variant="outlined"
                startIcon={<TrendingUpIcon />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                New Campaign
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: { xs: 3, sm: 4 } }}>
            <LoanStatCards stats={loanStats} animationDelay={600} />
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default MarketingProfileHeroHeader;