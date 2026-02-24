import React from 'react'
import Link from 'next/link'
import { Box, Typography, Button } from '@mui/material'

interface LoginFooterProps {
  theme: any
}

const LoginFooter: React.FC<LoginFooterProps> = ({ theme }) => {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        Belum punya akun?{' '}
        <Link href="/register" passHref>
          <Button
            variant="text"
            disableElevation
            sx={{
              color: theme.palette.primary.main,
              textTransform: 'none',
              fontWeight: 600,
              p: 0,
              minWidth: 'auto',
              boxShadow: 'none',
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'transparent',
                boxShadow: 'none',
              }
            }}
          >
            Registrasi Sekarang
          </Button>
        </Link>
      </Typography>
    </Box>
  )
}

export default LoginFooter