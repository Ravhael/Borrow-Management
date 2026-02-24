import React, { useMemo } from 'react'
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Typography, Tooltip } from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { menuGroups } from '../../config/menuGroups'
interface Role {
  id: string
  name: string
  description?: string
  permissions?: any
}

interface RolesTableProps {
  roles: Role[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  onAdd: () => void
  onEdit: (role: Role) => void
  onDelete: (roleId: string) => void
}

const RolesTable: React.FC<RolesTableProps> = ({ roles, loading, error, onRefresh, onAdd, onEdit, onDelete }) => {
  return (
    <Box sx={{ mt: 6 }}>
      <Paper elevation={2} sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.06)' }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Roles</Typography>
          <Box>
            <Button size="small" variant="outlined" onClick={onRefresh} startIcon={<RefreshIcon />} sx={{ mr: 1 }}>Refresh</Button>
            <Button size="small" variant="contained" onClick={onAdd} startIcon={<AddIcon />}>Add Role</Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ px: 3 }}><Typography>Loading...</Typography></Box>
        ) : error ? (
          <Box sx={{ p: 3 }}><Typography color="error">{error}</Typography></Box>
        ) : (
          <TableContainer sx={{ maxHeight: 360 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Role ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Permissions</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Allowed Menu</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>No roles found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((r) => (
                    <TableRow key={r.id} sx={{ '&:nth-of-type(even)': { backgroundColor: 'rgba(0,0,0,0.02)' } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{r.id}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.description}</TableCell>
                      <TableCell>
                        {typeof r.permissions === 'object' && !Array.isArray(r.permissions) ? (
                          Object.entries(r.permissions).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join(', ')
                        ) : Array.isArray(r.permissions) ? (
                          r.permissions.join(', ')
                        ) : (
                          String(r.permissions || '')
                        )}
                      </TableCell>
                      <TableCell>{(() => {
                    const mg = (r as any).allowedMenus
                    if (!mg) return ''
                    const items = Array.isArray(mg) ? mg : String(mg).split(',').map((s: string) => s.trim()).filter(Boolean)
                    const superItems = (menuGroups.find(g => g.title === 'Superadmin')?.items ?? []) as any[]
                    const mapped = items.map((v: string) => {
                      const found = superItems.find(si => si.href === v)
                      return found ? found.label : v
                    })
                    return mapped.join(', ')
                  })()}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Tooltip title="Edit role"><IconButton size="small" onClick={() => onEdit(r)}><EditIcon fontSize="small"/></IconButton></Tooltip>
                        <Tooltip title="Delete role"><IconButton size="small" color="error" onClick={() => onDelete(r.id)}><DeleteIcon fontSize="small"/></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}

export default RolesTable
