import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Fade,
  Grid,
} from '@mui/material'
import {
  MailOutline as MailOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'

interface MetricsDashboardSectionProps {
  emailTemplates: any[]
  notificationSettings: any
}

const MetricsDashboardSection: React.FC<MetricsDashboardSectionProps> = ({
  emailTemplates,
  notificationSettings
}) => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Fade in={true} timeout={1000}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: 4,
              color: 'text.primary'
            }}
          >
            System Overview
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <MailOutlineIcon sx={{ fontSize: 22, color: 'white' }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, fontSize: '2.0rem' }}>
                    {emailTemplates.filter(t => t.isActive).length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Active Templates
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 22, color: 'white' }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, fontSize: '2.0rem' }}>
                    {Object.values(notificationSettings).filter(Boolean).length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Enabled Notifications
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <AssessmentIcon sx={{ fontSize: 22, color: 'white' }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, fontSize: '2.0rem' }}>
                    98.5%
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Delivery Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <SecurityIcon sx={{ fontSize: 22, color: 'white' }} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, fontSize: '2.0rem' }}>
                    Secure
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Connection Status
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Container>
  )
}

export default MetricsDashboardSection