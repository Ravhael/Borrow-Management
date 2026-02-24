import React from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
} from '@mui/material'
import {
  Email as EmailIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material'

const emailRecipients = [
  { icon: <PersonIcon />, label: 'Email peminjam (jika tersedia)', color: 'success' },
  { icon: <BusinessIcon />, label: 'Semua role di entitas terkait', color: 'primary' },
  { icon: <BusinessIcon />, label: 'Semua role di perusahaan terkait', color: 'primary' }
]

const EmailRecipientsSection: React.FC = () => {
  return (
    <Card sx={{ height: 'fit-content', maxHeight: '400px', overflow: 'auto' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EmailIcon sx={{ fontSize: 28, color: 'primary.main', mr: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Email Recipients
          </Typography>
        </Box>

        <List>
          {emailRecipients.map((recipient, index) => (
            <ListItem key={index} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: `${recipient.color}.main` }}>
                    {recipient.icon}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={recipient.label}
                />
              </Box>
              <Chip
                label="Active"
                size="small"
                color={recipient.color as any}
                variant="outlined"
                sx={{ mt: 0.5, ml: 7 }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}

export default EmailRecipientsSection