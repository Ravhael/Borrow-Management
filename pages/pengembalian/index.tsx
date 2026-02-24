import React, { useCallback, useMemo, useState } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { withBasePath } from '../../utils/basePath'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]'
import { prisma } from '../../lib/prisma'
import { getCanonicalRole } from '../../config/roleConfig'
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  CircularProgress,
  DialogActions,
  Avatar,
  Fade
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Replay as ReturnIcon,
  AssignmentReturn as AssignmentReturnIcon,
  Pending as PendingIcon,
  ThumbUp as ThumbUpIcon,
  DoneAll as DoneAllIcon,
  TaskAlt as TaskIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import ReturnActionDialog from '../../components/approvals/ReturnActionDialog'
import { loginTheme } from '../../themes/loginTheme' 
import { CUSTOM_RETURN_STATUS, RETURN_STATUS_TOKENS } from '../../types/loanStatus'

const corporateTheme = createTheme({
  palette: {
    primary: { main: '#1a365d', light: '#2d3748', dark: '#0f1419' },
    secondary: { main: '#00d4aa', light: '#38e4c8', dark: '#00b894' },
    success: { main: '#2e7d32', light: '#4caf50', dark: '#1b5e20' },
    warning: { main: '#ed6c02', light: '#ff9800', dark: '#e65100' },
    error: { main: '#d32f2f', light: '#f44336', dark: '#c62828' },
    info: { main: '#0288d1', light: '#03a9f4', dark: '#01579b' },
    background: { default: '#f8fafc', paper: '#ffffff' }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h2: { fontWeight: 800, fontSize: '3rem' },
    h4: { fontWeight: 700, fontSize: '2.125rem' }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(26, 54, 93, 0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(26, 54, 93, 0.2)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.9)'
          }
        }
      }
    }
  }
})

type ReturnRequestEntry = {
  id: string
  requestedAt: string
  requestedBy?: string
  note?: string
  photoResults?: { filename: string; url: string }[]
  status?: string
  processedAt?: string
  processedBy?: string
  originalNote?: string
  processedNote?: string
}

type LoanWithReturnRequests = {
  id: string
  borrowerName: string
  borrowerEmail?: string
  borrowerPhone?: string
  entitasId?: string
  loanStatus?: string
  returnRequest?: ReturnRequestEntry[]
  submittedAt?: string
    productDetailsText?: string
}

type NormalizedStatus = 'pending' | 'approved' | 'rejected' | 'confirmed' | 'followup'
type FilterValue = 'all' | NormalizedStatus

const FOLLOW_UP_TOKEN = RETURN_STATUS_TOKENS.FOLLOW_UP.toLowerCase()
const FOLLOW_UP_LABEL = CUSTOM_RETURN_STATUS.FOLLOW_UP.toLowerCase()

const isFollowUpStatus = (value?: string | null) => {
  const text = (value ?? '').toLowerCase()
  if (!text) return false
  return text.includes(FOLLOW_UP_TOKEN) || text.includes(FOLLOW_UP_LABEL) || text.includes('followup') || text.includes('follow-up')
}

const normalizeStatus = (value?: string): NormalizedStatus => {
  const text = (value ?? '').toLowerCase()
  if (isFollowUpStatus(value)) return 'followup'
  // Map explicit rejection keywords first
  if (text.includes('reject') || text.includes('tolak')) return 'rejected'
  // Treat explicit accept keywords as approved (e.g. returnAccepted)
  if (text.includes('accept') || text.includes('returnaccepted') || text.includes('sudahdikembalikan')) return 'approved'
  // Treat explicit borrower-submitted statuses or 'returnRequested' as pending (waiting review)
  if (text.includes('submitted') || text.includes('returnrequested') || text.includes('pengembalian')) return 'pending'
  // Confirmed/returned statuses (processed by warehouse) are explicit
  if (text.includes('confirm') || text.includes('complete') || text.includes('completed') || text.includes('returned') || text.includes('dikembalikan') || text.includes('selesai')) return 'confirmed'
  if (text.includes('approve') || text.includes('setuju')) return 'approved'
  return 'pending'
}

const formatDateTime = (timestamp: string) =>
  new Date(timestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatDate = (timestamp?: string) =>
  timestamp ? new Date(timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

const getInitials = (name?: string) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(chunk => chunk[0]?.toUpperCase())
    .join('')
}

const statusChipColor: Record<NormalizedStatus, 'default' | 'primary' | 'info' | 'success' | 'error' | 'warning'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  confirmed: 'info',
  followup: 'warning'
}

const statusLabel: Record<NormalizedStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  confirmed: 'Selesai',
  followup: CUSTOM_RETURN_STATUS.FOLLOW_UP
}

const filterOptions: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'followup', label: CUSTOM_RETURN_STATUS.FOLLOW_UP },
  { value: 'confirmed', label: 'Selesai' }
]

export default function ReturnsPage({ initialData }: { initialData: LoanWithReturnRequests[] }) {
  const [requests, setRequests] = useState<LoanWithReturnRequests[]>(initialData ?? [])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all')
  const [dialogState, setDialogState] = useState<{ open: boolean; action: 'returnAccepted' | 'return_rejected' | 'completed'; loanId?: string; requestId?: string }>({ open: false, action: 'returnAccepted' })
  const [note, setNote] = useState('')
  
  const [noteError, setNoteError] = useState<string | null>(null)
  // Confirmation prompt handled inside the shared ReturnActionDialog
  const [submittingAction, setSubmittingAction] = useState(false)

  // Deduplicate a loan's returnRequest entries by original request's requestedAt
  const dedupeRequests = useCallback((entries: ReturnRequestEntry[] = [], preferredStatus?: FilterValue) => {
    const groups: Record<string, ReturnRequestEntry[]> = {}
    entries.forEach(e => {
      const key = String(e.requestedAt || e.id || 'unknown')
      if (!groups[key]) groups[key] = []
      groups[key].push(e)
    })
    const statusOrder: Record<string, number> = { completed: 4, returnaccepted: 3, return_rejected: 2, returnrequested: 1, submitted: 1 }
    const weight = (s: string | undefined) => {
      if (!s) return 0
      const k = String(s).toLowerCase()
      return statusOrder[k] ?? 0
    }
    return Object.values(groups).map(group => {
      // If a preferred status is requested, try to select an entry from this group
      // that matches the normalized filter status (e.g., 'pending' / 'approved' / 'confirmed')
      if (preferredStatus && preferredStatus !== 'all') {
        const match = group.find(g => normalizeStatus(g.status) === preferredStatus)
        if (match) return match
      }
      const withDate = group.filter(g => !!g.processedAt).sort((a, b) => (String(b.processedAt).localeCompare(String(a.processedAt))))
      let representative = withDate.length > 0 ? withDate[0] : group.reduce((acc, cur) => (weight(cur.status) >= weight(acc.status) ? cur : acc))
      // find original request entry (status returnRequested/submitted) to pull photos from if needed
      const original = group.find(g => (String(g.status || '').toLowerCase().includes('returnrequested') || String(g.status || '').toLowerCase().includes('submitted')))
        || group[0]
      if ((!representative.photoResults || representative.photoResults.length === 0) && original && original.photoResults && original.photoResults.length > 0) {
        representative = { ...representative, photoResults: original.photoResults }
      }
      // Ensure the representative carries the original request note if the representative has none
      if ((!representative.note || String(representative.note).trim() === '') && original && original.note) {
        representative = { ...representative, originalNote: original.note }
      }
      return representative
    })
  }, [])

  // Use a dedupe rule similar to the visible list: we want metrics to reflect the latest
  // active state per original request, not the entire processing history.
  const flattenedRequestsAll = useMemo(() => {
    return requests.flatMap(loan => dedupeRequests(loan.returnRequest ?? []).map(entry => ({ loanId: loan.id, status: normalizeStatus(entry.status), entry })))
  }, [requests, dedupeRequests])

  // The flattened list used for display prefers entries matching the filter when applicable.
  const flattenedRequests = useMemo(() => {
    return requests.flatMap(loan => dedupeRequests(loan.returnRequest ?? [], statusFilter).map(entry => ({ loanId: loan.id, status: normalizeStatus(entry.status), entry })))
  }, [requests, statusFilter, dedupeRequests])

  const getLatestRequestEntry = useCallback((loan: LoanWithReturnRequests, preferredStatus?: FilterValue) => {
    const deduped = dedupeRequests(loan.returnRequest ?? [])
    if (!deduped.length) return null

    const sortByRecency = (list: ReturnRequestEntry[]) =>
      [...list].sort((a, b) => {
        const aTime = new Date(a.processedAt || a.requestedAt || 0).getTime() || 0
        const bTime = new Date(b.processedAt || b.requestedAt || 0).getTime() || 0
        return bTime - aTime
      })

    const filtered = preferredStatus && preferredStatus !== 'all'
      ? sortByRecency(deduped.filter(entry => normalizeStatus(entry.status) === preferredStatus))
      : []

    if (filtered.length > 0) return filtered[0]
    return sortByRecency(deduped)[0]
  }, [dedupeRequests])

  const totalRequests = flattenedRequestsAll.length
  const awaitingReview = flattenedRequestsAll.filter(item => item.status === 'pending').length
  const approvedRequests = flattenedRequestsAll.filter(item => item.status === 'approved').length
  const confirmedReturns = flattenedRequestsAll.filter(item => item.status === 'confirmed').length

  const statCards: { label: string; value: number; icon: typeof AssignmentReturnIcon; gradient: string }[] = [
    { label: 'Total Permintaan', value: totalRequests, icon: AssignmentReturnIcon, gradient: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)' },
    { label: 'Menunggu Review', value: awaitingReview, icon: PendingIcon, gradient: 'linear-gradient(135deg, #fbd38d 0%, #f6ad55 100%)' },
    { label: 'Disetujui', value: approvedRequests, icon: ThumbUpIcon, gradient: 'linear-gradient(135deg, #9ae6b4 0%, #48bb78 100%)' },
    { label: 'Selesai', value: confirmedReturns, icon: DoneAllIcon, gradient: 'linear-gradient(135deg, #90cdf4 0%, #4299e1 100%)' }
  ]

  const getLoanEffectiveReturnNormalizedStatus = useCallback((loan: LoanWithReturnRequests): NormalizedStatus => {
    // Prefer top-level returnStatus when it exists (e.g. 'completed' or final statuses)
    const topReturn = String((loan as any).returnStatus?.status || '').trim()
    if (topReturn) {
      const n = normalizeStatus(topReturn)
      if (n !== 'pending') return n
    }

    // Fallback: dedupe and pick highest-weight representative across groups
    const reps = dedupeRequests(loan.returnRequest ?? [])
    if (!reps || reps.length === 0) return 'pending'
    const statuses = reps.map(r => normalizeStatus(r.status))
    if (statuses.includes('confirmed')) return 'confirmed'
    if (statuses.includes('approved')) return 'approved'
    if (statuses.includes('rejected')) return 'rejected'
    return 'pending'
  }, [dedupeRequests])

  const filteredLoans = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return requests.filter(loan => {
      const matchesTerm =
        !term ||
        loan.id.toLowerCase().includes(term) ||
        loan.borrowerName?.toLowerCase().includes(term) ||
        loan.entitasId?.toLowerCase().includes(term)

      if (!matchesTerm) return false

      if (statusFilter === 'all') return true

      // Use the effective loan status rather than historical entries
      const effective = getLoanEffectiveReturnNormalizedStatus(loan)
      return effective === statusFilter
    })
  }, [requests, searchTerm, statusFilter, getLoanEffectiveReturnNormalizedStatus])

  const visibleRequestCount = useMemo(() => {
    if (statusFilter === 'all') return flattenedRequestsAll.length
    return flattenedRequests.filter(item => item.status === statusFilter).length
  }, [flattenedRequests, flattenedRequestsAll, statusFilter])

  const selectedLoan = dialogState.open ? requests.find(loan => loan.id === dialogState.loanId) : undefined
  const selectedEntry = selectedLoan?.returnRequest?.find(entry => entry.id === dialogState.requestId)

  const handleOpen = (loanId: string, requestId: string, action: 'returnAccepted' | 'return_rejected' | 'completed' = 'returnAccepted') => {
    setDialogState({ open: true, action, loanId, requestId })
    setNote('')
    // reset note when opening dialog
  }

  // no logging

  const handleCloseDialog = () => {
    setDialogState(prev => ({ ...prev, open: false }))
    setNote('')
  }

  const handleSubmit = async (noteParam?: string, conditionParam?: string) => {
    if (!dialogState.loanId || !dialogState.requestId) return
    try {
      // Use AbortController to avoid indefinite hangs
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000) // 20s
      const resp = await fetch(`/api/loans/${dialogState.loanId}/request-return-action`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: dialogState.action, requestId: dialogState.requestId, note: (noteParam ?? note), condition: conditionParam }),
        signal: controller.signal
      })
      clearTimeout(timeout)

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        toast.error(body?.message || 'Gagal memproses permintaan')
        return
      }

      const updated = await resp.json()
      const updatedLoan = updated?.loan ?? updated
      setRequests(prev => prev.map(loan => (loan.id === updatedLoan.id ? updatedLoan : loan)))
      toast.success('Permintaan pengembalian diperbarui')
    } catch (error: any) {
      // Don't spam the console for deliberately aborted requests (hot-reload or timeouts)
      if (error?.name === 'AbortError') {
        console.warn('handleSubmit /pengembalian aborted (timeout or manual):', error)
        toast.error('Permintaan terlalu lama atau dibatalkan — coba lagi')
      } else {
        console.error('handleSubmit /pengembalian', error)
        toast.error('Terjadi kesalahan saat memproses permintaan')
      }
    } finally {
      handleCloseDialog()
    }
  }

  return (
    <ThemeProvider theme={corporateTheme}>
      <CssBaseline />
      <Head>
        <title>Permintaan Pengembalian</title>
      </Head>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
        <Fade in={true} timeout={800}>
          <Box
            sx={{
              background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
              color: 'white',
              py: { xs: 6, md: 8 },
              mb: 6,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                opacity: 0.1
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '1200px', mx: 'auto', px: { xs: 2, md: 4 } }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={4} alignItems="flex-start" sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ReturnIcon sx={{ fontSize: { xs: 48, md: 64 }, mr: 3, opacity: 0.9, color: 'white' }} />
                  <Box>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: '1.5rem', md: '2.2rem' },
                        mb: 2,
                        background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      Persetujuan Pengembalian.
                    </Typography>
                    <Typography variant="h6" sx={{ maxWidth: 600, opacity: 0.9, lineHeight: 1.4 }}>
                      Pantau status permintaan pengembalian, verifikasi bukti foto, dan selesaikan proses barang masuk dengan tampilan konsisten seperti portal gudang utama.
                    </Typography>
                  </Box>
                </Box>
                <Stack spacing={2} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Chip
                    icon={<TaskIcon sx={{ color: 'inherit !important' }} />}
                    label={`Total aktif: ${visibleRequestCount}`}
                    color="secondary"
                    sx={{ fontSize: '1rem', py: 1, px: 2, borderRadius: 999 }}
                  />
                  
                </Stack>
              </Stack>

              <Grid container spacing={3}>
                {statCards.map(stat => (
                  <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card
                      sx={{
                        background: stat.gradient,
                        color: '#1a202c',
                        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.25)'
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: '16px',
                              backgroundColor: 'rgba(0,0,0,0.08)',
                              display: 'inline-flex'
                            }}
                          >
                            <stat.icon />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ letterSpacing: 0.5 }}>
                              {stat.label}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                              {stat.value}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </Fade>

        <Container maxWidth="xl">
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari ID peminjaman, nama peminjam, atau entitas"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm ? (
                        <IconButton aria-label="hapus pencarian" onClick={() => setSearchTerm('')}>
                          <CloseIcon />
                        </IconButton>
                      ) : undefined
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {filterOptions.map(option => (
                      <Chip
                        key={option.value}
                        icon={<FilterIcon />}
                        label={option.label}
                        clickable
                        color={option.value === 'all' ? 'default' : statusChipColor[option.value as NormalizedStatus]}
                        variant={statusFilter === option.value ? 'filled' : 'outlined'}
                        onClick={() => setStatusFilter(option.value)}
                        sx={{ fontWeight: 600 }}
                      />
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {filteredLoans.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 6 }}>
              <CardContent>
                <ReturnIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Tidak ada permintaan untuk filter saat ini
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Coba ubah kata kunci pencarian atau status untuk melihat data lainnya.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {filteredLoans.map(loan => {
                // Tampilkan hanya pengajuan terbaru per peminjaman (memprioritaskan status filter jika ada)
                const latestEntry = getLatestRequestEntry(loan, statusFilter)
                const visibleRequests = latestEntry ? [latestEntry] : []

                return (
                  <Grid key={loan.id} size={{ xs: 12, md: 6, lg: 4 }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
                            {getInitials(loan.borrowerName)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              #{loan.id}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {loan.borrowerName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Entitas {loan.entitasId ?? 'Tidak diketahui'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              ID Peminjaman: {loan.id}
                            </Typography>
                            {loan.productDetailsText && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                <strong>Produk:</strong> {loan.productDetailsText}
                              </Typography>
                            )}
                          </Box>
                        </Stack>

                        <Divider sx={{ mb: 2 }} />

                        {visibleRequests.map(entry => {
                          const normalized = normalizeStatus(entry.status)
                          const rawStatusValue = String(entry.status || '')
                          const rawLower = rawStatusValue.toLowerCase()
                          const isFollowUp = isFollowUpStatus(entry.status)
                          const isAccepted = rawLower.includes('returnaccepted') || rawLower.includes('return_accepted') || rawLower.includes('accepted') || isFollowUp
                          const isRejected = rawLower.includes('return_rejected') || rawLower.includes('reject')
                          const isCompleted = rawLower.includes('complete') || rawLower.includes('returned')
                          const disablePrimaryActions = isAccepted || isRejected || isCompleted || isFollowUp
                          return (
                            <Box
                              key={entry.id}
                              sx={{
                                borderRadius: 3,
                                border: '1px solid rgba(26, 54, 93, 0.12)',
                                p: 2,
                                mb: 2,
                                backgroundColor: 'rgba(26, 54, 93, 0.02)'
                              }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                  {entry.requestedBy ?? 'Pemohon' }
                                </Typography>
                                {/* If entry explicitly contains return-request statuses, show the literal token */}
                                {(() => {
                                  if (rawLower.includes('returnrequested')) {
                                    return <Chip size="small" color={statusChipColor['pending']} label="Permintaan Pengembalian" />
                                  }
                                  if (rawLower.includes('returnaccepted')) {
                                    return <Chip size="small" color={statusChipColor['approved']} label={rawStatusValue || 'returnAccepted'} />
                                  }
                                  return <Chip size="small" color={statusChipColor[normalized]} label={statusLabel[normalized]} />
                                })()}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                Diminta pada {formatDateTime(entry.requestedAt)}
                              </Typography>
                              {(entry.note || (entry as any).originalNote) && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  <strong>Catatan permintaan:</strong> {entry.note ?? (entry as any).originalNote}
                                </Typography>
                              )}

                              {entry.photoResults && entry.photoResults.length > 0 && (
                                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                  {entry.photoResults.map(photo => (
                                    <Box
                                      key={photo.url}
                                      component="a"
                                      href={photo.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      sx={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        display: 'block'
                                      }}
                                    >
                                      <Box component="img" src={photo.url} alt={photo.filename} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </Box>
                                  ))}
                                </Stack>
                              )}

                              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.25, width: '100%' }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleOpen(loan.id, entry.id, 'returnAccepted')}
                                  sx={{ width: '100%', textTransform: 'none' }}
                                  disabled={disablePrimaryActions}
                                >
                                  Konfirmasi Pengembalian
                                </Button>

                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleOpen(loan.id, entry.id, 'return_rejected')}
                                  sx={{ width: '100%', textTransform: 'none' }}
                                  disabled={disablePrimaryActions}
                                >
                                  Tolak Pengembalian
                                </Button>

                                {/* Only allow finalizing the return once the warehouse has confirmed (returnAccepted)
                                    or an accepted-like status exists on the request. Otherwise disable the final button. */}
                                {(() => {
                                  const raw = String(entry.status || '').toLowerCase()
                                  const accepted = raw.includes('returnaccepted') || raw.includes('return_accepted') || raw.includes('accepted') || raw.includes('accept') || isFollowUpStatus(entry.status)
                                  return (
                                    <Tooltip title={accepted ? 'Selesaikan peminjaman' : 'Tombol ini akan aktif setelah gudang menyetujui pengembalian (termasuk status Perlu Tindak Lanjut)'}>
                                      <span style={{ display: 'block', width: '100%' }}>
                                        <Button
                                          size="small"
                                          variant="contained"
                                          color="info"
                                          onClick={() => handleOpen(loan.id, entry.id, 'completed')}
                                          sx={{ width: '100%', textTransform: 'none' }}
                                          disabled={!accepted}
                                        >
                                          Peminjaman Selesai
                                        </Button>
                                      </span>
                                    </Tooltip>
                                  )
                                })()}
                              </Box>
                            </Box>
                          )
                        })}
                      </CardContent>
                      <CardActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Pengajuan: {formatDate(loan.submittedAt)}
                        </Typography>
                        <Button size="small" endIcon={<ReturnIcon />} component={Link} href={withBasePath(`/peminjaman/${loan.id}?mode=warehouse`)}>
                          Lihat detail
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          )}
        </Container>
      </Box>

      <ReturnActionDialog
        open={dialogState.open}
        action={dialogState.action}
        loan={selectedLoan}
        entry={selectedEntry}
        note={note}
        setNote={setNote}
        onClose={handleCloseDialog}
        onConfirm={async (note?: string, condition?: string) => {
          try {
            setSubmittingAction(true)
            setNote(note ?? '')
            await handleSubmit(note, condition)
          } finally {
            setSubmittingAction(false)
          }
        }}
        submitting={submittingAction}
        noteError={noteError}
      />
    </ThemeProvider>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = (await getServerSession(context.req as any, context.res as any, authOptions as any)) as any
  if (!session || !session.user?.id) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  const role = getCanonicalRole(session.user?.role)
  if (!['gudang', 'admin', 'superadmin'].includes(role)) {
    return { redirect: { destination: '/403', permanent: false } }
  }

  try {
    const rows = await prisma.loan.findMany({
      orderBy: { submittedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        submittedAt: true,
        borrowerName: true,
        borrowerEmail: true,
        entitasId: true,
        loanStatus: true,
        productDetailsText: true,
        returnRequest: true
      }
    })
    const wanted = rows.filter(row =>
      Array.isArray((row as any).returnRequest) &&
      (row as any).returnRequest.some((req: any) => {
        const normalized = normalizeStatus(req.status)
        return ['pending', 'approved', 'confirmed'].includes(normalized)
      })
    )
    return { props: { initialData: JSON.parse(JSON.stringify(wanted)) } }
  } catch (error) {
    console.error('getServerSideProps /pengembalian', error)
    return { props: { initialData: [] } }
  }
}
