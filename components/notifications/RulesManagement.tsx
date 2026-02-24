import React from 'react'
import { Box, Typography, Button, Card, CardContent, Chip, Divider, IconButton, Tooltip, FormControlLabel, Switch, Fade, Grid } from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Add as AddIcon
} from '@mui/icons-material'
import { NotificationRule } from '../../types/rules'

interface RulesManagementProps {
  rules: NotificationRule[]
  onEdit: (rule: NotificationRule) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onExport: () => void
  onImport: (file: File) => void
  onCreateRule: () => void
}

const RulesManagement: React.FC<RulesManagementProps> = ({
  rules,
  onEdit,
  onDelete,
  onToggle,
  onExport,
  onImport,
  onCreateRule
}) => {
  return (
    <Fade in={true} timeout={1200}>
      <Box>
        {/* Header with Actions */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, mb: 4, gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
              Notification Rules
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Configure automated email notifications based on form submission data
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={onExport}
              sx={{ fontWeight: 600 }}
            >
              Export Rules
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              component="label"
              sx={{ fontWeight: 600 }}
            >
              Import Rules
              <input
                type="file"
                accept=".json"
                hidden
                onChange={(e) => e.target.files && onImport(e.target.files[0])}
              />
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreateRule}
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0f1419 0%, #1a365d 100%)',
                }
              }}
            >
              New Rule
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Rules List */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Box sx={{ mb: 4 }}>
              {rules.map((rule, index) => (
                <Card
                  key={rule.id}
                  sx={{
                    mb: 3,
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {rule.name}
                          </Typography>
                          <Chip
                            label={rule.enabled ? 'Active' : 'Inactive'}
                            color={rule.enabled ? 'success' : 'default'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>

                        {rule.conditions.length > 0 && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
                              Conditions:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {rule.conditions.map((cond, idx) => (
                                <Chip
                                  key={idx}
                                  label={`${cond.field} ${cond.operator} "${cond.value}"`}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    borderColor: 'primary.light',
                                    color: 'primary.main'
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Created: {new Date(rule.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                          {' • '}
                          Updated: {new Date(rule.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                        <Tooltip title="Edit Rule" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onEdit(rule)}
                            sx={{
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'primary.light',
                                color: 'primary.dark'
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Rule" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onDelete(rule.id)}
                            sx={{
                              color: 'error.main',
                              '&:hover': {
                                backgroundColor: 'error.light',
                                color: 'error.dark'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Status:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {rule.enabled ? (
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'success.main' }} />
                          ) : (
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'text.disabled' }} />
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 500, color: rule.enabled ? 'success.main' : 'text.secondary' }}>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </Typography>
                        </Box>
                      </Box>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={rule.enabled}
                            onChange={() => onToggle(rule.id)}
                            color="primary"
                            size="small"
                          />
                        }
                        label=""
                        sx={{ mr: 0 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  )
}

export default RulesManagement