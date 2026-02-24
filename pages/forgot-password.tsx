import React, { useState } from 'react'
import Head from 'next/head'
import {
  Container,
  Typography,
  Paper,
  Avatar,
  Box,
  Fade,
  Chip
} from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import LockResetIcon from '@mui/icons-material/LockReset'
import { loginTheme } from '../themes/loginTheme'
import {
  NavigationHeader,
  ForgotPasswordForm
} from '../components/forgot-password'

import type { NextPageWithLayout } from '../types/next-page-with-layout'
import { withBasePath } from '../utils/basePath'

const ForgotPasswordPage: NextPageWithLayout = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('Masukkan alamat email yang valid')
        return
      }
      // Call server to request a reset (respect deployment base path)
      const resetUrl = withBasePath('/api/users/request-reset')
      const resp = await fetch(resetUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const json = await resp.json()
      if (resp.ok && json?.ok) {
        // Generic success message (server avoids leaking user existence)
        setSuccess('Jika ada akun terkait email ini, link reset kata sandi telah dikirim. Periksa inbox atau folder spam.')
      } else {
        setError(json?.message ?? 'Gagal mengirim permintaan reset. Silakan coba lagi.')
      }

    } catch (err) {
      setError('Gagal mengirim email reset. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider theme={loginTheme}>
      <div style={{ minHeight: '100vh', backgroundColor: loginTheme.palette.background.default }}>
        <Head>
          <title>Lupa Kata Sandi</title>
          <meta name="description" content="Atur ulang kata sandi akun FormFlow Anda" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>

        {/* Navigation Header 
        <NavigationHeader theme={loginTheme} />

        {/* Forgot Password Form Section */}
        <Box
          sx={{
            pt: { xs: 4, md: 6 },
            pb: { xs: 8, md: 12 },
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
            position: 'relative',
            overflow: { xs: 'visible', md: 'hidden' },
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
            <Box
              sx={{
                minHeight: '80vh',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
              }}
            >
              {/* Left Side - Branding */}
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: 1,
                  p: { xs: 2, md: 4 },
                  color: 'white',
                  textAlign: 'center',
                  maxWidth: 520,
                }}
              >
                <Fade in={true} timeout={1000}>
                  <Box>
                    <Typography
                      variant="h2"
                      sx={{
                        mb: 0.5,
                        fontWeight: 800,
                        fontSize: { xs: '1.25rem', md: '2.5rem', lg: '3rem' },
                        lineHeight: 1.2,
                        color: 'white',
                      }}
                    >
                      Aplikasi
                    </Typography>
                    <Typography
                      variant="h2"
                      sx={{
                        mb: 3,
                        fontWeight: 800,
                        fontSize: { md: '2.5rem', lg: '3rem' },
                        lineHeight: 1.2,
                        color: 'white',
                      }}
                    >
                      Peminjaman Barang
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        mb: 4,
                        fontWeight: 400,
                        opacity: 0.9,
                        maxWidth: 500,
                        mx: 'auto',
                      }}
                    >
                      Manajemen Peminjaman Barang Gudang di Indovisual yang Lebih Efisien
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Chip
                        label="Secure & Reliable"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.15)',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                        }}
                      />
                      <Chip
                        label="Real-time Tracking"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.15)',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                        }}
                      />
                      <Chip
                        label="Easy Integration"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.15)',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                        }}
                      />
                    </Box>
                  </Box>
                </Fade>
              </Box>

              {/* Right Side - Forgot Password Form */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  p: { xs: 2, md: 4 },
                }}
              >
                <Fade in={true} timeout={1000}>
                  <Paper
                    elevation={24}
                    sx={{
                      p: { xs: 3, md: 6 },
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      width: '100%',
                      maxWidth: { xs: '100%', sm: 460, md: 480 },
                      mx: 'auto'
                    }}
                  >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Avatar
                    sx={{
                      width: { xs: 64, md: 80 },
                      height: { xs: 64, md: 80 },
                      bgcolor: 'white',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 25px rgba(26, 54, 93, 0.2)',
                      border: `2px solid ${loginTheme.palette.primary.main}`,
                    }}
                  >
                    <LockResetIcon sx={{ fontSize: { xs: 28, md: 40 }, color: loginTheme.palette.primary.main }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: loginTheme.palette.primary.main, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                    Lupa Kata Sandi?
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Tidak perlu khawatir! Masukkan alamat email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
                  </Typography>
                </Box>

                {/* Forgot Password Form */}
                <ForgotPasswordForm
                  email={email}
                  loading={loading}
                  error={error}
                  success={success}
                  theme={loginTheme}
                  onInputChange={handleInputChange}
                  onSubmit={handleSubmit}
                />
              </Paper>
                </Fade>
              </Box>
            </Box>
          </Container>
        </Box>
      </div>
    </ThemeProvider>
  )
}



export default ForgotPasswordPage