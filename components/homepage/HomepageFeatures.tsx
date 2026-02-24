import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  Chip,
  Stack,
  Avatar,
} from '@mui/material';
import Zoom from '@mui/material/Zoom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FlashIcon from '@mui/icons-material/FlashOn';
import InventoryIcon from '@mui/icons-material/Inventory';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import ShieldIcon from '@mui/icons-material/Shield';
import { HomepageFeaturesProps, Feature } from '../../types/homepage';

const HomepageFeatures: React.FC<HomepageFeaturesProps> = ({ features }) => {
  const theme = useTheme();

  const defaultFeatures: Feature[] = [
    {
      id: 'smart-loan-requests',
      title: 'Smart Loan Requests',
      description: 'Intelligent form validation and auto-completion reduce errors and speed up the application process.',
      icon: 'AssignmentIcon',
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
      delay: 600,
    },
    {
      id: 'real-time-processing',
      title: 'Real-Time Processing',
      description: 'Instant approval workflows and automated notifications keep everyone informed throughout the process.',
      icon: 'FlashIcon',
      gradient: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
      delay: 800,
    },
    {
      id: 'inventory-integration',
      title: 'Inventory Integration',
      description: 'Seamlessly connect loan approvals with warehouse inventory management and collateral tracking.',
      icon: 'InventoryIcon',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      delay: 1000,
    },
    {
      id: 'advanced-analytics',
      title: 'Advanced Analytics',
      description: 'Comprehensive reporting, usage analytics, and performance metrics to optimize your loan management processes and resource allocation.',
      icon: 'AnalyticsIcon',
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
      delay: 1200,
    },
    {
      id: 'enterprise-security',
      title: 'Enterprise Security',
      description: 'Bank-level security with role-based access control, audit trails, and compliance features to protect your sensitive business data.',
      icon: 'SecurityIcon',
      gradient: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
      delay: 1400,
    },
    {
      id: 'performance-insights',
      title: 'Performance Insights',
      description: 'AI-powered insights and recommendations to optimize approval times, reduce bottlenecks, and improve overall operational efficiency.',
      icon: 'TrendingUpIcon',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      delay: 1600,
    },
  ];

  const displayFeatures = features && features.length > 0 ? features : defaultFeatures;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'AssignmentIcon':
        return <AssignmentIcon sx={{ fontSize: 32, color: 'white' }} />;
      case 'FlashIcon':
        return <FlashIcon sx={{ fontSize: 32, color: 'white' }} />;
      case 'InventoryIcon':
        return <InventoryIcon sx={{ fontSize: 32, color: 'white' }} />;
      case 'AnalyticsIcon':
        return <AnalyticsIcon sx={{ fontSize: 32, color: 'white' }} />;
      case 'SecurityIcon':
        return <SecurityIcon sx={{ fontSize: 32, color: 'white' }} />;
      case 'TrendingUpIcon':
        return <TrendingUpIcon sx={{ fontSize: 32, color: 'white' }} />;
      default:
        return <AssignmentIcon sx={{ fontSize: 32, color: 'white' }} />;
    }
  };

  const getFeatureMetrics = (featureId: string) => {
    switch (featureId) {
      case 'smart-loan-requests':
        return { icon: <CheckCircleIcon />, value: '95%', label: 'Error Reduction' };
      case 'real-time-processing':
        return { icon: <SpeedIcon />, value: '< 5min', label: 'Approval Time' };
      case 'inventory-integration':
        return { icon: <InventoryIcon />, value: '100%', label: 'Sync Accuracy' };
      case 'advanced-analytics':
        return { icon: <AnalyticsIcon />, value: '24/7', label: 'Real-time Data' };
      case 'enterprise-security':
        return { icon: <ShieldIcon />, value: 'Bank-grade', label: 'Security Level' };
      case 'performance-insights':
        return { icon: <TrendingUpIcon />, value: 'AI-powered', label: 'Optimization' };
      default:
        return { icon: <CheckCircleIcon />, value: '100%', label: 'Efficiency' };
    }
  };

  const getFeatureBenefits = (featureId: string) => {
    switch (featureId) {
      case 'smart-loan-requests':
        return ['Auto-validation', 'Smart suggestions', 'Error prevention'];
      case 'real-time-processing':
        return ['Instant notifications', 'Live tracking', 'Automated workflows'];
      case 'inventory-integration':
        return ['Real-time sync', 'Automated updates', 'Collateral tracking'];
      case 'advanced-analytics':
        return ['Custom reports', 'Performance metrics', 'Data insights'];
      case 'enterprise-security':
        return ['Role-based access', 'Audit trails', 'Compliance ready'];
      case 'performance-insights':
        return ['AI recommendations', 'Bottleneck detection', 'Process optimization'];
      default:
        return [];
    }
  };

  return (
    <Box
      sx={{
        py: { xs: 10, md: 7 },
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[100]} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 70%, rgba(26, 54, 93, 0.04) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(0, 212, 170, 0.04) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 12 } }}>
          <Chip
            label="Core Capabilities"
            sx={{
              mb: 3,
              backgroundColor: 'rgba(26, 54, 93, 0.08)',
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 2,
              py: 1,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              mb: 4,
              fontWeight: 800,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            Powerful Features for Modern Loan Management
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              fontWeight: 400,
            }}
          >
            Everything you need to digitize and optimize your loan approval process,
            from initial application to final disbursement.
          </Typography>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={4}>
          {displayFeatures.map((feature) => {
            const metrics = getFeatureMetrics(feature.id);
            const benefits = getFeatureBenefits(feature.id);

            return (
              <Grid key={feature.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <Zoom in={true} timeout={feature.delay}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      borderRadius: 4,
                      border: `1px solid ${theme.palette.divider}`,
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(20px)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: feature.gradient,
                      },
                      '&:hover': {
                        transform: 'translateY(-12px) scale(1.02)',
                        boxShadow: `0 32px 64px rgba(0, 0, 0, 0.12), 0 0 0 1px ${theme.palette.primary.main}20`,
                        borderColor: `${theme.palette.primary.main}40`,
                        '& .feature-icon': {
                          transform: 'scale(1.1) rotate(5deg)',
                        },
                        '& .feature-metrics': {
                          transform: 'translateY(0)',
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 4, md: 5 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Icon and Metrics Section */}
                      <Box sx={{ mb: 4 }}>
                        <Avatar
                          className="feature-icon"
                          sx={{
                            width: 72,
                            height: 72,
                            mx: 'auto',
                            background: feature.gradient,
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                            transition: 'all 0.3s ease',
                            mb: 3,
                          }}
                        >
                          {getIcon(feature.icon)}
                        </Avatar>

                        {/* Metrics Badge */}
                        <Box
                          className="feature-metrics"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: `1px solid ${theme.palette.divider}`,
                            transform: 'translateY(10px)',
                            opacity: 0,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          }}
                        >
                          {metrics.icon}
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                            {metrics.value} {metrics.label}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Content Section */}
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          variant="h5"
                          sx={{
                            mb: 3,
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            color: theme.palette.text.primary,
                            lineHeight: 1.3,
                          }}
                        >
                          {feature.title}
                        </Typography>

                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{
                            mb: 4,
                            lineHeight: 1.7,
                            flex: 1,
                          }}
                        >
                          {feature.description}
                        </Typography>

                        {/* Benefits List */}
                        <Stack spacing={1.5} sx={{ mt: 'auto' }}>
                          {benefits.map((benefit, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <CheckCircleIcon
                                sx={{
                                  fontSize: 16,
                                  color: theme.palette.success.main,
                                  flexShrink: 0,
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  color: theme.palette.text.secondary,
                                  fontWeight: 500,
                                  fontSize: '0.875rem',
                                }}
                              >
                                {benefit}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default HomepageFeatures;