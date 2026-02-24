import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material'

interface User {
  id: string
  name: string
  username: string
  email: string
  role: string
  entitasId?: string
  directorateId?: string | number
  isActive: boolean
  permissions: string[]
}

interface DeleteDialogProps {
  open: boolean
  userToDelete: User | null
  onClose: () => void
  onConfirm: () => void
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  userToDelete,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        Confirm User Deletion
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete the user <strong>{userToDelete?.name}</strong>?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This action cannot be undone. The user will be permanently removed from the system.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
        >
          Delete User
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteDialog