import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Fade,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Zoom,
  Paper,
  Stack,
  Avatar,
  Typography,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Chip,
  IconButton,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import companyTheme from '../themes/companyTheme'
import { useSession } from 'next-auth/react'
import { getCanonicalRole } from '../config/roleConfig'
import { canPerform, isAdmin } from '../utils/clientAuthorization'
import {
  LoadingSkeleton,
  HeroSection,
  SearchControlsSection,
  BulkActionsPanel,
  DataTableSection,
  CompanyModal,
} from '../components/company'

interface Company {
  value: string
  label: string
  userId?: string | null
  whId?: string | null
  description?: string | null
  isActive: boolean
  emails: {
    Head: string
    Marketing: string
    Finance: string
    Admin: string
    Warehouse: string
    Others: string
  }
}

const CompanyDashboard: React.FC = () => {
  const [companyList, setCompanyList] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [formData, setFormData] = useState({
    value: '',
    label: '',
    description: '',
    isActive: true,
    headEmail: '',
    marketingEmail: '',
    financeEmail: '',
    adminEmail: '',
    warehouseEmail: '',
    othersEmail: '',
    userId: null,
    whId: null
  })

      const [users, setUsers] = useState<any[]>([])
  const [warehouseUsers, setWarehouseUsers] = useState<any[]>([])

  const { data: session } = useSession()
  const currentUserId = (session as any)?.user?.id ?? null
  const currentUserRole = getCanonicalRole((session as any)?.user?.role)
  useEffect(() => {
    fetchCompany()
    fetchUsers()
  }, [])

  const fetchCompany = async () => {
    try {
      const response = await fetch('/api/company')
      if (response.ok) {
        const data = await response.json()
        setCompanyList(data)
      }
    } catch (error) {
      console.error('Failed to fetch company:', error)
      toast.error('Gagal memuat data perusahaan')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const r = await fetch('/api/users')
      if (r.ok) {
        const j = await r.json()
        // Keep only marketing users (role id 003 or role name includes 'marketing')
        const raw = j.users || []
        const marketing = raw.filter((u: any) => String(u.roleid) === '003' || String(u.role || '').toLowerCase().includes('market'))
        const warehouse = raw.filter((u: any) => String(u.roleid) === '002' || String(u.role || '').toLowerCase().includes('warehouse'))
        setUsers(marketing)
        setWarehouseUsers(warehouse)
      }
    } catch (err) {
      console.error('Failed to fetch users for owner select', err)
    }
  }

  const saveToAPI = async (action: string, data: any) => {
    try {
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      })
      if (response.ok) {
        fetchCompany() // Reload data
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
      description: '',
      isActive: true,
      headEmail: '',
      marketingEmail: '',
      financeEmail: '',
      adminEmail: '',
      warehouseEmail: '',
      othersEmail: '',
      userId: null,
      whId: null
    })
    setIsEditing(false)
    setEditingIndex(null)
    setShowModal(true)
  }

  const handleEdit = (index: number) => {
    const item = companyList[index]
    setFormData({
      value: item.value,
      label: item.label,
      userId: (item as any).userId ?? null,
      whId: (item as any).whId ?? null,
      description: (item as any).description ?? '',
      isActive: item.isActive,
      headEmail: item.emails.Head,
      marketingEmail: item.emails.Marketing,
      financeEmail: item.emails.Finance,
      adminEmail: item.emails.Admin,
      warehouseEmail: item.emails.Warehouse,
      othersEmail: item.emails.Others
    })
    setIsEditing(true)
    setEditingIndex(index)
    setShowModal(true)
  }

  const handleDelete = async (index: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus perusahaan ini?')) {
      const item = companyList[index]
      await saveToAPI('delete', { value: item.value })
      toast.success('Perusahaan berhasil dihapus')
    }
  }

  const handleToggleStatus = async (value: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const success = await saveToAPI('toggle-status', { value, isActive: newStatus })
    if (success) {
      toast.success(`Perusahaan ${newStatus ? 'diaktifkan' : 'dinonaktifkan'} berhasil`)
    }
  }

  const handleSelectCompany = (value: string, checked: boolean) => {
    const newSelected = new Set(selectedCompanies)
    if (checked) {
      newSelected.add(value)
    } else {
      newSelected.delete(value)
    }
    setSelectedCompanies(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(new Set(currentCompanies.map(company => company.value)))
    } else {
      setSelectedCompanies(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCompanies.size === 0) {
      toast.error('Pilih perusahaan yang ingin dihapus')
      return
    }
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedCompanies.size} perusahaan?`)) return

    const success = await saveToAPI('bulk-delete', { values: Array.from(selectedCompanies) })
    if (success) {
      setSelectedCompanies(new Set())
      toast.success(`${selectedCompanies.size} perusahaan berhasil dihapus`)
    }
  }

  const handleBulkStatusUpdate = async (newStatus: boolean) => {
    if (selectedCompanies.size === 0) {
      toast.error('Pilih perusahaan yang ingin diperbarui')
      return
    }

    const success = await saveToAPI('bulk-status-update', { values: Array.from(selectedCompanies), isActive: newStatus })
    if (success) {
      setSelectedCompanies(new Set())
      toast.success(`${selectedCompanies.size} perusahaan berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`)
    }
  }

  // Filter and paginate data
  const filteredCompanies = companyList.filter(company =>
    company.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company as any).description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.emails.Head.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.emails.Marketing.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.emails.Finance.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.emails.Admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.emails.Warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.emails.Others.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCompanies = filteredCompanies.slice(startIndex, endIndex)

  const handlePageChange = (event: unknown, newPage: number) => {
    setCurrentPage(newPage + 1)
    setSelectedCompanies(new Set()) // Clear selections when changing pages
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setItemsPerPage(parseInt(event.target.value, 10))
    setCurrentPage(1) // Reset to first page
    setSelectedCompanies(new Set()) // Clear selections
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page when searching
    setSelectedCompanies(new Set()) // Clear selections
  }

  const handleSave = async () => {
    if (!formData.value.trim() || !formData.label.trim()) {
      toast.error('Value dan Label wajib diisi')
      return
    }

    const newItem: Company = {
      value: formData.value,
      label: formData.label,
      // include owner id when present
      userId: (formData as any).userId ?? null,
      whId: (formData as any).whId ?? null,
      description: formData.description ?? '',
      isActive: formData.isActive,
      emails: {
        Head: formData.headEmail,
        Marketing: formData.marketingEmail,
        Finance: formData.financeEmail,
        Admin: formData.adminEmail,
        Warehouse: formData.warehouseEmail,
        Others: formData.othersEmail
      }
    }

    const action = editingIndex !== null ? 'update' : 'create'
    const data = editingIndex !== null
      ? { ...newItem, oldValue: companyList[editingIndex].value, description: formData.description, userId: (formData as any).userId ?? null, whId: (formData as any).whId ?? null }
      : newItem

    const success = await saveToAPI(action, data)

    if (success) {
      if (editingIndex !== null) {
        toast.success('Perusahaan berhasil diperbarui')
      } else {
        toast.success('Perusahaan berhasil ditambahkan')
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
  const totalCompanies = companyList.length
  const activeCompanies = companyList.filter(c => c.isActive).length
  const inactiveCompanies = companyList.filter(c => !c.isActive).length
  const companiesWithEmails = companyList.filter(c =>
    c.emails.Head || c.emails.Marketing || c.emails.Finance ||
    c.emails.Admin || c.emails.Warehouse || c.emails.Others
  ).length

  if (loading) {
    return (
      <ThemeProvider theme={companyTheme}>
        <CssBaseline />
        <LoadingSkeleton />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={companyTheme}>
      <CssBaseline />

      <HeroSection
        totalCompanies={totalCompanies}
        activeCompanies={activeCompanies}
        inactiveCompanies={inactiveCompanies}
        companiesWithEmails={companiesWithEmails}
      />

      <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', maxWidth: 1550, py: 6, px: { xs: 2, md: 4 }, mx: 'auto' }}>
        <Head>
          <title>Company Management Center - FormFlow</title>
        </Head>

        <SearchControlsSection
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          onAdd={handleAdd}
          canAdd={isAdmin(session)}
        />

        {/* Bulk Actions */}
        {selectedCompanies.size > 0 && (canPerform(session, 'delete') || isAdmin(session)) && (
          <BulkActionsPanel
            selectedCount={selectedCompanies.size}
            onBulkActivate={() => handleBulkStatusUpdate(true)}
            onBulkDeactivate={() => handleBulkStatusUpdate(false)}
            onBulkDelete={handleBulkDelete}
          />
        )}

        {/* Table */}
        <DataTableSection
          currentCompanies={currentCompanies}
          selectedCompanies={selectedCompanies}
          startIndex={(currentPage - 1) * itemsPerPage}
          searchTerm={searchTerm}
          filteredCompaniesLength={filteredCompanies.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onSelectCompany={handleSelectCompany}
          onSelectAll={handleSelectAll}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          canEdit={isAdmin(session)}
          canDelete={canPerform(session, 'delete')}
        />

        {/* Add/Edit Modal */}
        <CompanyModal
          open={showModal}
          onClose={handleCancel}
          isEditing={isEditing}
          formData={formData}
          users={users}
          warehouseUsers={warehouseUsers}
          onFormDataChange={(field, value) => setFormData({ ...formData, [field]: value })}
          onSave={handleSave}
        />
      </Box>
    </ThemeProvider>
  )
}

export default CompanyDashboard
