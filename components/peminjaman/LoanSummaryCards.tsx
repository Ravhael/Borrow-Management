import React, { useMemo } from 'react'
import { LoanData } from '../../types/loan'
import { getNeedTypeLabel } from '../../utils/needTypes'
import { getEntitasName } from '../../utils/email-templates/shared'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material'
import { alpha } from '@mui/material/styles'

interface LoanSummaryCardsProps {
  loans: LoanData[]
}

const ACCENT_COLORS = ['#2563eb', '#0ea5e9', '#14b8a6', '#f97316', '#a855f7', '#f43f5e']

const getAccentColor = (index: number) => ACCENT_COLORS[index % ACCENT_COLORS.length]

const buildSortedTotals = (totals: Record<string, number>) =>
  Object.entries(totals)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

const LoanSummaryCards: React.FC<LoanSummaryCardsProps> = ({ loans }) => {
  const safeLoans = useMemo(() => (Array.isArray(loans) ? loans : []), [loans])

  const needTypeTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    safeLoans.forEach(loan => {
      const label = getNeedTypeLabel(loan.needType) || 'Lainnya'
      totals[label] = (totals[label] || 0) + 1
    })
    return buildSortedTotals(totals)
  }, [safeLoans])

  const companyTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    safeLoans.forEach(loan => {
      loan.company?.filter(Boolean).forEach(name => {
        const key = String(name)
        totals[key] = (totals[key] || 0) + 1
      })
    })
    return buildSortedTotals(totals)
  }, [safeLoans])

  const entityTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    safeLoans.forEach(loan => {
      const label = loan.entitasId ? getEntitasName(String(loan.entitasId)) : 'Tanpa Entitas'
      const normalized = label?.trim() ? label : 'Tanpa Entitas'
      totals[normalized] = (totals[normalized] || 0) + 1
    })
    return buildSortedTotals(totals)
  }, [safeLoans])

  const renderStatisticItem = (
    items: Array<[string, number]>,
    total: number
  ) => items.map(([label, count], index) => {
    const percentage = total ? Math.round((count / total) * 100) : 0
    const accent = getAccentColor(index)
    return (
      <Box
        key={`${label}-${index}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 1.5,
          borderRadius: 2,
          backgroundColor: '#f8fafc',
          border: '1px solid rgba(15,23,42,0.04)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: alpha(accent, 0.15),
              color: accent,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {count}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
              {label}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                mt: 0.5,
                height: 4,
                borderRadius: 999,
                backgroundColor: alpha(accent, 0.15),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: accent,
                  borderRadius: 999
                }
              }}
            />
          </Box>
        </Box>
        <Chip
          label={`${percentage}%`}
          size="small"
          sx={{
            fontWeight: 600,
            color: '#475569',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(15,23,42,0.08)'
          }}
        />
      </Box>
    )
  })

  const renderSection = (
    title: string,
    description: string,
    totals: Array<[string, number]>,
    sectionIndex: number
  ) => {
    const totalCount = totals.reduce((sum, [, value]) => sum + value, 0)
    const accent = getAccentColor(sectionIndex)

    return (
      <Box key={title}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid rgba(15,23,42,0.08)',
            boxShadow: '0 12px 30px rgba(15,23,42,0.08)'
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 3.5 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 1, fontWeight: 600, textTransform: 'uppercase' }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                  {description}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={`${totals.length} kategori`}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    color: accent,
                    backgroundColor: alpha(accent, 0.12)
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ borderColor: alpha(accent, 0.2) }} />

            {totals.length ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25,
                  maxHeight: totals.length > 4 ? 260 : 'none',
                  overflowY: totals.length > 4 ? 'auto' : 'visible',
                  pr: totals.length > 4 ? 1 : 0,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(accent, 0.35),
                    borderRadius: 999
                  }
                }}
              >
                {renderStatisticItem(totals, totalCount)}
              </Box>
            ) : (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  color: '#94a3b8',
                  borderRadius: 2,
                  backgroundColor: '#f8fafc'
                }}
              >
                Data belum tersedia.
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Chip
                label={`${totals.length} kategori`}
                size="small"
                sx={{
                  fontWeight: 600,
                  color: accent,
                  backgroundColor: alpha(accent, 0.12)
                }}
              />
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {totalCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                  Total permintaan
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))'
        }
      }}
    >
      {renderSection(
        'Need Type Breakdown',
        'Distribusi permintaan berdasarkan jenis kebutuhan.',
        needTypeTotals,
        0
      )}
      {renderSection(
        'Company Breakdown',
        'Performa peminjaman setiap perusahaan.',
        companyTotals,
        1
      )}
      {renderSection(
        'Entity Breakdown',
        'Semua peminjaman berdasarkan entitas.',
        entityTotals,
        2
      )}
    </Box>
  )
}

export default LoanSummaryCards
