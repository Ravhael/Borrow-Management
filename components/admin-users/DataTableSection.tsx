import React from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Typography,
  Chip,
  Checkbox,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  BookOnline as OnlineIcon,
  OfflinePin as OfflineIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material'

interface User {
  id: string
  name: string
  username: string
  email: string
  role: string
  entitasId?: string
  entitas?: string | null
  directorate?: string | null
  // companyId removed — use entitas (name) or entitasId; directorate is displayed separately
  isActive: boolean
  IsLoggedIn?: boolean
  permissions: string[]
}

interface DataTableSectionProps {
  paginatedUsers: User[]
  selectedUsers: string[]
  page: number
  rowsPerPage: number
  filteredUsers: User[]
  searchTerm: string
  roleFilter: string
  statusFilter: string
  directorateFilter?: string
  entityFilter?: string
  onSelectAll: (checked: boolean) => void
  onSelectUser: (userId: string, checked: boolean) => void
  onPageChange: (event: unknown, newPage: number) => void
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  getRoleInfo: (role: string) => { icon: React.ReactElement; color: string }
  getStatusColor: (user: User) => string
  // optional action handlers
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
  onResetPassword?: (user: User) => void
  onImpersonate?: (user: User) => void
  onAudit?: (user: User) => void
  onNotifications?: (user: User) => void
  onForceLogout?: (user: User) => void
}

// Deterministic color generator from string input
const stringToColor = (input?: string, saturation = 65, lightness = 55) => {
  if (!input) return '#9ca3af'
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h} ${saturation}% ${lightness}%)`
}

const textColorForBackground = (bg: string) => {
  // convert hsl/hex to luminance coarse check
  if (bg.startsWith('hsl')) {
    // parse lightness
    const m = bg.match(/\((\d+),?\s*(\d+)%?,?\s*(\d+)%?\)/) || bg.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/)
    const light = m ? Number(m[3]) : 55
    return light > 55 ? '#0f172a' : '#ffffff'
  }
  // hex fallback
  try {
    const hex = bg.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.6 ? '#0f172a' : '#ffffff'
  } catch {
    return '#ffffff'
  }
}

const DataTableSection: React.FC<DataTableSectionProps> = ({
  paginatedUsers,
  selectedUsers,
  page,
  rowsPerPage,
  filteredUsers,
  searchTerm,
  roleFilter,
  statusFilter,
  directorateFilter,
  entityFilter,
  onSelectAll,
  onSelectUser,
  onPageChange,
  onRowsPerPageChange,
  getRoleInfo,
  getStatusColor,
  onEdit,
  onDelete,
  onResetPassword,
  onImpersonate,
  onAudit,
  onNotifications,
  onForceLogout,
}) => {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null)
  const [menuUser, setMenuUser] = React.useState<User | null>(null)

  const openMenuForUser = (e: React.MouseEvent<HTMLElement>, user: User) => {
    setMenuAnchor(e.currentTarget)
    setMenuUser(user)
  }

  const closeMenu = () => {
    setMenuAnchor(null)
    setMenuUser(null)
  }

  // Build deterministic, unique colors for each username (based on filteredUsers for broader uniqueness)
  // Use golden-angle distribution across sorted unique keys to maximize visual separation
  const userColorMap = React.useMemo(() => {
    const keys = Array.from(new Set((filteredUsers || []).map(u => String(u.username || u.name || u.id))))
    // deterministic order: sort so colors remain stable across renders
    keys.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

    const map: Record<string, string> = {}
    const GOLDEN_ANGLE = 137.508 // degrees
    const saturation = 62
    const baseLightness = 54

    keys.forEach((key, idx) => {
      // compute small deterministic hash from key
      let h = 0
      for (let i = 0; i < key.length; i++) {
        h = key.charCodeAt(i) + ((h << 5) - h)
        h = h & h
      }
      const baseHue = Math.abs(h) % 360
      // blend hash with golden angle spacing to distribute colors while preserving key-level variance
      const hue = Math.round((baseHue + idx * GOLDEN_ANGLE) % 360)
      // vary saturation/lightness to increase perceptual separation
      const sat = saturation + ((idx % 3) * 6) // e.g., 62,68,74
      const lightness = baseLightness + (((idx % 7) - 3) * 2) // -6..+6 variation
      map[key] = `hsl(${hue} ${sat}% ${lightness}%)`
    })

    return map
  }, [filteredUsers])

  return (
    <Box sx={{ mt: 4 }}>
      <Fade in={true}>
        <Paper
          elevation={2}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            backgroundColor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <TableContainer
            sx={{
              maxHeight: 600,
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(26, 54, 93, 0.3)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(26, 54, 93, 0.5)',
                },
              },
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    '& th': {
                      color: '#374151',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '2px solid #e5e7eb',
                      py: 2.5,
                    }
                  }}
                >
                  <TableCell padding="checkbox" sx={{ borderBottom: '2px solid #e5e7eb' }}>
                    <Checkbox
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < paginatedUsers.length}
                      checked={paginatedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
                      onChange={(e) => onSelectAll(e.target.checked)}
                      sx={{
                        color: 'primary.main',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: 18,
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Email</TableCell>
                    <TableCell>Directorate</TableCell>
                  <TableCell>Entity/Company</TableCell>
                  <TableCell>Presence</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 8 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 3, opacity: 0.5 }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2, fontWeight: 500 }}>
                          {(searchTerm && searchTerm.length > 0) || roleFilter !== 'all' || statusFilter !== 'all' || (directorateFilter && directorateFilter !== 'all') || (entityFilter && entityFilter !== 'all')
                            ? 'No users match your search'
                            : 'No users in the system'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {(searchTerm && searchTerm.length > 0) || roleFilter !== 'all' || statusFilter !== 'all' || (directorateFilter && directorateFilter !== 'all') || (entityFilter && entityFilter !== 'all')
                            ? 'Try adjusting your search or filter criteria'
                            : 'Start by adding users to manage your system'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user, index) => {
                    const roleInfo = getRoleInfo(user.role)
                    return (
                      <Zoom in={true} key={user.id} style={{ transitionDelay: `${index * 50}ms` }}>
                        <TableRow
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(26, 54, 93, 0.04)',
                              transform: 'scale(1.002)',
                              transition: 'all 0.2s ease-in-out',
                            },
                            // alternating row colors
                            '&:nth-of-type(odd)': {
                              backgroundColor: 'rgba(247, 186, 186, 0.185)',
                            },
                            '&:nth-of-type(even)': {
                              backgroundColor: 'rgba(243, 244, 246, 0.85)',
                            },
                            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => onSelectUser(user.id, e.target.checked)}
                              sx={{
                                color: 'primary.main',
                                '&.Mui-checked': {
                                  color: 'primary.main',
                                },
                                '& .MuiSvgIcon-root': {
                                  fontSize: 18,
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  mr: 2,
                                  // deterministic per-user color
                                  bgcolor: (() => {
                                    const key = String(user.username || user.name || user.id)
                                    return userColorMap[key] ?? stringToColor(key, 60, 52)
                                  })(),
                                  color: (() => {
                                    const key = String(user.username || user.name || user.id)
                                    return textColorForBackground(userColorMap[key] ?? stringToColor(key, 60, 52))
                                  })(),
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                }}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                  {user.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  @{user.username}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={roleInfo.icon}
                              label={user.role}
                              variant="filled"
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 24,
                                backgroundColor: (() => stringToColor(user.role, 65, 55))(),
                                color: '#000000',
                                '& .MuiChip-icon': { color: 'inherit' }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {user.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {user.directorate ? (
                              <Chip
                                label={user.directorate}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  height: 24,
                                  backgroundColor: stringToColor(user.directorate, 60, 58),
                                  color: textColorForBackground(stringToColor(user.directorate, 60, 58)),
                                }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                Not assigned
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            {user.entitas || user.entitasId ? (
                              <Chip
                                label={user.entitas || user.entitasId}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  height: 24,
                                  backgroundColor: stringToColor(user.entitas || user.entitasId, 62, 56),
                                  color: textColorForBackground(stringToColor(user.entitas || user.entitasId, 62, 56)),
                                }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                Not assigned
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={user.IsLoggedIn ? <OnlineIcon /> : <OfflineIcon />}
                              label={user.IsLoggedIn ? 'Online' : 'Offline'}
                              color={user.IsLoggedIn ? 'info' : 'default'}
                              variant={user.IsLoggedIn ? 'filled' : 'outlined'}
                              size="small"
                              sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={user.isActive ? <ActiveIcon /> : <InactiveIcon />}
                              label={user.isActive ? 'Active' : 'Inactive'}
                              color={user.isActive ? 'success' : 'error'}
                              variant="outlined"
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 24,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            {/* Render action buttons if handlers are provided, otherwise keep placeholder */}
                            { (typeof onEdit === 'function' || typeof onDelete === 'function') ? (
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                {typeof onEdit === 'function' && (
                                  <Tooltip title="Edit user">
                                    <IconButton size="small" color="primary" onClick={() => onEdit(user)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {typeof onDelete === 'function' && (
                                  <Tooltip title="Delete user">
                                    <IconButton size="small" color="error" onClick={() => onDelete(user)}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {/* placeholder for more actions if needed */}
                                <Tooltip title="More">
                                  <IconButton size="small" onClick={(e) => openMenuForUser(e, user)}>
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : (
                              <Typography variant="body2">Actions</Typography>
                            ) }
                          </TableCell>
                        </TableRow>
                      </Zoom>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Menu that appears on clicking More for a specific user */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={closeMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => { if (menuUser) { if (onResetPassword) onResetPassword(menuUser); else window.alert(`Reset password (placeholder) for ${menuUser.name}`) } closeMenu() }}>
              Reset password
            </MenuItem>

            <MenuItem onClick={() => { if (menuUser) { if (onImpersonate) onImpersonate(menuUser); else window.alert(`Impersonate (placeholder) ${menuUser.name}`) } closeMenu() }}>
              Impersonate / Masuk sebagai
            </MenuItem>

                  <MenuItem onClick={() => { if (menuUser) { if (onAudit) onAudit(menuUser); else window.alert(`Audit / Activity log (placeholder) for ${menuUser.name}`) } closeMenu() }}>
                    Audit / Activity log
            </MenuItem>
                  <MenuItem onClick={() => { if (menuUser) { if (onNotifications) onNotifications(menuUser); else window.alert(`Notification history (placeholder) for ${menuUser.name}`) } closeMenu() }}>
                    Notification history
                  </MenuItem>
                  <MenuItem onClick={() => { if (menuUser) { if (onForceLogout) onForceLogout(menuUser); else window.alert(`Force logout (placeholder) for ${menuUser.name}`) } closeMenu() }}>
                    Force logout
                  </MenuItem>
          </Menu>

          {/* Pagination */}
          <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
            <TablePagination
              component="div"
              count={filteredUsers.length}
              page={page}
              onPageChange={onPageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={onRowsPerPageChange}
              labelRowsPerPage="Rows per page:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} of ${count}`
              }
              sx={{
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontWeight: 500,
                },
                '& .MuiTablePagination-actions': {
                  '& button': {
                    '&:hover': {
                      backgroundColor: 'rgba(26, 54, 93, 0.1)',
                    },
                  },
                },
              }}
            />
          </Box>
        </Paper>
      </Fade>
    </Box>
  )
}

export default DataTableSection