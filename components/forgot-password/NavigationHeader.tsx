import React from 'react'
import Link from 'next/link'
import { Container, Button, Box, Avatar, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

interface NavigationHeaderProps {
  theme: any
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({ theme }) => {
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
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>
                    FF
                  </Typography>
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  FormFlow
                </Typography>
              </Box>
            </Button>
          </Link>

          <Link href="/login" passHref>
            <Button
              startIcon={<ArrowBackIcon />}
              sx={{
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: 'rgba(26, 54, 93, 0.04)',
                }
              }}
            >
              Kembali ke Login
            </Button>
          </Link>
        </Box>
      </Container>
    </Box>
  )
}

export default NavigationHeader