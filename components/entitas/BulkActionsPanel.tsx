import React from 'react'
import {
  Box,
  Button,
  Paper,
  Avatar,
  Typography,
  Stack,
  Divider,
  Fade,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'

interface BulkActionsPanelProps {
  selectedCount: number
  onBulkActivate: () => void
  onBulkDeactivate: () => void
  onBulkDelete: () => void
}

export default function BulkActionsPanel({
  selectedCount,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete
}: BulkActionsPanelProps) {
  if (selectedCount === 0) return null

  return (
    <Fade in={true} timeout={1000}>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          p: 3,
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          minWidth: 500,
          maxWidth: '90vw',
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                mr: 2,
                bgcolor: 'primary.main',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {selectedCount}
            </Avatar>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {selectedCount} entities selected
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ height: 32, my: 'auto' }} />
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            size="small"
            onClick={onBulkActivate}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.3)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Activate
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<BlockIcon />}
            size="small"
            onClick={onBulkDeactivate}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(255, 152, 0, 0.3)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Deactivate
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            size="small"
            onClick={onBulkDelete}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(244, 67, 54, 0.3)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Delete
          </Button>
        </Stack>
      </Paper>
    </Fade>
  )
}