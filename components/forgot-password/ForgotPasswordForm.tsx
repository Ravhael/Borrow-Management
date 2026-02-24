import React from 'react'
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Alert,
  Typography
} from '@mui/material'
import { withBasePath } from '../../utils/basePath'
import EmailIcon from '@mui/icons-material/Email'

interface ForgotPasswordFormProps {
  email: string
  loading: boolean
  error: string
  success: string
  theme: any
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: React.FormEvent) => void
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  email,
  loading,
  error,
  success,
  theme,
  onInputChange,
  onSubmit
}) => {
  return (
    <Box component="form" onSubmit={onSubmit} sx={{ mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Alamat Email"
        type="email"
        value={email}
        onChange={onInputChange}
        required
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon color="primary" />
            </InputAdornment>
          ),
        }}
        placeholder="Masukkan alamat email Anda"
        helperText="Kami akan mengirimkan tautan reset kata sandi ke email ini"
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        sx={{
          mb: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          boxShadow: '0 4px 14px rgba(26, 54, 93, 0.25)',
          '&:hover': {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(26, 54, 93, 0.3)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        {loading ? 'Mengirim Tautan Reset...' : 'Kirim Tautan Reset'}
      </Button>

      <Typography variant="body2" color="text.secondary" align="center">
        Ingat kata sandi Anda?{' '}
        <Button
          variant="text"
          sx={{
            color: theme.palette.primary.main,
            textTransform: 'none',
            fontWeight: 600,
            p: 0,
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: 'rgba(26, 54, 93, 0.04)',
            }
          }}
          href={withBasePath('/login')}
        >
          Masuk di sini
        </Button>
      </Typography>
    </Box>
  )
}

export default ForgotPasswordForm