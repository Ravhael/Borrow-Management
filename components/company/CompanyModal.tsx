import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material'

interface CompanyModalProps {
  open: boolean
  onClose: () => void
  isEditing: boolean
  formData: {
    value: string
    label: string
    description?: string
    isActive: boolean
    userId?: string | null
    whId?: string | null
    headEmail: string
    marketingEmail: string
    financeEmail: string
    adminEmail: string
    warehouseEmail: string
    othersEmail: string
  }
  onFormDataChange: (field: string, value: any) => void
  warehouseUsers?: Array<{ id: string; name?: string; email?: string }>

  onSave: () => void
  users?: Array<{ id: string; name?: string; email?: string }>
}

const CompanyModal: React.FC<CompanyModalProps> = ({
  open,
  onClose,
  isEditing,
  formData,
  onFormDataChange,
  onSave,
  users,
  warehouseUsers,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(0, 212, 170, 0.1) 0%, transparent 100%)',
            borderRadius: 'inherit',
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            {isEditing ? (
              <>
                <EditIcon sx={{ fontSize: '1.5rem' }} />
                Edit Perusahaan
              </>
            ) : (
              <>
                <AddIcon sx={{ fontSize: '1.5rem' }} />
                Tambah Perusahaan
              </>
            )}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ pt: 1 }}>
          {/* Company Information Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <BusinessIcon sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
              Informasi Perusahaan
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
                label="Value"
                value={formData.value}
                onChange={(e) => onFormDataChange('value', e.target.value)}
                required
                variant="outlined"
                placeholder="e.g., IVP Richard"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Label"
                value={formData.label}
                onChange={(e) => onFormDataChange('label', e.target.value)}
                required
                variant="outlined"
                placeholder="e.g., IVP Richard"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Description"
                value={(formData as any).description ?? ''}
                onChange={(e) => onFormDataChange('description', e.target.value)}
                variant="outlined"
                placeholder="Short description (optional)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                    }
                  }
                }}
              />
              {/* User owner selector */}
              <FormControl fullWidth>
                <InputLabel id="company-owner-label">Marketing Owner</InputLabel>
                <Select
                  labelId="company-owner-label"
                  label="Marketing Owner"
                  value={(formData as any).userId ?? ''}
                  onChange={(e) => onFormDataChange('userId', e.target.value === '' ? null : e.target.value)}
                >
                  <MenuItem value="">— none —</MenuItem>
                    {users && users.length > 0 ? (
                      users.map(u => (
                        <MenuItem key={u.id} value={u.id}>{u.name ? `${u.name} — ${u.id}` : u.email ?? u.id}</MenuItem>
                      ))
                    ) : null}
                </Select>
              </FormControl>

              {/* Warehouse user selector */}
              <FormControl fullWidth>
                <InputLabel id="company-warehouse-label">Warehouse User</InputLabel>
                <Select
                  labelId="company-warehouse-label"
                  label="Warehouse User"
                  value={(formData as any).whId ?? ''}
                  onChange={(e) => onFormDataChange('whId', e.target.value === '' ? null : e.target.value)}
                >
                  <MenuItem value="">— none —</MenuItem>
                    {typeof (warehouseUsers) !== 'undefined' && warehouseUsers && warehouseUsers.length > 0 ? (
                      warehouseUsers.map(u => (
                        <MenuItem key={u.id} value={u.id}>{u.name ? `${u.name} — ${u.id}` : u.email ?? u.id}</MenuItem>
                      ))
                    ) : null}
                </Select>
              </FormControl>
              <Box sx={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 2 }}>
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
                  label=""
                />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Status Aktif
                </Typography>
                <Chip
                  label={formData.isActive ? 'Aktif' : 'Nonaktif'}
                  color={formData.isActive ? 'success' : 'default'}
                  size="small"
                  sx={{
                    borderRadius: 1,
                    fontWeight: 600,
                    backgroundColor: formData.isActive
                      ? 'rgba(0, 212, 170, 0.1)'
                      : 'rgba(158, 158, 158, 0.1)',
                    color: formData.isActive ? '#00d4aa' : '#9e9e9e',
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Email Mapping Section */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <EmailIcon sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
              Email Mapping
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
                placeholder="head@example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Marketing Email"
                type="email"
                value={formData.marketingEmail}
                onChange={(e) => onFormDataChange('marketingEmail', e.target.value)}
                variant="outlined"
                placeholder="marketing@example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
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
                placeholder="finance@example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
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
                placeholder="admin@example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Warehouse Email"
                type="email"
                value={formData.warehouseEmail}
                onChange={(e) => onFormDataChange('warehouseEmail', e.target.value)}
                variant="outlined"
                placeholder="warehouse@example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
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
                placeholder="others@example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
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
          gap: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)'
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            borderColor: 'rgba(0, 0, 0, 0.23)',
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.4)',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          Batal
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
            boxShadow: '0 4px 12px rgba(26, 54, 93, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0f1419 0%, #1a365d 100%)',
              boxShadow: '0 6px 20px rgba(26, 54, 93, 0.4)',
            }
          }}
        >
          Simpan
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CompanyModal