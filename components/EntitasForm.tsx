import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import {
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Grid,
  Alert
} from '@mui/material'
import { FormDataShape } from '../types/form'
import { NeedType } from '../utils/needTypes'
// entitas is runtime data - fetch from DB-driven API instead of importing snapshot
import { getUserEmailByRole } from '../config/roleConfig'
import { UserRole } from '../types/sidebar'
import PersonIcon from '@mui/icons-material/Person'

type Props = {
  formData: FormDataShape
  setFormData: Dispatch<SetStateAction<FormDataShape>>
  errors: Record<string,string>
}

export default function EntitasForm({ formData, setFormData, errors }: Props){
  const [entitasOptions, setEntitasOptions] = useState<any[]>([])

  // fetch entitas from the API (DB source of truth)
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/entitas')
        if (!res.ok) return
        const data = await res.json()
        if (mounted && Array.isArray(data)) setEntitasOptions(data)
      } catch (err) {
        console.warn('Failed to load entitas from API', err)
      }
    }
    load()
    return () => { mounted = false }
  }, [])
  const [users, setUsers] = useState<any[]>([])
  const [currentRole, setCurrentRole] = useState<UserRole | ''>('')

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }

    fetchUsers()
  }, [])

  // Load current role from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem('currentRole')
    if (savedRole) {
      const normalizedRole = savedRole === 'user' ? 'regular' : savedRole
      const allowedRoles: UserRole[] = ['superadmin', 'admin', 'regular', 'marketing', 'gudang']
      if (allowedRoles.includes(normalizedRole as UserRole)) {
        setCurrentRole(normalizedRole as UserRole)
      }
    }
  }, [])

  // Auto-fill borrower name, email, phone and entitas from active user
  // But do not override values already provided (e.g. server-side session prefill)
  useEffect(() => {
    if (users.length > 0 && entitasOptions.length > 0 && currentRole && (!formData.borrowerName || !formData.borrowerEmail || !formData.borrowerPhone || !formData.entitasId)) {
      const activeUserName = localStorage.getItem('activeUser')
      const user = users.find(u => u.name === activeUserName)
      
      if (user) {
        setFormData(prev => ({
          ...prev,
          borrowerName: prev.borrowerName || user.name,
          borrowerEmail: prev.borrowerEmail || user.email,
          borrowerPhone: prev.borrowerPhone || user.phone || prev.borrowerPhone
        }))
        // Also try to auto-fill entitasId where user's record references an entitas id.
        // API entitasOptions use shape { id, value: code, label } — map user.entitasid (number) -> option.value (code)
        const userEntitasId = user.entitasid ?? user.entitasId ?? null
        if (userEntitasId && !formData.entitasId) {
          const match = entitasOptions.find(opt => Number(opt.id) === Number(userEntitasId))
          if (match) {
            setFormData(prev => ({ ...prev, entitasId: match.value }))
          }
        }
      } else {
        // Fallback: get user by role
        const userEmail = getUserEmailByRole(currentRole as UserRole, users)
        const roleUser = users.find(u => u.email === userEmail)
        
        if (roleUser) {
          setFormData(prev => ({
            ...prev,
            borrowerName: prev.borrowerName || roleUser.name,
            borrowerEmail: prev.borrowerEmail || roleUser.email,
            borrowerPhone: prev.borrowerPhone || roleUser.phone || prev.borrowerPhone
          }))
          // try to fill entitasId from role user's entitas reference as well
          const roleEntitasId = roleUser.entitasid ?? roleUser.entitasId ?? null
          if (roleEntitasId && !formData.entitasId) {
            const match = entitasOptions.find(opt => Number(opt.id) === Number(roleEntitasId))
            if (match) setFormData(prev => ({ ...prev, entitasId: match.value }))
          }
        }
      }
    }
  }, [users, entitasOptions, currentRole, setFormData, formData.borrowerName, formData.borrowerEmail, formData.borrowerPhone, formData.entitasId])

  useEffect(()=>{
    // parent controls visibility via state; keep for potential side-effects
  }, [formData.needType])

  return (
    <Box>


      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            id="borrowerName"
            name="borrowerName"
            label="Nama Peminjam"
            value={formData.borrowerName || ''}
            onChange={e => setFormData({...formData, borrowerName: e.target.value})}
            error={!!errors.borrowerName}
            helperText={errors.borrowerName}
            required
            variant="outlined"
            InputProps={{
              readOnly: true,
            }}
            sx={{
              '& .MuiInputBase-input': {
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
              }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth error={!!errors.entitasId}>
            <InputLabel id="entitas-label">Entitas Peminjam *</InputLabel>
            <Select
              labelId="entitas-label"
              id="entitasId"
              name="entitasId"
              value={formData.entitasId || ''}
              // Make Entitas Peminjam non-editable (read-only) per request
              // Use disabled so Select cannot be changed
              disabled
              label="Entitas Peminjam *"
              required
            >
              <MenuItem value="">
                <em>Pilih Entitas</em>
              </MenuItem>
              {entitasOptions.filter(option => option.isActive !== false).map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errors.entitasId && <FormHelperText>{errors.entitasId}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            id="borrowerPhone"
            name="borrowerPhone"
            label="No Telepon Peminjam"
            type="tel"
            value={formData.borrowerPhone || ''}
            // make phone readonly (not-editable)
            InputProps={{
              readOnly: true,
            }}
            onChange={e => setFormData({...formData, borrowerPhone: e.target.value})}
            error={!!errors.borrowerPhone}
            helperText={errors.borrowerPhone}
            required
            variant="outlined"
            sx={{
              '& .MuiInputBase-input': {
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
              }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            id="borrowerEmail"
            name="borrowerEmail"
            label="Email Peminjam"
            type="email"
            value={formData.borrowerEmail || ''}
            onChange={e => setFormData({...formData, borrowerEmail: e.target.value})}
            error={!!errors.borrowerEmail}
            helperText={errors.borrowerEmail || "Email ini akan digunakan untuk mengirim pengingat pengembalian barang"}
            required
            variant="outlined"
            InputProps={{
              readOnly: true,
            }}
            sx={{
              '& .MuiInputBase-input': {
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
              }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FormControl fullWidth>
            <InputLabel id="needType-label">Jenis Kebutuhan *</InputLabel>
            <Select
              labelId="needType-label"
              id="needType"
              name="needType"
              value={formData.needType || ''}
              onChange={e => setFormData({...formData, needType: e.target.value})}
              label="Jenis Kebutuhan *"
              required
            >
              <MenuItem value="">
                <em>Pilih Jenis Kebutuhan</em>
              </MenuItem>
              <MenuItem value={NeedType.DEMO_PRODUCT}>Demo Product</MenuItem>
              <MenuItem value={NeedType.BARANG_BACKUP}>Barang Backup</MenuItem>
              <MenuItem value={NeedType.ANALISA_TESTING}>Analisa & Testing Product</MenuItem>
              <MenuItem value={NeedType.DEMO_SHOWROOM}>Demo di Showroom</MenuItem>
              <MenuItem value={NeedType.PAMERAN_EVENT}>Pameran / Event</MenuItem>
              <MenuItem value={NeedType.LAINNYA}>Kebutuhan Lainnya</MenuItem>
            </Select>
            <FormHelperText>Untuk kebutuhan di luar list pilih opsi &quot;Kebutuhan Lainnya&quot; dan jelaskan.</FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  )
}
