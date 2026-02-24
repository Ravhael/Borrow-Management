import React from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Divider,
} from '@mui/material'
import {
  Info as InfoIcon,
} from '@mui/icons-material'

const HowItWorksSection: React.FC = () => {
  return (
    <Card sx={{ gridColumn: { xs: '1', lg: 'span 2' } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <InfoIcon sx={{ fontSize: 28, color: 'primary.main', mr: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            How It Works
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
              1. Automated Scanning
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              The system automatically scans all active loans daily to identify upcoming return dates.
            </Typography>

            <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
              2. Smart Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Sends timely reminders to borrowers and relevant stakeholders based on the configured schedule.
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
              3. Multi-Channel Delivery
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Notifications are sent via email to all relevant parties including borrowers and company roles.
            </Typography>

            <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
              4. Comprehensive Tracking
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              All reminder activities are logged and tracked for audit and reporting purposes.
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default HowItWorksSection