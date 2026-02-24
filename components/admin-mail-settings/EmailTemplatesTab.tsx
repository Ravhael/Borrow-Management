import React from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Switch,
  Tooltip,
  IconButton,
  Fade,
  Grid,
  Zoom,
} from '@mui/material'
import {
  Description as TemplateIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  type: 'loan_approval' | 'loan_rejection' | 'payment_reminder' | 'system_notification'
  isActive: boolean
  lastModified: string
}

interface EmailTemplatesTabProps {
  emailTemplates: EmailTemplate[]
  onTemplateToggle: (templateId: string) => void
  onAddTemplate: () => void
  getTemplateTypeColor: (type: string) => string
  getTemplateTypeLabel: (type: string) => string
}

const EmailTemplatesTab: React.FC<EmailTemplatesTabProps> = ({
  emailTemplates,
  onTemplateToggle,
  onAddTemplate,
  getTemplateTypeColor,
  getTemplateTypeLabel
}) => {
  return (
    <Fade in={true} timeout={600}>
      <Box sx={{ p: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, mb: 4, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
              <TemplateIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                Email Templates
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Manage and customize email templates for different notification types
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddTemplate}
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0f1419 0%, #1a365d 100%)',
              }
            }}
          >
            Add Template
          </Button>
        </Box>

        <Grid container spacing={3}>
          {emailTemplates.map((template, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={template.id}>
              <Zoom in={true} timeout={800 + index * 100}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'visible',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.3, color: 'text.primary' }}>
                          {template.name}
                        </Typography>
                        <Chip
                          label={getTemplateTypeLabel(template.type)}
                          size="small"
                          sx={{
                            bgcolor: getTemplateTypeColor(template.type),
                            color: 'white',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            mb: 2
                          }}
                        />
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                          Subject: {template.subject}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Modified: {new Date(template.lastModified).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={template.isActive}
                            onChange={() => onTemplateToggle(template.id)}
                            size="small"
                            color="primary"
                          />
                        }
                        label=""
                        sx={{ mr: 0 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Edit Template" arrow>
                        <IconButton size="small" sx={{ color: 'primary.main' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Preview Template" arrow>
                        <IconButton size="small" sx={{ color: 'info.main' }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Duplicate Template" arrow>
                        <IconButton size="small" sx={{ color: 'success.main' }}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Fade>
  )
}

export default EmailTemplatesTab