import React from 'react'
import {
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Campaign as CampaignIcon,
  Warehouse as WarehouseIcon,
} from '@mui/icons-material'
import { RoleConfig, UserRole } from '../types/sidebar'

const roleNameMap: Record<UserRole, string> = {
  superadmin: 'Administrator',
  admin: 'Admin',
  regular: 'Peminjam',
  marketing: 'Marketing',
  gudang: 'Gudang'
}

export const getUserNameByRole = (role: UserRole, users: any[]): string => {
  const targetRole = roleNameMap[role].toLowerCase()
  const user = users.find(u => u.role.toLowerCase() === targetRole)
  return user ? user.name : roleNameMap[role]
}

export const getUserEmailByRole = (role: UserRole, users: any[]): string => {
  const targetRole = roleNameMap[role].toLowerCase()
  const user = users.find(u => u.role.toLowerCase() === targetRole)
  return user ? user.email : `${role.toLowerCase()}@company.com`
}

export const createRoleConfig = (users: any[]): RoleConfig => {
  const hasUsers = users.length > 0

  return {
    superadmin: {
      title: 'Superadmin',
      icon: React.createElement(SecurityIcon),
      color: '#8e24aa',
      dashboard: '/dashboard',
      userName: hasUsers ? getUserNameByRole('superadmin', users) : 'Superadmin'
    },
    admin: {
      title: 'Admin',
      icon: React.createElement(AdminIcon),
      color: '#dc3545',
      dashboard: '/dashboard',
      userName: hasUsers ? getUserNameByRole('admin', users) : 'Admin'
    },
    regular: {
      title: 'Peminjam',
      icon: React.createElement(PersonIcon),
      color: '#1565c0',
      dashboard: '/dashboard',
      userName: hasUsers ? getUserNameByRole('regular', users) : 'Peminjam'
    },
    marketing: {
      title: 'Marketing',
      icon: React.createElement(CampaignIcon),
      color: '#2e7d32',
      dashboard: '/dashboard',
      userName: hasUsers ? getUserNameByRole('marketing', users) : 'Marketing'
    },
    gudang: {
      title: 'Gudang',
      icon: React.createElement(WarehouseIcon),
      color: '#ed6c02',
      dashboard: '/dashboard',
      userName: hasUsers ? getUserNameByRole('gudang', users) : 'Gudang'
    }
  }
}

// Which menu group titles should be shown for each role.
export const allowedMenuGroupsByRole: Record<UserRole, string[]> = {
  superadmin: ['Superadmin'],
  admin: ['Admin'],
  regular: ['Peminjam'],
  marketing: ['Marketing'],
  gudang: ['Gudang'],
}

export const getAllowedMenuTitles = (role: UserRole) => allowedMenuGroupsByRole[role] || []

// Build allowed menu group mapping from a list of Role records (DB rows)
export const getAllowedMenuTitlesFromRoles = (roles: Array<any>): Record<UserRole, string[]> => {
  const present = new Set(roles.map(r => getCanonicalRole(r.name)))
  const out: Record<UserRole, string[]> = {} as any
  (Object.keys(allowedMenuGroupsByRole) as UserRole[]).forEach((k) => {
    if (present.has(k)) out[k] = allowedMenuGroupsByRole[k]
  })
  return out
}


// Helper: canonicalize role information (string or object) to UserRole keys
export const getCanonicalRole = (roleInput: unknown): UserRole => {
  if (!roleInput) return 'regular'

  const roleStr = (typeof roleInput === 'string')
    ? roleInput
    : (roleInput && (roleInput as any).name) || (roleInput && (roleInput as any).role) || ''

  const normalized = String(roleStr).toLowerCase().trim()

  if (normalized.includes('super')) return 'superadmin'
  if (normalized === 'admin' || normalized.includes('admin')) return 'admin'
  if (normalized === 'marketing' || normalized.includes('marketing')) return 'marketing'
  if (normalized === 'gudang' || normalized === 'warehouse' || normalized.includes('warehouse')) return 'gudang'

  return 'regular'
}