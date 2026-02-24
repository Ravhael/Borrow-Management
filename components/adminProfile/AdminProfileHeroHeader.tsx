import React from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { loginTheme } from '../../themes/loginTheme' 

const AdminProfileHeroHeader: React.FC = () => {
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
              <PersonIcon sx={{ fontSize: { xs: 40, md: 48 }, mr: 3, opacity: 0.9 }} />
              <Box>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    mb: 2,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Superadmin Profile
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 400,
                    fontSize: { xs: '1rem', md: '1.25rem' },
                    opacity: 0.9,
                    maxWidth: '600px',
                    lineHeight: 1.4,
                  }}
                >
                  Manage your account information and security settings with our comprehensive admin dashboard.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Button
                href="/admin/dashboard"
                variant="outlined"
                startIcon={<SecurityIcon />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                Admin Dashboard
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
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  textAlign: 'center',
                }}
              >
                <Box sx={{ color: 'white', mb: 1, fontSize: 24 }}>
                  <PersonIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5, fontSize: '0.9rem' }}>
                  Profile
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.7rem' }}>
                  Management
                </Typography>
              </Paper>
            </Zoom>

            <Zoom in={true} style={{ transitionDelay: '300ms' }}>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  textAlign: 'center',
                }}
              >
                <Box sx={{ color: 'white', mb: 1, fontSize: 24 }}>
                  <SecurityIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5, fontSize: '0.9rem' }}>
                  Security
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.7rem' }}>
                  Settings
                </Typography>
              </Paper>
            </Zoom>

            <Zoom in={true} style={{ transitionDelay: '400ms' }}>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  textAlign: 'center',
                }}
              >
                <Box sx={{ color: 'warning.light', mb: 1, fontSize: 24 }}>
                  <HistoryIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5, fontSize: '0.9rem' }}>
                  Activity
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.7rem' }}>
                  Monitoring
                </Typography>
              </Paper>
            </Zoom>

            <Zoom in={true} style={{ transitionDelay: '500ms' }}>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  textAlign: 'center',
                }}
              >
                <Box sx={{ color: 'info.light', mb: 1, fontSize: 24 }}>
                  <EditIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5, fontSize: '0.9rem' }}>
                  Account
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.7rem' }}>
                  Control
                </Typography>
              </Paper>
            </Zoom>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default AdminProfileHeroHeader;