import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ThemeProvider } from '@mui/material/styles'
import { RegisterTheme, SuccessMessage, NavigationHeader, RegistrationForm } from '../components/register'

import type { NextPageWithLayout } from '../types/next-page-with-layout'

interface FormData {
  username: string
  fullName: string
  whatsapp?: string
  email: string
  role: string
  directorateId?: number | ''
  entitasId?: number | ''
  password: string
  confirmPassword: string
}

const RegisterPage: NextPageWithLayout = () => {
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [userData, setUserData] = useState<{ fullName: string; whatsapp?: string; directorateId?: number | ''; entitasId?: number | ''; isActive?: boolean } | null>(null)

  const handleRegistrationSuccess = (createdUser: any) => {
    // Don't auto-login — created accounts must be approved first
    setUserData({
      fullName: createdUser.name || '',
      whatsapp: createdUser.phone || '',
      directorateId: createdUser.directorateid ?? null,
      entitasId: createdUser.entitasid ?? null,
      isActive: createdUser.isActive
    })

    setSuccess(true)
  }

  if (success && userData) {
    return (
      <ThemeProvider theme={RegisterTheme}>
        <SuccessMessage fullName={userData.fullName} whatsapp={userData.whatsapp} isActive={userData.isActive} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={RegisterTheme}>
      <div style={{ minHeight: '100vh', backgroundColor: RegisterTheme.palette.background.default }}>
        <Head>
          <title>Sign Up - FormFlow</title>
          <meta name="description" content="Buat akun Anda dan mulai kelola peminjaman barang gudang dengan lebih efisien" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>

        
        <RegistrationForm onSuccess={handleRegistrationSuccess} />
      </div>
    </ThemeProvider>
  )
}



export default RegisterPage