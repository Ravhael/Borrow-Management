import React from 'react'
import { Card, CardContent, Avatar, Typography, Box, Divider } from '@mui/material'
import { Gavel as GavelIcon } from '@mui/icons-material'
import { Zoom } from '@mui/material'
import Approval from '../Approval'
import { FormDataShape } from '../../types/form'

interface ApprovalSectionProps {
  formData: FormDataShape
  setFormData: React.Dispatch<React.SetStateAction<FormDataShape>>
  errors: Record<string, string>
}

const ApprovalSection: React.FC<ApprovalSectionProps> = ({
  formData,
  setFormData,
  errors
}) => {
  return (
    <Zoom in={true} style={{ transitionDelay: '400ms' }}>
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          border: '1px solid rgba(211, 47, 47, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #d32f2f, #f44336)',
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: '#d32f2f', mr: 2 }}>
              <GavelIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '1.1rem' }}>
                Persetujuan & Konfirmasi
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                Konfirmasi persetujuan terhadap prosedur peminjaman barang.
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Approval
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        </CardContent>
      </Card>
    </Zoom>
  )
}

export default ApprovalSection