import React from 'react'
import { Card, CardContent, Avatar, Typography, Box, Divider } from '@mui/material'
import { Business as BusinessIcon, Inventory as InventoryIcon, Description as DescriptionIcon } from '@mui/icons-material'
import { Zoom } from '@mui/material'
import DemoSection from '../DemoSection'
import { NeedType } from '../../utils/needTypes'
import BackupSection from '../BackupSection'
import { FormDataShape } from '../../types/form'

interface LoanDetailsSectionProps {
  formData: FormDataShape
  setFormData: React.Dispatch<React.SetStateAction<FormDataShape>>
}

const LoanDetailsSection: React.FC<LoanDetailsSectionProps> = ({
  formData,
  setFormData
}) => {
  // LoanDetailsSection - render

  // Force re-render when needType changes
  const needType = formData.needType

  const renderConditionalSection = () => {
    switch (needType) {
      case NeedType.DEMO_PRODUCT:
        return (
          <Zoom key="demo-section" in={true} style={{ transitionDelay: '200ms' }}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                border: '1px solid rgba(237, 108, 2, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #ed6c02, #ff9800)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#ed6c02', mr: 2 }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '1.1rem' }}>
                      Kebutuhan Demo Produk
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                      Informasi customer untuk demo produk.
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <DemoSection
                  formData={formData}
                  setFormData={setFormData}
                />
              </CardContent>
            </Card>
          </Zoom>
        )
      case NeedType.BARANG_BACKUP:
        return (
          <Zoom key="backup-section" in={true} style={{ transitionDelay: '200ms' }}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                border: '1px solid rgba(237, 108, 2, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #ed6c02, #ff9800)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#ed6c02', mr: 2 }}>
                    <InventoryIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '1.1rem' }}>
                      Kebutuhan Barang Backup
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                      Informasi customer untuk kebutuhan barang backup.
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <BackupSection
                  formData={formData}
                  setFormData={setFormData}
                />
              </CardContent>
            </Card>
          </Zoom>
        )
      case NeedType.LAINNYA:
        return (
          <Zoom key="lainnya-section" in={true} style={{ transitionDelay: '200ms' }}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                border: '1px solid rgba(237, 108, 2, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #ed6c02, #ff9800)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#ed6c02', mr: 2 }}>
                    <DescriptionIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5, fontSize: '1.1rem' }}>
                      Kebutuhan Lainnya
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                      Jelaskan kebutuhan peminjaman secara detail
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                    Tuliskan Kebutuhan Peminjaman
                  </Typography>
                  <textarea
                    value={formData.needDetails?.lainnya || formData.lainnya || ''}
                    onChange={e => setFormData({
                      ...formData,
                      needDetails: {
                        ...formData.needDetails,
                        lainnya: e.target.value
                      },
                      // keep legacy field for compatibility
                      lainnya: e.target.value
                    })}
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1565c0'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    placeholder="Jelaskan kebutuhan peminjaman Anda dengan detail..."
                  />
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        )
      default:
        return null
    }
  }

  return (
    <>
      {renderConditionalSection()}
    </>
  )
}

export default LoanDetailsSection