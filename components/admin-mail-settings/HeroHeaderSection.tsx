import React from 'react'
import {
  Box,
  Typography,
  Avatar,
  Container,
  Fade,
} from '@mui/material'
import {
  Email as EmailIcon,
} from '@mui/icons-material'
import { loginTheme } from '../../themes/loginTheme' 

const HeroHeaderSection: React.FC = () => {
  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
        color: 'white',
        py: { xs: 6, md: 8 },
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
        }
      }}
    >
      <Container maxWidth="lg">
        <Fade in={true} timeout={800}>
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  width: { xs: 80, md: 100 },
                  height: { xs: 80, md: 100 },
                  mr: 3
                }}
              >
                <EmailIcon sx={{ fontSize: { xs: 40, md: 50 }, color: 'white' }} />
              </Avatar>
              <Box sx={{ textAlign: 'left' }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '2rem' },
                    mb: 2,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Email System Center
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 400,
                    opacity: 0.9,
                    maxWidth: 600,
                    lineHeight: 1.4,
                    fontSize: { xs: '1rem', md: '1.1rem' }
                  }}
                >
                  Intelligent email automation and notification management for enterprise communications
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}

export default HeroHeaderSection