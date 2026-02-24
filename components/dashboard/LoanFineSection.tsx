import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Pagination,
  Stack,
  Typography
} from '@mui/material'
import { LoanData } from '../../types/loan'
import { LoanDisplay } from './LoanFieldGrid'
import { LoanFineGrid, hasLoanFine } from './LoanFineGrid'
import { mapLoanToDisplay } from './mapLoanToDisplay'
import { getOverallStatus } from '../../utils/loanHelpers'
import { computeFineForLoan, isStatusEligibleForFine } from '../../utils/fineSync'

interface LoanFineSectionProps {
  loans?: LoanData[]
  isLoading?: boolean
}

const PAGE_SIZE = 5

// Fine eligibility handled via shared fine calculator helper

const LoanFineSection: React.FC<LoanFineSectionProps> = ({ loans = [], isLoading = false }) => {
  const [page, setPage] = useState(1)

  const fineLoans = useMemo(() => {
    if (!Array.isArray(loans) || !loans.length) return []
    return loans.reduce<LoanDisplay[]>((acc, loan) => {
      const display = mapLoanToDisplay(loan)
      const status = getOverallStatus(loan)
      const eligible = isStatusEligibleForFine(status)
      if (!eligible) {
        return acc
      }

      if (!hasLoanFine(display)) {
        const computedFine = computeFineForLoan(loan)
        if (computedFine) {
          display.totalDenda = computedFine
        }
      }

      if (hasLoanFine(display)) {
        acc.push(display)
      }
      return acc
    }, [])
  }, [loans])

  const hasLoans = fineLoans.length > 0
  const totalPages = Math.max(1, Math.ceil(fineLoans.length / PAGE_SIZE))

  useEffect(() => {
    setPage((prev) => {
      if (!hasLoans) return 1
      const nextPage = Math.min(prev, totalPages)
      return nextPage < 1 ? 1 : nextPage
    })
  }, [hasLoans, totalPages])

  const pagedLoans = useMemo(() => {
    if (!hasLoans) return []
    const startIndex = (page - 1) * PAGE_SIZE
    return fineLoans.slice(startIndex, startIndex + PAGE_SIZE)
  }, [fineLoans, hasLoans, page])

  const rangeStartIndex = hasLoans ? (page - 1) * PAGE_SIZE : 0
  const rangeEndIndex = hasLoans ? Math.min(rangeStartIndex + PAGE_SIZE, fineLoans.length) : 0

  return (
    <Card sx={{ borderRadius: 3, mb: 4, border: '1px solid rgba(185, 28, 28, 0.35)', boxShadow: '0 25px 60px rgba(185, 28, 28, 0.18)' }}>
      <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: '#1f1a1a', letterSpacing: 1 }}>
              DENDA PEMINJAMAN
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#881337' }}>
              Peminjaman Terlambat Pengembalian
            </Typography>
            <Typography variant="body2" sx={{ color: '#be123c' }}>
              Prioritaskan penagihan dan koordinasi tindak lanjut untuk daftar berikut.
            </Typography>
          </Box>
          <Chip
            label={`${fineLoans.length} peminjaman`}
            color="error"
            sx={{ fontWeight: 700, alignSelf: { xs: 'flex-start', md: 'center' } }}
          />
        </Box>

        <Divider sx={{ borderColor: 'rgba(185, 28, 28, 0.25)' }} />

        <Stack spacing={2.5}>
          {isLoading && (
            <Typography variant="body2" color="text.secondary">
              Memuat daftar peminjaman yang terkena denda...
            </Typography>
          )}

          {!isLoading && hasLoans && pagedLoans.map((loan, index) => (
            <Box
              key={`fine-card-${loan.loanId || index}`}
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(185, 28, 28, 0.45)',
                backgroundColor: 'rgba(248, 113, 113, 0.15)',
                px: { xs: 1, md: 2 },
                py: { xs: 1.5, md: 2 }
              }}
            >
              <LoanFineGrid loan={loan} detailHref={loan.loanId ? `/peminjaman/${loan.loanId}` : undefined} />
            </Box>
          ))}

          {!isLoading && !hasLoans && (
            <Box
              sx={{
                borderRadius: 2,
                border: '1px dashed rgba(185, 28, 28, 0.45)',
                backgroundColor: 'rgba(248, 113, 113, 0.08)',
                px: { xs: 2, md: 3 },
                py: { xs: 3, md: 4 },
                textAlign: 'center'
              }}
            >
              <Typography variant="body2" color="#7f1d1d">
                Belum ada peminjaman yang terkena denda keterlambatan.
              </Typography>
            </Box>
          )}

          {!isLoading && hasLoans && fineLoans.length > PAGE_SIZE && (
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
              sx={{ pt: 1 }}
            >
              <Typography variant="caption" color="#7f1d1d">
                Menampilkan {rangeStartIndex + 1}-{rangeEndIndex} dari {fineLoans.length} peminjaman
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                shape="rounded"
                size="small"
              />
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default LoanFineSection
