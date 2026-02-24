import React from 'react'
import Link from 'next/link'
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Button,
  Typography,
  Avatar,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { featuresTheme } from '../../themes/featuresTheme'

interface NavigationHeaderProps {
  isMobile: boolean
  isSmallScreen: boolean
}

export default function NavigationHeader({ isMobile, isSmallScreen }: NavigationHeaderProps) {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        zIndex: 1100,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Link href="/" passHref>
              <Button
                sx={{
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': { backgroundColor: 'transparent' }
                }}
              >
                <Avatar sx={{ bgcolor: featuresTheme.palette.primary.main, width: 40, height: 40 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>
                    FF
                  </Typography>
                </Avatar>
              </Button>
            </Link>
            <Link href="/" passHref>
              <Button
                sx={{
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': { backgroundColor: 'transparent' }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, color: featuresTheme.palette.primary.main }}>
                  FormFlow
                </Typography>
              </Button>
            </Link>
          </Box>

          {!isMobile && (
            <Box sx={{ mr: 3 }}>
              <Link href="/features" passHref>
                <Button color="inherit" sx={{ color: featuresTheme.palette.primary.main, fontWeight: 600 }}>
                  Features
                </Button>
              </Link>
              <Button color="inherit" sx={{ color: featuresTheme.palette.text.primary, fontWeight: 500 }}>
                Solutions
              </Button>
              <Button color="inherit" sx={{ color: featuresTheme.palette.text.primary, fontWeight: 500 }}>
                About
              </Button>
              <Button color="inherit" sx={{ color: featuresTheme.palette.text.primary, fontWeight: 500 }}>
                Contact
              </Button>
            </Box>
          )}

          <Box>
            <Link href="/login" passHref>
              <Button
                variant="outlined"
                sx={{
                  borderColor: featuresTheme.palette.primary.main,
                  color: featuresTheme.palette.primary.main,
                  '&:hover': {
                    borderColor: featuresTheme.palette.primary.dark,
                    backgroundColor: 'rgba(26, 54, 93, 0.04)',
                  }
                }}
              >
                Sign In
              </Button>
            </Link>
            <Button
              variant="contained"
              sx={{
                background: `linear-gradient(135deg, ${featuresTheme.palette.primary.main} 0%, ${featuresTheme.palette.primary.dark} 100%)`,
                boxShadow: '0 4px 14px rgba(26, 54, 93, 0.25)',
              }}
            >
              Get Started
            </Button>
            {isMobile && (
              <IconButton color="inherit">
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}