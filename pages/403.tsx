import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Box, Paper, Typography, Button, Stack } from '@mui/material'
import PublicPageLayout from '../components/PublicPageLayout'
import type { NextPageWithLayout } from '../types/next-page-with-layout'

const ForbiddenPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>403 — Unauthorized</title>
        <meta name="description" content="You do not have permission to view this page." />
      </Head>

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, rgba(4,30,66,1) 0%, rgba(2,85,100,1) 50%, rgba(0,128,128,1) 100%)',
          p: 2,
        }}
      >
        <Paper sx={{ p: 6, maxWidth: 780, mx: 'auto', borderRadius: 3 }} elevation={18}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            403 — Unauthorized
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Maaf — Anda tidak memiliki akses ke halaman ini. Jika ini seharusnya sebuah kesalahan, silakan hubungi administrator.
          </Typography>

          {/* show diagnostic info when available (query params) */}
          <Diagnostics />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Link href="/" passHref>
              <Button variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 700 }}>
                Back to Home
              </Button>
            </Link>

            <Link href="/login" passHref>
              <Button variant="outlined" color="primary" sx={{ textTransform: 'none', fontWeight: 700 }}>
                Go to Login
              </Button>
            </Link>
          </Stack>
        </Paper>
      </Box>
    </>
  )
}

ForbiddenPage.getLayout = (page) => <PublicPageLayout>{page}</PublicPageLayout>

export default ForbiddenPage

function Diagnostics() {
  // avoid rendering client-only diagnostics during server render to prevent
  // hydration mismatches. Use an effect-mounted flag so server and initial
  // hydration render nothing, then update on the client after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const params = new URLSearchParams(window.location.search)
  const from = params.get('from')
  const required = params.get('required')
  const current = params.get('current')
  const message = params.get('message')

  // only show the message (if any). we intentionally hide debug fields
  // like requested/required/current to avoid exposing internal details
  // in the UI.
  if (!message) return null

  return (
    <Box sx={{ mb: 3, textAlign: 'center' }}>
      <Typography variant="body1" color="error" sx={{ mb: 2 }}>{message}</Typography>
    </Box>
  )
}
