import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Divider
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import BusinessIcon from '@mui/icons-material/Business'
import SecurityIcon from '@mui/icons-material/Security'

export default function Header(): React.JSX.Element {
  return (
    <Card elevation={3} sx={{ mb: 4, borderRadius: 4, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', border: '1px solid #cbd5e1' }}>
      <CardContent sx={{ p: 5 }}>
        <Box display="flex" alignItems="center" gap={4} flexWrap="wrap">
          <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main', boxShadow: 3 }}>
            <AssignmentIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="h5" component="h1" sx={{ mb: 2, fontWeight: 600, color: 'primary.main', lineHeight: 1.2 }}>
              Permintaan Peminjaman Barang
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 700, lineHeight: 1.5 }}>
              Lengkapi formulir di bawah ini dengan informasi yang akurat untuk memastikan proses persetujuan berjalan lancar dan efisien.
              Semua data yang Anda berikan akan diproses secara aman dan rahasia.
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Chip
                icon={<BusinessIcon />}
                label="Corporate Standard"
                variant="outlined"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<SecurityIcon />}
                label="Secure & Confidential"
                variant="outlined"
                color="secondary"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
