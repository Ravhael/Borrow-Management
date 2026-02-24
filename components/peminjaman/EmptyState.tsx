import React from 'react'
import Link from 'next/link'
import { Card, CardContent, Typography, Button, Stack, Avatar, Fade, Box } from '@mui/material'
import { Assignment as AssignmentIcon, Add as AddIcon } from '@mui/icons-material'

const EmptyState: React.FC = () => {
  return (
    <Fade in={true} timeout={1200}>
      <Card elevation={0} sx={{ border: '2px dashed rgba(0,0,0,0.1)', bgcolor: 'rgba(0,0,0,0.02)' }}>
        <CardContent>
          <Stack spacing={3} alignItems="center" py={8}>
            <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', width: 80, height: 80 }}>
              <AssignmentIcon sx={{ fontSize: '2.5rem', color: '#1565c0' }} />
            </Avatar>
            <Box textAlign="center">
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Belum ada data peminjaman
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Sistem belum memiliki permintaan peminjaman yang tercatat.<br />
                Mulai dengan membuat permintaan peminjaman baru.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              component={Link}
              href="/form"
              sx={{ px: 4, py: 1.5 }}
            >
              Buat Permintaan Peminjaman
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Fade>
  )
}

export default EmptyState