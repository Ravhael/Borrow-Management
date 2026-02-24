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
import { Inventory as InventoryIcon } from '@mui/icons-material'
import ProductDetails from './ProductDetails'
import { LoanData } from '../../types/loanDetail'

interface ProductDetailsCardProps {
  loan: LoanData
}

const ProductDetailsCard: React.FC<ProductDetailsCardProps> = ({ loan }) => {
  return (
    <Zoom in={true} style={{ transitionDelay: '500ms' }}>
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
          border: '1px solid rgba(156, 39, 176, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #9c27b0, #ba68c8)',
          }
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2, md: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
            <Avatar sx={{ bgcolor: '#9c27b0', mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 }, width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}>
              <InventoryIcon sx={{ fontSize: { xs: 22, sm: 28 } }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                Detail Produk
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                Spesifikasi dan informasi produk
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: { xs: 2, sm: 3 } }} />
          <ProductDetails loan={loan} />
        </CardContent>
      </Card>
    </Zoom>
  )
}

export default ProductDetailsCard