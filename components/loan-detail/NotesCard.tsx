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
import { Description as DescriptionIcon } from '@mui/icons-material'
import NotesSection from './NotesSection'
import { LoanData } from '../../types/loanDetail'

interface NotesCardProps {
  loan: LoanData
}

const NotesCard: React.FC<NotesCardProps> = ({ loan }) => {
  return (
    <Zoom in={true} style={{ transitionDelay: '600ms' }}>
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          border: '1px solid rgba(121, 85, 72, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #795548, #a1887f)',
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: '#795548', mr: 2 }}>
              <DescriptionIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
                Catatan & Informasi
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Catatan tambahan dan informasi penting
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <NotesSection loan={loan} />
        </CardContent>
      </Card>
    </Zoom>
  )
}

export default NotesCard