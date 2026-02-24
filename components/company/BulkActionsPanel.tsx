import React from 'react'
import {
  Box,
  Paper,
  Stack,
  Button,
  Avatar,
  Typography,
  Divider,
  Zoom,
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

const BulkActionsPanel: React.FC<BulkActionsPanelProps> = ({
  selectedCount,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
}) => {
  if (selectedCount === 0) return null

  return (
    <Zoom in={true} timeout={600}>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
          zIndex: 1200,
          minWidth: 500,
          maxWidth: '90vw',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2), 0 12px 24px rgba(0, 0, 0, 0.15)',
            transform: 'translateX(-50%) translateY(-2px)',
          },
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 32,
                height: 32,
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {selectedCount}
            </Avatar>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '0.95rem'
              }}
            >
              perusahaan dipilih
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ height: 32, my: 'auto' }} />
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)',
                color: 'white',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(0, 212, 170, 0.3)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, #00b894 0%, #00d4aa 100%)',
                  boxShadow: '0 6px 20px rgba(0, 212, 170, 0.4)',
                  transform: 'translateY(-1px)',
                },
              }}
              startIcon={<CheckCircleIcon sx={{ fontSize: '1.1rem' }} />}
              onClick={onBulkActivate}
            >
              Aktifkan
            </Button>
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #ff9500 0%, #ff7b00 100%)',
                color: 'white',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(255, 149, 0, 0.3)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ff7b00 0%, #ff9500 100%)',
                  boxShadow: '0 6px 20px rgba(255, 149, 0, 0.4)',
                  transform: 'translateY(-1px)',
                },
              }}
              startIcon={<BlockIcon sx={{ fontSize: '1.1rem' }} />}
              onClick={onBulkDeactivate}
            >
              Nonaktifkan
            </Button>
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #ff4757 0%, #ff3838 100%)',
                color: 'white',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(255, 71, 87, 0.3)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ff3838 0%, #ff4757 100%)',
                  boxShadow: '0 6px 20px rgba(255, 71, 87, 0.4)',
                  transform: 'translateY(-1px)',
                },
              }}
              startIcon={<DeleteIcon sx={{ fontSize: '1.1rem' }} />}
              onClick={onBulkDelete}
            >
              Hapus
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Zoom>
  )
}

export default BulkActionsPanel