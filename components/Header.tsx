import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { withBasePath } from '../utils/basePath'
import MenuIcon from '@mui/icons-material/Menu'

interface HeaderProps {
  onToggleSidebar?: () => void
  minimal?: boolean
  sticky?: boolean
}

export default function Header({ onToggleSidebar, minimal = false, sticky = true }: HeaderProps) {
  const devLog = (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug(...args)
    }
  }
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const resolvedLogoSrc = withBasePath('/logo_indovisual.png')
  const [logoSrc, setLogoSrc] = useState(resolvedLogoSrc)
  const [logoError, setLogoError] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { data: session } = useSession()
  const desktopSidebarOffset = theme.spacing(40)

  useEffect(() => {
    setLogoSrc(resolvedLogoSrc)
    setLogoError(false)
  }, [resolvedLogoSrc])


  // Subscribe to per-user SSE events to react to server-side actions (force-logout, etc.)
  React.useEffect(() => {
    if (!session?.user?.id) return
    let es: EventSource | null = null
    let aborted = false
    let retryMs = 2000
    let errorCount = 0
    let lastErrorLogAt = 0
    const maxErrorsBeforeDisable = 5

    const open = () => {
      if (aborted) return
      try {
        devLog('[Header] opening user SSE /api/presence/subscribe-user')
        es = new EventSource(withBasePath('/api/presence/subscribe-user'))
        es.onopen = () => {
          devLog('[Header] user SSE opened')
          // reset backoff on successful open
          retryMs = 2000
          errorCount = 0
        }
        es.onerror = (err) => {
          const now = Date.now()
          if (now - lastErrorLogAt > 10_000) {
            console.warn('[Header] user SSE error', err)
            lastErrorLogAt = now
          }
          errorCount += 1
          if (errorCount >= maxErrorsBeforeDisable) {
            console.warn('[Header] user SSE disabled after repeated errors')
            try { es?.close() } catch {}
            return
          }
          try {
            // schedule a reconnect if the connection is closed
            if (es?.readyState === EventSource.CLOSED && !aborted) {
              setTimeout(() => { if (!aborted) open() }, retryMs)
              retryMs = Math.min(30_000, retryMs * 2)
            }
          } catch {}
        }
        es.addEventListener('force_logout', (e: any) => {
          try {
            const payload = JSON.parse(e.data)
            // If server requests force logout for this user, show message then sign out and redirect
            const message = payload?.data?.message || 'Anda telah dikeluarkan — silakan login kembali'
            const redirectTo = payload?.data?.redirectTo || '/login'
            toast.error(message)
            // signOut → then redirect to provided URL (e.g., /403 with explanatory message)
            try {
              const resolvedRedirect = (/^https?:\/\//i.test(redirectTo) ? redirectTo : withBasePath(redirectTo))
              signOut({ callbackUrl: resolvedRedirect })
              // fallback: if signOut fails to redirect, force navigation after a short delay
              setTimeout(() => { try { window.location.href = resolvedRedirect } catch (err) {} }, 700)
            } catch (err) {
              // fallback direct navigation if signOut fails for any reason
              try { window.location.href = withBasePath(redirectTo) } catch (e) {}
            }
          } catch (err) {
            console.error('force_logout handler error', err)
          }
        })
      } catch (err) {
        console.warn('Failed to open user SSE', err)
        // try again with backoff
        setTimeout(() => { if (!aborted) open() }, retryMs)
        retryMs = Math.min(30_000, retryMs * 2)
      }
    }

    open()

    return () => { aborted = true; if (es) { es.close(); devLog('[Header] user SSE closed') } }
  }, [session?.user?.id])

  // Poll fallback: periodically check /api/auth/session to detect server-side session revocation
  React.useEffect(() => {
    if (!session?.user?.id) return
    let cancelled = false
    const checkSession = async () => {
      try {
        const r = await fetch('/api/auth/session', { cache: 'no-store' })
        // NextAuth returns {} / empty object when not authenticated
        const j = await r.json().catch(() => ({}))
        // if session cleared server-side, j.user may be missing
        if (cancelled) return
        if (!j || !j.user || !j.user.id) {
          // show message and redirect the user to the 403 page with message
          const message = 'akun anda sudah logout, silahkan login kembali'
          try { toast.error(message) } catch {}
          try {
            const cb = '/403?from=force-logout&message=' + encodeURIComponent(message)
            signOut({ callbackUrl: withBasePath(cb) })
          } catch (err) {
            // fallback navigation
            try { window.location.href = require('../utils/basePath').withBasePath('/403?from=force-logout&message=' + encodeURIComponent(message)) } catch {}
          }
        }
      } catch (err) {
        // ignore network problems — will check again next interval
        devLog('[Header] session poll error', err)
      }
    }

    // start polling every 8 seconds (balance freshness vs cost)
    const interval = setInterval(checkSession, 8000)
    // run one immediately too
    checkSession()

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [session?.user?.id])

  // show account UI only when there's an active user session
  const activeUser = session?.user?.name ?? ''
  const currentRole = session?.user?.role?.name ?? ''

  // if session disappears (e.g. force-logout), make sure any open menu is closed
  useEffect(() => {
    if (!session?.user?.id) setAnchorEl(null)
  }, [session?.user?.id])

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)

  const handleSignOut = () => {
    handleMenuClose()
    try {
      signOut({ callbackUrl: require('../utils/basePath').withBasePath('/login') })
    } catch (err) {
      // fallback to plain /login if base path resolution fails
      signOut({ callbackUrl: '/login' })
    }
  }

  const getProfileUrl = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin':
        return '/superadmin/profile'
      case 'admin':
        return '/admin/profile'
      case 'marketing':
        return '/marketing/profile'
      case 'gudang':
        return '/gudang/profile'
      case 'user':
      default:
        return '/user/profile'
    }
  }

  return (
      <AppBar
      position="sticky"
      elevation={6}
      sx={{
        zIndex: theme.zIndex.drawer - 1,
        left: 0,
        right: 0,
        width: '100%',
        boxSizing: 'border-box',
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRadius: 0,
        top: 0,
        position: 'sticky',
        borderBottom: 'none',
        overflow: 'visible',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 8,
          background: theme.palette.background.paper,
          pointerEvents: 'none'
        }
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 64, md: 64 },
          pl: minimal ? { xs: 1.5, md: 3.5 } : { xs: 1.5, md: `calc(${desktopSidebarOffset} + ${theme.spacing(2)})` },
          pr: minimal ? { xs: 1.5, md: 3.5 } : { xs: 1, md: 4 },
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Left side: hamburger + brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, minWidth: 0, pl: { xs: 5, md: 0 } }}>

          {/* Mobile absolute fallback logo (renders on top to avoid being covered) */}
          
          {onToggleSidebar && isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={onToggleSidebar}
              aria-label="open sidebar"
              disableRipple
              sx={{
                color: 'inherit',
                p: { xs: '6px', md: undefined },
                pr: { xs: '8px', md: undefined },
                // remove large white bubble/box-shadow that covered logo
                backgroundColor: 'transparent',
                boxShadow: 'none',
                borderRadius: 1,
                // ensure button is beneath logo if overlap occurs
                zIndex: (theme as any).zIndex?.appBar ? (theme as any).zIndex.appBar - 2 : 1198,
                minWidth: { xs: 40, md: 'auto' },
                minHeight: { xs: 40, md: 'auto' },
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
              }}
              size="large"
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo without link */}
          {logoSrc ? (
              <Box
                sx={{
                  display: { xs: 'none', md: 'inline-flex' },
                  alignItems: 'center'
                }}
              >
                {!logoError ? (
                  <Box
                    component="img"
                    src={logoSrc}
                    alt="Indovisual"
                    aria-hidden={true}
                    sx={{
                      maxHeight: { xs: 44, sm: 56, md: 72 },
                      height: { xs: 36, sm: 'auto' },
                      maxWidth: { xs: 140, sm: 220 },
                      objectFit: 'contain',
                      borderRadius: 0,
                      background: 'transparent',
                      px: { xs: 0, sm: 0.5 },
                      py: { xs: 0, sm: 0.25 },
                      boxShadow: 'none',
                      border: 'none',
                      display: 'block !important',
                      opacity: 1,
                      position: 'relative',
                      zIndex: (theme as any).zIndex?.appBar ? (theme as any).zIndex.appBar + 5 : 2000,
                      cursor: 'default'
                    }}
                    onLoad={(e: any) => {
                      try {
                        devLog('[Header] logo onLoad', logoSrc, (e.currentTarget as HTMLElement).clientWidth, (e.currentTarget as HTMLElement).clientHeight);
                        const el = e.currentTarget as HTMLElement;
                        el.style.opacity = '1';
                        el.style.display = 'block';
                      } catch (err) {}
                    }}
                    onError={(e: any) => {
                      console.warn('[Header] logo failed to load', logoSrc)
                      // try canonical fallback first
                      if (logoSrc !== resolvedLogoSrc) {
                        setLogoSrc(resolvedLogoSrc)
                        return
                      }
                      // final fallback: show small avatar instead of hiding entire element
                      setLogoError(true)
                      try { (e.currentTarget as HTMLElement).style.display = 'none' } catch (err) {}
                    }}
                  />
                ) : (
                  <Avatar src={logoSrc} alt="Indovisual" aria-hidden={true} sx={{ width: 32, height: 32, position: 'relative', zIndex: (theme as any).zIndex?.appBar ? (theme as any).zIndex.appBar + 2 : 1201, display: 'block' }} />
                )} 
              </Box>
          ) : null}
        </Box>

        {/* Right side: icons + mobile logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
          {/* Mobile-only logo positioned at the far right */}
          {logoSrc ? (
              <Box
                sx={{
                  display: { xs: 'inline-flex', md: 'none' },
                  alignItems: 'center'
                }}
              >
                {!logoError ? (
                  <Box
                    component="img"
                    src={logoSrc}
                    alt="Indovisual"
                    aria-hidden={true}
                    sx={{
                      maxHeight: { xs: 44, sm: 56 },
                      height: { xs: 36, sm: 'auto' },
                      maxWidth: { xs: 140, sm: 220 },
                      objectFit: 'contain',
                      borderRadius: 0,
                      background: 'transparent',
                      px: { xs: 0, sm: 0.5 },
                      py: { xs: 0, sm: 0.25 },
                      boxShadow: 'none',
                      border: 'none',
                      display: 'block !important',
                      opacity: 1,
                      position: 'relative',
                      zIndex: (theme as any).zIndex?.appBar ? (theme as any).zIndex.appBar + 5 : 2000,
                      cursor: 'default'
                    }}
                    onError={(e: any) => {
                      console.warn('[Header] logo failed to load', logoSrc)
                      if (logoSrc !== resolvedLogoSrc) {
                        setLogoSrc(resolvedLogoSrc)
                        return
                      }
                      setLogoError(true)
                      try { (e.currentTarget as HTMLElement).style.display = 'none' } catch (err) {}
                    }}
                  />
                ) : (
                  <Avatar src={logoSrc} alt="Indovisual" aria-hidden={true} sx={{ width: 32, height: 32, position: 'relative', zIndex: (theme as any).zIndex?.appBar ? (theme as any).zIndex.appBar + 2 : 1201, display: 'block' }} />
                )}
              </Box>
          ) : null}

          {/* Right side actions */}
          {!minimal && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>

              {/* profile icon removed per request */}

            </Box>
          )} 

          {/* account/menu (keeps existing menu logic) */}
          {!minimal && session?.user?.id && (
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} keepMounted>
              <MenuItem onClick={handleMenuClose} component={Link} href={getProfileUrl(currentRole)}>My Account</MenuItem>
              <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
            </Menu>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}