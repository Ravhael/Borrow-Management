import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Paper,
  Typography,
  Box,
  Breadcrumbs,
  Link as MuiLink,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Fade,
  Badge,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material'
import { LoanData } from '../../types/loanDetail'
import { LOAN_LIFECYCLE, WAREHOUSE_STATUS } from '../../types/loanStatus'
import { getLoanStatus, formatDate } from '../../utils/loanHelpers'
import { formatLifecycleStatusLabel } from '../../utils/peminjamanHelpers'

interface HeaderSectionProps {
  loan: LoanData
  onShowHistory: () => void
}

const formatStatusLabel = (value?: string | null) => {
  if (value === null || typeof value === 'undefined') return ''
  const base = formatLifecycleStatusLabel(String(value)) || String(value)
  const trimmed = base.trim()
  if (!trimmed) return ''
  const normalized = trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
  return normalized
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const isReturnRequestedStatus = (value?: string | null) => {
  const text = String(value ?? '').toLowerCase()
  if (!text) return false
  return text.includes('returnrequested') ||
    text.includes('return requested') ||
    text.includes('return_requested') ||
    text.includes('pengembalian')
}

const formatCurrency = (value?: number | null) => {
  const amount = typeof value === 'number' ? value : 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const normalizeStatusValue = (value?: string | null) => (value ? String(value).trim().toLowerCase() : '')

const isReturnRejectedStatus = (value?: string | null) => {
  const normalized = normalizeStatusValue(value)
  if (!normalized) return false
  if (normalized.includes('return_rejected') || normalized.includes('returnrejected') || normalized.includes('return rejected')) {
    return true
  }
  const mentionsReturn = normalized.includes('return') || normalized.includes('pengembalian')
  const mentionsRejection = normalized.includes('reject') || normalized.includes('tolak')
  return mentionsReturn && mentionsRejection
}

const isReturnCompletedStatus = (value?: string | null) => {
  const normalized = normalizeStatusValue(value)
  if (!normalized) return false
  return (
    normalized.includes('dikembali') ||
    normalized.includes('returned') ||
    normalized.includes('selesai') ||
    normalized.includes('complete')
  )
}

const hasReturnRejection = (loan: LoanData) => {
  if (isReturnCompletedStatus(loan.warehouseStatus?.status)) return false

  const primaryStatus = loan.returnStatus?.status
  if (isReturnCompletedStatus(primaryStatus)) return false
  if (isReturnRejectedStatus(primaryStatus)) return true

  const requestAny: any = (loan as any).returnRequest
  const entries: any[] = Array.isArray(requestAny) ? requestAny : requestAny ? [requestAny] : []
  if (!entries.length) return false

  const latestEntry = entries[entries.length - 1]
  if (isReturnCompletedStatus(latestEntry?.status)) return false
  if (isReturnRejectedStatus(latestEntry?.status)) return true

  const anyCompletion = entries.some(entry => isReturnCompletedStatus(entry?.status))
  if (anyCompletion) return false

  return entries.some(entry => isReturnRejectedStatus(entry?.status))
}

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'

type ExtendChipState = {
  label: string
  color: ChipColor
  icon: React.ReactElement
  badgeCount?: number
  tooltip?: string
}

const isInactiveLoanContext = (loan: LoanData) => {
  const statuses = [normalizeStatusValue(loan.warehouseStatus?.status), normalizeStatusValue(loan.loanStatus)].filter(Boolean)
  if (!statuses.length) return false
  return statuses.some(status => (
    status.includes('dikembali') ||
    status.includes('returned') ||
    status.includes('selesai') ||
    status.includes('complete') ||
    status.includes('cancel') ||
    status.includes('batal') ||
    status.includes('tolak')
  ))
}

const getExtendChipState = (loan: LoanData): ExtendChipState | null => {
  const extendAny: any = loan.extendStatus as any
  const entries: any[] = Array.isArray(extendAny) ? extendAny.filter(Boolean) : extendAny ? [extendAny] : []
  if (!entries.length || isInactiveLoanContext(loan)) return null

  const latestEntry = entries[entries.length - 1]
  if (!latestEntry) return null

  const normalizedApprove = normalizeStatusValue(latestEntry.approveStatus)
  const rejectionCount = entries.reduce((count, entry) => {
    return normalizeStatusValue(entry?.approveStatus).includes('tolak') ? count + 1 : count
  }, 0)

  if (!normalizedApprove) {
    return {
      label: 'Perpanjang Diajukan',
      color: 'warning',
      icon: <InventoryIcon />,
      tooltip: 'Permintaan perpanjangan sedang menunggu keputusan'
    }
  }

  if (normalizedApprove.includes('setuj')) {
    return {
      label: 'Diperpanjang',
      color: 'info',
      icon: <InventoryIcon />,
      tooltip: 'Perpanjangan disetujui oleh Marketing'
    }
  }

  if (normalizedApprove.includes('tolak')) {
    return {
      label: WAREHOUSE_STATUS.BORROWED,
      color: 'success',
      icon: <InventoryIcon />,
      badgeCount: Math.max(rejectionCount, 1),
      tooltip: rejectionCount > 1
        ? `${rejectionCount}x permintaan perpanjangan ditolak`
        : 'Permintaan perpanjangan ditolak'
    }
  }

  return null
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ loan, onShowHistory }) => {
  const router = useRouter()
  const extendChipState = getExtendChipState(loan)
  const returnRejected = hasReturnRejection(loan)

  return (
    <Fade in={true} style={{ transitionDelay: '100ms' }}>
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 3, sm: 4, md: 6 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid rgba(21, 101, 192, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #1565c0 0%, #42a5f5 50%, #1565c0 100%)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AssignmentIcon sx={{ fontSize: 48, mr: 2, color: '#1565c0' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
              Detail Peminjaman
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
              ID: {loan.id} • Dibuat: {formatDate(loan.submittedAt)}
            </Typography>
            {loan.totalDenda && loan.totalDenda.daysOverdue > 0 && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                sx={{ mt: 1 }}
              >
                <Chip
                  label={`Terlambat ${loan.totalDenda.daysOverdue} hari`}
                  color="error"
                  variant="outlined"
                  icon={<WarningIcon />}
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={`Total denda ${formatCurrency(loan.totalDenda.fineAmount)}`}
                  color="error"
                  variant="filled"
                  icon={<InfoIcon />}
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
            )}
          </Box>
        </Box>

        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink
            component={Link}
            href={router.query.mode === 'warehouse' ? '/gudang' : '/peminjaman'}
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <ArrowBackIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
            {router.query.mode === 'warehouse' ? 'Gudang' : 'Daftar Peminjaman'}
          </MuiLink>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
            Detail Peminjaman
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {(() => {
                const marketingStatus = getLoanStatus(loan)
                const warehouseStatus = loan.warehouseStatus?.status
                const hasDbStatus = Boolean(loan.loanStatus && loan.loanStatus.trim())
                const canonicalForColor = hasDbStatus ? marketingStatus : (warehouseStatus ?? marketingStatus)
                const canonical = warehouseStatus ?? marketingStatus
                const labelSource = hasDbStatus ? marketingStatus : canonical
                let labelToShow = formatStatusLabel(labelSource || canonical || '') || String(labelSource || canonical || '')
                const raw = String(canonicalForColor || '').toLowerCase()
                const isCompleted = raw.includes('complete') || raw.includes('completed') || raw.includes('selesai')
                const isReturnRequested = isReturnRequestedStatus(canonicalForColor) || isReturnRequestedStatus(labelSource)

                let colorToUse: ChipColor = 'warning'
                if (
                  isCompleted ||
                  canonicalForColor === LOAN_LIFECYCLE.APPROVED ||
                  canonicalForColor === WAREHOUSE_STATUS.BORROWED ||
                  canonicalForColor === WAREHOUSE_STATUS.RETURNED
                ) {
                  colorToUse = 'success'
                } else if (canonical === LOAN_LIFECYCLE.REJECTED || canonicalForColor === WAREHOUSE_STATUS.REJECTED) {
                  colorToUse = 'error'
                } else if (isReturnRequested) {
                  colorToUse = 'info'
                }

                let iconToUse = (isCompleted || canonicalForColor === LOAN_LIFECYCLE.APPROVED || canonicalForColor === WAREHOUSE_STATUS.BORROWED || canonicalForColor === WAREHOUSE_STATUS.RETURNED)
                  ? <CheckCircleIcon />
                  : (canonical === LOAN_LIFECYCLE.REJECTED || canonicalForColor === WAREHOUSE_STATUS.REJECTED)
                    ? <ErrorIcon />
                    : isReturnRequested
                      ? <InfoIcon />
                      : <WarningIcon />

                if (returnRejected) {
                  labelToShow = 'Pengembalian Ditolak'
                  colorToUse = 'error'
                  iconToUse = <ErrorIcon />
                }

                if (extendChipState && !returnRejected) {
                  labelToShow = extendChipState.label
                  colorToUse = extendChipState.color
                  iconToUse = extendChipState.icon
                }

                let chipNode: React.ReactNode = (
                  <Chip
                    label={labelToShow}
                    color={colorToUse}
                    variant="filled"
                    size="medium"
                    icon={iconToUse}
                    sx={{ fontWeight: 600, px: 1 }}
                  />
                )

                if (extendChipState?.badgeCount && !returnRejected) {
                  chipNode = (
                    <Badge
                      color="error"
                      badgeContent={`${extendChipState.badgeCount}x`}
                      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                      sx={{ '& .MuiBadge-badge': { fontWeight: 700, fontSize: '0.65rem', minWidth: 22, height: 22 } }}
                    >
                      {chipNode}
                    </Badge>
                  )
                }

                if (extendChipState?.tooltip && !returnRejected) {
                  chipNode = (
                    <Tooltip title={extendChipState.tooltip}>
                      <Box sx={{ display: 'inline-flex' }}>{chipNode}</Box>
                    </Tooltip>
                  )
                }

                return chipNode
              })()}

            {loan.isDraft && (
              <Chip
                label="Draft"
                color="warning"
                variant="outlined"
                size="small"
                icon={<InfoIcon />}
              />
            )}

            {/* Warehouse chip intentionally removed here to avoid showing redundant 'Gudang: Dipinjam' in header */}
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip title="Lihat Riwayat">
              <IconButton
                onClick={onShowHistory}
                sx={{
                  bgcolor: 'rgba(21, 101, 192, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(21, 101, 192, 0.2)',
                  }
                }}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>

            <Link href={router.query.mode === 'warehouse' ? '/gudang' : '/peminjaman'} passHref>
              <Tooltip title="Kembali">
                <IconButton
                  sx={{
                    bgcolor: 'rgba(66, 66, 66, 0.1)',
                    '&:hover': {
                      bgcolor: 'rgba(66, 66, 66, 0.2)',
                    }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
            </Link>
          </Stack>
        </Box>
      </Paper>
    </Fade>
  )
}

export default HeaderSection