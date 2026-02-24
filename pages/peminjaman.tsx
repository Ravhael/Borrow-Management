import React, { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import toast from 'react-hot-toast'
import { Box, Container, Fade, LinearProgress, Stack, Typography, CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { corporateTheme } from '../themes/corporateTheme'
import { LoanData, LoanMetrics } from '../types/loan'
import { calculateMetrics } from '../utils/peminjamanHelpers'
import { HeroHeader, SearchControls, EmptyState, LoanTable, FloatingActionButton } from '../components/peminjaman'
import LoanSummaryCards from '../components/peminjaman/LoanSummaryCards'
import { apiFetch } from '../utils/basePath'

const parseDateValue = (value?: string | null): number => {
  if (!value) return Number.NaN
  const direct = Date.parse(value)
  if (!Number.isNaN(direct)) return direct
  const fallback = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (fallback) {
    const day = Number(fallback[1])
    const month = Number(fallback[2])
    let year = Number(fallback[3])
    if (year < 100) year += 2000
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      const ts = Date.UTC(year, Math.max(0, month - 1), day)
      if (!Number.isNaN(ts)) return ts
    }
  }
  return Number.NaN
}

const parseLoanIdTimestamp = (loanId?: string | number | null): number => {
  if (!loanId) return 0
  const asString = String(loanId)
  const match = asString.match(/(\d{4})(\d{2})(\d{2})/)
  if (!match) return 0
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const base = Date.UTC(year, Math.max(0, month - 1), day)
  const suffix = asString.match(/-(\d+)/)
  const suffixValue = suffix ? Number(suffix[1]) : 0
  return (Number.isNaN(base) ? 0 : base) + (Number.isNaN(suffixValue) ? 0 : suffixValue)
}

const getLoanSortTimestamp = (loan: LoanData): number => {
  const candidates = [
    loan.submittedAt,
    (loan as any)?.createdAt,
    (loan as any)?.updatedAt,
    loan.useDate,
    loan.outDate,
    loan.returnDate
  ]
  for (const value of candidates) {
    const parsed = parseDateValue(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return parseLoanIdTimestamp(loan.id)
}

function PeminjamanPageContent() {
  const [loans, setLoans] = useState<LoanData[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const currentUserRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLoans, setSelectedLoans] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  // filtered loans reported by the table (after filters applied in component)
  const [filteredLoansFromTable, setFilteredLoansFromTable] = useState<LoanData[]>([])

  const fetchLoans = useCallback(async (sessionUser?: any) => {
    try {
      const response = await apiFetch('/api/loans')
      if (response.ok) {
        const data = await response.json()
        // If the signed-in user is a normal user, only show loans they submitted
        const userToCheck = sessionUser ?? currentUserRef.current
        const lowerRole = String(userToCheck?.role || '').toLowerCase()
        const isRegularUser = lowerRole === 'user' || lowerRole === 'regular'

        let filteredData = data
        if (isRegularUser) {
          // Use userId (preferred) or borrowerEmail as a fallback to match the owner
          const uid = userToCheck?.id ?? null
          const uemail = String(userToCheck?.email || '').toLowerCase()
          filteredData = data.filter((l: LoanData) => {
            if (uid && String(l.userId) === String(uid)) return true
            if ((l as any).borrowerEmail && String((l as any).borrowerEmail).toLowerCase() === uemail) return true
            return false
          })
        }
        const sortedData = (filteredData || data).sort(
          (a: LoanData, b: LoanData) => getLoanSortTimestamp(b) - getLoanSortTimestamp(a)
        )
        setLoans(sortedData)
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  useEffect(() => {
    // Fetch session user first so we can restrict visible loans for regular users
    const init = async () => {
      let sessionUser: any = null
      try {
        const s = await apiFetch('/api/auth/session')
        if (s.ok) {
          const sessionData = await s.json()
          sessionUser = sessionData?.user ?? null
          if (sessionUser) setCurrentUser(sessionUser)
        }
      } catch (err) {
        // ignore - we'll fall back to default behaviour
      }

      // Now fetch loans and pass the fetched session user to avoid race conditions
      await fetchLoans(sessionUser)
    }

    init()
  }, [fetchLoans])

  // Filtering and searching are now handled inside `LoanTable` component, which also provides `onFilteredChange` to notify the page of the filtered set.
  // (previous filter state was moved into the component for reusability)

  // Keep total pages calculation (based on all loans) — table will handle pagination of the filtered set
  const totalPages = Math.ceil(loans.length / itemsPerPage)

  // Reset to first page when items per page changes (table will also react to page change)
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  const handleSelectAll = (checked: boolean, visibleIds?: string[]) => {
    console.debug('[peminjaman] handleSelectAll', { checked, visibleIds })
    if (checked) {
      setSelectedLoans(visibleIds ? visibleIds : loans.map(l => l.id))
    } else {
      setSelectedLoans([])
    }
  }

  const handleSelectLoan = (loanId: string, checked: boolean) => {
    console.debug('[peminjaman] handleSelectLoan', { loanId, checked })
    if (checked) {
      setSelectedLoans(prev => [...prev, loanId])
    } else {
      setSelectedLoans(prev => prev.filter(id => id !== loanId))
    }
  }

  const handleBulkDelete = async () => {
    console.debug('[peminjaman] handleBulkDelete selected', selectedLoans)
    if (selectedLoans.length === 0) {
      toast.error('Pilih setidaknya satu peminjaman untuk dihapus')
      return
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedLoans.length} peminjaman yang dipilih?`)) {
      return
    }

    try {
      const response = await apiFetch('/api/loans', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedLoans }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        setSelectedLoans([])
        fetchLoans() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.message || 'Gagal menghapus peminjaman')
      }
    } catch (error) {
      console.error('Error deleting loans:', error)
      toast.error('Terjadi kesalahan saat menghapus peminjaman')
    }
  }

  const handlePageChange = (event: unknown, newPage: number) => {
    setCurrentPage(newPage + 1)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setItemsPerPage(parseInt(event.target.value, 10))
    setCurrentPage(1)
  }

  const metrics: LoanMetrics = calculateMetrics(loans)

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Stack spacing={2} alignItems="center">
            <LinearProgress sx={{ width: 200, height: 6, borderRadius: 3 }} />
            <Typography variant="body1" color="text.secondary">Memuat data peminjaman...</Typography>
          </Stack>
        </Box>
      </Container>
    )
  }

  return (
    <ThemeProvider theme={corporateTheme}>
      <CssBaseline />

      {/* Hero Header Section */}
      <HeroHeader metrics={metrics} />

      <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', width: '100%', maxWidth: 1600, py: 6, px: { xs: 2, md: 5 }, mx: 'auto' }}>
        <Head>
          <title>Loan Management Center - FormFlow</title>
        </Head>

        {loans.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Search and Controls 
            <Fade in={true} timeout={800}>
              <Box>
                <SearchControls
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={(value) => setItemsPerPage(value)}
                />
              </Box>
            </Fade>
            */}
            <Box sx={{ mb: 4 }}>
              <LoanSummaryCards loans={filteredLoansFromTable.length ? filteredLoansFromTable : loans} />
            </Box>

            {/* Data Table */}
            <LoanTable
              loans={loans}
              selectedLoans={selectedLoans}
              onSelectAll={handleSelectAll}
              onSelectLoan={handleSelectLoan}
              onBulkDelete={handleBulkDelete}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalLoans={loans.length}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onFilteredChange={setFilteredLoansFromTable}
            />

            {/* Floating Action Button */}
            <FloatingActionButton />
          </>
        )}
      </Box>
    </ThemeProvider>
  )
}

export default function PeminjamanPage() {
  return (
    <ThemeProvider theme={corporateTheme}>
      <PeminjamanPageContent />
    </ThemeProvider>
  )
}