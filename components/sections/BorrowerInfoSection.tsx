import React from 'react'
import { Card, CardContent, Avatar, Typography, Box, Divider } from '@mui/material'
import { Person as PersonIcon } from '@mui/icons-material'
import { Zoom } from '@mui/material'
import EntitasForm from '../EntitasForm'
import { FormDataShape } from '../../types/form'

interface BorrowerInfoSectionProps {
  formData: FormDataShape
  setFormData: React.Dispatch<React.SetStateAction<FormDataShape>>
  errors: Record<string, string>
}

const BorrowerInfoSection: React.FC<BorrowerInfoSectionProps> = ({
  formData,
  setFormData,
  errors
}) => {
  return (
    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          border: '1px solid rgba(21, 101, 192, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #1565c0, #1976d2)',
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: '#1565c0', mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '1.1rem' }}>
                Informasi Peminjam
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                Informasi peminjam untuk keperluan verifikasi dan notifikasi. Pastikan data yang dimasukkan akurat.
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <EntitasForm
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        </CardContent>
      </Card>
    </Zoom>
  )
}

export default BorrowerInfoSection