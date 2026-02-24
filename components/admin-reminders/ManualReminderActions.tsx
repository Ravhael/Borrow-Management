import React, { useState, useEffect } from 'react'
import { WAREHOUSE_STATUS } from '../../types/loanStatus'
import {
  Typography,
  Box,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  MenuItem,
  TextField,
  Stack,
} from '@mui/material'
import {
  Send as SendIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import { getEffectiveReturnDate } from '../../utils/loanHelpers'

interface Loan {
  id: string
  borrowerName: string
  borrowerEmail?: string
  loanStatus?: string
  entitasId: string
  company: string[]
  returnDate: string
  productDetailsText: string
  warehouseStatus: {
    status: string
    processedAt: string
    processedBy: string
    returnedAt?: string
    returnedBy?: string
  }
  reminderStatus?: {
    [key: string]: {
      sent?: boolean
      sentAt?: string
      type?: string
      notifications?: {
        entitas?: Record<string, Record<string, { sent: boolean; sentAt?: string; email: string }>>
        companies?: Record<string, Record<string, { sent: boolean; sentAt?: string; email: string }>>
        borrower?: { sent: boolean; sentAt?: string; email: string }
      }
    }
  }
  returnStatus?: { status?: string }
}

interface ManualReminderActionsProps {
  onReminderSent?: () => void
}

const BEFORE_REMINDER_TYPES: Record<string, number> = {
  '7_days': 7,
  '3_days': 3,
  '1_day': 1,
  '0_days': 0
}

const AFTER_DAY_OPTIONS = Array.from({ length: 30 }, (_, idx) => idx + 1)

const calculateDaysUntilReturn = (loan: Loan): number | null => {
  const effectiveReturn = getEffectiveReturnDate(loan as any) || loan.returnDate
  if (!effectiveReturn) return null
  const due = new Date(effectiveReturn)
  if (Number.isNaN(due.getTime())) return null
  const today = new Date()
  const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.ceil((dueOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24))
}

const parseReminderTypeOffset = (type: string): number | undefined => {
  if (!type) return undefined
  if (type in BEFORE_REMINDER_TYPES) return BEFORE_REMINDER_TYPES[type]
  const afterMatch = /^after_(\d+)_days$/.exec(type)
  if (afterMatch) return -Number(afterMatch[1])
  const reminderMatch = /reminder_(-?\d+)_days$/.exec(type)
  if (reminderMatch) return Number(reminderMatch[1])
  return undefined
}

const formatOffsetLabel = (offset: number): string => {
  if (offset === 0) return 'H'
  if (offset > 0) return `H-${offset}`
  return `H+${Math.abs(offset)}`
}

const formatReminderChipLabel = (raw: string): string => {
  const offset = parseReminderTypeOffset(raw)
  if (typeof offset === 'number') {
    return formatOffsetLabel(offset)
  }
  return raw.replace('reminder_', '').replace('_days', ' hari')
}

const hasNotificationSent = (notifications?: any): boolean => {
  if (!notifications) return false
  const hasEntries = (collection?: Record<string, any>) =>
    Object.values(collection ?? {}).some(group =>
      Object.values(group ?? {}).some((entry: any) => !!entry?.sent)
    )

  if (hasEntries(notifications.entitas)) return true
  if (hasEntries(notifications.companies)) return true
  if (notifications.borrower?.sent) return true
  return false
}

const isReminderSentOffset = (loan: Loan, offset: number): boolean => {
  const reminderKey = `${loan.id}_reminder_${offset}_days`
  const reminderStatusEntry = (loan.reminderStatus as any)?.[reminderKey] as any | undefined
  const reminderData = reminderStatusEntry?.notifications || (loan as any).reminderNotifications?.[reminderKey]

  if (reminderStatusEntry && typeof reminderStatusEntry.sent === 'boolean') {
    return reminderStatusEntry.sent
  }

  if (!reminderData) return false

  if (reminderData.type && typeof reminderData.sent === 'boolean') {
    return reminderData.sent
  }

  return hasNotificationSent(reminderData)
}

const ManualReminderActions: React.FC<ManualReminderActionsProps> = ({ onReminderSent }) => {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    loanId: string
    reminderType: string
    loan: Loan | null
  }>({
    open: false,
    loanId: '',
    reminderType: '',
    loan: null
  })
  const [mounted, setMounted] = useState(false)

  // Fetch loans that are currently borrowed (extracted for reuse by polling)
  const fetchBorrowedLoans = async () => {
    try {
      const response = await fetch('/api/loans')
      if (response.ok) {
        const data = await response.json()
        // Filter loans that are currently borrowed and have return date
        // Exclude loans that have been returned (prefer top-level returnStatus where present,
        // fall back to warehouseStatus or loanStatus strings). We only want actionable BORROWED loans.
        const borrowedLoans = data.filter((loan: Loan) => {
          // skip returned loans
          // Detect returned loans in several shapes (new returnStatus, explicit returned warehouse status,
          // or legacy returnedAt/returnedBy fields which indicate the loan was returned)
          if ((loan as any).returnStatus?.status === WAREHOUSE_STATUS.RETURNED) return false
          if (loan.warehouseStatus?.status === WAREHOUSE_STATUS.RETURNED) return false
          if (loan.warehouseStatus?.returnedAt || loan.warehouseStatus?.returnedBy || (loan.warehouseStatus as any).returnProofFiles?.length > 0) return false
          if (loan.loanStatus && String(loan.loanStatus).toLowerCase().includes('return')) return false

          return loan.warehouseStatus?.status === WAREHOUSE_STATUS.BORROWED && (!!getEffectiveReturnDate(loan as any) || !!loan.returnDate)
        })
        setLoans(borrowedLoans)
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
      toast.error('Gagal memuat data peminjaman')
    } finally {
      setLoading(false)
    }
  }

  // Initial load + periodic polling so UI reflects automated reminders (e.g. Sent state) without manual refresh
  useEffect(() => {
    // initial
    fetchBorrowedLoans()
    // poll every 60s
    const interval = setInterval(() => {
      fetchBorrowedLoans()
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSendReminder = async (loanId: string, reminderType: string) => {
    setSendingReminder(`${loanId}-${reminderType}`)
    try {
      const response = await fetch('/api/reminders/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loanId,
          reminderType
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Reminder ${reminderType.replace('_', ' ')} berhasil dikirim!`)
        // Refresh loans data
        const loansResponse = await fetch('/api/loans')
        if (loansResponse.ok) {
          const data = await loansResponse.json()
          const borrowedLoans = data.filter((loan: Loan) => {
            if ((loan as any).returnStatus?.status === WAREHOUSE_STATUS.RETURNED) return false
            if (loan.warehouseStatus?.status === WAREHOUSE_STATUS.RETURNED) return false
            if (loan.warehouseStatus?.returnedAt || loan.warehouseStatus?.returnedBy || (loan.warehouseStatus as any).returnProofFiles?.length > 0) return false
            if (loan.loanStatus && String(loan.loanStatus).toLowerCase().includes('return')) return false

            return loan.warehouseStatus?.status === WAREHOUSE_STATUS.BORROWED && (!!getEffectiveReturnDate(loan as any) || !!loan.returnDate)
          })
          setLoans(borrowedLoans)
        }
        onReminderSent?.()
      } else {
        toast.error(result.message || 'Gagal mengirim reminder')
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
      toast.error('Gagal mengirim reminder')
    } finally {
      setSendingReminder(null)
      setConfirmDialog({ open: false, loanId: '', reminderType: '', loan: null })
    }
  }



  const openConfirmDialog = (loan: Loan, reminderType: string) => {
    setConfirmDialog({
      open: true,
      loanId: loan.id,
      reminderType,
      loan
    })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, loanId: '', reminderType: '', loan: null })
  }

  const getReminderButtonText = (type: string) => {
    const offset = parseReminderTypeOffset(type)
    if (typeof offset === 'number') {
      if (offset === 0) return 'Hari H'
      if (offset > 0) return `${offset} Hari Sebelum`
      return `${Math.abs(offset)} Hari Setelah`
    }
    return type
  }

  const getReminderColor = (type: string): "primary" | "secondary" | "error" | "info" | "success" | "warning" | "inherit" => {
    switch (type) {
      case '7_days': return 'info'
      case '3_days': return 'warning'
      case '1_day': return 'error'
      case '0_days': return 'error'
      default: return 'primary'
    }
  }

  const isReminderSent = (loan: Loan, type: string) => {
    const offset = parseReminderTypeOffset(type)
    if (typeof offset === 'undefined') return false
    return isReminderSentOffset(loan, offset)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!mounted || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Memuat data peminjaman...</Typography>
      </Box>
    )
  }

  return (
    <>
    {/* Manual Reminder Actions */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SendIcon sx={{ fontSize: 28, color: 'primary.main', mr: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Manual Reminder Actions
          </Typography>
        </Box>

        {loans.length === 0 ? (
          <Alert severity="info">
            Tidak ada peminjaman yang sedang dalam status &quot;Dipinjam&quot; dengan tanggal kembali.
          </Alert>
        ) : (
          <Paper
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              backgroundColor: 'white',
              border: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <TableContainer
              sx={{
                maxHeight: 600,
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(26, 54, 93, 0.3)',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(26, 54, 93, 0.5)',
                  },
                },
              }}
            >
              <Table stickyHeader>
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
                    <TableCell sx={{ fontWeight: 600, width: '10%' }}>ID Peminjaman</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '12%' }}>Peminjam</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '8%' }}>Entitas</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '12%' }}>Perusahaan</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '10%' }}>Tanggal Kembali</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '18%' }}>Detail Produk</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '5%', textAlign: 'center' }}>Day 7</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '5%', textAlign: 'center' }}>Day 3</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '5%', textAlign: 'center' }}>Day 1</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '5%', textAlign: 'center' }}>Same Day</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '10%', textAlign: 'center' }}>After Return (H+)</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '10%' }}>Status Reminder</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loans.map((loan) => {
                    const daysUntil = calculateDaysUntilReturn(loan)
                    const overdueDays = typeof daysUntil === 'number' && daysUntil < 0 ? Math.abs(daysUntil) : 0
                    const isOverdue = overdueDays > 0
                    const afterDays = isOverdue ? Math.min(Math.max(overdueDays, 1), 30) : 1
                    const afterIsSent = isOverdue ? isReminderSentOffset(loan, -afterDays) : false
                    const sendAfterKeyExact = `${loan.id}-after_${afterDays}_days`
                    const isSendingAfterExact = sendingReminder === sendAfterKeyExact

                    return (
                      <TableRow
                        key={loan.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(26, 54, 93, 0.04)',
                            transform: 'scale(1.002)',
                            transition: 'all 0.2s ease-in-out',
                          },
                          '&:nth-of-type(even)': {
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          },
                          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>{loan.id}</TableCell>
                        <TableCell>{loan.borrowerName}</TableCell>
                        <TableCell>{loan.entitasId}</TableCell>
                        <TableCell>
                          {Array.isArray(loan.company) ? loan.company.join(', ') : loan.company}
                        </TableCell>
                        <TableCell>{(() => {
                          const eff = getEffectiveReturnDate(loan as any)
                          return eff ? formatDate(eff) : formatDate(loan.returnDate)
                        })()}</TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {loan.productDetailsText}
                          </Typography>
                        </TableCell>
                        {['7_days', '3_days', '1_day', '0_days'].map((type) => {
                          const isSent = isReminderSent(loan, type)
                          const isSending = sendingReminder === `${loan.id}-${type}`

                          return (
                            <TableCell key={type} sx={{ textAlign: 'center', p: 1 }}>
                              <Button
                                fullWidth
                                variant={isSent ? "outlined" : "contained"}
                                color={isSent ? "success" : getReminderColor(type)}
                                size="small"
                                onClick={() => openConfirmDialog(loan, type)}
                                disabled={isSent || isSending}
                                startIcon={
                                  isSending ? <CircularProgress size={14} /> :
                                  isSent ? <CheckCircleIcon fontSize="small" /> :
                                  <ScheduleIcon fontSize="small" />
                                }
                                sx={{
                                  minHeight: '32px',
                                  fontSize: '0.65rem',
                                  px: 1,
                                  ...(isSent && {
                                    '&:disabled': {
                                      backgroundColor: 'success.main',
                                      color: 'white',
                                      opacity: 0.8
                                    }
                                  }),
                                  ...(type === '3_days' && !isSent && {
                                    color: 'white'
                                  })
                                }}
                              >
                                {isSending ? '...' : isSent ? 'Sent' : 'Send'}
                              </Button>
                            </TableCell>
                          )
                        })}
                        <TableCell sx={{ textAlign: 'center', p: 1 }}>
                          <Stack spacing={0.75} alignItems="stretch">
                            <Button
                              fullWidth
                              variant={afterIsSent ? "outlined" : "contained"}
                              color={afterIsSent ? "success" : "primary"}
                              size="small"
                              onClick={() => handleSendReminder(loan.id, `after_${afterDays}_days`)}
                              disabled={!isOverdue || isSendingAfterExact || afterIsSent}
                              startIcon={
                                isSendingAfterExact ? <CircularProgress size={14} /> :
                                afterIsSent ? <CheckCircleIcon fontSize="small" /> :
                                <SendIcon fontSize="small" />
                              }
                              sx={{
                                minHeight: '32px',
                                fontSize: '0.65rem',
                                px: 1,
                                ...(afterIsSent && {
                                  '&:disabled': {
                                    backgroundColor: 'success.main',
                                    color: 'white',
                                    opacity: 0.8
                                  }
                                })
                              }}
                            >
                              {isSendingAfterExact ? '...' : afterIsSent ? `Sent` : (
                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                                  <Box component="span">Send</Box>
                                  <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 700, ml: 0.5 }}>H+{afterDays}</Box>
                                </Box>
                              )}
                            </Button>
                            <Chip
                              label={isOverdue ? `H+${overdueDays}` : 'On Track'}
                              size="small"
                              color={isOverdue ? 'error' : 'default'}
                              variant={isOverdue ? 'filled' : 'outlined'}
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {loan.reminderStatus && Object.keys(loan.reminderStatus).length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {Object.entries(loan.reminderStatus)
                                  .filter(([_, entry]) => (entry as any).sent)
                                  .map(([key, entry]) => (
                                    <Chip
                                      key={key}
                                      label={formatReminderChipLabel((entry as any).type || key)}
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem' }}
                                    />
                                  ))}
                              </Box>
                            ) : (
                            <Typography variant="caption" color="text.secondary">
                              Belum ada reminder
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          )}
        </Box>



      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeConfirmDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Konfirmasi Pengiriman Reminder
        </DialogTitle>
        <DialogContent>
          {confirmDialog.loan && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Apakah Anda yakin ingin mengirim reminder <strong>{getReminderButtonText(confirmDialog.reminderType)}</strong> untuk peminjaman berikut?
              </Typography>

              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2"><strong>ID:</strong> {confirmDialog.loan.id}</Typography>
                <Typography variant="body2"><strong>Peminjam:</strong> {confirmDialog.loan.borrowerName}</Typography>
                <Typography variant="body2"><strong>Tanggal Kembali:</strong> {(() => {
                  const eff = getEffectiveReturnDate(confirmDialog.loan as any)
                  return eff ? formatDate(eff) : formatDate(confirmDialog.loan.returnDate)
                })()}</Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                Reminder akan dikirim ke peminjam dan semua stakeholder terkait (entitas dan perusahaan).
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog} color="inherit">
            Batal
          </Button>
          <Button
            onClick={() => handleSendReminder(confirmDialog.loanId, confirmDialog.reminderType)}
            variant="contained"
            color="primary"
            disabled={sendingReminder !== null}
          >
            {sendingReminder ? <CircularProgress size={20} /> : 'Kirim Reminder'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ManualReminderActions