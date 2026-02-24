import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
  Stack,
  Fade,
  Zoom,
  CssBaseline
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckCircleIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Gavel as GavelIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { ThemeProvider } from '@mui/material/styles'
import HeaderForm from '../components/HeaderForm'
import FooterForm from '../components/FooterForm'
import { BorrowerInfoSection, LoanDetailsSection, ProductDetailsSection, ApprovalSection } from '../components/sections'
import PreloadingOverlay from '../components/PreloadingOverlay'
import { FormDataShape } from '../types/form'
import { formTheme } from '../themes/formTheme'
import { loginTheme } from '../themes/loginTheme'
import { getServerSession } from 'next-auth/next'
import { prisma } from '../lib/prisma'
import { GetServerSideProps } from 'next'
import { authOptions } from '../pages/api/auth/[...nextauth]'
import toast from 'react-hot-toast'
import { apiFetch } from '../utils/basePath'

export const getServerSideProps: GetServerSideProps = async (context) => {
  // use any casts to satisfy types across next-auth versions used in this project
  const session = (await getServerSession(context.req as any, context.res as any, authOptions as any)) as any

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  // Fetch user record from DB to ensure we populate missing fields like phone
  try {
    if (session?.user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: String(session.user.id) } })
      if (dbUser && dbUser.phone) {
        // prefer DB phone value if session token didn't include it
        session.user.phone = dbUser.phone
      }
    }
  } catch (e) {
    console.warn('getServerSideProps: failed to load user from DB for phone prefill', e)
  }

  // Ensure the session object is safe to serialize for Next.js props.
  // Next.js throws when a prop contains `undefined` — convert those to `null` or omit them.
  // Normalize session values so nothing is `undefined` (Next.js requires serializable props).
  const safeSession = {
    // keep top-level session props but ensure serializable values
    ...(session ?? {}),
    sessionToken: (session as any)?.sessionToken ?? null,
    roleName: (session as any)?.roleName ?? null,
    // user will be replaced by a normalized safe object below
    user: {
    // include phone so pages can prefill forms
    phone: session.user?.phone ?? null,
      id: session.user?.id ?? null,
      name: session.user?.name ?? null,
      email: session.user?.email ?? null,
      // canonical role may be a string or object — keep original but ensure not undefined
      role: (session.user?.role ?? null) as any,
      // extra session properties
      directorate: (session.user?.directorate ?? null) as any,
      entitas: (session.user?.entitas ?? null) as any,
      isActive: (session.user?.isActive ?? null) as any,
      image: session.user?.image ?? null,
      // keep any other properties on session but avoid undefined
      ...(session as any).roleName ? { roleName: (session as any).roleName } : {},
      ...(session as any).sessionToken ? { sessionToken: (session as any).sessionToken } : {}
    },
  }

  return {
    props: { session: safeSession },
  }
}

const steps = [
  {
    label: 'Informasi Peminjam',
    icon: <PersonIcon />,
    description: 'Data pribadi & kontak',
  },
  {
    label: 'Detail Kebutuhan',
    icon: <InventoryIcon />,
    description: 'Jenis & spesifikasi kebutuhan',
  },
  {
    label: 'Detail Produk',
    icon: <DescriptionIcon />,
    description: 'Informasi produk & jadwal',
  },
  {
    label: 'Persetujuan',
    icon: <GavelIcon />,
    description: 'Konfirmasi & submit',
  },
]

export default function FormPage({ session }: { session?: any }){
  const router = useRouter()
  // Prefill borrower-related fields from server-provided session data if available
  // (this ensures the /form page auto-fills with registered user info)
  const [formData, setFormData] = useState<FormDataShape>(() => {
    const source = session ?? undefined

    const borrowerName = source?.user?.name ?? ''
    const borrowerEmail = source?.user?.email ?? ''
    const borrowerPhone = source?.user?.phone ?? ''
    const entitasId = source?.user?.entitas?.code ?? source?.user?.entitasId ?? source?.user?.entitasid ?? source?.user?.entitas ?? ''

    return {
      entitasId: entitasId || '',
      borrowerPhone: borrowerPhone || '',
      borrowerEmail: borrowerEmail || '',
      borrowerName: borrowerName || '',
    }
  })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const validate = () => {
    const e: Record<string,string> = {}
    if(!formData.entitasId) e.entitasId = 'Pilih entitas peminjam'
    if(!formData.borrowerPhone) e.borrowerPhone = 'No telepon wajib diisi'
    if(!formData.needType) e.needType = 'Pilih jenis kebutuhan'
    if(!formData.company || (formData.company && formData.company.length===0)) e.company = 'Pilih company'
    if(!formData.outDate) e.outDate = 'Pilih tanggal keluar'
    if(!formData.useDate) e.useDate = 'Pilih tanggal pakai'
    if(!formData.returnDate) e.returnDate = 'Pilih tanggal kembali'
    if(!formData.productDetailsText) e.productDetailsText = 'Isi rincian product'
    if(!formData.approvalAgreementFlag) e.approvalAgreementFlag = 'Anda harus menyetujui persyaratan'

    // Date validations
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for comparison

    // Tanggal barang keluar tidak boleh sebelum hari pengajuan
    if(formData.outDate){
      const outDate = new Date(formData.outDate)
      if(outDate < today) e.outDate = 'Tanggal keluar tidak boleh sebelum hari ini'
    }

    // Tanggal barang dipakai tidak boleh sebelum tanggal keluar
    if(formData.outDate && formData.useDate){
      const out = new Date(formData.outDate)
      const use = new Date(formData.useDate)
      if(use < out) e.useDate = 'Tanggal pakai tidak boleh sebelum tanggal keluar'
    }

    // Tanggal barang dikembalikan tidak boleh sebelum tanggal dipakai
    if(formData.useDate && formData.returnDate){
      const use = new Date(formData.useDate)
      const ret = new Date(formData.returnDate)
      if(ret < use) e.returnDate = 'Tanggal kembali tidak boleh sebelum tanggal pakai'
    }

    setErrors(e)
    return Object.keys(e).length===0
  }

  // Try to find the loan that was most recently submitted that matches the form data
  const findSubmittedLoan = async (): Promise<any | null> => {
    try {
      const resp = await apiFetch('/api/debug/loans/latest')
      if (!resp.ok) return null
      const body = await resp.json()
      const latest = body?.data || []
      const now = Date.now()

      for (const loan of latest) {
        const submittedAt = loan?.submittedAt ? new Date(loan.submittedAt).getTime() : 0
        if (Math.abs(now - submittedAt) > 1000 * 60 * 10) continue // only consider loans in last 10 minutes

        // match by phone (best), then by borrowerName + productDetailsText
        if (formData.borrowerPhone && loan.borrowerPhone && String(loan.borrowerPhone).trim() === String(formData.borrowerPhone).trim()) return loan
        if (formData.borrowerName && loan.borrowerName && formData.productDetailsText && loan.productDetailsText) {
          if (String(loan.borrowerName).trim() === String(formData.borrowerName).trim() && String(loan.productDetailsText).trim() === String(formData.productDetailsText).trim()) return loan
        }
      }
      return null
    } catch (err) {
      console.warn('findSubmittedLoan failed', err)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!validate()){
      toast.error('Periksa kembali form yang bertanda merah')
      return
    }
    setLoading(true)
    try{
      const res = await apiFetch('/api/submit', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...formData, isDraft: false })
      })

      let json: any = null
      try {
        json = await res.json()
      } catch (parseErr) {
        console.warn('Failed to parse /api/submit response as JSON', parseErr)
      }

      // If server returned a valid JSON with id or message, use it
      if (json && json.id) {
        toast.success(json.message || 'Permintaan peminjaman berhasil diajukan', { duration: 4000 })
        router.push(`/peminjaman/${json.id}`)
        return
      }

      // Try a fallback lookup — sometimes the reverse proxy returns HTML/502 even though DB saved the loan
      const found = await findSubmittedLoan()
      if (found) {
        toast.success('Permintaan peminjaman berhasil diajukan', { duration: 4000 })
        router.push(`/peminjaman/${found.id}`)
        return
      }

      // If response was OK but we couldn't parse JSON, show generic success message
      if (res.ok) {
        toast.success((json && json.message) || 'Permintaan peminjaman berhasil diajukan', { duration: 4000 })
        // reset form as fallback
        setFormData({
          entitasId: '',
          borrowerPhone: '',
          needType: '',
          company: [],
          outDate: '',
          useDate: '',
          returnDate: '',
          productDetailsText: '',
          pickupMethod: '',
          note: '',
          approvalAgreementFlag: false,
          lainnya: ''
        })
        return
      }

      // Otherwise treat as failure
      console.error('Submit failed', { status: res.status, body: json })
      toast.error('Terjadi kesalahan saat mengajukan peminjaman')
    }catch(err){
      console.error(err)
      // As a last resort try to find the saved loan and redirect
      try {
        const found = await findSubmittedLoan()
        if (found) {
          toast.success('Permintaan peminjaman berhasil diajukan', { duration: 4000 })
          router.push(`/peminjaman/${found.id}`)
          return
        }
      } catch (e) {
        console.warn('Fallback findSubmittedLoan failed', e)
      }
      toast.error('Terjadi kesalahan saat mengajukan peminjaman')
    }finally{
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    setLoading(true)
    try{
      const res = await apiFetch('/api/submit', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...formData, isDraft: true })
      })

      let json: any = null
      try {
        json = await res.json()
      } catch (parseErr) {
        console.warn('Failed to parse /api/submit response as JSON (draft)', parseErr)
      }

      if (json && json.id) {
        toast.success(json.message || 'Draft berhasil disimpan', { duration: 3000 })
        router.push(`/peminjaman/${json.id}`)
        return
      }

      // fallback lookup
      const found = await findSubmittedLoan()
      if (found) {
        toast.success('Draft berhasil disimpan', { duration: 3000 })
        router.push(`/peminjaman/${found.id}`)
        return
      }

      if (res.ok) {
        toast.success((json && json.message) || 'Draft berhasil disimpan', { duration: 3000 })
      } else {
        console.error('Save draft failed', { status: res.status, body: json })
        toast.error('Terjadi kesalahan saat menyimpan draft')
      }
    }catch(err){
      console.error(err)
      // try fallback
      try {
        const found = await findSubmittedLoan()
        if (found) {
          toast.success('Draft berhasil disimpan', { duration: 3000 })
          router.push(`/peminjaman/${found.id}`)
          return
        }
      } catch (e) {
        console.warn('Fallback findSubmittedLoan failed (draft)', e)
      }
      toast.error('Terjadi kesalahan saat menyimpan draft')
    }finally{
      setLoading(false)
    }
  }

  return (
    <ThemeProvider theme={formTheme}>
      <CssBaseline />
      <PreloadingOverlay open={loading} text="Mengajukan permintaan..." />

      {/* Hero Header Section - Full Width */}
      <Fade in={true} timeout={800}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${loginTheme.palette.primary.dark} 0%, ${loginTheme.palette.primary.main} 50%, ${loginTheme.palette.primary.light} 100%)`,
            color: 'white',
            py: { xs: 6, md: 3 },
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.1,
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '1200px', mx: 'auto', px: { xs: 2, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ fontSize: { xs: 40, md: 48 }, mr: 3, opacity: 0.9 }} />
                <Box>
                  <Typography
                    variant="h2"
                    component="h1"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '2rem', md: '2.5rem' },
                      mb: 1,
                      background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Request Form
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      opacity: 0.9,
                      maxWidth: '600px',
                      lineHeight: 1.4,
                    }}
                  >
                    Silakan ajukan permohonan melalui formulir yang telah disediakan. Proses persetujuan dilakukan secara lebih cepat melalui sistem alur kerja digital.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Key Stats Row */}

          </Box>
        </Box>
      </Fade>

      <div>
        <Head>
          <title>Buat Permintaan Peminjaman</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        </Head>

        <Container maxWidth={false} sx={{ maxWidth: 1350, py: 6, px: { xs: 2, md: 4 } }}>
          

          {/* Enhanced Progress Indicator */}


          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              {/* Borrower Info Section */}
              <BorrowerInfoSection
                formData={formData}
                setFormData={setFormData}
                errors={errors}
              />

              {/* Loan Details Section */}
              <LoanDetailsSection
                formData={formData}
                setFormData={setFormData}
              />

              {/* Product Details Section */}
              <ProductDetailsSection
                formData={formData}
                setFormData={setFormData}
                errors={errors}
              />

              {/* Approval Section */}
              <ApprovalSection
                formData={formData}
                setFormData={setFormData}
                errors={errors}
              />
            </Stack>

            {/* Enhanced Action Buttons */}
            <Fade in={true} style={{ transitionDelay: '500ms' }}>
              <Paper
                elevation={4}
                sx={{
                  p: 3,
                  mt: 4,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  border: '1px solid rgba(21, 101, 192, 0.1)',
                  bottom: 24,
                  zIndex: 1000,
                  boxShadow: '0px 8px 32px rgba(0,0,0,0.12)',
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1, fontSize: '1.1rem' }}>
                    Siap Mengajukan Permintaan?
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                    Pastikan semua informasi telah diisi dengan benar sebelum mengajukan
                  </Typography>
                </Box>

                <Box sx={{
                  display: 'flex',
                  gap: 3,
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                    sx={{
                      minWidth: { xs: '100%', sm: 220 },
                      width: { xs: '100%', sm: 'auto' },
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 700,
                      backgroundColor: '#e1272b',
                      color: '#ffffff',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#5f5e5f',
                        boxShadow: 'none',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {loading ? 'Mengajukan...' : 'Ajukan Peminjaman'}
                  </Button>
                </Box>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#888', fontStyle: 'italic' }}>
                    Dengan mengajukan permintaan, Anda menyetujui syarat dan ketentuan yang berlaku
                  </Typography>
                </Box>
              </Paper>
            </Fade>

            {/* Enhanced Error Summary */}
            {Object.keys(errors).length > 0 && (
              <Fade in={true}>
                <Alert
                  severity="error"
                  sx={{
                    mt: 4,
                    borderRadius: 3,
                    p: 3,
                    fontSize: '1rem',
                    boxShadow: '0px 4px 16px rgba(211, 47, 47, 0.2)',
                    border: '1px solid rgba(211, 47, 47, 0.2)'
                  }}
                  icon={<Typography variant="h6" sx={{ color: '#d32f2f', mr: 1 }}>⚠️</Typography>}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    Periksa kembali form yang bertanda merah
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Beberapa field wajib belum diisi atau formatnya tidak valid
                  </Typography>
                </Alert>
              </Fade>
            )}
          </form>
        </Container>

        <FooterForm />
      </div>
    </ThemeProvider>
  )
}