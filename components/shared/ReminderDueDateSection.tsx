import React from 'react'
import Link from 'next/link'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Pagination,
  Stack,
  Typography
} from '@mui/material'

export type ReminderDueDateItem = {
  id: string
  loanId?: string
  borrowerName: string
  productDetailsText?: string
  outDate?: string
  dueDate?: string
  daysLeft?: number | null
  status?: 'pending' | 'upcoming' | 'overdue'
  entitasLabel?: string
  needTypeLabel?: string
  approvalLabel?: string
  isApproved?: boolean
  totalFine?: number
}

export interface ReminderDueDateSectionProps {
  title?: string
  reminders: ReminderDueDateItem[]
  formatDate?: (value?: string) => string
  emptyMessage?: string
  /**
   * When true the component will also render reminders with status 'pending'.
    * Default: false — only loans with status aktif (approved/borrowed/return in process) appear.
   */
  showPending?: boolean
  /** How many reminders to show per page (defaults to 5). */
  itemsPerPage?: number
}

const defaultFormatDate = (dateString?: string) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch (err) {
    return dateString
  }
}

const ReminderDueDateSection: React.FC<ReminderDueDateSectionProps> = ({
  title = 'Reminder Due Date Peminjaman',
  reminders,
  formatDate = defaultFormatDate,
  emptyMessage = 'Tidak ada pengingat jatuh tempo',
  showPending = false,
  itemsPerPage = 5
}) => {
  const formatDaysLabel = (reminder: ReminderDueDateItem) => {
    if (reminder.status === 'pending') return 'Menunggu persetujuan'
    if (reminder.daysLeft === null || reminder.daysLeft === undefined) return 'Jatuh tempo tidak diketahui'
    const absDays = Math.abs(reminder.daysLeft)
    if (reminder.status === 'overdue') return `${absDays} hari terlambat`
    return `${reminder.daysLeft} hari lagi`
  }

  const chipLabel = (reminder: ReminderDueDateItem) => {
    if (reminder.status === 'pending') return reminder.approvalLabel || 'Belum disetujui'
    return formatDaysLabel(reminder)
  }

  const chipColor = (reminder: ReminderDueDateItem) => {
    if (reminder.status === 'pending') return 'default'
    if (reminder.status === 'overdue') return 'error'
    return 'warning'
  }

  const statusLabel = (reminder: ReminderDueDateItem) => {
    if (reminder.status === 'pending') return reminder.approvalLabel || 'Belum disetujui'
    if (reminder.status === 'overdue') return 'OVERDUE'
    return 'UPCOMING'
  }

  const accentStyles = (reminder: ReminderDueDateItem) => {
    if (reminder.status === 'overdue') {
      return { borderColor: 'error.200', shadow: 'rgba(211, 47, 47, 0.18)' }
    }
    if (reminder.status === 'pending') {
      return { borderColor: 'grey.200', shadow: 'rgba(0, 0, 0, 0.06)' }
    }
    return { borderColor: 'warning.200', shadow: 'rgba(251, 140, 0, 0.15)' }
  }

  const visibleReminders = React.useMemo(
    () => (reminders || []).filter((r) => (showPending ? true : r.status !== 'pending')),
    [reminders, showPending]
  )

  const safeItemsPerPage = itemsPerPage > 0 ? itemsPerPage : 5
  const [page, setPage] = React.useState(1)
  const pageCount = Math.ceil(visibleReminders.length / safeItemsPerPage) || 1
  React.useEffect(() => {
    setPage(1)
  }, [visibleReminders.length, safeItemsPerPage])
  const sliceStart = (page - 1) * safeItemsPerPage
  const paginatedReminders = visibleReminders.slice(sliceStart, sliceStart + safeItemsPerPage)

  return (
    <Card sx={{ borderRadius: 3, mb: 4 }}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {visibleReminders.length} pengingat aktif
          </Typography>
        </Stack>

        {visibleReminders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography>{emptyMessage}</Typography>
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {paginatedReminders.map((reminder) => {
              const accent = accentStyles(reminder)
              return (
                <Box
                  key={reminder.id}
                  sx={{
                    borderRadius: 2,
                    px: { xs: 2.5, md: 3 },
                    py: { xs: 2, md: 2.5 },
                    border: '1px solid',
                    borderColor: accent.borderColor,
                    backgroundColor: 'common.white',
                    boxShadow: `0 12px 30px ${accent.shadow}`
                  }}
                >
                  <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems={{ lg: 'center' }}>
                    <Box sx={{ flex: '1 1 40%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {reminder.borrowerName}
                        {reminder.entitasLabel ? ` - ${reminder.entitasLabel}` : ''}
                      </Typography>
                      {reminder.loanId && (
                        <Typography variant="body2" color="text.secondary">
                          ID Peminjaman:{' '}
                          <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {reminder.loanId}
                          </Typography>
                        </Typography>
                      )}

                      {reminder.loanId && (
                        <Box sx={{ mt: 1 }}>
                          <Link href={`/peminjaman/${reminder.loanId}`} style={{ textDecoration: 'none' }}>
                            <Typography
                              component="span"
                              variant="body2"
                              sx={{ fontWeight: 600, color: 'primary.main' }}
                            >
                              Details
                            </Typography>
                          </Link>
                        </Box>
                      )}
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' }, borderColor: 'grey.200' }} />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ flex: '1 1 35%' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Tanggal Peminjaman
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {reminder.outDate ? formatDate(reminder.outDate) : '-'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Due Date Pengembalian
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {reminder.dueDate ? formatDate(reminder.dueDate) : '-'}
                        </Typography>
                      </Box>
                      {reminder.status === 'overdue' && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total Denda
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                            {typeof reminder.totalFine === 'number'
                              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(reminder.totalFine)
                              : '-'}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' }, borderColor: 'grey.200' }} />

                    <Box sx={{ textAlign: { xs: 'left', lg: 'right' }, minWidth: { lg: 180 } }}>
                      {reminder.status === 'pending' ? (
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {chipLabel(reminder)}
                        </Typography>
                      ) : (
                        <Chip
                          label={chipLabel(reminder)}
                          color={chipColor(reminder) as any}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  </Stack>
                </Box>
              )
            })}
            {pageCount > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination
                  count={pageCount}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  size="small"
                  siblingCount={0}
                />
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

export default ReminderDueDateSection
