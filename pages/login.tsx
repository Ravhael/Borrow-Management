import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { signIn, signOut, useSession } from 'next-auth/react'
import {
  Container,
  Typography,
  Paper,
  Avatar,
  Box,
  Fade,
  Chip
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles'
import BusinessIcon from '@mui/icons-material/Business'
import { loginTheme } from '../themes/loginTheme'
import {
  NavigationHeader,
  LoginForm,
  LoginFooter
} from '../components/login'
import PreloadingOverlay from '../components/PreloadingOverlay'
import { getCanonicalRole } from '../config/roleConfig'

import type { NextPageWithLayout } from '../types/next-page-with-layout'
import { withBasePath } from '../utils/basePath'

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Only proceed when we have a session object
    if (!session) return

    // If session exists but role info is missing or invalid, force sign-out so
    // the user can re-authenticate on the login page instead of being
    // redirected to a protected area that will immediately 403.
    const tok: any = session as any
    // Consider role present when either a canonical roleName exists, or
    // session.user.role is a string or an object containing a name.
    const hasRoleName = Boolean(tok.roleName) || typeof session.user?.role === 'string' || (session.user?.role && typeof session.user.role === 'object' && 'name' in (session.user.role as any))
    if (!hasRoleName) {
      // clear the session and reload login (respect base path)
      signOut({ callbackUrl: withBasePath('/login') })
      return
    }

    // If middleware or other parts of the app redirected to /login with a `next` param,
    // prefer redirecting the user there after login instead of the role-based default.
    try {
      const nextParam = typeof router.query?.next === 'string' ? String(router.query.next) : ''
      if (nextParam) {
        // only allow internal redirects (prevent open redirect attacks)
        if (nextParam.startsWith('/')) {
          router.push(nextParam)
          return
        }
        // allow same-origin absolute paths if they include the base path
        try {
          const u = new URL(nextParam, window.location.href)
          if (u.origin === window.location.origin) {
            // use pathname + search to preserve query
            router.push(u.pathname + u.search)
            return
          }
        } catch (e) {
          // ignore parsing errors and fall back to role-based redirect
        }
      }
    } catch (err) {
      // ignore and proceed with role-based redirect
    }

    // Canonicalize role so names like "Warehouse" and "Gudang" map to a canonical role
    // Redirect everyone to the single centralized dashboard. If you need per-role landing pages
    // later, we can add customized in-dashboard sections instead.
    router.push('/dashboard')
  }, [session, status, router])

  // If middleware redirected to login with `stale=1` (stale/missing server session),
  // clear any client-side session and remove the param so the login form is shown.
  useEffect(() => {
    if (!router.isReady) return
    if (String(router.query?.stale) === '1') {
      // silent signOut to clear client session without redirecting
      signOut({ redirect: false }).finally(() => {
        try {
          const u = new URL(window.location.href)
          u.searchParams.delete('stale')
          window.history.replaceState({}, '', u.toString())
        } catch {}
      })
    }
  }, [router.isReady, router.query?.stale])

  if (status === 'loading') {
    return <PreloadingOverlay open text="Loading..." />
  }

  if (status === 'authenticated') {
    return <PreloadingOverlay open text="Redirecting..." />
  }

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    if (error) setError('')
  }

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      rememberMe: event.target.checked
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      // First, validate using our lightweight validation endpoint so we can show
      // a clear message to the user before calling next-auth's signIn.
      const validateUrl = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/auth/validate-credentials`
      const v = await fetch(validateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.usernameOrEmail, password: formData.password })
      })
      const validation = await v.json()

      if (!validation.ok) {
        switch (validation.code) {
          case 'USER_NOT_FOUND':
            setError('User tidak terdaftar')
            setLoading(false)
            return
          case 'ACCOUNT_INACTIVE':
            setError('Akun belum diaktivasi')
            setLoading(false)
            return
          case 'INVALID_PASSWORD':
            setError('User/email atau password salah')
            setLoading(false)
            return
          default:
            setError('Invalid username/email or password')
            setLoading(false)
            return
        }
      }

      // Validation passed — now call signIn to establish session
      const result = await signIn('credentials', {
        username: formData.usernameOrEmail,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        // fallback message
        setError('Invalid username/email or password')
      } else if (result?.ok) {
        // Success, the useEffect will handle redirect
      }
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider theme={loginTheme}>
      <>
        <PreloadingOverlay open={loading} text="Logging in..." />
        <div style={{ minHeight: '100vh', backgroundColor: loginTheme.palette.background.default }}>
          <Head>
            <title>Sign In - FormFlow</title>
            <meta name="description" content="Sign in to your FormFlow account to access corporate loan management tools" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </Head>
          
          <Box
            sx={{
              pt: { xs: 3, md: 6 },
              pb: { xs: 6, md: 12 },
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
                background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
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
                    mx: 'auto'
                  }}
                >
                  <Fade in={true} timeout={1000}>
                    <Box>
                      <Typography
                        variant="h2"
                        sx={{
                          mb: 0.5,
                          fontWeight: 800,
                          fontSize: { xs: '1.6rem', md: '2.5rem', lg: '3rem' },
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
                          fontSize: { xs: '1.6rem', md: '2.5rem', lg: '3rem' },
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

                {/* Right Side - Login Form */}
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
                        maxWidth: { xs: '100%', sm: 420, md: 480 },
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
                          <BusinessIcon sx={{ fontSize: 40, color: loginTheme.palette.primary.main }} />
                        </Avatar>
                        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: loginTheme.palette.primary.main, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                          Selamat Datang
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Silakan masuk ke akun Anda untuk melanjutkan
                        </Typography>
                      </Box>

                      {/* Login Form */}
                      <LoginForm
                        formData={formData}
                        showPassword={showPassword}
                        loading={loading}
                        error={error}
                        theme={loginTheme}
                        onInputChange={handleInputChange}
                        onCheckboxChange={handleCheckboxChange}
                        onTogglePassword={() => setShowPassword(!showPassword)}
                        onSubmit={handleSubmit}
                      />

                      {/* Footer Links */}
                      <LoginFooter theme={loginTheme} />
                    </Paper>
                  </Fade>
                </Box>
              </Box>
            </Container>
          </Box>
        </div>
      </>
    </ThemeProvider>
  )
}



export default LoginPage