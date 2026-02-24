import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Skeleton,
} from '@mui/material'

const LoadingSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" sx={{ fontSize: '2.5rem', mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)'
            },
            gap: 3,
            mb: 4
          }}
        >
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent>
                <Skeleton variant="text" sx={{ mb: 1 }} />
                <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
              </CardContent>
            </Card>
          ))}
        </Box>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    </Box>
  )
}

export default LoadingSkeleton