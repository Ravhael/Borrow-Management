import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Zoom,
} from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
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
      <Zoom in={true} timeout={600}>
        <Card sx={{ maxWidth: 500, width: '100%', textAlign: 'center', p: 4 }}>
          <CardContent>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Typography variant="h6" gutterBottom>
              Unable to Load Users
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              There was a problem fetching the user data. Please try again.
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              size="large"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </Zoom>
    </Box>
  )
}

export default ErrorState