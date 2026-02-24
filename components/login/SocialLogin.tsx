import React from 'react'
import { Button, Divider, Typography } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'

interface SocialLoginProps {
  theme: any
  onGoogleLogin: () => void
}

const SocialLogin: React.FC<SocialLoginProps> = ({ theme, onGoogleLogin }) => {
  return (
    <>
      <Divider sx={{ mb: 4 }}>
        <Typography variant="body2" color="text.secondary">
          or continue with
        </Typography>
      </Divider>

      <Button
        fullWidth
        variant="outlined"
        size="large"
        onClick={onGoogleLogin}
        startIcon={<GoogleIcon />}
        sx={{
          mb: 4,
          borderColor: 'rgba(0, 0, 0, 0.12)',
          color: 'text.primary',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: 'rgba(26, 54, 93, 0.04)',
          }
        }}
      >
        Continue with Google
      </Button>
    </>
  )
}

export default SocialLogin