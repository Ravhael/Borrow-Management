import React from 'react'
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Divider,
  Zoom,
} from '@mui/material'
import { Notifications as NotificationsIcon } from '@mui/icons-material'
import NotificationSection from './NotificationSection'
import { LoanData } from '../../types/loanDetail'

interface NotificationCardProps {
  loan: LoanData
}

const NotificationCard: React.FC<NotificationCardProps> = ({ loan }) => {
  return (
    <Zoom in={true} style={{ transitionDelay: '700ms' }}>
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          border: '1px solid rgba(0, 151, 167, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #0097a7, #26c6da)',
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: '#0097a7', mr: 2 }}>
              <NotificationsIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
                Notifikasi & Riwayat
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Status notifikasi dan timeline aktivitas
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <NotificationSection loan={loan} />
        </CardContent>
      </Card>
    </Zoom>
  )
}

export default NotificationCard