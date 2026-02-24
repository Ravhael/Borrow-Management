import React from 'react'
import {
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material'
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material'
import { formatDate } from './utils/timelineHelpers'

interface NotificationDetailsProps {
  notifications: any
  title: string
  filterRoles?: (role: string) => boolean
}

const NotificationDetails: React.FC<NotificationDetailsProps> = ({
  notifications,
  title,
  filterRoles
}) => (
  <Accordion
    sx={{
      bgcolor: 'rgba(255,255,255,0.7)',
      borderRadius: 1,
      '&:before': { display: 'none' },
      boxShadow: 'none',
      border: '1px solid rgba(0,0,0,0.08)',
      mb: 1
    }}
  >
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      sx={{
        '& .MuiAccordionSummary-content': { alignItems: 'center' }
      }}
    >
      <BusinessIcon sx={{ mr: 1, color: '#1976d2' }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
    </AccordionSummary>
    <AccordionDetails sx={{ p: 0 }}>
      <List dense sx={{ width: '100%' }}>
        {Object.entries(notifications).map(([entity, roles]: [string, any]) => (
          <Box key={entity}>
            <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 600, color: '#424242' }}>
              {entity}
            </Typography>
            {Object.entries(roles).map(([role, status]: [string, any]) => {
              if (filterRoles && !filterRoles(role)) return null
              return (
                <ListItem key={role} sx={{ px: 4, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <PersonIcon sx={{ color: '#666' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {role}: {status.email}
                        </Typography>
                        <Chip
                          label={status.sent ? 'Terkirim' : 'Menunggu'}
                          color={status.sent ? 'success' : 'warning'}
                          size="small"
                          variant="filled"
                        />
                      </Box>
                    }
                    secondary={status.sent && status.sentAt ? formatDate(status.sentAt) : null}
                  />
                </ListItem>
              )
            })}
          </Box>
        ))}
      </List>
    </AccordionDetails>
  </Accordion>
)

export default NotificationDetails