import React from 'react'
import {
  Box,
  Container,
  Button,
  Avatar,
  Typography,
} from '@mui/material'
import Link from 'next/link'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import registerTheme from './RegisterTheme'

const NavigationHeader: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'static',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
          <Link href="/" passHref>
            <Button
              sx={{
                p: 0,
                minWidth: 'auto',
                '&:hover': { backgroundColor: 'transparent' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: registerTheme.palette.primary.main, width: 40, height: 40 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>
                    FF
                  </Typography>
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700, color: registerTheme.palette.primary.main }}>
                  FormFlow
                </Typography>
              </Box>
            </Button>
          </Link>

          <Link href="/" passHref>
            <Button
              startIcon={<ArrowBackIcon />}
              sx={{
                color: registerTheme.palette.primary.main,
                '&:hover': {
                  backgroundColor: 'rgba(26, 54, 93, 0.04)',
                }
              }}
            >
              Back to Home
            </Button>
          </Link>
        </Box>
      </Container>
    </Box>
  )
}

export default NavigationHeader