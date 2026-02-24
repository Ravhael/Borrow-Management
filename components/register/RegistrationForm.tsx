import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Alert,
  Avatar,
  Fade,
  MenuItem,
  Divider,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import WorkIcon from '@mui/icons-material/Work'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import Link from 'next/link'
import registerTheme from './RegisterTheme'
import { loginTheme } from '../../themes/loginTheme'

import directoratesData from '../../data/directorates.json'
// runtime entitas options should come from the DB-driven API

interface FormData {
  username: string
  fullName: string
  whatsapp: string
  email: string
  role: string
  directorateId?: number | ''
  entitasId?: number | ''
  password: string
  confirmPassword: string
}

interface RegistrationFormProps {
  // onSuccess will receive the created user object (without password)
  onSuccess: (createdUser: any) => void
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    fullName: '',
    whatsapp: '',
    email: '',
    role: '',
    directorateId: '',
    entitasId: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [rolesOptions, setRolesOptions] = useState<{ value: string; label: string }[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [rolesError, setRolesError] = useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    const fallback = (message = 'Account Types gagal dimuat') => {
      // Do not inject hardcoded selectable options when the DB fails — surface an error instead
      setRolesOptions([])
      setRolesError(message)
      setRolesLoading(false)
    }

    async function loadRolesFromDb() {
      try {
        const res = await fetch('/api/roles')
        const data = await res.json()
        if (!mounted) return
        if (data?.ok && Array.isArray(data.roles)) {
          const raw: any[] = data.roles

          // Map of categories we want (in preferred order)
          const categories = [
            { label: 'Peminjam', keywords: ['peminjam', 'borrower', 'user'] },
            { label: 'Marketing', keywords: ['market'] },
            { label: 'Warehouse', keywords: ['warehouse', 'gudang', 'wh'] },
          ]

          const options: Array<{ value: string; label: string }> = []

          for (const cat of categories) {
            const found = raw.find(r => {
              const n = String(r.name || r.id || '').toLowerCase()
              return cat.keywords.some(k => n.includes(k))
            })
            if (found) options.push({ value: String(found.id), label: cat.label })
          }

          if (options.length === 0) {
            // fallback if DB doesn't contain expected roles
            fallback()
          } else {
            setRolesOptions(options)
            setRolesError(null)
            setRolesLoading(false)
          }
        } else {
          fallback()
        }
      } catch (err) {
        console.error('Failed to load roles from DB', err)
        fallback()
      }
    }

    loadRolesFromDb()
    return () => { mounted = false }
  }, [])

  const handleInputChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    if (error) setError('')
  }

  const handleSelectChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  // Entitas filtered based on selected directorate
  // Only show entitas when directorate is selected; otherwise empty list
  const [entitasAll, setEntitasAll] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    async function loadEntitas(){
      try {
        const res = await fetch('/api/entitas')
        if (!res.ok) return
        const data = await res.json()
        if (mounted && Array.isArray(data)) setEntitasAll(data)
      } catch (err) {
        console.warn('Failed to fetch entitas options', err)
      }
    }
    loadEntitas()
    return () => { mounted = false }
  }, [])

  const entitasOptions = formData.directorateId ? entitasAll.filter((e) => String(e.directorateId) === String(formData.directorateId)) : []

  const handleCheckboxChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }))
  }

  const flatFieldSx = {
    '& .MuiOutlinedInput-root': {
      boxShadow: 'none !important',
      backgroundColor: 'transparent',
      transition: 'none',
      '&:hover': { boxShadow: 'none !important', backgroundColor: 'transparent' },
      '&.Mui-focused': {
        boxShadow: 'none !important',
        backgroundColor: 'transparent',
        outline: 'none'
      },
      '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.15)' },
      '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.25)' },
      '&.Mui-focused fieldset': {
        borderColor: registerTheme.palette.primary.main,
        borderWidth: '1px'
      }
    }
  }

  const flatInputProps = { className: 'flat-input' }

  const validateForm = () => {
    if (!formData.username || !formData.fullName || !formData.whatsapp || !formData.email || !formData.role || !formData.directorateId || !formData.entitasId || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    return true
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const payload = {
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        phone: formData.whatsapp.trim(),
        email: formData.email.trim(),
        role: formData.role,
        directorateId: formData.directorateId || null,
        entitasId: formData.entitasId || null,
        password: formData.password
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Registration failed' }))
        setError(err?.message || 'Registration failed')
        setLoading(false)
        return
      }

      const data = await res.json()
      // data.user should be the created user (without password), and isActive will be false
      onSuccess(data.user)

    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        pt: { xs: 6, md: 12 },
        pb: { xs: 6, md: 12 },
        minHeight: { xs: 'auto', md: '100vh' },
        display: 'flex',
        alignItems: { xs: 'flex-start', md: 'center' },
        background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
        position: 'relative',
        overflow: { xs: 'visible', md: 'hidden' },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 0 } }}>
        <Fade in={true} timeout={1000}>
          <Paper
            elevation={24}
            sx={{
              p: { xs: 3, md: 6 },
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              width: '100%',
              maxWidth: { xs: '100%', sm: 560, md: 700 },
              mx: 'auto'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: { xs: 64, md: 80 },
                  height: { xs: 64, md: 80 },
                  bgcolor: 'white',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 8px 25px rgba(26, 54, 93, 0.2)',
                  border: `2px solid ${registerTheme.palette.primary.main}`,
                }}
              >
                <PersonIcon sx={{ fontSize: { xs: 28, md: 40 }, color: registerTheme.palette.primary.main }} />
              </Avatar>
              <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: registerTheme.palette.primary.main, fontSize: { xs: '1.25rem', md: '1.75rem' } }}>
                Lakukan Pendaftaran Sekarang
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Buat akun Anda dan mulai kelola peminjaman barang gudang dengan lebih efisien
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
              {/* Username Field */}
              <TextField
                fullWidth
                label="NIK Karyawan"
                value={formData.username}
                onChange={handleInputChange('username')}
                required
                inputProps={flatInputProps}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                placeholder="NIK Karyawan"
                sx={{ mb: 3, ...flatFieldSx }}
              />

              {/* Full name */}
              <TextField
                fullWidth
                label="Nama Lengkap"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                required
                inputProps={flatInputProps}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                placeholder="Masukkan nama lengkap Anda"
                sx={{ mb: 3, ...flatFieldSx }}
              />

              {/* Whatsapp and Directorate/Entitas */}
              <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="No Whatsapp"
                  required
                  value={formData.whatsapp}
                  onChange={handleInputChange('whatsapp')}
                  inputProps={flatInputProps}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="e.g. +62 812 3456 7890"
                  sx={flatFieldSx}
                />

                <TextField
                  fullWidth
                  select
                  label="Direktorat"
                  required
                  value={String(formData.directorateId ?? '')}
                  onChange={(e) => setFormData(prev => ({ ...prev, directorateId: e.target.value ? Number(e.target.value) : '' }))}
                  inputProps={flatInputProps}
                  sx={flatFieldSx}
                >
                  <MenuItem value="">None</MenuItem>
                  {directoratesData.map((d: any) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <TextField
                  fullWidth
                  select
                  label="Entitas"
                  required
                  value={String(formData.entitasId ?? '')}
                  onChange={(e) => setFormData(prev => ({ ...prev, entitasId: e.target.value ? Number(e.target.value) : '' }))}
                  disabled={!formData.directorateId}
                  helperText={!formData.directorateId ? 'Silahkan Pilih Directorate terlebih dahulu' : ''}
                                  inputProps={flatInputProps}
                                  sx={flatFieldSx}
                >
                  {formData.directorateId ? (
                    [<MenuItem key="none" value="">None</MenuItem>, ...entitasOptions.map((en: any) => (
                      <MenuItem key={en.id} value={en.id}>{en.label ?? en.name}</MenuItem>
                    ))]
                  ) : (
                    <MenuItem value="" disabled>Silahkan Pilih Directorate terlebih dahulu</MenuItem>
                  )}
                </TextField>
              </Box>

              {/* Contact Fields */}
              <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="Alamat Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                  inputProps={flatInputProps}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Alamat email perusahaan"
                  sx={flatFieldSx}
                />
              </Box>

              {/* Role */}
              <TextField
                fullWidth
                select
                label="Tipe Akun"
                required
                value={formData.role}
                onChange={handleInputChange('role')}
                inputProps={flatInputProps}
                sx={{ mb: 3, ...flatFieldSx }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WorkIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                >
                  {rolesLoading ? (
                    <MenuItem value="" disabled>Memuat tipe akun...</MenuItem>
                  ) : rolesError ? (
                    <MenuItem value="" disabled>{rolesError}</MenuItem>
                  ) : rolesOptions.length === 0 ? (
                    <MenuItem value="" disabled>Tipe akun tidak tersedia</MenuItem>
                  ) : (
                    rolesOptions.map(role => (
                      <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                    ))
                  )}
                </TextField>

              {/* Password Fields */}
              <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="Kata Sandi"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  required
                  inputProps={flatInputProps}
                  sx={flatFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{
                            boxShadow: 'none',
                            backgroundColor: 'transparent',
                            '&:hover': { backgroundColor: 'transparent', boxShadow: 'none' },
                            '&:focus': { backgroundColor: 'transparent', boxShadow: 'none' }
                          }}
                        >
                          {showPassword ? <VisibilityOffIcon sx={{ color: registerTheme.palette.primary.main }} /> : <VisibilityIcon sx={{ color: registerTheme.palette.primary.main }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Buat kata sandi yang kuat"
                  helperText="Harus terdiri dari minimal 8 karakter"
                />
                <TextField
                  fullWidth
                  label="Konfirmasi Kata Sandi"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  required
                  inputProps={flatInputProps}
                  sx={flatFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          sx={{
                            boxShadow: 'none',
                            backgroundColor: 'transparent',
                            '&:hover': { backgroundColor: 'transparent', boxShadow: 'none' },
                            '&:focus': { backgroundColor: 'transparent', boxShadow: 'none' }
                          }}
                        >
                          {showConfirmPassword ? <VisibilityOffIcon sx={{ color: registerTheme.palette.primary.main }} /> : <VisibilityIcon sx={{ color: registerTheme.palette.primary.main }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Konfirmasi kata sandi"
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mb: 3,
                  background: `linear-gradient(135deg, ${loginTheme.palette.primary.main} 0%, ${loginTheme.palette.primary.dark} 100%)`,
                  boxShadow: '0 4px 14px rgba(26, 54, 93, 0.25)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 100%)`,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(26, 54, 93, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? 'Membuat Akun...' : 'Buat Akun Saya'}
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Sudah Punya Akun?{' '}
                <Link href="/login" passHref>
                  <Button
                    variant="text"
                    disableElevation
                    sx={{
                      color: registerTheme.palette.primary.main,
                      textTransform: 'none',
                      fontWeight: 600,
                      p: 0,
                      minWidth: 'auto',
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                      },
                      fontSize: { xs: '0.95rem', md: '1rem' }
                    }}
                  >
                    Masuk di sini
                  </Button>
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  )
}

export default RegistrationForm



