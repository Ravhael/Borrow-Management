import React from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Alert,
  LinearProgress,
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
} from '@mui/icons-material'

interface ManualTriggerSectionProps {
  isRunning: boolean
  lastResult: any
  runReminderCheck: () => void
}

const ManualTriggerSection: React.FC<ManualTriggerSectionProps> = ({
  isRunning,
  lastResult,
  runReminderCheck
}) => {
  return (
    <Card sx={{ gridColumn: { xs: '1', lg: 'span 2' } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PlayIcon sx={{ fontSize: 28, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Manual Trigger
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Run reminder check immediately
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={runReminderCheck}
            disabled={isRunning}
            sx={{
              minWidth: 140,
              background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0f1419 0%, #1a365d 100%)',
              }
            }}
          >
            {isRunning ? (
              <>
                <LinearProgress sx={{ width: '100%', position: 'absolute', bottom: 0, left: 0 }} />
                Running...
              </>
            ) : (
              'Run Check'
            )}
          </Button>
        </Box>

        {lastResult && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2" suppressHydrationWarning>
              <strong>Last Check Results:</strong> {lastResult.remindersSent} reminders sent, {lastResult.loansChecked} loans checked
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default ManualTriggerSection