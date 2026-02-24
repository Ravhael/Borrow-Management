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
import { LoanIncompleteReturnGrid, isIncompleteReturnLoan } from './LoanIncompleteReturnGrid'
import { getLoanStatus } from '../../utils/peminjamanHelpers'
import { mapLoanToDisplay } from './mapLoanToDisplay'

interface IncompleteReturnSectionProps {
  loans?: LoanData[]
  isLoading?: boolean
}

const isIncompleteStatus = (loan: LoanData) => {
  const status = getLoanStatus(loan)
  return typeof status === 'string' && status.toLowerCase().includes('dikembalikan tidak lengkap')
}

const IncompleteReturnSection: React.FC<IncompleteReturnSectionProps> = ({ loans = [], isLoading = false }) => {
  const incompleteLoans = useMemo(() => {
    if (!Array.isArray(loans) || !loans.length) return []
    return loans.reduce<LoanDisplay[]>((acc, loan) => {
      const display = mapLoanToDisplay(loan)
      if (isIncompleteStatus(loan) || isIncompleteReturnLoan(display)) {
        acc.push(display)
      }
      return acc
    }, [])
  }, [loans])

  const hasLoans = incompleteLoans.length > 0

  return (
    <Card sx={{ borderRadius: 3, mb: 4, border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 20px 55px rgba(15,23,42,0.08)' }}>
      <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: '#94a3b8', letterSpacing: 1 }}>
              PERLU CEK ULANG
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Peminjaman Dikembalikan Tidak Lengkap
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Daftar peminjaman yang butuh verifikasi ulang kondisi barang.
            </Typography>
          </Box>
          <Chip
            label={`${incompleteLoans.length} peminjaman`}
            color="success"
            sx={{ fontWeight: 700, alignSelf: { xs: 'flex-start', md: 'center' } }}
          />
        </Box>

        <Divider sx={{ borderColor: 'rgba(15,23,42,0.08)' }} />

        <Stack spacing={2.5}>
          {isLoading && (
            <Typography variant="body2" color="text.secondary">
              Memuat data peminjaman yang perlu cek ulang...
            </Typography>
          )}

          {!isLoading && hasLoans && incompleteLoans.map((loan, index) => (
            <Box
              key={`incomplete-card-${loan.loanId || index}`}
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(22, 101, 52, 0.25)',
                backgroundColor: 'rgba(22, 163, 74, 0.08)',
                px: { xs: 1, md: 2 },
                py: { xs: 1.5, md: 2 }
              }}
            >
              <LoanIncompleteReturnGrid loan={loan} detailHref={loan.loanId ? `/peminjaman/${loan.loanId}` : undefined} />
            </Box>
          ))}

          {!isLoading && !hasLoans && (
            <Box
              sx={{
                borderRadius: 2,
                border: '1px dashed rgba(22, 101, 52, 0.35)',
                backgroundColor: 'rgba(22, 163, 74, 0.05)',
                px: { xs: 2, md: 3 },
                py: { xs: 3, md: 4 },
                textAlign: 'center'
              }}
            >
              <Typography variant="body2" color="#166534">
                Tidak ada peminjaman yang dikembalikan tidak lengkap saat ini.
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default IncompleteReturnSection
