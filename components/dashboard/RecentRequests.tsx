import React from 'react'
import { useRouter } from 'next/router'
import {
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { RecentRequestsProps } from '../../types/dashboard'

export default function RecentRequests({
  recentRequests,
  search,
  onSearchChange,
  onRefresh,
  formatDate
}: RecentRequestsProps) {
  const router = useRouter()

  // Filtered requests for search
  const filteredRequests = recentRequests.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      r.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">📋</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Recent Requests</Typography>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search by ID, name, or company..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
            >
              Refresh
            </Button>
            <Button variant="contained" startIcon={<FileDownloadIcon />}>
              Export CSV
            </Button>
          </Stack>
        </Stack>

        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Requester</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Urgency</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No requests found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((r) => (
                  <TableRow
                    key={r.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/approvals/${r.id}`)}
                  >
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {r.id}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'grey.300',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: 14,
                            color: 'grey.700'
                          }}
                        >
                          {r.requesterName.split(' ').map((n) => n[0]).join('').toUpperCase()}
                        </Box>
                        <Typography>{r.requesterName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{r.company}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{formatDate(r.requestDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        color={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.urgency.charAt(0).toUpperCase() + r.urgency.slice(1)}
                        color={r.urgency === 'high' ? 'error' : r.urgency === 'medium' ? 'warning' : 'success'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}