import React, { useEffect, useState } from 'react'
import {
  Typography,
  Box,
  Avatar,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material'
import {
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab'
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
} from '@mui/icons-material'
import { LoanData } from '../../../types/loanDetail'
import { getTimelineColor, formatDate } from '../utils/timelineHelpers'
import { getEffectiveReturnDate } from '../../../utils/loanHelpers'
import { WAREHOUSE_STATUS } from '../../../types/loanStatus'
// Company list will be fetched at runtime from /api/company (DB-driven)

// (consolidated)

// entitas list should be fetched from API/DB at runtime

const getTimelineIcon = (type: string) => {
  switch (type) {
    case 'reminder': return <NotificationsIcon />
    default: return <NotificationsIcon />
  }
}

// Helper function to check reminder status for a specific period
const getReminderStatus = (loan: LoanData, days: number) => {
  const reminderKey = `${loan.id}_reminder_${days}_days`
  // modern format stores per-period notification details under reminderStatus[reminderKey].notifications
  // keep backward-compat fallback to old reminderNotifications shape while migrating
  const reminderStatusEntry = (loan.reminderStatus as any)?.[reminderKey] as any | undefined
  const notificationBlock = reminderStatusEntry?.notifications

  // If there's a reminderStatus object with simple sent flag but no detailed notifications, use it
  if (!notificationBlock && reminderStatusEntry && typeof reminderStatusEntry.sent === 'boolean') {
    return { sent: reminderStatusEntry.sent, sentAt: reminderStatusEntry.sentAt || null }
  }

  if (!notificationBlock) {
    return { sent: false, sentAt: null }
  }

  // Check if it's the old format (simple sent/sentAt/type)
  const reminderDataAny = notificationBlock as any
  if (reminderDataAny.type && typeof reminderDataAny.sent === 'boolean') {
    return { sent: reminderDataAny.sent, sentAt: reminderDataAny.sentAt || null }
  }

  // New format: check if any email was sent in entitas, companies, or borrower
  let sent = false
  let sentAt: string | null = null

  // Check entitas emails
  if (notificationBlock.entitas) {
    Object.values(notificationBlock.entitas).forEach((entitasData: any) => {
      Object.values(entitasData).forEach((roleData: any) => {
        if (roleData.sent && (!sentAt || new Date(roleData.sentAt || '') > new Date(sentAt))) {
          sent = true
          sentAt = roleData.sentAt || sentAt
        }
      })
    })
  }

  // Check company emails
  if (notificationBlock.companies) {
    Object.values(notificationBlock.companies).forEach((companyData: any) => {
      Object.values(companyData).forEach((roleData: any) => {
        if (roleData.sent && (!sentAt || new Date(roleData.sentAt || '') > new Date(sentAt))) {
          sent = true
          sentAt = roleData.sentAt || sentAt
        }
      })
    })
  }

  // Check borrower email
  if (notificationBlock.borrower?.sent && (!sentAt || new Date(notificationBlock.borrower.sentAt || '') > new Date(sentAt))) {
    sent = true
    sentAt = notificationBlock.borrower.sentAt || sentAt
  }

  return { sent, sentAt }
}

interface ReminderNotificationsProps {
  loan: LoanData
}

const ReminderNotifications: React.FC<ReminderNotificationsProps> = ({ loan }) => {
  const [entitasOptions, setEntitasOptions] = useState<any[]>([])
  const [companyOptions, setCompanyOptions] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/entitas')
        if (!res.ok) return
        const data = await res.json()
        if (mounted && Array.isArray(data)) setEntitasOptions(data)
      } catch (err) {
        console.warn('Failed to load entitas', err)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/company')
        if (!res.ok) return
        const data = await res.json()
        if (mounted && Array.isArray(data)) setCompanyOptions(data)
      } catch (err) {
        console.warn('Failed to load companies', err)
      }
    }
    load()
    return () => { mounted = false }
  }, [])
  if (loan.warehouseStatus?.status !== WAREHOUSE_STATUS.BORROWED) {
    return null
  }

  return (
    <TimelineItem>
      <TimelineOppositeContent sx={{ m: 'auto 0' }}>
        <Typography variant="body2" color="text.secondary">
          Status Reminder
        </Typography>
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineDot sx={{ bgcolor: getTimelineColor('reminder') }}>
          {getTimelineIcon('reminder')}
        </TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent sx={{ py: '12px', px: 2 }}>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'rgba(76, 175, 80, 0.04)',
            border: '1px solid rgba(76, 175, 80, 0.2)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <NotificationsIcon sx={{ mr: 1, color: getTimelineColor('reminder') }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Status Reminder Pengembalian
            </Typography>
          </Box>

          {/* Status Reminder */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2 }}>
              Status Reminder
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { key: '7_days', label: '7 Hari Sebelum', days: 7 },
                { key: '3_days', label: '3 Hari Sebelum', days: 3 },
                { key: '1_day', label: '1 Hari Sebelum', days: 1 },
                { key: '0_days', label: 'Hari Ini', days: 0 }
              ].map(({ key, label, days }) => {
                const reminderStatus = getReminderStatus(loan, days)

                return (
                  <Box
                    key={key}
                    sx={{
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: 1,
                      bgcolor: reminderStatus.sent ? 'rgba(76, 175, 80, 0.02)' : 'rgba(255, 152, 0, 0.02)',
                      p: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mr: 2 }}>
                          {label}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {reminderStatus.sent ? (
                          <>
                            <CheckCircleIcon sx={{ mr: 1, color: '#4caf50', fontSize: '1.25rem' }} />
                            <Box>
                              <Chip
                                label="Terkirim"
                                color="success"
                                size="small"
                                variant="filled"
                                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                              />
                              {reminderStatus.sentAt && (
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#666', fontSize: '0.7rem' }}>
                                  {new Date(reminderStatus.sentAt).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                              )}
                            </Box>
                          </>
                        ) : (
                          <>
                            <ScheduleIcon sx={{ mr: 1, color: '#ff9800', fontSize: '1.25rem' }} />
                            <Chip
                              label="Belum Dikirim"
                              color="warning"
                              size="small"
                              variant="filled"
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Box>

          {/* Status Notifikasi Email per Periode */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2 }}>
              Status Notifikasi Email per Periode
            </Typography>

            {[
              { key: '7_days', label: '7 Hari Sebelum', days: 7 },
              { key: '3_days', label: '3 Hari Sebelum', days: 3 },
              { key: '1_day', label: '1 Hari Sebelum', days: 1 },
              { key: '0_days', label: 'Hari Ini', days: 0 }
            ].map(({ key, label, days }) => {
              const reminderKey = `${loan.id}_reminder_${days}_days`
                          const reminderData = loan.reminderStatus?.[reminderKey]?.notifications

              return (
                <Accordion
                  key={key}
                  sx={{
                    mb: 1,
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '8px !important',
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: 48,
                      '&.Mui-expanded': { minHeight: 48 },
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        '&.Mui-expanded': { margin: '12px 0' }
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {label}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2, pt: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Company Emails */}
                      {reminderData?.companies && loan.company && loan.company.length > 0 ? (
                        loan.company.map(companyName => {
                          const company = companyOptions.find(c => c.value === companyName)
                          if (!company || !reminderData.companies[companyName]) return null

                          return Object.entries(reminderData.companies[companyName]).map(([role, emailData]) => {
                            const emailKey = `${reminderKey}_company_${companyName}_${role}`

                            return (
                              <Box
                                key={emailKey}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 1.5,
                                  borderRadius: 1,
                                  bgcolor: emailData.sent ? 'rgba(76, 175, 80, 0.02)' : 'rgba(255, 152, 0, 0.02)',
                                  border: '1px solid rgba(0,0,0,0.06)',
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      bgcolor: emailData.sent ? '#4caf50' : '#ff9800',
                                      mr: 2,
                                      fontSize: '0.875rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    {companyName.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                      {companyName} - {role}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#666' }}>
                                      {emailData.email}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {emailData.sent ? (
                                    <>
                                      <CheckCircleIcon sx={{ mr: 1, color: '#4caf50', fontSize: '1.25rem' }} />
                                      <Box>
                                        <Chip
                                          label="Terkirim"
                                          color="success"
                                          size="small"
                                          variant="filled"
                                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                        />
                                        {emailData.sentAt && (
                                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#666', fontSize: '0.7rem' }}>
                                            {new Date(emailData.sentAt).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </Typography>
                                        )}
                                      </Box>
                                    </>
                                  ) : (
                                    <>
                                      <ScheduleIcon sx={{ mr: 1, color: '#ff9800', fontSize: '1.25rem' }} />
                                      <Chip
                                        label="Belum Dikirim"
                                        color="warning"
                                        size="small"
                                        variant="filled"
                                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                      />
                                    </>
                                  )}
                                </Box>
                              </Box>
                            )
                          })
                        })
                      ) : (
                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                          Tidak ada email perusahaan untuk periode ini
                        </Typography>
                      )}

                      {/* Entity Emails */}
                      {reminderData?.entitas && reminderData.entitas[loan.entitasId] ? (
                        Object.entries(reminderData.entitas[loan.entitasId]).map(([role, emailData]) => {
                          const emailKey = `${reminderKey}_entity_${loan.entitasId}_${role}`

                          return (
                            <Box
                              key={emailKey}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 1.5,
                                borderRadius: 1,
                                bgcolor: emailData.sent ? 'rgba(76, 175, 80, 0.02)' : 'rgba(255, 152, 0, 0.02)',
                                border: '1px solid rgba(0,0,0,0.06)',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: emailData.sent ? '#4caf50' : '#ff9800',
                                    mr: 2,
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                  }}
                                >
                                  {role.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                    {loan.entitasId} - {role}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#666' }}>
                                    {emailData.email}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {emailData.sent ? (
                                  <>
                                    <CheckCircleIcon sx={{ mr: 1, color: '#4caf50', fontSize: '1.25rem' }} />
                                    <Box>
                                      <Chip
                                        label="Terkirim"
                                        color="success"
                                        size="small"
                                        variant="filled"
                                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                      />
                                      {emailData.sentAt && (
                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#666', fontSize: '0.7rem' }}>
                                          {new Date(emailData.sentAt).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </Typography>
                                      )}
                                    </Box>
                                  </>
                                ) : (
                                  <>
                                    <ScheduleIcon sx={{ mr: 1, color: '#ff9800', fontSize: '1.25rem' }} />
                                    <Chip
                                      label="Belum Dikirim"
                                      color="warning"
                                      size="small"
                                      variant="filled"
                                      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                    />
                                  </>
                                )}
                              </Box>
                            </Box>
                          )
                        })
                      ) : (
                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                          Tidak ada email entitas untuk periode ini
                        </Typography>
                      )}

                      {/* Borrower Email */}
                      {reminderData?.borrower ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: reminderData.borrower.sent ? 'rgba(21, 101, 192, 0.02)' : 'rgba(255, 152, 0, 0.02)',
                            border: '1px solid rgba(0,0,0,0.06)',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: reminderData.borrower.sent ? '#1565c0' : '#ff9800',
                                mr: 2,
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}
                            >
                              {loan.borrowerName?.charAt(0).toUpperCase() || 'P'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                {loan.borrowerName || 'Peminjam'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                {reminderData.borrower.email}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {reminderData.borrower.sent ? (
                              <>
                                <CheckCircleIcon sx={{ mr: 1, color: '#4caf50', fontSize: '1.25rem' }} />
                                <Box>
                                  <Chip
                                    label="Terkirim"
                                    color="success"
                                    size="small"
                                    variant="filled"
                                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                  />
                                  {reminderData.borrower.sentAt && (
                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#666', fontSize: '0.7rem' }}>
                                      {new Date(reminderData.borrower.sentAt).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </Typography>
                                  )}
                                </Box>
                              </>
                            ) : (
                              <>
                                <ScheduleIcon sx={{ mr: 1, color: '#ff9800', fontSize: '1.25rem' }} />
                                <Chip
                                  label="Belum Dikirim"
                                  color="warning"
                                  size="small"
                                  variant="filled"
                                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                />
                              </>
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                          Tidak ada email peminjam untuk periode ini
                        </Typography>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )
            })}
          </Box>

          <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', pt: 2 }}>
            <Alert severity="info" sx={{ borderRadius: 1 }}>
              <Typography variant="body2">
                Reminder otomatis akan dikirim berdasarkan tanggal pengembalian yang dijadwalkan ({(() => { const eff = getEffectiveReturnDate(loan as any); return eff ? formatDate(eff) : formatDate(loan.returnDate) })()}).
                Status di atas menunjukkan apakah reminder sudah dikirim atau belum.
              </Typography>
            </Alert>
          </Box>
        </Paper>
      </TimelineContent>
    </TimelineItem>
  )
}

export default ReminderNotifications