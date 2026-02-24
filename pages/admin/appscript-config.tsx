import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Snackbar,
  Divider,
  Chip,
  Avatar,
  Stack,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  CloudUpload as CloudUploadIcon,
  TableChart as TableChartIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material'

import adminMailSettingsTheme from '../../themes/adminMailSettingsTheme'
import { AppsScriptConfig } from '../../data/appscript'

const AppscriptConfigPage: React.FC = () => {
  const [settings, setSettings] = useState<AppsScriptConfig>({
    spreadsheetId: '',
    scriptUrl: '',
    sheetName: 'Loan Submissions',
    enabled: false,
  })
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/google-settings')
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/google-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error('Failed to save settings')

      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setSnackbar({ open: true, message: 'Failed to save settings.', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof AppsScriptConfig) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [field]: event.target.value })
  }

  return (
    <ThemeProvider theme={adminMailSettingsTheme}>
      <CssBaseline />
      <Head>
        <title>appscript-config - Administrator</title>
        <meta name="description" content="Configure Apps Script / Google Sheets integration for form data submissions (appscript-config)" />
      </Head>

      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <SettingsIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">appscript-config</Typography>
                <Typography variant="body1" color="text.secondary">Configure Apps Script and Google Sheets integration for form data submissions (appscript-config)</Typography>
              </Box>
            </Box>
            <Divider />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
            <Box sx={{ flex: { xs: 1, lg: '2 1 0%' } }}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ p: 3, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CloudUploadIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight="600">Google Sheets Configuration</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">Set up your Google Sheets integration to automatically store form submissions</Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        <Box sx={{ flex: 1 }}>
                          <TextField fullWidth label="Spreadsheet ID" value={settings.spreadsheetId} onChange={handleChange('spreadsheetId')} helperText="The ID of your Google Spreadsheet (found in the URL)" variant="outlined" InputProps={{ startAdornment: <TableChartIcon sx={{ mr: 1, color: 'primary.main' }} /> }} sx={{ mb: 0 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <TextField fullWidth label="Sheet Name" value={settings.sheetName || 'Loan Submissions'} onChange={handleChange('sheetName')} helperText="The name of the sheet in your Google Spreadsheet" variant="outlined" InputProps={{ startAdornment: <TableChartIcon sx={{ mr: 1, color: 'primary.main' }} /> }} />
                        </Box>
                      </Box>
                      <Box sx={{ width: '100%' }}>
                        <TextField fullWidth label="Apps Script URL" value={settings.scriptUrl} onChange={handleChange('scriptUrl')} helperText="The deployment URL of your Google Apps Script" variant="outlined" InputProps={{ startAdornment: <CloudUploadIcon sx={{ mr: 1, color: 'secondary.main' }} /> }} />
                      </Box>
                    </Box>

                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {settings.spreadsheetId && settings.scriptUrl ? (
                          <>
                            <CheckCircleIcon sx={{ color: 'success.main' }} />
                            <Typography variant="body2" color="success.main" fontWeight="500">Configuration Complete</Typography>
                          </>
                        ) : (
                          <>
                            <InfoIcon sx={{ color: 'warning.main' }} />
                            <Typography variant="body2" color="warning.main" fontWeight="500">Please fill in all required fields</Typography>
                          </>
                        )}
                      </Stack>
                    </Box>

                    {settings.spreadsheetId && (
                      <Box sx={{ mt: 2 }}>
                        <Button variant="outlined" color="primary" startIcon={<TableChartIcon />} onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit`, '_blank')} sx={{ textTransform: 'none' }}>Open Google Spreadsheet</Button>
                      </Box>
                    )}

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="contained" color="primary" onClick={handleSave} disabled={loading} size="large" startIcon={<CloudUploadIcon />} sx={{ minWidth: 140 }}>{loading ? 'Saving...' : 'Save Settings'}</Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: { xs: 1, lg: '1 1 0%' } }}>
              <Stack spacing={3}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom>Column Mapping Guide</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Data form akan disimpan ke Google Sheets mulai dari baris 4. Pastikan header sudah dibuat manual di baris 3.</Typography>
                    <Chip label={`${Object.keys(settings).length} Fields Configured`} color="primary" variant="outlined" size="small" />
                  </CardContent>
                </Card>

                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom>Data Structure</Typography>
                    <Box sx={{ display: 'grid', gap: 1 }}>
                      {[
                        'A: Timestamp',
                        'B: Nama Peminjam',
                        'C: Entitas Peminjam',
                        'D: No Telepon',
                        'E: Kebutuhan Peminjaman',
                        'O: Detail Produk',
                        'P: Company',
                        'Q-S: Tanggal',
                        'T: Rincian Product',
                        'U: Metode Pengambilan',
                        'V: Catatan',
                        'W: Persetujuan SOP',
                      ].map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                          <Typography variant="caption" sx={{ minWidth: 20, fontWeight: 'bold', color: 'primary.main' }}>{item.split(':')[0]}</Typography>
                          <Typography variant="caption" color="text.secondary">: {item.split(':')[1]}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </ThemeProvider>
  )
}

export default AppscriptConfigPage
