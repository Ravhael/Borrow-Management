export type UserRole = 'superadmin' | 'admin' | 'regular' | 'marketing' | 'gudang'

export interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export interface MenuItem {
  href: string
  label: string
  icon: React.ReactNode
  color: string
}

export interface MenuGroup {
  title: string
  items: MenuItem[]
}

export interface RoleConfigItem {
  title: string
  icon: React.ReactNode
  color: string
  dashboard: string
  userName: string
}

export type RoleConfig = Record<UserRole, RoleConfigItem>