import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import {
  Box,
  Container,
  CircularProgress,
  Stack,
  Typography,
  CssBaseline,
  ThemeProvider
} from '@mui/material'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]'
import { prisma } from '../lib/prisma'
import { getCanonicalRole } from '../config/roleConfig'

// Themes and hero headers
import { corporateTheme } from '../theme/dashboardTheme'
import HeroHeader from '../components/dashboard/HeroHeader'
import marketingDashboardTheme from '../theme/marketingDashboardTheme'
import MarketingHeroHeader from '../components/marketingDashboard/MarketingHeroHeader'
import { userDashboardTheme } from '../theme/userDashboardTheme'
import UserHeroHeader from '../components/userDashboard/UserHeroHeader'
import gudangDashboardTheme from '../theme/gudangDashboardTheme'
import GudangHeroHeader from '../components/gudangDashboard/GudangHeroHeader'

// Shared components/utilities
import ActiveLoanCard from '../components/dashboard/ActiveLoanCard'
import FollowUpLoanSection from '../components/dashboard/FollowUpLoanSection'
import IncompleteReturnSection from '../components/dashboard/IncompleteReturnSection'
import LoanFineSection from '../components/dashboard/LoanFineSection'
import ReminderDueDateSection from '../components/shared/ReminderDueDateSection'
import RecentRequests from '../components/dashboard/RecentRequests'
import { buildDueDateReminders } from '../utils/dueDateReminderBuilder'
import { buildActiveLoanInfo } from '../utils/activeLoanHelpers'
import { DEFAULT_LOAN_SUMMARY_STATS, buildLoanSummaryStats } from '../utils/loanSummaryStats'
import { pushFineUpdates } from '../utils/fineSync'

export default function UnifiedDashboard({ initialUser }: { initialUser: any }) {
  const [currentUser, setCurrentUser] = useState<any>(initialUser)
  const [isLoading, setIsLoading] = useState(true)
  const [loans, setLoans] = useState<any[]>([])
  const [dueDateReminders, setDueDateReminders] = useState<any[]>([])
  const [recentRequests, setRecentRequests] = useState<any[]>([])
  const [activeLoanInfo, setActiveLoanInfo] = useState({ totalActive: 0 })
  const [stats, setStats] = useState({ ...DEFAULT_LOAN_SUMMARY_STATS })
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch loans + optional server-side stats
        const [loansResp, statsResp] = await Promise.all([fetch('/api/loans'), fetch('/api/loans/stats')])
        const loansData = await loansResp.json()
        const loansArr = Array.isArray(loansData) ? loansData : []
        setLoans(loansArr)

        const reminders = buildDueDateReminders(loansArr, { limit: 10, windowDays: 7 })
        setDueDateReminders(reminders)

        const loanStats = buildLoanSummaryStats(loansArr)
        if (statsResp.ok) {
          const payload = await statsResp.json()
          setStats({ ...loanStats, ...payload })
        } else {
          setStats(loanStats)
        }

        const recentLoans = loansArr
          .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 5)
          .map((loan: any) => ({
            id: loan.id,
            requesterName: loan.borrowerName,
            company: Array.isArray(loan.company) ? loan.company.join(', ') : loan.company || 'N/A',
            requestDate: loan.submittedAt?.split('T')[0] || '',
            status: loan.status || 'pending',
            urgency: loan.needType === 'PAMERAN_EVENT' ? 'high' : 'medium'
          }))
        setRecentRequests(recentLoans)
        setActiveLoanInfo(buildActiveLoanInfo(loansArr))
      } catch (err) {
        console.error('[dashboard] fetch error', err)
        setStats({ ...DEFAULT_LOAN_SUMMARY_STATS })
        setDueDateReminders([])
        setRecentRequests([])
      }

      setIsLoading(false)
    }

    void fetchData()
  }, [])

  useEffect(() => {
    if (!Array.isArray(loans) || loans.length === 0) return
    void pushFineUpdates(loans)
  }, [loans])

  if (!initialUser) {
    return <div>Loading...</div>
  }

  const roleKey = getCanonicalRole(initialUser.role)

  // Choose theme + header based on role
  const renderByRole = () => {
    switch (roleKey) {
      case 'admin':
      case 'superadmin':
        return {
          theme: corporateTheme,
          header: <HeroHeader stats={stats} />
        }
      case 'marketing':
        return {
          theme: marketingDashboardTheme,
          header: <MarketingHeroHeader currentUser={currentUser} stats={stats} />
        }
      case 'gudang':
        return {
          theme: gudangDashboardTheme,
          header: <GudangHeroHeader currentUser={currentUser} stats={stats} />
        }
      default:
        const userStats = {
          totalLoans: (stats as any).totalLoans ?? 0,
          activeLoans: (stats as any).activeLoans ?? 0,
          overdueLoans: (stats as any).overdueLoans ?? 0,
          completedLoans: (stats as any).completedLoans ?? 0,
          totalFine: (stats as any).totalFine ?? 0,
          pendingApprovals: (stats as any).pendingApprovals ?? 0,
          rejectedLoans: (stats as any).rejectedLoans ?? 0,
          waitingApprovals: (stats as any).waitingApprovals ?? 0,
        }

        return {
          theme: userDashboardTheme,
          header: <UserHeroHeader currentUser={currentUser} stats={userStats} />
        }
    }
  }

  const { theme, header } = renderByRole()

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'background.default' }}>
        <Stack direction="column" alignItems="center" spacing={2}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">Loading dashboard...</Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Head>
        <title>Dashboard</title>
      </Head>

      {header}

      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Container
          maxWidth={false}
          sx={{ width: '100%', maxWidth: { xs: '100%', xl: 1600 }, py: 6, px: { xs: 2, md: 4 }, mx: 'auto' }}
        >
          <ActiveLoanCard info={activeLoanInfo} isLoading={isLoading} />

          <FollowUpLoanSection loans={loans} isLoading={isLoading} />

          <IncompleteReturnSection loans={loans} isLoading={isLoading} />

          <LoanFineSection loans={loans} isLoading={isLoading} />

          <ReminderDueDateSection reminders={dueDateReminders} />

        </Container>
      </Box>
    </ThemeProvider>
  )
}

export const getServerSideProps = async (context: any) => {
  try {
    const session = await getServerSession(context.req, context.res, authOptions as any) as any
    if (!session || !session.user?.id) {
      return { redirect: { destination: '/login', permanent: false } }
    }

    const userId = String(session.user.id)
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true, directorate: true, entitas: true, sessions: true } })
    if (!user) return { props: { initialUser: null } }

    const initialUser = {
      id: user.id,
      name: user.name ?? '',
      email: user.email ?? '',
      username: user.username ?? '',
      role: user.role ? String(user.role.name) : '',
      phone: user.phone ?? '',
      directorate: user.directorate ? String(user.directorate.name) : null,
      directorateId: user.directorateid ?? null,
      entitasId: user.entitasid ? String(user.entitasid) : null,
      entitas: user.entitas ? String(user.entitas.name) : null,
      isActive: user.isActive
    }

    return { props: { initialUser } }
  } catch (err) {
    console.error('[dashboard] getServerSideProps error', err)
    return { props: { initialUser: null } }
  }
}
