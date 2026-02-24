import React from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Fade,
  LinearProgress,
  Skeleton,
} from '@mui/material'
import { Assignment as AssignmentIcon } from '@mui/icons-material'

const LoadingState: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth={false} sx={{ maxWidth: 1400, py: 6, px: { xs: 2, md: 4 } }}>
        <Fade in={true}>
          <Paper
            elevation={4}
            sx={{
              p: 6,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid rgba(21, 101, 192, 0.1)',
              textAlign: 'center'
            }}
          >
            <Box sx={{ mb: 4 }}>
              <Avatar sx={{ bgcolor: '#1565c0', width: 64, height: 64, mx: 'auto', mb: 3 }}>
                <AssignmentIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 2 }}>
                Memuat Detail Peminjaman
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
                Mohon tunggu sebentar...
              </Typography>
              <LinearProgress
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(21, 101, 192, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #1565c0, #42a5f5)',
                    borderRadius: 4,
                  }
                }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} elevation={2} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[1, 2, 3].map((j) => (
                        <Box key={j} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Skeleton variant="text" width={100} height={20} />
                          <Skeleton variant="text" width={80} height={20} />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Fade>
      </Container>
    </div>
  )
}

export default LoadingState