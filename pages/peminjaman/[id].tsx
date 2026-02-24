import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { getCanonicalRole } from '../../config/roleConfig'
import { useRouter } from 'next/router'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Container,
  Box,
  Fade,
  Paper,
  Avatar,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Skeleton,
  Alert,
  Button,
  Breadcrumbs,
  Link as MuiLink,
  Chip,
  Stack,
  Tooltip,
  IconButton,
  Zoom,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import ApproveDialog from '../../components/approvals/ApproveDialog'
import RejectDialog from '../../components/approvals/RejectDialog'
import ReturnActionDialog from '../../components/approvals/ReturnActionDialog'
import ProcessDialog from '../../components/loan-detail/ProcessDialog'
import {
  Assignment as AssignmentIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Inventory as InventoryIcon,
  History as HistoryIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import loanDetailTheme from '../../themes/loanDetailTheme'
import {
  BorrowerInfo,
  LoanDetails,
  ScheduleInfo,
  ProductDetails,
  HistoryModal,
  LoadingState,
  ErrorState,
  NotFoundState,
  HeaderSection,
  BorrowerInfoCard,
  LoanDetailsCard,
  ScheduleInfoCard,
  ProductDetailsCard,
  
  NotificationCard,
  ReminderStatusCard,
} from '../../components/loan-detail'
import { LoanData } from '../../types/loanDetail'
import { getLoanStatus, getStatusClass, formatDate, getPickupMethodLabel } from '../../utils/loanHelpers'
import { LOAN_LIFECYCLE, WAREHOUSE_STATUS } from '../../types/loanStatus'
import { getNeedTypeLabel } from '../../utils/needTypes'
import { apiFetch } from '../../utils/basePath'
import { pushFineUpdateForLoan } from '../../utils/fineSync'

const getOverallStatus = (loan: LoanData) => {
  // Return warehouse status if present, otherwise marketing status
  if (loan.warehouseStatus) {
    return loan.warehouseStatus.status
  }
  return getLoanStatus(loan)
}

const getOverallStatusClass = (loan: LoanData) => {
  const status = getOverallStatus(loan)
  switch (status) {
    case LOAN_LIFECYCLE.DRAFT: return 'status-draft'
    case LOAN_LIFECYCLE.APPROVED: return 'status-approved'
    case LOAN_LIFECYCLE.REJECTED: return 'status-rejected'
    case WAREHOUSE_STATUS.BORROWED: return 'status-borrowed'
    case WAREHOUSE_STATUS.REJECTED: return 'status-rejected'
    case WAREHOUSE_STATUS.RETURNED: return 'status-returned'
    case WAREHOUSE_STATUS.PENDING: return 'status-pending'
    default: return 'status-pending'
  }
}

export default function LoanDetailPage() {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { id } = router.query
  const [loan, setLoan] = useState<LoanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [approvalNote, setApprovalNote] = useState<string | undefined>(undefined)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectNote, setRejectNote] = useState<string | undefined>(undefined)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [warehouseAction, setWarehouseAction] = useState<'process' | 'reject' | null>(null)
  const [processNote, setProcessNote] = useState<string | undefined>(undefined)
  const [confirmReturnDialogOpen, setConfirmReturnDialogOpen] = useState(false)
  const [confirmReturnNote, setConfirmReturnNote] = useState<string | undefined>(undefined)
  const [confirmReturnError, setConfirmReturnError] = useState<string | undefined>(undefined)
  const [submittingConfirmReturn, setSubmittingConfirmReturn] = useState(false)

  const { data: session } = useSession()
  const currentUserRole = getCanonicalRole((session as any)?.user?.role)
  const currentUserId = (session as any)?.user?.id || null
  const currentUserEmail = (session as any)?.user?.email || null
  const [ownedCompanies, setOwnedCompanies] = useState<string[]>([])

  // fetch companies the current user owns (api enforces marketing-only visibility)
  useEffect(() => {
    const fetchOwned = async () => {
      try {
        const r = await apiFetch('/api/company')
        if (r.ok) {
          const data = await r.json()
          setOwnedCompanies(Array.isArray(data) ? data.map((c: any) => c.value) : [])
        }
      } catch (err) {
        // ignore
      }
    }
    fetchOwned()
  }, [currentUserId])

  // Check if loan is already decided and redirect from approve mode
  useEffect(() => {
    if (loan && router.query.mode === 'approve') {
      const status = getLoanStatus(loan)
      if (status === LOAN_LIFECYCLE.APPROVED || status === LOAN_LIFECYCLE.REJECTED) {
        // Redirect to normal detail page
        router.push(`/peminjaman/${id}`)
      }
    }
  }, [loan, router.query.mode, router, id])

  const fetchLoanDetail = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/loans/${id}`)
      if (response.ok) {
        const data = await response.json()
        setLoan(data)
      } else if (response.status === 404) {
        setError('Data peminjaman tidak ditemukan')
      } else {
        setError('Terjadi kesalahan saat memuat data')
      }
    } catch (error) {
      console.error('Failed to fetch loan detail:', error)
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchLoanDetail()
  }, [id, fetchLoanDetail])

  useEffect(() => {
    if (!loan?.id) return
    void pushFineUpdateForLoan(loan)
  }, [loan])

  const pendingReturnRequest = useMemo(() => {
    if (!Array.isArray(loan?.returnRequest)) return null
    const requests = [...loan.returnRequest].reverse()
    return requests.find((req: any) => {
      const status = String(req?.status || '').toLowerCase()
      if (!status) return true
      return ['returnrequested', 'return_requested', 'submitted', 'pending', 'approved'].some(token => status.includes(token))
    }) || null
  }, [loan?.returnRequest])

  const handleSubmitDraft = async () => {
    if (!loan || !loan.isDraft) return

    setSubmitting(true)
    try {
      const response = await apiFetch(`/api/loans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isDraft: false }),
      })

      if (response.ok) {
        const updatedLoan = await response.json()
        setLoan(updatedLoan)
        toast.success('Permintaan peminjaman berhasil diajukan!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Gagal mengajukan peminjaman')
      }
    } catch (error) {
      console.error('Error submitting draft:', error)
      toast.error('Terjadi kesalahan saat mengajukan peminjaman')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (note?: string) => {
    // submit approve request (note optional)
    setSubmitting(true)
    try {
      const response = await apiFetch(`/api/loans/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true, note })
      })

      if (response.ok) {
        const updated = await response.json()
        const updatedLoan = updated?.loan ?? updated
        setLoan(updatedLoan)
        toast.success('Peminjaman berhasil disetujui')
        setTimeout(() => router.push(`/peminjaman/${id}`), 1000)
      } else {
        toast.error('Gagal menyetujui peminjaman')
      }
    } catch (error) {
      console.error('Error approving loan:', error)
      toast.error('Terjadi kesalahan saat menyetujui peminjaman')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (reason: string, note?: string) => {
    if (!reason || !reason.trim()) {
      toast.error('Alasan penolakan wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const response = await apiFetch(`/api/loans/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false, reason, note })
      })

      if (response.ok) {
        const updated = await response.json()
        const updatedLoan = updated?.loan ?? updated
        setLoan(updatedLoan)
        toast.success('Peminjaman berhasil ditolak')
        setTimeout(() => router.push(`/peminjaman/${id}`), 1000)
      } else {
        toast.error('Gagal menolak peminjaman')
      }
    } catch (error) {
      console.error('Error rejecting loan:', error)
      toast.error('Terjadi kesalahan saat menolak peminjaman')
    } finally {
      setSubmitting(false)
    }
  }

  const handleWarehouseProcess = async (note?: string) => {
    // if called without explicit note (direct API call), confirm the action
    if (typeof note === 'undefined' && !confirm('Apakah Anda yakin ingin memproses peminjaman ini?')) return

    setSubmitting(true)
    try {
      const response = await apiFetch(`/api/loans/${id}/warehouse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process', status: WAREHOUSE_STATUS.BORROWED, note })
      })

      if (response.ok) {
        const updated = await response.json()
        const updatedLoan = updated?.loan ?? updated
        setLoan(updatedLoan)
        toast.success('Peminjaman berhasil diproses gudang')
        // clear stored note after processing
        setProcessNote(undefined)
        // Stay on detail page so the UI shows Konfirmasi Pengembalian button
      } else {
        toast.error('Gagal memproses peminjaman')
      }
    } catch (error) {
      console.error('Error processing loan:', error)
      toast.error('Terjadi kesalahan saat memproses peminjaman')
    } finally {
      setSubmitting(false)
    }
  }

  const handleWarehouseReject = async (reason?: string, note?: string) => {
    const normalizedReason = String(reason ?? note ?? '').trim()
    if (!normalizedReason) {
      toast.error('Alasan penolakan gudang wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const response = await apiFetch(`/api/loans/${id}/warehouse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: normalizedReason, ...(note ? { note } : { note: normalizedReason }) })
      })

      if (response.ok) {
        const updatedLoan = await response.json()
        const updated = updatedLoan?.loan ?? updatedLoan
        setLoan(updated)
        toast.success('Peminjaman berhasil direject gudang')
        // Redirect to warehouse page
        setTimeout(() => router.push('/gudang'), 1000)
      } else {
        toast.error('Gagal menolak peminjaman')
      }
    } catch (error) {
      console.error('Error rejecting loan:', error)
      toast.error('Terjadi kesalahan saat menolak peminjaman')
    } finally {
      setSubmitting(false)
    }
  }

  // open confirmation dialog for return (UI) — actual API call happens in confirm handler
  const handleWarehouseReturn = () => {
    if (!pendingReturnRequest) {
      toast.error('Tidak ada permintaan pengembalian aktif untuk dikonfirmasi')
      return
    }
    setConfirmReturnDialogOpen(true)
    setConfirmReturnNote(undefined)
    setConfirmReturnError(undefined)
  }

  const handleConfirmReturnRequest = async (note?: string, condition?: string) => {
    if (!loan?.id) return
    const trimmed = String(note ?? confirmReturnNote ?? '').trim()
    if (!trimmed) {
      setConfirmReturnError('Catatan pengembalian wajib diisi')
      toast.error('Catatan pengembalian wajib diisi')
      return
    }
    if (!pendingReturnRequest?.id) {
      toast.error('Tidak menemukan permintaan pengembalian untuk diproses')
      return
    }

    setSubmittingConfirmReturn(true)
    setSubmitting(true)
    setConfirmReturnError(undefined)
    try {
      const response = await apiFetch(`/api/loans/${loan.id}/request-return-action`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'returnAccepted', requestId: pendingReturnRequest.id, note: trimmed, condition })
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.message || `HTTP ${response.status}`)
      }

      const updated = await response.json().catch(() => null)
      const updatedLoan = updated?.loan ?? updated
      if (updatedLoan) setLoan(updatedLoan)
      toast.success('Konfirmasi pengembalian berhasil direkam')
      setConfirmReturnDialogOpen(false)
      setConfirmReturnNote(undefined)
    } catch (error: any) {
      console.error('Error confirming return request:', error)
      toast.error(error?.message || 'Terjadi kesalahan saat mengonfirmasi pengembalian')
    } finally {
      setSubmittingConfirmReturn(false)
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  if (!loan) {
    return <NotFoundState />
  }

  return (
    <ThemeProvider theme={theme}>
      <div style={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
        <Container maxWidth={false} sx={{ maxWidth: 1400, py: 6, px: { xs: 2, md: 4 } }}>
          <HeaderSection
            loan={loan}
            onShowHistory={() => setShowHistoryModal(true)}
          />

          {/* Main Content Grid (Borrower + Product side-by-side) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4, mb: 4 }}>
            <BorrowerInfoCard loan={loan} />
            <ProductDetailsCard loan={loan} />
          </Box>

          {/* Schedule & Status side-by-side */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, mb: 4 }}>
            <ScheduleInfoCard loan={loan} currentUserRole={currentUserRole} currentUserCompanies={ownedCompanies} />
            <LoanDetailsCard
              loan={loan}
              submitting={submitting}
              onApprove={() => setApproveDialogOpen(true)}
              onReject={() => { setRejectDialogOpen(true); setRejectReason(''); setRejectNote(undefined); }}
                currentUserRole={currentUserRole}
                currentUserCompanies={ownedCompanies}
                currentUserId={currentUserId}
                currentUserEmail={currentUserEmail}
                  onWarehouseProcess={() => { setWarehouseAction('process'); setProcessDialogOpen(true) }}
                  onWarehouseReject={() => { setWarehouseAction('reject'); setProcessDialogOpen(true) }}
              onWarehouseReturn={handleWarehouseReturn}
              onSubmitDraft={handleSubmitDraft}
              onShowHistory={() => setShowHistoryModal(true)}
            />
          </Box>

          {/* Notifications (Notes removed) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 4 }}>
            <NotificationCard loan={loan} />
          </Box>

          {/* Reminder Status - Only show when status is borrowed and NOT already returned */}
          {loan.warehouseStatus?.status === WAREHOUSE_STATUS.BORROWED && !loan.returnStatus && (
            <Box sx={{ mt: 4 }}>
              <ReminderStatusCard loan={loan} />
            </Box>
          )}

      <HistoryModal
        loan={loan}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
        </Container>
        <ApproveDialog
          open={approveDialogOpen}
          loan={loan}
          onClose={() => {
            setApproveDialogOpen(false)
            setApprovalNote(undefined)
          }}
          onApprove={(loanId, note) => {
            // call approve flow with note and close
            setApproveDialogOpen(false)
            handleApprove(note)
          }}
          getNeedTypeLabel={getNeedTypeLabel}
          formatDate={formatDate}
          getPickupMethodLabel={getPickupMethodLabel}
          currentUserRole={currentUserRole}
          currentUserCompanies={ownedCompanies}
        />

        <RejectDialog
          open={rejectDialogOpen}
          loan={loan}
          reason={rejectReason}
          note={rejectNote}
          onClose={() => {
            setRejectDialogOpen(false)
            setRejectReason('')
            setRejectNote(undefined)
          }}
          onReject={(loanId, reason, note) => {
            setRejectDialogOpen(false)
            handleReject(reason, note)
          }}
          onReasonChange={(r) => setRejectReason(r)}
          onNoteChange={(n) => setRejectNote(n)}
          getNeedTypeLabel={getNeedTypeLabel}
          getPickupMethodLabel={getPickupMethodLabel}
          currentUserRole={currentUserRole}
          currentUserCompanies={ownedCompanies}
        />

        <ReturnActionDialog
          open={confirmReturnDialogOpen}
          loan={loan}
          action='returnAccepted'
          entry={pendingReturnRequest}
          note={confirmReturnNote}
          onClose={() => { setConfirmReturnDialogOpen(false); setConfirmReturnNote(undefined); setConfirmReturnError(undefined) }}
          setNote={(n) => { setConfirmReturnNote(n); if (confirmReturnError) setConfirmReturnError(undefined) }}
          onConfirm={async (note, condition) => {
            setConfirmReturnNote(note)
            await handleConfirmReturnRequest(note, condition)
          }}
          noteError={confirmReturnError}
          submitting={submittingConfirmReturn}
        />
        <ProcessDialog
          open={processDialogOpen}
          onClose={() => { setProcessDialogOpen(false); setWarehouseAction(null) }}
          defaultNote={processNote}
          loan={loan}
          getNeedTypeLabel={getNeedTypeLabel}
          getPickupMethodLabel={getPickupMethodLabel}
          noteLabel={warehouseAction === 'reject' ? 'Alasan Penolakan Gudang' : 'Catatan (opsional)'}
          notePlaceholder={warehouseAction === 'reject' ? 'Tuliskan alasan penolakan gudang pada peminjaman ini' : 'Tulis catatan singkat mengenai proses peminjaman ini (opsional)'}
          requireNote={warehouseAction === 'reject'}
          requireNoteMessage="Alasan penolakan wajib diisi"
          confirmLabel={warehouseAction === 'reject' ? 'Kirim Penolakan' : 'Proses'}
          onConfirm={(note) => {
            setProcessDialogOpen(false)
            setProcessNote(note)
            const trimmed = note?.trim()
            if (warehouseAction === 'reject') {
              handleWarehouseReject(trimmed, trimmed)
            } else {
              handleWarehouseProcess(trimmed)
            }
            setWarehouseAction(null)
          }}
        />
      </div>
    </ThemeProvider>
  )
}