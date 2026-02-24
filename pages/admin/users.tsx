import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Paper,
  Fade,
  Zoom,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Alert,
  Skeleton,
  LinearProgress,
  Checkbox
} from '@mui/material'
import toast from 'react-hot-toast'
import ResetPasswordDialog from '../../components/admin-users/ResetPasswordDialog'
import ActivityLogDialog from '../../components/admin-users/ActivityLogDialog'
import NotificationHistoryDialog from '../../components/admin-users/NotificationHistoryDialog'
import { getCanonicalRole } from '../../config/roleConfig'
import { withBasePath } from '../../utils/basePath'
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  TrendingUp as MarketingIcon,
  Inventory as WarehouseIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material'

// Import theme and components
import adminUsersTheme from '../../themes/adminUsersTheme'
import LoadingState from '../../components/admin-users/LoadingState'
import ErrorState from '../../components/admin-users/ErrorState'
import HeroHeaderSection from '../../components/admin-users/HeroHeaderSection'
import SearchControlsSection from '../../components/admin-users/SearchControlsSection'
import DataTableSection from '../../components/admin-users/DataTableSection'
import BulkActionsPanel from '../../components/admin-users/BulkActionsPanel'
import DeleteDialog from '../../components/admin-users/DeleteDialog'
import UserDialog from '../../components/admin-users/UserDialog'
import RolesTable from '../../components/admin-users/RolesTable'
import RoleDialog from '../../components/admin-users/RoleDialog'
interface User {
  id: string
  username: string
  name: string
  email: string
  role: string
  entitasId?: string
  directorateId?: string | number
  isActive: boolean
  IsLoggedIn?: boolean
  permissions: string[]
}

export default function AdminUsers() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Roles table state
  const [roles, setRoles] = useState<Array<any>>([])
  const [rolesLoading, setRolesLoading] = useState<boolean>(true)
  const [rolesError, setRolesError] = useState<string | null>(null)

  // UI State
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [directorateFilter, setDirectorateFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Dialog States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  // Reset password dialog states
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null)
  // Activity / Audit dialog
  const [auditDialogOpen, setAuditDialogOpen] = useState(false)
  const [auditTargetUser, setAuditTargetUser] = useState<User | null>(null)
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false)
  const [notificationsTargetUser, setNotificationsTargetUser] = useState<User | null>(null)

  // Add/Edit User Dialog States
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: 'Peminjam',
    entitasId: '',
    directorateId: '',
    isActive: true,
  })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        // normalize keys from API (entitasid, directorateid) -> camelCase for front-end
        const normalized = (data.users || []).map((u: any) => ({
          ...u,
          entitasId: u.entitasId ?? u.entitasid ?? u.entitas ?? '',
          directorateId: u.directorateId ?? u.directorateid ?? u.directorate ?? ''
        }))
        setUsers(normalized)
      } else {
        setError('Failed to fetch users')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch roles for admin list
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true)
    setRolesError(null)
    try {
      const r = await fetch('/api/roles?includePrivileged=true')
      if (r.ok) {
        const j = await r.json()
        setRoles(j.roles || [])
      } else {
        setRolesError('Failed to fetch roles')
      }
    } catch (err) {
      console.error('Failed to fetch roles', err)
      setRolesError('Failed to fetch roles')
    } finally {
      setRolesLoading(false)
    }
  }, [])

  const checkAccessAndFetchUsers = useCallback(async () => {
    try {
      // Check if user has admin access
      const userResponse = await fetch('/api/users')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        // For now, assume first admin user or check current session
        // In a real app, you'd check the current user's session/role
        // Accept both 'admin' and 'superadmin' role names (DB may contain 'Admin' or 'Superadmin')
        const adminUser = userData.users.find((u: User) => {
          const canonical = getCanonicalRole(u.role)
          return canonical === 'admin' || canonical === 'superadmin'
        })
        if (!adminUser) {
          router.push('/admin/dashboard')
          return
        }
        setCurrentUser(adminUser)
      }

      await fetchUsers()
      await fetchRoles()
    } catch (err) {
      console.error('Error checking access:', err)
      router.push('/admin/dashboard')
    }
  }, [fetchUsers, router, fetchRoles])

  // Role dialog state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any | null>(null)

  const handleSaveRole = async (payload: { id?: string; name: string; description?: string; permissions?: string[] }) => {
    try {
      if (editingRole) {
        // update
        const res = await fetch(`/api/roles?id=${encodeURIComponent(editingRole.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) {
          const b = await res.json().catch(() => ({}))
          throw new Error(b?.error || 'Failed to update role')
        }
        const j = await res.json()
        setRoles(prev => prev.map(r => r.id === j.role.id ? j.role : r))
      } else {
        // create
        const res = await fetch('/api/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) {
          const b = await res.json().catch(() => ({}))
          throw new Error(b?.error || 'Failed to create role')
        }
        const j = await res.json()
        setRoles(prev => [...prev, j.role])
      }
      // refresh list to keep order
      fetchRoles()
    } catch (err: any) {
      console.error('Role save failed', err)
      throw err
    }
  }

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/roles?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        toast.error(b?.error || 'Failed to delete role')
        return
      }
      setRoles(prev => prev.filter(r => r.id !== id))
      toast.success('Role deleted')
    } catch (err) {
      console.error('Delete role failed', err)
      toast.error('Failed to delete role')
    }
  }

  useEffect(() => {
    checkAccessAndFetchUsers()
    // open SSE connection to receive live presence updates
    if (typeof window !== 'undefined') {
      const presenceUrl = withBasePath('/api/presence/subscribe')
      let source: EventSource | null = null
      let aborted = false
      let retryMs = 2000

      const open = () => {
        if (aborted) return
        try {
          source = new EventSource(presenceUrl)
          source.addEventListener('presence', (e: any) => {
            try {
              const payload = JSON.parse(e.data)
              const { userId, IsLoggedIn } = payload
              if (!userId) return
              setUsers(prev => prev.map(u => u.id === userId ? { ...u, IsLoggedIn } : u))
            } catch (err) {
              console.error('presence event parse error', err)
            }
          })
          source.addEventListener('initial', (e: any) => {
            try {
              const payload = JSON.parse(e.data)
              if (!payload?.rows) return
              const onlineIds = new Set(payload.rows.map((r: any) => r.id))
              setUsers(prev => prev.map(u => ({ ...u, IsLoggedIn: onlineIds.has(u.id) })))
            } catch (err) {
              console.error('initial presence parse error', err)
            }
          })

          source.onerror = (err) => {
            // schedule reconnect when connection closes
            try {
              if (source?.readyState === EventSource.CLOSED && !aborted) {
                setTimeout(() => { if (!aborted) open() }, retryMs)
                retryMs = Math.min(30_000, retryMs * 2)
              }
            } catch {}
          }
        } catch (err) {
          console.warn('Failed to open presence SSE', err)
          setTimeout(() => { if (!aborted) open() }, retryMs)
          retryMs = Math.min(30_000, retryMs * 2)
        }
      }

      open()

      // cleanup
      return () => { aborted = true; if (source) source.close() }
    }
  }, [checkAccessAndFetchUsers])

  // derive directorate and entity options from the fetched users
  const directorateOptions = React.useMemo(() => {
    const setVals = new Set<string>()
    users.forEach(u => {
      const d = String(u.directorateId ?? '').trim()
      if (d) setVals.add(d)
    })
    return Array.from(setVals).sort((a, b) => a.localeCompare(b))
  }, [users])

  const entityOptions = React.useMemo(() => {
    const setVals = new Set<string>()
    users.forEach(u => {
      const e = String(u.entitasId ?? '').trim()
      if (e) setVals.add(e)
    })
    return Array.from(setVals).sort((a, b) => a.localeCompare(b))
  }, [users])

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role.toLowerCase() === roleFilter.toLowerCase()
    const matchesStatus = statusFilter === 'all' ||
               (statusFilter === 'active' && user.isActive) ||
               (statusFilter === 'inactive' && !user.isActive)

    const userDirectorate = String(user.directorateId ?? '').trim()
    const matchesDirectorate = directorateFilter === 'all' || userDirectorate.toLowerCase() === directorateFilter.toLowerCase()

    const userEntity = String(user.entitasId ?? '').trim()
    const matchesEntity = entityFilter === 'all' || userEntity.toLowerCase() === entityFilter.toLowerCase()

    return matchesSearch && matchesRole && matchesStatus && matchesDirectorate && matchesEntity
  })

  // Pagination
  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  const handleBulkActivate = async () => {
    if (selectedUsers.length === 0) return

    try {
      // Update selected users to active
      // Optimistically update UI
      setUsers(users.map(user => selectedUsers.includes(user.id) ? { ...user, isActive: true } : user ))

      // Persist changes via API for each selected user
      await Promise.all(selectedUsers.map(id =>
        fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: id, userData: { isActive: true } })
        })
      ))
      setSelectedUsers([])
    } catch (err) {
      console.error('Error bulk activating users:', err)
    }
  }

  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0) return

    try {
      // Update selected users to inactive
      setUsers(users.map(user => selectedUsers.includes(user.id) ? { ...user, isActive: false } : user ))

      // Persist changes
      await Promise.all(selectedUsers.map(id =>
        fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: id, userData: { isActive: false } })
        })
      ))
      setSelectedUsers([])
    } catch (err) {
      console.error('Error bulk deactivating users:', err)
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedUserId(userId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedUserId('')
  }

  // Get role icon and color
  const getRoleInfo = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin':
        // highlight superadmins differently from regular admins
        return { icon: <AdminIcon />, color: 'secondary', bgColor: '#f3e8ff' }
      case 'administrator':
      case 'admin':
        return { icon: <AdminIcon />, color: 'error', bgColor: '#ffebee' }
      case 'peminjam':
      case 'user':
        // peminjam and regular users get the primary blue color
        return { icon: <PersonIcon />, color: 'primary', bgColor: '#e3f2fd' }
      case 'user':
        return { icon: <PersonIcon />, color: 'primary', bgColor: '#e3f2fd' }
      case 'marketing':
        return { icon: <MarketingIcon />, color: 'success', bgColor: '#e8f5e8' }
      case 'gudang':
      case 'warehouse':
        return { icon: <WarehouseIcon />, color: 'warning', bgColor: '#fff3e0' }
      default:
        return { icon: <PersonIcon />, color: 'default', bgColor: '#f5f5f5' }
    }
  }

  const getStatusColor = (user: User) => {
    const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'active': 'success',
      'inactive': 'error'
    }
    return user.isActive ? 'success' : 'error'
  }

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleResetPassword = (user: User) => {
    setResetTargetUser(user)
    setResetDialogOpen(true)
  }

  const handleConfirmResetPassword = async (newPassword: string, sendEmail: boolean) => {
    if (!resetTargetUser) return
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetTargetUser.id, newPassword, sendEmail })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('Reset password failed', body)
        toast.error('Gagal reset password')
        return
      }

      // mark user logged out and notify
      setUsers(users.map(u => u.id === resetTargetUser.id ? { ...u, IsLoggedIn: false } : u))
      toast.success(sendEmail ? 'Password reset and email sent' : 'Password reset successfully')
      setResetDialogOpen(false)
      setResetTargetUser(null)
    } catch (err) {
      console.error('Error resetting password', err)
      toast.error('Gagal reset password')
    }
  }

  const handleImpersonateUser = (user: User) => {
    // Start impersonation flow via server API
    if (!confirm(`Anda akan masuk sebagai ${user.name || user.email}. Lanjutkan?`)) return
    ;(async () => {
      try {
        const res = await fetch('/api/users/impersonate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          console.error('Impersonation failed', body)
          toast.error(body.message || 'Gagal memulai impersonasi')
          return
        }

        toast.success('Impersonation started — now signed in as ' + (user.name || user.email))
        // navigate to app root so new session takes effect
        window.location.href = withBasePath('/')
      } catch (err) {
        console.error('Impersonation error', err)
        toast.error('Error saat memulai impersonasi')
      }
    })()
  }

  const handleNotificationsUser = (user: User) => {
    setNotificationsTargetUser(user)
    setNotificationsDialogOpen(true)
  }

  const handleForceLogout = async (user: User) => {
    try {
      const res = await fetch('/api/users/force-logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('Force logout failed', body)
        toast.error('Gagal memaksa logout')
        return
      }

      // Optimistically update UI (set IsLoggedIn false)
      setUsers(users.map(u => u.id === user.id ? { ...u, IsLoggedIn: false } : u))
      const body = await res.json().catch(() => ({}))
      const subs = (body?.sseSubscribers ?? 0)
      const deleted = (body?.deletedSessions ?? 0)
      if (subs > 0) {
        toast.success(`User berhasil dipaksa logout — client notified (${subs} connection${subs>1?'s':''}).`)
      } else {
        toast.success(`User sessions revoked (${deleted} session${deleted>1?'s':''}) — target not connected, they will be signed out shortly.`)
      }
    } catch (err) {
      console.error('Error forcing logout:', err)
      toast.error('Gagal memaksa logout')
    }
  }

  const handleAuditUser = (user: User) => {
    // Open activity / audit modal
    setAuditTargetUser(user)
    setAuditDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      // Persist deletion to the server
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userToDelete.id })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('Failed to delete user on server', body)
        // keep dialog open so admin can retry (or show feedback) — we'll close and clear selection for now
        setDeleteDialogOpen(false)
        setUserToDelete(null)
        return
      }

      // Update UI after server confirms deletion
      setUsers(users.filter(u => u.id !== userToDelete.id))
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (err) {
      console.error('Error deleting user:', err)
    }
  }

  // Handle add/edit user modal
  const handleOpenUserDialog = (user?: User) => {
    if (user) {
      // Edit mode
      setEditingUser(user)
      setUserFormData({
        // ensure we never pass undefined into controlled inputs
        name: (user.name ?? '') as string,
        username: (user.username ?? '') as string,
        email: (user.email ?? '') as string,
          // use DB role id so the dialog Select (role.id values) matches options
          role: (user as any).roleid ?? (user as any).role ?? '',
        entitasId: (user as any).entitasId ?? (user as any).entitasid ?? (user as any).entitas ?? '',
        directorateId: (user as any).directorateId ?? (user as any).directorateid ?? (user as any).directorate ?? '',
        isActive: !!user.isActive,
      })
    } else {
      // Add mode
      setEditingUser(null)
      setUserFormData({
        name: '',
        username: '',
        email: '',
        role: '',
        entitasId: '',
        directorateId: '',
        isActive: true,
      })
    }
    setFormErrors({})
    setUserDialogOpen(true)
  }

  const handleCloseUserDialog = () => {
    setUserDialogOpen(false)
    setEditingUser(null)
    setUserFormData({
      name: '',
      username: '',
      email: '',
      role: '',
      entitasId: '',
      directorateId: '',
      isActive: true,
    })
    setFormErrors({})
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!userFormData.name.trim()) errors.name = 'Name is required'
    if (!userFormData.username.trim()) errors.username = 'Username is required'
    if (!userFormData.email.trim()) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(userFormData.email)) errors.email = 'Email is invalid'

    // Check for duplicate username/email
    const existingUser = users.find(u =>
      u.id !== editingUser?.id &&
      (u.username === userFormData.username || u.email === userFormData.email)
    )
    if (existingUser) {
      if (existingUser.username === userFormData.username) {
        errors.username = 'Username already exists'
      }
      if (existingUser.email === userFormData.email) {
        errors.email = 'Email already exists'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveUser = async () => {
    if (!validateForm()) return
    setSavingUser(true)

    try {
      if (editingUser && (editingUser as any).id) {
        // Update existing user and persist via API
          // Persist update to API and update UI with API response (use server canonical role name)
          try {
            const res = await fetch('/api/users', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: editingUser.id, userData: {
                name: userFormData.name,
                username: userFormData.username,
                email: userFormData.email,
                role: userFormData.role, // now role is role.id
                entitasid: userFormData.entitasId || null,
                directorateid: userFormData.directorateId || null,
                isActive: userFormData.isActive,
              } })
            })

            if (!res.ok) {
              const b = await res.json().catch(() => ({}))
              console.error('Failed to update user on server', b)
              toast.error('Gagal memperbarui user')
              setSavingUser(false)
              return
            }

            const body = await res.json()
            const updated = body.user
            // Update UI with server canonicalized user object
            setUsers(users.map(u => u.id === editingUser.id ? updated : u))
            toast.success('User berhasil diperbarui')
            handleCloseUserDialog()
            setSavingUser(false)
          } catch (e) {
            console.error('Failed to persist updated user:', e)
            toast.error('Gagal memperbarui user')
          }

      } else {
        // Add new user via API (create). Use a temporary password — admin should ask user to reset.
        try {
          const payload = {
            username: userFormData.username,
            fullName: userFormData.name,
            email: userFormData.email,
            role: userFormData.role,
            entitasId: userFormData.entitasId || null,
            directorateId: userFormData.directorateId || null,
            phone: '',
            password: 'changeme' // temporary; recommend reset
          }

          const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          if (!res.ok) {
            console.error('Failed to create user via API')
            toast.error('Gagal membuat user')
            setSavingUser(false)
            return
          }

          const body = await res.json()
          // append created user and show success toast
          setUsers(prev => [...prev, body.user])
          toast.success('User berhasil dibuat')
          handleCloseUserDialog()
          setSavingUser(false)

        } catch (e) {
          console.error('Failed to create user via API:', e)
        }
      }

      handleCloseUserDialog()
      setSavingUser(false)
    } catch (err) {
      console.error('Error saving user:', err)
      setSavingUser(false)
    }
  }

  const handleFormChange = (field: string, value: any) => {
    setUserFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Metrics calculation
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.isActive).length
  const inactiveUsers = totalUsers - activeUsers
  const adminUsers = users.filter(u => {
    const canonical = getCanonicalRole(u.role)
    return canonical === 'admin' || canonical === 'superadmin'
  }).length

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchUsers} />
  }

  return (
    <ThemeProvider theme={adminUsersTheme}>
      <CssBaseline />
      <Head>
        <title>User Management - Admin</title>
        <meta name="description" content="Admin user management dashboard" />
      </Head>

      <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>

        {/* Hero Header Section - Full Width */}
        <HeroHeaderSection
          totalUsers={totalUsers}
          activeUsers={activeUsers}
          inactiveUsers={inactiveUsers}
          adminUsers={adminUsers}
          totalRoles={roles.length}
        />

        <Box sx={{ maxWidth: 1550, py: 6, px: { xs: 2, md: 4 }, mx: 'auto' }}>

          {/* Search and Controls */}
          <SearchControlsSection
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
            onAddUser={handleOpenUserDialog}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            roleOptions={(roles || []).map(r => r.name || r.id).filter(Boolean)}
            directorateFilter={directorateFilter}
            onDirectorateFilterChange={setDirectorateFilter}
            directorateOptions={directorateOptions}
            entityFilter={entityFilter}
            onEntityFilterChange={setEntityFilter}
            entityOptions={entityOptions}
          />

          {/* Data Table */}
          <DataTableSection
            paginatedUsers={paginatedUsers}
            selectedUsers={selectedUsers}
            page={page}
            rowsPerPage={rowsPerPage}
            filteredUsers={filteredUsers}
            searchTerm={searchTerm}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            directorateFilter={directorateFilter}
            entityFilter={entityFilter}
            onSelectAll={handleSelectAll}
            onSelectUser={handleSelectUser}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            getRoleInfo={getRoleInfo}
            getStatusColor={getStatusColor}
            onEdit={(user) => handleOpenUserDialog(user)}
            onDelete={(user) => handleDeleteUser(user)}
            onResetPassword={(user) => handleResetPassword(user)}
            onImpersonate={(user) => handleImpersonateUser(user)}
            onAudit={(user) => handleAuditUser(user)}
            onNotifications={(user) => handleNotificationsUser(user)}
            onForceLogout={(user) => handleForceLogout(user)}
          />

          {/* Roles table */}
          <RolesTable
            roles={roles}
            loading={rolesLoading}
            error={rolesError}
            onRefresh={() => fetchRoles()}
            onAdd={() => { setEditingRole(null); setRoleDialogOpen(true) }}
            onEdit={(r: any) => { setEditingRole(r); setRoleDialogOpen(true) }}
            onDelete={(id: string) => { handleDeleteRole(id) }}
          />

          <RoleDialog
            open={roleDialogOpen}
            onClose={() => setRoleDialogOpen(false)}
            editingRole={editingRole}
            onSave={async (payload) => await handleSaveRole(payload)}
          />
        </Box>

        {/* Floating Bulk Actions Panel */}
        <BulkActionsPanel
          selectedUsers={selectedUsers}
          onBulkActivate={handleBulkActivate}
          onBulkDeactivate={handleBulkDeactivate}
          onClearSelection={() => setSelectedUsers([])}
        />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        userToDelete={userToDelete}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeleteUser}
      />

      {/* Add/Edit User Dialog */}
      <UserDialog
        open={userDialogOpen}
        editingUser={editingUser}
        userFormData={userFormData}
        formErrors={formErrors}
        onClose={handleCloseUserDialog}
        onSave={handleSaveUser}
        onFormChange={handleFormChange}
        saving={savingUser}
      />
      <ResetPasswordDialog
        open={resetDialogOpen}
        user={resetTargetUser}
        onClose={() => { setResetDialogOpen(false); setResetTargetUser(null) }}
        onConfirm={handleConfirmResetPassword}
      />
      <ActivityLogDialog
        open={auditDialogOpen}
        user={auditTargetUser}
        onClose={() => { setAuditDialogOpen(false); setAuditTargetUser(null) }}
      />
      <NotificationHistoryDialog
        open={notificationsDialogOpen}
        user={notificationsTargetUser}
        onClose={() => { setNotificationsDialogOpen(false); setNotificationsTargetUser(null) }}
      />
        </Box>
      </ThemeProvider>
    )
}