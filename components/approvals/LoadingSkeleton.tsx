import React from 'react'
import {
  Container,
  Box,
  Stack,
  Typography,
  LinearProgress,
} from '@mui/material'

const LoadingSkeleton: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Stack spacing={2} alignItems="center">
          <LinearProgress sx={{ width: 200, height: 6, borderRadius: 3 }} />
          <Typography variant="body1" color="text.secondary">Memuat data persetujuan...</Typography>
        </Stack>
      </Box>
    </Container>
  )
}

export default LoadingSkeleton