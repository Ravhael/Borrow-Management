import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material'
import roleSeeds from '../../data/roles.json'
import { menuGroups } from '../../config/menuGroups'

interface RoleDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: { id?: string; name: string; description?: string; permissions?: string[]; allowedMenus?: string[] }) => void
  editingRole?: any | null
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const FALLBACK_PERMISSIONS = ['admin', 'delete', 'manage_users', 'read', 'view_reports', 'write']
const derivedPermissions = Array.isArray(roleSeeds)
  ? roleSeeds.flatMap((role: { permissions?: string[] }) => (Array.isArray(role.permissions) ? role.permissions : []))
  : []
const PERMISSION_OPTIONS = Array.from(new Set([...FALLBACK_PERMISSIONS, ...derivedPermissions])).sort()

const normalizePermissions = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((perm): perm is string => typeof perm === 'string')
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        return normalizePermissions(parsed)
      } catch {
        // ignore malformed JSON and fall back to comma parsing
      }
    }
    return trimmed.split(',').map((perm) => perm.trim()).filter(Boolean)
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, any>)
      .filter(([, flag]) => Boolean(flag))
      .map(([key]) => key)
  }
  return []
}

const normalizeMenuGroups = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        return normalizeMenuGroups(parsed)
      } catch {
        // ignore
      }
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean)
  }
  if (typeof value === 'object') {
    try {
      const arr = Object.entries(value as Record<string, any>)
        .filter(([, flag]) => Boolean(flag))
        .map(([key]) => key)
      return arr
    } catch (err) {
      return []
    }
  }
  return []
}

const RoleDialog: React.FC<RoleDialogProps> = ({ open, onClose, onSave, editingRole }) => {
  const [id, setId] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [selectedPermissionsMap, setSelectedPermissionsMap] = useState<Record<string, string>>({ read: 'Disable', delete: 'Disable' })
  const [selectedMenus, setSelectedMenus] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string,string>>({})

  const ACTION_FIELDS: Array<{ key: string; label: string }> = [
    { key: 'read', label: 'Read / View' },
    { key: 'delete', label: 'Delete' },
  ]

  // New read permission levels (stored as values):
  const READ_LEVELS: Array<{ value: string; label: string; description?: string }> = [
    { value: 'Owner', label: 'Owner', description: 'Hanya data peminjaman yang diajukan oleh user tersebut' },
    { value: 'OwnEntitas', label: 'Own Entitas', description: 'Semua data peminjaman yang memiliki entitas yang sama dengan user' },
    { value: 'MarketingOwner', label: 'Marketing Owner', description: 'Data peminjaman untuk Marketing Owner (cocokkan mktCompany.userId)' },
    { value: 'OwnMarketing', label: 'Own Marketing', description: 'Semua data peminjaman yang mengacu pada company yang terkait dengan Entitas yang sama dengan user marketing' },
    { value: 'WarehouseOwner', label: 'Warehouse Owner', description: 'Data peminjaman untuk Warehouse Owner (cocokkan mktCompany.whId)' },
    { value: 'All', label: 'All Data', description: 'Akses ke semua data tanpa pembatasan' },
    { value: 'Disable', label: 'Disable', description: 'Tidak diizinkan melihat data' }
  ]

  const DELETE_LEVELS: Array<{ value: string; label: string }> = [
    { value: 'Own', label: 'Own' },
    { value: 'All', label: 'All' },
    { value: 'Disable', label: 'Disable' }
  ]
  const superAdminItems = useMemo(() => {
    const sg = Array.isArray(menuGroups) ? menuGroups.find(m => String(m.title).toLowerCase() === 'superadmin') : null
    return (sg && Array.isArray((sg as any).items)) ? (sg as any).items as Array<any> : []
  }, [])

  const superHrefSet = useMemo(() => new Set(superAdminItems.map(i => i.href)), [superAdminItems])

  const expandMenuSelection = React.useCallback((value: unknown): string[] => {
    // Accept arrays, strings, or object maps. Return array of hrefs.
    if (!value) return []
    const normalized = normalizeMenuGroups(value)
    const out = new Set<string>()
    normalized.forEach(v => {
      // if looks like an href, use directly
      if (String(v).startsWith('/')) {
        out.add(String(v))
        return
      }
      // if it matches a superadmin item href or label, use the href
      const byHref = superAdminItems.find(i => i.href === v)
      if (byHref) { out.add(byHref.href); return }
      const byLabel = superAdminItems.find(i => String(i.label).toLowerCase() === String(v).toLowerCase())
      if (byLabel) { out.add(byLabel.href); return }
      // if it matches a group title, expand that group's items
      const group = menuGroups.find(g => String(g.title).toLowerCase() === String(v).toLowerCase())
      if (group && Array.isArray((group as any).items)) {
        (group as any).items.forEach((it: any) => out.add(it.href))
      }
    })
    return Array.from(out)
  }, [superAdminItems])

  useEffect(() => {
    if (editingRole) {
      setId(editingRole.id || '')
      setName(editingRole.name || '')
      setDescription(editingRole.description || '')

      // normalize old permission formats: if object present, use it; otherwise fallback to disabling all
      const perms = editingRole.permissions
      if (perms && typeof perms === 'object' && !Array.isArray(perms)) {
        // map legacy 'Own' read -> 'Owner' for UI consistency
        const rawRead = String(perms.read ?? 'Disable')
        const mappedRead = (rawRead === 'Own') ? 'Owner' : rawRead
        setSelectedPermissionsMap({
          read: mappedRead,
          delete: String(perms.delete ?? 'Disable'),
        })
      } else {
        setSelectedPermissionsMap({ read: 'Disable', delete: 'Disable' })
      }

      setSelectedMenus(expandMenuSelection(editingRole.allowedMenus))

      setErrors({})
    } else {
      setId('')
      setName('')
      setDescription('')
      setSelectedPermissionsMap({ read: 'Disable', delete: 'Disable' })
      setSelectedMenus([])
      setErrors({});

      // When adding a new role, fetch existing roles to compute the next 3-digit role ID
      (async () => {
        try {
          const res = await fetch('/api/roles?includePrivileged=true')
          const j = await res.json().catch(() => ({ ok: false }))
          if (res.ok && Array.isArray(j.roles)) {
            const numericIds = j.roles
              .map((r: any) => parseInt(String(r.id || '').replace(/^0+/, '') || '0', 10))
              .filter((n: number) => Number.isFinite(n))
            const max = numericIds.length ? Math.max(...numericIds) : 0
            const next = String(max + 1).padStart(3, '0')
            setId(next)
            return
          }
        } catch (err) {
          // ignore and fall back to roleSeeds
        }

        // Fallback: derive from shipped role seeds
        try {
          const numericIds = roleSeeds
            .map((r: any) => parseInt(String(r.id || '').replace(/^0+/, '') || '0', 10))
            .filter((n: number) => Number.isFinite(n))
          const max = numericIds.length ? Math.max(...numericIds) : 0
          const next = String(max + 1).padStart(3, '0')
          setId(next)
        } catch (err) {
          setId('001')
        }
      })()
    }
  }, [editingRole, open, expandMenuSelection])

  const toggleMenu = (href: string) => {
    setSelectedMenus(prev => (prev.includes(href) ? prev.filter(x => x !== href) : [...prev, href]))
  }

  const setPermissionLevel = (key: string, value: string) => {
    setSelectedPermissionsMap(prev => ({ ...prev, [key]: value }))
  }



  const submit = async () => {
    setErrors({})
    if (!name.trim()) return setErrors({ name: 'Name is required' })
    let payload: any = { name: name.trim(), description: description.trim() || undefined }
    // Store permission mapping as an object: { create, read, update, delete }
    payload.permissions = selectedPermissionsMap
    payload.allowedMenus = selectedMenus
    if (!editingRole) {
      // id is auto-generated (3-digit) and read-only in the dialog; fallback to slugify(name) if missing
      payload.id = (id && id.trim()) ? id.trim() : slugify(name)
    }

    setSaving(true)
    try {
      await onSave(payload)
      onClose()
    } catch (err: any) {
      setErrors({ global: err?.message || 'Failed to save role' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ mb: 1 }}>{editingRole ? 'Edit Role' : 'Add Role'}</DialogTitle>
      <DialogContent>
        {errors.global && <Box sx={{ mb: 2 }}><Typography color="error">{errors.global}</Typography></Box>}
        <Box sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="Role ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={Boolean(editingRole)}
            InputProps={{ readOnly: true }}
            helperText={editingRole ? 'Role ID cannot be changed' : 'Automatically generated (3 digits)'}
            sx={{ mt: 1 }}
          />
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name}
            required
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <FormControl component="fieldset" sx={{ mt: 1 }}>
            <FormLabel component="legend" sx={{ fontWeight: 600 }}>Permissions</FormLabel>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mt: 1 }}>
              {ACTION_FIELDS.map((f) => (
                <FormControl fullWidth key={f.key} size="small">
                  <InputLabel id={`perm-${f.key}-label`}>{f.label}</InputLabel>
                  <Select
                    labelId={`perm-${f.key}-label`}
                    value={selectedPermissionsMap[f.key] || 'Disable'}
                    label={f.label}
                    onChange={(e) => setPermissionLevel(f.key, String(e.target.value))}
                  >
                    {f.key === 'read' ? (
                      READ_LEVELS.map((lvl) => (
                        <MenuItem key={lvl.value} value={lvl.value}>
                          <Tooltip title={lvl.description || ''} arrow placement="right">
                            <span>{lvl.label}</span>
                          </Tooltip>
                        </MenuItem>
                      ))
                    ) : (
                      DELETE_LEVELS.map((lvl) => (
                        <MenuItem key={lvl.value} value={lvl.value}>{lvl.label}</MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              ))} 
            </Box>
            <FormHelperText>Set the permission scope for each action. Read options: Owner / Own Entitas / Marketing Owner / Warehouse Owner / All / Disable.</FormHelperText>
          </FormControl>

          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend" sx={{ fontWeight: 600 }}>Allowed Menu</FormLabel>
            <FormGroup
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 0.5,
                maxHeight: 300,
                overflowY: 'auto',
                pr: 1,
              }}
            >
              {superAdminItems.map((item) => (
                <FormControlLabel
                  key={item.href}
                  control={
                    <Checkbox
                      checked={selectedMenus.includes(item.href)}
                      onChange={() => toggleMenu(item.href)}
                      color="primary"
                    />
                  }
                  label={item.label}
                />
              ))}
            </FormGroup>
            <FormHelperText>Select which sidebar menu items (from Superadmin) should be visible for this role.</FormHelperText>
            <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
              {selectedMenus.length} selected
            </Typography>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={saving}>Cancel</Button>
        <Button onClick={submit} variant="contained" disabled={saving}>{editingRole ? 'Update' : 'Create'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default RoleDialog
