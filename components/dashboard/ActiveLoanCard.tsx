import React from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  Box,
  Button,
  LinearProgress,
  Pagination
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { ActiveLoanInfo, ActiveLoanSummary } from '../../types/dashboard'
import { LoanFieldGrid, LoanDisplay } from './LoanFieldGrid'
import { isFollowUpLoan } from './LoanFollowUpGrid'
import { isIncompleteReturnLoan } from './LoanIncompleteReturnGrid'

interface ActiveLoanCardProps {
  info?: ActiveLoanInfo | null
  isLoading?: boolean
}

const buildFallbackTopLoans = (info?: ActiveLoanInfo | null): ActiveLoanSummary[] => {
  if (!info) return []
  return [
    {
      loanId: info.loanId ?? null,
      borrower: info.nextBorrower ?? null,
      company: info.nextCompany ?? null,
      returnDate: info.nextReturnDate ?? null,
      needType: info.needType ?? null,
      status: info.status ?? null
    }
  ]
}

const mapToDisplayLoan = (
  loan?: ActiveLoanSummary | null,
  fallback?: Partial<LoanDisplay>
): LoanDisplay => ({
  loanId: loan?.loanId ?? fallback?.loanId ?? null,
  borrower: loan?.borrower ?? fallback?.borrower ?? null,
  company: loan?.company ?? fallback?.company ?? null,
  entitasId: (loan as any)?.entitasId ?? null,
  entitasLabel: (loan as any)?.entitasLabel ?? null,
  needType: loan?.needType ?? fallback?.needType ?? null,
  marketing: fallback?.marketing ?? loan?.company ?? fallback?.company ?? null,
  returnDate: loan?.returnDate ?? fallback?.returnDate ?? null,
  statusLabel: loan?.status?.label ?? fallback?.statusLabel ?? null,
  loanStatus: loan?.loanStatus ?? fallback?.loanStatus ?? null,
  warehouseStatus: loan?.warehouseStatus ?? fallback?.warehouseStatus ?? null,
  returnStatus: loan?.returnStatus ?? fallback?.returnStatus ?? null,
  extendStatus: (loan as any)?.extendStatus ?? fallback?.extendStatus ?? null
})

export default function ActiveLoanCard({ info, isLoading = false }: ActiveLoanCardProps) {
  const totalActive = info?.totalActive ?? 0
  const hasActive = totalActive > 0
  const topLoans = info?.topLoans?.length ? info.topLoans : buildFallbackTopLoans(info)
  const rowsPerPage = 5
  const [page, setPage] = React.useState(1)
  const fallbackLoan: Partial<LoanDisplay> | undefined = info
    ? {
        loanId: info.loanId ?? null,
        borrower: info.nextBorrower ?? null,
        company: info.nextCompany ?? null,
        needType: info.needType ?? null,
        marketing: info.nextCompany ?? null,
        returnDate: info.nextReturnDate ?? null,
        statusLabel: info.status?.label ?? null
      }
    : undefined
  const loansToDisplay = topLoans.map((loan, index) =>
    mapToDisplayLoan(loan, index === 0 ? fallbackLoan : undefined)
  )
  const regularLoans = loansToDisplay.filter((loan) => !isFollowUpLoan(loan) && !isIncompleteReturnLoan(loan))
  const totalPages = regularLoans.length
    ? Math.ceil(regularLoans.length / rowsPerPage)
    : 1
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedLoans = regularLoans.slice(startIndex, startIndex + rowsPerPage)

  React.useEffect(() => {
    setPage(1)
  }, [regularLoans.length])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  return (
    <Card sx={{ borderRadius: 3, mb: 4, width: '100%', maxWidth: '100%' }}>
      <CardContent
        sx={{
          p: { xs: 3, md: 5 },
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          maxWidth: 1600,
          mx: 'auto'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Peminjaman Aktif
          </Typography>
          <Chip
            label={`${totalActive} aktif`}
            color={hasActive ? 'primary' : 'default'}
            sx={{ fontWeight: 600 }}
          />
        </Stack>

        {isLoading ? (
          <LinearProgress />
        ) : hasActive ? (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 3 }}>
              {paginatedLoans.map((loan, index) => {
                const detailHref = loan.loanId ? `/peminjaman/${loan.loanId}` : null
                const isEvenRow = (startIndex + index) % 2 === 0
                return (
                  <Box
                    key={loan.loanId || `${loan.borrower || 'loan'}-${index}`}
                    sx={{
                      borderRadius: 2,
                      px: { xs: 1, md: 2 },
                      py: { xs: 1.5, md: 2 },
                      backgroundColor: isEvenRow ? 'rgba(30, 64, 175, 0.08)' : 'rgba(15, 23, 42, 0.04)',
                      border: '1px solid rgba(15, 23, 42, 0.08)',
                      mb: 2,
                      boxShadow: '0 8px 16px rgba(15, 23, 42, 0.07)'
                    }}
                  >
                    <LoanFieldGrid loan={loan} textVariant="body2" detailHref={detailHref} />
                  </Box>
                )
              })}
              
              {regularLoans.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Tidak ada peminjaman aktif normal. Periksa bagian &quot;Perlu Tindak Lanjut&quot; atau &quot;Dikembalikan Tidak Lengkap&quot;.
                </Typography>
              )}
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
              <Button
                component={Link}
                href="/peminjaman"
                variant="contained"
                color="primary"
                endIcon={<ArrowForwardIcon />}
              >
                Buka Daftar Peminjaman
              </Button>
              {totalPages > 1 && regularLoans.length > 0 && (
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="medium"
                />
              )}
            </Stack>
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" color="text.secondary">
              Tidak ada peminjaman yang sedang aktif saat ini.
            </Typography>
            <Button
              component={Link}
              href="/form"
              variant="contained"
              sx={{ mt: 2 }}
              endIcon={<ArrowForwardIcon />}
            >
              Buat Pengajuan Baru
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
