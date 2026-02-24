import React from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Avatar,
  Typography,
  Chip,
  Checkbox,
  IconButton,
  Stack,
  Fade,
  Zoom,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
} from '@mui/icons-material'

interface Entitas {
  value: string
  label: string
  isActive: boolean
  emails: {
    Head: string
    Finance: string
    Admin: string
    Others: string
  }
}

interface DataTableSectionProps {
  currentEntitas: Entitas[]
  selectedEntitas: Set<string>
  startIndex: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
  filteredEntitasLength: number
  searchTerm: string
  onSelectEntitas: (value: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onPageChange: (event: unknown, newPage: number) => void
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onEdit: (value: string) => void
  onDelete: (value: string) => void
  canEdit?: boolean
  canDelete?: boolean
}

export default function DataTableSection({
  currentEntitas,
  selectedEntitas,
  startIndex,
  totalPages,
  currentPage,
  itemsPerPage,
  filteredEntitasLength,
  searchTerm,
  onSelectEntitas,
  onSelectAll,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false
}: DataTableSectionProps) {
  return (
    <Fade in={true} timeout={1200}>
      <Paper
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
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
                  background: 'linear-gradient(135deg, #1a365d 0%, #00d4aa 100%)',
                  '& th': {
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    borderBottom: 'none',
                    py: 2,
                  }
                }}
              >
                <TableCell padding="checkbox">
                  {/* Header checkbox should reflect whether all rows on THIS PAGE are selected */}
                  <Checkbox
                    checked={currentEntitas.length > 0 && currentEntitas.every((c) => selectedEntitas.has(c.value))}
                    indeterminate={currentEntitas.some((c) => selectedEntitas.has(c.value)) && !currentEntitas.every((c) => selectedEntitas.has(c.value))}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      '&.Mui-checked': {
                        color: 'white',
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: 20,
                      }
                    }}
                  />
                </TableCell>
                <TableCell>No</TableCell>
                <TableCell>Entity Value</TableCell>
                <TableCell>Display Label</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Head Email</TableCell>
                <TableCell>Finance Email</TableCell>
                <TableCell>Admin Email</TableCell>
                <TableCell>Others Email</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentEntitas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 3, opacity: 0.5 }} />
                      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2, fontWeight: 500 }}>
                        {searchTerm ? 'No entities match your search' : 'No entities registered yet'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first entity'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                currentEntitas.map((item, index) => (
                  <Zoom in={true} key={item.value} style={{ transitionDelay: `${index * 50}ms` }}>
                    <TableRow
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(26, 54, 93, 0.04)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        },
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedEntitas.has(item.value)}
                          onChange={(e) => onSelectEntitas(item.value, e.target.checked)}
                          sx={{
                            '& .MuiSvgIcon-root': {
                              fontSize: 20,
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {startIndex + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              mr: 2,
                              bgcolor: item.isActive ? 'primary.main' : 'grey.400',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                            }}
                          >
                            {item.value.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {item.value}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.label}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.isActive ? 'Active' : 'Disabled'}
                          color={item.isActive ? 'success' : 'error'}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {item.emails.Head ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.emails.Head}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            Not set
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.emails.Finance ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.emails.Finance}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            Not set
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.emails.Admin ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.emails.Admin}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            Not set
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.emails.Others ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.emails.Others}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            Not set
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            // pass the unique identifier (value) back to parent so edits work regardless of filtering
                            onClick={() => onEdit(item.value)}
                            sx={{
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'rgba(26, 54, 93, 0.1)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                            disabled={!canEdit}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => onDelete(item.value)}
                            sx={{
                              color: 'error.main',
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}                            disabled={!canDelete}                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </Zoom>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          <TablePagination
            component="div"
            count={filteredEntitasLength}
            page={currentPage - 1}
            onPageChange={onPageChange}
            rowsPerPage={itemsPerPage}
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
  )
}