import React from 'react'
import { Typography, Box, Chip, Paper, Stack, Alert } from '@mui/material'
import { TimelineItem, TimelineOppositeContent, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab'
import { ArrowBack as ReturnIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material'
import { LoanData } from '../../../types/loanDetail'
import { getTimelineColor, formatDate } from '../utils/timelineHelpers'

interface ExtensionHistoryProps {
  loan: LoanData
}

const ExtensionHistory: React.FC<ExtensionHistoryProps> = ({ loan }) => {
  const extAll: any = loan.extendStatus as any
  const entries: any[] = Array.isArray(extAll) ? extAll : (extAll ? [extAll] : [])
  if (!entries || entries.length === 0) return null

  return (
    <>
      {entries.map((e: any, idx: number) => {
        const requested = e?.requestAt || e?.requestAt === 0 ? e.requestAt : null
        const processed = e?.approveAt || e?.approveAt === 0 ? e.approveAt : null
        const statusLabel = (e?.approveStatus as string) || (e?.reqStatus as string) || 'Menunggu'

        // choose a display time — prefer requestAt for request items
        const timeLabel = requested ? formatDate(String(requested)) : (processed ? formatDate(String(processed)) : 'Dalam Proses')

        const isApproved = String(statusLabel || '').toLowerCase().includes('setujui')

        return (
          <TimelineItem key={`extend-${idx}`}>
            <TimelineOppositeContent sx={{ m: 'auto 0' }}>
              <Typography variant="body2" color="text.secondary">{timeLabel}</Typography>
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot sx={{ bgcolor: getTimelineColor('extension') }}>
                {isApproved ? <CheckCircleIcon /> : <ReturnIcon />}
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>

            <TimelineContent sx={{ py: '12px', px: 2 }}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(33, 150, 243, 0.04)', border: '1px solid rgba(33,150,243,0.16)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ReturnIcon sx={{ mr: 1, color: getTimelineColor('extension') }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Permintaan Perpanjangan</Typography>
                </Box>

                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{e?.requestBy ?? '—'}</Typography>
                    <Chip label={statusLabel || 'Menunggu'} size="small" sx={{ fontWeight: 700 }} />
                  </Box>

                  <Typography variant="body2" sx={{ color: '#666' }}>{e?.requestedReturnDate ? `Tanggal kembali yang diminta: ${new Date(String(e.requestedReturnDate)).toLocaleDateString('id-ID')}` : 'Tanggal kembali yang diminta: —'}</Typography>

                  {e?.note && (<Alert severity="info"><Typography variant="body2">{e.note}</Typography></Alert>)}

                  {e?.approveStatus && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666' }}>Diproses: <strong>{e?.approveBy ?? '—'}</strong>{e?.approveAt ? ` • ${formatDate(String(e.approveAt))}` : ''}</Typography>
                      {e?.approveNote && (<Alert severity={String(e?.approveStatus || '').toLowerCase().includes('setujui') ? 'success' : 'error'} sx={{ mt: 1 }}><Typography variant="body2"><strong>Catatan:</strong> {e.approveNote}</Typography></Alert>)}
                    </Box>
                  )}
                </Stack>
              </Paper>
            </TimelineContent>
          </TimelineItem>
        )
      })}
    </>
  )
}

export default ExtensionHistory
