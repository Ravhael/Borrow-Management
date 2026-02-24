import React from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  Divider,
  Fade,
  Grid,
  LinearProgress,
  Zoom,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material'

interface SMTPSettings {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  fromEmail: string
  fromName: string
}

interface SMTPConfigurationTabProps {
  smtpSettings: SMTPSettings
  onSmtpUpdate: (field: keyof SMTPSettings, value: string | number | boolean) => void
  onSaveSmtpSettings: () => void
  notes?: string | undefined
  onNotesChange?: (value: string) => void
  isLoading: boolean
  testEmail: string
  setTestEmail: (email: string) => void
  onSendTestEmail: () => void
  testResult: { success: boolean; message: string; details?: string } | null
}

const SMTPConfigurationTab: React.FC<SMTPConfigurationTabProps> = ({
  smtpSettings,
  onSmtpUpdate,
  onSaveSmtpSettings,
  isLoading,
  testEmail,
  setTestEmail,
  onSendTestEmail,
  testResult,
  notes,
  onNotesChange,
}) => {
  return (
    <Fade in={true} timeout={600}>
      <Box sx={{ p: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 3
            }}
          >
            <SettingsIcon sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
              SMTP Configuration
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
              Configure your SMTP server settings for secure and reliable email delivery
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="SMTP Host"
              value={smtpSettings.host}
              onChange={(e) => onSmtpUpdate('host', e.target.value)}
              placeholder="smtp.gmail.com"
              fullWidth
              variant="outlined"
              sx={{ mb: 3 }}
            />

            <TextField
              label="Port"
              type="number"
              value={smtpSettings.port}
              onChange={(e) => onSmtpUpdate('port', parseInt(e.target.value))}
              placeholder="587"
              fullWidth
              variant="outlined"
              sx={{ mb: 3 }}
            />

            <TextField
              label="Username"
              value={smtpSettings.username}
              onChange={(e) => onSmtpUpdate('username', e.target.value)}
              placeholder="your-email@gmail.com"
              fullWidth
              variant="outlined"
              sx={{ mb: 3 }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Password"
              type="password"
              value={smtpSettings.password}
              onChange={(e) => onSmtpUpdate('password', e.target.value)}
              placeholder="Your email password or app password"
              fullWidth
              variant="outlined"
              sx={{ mb: 3 }}
            />

            <TextField
              label="From Email"
              type="email"
              value={smtpSettings.fromEmail}
              onChange={(e) => onSmtpUpdate('fromEmail', e.target.value)}
              placeholder="noreply@company.com"
              fullWidth
              variant="outlined"
              sx={{ mb: 3 }}
            />

            <TextField
              label="From Name"
              value={smtpSettings.fromName}
              onChange={(e) => onSmtpUpdate('fromName', e.target.value)}
              placeholder="Company Loan System"
              fullWidth
              variant="outlined"
              sx={{ mb: 3 }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mb: 4 }}>
          <FormControlLabel
            control={
              <Switch
                checked={smtpSettings.secure}
                onChange={(e) => onSmtpUpdate('secure', e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={
              <Box sx={{ ml: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Use SSL/TLS (Secure Connection)
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Enable secure connection for encrypted email transmission
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            label="Notes (dev only)"
            value={notes ?? ''}
            onChange={(e) => onNotesChange?.(e.target.value)}
            placeholder="Optional notes for this configuration (stored in DB)"
            fullWidth
            multiline
            minRows={1}
            maxRows={3}
            variant="outlined"
            sx={{ mb: 3 }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 6 }}>
          <Button
            onClick={onSaveSmtpSettings}
            disabled={isLoading}
            variant="contained"
            size="large"
            startIcon={isLoading ? <LinearProgress sx={{ width: 20, height: 20, color: 'inherit' }} /> : <CheckCircleIcon />}
            sx={{ minWidth: 200, fontSize: '1.1rem' }}
          >
            {isLoading ? 'Saving...' : 'Save SMTP Settings'}
          </Button>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* Test Email Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 3
              }}
            >
              <SendIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                Test Email Configuration
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Verify your SMTP settings are working correctly by sending a test email
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
              mb: 4,
              flexDirection: { xs: 'column', sm: 'row' }
            }}
          >
            <TextField
              label="Test Email Address"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              fullWidth
              variant="outlined"
            />

            <Button
              onClick={onSendTestEmail}
              disabled={isLoading || !testEmail}
              variant="outlined"
              size="large"
              startIcon={isLoading ? <LinearProgress sx={{ width: 20, height: 20, color: 'inherit' }} /> : <PlayIcon />}
              sx={{
                minWidth: { xs: '100%', sm: 160 },
                fontSize: '1rem',
                fontWeight: 600,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'rgba(26, 54, 93, 0.04)'
                }
              }}
            >
              {isLoading ? 'Sending...' : 'Send Test'}
            </Button>
          </Box>

          {testResult && (
            <Zoom in={true} timeout={500}>
              <Alert
                severity={testResult.success ? 'success' : 'error'}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                icon={testResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
              >
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {testResult.message}
                </Typography>
                {testResult.details ? (
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', whiteSpace: 'pre-wrap' }}>{testResult.details}</Typography>
                ) : null}
              </Alert>
            </Zoom>
          )}
        </Box>
      </Box>
    </Fade>
  )
}

export default SMTPConfigurationTab