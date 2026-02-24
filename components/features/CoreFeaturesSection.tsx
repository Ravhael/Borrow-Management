import React from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Chip,
  Stack,
  Zoom,
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import SpeedIcon from '@mui/icons-material/Speed'
import InventoryIcon from '@mui/icons-material/Inventory'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import SecurityIcon from '@mui/icons-material/Security'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { featuresTheme } from '../../themes/featuresTheme'

export default function CoreFeaturesSection() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: 'white' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip
            label="Core Capabilities"
            sx={{
              mb: 3,
              backgroundColor: featuresTheme.palette.primary.main,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 2,
              py: 1,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              mb: 3,
              fontWeight: 700,
              color: featuresTheme.palette.primary.main
            }}
          >
            Everything You Need for Enterprise Loan Management
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 700, mx: 'auto' }}
          >
            Comprehensive tools designed to streamline every aspect of your loan management workflow
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Smart Loan Requests */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Zoom in={true} timeout={800}>
              <Card
                elevation={4}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                <CardContent sx={{ p: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${featuresTheme.palette.primary.main} 0%, ${featuresTheme.palette.primary.light} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                      }}
                    >
                      <AssignmentIcon sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
                        Smart Loan Requests
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Intelligent form processing with auto-validation
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                    Experience the future of loan request submissions with our intelligent forms that feature
                    real-time validation, auto-save functionality, and guided workflows. Our smart system
                    prevents errors, suggests optimal loan amounts, and ensures all required documentation
                    is properly attached before submission.
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip label="Auto-Validation" size="small" color="primary" variant="outlined" />
                    <Chip label="Auto-Save" size="small" color="primary" variant="outlined" />
                    <Chip label="Guided Workflow" size="small" color="primary" variant="outlined" />
                    <Chip label="Document Upload" size="small" color="primary" variant="outlined" />
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Real-Time Processing */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Zoom in={true} timeout={1000}>
              <Card
                elevation={4}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                <CardContent sx={{ p: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${featuresTheme.palette.secondary.main} 0%, ${featuresTheme.palette.secondary.light} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                      }}
                    >
                      <SpeedIcon sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
                        Real-Time Processing
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Instant notifications and live status updates
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                    Stay informed with our real-time processing engine that provides instant notifications,
                    automated approval workflows, and live status updates. Never miss a deadline or approval
                    with our intelligent notification system that adapts to your communication preferences.
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip label="Instant Notifications" size="small" color="secondary" variant="outlined" />
                    <Chip label="Live Updates" size="small" color="secondary" variant="outlined" />
                    <Chip label="Auto-Workflows" size="small" color="secondary" variant="outlined" />
                    <Chip label="Multi-Channel" size="small" color="secondary" variant="outlined" />
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Inventory Integration */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Zoom in={true} timeout={1200}>
              <Card
                elevation={4}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                <CardContent sx={{ p: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                      }}
                    >
                      <InventoryIcon sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
                        Inventory Integration
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Seamless warehouse system connectivity
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                    Connect seamlessly with your existing warehouse management systems. Our intelligent
                    integration automatically checks inventory availability, updates stock levels in real-time,
                    and prevents over-loaning of scarce resources. Full API support for custom integrations.
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip label="Real-Time Sync" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                    <Chip label="Auto-Updates" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                    <Chip label="API Integration" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                    <Chip label="Availability Check" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Advanced Analytics */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Zoom in={true} timeout={1400}>
              <Card
                elevation={4}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                <CardContent sx={{ p: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${featuresTheme.palette.primary.main} 0%, ${featuresTheme.palette.primary.light} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                      }}
                    >
                      <AnalyticsIcon sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
                        Advanced Analytics
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Comprehensive reporting and performance insights
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                    Gain deep insights into your loan management performance with comprehensive analytics,
                    custom reports, and predictive analytics. Track approval times, identify bottlenecks,
                    and optimize resource allocation with data-driven decision making.
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip label="Custom Reports" size="small" color="primary" variant="outlined" />
                    <Chip label="Performance Metrics" size="small" color="primary" variant="outlined" />
                    <Chip label="Predictive Analytics" size="small" color="primary" variant="outlined" />
                    <Chip label="Data Export" size="small" color="primary" variant="outlined" />
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Enterprise Security */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Zoom in={true} timeout={1600}>
              <Card
                elevation={4}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                <CardContent sx={{ p: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${featuresTheme.palette.secondary.main} 0%, ${featuresTheme.palette.secondary.light} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                      }}
                    >
                      <SecurityIcon sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
                        Enterprise Security
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bank-level security and compliance features
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                    Protect your sensitive business data with bank-level security features including
                    end-to-end encryption, role-based access control, comprehensive audit trails,
                    and full compliance with industry standards like GDPR and SOC 2.
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip label="End-to-End Encryption" size="small" color="secondary" variant="outlined" />
                    <Chip label="Role-Based Access" size="small" color="secondary" variant="outlined" />
                    <Chip label="Audit Trails" size="small" color="secondary" variant="outlined" />
                    <Chip label="GDPR Compliant" size="small" color="secondary" variant="outlined" />
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Performance Insights */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Zoom in={true} timeout={1800}>
              <Card
                elevation={4}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                <CardContent sx={{ p: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                      }}
                    >
                      <TrendingUpIcon sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
                        Performance Insights
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        AI-powered optimization and recommendations
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                    Leverage AI-powered insights to optimize your loan management processes. Our intelligent
                    system analyzes patterns, predicts bottlenecks, and provides actionable recommendations
                    to improve approval times, reduce costs, and enhance overall operational efficiency.
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip label="AI-Powered" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                    <Chip label="Predictive Analytics" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                    <Chip label="Process Optimization" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                    <Chip label="Smart Recommendations" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}