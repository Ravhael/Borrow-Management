import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
} from '@mui/material'
import { StatCardProps } from '../../types/dashboard'

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card sx={{ borderRadius: 3, transition: 'all 0.2s' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <Typography variant="h5">{icon}</Typography>
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
              {value}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}