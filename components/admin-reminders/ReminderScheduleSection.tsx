import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
} from '@mui/material'
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent
} from '@mui/lab'
import {
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material'

type DotColor = 'inherit' | 'primary' | 'secondary' | 'grey' | 'success' | 'warning' | 'error' | 'info'

type ScheduleEntry = {
  offset: number
  label: string
  description: string
  color: DotColor
}

const beforeSchedule: ScheduleEntry[] = [
  { offset: 7, label: '7 hari sebelum', description: 'Reminder otomatis H-7 sebelum tanggal kembali', color: 'info' },
  { offset: 3, label: '3 hari sebelum', description: 'Reminder otomatis H-3 sebelum tanggal kembali', color: 'warning' },
  { offset: 1, label: '1 hari sebelum', description: 'Reminder otomatis H-1 sebelum tanggal kembali', color: 'error' },
  { offset: 0, label: 'Hari yang sama', description: 'Reminder dikirim tepat pada tanggal kembali (H)', color: 'success' }
]

const afterSchedule: ScheduleEntry[] = Array.from({ length: 30 }, (_, idx) => {
  const day = idx + 1
  const label = `${day} hari setelah`
  const description = `Reminder otomatis H+${day} setelah tanggal kembali`
  const color: DotColor = day <= 3 ? 'error' : day <= 7 ? 'warning' : 'secondary'
  return { offset: -day, label, description, color }
})

const reminderSchedule: ScheduleEntry[] = [...beforeSchedule, ...afterSchedule]

function formatRelativeLabel(offset: number): string {
  if (offset === 0) return 'H'
  if (offset > 0) return `H-${offset}`
  return `H+${Math.abs(offset)}`
}

const ReminderScheduleSection: React.FC = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Card sx={{ height: 'fit-content', maxHeight: '460px', overflow: 'auto' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ScheduleIcon sx={{ fontSize: 28, color: 'primary.main', mr: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Reminder Schedule
          </Typography>
        </Box>

        {mounted ? (
          <Timeline position="alternate">
            {reminderSchedule.map((item) => (
              <TimelineItem key={item.offset}>
                <TimelineOppositeContent
                  sx={{ m: 'auto 0' }}
                  align="right"
                  variant="body2"
                  color="text.secondary"
                >
                  {formatRelativeLabel(item.offset)}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineConnector />
                  <TimelineDot color={item.color as any}>
                    <NotificationsIcon />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <Typography variant="h6" component="span">
                    {item.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        ) : (
          // Placeholder loading state
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Loading schedule...
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default ReminderScheduleSection