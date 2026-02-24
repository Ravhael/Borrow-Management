import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Grid,
  useTheme,
  Chip,
} from '@mui/material';
import Link from 'next/link';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import { HomepageHeroProps } from '../../types/homepage';
import { loginTheme } from '../../themes/loginTheme'

// Layout constants for better organization
const LAYOUT_CONFIG = {
  hero: {
    minHeight: { xs: '80vh', md: '75vh' },
    padding: { xs: 2, md: 4 },
  },
  content: {
    maxWidth: { xs: '100%', md: '90%', lg: '85%' },
    spacing: { xs: 2, md: 3 },
  },
  title: {
    fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem', lg: '3.5rem' },
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
    lineHeight: 1.6,
    maxWidth: { xs: '100%', md: '500px', lg: '600px' },
  },
} as const;

const HomepageHero: React.FC<HomepageHeroProps> = () => {
  const theme = useTheme();

  return (
    <Box
      component="section"
      sx={{
        minHeight: LAYOUT_CONFIG.hero.minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        px: LAYOUT_CONFIG.hero.padding,
        py: { xs: 4, md: 6 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 50%)
          `,
          animation: 'float 20s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '33%': { transform: 'translateY(-10px) rotate(1deg)' },
            '66%': { transform: 'translateY(10px) rotate(-1deg)' },
          },
        },
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, ${theme.palette.secondary.main} 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, ${theme.palette.secondary.main} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px, 40px 40px',
          backgroundPosition: '0 0, 30px 30px',
        }}
      />

      {/* Floating Decorative Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '8%',
          opacity: 0.08,
          transform: 'rotate(15deg) scale(0.8)',
          animation: 'gentleFloat 15s ease-in-out infinite',
        }}
      >
        <TrendingUpIcon sx={{ fontSize: { xs: 80, md: 120, lg: 140 } }} />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '6%',
          opacity: 0.08,
          transform: 'rotate(-12deg) scale(0.9)',
          animation: 'gentleFloat 18s ease-in-out infinite reverse',
        }}
      >
        <SecurityIcon sx={{ fontSize: { xs: 70, md: 100, lg: 120 } }} />
      </Box>

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <Box
            sx={{
              maxWidth: { xs: '100%', lg: '800px', xl: '900px' },
              width: '100%',
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              {/* Trust Indicators */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1.5, sm: 2 }}
                sx={{
                  mb: { xs: 3, md: 4 },
                  justifyContent: { xs: 'center', md: 'flex-start' }
                }}
              >
                <Chip
                  icon={<SpeedIcon />}
                  label="99.9% Uptime"
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(12px)',
                    borderWidth: 1.5,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    px: 1.5,
                    py: 0.75,
                    '& .MuiChip-icon': {
                      color: theme.palette.secondary.light,
                      fontSize: '1rem',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.18)',
                      borderColor: 'rgba(255, 255, 255, 0.6)',
                    },
                  }}
                />
                <Chip
                  icon={<SecurityIcon />}
                  label="Bank-Level Security"
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(12px)',
                    borderWidth: 1.5,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    px: 1.5,
                    py: 0.75,
                    '& .MuiChip-icon': {
                      color: theme.palette.secondary.light,
                      fontSize: '1rem',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.18)',
                      borderColor: 'rgba(255, 255, 255, 0.6)',
                    },
                  }}
                />
              </Stack>

              {/* Main Title */}
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  mb: { xs: 1.5, md: 2 },
                  fontWeight: 900,
                  fontSize: LAYOUT_CONFIG.title.fontSize,
                  lineHeight: LAYOUT_CONFIG.title.lineHeight,
                  letterSpacing: LAYOUT_CONFIG.title.letterSpacing,
                  color: 'white',
                  textShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  textAlign: { xs: 'center', md: 'left' },
                  '& span': {
                    background: `linear-gradient(135deg,
                      ${theme.palette.secondary.light} 0%,
                      #ffffff 50%,
                      ${theme.palette.secondary.light} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'block',
                    mt: 1,
                  },
                }}
              >
                Corporate System
                <span>Borrow Management</span>
              </Typography>

              {/* Subtitle */}
              <Typography
                variant="h6"
                component="p"
                sx={{
                  mb: { xs: 3, md: 4 },
                  opacity: 0.95,
                  fontSize: LAYOUT_CONFIG.subtitle.fontSize,
                  lineHeight: LAYOUT_CONFIG.subtitle.lineHeight,
                  color: 'white',
                  fontWeight: 400,
                  maxWidth: LAYOUT_CONFIG.subtitle.maxWidth,
                  textAlign: { xs: 'center', md: 'left' },
                  mx: { xs: 'auto', md: 0 },
                }}
              >
                Transform your borrow approval process with our comprehensive digital solution.
                From application to disbursement, manage everything in one unified platform
                with enterprise-grade security and real-time insights.
              </Typography>

              {/* Action Buttons */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 2.5, sm: 3 }}
                sx={{
                  mb: { xs: 3, md: 4 },
                  alignItems: { xs: 'stretch', sm: 'flex-start' },
                  maxWidth: { xs: '100%', sm: '400px', md: 'none' },
                  mx: { xs: 'auto', md: 0 },
                }}
              >
                <Link href="/login" passHref style={{ textDecoration: 'none', width: '100%' }}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{
                      backgroundColor: 'white',
                      color: theme.palette.primary.main,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      fontWeight: 700,
                      px: { xs: 3, md: 4 },
                      py: { xs: 1.75, md: 2 },
                      borderRadius: 2,
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
                      textTransform: 'none',
                      minHeight: { xs: 52, md: 56 },
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    Log In to Your Account
                  </Button>
                </Link>

                <Link href="/register" passHref style={{ textDecoration: 'none', width: '100%' }}>
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.6)',
                      borderWidth: 2,
                      color: 'white',
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      fontWeight: 700,
                      px: { xs: 3, md: 4 },
                      py: { xs: 1.75, md: 2 },
                      borderRadius: 2,
                      textTransform: 'none',
                      minHeight: { xs: 52, md: 56 },
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(8px)',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 40px rgba(255, 255, 255, 0.2)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    Register Now
                  </Button>
                </Link>
              </Stack>

              {/* Social Proof */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'center', md: 'flex-start' },
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  gap: { xs: 2, md: 3 },
                  flexWrap: 'wrap',
                  flexDirection: { xs: 'column', sm: 'row' },
                  textAlign: { xs: 'center', md: 'left' },
                }}
              >

              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HomepageHero;