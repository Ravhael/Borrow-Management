import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Button, Typography, TextField, List, ListItem, ListItemText, ListItemIcon, Divider, CircularProgress, TablePagination } from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'

interface LogItem {
  id: string
  action: string
  actorName?: string
  actorId?: string
  details?: string
  ip?: string
  createdAt: string
}

interface Props {
  open: boolean
  user: { id: string; name?: string; email?: string } | null
  onClose: () => void
}

const ActivityLogDialog: React.FC<Props> = ({ open, user, onClose }) => {
  const [logs, setLogs] = React.useState<LogItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [page, setPage] = React.useState(0)
  const [perPage, setPerPage] = React.useState(10)
  const [total, setTotal] = React.useState(0)
  const [search, setSearch] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setPage(0)
    fetchLogs(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, perPage])

  React.useEffect(() => {
    // when page changes (zero-based for UI), fetch appropriate server page
    if (!open) return
    fetchLogs(page + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const fetchLogs = async (serverPage = 1) => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, page: serverPage, perPage })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.message || 'Failed to fetch activity logs')
        setLogs([])
        setTotal(0)
        return
      }

      const body = await res.json()
      setLogs(body.rows ?? [])
      setTotal(body.total ?? (body.rows?.length ?? 0))
    } catch (err) {
      console.error('fetchLogs error', err)
      setError('Server error while fetching logs')
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
    if (!search) return logs
    return logs.filter(l => (l.action + ' ' + (l.details ?? '') + ' ' + (l.actorName ?? '')).toLowerCase().includes(search.toLowerCase()))
  }, [logs, search])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Activity Log {user ? `— ${user.name || user.email}` : ''}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', my: 1 }}>
          <TextField placeholder="Search activity" value={search} onChange={(e) => setSearch(e.target.value)} size="small" fullWidth />
          <Typography variant="caption" color="text.secondary">{total} events</Typography>
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
                  <ListItemText primary="No activity found" />
                </ListItem>
              ) : (
                filtered.map((row) => (
                  <React.Fragment key={row.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon><HistoryIcon /></ListItemIcon>
                      <ListItemText
                        primary={`${row.action} ${row.actorName ? `— ${row.actorName}` : ''}`}
                        secondary={<>
                          <Typography component="span" variant="body2" color="text.primary">{new Date(row.createdAt).toLocaleString()}</Typography>
                          {/* render as inline <span> to avoid nested <p> tags (Typography defaults to <p> for body2) */}
                          <Typography component="span" variant="body2" color="text.secondary">{row.details}</Typography>
                          {row.ip ? <Typography component="span" variant="caption" color="text.secondary">IP: {row.ip}</Typography> : null}
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

export default ActivityLogDialog
