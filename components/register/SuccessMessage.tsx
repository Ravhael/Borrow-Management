import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Alert,
  Button,
  Stack,
} from '@mui/material'
import Link from 'next/link'
import BusinessIcon from '@mui/icons-material/Business'
import registerTheme from './RegisterTheme'
import { loginTheme } from '../../themes/loginTheme'

interface SuccessMessageProps {
  fullName: string
  whatsapp?: string
  isActive?: boolean
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ fullName, whatsapp, isActive }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
        p: { xs: 3, md: 2 },
      }}
    >
      <Paper
        elevation={24}
        sx={{ 
          p: { xs: 3, md: 6 },
          borderRadius: { xs: 2, md: 4 },
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          width: '100%',
          maxWidth: { xs: '100%', sm: 520, md: 500 },
          mx: 'auto'
        }}
      >
        <Avatar
          sx={{
            width: { xs: 56, md: 80 },
            height: { xs: 56, md: 80 },
            bgcolor: `linear-gradient(135deg, ${registerTheme.palette.secondary.main} 0%, ${registerTheme.palette.secondary.light} 100%)`,
            mx: 'auto',
            mb: 3,
            boxShadow: '0 8px 25px rgba(0, 212, 170, 0.2)',
          }}
        >
          <BusinessIcon sx={{ fontSize: { xs: 24, md: 40 }, color: 'white' }} />
        </Avatar>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: registerTheme.palette.primary.main, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Selamat Datang.
        </Typography>
        {isActive ? (
          <>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: { xs: '0.95rem', md: '1rem' } }}>
              Halo <strong>{fullName}</strong> — akun Anda telah berhasil dibuat. Anda akan dialihkan ke dashboard dalam beberapa saat.
              {whatsapp ? ` Kami menyimpan nomor WhatsApp Anda (${whatsapp}).` : ''}
            </Typography>
            <Alert severity="success" sx={{ borderRadius: 2, width: '100%', mt: 1 }}>
              Pendaftaran berhasil! Mengalihkan...
            </Alert>
          </>
        ) : (
          <>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: { xs: '0.95rem', md: '1rem' } }}>
              Halo <strong>{fullName}</strong> — akun Anda telah dibuat dan menunggu persetujuan Admin Account. Anda tidak dapat masuk sampai Admin Account menyetujui akun Anda.
              {whatsapp ? ` Kami menyimpan nomor WhatsApp Anda (${whatsapp}).` : ''}
            </Typography>
            <Alert severity="info" sx={{ borderRadius: 2, width: '100%', mt: 1 }}>
              Akun telah dibuat dan menunggu persetujuan. Administrator harus mengaktifkan akun Anda sebelum Anda dapat masuk.
            </Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={{ xs: 1, sm: 2 }} sx={{ mt: 3 }}>
              <Link href="/login" passHref>
                <Button variant="contained" color="primary" sx={{ textTransform: 'none', fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}>
                  Masuk
                </Button>
              </Link>
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  )
}

export default SuccessMessage