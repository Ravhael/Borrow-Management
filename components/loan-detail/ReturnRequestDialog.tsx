import React from 'react'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Card,
  Stack,
  Box,
  TextField,
  DialogContentText,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material' 
import { formatDate, getDurationInfo, getEffectiveReturnDate } from '../../utils/loanHelpers'
import Image from 'next/image'
import { Assignment as RequestIcon } from '@mui/icons-material'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import CameraAltIcon from '@mui/icons-material/CameraAlt'

interface LoanDataSimple {
  id: string
  borrowerName?: string
  entitasId?: string
  needType?: string
  productDetailsText?: string
  pickupMethod?: string | null
  outDate?: string | null
  useDate?: string | null
  returnDate?: string | null
}

const formatDatePukul = (v?: string | null) => {
  if (!v) return '-'
  try {
    const d = new Date(v)
    const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    // format time like '07.00' instead of '07:00'
    const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
    return `${date} pukul ${time}`
  } catch (e) {
    return formatDate(v ?? undefined)
  }
}

// use centralized getDurationInfo helper from utils/loanHelpers

interface ReturnRequestDialogProps {
  open: boolean
  loan: LoanDataSimple | null
  note?: string
  onClose: () => void
  onConfirm: (loanId: string, note?: string, files?: File[]) => void
  onFilesChange?: (files: File[]) => void
  onNoteChange?: (note: string) => void
  getNeedTypeLabel: (needType: string) => string
  getPickupMethodLabel?: (method?: string | null) => string
}

const ReturnRequestDialog: React.FC<ReturnRequestDialogProps> = ({
  open,
  loan,
  note,
  onClose,
  onConfirm,
  onFilesChange,
  onNoteChange,
  getNeedTypeLabel,
  getPickupMethodLabel
}) => {
  const [localFiles, setLocalFiles] = React.useState<File[]>([])
  const [loading, setLoading] = React.useState(false)
  const [requestAt, setRequestAt] = React.useState<string | null>(null)
  const [showValidation, setShowValidation] = React.useState(false)
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null)
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null)

  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  const MAX_FILES = 6
  const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

  const handleFilesSelected = (filesList?: FileList | null) => {
    if (!filesList) return
    const filesArr = Array.from(filesList)
    const imageFiles = filesArr.filter(f => f.type && f.type.startsWith('image/'))
    const rejectedType = filesArr.filter(f => !f.type || !f.type.startsWith('image/'))
    if (rejectedType.length > 0) {
      toast.error('Hanya file gambar yang diperbolehkan (JPG, PNG, HEIC, dll).')
    }

    const tooLarge = imageFiles.filter(f => f.size > MAX_FILE_SIZE)
    if (tooLarge.length > 0) {
      toast.error('Beberapa file melebihi batas 20MB per file.')
    }

    const accepted = imageFiles.filter(f => f.size <= MAX_FILE_SIZE)
    const merged = [...localFiles, ...accepted].slice(0, MAX_FILES)
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

  React.useEffect(() => {
    if (open) {
      // capture the time when the dialog opens (submission time)
      setRequestAt(new Date().toISOString())
      setShowValidation(false)
    }
    if (!open && localFiles.length > 0) setLocalFiles([])
  }, [open, localFiles.length])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isSmall}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography component="div" variant="h6" sx={{ fontWeight: 600 }}>
          Ajukan Pengembalian
        </Typography>
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Ajukan permintaan pengembalian barang. Isi catatan singkat dan unggah bukti jika diperlukan. Tim gudang akan meninjau permintaan pengembalian ini.
        </DialogContentText>

        {loan && (
          <Card variant="outlined" sx={{ p: { xs: 2, md: 3 }, bgcolor: 'rgba(2,136,209,0.03)', mb: 2, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: isSmall ? 'column' : 'row', alignItems: isSmall ? 'stretch' : 'flex-start', justifyContent: 'space-between', gap: { xs: 1, md: 2 }, flexWrap: 'wrap' }}>
              <Box sx={{ minWidth: 220, flex: '1 1 auto' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'info.dark' }}>
                  {loan.borrowerName}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Entitas: {loan.entitasId || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">Kebutuhan: {loan.needType ? getNeedTypeLabel(loan.needType) : '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">Metode Pengambilan: {getPickupMethodLabel ? getPickupMethodLabel(loan.pickupMethod) : loan.pickupMethod || '-'}</Typography>
                </Box>
              </Box>

              {(() => {
                const effective = getEffectiveReturnDate(loan as any)
                const duration = getDurationInfo(loan.useDate ?? null, effective ?? loan.returnDate ?? null)
                if (!duration) return null
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isSmall ? 'flex-start' : 'flex-end', gap: 0.5, minWidth: 220, mt: isSmall ? 1 : 0 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Durasi Peminjaman Saat Pengajuan</Typography>
                    <Chip
                      icon={<EventAvailableIcon sx={{ color: 'white' }} />}
                      label={
                        <Box sx={{ display: 'flex', flexDirection: isSmall ? 'column' : 'row', alignItems: isSmall ? 'flex-start' : 'center', gap: 0.5, maxWidth: '100%' }}>
                          <Typography sx={{ fontWeight: 700, color: 'white', fontSize: { xs: '0.85rem', md: '0.95rem' }, lineHeight: 1 }}>
                            {duration.label}
                          </Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.95)', fontSize: { xs: '0.78rem', md: '0.875rem' }, whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {duration.range}
                          </Typography>
                        </Box>
                      }
                      sx={{
                        background: 'linear-gradient(135deg,#1a365d,#00d4aa)',
                        color: 'white',
                        py: { xs: 1.8, md: 0.8 },
                        px: { xs: 1.8, md: 1.25 },
                        borderRadius: 3,
                        alignSelf: 'flex-start',
                        maxWidth: '100%',
                        minHeight: { xs: 60, md: 'auto' },
                        // ensure internal label receives the same vertical spacing
                        '& .MuiChip-label': {
                          py: { xs: 1.25, md: 0.6 },
                        }
                      }}
                    />
                    {requestAt && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>Diajukan pada {formatDatePukul(requestAt)}</Typography>
                    )}
                  </Box>
                )
              })()}
            </Box>
              {loan.productDetailsText && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.4,
                    mt: 0.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    maxHeight: { xs: 150, md: 'none' },
                    overflowY: { xs: 'auto', md: 'visible' },
                    // small inner padding to prevent text touching edges on very small screens
                    pr: { xs: 0.5, md: 0 }
                  }}
                >
                  {loan.productDetailsText}
                </Typography>
              )}
            
          </Card>
        )}

        <TextField
          margin="dense"
          size="small"
          label="Catatan pengembalian *"
          fullWidth
          multiline
          minRows={1}
          value={note ?? ''}
          onChange={(e) => { onNoteChange && onNoteChange(e.target.value); setShowValidation(false) }}
          placeholder="Contoh: Barang sudah tidak terpakai — jelaskan alasan (wajib)"
          variant="outlined"
          required
          error={showValidation && (!note || String(note).trim() === '')}
          helperText={showValidation && (!note || String(note).trim() === '') ? 'Catatan pengembalian wajib diisi' : ''}
        />

        <Box sx={{ mt: 2 }}>
          {/* Hidden inputs: one for gallery/multi-select, one for direct camera capture on mobile */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          {isSmall ? (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<CameraAltIcon />}
                fullWidth
                onClick={() => cameraInputRef.current?.click()}
              >
                Ambil Foto
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => galleryInputRef.current?.click()}
              >
                Pilih dari Galeri
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} sx={{ mt: isSmall ? 1 : 0 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<CameraAltIcon />}
                onClick={() => cameraInputRef.current?.click()}
              >
                Ambil Foto (Kamera)
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => galleryInputRef.current?.click()}
              >
                Unggah Foto / Bukti *
              </Button>
            </Stack>
          )}

          {localFiles.length === 0 && showValidation && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>Unggah minimal 1 foto sebagai bukti pengembalian</Typography>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Catatan: Maksimal 6 file gambar (JPG, PNG, HEIC, dll) dengan ukuran masing-masing hingga 20MB.
          </Typography>

          {localFiles.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {localFiles.map((f, idx) => (
                <Card key={idx} variant="outlined" sx={{ width: { xs: 72, sm: 92 }, height: { xs: 72, sm: 92 }, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Image
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    fill
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    unoptimized
                  />
                  <Button size="small" onClick={() => removeFileAt(idx)} sx={{ position: 'absolute', top: 2, right: 2, minWidth: 0, p: 0.4, bgcolor: 'rgba(0,0,0,0.4)', color: 'white' }}>✕</Button>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, flexDirection: isSmall ? 'column' : 'row', gap: isSmall ? 1 : 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading} fullWidth={isSmall}>Batal</Button>
        <Button
          onClick={() => {
            setShowValidation(true)
            const trimmed = String(note ?? '').trim()
            if (!loan) return
            if (!trimmed) return
            if (!localFiles || localFiles.length === 0) return
            onConfirm(loan.id, note, localFiles)
          }}
          variant="contained"
          color="info"
          startIcon={loading ? <CircularProgress size={16} /> : <RequestIcon />}
          disabled={loading || !note || String(note).trim() === '' || localFiles.length === 0}
          fullWidth={isSmall}
        >
          Kirim Permintaan
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReturnRequestDialog
