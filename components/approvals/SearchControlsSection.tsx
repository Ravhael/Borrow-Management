import React from 'react'
import {
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Fade,
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'

interface SearchControlsSectionProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  itemsPerPage: number
  onItemsPerPageChange: (value: number) => void
}

const SearchControlsSection: React.FC<SearchControlsSectionProps> = ({
  searchTerm,
  onSearchChange,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  return (
    <Fade in={true} timeout={800}>
      <Paper
        sx={{
          mb: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          p: 4,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '3fr 1fr'
            },
            gap: 3,
            alignItems: 'center'
          }}
        >
          <TextField
            fullWidth
            placeholder="Cari berdasarkan nama peminjam, entitas, jenis kebutuhan..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'primary.main' }} />
                </InputAdornment>
              ),
            }}
            variant="outlined"
            size="medium"
          />
          <FormControl fullWidth>
            <InputLabel>Items per page</InputLabel>
            <Select
              value={itemsPerPage}
              label="Items per page"
              onChange={(e) => onItemsPerPageChange(Number((e.target as any).value))}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 3,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                }
              }}
            >
              <MenuItem value={10}>10 per page</MenuItem>
              <MenuItem value={20}>20 per page</MenuItem>
              <MenuItem value={30}>30 per page</MenuItem>
              <MenuItem value={40}>40 per page</MenuItem>
              <MenuItem value={50}>50 per page</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>
    </Fade>
  )
}

export default SearchControlsSection