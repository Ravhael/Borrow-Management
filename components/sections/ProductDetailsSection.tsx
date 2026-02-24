import React from 'react'
import { Card, CardContent, Avatar, Typography, Box, Divider } from '@mui/material'
import { Description as DescriptionIcon } from '@mui/icons-material'
import { Zoom } from '@mui/material'
import DetailProduct from '../DetailProduct'
import { FormDataShape } from '../../types/form'

interface ProductDetailsSectionProps {
  formData: FormDataShape
  setFormData: React.Dispatch<React.SetStateAction<FormDataShape>>
  errors: Record<string, string>
}

const ProductDetailsSection: React.FC<ProductDetailsSectionProps> = ({
  formData,
  setFormData,
  errors
}) => {
  return (
    <Zoom in={true} style={{ transitionDelay: '300ms' }}>
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          border: '1px solid rgba(46, 125, 50, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #2e7d32, #4caf50)',
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: '#2e7d32', mr: 2 }}>
              <DescriptionIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '1.1rem' }}>
                Detail Produk & Jadwal
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                Pilih Company dan tentukan tanggal serta rincian kebutuhan.
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <DetailProduct
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        </CardContent>
      </Card>
    </Zoom>
  )
}

export default ProductDetailsSection