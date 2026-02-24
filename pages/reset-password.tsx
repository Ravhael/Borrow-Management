import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Box, Container, Typography, Paper, TextField, Button, Alert } from '@mui/material'
import PublicPageLayout from '../components/PublicPageLayout'
import type { NextPageWithLayout } from '../types/next-page-with-layout'
import { withBasePath } from '../utils/basePath'

const ResetPasswordPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { user: usernameParam, temp: tokenParam } = router.query as any
  const [username, setUsername] = useState(usernameParam ?? '')
  const [token, setToken] = useState(tokenParam ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setUsername(usernameParam ?? '')
    setToken(tokenParam ?? '')
  }, [usernameParam, tokenParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!username || !token) return setError('Invalid reset link')
    if (!password || password.length < 8) return setError('Password must be at least 8 characters long')
    if (password !== confirm) return setError('Passwords do not match')

    setLoading(true)
    try {
      const resp = await fetch(withBasePath('/api/users/perform-reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, token, newPassword: password })
      })
      const json = await resp.json()
      if (!resp.ok || !json?.ok) {
        setError(json?.message ?? 'Failed to reset password')
      } else {
        setSuccess('Password updated. You may now log in with your new password.')
        setTimeout(() => router.push('/login'), 1500)
      }
    } catch (err) {
      setError('Failed to reset password. Please try again later.')
    } finally { setLoading(false) }
  }

  return (
    <Container maxWidth="sm" sx={{ pt: 8 }}>
      <Head>
        <title>Reset Password - FormFlow</title>
      </Head>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Reset Password</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Set a new password for your account.</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField label="Username" value={username} fullWidth sx={{ mb: 2 }} InputProps={{ readOnly: true }} />
          <TextField label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth sx={{ mb: 2 }} />
          <TextField label="Confirm New Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} fullWidth sx={{ mb: 2 }} />
          <Button type="submit" variant="contained" fullWidth disabled={loading}>{loading ? 'Saving...' : 'Save New Password'}</Button>
        </Box>
      </Paper>
    </Container>
  )
}

ResetPasswordPage.getLayout = (page) => <PublicPageLayout>{page}</PublicPageLayout>

export default ResetPasswordPage
