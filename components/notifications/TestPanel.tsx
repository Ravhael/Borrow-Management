import React from 'react'
import { Box, Card, CardContent, Typography, TextField, Button, Paper, Grid } from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { NotificationRule } from '../../types/rules'

interface TestPanelProps {
  sampleJson: string
  testResult: string
  onSampleJsonChange: (value: string) => void
  onTestRule: (rule: NotificationRule) => void
  onLoadExampleData: () => void
}

const TestPanel: React.FC<TestPanelProps> = ({
  sampleJson,
  testResult,
  onSampleJsonChange,
  onTestRule,
  onLoadExampleData
}) => {
  return (
    <Grid size={{ xs: 12, lg: 4 }}>
      <Card
        sx={{
          position: 'sticky',
          top: 24,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}
            >
              <PlayIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Rule Testing
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.5 }}>
            Validate your notification rules with sample form data in JSON format
          </Typography>

          <TextField
            label="Sample Form JSON"
            multiline
            rows={10}
            value={sampleJson}
            onChange={(e) => onSampleJsonChange(e.target.value)}
            placeholder={'{\n  "borrowerName": "John Doe",\n  "entitasId": "COMPANY_A",\n  "loanAmount": 50000\n}'}
            fullWidth
            variant="outlined"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }
            }}
          />

          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={onLoadExampleData}
              startIcon={<RefreshIcon />}
              sx={{ fontWeight: 600 }}
            >
              Load Example
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => onTestRule({} as NotificationRule)} // This will be handled by parent
              startIcon={<PlayIcon />}
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                }
              }}
            >
              Test Rule
            </Button>
          </Box>

          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Test Results
            </Typography>

            <Paper
              sx={{
                p: 3,
                minHeight: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: testResult.includes('MATCHED')
                  ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                  : testResult.includes('NOT match')
                  ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                  : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                border: 1,
                borderColor: testResult.includes('MATCHED')
                  ? 'success.main'
                  : testResult.includes('NOT match')
                  ? 'warning.main'
                  : 'divider',
                borderRadius: 3
              }}
            >
              {testResult ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, textAlign: 'center' }}>
                  {testResult.includes('MATCHED') ? (
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />
                  ) : testResult.includes('NOT match') ? (
                    <WarningIcon sx={{ color: 'warning.main', fontSize: 24 }} />
                  ) : (
                    <ErrorIcon sx={{ color: 'error.main', fontSize: 24 }} />
                  )}
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {testResult}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  Run a test to see results here
                </Typography>
              )}
            </Paper>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  )
}

export default TestPanel