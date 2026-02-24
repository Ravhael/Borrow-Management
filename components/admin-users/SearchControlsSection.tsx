import React from 'react'
import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Fade,
} from '@mui/material'
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material'

interface SearchControlsSectionProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  rowsPerPage: number
  onRowsPerPageChange: (value: number) => void
  onAddUser: () => void
  // filters
  roleFilter?: string
  onRoleFilterChange?: (value: string) => void
  roleOptions?: string[]
  directorateFilter?: string
  onDirectorateFilterChange?: (value: string) => void
  directorateOptions?: string[]
  entityFilter?: string
  onEntityFilterChange?: (value: string) => void
  entityOptions?: string[]
}

const SearchControlsSection: React.FC<SearchControlsSectionProps> = ({
  searchTerm,
  onSearchChange,
  rowsPerPage,
  onRowsPerPageChange,
  onAddUser,
  roleFilter = 'all',
  onRoleFilterChange,
  roleOptions = [],
  directorateFilter = 'all',
  onDirectorateFilterChange,
  directorateOptions = [],
  entityFilter = 'all',
  onEntityFilterChange,
  entityOptions = [],
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
              md: '3fr 1fr 1fr 1fr 1fr'
            },
            gap: 3,
            alignItems: 'center'
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by name, email, or username..."
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

          {/* Role filter */}
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => onRoleFilterChange && onRoleFilterChange((e.target as any).value)}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 3,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
              }}
            >
              <MenuItem value={'all'}>All roles</MenuItem>
              {roleOptions.map(r => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Directorate filter */}
          <FormControl fullWidth>
            <InputLabel>Directorate</InputLabel>
            <Select
              value={directorateFilter}
              label="Directorate"
              onChange={(e) => onDirectorateFilterChange && onDirectorateFilterChange((e.target as any).value)}
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 3 }}
            >
              <MenuItem value={'all'}>All directorates</MenuItem>
              {directorateOptions.map(d => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Entity filter */}
          <FormControl fullWidth>
            <InputLabel>Entity</InputLabel>
            <Select
              value={entityFilter}
              label="Entity"
              onChange={(e) => onEntityFilterChange && onEntityFilterChange((e.target as any).value)}
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 3 }}
            >
              <MenuItem value={'all'}>All entities</MenuItem>
              {entityOptions.map(en => (
                <MenuItem key={en} value={en}>{en}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Items per page</InputLabel>
            <Select
              value={rowsPerPage}
              label="Items per page"
              onChange={(e) => onRowsPerPageChange(Number((e.target as any).value))}
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
          <Button
            fullWidth
            variant="contained"
            startIcon={<PersonAddIcon />}
            size="large"
            sx={{ height: 56, borderRadius: 3 }}
            onClick={onAddUser}
          >
            Add User
          </Button>
        </Box>
      </Paper>
    </Fade>
  )
}

export default SearchControlsSection