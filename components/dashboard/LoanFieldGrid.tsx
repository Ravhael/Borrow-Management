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

export type LoanDisplay = {
  loanId: string | null
  borrower: string | null
  company: string | null
  needType: string | null
  entitasId?: string | null
  entitasLabel?: string | null
  marketing: string | null
  returnDate: string | null
  statusLabel: string | null
  loanStatus?: string | null
  warehouseStatus?: { status?: string | null } | null
  returnStatus?: { status?: string | null } | null
  extendStatus?: any
  totalDenda?: {
    fineAmount?: number | null
    daysOverdue?: number | null
    updatedAt?: string | null
  } | null
}

export interface LoanFieldGridProps {
  loan: LoanDisplay
  textVariant: 'body1' | 'body2'
  detailHref?: string | null
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

export const LoanFieldGrid: React.FC<LoanFieldGridProps> = ({ loan, textVariant, detailHref }) => {
  const gridTemplateColumns = {
    xs: '1fr',
    md: 'repeat(auto-fit, minmax(140px, 1fr))'
  }

  const statusColorMap: Record<string, string> = {
    warning: 'warning.main',
    info: 'info.main',
    success: 'success.main'
  }

  const renderStatusValue = () => {
    const extendDisplay = getExtendStatusDisplay(loan)
    const rawLabel = extendDisplay?.label || loan.statusLabel
    const marketingAdjusted = formatLifecycleStatusLabel(rawLabel)
    const baseLabel = marketingAdjusted || rawLabel
    const formattedLabel = humanizeStatusLabel(baseLabel) || baseLabel || '-'
    if (!extendDisplay) {
      return <Typography variant={textVariant} sx={{ fontWeight: 600 }}>{formattedLabel || '-'}</Typography>
    }

    const textColor = statusColorMap[extendDisplay.color] || 'text.primary'
    const statusText = (
      <Typography
        component="span"
        variant={textVariant}
        sx={{ fontWeight: 700, color: textColor, display: 'block', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.2 }}
      >
        {formattedLabel}
      </Typography>
    )

    const badgeNode = extendDisplay.badgeCount ? (
      <Chip
        label={`${extendDisplay.badgeCount}x`}
        size="small"
        color="error"
        sx={{ fontWeight: 700, height: 24 }}
      />
    ) : null

    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title={extendDisplay.tooltip || formattedLabel} arrow>
          <Box component="span">{statusText}</Box>
        </Tooltip>
        {badgeNode ? (
          <Tooltip title={extendDisplay.tooltip || formattedLabel} arrow>
            <Box component="span">{badgeNode}</Box>
          </Tooltip>
        ) : null}
      </Stack>
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
          pr: { xs: 0, md: 1 }
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
