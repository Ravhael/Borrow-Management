import React from 'react'
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Factory as FactoryIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Warehouse as WarehouseIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { MenuGroup } from '../types/sidebar'

// Primary source of truth: a flat list of menu items. Each item may include an optional `group` label
// which is only metadata for grouping display; access control (which items/groups are shown) is
// driven by Role.allowedMenus stored in DB and the `/api/menu-groups` endpoint.
export const menuItems = [
  // Superadmin-relevant items
  { href: '/dashboard', label: 'Beranda', icon: React.createElement(DashboardIcon), color: '#1565c0', group: 'Superadmin' },
  { href: '/form', label: 'Ajukan Peminjaman', icon: React.createElement(AssignmentIcon), color: '#42a5f5', group: 'Superadmin' },
  { href: '/peminjaman', label: 'Data Peminjaman', icon: React.createElement(AssignmentIcon), color: '#2196f3', group: 'Superadmin' },
  { href: '/peminjaman/user/[namauser]', label: 'Peminjaman Saya', icon: React.createElement(AssignmentIcon), color: '#2196f3', group: 'Superadmin' },
  { href: '/approvals', label: 'Data Persetujuan Marketing', icon: React.createElement(CheckCircleIcon), color: '#4caf50', group: 'Superadmin' },
  { href: '/admin/users', label: 'Manajemen Pengguna', icon: React.createElement(PeopleIcon), color: '#ff9800', group: 'Superadmin' },
  { href: '/gudang', label: 'Data Persetujuan Gudang', icon: React.createElement(WarehouseIcon), color: '#ed6c02', group: 'Superadmin' },
  { href: '/pengembalian', label: 'Permintaan Pengembalian', icon: React.createElement(WarehouseIcon), color: '#ed6c02', group: 'Superadmin' },
  { href: '/entitas', label: 'Data Entitas', icon: React.createElement(BusinessIcon), color: '#9c27b0', group: 'Superadmin' },
  { href: '/company', label: 'Data Perusahaan', icon: React.createElement(FactoryIcon), color: '#607d8b', group: 'Superadmin' },
  { href: '/admin/reminders', label: 'Pengingat', icon: React.createElement(ScheduleIcon), color: '#f44336', group: 'Superadmin' },
  { href: '/admin/mailsettings', label: 'Pengaturan Email', icon: React.createElement(EmailIcon), color: '#e91e63', group: 'Superadmin' },
  { href: '/email-preview', label: 'Pratinjau Email', icon: React.createElement(EmailIcon), color: '#607d8b', group: 'Superadmin' },
  { href: '/admin/appscript-config', label: 'Konfigurasi Apps Script', icon: React.createElement(SettingsIcon), color: '#0f9d58', group: 'Superadmin' },
  { href: '/reporting-and-analytics', label: 'Reporting & Analytics', icon: React.createElement(DashboardIcon), color: '#1565c0', group: 'Superadmin' },
  { href: '/profile', label: 'Profiles', icon: React.createElement(PersonIcon), color: '#1976d2', group: 'Superadmin' },
]

// Derive grouped structure for backward compatibility with components that expect MenuGroup[]
export const menuGroups: MenuGroup[] = (() => {
  const map = new Map<string, any[]>()
  menuItems.forEach(it => {
    const g = it.group || 'General'
    if (!map.has(g)) map.set(g, [])
    map.get(g).push({ href: it.href, label: it.label, icon: it.icon, color: it.color })
  })
  return Array.from(map.entries()).map(([title, items]) => ({ title, items }))
})()

