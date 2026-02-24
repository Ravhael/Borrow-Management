import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  useTheme,
  Chip,
  Paper,
  Avatar,
} from '@mui/material';
import Link from 'next/link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import BusinessIcon from '@mui/icons-material/Business';
import { HomepageCTAProps } from '../../types/homepage';
import { loginTheme } from '../../themes/loginTheme'

const HomepageCTA: React.FC<HomepageCTAProps> = () => {
  const theme = useTheme();

  const testimonials = [
    { company: 'TechCorp', rating: 5, text: 'Transformed our loan process completely' },
    { company: 'FinancePlus', rating: 5, text: 'Best investment we made this year' },
    { company: 'BankFlow', rating: 5, text: 'Enterprise-grade solution' },
  ];

  return (
    <Box
      sx={{
        py: { xs: 10, md: 16 },
        background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 30%, ${loginTheme.palette.primary.light} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      {/* Floating Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          animation: 'float 6s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      />

      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', color: 'white', position: 'relative', zIndex: 1 }}>
          {/* Trust Badge */}
          <Chip
            icon={<CheckCircleIcon />}
            label="Trusted by 500+ Companies"
            sx={{
              mb: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 3,
              py: 1.5,
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '& .MuiChip-icon': {
                color: 'white',
              },
            }}
          />

          {/* Main Heading */}
          <Typography
            variant="h2"
            sx={{
              mb: 4,
              fontWeight: 800,
              fontSize: { xs: '2.5rem', md: '4rem' },
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            Ready to Transform Your
            <Box component="span" sx={{ display: 'block', color: 'rgba(255, 255, 255, 0.9)' }}>
              Loan Management?
            </Box>
          </Typography>

          {/* Subheading */}
          <Typography
            variant="h6"
            sx={{
              mb: 6,
              opacity: 0.95,
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              fontWeight: 400,
              maxWidth: '700px',
              mx: 'auto',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            }}
          >
            Join leading companies that have already streamlined their processes with FormFlow.
            Start your free trial today and experience the difference.
          </Typography>

          {/* CTA Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            justifyContent="center"
            alignItems="center"
            sx={{ mb: 8 }}
          >
            <Link href="/login" passHref style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: 'white',
                  color: theme.palette.primary.main,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  px: { xs: 6, md: 8 },
                  py: 2.5,
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  textTransform: 'none',
                  minWidth: { xs: '100%', sm: 'auto' },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    transform: 'translateY(-3px) scale(1.02)',
                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.25)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Start Free Trial
              </Button>
            </Link>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.4)',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 600,
                px: { xs: 6, md: 8 },
                py: 2.5,
                borderRadius: 3,
                borderWidth: 2,
                backdropFilter: 'blur(10px)',
                textTransform: 'none',
                minWidth: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-3px) scale(1.02)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Schedule Demo
            </Button>
          </Stack>

          {/* Social Proof */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="body2"
              sx={{
                mb: 3,
                opacity: 0.8,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
              }}
            >
              Trusted by Industry Leaders
            </Typography>

            {/* Testimonials */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={3}
              justifyContent="center"
              alignItems="center"
            >
              {testimonials.map((testimonial, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 3,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minWidth: { xs: '100%', md: '280px' },
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} sx={{ fontSize: 16, color: '#ffd700' }} />
                    ))}
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 2,
                      color: 'white',
                      fontStyle: 'italic',
                      opacity: 0.9,
                    }}
                  >
                    &quot;{testimonial.text}&quot;
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <BusinessIcon sx={{ fontSize: 14, color: 'white' }} />
                    </Avatar>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}
                    >
                      {testimonial.company}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>

          {/* Bottom Text */}
          <Typography
            variant="body2"
            sx={{
              opacity: 0.7,
              fontSize: '0.85rem',
              textAlign: 'center',
            }}
          >
            No credit card required • 14-day free trial • Cancel anytime
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default HomepageCTA;