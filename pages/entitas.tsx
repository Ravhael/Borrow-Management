import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Paper,
  Fade,
  Zoom,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  LinearProgress,
  Divider,
  Switch,
  FormControlLabel,
  Checkbox
} from '@mui/material'
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Email as EmailIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import {
  HeroSection,
  SearchControlsSection,
  BulkActionsPanel,
  DataTableSection,
  EntityModal
} from '../components/entitas'
import { useSession } from 'next-auth/react'
import { canPerform, isAdmin } from '../utils/clientAuthorization'
import { entitasTheme } from '../themes/entitasTheme'



interface Entitas {
  value: string
  label: string
  isActive: boolean
  directorateId?: number | null
  emails: {
    Head: string
    Finance: string
    Admin: string
    Others: string
  }
}

const EntitasDashboard: React.FC = () => {
  const [entitasList, setEntitasList] = useState<Entitas[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [selectedEntitas, setSelectedEntitas] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [formData, setFormData] = useState({
    value: '',
    label: '',
    isActive: true,
    directorateId: null as number | null,
    headEmail: '',
    financeEmail: '',
    adminEmail: '',
    othersEmail: ''
  })

  // client session for permission checks
  const { data: session } = useSession()

  useEffect(() => {
    fetchEntitas()
  }, [])

  const fetchEntitas = async () => {
    try {
      const response = await fetch('/api/entitas')
      if (response.ok) {
        const data = await response.json()
        setEntitasList(data)
      }
    } catch (error) {
      console.error('Failed to fetch entitas:', error)
      toast.error('Gagal memuat data entitas')
    } finally {
      setLoading(false)
    }
  }

  const saveToAPI = async (action: string, data: any) => {
    try {
      const response = await fetch('/api/entitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      })
      if (response.ok) {
        fetchEntitas() // Reload data
        return true
      } else {
        toast.error('Failed to save changes')
        return false
      }
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Failed to save changes')
      return false
    }
  }

  const handleAdd = () => {
    setFormData({
      value: '',
      label: '',
      isActive: true,
      directorateId: null,
      headEmail: '',
      financeEmail: '',
      adminEmail: '',
      othersEmail: ''
    })
    setIsEditing(false)
    setEditingIndex(null)
    setShowModal(true)
  }

  // edit by unique value so filtering/searching doesn't break the mapping
  const handleEdit = (value: string) => {
    const index = entitasList.findIndex(e => e.value === value)
    if (index === -1) return // not found — nothing to edit
    const item = entitasList[index]
    setFormData({
      value: item.value,
      label: item.label,
      isActive: item.isActive,
      directorateId: item.directorateId ?? null,
      headEmail: item.emails.Head,
      financeEmail: item.emails.Finance,
      adminEmail: item.emails.Admin,
      othersEmail: item.emails.Others
    })
    setIsEditing(true)
    setEditingIndex(index)
    setShowModal(true)
  }

  const handleDelete = async (value: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus entitas ini?')) {
      const index = entitasList.findIndex(e => e.value === value)
      if (index === -1) return
      const item = entitasList[index]
      const success = await saveToAPI('delete', { value: item.value })
      if (success) {
        toast.success('Entitas berhasil dihapus')
      } else {
        toast.error('Gagal menghapus entitas')
      }
    }
  }

  const handleSelectEntitas = (value: string, checked: boolean) => {
    const newSelected = new Set(selectedEntitas)
    if (checked) {
      newSelected.add(value)
    } else {
      newSelected.delete(value)
    }
    setSelectedEntitas(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntitas(new Set(currentEntitas.map(entitas => entitas.value)))
    } else {
      setSelectedEntitas(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (selectedEntitas.size === 0) {
      toast.error('Pilih entitas yang ingin dihapus')
      return
    }
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedEntitas.size} entitas?`)) return

    const values = Array.from(selectedEntitas)
    const count = values.length
    const success = await saveToAPI('bulk-delete', { values })
    if (success) {
      setSelectedEntitas(new Set())
      toast.success(`${count} entitas berhasil dihapus`)
    } else {
      toast.error('Gagal melakukan bulk delete')
    }
  }

  const handleBulkStatusUpdate = async (newStatus: boolean) => {
    if (selectedEntitas.size === 0) {
      toast.error('Pilih entitas yang ingin diperbarui')
      return
    }

    const values = Array.from(selectedEntitas)
    const count = values.length
    const success = await saveToAPI('bulk-status-update', { values, isActive: newStatus })
    if (success) {
      setSelectedEntitas(new Set())
      toast.success(`${count} entitas berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`)
    } else {
      toast.error('Gagal melakukan bulk update status')
    }
  }

  // Filter and paginate data
  const filteredEntitas = entitasList.filter(entitas =>
    entitas.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entitas.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entitas.emails.Head.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entitas.emails.Finance.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entitas.emails.Admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entitas.emails.Others.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredEntitas.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEntitas = filteredEntitas.slice(startIndex, endIndex)

  const handlePageChange = (event: unknown, newPage: number) => {
    setCurrentPage(newPage + 1)
    setSelectedEntitas(new Set()) // Clear selections when changing pages
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setItemsPerPage(parseInt(event.target.value, 10))
    setCurrentPage(1) // Reset to first page
    setSelectedEntitas(new Set()) // Clear selections
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page when searching
    setSelectedEntitas(new Set()) // Clear selections
  }

  const handleSave = async () => {
    if (!formData.value.trim() || !formData.label.trim()) {
      toast.error('Value dan Label wajib diisi')
      return
    }

    const newItem: Entitas = {
      value: formData.value,
      label: formData.label,
      isActive: formData.isActive,
      directorateId: formData.directorateId ?? null,
      emails: {
        Head: formData.headEmail,
        Finance: formData.financeEmail,
        Admin: formData.adminEmail,
        Others: formData.othersEmail
      }
    }

    const action = editingIndex !== null ? 'update' : 'create'
    const data = editingIndex !== null
      ? { ...newItem, oldValue: entitasList[editingIndex].value }
      : newItem

    const success = await saveToAPI(action, data)

    if (success) {
      if (editingIndex !== null) {
        toast.success('Entitas berhasil diperbarui')
      } else {
        toast.success('Entitas berhasil ditambahkan')
      }

      setShowModal(false)
      setIsEditing(false)
      setEditingIndex(null)
    }
  }

  const handleCancel = () => {
    setShowModal(false)
    setIsEditing(false)
    setEditingIndex(null)
  }

  // Calculate metrics
  const totalEntities = entitasList.length
  const activeEntities = entitasList.filter(e => e.isActive).length
  const inactiveEntities = entitasList.filter(e => !e.isActive).length
  const entitiesWithEmails = entitasList.filter(e =>
    e.emails.Head || e.emails.Finance || e.emails.Admin || e.emails.Others
  ).length

  if (loading) {
    return (
      <ThemeProvider theme={entitasTheme}>
        <CssBaseline />
        <Box sx={{ p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="text" sx={{ fontSize: '2.5rem', mb: 2 }} />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)'
                },
                gap: 3,
                mb: 4
              }}
            >
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent>
                    <Skeleton variant="text" sx={{ mb: 1 }} />
                    <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
                  </CardContent>
                </Card>
              ))}
            </Box>
            <Skeleton variant="rectangular" height={400} />
          </Box>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={entitasTheme}>
      <CssBaseline />
      <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>

      <HeroSection
        totalEntities={totalEntities}
        activeEntities={activeEntities}
        inactiveEntities={inactiveEntities}
        entitiesWithEmails={entitiesWithEmails}
      />

      <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', maxWidth: 1550, py: 6, px: { xs: 2, md: 4 }, mx: 'auto' }}>
        <Head>
          <title>Entity Management Center - FormFlow</title>
        </Head>

        <SearchControlsSection
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          onAddEntity={handleAdd}
          canAdd={isAdmin(session)}
        />

        {selectedEntitas.size > 0 && (canPerform(session, 'delete') || isAdmin(session)) && (
          <BulkActionsPanel
            selectedCount={selectedEntitas.size}
            onBulkActivate={() => handleBulkStatusUpdate(true)}
            onBulkDeactivate={() => handleBulkStatusUpdate(false)}
            onBulkDelete={handleBulkDelete}
          />
        )}

        <DataTableSection
          currentEntitas={currentEntitas}
          selectedEntitas={selectedEntitas}
          startIndex={startIndex}
          totalPages={totalPages}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          filteredEntitasLength={filteredEntitas.length}
          searchTerm={searchTerm}
          onSelectEntitas={handleSelectEntitas}
          onSelectAll={handleSelectAll}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={isAdmin(session)}
          canDelete={canPerform(session, 'delete')}
        />

        <EntityModal
          open={showModal}
          onClose={handleCancel}
          isEditing={isEditing}
          formData={formData}
          onFormDataChange={(field, value) => setFormData({ ...formData, [field]: value })}
          onSave={handleSave}
        />
      </Box>
      </Box>
    </ThemeProvider>
  )
}

export default EntitasDashboard