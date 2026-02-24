import React from 'react'
import Link from 'next/link'
import {
  Box,
  Typography,
  Button,
  Paper,
  Fade,
  Zoom,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Analytics as AnalyticsIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material'
import { loginTheme } from '../../themes/loginTheme' 

interface HeroHeaderSectionProps {
  lastResult: any
}

const HeroHeaderSection: React.FC<HeroHeaderSectionProps> = ({ lastResult }) => {
  return (
    <Fade in={true} timeout={800}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
          color: 'white',
          py: { xs: 6, md: 3 },
          px: { xs: 2, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.1,
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '1200px', mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ fontSize: { xs: 48, md: 64 }, mr: 3, opacity: 0.9 }} />
              <Box>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', md: '2.3rem' },
                    mb: 2,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Reminder Management Center
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 400,
                    fontSize: { xs: '1.25rem', md: '1.2rem' },
                    opacity: 0.9,
                    maxWidth: '600px',
                    lineHeight: 1.4,
                  }}
                >
                  Automate loan reminder notifications and ensure timely follow-ups across your organization
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Button
                component={Link}
                href="/admin/dashboard"
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                Back to Dashboard
              </Button>
            </Box>
          </Box>

          {/* Key Stats Row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(4, 1fr)'
              },
              gap: 3,
              mt: 4
            }}
          >
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <Paper
                sx={{
                  p: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  textAlign: 'center',
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 32, color: 'white', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5, fontSize: '1.5rem' }}>
                  Active
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  System Status
                </Typography>
              </Paper>
            </Zoom>

            <Zoom in={true} style={{ transitionDelay: '300ms' }}>
              <Paper
                sx={{
                  p: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  textAlign: 'center',
                }}
              >
                <SendIcon sx={{ fontSize: 32, color: 'secondary.light', mb: 1 }} />
                <Typography 
                  variant="h4" 
                  sx={{ fontWeight: 700, color: 'white', mb: 0.5, fontSize: '1.5rem' }}
                  suppressHydrationWarning
                >
                  {lastResult?.remindersSent || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Reminders Sent
                </Typography>
              </Paper>
            </Zoom>

            <Zoom in={true} style={{ transitionDelay: '400ms' }}>
              <Paper
                sx={{
                  p: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  textAlign: 'center',
                }}
              >
                <AnalyticsIcon sx={{ fontSize: 32, color: 'info.light', mb: 1 }} />
                <Typography 
                  variant="h4" 
                  sx={{ fontWeight: 700, color: 'white', mb: 0.5, fontSize: '1.5rem' }}
                  suppressHydrationWarning
                >
                  {lastResult?.loansChecked || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Loans Checked
                </Typography>
              </Paper>
            </Zoom>

            <Zoom in={true} style={{ transitionDelay: '500ms' }}>
              <Paper
                sx={{
                  p: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  textAlign: 'center',
                }}
              >
                <AccessTimeIcon sx={{ fontSize: 32, color: 'warning.light', mb: 1 }} />
                <Typography 
                  variant="h4" 
                  sx={{ fontWeight: 700, color: 'white', mb: 0.5, fontSize: '1.5rem' }}
                  suppressHydrationWarning
                >
                  {lastResult?.lastCheck ? new Date(lastResult.lastCheck).toLocaleTimeString() : '--:--'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Last Check
                </Typography>
              </Paper>
            </Zoom>
          </Box>
        </Box>
      </Box>
    </Fade>
  )
}

export default HeroHeaderSection