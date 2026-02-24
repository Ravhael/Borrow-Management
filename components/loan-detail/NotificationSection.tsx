import React, { useState } from 'react'
import {
  Typography,
  Box,
  Avatar,
  Card,
  CardContent,
  Chip,
  Stack,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Cancel as CancelIcon,
  Done as DoneIcon,
  Undo as UndoIcon,
} from '@mui/icons-material'
import { LoanData } from '../../types/loanDetail'
import { getLoanStatus, formatDate } from '../../utils/loanHelpers'
import { LOAN_LIFECYCLE, WAREHOUSE_STATUS } from '../../types/loanStatus'

interface NotificationSectionProps {
  loan: LoanData
}

const NotificationSection: React.FC<NotificationSectionProps> = ({ loan }) => {
  const renderEmailStatus = (notifications: any, title: string, filterRoles?: (role: string) => boolean) => (
    <Stack spacing={2}>
      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2 }}>
        {title}
      </Typography>
      {Object.entries(notifications).map(([entity, roles]: [string, any]) => (
        <Box key={entity} sx={{ pl: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BusinessIcon sx={{ mr: 1, color: '#666', fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#424242' }}>
              {entity}
            </Typography>
          </Box>
          <Stack spacing={1}>
            {Object.entries(roles).map(([role, status]: [string, any]) => {
              if (filterRoles && !filterRoles(role)) return null
              return (
                <Card
                  key={role}
                  elevation={0}
                  sx={{
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 1,
                    bgcolor: status.sent ? 'rgba(76, 175, 80, 0.02)' : 'rgba(255, 152, 0, 0.02)',
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1.5, bgcolor: 'rgba(21, 101, 192, 0.1)' }}>
                          <PersonIcon sx={{ fontSize: '0.875rem', color: '#1565c0' }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                            {role}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            {status.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        {status.sent ? (
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
                              {status.sentAt && (
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#666', fontSize: '0.7rem' }}>
                                  {formatDate(status.sentAt)}
                                </Typography>
                              )}
                            </Box>
                          </>
                        ) : (
                          <>
                            <ScheduleIcon sx={{ mr: 1, color: '#ff9800', fontSize: '1.25rem' }} />
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
            })}
          </Stack>
        </Box>
      ))}
    </Stack>
  )

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submit':
        return <SendIcon />
      case 'rejected':
        return <CancelIcon />
      case 'approved':
        return <DoneIcon />
      case 'returned':
        return <UndoIcon />
      default:
        return <EmailIcon />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'submit':
        return '#1565c0'
      case 'rejected':
        return '#d32f2f'
      case 'approved':
        return '#2e7d32'
      case 'returned':
        return '#ed6c02'
      default:
        return '#1565c0'
    }
  }

  return (
    <Box sx={{ height: '100%' }}>
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
        {/* Status Notifikasi Email */}
        <CardContent sx={{ p: 3, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', mr: 2, width: 32, height: 32 }}>
              <EmailIcon sx={{ color: '#1565c0', fontSize: '1rem' }} />
            </Avatar>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              Status Notifikasi Email
            </Typography>
          </Box>

          <Stack spacing={2}>
            {/* Submit Notifications */}
            <Accordion
              sx={{
                bgcolor: 'rgba(255,255,255,0.8)',
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: 'none',
                border: '1px solid rgba(0,0,0,0.06)',
                '&:not(:last-child)': { mb: 1 },
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
                <Avatar sx={{ width: 28, height: 28, mr: 2, bgcolor: 'rgba(21, 101, 192, 0.1)' }}>
                  <SendIcon sx={{ fontSize: '1rem', color: '#1565c0' }} />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  Notifikasi Pengajuan (Marketing, Admin & Peminjam)
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {loan.submitNotifications ? (
                  <>
                    {loan.company && loan.company.length > 0 && (
                      renderEmailStatus(
                        loan.submitNotifications.companies,
                        'Company:',
                        (role) => role !== 'Warehouse'
                      )
                    )}
                    {loan.borrowerEmail && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
                          Email Peminjam:
                        </Typography>
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
                                  label="Penerima Notifikasi"
                                  color="info"
                                  size="small"
                                  variant="filled"
                                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                />
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    )}
                  </>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 1 }}>
                    Belum ada informasi status pengiriman email
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Rejection Notifications */}
            {getLoanStatus(loan) === LOAN_LIFECYCLE.REJECTED && (
              <Accordion
                sx={{
                  bgcolor: 'rgba(255,255,255,0.8)',
                  borderRadius: 2,
                  '&:before': { display: 'none' },
                  boxShadow: 'none',
                  border: '1px solid rgba(0,0,0,0.06)',
                  '&:not(:last-child)': { mb: 1 },
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
                  <Avatar sx={{ width: 28, height: 28, mr: 2, bgcolor: 'rgba(211, 47, 47, 0.1)' }}>
                    <CancelIcon sx={{ fontSize: '1rem', color: '#d32f2f' }} />
                  </Avatar>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    Notifikasi Pengajuan Ditolak
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  {loan.approvalNotifications ? (
                    <>
                      {renderEmailStatus({ [loan.entitasId]: loan.approvalNotifications.entitas[loan.entitasId] }, `Entitas: ${loan.entitasId}`)}
                      {loan.company && loan.company.length > 0 && (
                        renderEmailStatus(
                          loan.approvalNotifications.companies,
                          'Company (Semua Role kecuali Warehouse):',
                          (role) => role !== 'Warehouse'
                        )
                      )}
                    </>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 1 }}>
                      Belum ada informasi status pengiriman email
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Approval Notifications */}
            {getLoanStatus(loan) === LOAN_LIFECYCLE.APPROVED && (
              <Accordion
                sx={{
                  bgcolor: 'rgba(255,255,255,0.8)',
                  borderRadius: 2,
                  '&:before': { display: 'none' },
                  boxShadow: 'none',
                  border: '1px solid rgba(0,0,0,0.06)',
                  '&:not(:last-child)': { mb: 1 },
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
                  <Avatar sx={{ width: 28, height: 28, mr: 2, bgcolor: 'rgba(46, 125, 50, 0.1)' }}>
                    <DoneIcon sx={{ fontSize: '1rem', color: '#2e7d32' }} />
                  </Avatar>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    Notifikasi Setelah Approval (Email Lengkap)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  {loan.approvalNotifications ? (
                    <>
                      {renderEmailStatus({ [loan.entitasId]: loan.approvalNotifications.entitas[loan.entitasId] }, `Entitas: ${loan.entitasId}`)}
                      {loan.company && loan.company.length > 0 && (
                        renderEmailStatus(loan.approvalNotifications.companies, 'Company (Semua Role):')
                      )}
                      {loan.borrowerEmail && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
                            Email Peminjam:
                          </Typography>
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
                                    label="Penerima Notifikasi"
                                    color="info"
                                    size="small"
                                    variant="filled"
                                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                  />
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 1 }}>
                      Belum ada informasi status pengiriman email
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Return Notifications */}
            {loan.warehouseStatus?.status === WAREHOUSE_STATUS.RETURNED && (
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
                  <Avatar sx={{ width: 28, height: 28, mr: 2, bgcolor: 'rgba(237, 108, 2, 0.1)' }}>
                    <UndoIcon sx={{ fontSize: '1rem', color: '#ed6c02' }} />
                  </Avatar>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    Notifikasi Barang Sudah Dikembalikan
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  {loan.returnNotifications ? (
                    <>
                      {renderEmailStatus({ [loan.entitasId]: loan.returnNotifications.entitas[loan.entitasId] }, `Entitas: ${loan.entitasId} (Semua Role)`)}
                      {loan.company && loan.company.length > 0 && (
                        renderEmailStatus(loan.returnNotifications.companies, 'Company (Semua Role):')
                      )}
                    </>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 1 }}>
                      Belum ada informasi status pengiriman email
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default NotificationSection