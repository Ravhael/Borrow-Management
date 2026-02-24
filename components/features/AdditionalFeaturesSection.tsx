import React from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import PeopleIcon from '@mui/icons-material/People'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import { featuresTheme } from '../../themes/featuresTheme'

export default function AdditionalFeaturesSection() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: featuresTheme.palette.background.default }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            sx={{
              mb: 3,
              fontWeight: 700,
              color: featuresTheme.palette.primary.main
            }}
          >
            Additional Enterprise Features
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 700, mx: 'auto' }}
          >
            Advanced capabilities that set FormFlow apart from traditional loan management systems
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 16px 32px rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <BusinessIcon sx={{ fontSize: 48, color: featuresTheme.palette.primary.main, mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                  Multi-Company Support
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Manage multiple company entities with separate workflows, approval hierarchies,
                  and reporting structures all within a single platform.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 16px 32px rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 48, color: featuresTheme.palette.secondary.main, mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                  Team Collaboration
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Enhanced collaboration features with team comments, file sharing,
                  and real-time collaboration on loan requests and approvals.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 16px 32px rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <WarehouseIcon sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                  Automated Workflows
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Configure custom approval workflows with conditional routing,
                  automatic escalations, and intelligent decision-making rules.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}