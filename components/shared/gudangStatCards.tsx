import React from 'react'
import {
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  ReportProblem as ReportProblemIcon,
  AccessTime as AccessTimeIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material'

export type StatCard = {
  key: string
  label: string
  caption: string
  value: number
  icon?: React.ReactNode
  accent?: string
  delay?: number
}

export default function buildGudangStatCards(stats: any): StatCard[] {
  return [
    {
      key: 'totalLoans',
      label: 'Total Pengajuan',
      caption: 'Seluruh permintaan',
      value: stats?.totalLoans ?? 0,
      icon: <AssessmentIcon style={{ fontSize: '1em' }} />,
      accent: '#fef08a',
      delay: 200,
    },
    {
      key: 'activeLoans',
      label: 'Peminjaman Aktif',
      caption: 'Sedang berlangsung',
      value: stats?.activeLoans ?? stats?.borrowed ?? 0,
      icon: <DashboardIcon style={{ fontSize: '1em' }} />,
      accent: '#c7d2fe',
      delay: 280,
    },
    {
      key: 'rejectedLoans',
      label: 'Peminjaman Ditolak',
      caption: 'Permintaan ditolak',
      value: stats?.totalRejected ?? stats?.rejected ?? 0,
      icon: <ReportProblemIcon style={{ fontSize: '1em' }} />,
      accent: '#fecaca',
      delay: 320,
    },
    {
      key: 'overdueLoans',
      label: 'Peminjaman Terlambat',
      caption: 'Berpotensi denda',
      value: stats?.overdueLoans ?? 0,
      icon: <AccessTimeIcon style={{ fontSize: '1em' }} />,
      accent: '#bae6fd',
      delay: 360,
    },
    {
      key: 'returnedComplete',
      label: 'Dikembalikan Lengkap',
      caption: 'Barang kembali utuh',
      value: stats?.returnedComplete ?? stats?.returned ?? 0,
      icon: <AssignmentTurnedInIcon style={{ fontSize: '1em' }} />,
      accent: '#bbf7d0',
      delay: 440,
    },
    {
      key: 'returnedIncomplete',
      label: 'Dikembalikan Tidak Lengkap',
      caption: 'Butuh verifikasi ulang',
      value: stats?.returnedIncomplete ?? 0,
      icon: <WarningAmberIcon style={{ fontSize: '1em' }} />,
      accent: '#fed7aa',
      delay: 440,
    },
    {
      key: 'returnedDamaged',
      label: 'Dikembalikan Rusak/Cacat',
      caption: 'Perlu tindakan khusus',
      value: stats?.returnedDamaged ?? 0,
      icon: <ReportProblemIcon style={{ fontSize: '1em' }} />,
      accent: '#fecaca',
      delay: 600,
    },
  ]
}
