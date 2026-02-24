import React from 'react'
import Link from 'next/link'
import {
  Box,
  Button,
  Chip,
  Stack,
  Tooltip,
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

export interface LoanFollowUpGridProps {
  loan: LoanDisplay
  textVariant?: 'body1' | 'body2'
  detailHref?: string | null
}

const FOLLOW_UP_TOKEN = 'perlu tindak lanjut'

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

const normalizeStatus = (value?: string | null) => {
  if (!value) return ''
  return String(value).trim().toLowerCase()
}

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

export const isFollowUpLoan = (loan: LoanDisplay) => {
  const extendDisplay = getExtendStatusDisplay(loan)
  const candidates = [
    extendDisplay?.label,
    loan.statusLabel,
    loan.loanStatus,
    loan.warehouseStatus?.status,
    loan.returnStatus?.status
  ]
  return candidates.some((label) => normalizeStatus(label).includes(FOLLOW_UP_TOKEN))
}

export const LoanFollowUpGrid: React.FC<LoanFollowUpGridProps> = ({ loan, textVariant = 'body2', detailHref }) => {
  if (!isFollowUpLoan(loan)) {
    return null
  }

  const gridTemplateColumns = {
    xs: '1fr',
    md: 'repeat(auto-fit, minmax(140px, 1fr))'
  }

  const renderStatusValue = () => {
    const extendDisplay = getExtendStatusDisplay(loan)
    const rawLabel = extendDisplay?.label || loan.statusLabel || 'Perlu Tindak Lanjut'
    const marketingAdjusted = formatLifecycleStatusLabel(rawLabel)
    const baseLabel = marketingAdjusted || rawLabel || 'Perlu Tindak Lanjut'
    const formattedLabel = humanizeStatusLabel(baseLabel) || baseLabel

    return (
      <Chip
        label={formattedLabel}
        size="small"
        color="warning"
        sx={{
          fontWeight: 700,
          color: '#ffffff',
          bgcolor: 'rgba(217, 119, 6, 0.9)',
          alignSelf: 'flex-start',
          maxWidth: '100%',
          width: 'auto',
          minHeight: 0,
          borderRadius: 999,
          '& .MuiChip-label': {
            px: 1.5,
            whiteSpace: 'normal',
            lineHeight: 1.2,
            py: 0.5,
            display: 'block'
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
          columnGap: { xs: 0.6, md: 0.85 },
          rowGap: { xs: 1, md: 1.25 },
          alignItems: 'center',
          width: '100%',
          pr: { xs: 0, md: 10 }
        }}
      >
        {fields.map((field) => (
          <Stack direction="row" spacing={1} alignItems="center" key={field.label} sx={{ minWidth: 0 }}>
            {field.icon}
            <Box sx={{ minWidth: 0 }}>
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
