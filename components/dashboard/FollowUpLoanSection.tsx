import React, { useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  Divider
} from '@mui/material'
import { LoanData } from '../../types/loan'
import { LoanDisplay } from './LoanFieldGrid'
import { LoanFollowUpGrid, isFollowUpLoan } from './LoanFollowUpGrid'
import { isIncompleteReturnLoan } from './LoanIncompleteReturnGrid'
import { mapLoanToDisplay } from './mapLoanToDisplay'

interface FollowUpLoanSectionProps {
  loans?: LoanData[]
  isLoading?: boolean
}

const FollowUpLoanSection: React.FC<FollowUpLoanSectionProps> = ({ loans = [], isLoading = false }) => {
  const followUpLoans = useMemo(() => {
    if (!Array.isArray(loans) || !loans.length) return []
    return loans.reduce<LoanDisplay[]>((acc, loan) => {
      const display = mapLoanToDisplay(loan)
      if (isFollowUpLoan(display) && !isIncompleteReturnLoan(display)) {
        acc.push(display)
      }
      return acc
    }, [])
  }, [loans])

  const hasLoans = followUpLoans.length > 0

  return (
    <Card sx={{ borderRadius: 3, mb: 4, border: '1px solid rgba(180, 83, 9, 0.25)', boxShadow: '0 20px 55px rgba(148, 91, 21, 0.15)' }}>
      <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: '#b45309', letterSpacing: 1 }}>
              PERLU TINDAK LANJUT
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#78350f' }}>
              Peminjaman Butuh Perhatian Segera
            </Typography>
            <Typography variant="body2" sx={{ color: '#92400e' }}>
              Segera cek status dan koordinasikan tindak lanjut berikutnya.
            </Typography>
          </Box>
          <Chip
            label={`${followUpLoans.length} peminjaman`}
            color="warning"
            sx={{ fontWeight: 700, alignSelf: { xs: 'flex-start', md: 'center' } }}
          />
        </Box>

        <Divider sx={{ borderColor: 'rgba(180,83,9,0.3)' }} />

        <Stack spacing={2.5}>
          {isLoading && (
            <Typography variant="body2" color="text.secondary">
              Memuat data tindak lanjut...
            </Typography>
          )}

          {!isLoading && hasLoans && followUpLoans.map((loan, index) => (
            <Box
              key={`followup-card-${loan.loanId || index}`}
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(180, 83, 9, 0.4)',
                backgroundColor: 'rgba(251, 191, 36, 0.2)',
                px: { xs: 1, md: 2 },
                py: { xs: 1.5, md: 2 }
              }}
            >
              <LoanFollowUpGrid loan={loan} detailHref={loan.loanId ? `/peminjaman/${loan.loanId}` : undefined} />
            </Box>
          ))}

          {!isLoading && !hasLoans && (
            <Box
              sx={{
                borderRadius: 2,
                border: '1px dashed rgba(180, 83, 9, 0.4)',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                px: { xs: 2, md: 3 },
                py: { xs: 3, md: 4 },
                textAlign: 'center'
              }}
            >
              <Typography variant="body2" color="#92400e">
                Belum ada peminjaman yang membutuhkan tindak lanjut.
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default FollowUpLoanSection
