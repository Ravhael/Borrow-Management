import React from 'react'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  TextField,
  Box,
  CircularProgress,
  MenuItem,
} from '@mui/material'
import { LoanData } from '../../types/loanDetail'
import { formatDateTime } from '../../utils/loanHelpers'
import PreloadingOverlay from '../PreloadingOverlay'

interface ReturnRequestEntry {
  id: string
  status?: string
  requestedBy?: string
  requestedAt?: string
  note?: string
  originalNote?: string
  processedNote?: string
  requestId?: string
}

interface ReturnActionDialogProps {
  open: boolean
  onClose: () => void
  loan?: any | null
  entry?: ReturnRequestEntry | null
  action: 'returnAccepted' | 'return_rejected' | 'completed' | string
  note?: string
  setNote?: (n: string) => void
  // second parameter `condition` is the selected return status (e.g. "Dikembalikan Lengkap")
  onConfirm: (note?: string, condition?: string) => Promise<void>
  submitting?: boolean
  noteError?: string | null
}

const ReturnActionDialog: React.FC<ReturnActionDialogProps> = ({
  open,
  onClose,
  loan,
  entry,
  action,
  note,
  setNote,
  onConfirm,
  submitting,
  noteError,
}) => {
  // no inputRef required anymore; remove debug logging in onChange
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [submittingAction, setSubmittingAction] = React.useState(false)
  const [condition, setCondition] = React.useState<string>('')
  const [overlayOpen, setOverlayOpen] = React.useState(false)

  const productDetails = React.useMemo(() => {
    if (!loan) return null
    if (typeof loan.productDetailsText === 'string' && loan.productDetailsText.trim()) return loan.productDetailsText
    if (loan.productDetails !== undefined && loan.productDetails !== null) {
      if (typeof loan.productDetails === 'string') return loan.productDetails
      if (Array.isArray(loan.productDetails)) return loan.productDetails.map((it: any) => String(it || '').trim()).filter(Boolean).join('\n')
      try { return JSON.stringify(loan.productDetails, null, 2) } catch { return String(loan.productDetails) }
    }
    return null
  }, [loan])

  const getTitle = () => {
    if (action === 'returnAccepted') return 'Selesaikan Peminjaman'
    if (action === 'completed') return 'Selesaikan Peminjaman'
    if (action === 'return_rejected') return 'Tolak Pengembalian'
    return 'Selesaikan Peminjaman'
  }

  const getMessage = () => {
    if (action === 'returnAccepted') return 'Apakah Anda yakin ingin mengonfirmasi pengembalian barang ini?\nTindakan ini berarti Anda telah menerima barang tersebut. Lanjutkan ?'
    if (action === 'completed') return 'Apakah Anda yakin ingin menandai peminjaman ini sebagai selesai?\nTindakan ini menandakan pengembalian final telah tercatat. Lanjutkan ?'
    if (action === 'return_rejected') return 'Apakah Anda yakin ingin menolak permintaan pengembalian ini?\nTindakan ini akan menandai permintaan sebagai ditolak. Lanjutkan ?'
    return 'Apakah Anda yakin ingin melanjutkan tindakan ini?'
  }

  const getOverlayText = () => {
    if (action === 'returnAccepted') return 'Mengonfirmasi pengembalian...'
    if (action === 'completed') return 'Menyelesaikan peminjaman...'
    if (action === 'return_rejected') return 'Menolak pengembalian...'
    return 'Memproses tindakan...'
  }

    const handleConfirm = async () => {
    setConfirmOpen(false)
    try {
      setOverlayOpen(true)
      setSubmittingAction(true)
      await onConfirm(note, condition || undefined)
    } catch (err) {
      console.error('ReturnActionDialog failed confirm', err)
      toast.error('Gagal memproses tindakan ini')
    } finally {
      setSubmittingAction(false)
      setOverlayOpen(false)
    }
  }

  const title = getTitle()
  const message = getMessage()

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          {loan && entry && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">#{loan.id}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{loan.borrowerName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Permintaan oleh {entry.requestedBy ?? 'Pemohon'} pada {formatDateTime(entry.requestedAt)}
              </Typography>
              {(() => {
                // Prefer explicit note on the entry, fall back to originalNote attached during dedupe
                const orig = (entry as any).note ?? (entry as any).originalNote ?? loan?.returnRequest?.find((r: any) => r.id === (entry as any).requestId)?.note
                if (orig) return (<Typography variant="body2" sx={{ mb: 2 }}><strong>Catatan pemohon:</strong> {orig}</Typography>)
                return null
              })()}
              {entry.processedNote && (
                <Typography variant="body2" sx={{ mb: 2 }}><strong>Catatan Pemroses:</strong> {entry.processedNote}</Typography>
              )}

              {productDetails && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'info.main', mt: 1 }}>
                    Detil Produk
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap', mt: 0.5 }}>
                    {productDetails}
                  </Typography>
                </>
              )}
            </Box>
          )}

          <Chip label={`Tindakan: ${action === 'returnAccepted' ? 'Konfirmasi Pengembalian' : action === 'completed' ? 'Peminjaman Selesai' : action === 'return_rejected' ? 'Tolak Pengembalian' : action}`} color={action === 'return_rejected' ? 'error' : action === 'completed' ? 'info' : 'success'} sx={{ mb: 2 }} />

          {action === 'returnAccepted' && (
            <TextField
              select
              fullWidth
              margin="dense"
              size="small"
              label="Pilih Status Pengembalian"
              value={condition}
              onChange={(e) => setCondition(String(e.target.value))}
              
            >
              <MenuItem value="">-- Pilih Status Pengembalian --</MenuItem>
              <MenuItem value="Dikembalikan Lengkap">Dikembalikan Lengkap</MenuItem>
              <MenuItem value="Dikembalikan Tidak Lengkap">Dikembalikan Tidak Lengkap</MenuItem>
              <MenuItem value="Dikembalikan rusak/cacat">Dikembalikan rusak/cacat</MenuItem>
            </TextField>
          )}

          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={4}
            label="Catatan (wajib)"
            required
            value={note ?? ''}
            onChange={(e) => setNote && setNote(e.target.value)}
            sx={{
              '& .MuiInputBase-root': { maxHeight: 200, overflow: 'auto' },
              '& .MuiInputBase-input, & .MuiOutlinedInput-input': {
                color: 'black !important',
                caretColor: 'black !important',
                WebkitTextFillColor: 'black !important',
                opacity: 1,
                textShadow: 'none'
              }
            }}
            inputProps={{ style: { color: 'black', caretColor: 'black' } }}
            error={Boolean(noteError)}
            helperText={noteError ?? ''}
          />
        </DialogContent>
          <DialogActions>
          <Button variant="outlined" onClick={onClose}>Batal</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!note || String(note).trim() === '') {
                // parent is expected to handle an error, but show toast for safety
                toast.error('Catatan pengembalian wajib diisi')
                return
              }
              if (action === 'returnAccepted' && !condition) {
                toast.error('Status Pengembalian wajib dipilih')
                return
              }
              setConfirmOpen(true)
            }}
            disabled={!note || String(note).trim() === ''}
          >
            Konfirmasi
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirmOpen(false)}>Tidak</Button>
          <Button variant="contained" onClick={handleConfirm} disabled={submittingAction}>
            {submittingAction ? (
              <>
                <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> Memproses...
              </>
            ) : 'Ya'}
          </Button>
        </DialogActions>
      </Dialog>
      <PreloadingOverlay open={overlayOpen || submittingAction} text={getOverlayText()} />
    </>
  )
}

export default ReturnActionDialog
