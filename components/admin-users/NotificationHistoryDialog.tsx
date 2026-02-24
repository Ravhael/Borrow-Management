import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Button, Typography, TextField, List, ListItem, ListItemText, ListItemIcon, Divider, CircularProgress, TablePagination } from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

interface NotifItem {
  id?: string
  type: string
  sentAt: string
  to?: string | null
  success?: boolean
  error?: string | null
  meta?: any
  actorId?: string | null
  actorName?: string | null
}

interface Props {
  open: boolean
  user: { id: string; name?: string; email?: string } | null
  onClose: () => void
}

const NotificationHistoryDialog: React.FC<Props> = ({ open, user, onClose }) => {
  const [rows, setRows] = React.useState<NotifItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [page, setPage] = React.useState(0)
  const [perPage, setPerPage] = React.useState(10)
  const [total, setTotal] = React.useState(0)
  const [search, setSearch] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setPage(0)
    fetchNotifs(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, perPage])

  React.useEffect(() => {
    if (!open) return
    fetchNotifs(page + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const fetchNotifs = async (serverPage = 1) => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, page: serverPage, perPage })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.message || 'Failed to fetch notifications')
        setRows([])
        setTotal(0)
        return
      }

      const body = await res.json()
      setRows(body.rows ?? [])
      setTotal(body.total ?? (body.rows?.length ?? 0))
    } catch (err) {
      console.error('fetchNotifs error', err)
      setError('Server error while fetching notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePage = (_: any, newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const filtered = React.useMemo(() => {
    if (!search) return rows
    return rows.filter(r => ((r.type ?? '') + ' ' + (r.to ?? '') + ' ' + (r.meta ? JSON.stringify(r.meta) : '') + ' ' + (r.actorName ?? '')).toLowerCase().includes(search.toLowerCase()))
  }, [rows, search])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Notification history {user ? `— ${user.name || user.email}` : ''}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', my: 1 }}>
          <TextField placeholder="Search notifications" value={search} onChange={(e) => setSearch(e.target.value)} size="small" fullWidth />
          <Typography variant="caption" color="text.secondary">{total} entries</Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ py: 2 }}><Typography color="error">{error}</Typography></Box>
        ) : (
          <>
            <List>
              {filtered.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No notifications found" />
                </ListItem>
              ) : (
                filtered.map((row, i) => (
                  <React.Fragment key={(row.id ?? `${i}-${row.sentAt}`)}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        <NotificationsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={<>
                          <Typography component="span" variant="subtitle2" sx={{ fontWeight: 700 }}>{row.type.replace(/_/g, ' ')}</Typography>
                          <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>{new Date(row.sentAt).toLocaleString()}</Typography>
                        </>}
                        secondary={<>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                            {row.success ? <CheckCircleIcon color="success" fontSize="small" /> : <CancelIcon color="error" fontSize="small" />}
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{row.to ?? '(no recipient)'}</Typography>
                            {row.actorName ? <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2 }}>by {row.actorName}</Typography> : null}
                          </Box>
                          {row.error ? (
                            <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>{`Error: ${row.error}`}</Typography>
                          ) : null}
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{row.meta ? JSON.stringify(row.meta) : ''}</Typography>
                        </>}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              )}
            </List>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={perPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default NotificationHistoryDialog
