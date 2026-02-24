import React from 'react'
import directorates from '../../data/directorates.json'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
} from '@mui/material'
import {
  Business as BusinessIcon,
} from '@mui/icons-material'

interface EntityModalProps {
  open: boolean
  onClose: () => void
  isEditing: boolean
  formData: {
    value: string
    label: string
    isActive: boolean
    directorateId?: number | null
    headEmail: string
    financeEmail: string
    adminEmail: string
    othersEmail: string
  }
  onFormDataChange: (field: string, value: string | boolean | number | null) => void
  onSave: () => void
}

export default function EntityModal({
  open,
  onClose,
  isEditing,
  formData,
  onFormDataChange,
  onSave
}: EntityModalProps) {
  // directorates snapshot (read-only export) — using the imported `directorates`
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          background: 'linear-gradient(135deg, #1a365d 0%, #00d4aa 100%)',
          color: 'white',
          borderRadius: '4px 4px 0 0',
        }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 2, fontSize: 28 }} />
            <Typography component="div" variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
              {isEditing ? 'Edit Entity' : 'Add New Entity'}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
            {isEditing ? 'Update entity information and email mappings' : 'Create a new entity with email notification setup'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
        <Box sx={{ pt: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)'
              },
              gap: 3,
              mb: 4,
            }}
          >
            <TextField
              fullWidth
              label="Entity Value"
              value={formData.value}
              onChange={(e) => onFormDataChange('value', e.target.value)}
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.1)',
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="Display Label"
              value={formData.label}
              onChange={(e) => onFormDataChange('label', e.target.value)}
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.1)',
                  }
                }
              }}
            />
          </Box>

          {/* Directorates */}
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Directorate (Optional)</InputLabel>
              <Select
                value={formData.directorateId ?? ''}
                label="Directorate (Optional)"
                onChange={(e: any) => {
                  const val = e.target.value === '' ? null : Number(e.target.value)
                  onFormDataChange('directorateId', val)
                }}
              >
                <MenuItem value="">(none)</MenuItem>
                {directorates.map((d: any) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
              Status Configuration
            </Typography>
            <Paper
              sx={{
                p: 3,
                backgroundColor: 'rgba(26, 54, 93, 0.05)',
                border: '1px solid rgba(26, 54, 93, 0.1)',
                borderRadius: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => onFormDataChange('isActive', e.target.checked)}
                    color="primary"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00d4aa',
                        '& + .MuiSwitch-track': {
                          backgroundColor: '#00d4aa',
                        },
                      },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Entity Status: {formData.isActive ? 'Active' : 'Inactive'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {formData.isActive ? 'Entity will be available for selection' : 'Entity will be hidden from selection'}
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
              Email Notifications Setup
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)'
                },
                gap: 3
              }}
            >
              <TextField
                fullWidth
                label="Head Email"
                type="email"
                value={formData.headEmail}
                onChange={(e) => onFormDataChange('headEmail', e.target.value)}
                variant="outlined"
                placeholder="head@company.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.1)',
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Finance Email"
                type="email"
                value={formData.financeEmail}
                onChange={(e) => onFormDataChange('financeEmail', e.target.value)}
                variant="outlined"
                placeholder="finance@company.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.1)',
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Admin Email"
                type="email"
                value={formData.adminEmail}
                onChange={(e) => onFormDataChange('adminEmail', e.target.value)}
                variant="outlined"
                placeholder="admin@company.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.1)',
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Others Email"
                type="email"
                value={formData.othersEmail}
                onChange={(e) => onFormDataChange('othersEmail', e.target.value)}
                variant="outlined"
                placeholder="others@company.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.1)',
                    }
                  }
                }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          px: 4,
          pb: 4,
          pt: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 500,
            textTransform: 'none',
            borderColor: 'rgba(0, 0, 0, 0.23)',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.5)',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          sx={{
            borderRadius: 2,
            px: 4,
            fontWeight: 600,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #1a365d 0%, #00d4aa 100%)',
            boxShadow: '0 4px 14px rgba(26, 54, 93, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0f1419 0%, #00b894 100%)',
              boxShadow: '0 6px 20px rgba(26, 54, 93, 0.4)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {isEditing ? 'Update Entity' : 'Create Entity'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}