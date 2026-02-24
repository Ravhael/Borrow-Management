import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getNeedTypeLabel } from '../utils/needTypes'
import { CUSTOM_RETURN_STATUS, LOAN_LIFECYCLE, WAREHOUSE_STATUS } from '../types/loanStatus'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  InputAdornment,
  Container,
  Alert,
  Breadcrumbs,
  Divider,
  Avatar,
  Grid,
  Fade,
  Zoom,
  LinearProgress,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  DialogContentText,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  GetApp as ExportIcon,
  FilterList as FilterIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Assessment as AssessmentIcon,
  HourglassEmpty as HourglassIcon,
  Today as TodayIcon,
} from '@mui/icons-material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { getCanonicalRole } from '../config/roleConfig'
import approvalsTheme from '../themes/approvalsTheme'
import {
  LoadingSkeleton,
  HeaderSection,
  SearchControlsSection,
  ResultsSummary,
  DataTableSection,
  BulkActionsPanel,
  ApproveDialog,
  RejectDialog,
} from '../components/approvals'
import { apiFetch } from '../utils/basePath'

interface LoanData {
  id: string
  submittedAt: string
  borrowerName: string
  entitasId: string
  borrowerPhone: string
  needType: string
  company: string[]
  outDate: string
  useDate: string
  returnDate: string
  productDetailsText: string
  pickupMethod: string
  note: string
  approvalAgreementFlag: boolean
  isDraft: boolean
  lainnya?: string
  loanStatus?: string
  approvals?: {
    companies: Record<string, {
      approved: boolean;
      approvedBy?: string;
      approvedAt?: string;
      rejectionReason?: string;
    }>;
  }
  submitNotifications?: {
    companies: Record<string, Record<string, {
      sent: boolean;
      sentAt?: string;
      email: string;
    }>>;
  };
  approvalNotifications?: {
    entitas: Record<string, Record<string, {
      sent: boolean;
      sentAt?: string;
      email: string;
    }>>;
    companies: Record<string, Record<string, {
      sent: boolean;
      sentAt?: string;
      email: string;
    }>>;
  };
  warehouseStatus?: {
    status: string;
    processedAt?: string;
    processedBy?: string;
    rejectionReason?: string;
    returnedAt?: string;
    returnedBy?: string;
  };
  userId?: string
}

const getLoanStatus = (loan: LoanData) => {
  // If the DB has an explicit loanStatus column, prefer it (map canonical values to UI labels)
  if (loan.loanStatus && typeof loan.loanStatus === 'string') {
    const s = loan.loanStatus.trim().toUpperCase()
    switch (s) {
      case 'PENDING':
      case 'PENDING_APPROVAL':
      case 'MENUNGGU_APPROVAL':
      case 'MENUNGGU':
        return LOAN_LIFECYCLE.PENDING_APPROVAL
      case 'DRAFT':
        return LOAN_LIFECYCLE.DRAFT
      case 'APPROVED':
        return LOAN_LIFECYCLE.APPROVED
      case 'REJECTED':
      case 'DITOLAK':
        return LOAN_LIFECYCLE.REJECTED
      case 'RETURN_FOLLOWUP':
      case 'RETURN FOLLOWUP':
      case 'RETURN-FOLLOWUP':
      case 'PERLU TINDAK LANJUT':
        return CUSTOM_RETURN_STATUS.FOLLOW_UP
      default:
        // fallthrough to derived logic if unknown value
        break
    }
  }

  // If warehouse has processed the loan, use warehouse status
  if (loan.warehouseStatus) {
    return loan.warehouseStatus.status
  }

  if (loan.isDraft) return LOAN_LIFECYCLE.DRAFT

  if (!loan.approvals?.companies) return LOAN_LIFECYCLE.PENDING_APPROVAL
  
  const companies = Object.keys(loan.approvals.companies)
  if (companies.length === 0) return LOAN_LIFECYCLE.PENDING_APPROVAL
  
  const allApproved = companies.every(company => loan.approvals!.companies[company].approved === true)
  const anyRejected = companies.some(company => loan.approvals!.companies[company].approved === false && loan.approvals!.companies[company].rejectionReason)
  
  if (anyRejected) return LOAN_LIFECYCLE.REJECTED
  if (allApproved) return LOAN_LIFECYCLE.APPROVED
  return LOAN_LIFECYCLE.PENDING_APPROVAL
}

const getStatusColor = (loan: LoanData): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  const status = getLoanStatus(loan)
  switch (status) {
    case LOAN_LIFECYCLE.DRAFT: return 'default'
    case LOAN_LIFECYCLE.APPROVED: return 'success'
    case LOAN_LIFECYCLE.REJECTED: return 'error'
    case WAREHOUSE_STATUS.BORROWED: return 'info'
    case WAREHOUSE_STATUS.RETURNED: return 'primary'
    default: return 'warning'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case LOAN_LIFECYCLE.DRAFT: return <EditIcon />
    case LOAN_LIFECYCLE.APPROVED: return <CheckCircleIcon />
    case LOAN_LIFECYCLE.REJECTED: return <CancelIcon />
    case WAREHOUSE_STATUS.BORROWED: return <InventoryIcon />
    case WAREHOUSE_STATUS.RETURNED: return <AssignmentIcon />
    default: return <PendingIcon />
  }
}

function ApprovalsPageContent() {
  const [loans, setLoans] = useState<LoanData[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const currentUserRole = getCanonicalRole((session as any)?.user?.role)
  const currentUserId = (session as any)?.user?.id
  const [ownedCompanies, setOwnedCompanies] = useState<string[]>([])
  const [selectedLoans, setSelectedLoans] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filterNeedType, setFilterNeedType] = useState<string>('all')
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; loan: LoanData | null }>({ open: false, loan: null })
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; loan: LoanData | null; reason: string; note?: string }>({ open: false, loan: null, reason: '', note: '' })

  useEffect(() => {
    fetchLoans()
    // also fetch companies the current user owns (api enforces marketing-only visibility)
    const fetchOwned = async () => {
      try {
        const r = await apiFetch('/api/company')
        if (r.ok) {
          const data = await r.json()
          // data is list of companies; store their 'value' strings
          setOwnedCompanies(Array.isArray(data) ? data.map((c: any) => c.value) : [])
        }
      } catch (err) {
        console.warn('Unable to fetch owned companies', err)
      }
    }
    fetchOwned()
  }, [])

  const fetchLoans = async () => {
    try {
      const response = await apiFetch('/api/loans')
      if (response.ok) {
        const data = await response.json()
        // Filter to show only loans that are still waiting for approval
        const approvalLoans = data.filter((loan: LoanData) => {
          return getLoanStatus(loan) === LOAN_LIFECYCLE.PENDING_APPROVAL
        })
        setLoans(approvalLoans)
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter loans based on search term and filters
  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.entitasId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getNeedTypeLabel(loan.needType).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(loan.company) ? loan.company.join(', ') : loan.company).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesNeedType = filterNeedType === 'all' || loan.needType === filterNeedType

    return matchesSearch && matchesNeedType
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLoans = filteredLoans.slice(startIndex, startIndex + itemsPerPage)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterNeedType])

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLoans(paginatedLoans.map(loan => loan.id))
    } else {
      setSelectedLoans([])
    }
  }

  const handleSelectLoan = (loanId: string, checked: boolean) => {
    if (checked) {
      setSelectedLoans(prev => [...prev, loanId])
    } else {
      setSelectedLoans(prev => prev.filter(id => id !== loanId))
    }
  }

  const handleApprove = async (loanId: string, note?: string) => {
    try {
      const response = await apiFetch(`/api/loans/${loanId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true, note })
      })

      if (response.ok) {
        toast.success('Peminjaman berhasil disetujui')
        setApproveDialog({ open: false, loan: null })
        fetchLoans() // Refresh the list
      } else {
        toast.error('Gagal menyetujui peminjaman')
      }
    } catch (error) {
      console.error('Error approving loan:', error)
      toast.error('Terjadi kesalahan saat menyetujui peminjaman')
    }
  }

  const handleReject = async (loanId: string, reason: string, note?: string) => {
    if (!reason.trim()) {
      toast.error('Alasan penolakan harus diisi')
      return
    }

    try {
      const response = await apiFetch(`/api/loans/${loanId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false, reason, note })
      })

      if (response.ok) {
        toast.success('Peminjaman berhasil ditolak')
        setRejectDialog({ open: false, loan: null, reason: '' })
        fetchLoans() // Refresh the list
      } else {
        toast.error('Gagal menolak peminjaman')
      }
    } catch (error) {
      console.error('Error rejecting loan:', error)
      toast.error('Terjadi kesalahan saat menolak peminjaman')
    }
  }

  const handleBulkApprove = async () => {
    if (selectedLoans.length === 0) {
      toast.error('Pilih setidaknya satu peminjaman untuk disetujui')
      return
    }

    if (!confirm(`Apakah Anda yakin ingin menyetujui ${selectedLoans.length} peminjaman yang dipilih?`)) {
      return
    }

    try {
      const promises = selectedLoans.map(loanId =>
        apiFetch(`/api/loans/${loanId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved: true })
        })
      )

      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.ok).length

      if (successCount === selectedLoans.length) {
        toast.success(`Berhasil menyetujui ${successCount} peminjaman`)
      } else {
        toast.success(`Berhasil menyetujui ${successCount} dari ${selectedLoans.length} peminjaman`)
      }

      setSelectedLoans([])
      fetchLoans()
    } catch (error) {
      console.error('Error bulk approving loans:', error)
      toast.error('Terjadi kesalahan saat menyetujui peminjaman')
    }
  }

  const handleBulkReject = async () => {
    if (selectedLoans.length === 0) {
      toast.error('Pilih setidaknya satu peminjaman untuk ditolak')
      return
    }

    const reason = prompt('Masukkan alasan penolakan untuk semua peminjaman yang dipilih:')
    if (!reason) return

    try {
      const promises = selectedLoans.map(loanId =>
        apiFetch(`/api/loans/${loanId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved: false, reason })
        })
      )

      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.ok).length

      if (successCount === selectedLoans.length) {
        toast.success(`Berhasil menolak ${successCount} peminjaman`)
      } else {
        toast.success(`Berhasil menolak ${successCount} dari ${selectedLoans.length} peminjaman`)
      }

      setSelectedLoans([])
      fetchLoans()
    } catch (error) {
      console.error('Error bulk rejecting loans:', error)
      toast.error('Terjadi kesalahan saat menolak peminjaman')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedLoans([]) // Clear selections when changing pages
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    setSelectedLoans([])
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Use centralized helper from utils

  const getApprovalStatus = (loan: LoanData) => {
    if (!loan.approvals?.companies) return LOAN_LIFECYCLE.PENDING_APPROVAL

    const companies = Object.keys(loan.approvals.companies)
    if (companies.length === 0) return LOAN_LIFECYCLE.PENDING_APPROVAL

    const allApproved = companies.every(company => loan.approvals!.companies[company].approved === true)
    const anyRejected = companies.some(company => loan.approvals!.companies[company].approved === false && loan.approvals!.companies[company].rejectionReason)

    if (anyRejected) return LOAN_LIFECYCLE.REJECTED
    if (allApproved) return 'Disetujui Marketing'

    // If not all approved and no rejections, then it's waiting for approval
    return LOAN_LIFECYCLE.PENDING_APPROVAL
  }

  // Calculate metrics
  const metrics = {
    total: loans.length,
    todaySubmissions: loans.filter(loan => {
      const today = new Date().toDateString()
      return new Date(loan.submittedAt).toDateString() === today
    }).length,
    urgent: loans.filter(loan => {
      if (!loan.useDate) return false
      const useDate = new Date(loan.useDate)
      const today = new Date()
      const diffTime = useDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 3 && diffDays >= 0
    }).length,
  }

  if (loading) {
    return (
      <ThemeProvider theme={approvalsTheme}>
        <LoadingSkeleton />
      </ThemeProvider>
    )
  }

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>

      <HeaderSection
        metrics={metrics}
        onRefresh={fetchLoans}
      />

      {/* Centered page content */}
      <Box sx={{ maxWidth: 1350, mx: 'auto', py: 6, px: { xs: 2, md: 4 } }}>
        <Stack spacing={4}>

        {loans.length === 0 ? (
          <Fade in={true} timeout={1200}>
            <Card elevation={0} sx={{ border: '2px dashed rgba(0,0,0,0.1)', bgcolor: 'rgba(0,0,0,0.02)' }}>
              <CardContent>
                <Stack spacing={3} alignItems="center" py={8}>
                  <Avatar sx={{ bgcolor: 'rgba(26, 54, 93, 0.1)', width: 80, height: 80 }}>
                    <CheckCircleIcon sx={{ fontSize: '2.5rem', color: 'primary.main' }} />
                  </Avatar>
                  <Box textAlign="center">
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                      Semua peminjaman telah diproses
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Tidak ada peminjaman yang menunggu persetujuan saat ini.<br />
                      Semua permintaan telah disetujui atau ditolak.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        ) : (
          <>
            {/* Search and Controls */}
            <SearchControlsSection
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
            />

            {/* Results Summary */}
            <ResultsSummary
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              filteredLoansLength={filteredLoans.length}
              searchTerm={searchTerm}
              filterNeedType={filterNeedType}
            />

            {/* Data Table */}
            <DataTableSection
              paginatedLoans={paginatedLoans}
              selectedLoans={selectedLoans}
              startIndex={startIndex}
              searchTerm={searchTerm}
              totalPages={totalPages}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onSelectAll={handleSelectAll}
              onSelectLoan={handleSelectLoan}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              onViewDetail={(loanId) => {}}
              onApprove={(loan) => setApproveDialog({ open: true, loan })}
              onReject={(loan) => setRejectDialog({ open: true, loan, reason: '', note: '' })}
              currentUserRole={currentUserRole}
              currentUserCompanies={ownedCompanies}
              getStatusColor={getStatusColor}
              getNeedTypeLabel={getNeedTypeLabel}
              getApprovalStatus={getApprovalStatus}
              formatDate={formatDate}
            />
          </>
        )}

        {/* Bulk Actions */}
        {selectedLoans.length > 0 && currentUserRole !== 'marketing' && (
          <BulkActionsPanel
            selectedCount={selectedLoans.length}
            onBulkApprove={handleBulkApprove}
            onBulkReject={handleBulkReject}
          />
        )}
        {/* Approve Dialog */}
        <ApproveDialog
          open={approveDialog.open}
          loan={approveDialog.loan}
          onClose={() => setApproveDialog({ open: false, loan: null })}
          onApprove={handleApprove}
          getNeedTypeLabel={getNeedTypeLabel}
          formatDate={formatDate}
          currentUserRole={currentUserRole}
          currentUserCompanies={ownedCompanies}
        />

        {/* Reject Dialog */}
        <RejectDialog
          open={rejectDialog.open}
          loan={rejectDialog.loan}
          reason={rejectDialog.reason}
          note={rejectDialog.note}
          onClose={() => setRejectDialog({ open: false, loan: null, reason: '', note: '' })}
          onReject={handleReject}
          onReasonChange={(reason) => setRejectDialog(prev => ({ ...prev, reason }))}
          onNoteChange={(note) => setRejectDialog(prev => ({ ...prev, note }))}
          getNeedTypeLabel={getNeedTypeLabel}
          currentUserRole={currentUserRole}
          currentUserCompanies={ownedCompanies}
        />
        </Stack>

      </Box>

    </Box>
  )
}

export default function Approvals() {
  return (
    <ThemeProvider theme={approvalsTheme}>
      <ApprovalsPageContent />
    </ThemeProvider>
  )
}