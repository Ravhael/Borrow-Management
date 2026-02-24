import React from 'react'
import {
  Box,
  Typography,
} from '@mui/material'
import { SummaryStatProps } from '../../types/dashboard'

export default function SummaryStat({ label, value, color, trend, trendType }: SummaryStatProps) {
  return (
    <Box sx={{ textAlign: 'center', p: 3, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
      <Typography variant="h3" sx={{ fontWeight: 'bold', color, mb: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 'medium', color: trendType === 'up' ? 'success.main' : 'error.main' }}>
        {trendType === 'up' ? '↗️' : '↘️'} {trend}
      </Typography>
    </Box>
  )
}