import React from 'react'
import {
  Typography,
  Box,
  Avatar,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import {
  Notes as NotesIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { LoanData } from '../../types/loanDetail'

interface NotesSectionProps {
  loan: LoanData
}

const NotesSection: React.FC<NotesSectionProps> = ({ loan }) => {
  return (
    <Box sx={{ height: '100%' }}>
      <Card
        elevation={1}
        sx={{
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.08)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardContent sx={{ p: 3, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)', mr: 2, width: 32, height: 32 }}>
              <NotesIcon sx={{ color: '#9c27b0', fontSize: '1rem' }} />
            </Avatar>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              Catatan Tambahan
            </Typography>
          </Box>

          <Box sx={{
            p: 3,
            bgcolor: 'rgba(255,255,255,0.8)',
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.06)',
            minHeight: 120,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            {loan.note ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EditIcon sx={{ fontSize: '1rem', color: '#666', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                    Catatan
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#1a1a1a',
                    fontWeight: 500,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {loan.note}
                </Typography>
              </>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'rgba(0,0,0,0.04)', width: 48, height: 48, mx: 'auto', mb: 2 }}>
                  <NotesIcon sx={{ color: '#ccc', fontSize: '1.5rem' }} />
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#999',
                    fontStyle: 'italic',
                    fontWeight: 500
                  }}
                >
                  Tidak ada catatan tambahan
                </Typography>
              </Box>
            )}
          </Box>

          {loan.note && (
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Chip
                label="Ada Catatan"
                size="small"
                sx={{
                  bgcolor: 'rgba(156, 39, 176, 0.1)',
                  color: '#9c27b0',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default NotesSection