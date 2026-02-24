import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Box, Paper, Typography, Button, Stack } from '@mui/material'
import PublicPageLayout from '../components/PublicPageLayout'
import type { NextPageWithLayout } from '../types/next-page-with-layout'

const NotFoundPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Page not found — FormFlow</title>
        <meta name="description" content="The page you&apos;re looking for can&apos;t be found." />
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
            404 — Page not found
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Oops — we couldn&apos;t find the page you&apos;re trying to reach. It&apos;s possible the URL is
            incorrect, or that the page has been moved or deleted.
          </Typography>

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

NotFoundPage.getLayout = (page) => <PublicPageLayout>{page}</PublicPageLayout>

export default NotFoundPage
