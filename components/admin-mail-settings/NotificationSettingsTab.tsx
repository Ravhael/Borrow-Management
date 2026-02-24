import React from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Avatar,
  Divider,
  Fade,
  LinearProgress,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material'

interface NotificationSettings {
  loanApprovals: boolean
  loanRejections: boolean
  paymentReminders: boolean
  overdueAlerts: boolean
  systemAlerts: boolean
  weeklyReports: boolean
}

interface NotificationSettingsTabProps {
  notificationSettings: NotificationSettings
  onNotificationUpdate: (field: keyof NotificationSettings, value: boolean) => void
  onSaveNotificationSettings: () => void
  isLoading: boolean
}

const NotificationSettingsTab: React.FC<NotificationSettingsTabProps> = ({
  notificationSettings,
  onNotificationUpdate,
  onSaveNotificationSettings,
  isLoading
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
            <NotificationsIcon sx={{ fontSize: 24, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
              Notification Settings
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
              Configure which events should trigger automated email notifications
            </Typography>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          {/* Loan Application Events */}
          <Card sx={{ mb: 4, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 20, color: 'white' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                  Loan Application Events
                </Typography>
              </Box>

              <List sx={{ p: 0 }}>
                <ListItem sx={{ px: 0, py: 3, borderRadius: 2, '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.04)' } }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                      <CheckCircleIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Loan Approvals"
                    secondary="Send email when loan applications are approved"
                    primaryTypographyProps={{
                      variant: 'body1',
                      fontWeight: 600,
                      color: 'text.primary'
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notificationSettings.loanApprovals}
                      onChange={(e) => onNotificationUpdate('loanApprovals', e.target.checked)}
                      color="success"
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider sx={{ my: 1 }} />

                <ListItem sx={{ px: 0, py: 3, borderRadius: 2, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.04)' } }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'error.light', color: 'error.main' }}>
                      <ErrorIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Loan Rejections"
                    secondary="Send email when loan applications are rejected"
                    primaryTypographyProps={{
                      variant: 'body1',
                      fontWeight: 600,
                      color: 'text.primary'
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notificationSettings.loanRejections}
                      onChange={(e) => onNotificationUpdate('loanRejections', e.target.checked)}
                      color="error"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Payment Events */}
          <Card sx={{ mb: 4, border: '1px solid', borderColor: 'divider' }}>
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
                  <NotificationsIcon sx={{ fontSize: 20, color: 'white' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  Payment Events
                </Typography>
              </Box>

              <List sx={{ p: 0 }}>
                <ListItem sx={{ px: 0, py: 3, borderRadius: 2, '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.04)' } }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                      <NotificationsIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Payment Reminders"
                    secondary="Send payment due date reminders"
                    primaryTypographyProps={{
                      variant: 'body1',
                      fontWeight: 600,
                      color: 'text.primary'
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notificationSettings.paymentReminders}
                      onChange={(e) => onNotificationUpdate('paymentReminders', e.target.checked)}
                      color="warning"
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider sx={{ my: 1 }} />

                <ListItem sx={{ px: 0, py: 3, borderRadius: 2, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.04)' } }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'error.light', color: 'error.main' }}>
                      <ErrorIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Overdue Alerts"
                    secondary="Send alerts for overdue payments"
                    primaryTypographyProps={{
                      variant: 'body1',
                      fontWeight: 600,
                      color: 'text.primary'
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notificationSettings.overdueAlerts}
                      onChange={(e) => onNotificationUpdate('overdueAlerts', e.target.checked)}
                      color="error"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* System Events */}
          <Card sx={{ mb: 6, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}
                >
                  <SettingsIcon sx={{ fontSize: 20, color: 'white' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                  System Events
                </Typography>
              </Box>

              <List sx={{ p: 0 }}>
                <ListItem sx={{ px: 0, py: 3, borderRadius: 2, '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.04)' } }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}>
                      <SettingsIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="System Alerts"
                    secondary="Send notifications for system maintenance and errors"
                    primaryTypographyProps={{
                      variant: 'body1',
                      fontWeight: 600,
                      color: 'text.primary'
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notificationSettings.systemAlerts}
                      onChange={(e) => onNotificationUpdate('systemAlerts', e.target.checked)}
                      color="info"
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider sx={{ my: 1 }} />

                <ListItem sx={{ px: 0, py: 3, borderRadius: 2, '&:hover': { bgcolor: 'rgba(0, 212, 170, 0.04)' } }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                      <AssessmentIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Weekly Reports"
                    secondary="Send weekly summary reports to administrators"
                    primaryTypographyProps={{
                      variant: 'body1',
                      fontWeight: 600,
                      color: 'text.primary'
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notificationSettings.weeklyReports}
                      onChange={(e) => onNotificationUpdate('weeklyReports', e.target.checked)}
                      color="secondary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              onClick={onSaveNotificationSettings}
              disabled={isLoading}
              variant="contained"
              size="large"
              startIcon={isLoading ? <LinearProgress sx={{ width: 20, height: 20, color: 'inherit' }} /> : <CheckCircleIcon />}
              sx={{
                minWidth: 250,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0f1419 0%, #1a365d 100%)',
                }
              }}
            >
              {isLoading ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Fade>
  )
}

export default NotificationSettingsTab