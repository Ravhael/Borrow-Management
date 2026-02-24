import React, { useState, useMemo, useEffect } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]'
import { prisma } from '../lib/prisma'
import { getCanonicalRole } from '../config/roleConfig'
import {
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Collapse,
  Button,
  CircularProgress,
  Menu,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material'
import { getNeedTypeLabel } from '../utils/needTypes'
import { getOverallStatus, getDurationInfo, getEffectiveReturnDate, formatDate } from '../utils/loanHelpers'
import { isLoanActive } from '../utils/activeLoanHelpers'
import { CUSTOM_RETURN_STATUS, RETURN_STATUS_TOKENS, WAREHOUSE_STATUS } from '../types/loanStatus'
import * as XLSX from 'xlsx'

// Dynamic import for ChartsWrapper to avoid SSR issues
const ChartsWrapper = dynamic(
  () => import('../components/reporting/ChartsWrapper'),
  { 
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }
)

type Kpi = {
  label: string
  value: string
  helper?: string
  color?: string
  icon?: string
}

type OverdueLoan = {
  id: string
  borrowerName: string
  entitas: string
  returnDate: string
  daysOverdue: number
  fineAmount: number
}

type LoanTableRow = {
  id: string
  borrowerName: string
  entitas: string
  needType: string
  status: string
  submittedAt: string
  returnDate: string
  company: string
}

type PageProps = {
  kpis: Kpi[]
  charts: {
    loansByMonth: Array<{ month: string; total: number }>
    loansByStatus: Array<{ status: string; value: number }>
    loansByNeedType: Array<{ needType: string; value: number }>
    loansByEntitas: Array<{ entitas: string; value: number }>
    topBorrowers: Array<{ name: string; value: number }>
    topEntitas: Array<{ name: string; value: number }>
    activeItems: Array<{
      item: string
      value: number
      topBorrower: string
      topEntitas: string
      borrowers: Array<{ borrower: string; entitas: string; count: number }>
    }>
    overdueFines: Array<{
      borrower: string
      entitas: string
      totalFine: number
      daysOverdue: number
      loans: number
    }>
  }
  recentOverdueLoans: OverdueLoan[]
  allLoans: LoanTableRow[]
  fullLoansData: any[] // Full loan data with all fields for export
  statusOptions: string[]
  needTypeOptions: string[]
  companyOptions: string[]
  dateFilter: {
    startDate?: string | null
    endDate?: string | null
  }
}

const OVERDUE_STATUS_TOKENS = new Set(
  [
    WAREHOUSE_STATUS.BORROWED,
    'Dipinjam',
    'Permintaan Pengembalian',
    CUSTOM_RETURN_STATUS.FOLLOW_UP,
    'Dikembalikan Tidak Lengkap',
    'Pengembalian Ditolak',
    'Return Follow Up'
  ].map(label => label.toLowerCase())
)

const isStatusEligibleForFine = (status?: string | null) => {
  if (!status) return false
  const normalized = status.trim().toLowerCase()
  if (!normalized) return false
  if (OVERDUE_STATUS_TOKENS.has(normalized)) return true
  if (normalized.includes('dipinjam')) return true
  if (normalized.includes('pengembalian') && !normalized.includes('diterima')) return true
  if (normalized.includes('follow') && normalized.includes('up')) return true
  return false
}

function formatInt(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const DAY_IN_MS = 1000 * 60 * 60 * 24

function toStartOfDay(date: Date) {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function monthKey(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${m}`
}

const normalizeStatusText = (value?: string | null) => (value ? String(value).trim().toLowerCase() : '')
const FOLLOW_UP_TOKEN = RETURN_STATUS_TOKENS.FOLLOW_UP.toLowerCase()
const FOLLOW_UP_LABEL = CUSTOM_RETURN_STATUS.FOLLOW_UP.toLowerCase()

const isFollowUpStatus = (status?: string | null) => {
  const normalized = normalizeStatusText(status)
  if (!normalized) return false
  return (
    normalized.includes(FOLLOW_UP_TOKEN) ||
    normalized.includes(FOLLOW_UP_LABEL) ||
    normalized.includes('followup') ||
    normalized.includes('follow-up')
  )
}

const isActiveLoanStatus = (status?: string | null) => {
  const normalized = normalizeStatusText(status)
  if (!normalized) return false
  if (isFollowUpStatus(status)) return true
  return normalized.includes('dipinjam') || normalized.includes('borrowed')
}

const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  const s = normalizeStatusText(status)
  if (isFollowUpStatus(status)) return 'warning'
  if (s.includes('dipinjam')) return 'primary'
  if (s.includes('dikembalikan')) return 'success'
  if (s.includes('ditolak')) return 'error'
  if (s.includes('menunggu') || s.includes('pending')) return 'warning'
  if (s.includes('permintaan')) return 'info'
  return 'default'
}

export default function ReportingAndAnalyticsPage({ 
  kpis, 
  charts, 
  recentOverdueLoans, 
  allLoans,
  fullLoansData,
  statusOptions,
  needTypeOptions,
  companyOptions,
  dateFilter
}: PageProps) {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  const [startDateInput, setStartDateInput] = useState(dateFilter?.startDate || '')
  const [endDateInput, setEndDateInput] = useState(dateFilter?.endDate || '')
  const [dateError, setDateError] = useState<string | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [needTypeFilter, setNeedTypeFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [showFilters, setShowFilters] = useState(!isMobile)

  useEffect(() => {
    setStartDateInput(dateFilter?.startDate || '')
    setEndDateInput(dateFilter?.endDate || '')
  }, [dateFilter?.startDate, dateFilter?.endDate])
  
  // Export menu state
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null)
  const exportMenuOpen = Boolean(exportAnchorEl)

  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Filtered data
  const filteredLoans = useMemo(() => {
    return allLoans.filter(loan => {
      const matchesSearch = !searchQuery || 
        loan.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.entitas.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = !statusFilter || loan.status === statusFilter
      const matchesNeedType = !needTypeFilter || loan.needType === needTypeFilter
      const matchesCompany = !companyFilter || loan.company.includes(companyFilter)

      return matchesSearch && matchesStatus && matchesNeedType && matchesCompany
    })
  }, [allLoans, searchQuery, statusFilter, needTypeFilter, companyFilter])

  const paginatedLoans = useMemo(() => {
    const start = page * rowsPerPage
    return filteredLoans.slice(start, start + rowsPerPage)
  }, [filteredLoans, page, rowsPerPage])

  // Calculate active loans for selected company
  const companyActiveLoans = useMemo(() => {
    if (!companyFilter) return null
    return allLoans.filter(loan => 
      loan.company.includes(companyFilter) && isActiveLoanStatus(loan.status)
    )
  }, [allLoans, companyFilter])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setNeedTypeFilter('')
    setCompanyFilter('')
    setPage(0)
  }

  const formatDateLabel = (value?: string | null) => {
    if (!value) return ''
    try {
      return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch (err) {
      return value
    }
  }

  const handleResetDateFilter = () => {
    setDateError(null)
    setStartDateInput('')
    setEndDateInput('')
    const nextQuery: Record<string, any> = { ...router.query }
    delete nextQuery.startDate
    delete nextQuery.endDate
    router.push({ pathname: router.pathname, query: nextQuery }, undefined, { scroll: false })
  }

  const handleApplyDateFilter = () => {
    if (!startDateInput && !endDateInput) {
      handleResetDateFilter()
      return
    }

    if (startDateInput && endDateInput && startDateInput > endDateInput) {
      setDateError('Tanggal mulai tidak boleh melebihi tanggal akhir.')
      return
    }

    setDateError(null)
    const nextQuery: Record<string, any> = { ...router.query }
    if (startDateInput) {
      nextQuery.startDate = startDateInput
    } else {
      delete nextQuery.startDate
    }
    if (endDateInput) {
      nextQuery.endDate = endDateInput
    } else {
      delete nextQuery.endDate
    }

    router.push({ pathname: router.pathname, query: nextQuery }, undefined, { scroll: false })
  }

  const hasActiveDateFilter = Boolean(dateFilter?.startDate || dateFilter?.endDate)
  const dateRangeDescription = useMemo(() => {
    if (!hasActiveDateFilter) return ''
    const startText = dateFilter?.startDate ? formatDateLabel(dateFilter.startDate) : 'awal data'
    const endText = dateFilter?.endDate ? formatDateLabel(dateFilter.endDate) : 'hari ini'
    return `Menampilkan data dari ${startText} hingga ${endText}`
  }, [dateFilter?.startDate, dateFilter?.endDate, hasActiveDateFilter])
  const disableResetDateFilter = !hasActiveDateFilter && !startDateInput && !endDateInput

  const getKpiIcon = (label: string) => {
    if (label.includes('Overdue') || label.includes('Late')) return <WarningIcon />
    if (label.includes('Dikembalikan')) return <CheckCircleIcon />
    if (label.includes('Dipinjam')) return <TrendingUpIcon />
    return <ScheduleIcon />
  }

  // Export functions
  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget)
  }

  const handleExportMenuClose = () => {
    setExportAnchorEl(null)
  }

  const exportToExcel = (data: LoanTableRow[], filename: string) => {
    // Map filtered table data to full loan records
    const fullData = data.map(tableRow => {
      return fullLoansData.find(loan => loan.id === tableRow.id)
    }).filter(Boolean)
    
    const worksheet = XLSX.utils.json_to_sheet(fullData.map(loan => ({
      'Loan ID': loan.id,
      'Submitted At': loan.submittedAt ? new Date(loan.submittedAt).toISOString() : '',
      'Created At': loan.createdAt ? new Date(loan.createdAt).toISOString() : '',
      'Is Draft': loan.isDraft ? 'Yes' : 'No',
      'Entitas ID': loan.entitasId || '',
      'User ID': loan.userId || '',
      'Borrower Name': loan.borrowerName || '',
      'Borrower Phone': loan.borrowerPhone || '',
      'Borrower Email': loan.borrowerEmail || '',
      'Need Type': loan.needType || '',
      'Need Details': JSON.stringify(loan.needDetails || {}),
      'Company': Array.isArray(loan.company) ? loan.company.join(', ') : loan.company || '',
      'Out Date': loan.outDate ? new Date(loan.outDate).toISOString() : '',
      'Use Date': loan.useDate ? new Date(loan.useDate).toISOString() : '',
      'Return Date': loan.returnDate ? new Date(loan.returnDate).toISOString() : '',
      'Product Details': loan.productDetailsText || '',
      'Pickup Method': loan.pickupMethod || '',
      'Note': loan.note || '',
      'Approval Agreement': loan.approvalAgreementFlag ? 'Yes' : 'No',
      'Loan Status': loan.loanStatus || '',
      'Approvals': JSON.stringify(loan.approvals || {}),
      'Warehouse Status': JSON.stringify(loan.warehouseStatus || {}),
      'Return Status': JSON.stringify(loan.returnStatus || {}),
      'Return Request': JSON.stringify(loan.returnRequest || {}),
      'Extend Status': JSON.stringify(loan.extendStatus || {}),
      'Submit Notifications': JSON.stringify(loan.submitNotifications || {}),
      'Approval Notifications': JSON.stringify(loan.approvalNotifications || {}),
      'Reminder Status': JSON.stringify(loan.reminderStatus || {}),
      'Return Notifications': JSON.stringify(loan.returnNotifications || {}),
      'Extend Notification': JSON.stringify(loan.extendNotification || {}),
      'Updated At': loan.updatedAt ? new Date(loan.updatedAt).toISOString() : '',
    })))
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Loans Data')
    XLSX.writeFile(workbook, filename)
    handleExportMenuClose()
  }

  const exportToCSV = (data: LoanTableRow[], filename: string) => {
    // Map filtered table data to full loan records
    const fullData = data.map(tableRow => {
      return fullLoansData.find(loan => loan.id === tableRow.id)
    }).filter(Boolean)
    
    const csvData = fullData.map(loan => ({
      'Loan ID': loan.id,
      'Submitted At': loan.submittedAt ? new Date(loan.submittedAt).toISOString() : '',
      'Created At': loan.createdAt ? new Date(loan.createdAt).toISOString() : '',
      'Is Draft': loan.isDraft ? 'Yes' : 'No',
      'Entitas ID': loan.entitasId || '',
      'User ID': loan.userId || '',
      'Borrower Name': loan.borrowerName || '',
      'Borrower Phone': loan.borrowerPhone || '',
      'Borrower Email': loan.borrowerEmail || '',
      'Need Type': loan.needType || '',
      'Need Details': JSON.stringify(loan.needDetails || {}),
      'Company': Array.isArray(loan.company) ? loan.company.join(', ') : loan.company || '',
      'Out Date': loan.outDate ? new Date(loan.outDate).toISOString() : '',
      'Use Date': loan.useDate ? new Date(loan.useDate).toISOString() : '',
      'Return Date': loan.returnDate ? new Date(loan.returnDate).toISOString() : '',
      'Product Details': loan.productDetailsText || '',
      'Pickup Method': loan.pickupMethod || '',
      'Note': loan.note || '',
      'Approval Agreement': loan.approvalAgreementFlag ? 'Yes' : 'No',
      'Loan Status': loan.loanStatus || '',
      'Approvals': JSON.stringify(loan.approvals || {}),
      'Warehouse Status': JSON.stringify(loan.warehouseStatus || {}),
      'Return Status': JSON.stringify(loan.returnStatus || {}),
      'Return Request': JSON.stringify(loan.returnRequest || {}),
      'Extend Status': JSON.stringify(loan.extendStatus || {}),
      'Submit Notifications': JSON.stringify(loan.submitNotifications || {}),
      'Approval Notifications': JSON.stringify(loan.approvalNotifications || {}),
      'Reminder Status': JSON.stringify(loan.reminderStatus || {}),
      'Return Notifications': JSON.stringify(loan.returnNotifications || {}),
      'Extend Notification': JSON.stringify(loan.extendNotification || {}),
      'Updated At': loan.updatedAt ? new Date(loan.updatedAt).toISOString() : '',
    }))
    
    const worksheet = XLSX.utils.json_to_sheet(csvData)
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    handleExportMenuClose()
  }

  const handleExport = (type: 'excel' | 'csv', scope: 'all' | 'filtered') => {
    const data = scope === 'all' ? allLoans : filteredLoans
    const timestamp = new Date().toISOString().split('T')[0]
    const scopeLabel = scope === 'all' ? 'All' : 'Filtered'
    
    if (type === 'excel') {
      exportToExcel(data, `Loans_${scopeLabel}_${timestamp}.xlsx`)
    } else {
      exportToCSV(data, `Loans_${scopeLabel}_${timestamp}.csv`)
    }
  }

  return (
    <>
      <Head>
        <title>Reporting & Analytics</title>
        <meta name="description" content="Corporate reporting & analytics dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Box sx={{ py: { xs: 2, md: 4 }, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Header */}
          <Stack spacing={1} sx={{ mb: { xs: 3, md: 4 } }}>
            <Typography 
              variant={isMobile ? 'h5' : 'h4'} 
              fontWeight={700} 
              color="text.primary"
            >
              Report & Analytics Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ringkasan performa peminjaman, status aset, dan analisis tren.
            </Typography>
          </Stack>

          <Card sx={{ mb: { xs: 3, md: 4 }, borderRadius: 3, p: { xs: 2, md: 3 } }}>
            <Stack spacing={0.5} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Tentukan Rentang Tanggal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Seluruh data ditampilkan secara default.
              </Typography>
              {hasActiveDateFilter && dateRangeDescription && (
                <Typography variant="caption" color="text.secondary">
                  {dateRangeDescription}
                </Typography>
              )}
            </Stack>
            <Grid container spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Tanggal Mulai"
                  InputLabelProps={{ shrink: true }}
                  value={startDateInput}
                  onChange={(event) => setStartDateInput(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Tanggal Selesai"
                  InputLabelProps={{ shrink: true }}
                  value={endDateInput}
                  onChange={(event) => setEndDateInput(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Button variant="contained" size="small" onClick={handleApplyDateFilter}>
                    Terapkan
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleResetDateFilter}
                    disabled={disableResetDateFilter}
                  >
                    Reset
                  </Button>
                </Stack>
              </Grid>
            </Grid>
            {dateError && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {dateError}
              </Typography>
            )}
          </Card>

          {/* KPI Cards */}
          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
            {kpis.map((kpi) => (
              <Grid key={kpi.label} size={{ xs: 6, sm: 6, md: 3 }}>
                <Card sx={{ 
                  height: '100%', 
                  borderRadius: { xs: 2, md: 3 }, 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  }
                }}>
                  <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                    <Stack spacing={{ xs: 0.5, md: 1 }}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        fontWeight={600} 
                        textTransform="uppercase" 
                        letterSpacing={0.5}
                        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                      >
                        {kpi.label}
                      </Typography>
                      <Typography 
                        variant={isMobile ? 'h5' : 'h4'} 
                        fontWeight={700} 
                        color={kpi.color || 'text.primary'}
                        sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}
                      >
                        {kpi.value}
                      </Typography>
                      {kpi.helper && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            display: { xs: 'none', sm: 'block' }, 
                            mt: 0.5,
                            fontSize: '0.7rem'
                          }}
                        >
                          {kpi.helper}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Company Filter Info Box */}
          {companyFilter && companyActiveLoans && (
            <Card 
              sx={{ 
                mt: { xs: 2, md: 3 },
                borderRadius: { xs: 2, md: 3 },
                bgcolor: '#e3f2fd',
                borderLeft: '4px solid #1976d2'
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingUpIcon color="primary" />
                    <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600} color="primary">
                      📌 Company: {companyFilter}
                    </Typography>
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Stack>
                        <Typography variant="caption" color="text.secondary">
                          Total Peminjaman
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="primary">
                          {formatInt(allLoans.filter(l => l.company.includes(companyFilter)).length)}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Stack>
                        <Typography variant="caption" color="text.secondary">
                          🔴 Belum Dikembalikan
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="error">
                          {formatInt(companyActiveLoans.length)}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Stack>
                        <Typography variant="caption" color="text.secondary">
                          ✅ Sudah Dikembalikan
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="success.main">
                          {formatInt(allLoans.filter(l => l.company.includes(companyFilter) && l.status === 'Dikembalikan').length)}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Stack>
                        <Typography variant="caption" color="text.secondary">
                          ⚠️ Overdue
                        </Typography>
                        <Typography variant="h5" fontWeight={700} sx={{ color: '#ed6c02' }}>
                          {formatInt(recentOverdueLoans.filter(l => 
                            allLoans.find(loan => loan.id === l.id)?.company.includes(companyFilter)
                          ).length)}
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    💡 <strong>Tip:</strong> Gunakan filter &quot;Status = Dipinjam&quot; atau &quot;Status = Perlu Tindak Lanjut&quot; untuk melihat hanya peminjaman yang belum dikembalikan.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}

          <Divider sx={{ mb: { xs: 3, md: 4 } }} />

          {/* Charts Section - Dynamic Import */}
          <Box sx={{ mb: { xs: 3, md: 4 } }}>
            <ChartsWrapper data={charts} />
          </Box>

          {/* Recent Overdue Table */}
          {recentOverdueLoans.length > 0 && (
            <Box sx={{ mb: { xs: 3, md: 4 } }}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ mb: 2, fontWeight: 600 }}>
                ⚠️ Keterlambatan Pengembalian (Top 10)
              </Typography>
              <TableContainer 
                component={Paper} 
                sx={{ 
                  borderRadius: { xs: 2, md: 3 }, 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  overflowX: 'auto'
                }}
              >
                <Table size={isMobile ? 'small' : 'medium'}>
                  <TableHead sx={{ bgcolor: '#fef2f2' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Peminjam</TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>ID Peminjaman</TableCell>
                      {!isMobile && <TableCell sx={{ fontWeight: 600 }}>Entitas</TableCell>}
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Jadwal Kembali</TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Terlambat</TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Total Denda</TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOverdueLoans.map((loan) => (
                      <TableRow key={loan.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{loan.borrowerName}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 13 }}>{loan.id}</TableCell>
                        {!isMobile && <TableCell>{loan.entitas}</TableCell>}
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(loan.returnDate)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${loan.daysOverdue} hari`} 
                            color="error" 
                            size="small" 
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {formatCurrency(loan.fineAmount)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Button
                            component={Link}
                            href={`/peminjaman/${loan.id}`}
                            size="small"
                            variant="text"
                            color="primary"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Full Data Table with Filters */}
          <Box>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              justifyContent="space-between" 
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
                📊 Semua Data Peminjaman ({formatInt(filteredLoans.length)} dari {formatInt(allLoans.length)})
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportMenuOpen}
                  sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={showFilters ? <ExpandLessIcon /> : <FilterListIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}
                >
                  {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                </Button>
              </Stack>
            </Stack>

            {/* Export Menu */}
            <Menu
              anchorEl={exportAnchorEl}
              open={exportMenuOpen}
              onClose={handleExportMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => handleExport('excel', 'all')}>
                📊 Export All Data to Excel
              </MenuItem>
              <MenuItem onClick={() => handleExport('excel', 'filtered')}>
                📊 Export Filtered Data to Excel
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => handleExport('csv', 'all')}>
                📄 Export All Data to CSV
              </MenuItem>
              <MenuItem onClick={() => handleExport('csv', 'filtered')}>
                📄 Export Filtered Data to CSV
              </MenuItem>
            </Menu>

            {/* Filters */}
            <Collapse in={showFilters}>
              <Card sx={{ mb: 2, borderRadius: 2, p: { xs: 1.5, md: 2 } }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Cari nama, entitas, company, ID..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Status"
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                    >
                      <MenuItem value="">Semua</MenuItem>
                      {statusOptions.map(opt => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Need Type"
                      value={needTypeFilter}
                      onChange={(e) => { setNeedTypeFilter(e.target.value); setPage(0); }}
                    >
                      <MenuItem value="">Semua</MenuItem>
                      {needTypeOptions.map(opt => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Company"
                      value={companyFilter}
                      onChange={(e) => { setCompanyFilter(e.target.value); setPage(0); }}
                    >
                      <MenuItem value="">Semua</MenuItem>
                      {companyOptions.map(opt => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={clearFilters}
                      disabled={!searchQuery && !statusFilter && !needTypeFilter && !companyFilter}
                    >
                      Reset Filter
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            </Collapse>

            {/* Data Table */}
            <TableContainer 
              component={Paper} 
              sx={{ 
                borderRadius: { xs: 2, md: 3 }, 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                overflowX: 'auto'
              }}
            >
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead sx={{ bgcolor: '#f9fafb' }}>
                  <TableRow>
                    {!isMobile && <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>}
                    <TableCell sx={{ fontWeight: 600 }}>Peminjam</TableCell>
                    {!isMobile && <TableCell sx={{ fontWeight: 600 }}>Entitas</TableCell>}
                    <TableCell sx={{ fontWeight: 600 }}>Need Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    {!isTablet && <TableCell sx={{ fontWeight: 600 }}>Tanggal Submit</TableCell>}
                    {!isTablet && <TableCell sx={{ fontWeight: 600 }}>Jadwal Kembali</TableCell>}
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLoans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isMobile ? 4 : isTablet ? 6 : 8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">Tidak ada data yang sesuai filter.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLoans.map((loan) => (
                      <TableRow key={loan.id} hover>
                        {!isMobile && (
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            {loan.id}
                          </TableCell>
                        )}
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{loan.borrowerName}</TableCell>
                        {!isMobile && <TableCell>{loan.entitas}</TableCell>}
                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: isMobile ? '0.75rem' : 'inherit' }}>
                          {loan.needType}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={loan.status} 
                            color={getStatusColor(loan.status)}
                            size="small" 
                            sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                          />
                        </TableCell>
                        {!isTablet && <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(loan.submittedAt)}</TableCell>}
                        {!isTablet && <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(loan.returnDate)}</TableCell>}
                        <TableCell align="right">
                          <Button
                            component={Link}
                            href={`/peminjaman/${loan.id}`}
                            size="small"
                            variant="outlined"
                            sx={{ textTransform: 'none' }}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredLoans.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage={isMobile ? 'Baris:' : 'Baris per halaman:'}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
                sx={{ 
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                    fontSize: isMobile ? '0.75rem' : 'inherit'
                  }
                }}
              />
            </TableContainer>
          </Box>
        </Container>
      </Box>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const session = (await getServerSession(context.req as any, context.res as any, authOptions as any)) as any

  if (!session || !session.user?.id) {
    return {
      redirect: { destination: '/login', permanent: false },
    }
  }

  const role = getCanonicalRole(session.user?.role)
  if (role !== 'admin' && role !== 'superadmin') {
    return {
      redirect: { destination: '/403', permanent: false },
    }
  }

  const startDateParam = typeof context.query.startDate === 'string' ? context.query.startDate : ''
  const endDateParam = typeof context.query.endDate === 'string' ? context.query.endDate : ''

  const parseBoundaryDate = (value: string, boundary: 'start' | 'end'): Date | null => {
    if (!value) return null
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    if (boundary === 'start') {
      parsed.setHours(0, 0, 0, 0)
    } else {
      parsed.setHours(23, 59, 59, 999)
    }
    return parsed
  }

  const rangeStart = parseBoundaryDate(startDateParam, 'start')
  const rangeEnd = parseBoundaryDate(endDateParam, 'end')

  const loans = await prisma.loan.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const statusCounts = new Map<string, number>()
  const needTypeCounts = new Map<string, number>()
  const monthCounts = new Map<string, number>()
  const borrowerCounts = new Map<string, number>()
  const entitasCounts = new Map<string, number>()
  const activeItemMap = new Map<string, {
    label: string
    count: number
    borrowers: Map<string, { borrower: string; entitas: string; count: number }>
  }>()
  const borrowerFineMap = new Map<string, {
    borrower: string
    entitas: string
    totalFine: number
    daysOverdue: number
    loans: number
  }>()
  const fineUpdates: Array<{ id: string; totalDenda: any }> = []

  const itemKeyTokens = ['product', 'produk', 'barang', 'item', 'items', 'aset', 'asset', 'equipment', 'inventory', 'namabarang']
  const splitItemText = (value: string) => {
    return value
      .split(/[\n\r,;•]+/)
      .map(part => part.replace(/^[\-•\d\.)\(\s:]+/, '').trim())
      .filter(Boolean)
  }
  const extractProductItems = (loan: any): string[] => {
    const collected: string[] = []
    const seen = new Set<string>()
    const pushItem = (raw: string) => {
      const cleaned = raw.replace(/\s+/g, ' ').trim()
      if (!cleaned) return
      const normalized = cleaned.toLowerCase()
      if (seen.has(normalized)) return
      seen.add(normalized)
      collected.push(cleaned)
    }
    const pushFromText = (text?: string | null) => {
      if (!text || typeof text !== 'string') return
      splitItemText(text).forEach(pushItem)
    }
    pushFromText(loan.productDetailsText)
    pushFromText((loan as any)?.productDetails)

    const traverseNeedDetails = (node: any, path: string[] = []) => {
      if (!node) return
      if (typeof node === 'string') {
        const matchesToken = path.some(key => itemKeyTokens.some(token => key.includes(token)))
        if (matchesToken) {
          pushFromText(node)
        }
        return
      }
      if (Array.isArray(node)) {
        node.forEach(child => traverseNeedDetails(child, path))
        return
      }
      if (typeof node === 'object') {
        Object.entries(node).forEach(([key, value]) => {
          const normalizedKey = (key || '').toLowerCase()
          traverseNeedDetails(value, [...path, normalizedKey])
        })
      }
    }
    traverseNeedDetails(loan.needDetails || {}, [])
    return collected
  }

  let durationSumDays = 0
  let durationCount = 0
  let overdueCount = 0
  let lateReturnCount = 0

  const now = new Date()
  const recentOverdueLoans: OverdueLoan[] = []
  const allLoans: LoanTableRow[] = []
  const filteredLoansRaw: any[] = []
  const statusSet = new Set<string>()
  const needTypeSet = new Set<string>()
  const companySet = new Set<string>()

  for (const loan of loans as any[]) {
    const referenceDate: Date = loan.submittedAt || loan.createdAt
    const includeLoan = !((rangeStart && referenceDate && referenceDate < rangeStart) || (rangeEnd && referenceDate && referenceDate > rangeEnd))

    const status = String(getOverallStatus(loan) || 'Unknown')
    const ntLabel = getNeedTypeLabel(loan.needType) || 'Unknown'
    const effectiveReturn = getEffectiveReturnDate(loan)
    const returnStatusMeta = ((loan as any)?.returnStatus || {}) as { [key: string]: any }
    const fineDisabled = Boolean(returnStatusMeta?.noFine)
    const finePaused = Boolean(returnStatusMeta?.finePaused)
    const finePauseDate = finePaused && returnStatusMeta?.processedAt ? new Date(returnStatusMeta.processedAt) : null
    const finePauseDay = finePauseDate && !Number.isNaN(finePauseDate.getTime()) ? toStartOfDay(finePauseDate) : null
    const loanStillActive = isLoanActive(loan)

    let overdueMeta: { daysOverdue: number; fineAmount: number } | null = null
    if (
      effectiveReturn &&
      !fineDisabled &&
      (loanStillActive || finePaused) &&
      isStatusEligibleForFine(status)
    ) {
      const endDate = new Date(effectiveReturn)
      const dueDay = toStartOfDay(endDate)
      const todayDay = toStartOfDay(now)
      const referenceDay = finePauseDay && finePauseDay < todayDay ? finePauseDay : todayDay

      if (referenceDay > dueDay) {
        const diffDays = Math.floor((referenceDay.getTime() - dueDay.getTime()) / DAY_IN_MS)
        if (diffDays > 0) {
          const fineAmount = diffDays * 100000
          overdueMeta = { daysOverdue: diffDays, fineAmount }
          const existingTotalDenda = (loan.totalDenda as any) || null
          const newTotalDenda = {
            daysOverdue: diffDays,
            fineAmount,
            updatedAt: now.toISOString()
          }
          if (!existingTotalDenda || existingTotalDenda.daysOverdue !== diffDays || existingTotalDenda.fineAmount !== fineAmount) {
            fineUpdates.push({ id: loan.id, totalDenda: newTotalDenda })
          }
        }
      }
    }

    if (!includeLoan) {
      continue
    }

    const d: Date = referenceDate
    if (d) {
      const mk = monthKey(d)
      monthCounts.set(mk, (monthCounts.get(mk) || 0) + 1)
    }

    statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
    statusSet.add(status)

    needTypeCounts.set(ntLabel, (needTypeCounts.get(ntLabel) || 0) + 1)
    needTypeSet.add(ntLabel)

    const borrowerLabel = loan.borrowerName || 'Unknown'
    borrowerCounts.set(borrowerLabel, (borrowerCounts.get(borrowerLabel) || 0) + 1)

    const entitasLabel = loan.entitasId || 'Unknown'
    entitasCounts.set(entitasLabel, (entitasCounts.get(entitasLabel) || 0) + 1)

    if (isActiveLoanStatus(status)) {
      const borrowerKey = `${borrowerLabel}|||${loan.entitasId || '-'}`
      const items = extractProductItems(loan)
      if (items.length === 0) {
        items.push('Barang Tidak Tertulis')
      }
      items.forEach(itemName => {
        const normalizedItem = itemName.toLowerCase()
        if (!activeItemMap.has(normalizedItem)) {
          activeItemMap.set(normalizedItem, {
            label: itemName,
            count: 0,
            borrowers: new Map()
          })
        }
        const record = activeItemMap.get(normalizedItem)!
        record.label = record.label || itemName
        record.count += 1
        if (!record.borrowers.has(borrowerKey)) {
          record.borrowers.set(borrowerKey, { borrower: borrowerLabel, entitas: loan.entitasId || '-', count: 0 })
        }
        const borrowerRecord = record.borrowers.get(borrowerKey)!
        borrowerRecord.count += 1
      })
    }

    const start = loan.useDate || loan.outDate
    const duration = getDurationInfo(start ? new Date(start).toISOString() : null, effectiveReturn ? String(effectiveReturn) : null)
    if (duration?.days && Number.isFinite(duration.days)) {
      durationSumDays += duration.days
      durationCount += 1
    }

    const companyStr = Array.isArray(loan.company) ? loan.company.join(', ') : (loan.company || '-')
    if (Array.isArray(loan.company)) {
      loan.company.forEach((c: string) => companySet.add(c))
    } else if (loan.company) {
      companySet.add(loan.company)
    }

    allLoans.push({
      id: loan.id,
      borrowerName: borrowerLabel,
      entitas: loan.entitasId || '-',
      needType: ntLabel,
      status,
      submittedAt: loan.submittedAt ? new Date(loan.submittedAt).toISOString() : (loan.createdAt ? new Date(loan.createdAt).toISOString() : '-'),
      returnDate: effectiveReturn ? String(effectiveReturn) : '-',
      company: companyStr
    })

    filteredLoansRaw.push(loan)

    if (overdueMeta && effectiveReturn) {
      overdueCount++
      const borrowerKey = `${borrowerLabel}|||${loan.entitasId || '-'}`
      if (!borrowerFineMap.has(borrowerKey)) {
        borrowerFineMap.set(borrowerKey, {
          borrower: borrowerLabel,
          entitas: loan.entitasId || '-',
          totalFine: 0,
          daysOverdue: 0,
          loans: 0
        })
      }
      const fineInfo = borrowerFineMap.get(borrowerKey)!
      fineInfo.totalFine += overdueMeta.fineAmount
      fineInfo.daysOverdue += overdueMeta.daysOverdue
      fineInfo.loans += 1

      recentOverdueLoans.push({
        id: loan.id,
        borrowerName: borrowerLabel,
        entitas: loan.entitasId || '-',
        returnDate: String(effectiveReturn),
        daysOverdue: overdueMeta.daysOverdue,
        fineAmount: overdueMeta.fineAmount
      })
    }

    if (status === 'Dikembalikan' && loan.returnStatus?.processedAt && effectiveReturn) {
      const processed = new Date(loan.returnStatus.processedAt)
      const scheduled = new Date(effectiveReturn)
      const pDate = new Date(processed.getFullYear(), processed.getMonth(), processed.getDate())
      const sDate = new Date(scheduled.getFullYear(), scheduled.getMonth(), scheduled.getDate())
      if (pDate > sDate) {
        lateReturnCount++
      }
    }
  }

  const totalLoans = filteredLoansRaw.length
  const avgDuration = durationCount > 0 ? durationSumDays / durationCount : 0

  const getCount = (key: string) => statusCounts.get(key) || 0
  const activeLoanCount = getCount('Dipinjam') + getCount(CUSTOM_RETURN_STATUS.FOLLOW_UP)

  const kpis: Kpi[] = [
    { label: 'Total Loans', value: formatInt(totalLoans) },
    { label: 'Aktif (Dipinjam + Follow-up)', value: formatInt(activeLoanCount), color: '#1976d2' },
    { label: 'Overdue', value: formatInt(overdueCount), color: '#d32f2f', helper: 'Melewati batas' },
    { label: 'Dikembalikan', value: formatInt(getCount('Dikembalikan')), color: '#2e7d32' },
    { label: 'Late Returns', value: formatInt(lateReturnCount), color: '#ed6c02', helper: 'Terlambat kembali' },
    { label: 'Menunggu Approval', value: formatInt(getCount('Menunggu Approval')) },
    { label: 'Req. Kembali', value: formatInt(getCount('Permintaan Pengembalian')) },
    { label: 'Avg. Durasi', value: `${avgDuration ? formatInt(Math.round(avgDuration)) : '0'} Hari` },
  ]

  const loansByMonth = Array.from(monthCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({ month, total }))

  const loansByStatus = Array.from(statusCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([status, value]) => ({ status, value }))

  const loansByNeedType = Array.from(needTypeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([needType, value]) => ({ needType, value }))

  const topBorrowers = Array.from(borrowerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  const entitasEntries = Array.from(entitasCounts.entries())
    .sort((a, b) => b[1] - a[1])

  const loansByEntitas = entitasEntries
    .map(([entitas, value]) => ({ entitas, value }))

  const topEntitas = entitasEntries
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  const activeItemsData = Array.from(activeItemMap.values())
    .map(({ label, count, borrowers }) => {
      const borrowerList = Array.from((borrowers || new Map()).values()).sort((a, b) => b.count - a.count)
      const topEntry = borrowerList[0] || { borrower: '-', entitas: '-', count: 0 }
      return {
        item: label,
        value: count,
        topBorrower: topEntry.borrower,
        topEntitas: topEntry.entitas,
        borrowers: borrowerList
      }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const overdueFinesData = Array.from(borrowerFineMap.values())
    .sort((a, b) => b.totalFine - a.totalFine)
    .slice(0, 6)

  // Sort overdue loans by days overdue (desc) and take top 10
  const sortedOverdue = recentOverdueLoans.sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, 10)

  // Serialize full loans data for export (convert dates to ISO strings)
  const fullLoansDataSerialized = filteredLoansRaw.map((loan: any) => ({
    ...loan,
    submittedAt: loan.submittedAt ? loan.submittedAt.toISOString() : null,
    createdAt: loan.createdAt ? loan.createdAt.toISOString() : null,
    outDate: loan.outDate ? loan.outDate.toISOString() : null,
    useDate: loan.useDate ? loan.useDate.toISOString() : null,
    returnDate: loan.returnDate ? loan.returnDate.toISOString() : null,
    updatedAt: loan.updatedAt ? loan.updatedAt.toISOString() : null,
  }))

  if (fineUpdates.length > 0) {
    try {
      await prisma.$transaction(
        fineUpdates.map(entry =>
          prisma.loan.update({
            where: { id: entry.id },
            data: { totalDenda: entry.totalDenda } as any
          })
        )
      )
    } catch (err) {
      console.warn('Failed to update totalDenda for overdue loans', err)
    }
  }

  return {
    props: {
      kpis,
      charts: {
        loansByMonth,
        loansByStatus,
        loansByNeedType,
        loansByEntitas,
        topBorrowers,
        topEntitas,
        activeItems: activeItemsData,
        overdueFines: overdueFinesData
      },
      recentOverdueLoans: sortedOverdue,
      allLoans,
      fullLoansData: fullLoansDataSerialized,
      statusOptions: Array.from(statusSet).sort(),
      needTypeOptions: Array.from(needTypeSet).sort(),
      companyOptions: Array.from(companySet).sort(),
      dateFilter: {
        startDate: rangeStart ? startDateParam : null,
        endDate: rangeEnd ? endDateParam : null
      }
    },
  }
}
