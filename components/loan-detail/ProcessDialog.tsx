import React, { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Card, Stack, Typography, DialogContentText } from '@mui/material'

interface ProcessDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (note?: string) => void
  defaultNote?: string
  title?: string
  loan?: any | null
  getNeedTypeLabel?: (needType: string) => string
  getPickupMethodLabel?: (method?: string | null) => string
  confirmLabel?: string
  noteLabel?: string
  notePlaceholder?: string
  requireNote?: boolean
  requireNoteMessage?: string
}

const ProcessDialog: React.FC<ProcessDialogProps> = ({
  open,
  onClose,
  onConfirm,
  defaultNote = '',
  title = 'Proses Peminjaman',
  loan = null,
  getNeedTypeLabel,
  getPickupMethodLabel,
  confirmLabel = 'Proses',
  noteLabel = 'Catatan (opsional)',
  notePlaceholder = 'Tulis catatan singkat mengenai proses peminjaman ini (opsional)',
  requireNote = false,
  requireNoteMessage = 'Catatan wajib diisi'
}) => {
  const [note, setNote] = useState<string | undefined>(defaultNote)
  const [noteError, setNoteError] = useState<string | null>(null)

  useEffect(() => {
    setNote(defaultNote)
    setNoteError(null)
  }, [defaultNote, open])

  const handleConfirm = () => {
    const trimmed = (note ?? '').trim()
    if (requireNote && !trimmed) {
      setNoteError(requireNoteMessage)
      return
    }
    setNoteError(null)
    onConfirm(requireNote ? trimmed : note)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {loan && (
          <>
            <DialogContentText sx={{ mb: 2 }}>
              Berikut informasi peminjam — pastikan data berikut sudah benar sebelum memproses peminjaman.
            </DialogContentText>
            <Card variant="outlined" sx={{ p: 2, bgcolor: 'rgba(2,136,209,0.04)', mb: 2 }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0277bd' }}>
                  {loan.borrowerName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Entitas: {loan.entitasId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Kebutuhan: {getNeedTypeLabel ? getNeedTypeLabel(loan.needType) : loan.needType}
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
          </>
        )}
        <TextField
          label={noteLabel}
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          value={note ?? ''}
          onChange={(e) => {
            setNote(e.target.value)
            if (noteError) setNoteError(null)
          }}
          placeholder={notePlaceholder}
          error={Boolean(noteError)}
          helperText={noteError || ' '}
          inputProps={{
            // keep the textarea compact and prevent it from growing too tall
            style: { minHeight: 56, maxHeight: 160, overflow: 'auto' }
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Batal</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProcessDialog
