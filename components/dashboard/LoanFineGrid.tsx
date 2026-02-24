import React from 'react'
import Link from 'next/link'
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import PersonIcon from '@mui/icons-material/Person'
import BusinessIcon from '@mui/icons-material/Business'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
import { LoanDisplay } from './LoanFieldGrid'

export interface LoanFineGridProps {
  loan: LoanDisplay
  textVariant?: 'body1' | 'body2'
  detailHref?: string | null
}

const FINE_TITLE = 'Denda Peminjaman'

const coerceNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (value && typeof value === 'object') {
    const candidate = value as { toNumber?: () => number; valueOf?: () => unknown }
    if (typeof candidate.toNumber === 'function') {
      const parsed = candidate.toNumber()
      return Number.isFinite(parsed) ? parsed : null
    }
    if (typeof candidate.valueOf === 'function') {
      const parsed = Number(candidate.valueOf())
      return Number.isFinite(parsed) ? parsed : null
    }
  }
  return null
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatCurrency = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-'
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

export const hasLoanFine = (loan: LoanDisplay) => {
  if (!loan?.totalDenda) return false
  const fineAmount = coerceNumber(loan.totalDenda.fineAmount as any)
  return typeof fineAmount === 'number' && fineAmount > 0
}

export const LoanFineGrid: React.FC<LoanFineGridProps> = ({ loan, textVariant = 'body2', detailHref }) => {
  if (!hasLoanFine(loan)) {
    return null
  }

  const fineAmount = coerceNumber(loan.totalDenda?.fineAmount as any)
  const daysOverdue = coerceNumber(loan.totalDenda?.daysOverdue as any)

  const gridTemplateColumns = {
    xs: '1fr',
    md: 'repeat(auto-fit, minmax(150px, 1fr))'
  }

  const renderFineStatus = () => (
    <Chip
      label={FINE_TITLE}
      size="small"
      color="error"
      sx={{
        fontWeight: 700,
        bgcolor: 'rgba(185, 28, 28, 0.92)',
        color: '#ffffff',
        '& .MuiChip-label': {
          px: 1.5
        }
      }}
    />
  )

  const fields = [
    {
      icon: <FactCheckIcon color="primary" fontSize="small" />,
      label: 'ID Peminjaman',
      value: loan.loanId || '-'
    },
    {
      icon: <PersonIcon color="primary" fontSize="small" />,
      label: 'Nama Peminjam',
      value: loan.borrower || '-'
    },
    {
      icon: <BusinessIcon color="primary" fontSize="small" />,
      label: 'Entitas Peminjam',
      value: loan.entitasLabel || loan.entitasId || loan.company || '-'
    },
    {
      icon: <BusinessIcon color="primary" fontSize="small" />,
      label: 'Jenis Kebutuhan',
      value: loan.needType || '-'
    },
    {
      icon: <BusinessIcon color="primary" fontSize="small" />,
      label: 'Marketing',
      value: loan.marketing || '-'
    },
    {
      icon: <EventAvailableIcon color="primary" fontSize="small" />,
      label: 'Jadwal Pengembalian',
      value: formatDate(loan.returnDate)
    },
    {
      icon: <MonetizationOnIcon color="error" fontSize="small" />,
      label: 'Total Denda',
      value: typeof fineAmount === 'number' ? formatCurrency(fineAmount) : '-'
    },
    {
      icon: <AccessTimeFilledIcon color="error" fontSize="small" />,
      label: 'Hari Keterlambatan',
      value: typeof daysOverdue === 'number' && daysOverdue > 0 ? `${daysOverdue} hari` : '-'
    },
  ]

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns,
          columnGap: { xs: 0.75, md: 1 },
          rowGap: { xs: 1.25, md: 1.5 },
          alignItems: 'center',
          width: '100%',
          pr: { xs: 0, md: 1 }
        }}
      >
        {fields.map((field) => {
          const f: any = field
          return (
            <Stack direction="row" spacing={1} alignItems="center" key={f.label} sx={{ minWidth: 0 }}>
              {f.icon}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">{f.label}</Typography>
                {typeof f.render === 'function' ? (
                  <>{f.render()}</>
                ) : (
                  <Typography variant={textVariant} sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                    {f.value}
                  </Typography>
                )}
              </Box>
            </Stack>
          )
        })}
      </Box>
      {detailHref ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            mt: { xs: 1.5, md: 2 }
          }}
        >
          <Button
            component={Link}
            href={detailHref}
            variant="text"
            size="small"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            sx={{
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: 0.4,
              whiteSpace: 'nowrap',
              fontSize: '0.65rem',
              minHeight: 'auto'
            }}
          >
            Lihat Detail
          </Button>
        </Box>
      ) : null}
    </>
  )
}
