import React from 'react'
import {
  Alert,
  Typography,
  Fade,
} from '@mui/material'

interface ResultsSummaryProps {
  startIndex: number
  itemsPerPage: number
  filteredLoansLength: number
  searchTerm: string
  filterNeedType: string
}

const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  startIndex,
  itemsPerPage,
  filteredLoansLength,
  searchTerm,
  filterNeedType,
}) => {
  return (
    <Fade in={true} timeout={1600}>
      <Alert
        severity="info"
        sx={{
          borderRadius: 2,
          bgcolor: 'rgba(26, 54, 93, 0.05)',
          border: '1px solid rgba(26, 54, 93, 0.2)',
          color: 'primary.main'
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredLoansLength)} dari {filteredLoansLength} peminjaman menunggu approval
          {searchTerm && ` untuk "${searchTerm}"`}
          {(filterNeedType !== 'all') && ' (dengan filter aktif)'}
        </Typography>
      </Alert>
    </Fade>
  )
}

export default ResultsSummary