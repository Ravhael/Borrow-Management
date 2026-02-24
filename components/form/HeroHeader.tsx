import React from 'react'
import Link from 'next/link'
import { Box, Typography, Button, Avatar, Paper, Zoom } from '@mui/material'
import { Assignment as AssignmentIcon } from '@mui/icons-material'
import { loginTheme } from '../../themes/loginTheme'

const steps = [
  {
    label: 'Informasi Peminjam',
    icon: <Box sx={{ color: 'primary.light', mb: 1, fontSize: 24 }}>👤</Box>,
    description: 'Data pribadi & kontak'
  },
  {
    label: 'Detail Kebutuhan',
    icon: <Box sx={{ color: 'primary.light', mb: 1, fontSize: 24 }}>📦</Box>,
    description: 'Jenis & spesifikasi kebutuhan'
  },
  {
    label: 'Detail Produk',
    icon: <Box sx={{ color: 'primary.light', mb: 1, fontSize: 24 }}>📋</Box>,
    description: 'Informasi produk & jadwal'
  },
  {
    label: 'Persetujuan',
    icon: <Box sx={{ color: 'primary.light', mb: 1, fontSize: 24 }}>⚖️</Box>,
    description: 'Konfirmasi & submit'
  }
]

const HeroHeader: React.FC = () => {
  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
        color: 'white',
        py: { xs: 6, md: 8 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.1,
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '1200px', mx: 'auto', px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ fontSize: { xs: 40, md: 48 }, mr: 3, opacity: 0.9 }} />
            <Box>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  mb: 2,
                  background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Loan Request Form
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 400,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  opacity: 0.9,
                  maxWidth: '600px',
                  lineHeight: 1.4,
                }}
              >
                Submit your loan request with our streamlined form process. Get approval faster with our digital workflow.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Button
              component={Link}
              href="/peminjaman"
              variant="outlined"
              startIcon={<AssignmentIcon />}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              View All Requests
            </Button>
          </Box>
        </Box>

        {/* Key Stats Row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(4, 1fr)'
            },
            gap: 3,
            mt: 4
          }}
        >
          {steps.map((step, index) => (
            <Zoom key={step.label} in={true} style={{ transitionDelay: `${(index + 1) * 100}ms` }}>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 3,
                  textAlign: 'center',
                }}
              >
                {step.icon}
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5, fontSize: '0.9rem' }}>
                  {step.label.split(' ')[0]}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.7rem' }}>
                  {step.description}
                </Typography>
              </Paper>
            </Zoom>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default HeroHeader