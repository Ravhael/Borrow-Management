import Link from 'next/link'
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'

interface LoginFormData {
  usernameOrEmail: string
  password: string
  rememberMe: boolean
}

interface LoginFormProps {
  formData: LoginFormData
  showPassword: boolean
  loading: boolean
  error: string
  theme: any
  onInputChange: (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => void
  onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onTogglePassword: () => void
  onSubmit: (event: React.FormEvent) => void
}

const LoginForm: React.FC<LoginFormProps> = ({
  formData,
  showPassword,
  loading,
  error,
  theme,
  onInputChange,
  onCheckboxChange,
  onTogglePassword,
  onSubmit
}) => {
  return (
    <Box component="form" onSubmit={onSubmit} sx={{ mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="NIK atau Email"
        type="text"
        value={formData.usernameOrEmail}
        onChange={onInputChange('usernameOrEmail')}
        required
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            boxShadow: 'none !important',
            backgroundColor: 'transparent',
            transition: 'none',
            '&:hover': { boxShadow: 'none !important', backgroundColor: 'transparent' },
            '&.Mui-focused': {
              boxShadow: 'none !important',
              backgroundColor: 'transparent',
              outline: 'none'
            },
            '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.25)' },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
              borderWidth: '1px'
            }
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon color="primary" />
            </InputAdornment>
          ),
        }}
        inputProps={{ className: 'flat-input' }}
        placeholder="Masukkan NIK atau Email Anda"
      />

      <TextField
        fullWidth
        label="Kata Sandi"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={onInputChange('password')}
        required
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            boxShadow: 'none !important',
            backgroundColor: 'transparent',
            transition: 'none',
            '&:hover': { boxShadow: 'none !important', backgroundColor: 'transparent' },
            '&.Mui-focused': {
              boxShadow: 'none !important',
              backgroundColor: 'transparent',
              outline: 'none'
            },
            '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.25)' },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
              borderWidth: '1px'
            }
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="primary" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={onTogglePassword}
                edge="end"
                sx={{
                  boxShadow: 'none',
                  backgroundColor: 'transparent',
                  '&:hover': { backgroundColor: 'transparent', boxShadow: 'none' },
                  '&:focus': { backgroundColor: 'transparent', boxShadow: 'none' }
                }}
              >
                {showPassword ? <VisibilityOffIcon sx={{ color: theme.palette.primary.main }} /> : <VisibilityIcon sx={{ color: theme.palette.primary.main }} />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        inputProps={{ className: 'flat-input' }}
        placeholder="Masukkan Password Anda"
      />

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 1, sm: 0 }, mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={formData.rememberMe}
              onChange={onCheckboxChange}
              color="primary"
            />
          }
          label="Ingat Saya"
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
        />
        <Link href="/forgot-password" passHref>
          <Button
            variant="text"
            sx={{
              color: theme.palette.primary.main,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'rgba(26, 54, 93, 0.04)',
              },
              width: { xs: '100%', sm: 'auto' },
              textAlign: { xs: 'center', sm: 'right' },
              mt: { xs: 0, sm: 0 }
            }}
          >
            Lupa kata sandi?
          </Button>
        </Link>
      </Box>

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
        {loading ? 'Signing In...' : 'Sign In'}
      </Button>
    </Box>
  )
}

export default LoginForm