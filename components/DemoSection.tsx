import React, { Dispatch, SetStateAction } from 'react'
import { TextField, Box, Grid } from '@mui/material'
import { FormDataShape } from '../types/form'

type Props = { formData: FormDataShape, setFormData: Dispatch<SetStateAction<FormDataShape>> }

// Single, clean implementation for the Demo / needDetails input section
export default function DemoSection({ formData, setFormData }: Props) {
  const setNeedDetail = (key: string, value: string) => {
    setFormData({
      ...formData,
      needDetails: {
        ...(formData.needDetails || formData.demo || {}),
        [key]: value
      }
    })
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            id="needDetails.namaCustomer"
            name="needDetails.namaCustomer"
            label="Nama Customer"
            value={(formData.needDetails?.namaCustomer ?? formData.demo?.namaCustomer) || ''}
            onChange={(e) => setNeedDetail('namaCustomer', e.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            id="needDetails.namaPerusahaan"
            name="needDetails.namaPerusahaan"
            label="Nama Perusahaan / Institusi"
            value={(formData.needDetails?.namaPerusahaan ?? formData.demo?.namaPerusahaan) || ''}
            onChange={(e) => setNeedDetail('namaPerusahaan', e.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            id="needDetails.alamat"
            name="needDetails.alamat"
            label="Alamat"
            value={(formData.needDetails?.alamat ?? formData.demo?.alamat) || ''}
            onChange={(e) => setNeedDetail('alamat', e.target.value)}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            id="needDetails.telepon"
            name="needDetails.telepon"
            label="No Telepon Customer"
            value={(formData.needDetails?.telepon ?? formData.demo?.telepon) || ''}
            onChange={(e) => setNeedDetail('telepon', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
