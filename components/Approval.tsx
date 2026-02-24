import React, { Dispatch, SetStateAction } from 'react'
import {
  Typography,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Box,
  Alert,
  Link
} from '@mui/material'
import { FormDataShape } from '../types/form'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

type Props = {
  formData: FormDataShape
  setFormData: Dispatch<SetStateAction<FormDataShape>>
  errors: Record<string,string>
}

export default function Approval({ formData, setFormData, errors }: Props){
  return (
    <Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Dengan mengirimkan Form Request ini, saya sudah membaca, mengerti dan menyetujui persyaratan serta prosedur tentang Peminjaman Barang nomor MKT-001 tanggal 01 Jan 2025 yang ada di link berikut:{' '}
          <Link
            href="https://bit.ly/sop_peminjaman_barang"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ fontWeight: 600 }}
          >
            bit.ly/sop_peminjaman_barang
          </Link>
        </Typography>
      </Alert>

      <FormControlLabel
        control={
          <Checkbox
            id="approvalAgreementFlag"
            name="approvalAgreementFlag"
            checked={!!formData.approvalAgreementFlag}
            onChange={e => setFormData({...formData, approvalAgreementFlag: e.target.checked})}
            color="primary"
            required
          />
        }
        label={
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            Ya, saya setuju
          </Typography>
        }
        sx={{ mb: 1 }}
      />

      {errors.approvalAgreementFlag && (
        <FormHelperText error sx={{ ml: 4 }}>
          {errors.approvalAgreementFlag}
        </FormHelperText>
      )}
    </Box>
  )
}
