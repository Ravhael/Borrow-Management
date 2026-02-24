import React, { useState, useEffect, useMemo } from 'react'
import PreloadingOverlay from './PreloadingOverlay'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import {
  Drawer,
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { withBasePath } from '../utils/basePath'
import { SidebarProps, UserRole } from '../types/sidebar'
import { createRoleConfig } from '../config/roleConfig'
import { menuGroups } from '../config/menuGroups'
import SidebarHeader from './sidebar/SidebarHeader'
import SidebarNavigation from './sidebar/SidebarNavigation'
import SidebarNavigationSkeleton from './sidebar/SidebarNavigationSkeleton'

const ALLOWED_ROLES: UserRole[] = ['superadmin', 'admin', 'regular', 'marketing', 'gudang']

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [pinned, setPinned] = useState(false)
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [hoverExpanded, setHoverExpanded] = useState<boolean>(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  // currentRole is null while session is resolving to avoid a wrong default showing briefly
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [freshUser, setFreshUser] = useState<any | null>(null)
  const sidebarRef = React.useRef<HTMLDivElement>(null)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  // mounted flag to avoid rendering client-only markup during SSR (prevents hydration mismatch)
  const [mounted, setMounted] = useState(false)
  const [clientWidth, setClientWidth] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
    const onResize = () => setClientWidth(window.innerWidth)
    try {
      onResize()
      window.addEventListener('resize', onResize)
    } catch (e) {
      // ignore (server environments won't have window)
    }
    return () => { try { window.removeEventListener('resize', onResize) } catch {} }
  }, [])

  // Set currentRole from session
  useEffect(() => {
    const { getCanonicalRole } = require('../config/roleConfig') as typeof import('../config/roleConfig')

    if (status === 'loading') {
      // keep null while auth is resolving
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      // Fetch fresh user record from server (ensures role changes in DB are reflected immediately)
      ;(async () => {
        try {
          const res = await fetch('/api/me')
          if (res.ok) {
            const j = await res.json()
            const roleStr = j?.user?.role ?? session.user.role
            const mapped = getCanonicalRole(roleStr)
            setCurrentRole(mapped)
            setFreshUser(j?.user ?? null)
            return
          }
        } catch (e) {
          // ignore and fallback to session-derived role
        }

        if (session?.user?.role) {
          const mapped = getCanonicalRole(session.user.role)
          setCurrentRole(mapped)
          setFreshUser(session.user)
          return
        }
        setCurrentRole(null)
        setFreshUser(null)
      })()
      return
    }

    // If unauthenticated or no role present, keep `currentRole` null
    setCurrentRole(null)
  }, [session, status])

  const roleConfig = useMemo(() => createRoleConfig(users), [users])

  const handleRoleSwitch = (role: UserRole) => {
    // Navigate to the dashboard of the selected role
    router.push(roleConfig[role].dashboard)
    // Close sidebar on mobile
    if (isMobile) {
      onToggle()
    }
  }

  // Keep hover-expanded state cleared when screen mode changes or pin state changes.
  // Do not force `collapsed` here — preserve user's choice except when explicit actions occur.
  useEffect(() => {
    setHoverExpanded(false)
  }, [isMobile, pinned])

  // Ensure hover-expanded state is cleared when unpinning to avoid unexpected collapse
  useEffect(() => {
    if (!pinned) {
      setHoverExpanded(false)
      // do not change `collapsed` here — preserve the user's current expanded/collapsed choice
    }
  }, [pinned])

  // Auto-expand when user hovers over collapsed sidebar (desktop only, when not pinned)
  const handleMouseEnter = () => {
    if (!isMobile && collapsed && !pinned) {
      setCollapsed(false)
      setHoverExpanded(true)
    }
  }

  const handleMouseLeave = () => {
    if (hoverExpanded && !pinned) {
      setCollapsed(true)
      setHoverExpanded(false)
    }
  }

  const drawerWidth = isMobile
    ? Math.min(300, (clientWidth ?? 1024) * 0.85) // Max 300px or 85% of screen width — use fallback width during SSR
    : collapsed
    ? 72
    : 320

  return (
    <>
      {/* Mobile Overlay */}
      {mounted && isMobile && isOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: theme.zIndex.drawer - 1,
          }}
          onClick={onToggle}
        />
      )}

      {/* Material-UI Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? isOpen : true}
        onClose={onToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: `1px solid ${theme.palette.divider}`,
            zIndex: theme.zIndex.drawer,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            overflowX: 'hidden',
            // Mobile-specific styling
            ...(isMobile && {
              borderRadius: '0 16px 16px 0',
              boxShadow: theme.shadows[8],
            }),
          },
        }}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <SidebarHeader
              pinned={pinned}
              setPinned={setPinned}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              currentRole={currentRole}
              roleConfig={roleConfig}
              sessionStatus={status}
              currentUser={freshUser ?? session?.user}
            />

            {/* Only render navigation once session state is known and we have a role */}
            {status === 'loading' && (
              <SidebarNavigationSkeleton />
            )}

            {status !== 'loading' && currentRole && (
              <SidebarNavigation
                menuGroups={menuGroups}
                currentRole={currentRole}
                onToggle={onToggle}
                collapsed={collapsed}
                currentUser={freshUser ?? session?.user}
              />
            )}
          </Box>
          {/* Tombol Logout di bawah */}
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', mt: 'auto', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {collapsed ? (
              <Tooltip title="Logout" placement="right">
                <span>
                  <IconButton
                    onClick={async () => {
                      setLogoutLoading(true)
                      const mod = await import('next-auth/react')
                      try {
                        const cb = withBasePath('/login')
                        await mod.signOut({ callbackUrl: cb })
                      } finally {
                        setLogoutLoading(false)
                      }
                    }}
                    aria-label="Logout"
                    size="large"
                    sx={{ color: '#d32f2f' }}
                  >
                    <LogoutIcon />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <button
                onClick={async () => {
                  setLogoutLoading(true)
                  const mod = await import('next-auth/react')
                  try {
                    // Explicit logout should not preserve the previous page as `next` because
                    // that can redirect a user after re-login to a page they no longer have
                    // permission to access (causing a 403). Always send to `/login`.
                    const cb = withBasePath('/login')
                    await mod.signOut({ callbackUrl: cb })
                  } finally {
                    setLogoutLoading(false)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  color: '#d32f2f',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#fbe9e7')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
                disabled={logoutLoading}
              >
                <span>Logout</span>
              </button>
            )}
            <PreloadingOverlay open={logoutLoading} text="Logging out..." />
          </Box>
        </Box>
      </Drawer>
    </>
  )
}