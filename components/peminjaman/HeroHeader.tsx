import React from 'react'
import Link from 'next/link'
import { Box, Typography, Button } from '@mui/material'
import { Add as AddIcon, Assignment as AssignmentIcon, Assessment as AssessmentIcon, Dashboard as DashboardIcon, ReportProblem as ReportProblemIcon, AccessTime as AccessTimeIcon, AssignmentTurnedIn as AssignmentTurnedInIcon, WarningAmber as WarningAmberIcon } from '@mui/icons-material'
import { LoanMetrics } from '../../types/loan'
import { UserStats } from '../../types/userDashboard'
import { loginTheme } from '../../themes/loginTheme' 
import StatCardsRow from '../shared/StatCardsRow'
import buildGudangStatCards from '../shared/gudangStatCards' 

interface HeroHeaderProps {
  metrics: LoanMetrics
  loanStats?: UserStats | null
}

const HeroHeader: React.FC<HeroHeaderProps & { currentUser?: any }> = ({ metrics: _metrics, loanStats, currentUser }) => {
  // no role filtering here — use Gudang statcards for all dashboards (except UserHeroHeader)
  return (
    <Box
        sx={{
          background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
          color: 'white',
          py: { xs: 6, md: 3 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.1,
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '1200px', mx: 'auto', px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon sx={{ fontSize: { xs: 48, md: 64 }, mr: 3, opacity: 0.9 }} />
              <Box>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.5rem', md: '2.0em' },
                    mb: 2,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Pusat Manajemen Peminjaman
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 400,
                    fontSize: { xs: '1.00rem', md: '1.3rem' },
                    opacity: 0.9,
                    maxWidth: '600px',
                    lineHeight: 1.4,
                  }}
                >
                  Kelola dan pantau seluruh permohonan peminjaman yang diajukan dalam sistem secara mudah dan efisien.
                </Typography>
              </Box>
            </Box>
          </Box>

          {(() => {
            const fallbackStats = {
              totalLoans: _metrics.total ?? 0,
              activeLoans: _metrics.borrowed ?? 0,
              totalRejected: _metrics.rejected ?? 0,
              overdueLoans: 0,
              returnedComplete: _metrics.returned ?? 0
            }
            const statCards = buildGudangStatCards(loanStats ?? fallbackStats)
            return <StatCardsRow cards={statCards} maxColumns={7} gap={2} />
          })()}
        </Box>
      </Box>
  )
}

export default HeroHeader