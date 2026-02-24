'use client'

import React, { useEffect, useState } from 'react'
import { Box, CircularProgress } from '@mui/material'
import type { ReportingChartsData } from './ReportingCharts'

// Lazy load the actual charts component
const LazyCharts = React.lazy(() => import('./ReportingCharts'))

export default function ChartsWrapper({ data }: { data: ReportingChartsData }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <React.Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <LazyCharts data={data} />
    </React.Suspense>
  )
}
