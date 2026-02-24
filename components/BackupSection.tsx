import React, { Dispatch, SetStateAction } from 'react'
import {
  Typography,
  TextField,
  Box,
  Grid
} from '@mui/material'
import { FormDataShape } from '../types/form'
import BackupIcon from '@mui/icons-material/Backup'

type Props = { formData: FormDataShape, setFormData: Dispatch<SetStateAction<FormDataShape>> }

export default function BackupSection({ formData, setFormData }: Props){
  return (
    <Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            id="needDetails.namaCustomer"
            name="needDetails.namaCustomer"
            label="Nama Customer (Backup)"
            value={formData.needDetails?.namaCustomer || ''}
            onChange={e => setFormData({
              ...formData,
              needDetails: {
                ...formData.needDetails,
                namaCustomer: e.target.value
              }
            })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            id="needDetails.namaPerusahaan"
            name="needDetails.namaPerusahaan"
            label="Nama Perusahaan / Institusi (Backup)"
            value={formData.needDetails?.namaPerusahaan || ''}
            onChange={e => setFormData({
              ...formData,
              needDetails: {
                ...formData.needDetails,
                namaPerusahaan: e.target.value
              }
            })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            id="needDetails.alamat"
            name="needDetails.alamat"
            label="Alamat (Backup)"
            value={formData.needDetails?.alamat || ''}
            onChange={e => setFormData({
              ...formData,
              needDetails: {
                ...formData.needDetails,
                alamat: e.target.value
              }
            })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            id="needDetails.telepon"
            name="needDetails.telepon"
            label="No Telepon Customer (Backup)"
            value={formData.needDetails?.telepon || ''}
            onChange={e => setFormData({
              ...formData,
              needDetails: {
                ...formData.needDetails,
                telepon: e.target.value
              }
            })}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            id="needDetails.alasan"
            name="needDetails.alasan"
            label="Alasan Kebutuhan Barang Backup?"
            multiline
            rows={1}
            value={formData.needDetails?.alasan || ''}
            onChange={e => setFormData({
              ...formData,
              needDetails: {
                ...formData.needDetails,
                alasan: e.target.value
              }
            })}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
