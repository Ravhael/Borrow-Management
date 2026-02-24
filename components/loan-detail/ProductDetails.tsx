import React from 'react'
import {
  Typography,
  Box,
  Avatar,
  Stack,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import {
  Inventory as InventoryIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Build as BuildIcon,
} from '@mui/icons-material'
import { LoanData } from '../../types/loanDetail'
import { WAREHOUSE_STATUS } from '../../types/loanStatus'
import { NeedType, getNeedTypeLabel } from '../../utils/needTypes'

interface ProductDetailsProps {
  loan: LoanData
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ loan }) => {
  const getNeedTypeIcon = (needType: string) => {
    switch (needType) {
      case NeedType.DEMO_PRODUCT:
        return <BuildIcon />
      case NeedType.BARANG_BACKUP:
        return <InventoryIcon />
      case NeedType.LAINNYA:
        return <CategoryIcon />
      default:
        return <InventoryIcon />
    }
  }
  
  const getNeedTypeColor = (needType: string) => {
    switch (needType) {
      case NeedType.DEMO_PRODUCT:
        return '#ed6c02'
      case NeedType.BARANG_BACKUP:
        return '#1565c0'
      case NeedType.LAINNYA:
        return '#9c27b0'
      default:
        return '#1565c0'
    }
  }

  const getNeedTypeBgColor = (needType: string) => {
    switch (needType) {
      case NeedType.DEMO_PRODUCT:
        return 'rgba(237, 108, 2, 0.1)'
      case NeedType.BARANG_BACKUP:
        return 'rgba(21, 101, 192, 0.1)'
      case NeedType.LAINNYA:
        return 'rgba(156, 39, 176, 0.1)'
      default:
        return 'rgba(21, 101, 192, 0.1)'
    }
  }
  return (
    <Box sx={{ height: '100%' }}>
      <Stack spacing={3}>
        {/* Need Type Header */}
        <Card
          elevation={1}
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            bgcolor: getNeedTypeBgColor(loan.needType),
          }}
        >
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                bgcolor: getNeedTypeColor(loan.needType),
                width: 48,
                height: 48,
                mx: 'auto',
                mb: 2,
                boxShadow: `0px 4px 16px ${getNeedTypeBgColor(loan.needType)}`,
              }}
            >
              {getNeedTypeIcon(loan.needType)}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
              {getNeedTypeLabel(loan.needType)}
            </Typography>
            {/* Removed duplicate chip — heading already shows the need type */}
          </CardContent>
        </Card>

        {/* Render needDetails under Need Type header (moved per request) */}
        {loan.needDetails && Object.keys(loan.needDetails).length > 0 && (
          <Card elevation={1} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', mr: 2, width: 32, height: 32 }}>
                  <DescriptionIcon sx={{ color: '#1565c0', fontSize: '1rem' }} />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  Informasi Detail Kebutuhan
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gap: 1 }}>
                {/* For consistency show fields in a specific order depending on needType */}
                {loan.needType === NeedType.BARANG_BACKUP ? (
                  // Preferred order for BARANG_BACKUP
                  [
                    { label: 'Nama Customer', keys: ['namaCustomer', 'nama_customer', 'customerName'] },
                    { label: 'Nama Perusahaan', keys: ['namaPerusahaan', 'nama_perusahaan', 'companyName'] },
                    { label: 'Telepon Customer', keys: ['telepon', 'teleponCustomer', 'telepon_customer', 'phone', 'telephone'] },
                    { label: 'Alamat Customer', keys: ['alamat', 'alamatCustomer', 'alamat_customer', 'address'] },
                    { label: 'Alasan Kebutuhan Barang Backup', keys: ['alasan', 'alasanKebutuhanBarangBackup', 'alasan_kebutuhan', 'reason'] }
                  ].map((field) => {
                    const val = field.keys.map(k => (loan.needDetails as any)[k]).find(v => v !== undefined && v !== null && String(v).trim() !== '')
                    return (
                      <Box key={field.label} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 1, border: '1px solid rgba(0,0,0,0.04)' }}>
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                          {field.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                          {val ?? '-'}
                        </Typography>
                      </Box>
                    )
                  })
                ) : loan.needType === NeedType.DEMO_PRODUCT ? (
                  // Preferred order for DEMO_PRODUCT
                  [
                    { label: 'Nama Customer', keys: ['namaCustomer', 'nama_customer', 'customerName'] },
                    { label: 'Nama Perusahaan', keys: ['namaPerusahaan', 'nama_perusahaan', 'companyName'] },
                    { label: 'Telepon Customer', keys: ['telepon', 'teleponCustomer', 'telepon_customer', 'phone', 'telephone'] },
                    { label: 'Alamat Customer', keys: ['alamat', 'alamatCustomer', 'alamat_customer', 'address'] }
                  ].map((field) => {
                    const val = field.keys.map(k => (loan.needDetails as any)[k]).find(v => v !== undefined && v !== null && String(v).trim() !== '')
                    return (
                      <Box key={field.label} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 1, border: '1px solid rgba(0,0,0,0.04)' }}>
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                          {field.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                          {val ?? '-'}
                        </Typography>
                      </Box>
                    )
                  })
                ) : (
                  // Fallback: render any needDetails keys in insertion order
                  Object.entries(loan.needDetails).map(([k, v]) => (
                    <Box key={k} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 1, border: '1px solid rgba(0,0,0,0.04)' }}>
                      <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        {k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                        {typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : JSON.stringify(v)}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Product Details */}
        <Card elevation={1} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', mr: 2, width: 32, height: 32 }}>
                <DescriptionIcon sx={{ color: '#1565c0', fontSize: '1rem' }} />
              </Avatar>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                Deskripsi Produk
              </Typography>
            </Box>

            <Box sx={{
              p: 3,
              bgcolor: 'rgba(255,255,255,0.8)',
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.06)',
              minHeight: 80,
            }}>
              <Typography
                variant="body1"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 500,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {loan.productDetailsText || 'Tidak ada deskripsi produk'}
              </Typography>
            </Box>

                {/* needDetails displayed above under Need Type header -- removed duplicate */}
          </CardContent>
        </Card>

        {/* Additional Details for "LAINNYA" */}
        {loan.needType === NeedType.LAINNYA && (loan.needDetails?.lainnya || loan.lainnya) && (
          <Card elevation={1} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)', mr: 2, width: 32, height: 32 }}>
                  <CategoryIcon sx={{ color: '#9c27b0', fontSize: '1rem' }} />
                </Avatar>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  Kebutuhan Lainnya
                </Typography>
              </Box>

              <Box sx={{
                p: 3,
                bgcolor: 'rgba(255,255,255,0.8)',
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.06)',
                minHeight: 80,
              }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#1a1a1a',
                    fontWeight: 500,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {loan.needDetails?.lainnya || loan.lainnya}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Status Produk card removed (requested) */}
      </Stack>
    </Box>
  )
}

export default ProductDetails