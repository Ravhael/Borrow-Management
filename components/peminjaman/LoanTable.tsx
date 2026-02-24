import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Avatar,
  Chip,
  Tooltip,
  IconButton,
  TablePagination,
  Zoom,
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { canPerform, getClientPermissions } from '../../utils/clientAuthorization'
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { LoanData } from '../../types/loan'
import { getLoanStatus, getStatusColor, getStatusIcon, formatDate, formatLifecycleStatusLabel } from '../../utils/peminjamanHelpers'
import { getEffectiveReturnDate } from '../../utils/loanHelpers'
import { getNeedTypeLabel } from '../../utils/needTypes'
import { getExtendStatusDisplay } from '../../utils/extendStatusDisplay'

interface LoanTableProps {
  loans: LoanData[]
  selectedLoans: string[]
  // visibleIds is provided so parent can select only visible rows when checking header checkbox
  onSelectAll: (checked: boolean, visibleIds?: string[]) => void
  onSelectLoan: (loanId: string, checked: boolean) => void
  onBulkDelete: () => void
  currentPage: number
  itemsPerPage: number
  totalLoans: number
  onPageChange: (event: unknown, newPage: number) => void
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  // callback to notify parent of the current filtered set (before pagination)
  onFilteredChange?: (filteredLoans: LoanData[]) => void
}

const parseDateValue = (value?: string | null): number => {
  if (!value) return Number.NaN
  const direct = Date.parse(value)
  if (!Number.isNaN(direct)) return direct
  const fallbackMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (fallbackMatch) {
    const day = Number(fallbackMatch[1])
    const month = Number(fallbackMatch[2])
    let year = Number(fallbackMatch[3])
    if (year < 100) year += 2000
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      const ts = Date.UTC(year, Math.max(0, month - 1), day)
      if (!Number.isNaN(ts)) return ts
    }
  }
  return Number.NaN
}

const parseLoanIdDate = (loanId?: string | null): number => {
  if (!loanId) return 0
  const dateDigitsMatch = loanId.match(/(\d{4})(\d{2})(\d{2})/)
  if (!dateDigitsMatch) return 0
  const year = Number(dateDigitsMatch[1])
  const month = Number(dateDigitsMatch[2])
  const day = Number(dateDigitsMatch[3])
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return 0
  const base = Date.UTC(year, Math.max(0, month - 1), day)
  const suffixMatch = loanId.match(/-(\d+)/)
  const suffix = suffixMatch ? Number(suffixMatch[1]) : 0
  return (Number.isNaN(base) ? 0 : base) + (Number.isNaN(suffix) ? 0 : suffix)
}

const getLoanSortTimestamp = (loan: LoanData): number => {
  const candidates = [
    loan.submittedAt,
    (loan as any)?.createdAt,
    (loan as any)?.updatedAt,
    loan.useDate,
    loan.outDate,
    loan.returnDate
  ]
  for (const value of candidates) {
    const ts = parseDateValue(value)
    if (!Number.isNaN(ts)) return ts
  }
  return parseLoanIdDate(loan.id)
}

const getDisplayStatusLabel = (status?: string | null): string => {
  const override = formatLifecycleStatusLabel(status)
  if (override) return override
  if (status === null || typeof status === 'undefined') return 'Tidak ada status'
  const trimmed = String(status).trim()
  return trimmed || 'Tidak ada status'
}

const BORROWER_AVATAR_COLORS = [
  '#0f172a',
  '#1e293b',
  '#312e81',
  '#1e1b4b',
  '#172554',
  '#134e4a',
  '#164e63',
  '#0f766e',
  '#7c2d12',
  '#701a75',
  '#581c87',
  '#3f6212'
]

const getBorrowerAvatarColor = (value?: string | null) => {
  if (!value) return '#1F2937'
  const normalized = value.trim().toLowerCase()
  if (!normalized) return '#1F2937'
  const hash = normalized.split('').reduce((acc, char, idx) => {
    const code = char.charCodeAt(0)
    return (acc + code * (idx + 13)) % 997
  }, 0)
  const index = hash % BORROWER_AVATAR_COLORS.length
  return BORROWER_AVATAR_COLORS[index]
}

const getBorrowerAvatarStyles = (value?: string | null) => {
  const background = getBorrowerAvatarColor(value)
  const hex = background.replace('#', '')
  if (hex.length !== 6) return { background, color: '#ffffff' }
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return {
    background,
    color: luminance > 0.7 ? '#0f172a' : '#ffffff'
  }
}

const ENTITY_COLOR_PALETTE = [
  '#0f172a',
  '#083344',
  '#1e1b4b',
  '#312e81',
  '#3f6212',
  '#713f12',
  '#7c2d12',
  '#701a75',
  '#4a044e',
  '#14532d',
  '#0f766e',
  '#1d4ed8',
  '#075985',
  '#7c3aed'
]

const getEntityChipColor = (value?: string | null) => {
  if (!value) return '#1e293b'
  const normalized = value.trim().toLowerCase()
  if (!normalized) return '#1e293b'
  const hash = normalized.split('').reduce((acc, char, idx) => {
    const code = char.charCodeAt(0)
    return (acc + code * (idx + 17)) % 1543
  }, 0)
  const index = hash % ENTITY_COLOR_PALETTE.length
  return ENTITY_COLOR_PALETTE[index]
}

const getEntityChipStyles = (value?: string | null) => {
  const background = getEntityChipColor(value)
  const hex = background.replace('#', '')
  if (hex.length !== 6) return { background, color: '#ffffff' }
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return {
    background,
    color: luminance > 0.6 ? '#0f172a' : '#ffffff'
  }
}

const NEED_TYPE_COLOR_PALETTE = [
  '#e0f2fe',
  '#dbeafe',
  '#c7d2fe',
  '#ddd6fe',
  '#fce7f3',
  '#ffe4e6',
  '#ffedd5',
  '#fef3c7',
  '#dcfce7',
  '#d1fae5',
  '#ccfbf1',
  '#f1f5f9'
]

const getNeedTypeChipColor = (value?: string | null) => {
  if (!value) return '#0f172a'
  const normalized = value.trim().toLowerCase()
  if (!normalized) return '#0f172a'
  const hash = normalized.split('').reduce((acc, char, idx) => {
    const code = char.charCodeAt(0)
    return (acc + code * (idx + 23)) % 1993
  }, 0)
  const index = hash % NEED_TYPE_COLOR_PALETTE.length
  return NEED_TYPE_COLOR_PALETTE[index]
}

const getNeedTypeChipStyles = (value?: string | null) => {
  const background = getNeedTypeChipColor(value)
  const hex = background.replace('#', '')
  if (hex.length !== 6) return { background, color: '#ffffff' }
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return {
    background,
    color: luminance > 0.6 ? '#0f172a' : '#ffffff'
  }
}

const COMPANY_COLOR_PALETTE = [
  '#e2e8f0',
  '#cbd5f5',
  '#dbeafe',
  '#c7d2fe',
  '#e9d5ff',
  '#f3e8ff',
  '#fee2e2',
  '#fecdd3',
  '#ffe4e6',
  '#fef9c3',
  '#fef3c7',
  '#dcfce7',
  '#d1fae5',
  '#bae6fd'
]

const getCompanyChipColor = (value?: string | null) => {
  if (!value) return '#1f2937'
  const normalized = value.trim().toLowerCase()
  if (!normalized) return '#1f2937'
  const hash = normalized.split('').reduce((acc, char, idx) => {
    const code = char.charCodeAt(0)
    return (acc + code * (idx + 29)) % 1787
  }, 0)
  const index = hash % COMPANY_COLOR_PALETTE.length
  return COMPANY_COLOR_PALETTE[index]
}

const getCompanyChipStyles = (value?: string | null) => {
  const background = getCompanyChipColor(value)
  const hex = background.replace('#', '')
  if (hex.length !== 6) return { background, color: '#ffffff' }
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return {
    background,
    color: luminance > 0.6 ? '#0f172a' : '#ffffff'
  }
}

const STATUS_CHIP_STYLE_MAP: Record<string, { bg: string; color: string }> = {
  'menunggu approval': { bg: '#f59e0b', color: '#ffffff' },
  'ditolak marketing': { bg: '#e11d48', color: '#ffffff' },
  'disetujui marketing': { bg: '#22c55e', color: '#ffffff' },
  'whrejected': { bg: '#7c3aed', color: '#ffffff' },
  'wh rejected': { bg: '#7c3aed', color: '#ffffff' },
  'dipinjam': { bg: '#0284c7', color: '#ffffff' },
  'dipinjam__badge': { bg: '#2563eb', color: '#ffffff' },
  'perpanjang diajukan': { bg: '#f97316', color: '#ffffff' },
  'diperpanjang': { bg: '#0d9488', color: '#ffffff' },
  'permintaan pengembalian': { bg: '#0891b2', color: '#ffffff' },
  'dikembalikan': { bg: '#10b981', color: '#ffffff' },
  'perlu tindak lanjut': { bg: '#d946ef', color: '#ffffff' },
  'dikembalikan tidak lengkap': { bg: '#ca8a04', color: '#ffffff' },
  'pengembalian ditolak': { bg: '#b91c1c', color: '#ffffff' }
}

const getStatusChipCustomStyle = (label?: string | null, opts?: { hasBadge?: boolean }) => {
  if (!label) return undefined
  const normalized = label.trim().toLowerCase()
  const key = opts?.hasBadge && normalized === 'dipinjam' ? 'dipinjam__badge' : normalized
  return STATUS_CHIP_STYLE_MAP[key]
}

const LoanTable: React.FC<LoanTableProps> = ({
  loans,
  selectedLoans,
  onSelectAll,
  onSelectLoan,
  onBulkDelete,
  currentPage,
  itemsPerPage,
  totalLoans,
  onPageChange,
  onRowsPerPageChange,
  onFilteredChange
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [needTypeFilter, setNeedTypeFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')

  // session for client-side permission checks
  const sessionRes = useSession()

  const sortedLoans = useMemo(() => {
    return [...loans].sort((a, b) => getLoanSortTimestamp(b) - getLoanSortTimestamp(a))
  }, [loans])

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>()
    sortedLoans.forEach((loanItem) => {
      const statusLabel = getLoanStatus(loanItem)
      if (statusLabel) {
        statuses.add(statusLabel)
      }
    })
    return Array.from(statuses).sort((a, b) => a.localeCompare(b))
  }, [sortedLoans])

  const entityOptions = useMemo(() => {
    const entities = new Set<string>()
    sortedLoans.forEach((loanItem) => {
      if (loanItem.entitasId) {
        entities.add(String(loanItem.entitasId))
      }
    })
    return Array.from(entities).sort((a, b) => a.localeCompare(b))
  }, [sortedLoans])

  const needTypeOptions = useMemo(() => {
    const types = new Set<string>()
    sortedLoans.forEach((loanItem) => {
      const label = getNeedTypeLabel(loanItem.needType)
      if (label) {
        types.add(label)
      }
    })
    return Array.from(types).sort((a, b) => a.localeCompare(b))
  }, [sortedLoans])

  const companyOptions = useMemo(() => {
    const companies = new Set<string>()
    sortedLoans.forEach((loanItem) => {
      if (Array.isArray(loanItem.company)) {
        loanItem.company.filter(Boolean).forEach(name => companies.add(String(name)))
      } else if (loanItem.company) {
        companies.add(String(loanItem.company))
      }
    })
    return Array.from(companies).sort((a, b) => a.localeCompare(b))
  }, [sortedLoans])

  const filteredLoans = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const normalizedEntityFilter = entityFilter.trim().toLowerCase()
    const normalizedNeedTypeFilter = needTypeFilter.trim().toLowerCase()
    const normalizedCompanyFilter = companyFilter.trim().toLowerCase()

    return sortedLoans.filter((loanItem) => {
      const statusLabelRaw = getLoanStatus(loanItem) || ''
      const statusLabel = statusLabelRaw.toLowerCase()
      const matchesStatus = statusFilter === 'all' || statusLabel === statusFilter.toLowerCase()
      if (!matchesStatus) return false

      const entityValue = String(loanItem.entitasId || '').trim().toLowerCase()
      if (entityFilter !== 'all' && entityValue !== normalizedEntityFilter) return false

      const needTypeLabel = getNeedTypeLabel(loanItem.needType) || ''
      const normalizedNeedTypeValue = needTypeLabel.trim().toLowerCase()
      if (needTypeFilter !== 'all' && normalizedNeedTypeValue !== normalizedNeedTypeFilter) return false

      const companyValues = Array.isArray(loanItem.company)
        ? loanItem.company.filter(Boolean).map(value => String(value).trim().toLowerCase())
        : loanItem.company
          ? [String(loanItem.company).trim().toLowerCase()]
          : []
      if (companyFilter !== 'all' && !companyValues.includes(normalizedCompanyFilter)) return false

      if (!normalizedSearch) return true

      const haystack = [
        loanItem.borrowerName,
        loanItem.borrowerPhone,
        loanItem.entitasId,
        Array.isArray(loanItem.company) ? loanItem.company.join(' ') : loanItem.company,
        needTypeLabel,
        getDisplayStatusLabel(statusLabelRaw)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [sortedLoans, searchTerm, statusFilter, entityFilter, needTypeFilter, companyFilter])

  // Notify parent about the filtered dataset (before pagination)
  React.useEffect(() => {
    if (typeof onFilteredChange === 'function') {
      onFilteredChange(filteredLoans)
    }
  }, [filteredLoans, onFilteredChange])

  const hasActiveFilter =
    searchTerm.trim() !== '' ||
    statusFilter !== 'all' ||
    entityFilter !== 'all' ||
    needTypeFilter !== 'all' ||
    companyFilter !== 'all'

  // Compute visible loans for the current page (component now handles pagination internally)
  const visibleLoans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredLoans.slice(start, start + itemsPerPage)
  }, [filteredLoans, currentPage, itemsPerPage])

  return (
    <Zoom in={true} timeout={1000}>
      <Paper
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          backgroundColor: 'white',
          border: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Bulk Actions */}
        {selectedLoans.length > 0 && (
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)', 
            backgroundColor: 'rgba(26, 54, 93, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {selectedLoans.length} peminjaman dipilih
            </Typography>
            {/* Show bulk delete only when permissions allow it. If no allowed actions, show informative note. */}
            {(() => {
              const session = (sessionRes as any).data
              if (!session) return <Typography variant="body2" color="text.secondary">No bulk actions (not signed in)</Typography>
              const perms = getClientPermissions(session)
              // Debug: show effective permissions and session for diagnosis
              try { console.debug('[LoanTable] bulk: sessionUserId=%s role=%o perms=%o', session?.user?.id, session?.user?.role, perms) } catch (e) {}
              if (perms.delete === 'All') {
                return (
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={onBulkDelete}
                    sx={{
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 3,
                      '&:hover': {
                        backgroundColor: 'error.dark',
                      }
                    }}
                  >
                    Hapus Terpilih ({selectedLoans.length})
                  </Button>
                )
              }

              if (perms.delete === 'Own') {
                // Ensure all selected loans are owned by the current user
                const currentUserId = String(session.user.id)
                const allOwn = selectedLoans.every(id => {
                  const found = loans.find(l => String(l.id) === String(id))
                  return found && String((found as any).userId) === currentUserId
                })
                if (allOwn) {
                  return (
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={onBulkDelete}
                      sx={{
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 3,
                        '&:hover': {
                          backgroundColor: 'error.dark',
                        }
                      }}
                    >
                      Hapus Terpilih ({selectedLoans.length})
                    </Button>
                  )
                }
              }

              // When we have selections but no permitted bulk actions, show a small informative message
              return <Typography variant="body2" color="text.secondary">Tidak ada aksi massal yang diizinkan untuk peran Anda.</Typography>
            })()} 
          </Box>
        )}

        {/* Filters */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            backgroundColor: 'rgba(248, 250, 252, 0.9)'
          }}
        >
          <TextField
            label="Cari peminjaman"
            placeholder="Cari nama, entitas, nomor HP, atau status"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: 240 }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="loan-status-filter-label">Status</InputLabel>
            <Select
              labelId="loan-status-filter-label"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as string)}
              renderValue={(selected) => {
                if (selected === 'all') return 'Semua Status'
                return getDisplayStatusLabel(selected as string)
              }}
            >
              <MenuItem value="all">Semua Status</MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {getDisplayStatusLabel(status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="entity-filter-label">Entity</InputLabel>
            <Select
              labelId="entity-filter-label"
              label="Entity"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value as string)}
              renderValue={(selected) => (selected === 'all' ? 'Semua Entity' : selected)}
            >
              <MenuItem value="all">Semua Entity</MenuItem>
              {entityOptions.map(entity => (
                <MenuItem key={entity} value={entity}>
                  {entity}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="need-type-filter-label">Need Type</InputLabel>
            <Select
              labelId="need-type-filter-label"
              label="Need Type"
              value={needTypeFilter}
              onChange={(e) => setNeedTypeFilter(e.target.value as string)}
              renderValue={(selected) => (selected === 'all' ? 'Semua Need Type' : selected)}
            >
              <MenuItem value="all">Semua Need Type</MenuItem>
              {needTypeOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="company-filter-label">Company</InputLabel>
            <Select
              labelId="company-filter-label"
              label="Company"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value as string)}
              renderValue={(selected) => (selected === 'all' ? 'Semua Company' : selected)}
            >
              <MenuItem value="all">Semua Company</MenuItem>
              {companyOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasActiveFilter && (
            <Button
              variant="text"
              color="primary"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setEntityFilter('all')
                setNeedTypeFilter('all')
                setCompanyFilter('all')
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Reset Filter
            </Button>
          )}
        </Box>

        <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
          <Table
            stickyHeader
            sx={{
              minWidth: 1300,
              '& .MuiTableCell-root': {
                px: 1
              }
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  '& th': {
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '2px solid #e5e7eb',
                    py: 2.5,
                  }
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={visibleLoans.length > 0 && visibleLoans.every(v => selectedLoans.includes(v.id))}
                    indeterminate={
                      visibleLoans.some(v => selectedLoans.includes(v.id)) && !visibleLoans.every(v => selectedLoans.includes(v.id))
                    }
                    onChange={(e) => onSelectAll(e.target.checked, visibleLoans.map(v => v.id))}
                    sx={{
                      color: 'primary.main',
                      '&.Mui-checked': {
                        color: 'primary.main',
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: 18,
                      }
                    }}
                  />
                </TableCell>
                <TableCell>ID Peminjaman</TableCell>
                <TableCell>Borrower</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Need Type</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Use Date</TableCell>
                <TableCell>Return Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLoans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 3, opacity: 0.5 }} />
                      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2, fontWeight: 500 }}>
                        {hasActiveFilter ? 'Tidak ada data yang cocok dengan filter' : 'No loan requests found'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {hasActiveFilter ? 'Ubah kata kunci atau status untuk melihat data lainnya.' : 'Loan requests will appear here once submitted'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                visibleLoans.map((loan, index) => {
                  const borrowerAvatar = getBorrowerAvatarStyles(loan.borrowerName || loan.id)
                  const entityChip = getEntityChipStyles(loan.entitasId)
                  const needTypeLabel = getNeedTypeLabel(loan.needType)
                  const needTypeChip = getNeedTypeChipStyles(needTypeLabel)
                  return (
                    <Zoom in={true} key={loan.id} style={{ transitionDelay: `${index * 50}ms` }}>
                      <TableRow
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(26, 54, 93, 0.04)',
                          transform: 'scale(1.002)',
                          transition: 'all 0.2s ease-in-out',
                        },
                        '&:nth-of-type(odd)': {
                          backgroundColor: 'rgba(241, 245, 255, 1)',
                        },
                        '&:nth-of-type(even)': {
                          backgroundColor: 'rgba(224, 231, 255, 0.9)',
                        },
                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.2s ease-in-out',
                      }}
                        >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedLoans.includes(loan.id)}
                          onChange={(e) => onSelectLoan(loan.id, e.target.checked)}
                          sx={{
                            '& .MuiSvgIcon-root': {
                              fontSize: 18,
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="ID Peminjaman" arrow>
                          <Chip
                            label={loan.id}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontWeight: 600,
                              maxWidth: 220,
                              bgcolor: borrowerAvatar.background,
                              color: borrowerAvatar.color,
                              borderColor: borrowerAvatar.background,
                              '& .MuiChip-label': {
                                color: borrowerAvatar.color,
                                fontWeight: 600
                              }
                            }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              mr: 2,
                              bgcolor: borrowerAvatar.background,
                              color: borrowerAvatar.color,
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              border: '2px solid rgba(255,255,255,0.6)',
                              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)'
                            }}
                          >
                            {loan.borrowerName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {loan.borrowerName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {loan.borrowerPhone}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={loan.entitasId}
                          variant="filled"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: entityChip.background,
                            color: entityChip.color,
                            border: `1px solid ${entityChip.background}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            '& .MuiChip-label': {
                              color: entityChip.color,
                              fontWeight: 700
                            },
                            '&:hover': {
                              backgroundColor: entityChip.background,
                              opacity: 0.9,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={needTypeLabel}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: needTypeChip.background,
                            color: needTypeChip.color,
                            borderRadius: 0.5,
                            letterSpacing: '0.02em',
                            border: '1px solid rgba(15,23,42,0.08)',
                            '& .MuiChip-label': {
                              color: needTypeChip.color,
                              fontWeight: 700
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(() => {
                              const companies = Array.isArray(loan.company)
                                ? loan.company
                                : loan.company
                                  ? [loan.company]
                                  : []
                              if (!companies.length) {
                                return (
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    -
                                  </Typography>
                                )
                              }
                              return companies.map((companyName) => {
                                const styles = getCompanyChipStyles(companyName)
                                return (
                                  <Chip
                                    key={`${loan.id}-${companyName}`}
                                    label={companyName}
                                    size="small"
                                    sx={{
                                      fontWeight: 600,
                                      bgcolor: styles.background,
                                      color: styles.color,
                                      borderRadius: 0.5,
                                      border: '1px solid rgba(15,23,42,0.08)',
                                      '& .MuiChip-label': {
                                        color: styles.color,
                                        fontWeight: 600,
                                      }
                                    }}
                                  />
                                )
                              })
                            })()}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {loan.useDate ? formatDate(loan.useDate).split(',')[0] : '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {(() => {
                              // prefer last-approved extension's requestedReturnDate when present
                              const effective = getEffectiveReturnDate(loan as any)
                              return effective ? formatDate(effective).split(',')[0] : (loan.returnDate ? formatDate(loan.returnDate).split(',')[0] : '-')
                            })()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const canonicalStatus = getLoanStatus(loan)
                          const baseLabel = canonicalStatus || 'Tidak ada status'
                          const displayLabel = getDisplayStatusLabel(canonicalStatus)
                          const extendDisplay = getExtendStatusDisplay(loan)
                          const label = extendDisplay?.label || displayLabel
                          const color = extendDisplay?.color || getStatusColor(loan)
                          const iconName = getStatusIcon(canonicalStatus || baseLabel)
                          const icon = iconName === 'Edit' ? <EditIcon /> :
                            iconName === 'CheckCircle' ? <CheckCircleIcon /> :
                            iconName === 'Cancel' ? <CancelIcon /> :
                            iconName === 'Inventory' ? <InventoryIcon /> :
                            iconName === 'Assignment' ? <AssignmentIcon /> :
                            <PendingIcon />
                          const chipIcon = extendDisplay ? <InventoryIcon fontSize="small" /> : icon
                          const hasBadgeCount = Boolean(extendDisplay?.badgeCount)
                          const customStyle = getStatusChipCustomStyle(label, { hasBadge: hasBadgeCount })
                          let chipNode: React.ReactNode = (
                            <Chip
                              label={label}
                              color={customStyle ? 'default' : color}
                              size="small"
                              icon={chipIcon}
                              variant="filled"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                bgcolor: customStyle?.bg,
                                color: customStyle?.color,
                                border: customStyle ? 'none' : undefined,
                                '& .MuiChip-label': {
                                  color: customStyle?.color || '#ffffff',
                                  maxWidth: 320,
                                  display: 'inline-block',
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                  paddingLeft: 2,
                                  paddingRight: 2,
                                  fontSize: '0.85rem',
                                  textAlign: 'left'
                                },
                                '& .MuiChip-icon': {
                                  color: customStyle?.color || undefined
                                },
                                display: 'inline-flex',
                                justifyContent: 'flex-start'
                              }}
                            />
                          )

                          if (extendDisplay?.badgeCount) {
                            chipNode = (
                              <Badge
                                color="error"
                                badgeContent={`${extendDisplay.badgeCount}x`}
                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                sx={{ '& .MuiBadge-badge': { fontWeight: 700, fontSize: '0.65rem', minWidth: 22, height: 22 } }}
                              >
                                {chipNode}
                              </Badge>
                            )
                          }

                          return (
                            <Tooltip title={extendDisplay?.tooltip || label} arrow>
                              <Box sx={{ display: 'inline-flex' }}>{chipNode}</Box>
                            </Tooltip>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            component={Link}
                            href={`/peminjaman/${loan.id}`}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(26, 54, 93, 0.1)',
                              '&:hover': {
                                bgcolor: 'rgba(26, 54, 93, 0.2)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <VisibilityIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      </TableRow>
                    </Zoom>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          <TablePagination
            component="div"
            count={hasActiveFilter ? filteredLoans.length : totalLoans}
            page={currentPage - 1}
            onPageChange={onPageChange}
            rowsPerPage={itemsPerPage}
            onRowsPerPageChange={onRowsPerPageChange}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} of ${count}`
            }
            sx={{
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontWeight: 500,
              },
              '& .MuiTablePagination-actions': {
                '& button': {
                  '&:hover': {
                    backgroundColor: 'rgba(26, 54, 93, 0.1)',
                  },
                },
              },
            }}
          />
        </Box>
      </Paper>
    </Zoom>
  )
}

export default LoanTable