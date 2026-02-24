import React from 'react'
import Image from 'next/image'
import {
  Typography,
  Box,
  Chip,
  Paper,
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
  Warehouse as WarehouseIcon,
} from '@mui/icons-material'
import { LoanData } from '../../../types/loanDetail'
import { getStatusColor, getTimelineColor, formatDate } from '../utils/timelineHelpers'
import { WAREHOUSE_STATUS } from '../../../types/loanStatus'

const getTimelineIcon = (type: string) => {
  switch (type) {
    case 'warehouse': return <WarehouseIcon />
    default: return <WarehouseIcon />
  }
}

interface WarehouseStatusProps {
  loan: LoanData
}

const WarehouseStatus: React.FC<WarehouseStatusProps> = ({ loan }) => {
  const ws = loan.warehouseStatus || null
  const rs = loan.returnStatus || null

  if (!ws && !rs) return null

  const items: React.ReactNode[] = []

  // Add processed / borrowed event when processedAt is present
  if (ws?.processedAt) {
    items.push(
      <TimelineItem key="warehouse-processed">
        <TimelineOppositeContent sx={{ m: 'auto 0' }}>
          <Typography variant="body2" color="text.secondary">
            {formatDate(ws.processedAt)}
          </Typography>
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot sx={{ bgcolor: getTimelineColor('warehouse') }}>
            {getTimelineIcon('warehouse')}
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent sx={{ py: '12px', px: 2 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(156, 39, 176, 0.03)', border: '1px solid rgba(156, 39, 176, 0.12)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarehouseIcon sx={{ mr: 1, color: getTimelineColor('warehouse') }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Proses Gudang / Dipinjam
              </Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>Status:</Typography>
                {/* If a return exists, prefer the previousStatus for the historic "processed" event label */}
                {(() => {
                  const processedLabel = rs?.previousStatus ?? ws.status ?? WAREHOUSE_STATUS.BORROWED
                  return <Chip label={processedLabel} color={getStatusColor(processedLabel) as any} variant="filled" />
                })()}
              </Box>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>Diproses oleh: {ws.processedBy}</Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>Pada: {formatDate(ws.processedAt)}</Typography>
              </Box>
              {ws.note && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2"><strong>Catatan:</strong> {ws.note}</Typography>
                </Alert>
              )}
            </Box>
          </Paper>
        </TimelineContent>
      </TimelineItem>
    )
  }

  // Add returned event (use returnStatus if present for photoResults/notes)
  if (rs?.status || ws?.returnedAt) {
    const returnProcessedAt = rs?.processedAt ?? ws?.returnedAt
    const returnProcessedBy = rs?.processedBy ?? ws?.returnedBy

    items.push(
      <TimelineItem key="warehouse-returned">
        <TimelineOppositeContent sx={{ m: 'auto 0' }}>
          <Typography variant="body2" color="text.secondary">
            {returnProcessedAt ? formatDate(returnProcessedAt) : '—'}
          </Typography>
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot sx={{ bgcolor: getTimelineColor('warehouse') }}>
            {getTimelineIcon('warehouse')}
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent sx={{ py: '12px', px: 2 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.03)', border: '1px solid rgba(76, 175, 80, 0.12)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarehouseIcon sx={{ mr: 1, color: getTimelineColor('warehouse') }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Pengembalian Barang</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>Status:</Typography>
                <Chip label={WAREHOUSE_STATUS.RETURNED} color={getStatusColor(WAREHOUSE_STATUS.RETURNED) as any} variant="filled" />
              </Box>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>Diproses oleh: {returnProcessedBy}</Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>Pada: {returnProcessedAt ? formatDate(returnProcessedAt) : '—'}</Typography>
              </Box>
              {rs?.note && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2"><strong>Catatan:</strong> {rs.note}</Typography>
                </Alert>
              )}
              {/* show photos if available in returnStatus.photoResults */}
              {rs?.photoResults && rs.photoResults.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>Bukti foto pengembalian:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {rs.photoResults.map((p: any, idx: number) => (
                      <a key={idx} href={p.url} target="_blank" rel="noreferrer">
                        <Image
                          src={p.url}
                          alt={p.filename}
                          width={84}
                          height={84}
                          style={{ objectFit: 'cover', borderRadius: 6 }}
                          unoptimized
                        />
                      </a>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </TimelineContent>
      </TimelineItem>
    )
  }

  return <>{items}</>
}

export default WarehouseStatus