import React from 'react'
import Link from 'next/link'
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  Fade,
} from '@mui/material'
import { ArrowBack as ArrowBackIcon, Error as ErrorIcon } from '@mui/icons-material'

interface ErrorStateProps {
  error: string
}

const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth={false} sx={{ maxWidth: 1400, py: 6, px: { xs: 2, md: 4 } }}>
        <Fade in={true}>
          <Alert
            severity="error"
            sx={{
              borderRadius: 3,
              p: 4,
              fontSize: '1rem',
              boxShadow: '0px 8px 32px rgba(211, 47, 47, 0.2)',
              border: '1px solid rgba(211, 47, 47, 0.2)',
              '& .MuiAlert-icon': {
                fontSize: '2rem'
              }
            }}
            icon={<ErrorIcon sx={{ fontSize: '2rem' }} />}
            action={
              <Button
                color="inherit"
                size="large"
                component={Link}
                href="/peminjaman"
                startIcon={<ArrowBackIcon />}
                sx={{
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                  }
                }}
              >
                Kembali ke Daftar
              </Button>
            }
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Terjadi Kesalahan
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
              {error}
            </Typography>
          </Alert>
        </Fade>
      </Container>
    </div>
  )
}

export default ErrorState