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
  DialogContentText,
  TextField,
} from '@mui/material'
import { ThumbUp as ApproveIcon } from '@mui/icons-material'

interface LoanData {
  id: string
  borrowerName: string
  entitasId: string
  needType: string
  useDate: string
  userId?: string
  productDetailsText?: string
  pickupMethod?: string | null
  company?: string[]
}

interface ApproveDialogProps {
  open: boolean
  loan: LoanData | null
  onClose: () => void
  onApprove: (loanId: string, note?: string) => void
  getNeedTypeLabel: (needType: string) => string
  formatDate: (dateStr: string) => string
  getPickupMethodLabel?: (method?: string | null) => string
  currentUserRole?: string | null
  currentUserCompanies?: string[]
}

const ApproveDialog: React.FC<ApproveDialogProps> = ({
  open,
  loan,
  onClose,
  onApprove,
  getNeedTypeLabel,
  formatDate,
  getPickupMethodLabel,
  currentUserRole,
  currentUserCompanies,
}) => {
  const [note, setNote] = React.useState('')

  React.useEffect(() => {
    // reset when dialog opens/closes
    if (!open) setNote('')
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography component="div" variant="h6" sx={{ fontWeight: 600 }}>
          Konfirmasi Persetujuan
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Apakah Anda yakin ingin menyetujui peminjaman berikut?
        </DialogContentText>
        {loan && (
          <Card variant="outlined" sx={{ p: 2, bgcolor: 'rgba(46, 125, 50, 0.05)' }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                {loan.borrowerName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Entitas: {loan.entitasId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kebutuhan: {getNeedTypeLabel(loan.needType)}
              </Typography>
              {loan.useDate && (
                <Typography variant="body2" color="text.secondary">
                  Tanggal Penggunaan: {formatDate(loan.useDate).split(',')[0]}
                </Typography>
              )}
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
          margin="dense"
          size="small"
          label="Catatan (opsional)"
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tambahkan catatan untuk approval (opsional)"
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
          onClick={() => loan && onApprove(loan.id, note)}
          variant="contained"
          color="success"
          startIcon={<ApproveIcon />}
          disabled={currentUserRole === 'marketing' && !(Array.isArray(currentUserCompanies) && loan?.company && loan.company.every(c => currentUserCompanies.includes(c)))}
        >
          Setujui
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ApproveDialog