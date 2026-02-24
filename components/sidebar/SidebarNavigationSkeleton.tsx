import React from 'react'
import { Box, Skeleton, useTheme, useMediaQuery } from '@mui/material'

export default function SidebarNavigationSkeleton() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Show 4 skeleton items to roughly match normal menu length
  const rows = new Array(4).fill(0)

  return (
    <Box sx={{ flex: 1, overflow: 'auto', px: isMobile ? 2 : 1 }}>
      <Box sx={{ mb: isMobile ? 3 : 2, px: isMobile ? 1.5 : 2 }}>
        <Skeleton variant="text" width={100} height={16} animation="wave" />
      </Box>

      <Box sx={{ px: isMobile ? 1 : 0.5 }}>
        {rows.map((_, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, px: isMobile ? 1 : 0.5 }}>
            <Skeleton variant="circular" width={34} height={34} animation="wave" />
            <Skeleton variant="rectangular" width={isMobile ? '70%' : 160} height={20} animation="wave" />
          </Box>
        ))}
      </Box>
    </Box>
  )
}
