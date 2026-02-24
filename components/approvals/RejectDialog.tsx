import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Card,
  Stack,
  TextField,
  DialogContentText,
} from '@mui/material'
import { ThumbDown as RejectIcon } from '@mui/icons-material'

interface LoanData {
  id: string
  borrowerName: string
  entitasId: string
  needType: string
  userId?: string
  productDetailsText?: string
  pickupMethod?: string | null
  company?: string[]
}

interface RejectDialogProps {
  open: boolean
  loan: LoanData | null
  reason: string
  note?: string
  onClose: () => void
  onReject: (loanId: string, reason: string, note?: string) => void
  onReasonChange: (reason: string) => void
  onNoteChange?: (note: string) => void
  getNeedTypeLabel: (needType: string) => string
  getPickupMethodLabel?: (method?: string | null) => string
  currentUserRole?: string | null
  currentUserCompanies?: string[]
}

const RejectDialog: React.FC<RejectDialogProps> = ({
  open,
  loan,
  reason,
  note,
  onClose,
  onReject,
  onReasonChange,
  onNoteChange,
  getNeedTypeLabel,
  getPickupMethodLabel,
  currentUserRole,
  currentUserCompanies,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography component="div" variant="h6" sx={{ fontWeight: 600 }}>
          Konfirmasi Penolakan
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Masukkan alasan penolakan peminjaman berikut:
        </DialogContentText>
        {loan && (
          <Card variant="outlined" sx={{ p: 2, bgcolor: 'rgba(211, 47, 47, 0.05)', mb: 3 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                {loan.borrowerName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Entitas: {loan.entitasId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kebutuhan: {getNeedTypeLabel(loan.needType)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Metode Pengambilan: {getPickupMethodLabel ? getPickupMethodLabel(loan.pickupMethod) : loan.pickupMethod || '-'}
              </Typography>
              {loan.productDetailsText && (
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4, mt: 0.5 }}>
                  {loan.productDetailsText.length > 300 ? `${loan.productDetailsText.slice(0, 297)}...` : loan.productDetailsText}
                </Typography>
              )}
            </Stack>
          </Card>
        )}
        <TextField
          autoFocus
          margin="dense"
          size="small"
          label="Alasan Penolakan"
          fullWidth
          multiline
          minRows={1}
          maxRows={3}
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Jelaskan alasan penolakan peminjaman ini..."
          variant="outlined"
        />
        <TextField
          margin="dense"
          size="small"
          label="Catatan (opsional)"
          fullWidth
          multiline
          minRows={1}
          maxRows={3}
          value={note ?? ''}
          onChange={(e) => onNoteChange && onNoteChange(e.target.value)}
          placeholder="Masukkan catatan tambahan (opsional)"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
        >
          Batal
        </Button>
        <Button
          onClick={() => loan && onReject(loan.id, reason, note)}
          variant="contained"
          color="error"
          startIcon={<RejectIcon />}
          disabled={!reason.trim() || (currentUserRole === 'marketing' && !(Array.isArray(currentUserCompanies) && loan?.company && loan.company.every(c => currentUserCompanies.includes(c))))}
        >
          Tolak
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RejectDialog