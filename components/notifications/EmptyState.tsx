import React from 'react'
import { Box, Typography, Button, Zoom } from '@mui/material'
import { Add as AddIcon, Upload as UploadIcon } from '@mui/icons-material'
import { Notifications as NotificationsIcon } from '@mui/icons-material'

interface EmptyStateProps {
  onCreateRule: () => void
  onImportRules: (file: File) => void
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateRule, onImportRules }) => {
  return (
    <Zoom in={true} timeout={1000}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 500,
          textAlign: 'center',
          py: 8,
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 4,
            boxShadow: '0 20px 40px rgba(26, 54, 93, 0.15)'
          }}
        >
          <NotificationsIcon sx={{ fontSize: 60, color: 'white' }} />
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 2,
            color: 'text.primary',
            background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          No Notification Rules Yet
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            mb: 4,
            maxWidth: 500,
            lineHeight: 1.6
          }}
        >
          Transform your form submissions into automated email notifications.
          Create intelligent rules that trigger based on specific conditions and ensure
          timely communication with your stakeholders.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={onCreateRule}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0f1419 0%, #1a365d 100%)',
              }
            }}
          >
            Create First Rule
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<UploadIcon />}
            component="label"
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'rgba(26, 54, 93, 0.04)'
              }
            }}
          >
            Import Rules
            <input
              type="file"
              accept=".json"
              hidden
              onChange={(e) => e.target.files && onImportRules(e.target.files[0])}
            />
          </Button>
        </Box>
      </Box>
    </Zoom>
  )
}

export default EmptyState