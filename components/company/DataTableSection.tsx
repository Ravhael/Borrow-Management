import React from 'react'
import {
  Box,
  Card,
  TablePagination,
  Typography,
  Chip,
  Checkbox,
  IconButton,
  Stack,
  Fade,
  Zoom,
} from '@mui/material'
import {
  Business as BusinessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Email as EmailIcon,
} from '@mui/icons-material'

interface Company {
  value: string
  label: string
  userId?: string | null
  description?: string | null
  isActive: boolean
  emails: {
    Head: string
    Marketing: string
    Finance: string
    Admin: string
    Warehouse: string
    Others: string
  }
}

interface DataTableSectionProps {
  currentCompanies: Company[]
  selectedCompanies: Set<string>
  startIndex: number
  searchTerm: string
  filteredCompaniesLength: number
  currentPage: number
  itemsPerPage: number
  onSelectCompany: (value: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onPageChange: (event: unknown, newPage: number) => void
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onToggleStatus: (value: string, isActive: boolean) => void
  onEdit: (index: number) => void
  onDelete: (index: number) => void
  // optional context so caller can show/hide actions for marketing users
  currentUserId?: string | null
  currentUserRole?: string | null
  // runtime permission flags
  canEdit?: boolean
  canDelete?: boolean
}

const DataTableSection: React.FC<DataTableSectionProps> = ({
  currentCompanies,
  selectedCompanies,
  startIndex,
  searchTerm,
  filteredCompaniesLength,
  currentPage,
  itemsPerPage,
  onSelectCompany,
  onSelectAll,
  onPageChange,
  onRowsPerPageChange,
  onToggleStatus,
  onEdit,
  onDelete,
  currentUserId,
  currentUserRole,
  // runtime permission flags (default false so undefined behaves as no permission)
  canEdit = false,
  canDelete = false,
}) => {
  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ width: '100%' }}>
        {currentCompanies.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 3, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>
              {searchTerm ? 'No companies match your search' : 'No companies registered yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
              {searchTerm
                ? 'Try adjusting your search terms or clear the search to see all companies.'
                : 'Get started by adding your first company to the system.'
              }
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {currentCompanies.map((item, index) => (
              <Zoom in={true} key={item.value} style={{ transitionDelay: `${index * 40}ms` }}>
                <Card sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Checkbox checked={selectedCompanies.has(item.value)} onChange={(e) => onSelectCompany(item.value, e.target.checked)} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.value}</Typography>
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {/* Ownership checks: if marketing, only allow actions on owned rows */}
                      {(() => {
                        // marketing restrictions
                        const isOwner = (item as any).userId && String((item as any).userId) === String(currentUserId)
                        const marketingBlocked = currentUserRole === 'marketing' && !isOwner

                        return (
                          <>
                            <Chip label={item.isActive ? 'Active' : 'Disabled'} color={item.isActive ? 'success' : 'error'} size="small" />
                            <IconButton size="small" onClick={() => onToggleStatus(item.value, item.isActive)} sx={{ color: item.isActive ? 'warning.main' : 'success.main' }} disabled={marketingBlocked || !canEdit}>
                              {item.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                            <IconButton size="small" onClick={() => onEdit(startIndex + index)} sx={{ color: 'primary.main' }} disabled={marketingBlocked || !canEdit}><EditIcon fontSize="small"/></IconButton>
                            <IconButton size="small" onClick={() => onDelete(startIndex + index)} sx={{ color: 'error.main' }} disabled={marketingBlocked || !canDelete}><DeleteIcon fontSize="small"/></IconButton>
                          </>
                        )
                      })()}
                    </Stack>
                  </Box>

                  <Box sx={{ mt: 1.25 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>{(item as any).description ?? '-'}</Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {item.emails.Head ? <Chip size="small" icon={<EmailIcon />} label={`Head: ${item.emails.Head}`} /> : null}
                      {item.emails.Marketing ? <Chip size="small" icon={<EmailIcon />} label={`Marketing: ${item.emails.Marketing}`} /> : null}
                      {item.emails.Finance ? <Chip size="small" icon={<EmailIcon />} label={`Finance: ${item.emails.Finance}`} /> : null}
                      {item.emails.Admin ? <Chip size="small" icon={<EmailIcon />} label={`Admin: ${item.emails.Admin}`} /> : null}
                      {item.emails.Warehouse ? <Chip size="small" icon={<EmailIcon />} label={`Warehouse: ${item.emails.Warehouse}`} /> : null}
                      {item.emails.Others ? <Chip size="small" icon={<EmailIcon />} label={`Others: ${item.emails.Others}`} /> : null}
                    </Box>
                  </Box>
                </Card>
              </Zoom>
            ))}
          </Box>
        )}

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <TablePagination
            component="div"
            count={filteredCompaniesLength}
            page={currentPage - 1}
            onPageChange={onPageChange}
            rowsPerPage={itemsPerPage}
            onRowsPerPageChange={onRowsPerPageChange}
            labelRowsPerPage="Baris per halaman:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
          />
        </Box>
      </Box>
    </Fade>
  )
}

export default DataTableSection