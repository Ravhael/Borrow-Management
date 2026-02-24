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
import { getExtendStatusDisplay } from '../../utils/extendStatusDisplay'
import { formatLifecycleStatusLabel } from '../../utils/peminjamanHelpers'
import { LoanDisplay } from './LoanFieldGrid'

export interface LoanIncompleteReturnGridProps {
  loan: LoanDisplay
  textVariant?: 'body1' | 'body2'
  detailHref?: string | null
}

const INCOMPLETE_RETURN_TOKEN = 'dikembalikan tidak lengkap'

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

const normalizeStatus = (value?: string | null) => (value ? String(value).trim().toLowerCase() : '')

const humanizeStatusLabel = (value?: string | null) => {
  if (value === null || typeof value === 'undefined') return ''
  const trimmed = String(value).trim()
  if (!trimmed) return ''
  const normalized = trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
  return normalized
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const matchesIncompleteStatus = (value?: string | null) => {
  const normalized = normalizeStatus(value)
  if (!normalized) return false
  return normalized.includes(INCOMPLETE_RETURN_TOKEN)
}

export const isIncompleteReturnLoan = (loan: LoanDisplay) => {
  const extendDisplay = getExtendStatusDisplay(loan)
  const candidates = [
    extendDisplay?.label,
    loan.statusLabel,
    loan.loanStatus,
    loan.warehouseStatus?.status,
    loan.returnStatus?.status
  ]
  return candidates.some(matchesIncompleteStatus)
}

export const LoanIncompleteReturnGrid: React.FC<LoanIncompleteReturnGridProps> = ({ loan, textVariant = 'body2', detailHref }) => {
  if (!isIncompleteReturnLoan(loan)) {
    return null
  }

  const gridTemplateColumns = {
    xs: '1fr',
    md: 'repeat(auto-fit, minmax(110px, 1fr))'
  }

  const renderStatusValue = () => {
    const extendDisplay = getExtendStatusDisplay(loan)
    const rawLabel = extendDisplay?.label || loan.statusLabel || 'Dikembalikan Tidak Lengkap'
    const marketingAdjusted = formatLifecycleStatusLabel(rawLabel)
    const baseLabel = marketingAdjusted || rawLabel || 'Dikembalikan Tidak Lengkap'
    const formattedLabel = humanizeStatusLabel(baseLabel) || baseLabel

    return (
      <Chip
        label={formattedLabel}
        size="small"
        color="success"
        sx={{
          fontWeight: 700,
          bgcolor: 'rgba(5, 122, 85, 0.9)',
          color: '#ffffff',
          width: 'auto',
          minWidth: { xs: 'auto', md: 240 },
          height: 'auto',
          minHeight: 0,
          borderRadius: 999,
          '& .MuiChip-label': {
            display: 'inline-block',
            whiteSpace: 'nowrap',
            lineHeight: 1.25,
            px: { xs: 1.2, md: 2 },
            py: 0.5
          }
        }}
      />
    )
  }

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
      icon: <FactCheckIcon color="primary" fontSize="small" />,
      label: 'Status Peminjaman',
      render: renderStatusValue
    }
  ]

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns,
          columnGap: { xs: 0.4, md: 0.15 },
          rowGap: { xs: 1.25, md: 1.5 },
          alignItems: 'center',
          width: '100%',
          overflow: 'visible',
          pr: { xs: 0, md: 10 }
        }}
      >
        {fields.map((field) => (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              key={field.label}
              sx={{ minWidth: 0 }}
            >
              {field.icon}
              <Box sx={{ minWidth: 0, width: field.label === 'Status Peminjaman' ? '100%' : 'auto' }}>
                <Typography variant="caption" color="text.secondary">{field.label}</Typography>
                {field.render ? (
                  <>{field.render()}</>
                ) : (
                  <Typography variant={textVariant} sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                    {field.value}
                  </Typography>
                )}
              </Box>
            </Stack>
        ))}
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
