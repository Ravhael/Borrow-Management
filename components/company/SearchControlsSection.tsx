import React from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Button,
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
  onSearchChange: (value: string) => void
  itemsPerPage: number
  onItemsPerPageChange: (value: number) => void
  onAdd: () => void
  // When false hide the Add button (e.g. marketing users not allowed to create)
  canAdd?: boolean
}

const SearchControlsSection: React.FC<SearchControlsSectionProps> = ({
  searchTerm,
  onSearchChange,
  itemsPerPage,
  onItemsPerPageChange,
  onAdd,
  canAdd = true,
}) => {
  return (
    <Box>
      <Fade in={true} timeout={800}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            mb: 3,
            maxWidth: '100%'
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
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
                placeholder="Search by company name, code, or email..."
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
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'white',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                    },
                  },
                }}
              />
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Items per page
                </InputLabel>
                <Select
                  value={itemsPerPage}
                  label="Items per page"
                  onChange={(e) => onItemsPerPageChange(Number((e.target as any).value))}
                  sx={{
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'white',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                    },
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
                onClick={onAdd}
                sx={{
                  height: 56,
                  background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0f1419 0%, #1a365d 100%)',
                  }
                }}
              >
                Add Company
              </Button>
              ) : null}
            </Box>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  )
}

export default SearchControlsSection