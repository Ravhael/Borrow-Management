import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material'
import {
  Add as AddIcon,
  Description as TemplateIcon,
} from '@mui/icons-material'

interface AddTemplateDialogProps {
  open: boolean
  onClose: () => void
}

const AddTemplateDialog: React.FC<AddTemplateDialogProps> = ({
  open,
  onClose
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 32px 64px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 1,
          background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
          color: 'white'
        }}
      >
        <AddIcon />
        Create New Email Template
      </DialogTitle>
      <DialogContent sx={{ p: 4 }}>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Create a new email template for automated notifications and communications
        </Typography>
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <TemplateIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
            Template Creation Coming Soon
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
            We&apos;re working on an enhanced template creation interface. For now, templates can be managed through the existing system.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddTemplateDialog