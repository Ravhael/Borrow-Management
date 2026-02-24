import React, { useState } from 'react'
import Head from 'next/head'
import { Container, Box, ThemeProvider, Grid } from '@mui/material'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]'
import { prisma } from '../lib/prisma'
import { getCanonicalRole } from '../config/roleConfig'

// Import themes and components per role
import { adminProfileTheme } from '../theme/adminProfileTheme'
import AdminProfileHeroHeader from '../components/adminProfile/AdminProfileHeroHeader'
import AdminProfileInfo from '../components/adminProfile/AdminProfileInfo'
import AdminProfileSecurity from '../components/adminProfile/AdminProfileSecurity'
import AdminProfileActivity from '../components/adminProfile/AdminProfileActivity'

import { userProfileTheme } from '../theme/userProfileTheme'
import UserProfileHeroHeader from '../components/userProfile/UserProfileHeroHeader'
import UserProfileInfo from '../components/userProfile/UserProfileInfo'

import { marketingProfileTheme } from '../theme/marketingProfileTheme'
import MarketingProfileHeroHeader from '../components/marketingProfile/MarketingProfileHeroHeader'
import MarketingProfileInfo from '../components/marketingProfile/MarketingProfileInfo'

import { gudangProfileTheme } from '../theme/gudangProfileTheme'
import GudangProfileHeroHeader from '../components/gudangProfile/GudangProfileHeroHeader'
import GudangProfileInfo from '../components/gudangProfile/GudangProfileInfo'

export default function ProfilePage({ initialUser }: { initialUser: any }) {
  const [isEditing, setIsEditing] = useState(false)
  if (!initialUser) {
    return <div>Loading...</div>
  }

  const roleKey = getCanonicalRole(initialUser.role)

  // Render appropriate view based on role
  if (roleKey === 'admin' || roleKey === 'superadmin') {
    return (
      <ThemeProvider theme={adminProfileTheme}>
        <Head>
          <title>Profile</title>
        </Head>
        <AdminProfileHeroHeader />
        <Container maxWidth={false} sx={{ maxWidth: 1350, py: 6, px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'grid', gap: 4 }}>
            <Box>
              <AdminProfileInfo profile={initialUser} isEditing={isEditing} onProfileUpdate={() => {}} onEditToggle={() => setIsEditing(!isEditing)} onSave={() => {}} onCancel={() => setIsEditing(false)} />
            </Box>
            <Box>
              <AdminProfileSecurity securitySettings={{ twoFactorEnabled: false, loginAlerts: true, sessionTimeout: '30' }} onSecurityUpdate={() => {}} onPasswordChange={() => {}} />
            </Box>
            <Box>
              <AdminProfileActivity activityItems={[]} />
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    )
  }

  if (roleKey === 'marketing') {
    return (
      <ThemeProvider theme={marketingProfileTheme}>
        <Head>
          <title>Profile</title>
        </Head>
        <MarketingProfileHeroHeader marketingStats={{ activeCampaigns: 0, totalLeads: 0, conversionRate: 0, monthlyRevenue: 0 }} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'grid', gap: 4 }}>
            <MarketingProfileInfo profile={initialUser} isEditing={isEditing} onProfileUpdate={() => {}} onSave={() => {}} onCancel={() => {}} onEditToggle={() => setIsEditing(!isEditing)} />
          </Box>
        </Container>
      </ThemeProvider>
    )
  }

  if (roleKey === 'gudang') {
    return (
      <ThemeProvider theme={gudangProfileTheme}>
        <Head>
          <title>Profile</title>
        </Head>
        <GudangProfileHeroHeader gudangStats={{ totalInventory: 0, activeTransactions: 0, accuracyRate: 0, monthlyValue: 0 }} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'grid', gap: 4 }}>
            <GudangProfileInfo profile={initialUser} isEditing={isEditing} onProfileUpdate={() => {}} onEditToggle={() => setIsEditing(!isEditing)} onSave={() => {}} onCancel={() => setIsEditing(false)} />
          </Box>
        </Container>
      </ThemeProvider>
    )
  }

  // Default: regular user
  return (
    <ThemeProvider theme={userProfileTheme}>
      <Head>
        <title>Profile</title>
      </Head>
      <UserProfileHeroHeader userStats={{ totalRequests: 0, activeLoans: 0, completedPayments: 0, upcomingPayments: 0 }} loanStats={{ totalLoans: 0, activeLoans: 0, overdueLoans: 0, completedLoans: 0, totalFine: 0, pendingApprovals: 0 }} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'grid', gap: 4 }}>
          <UserProfileInfo currentUser={initialUser} formData={initialUser} isEditing={isEditing} isLoading={false} onInputChange={() => {}} onSave={() => {}} onCancel={() => {}} onEditToggle={() => setIsEditing(!isEditing)} />
        </Box>
      </Container>
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
    console.error('[profile] getServerSideProps error', err)
    return { props: { initialUser: null } }
  }
}
