import React from 'react'
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material'

interface SearchControlsSectionProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  itemsPerPage: number
  onItemsPerPageChange: (value: number) => void
  onAddEntity: () => void
  canAdd?: boolean
}

export default function SearchControlsSection({
  searchTerm,
  onSearchChange,
  itemsPerPage,
  onItemsPerPageChange,
  onAddEntity,
  canAdd = true
}: SearchControlsSectionProps) {
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
              md: '3fr 1fr 1fr'
            },
            gap: 3,
            alignItems: 'center'
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search entities by value, label, or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'primary.main' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 3,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                  boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.1)',
                }
              }
            }}
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
          {canAdd ? (
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddEntity}
            sx={{
              height: 56,
              background: 'linear-gradient(135deg, #1a365d 0%, #00d4aa 100%)',
              borderRadius: 3,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(26, 54, 93, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0f1419 0%, #00b894 100%)',
                boxShadow: '0 6px 20px rgba(26, 54, 93, 0.4)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Add Entity
          </Button>
          ) : null}
        </Box>
      </Paper>
    </Fade>
  )
}