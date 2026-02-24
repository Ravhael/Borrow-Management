import React from 'react'
import {
  Paper,
  Box,
  Typography,
  Button,
  Stack,
  Fade,
} from '@mui/material'
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'

interface BulkActionsPanelProps {
  selectedUsers: string[]
  onBulkActivate: () => void
  onBulkDeactivate: () => void
  onClearSelection: () => void
}

const BulkActionsPanel: React.FC<BulkActionsPanelProps> = ({
  selectedUsers,
  onBulkActivate,
  onBulkDeactivate,
  onClearSelection,
}) => {
  return (
    <Fade in={selectedUsers.length > 0}>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          borderRadius: 3,
          overflow: 'hidden',
          minWidth: 320,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(26, 54, 93, 0.1)',
          boxShadow: '0 20px 40px rgba(26, 54, 93, 0.15)',
        }}
      >
        <Box sx={{ p: 2, backgroundColor: 'rgba(26, 54, 93, 0.05)' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={onBulkActivate}
              sx={{
                minWidth: 120,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(46, 125, 50, 0.25)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(46, 125, 50, 0.3)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Activate
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={onBulkDeactivate}
              sx={{
                minWidth: 120,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(211, 47, 47, 0.25)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(211, 47, 47, 0.3)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Deactivate
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={onClearSelection}
              sx={{
                minWidth: 80,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                borderColor: 'rgba(26, 54, 93, 0.3)',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(26, 54, 93, 0.05)',
                },
              }}
            >
              Clear
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Fade>
  )
}

export default BulkActionsPanel