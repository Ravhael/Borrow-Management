import React from 'react'
import { LoanData } from '../../types/loanDetail'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, CircularProgress } from '@mui/material'
import {
  Typography,
  Box,
  Avatar,
  Stack,
  Alert,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import {
  Event as EventIcon,
  DateRange as DateRangeIcon,
  Send as SendIcon,
  ArrowBack as ReturnIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { formatDate } from '../../utils/loanHelpers'

interface ScheduleInfoProps {
  loan: LoanData
  currentUserRole?: string | null
  currentUserCompanies?: string[]
}

const ScheduleInfo: React.FC<ScheduleInfoProps> = ({ loan, currentUserRole, currentUserCompanies }) => {
  const router = useRouter()
  const [approveOpen, setApproveOpen] = React.useState(false)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [approveLoading, setApproveLoading] = React.useState(false)
  const [rejectLoading, setRejectLoading] = React.useState(false)
  const [approveDecisionNote, setApproveDecisionNote] = React.useState('')
  const [rejectDecisionNote, setRejectDecisionNote] = React.useState('')
  const extendStatusAll: any = loan.extendStatus as any
  const extendEntries: any[] = Array.isArray(extendStatusAll) ? extendStatusAll : (extendStatusAll ? [extendStatusAll] : [])
  const latestExtend = extendEntries.length > 0 ? extendEntries[extendEntries.length - 1] : null
  const scheduleItems = [
    {
      icon: <SendIcon />,
      label: 'Tanggal Submit',
      value: formatDate(loan.submittedAt),
      color: '#9c27b0',
      bgColor: 'rgba(156, 39, 176, 0.1)',
      status: 'Permintaan diajukan'
    },
    {
      icon: <EventIcon />,
      label: 'Tanggal Keluar',
      value: formatDate(loan.outDate),
      color: '#ed6c02',
      bgColor: 'rgba(237, 108, 2, 0.1)',
      status: 'Barang keluar dari gudang'
    },
    {
      icon: <DateRangeIcon />,
      label: 'Tanggal Penggunaan',
      value: formatDate(loan.useDate),
      color: '#1565c0',
      bgColor: 'rgba(21, 101, 192, 0.1)',
      status: 'Mulai digunakan'
    },
    {
      icon: <ReturnIcon />,
      label: 'Tanggal Kembali',
      // On the loan detail page we intentionally show the original submitted return date
      // so the user can always see what they asked for when creating the loan.
      value: formatDate(loan.returnDate),
      color: '#2e7d32',
      bgColor: 'rgba(46, 125, 50, 0.1)',
      status: 'Harus dikembalikan'
    }
  ]

  return (
    <Box sx={{ height: '100%' }}>
      <Stack spacing={3}>
        {/* Timeline Header */}
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            Timeline Peminjaman
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Jadwal lengkap proses peminjaman
          </Typography>
        </Box>

        {/* Timeline Items */}
        <Stack spacing={2}>
          {scheduleItems.map((item, index) => (
            <Card
              key={index}
              elevation={1}
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 24,
                  top: 56,
                  bottom: -16,
                  width: 2,
                  backgroundColor: index < scheduleItems.length - 1 ? '#e0e0e0' : 'transparent',
                  zIndex: 1,
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: item.bgColor,
                      width: 48,
                      height: 48,
                      border: `2px solid ${item.color}`,
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    {React.cloneElement(item.icon, { sx: { color: item.color } })}
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {item.label}
                      </Typography>
                      {index === 0 && (
                        <Chip
                          label="Awal"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(237, 108, 2, 0.1)',
                            color: '#ed6c02',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                      {index === scheduleItems.length - 1 && (
                        <Chip
                          label="Akhir"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(156, 39, 176, 0.1)',
                            color: '#9c27b0',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
                      {item.value}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                      {item.status}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
          {/* Perpanjangan (render history) */}
          {extendEntries.length > 0 && (
            <Box>
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Perpanjangan</Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>({extendEntries.length}x diajukan)</Typography>
              </Box>

              {extendEntries.map((entry, i) => {
                const statusLabel = (entry?.approveStatus as string) || (entry?.reqStatus as string) || 'Menunggu'
                const st = String(statusLabel || '').toLowerCase()
                const isApproved = st.includes('setujui')
                const isRejected = st.includes('tolak') || st.includes('ditolak')

                const chipBg = isApproved ? 'rgba(46,125,50,0.08)' : isRejected ? 'rgba(211,47,47,0.08)' : 'rgba(255, 193, 7, 0.08)'
                const chipColor = isApproved ? '#2e7d32' : isRejected ? '#d32f2f' : '#f57f17'

                return (
                  <Accordion
                    key={`extend-${i}`}
                    defaultExpanded={
                      // open if this is the last entry OR if it has no approveStatus (pending)
                      i === extendEntries.length - 1 || !entry?.approveStatus
                    }
                    sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', mb: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Avatar sx={{ bgcolor: 'rgba(255, 193, 7, 0.08)', width: 36, height: 36, border: `2px solid #f57f17` }}><ReturnIcon sx={{ color: '#f57f17', fontSize: 20 }} /></Avatar>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>Permintaan Perpanjangan #{i + 1}</Typography>
                            <Chip label={statusLabel || 'Menunggu'} size="small" sx={{ bgcolor: chipBg, color: chipColor, fontWeight: 600, fontSize: '0.7rem' }} />
                          </Box>
                          <Typography variant="caption" sx={{ color: '#666' }}>{entry?.requestedReturnDate ? new Date(String(entry.requestedReturnDate)).toLocaleDateString('id-ID') : '—'}</Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ width: 48 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ color: '#666' }}>Diajukan oleh: <strong>{entry?.requestBy ?? '—'}</strong>{entry?.requestAt ? ` • ${new Date(String(entry.requestAt)).toLocaleDateString('id-ID')}` : ''}</Typography>
                          {entry?.note && (<Typography variant="body2" sx={{ color: '#666', mt: 0.5, fontStyle: 'italic' }}><strong>Catatan perpanjangan:</strong> {entry.note}</Typography>)}
                          {entry?.approveStatus && (<Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>Diproses: <strong>{entry?.approveBy ?? '—'}</strong>{entry?.approveAt ? ` • ${new Date(String(entry.approveAt)).toLocaleDateString('id-ID')}` : ''}</Typography>)}
                          {entry?.approveNote && (<Alert severity={String(entry?.approveStatus || '').toLowerCase().includes('setujui') ? 'success' : 'error'} sx={{ mt: 1 }}><Typography variant="body2"><strong>Catatan:</strong> {entry.approveNote}</Typography></Alert>)}

                          {i === extendEntries.length - 1 && !entry?.approveStatus && currentUserRole === 'marketing' && Array.isArray(currentUserCompanies) && loan.company && loan.company.some((c: string) => currentUserCompanies.includes(c)) && (
                            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                              <Button variant="contained" color="success" onClick={() => setApproveOpen(true)}>Approve</Button>
                              <Button variant="contained" color="error" onClick={() => setRejectOpen(true)}>Reject</Button>
                            </Stack>
                          )}
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )
              })}

            </Box>

          )}
        </Stack>

        {/* Approve / Reject dialogs for latest extend (moved from LoanDetails) */}
        <Dialog open={approveOpen} onClose={() => { if (!approveLoading) setApproveOpen(false) }} maxWidth="sm" fullWidth>
          <DialogTitle>Konfirmasi Persetujuan</DialogTitle>
          <DialogContent dividers>
            <DialogContentText sx={{ mb: 2 }}>Apakah anda yakin akan menyetujui permintaan perpanjangan ini?</DialogContentText>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.9)', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Pengajuan Awal</Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>Tanggal Keluar: <strong>{loan.outDate ? new Date(String(loan.outDate)).toLocaleDateString('id-ID') : '-'}</strong></Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Tanggal Penggunaan: <strong>{loan.useDate ? new Date(String(loan.useDate)).toLocaleDateString('id-ID') : '-'}</strong></Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Tanggal kembali sebelumnya: <strong>{(loan.returnDate || loan.outDate) ? new Date(String(loan.returnDate || loan.outDate)).toLocaleDateString('id-ID') : '-'}</strong></Typography>
              </Box>

              <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.9)', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Permintaan Perpanjangan</Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>Diajukan oleh: <strong>{latestExtend?.requestBy ?? '—'}</strong></Typography>
                {latestExtend?.requestAt && (<Typography variant="caption" sx={{ color: '#666', display: 'block' }}>{new Date(String(latestExtend.requestAt)).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Typography>)}
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Tanggal pengembalian yang diminta: <strong>{latestExtend?.requestedReturnDate ? new Date(String(latestExtend.requestedReturnDate)).toLocaleDateString('id-ID') : '-'}</strong></Typography>
                {latestExtend?.note && (<Alert severity="info" sx={{ mt: 1 }}><Typography variant="body2">{latestExtend.note}</Typography></Alert>)}
              </Box>
            </Stack>

            <Box sx={{ mt: 2 }}>
              <TextField label="Catatan Persetujuan (opsional)" placeholder="Tambahkan catatan saat menyetujui (opsional)" multiline minRows={1} maxRows={3} fullWidth value={approveDecisionNote} onChange={(e) => setApproveDecisionNote(String(e.target.value))} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { if (!approveLoading) setApproveOpen(false) }} disabled={approveLoading}>Batal</Button>
            <Button variant="contained" color="success" onClick={async () => {
              try {
                setApproveLoading(true)
                const res = await fetch(`/api/loans/${loan.id}/extend/decision`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve', note: approveDecisionNote }) })
                const json = await res.json().catch(() => ({}))
                if (!res.ok) { toast.error(json?.message || 'Gagal melakukan approve'); return }
                toast.success('Perpanjangan berhasil disetujui')
                setApproveOpen(false)
                setApproveDecisionNote('')
                router.reload()
              } catch (e) {
                console.error(e)
                toast.error('Gagal melakukan approve')
              } finally { setApproveLoading(false) }
            }} disabled={approveLoading} startIcon={approveLoading ? <CircularProgress size={16} color="inherit" /> : undefined}>Ya, Setujui</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={rejectOpen} onClose={() => { if (!rejectLoading) setRejectOpen(false) }} maxWidth="sm" fullWidth>
          <DialogTitle>Konfirmasi Penolakan</DialogTitle>
          <DialogContent dividers>
            <DialogContentText sx={{ mb: 2 }}>Apakah anda yakin akan menolak permintaan perpanjangan ini?</DialogContentText>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.9)', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Pengajuan Awal</Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>Tanggal Keluar: <strong>{loan.outDate ? new Date(String(loan.outDate)).toLocaleDateString('id-ID') : '-'}</strong></Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Tanggal Penggunaan: <strong>{loan.useDate ? new Date(String(loan.useDate)).toLocaleDateString('id-ID') : '-'}</strong></Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Tanggal kembali sebelumnya: <strong>{(loan.returnDate || loan.outDate) ? new Date(String(loan.returnDate || loan.outDate)).toLocaleDateString('id-ID') : '-'}</strong></Typography>
              </Box>
              <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.9)', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Permintaan Perpanjangan</Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>Diajukan oleh: <strong>{latestExtend?.requestBy ?? '—'}</strong></Typography>
                {latestExtend?.requestAt && (<Typography variant="caption" sx={{ color: '#666', display: 'block' }}>{new Date(String(latestExtend.requestAt)).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Typography>)}
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Tanggal pengembalian yang diminta: <strong>{latestExtend?.requestedReturnDate ? new Date(String(latestExtend.requestedReturnDate)).toLocaleDateString('id-ID') : '-'}</strong></Typography>
                {latestExtend?.note && (<Alert severity="info" sx={{ mt: 1 }}><Typography variant="body2">{latestExtend.note}</Typography></Alert>)}
              </Box>
            </Stack>
            <Box sx={{ mt: 2 }}>
              <TextField label="Catatan Penolakan (opsional)" placeholder="Tambahkan catatan saat menolak (opsional)" multiline minRows={1} maxRows={3} fullWidth value={rejectDecisionNote} onChange={(e) => setRejectDecisionNote(String(e.target.value))} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { if (!rejectLoading) setRejectOpen(false) }} disabled={rejectLoading}>Batal</Button>
            <Button variant="contained" color="error" onClick={async () => {
              try {
                setRejectLoading(true)
                const res = await fetch(`/api/loans/${loan.id}/extend/decision`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', note: rejectDecisionNote }) })
                const json = await res.json().catch(() => ({}))
                if (!res.ok) { toast.error(json?.message || 'Gagal menolak perpanjangan'); return }
                toast.success('Perpanjangan berhasil ditolak')
                setRejectOpen(false)
                setRejectDecisionNote('')
                router.reload()
              } catch (e) {
                console.error(e)
                toast.error('Gagal menolak perpanjangan')
              } finally { setRejectLoading(false) }
            }} disabled={rejectLoading} startIcon={rejectLoading ? <CircularProgress size={16} color="inherit" /> : undefined}>Ya, Tolak</Button>
          </DialogActions>
        </Dialog>

        {/* Summary card removed — duration is now shown in the header */}
      </Stack>
    </Box>
  )
}

export default ScheduleInfo