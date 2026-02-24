import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Card,
  CardContent,
  Container,
} from '@mui/material'
import { Settings as SettingsIcon } from '@mui/icons-material'

// Import theme and components
import adminMailSettingsTheme from '../../themes/adminMailSettingsTheme'
import HeroHeaderSection from '../../components/admin-mail-settings/HeroHeaderSection'
import MetricsDashboardSection from '../../components/admin-mail-settings/MetricsDashboardSection'
import SMTPConfigurationTab from '../../components/admin-mail-settings/SMTPConfigurationTab'

interface SMTPSettings {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  fromEmail: string
  fromName: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  type: 'loan_approval' | 'loan_rejection' | 'payment_reminder' | 'system_notification'
  isActive: boolean
  lastModified: string
}

interface NotificationSettings {
  loanApprovals: boolean
  loanRejections: boolean
  paymentReminders: boolean
  overdueAlerts: boolean
  systemAlerts: boolean
  weeklyReports: boolean
}

export default function MailSettings() {
  // Start with neutral/empty SMTP settings; real values are loaded from DB/file/env via loadSettings()
  const [smtpSettings, setSmtpSettings] = useState<SMTPSettings>({
    host: '',
    port: 0,
    secure: false,
    username: '',
    password: '',
    fromEmail: '',
    fromName: ''
  })

  // Templates are loaded from API/DB — start empty until loadSettings() populates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])

  // Notification toggles default to false; use loadSettings() to populate actual values
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    loanApprovals: false,
    loanRejections: false,
    paymentReminders: false,
    overdueAlerts: false,
    systemAlerts: false,
    weeklyReports: false
  })

  const [isLoading, setIsLoading] = useState(false)
  const [mailNotes, setMailNotes] = useState<string | undefined>(undefined)
  const [testEmail, setTestEmail] = useState('')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null)
  // no template dialog anymore - page only exposes SMTP settings

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // In real app, fetch from API
      // const smtpResponse = await fetch('/api/admin/mailsettings/smtp')
      // const templatesResponse = await fetch('/api/admin/mailsettings/templates')
      // const notificationsResponse = await fetch('/api/admin/mailsettings/notifications')

      // Load the mail-settings.json (dev-only) and use it to populate SMTP settings if present
      // Prefer DB-backed MailSettings (if present) — fall back to file-based config for dev
      try {
        const rdb = await fetch('/api/admin/mailsettings/db')
        if (rdb.ok) {
          const row = await rdb.json()
          if (row?.smtp) setSmtpSettings((prev) => ({ ...prev, ...(row.smtp as any) }))
          if (row?.notes) setMailNotes(row.notes)
        } else {
          // fallback to reading file
          const r = await fetch('/api/admin/mailsettings/config')
          if (r.ok) {
            const cfg = await r.json()
            if (cfg?.smtp) setSmtpSettings((prev) => ({ ...prev, ...(cfg.smtp as any) }))
          }
        }
      } catch (err) {
        console.debug('mail-settings config/db not available', err)
      }
      console.log('Settings loaded')
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSmtpUpdate = (field: keyof SMTPSettings, value: string | number | boolean) => {
    setSmtpSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNotificationUpdate = (field: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTemplateToggle = (templateId: string) => {
    setEmailTemplates(prev =>
      prev.map(template =>
        template.id === templateId
          ? { ...template, isActive: !template.isActive }
          : template
      )
    )
  }

  const saveSmtpSettings = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/mailsettings/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtp: smtpSettings, notes: mailNotes })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(err?.message || 'Failed to save')
      }

      const data = await res.json()
      // refresh local state from server response
      if (data?.smtp) setSmtpSettings((prev) => ({ ...prev, ...(data.smtp as any) }))
      if (data?.notes) setMailNotes(data.notes)

      alert('SMTP settings saved successfully!')
    } catch (error: any) {
      alert('Failed to save SMTP settings: ' + (error?.message ?? 'unknown'))
    } finally {
      setIsLoading(false)
    }
  }

  const saveNotificationSettings = async () => {
    setIsLoading(true)
    try {
      // In real app, save to API
      // await fetch('/api/admin/mailsettings/notifications', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(notificationSettings)
      // })

      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      alert('Notification settings saved successfully!')
    } catch (error) {
      alert('Failed to save notification settings')
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      setTestResult({ success: false, message: 'Please enter a test email address' })
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      // Call server endpoint which attempts to send via current SMTP configuration
      const response = await fetch('/api/admin/mailsettings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to send test email' }))
        setTestResult({ success: false, message: err?.message ?? 'Failed to send test email', details: err?.details ?? undefined })
      } else {
        const body = await response.json().catch(() => ({ message: 'Test email request completed' }))
        setTestResult({ success: true, message: body?.message ?? `Test email sent successfully to ${testEmail}`, details: body?.info ? JSON.stringify(body.info) : undefined })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Network error occurred while sending test email' })
    } finally {
      setIsLoading(false)
    }
  }

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'loan_approval': return '#10b981'
      case 'loan_rejection': return '#ef4444'
      case 'payment_reminder': return '#f59e0b'
      case 'system_notification': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'loan_approval': return 'Approval'
      case 'loan_rejection': return 'Rejection'
      case 'payment_reminder': return 'Reminder'
      case 'system_notification': return 'System'
      default: return type
    }
  }

  return (
    <ThemeProvider theme={adminMailSettingsTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Head>
          <title>FormFlow - Email System Management</title>
          <meta name="description" content="Professional email configuration and notification management system" />
        </Head>

        {/* Hero Header Section */}
        <HeroHeaderSection />

        {/* Metrics Dashboard */}
        <MetricsDashboardSection
          emailTemplates={emailTemplates}
          notificationSettings={notificationSettings}
        />

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ pb: 8 }}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 4,
                py: 3
              }}
            >
              <SettingsIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Box sx={{ fontSize: '1.1rem', fontWeight: 600 }}>SMTP Configuration</Box>
                <Box sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
                  Manage SMTP credentials and send test emails
                </Box>
              </Box>
            </Box>

            <CardContent sx={{ p: 0 }}>
              <SMTPConfigurationTab
                smtpSettings={smtpSettings}
                onSmtpUpdate={handleSmtpUpdate}
                onSaveSmtpSettings={saveSmtpSettings}
                notes={mailNotes}
                onNotesChange={(v) => setMailNotes(v)}
                isLoading={isLoading}
                testEmail={testEmail}
                setTestEmail={setTestEmail}
                onSendTestEmail={sendTestEmail}
                testResult={testResult}
              />
            </CardContent>
          </Card>
        </Container>

        {/* Add Template Dialog removed — templates are hidden on this admin view */}
      </Box>
    </ThemeProvider>
  )
}