import React from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Stack,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Zoom,
  Checkbox,
  TablePagination,
  Divider,
} from '@mui/material'
// Note: needTypes label helper is passed in as getNeedTypeLabel prop
import { getPickupMethodLabel } from '../../utils/pickupMethods'
import { getDurationInfo, getEffectiveReturnDate } from '../../utils/loanHelpers'
import { Assessment as AssessmentIcon } from '@mui/icons-material'

interface LoanData {
  id: string
  submittedAt: string
  borrowerName: string
  entitasId: string
  borrowerPhone: string
  borrowerEmail?: string
  needType: string
  company: string[]
  outDate: string
  useDate: string
  returnDate: string
  productDetailsText: string
  pickupMethod: string
  note: string
  approvalAgreementFlag: boolean
  isDraft: boolean
  lainnya?: string
  approvals?: {
    companies: Record<string, {
      approved: boolean;
      approvedBy?: string;
      approvedAt?: string;
      rejectionReason?: string;
      note?: string;
    }>;
  }
  userId?: string
}

interface DataTableSectionProps {
  paginatedLoans: LoanData[]
  selectedLoans: string[]
  startIndex: number
  searchTerm: string
  totalPages: number
  currentPage: number
  itemsPerPage: number
  onSelectAll: (checked: boolean) => void
  onSelectLoan: (loanId: string, checked: boolean) => void
  onPageChange: (page: number) => void
  onItemsPerPageChange: (value: number) => void
  onViewDetail: (loanId: string) => void
  onApprove: (loan: LoanData) => void
  onReject: (loan: LoanData) => void
  currentUserRole?: string | null
  currentUserCompanies?: string[]
  getStatusColor: (loan: LoanData) => "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
  getNeedTypeLabel: (needType: string) => string
  getApprovalStatus: (loan: LoanData) => string
  formatDate: (dateStr: string) => string
}

const DataTableSection: React.FC<DataTableSectionProps> = ({
  paginatedLoans,
  selectedLoans,
  startIndex,
  searchTerm,
  totalPages,
  currentPage,
  itemsPerPage,
  onSelectAll,
  onSelectLoan,
  onPageChange,
  onItemsPerPageChange,
  onViewDetail,
  onApprove,
  onReject,
  currentUserRole,
  currentUserCompanies,
  getStatusColor,
  getNeedTypeLabel,
  getApprovalStatus,
  formatDate,
}) => {
  const needTypePalette = React.useMemo(() => ([
    { bg: '#E3F2FD', color: '#0D47A1' },
    { bg: '#FCE4EC', color: '#AD1457' },
    { bg: '#E8F5E9', color: '#1B5E20' },
    { bg: '#FFF3E0', color: '#E65100' },
    { bg: '#EDE7F6', color: '#4527A0' },
    { bg: '#F3E5F5', color: '#6A1B9A' },
  ]), [])

  const companyPalette = React.useMemo(() => ([
    { bg: '#E0F2F1', color: '#00695C', border: '#26A69A' },
    { bg: '#FFF9C4', color: '#F9A825', border: '#FDD835' },
    { bg: '#E1F5FE', color: '#0277BD', border: '#29B6F6' },
    { bg: '#FBE9E7', color: '#D84315', border: '#FFAB91' },
    { bg: '#F1F8E9', color: '#33691E', border: '#9CCC65' },
    { bg: '#E8EAF6', color: '#283593', border: '#9FA8DA' },
  ]), [])

  const getPaletteIndex = React.useCallback((value: string, length: number) => {
    let hash = 0
    for (let i = 0; i < value.length; i += 1) {
      hash = value.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % length
  }, [])

  const getNeedTypeChipStyle = React.useCallback((value: string) => {
    const palette = needTypePalette[getPaletteIndex(value, needTypePalette.length)]
    return { bgcolor: palette.bg, color: palette.color }
  }, [getPaletteIndex, needTypePalette])

  const getCompanyChipStyle = React.useCallback((value: string) => {
    const palette = companyPalette[getPaletteIndex(value, companyPalette.length)]
    return { bgcolor: palette.bg, color: palette.color, borderColor: palette.border }
  }, [companyPalette, getPaletteIndex])

  // Use centralized helpers for duration / extension-aware date handling

  const getTimeLabel = (dateStr?: string | null) => {
    if (!dateStr) return null
    const dt = new Date(dateStr)
    if (isNaN(dt.getTime())) return null
    return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }
  return (
    <>
      <Fade in={true} timeout={1000}>
        <Card elevation={0}>
          {/* Header: select all + small hint */}
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                indeterminate={selectedLoans.length > 0 && selectedLoans.length < paginatedLoans.length}
                checked={paginatedLoans.length > 0 && selectedLoans.length === paginatedLoans.length}
                onChange={(e) => onSelectAll(e.target.checked)}
                sx={{
                  color: 'primary.main',
                  '&.Mui-checked': { color: 'primary.main' },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{paginatedLoans.length} item(s) shown</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">Bulk actions available</Typography>
            </Box>
          </CardContent>

          {/* Grid of cards */}
          <Box sx={{ p: 2 }}>
            {paginatedLoans.length === 0 ? (
              <Card sx={{ p: 6, textAlign: 'center' }}>
                <AssessmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 3, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2, fontWeight: 500 }}>
                  {searchTerm ? 'No loans match your search' : 'No loans waiting for approval'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {searchTerm ? 'Try adjusting your search terms' : 'New loan requests will appear here'}
                </Typography>
              </Card>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {paginatedLoans.map((loan, index) => {
                  const submittedDateLabel = formatDate(loan.submittedAt).split(',')[0]
                  const submittedTimeLabel = getTimeLabel(loan.submittedAt)

                  return (
                    <Zoom in={true} key={loan.id} style={{ transitionDelay: `${index * 40}ms` }}>
                    <Card
                      sx={{
                        px: { xs: 1.25, sm: 2 },
                        py: { xs: 1.75, sm: 2.6 },
                        borderRadius: 2,
                        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
                        transition: 'transform 0.16s ease, box-shadow 0.16s ease',
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)' },
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 160,
                        justifyContent: 'space-between'
                      }}
                    >
                      {/* Top: borrower info + status */}
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'stretch' }, gap: { xs: 1.25, sm: 2 }, width: '100%' }}>
                        <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', flex: '1 1 auto', minWidth: 0 }}>
                          <Checkbox
                            checked={selectedLoans.includes(loan.id)}
                            onChange={(e) => onSelectLoan(loan.id, e.target.checked)}
                            sx={{ mt: 0.25 }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loan.borrowerName}</Typography>
                            <Stack spacing={0.35} sx={{ mt: 0.6 }}>
                              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.4 }}>{loan.borrowerPhone}</Typography>
                              {loan.borrowerEmail ? <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.4 }}>{loan.borrowerEmail}</Typography> : null}
                              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.4 }}>{loan.entitasId}</Typography>
                              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.4 }}>
                                ID Peminjaman:{' '}
                                <Typography component="span" variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                  {loan.id}
                                </Typography>
                              </Typography>
                            </Stack>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'row', sm: 'column' },
                            alignItems: { xs: 'center', sm: 'flex-end' },
                            justifyContent: { xs: 'space-between', sm: 'flex-end' },
                            gap: { xs: 1, sm: 1.25 },
                            width: { xs: '100%', sm: 'auto' },
                            ml: { sm: 'auto' },
                            flexWrap: { xs: 'wrap', sm: 'nowrap' }
                          }}
                        >
                          <Chip
                            label={getApprovalStatus(loan)}
                            color={getApprovalStatus(loan) === 'Disetujui Marketing' ? 'success' : getApprovalStatus(loan) === 'Ditolak' ? 'error' : 'warning'}
                            size="small"
                            sx={{ fontWeight: 700, px: 1.5, borderRadius: 2, flexShrink: 0 }}
                          />
                          {loan.outDate && loan.returnDate ? (
                            (() => {
                              // prefer last-approved-extension when available
                              const effectiveEnd = getEffectiveReturnDate(loan as any)
                              const info = getDurationInfo(loan.outDate, effectiveEnd ?? loan.returnDate)
                              return info ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, textAlign: { xs: 'left', sm: 'right' }, minWidth: 0, rowGap: 0.35 }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, lineHeight: 1.4 }}>Durasi Peminjaman</Typography>
                                  <Chip size="small" label={info.label} sx={{ fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)' }} />
                                </Box>
                              ) : null
                            })()
                          ) : null}
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1.25, borderColor: 'rgba(15,23,42,0.18)' }} />

                      {/* Middle: meta chips & dates */}
                      <Box sx={{ mt: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" sx={{ minWidth: 0 }}>
                            {(() => {
                              const chipStyle = getNeedTypeChipStyle(loan.needType)
                              return (
                                <Chip
                                  label={getNeedTypeLabel(loan.needType)}
                                  size="small"
                                  sx={{ fontWeight: 700, px: 1.4, ...chipStyle }}
                                />
                              )
                            })()}
                            {loan.company.slice(0, 3).map((company, idx) => {
                              const chipStyle = getCompanyChipStyle(company)
                              return (
                                <Chip
                                  key={idx}
                                  label={company}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.72rem', borderWidth: 1.5, ...chipStyle }}
                                />
                              )
                            })}
                            {loan.company.length > 3 && <Typography variant="caption" sx={{ color: 'text.secondary' }}>+{loan.company.length - 3} more</Typography>}
                          </Stack>

                          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: { xs: 0, sm: 1 }, flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>{submittedDateLabel}</Typography>
                            {submittedTimeLabel && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4, fontWeight: 700 }}>{submittedTimeLabel}</Typography>
                            )}
                          </Stack>
                        </Box>

                        <Divider sx={{ my: 1.25, borderColor: 'rgba(15,23,42,0.14)' }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                            {[
                              { label: 'Tanggal keluar', value: loan.outDate ? formatDate(loan.outDate).split(',')[0] : '-' },
                              { label: 'Tanggal digunakan', value: loan.useDate ? formatDate(loan.useDate).split(',')[0] : '-' },
                            ].map((item, idx) => (
                              <Box key={idx}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, lineHeight: 1.4 }}>{item.label}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>{item.value}</Typography>
                              </Box>
                            ))}
                          </Box>

                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, lineHeight: 1.4 }}>Tanggal dikembalikan</Typography>
                              {(() => {
                                const effective = getEffectiveReturnDate(loan as any)
                                return (
                                  <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.2 }}>{effective ? formatDate(effective).split(',')[0] : (loan.returnDate ? formatDate(loan.returnDate).split(',')[0] : '-')}</Typography>
                                )
                              })()}
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, lineHeight: 1.4 }}>Metode Pengambilan</Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.2 }}>{loan.pickupMethod ? getPickupMethodLabel(loan.pickupMethod) : '-'}</Typography>
                            </Box>
                          </Box>

                          {loan.productDetailsText ? (
                            <Box sx={{ py: 1.1, px: 1.4, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1.2 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700, mb: 0.6, lineHeight: 1.4 }}>Rincian Produk</Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>{loan.productDetailsText.length > 160 ? `${loan.productDetailsText.slice(0, 157)}...` : loan.productDetailsText}</Typography>
                            </Box>
                          ) : null}
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1.25, borderColor: 'rgba(15,23,42,0.14)' }} />

                      {/* Actions: three text buttons */}
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
                          gap: 1,
                          mt: 0.75,
                        }}
                      >
                        <Button
                          component={Link}
                          href={`/peminjaman/${loan.id}?mode=approve`}
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        >
                          Detail
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => onApprove(loan)}
                          disabled={currentUserRole === 'marketing' && !(Array.isArray(currentUserCompanies) && loan.company.every(c => currentUserCompanies.includes(c)))}
                          sx={{ fontWeight: 600 }}
                        >
                          Setujui
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => onReject(loan)}
                          disabled={currentUserRole === 'marketing' && !(Array.isArray(currentUserCompanies) && loan.company.every(c => currentUserCompanies.includes(c)))}
                          sx={{ fontWeight: 600 }}
                        >
                          Tolak
                        </Button>
                      </Box>
                    </Card>
                  </Zoom>
                  )
                })}
              </Box>
            )}
          </Box>
        </Card>
      </Fade>

      {/* Pagination */}
      {totalPages > 1 && (
        <Fade in={true} timeout={1200}>
          <Card elevation={0} sx={{ mt: 3 }}>
            <CardContent sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={3}>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Items per page</InputLabel>
                    <Select
                      value={itemsPerPage}
                      label="Items per page"
                      onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    >
                      <MenuItem value={6}>6</MenuItem>
                      <MenuItem value={12}>12</MenuItem>
                      <MenuItem value={24}>24</MenuItem>
                      <MenuItem value={48}>48</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="text.secondary">Page {currentPage} of {totalPages}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" size="small" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>Previous</Button>
                    <Button variant="outlined" size="small" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Next</Button>
                  </Stack>
                </Stack>
            </CardContent>
          </Card>
        </Fade>
      )}
    </>
  )
}

export default DataTableSection