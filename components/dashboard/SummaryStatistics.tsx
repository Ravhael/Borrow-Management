import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
} from '@mui/material'
import { SummaryStatisticsProps } from '../../types/dashboard'
import SummaryStat from './SummaryStat'

export default function SummaryStatistics({ stats }: SummaryStatisticsProps) {
  const totalApproved = stats.totalApproved ?? 0
  const totalRejected = stats.totalRejected ?? 0
  const totalRequests = stats.totalRequests ?? (totalApproved + totalRejected)
  const approvalRate = totalRequests > 0 ? `${Math.round((totalApproved / totalRequests) * 100)}%` : '0%'

  return (
    <Card sx={{ mb: 4, borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h6">📈</Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Summary Statistics</Typography>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          <SummaryStat label="Total Approved" value={totalApproved} color="#2e7d32" trend="+12%" trendType="up" />
          <SummaryStat label="Total Rejected" value={totalRejected} color="#d32f2f" trend="-3%" trendType="down" />
          <SummaryStat label="Approval Rate" value={approvalRate} color="#1976d2" trend="+5%" trendType="up" />
        </Box>
      </CardContent>
    </Card>
  )
}