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
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import { HomepageUserRolesProps, UserRole } from '../../types/homepage';

const HomepageUserRoles: React.FC<HomepageUserRolesProps> = ({ roles }) => {
  const theme = useTheme();

  const defaultRoles: UserRole[] = [
    {
      id: 'loan-requestors',
      title: 'Loan Requestors',
      description: 'Submit loan applications quickly and track progress in real-time with our intuitive dashboard designed for borrowers.',
      icon: 'PersonIcon',
      color: theme.palette.primary.main,
    },
    {
      id: 'marketing-teams',
      title: 'Marketing Teams',
      description: 'Manage customer relationships and drive loan conversions with integrated CRM tools and marketing automation.',
      icon: 'BusinessIcon',
      color: theme.palette.secondary.main,
    },
    {
      id: 'warehouse-ops',
      title: 'Warehouse Operations',
      description: 'Streamline inventory management and loan collateral processing with automated workflows and real-time tracking.',
      icon: 'WarehouseIcon',
      color: '#f59e0b',
    },
  ];

  const displayRoles = roles && roles.length > 0 ? roles : defaultRoles;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'PersonIcon':
        return <PersonIcon sx={{ fontSize: 32, color: 'white' }} />;
      case 'BusinessIcon':
        return <BusinessIcon sx={{ fontSize: 32, color: 'white' }} />;
      case 'WarehouseIcon':
        return <WarehouseIcon sx={{ fontSize: 32, color: 'white' }} />;
      default:
        return <PersonIcon sx={{ fontSize: 32, color: 'white' }} />;
    }
  };

  const getRoleFeatures = (roleId: string) => {
    switch (roleId) {
      case 'loan-requestors':
        return [
          'Real-time application tracking',
          'Mobile-friendly interface',
          'Instant approval notifications'
        ];
      case 'marketing-teams':
        return [
          'CRM integration',
          'Automated campaigns',
          'Performance analytics'
        ];
      case 'warehouse-ops':
        return [
          'Inventory automation',
          'Real-time tracking',
          'Process optimization'
        ];
      default:
        return [];
    }
  };

  const getRoleStats = (roleId: string) => {
    switch (roleId) {
      case 'loan-requestors':
        return { icon: <TrendingUpIcon />, value: '85%', label: 'Faster Processing' };
      case 'marketing-teams':
        return { icon: <CheckCircleIcon />, value: '3x', label: 'Lead Conversion' };
      case 'warehouse-ops':
        return { icon: <InventoryIcon />, value: '99%', label: 'Accuracy Rate' };
      default:
        return { icon: <CheckCircleIcon />, value: '100%', label: 'Satisfaction' };
    }
  };

  return (
    <Box
      sx={{
        py: { xs: 5, md: 7 },
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(26, 54, 93, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 212, 170, 0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 12 } }}>
          <Chip
            label="Multi-Role Platform"
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
            Built for Every Role
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              fontWeight: 400,
            }}
          >
            Our platform adapts to your workflow, whether you&apos;re requesting loans,
            managing marketing campaigns, or overseeing warehouse operations.
          </Typography>
        </Box>

        {/* Roles Grid */}
        <Grid container spacing={4}>
          {displayRoles.map((role, index) => {
            const features = getRoleFeatures(role.id);
            const stats = getRoleStats(role.id);

            return (
              <Grid key={role.id} size={{ xs: 12, md: 4 }}>
                <Zoom in={true} timeout={600 + index * 200}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      borderRadius: 4,
                      border: `1px solid ${theme.palette.divider}`,
                      background: 'rgba(255, 255, 255, 0.8)',
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
                        background: `linear-gradient(90deg, ${role.color} 0%, ${role.color}80 100%)`,
                      },
                      '&:hover': {
                        transform: 'translateY(-12px) scale(1.02)',
                        boxShadow: `0 32px 64px rgba(0, 0, 0, 0.12), 0 0 0 1px ${role.color}20`,
                        borderColor: `${role.color}40`,
                        '& .role-icon': {
                          transform: 'scale(1.1) rotate(5deg)',
                        },
                        '& .role-stats': {
                          transform: 'translateY(0)',
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 4, md: 5 }, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Icon Section */}
                      <Box sx={{ mb: 4 }}>
                        <Avatar
                          className="role-icon"
                          sx={{
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            background: `linear-gradient(135deg, ${role.color} 0%, ${role.color}dd 100%)`,
                            boxShadow: `0 8px 24px ${role.color}30`,
                            transition: 'all 0.3s ease',
                            mb: 3,
                          }}
                        >
                          {getIcon(role.icon)}
                        </Avatar>

                        {/* Stats Badge */}
                        <Box
                          className="role-stats"
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
                          {stats.icon}
                          <Typography variant="body2" sx={{ fontWeight: 600, color: role.color }}>
                            {stats.value} {stats.label}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Content Section */}
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          variant="h4"
                          sx={{
                            mb: 3,
                            fontWeight: 700,
                            fontSize: '1.5rem',
                            color: theme.palette.text.primary,
                          }}
                        >
                          {role.title}
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
                          {role.description}
                        </Typography>

                        {/* Features List */}
                        <Stack spacing={1.5} sx={{ mt: 'auto' }}>
                          {features.map((feature, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <CheckCircleIcon
                                sx={{
                                  fontSize: 18,
                                  color: role.color,
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
                                {feature}
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

export default HomepageUserRoles;