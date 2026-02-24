import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Stack,
  Skeleton,
  Fade,
} from '@mui/material'

const LoadingState: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      <Fade in={true} timeout={600}>
        <Card sx={{ maxWidth: 400, width: '100%', textAlign: 'center', p: 4 }}>
          <CardContent>
            <LinearProgress sx={{ mb: 3, borderRadius: 2 }} />
            <Typography variant="h6" gutterBottom>
              Loading Users...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we fetch the data
            </Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Skeleton variant="rectangular" height={20} />
              <Skeleton variant="rectangular" height={20} width="80%" />
              <Skeleton variant="rectangular" height={20} width="60%" />
            </Stack>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  )
}

export default LoadingState