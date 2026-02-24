import React, { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { Box, Container, Fade, LinearProgress, Stack, Typography, CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { corporateTheme } from '../../../themes/corporateTheme'
import { LoanData, LoanMetrics } from '../../../types/loan'
import { UserStats } from '../../../types/userDashboard'
import { calculateMetrics, getLoanStatus, formatLifecycleStatusLabel } from '../../../utils/peminjamanHelpers'
import { EmptyState, LoanTable, FloatingActionButton } from '../../../components/peminjaman'
import UserHeroHeader from '../../../components/userDashboard/UserHeroHeader'
import { apiFetch } from '../../../utils/basePath'

const slugifyValue = (value?: string | number | null): string => {
  if (value === undefined || value === null) return ''
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
const buildUserSlugTokens = (user: any) => {
  const tokens = new Set<string>()
  const push = (val?: string | number | null) => {
    if (val === undefined || val === null) return
    const raw = String(val).trim()
    if (!raw) return
    tokens.add(raw.toLowerCase())
    const slug = slugifyValue(raw)
    if (slug) tokens.add(slug)
  }

  push(user?.id)
  push(user?.username)
  push(user?.name)
  push(user?.email)
  if (typeof user?.email === 'string' && user.email.includes('@')) {
    push(user.email.split('@')[0])
  }

  return tokens
}

const matchesUserSlug = (user: any, normalizedSlug: string) => {
  if (!user || !normalizedSlug) return false
  const tokens = buildUserSlugTokens(user)
  return tokens.has(normalizedSlug)
}

const defaultLoanStats: UserStats = {
  totalLoans: 0,
  activeLoans: 0,
  overdueLoans: 0,
  completedLoans: 0,
  totalFine: 0,
  pendingApprovals: 0
}

function PersonalLoansPageContent() {
  const router = useRouter()
  const [loans, setLoans] = useState<LoanData[]>([])
  const [loading, setLoading] = useState(true)
  // Table state: selection, pagination, and filtered set (table handles filtering internally)
  const [selectedLoans, setSelectedLoans] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filteredLoansFromTable, setFilteredLoansFromTable] = useState<LoanData[]>([])

  const [routeSlug, setRouteSlug] = useState<string>('')
  const [loanStats, setLoanStats] = useState<UserStats>(defaultLoanStats)
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null)
  const [ownerUser, setOwnerUser] = useState<any | null>(null)

  const updateSlugFromRouter = useCallback(() => {
    if (!router.isReady) return
    const param = router.query.namauser
    const rawValue = Array.isArray(param) ? param[0] : param
    if (typeof rawValue === 'string' && rawValue.trim()) {
      setRouteSlug(decodeURIComponent(rawValue))
    }
  }, [router.isReady, router.query.namauser])

  useEffect(() => {
    updateSlugFromRouter()
  }, [updateSlugFromRouter])

  const resolveOwnerBySlug = useCallback(async (slugValue: string, sessionUser?: any) => {
    const normalizedSlug = slugifyValue(slugValue) || slugValue.trim().toLowerCase()
    if (!normalizedSlug) return null

    if (normalizedSlug === 'me' && sessionUser?.id) {
      return sessionUser
    }

    if (sessionUser && matchesUserSlug(sessionUser, normalizedSlug)) {
      return sessionUser
    }

    try {
      const userResponse = await apiFetch('/api/users')
      if (!userResponse.ok) {
        // If listing users is forbidden, fall back to /api/me (current session user) which Owner-scoped roles can access
        if (userResponse.status === 403 || userResponse.status === 401) {
          try {
            const meRes = await apiFetch('/api/me')
            if (meRes.ok) {
              const meJson = await meRes.json().catch(() => null)
              const meUser = meJson?.user ?? meJson
              if (meUser && matchesUserSlug(meUser, normalizedSlug)) return meUser
            }
          } catch (e) {
            // ignore fallback error
          }
        }
        return null
      }

      const payload = await userResponse.json().catch(() => null)
      const users = Array.isArray(payload?.users) ? payload.users : []
      return users.find((user: any) => matchesUserSlug(user, normalizedSlug)) ?? null
    } catch (error) {
      console.error('Failed to resolve user by slug:', error)
      return null
    }
  }, [])

  const fetchLoans = useCallback(async (ownerUserId: string) => {
    const response = await apiFetch(`/api/loans?ownerUserId=${encodeURIComponent(ownerUserId)}`)
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(payload?.message || 'Gagal memuat data peminjaman')
    }
    const data = Array.isArray(payload) ? payload : []
    const sortedData = data.sort((a: LoanData, b: LoanData) => {
      const dateA = new Date(a.submittedAt).getTime()
      const dateB = new Date(b.submittedAt).getTime()
      return dateB - dateA
    })
    setLoans(sortedData)
    return sortedData
  }, [])

  const fetchLoanStats = useCallback(async (ownerUserId: string) => {
    const response = await apiFetch(`/api/loans/stats?ownerUserId=${encodeURIComponent(ownerUserId)}`)
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(payload?.message || 'Gagal memuat statistik peminjaman')
    }
    return payload && typeof payload === 'object' ? payload : null
  }, [])

  useEffect(() => {
    if (!routeSlug) return
    let isMounted = true

    const init = async () => {
      setLoading(true)
      let sessionUser: any = null
      try {
        const sessionResponse = await apiFetch('/api/auth/session')
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          sessionUser = sessionData?.user ?? null
        }
      } catch (err) {
        console.warn('Unable to load session info:', err)
      }

      const owner = await resolveOwnerBySlug(routeSlug, sessionUser)
      const ownerId = owner?.id ? String(owner.id) : null
      if (!isMounted) return

      if (!ownerId) {
        setActiveOwnerId(null)
        setOwnerUser(null)
        setLoans([])
        setLoanStats(defaultLoanStats)
        if (sessionUser) {
          // If we had a session but couldn't resolve the owner, likely a permissions issue
          toast.error('Pengguna tidak ditemukan atau Anda tidak memiliki akses')
        }
        setLoading(false)
        return
      }

      setActiveOwnerId(ownerId)
      setOwnerUser(owner)

      try {
        const [fetchedLoans, statsPayload] = await Promise.all([
          fetchLoans(ownerId),
          fetchLoanStats(ownerId)
        ])

        const metrics = calculateMetrics(fetchedLoans ?? [])

        // Debug (dev only): log per-loan status info so we can verify which loans are counted as rejected
        if (process.env.NODE_ENV !== 'production') {
          try {
            const debugInfo = (fetchedLoans ?? []).map((l: any) => ({
              id: l.id,
              rawLoanStatus: String(l.loanStatus || ''),
              rawWarehouseStatus: String(l.warehouseStatus?.status || ''),
              getLoanStatus: String(getLoanStatus(l)),
              formatted: String(formatLifecycleStatusLabel(getLoanStatus(l) as any))
            }))
            console.debug('Fetched loans status debug:', debugInfo, 'metrics:', metrics)
          } catch (e) {
            console.debug('Failed to build debug info for fetchedLoans', e)
          }
        }

        if (statsPayload && typeof statsPayload === 'object') {
          setLoanStats({ ...defaultLoanStats, ...statsPayload, rejectedLoans: metrics.rejected, waitingApprovals: metrics.waiting })
        } else {
          setLoanStats({ ...defaultLoanStats, rejectedLoans: metrics.rejected, waitingApprovals: metrics.waiting })
        }
      } catch (error: any) {
        console.error('Failed to load owner-specific loans:', error)
        toast.error(error?.message || 'Gagal memuat data peminjaman pengguna ini')
        setLoans([])
        setLoanStats(defaultLoanStats)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()
    return () => {
      isMounted = false
    }
  }, [routeSlug, resolveOwnerBySlug, fetchLoans, fetchLoanStats])

  // Table removed from this page — per request table-specific filtering and pagination are omitted here.

  // Table selection / pagination handlers (used by LoanTable)
  const handleSelectAll = (checked: boolean, visibleIds?: string[]) => {
    if (checked) {
      setSelectedLoans(visibleIds ? visibleIds : loans.map(l => l.id))
    } else {
      setSelectedLoans([])
    }
  }

  const handleSelectLoan = (loanId: string, checked: boolean) => {
    if (checked) {
      setSelectedLoans(prev => Array.from(new Set([...prev, loanId])))
    } else {
      setSelectedLoans(prev => prev.filter(id => id !== loanId))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedLoans.length === 0) {
      toast.error('Pilih setidaknya satu peminjaman untuk dihapus')
      return
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedLoans.length} peminjaman yang dipilih?`)) return

    try {
      const response = await apiFetch('/api/loans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedLoans }),
      })

      if (response.ok) {
        const result = await response.json().catch(() => ({}))
        toast.success(result.message || 'Peminjaman berhasil dihapus')
        setSelectedLoans([])
        if (activeOwnerId) await fetchLoans(activeOwnerId)
      } else {
        const body = await response.json().catch(() => ({}))
        toast.error(body?.message || 'Gagal menghapus peminjaman')
      }
    } catch (err) {
      console.error('Error deleting loans:', err)
      toast.error('Terjadi kesalahan saat menghapus peminjaman')
    }
  }

  const handlePageChange = (_event: unknown, newPage: number) => {
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

      <UserHeroHeader currentUser={ownerUser} stats={loanStats} />

      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          maxWidth: 1650,
          width: '100%',
          py: 6,
          px: { xs: 2, md: 4, xl: 6 },
          mx: 'auto'
        }}
      >
        <Head>
          <title>Peminjaman Saya - FormFlow</title>
        </Head>

        {loans.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
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
            </Box>
            <FloatingActionButton />
          </>
        )}
      </Box>
    </ThemeProvider>
  )
}

export default function PersonalLoansPage() {
  return (
    <ThemeProvider theme={corporateTheme}>
      <PersonalLoansPageContent />
    </ThemeProvider>
  )
}
