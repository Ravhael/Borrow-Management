import React from 'react'
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Paper,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
  Skeleton,
} from '@mui/material'
import toast from 'react-hot-toast'
import {
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
} from '@mui/icons-material'
import { RoleConfigItem, UserRole } from '../../types/sidebar'

interface SidebarHeaderProps {
  pinned: boolean
  setPinned: (pinned: boolean) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  currentRole: UserRole | null
  roleConfig: Record<UserRole, RoleConfigItem>
  sessionStatus?: 'loading' | 'authenticated' | 'unauthenticated'
  currentUser?: { id?: string; name?: string; email?: string; role?: unknown }
}

export default function SidebarHeader({
  pinned,
  setPinned,
  collapsed,
  setCollapsed,
  currentRole,
  roleConfig
  , sessionStatus, currentUser
}: SidebarHeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const roleItem = currentRole ? roleConfig[currentRole] : undefined

  // show current day and full date (localized to Indonesian)
  const today = new Date()
  const formattedDate = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Box sx={{
      p: isMobile ? 3 : collapsed ? 1.5 : 2,
      borderBottom: `1px solid ${theme.palette.divider}`,
      ...(isMobile && {
        background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.primary.main}04 100%)`,
      })
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', mb: isMobile ? 3 : collapsed ? 1 : 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 3 : collapsed ? 1 : 2 }}>

          {!collapsed && (
            <Box sx={{ pl: isMobile ? 1 : 2 }}>
              <Typography variant={isMobile ? "h5" : "h6"} sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Peminjaman Barang
              </Typography>
              <Divider sx={{ my: 0.5, borderColor: 'rgba(0,0,0,0.06)' }} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0 }}>
                {formattedDate}
              </Typography>
            </Box>
          )}
        </Box>

        {!isMobile && (
          <Tooltip title={pinned ? 'Unpin sidebar' : 'Pin and keep expanded'}>
            <IconButton
              onClick={() => {
                console.debug('[sidebar] pin click', { pinned, collapsed })
                if (pinned) {
                  // currently pinned -> unpin and collapse the sidebar
                  setPinned(false)
                  setCollapsed(true)
                  toast('Sidebar unpinned and collapsed')
                } else {
                  // not pinned -> pin and ensure sidebar is expanded so it stays visible
                  setPinned(true)
                  if (collapsed) {
                    setCollapsed(false)
                  }
                  toast('Sidebar pinned')
                }
              }}
              size="small"
              sx={{
                color: pinned ? 'warning.main' : collapsed ? 'primary.main' : 'action.disabled',
                '&:hover': {
                  color: pinned ? 'warning.dark' : collapsed ? 'primary.dark' : 'action.active',
                }
              }}
            >
              {pinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Current User Info */}
      {!collapsed && (
        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 2.5 : 2,
            bgcolor: theme.palette.primary.main + '08',
            border: `1px solid ${theme.palette.primary.main}20`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 2 }}>
            {sessionStatus === 'loading' || !roleItem ? (
              <>
                <Skeleton variant="circular" width={isMobile ? 36 : 32} height={isMobile ? 36 : 32} animation="wave" />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Skeleton variant="text" width="55%" height={18} animation="wave" />
                  <Skeleton variant="text" width="40%" height={12} animation="wave" sx={{ mt: 0.5 }} />
                </Box>
              </>
            ) : (
              <>
                <Avatar
                  sx={{
                    bgcolor: '#000000',
                    width: isMobile ? 36 : 32,
                    height: isMobile ? 36 : 32,
                  }}
                >
                  {roleItem.icon}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                        {currentUser?.name ?? roleItem.userName ?? roleItem.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {currentUser?.role ? String(currentUser.role) : roleItem.title}
                      </Typography>
                </Box>
              </>
            )}
            
          </Box>
        </Paper>
      )}
    </Box>
  )
}