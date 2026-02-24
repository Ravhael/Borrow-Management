import React, { useState, useEffect } from 'react'
import { getNeedTypeLabel } from '../../utils/needTypes'
import { getPickupMethodLabel } from '../../utils/pickupMethods'
import { LOAN_LIFECYCLE, WAREHOUSE_STATUS } from '../../types/loanStatus'
import { getLoanStatus as getLibLoanStatus, getDurationInfo, getEffectiveReturnDate } from '../../utils/loanHelpers'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Button,
  // Table components removed — using cards instead
  TablePagination,
  Avatar,
  Paper,
  Fade,
  Zoom,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  // Menu removed for per-card actions
  MenuItem,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
  Divider
} from '@mui/material'
import { loginTheme } from '../../themes/loginTheme'
import {
  Search as SearchIcon,
  Inventory as WarehouseIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  TrendingUp as TrendingIcon,
  // More icon removed - actions displayed as bottom buttons
  CheckCircle as ProcessIcon,
  Cancel as RejectIcon,
  Replay as ReturnIcon,
  Visibility as ViewIcon,
  DateRange as DateIcon,
  ArrowBack as ArrowBackIcon,
  AssignmentReturn as AssignmentReturnIcon,
  LocalShipping as LocalShippingIcon,
  Pending as PendingIconAlt
} from '@mui/icons-material'
import RejectDialog from '../../components/approvals/RejectDialog'
import ProcessDialog from '../../components/loan-detail/ProcessDialog'
import toast from 'react-hot-toast'

// Corporate Theme Configuration
const corporateTheme = createTheme({
  palette: {
    primary: {
      main: '#1a365d', // Professional dark blue
      light: '#2d3748',
      dark: '#0f1419',
    },
    secondary: {
      main: '#00d4aa', // Corporate teal
      light: '#38e4c8',
      dark: '#00b894',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#f44336',
      dark: '#c62828',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h2: {
      fontWeight: 800,
      fontSize: '3.5rem',
    },
    h4: {
      fontWeight: 700,
      fontSize: '2.125rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
          fontSize: '0.875rem',
          boxShadow: 'none',
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: '0 4px 14px rgba(26, 54, 93, 0.25)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(26, 54, 93, 0.3)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            boxShadow: '0 4px 14px rgba(26, 54, 93, 0.15)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          height: 28,
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
          color: 'white',
        },
        colorSuccess: {
          background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
          color: 'white',
        },
        colorError: {
          background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
          color: 'white',
        },
        colorWarning: {
          background: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)',
          color: 'white',
        },
        colorInfo: {
          background: 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)',
          color: 'white',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
            '&.Mui-focused': {
              backgroundColor: 'white',
              boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.1)',
            },
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            background: 'white',
            color: '#374151',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderBottom: '2px solid #e5e7eb',
            py: 2,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(26, 54, 93, 0.04)',
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
          transition: 'all 0.2s ease',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.08)',
    '0px 6px 12px rgba(0,0,0,0.12)',
    '0px 8px 16px rgba(0,0,0,0.15)',
    '0px 10px 20px rgba(0,0,0,0.18)',
    '0px 12px 24px rgba(0,0,0,0.2)',
    '0px 14px 28px rgba(0,0,0,0.22)',
    '0px 16px 32px rgba(0,0,0,0.24)',
    '0px 18px 36px rgba(0,0,0,0.26)',
    '0px 20px 40px rgba(0,0,0,0.28)',
    '0px 22px 44px rgba(0,0,0,0.3)',
    '0px 24px 48px rgba(0,0,0,0.32)',
    '0px 26px 52px rgba(0,0,0,0.34)',
    '0px 28px 56px rgba(0,0,0,0.36)',
    '0px 30px 60px rgba(0,0,0,0.38)',
    '0px 32px 64px rgba(0,0,0,0.4)',
    '0px 34px 68px rgba(0,0,0,0.42)',
    '0px 36px 72px rgba(0,0,0,0.44)',
    '0px 38px 76px rgba(0,0,0,0.46)',
    '0px 40px 80px rgba(0,0,0,0.48)',
    '0px 42px 84px rgba(0,0,0,0.5)',
    '0px 44px 88px rgba(0,0,0,0.52)',
    '0px 46px 92px rgba(0,0,0,0.54)',
    '0px 48px 96px rgba(0,0,0,0.56)',
  ],
})

interface LoanData {
  id: string
  submittedAt: string
  borrowerName: string
  entitasId: string
  borrowerPhone: string
  borrowerEmail?: string
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
  returnRequest?: Array<{
    id: string;
    status?: string;
  }>;
  userId?: string
}

const GudangDashboard: React.FC = () => {
  const router = useRouter()
  const [loans, setLoans] = useState<LoanData[]>([])
  // Keep full server results around for metrics (we'll show a filtered view in `loans`)
  const [allLoans, setAllLoans] = useState<LoanData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedLoans, setSelectedLoans] = useState<string[]>([])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  // Dialog states for confirm flows
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; loan: LoanData | null; reason: string; note?: string }>({ open: false, loan: null, reason: '', note: '' })
  const [returnDialog, setReturnDialog] = useState<{ open: boolean; loan: LoanData | null }>({ open: false, loan: null })
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [selectedProcessLoanId, setSelectedProcessLoanId] = useState<string | null>(null)
  // menu state removed - per-card text buttons are used instead

  // Helper functions
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // centralized getNeedTypeLabel used from utils

  const getMarketingStatus = (loan: LoanData) => {
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

  const getLoanStatus = (loan: LoanData) => {
    // If warehouse has processed the loan, use warehouse status
    if (loan.warehouseStatus) {
      return loan.warehouseStatus.status
    }

    return getMarketingStatus(loan)
  }

  const getStatusClass = (loan: LoanData) => {
    const status = getLoanStatus(loan)
    switch (status) {
      case LOAN_LIFECYCLE.DRAFT: return 'status-draft'
      case LOAN_LIFECYCLE.APPROVED: return 'status-approved'
      case LOAN_LIFECYCLE.REJECTED: return 'status-rejected'
      case WAREHOUSE_STATUS.BORROWED: return 'status-borrowed'
      case WAREHOUSE_STATUS.RETURNED: return 'status-returned'
      default: return 'status-pending'
    }
  }

  const getStatusColor = (loan: LoanData) => {
    // Use shared helper so explicit loan.loanStatus DB field is respected here too
    const status = getLibLoanStatus(loan as any)
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      [LOAN_LIFECYCLE.DRAFT]: 'default',
      [LOAN_LIFECYCLE.APPROVED]: 'success',
      [LOAN_LIFECYCLE.REJECTED]: 'error',
      [WAREHOUSE_STATUS.BORROWED]: 'info',
      [WAREHOUSE_STATUS.RETURNED]: 'success',
      [WAREHOUSE_STATUS.PENDING]: 'warning',
      [LOAN_LIFECYCLE.PENDING_APPROVAL]: 'warning'
    }
    return colors[status] || 'default'
  }

  // palettes and chip helpers (copied from approvals layout)
  const needTypePalette = [
    { bg: '#E3F2FD', color: '#0D47A1' },
    { bg: '#FCE4EC', color: '#AD1457' },
    { bg: '#E8F5E9', color: '#1B5E20' },
    { bg: '#FFF3E0', color: '#E65100' },
    { bg: '#EDE7F6', color: '#4527A0' },
    { bg: '#F3E5F5', color: '#6A1B9A' },
  ]

  const companyPalette = [
    { bg: '#E0F2F1', color: '#00695C', border: '#26A69A' },
    { bg: '#FFF9C4', color: '#F9A825', border: '#FDD835' },
    { bg: '#E1F5FE', color: '#0277BD', border: '#29B6F6' },
    { bg: '#FBE9E7', color: '#D84315', border: '#FFAB91' },
    { bg: '#F1F8E9', color: '#33691E', border: '#9CCC65' },
    { bg: '#E8EAF6', color: '#283593', border: '#9FA8DA' },
  ]

  const getPaletteIndex = (value: string, length: number) => {
    let hash = 0
    for (let i = 0; i < value.length; i += 1) {
      hash = value.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % length
  }

  const getNeedTypeChipStyle = (value: string) => {
    const palette = needTypePalette[getPaletteIndex(value, needTypePalette.length)]
    return { bgcolor: palette.bg, color: palette.color }
  }

  const getCompanyChipStyle = (value: string) => {
    const palette = companyPalette[getPaletteIndex(value, companyPalette.length)]
    return { bgcolor: palette.bg, color: palette.color, borderColor: palette.border }
  }

  // Use centralized helpers for duration calculation; prefer approved extension for effective return date

  const getEntityColor = (entitasId: string) => {
    const colors: { [key: string]: string } = {
      'SGM': '#1a365d',    // Dark blue
      'PKU': '#2e7d32',    // Dark green
      'SGP': '#ed6c02',    // Dark orange
      'IDC': '#0288d1',    // Dark blue
      'BDG': '#7b1fa2',    // Dark purple
      'SMG': '#c62828',    // Dark red
      'SGJ': '#1565c0',    // Dark blue
      'SBY': '#2e7d32',    // Dark green
      'BALI': '#f57c00',   // Dark orange
      'ENT': '#6a1b9a',    // Dark purple
      'DEC': '#d32f2f',    // Dark red
      'HAVS': '#1976d2',   // Dark blue
      'SKP': '#388e3c',    // Dark green
      'VIS': '#f4511e',    // Dark orange
      'OSS': '#7b1fa2',    // Dark purple
      'ISS': '#c62828',    // Dark red
      'HRD': '#1565c0',    // Dark blue
      'IVP': '#2e7d32',    // Dark green
      'MLDS': '#ed6c02',   // Dark orange
      'UMP': '#6a1b9a',    // Dark purple
      'Marcomm': '#d32f2f', // Dark red
      'Micro PDN': '#1976d2' // Dark blue
    }
    return colors[entitasId] || '#616161' // Default gray
  }

  // Determine which warehouse actions are available for a loan
  const getWarehouseActions = (loan: LoanData): string[] => {
    const status = getLibLoanStatus(loan as any)
    const wsRaw = loan.warehouseStatus?.status ? String(loan.warehouseStatus.status).toLowerCase() : ''
    // If the loan is already returned (explicit loanStatus or top-level returnStatus), do not offer any warehouse actions
    if (status === WAREHOUSE_STATUS.RETURNED || (loan as any).returnStatus?.status === WAREHOUSE_STATUS.RETURNED) {
      return []
    }
    const isWarehousePending = !wsRaw || wsRaw.includes('menunggu') || wsRaw.includes('pending')

    if (status === LOAN_LIFECYCLE.APPROVED && isWarehousePending) {
      return ['process', 'reject']
    }

    if ((loan.warehouseStatus?.status === WAREHOUSE_STATUS.BORROWED) && status !== WAREHOUSE_STATUS.RETURNED) {
      return ['return']
    }

    return []
  }

  const hasActiveReturnRequest = (loan: LoanData) => {
    const requests = (loan as any).returnRequest
    if (!Array.isArray(requests)) return false
    return requests.some((req: any) => {
      const normalized = String(req?.status ?? '').toLowerCase()
      if (!normalized) return true
      // consider both submitted (legacy) and returnRequested (new) as active requests
      return ['submitted', 'returnrequested', 'pending', 'approved'].includes(normalized)
    })
  }

  // Fetch loans data
  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans?view=warehouse&take=200')
      if (response.ok) {
        const data = await response.json()
        // Keep full server data for metrics and diagnostics
        setAllLoans(data)

        // Filter to show only loans that require warehouse attention — exclude already-returned loans entirely
        // Use shared helper so explicit DB loanStatus is respected (e.g. 'Approved')
        const warehouseLoans = data.filter((loan: LoanData) => {
          const canonical = getLibLoanStatus(loan as any)

          // Exclude loans that are already returned
          if (canonical === WAREHOUSE_STATUS.RETURNED) return false
          if ((loan as any).returnStatus && (loan as any).returnStatus.status === WAREHOUSE_STATUS.RETURNED) return false


          // Some rows may not have loan.loanStatus set but have a warehouseStatus string or a top-level returnStatus
          const ws = loan.warehouseStatus?.status ? String(loan.warehouseStatus.status).toLowerCase() : ''
          // If warehouse status explicitly indicates 'dipinjam' / 'borrow', exclude it from the list
          if (ws.includes('dipinjam') || ws.includes('borrow')) return false

          // Include loans that are approved (waiting for processing)
          // NOTE: do NOT include loans that are already borrowed ('Dipinjam') — those are already filtered above
          if (canonical === LOAN_LIFECYCLE.APPROVED) return true

          return false
        })
        setLoans(warehouseLoans)
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error)
      toast.error('Gagal memuat data peminjaman')
    } finally {
      setLoading(false)
    }
  }

  // Filter loans based on search term
  const filteredLoans = loans.filter(loan =>
    loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.entitasId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getNeedTypeLabel(loan.needType).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (Array.isArray(loan.company) ? loan.company.join(', ') : loan.company).toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination calculations
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLoans = filteredLoans.slice(startIndex, startIndex + itemsPerPage)

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

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

  const handlePageChange = (event: unknown, newPage: number) => {
    setCurrentPage(newPage + 1)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setItemsPerPage(parseInt(event.target.value, 10))
    setCurrentPage(1)
  }


  // NOTE: handlers accept an optional loanId parameter now so buttons can call them directly.
  const handleProcessLoan = async (loanId?: string, note?: string) => {
    const id = loanId || ''
    // if invoked without explicit note, ask for confirmation (backwards-compatible)
    if (typeof note === 'undefined' && !confirm('Apakah Anda yakin ingin memproses peminjaman ini?')) return
    try {
      const response = await fetch(`/api/loans/${id}/warehouse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process', status: WAREHOUSE_STATUS.BORROWED, ...(note ? { note } : {}) })
      })

      if (response.ok) {
        const updated = await response.json()
        const updatedLoan = updated?.loan ?? updated
        // update full dataset for accurate metrics
        setAllLoans(prev => prev.map(l => l.id === id ? updatedLoan : l))
        setLoans(prev => prev.map(loan => loan.id === id ? updatedLoan : loan))
        toast.success('Peminjaman berhasil diproses')
        // reset selected loan when processed
        setSelectedProcessLoanId(null)
        setProcessDialogOpen(false)
        // no menu to close when using per-card buttons
      } else {
        toast.error('Gagal memproses peminjaman')
      }
    } catch (error) {
      console.error('Error processing loan:', error)
      toast.error('Terjadi kesalahan saat memproses peminjaman')
    }
  }

  // handleRejectLoan now accepts optional reason & note from a confirmation dialog
  const handleRejectLoan = async (loanId?: string, reason?: string, note?: string) => {
    const id = loanId || ''
    if (!reason || !reason.trim()) return

    try {
      const response = await fetch(`/api/loans/${id}/warehouse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', status: WAREHOUSE_STATUS.REJECTED, reason, note })
      })

      if (response.ok) {
        const updated = await response.json()
        const updatedLoan = updated?.loan ?? updated
        // update full dataset for metrics
        setAllLoans(prev => prev.map(l => l.id === id ? updatedLoan : l))
        setLoans(prev => prev.map(loan => loan.id === id ? updatedLoan : loan))
        toast.success('Peminjaman berhasil ditolak')
      } else {
        toast.error('Gagal menolak peminjaman')
      }
    } catch (error) {
      console.error('Error rejecting loan:', error)
      toast.error('Terjadi kesalahan saat menolak peminjaman')
    }
  }

  const handleReturnLoan = async (loanId?: string) => {
    const id = loanId || ''
    try {
      // No files => keep JSON body; but if there are files attached for the modal, they will be read from returnFilesMap state
      const filesForLoan = returnFilesMap[id] || []
      let response: Response
      if (filesForLoan && filesForLoan.length > 0) {
        const fd = new FormData()
        fd.append('action', 'return')
        fd.append('status', WAREHOUSE_STATUS.RETURNED)
        filesForLoan.forEach(f => fd.append('files', f))
        // include note if present
        const note = returnNotesMap[id]
        if (note) fd.append('note', note)

        response = await fetch(`/api/loans/${id}/warehouse`, {
          method: 'POST',
          body: fd
        })
      } else {
        response = await fetch(`/api/loans/${id}/warehouse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'return', status: WAREHOUSE_STATUS.RETURNED, note: returnNotesMap[id] })
        })
      }

        if (response.ok) {
          const updated = await response.json()
          const updatedLoan = updated?.loan ?? updated
          // Keep the full dataset updated for metrics
          setAllLoans(prev => prev.map(l => l.id === id ? updatedLoan : l))
          // If the returned loan is now a returned/Returned state, remove it from visible listing.
          const isReturned = (updatedLoan as any).returnStatus?.status === WAREHOUSE_STATUS.RETURNED || (updatedLoan.loanStatus && String(updatedLoan.loanStatus).toLowerCase().includes('return'))
          if (isReturned) {
            setLoans(prev => prev.filter(l => l.id !== id))
          } else {
            setLoans(prev => prev.map(loan => loan.id === id ? updatedLoan : loan))
          }
        toast.success('Barang berhasil dikembalikan')
          // close any return dialog if open
          setReturnDialog({ open: false, loan: null })
          // clear any stored files/notes for this loan
          setReturnFilesMap(prev => {
            const next = { ...prev }
            delete next[id]
            return next
          })
          setReturnNotesMap(prev => {
            const next = { ...prev }
            delete next[id]
            return next
          })
      } else {
        try {
          const body = await response.json()
          toast.error(body?.message || 'Gagal memproses pengembalian')
        } catch (e) {
          toast.error('Gagal memproses pengembalian')
        }
      }
    } catch (error) {
      console.error('Error returning loan:', error)
      toast.error('Terjadi kesalahan saat memproses pengembalian')
    }
  }

  const handleViewDetail = (loanId?: string) => {
    const id = loanId || ''
    router.push(`/peminjaman/${id}?mode=warehouse`)
  }

  // Local state to track files and notes per loan (used by per-card modal)
  const [returnFilesMap, setReturnFilesMap] = React.useState<Record<string, File[]>>({})
  const [returnNotesMap, setReturnNotesMap] = React.useState<Record<string, string>>({})

  // Calculate metrics
  // Use the full fetched dataset for metrics so returned loans are counted in the header while
  // not shown in the card listing itself.
  const totalApprovedLoans = allLoans.length
  const pendingProcessing = allLoans.filter(loan => {
    const status = getLibLoanStatus(loan as any)
    // Approved and waiting for processing or explicit pending warehouse status
    return status === LOAN_LIFECYCLE.APPROVED || !loan.warehouseStatus || String(loan.warehouseStatus.status).toLowerCase().includes('menunggu')
  }).length
  const currentlyBorrowed = allLoans.filter(loan => {
    const status = getLibLoanStatus(loan as any)
    // If a return is pending on the loan, don't count it as currently borrowed even if
    // warehouseStatus still reads 'Dipinjam'. Use top-level loan.returnStatus or loan.loanStatus
    const isReturnPending = Boolean(
      String((loan as any).loanStatus || '').toLowerCase().includes('returnrequest') ||
      String(((loan as any).returnStatus)?.status || '').toLowerCase().includes('returnrequest') ||
      ((loan as any).returnRequest && Array.isArray((loan as any).returnRequest) && (loan as any).returnRequest.some((r:any) => ['submitted','returnrequested','pending','approved'].includes(String(r?.status||'').toLowerCase())))
    )
    if (isReturnPending) return false
    return status === WAREHOUSE_STATUS.BORROWED || String(loan.warehouseStatus?.status || '').toLowerCase().includes('dipinjam')
  }).length
  const returnedLoans = allLoans.filter(loan => {
    const status = getLibLoanStatus(loan as any)
    return status === WAREHOUSE_STATUS.RETURNED || (loan as any).returnStatus?.status === WAREHOUSE_STATUS.RETURNED
  }).length

  if (loading) {
    return (
      <ThemeProvider theme={corporateTheme}>
        <CssBaseline />
        <Box sx={{ p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="text" sx={{ fontSize: '2.5rem', mb: 2 }} />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)'
                },
                gap: 3,
                mb: 4
              }}
            >
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent>
                    <Skeleton variant="text" sx={{ mb: 1 }} />
                    <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
                  </CardContent>
                </Card>
              ))}
            </Box>
            <Skeleton variant="rectangular" height={400} />
          </Box>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={corporateTheme}>
      <CssBaseline />

      {/* Hero Header Section - Full Width */}
      <Fade in={true} timeout={800}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
            color: 'white',
            py: { xs: 6, md: 3 },
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
              opacity: 0.1,
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '1200px', mx: 'auto', px: { xs: 2, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarehouseIcon sx={{ fontSize: { xs: 48, md: 64 }, mr: 3, opacity: 0.9, color: 'white' }} />
                <Box>
                  <Typography
                    variant="h2"
                    component="h1"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.5rem', md: '1.3rem' },
                      mb: 2,
                      background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Warehouse Approvals
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: '1.25rem', md: '1.2rem' },
                      opacity: 0.9,
                      maxWidth: '600px',
                      lineHeight: 1.4,
                    }}
                  >
                    Manage approved loan requests and track inventory movements across your organization
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Button
                  component={Link}
                  href="/admin/dashboard"
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  Back to Dashboard
                </Button>
              </Box>
            </Box>

            {/* Key Stats Row */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(4, 1fr)'
                },
                gap: 3,
                mt: 4
              }}
            >
              <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                <Paper
                  sx={{
                    p: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 3,
                    textAlign: 'center',
                  }}
                >
                  <ApprovedIcon sx={{ fontSize: 32, color: 'success.light', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5, fontSize: '1.9rem' }}>
                    {totalApprovedLoans}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Total Approved Loans
                  </Typography>
                </Paper>
              </Zoom>

              <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                <Paper
                  sx={{
                    p: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 3,
                    textAlign: 'center',
                  }}
                >
                  <PendingIcon sx={{ fontSize: 32, color: 'warning.light', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5, fontSize: '1.9rem' }}>
                    {pendingProcessing}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Pending Processing
                  </Typography>
                </Paper>
              </Zoom>

              <Zoom in={true} style={{ transitionDelay: '400ms' }}>
                <Paper
                  sx={{
                    p: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 3,
                    textAlign: 'center',
                  }}
                >
                  <LocalShippingIcon sx={{ fontSize: 32, color: 'info.light', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5, fontSize: '1.9rem' }}>
                    {currentlyBorrowed}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Currently Borrowed
                  </Typography>
                </Paper>
              </Zoom>

              <Zoom in={true} style={{ transitionDelay: '500ms' }}>
                <Paper
                  sx={{
                    p: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 3,
                    textAlign: 'center',
                  }}
                >
                  <AssignmentReturnIcon sx={{ fontSize: 32, color: 'secondary.light', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5, fontSize: '1.9rem' }}>
                    {returnedLoans}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Returned Items
                  </Typography>
                </Paper>
              </Zoom>
            </Box>
          </Box>
        </Box>
      </Fade>

      <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', maxWidth: 1350, py: 6, px: { xs: 2, md: 4 }, mx: 'auto' }}>
        <Head>
          <title>Warehouse Operations Center - FormFlow</title>
        </Head>

        {/* Search and Controls */}
        <Fade in={true} timeout={800}>
          <Paper
            sx={{
              mb: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              p: 4,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '3fr 1fr'
                },
                gap: 3,
                alignItems: 'center'
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by borrower name, entity, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 3,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.1)',
                    }
                  }
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Items per page</InputLabel>
                <Select
                  value={itemsPerPage}
                  label="Items per page"
                  onChange={(e) => setItemsPerPage(Number((e.target as any).value))}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 3,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                    }
                  }}
                >
                  <MenuItem value={10}>10 per page</MenuItem>
                  <MenuItem value={20}>20 per page</MenuItem>
                  <MenuItem value={30}>30 per page</MenuItem>
                  <MenuItem value={40}>40 per page</MenuItem>
                  <MenuItem value={50}>50 per page</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>
        </Fade>

        {/* Data Cards - approvals-style layout with per-card Menu */}
        <Fade in={true} timeout={1000}>
          <Paper
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              backgroundColor: 'white',
              border: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            {paginatedLoans.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                <WarehouseIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 3, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2, fontWeight: 500 }}>
                  {searchTerm ? 'No loans match your search' : 'No approved loans waiting for warehouse processing'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {searchTerm ? 'Try adjusting your search terms' : 'Approved loans will appear here for processing'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {paginatedLoans.map((loan, index) => {
                    const submittedDateLabel = formatDate(loan.submittedAt).split(',')[0]
                    const submittedTimeLabel = new Date(loan.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <Zoom in={true} key={loan.id} style={{ transitionDelay: `${index * 40}ms` }}>
                        <Card
                          sx={{
                            px: { xs: 1.25, sm: 2 },
                            py: { xs: 1.75, sm: 2.6 },
                            borderRadius: 2,
                            boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
                            transition: 'transform 0.16s ease, box-shadow 0.16s ease',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 28px rgba(15,23,42,0.10)' },
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 160,
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
                            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', minWidth: 0 }}>
                              <Checkbox
                                checked={selectedLoans.includes(loan.id)}
                                onChange={(e) => handleSelectLoan(loan.id, e.target.checked)}
                                sx={{ mt: 0.25 }}
                              />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loan.borrowerName}</Typography>
                                <Stack spacing={0.35} sx={{ mt: 0.6 }}>
                                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.4 }}>{loan.borrowerPhone}</Typography>
                                  {loan.borrowerEmail ? <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.4 }}>{loan.borrowerEmail}</Typography> : null}
                                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.4 }}>{loan.entitasId}</Typography>
                                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, lineHeight: 1.4 }}>ID Peminjaman: {loan.id}</Typography>
                                </Stack>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, alignItems: { xs: 'center', sm: 'flex-end' }, gap: 1 }}>
                              <Chip label={getLibLoanStatus(loan as any) || '—'} color={getStatusColor(loan)} size="small" sx={{ fontWeight: 700 }} />
                                          {(() => {
                                            const effectiveEnd = getEffectiveReturnDate(loan as any)
                                            const durationInfo = getDurationInfo(loan.outDate, effectiveEnd ?? loan.returnDate)
                                            if (durationInfo) {
                                              return (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, textAlign: { xs: 'left', sm: 'right' }, minWidth: 0, rowGap: 0.35 }}>
                                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Durasi Peminjaman</Typography>
                                                  <Chip size="small" label={durationInfo.label} sx={{ fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)' }} />
                                                </Box>
                                              )
                                            }

                                            return (
                                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{submittedDateLabel} {submittedTimeLabel ? <span style={{ fontWeight: 700 }}> {submittedTimeLabel}</span> : null}</Typography>
                                            )
                                          })()}
                              {/* top-right menu removed - actions moved to bottom */}
                            </Box>
                          </Box>

                          <Divider sx={{ my: 1.25, borderColor: 'rgba(15,23,42,0.14)' }} />

                          <Box sx={{ mt: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" sx={{ minWidth: 0 }}>
                                <Chip label={getNeedTypeLabel(loan.needType)} size="small" sx={{ fontWeight: 700, px: 1.4, ...getNeedTypeChipStyle(getNeedTypeLabel(loan.needType)) }} />
                                {(Array.isArray(loan.company) ? loan.company : [loan.company]).slice(0,3).map((company, idx) => (
                                  <Chip key={idx} label={company} size="small" variant="outlined" sx={{ fontSize: '0.72rem', borderWidth: 1.5, ...getCompanyChipStyle(company) }} />
                                ))}
                                {(Array.isArray(loan.company) ? loan.company.length : 0) > 3 && <Typography variant="caption" sx={{ color: 'text.secondary' }}>+{(Array.isArray(loan.company) ? loan.company.length : 0) - 3} more</Typography>}
                              </Stack>

                              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: { xs: 0, sm: 1 }, flexWrap: 'wrap' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{submittedDateLabel}</Typography>
                                {submittedTimeLabel && <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>{submittedTimeLabel}</Typography>}
                              </Stack>
                            </Box>

                            <Divider sx={{ my: 1.25, borderColor: 'rgba(15,23,42,0.14)' }} />

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                              <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Tanggal keluar</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>{loan.outDate ? formatDate(loan.outDate).split(',')[0] : '-'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Tanggal digunakan</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>{loan.useDate ? formatDate(loan.useDate).split(',')[0] : '-'}</Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5, mt: 1.5 }}>
                              <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Tanggal dikembalikan</Typography>
                                {(() => {
                                  const effective = getEffectiveReturnDate(loan as any)
                                  const display = effective ? formatDate(effective).split(',')[0] : (loan.returnDate ? formatDate(loan.returnDate).split(',')[0] : '-')
                                  return <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>{display}</Typography>
                                })()}
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Metode Pengambilan</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>{loan.pickupMethod ? getPickupMethodLabel(loan.pickupMethod) : '-'}</Typography>
                              </Box>
                            </Box>

                            {loan.productDetailsText ? (
                              <Box sx={{ py: 1.1, px: 1.4, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1.2, mt: 1.25 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700, mb: 0.6 }}>Rincian Produk</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>{loan.productDetailsText.length > 160 ? `${loan.productDetailsText.slice(0, 157)}...` : loan.productDetailsText}</Typography>
                              </Box>
                            ) : null}

                          {/* Actions row - 3 column text buttons (Detail / Proses / Tolak/Kembalikan) */}
                          <Divider sx={{ my: 1.25, borderColor: 'rgba(15,23,42,0.14)' }} />
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1, mt: 0.75 }}>
                            <Button
                              component={Link}
                              href={`/peminjaman/${loan.id}?mode=warehouse`}
                              variant="outlined"
                              size="small"
                              sx={{ fontWeight: 600 }}
                            >
                              Detail
                            </Button>

                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              disabled={!getWarehouseActions(loan).includes('process')}
                              onClick={() => { setSelectedProcessLoanId(loan.id); setProcessDialogOpen(true) }}
                              sx={{ fontWeight: 600 }}
                            >
                              Proses Peminjaman
                            </Button>

                            {getWarehouseActions(loan).includes('reject') ? (
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => setRejectDialog({ open: true, loan, reason: '', note: '' })}
                                sx={{ fontWeight: 600 }}
                              >
                                Tolak
                              </Button>
                            ) : getWarehouseActions(loan).includes('return') ? (
                              <Button
                                variant="contained"
                                color="info"
                                size="small"
                                disabled={!hasActiveReturnRequest(loan)}
                                onClick={() => {
                                  if (hasActiveReturnRequest(loan)) {
                                    setReturnDialog({ open: true, loan })
                                  }
                                }}
                                sx={{ fontWeight: 600 }}
                              >
                                Konfirmasi Pengembalian
                              </Button>
                            ) : (
                              <Button variant="outlined" size="small" disabled sx={{ fontWeight: 600 }}>
                                —
                              </Button>
                            )}
                          </Box>
                          </Box>
                        </Card>
                      </Zoom>
                    )
                  })}
                </Box>
              </Box>
            )}

            {/* Pagination */}
            <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
              <TablePagination
                component="div"
                count={filteredLoans.length}
                page={currentPage - 1}
                onPageChange={handlePageChange}
                rowsPerPage={itemsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
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
        </Fade>

        {/* Bulk Actions */}
        {selectedLoans.length > 0 && (
          <Fade in={true} timeout={1200}>
            <Paper
              sx={{
                position: 'fixed',
                bottom: 32,
                left: '50%',
                transform: 'translateX(-50%)',
                p: 3,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                minWidth: 450,
                maxWidth: '90vw',
              }}
            >
              <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      mr: 2,
                      bgcolor: 'primary.main',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    {selectedLoans.length}
                  </Avatar>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {selectedLoans.length} loans selected
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ height: 32, my: 'auto' }} />
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<ProcessIcon />}
                  onClick={() => {
                    // Handle bulk process
                    selectedLoans.forEach(loanId => {
                      // Process each loan
                    });
                    setSelectedLoans([]);
                  }}
                  sx={{
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 3,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.3)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Ready for Pickup
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<ReturnIcon />}
                  onClick={() => {
                    // Handle bulk return
                    selectedLoans.forEach(loanId => {
                      // Process return for each loan
                    });
                    setSelectedLoans([]);
                  }}
                  sx={{
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 3,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(255, 152, 0, 0.3)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Process Return
                </Button>
              </Stack>
            </Paper>
          </Fade>
        )}

        {/* Per-card actions are now rendered inline at the bottom of each card — no floating Menu required */}

        {/* Reject dialog (re-use approval UI pattern) */}
        <RejectDialog
          open={rejectDialog.open}
          loan={rejectDialog.loan}
          reason={rejectDialog.reason}
          note={rejectDialog.note}
          onClose={() => setRejectDialog({ open: false, loan: null, reason: '', note: '' })}
          onReject={(loanId, reason, note) => {
            // call the existing handler and close dialog
            handleRejectLoan(loanId, reason, note)
            setRejectDialog({ open: false, loan: null, reason: '', note: '' })
          }}
          onReasonChange={(reason) => setRejectDialog(prev => ({ ...prev, reason }))}
          onNoteChange={(note) => setRejectDialog(prev => ({ ...prev, note }))}
          getNeedTypeLabel={getNeedTypeLabel}
          getPickupMethodLabel={(m) => getPickupMethodLabel(m)}
        />

        {/* Process confirmation dialog (collect optional note) */}
        {/** When a card 'Proses Peminjaman' is clicked `selectedProcessLoanId` is set — find the loan object to show borrower info in the dialog */}
        {selectedProcessLoanId && /* make the selected loan available to the dialog */ null}
        {/* compute selected loan */}
        {
          // selectedProcessLoan is computed here so it can be passed into ProcessDialog
        }
        <ProcessDialog
          open={processDialogOpen}
          onClose={() => { setProcessDialogOpen(false); setSelectedProcessLoanId(null) }}
          defaultNote={selectedProcessLoanId ? '' : ''}
          loan={selectedProcessLoanId ? loans.find(l => l.id === selectedProcessLoanId) ?? null : null}
          getNeedTypeLabel={getNeedTypeLabel}
          getPickupMethodLabel={(m) => getPickupMethodLabel(m)}
          onConfirm={(note) => {
            // call handler for selected loan with provided note
            if (selectedProcessLoanId) handleProcessLoan(selectedProcessLoanId, note)
          }}
        />

        {/* Return confirmation dialog */}
        <Dialog
          open={returnDialog.open}
          onClose={() => setReturnDialog({ open: false, loan: null })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography component="div" variant="h6" sx={{ fontWeight: 600 }}>
              Konfirmasi Pengembalian
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'text.secondary' }}>
              Apakah Anda yakin bahwa barang untuk peminjaman ini sudah dikembalikan?
            </Typography>
            {returnDialog.loan && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(2,136,209,0.04)', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'info.main' }}>{returnDialog.loan.borrowerName}</Typography>
                <Typography variant="body2" color="text.secondary">Entitas: {returnDialog.loan.entitasId}</Typography>
                <Typography variant="body2" color="text.secondary">Metode Pengambilan: {getPickupMethodLabel ? getPickupMethodLabel(returnDialog.loan.pickupMethod) : returnDialog.loan.pickupMethod || '-'}</Typography>
                {returnDialog.loan.productDetailsText && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4, mt: 0.5 }}>
                    {returnDialog.loan.productDetailsText.length > 300 ? `${returnDialog.loan.productDetailsText.slice(0, 297)}...` : returnDialog.loan.productDetailsText}
                  </Typography>
                )}
              </Box>
            )}

            {/* Note and upload support */}
            {returnDialog.loan && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={1}
                  value={returnNotesMap[returnDialog.loan.id] || ''}
                  onChange={(e) => setReturnNotesMap(prev => ({ ...prev, [returnDialog.loan!.id]: e.target.value }))}
                  label="Catatan pengembalian (opsional)"
                  placeholder="Tambahkan catatan untuk bukti pengembalian (opsional)"
                  inputProps={{ style: { paddingTop: 2, paddingBottom: 2 } }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <input
                    id="gudang-return-files-input"
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const filesList = e.target.files
                      if (!filesList || !returnDialog.loan) return
                      const id = returnDialog.loan.id
                      const existing = returnFilesMap[id] || []
                      const incoming = Array.from(filesList)
                      const MAX_COUNT = 6
                      const MAX_SIZE = 5 * 1024 * 1024 // 5MB
                      const allowed = incoming.filter(f => f.type.startsWith('image/'))
                      if (allowed.length !== incoming.length) {
                        toast.error('Hanya file gambar (jpg/png) yang diperbolehkan')
                      }
                      const tooLarge = incoming.filter(f => f.size > MAX_SIZE)
                      if (tooLarge.length > 0) {
                        toast.error('File terlalu besar. Maksimum 5MB per file')
                      }
                      const good = allowed.filter(f => f.size <= MAX_SIZE)
                      const combined = [...existing, ...good].slice(0, MAX_COUNT)
                      if (combined.length > existing.length + good.length) {
                        toast('Maksimum 6 file dapat diunggah', { icon: '⚠️' })
                      }
                      setReturnFilesMap(prev => ({ ...prev, [id]: combined }))
                      // clear input so same files can be selected again
                      e.currentTarget.value = ''
                    }}
                  />
                  <label htmlFor="gudang-return-files-input">
                    <Button size="small" component="span" variant="outlined">Unggah bukti foto</Button>
                  </label>

                  <Typography variant="caption" color="text.secondary">Max 6 files — gambar hingga 5MB/file</Typography>
                </Box>

                {/* previews */}
                {returnFilesMap[returnDialog.loan.id] && returnFilesMap[returnDialog.loan.id].length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                    {returnFilesMap[returnDialog.loan.id].map((f, idx) => (
                      <Card key={idx} variant="outlined" sx={{ width: 92, height: 92, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <Image
                          src={URL.createObjectURL(f)}
                          alt={f.name}
                          fill
                          style={{ objectFit: 'cover', borderRadius: 4 }}
                          unoptimized
                        />
                        <Button size="small" onClick={() => setReturnFilesMap(prev => ({ ...prev, [returnDialog.loan!.id]: prev[returnDialog.loan!.id].filter((_, i) => i !== idx) }))} sx={{ position: 'absolute', top: 2, right: 2, minWidth: 0, p: 0.4, bgcolor: 'rgba(0,0,0,0.4)', color: 'white' }}>✕</Button>
                      </Card>
                    ))}
                  </Stack>
                )}

              </Box>
            )}
            {/* borrower info moved above the note/upload controls (kept only here) */}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setReturnDialog({ open: false, loan: null })} variant="outlined">Batal</Button>
            <Button
              onClick={() => {
                if (returnDialog.loan) handleReturnLoan(returnDialog.loan.id)
              }}
              variant="contained"
              color="info"
            >
              Konfirmasi Pengembalian
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  )
}

export default GudangDashboard