import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import {
  Typography,
  Box,
  Chip,
  Button,
  Alert,
  Avatar,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
} from '@mui/material'
import toast from 'react-hot-toast'
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Warehouse as WarehouseIcon,
  Send as SendIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  LocalShipping as DeliveryIcon,
  Store as PickupIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material'
import { LoanData } from '../../types/loanDetail'
import ExtensionDialog from './ExtensionDialog'
import ReturnRequestDialog from './ReturnRequestDialog'
import ReturnDialog from '../approvals/ReturnDialog'
import ReturnActionDialog from '../approvals/ReturnActionDialog'
import { getNeedTypeLabel } from '../../utils/needTypes'
import { CUSTOM_RETURN_STATUS, LOAN_LIFECYCLE, RETURN_STATUS_TOKENS, WAREHOUSE_STATUS } from '../../types/loanStatus'
import { getLoanStatus, getStatusClass } from '../../utils/loanHelpers'
import { PickupMethod, getPickupMethodLabel } from '../../utils/pickupMethods'
import { formatLifecycleStatusLabel } from '../../utils/peminjamanHelpers'

const RETURN_PENDING_TOKENS = ['returnrequested', 'return_requested', 'submitted', 'pending']
const RETURN_REJECTION_TOKENS = ['return_rejected', 'returnrejected', 'tolak']
const RETURN_FINAL_TOKENS = ['completed', 'complete', 'dikembalikan', 'selesai', 'returned']
const normalizeStatusValue = (value?: string | null) => (value ? String(value).trim().toLowerCase() : '')
const RETURN_FOLLOW_UP_TOKEN = RETURN_STATUS_TOKENS.FOLLOW_UP
const isFollowUpReturnStatus = (status?: string | null) => {
  const normalized = normalizeStatusValue(status)
  if (!normalized) return false
  return normalized.includes(RETURN_FOLLOW_UP_TOKEN) || normalized.includes('followup')
}
const isReturnAcceptedLike = (status?: string | null) => {
  const normalized = normalizeStatusValue(status)
  if (!normalized) return false
  if (isFollowUpReturnStatus(normalized)) return true
  return (
    normalized.includes('returnaccepted') ||
    normalized.includes('return_accepted') ||
    normalized.includes('accepted') ||
    normalized.includes('accept')
  )
}
const resolveReturnStatusChipColor = (status?: string | null): 'info' | 'success' | 'warning' | 'error' => {
  const normalized = normalizeStatusValue(status)
  if (!normalized) return 'info'
  if (RETURN_REJECTION_TOKENS.some(token => normalized.includes(token)) || normalized.includes('reject')) return 'error'
  if (isFollowUpReturnStatus(status)) return 'warning'
  if (normalized.includes('accepted') || normalized.includes('accept') || normalized.includes('completed') || normalized.includes('dikembalikan')) return 'success'
  if (RETURN_PENDING_TOKENS.some(token => normalized.includes(token))) return 'info'
  return 'info'
}
const formatDateTimeLabel = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface LoanDetailsProps {
  loan: LoanData
  submitting: boolean
  onApprove: () => void
  onReject: () => void
  onWarehouseProcess: () => void
  onWarehouseReject: () => void
  onWarehouseReturn: () => void
  onSubmitDraft: () => void
  onShowHistory: () => void
  currentUserRole?: string | null
  currentUserCompanies?: string[]
  currentUserId?: string | null
  currentUserEmail?: string | null
}

const LoanDetails: React.FC<LoanDetailsProps> = ({
  loan,
  submitting,
  onApprove,
  onReject,
  onWarehouseProcess,
  onWarehouseReject,
  onWarehouseReturn,
  onSubmitDraft,
  onShowHistory,
  currentUserRole,
  currentUserCompanies,
  currentUserId,
  currentUserEmail
}) => {
  const router = useRouter()
  const [extendOpen, setExtendOpen] = React.useState(false)
  const warehouseStatusLabel = loan.warehouseStatus?.status ? String(loan.warehouseStatus.status).toLowerCase() : ''
  const normalizedWarehouseStatusValue = normalizeStatusValue(loan.warehouseStatus?.status)
  const normalizedLoanStatusValue = normalizeStatusValue(loan.loanStatus)
  const returnStatusLabel = loan.returnStatus?.status ? String(loan.returnStatus.status).toLowerCase() : ''
  const isReturned = returnStatusLabel === String(WAREHOUSE_STATUS.RETURNED).toLowerCase()
  const hasWarehouseProcessed = Boolean(
    !isReturned && (
      loan.returnStatus ||
      (loan.warehouseStatus?.status &&
        warehouseStatusLabel !== String(WAREHOUSE_STATUS.PENDING).toLowerCase())
    )
  )
  const normalizedLoanUserId = loan.userId ? String(loan.userId).trim().toLowerCase() : ''
  const normalizedCurrentUserId = currentUserId ? String(currentUserId).trim().toLowerCase() : ''
  const normalizedUserEmail = currentUserEmail ? currentUserEmail.trim().toLowerCase() : ''
  const borrowerEmail = loan.borrowerEmail ? loan.borrowerEmail.trim().toLowerCase() : ''
  const isLoanOwner = Boolean(
    (normalizedLoanUserId && normalizedCurrentUserId && normalizedLoanUserId === normalizedCurrentUserId) ||
    (borrowerEmail && normalizedUserEmail && borrowerEmail === normalizedUserEmail)
  )
  const isSuperAdmin = (currentUserRole ?? '').trim().toLowerCase() === 'superadmin'
  const canSeeExtensionButton = hasWarehouseProcessed && (isLoanOwner || isSuperAdmin)
  const isWarehouseUser = (currentUserRole ?? '').trim().toLowerCase() === 'gudang' || (currentUserRole ?? '').trim().toLowerCase() === 'admin' || (currentUserRole ?? '').trim().toLowerCase() === 'superadmin'
  const isWarehouseRejected = [normalizedWarehouseStatusValue, normalizedLoanStatusValue].some(value => {
    if (!value) return false
    return value.includes('wh rejected') || value.includes('whrejected') || value.includes('ditolak gudang')
  })
  const currentReturnStatusColor = React.useMemo(() => resolveReturnStatusChipColor(loan.returnStatus?.status), [loan.returnStatus?.status])

  const getStatusColor = (status: string) => {
    switch (status) {
      case LOAN_LIFECYCLE.APPROVED: return 'success'
      case LOAN_LIFECYCLE.REJECTED: return 'error'
      case LOAN_LIFECYCLE.PENDING_APPROVAL: return 'warning'
      case WAREHOUSE_STATUS.PROCESSED: return 'info'
      case WAREHOUSE_STATUS.REJECTED: return 'error'
      case WAREHOUSE_STATUS.RETURNED: return 'success'
      case WAREHOUSE_STATUS.BORROWED: return 'success'
      default: return 'default'
    }
  }

  // Support extendStatus as an array (history). Use the last entry as the latest request.
  const extendStatusAll: any = loan.extendStatus as any
  const latestExtend = Array.isArray(extendStatusAll) && extendStatusAll.length > 0 ? extendStatusAll[extendStatusAll.length - 1] : (extendStatusAll || null)
  const extendDecisionStatus = String(latestExtend?.approveStatus || '').trim().toLowerCase()
  const extendDecisionPending = Boolean(latestExtend && !extendDecisionStatus.includes('setuj') && !extendDecisionStatus.includes('tolak'))
  const extendButtonDisabled = extendDecisionPending
  const extendDisabledMessage = extendButtonDisabled
    ? 'Permintaan perpanjangan sebelumnya masih menunggu keputusan. Tunggu hingga disetujui atau ditolak sebelum mengajukan ulang.'
    : ''

  React.useEffect(() => {
    if (extendButtonDisabled && extendOpen) {
      setExtendOpen(false)
    }
  }, [extendButtonDisabled, extendOpen])

  const formatReturnStatusLabel = (status?: string | null) => {
    if (isFollowUpReturnStatus(status)) return CUSTOM_RETURN_STATUS.FOLLOW_UP
    const fallback = String(WAREHOUSE_STATUS.RETURNED || 'Returned')
    const raw = String(status ?? fallback).trim()
    if (!raw) return fallback
    const normalized = raw.toLowerCase()
    if (
      normalized.includes('returnaccepted') ||
      normalized.includes('return accepted') ||
      normalized.includes('return_accepted')
    ) {
      return 'Dikembalikan Tidak Lengkap'
    }
    const withWordBoundaries = raw
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    return withWordBoundaries
      .split(' ')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')
  }

  // return request dialog states
  const [returnRequestOpen, setReturnRequestOpen] = React.useState(false)
  const [returnRequestNote, setReturnRequestNote] = React.useState<string | undefined>(undefined)
  const [returnRequestFiles, setReturnRequestFiles] = React.useState<File[] | undefined>(undefined)
  const [submittingReturnRequest, setSubmittingReturnRequest] = React.useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = React.useState(false)
  const [completeNote, setCompleteNote] = React.useState<string | undefined>(undefined)
  const [completeError, setCompleteError] = React.useState<string | undefined>(undefined)
  const [submittingComplete, setSubmittingComplete] = React.useState(false)
  const [rejectReturnDialogOpen, setRejectReturnDialogOpen] = React.useState(false)
  const [rejectReturnNote, setRejectReturnNote] = React.useState<string | undefined>(undefined)
  const [rejectReturnError, setRejectReturnError] = React.useState<string | undefined>(undefined)
  const [submittingRejectReturn, setSubmittingRejectReturn] = React.useState(false)
  // removed debug logging

  // Remove debug wrapper and restore direct setter
  const setCompleteNoteWithLog = undefined

  const latestReturnStatus = React.useMemo(() => {
    const statuses: string[] = []
    const normalizedReturnStatus = normalizeStatusValue(loan.returnStatus?.status)
    if (normalizedReturnStatus) statuses.push(normalizedReturnStatus)

    const requests = Array.isArray(loan.returnRequest) ? (loan.returnRequest as any[]) : []
    if (requests.length) {
      const latestEntry = requests[requests.length - 1]
      const normalizedEntryStatus = normalizeStatusValue(latestEntry?.status)
      if (normalizedEntryStatus) statuses.push(normalizedEntryStatus)
    }

    const normalizedLoanStatus = normalizeStatusValue(loan.loanStatus)
    if (normalizedLoanStatus) statuses.push(normalizedLoanStatus)

    return statuses.find(Boolean) || ''
  }, [loan.returnStatus, loan.returnRequest, loan.loanStatus])

  const handleSubmitReturnRequest = async (loanId: string, note?: string, files?: File[]) => {
    if (!loanId) return
    const trimmed = String(note ?? '').trim()
    if (!trimmed) {
      toast.error('Catatan pengembalian wajib diisi')
      return
    }
    if (!files || files.length === 0) {
      toast.error('Unggah minimal 1 foto sebagai bukti pengembalian')
      return
    }

    setSubmittingReturnRequest(true)
    try {
      const fd = new FormData()
      fd.append('note', trimmed)
      if (files && files.length > 0) {
        files.forEach(f => fd.append('files', f))
      }

      const res = await fetch(`/api/loans/${loanId}/request-return`, {
        method: 'POST',
        body: fd
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || `HTTP ${res.status}`)
      }

      toast.success('Permintaan pengembalian berhasil dikirim')
      setReturnRequestOpen(false)
      setReturnRequestNote(undefined)
      setReturnRequestFiles(undefined)
      router.reload()
    } catch (err: any) {
      console.error('Failed submit return request', err)
      toast.error(err?.message || 'Gagal mengirim permintaan pengembalian')
    } finally {
      setSubmittingReturnRequest(false)
    }
  }

  // Has borrower-submitted return request waiting for warehouse action
  const hasActiveReturnRequest = React.useMemo(() => {
    if (!latestReturnStatus) return false
    if (RETURN_REJECTION_TOKENS.some(token => latestReturnStatus.includes(token))) return false
    return RETURN_PENDING_TOKENS.some(token => latestReturnStatus.includes(token))
  }, [latestReturnStatus])

  const hasReturnPending = hasActiveReturnRequest

  // Any non-rejected return state (requested, accepted, completed) should prevent showing certain actions
  const hasAnyReturn = React.useMemo(() => {
    if (!latestReturnStatus) return false
    if (RETURN_REJECTION_TOKENS.some(token => latestReturnStatus.includes(token))) return false
    if (latestReturnStatus.includes('return')) return true
    return RETURN_FINAL_TOKENS.some(token => latestReturnStatus.includes(token))
  }, [latestReturnStatus])

  const isCompletedLoan = React.useMemo(() => {
    try {
      const top = String(loan.loanStatus || '').toLowerCase()
      const rs = String(loan.returnStatus?.status || '').toLowerCase()
      if (top.includes('complete') || top.includes('selesai')) return true
      if (rs.includes('complete') || rs.includes('selesai') || rs.includes('returned') || rs.includes('dikembalikan')) return true
      const reqs = Array.isArray(loan.returnRequest) ? (loan.returnRequest as any[]).map(r => String(r?.status || '').toLowerCase()) : []
      if (reqs.some(s => s.includes('complete') || s.includes('completed') || s.includes('selesai') || s.includes('returned') || s.includes('dikembalikan'))) return true
    } catch (e) { }
    return false
  }, [loan.loanStatus, loan.returnStatus, loan.returnRequest])

  const acceptedEntry = React.useMemo(() => {
    const reqs = (loan.returnRequest ?? []) as any[]
    return reqs.slice().reverse().find((r: any) => isReturnAcceptedLike(r?.status))
  }, [loan.returnRequest])

  // Find the original borrower-submitted return request (returnRequested)
  const originalRequest = React.useMemo(() => {
    const reqs = (loan.returnRequest ?? []) as any[]
    return reqs.find((r: any) => {
      const s = String(r?.status || '').toLowerCase()
      return s.includes('returnrequested') || s.includes('return_requested') || s.includes('submitted') || s.includes('pending')
    })
  }, [loan.returnRequest])

  const pendingReturnRequest = React.useMemo(() => {
    const reqs = (loan.returnRequest ?? []) as any[]
    return reqs.slice().reverse().find((r: any) => {
      const s = String(r?.status || '').toLowerCase()
      return ['returnrequested', 'return_requested', 'submitted', 'pending', 'approved'].some((token) => s.includes(token)) || !s
    })
  }, [loan.returnRequest])

  const groupedReturnEntries = React.useMemo(() => {
    if (!Array.isArray(loan.returnRequest) || loan.returnRequest.length === 0) return [] as { id: string, submission: any, latest: any, entries: any[] }[]
    const toTimestamp = (entry: any) => {
      const raw = entry?.requestedAt || entry?.processedAt || entry?.acceptedAt || entry?.completedAt
      if (!raw) return 0
      const ts = new Date(raw).getTime()
      return Number.isNaN(ts) ? 0 : ts
    }
    const sorted = [...loan.returnRequest].sort((a: any, b: any) => toTimestamp(a) - toTimestamp(b))
    const groupMap = new Map<string, { entries: any[], submission?: any }>()
    const order: string[] = []
    sorted.forEach((entry: any, index: number) => {
      const rootId = String(entry?.requestId || entry?.id || `request-${index}`)
      if (!groupMap.has(rootId)) {
        groupMap.set(rootId, { entries: [], submission: undefined })
        order.push(rootId)
      }
      const group = groupMap.get(rootId)!
      group.entries.push(entry)
      const isSubmissionEntry = !entry?.requestId || String(entry?.id) === rootId
      if (!group.submission && isSubmissionEntry) {
        group.submission = entry
      }
    })
    return order.map((rootId) => {
      const group = groupMap.get(rootId)!
      const entries = [...group.entries].sort((a, b) => toTimestamp(a) - toTimestamp(b))
      const submission = group.submission || entries[0]
      const latest = entries[entries.length - 1] || submission
      return { id: rootId, submission, latest, entries }
    })
  }, [loan.returnRequest])

  const warehouseProcessedDisplay = React.useMemo(() => {
    const fallback = {
      processedBy: loan.warehouseStatus?.processedBy ?? null,
      processedAt: loan.warehouseStatus?.processedAt ?? null,
      note: loan.warehouseStatus?.note ?? null
    }
    const historyEntries = Array.isArray((loan.warehouseStatus as any)?.history)
      ? ((loan.warehouseStatus as any)?.history as any[])
      : []
    if (!historyEntries.length) return fallback
    const toTimestamp = (value?: string | null) => {
      if (!value) return Number.POSITIVE_INFINITY
      const ts = new Date(value).getTime()
      return Number.isNaN(ts) ? Number.POSITIVE_INFINITY : ts
    }
    const sorted = [...historyEntries].sort((a, b) => toTimestamp(a?.processedAt) - toTimestamp(b?.processedAt))
    const firstProcess = sorted.find(entry => {
      const normalizedStatus = normalizeStatusValue(entry?.status)
      const normalizedAction = normalizeStatusValue(entry?.action)
      if (normalizedAction === 'process') return true
      if (normalizedStatus.includes('borrowed') || normalizedStatus.includes('dipinjam')) return true
      return false
    })
    if (firstProcess) {
      return {
        processedBy: firstProcess?.processedBy || fallback.processedBy,
        processedAt: firstProcess?.processedAt || fallback.processedAt,
        note: firstProcess?.note || fallback.note
      }
    }
    return fallback
  }, [loan.warehouseStatus])

  const handleConfirmComplete = async (loanId?: string, note?: string, files?: File[]) => {
    if (!loanId) return
    const trimmed = String(note ?? completeNote ?? '').trim()
    if (!trimmed) {
      setCompleteError('Catatan pengembalian wajib diisi')
      toast.error('Catatan pengembalian wajib diisi')
      return
    }
    setSubmittingComplete(true)
    setCompleteError(undefined)
    try {
      // Find the accepted return request id to act upon (prefer latest accepted)
      const acceptedEntry = (loan?.returnRequest ?? []).slice().reverse().find((r: any) => isReturnAcceptedLike(r?.status))
      const requestId = acceptedEntry?.id
      if (!requestId) {
        toast.error('Tidak menemukan permintaan pengembalian yang diterima untuk diselesaikan')
        return
      }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)
      const resp = await fetch(`/api/loans/${loanId}/request-return-action`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'completed', requestId, note: trimmed }),
        signal: controller.signal
      })
      clearTimeout(timeout)
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body?.message || `HTTP ${resp.status}`)
      }
      const updated = await resp.json()
      const updatedLoan = updated?.loan ?? updated
      // Refresh the page so updated loan data is fetched (parent page will fetch fresh loan on load)
      router.reload()
      toast.success('Peminjaman telah diselesaikan')
      setCompleteDialogOpen(false)
      setCompleteNote(undefined)
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        toast.error('Permintaan terlalu lama — coba lagi')
      } else {
        console.error('Failed complete return', error)
        toast.error(error?.message || 'Gagal menyelesaikan peminjaman')
      }
    } finally {
      setSubmittingComplete(false)
    }
  }

  const handleRejectReturnRequest = async (loanId?: string, note?: string) => {
    if (!loanId) return
    const trimmed = String(note ?? rejectReturnNote ?? '').trim()
    if (!trimmed) {
      setRejectReturnError('Catatan pengembalian wajib diisi')
      toast.error('Catatan pengembalian wajib diisi')
      return
    }

    const targetRequest = pendingReturnRequest || originalRequest
    if (!targetRequest?.id) {
      toast.error('Tidak menemukan permintaan pengembalian untuk ditolak')
      return
    }

    setSubmittingRejectReturn(true)
    setRejectReturnError(undefined)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)
      const resp = await fetch(`/api/loans/${loanId}/request-return-action`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'return_rejected', requestId: targetRequest.id, note: trimmed }),
        signal: controller.signal
      })
      clearTimeout(timeout)
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body?.message || `HTTP ${resp.status}`)
      }
      await resp.json().catch(() => null)
      router.reload()
      toast.success('Permintaan pengembalian ditolak')
      setRejectReturnDialogOpen(false)
      setRejectReturnNote(undefined)
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        toast.error('Permintaan terlalu lama — coba lagi')
      } else {
        console.error('Failed reject return request', error)
        toast.error(error?.message || 'Gagal menolak permintaan pengembalian')
      }
    } finally {
      setSubmittingRejectReturn(false)
    }
  }

  return (
    <Box sx={{ height: '100%' }}>
      <Stack spacing={3}>
        {/* Removed Jenis Kebutuhan, Company, and Metode Pengambilan cards as requested */}

          {/* Status cards removed as requested */}

        {/* Approval Status */}
        {!loan.isDraft && loan.company && loan.company.length > 0 && (
          <Card elevation={1} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 3 }}>
                Status Approval
              </Typography>
              <Stack spacing={2}>
                {loan.company.map((companyName) => {
                  const approval = loan.approvals?.companies?.[companyName]
                  const marketingName = approval?.approvedBy || 'Belum diapprove'

                  // Treat fresh submissions (approved=false without metadata) as pending rather than rejected
                  const hasFinalRejection = approval?.approved === false && (!!approval?.rejectionReason || !!approval?.approvedAt)
                  const approvalStatusLabel = approval?.approved === true
                    ? LOAN_LIFECYCLE.APPROVED
                    : hasFinalRejection
                      ? LOAN_LIFECYCLE.REJECTED
                      : LOAN_LIFECYCLE.PENDING_APPROVAL
                  const approvalStatusColor: 'success' | 'warning' | 'error' = approval?.approved === true
                    ? 'success'
                    : hasFinalRejection
                      ? 'error'
                      : 'warning'
                  const approvalStatusDisplay = formatLifecycleStatusLabel(approvalStatusLabel) || approvalStatusLabel
                  return (
                    <Box key={companyName} sx={{
                      p: 3,
                      bgcolor: 'rgba(255,255,255,0.8)',
                      borderRadius: 2,
                      border: '1px solid rgba(0,0,0,0.06)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {companyName}
                        </Typography>
                        <Chip
                          label={approvalStatusDisplay}
                          color={approvalStatusColor}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                            <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                              Diproses oleh: <strong>{marketingName}</strong>
                            </Typography>
                      {approval?.approved === true && approval.approvedAt && (
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          Disetujui pada {new Date(approval.approvedAt).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      )}
                      {hasFinalRejection && (
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          {approval?.rejectionReason && (
                            <Alert severity="error">
                              <Typography variant="body2">
                                <strong>Alasan Penolakan:</strong> {approval.rejectionReason}
                              </Typography>
                            </Alert>
                          )}
                          {approval?.note && (
                            <Alert severity="warning">
                              <Typography variant="body2">
                                <strong>Catatan Penolakan:</strong> {approval.note}
                              </Typography>
                            </Alert>
                          )}
                        </Stack>
                      )}
                      {approval?.approved && approval?.note && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Catatan:</strong> {approval.note}
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Status Perpanjangan card removed — extension history is shown in Jadwal & Waktu */}

        {/* Status Gudang card rendered here (unchanged) */}

        {/* Warehouse Status */}
        {/* Always show the warehouse card. If warehouseStatus is missing, show a default "Menunggu Approval" */}
        {(
          // Always render card so UI area doesn't look empty — default label will show when missing
          true
        ) && (
          <Card elevation={1} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 3 }}>
                Status Gudang
              </Typography>
              <Box sx={{
                p: 3,
                bgcolor: 'rgba(255,255,255,0.8)',
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.06)'
              }}>
                {/* Decide what status to show inside Status Gudang
                    - If the loan has a returnStatus, prefer showing previousStatus (e.g. 'Dipinjam')
                    - Otherwise fall back to warehouseStatus.status; default to "Menunggu Approval" */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {(() => {
                    const displayStatus = (() => {
                      const currentStatus = String(loan.returnStatus?.status || '').toLowerCase()
                      if (currentStatus.includes('return_rejected')) {
                        return WAREHOUSE_STATUS.BORROWED
                      }
                      const raw = (loan.returnStatus?.previousStatus as string) || loan.warehouseStatus?.status || 'Menunggu Approval'
                      const normalized = String(raw || '').toLowerCase()
                      if (!raw) return 'Menunggu Approval'
                      if (
                        normalized.includes('return') ||
                        normalized.includes(RETURN_STATUS_TOKENS.FOLLOW_UP) ||
                        normalized.includes('followup') ||
                        normalized.includes('follow-up')
                      ) {
                        return WAREHOUSE_STATUS.BORROWED
                      }
                      return raw
                    })()
                    const displayColor = getStatusColor(displayStatus)
                    return (
                      <Chip
                        label={displayStatus}
                        color={(displayColor as any) || 'default'}
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    )
                  })()}
                  <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', width: 32, height: 32 }}>
                    <WarehouseIcon sx={{ color: '#1565c0', fontSize: '1rem' }} />
                  </Avatar>
                </Box>

                {/* Show processedAt / processedBy for the warehouse processing step.
                    If the loan has been returned, prefer the original warehouse processedAt stored on warehouseStatus;
                    fall back to returnStatus.processedAt/processBy if the other is missing. */}
                {warehouseProcessedDisplay.processedAt && (
                  <>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      Diproses oleh: <strong>{warehouseProcessedDisplay.processedBy ?? '-'}</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 2 }}>
                      {new Date(warehouseProcessedDisplay.processedAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </>
                )}

                {/* removed returned-by and returned-timestamp from Status Gudang — return details are shown in the separate Status Pengembalian card below */}

                {loan.warehouseStatus?.rejectionReason && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Alasan penolakan: {loan.warehouseStatus.rejectionReason}
                    </Typography>
                  </Alert>
                )}

                {/* show note from earliest warehouse process or fallback to latest */}
                {warehouseProcessedDisplay.note && (
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                    <Typography variant="body2">
                      <strong>Catatan:</strong> {warehouseProcessedDisplay.note}
                    </Typography>
                  </Alert>
                )}

                {/* returnStatus is intentionally not rendered inside Status Gudang — it will be rendered below as its own card */}
              </Box>
            </CardContent>
          </Card>

          )}

          {/* Render returnStatus AFTER the Status Gudang card so returned info is a separate grid below */}
          {(loan.returnStatus || (Array.isArray(loan.returnRequest) && loan.returnRequest.length > 0)) && (
            <Card elevation={1} sx={{ mt: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 3 }}>
                  Status Pengembalian
                </Typography>
                <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Chip label={formatReturnStatusLabel(loan.returnStatus?.status)} color={currentReturnStatusColor} variant="filled" sx={{ fontWeight: 600 }} />
                    {/* previousStatus intentionally hidden in this card — we show the primary returned label only */}
                    <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.06)', width: 32, height: 32 }}>
                      <DeliveryIcon sx={{ color: '#0288d1', fontSize: '1rem' }} />
                    </Avatar>
                  </Box>

                  {groupedReturnEntries.length > 0 ? (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      {groupedReturnEntries.map((group, index) => {
                        const submission = group.submission || group.entries[0]
                        const latest = group.latest || submission
                        const positionLabel = `Pengajuan ke-${index + 1}`
                        const requestedAtLabel = formatDateTimeLabel(submission?.requestedAt)
                        const processedAtLabel = formatDateTimeLabel(latest?.processedAt || latest?.acceptedAt || latest?.completedAt)
                        const submissionChipColor = resolveReturnStatusChipColor(submission?.status)
                        const normalizedEntryStatus = normalizeStatusValue(latest?.status || submission?.status)
                        const latestChipColor = resolveReturnStatusChipColor(latest?.status || submission?.status)
                        const submissionStatusLabel = formatReturnStatusLabel(submission?.status || positionLabel)
                        const latestStatusLabel = normalizedEntryStatus.includes('reject') ? 'Pengembalian Ditolak' : formatReturnStatusLabel(latest?.status || submission?.status || positionLabel)
                        const borrowerNote = submission?.note
                        const photos = Array.isArray(submission?.photoResults)
                          ? submission.photoResults.filter((p: any) => Boolean(p?.url))
                          : []
                        const processNote = latest?.processedNote || latest?.noteAccepted || latest?.rejectionReason || latest?.processedDescription
                        const processedBy = latest?.processedBy || latest?.acceptedBy
                        return (
                          <Box
                            key={group.id || `${submission?.id || 'submission'}-${index}`}
                            sx={{
                              border: '1px solid rgba(0,0,0,0.07)',
                              borderRadius: 2,
                              p: 2,
                              bgcolor: 'rgba(248,250,255,0.75)'
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ color: '#0D47A1', fontWeight: 700 }}>
                                {positionLabel}
                              </Typography>
                              <Chip label={submissionStatusLabel} color={submissionChipColor} size="small" sx={{ fontWeight: 600 }} />
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#555' }}>
                              Diajukan oleh: <strong>{submission?.requestedBy || loan.borrowerName || '-'}</strong>
                            </Typography>
                            {requestedAtLabel && (
                              <Typography variant="caption" sx={{ color: '#777', display: 'block' }}>
                                {requestedAtLabel}
                              </Typography>
                            )}
                            {borrowerNote && (
                              <Alert severity="info" sx={{ mt: 1, borderRadius: 2, p: 1 }}>
                                <Typography variant="body2">
                                  <strong>Catatan Pengaju:</strong> {borrowerNote}
                                </Typography>
                              </Alert>
                            )}
                            {photos.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
                                  Bukti foto pengembalian:
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                  {photos.map((p: any, idx: number) => (
                                    <a key={p?.url || idx} href={p?.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                      <Image
                                        src={p?.url}
                                        alt={p?.filename ?? `photo-${idx + 1}`}
                                        width={84}
                                        height={84}
                                        style={{ objectFit: 'cover', borderRadius: 6 }}
                                        unoptimized
                                      />
                                    </a>
                                  ))}
                                </Stack>
                              </Box>
                            )}
                            {(processedBy || processedAtLabel) && (
                              <Box sx={{ mt: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                  <Typography variant="body2" sx={{ color: '#555' }}>
                                    Diproses oleh: <strong>{processedBy || '-'}</strong>
                                  </Typography>
                                  <Chip label={latestStatusLabel} color={latestChipColor} size="small" sx={{ fontWeight: 600 }} />
                                </Stack>
                                {processedAtLabel && (
                                  <Typography variant="caption" sx={{ color: '#777', display: 'block' }}>
                                    {processedAtLabel}
                                  </Typography>
                                )}
                              </Box>
                            )}
                            {processNote && (
                              <Alert
                                severity={latestChipColor === 'error' || normalizedEntryStatus.includes('reject') ? 'error' : latestChipColor}
                                sx={{ mt: 1, borderRadius: 2, p: 1 }}
                              >
                                <Typography variant="body2">
                                  <strong>Catatan Proses:</strong> {processNote}
                                </Typography>
                              </Alert>
                            )}
                          </Box>
                        )
                      })}
                    </Stack>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Belum ada riwayat pengajuan pengembalian.
                    </Alert>
                  )}

                  {groupedReturnEntries.length === 0 && (() => {
                    const accepted = acceptedEntry ?? undefined
                    const processedBy = accepted?.processedBy ?? accepted?.acceptedBy ?? loan.returnStatus?.processedBy
                    const processedAt = accepted?.processedAt ?? accepted?.acceptedAt ?? loan.returnStatus?.processedAt
                    if (!processedAt) return null
                    const rsText = String(loan.returnStatus?.status || '').toLowerCase()
                    const isAcceptedTop = isReturnAcceptedLike(loan.returnStatus?.status)
                    const acceptedNote = accepted?.processedNote ?? accepted?.note ?? (isAcceptedTop ? loan.returnStatus?.note : undefined)
                    return (
                      <>
                        <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                          Diproses oleh: <strong>{processedBy ?? '-'}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 2 }}>
                          {new Date(processedAt).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                        {acceptedNote && (
                          <Alert severity="info" sx={{ mt: 1, borderRadius: 3, bgcolor: 'rgba(221,235,255,0.95)', p: 1.25, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.dark' }}>
                              Catatan: <span style={{ fontWeight: 400, color: 'inherit' }}>{acceptedNote}</span>
                            </Typography>
                          </Alert>
                        )}
                      </>
                    )
                  })()}

                  
                </Box>
              </CardContent>
            </Card>
          )}

        {/* Action Buttons */}
        {/* If the loan has already been returned we also show a compact informational alert here when
            the page is not in warehouse mode. The full `Status Pengembalian` card still appears below
            so we only render this compact alert on normal detail view to make returned state visible. */}
        {loan.returnStatus && router.query.mode !== 'warehouse' && (() => {
          const top = String(loan.returnStatus?.status || '').toLowerCase()
          const topLoan = String(loan.loanStatus || '').toLowerCase()

          // If top-level is explicitly 'returnRequested' -> show 'Belum Dikembalikan'
          if (top.includes('returnrequested') || top.includes('submitted')) {
            return (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Barang Belum Dikembalikan
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Terdapat permintaan pengembalian yang masih menunggu konfirmasi gudang
                </Typography>
              </Alert>
            )
          }

          // If follow-up is active (rusak/cacat), show dedicated alert
          if (isFollowUpReturnStatus(loan.returnStatus?.status) || isFollowUpReturnStatus(loan.loanStatus)) {
            return (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {CUSTOM_RETURN_STATUS.FOLLOW_UP}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Barang telah diterima namun membutuhkan tindak lanjut gudang sebelum peminjaman dinyatakan selesai.
                </Typography>
              </Alert>
            )
          }

          // If top-level indicates accepted or final (completed/returned) -> show 'Sudah Dikembalikan'
          if (
            isReturnAcceptedLike(loan.returnStatus?.status) ||
            top.includes('complete') ||
            top.includes('completed') ||
            top.includes('returned') ||
            top.includes('selesai') ||
            topLoan.includes('complete') ||
            topLoan.includes('completed') ||
            topLoan.includes('selesai')
          ) {
            const isFinal = top.includes('complete') || top.includes('completed') || top.includes('returned') || top.includes('selesai') || topLoan.includes('complete') || topLoan.includes('completed') || topLoan.includes('selesai')
            return (
              <>
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Barang Sudah Dikembalikan
                  </Typography>
                </Alert>
                {isFinal && (
                  <Alert severity="success" sx={{ borderRadius: 2, mt: 1 }} icon={<CheckCircleIcon sx={{ color: 'success.main' }} />}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Peminjaman Telah Selesai
                    </Typography>
                  </Alert>
                )}
              </>
            )
          }

          return null
        })()}
      
        <Stack spacing={3}>
          {/* History & Extension Buttons */}
          {!loan.isDraft && (
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={onShowHistory}
                sx={{
                  borderColor: '#424242',
                  color: '#424242',
                  py: 1.5,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#424242',
                    bgcolor: 'rgba(66, 66, 66, 0.04)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                Lihat Riwayat Pengajuan
              </Button>

              {canSeeExtensionButton && !hasAnyReturn && !hasReturnPending && !isWarehouseRejected && (
                <>
                  <Tooltip title={extendDisabledMessage} disableHoverListener={!extendButtonDisabled} placement="top">
                    <span style={{ display: 'block', width: '100%' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ScheduleIcon />}
                        disabled={extendButtonDisabled}
                        fullWidth
                        onClick={() => {
                          if (!extendButtonDisabled) setExtendOpen(true)
                        }}
                        sx={{
                          py: 1.5,
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)',
                            transform: 'translateY(-1px)'
                          },
                          '&.Mui-disabled': {
                            background: 'linear-gradient(135deg, #90a4ae 0%, #78909c 100%)',
                            color: 'rgba(255,255,255,0.7)'
                          }
                        }}
                      >
                        Ajukan Perpanjangan
                      </Button>
                    </span>
                  </Tooltip>

                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<AssignmentIcon />}
                    fullWidth
                    onClick={() => setReturnRequestOpen(true)}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        background: 'rgba(251, 140, 0, 0.08)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Ajukan Pengembalian
                  </Button>
                  {extendButtonDisabled && (
                    <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>
                      <Typography variant="body2">
                        Permintaan perpanjangan sebelumnya masih menunggu persetujuan Marketing. Mohon tunggu keputusan sebelum mengajukan lagi.
                      </Typography>
                    </Alert>
                  )}
                  <ExtensionDialog
                    open={extendOpen}
                    loan={loan}
                    currentUserId={currentUserId}
                    currentUserEmail={currentUserEmail}
                    onClose={() => setExtendOpen(false)}
                    onSubmitted={() => router.reload()}
                  />
                  <ReturnRequestDialog
                    open={returnRequestOpen}
                    loan={loan}
                    note={returnRequestNote}
                    onClose={() => setReturnRequestOpen(false)}
                    onConfirm={handleSubmitReturnRequest}
                    onFilesChange={(files) => setReturnRequestFiles(files)}
                    onNoteChange={(n) => setReturnRequestNote(n)}
                    getNeedTypeLabel={getNeedTypeLabel}
                    getPickupMethodLabel={getPickupMethodLabel}
                  />
                </>
              )}
            </Stack>
          )}

          {/* Approval Actions */}
          {router.query.mode === 'approve' && !loan.isDraft && loan.company && loan.company.length > 0 && loan.approvals && getLoanStatus(loan) === LOAN_LIFECYCLE.PENDING_APPROVAL && (
            <>
              <Alert severity="info" sx={{ borderRadius: 2, p: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  Aksi Approval Marketing
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Silakan setujui atau tolak permintaan peminjaman ini
                </Typography>
              </Alert>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                      onClick={onApprove}
                      disabled={submitting || (currentUserRole === 'marketing' && !(Array.isArray(currentUserCompanies) && loan.company && loan.company.every(c => currentUserCompanies.includes(c))))}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    flex: 1,
                    background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                      transform: 'translateY(-1px)',
                    }
                  }}
                >
                  {submitting ? (
                    <>
                      <LinearProgress sx={{ width: '100%', position: 'absolute', bottom: 0, left: 0 }} />
                      Memproses...
                    </>
                  ) : (
                    'Setujui Peminjaman'
                  )}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={onReject}
                  disabled={submitting || (currentUserRole === 'marketing' && !(Array.isArray(currentUserCompanies) && loan.company && loan.company.every(c => currentUserCompanies.includes(c))))}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    flex: 1,
                    background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
                      transform: 'translateY(-1px)',
                    }
                  }}
                >
                  {submitting ? 'Memproses...' : 'Tolak Peminjaman'}
                </Button>
              </Stack>
            </>
          )}

          {/* Warehouse Actions */}
          {router.query.mode === 'warehouse' && !loan.isDraft && (getLoanStatus(loan) === LOAN_LIFECYCLE.APPROVED || loan.warehouseStatus) && (
            <>
              {/* informational header for warehouse actions; hide it when a return has been recorded */}
              {!loan.returnStatus && (
                <Alert severity="info" sx={{ borderRadius: 2, p: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    Aksi Gudang
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Kelola proses peminjaman di gudang
                  </Typography>
                </Alert>
              )}

              {(() => {
                // Normalize status checks. Prefer top-level returnStatus presence for return detection
                const ws = loan.warehouseStatus?.status ? String(loan.warehouseStatus.status).toLowerCase() : ''
                const rsStatus = loan.returnStatus?.status ? String(loan.returnStatus.status).toLowerCase() : ''

                const isWarehousePending = !ws || ws.includes('menunggu') || ws.includes('pending')

                const isReturnRequested = rsStatus.includes('returnrequested') || rsStatus.includes('return_requested')
                // Borrowed should be true when the warehouse status indicates dipinjam and no confirmed return exists.
                // Also treat an active return request as "borrowed" so the confirmation buttons stay visible while waiting for warehouse action.
                const isBorrowed = (!loan.returnStatus || isReturnRequested) && (ws.includes('dipinjam') || ws.includes('borrow') || isReturnRequested)
                const isRejected = ws.includes('ditolak') || ws.includes('reject')
                const isReturned = rsStatus.includes('dikembalikan') || rsStatus.includes('returned') || ws.includes('dikembalikan') || ws.includes('returned')

                // Find accepted return request entry (if any)
                const acceptedEntry = (loan.returnRequest ?? []).slice().reverse().find((r: any) => isReturnAcceptedLike(r?.status))
                const accepted = Boolean(acceptedEntry) || isReturnAcceptedLike(loan.returnStatus?.status)

                if (isWarehousePending) {
                  return (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<WarehouseIcon />}
                    onClick={onWarehouseProcess}
                    disabled={submitting}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      flex: 1,
                      background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                        transform: 'translateY(-1px)',
                      }
                    }}
                  >
                    {submitting ? 'Memproses...' : 'Proses Peminjaman'}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={onWarehouseReject}
                    disabled={submitting}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      flex: 1,
                      background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
                        transform: 'translateY(-1px)',
                      }
                    }}
                  >
                    {submitting ? 'Memproses...' : 'Tolak Peminjaman'}
                  </Button>
                    </Stack>
                  )
                }

                if (isBorrowed) {
                  return (
                    <Stack spacing={2}>
                      <Tooltip title={(!hasActiveReturnRequest && router.query.mode === 'warehouse') ? 'Tunggu peminjam mengajukan permintaan pengembalian' : ''}>
                        <span>
                          <Button
                            variant="contained"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => { if (hasActiveReturnRequest) onWarehouseReturn() }}
                            disabled={submitting || ((router.query.mode === 'warehouse') && !hasActiveReturnRequest)}
                            fullWidth
                            sx={{
                              py: 1.5,
                              fontWeight: 600,
                              flex: 1,
                              color: 'white',
                              background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
                                transform: 'translateY(-1px)',
                              }
                            }}
                          >
                            {submitting ? 'Memproses...' : 'Konfirmasi Pengembalian'}
                          </Button>
                        </span>
                      </Tooltip>

                      <Tooltip title={(!hasActiveReturnRequest && router.query.mode === 'warehouse') ? 'Tunggu permintaan pengembalian dari peminjam' : 'Tolak permintaan pengembalian ini'}>
                        <span>
                          <Button
                            variant="contained"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => {
                              if (!hasActiveReturnRequest) return
                              setRejectReturnDialogOpen(true)
                              setRejectReturnNote(undefined)
                              setRejectReturnError(undefined)
                            }}
                            disabled={submitting || !hasActiveReturnRequest}
                            fullWidth
                            sx={{
                              py: 1.5,
                              fontWeight: 600,
                              flex: 1,
                              color: 'white',
                              background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
                                transform: 'translateY(-1px)',
                              }
                            }}
                          >
                            Tolak Pengembalian
                          </Button>
                        </span>
                      </Tooltip>

                      {(() => {
                        const acceptedEntry = (loan.returnRequest ?? []).slice().reverse().find((r: any) => isReturnAcceptedLike(r?.status))
                        const accepted = Boolean(acceptedEntry)
                        if (!accepted || isCompletedLoan || router.query.mode !== 'warehouse' || !isWarehouseUser) return null
                        return (
                          <Tooltip title={accepted ? 'Selesaikan peminjaman' : 'Tombol ini akan aktif setelah gudang menyetujui pengembalian (termasuk status Perlu Tindak Lanjut)'}>
                            <span>
                              <Button
                                variant="contained"
                                color="info"
                                onClick={() => setCompleteDialogOpen(true)}
                                disabled={submitting}
                                fullWidth
                                sx={{
                                  py: 1.5,
                                  fontWeight: 600,
                                  color: 'white',
                                  background: 'linear-gradient(135deg, #0288d1 0%, #0277bd 100%)',
                                  '&:hover': { transform: 'translateY(-1px)' }
                                }}
                              >
                                Peminjaman Selesai
                              </Button>
                            </span>
                          </Tooltip>
                        )
                      })()}
                    </Stack>
                  )
                }

                // If the loan has been accepted by the warehouse (either via returnRequest or top-level returnStatus),
                // show a 'Peminjaman Selesai' finalization button (warehouse-only), unless it's already completed.
                if (accepted && !isCompletedLoan && router.query.mode === 'warehouse' && isWarehouseUser) {
                  return (
                    <Tooltip title={'Selesaikan peminjaman'}>
                      <span>
                        <Button
                          variant="contained"
                          color="info"
                          onClick={() => setCompleteDialogOpen(true)}
                          disabled={submitting}
                          fullWidth
                          sx={{
                            py: 1.5,
                            fontWeight: 600,
                            color: 'white',
                            background: 'linear-gradient(135deg, #0288d1 0%, #0277bd 100%)',
                            '&:hover': { transform: 'translateY(-1px)' }
                          }}
                        >
                          Peminjaman Selesai
                        </Button>
                      </span>
                    </Tooltip>
                  )
                }

                if (isRejected) {
                  return (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    Ditolak Gudang
                  </Typography>
                  {loan.warehouseStatus.rejectionReason && (
                    <Typography variant="body2">
                      Alasan: {loan.warehouseStatus.rejectionReason}
                    </Typography>
                  )}
                </Alert>
                  )
                }

                if (isReturned) {
                  // Prefer showing the acceptedEntry (returnAccepted) processedAt/processedBy when available
                  // as the displayed 'Tanggal pengembalian' / 'Diproses oleh', but fall back to completed returnStatus
                  const returnedAt = acceptedEntry?.processedAt ?? loan.returnStatus?.processedAt ?? loan.warehouseStatus?.returnedAt
                  const returnedBy = acceptedEntry?.processedBy ?? loan.returnStatus?.processedBy ?? loan.warehouseStatus?.returnedBy
                  return (
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                        Barang Sudah Dikembalikan
                      </Typography>
                      {returnedAt && (
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Tanggal pengembalian: {new Date(returnedAt).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      )}
                      {returnedBy && (
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Diproses oleh: <strong>{returnedBy}</strong>
                        </Typography>
                      )}
                    </Alert>
                  )
                }

                return null
              })()}
            </>
          )}

          {/* Submit Draft */}
          {loan.isDraft && (
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={onSubmitDraft}
              disabled={submitting}
              sx={{
                py: 1.5,
                fontWeight: 600,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              {submitting ? (
                <>
                  <LinearProgress sx={{ width: '100%', position: 'absolute', bottom: 0, left: 0 }} />
                  Mengajukan...
                </>
              ) : (
                'Ajukan Peminjaman'
              )}
            </Button>
          )}
        </Stack>
      </Stack>
      {/* Dialog untuk menolak permintaan pengembalian */}
      <ReturnActionDialog
        open={rejectReturnDialogOpen}
        loan={loan}
        note={rejectReturnNote}
        action='return_rejected'
        entry={pendingReturnRequest || originalRequest || null}
        onClose={() => { setRejectReturnDialogOpen(false); setRejectReturnNote(undefined); setRejectReturnError(undefined) }}
        setNote={(n) => { setRejectReturnNote(n); if (rejectReturnError) setRejectReturnError(undefined) }}
        onConfirm={async (note?: string) => {
          setRejectReturnNote(note)
          setRejectReturnError(undefined)
          await handleRejectReturnRequest(loan?.id, note)
        }}
        noteError={rejectReturnError}
        submitting={submittingRejectReturn}
      />

      {/* Confirmation dialog to mark a borrowed loan as completed (reuses shared ReturnDialog UI) */}
      <ReturnActionDialog
        open={completeDialogOpen}
        loan={loan}
        note={completeNote}
        onClose={() => { setCompleteDialogOpen(false); setCompleteNote(undefined); setCompleteError(undefined) }}
        action='completed'
        setNote={(n) => { setCompleteNote(n); if (completeError) setCompleteError(undefined) }}
        onConfirm={async (note?: string) => {
          setCompleteNote(note)
          setCompleteError(undefined)
          await handleConfirmComplete(loan?.id, note)
        }}
        entry={acceptedEntry}
        noteError={completeError}
        submitting={submittingComplete}
      />
    </Box>
  )
}

  

export default LoanDetails