import React, { Dispatch, SetStateAction } from 'react'
import {
  Typography,
  TextField,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormHelperText,
  Box,
  Grid,
  MenuItem
} from '@mui/material'
import { FormDataShape } from '../types/form'
import { PickupMethod } from '../utils/pickupMethods'
import { useEffect, useState } from 'react'
import InventoryIcon from '@mui/icons-material/Inventory'

type Props = {
  formData: FormDataShape
  setFormData: Dispatch<SetStateAction<FormDataShape>>
  errors: Record<string,string>
}

export default function DetailProduct({ formData, setFormData, errors }: Props){
  const [companyOptions, setCompanyOptions] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        // request the full list of company options for the form UI so all checkboxes are shown
        const res = await fetch('/api/company?all=true')
        if (!res.ok) return
        const data = await res.json()
        if (mounted && Array.isArray(data)) setCompanyOptions(data)
      } catch (err) {
        console.warn('Failed to load companies', err)
      }
    }
    load()
    return () => { mounted = false }
  }, [])
  const selectCompany = (value: string) => {
    setFormData({...formData, company: [value]})
  }

  // Date validation handlers
  const handleOutDateChange = (value: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(value)

    if (selectedDate < today) {
      // Don't update if date is before today
      return
    }

    setFormData({...formData, outDate: value})

    // Clear useDate and returnDate if they're before the new outDate
    if (formData.useDate && new Date(formData.useDate) < selectedDate) {
      setFormData(prev => ({...prev, outDate: value, useDate: '', returnDate: ''}))
    } else if (formData.returnDate && formData.useDate && new Date(formData.returnDate) < new Date(formData.useDate)) {
      setFormData(prev => ({...prev, outDate: value, returnDate: ''}))
    }
  }

  const handleUseDateChange = (value: string) => {
    const selectedDate = new Date(value)

    // Check if useDate is before outDate
    if (formData.outDate && selectedDate < new Date(formData.outDate)) {
      return // Don't update if invalid
    }

    setFormData({...formData, useDate: value})

    // Clear returnDate if it's before the new useDate
    if (formData.returnDate && new Date(formData.returnDate) < selectedDate) {
      setFormData(prev => ({...prev, useDate: value, returnDate: ''}))
    }
  }

  const handleReturnDateChange = (value: string) => {
    const selectedDate = new Date(value)

    // Check if returnDate is before useDate
    if (formData.useDate && selectedDate < new Date(formData.useDate)) {
      return // Don't update if invalid
    }

    setFormData({...formData, returnDate: value})
  }

  // Get minimum dates for date inputs
  const getTodayString = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMinUseDate = () => {
    return formData.outDate || getTodayString()
  }

  const getMinReturnDate = () => {
    return formData.useDate || formData.outDate || getTodayString()
  }

  return (
    <Box>

      <Grid container spacing={3}>
        {/* Company Selection */}
        <Grid size={{ xs: 12 }}>
          <FormControl component="fieldset" error={!!errors.company} fullWidth>
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
              Marketing Company *
            </FormLabel>
            {/* company descriptions now rendered inline under the checkbox label; info block removed */}
            <FormGroup>
              <Grid container spacing={2}>
                {companyOptions.filter(c => c.isActive !== false).map(c => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.value}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={(formData.company || []).includes(c.value)}
                          onChange={() => selectCompany(c.value)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{c.label}</Typography>
                              {c.description ? (
                                <Box
                                  component="div"
                                  sx={{
                                    display: 'inline-block',
                                    mt: 0.5,
                                    px: 1.25,
                                    py: 0.4,
                                    borderRadius: 1.25,
                                    backgroundColor: 'rgba(14,165,233,0.06)',
                                    border: theme => `1px solid ${theme.palette.mode === 'light' ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.18)'}`,
                                    transition: 'transform 140ms ease, box-shadow 140ms ease',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: theme => `0 6px 14px ${theme.palette.mode === 'light' ? 'rgba(14,165,233,0.06)' : 'rgba(0,0,0,0.4)'}`
                                    }
                                  }}
                                >
                                  <Typography variant="body2" sx={{ color: 'text.primary', fontStyle: 'italic', fontSize: '0.825rem', lineHeight: 1.2 }}>{String(c.description)}</Typography>
                                </Box>
                              ) : null}
                        </Box>
                      }
                      sx={{
                        width: '100%',
                        alignItems: 'flex-start',
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
            {errors.company && <FormHelperText>{errors.company}</FormHelperText>}
          </FormControl>
        </Grid>

        {/* Date Fields */}
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            id="outDate"
            name="outDate"
            label="Tanggal barang keluar dari gudang"
            type="date"
            value={formData.outDate || ''}
            onChange={e => handleOutDateChange(e.target.value)}
            error={!!errors.outDate}
            helperText={errors.outDate || "Tanggal tidak boleh sebelum hari ini"}
            required
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: getTodayString() }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            id="useDate"
            name="useDate"
            label="Tanggal barang dipakai"
            type="date"
            value={formData.useDate || ''}
            onChange={e => handleUseDateChange(e.target.value)}
            error={!!errors.useDate}
            helperText={errors.useDate || "Tanggal tidak boleh sebelum tanggal keluar dari gudang"}
            required
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: getMinUseDate() }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            id="returnDate"
            name="returnDate"
            label="Tanggal barang dikembalikan"
            type="date"
            value={formData.returnDate || ''}
            onChange={e => handleReturnDateChange(e.target.value)}
            error={!!errors.returnDate}
            helperText={errors.returnDate || "Tanggal tidak boleh sebelum tanggal dipakai"}
            required
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: getMinReturnDate() }}
          />
        </Grid>

        {/* Product Details */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            id="productDetailsText"
            name="productDetailsText"
            label="Rincian Product"
            multiline
            minRows={0}
            maxRows={4}
            placeholder="Tuliskan rincian produk yang dibutuhkan"
            value={formData.productDetailsText || ''}
            onChange={e => setFormData({...formData, productDetailsText: e.target.value})}
            error={!!errors.productDetailsText}
            helperText={errors.productDetailsText || "Brand / Tipe / Jumlah Unit"}
            required
            sx={{
              // Override global textarea min-height for this field only
              '& .MuiInputBase-inputMultiline': {
                minHeight: '120px',
                maxHeight: '320px',
                overflow: 'auto'
              }
            }}
          />
        </Grid>

        {/* Pickup Method */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <TextField
              select
              id="pickupMethod"
              name="pickupMethod"
              label="Metode Pengambilan Barang"
              value={formData.pickupMethod || ''}
              onChange={e => setFormData({...formData, pickupMethod: e.target.value as PickupMethod})}
              required
            >
              <MenuItem value="">Pilih Metode</MenuItem>
              <MenuItem value={PickupMethod.SELF_PICKUP}>Self Pickup / Ambil sendiri</MenuItem>
              <MenuItem value={PickupMethod.WAREHOUSE_DELIVERY}>Dikirim oleh pihak gudang</MenuItem>
              <MenuItem value={PickupMethod.THIRD_PARTY}>Menggunakan pihak ke tiga</MenuItem>
            </TextField>
          </FormControl>
        </Grid>

        {/* Notes */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            id="note"
            name="note"
            label="Catatan"
            multiline
            minRows={0}
            maxRows={6}
            placeholder="Diisi jika terdapat catatan khusus, seperti: urgency dan detail peminjaman barang"
            value={formData.note || ''}
            onChange={e => setFormData({...formData, note: e.target.value})}
            helperText="(diisi jika terdapat catatan khusus, seperti : urgency dan detail peminjaman barang )"
            sx={{
              '& .MuiInputBase-inputMultiline': {
                minHeight: '120px',
                maxHeight: '240px',
                overflow: 'auto'
              }
            }}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
