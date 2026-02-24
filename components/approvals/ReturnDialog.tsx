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
  Card,
  Stack,
  Box,
  TextField,
  DialogContentText,
  CircularProgress,
} from '@mui/material'
import Image from 'next/image'
import { CheckCircle as ReturnIcon } from '@mui/icons-material'

interface LoanData {
  id: string
  borrowerName: string
  entitasId: string
  needType: string
  userId?: string
  productDetailsText?: string
  productDetails?: any
  pickupMethod?: string | null
}

interface ReturnDialogProps {
  open: boolean
  loan: LoanData | null
  note?: string
  title?: string
  confirmButtonText?: string
  actionLabel?: string
  noteRequired?: boolean
  filesRequired?: boolean
  submitting?: boolean
  noteError?: string
  hideConfirmIcon?: boolean
  onClose: () => void
  onConfirm: (loanId: string, note?: string, files?: File[]) => void
  onFilesChange?: (files: File[]) => void
  onNoteChange?: (note: string) => void
  getNeedTypeLabel: (needType: string) => string
  getPickupMethodLabel?: (method?: string | null) => string
}

const ReturnDialog: React.FC<ReturnDialogProps> = ({
  open,
  loan,
  note,
  title,
  confirmButtonText,
  actionLabel,
  noteRequired,
  filesRequired,
  submitting,
  noteError,
  hideConfirmIcon,
  onClose,
  onConfirm,
  onFilesChange,
  onNoteChange,
  getNeedTypeLabel,
  getPickupMethodLabel,
}) => {
  const [localFiles, setLocalFiles] = React.useState<File[]>([])
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const MAX_FILES = 6
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const handleFilesSelected = (filesList?: FileList | null) => {
    if (!filesList) return
    const filesArr = Array.from(filesList)
    // keep only image types (basic validation)
    const images = filesArr.filter(f => f.type.startsWith('image/'))
    const tooLarge = images.filter(f => f.size > MAX_FILE_SIZE)
    if (tooLarge.length > 0) {
      toast.error('Beberapa file terlalu besar — maksimal 5MB per file')
    }

    const accepted = images.filter(f => f.size <= MAX_FILE_SIZE)
    const merged = [...localFiles, ...accepted].slice(0, MAX_FILES) // cap
    if (merged.length >= MAX_FILES && (localFiles.length + accepted.length) > MAX_FILES) {
      toast('Batas maksimal 6 file dipenuhi', { icon: '⚠️' })
    }
    setLocalFiles(merged)
    onFilesChange && onFilesChange(merged)
  }

  const removeFileAt = (index: number) => {
    const next = localFiles.filter((_, i) => i !== index)
    setLocalFiles(next)
    onFilesChange && onFilesChange(next)
  }

  // clear local files whenever dialog closes
  React.useEffect(() => {
    if (!open && localFiles.length > 0) {
      // revoke object urls is optional; relying on GC for now
      setLocalFiles([])
      onFilesChange && onFilesChange([])
    }
  }, [open, localFiles.length, onFilesChange])
  const confirmDisabled = Boolean((noteRequired && !(note ?? '').trim()) || (filesRequired && localFiles.length === 0))

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography component="div" variant="h6" sx={{ fontWeight: 600 }}>
          {title ?? 'Konfirmasi Pengembalian'}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {noteRequired ? 'Catatan wajib diisi untuk menyelesaikan tindakan ini.' : 'Tandai peminjaman ini sebagai telah dikembalikan oleh peminjam. (Opsional: tambahkan catatan terkait pengembalian)'}
        </DialogContentText>

        {loan && (
          <Card variant="outlined" sx={{ p: 2, bgcolor: 'rgba(2,136,209,0.04)', mb: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'info.main' }}>
                {loan.borrowerName}
              </Typography>
              <Typography variant="body2" color="text.secondary">Entitas: {loan.entitasId}</Typography>
              <Typography variant="body2" color="text.secondary">Kebutuhan: {getNeedTypeLabel(loan.needType)}</Typography>
              <Typography variant="body2" color="text.secondary">Metode Pengambilan: {getPickupMethodLabel ? getPickupMethodLabel(loan.pickupMethod) : loan.pickupMethod || '-'}</Typography>
              {productDetails && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'info.main', mt: 1 }}>
                    Detail Produk
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap', mt: 0.5 }}>
                    {productDetails}
                  </Typography>
                </>
              )}
            </Stack>
          </Card>
        )}

        {actionLabel && <Chip label={actionLabel} color="info" sx={{ mb: 2 }} />}
        <TextField
          margin="dense"
          size="small"
          label={`Catatan ${noteRequired ? '(wajib)' : '(opsional)'}`}
          fullWidth
          multiline
          minRows={noteRequired ? 2 : 1}
          maxRows={4}
          value={note ?? ''}
          onChange={(e) => { onNoteChange && onNoteChange(e.target.value) }}
          sx={{ '& .MuiInputBase-input, & .MuiOutlinedInput-input': { color: 'black !important', caretColor: 'black !important', WebkitTextFillColor: 'black !important', opacity: 1, textShadow: 'none' } }}
          placeholder="Tambahkan catatan terkait kondisi atau catatan pengembalian (opsional)"
          variant="outlined"
          inputProps={{ style: { color: 'black', caretColor: 'black', paddingTop: 2, paddingBottom: 2 } }}
          required={noteRequired}
          error={Boolean(noteError)}
          helperText={noteError ?? ''}
        />

        {/* File upload (images) */}
        <Box sx={{ mt: 2 }}>
          <input
            id="return-files-input"
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <label htmlFor="return-files-input">
            <Button variant="outlined" component="span" size="small">
              Unggah bukti foto / file
            </Button>
          </label>

          {localFiles.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {localFiles.map((f, idx) => (
                <Card key={idx} variant="outlined" sx={{ width: 92, height: 92, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Image
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    fill
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    unoptimized
                  />
                  <Button
                    size="small"
                    onClick={() => removeFileAt(idx)}
                    sx={{ position: 'absolute', top: 2, right: 2, minWidth: 0, p: 0.4, bgcolor: 'rgba(0,0,0,0.4)', color: 'white' }}
                  >
                    ✕
                  </Button>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">Batal</Button>
        <Button
          onClick={() => loan && onConfirm(loan.id, note, localFiles)}
          variant="contained"
          color="info"
          startIcon={(!hideConfirmIcon && !submitting) ? <ReturnIcon /> : (submitting ? <CircularProgress size={16} color="inherit" /> : undefined)}
          disabled={Boolean(submitting) || confirmDisabled}
        >
          {submitting ? 'Memproses...' : (confirmButtonText ?? 'Konfirmasi Pengembalian')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReturnDialog
