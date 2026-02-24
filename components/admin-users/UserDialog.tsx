import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Button,
} from '@mui/material'
import directorates from '../../data/directorates.json'
import React, { useEffect, useState } from 'react'
import { getCanonicalRole } from '../../config/roleConfig'
// (imports consolidated above)

interface User {
  id: string
  name: string
  username: string
  email: string
  role: string
  entitasId?: string | number
  directorateId?: string | number
  isActive: boolean
}

interface UserFormData {
  name: string
  username: string
  email: string
  role: string
  entitasId: string | number
  directorateId: string
  isActive: boolean
}

interface FormErrors {
  name?: string
  username?: string
  email?: string
  role?: string
}

interface UserDialogProps {
  open: boolean
  editingUser: User | null
  userFormData: UserFormData
  formErrors: FormErrors
  onClose: () => void
  onSave: () => void
  onFormChange: (field: keyof UserFormData, value: any) => void
  saving?: boolean
}

const UserDialog: React.FC<UserDialogProps> = ({
  open,
  editingUser,
  userFormData,
  formErrors,
  onClose,
  onSave,
  onFormChange,
  saving = false,
}) => {
  const [roles, setRoles] = useState<Array<{ id?: string; name: string }>>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [entitasOptions, setEntitasOptions] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    async function loadEntitas() {
      try {
        const res = await fetch('/api/entitas')
        if (!res.ok) return
        const data = await res.json()
        if (mounted && Array.isArray(data)) setEntitasOptions(data)
      } catch (err) {
        console.warn('Failed to load entitas', err)
      }
    }
    loadEntitas()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    const loadRoles = async () => {
      setLoadingRoles(true)
      try {
        const res = await fetch('/api/roles?includePrivileged=true')
        if (!res.ok) throw new Error('fetch failed')
        const body = await res.json()
        if (mounted && body && Array.isArray(body.roles)) {
          setRoles(body.roles)
        }
      } catch (err) {
        console.warn('Failed to load roles from API', err)
      } finally {
        if (mounted) setLoadingRoles(false)
      }
    }

    loadRoles()
    return () => { mounted = false }
  }, [])

  // When roles available and current role is not among them, pick a sensible default
  useEffect(() => {
    if (roles.length === 0) return
    const availableIds = roles.map(r => r.id?.toString() ?? String(r.name))
    // if role is already set and exists leave it
    if (userFormData.role && availableIds.includes(String(userFormData.role))) return

    // prefer the role that canonicalizes to 'regular' (e.g. Peminjam)
    const preferred = roles.find(r => getCanonicalRole(r.name) === 'regular') || roles[0]
    if (preferred) onFormChange('role', preferred.id ?? preferred.name)
  }, [roles, userFormData.role, onFormChange])
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
        {editingUser && (editingUser as any).id ? 'Edit User' : 'Add New User'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Permissions are managed via Role settings and cannot be edited per-user here.
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
              label="Full Name"
              value={userFormData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
            />
            <TextField
              fullWidth
              label="Username"
              value={userFormData.username}
              onChange={(e) => onFormChange('username', e.target.value)}
              error={!!formErrors.username}
              helperText={formErrors.username}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={userFormData.email}
              onChange={(e) => onFormChange('email', e.target.value)}
              error={!!formErrors.email}
              helperText={formErrors.email}
              required
            />
            <FormControl fullWidth error={!!formErrors.role}>
              <InputLabel>Role</InputLabel>
              <Select
                value={userFormData.role ?? ''}
                label="Role"
                onChange={(e) => onFormChange('role', e.target.value)}
                disabled={loadingRoles}
              >
                {roles.map((r) => (
                  <MenuItem key={r.id ?? r.name} value={r.id ?? r.name}>{r.name}</MenuItem>
                ))}
              </Select>
              {formErrors.role && (
                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                  {formErrors.role}
                </Typography>
              )}
            </FormControl>
            {/* Directorate first (required to filter Entity) */}
            <FormControl fullWidth>
              <InputLabel>Directorate (Optional)</InputLabel>
              <Select
                value={userFormData.directorateId ?? ''}
                label="Directorate (Optional)"
                onChange={(e) => onFormChange('directorateId', e.target.value)}
              >
                <MenuItem value="">(none)</MenuItem>
                {((directorates as any[]) || []).map((d: any) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Entity dropdown — filtered by selected directorate. If no directorate chosen, show disabled helper text. */}
            <FormControl fullWidth>
              <InputLabel>Entity (Optional)</InputLabel>
              <Select
                value={userFormData.entitasId ?? ''}
                label="Entity (Optional)"
                onChange={(e) => onFormChange('entitasId', e.target.value)}
                disabled={!userFormData.directorateId}
              >
                <MenuItem value="">(none)</MenuItem>
                {((entitasOptions as any[]) || [])
                  .filter((it: any) => !userFormData.directorateId || String(it.directorateId) === String(userFormData.directorateId))
                  .map((it: any) => (
                    <MenuItem key={it.id ?? it.value} value={it.id ?? it.value}>{it.label ?? it.name}</MenuItem>
                  ))}
              </Select>
              {!userFormData.directorateId && (
                <Typography variant="caption" sx={{ mt: 1, ml: 2, color: 'text.secondary' }}>
                  Harap Pilih Directorate Terlebih Dahulu
                </Typography>
              )}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={userFormData.isActive ? 'active' : 'inactive'}
                label="Status"
                onChange={(e) => onFormChange('isActive', e.target.value === 'active')}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          color="primary"
          disabled={saving}
        >
          {saving ? ((editingUser && (editingUser as any).id) ? 'Saving...' : 'Creating...') : ((editingUser && (editingUser as any).id) ? 'Update User' : 'Add User')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UserDialog