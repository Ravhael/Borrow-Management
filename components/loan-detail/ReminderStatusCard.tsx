import React, { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Divider,
  Zoom,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material'
import { LoanData } from '../../types/loanDetail'
import { formatDate, getEffectiveReturnDate } from '../../utils/loanHelpers'
// company list will be loaded from the DB via /api/company at runtime
import { useCallback } from 'react'

// fetch entitas options at runtime from DB via API

interface ReminderStatusCardProps {
  loan: LoanData
}

const ReminderStatusCard: React.FC<ReminderStatusCardProps> = ({ loan }) => {
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

  // load companies from API
  const loadCompanies = useCallback(async () => {
    try {
      const res = await fetch('/api/company')
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) setCompanyOptions(data)
    } catch (err) {
      console.warn('Failed to load companies', err)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    loadCompanies()
    return () => { mounted = false }
  }, [loadCompanies])
  return (
    <Zoom in={true} style={{ transitionDelay: '800ms' }}>
      <Card
        elevation={1}
        sx={{
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.08)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardContent sx={{ p: 3, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', mr: 2, width: 32, height: 32 }}>
              <NotificationsIcon sx={{ color: '#4caf50', fontSize: '1rem' }} />
            </Avatar>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              Status Reminder Pengembalian
            </Typography>
          </Box>

          {/* Status Reminder */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2 }}>
              Status Reminder
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {[
                { key: '7_days', label: '7 Hari Sebelum', days: 7 },
                { key: '3_days', label: '3 Hari Sebelum', days: 3 },
                { key: '1_day', label: '1 Hari Sebelum', days: 1 },
                { key: '0_days', label: 'Hari Ini', days: 0 }
              ].map(({ key, label, days }) => {
                const reminderKey = `${loan.id}_reminder_${days}_days`
                const reminder = loan.reminderStatus?.[reminderKey]

                return (
                  <Card
                    key={key}
                    elevation={0}
                    sx={{
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: 1,
                      bgcolor: reminder?.sent ? 'rgba(76, 175, 80, 0.02)' : 'rgba(255, 152, 0, 0.02)',
                      p: 2,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {label}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      {reminder?.sent ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Terkirim"
                          color="success"
                          size="small"
                          variant="filled"
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      ) : (
                        <Chip
                          icon={<AccessTimeIcon />}
                          label="Belum Dikirim"
                          color="warning"
                          size="small"
                          variant="filled"
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>

                    {reminder?.sent && reminder.sentAt && (
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                        {new Date(reminder.sentAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    )}
                  </Card>
                )
              })}
            </Box>
          </Box>

          {/* Status Notifikasi Email */}
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2 }}>
              Status Notifikasi Email
            </Typography>

            {/* Company Emails */}
            <Accordion
              sx={{
                bgcolor: 'rgba(255,255,255,0.8)',
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: 'none',
                border: '1px solid rgba(0,0,0,0.06)',
                mb: 2,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': { alignItems: 'center' },
                  borderRadius: 2,
                  minHeight: 48,
                }}
              >
                <Avatar sx={{ width: 28, height: 28, mr: 2, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                  <BusinessIcon sx={{ fontSize: '1rem', color: '#4caf50' }} />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  Email Perusahaan
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {loan.company.map(companyName => {
                    const company = companyOptions.find(c => c.value === companyName)
                    if (!company) return null

                    return Object.entries(company.emails).map(([role, email]) => {
                      const emailKey = `${loan.id}_email_${companyName}_${role}_${email}`.toLowerCase().replace(/[^a-z0-9_]/g, '_')

                      // Check if this email was sent for any reminder period
                      const reminderPeriods = ['7_days', '3_days', '1_days', '0_days']
                      let emailSent = false
                      let sentAt = undefined

                      for (const period of reminderPeriods) {
                        const reminderKey = `${loan.id}_reminder_${period}`
                        // Prefer reminderStatus notifications, fallback to old reminderNotifications during migration
                        const reminderNotification = loan.reminderStatus?.[reminderKey]?.notifications?.companies?.[companyName]?.[role]
                        if (reminderNotification?.sent) {
                          emailSent = true
                          sentAt = reminderNotification.sentAt
                          break
                        }
                      }

                      return (
                        <Card
                          key={emailKey}
                          elevation={0}
                          sx={{
                            border: '1px solid rgba(0,0,0,0.06)',
                            borderRadius: 1,
                            bgcolor: emailSent ? 'rgba(76, 175, 80, 0.02)' : 'rgba(255, 152, 0, 0.02)',
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <Avatar sx={{ width: 24, height: 24, mr: 1.5, bgcolor: 'rgba(21, 101, 192, 0.1)' }}>
                                  <BusinessIcon sx={{ fontSize: '0.875rem', color: '#1565c0' }} />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                                    {companyName} - {role}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#666' }}>
                                    {String(email)}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                {emailSent ? (
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
                                      {sentAt && (
                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#666', fontSize: '0.7rem' }}>
                                          {formatDate(sentAt as unknown as string)}
                                        </Typography>
                                      )}
                                    </Box>
                                  </>
                                ) : (
                                  <>
                                    <AccessTimeIcon sx={{ mr: 1, color: '#ff9800', fontSize: '1.25rem' }} />
                                    <Chip
                                      label="Menunggu"
                                      color="warning"
                                      size="small"
                                      variant="filled"
                                      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                    />
                                  </>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      )
                    })
                  })}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Entitas Emails */}
            <Accordion
              sx={{
                bgcolor: 'rgba(255,255,255,0.8)',
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: 'none',
                border: '1px solid rgba(0,0,0,0.06)',
                mb: 2,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': { alignItems: 'center' },
                  borderRadius: 2,
                  minHeight: 48,
                }}
              >
                <Avatar sx={{ width: 28, height: 28, mr: 2, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                  <GroupIcon sx={{ fontSize: '1rem', color: '#4caf50' }} />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  Email Entitas ({loan.entitasId})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {(() => {
                    const entitas = entitasOptions.find(e => String(e.value) === String(loan.entitasId))
                    if (!entitas) return <Typography variant="body2" color="text.secondary">Data entitas tidak ditemukan</Typography>

                    return Object.entries(entitas.emails).map(([role, email]) => {
                      const emailKey = `${loan.id}_email_entitas_${loan.entitasId}_${role}_${email}`.toLowerCase().replace(/[^a-z0-9_]/g, '_')

                      // Check if this email was sent for any reminder period
                      const reminderPeriods = ['7_days', '3_days', '1_days', '0_days']
                      let emailSent = false
                      let sentAt = undefined

                      for (const period of reminderPeriods) {
                        const reminderKey = `${loan.id}_reminder_${period}`
                        // Prefer reminderStatus notifications, fallback to old reminderNotifications during migration
                        const reminderNotification = loan.reminderStatus?.[reminderKey]?.notifications?.entitas?.[loan.entitasId]?.[role]
                        if (reminderNotification?.sent) {
                          emailSent = true
                          sentAt = reminderNotification.sentAt
                          break
                        }
                      }

                      return (
                        <Card
                          key={emailKey}
                          elevation={0}
                          sx={{
                            border: '1px solid rgba(0,0,0,0.06)',
                            borderRadius: 1,
                            bgcolor: emailSent ? 'rgba(76, 175, 80, 0.02)' : 'rgba(255, 152, 0, 0.02)',
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <Avatar sx={{ width: 24, height: 24, mr: 1.5, bgcolor: 'rgba(21, 101, 192, 0.1)' }}>
                                  <GroupIcon sx={{ fontSize: '0.875rem', color: '#1565c0' }} />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                                    Entitas {loan.entitasId} - {role}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#666' }}>
                                    {String(email)}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                {emailSent ? (
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
                                      {sentAt && (
                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#666', fontSize: '0.7rem' }}>
                                          {formatDate(sentAt as unknown as string)}
                                        </Typography>
                                      )}
                                    </Box>
                                  </>
                                ) : (
                                  <>
                                    <AccessTimeIcon sx={{ mr: 1, color: '#ff9800', fontSize: '1.25rem' }} />
                                    <Chip
                                      label="Menunggu"
                                      color="warning"
                                      size="small"
                                      variant="filled"
                                      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                    />
                                  </>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      )
                    })
                  })()}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Borrower Email */}
            {loan.borrowerEmail && (
              <Accordion
                sx={{
                  bgcolor: 'rgba(255,255,255,0.8)',
                  borderRadius: 2,
                  '&:before': { display: 'none' },
                  boxShadow: 'none',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    '& .MuiAccordionSummary-content': { alignItems: 'center' },
                    borderRadius: 2,
                    minHeight: 48,
                  }}
                >
                  <Avatar sx={{ width: 28, height: 28, mr: 2, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                    <EmailIcon sx={{ fontSize: '1rem', color: '#4caf50' }} />
                  </Avatar>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    Email Peminjam
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Card
                    elevation={0}
                    sx={{
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: 1,
                      bgcolor: 'rgba(21, 101, 192, 0.02)',
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1.5, bgcolor: 'rgba(21, 101, 192, 0.1)' }}>
                            <EmailIcon sx={{ fontSize: '0.875rem', color: '#1565c0' }} />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                              {loan.borrowerName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              {loan.borrowerEmail}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                          <EmailIcon sx={{ mr: 1, color: '#1565c0', fontSize: '1.25rem' }} />
                          <Chip
                            label="Penerima Reminder"
                            color="info"
                            size="small"
                            variant="filled"
                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>

          <Alert severity="info" sx={{ mt: 3, borderRadius: 1 }}>
              <Typography variant="body2">
              Reminder otomatis akan dikirim berdasarkan tanggal pengembalian yang dijadwalkan ({(() => { const eff = getEffectiveReturnDate(loan as any); return eff ? formatDate(eff) : formatDate(loan.returnDate) })()}).
              Status di atas menunjukkan apakah reminder sudah dikirim atau belum.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Zoom>
  )
}

export default ReminderStatusCard
