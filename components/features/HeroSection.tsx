import React from 'react'
import Link from 'next/link'
import {
  Container,
  Typography,
  Box,
  Button,
  Breadcrumbs,
} from '@mui/material'
import { featuresTheme } from '../../themes/featuresTheme'
import { loginTheme } from '../../themes/loginTheme'

export default function HeroSection() {
  return (
    <Box
      sx={{
        pt: { xs: 12, md: 16 },
        pb: { xs: 8, md: 12 },
        background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <Breadcrumbs
            sx={{
              mb: 3,
              justifyContent: 'center',
              '& .MuiBreadcrumbs-li': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .MuiBreadcrumbs-li .MuiTypography-root': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .MuiBreadcrumbs-separator': { color: 'rgba(255, 255, 255, 0.5)' }
            }}
            aria-label="breadcrumb"
          >
            <Link href="/" passHref>
              <Button
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textTransform: 'none',
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': { color: 'white', backgroundColor: 'transparent' }
                }}
              >
                Home
              </Button>
            </Link>
            <Typography color="white">Features</Typography>
          </Breadcrumbs>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
              mb: 3,
              lineHeight: 1.1,
            }}
          >
            Powerful Features for
            <Box component="span" sx={{ color: featuresTheme.palette.secondary.light }}>
              {' '}Modern Enterprises
            </Box>
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              mb: 6,
              fontWeight: 400,
              lineHeight: 1.6,
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              maxWidth: 800,
              mx: 'auto'
            }}
          >
            Discover how FormFlow&apos;s comprehensive suite of features transforms
            your corporate loan management process with cutting-edge technology
            and intelligent automation.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}