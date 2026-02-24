import React, { useState } from 'react'
import {
  Box, Paper, Typography, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem, RadioGroup, FormControlLabel,
  Radio, Checkbox, Button, Accordion, AccordionSummary,
  AccordionDetails, Divider, Alert, Chip
} from '@mui/material'
import { Person, Business, Description, CheckCircle, ExpandMore } from '@mui/icons-material'

interface FormData {
  // Borrower Info
  borrowerName: string
  borrowerEmail: string
  borrowerPhone: string
  borrowerCompany: string
  borrowerPosition: string

  // Loan Details
  loanType: string
  loanAmount: string
  loanPurpose: string
  loanDuration: string
  urgencyLevel: string

  // Product Details
  productType: string
  productQuantity: string
  productDescription: string
  deliveryDate: Date | null
  specialRequirements: string

  // Additional
  termsAccepted: boolean
  marketingConsent: boolean
}

interface FormSectionsProps {
  activeStep: number
  formData: FormData
  onFormDataChange: (data: Partial<FormData>) => void
  errors: Record<string, string>
}

const FormSections: React.FC<FormSectionsProps> = ({
  activeStep,
  formData,
  onFormDataChange,
  errors
}) => {
  const [expandedPanels, setExpandedPanels] = useState<string[]>(['borrower-info'])

  const handlePanelChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanels(prev =>
      isExpanded
        ? [...prev, panel]
        : prev.filter(p => p !== panel)
    )
  }

  const updateFormData = (field: keyof FormData, value: any) => {
    onFormDataChange({ [field]: value })
  }

  const renderBorrowerInfo = () => (
    <Accordion
      expanded={expandedPanels.includes('borrower-info')}
      onChange={handlePanelChange('borrower-info')}
      sx={{
        mb: 2,
        borderRadius: 2,
        '&:before': { display: 'none' },
        boxShadow: expandedPanels.includes('borrower-info') ? 2 : 1,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          backgroundColor: expandedPanels.includes('borrower-info') ? '#f8fafc' : 'white',
          borderRadius: 2,
          minHeight: 64,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Person sx={{ mr: 2, color: '#1a365d' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a365d' }}>
              Informasi Peminjam
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Data pribadi dan informasi kontak
            </Typography>
          </Box>
        </Box>
        {expandedPanels.includes('borrower-info') && (
          <CheckCircle sx={{ ml: 'auto', mr: 2, color: '#00d4aa' }} />
        )}
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nama Lengkap"
              value={formData.borrowerName}
              onChange={(e) => updateFormData('borrowerName', e.target.value)}
              error={!!errors.borrowerName}
              helperText={errors.borrowerName}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.borrowerEmail}
              onChange={(e) => updateFormData('borrowerEmail', e.target.value)}
              error={!!errors.borrowerEmail}
              helperText={errors.borrowerEmail}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nomor Telepon"
              value={formData.borrowerPhone}
              onChange={(e) => updateFormData('borrowerPhone', e.target.value)}
              error={!!errors.borrowerPhone}
              helperText={errors.borrowerPhone}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Perusahaan"
              value={formData.borrowerCompany}
              onChange={(e) => updateFormData('borrowerCompany', e.target.value)}
              error={!!errors.borrowerCompany}
              helperText={errors.borrowerCompany}
              required
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              label="Jabatan"
              value={formData.borrowerPosition}
              onChange={(e) => updateFormData('borrowerPosition', e.target.value)}
              error={!!errors.borrowerPosition}
              helperText={errors.borrowerPosition}
              required
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )

  const renderLoanDetails = () => (
    <Accordion
      expanded={expandedPanels.includes('loan-details')}
      onChange={handlePanelChange('loan-details')}
      sx={{
        mb: 2,
        borderRadius: 2,
        '&:before': { display: 'none' },
        boxShadow: expandedPanels.includes('loan-details') ? 2 : 1,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          backgroundColor: expandedPanels.includes('loan-details') ? '#f8fafc' : 'white',
          borderRadius: 2,
          minHeight: 64,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Business sx={{ mr: 2, color: '#1a365d' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a365d' }}>
              Detail Kebutuhan
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Jenis dan spesifikasi kebutuhan pinjaman
            </Typography>
          </Box>
        </Box>
        {expandedPanels.includes('loan-details') && (
          <CheckCircle sx={{ ml: 'auto', mr: 2, color: '#00d4aa' }} />
        )}
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth error={!!errors.loanType}>
              <InputLabel>Jenis Pinjaman</InputLabel>
              <Select
                value={formData.loanType}
                onChange={(e) => updateFormData('loanType', e.target.value)}
                label="Jenis Pinjaman"
              >
                <MenuItem value="equipment">Equipment Loan</MenuItem>
                <MenuItem value="working-capital">Working Capital</MenuItem>
                <MenuItem value="real-estate">Real Estate</MenuItem>
                <MenuItem value="vehicle">Vehicle Loan</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Jumlah Pinjaman"
              type="number"
              value={formData.loanAmount}
              onChange={(e) => updateFormData('loanAmount', e.target.value)}
              error={!!errors.loanAmount}
              helperText={errors.loanAmount}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: '#64748b' }}>Rp</Typography>,
              }}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth error={!!errors.loanPurpose}>
              <InputLabel>Tujuan Pinjaman</InputLabel>
              <Select
                value={formData.loanPurpose}
                onChange={(e) => updateFormData('loanPurpose', e.target.value)}
                label="Tujuan Pinjaman"
              >
                <MenuItem value="expansion">Business Expansion</MenuItem>
                <MenuItem value="inventory">Inventory Purchase</MenuItem>
                <MenuItem value="equipment">Equipment Purchase</MenuItem>
                <MenuItem value="refinancing">Refinancing</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth error={!!errors.loanDuration}>
              <InputLabel>Durasi Pinjaman</InputLabel>
              <Select
                value={formData.loanDuration}
                onChange={(e) => updateFormData('loanDuration', e.target.value)}
                label="Durasi Pinjaman"
              >
                <MenuItem value="6">6 Bulan</MenuItem>
                <MenuItem value="12">12 Bulan</MenuItem>
                <MenuItem value="24">24 Bulan</MenuItem>
                <MenuItem value="36">36 Bulan</MenuItem>
                <MenuItem value="60">60 Bulan</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={12}>
            <FormControl component="fieldset" error={!!errors.urgencyLevel}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Tingkat Urgensi
              </Typography>
              <RadioGroup
                row
                value={formData.urgencyLevel}
                onChange={(e) => updateFormData('urgencyLevel', e.target.value)}
              >
                <FormControlLabel value="low" control={<Radio />} label="Rendah" />
                <FormControlLabel value="medium" control={<Radio />} label="Sedang" />
                <FormControlLabel value="high" control={<Radio />} label="Tinggi" />
                <FormControlLabel value="urgent" control={<Radio />} label="Sangat Mendesak" />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )

  const renderProductDetails = () => (
    <Accordion
      expanded={expandedPanels.includes('product-details')}
      onChange={handlePanelChange('product-details')}
      sx={{
        mb: 2,
        borderRadius: 2,
        '&:before': { display: 'none' },
        boxShadow: expandedPanels.includes('product-details') ? 2 : 1,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          backgroundColor: expandedPanels.includes('product-details') ? '#f8fafc' : 'white',
          borderRadius: 2,
          minHeight: 64,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Description sx={{ mr: 2, color: '#1a365d' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a365d' }}>
              Detail Produk
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Informasi produk dan jadwal pengiriman
            </Typography>
          </Box>
        </Box>
        {expandedPanels.includes('product-details') && (
          <CheckCircle sx={{ ml: 'auto', mr: 2, color: '#00d4aa' }} />
        )}
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth error={!!errors.productType}>
              <InputLabel>Jenis Produk</InputLabel>
              <Select
                value={formData.productType}
                onChange={(e) => updateFormData('productType', e.target.value)}
                label="Jenis Produk"
              >
                <MenuItem value="electronics">Elektronik</MenuItem>
                <MenuItem value="machinery">Mesin</MenuItem>
                <MenuItem value="vehicles">Kendaraan</MenuItem>
                <MenuItem value="furniture">Furniture</MenuItem>
                <MenuItem value="other">Lainnya</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Kuantitas"
              type="number"
              value={formData.productQuantity}
              onChange={(e) => updateFormData('productQuantity', e.target.value)}
              error={!!errors.productQuantity}
              helperText={errors.productQuantity}
              required
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Deskripsi Produk"
              value={formData.productDescription}
              onChange={(e) => updateFormData('productDescription', e.target.value)}
              error={!!errors.productDescription}
              helperText={errors.productDescription}
              placeholder="Jelaskan spesifikasi produk yang dibutuhkan..."
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Tanggal Pengiriman"
              type="date"
              value={formData.deliveryDate ? formData.deliveryDate.toISOString().split('T')[0] : ''}
              onChange={(e) => updateFormData('deliveryDate', e.target.value ? new Date(e.target.value) : null)}
              error={!!errors.deliveryDate}
              helperText={errors.deliveryDate}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Kebutuhan Khusus"
              value={formData.specialRequirements}
              onChange={(e) => updateFormData('specialRequirements', e.target.value)}
              error={!!errors.specialRequirements}
              helperText={errors.specialRequirements}
              placeholder="Warna, ukuran, spesifikasi khusus, dll..."
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )

  const renderApproval = () => (
    <Accordion
      expanded={expandedPanels.includes('approval')}
      onChange={handlePanelChange('approval')}
      sx={{
        mb: 2,
        borderRadius: 2,
        '&:before': { display: 'none' },
        boxShadow: expandedPanels.includes('approval') ? 2 : 1,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          backgroundColor: expandedPanels.includes('approval') ? '#f8fafc' : 'white',
          borderRadius: 2,
          minHeight: 64,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircle sx={{ mr: 2, color: '#1a365d' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a365d' }}>
              Persetujuan
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Konfirmasi dan persyaratan
            </Typography>
          </Box>
        </Box>
        {expandedPanels.includes('approval') && (
          <CheckCircle sx={{ ml: 'auto', mr: 2, color: '#00d4aa' }} />
        )}
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Pastikan semua informasi yang Anda berikan sudah benar dan lengkap.
              Setelah submit, permohonan akan diproses dalam 1-3 hari kerja.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.termsAccepted}
                  onChange={(e) => updateFormData('termsAccepted', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  Saya menyetujui{' '}
                  <Button variant="text" sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}>
                    syarat dan ketentuan
                  </Button>{' '}
                  yang berlaku
                </Typography>
              }
            />
            {errors.termsAccepted && (
              <Typography variant="caption" color="error" sx={{ ml: 4 }}>
                {errors.termsAccepted}
              </Typography>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.marketingConsent}
                  onChange={(e) => updateFormData('marketingConsent', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  Saya bersedia menerima informasi produk dan promosi via email
                </Typography>
              }
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#1a365d' }}>
            Ringkasan Permohonan
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Nama Peminjam:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>{formData.borrowerName || '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Jenis Pinjaman:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>{formData.loanType || '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Jumlah:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.loanAmount ? `Rp ${parseInt(formData.loanAmount).toLocaleString()}` : '-'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Durasi:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.loanDuration ? `${formData.loanDuration} Bulan` : '-'}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </AccordionDetails>
    </Accordion>
  )

  const sections = [
    { id: 'borrower-info', component: renderBorrowerInfo, step: 0 },
    { id: 'loan-details', component: renderLoanDetails, step: 1 },
    { id: 'product-details', component: renderProductDetails, step: 2 },
    { id: 'approval', component: renderApproval, step: 3 },
  ]

  return (
    <Box>
      {sections.map(({ id, component, step }) => (
        <Box key={id}>
          {activeStep >= step && component()}
        </Box>
      ))}
    </Box>
  )
}

export default FormSections