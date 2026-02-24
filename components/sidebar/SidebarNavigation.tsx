import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { MenuGroup, UserRole } from '../../types/sidebar'
import { getAllowedMenuTitles } from '../../config/roleConfig'

const ROLE_TITLE_MAP: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  regular: 'Peminjam',
  marketing: 'Marketing',
  gudang: 'Gudang'
}

type SessionUser = {
  id?: string | number | null
  name?: string | null
  email?: string | null
  username?: string | null
} | null

const slugify = (value?: string | number | null): string => {
  if (value === undefined || value === null) return ''
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const resolveDynamicHref = (href: string, currentUser?: SessionUser): string => {
  if (!href.includes('[namauser]')) return href
  const base = currentUser?.username
    || currentUser?.name
    || (currentUser?.email ? currentUser.email.split('@')[0] : '')
    || 'me'
  const slug = slugify(base) || 'me'
  return href.replace('[namauser]', encodeURIComponent(slug))
}

interface SidebarNavigationProps {
  menuGroups: MenuGroup[]
  currentRole: UserRole
  onToggle: () => void
  collapsed: boolean
  currentUser?: SessionUser
}

export default function SidebarNavigation({
  menuGroups,
  currentRole,
  onToggle,
  collapsed,
  currentUser
}: SidebarNavigationProps) {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const isSuperadmin = currentRole === 'superadmin'

  // Load allowed menu titles and item-level overrides from server (driven by Role table).
  // IMPORTANT: do NOT fall back to local config for role visibility — if DB gives no mapping for role, show no sidebar items.
  const [allowedTitles, setAllowedTitles] = React.useState<string[]>([])
  const [allowedItems, setAllowedItems] = React.useState<string[] | null>(null)

  React.useEffect(() => {
    if (!currentRole) return
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/menu-groups')
        if (!res.ok) {
          // if the server call fails, we conservatively show no menus (don't use local defaults)
          if (mounted) { setAllowedTitles([]); setAllowedItems(null) }
          return
        }
        const j = await res.json()
        const mapping: Record<string, string[]> = j.allowedMenusByRole || {}
        const itemsMapping: Record<string, string[]> = j.allowedMenuItemsByRole || {}

        // DEBUG: log the server payload (temporary) so we can verify what's being returned for this role
        try { console.debug('[allowed-menus] server payload:', { mapping, itemsMapping, currentRole }) } catch (_) {}

        const hasServerMapping = (Array.isArray(mapping[currentRole]) && mapping[currentRole].length > 0) || (Array.isArray(itemsMapping[currentRole]) && itemsMapping[currentRole].length > 0)

        // If the server did not explicitly provide mapping for this role, show no menu (DB is the source of truth)
        if (!hasServerMapping) {
          if (mounted) { setAllowedTitles([]); setAllowedItems(null) }
          return
        }

        // Use raw inputs from server
        const raw = Array.isArray(mapping[currentRole]) && mapping[currentRole].length > 0 ? mapping[currentRole] : null
        const itemHrefsFromServer = Array.isArray(itemsMapping[currentRole]) && itemsMapping[currentRole].length > 0 ? itemsMapping[currentRole] : null

        // Derive allowedTitles and allowedItems:
        // - If raw contains group titles, use them and expand to items.
        // - If raw contains hrefs only, map hrefs back to group titles and keep items as provided.
        let derivedTitles: string[] = []
        let derivedItems: string[] | null = itemHrefsFromServer ?? null

        if (raw) {
          const hasNonHref = raw.some(v => !String(v).startsWith('/'))
          if (hasNonHref) {
            // raw contains group titles (or mixed) — use titles and compute items from groups when needed
            derivedTitles = raw.filter(v => !String(v).startsWith('/'))
            const expanded: string[] = []
            raw.forEach(v => {
              if (String(v).startsWith('/')) {
                expanded.push(v)
                return
              }
              const g = menuGroups.find(m => String(m.title).toLowerCase() === String(v).toLowerCase())
              if (g && Array.isArray((g as any).items)) (g as any).items.forEach((it: any) => expanded.push(it.href))
            })
            derivedItems = Array.from(new Set([...(derivedItems || []), ...expanded]))
          } else {
              // raw contains only hrefs — treat them as item-level overrides and do not force a single group
              derivedTitles = []
              derivedItems = raw
          }
        }

        if (mounted) {
          // DEBUG: log derived results before applying them (temporary)
          try { console.debug('[menu-groups] derived:', { derivedTitles, derivedItems }) } catch (_) {}
            // Normalize titles to lowercase for robust comparison with config titles
            const normalizedTitles = derivedTitles.map(t => String(t).trim().toLowerCase())
            setAllowedTitles(normalizedTitles)
          setAllowedItems(Array.isArray(derivedItems) && derivedItems.length > 0 ? derivedItems : null)
        }
      } catch (e) {
        // on error, conservative behavior: show no menu
        if (mounted) { setAllowedTitles([]); setAllowedItems(null) }
      }
    })()
    return () => { mounted = false }
  }, [currentRole, menuGroups])

  return (
    <Box sx={{
      flex: 1,
      overflow: 'auto',
      mt: isSmall ? 1 : isMobile ? 2 : collapsed ? 1 : 2,
      px: isSmall ? 1 : isMobile ? 2 : collapsed ? 0.5 : 1,
      py: isSmall ? 1 : 0,
      '&::-webkit-scrollbar': {
        width: isSmall ? '2px' : '4px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.action.disabled,
        borderRadius: isSmall ? '1px' : '2px',
      },
    }}>
      {menuGroups
        // Only show groups that are allowed for the current role
        .filter((group) => {
          // If server did not provide any mapping for this role, do NOT render any groups (DB is source of truth)
          if ((!Array.isArray(allowedItems) || allowedItems.length === 0) && (!Array.isArray(allowedTitles) || allowedTitles.length === 0)) {
            return false
          }

          // Prefer title-based visibility when provided by server (safer and unambiguous)
          if (Array.isArray(allowedTitles) && allowedTitles.length > 0) {
            return allowedTitles.includes(String(group.title).toLowerCase())
          }

          // If only item-level hrefs are provided, show any group that contains at least one allowed item
          if (Array.isArray(allowedItems) && allowedItems.length > 0) {
            return Array.isArray(group.items) && group.items.some((it: any) => allowedItems.includes(it.href))
          }

          return false
        })
        .map((group) => (
          <Box key={group.title} sx={{ mb: isSmall ? 0.75 : isMobile ? 1.5 : collapsed ? 0.5 : 1 }}>
            {/* Group titles removed — visibility is controlled by Role.allowedMenus in DB */}

            <List dense={!isMobile} sx={{ py: isSmall ? 0.25 : isMobile ? 0.5 : 0 }}>
              {group.items
              .filter(item => {
                // If allowedItems (href list) is provided for the role, show only items included there
                if (Array.isArray(allowedItems)) return allowedItems.includes(item.href)
                // Otherwise, fall back to group-level visibility (group.title in allowedTitles)
                return true
              })
              .map((item) => {
                const resolvedHref = resolveDynamicHref(item.href, currentUser)
                const isActive = router.pathname === item.href || router.asPath === resolvedHref
                const inactiveIconColor = isSuperadmin ? item.color : '#000000'
                const activeIconColor = isSuperadmin ? theme.palette.primary.main : '#e1272b'
                const inactiveTextColor = isSuperadmin ? 'text.primary' : '#000000'
                const activeTextColor = isSuperadmin ? 'primary.main' : '#e1272b'
                return (
                  <ListItem key={`${item.href}-${resolvedHref}`} disablePadding sx={{ mb: isSmall ? 0.5 : isMobile ? 1 : collapsed ? 0.25 : 0.5 }}>
                    <ListItemButton
                      component={Link}
                      href={resolvedHref}
                      onClick={() => {
                        if (isMobile) onToggle()
                      }}
                      sx={{
                        borderRadius: isSmall ? 1.5 : 2,
                        mx: isSmall ? 0.5 : isMobile ? 1 : collapsed ? 0.5 : 1,
                        minHeight: isSmall ? 44 : isMobile ? 56 : collapsed ? 48 : 48,
                        px: isSmall ? 1.5 : isMobile ? 2.5 : collapsed ? 1.5 : 2,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        bgcolor: isActive ? theme.palette.primary.main + '10' : 'transparent',
                        border: isActive ? `1px solid ${theme.palette.primary.main}30` : 'none',
                        '&:hover': {
                          bgcolor: isActive
                            ? theme.palette.primary.main + '15'
                            : theme.palette.action.hover,
                        },
                        transition: theme.transitions.create(['background-color', 'border-color'], {
                          duration: theme.transitions.duration.shortest,
                        }),
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: isSmall ? 36 : isMobile ? 48 : collapsed ? 'auto' : 48,
                          color: isActive ? activeIconColor : inactiveIconColor,
                          transition: theme.transitions.create('color', {
                            duration: theme.transitions.duration.shortest,
                          }),
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            variant: isMobile ? 'body1' : 'body2',
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? activeTextColor : inactiveTextColor,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
          </Box>
        ))}
    </Box>
  )
}
