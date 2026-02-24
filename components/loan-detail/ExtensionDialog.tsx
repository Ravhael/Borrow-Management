import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material'
import { getEffectiveReturnDate, getDurationInfo } from '../../utils/loanHelpers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { PickersDay } from '@mui/x-date-pickers'
import { id as idLocale } from 'date-fns/locale'
// no direct date-fns format/parse required; using native Date and toLocaleDateString for display.
import { LoanData } from '../../types/loanDetail'

interface ExtensionDialogProps {
  open: boolean
  loan: LoanData
  currentUserId?: string | null
  currentUserEmail?: string | null
  onClose: () => void
  onSubmitted?: (updatedLoan?: any) => void
}

const ExtensionDialog: React.FC<ExtensionDialogProps> = ({ open, loan, onClose, onSubmitted, currentUserId, currentUserEmail }) => {
  const [note, setNote] = useState('')
  const [requestedReturnDate, setRequestedReturnDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // compute the currently active return date (prefers last approved extension)
  const activeReturnDateRaw = getEffectiveReturnDate(loan)
  const activeReturnDateValue = (() => {
    if (!activeReturnDateRaw) return ''
    try {
      const d = new Date(activeReturnDateRaw)
      if (Number.isNaN(d.getTime())) return ''
      // input type=date expects YYYY-MM-DD
      return d.toISOString().slice(0, 10)
    } catch (e) {
      return ''
    }
  })()
  // Format display as DD/MMMM/YYYY, e.g., 10/Desember/2025 (id-ID locale month)
  const activeReturnDateDisplay = (() => {
    if (!activeReturnDateRaw) return ''
    try {
      const d = new Date(activeReturnDateRaw)
      if (Number.isNaN(d.getTime())) return ''
      const day = String(d.getDate()).padStart(2, '0')
      const month = d.toLocaleDateString('id-ID', { month: 'long' })
      const year = String(d.getFullYear())
      return `${day}/${month}/${year}`
    } catch (e) {
      return ''
    }
  })()

  // Using MUI date pickers — no hidden native input/ref required

  const [pickerOpen, setPickerOpen] = useState(false)

  const requestedReturnDateDisplay = (() => {
    if (!requestedReturnDate) return ''
    try {
      const d = new Date(requestedReturnDate)
      if (Number.isNaN(d.getTime())) return ''
      const day = String(d.getDate()).padStart(2, '0')
      const month = d.toLocaleDateString('id-ID', { month: 'long' })
      const year = String(d.getFullYear())
      return `${day}/${month}/${year}`
    } catch (e) {
      return ''
    }
  })()

  // compute start candidate (useDate/outDate) for duration calculations
  const loanStartCandidate = (() => {
    return String(loan.useDate || loan.outDate || '') || ''
  })()

  const requestedDuration = (() => {
    if (!requestedReturnDate) return null
    const info = getDurationInfo(loanStartCandidate || null, requestedReturnDate || null)
    return info
  })()

  const activeReturnDateDate = (() => {
    try {
      if (!activeReturnDateRaw) return null
      const d = new Date(activeReturnDateRaw)
      if (Number.isNaN(d.getTime())) return null
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    } catch (e) {
      return null
    }
  })()

  const isSameDay = (a?: Date | null, b?: Date | null) => {
    if (!a || !b) return false
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  // Custom day component that highlights the active return date and forwards props to PickersDay
  const CustomDay = (dayProps: any) => {
    const theDay = dayProps?.day ? new Date(dayProps.day) : null
    const normalized = theDay ? new Date(theDay.getFullYear(), theDay.getMonth(), theDay.getDate()) : null
    const isActive = isSameDay(normalized, activeReturnDateDate)
    const sx = dayProps?.sx ?? {}
    const extra = isActive ? { border: '2px solid rgba(34,197,94,0.9)', boxShadow: '0 6px 14px rgba(34,197,94,0.08)' } : {}
    return <PickersDay {...dayProps} sx={{ ...sx, ...extra }} />
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    // client-side validation: both note and requestedReturnDate required
    let hasError = false
    if (!note || note.trim() === '') {
      setNoteError('Catatan harus diisi')
      hasError = true
    }
    if (!requestedReturnDate || String(requestedReturnDate).trim() === '') {
      setDateError('Tanggal yang diusulkan harus diisi')
      hasError = true
    }
    if (hasError) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/loans/${loan.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, requestedReturnDate })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        // show server-side message as general error
        throw new Error(body?.message || body?.error || `HTTP ${res.status}`)
      }

      const json = await res.json().catch(() => null)
      setLoading(false)
      // show inline success message, then close after short delay
      setError(null)
      setNote('')
      setRequestedReturnDate('')
      setSuccessMessage('Permintaan perpanjangan berhasil dikirim');
      // display the success message in the dialog, then close shortly
      // (we keep the onSubmitted callback to allow parent to refresh)
      (document.activeElement as HTMLElement | null)?.blur();
      // show success in UI by setting a transient `error` to the message but with success severity handled by parent
      if (onSubmitted) onSubmitted(json)
      // small delay so users see the alert in the dialog if needed, then close
      setTimeout(() => { setSuccessMessage(null); onClose() }, 900)
    } catch (err: any) {
      setError(String(err?.message || err))
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Ajukan Perpanjangan</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Catatan (alasan perpanjangan)"
            required
            multiline
            minRows={1}
            maxRows={4}
            value={note}
            onChange={(e) => { setNote(e.target.value); if (noteError) setNoteError(null); if (error) setError(null) }}
            error={Boolean(noteError)}
            helperText={noteError ?? ''}
            fullWidth
          />

          <TextField
            label="Tanggal kembali saat ini"
            InputLabelProps={{ shrink: true }}
            value={activeReturnDateDisplay || '-'}
            fullWidth
            InputProps={{ readOnly: true }}
            sx={{ bgcolor: 'rgba(221, 235, 255, 0.9)', borderRadius: 1 }}
            helperText="Tanggal pengembalian aktif (berdasarkan perpanjangan yang disetujui)"
          />

          {/* Using MUI DesktopDatePicker instead of a hidden native input */}

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={idLocale}>
            {/* Label and spacing to ensure the picker field is visible */}
            <div style={{ marginTop: 8, marginBottom: 4 }}>
              {/* Keep label visible even if DesktopDatePicker decides not to render a label */}
            </div>
            <DesktopDatePicker
              label="Tanggal kembali yang diusulkan"
            
              open={pickerOpen}
              onOpen={() => setPickerOpen(true)}
              onClose={() => setPickerOpen(false)}
              value={requestedReturnDate ? new Date(requestedReturnDate) : (activeReturnDateDate ?? null)}
              minDate={activeReturnDateDate ?? undefined}
              shouldDisableDate={(day: any) => {
                try {
                  if (!activeReturnDateDate) return false
                  const d = new Date(day)
                  const comp = new Date(d.getFullYear(), d.getMonth(), d.getDate())
                  return comp < activeReturnDateDate
                } catch (e) {
                  return false
                }
              }}
              slots={{
                day: CustomDay
              }}
              onChange={(newVal: any) => {
                if (!newVal) {
                  setRequestedReturnDate('')
                  return
                }
                // newVal is a Date — set state as YYYY-MM-DD string for backend
                try {
                  const d = new Date(newVal)
                  const y = d.getFullYear()
                  const m = String(d.getMonth() + 1).padStart(2, '0')
                  const dd = String(d.getDate()).padStart(2, '0')
                  setRequestedReturnDate(`${y}-${m}-${dd}`)
                  if (dateError) setDateError(null)
                  if (error) setError(null)
                } catch (e) {
                  setRequestedReturnDate('')
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  size: 'medium',
                  helperText: dateError ?? (requestedReturnDateDisplay ? requestedReturnDateDisplay : ''),
                  inputProps: { value: requestedReturnDateDisplay || '', readOnly: true, placeholder: 'Klik untuk memilih tanggal' },
                  sx: { bgcolor: 'rgba(221, 235, 255, 0.9)', borderRadius: 1, mt: 1 }
                }
              }}
            />
          </LocalizationProvider>
          {requestedDuration && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: '0.95rem', color: '#374151' }}>Durasi peminjaman: <strong>{requestedDuration.label}</strong></div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{requestedDuration.range}</div>
            </div>
          )}
          

          {error && <Alert severity="error">{error}</Alert>}
          {successMessage && <Alert severity="success">{successMessage}</Alert>}
          {/* Success message slot: the parent will reload the page so success is visible there */}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>Batal</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !note.trim() || !String(requestedReturnDate).trim()} startIcon={loading ? <CircularProgress size={16} /> : null}>
          Kirim Permintaan
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ExtensionDialog
