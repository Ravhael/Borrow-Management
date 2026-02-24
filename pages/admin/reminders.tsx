import React, { useState } from 'react'
import Head from 'next/head'
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Fade,
} from '@mui/material'
import toast from 'react-hot-toast'
import adminRemindersTheme from '../../themes/adminRemindersTheme'
import HeroHeaderSection from '../../components/admin-reminders/HeroHeaderSection'
import ReminderScheduleSection from '../../components/admin-reminders/ReminderScheduleSection'
import EmailRecipientsSection from '../../components/admin-reminders/EmailRecipientsSection'
import ManualTriggerSection from '../../components/admin-reminders/ManualTriggerSection'
import ManualReminderActions from '../../components/admin-reminders/ManualReminderActions'
import HowItWorksSection from '../../components/admin-reminders/HowItWorksSection'

// Corporate Theme - Matching homepage design
const theme = adminRemindersTheme

const RemindersAdmin: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  React.useEffect(() => {
    let cancelled = false
    const fetchStatus = async () => {
      try {
        const r = await fetch('/api/reminders/status')
        if (!r.ok) return
        const j = await r.json()
        if (cancelled) return
        if (j?.lastRun) {
          setLastResult({
            remindersSent: j.lastRun.remindersSent || 0,
            loansChecked: j.lastRun.checkedLoans || j.lastRun.checked_loans || 0,
            lastCheck: j.lastRun.ranAt || j.lastRun.ran_at || null,
            raw: j.lastRun,
          })
        }
      } catch (err) {
        // ignore
      }
    }
    fetchStatus()
    return () => { cancelled = true }
  }, [refreshTrigger])

  const runReminderCheck = async () => {
    setIsRunning(true)
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        setLastResult(result)
        toast.success(`Pengecekan pengingat selesai! ${result.remindersSent} pengingat dikirim.`)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Gagal menjalankan pengecekan pengingat')
      }
    } catch (error) {
      console.error('Error running reminder check:', error)
      toast.error('Gagal menjalankan pengecekan pengingat')
    } finally {
      setIsRunning(false)
    }
  }

  const handleReminderSent = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
        <Head>
          <title>Reminder Management Center - FormFlow</title>
        </Head>

        {/* Hero Header Section */}
        <HeroHeaderSection lastResult={lastResult} />

        {/* Main Content */}
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', mx: 'auto' }}>
          <Fade in={true} timeout={800}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  lg: 'repeat(2, 1fr)'
                },
                gap: 3
              }}
            >
              <ReminderScheduleSection />
              <EmailRecipientsSection />
              <ManualTriggerSection
                isRunning={isRunning}
                lastResult={lastResult}
                runReminderCheck={runReminderCheck}
              />
              <ManualReminderActions onReminderSent={handleReminderSent} />
              <HowItWorksSection />
            </Box>
          </Fade>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default RemindersAdmin
