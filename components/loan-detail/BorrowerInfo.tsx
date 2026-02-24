import React from 'react'
import { Typography, Box, Avatar, Chip, Stack, Divider } from '@mui/material'
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  LocalShipping as LocalShippingIcon,
  Description as DescriptionIcon
} from '@mui/icons-material'
import { getNeedTypeLabel } from '../../utils/needTypes'
import { getPickupMethodLabel } from '../../utils/pickupMethods'
import { LoanData } from '../../types/loanDetail'

interface BorrowerInfoProps {
  loan: LoanData
}

const BorrowerInfo: React.FC<BorrowerInfoProps> = ({ loan }) => {
  return (
    <Box sx={{ height: '100%' }}>
      <Stack spacing={3}>
        {/* Borrower Avatar & Name */}
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: '#1565c0',
              fontSize: '2rem',
              fontWeight: 700,
              boxShadow: '0px 4px 16px rgba(21, 101, 192, 0.3)',
            }}
          >
            {loan.borrowerName.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            {loan.borrowerName}
          </Typography>
          <Chip
            label={loan.entitasId}
            variant="outlined"
            color="primary"
            size="small"
            icon={<BusinessIcon />}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Contact Information */}
        <Stack spacing={2.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', width: 40, height: 40 }}>
              <PhoneIcon sx={{ color: '#1565c0' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
                No. Telepon
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                {loan.borrowerPhone}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', width: 40, height: 40 }}>
              <EmailIcon sx={{ color: '#1565c0' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
                Email
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                {loan.borrowerEmail}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', width: 40, height: 40 }}>
              <BusinessIcon sx={{ color: '#1565c0' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
                Entitas
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                {loan.entitasId}
              </Typography>
            </Box>
          </Box>

          {/* Marketing Company will be shown after the divider */}
          {/* Divider + additional info under Company */}
          <Divider sx={{ my: 1 }} />
          {/* moved Marketing Company here (below divider) */}
          {loan.company && loan.company.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', width: 40, height: 40, mt: 0.5 }}>
                <LocationIcon sx={{ color: '#1565c0' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
                  Marketing Company
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {loan.company.map((comp, index) => (
                    <Chip
                      key={index}
                      label={comp}
                      size="small"
                      variant="filled"
                      sx={{
                        bgcolor: 'rgba(21, 101, 192, 0.1)',
                        color: '#1565c0',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: 'rgba(21, 101, 192, 0.2)',
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', width: 40, height: 40 }}>
              <TimeIcon sx={{ color: '#1565c0' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
                Jenis Kebutuhan
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                {getNeedTypeLabel(loan.needType)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', width: 40, height: 40 }}>
              <LocalShippingIcon sx={{ color: '#1565c0' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
                Metode Pengambilan
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                {getPickupMethodLabel(loan.pickupMethod)}
              </Typography>
            </Box>
          </Box>

          {/* Divider + Catatan (Note) */}
          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', width: 40, height: 40 }}>
              <DescriptionIcon sx={{ color: '#1565c0' }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mb: 0.5 }}>
                Catatan
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                {loan.note && loan.note.trim() ? loan.note : '-'}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Stack>
    </Box>
  )
}

export default BorrowerInfo