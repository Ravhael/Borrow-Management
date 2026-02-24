import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Stack,
  Paper,
  Zoom,
} from '@mui/material'
import {
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  HourglassEmpty as HourglassIcon,
  Today as TodayIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import { loginTheme } from '../../themes/loginTheme'

interface HeaderSectionProps {
  metrics: {
    total: number
    todaySubmissions: number
    urgent: number
  }
  onRefresh: () => void
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ metrics, onRefresh }) => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Section */}
      <Zoom in={true} timeout={800}>
        <Card
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
            color: 'white',
            borderRadius: 0,
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
          <Container maxWidth="lg">
            <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                <Box>
                  <AssessmentIcon sx={{ fontSize: { xs: 48, md: 64 }, mr: 3, opacity: 0.9 }} />
                  <Box>
                    <Typography
                      variant="h2"
                      component="h1"
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: '1.5rem', md: '2.2rem' },
                        mb: 2,
                        background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Persetujuan Peminjaman
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 400,
                        fontSize: { xs: '1.1rem', md: '1.2rem' },
                        opacity: 0.9,
                        maxWidth: '600px',
                        lineHeight: 1.4,
                      }}
                    >
                      Kelola dan proses persetujuan peminjaman yang memerlukan approval Marketing dengan efisien dan profesional.
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RefreshIcon />}
                  onClick={onRefresh}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    },
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  Refresh Data
                </Button>
              </Stack>

              {/* Key Stats Row */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)'
                  },
                  gap: { xs: 1.5, sm: 2, md: 3 },
                  mt: { xs: 2, sm: 3, md: 4 },
                }}
              >
                <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                  <Paper
                    sx={{
                      p: { xs: 1.5, sm: 2, md: 3 },
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 3,
                      textAlign: 'center',
                    }}
                  >
                    <HourglassIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 }, color: 'white', mb: { xs: 0.5, sm: 1 } }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5, fontSize: { xs: '1.3rem', sm: '1.7rem', md: '2.125rem' } }}>
                      {metrics.total}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                      Menunggu Approval
                    </Typography>
                  </Paper>
                </Zoom>

                <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                  <Paper
                    sx={{
                      p: { xs: 1.5, sm: 2, md: 3 },
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 3,
                      textAlign: 'center',
                    }}
                  >
                    <TodayIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 }, color: 'info.light', mb: { xs: 0.5, sm: 1 } }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5, fontSize: { xs: '1.3rem', sm: '1.7rem', md: '2.125rem' } }}>
                      {metrics.todaySubmissions}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                      Pengajuan Hari Ini
                    </Typography>
                  </Paper>
                </Zoom>

                <Zoom in={true} style={{ transitionDelay: '400ms' }}>
                  <Paper
                    sx={{
                      p: { xs: 1.5, sm: 2, md: 3 },
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 3,
                      textAlign: 'center',
                    }}
                  >
                    <CancelIcon sx={{ fontSize: { xs: 22, sm: 28, md: 32 }, color: 'error.light', mb: { xs: 0.5, sm: 1 } }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5, fontSize: { xs: '1.3rem', sm: '1.7rem', md: '2.125rem' } }}>
                      {metrics.urgent}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                      Urgent (≤3 hari)
                    </Typography>
                  </Paper>
                </Zoom>
              </Box>
            </CardContent>
          </Container>
        </Card>
      </Zoom>
    </Box>
  )
}

export default HeaderSection