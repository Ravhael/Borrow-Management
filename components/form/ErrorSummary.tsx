import React from 'react'
import { Box, Alert, AlertTitle, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { Error, Warning } from '@mui/icons-material'

interface FormErrors {
  [key: string]: string
}

interface ErrorSummaryProps {
  errors: FormErrors
  warnings?: FormErrors
}

const ErrorSummary: React.FC<ErrorSummaryProps> = ({ errors, warnings = {} }) => {
  const errorEntries = Object.entries(errors).filter(([, message]) => message)
  const warningEntries = Object.entries(warnings).filter(([, message]) => message)

  if (errorEntries.length === 0 && warningEntries.length === 0) {
    return null
  }

  const formatFieldName = (fieldName: string) => {
    const fieldLabels: { [key: string]: string } = {
      borrowerName: 'Nama Lengkap',
      borrowerEmail: 'Email',
      borrowerPhone: 'Nomor Telepon',
      borrowerCompany: 'Perusahaan',
      borrowerPosition: 'Jabatan',
      loanType: 'Jenis Pinjaman',
      loanAmount: 'Jumlah Pinjaman',
      loanPurpose: 'Tujuan Pinjaman',
      loanDuration: 'Durasi Pinjaman',
      urgencyLevel: 'Tingkat Urgensi',
      productType: 'Jenis Produk',
      productQuantity: 'Kuantitas',
      productDescription: 'Deskripsi Produk',
      deliveryDate: 'Tanggal Pengiriman',
      specialRequirements: 'Kebutuhan Khusus',
      termsAccepted: 'Persetujuan Syarat dan Ketentuan',
    }
    return fieldLabels[fieldName] || fieldName
  }

  return (
    <Box sx={{ mb: 3 }}>
      {errorEntries.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Harap Perbaiki Kesalahan Berikut</AlertTitle>
          <List dense>
            {errorEntries.map(([field, message]) => (
              <ListItem key={field} sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Error color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`${formatFieldName(field)}: ${message}`}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: { fontWeight: 500 }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {warningEntries.length > 0 && (
        <Alert severity="warning">
          <AlertTitle>Peringatan</AlertTitle>
          <List dense>
            {warningEntries.map(([field, message]) => (
              <ListItem key={field} sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Warning color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`${formatFieldName(field)}: ${message}`}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: { fontWeight: 500 }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
    </Box>
  )
}

export default ErrorSummary