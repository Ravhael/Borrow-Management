import React from 'react'
import Link from 'next/link'
import {
  Container,
  Typography,
  Box,
  Button,
  Stack,
} from '@mui/material'
import { featuresTheme } from '../../themes/featuresTheme'
import { loginTheme } from '../../themes/loginTheme'

export default function CTASection() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <Typography
            variant="h2"
            sx={{
              mb: 3,
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem' },
              color: 'white'
            }}
          >
            Ready to Experience These Features?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 6,
              opacity: 0.9,
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.25rem' }
            }}
          >
            Start your free trial today and discover how FormFlow&apos;s powerful features
            can transform your corporate loan management processes.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
            <Link href="/login" passHref>
              <Button
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: 'white',
                  color: featuresTheme.palette.primary.main,
                  fontSize: '1.2rem',
                  px: 6,
                  py: 2,
                  borderRadius: 4,
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Start Free Trial
              </Button>
            </Link>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontSize: '1.2rem',
                px: 6,
                py: 2,
                borderRadius: 4,
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Schedule Demo
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}