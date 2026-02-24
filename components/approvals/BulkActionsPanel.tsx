import React from 'react'
import {
  Paper,
  Stack,
  Box,
  Typography,
  Button,
  Avatar,
  Divider,
  Fade,
} from '@mui/material'
import {
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
} from '@mui/icons-material'

interface BulkActionsPanelProps {
  selectedCount: number
  onBulkApprove: () => void
  onBulkReject: () => void
}

const BulkActionsPanel: React.FC<BulkActionsPanelProps> = ({
  selectedCount,
  onBulkApprove,
  onBulkReject,
}) => {
  return (
    <Fade in={true} timeout={1200}>
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
          minWidth: 450,
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
              {selectedCount} loans selected
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ height: 32, my: 'auto' }} />
          <Button
            variant="contained"
            color="success"
            startIcon={<ApproveIcon />}
            onClick={onBulkApprove}
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
            Approve Selected
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<RejectIcon />}
            onClick={onBulkReject}
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
            Reject Selected
          </Button>
        </Stack>
      </Paper>
    </Fade>
  )
}

export default BulkActionsPanel