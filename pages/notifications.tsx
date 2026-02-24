import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  Container,
  Grid
} from '@mui/material'
import { Edit as EditIcon } from '@mui/icons-material'
import { notificationTheme } from '../themes/notificationTheme'
import { NotificationRule } from '../types/rules'
import { tokenizeForm } from '../utils/tokenizeForm'
import { loadRules, saveRules } from '../utils/notificationHelpers'
import {
  HeroHeader,
  MetricsDashboard,
  EmptyState,
  RulesManagement,
  TestPanel,
  FloatingActionButton
} from '../components/notifications'
import RuleEditor from '../components/RuleEditor'

import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => {
  // Page removed — redirect to home to avoid broken routes
  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  }
}

export default function NotificationsPage(){
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [editing, setEditing] = useState<NotificationRule | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [sampleJson, setSampleJson] = useState<string>('{}')
  const [testResult, setTestResult] = useState<string>('')

  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info' | 'warning'}>(
    {open: false, message: '', severity: 'info'}
  )

  useEffect(()=>{ setRules(loadRules()) }, [])

  function onSave(rule: NotificationRule){
    const list = [...rules]
    const idx = list.findIndex(r=>r.id===rule.id)
    if(idx>=0) list[idx] = rule
    else list.unshift(rule)
    setRules(list)
    saveRules(list)
    setShowEditor(false)
    setEditing(null)
    setSnackbar({open: true, message: 'Notification rule saved successfully!', severity: 'success'})
  }

  function onDelete(id:string){
    const list = rules.filter(r=>r.id!==id)
    setRules(list); saveRules(list)
    setSnackbar({open: true, message: 'Notification rule deleted!', severity: 'info'})
  }

  function onToggle(id:string){
    const list = rules.map(r=> r.id===id ? {...r, enabled: !r.enabled, updatedAt: new Date().toISOString()} : r)
    setRules(list); saveRules(list)
  }

  function onEdit(r: NotificationRule){ setEditing(r); setShowEditor(true) }

  function onTest(rule: NotificationRule){
    let data = {}
    try{ data = JSON.parse(sampleJson) } catch(e){
      setTestResult('Sample JSON tidak valid')
      setSnackbar({open: true, message: 'Invalid JSON format!', severity: 'error'})
      return
    }
    const tokens = tokenizeForm(data as any)
    // evaluate all conditions (AND)
    const ok = rule.conditions.every(cond=> {
      const left = (tokens[cond.field] || '').toString()
      const right = cond.value
      switch(cond.operator){
        case 'equals': return left === right
        case 'contains': return left.includes(right)
        case 'gt': return Number(left) > Number(right)
        case 'lt': return Number(left) < Number(right)
        case 'gte': return Number(left) >= Number(right)
        case 'lte': return Number(left) <= Number(right)
        default: return false
      }
    })
    const result = ok ? `Rule "${rule.name}" MATCHED` : `Rule "${rule.name}" did NOT match`
    setTestResult(result)
    setSnackbar({open: true, message: result, severity: ok ? 'success' : 'warning'})
  }

  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = ()=>{
      try{
        const parsed = JSON.parse(String(reader.result))
        if(Array.isArray(parsed)){
          setRules(parsed as any)
          saveRules(parsed as any)
          setSnackbar({open: true, message: 'Rules imported successfully!', severity: 'success'})
        } else {
          setSnackbar({open: true, message: 'Invalid file format!', severity: 'error'})
        }
      }catch(e){
        setSnackbar({open: true, message: 'Invalid JSON file!', severity: 'error'})
      }
    }
    reader.readAsText(file)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(rules, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = 'notification-rules.json'
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    setSnackbar({open: true, message: 'Rules exported successfully!', severity: 'success'})
  }

  const loadExampleData = () => {
    try{
      setSampleJson(JSON.stringify({
        borrowerName: 'Budi Santoso',
        entitasId: 'SGP',
        company: ['IVP Richard'],
        outDate: '2025-11-01',
        useDate: '2025-11-02',
        returnDate: '2025-11-05'
      }, null, 2))
      setSnackbar({open: true, message: 'Example data loaded!', severity: 'info'})
    }catch(e){}
  }

  return (
    <ThemeProvider theme={notificationTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Head>
          <title>FormFlow - Notification Management</title>
          <meta name="description" content="Professional notification rules management for automated email alerts" />
        </Head>

        {/* This page has been removed and now redirects to / */}

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ pb: 8 }}>
          {!rules || rules.length === 0 ? (
            <EmptyState
              onCreateRule={() => { setEditing(null); setShowEditor(true) }}
              onImportRules={handleImport}
            />
          ) : (
            <Grid container spacing={4}>
              {/* Rules Management */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <RulesManagement
                  rules={rules}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggle={onToggle}
                  onExport={handleExport}
                  onImport={handleImport}
                  onCreateRule={() => { setEditing(null); setShowEditor(true) }}
                />
              </Grid>

              {/* Test Panel */}
              <TestPanel
                sampleJson={sampleJson}
                testResult={testResult}
                onSampleJsonChange={setSampleJson}
                onTestRule={(rule) => onTest(rule)}
                onLoadExampleData={loadExampleData}
              />
            </Grid>
          )}
        </Container>

        {/* Rule Editor Dialog */}
        <Dialog
          open={showEditor}
          onClose={() => {setShowEditor(false); setEditing(null)}}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 32px 64px rgba(0, 0, 0, 0.15)'
            }
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              pb: 1,
              background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
              color: 'white'
            }}
          >
            <EditIcon />
            {editing ? 'Edit Notification Rule' : 'Create New Notification Rule'}
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <RuleEditor
              initial={editing || undefined}
              onSave={onSave}
              onCancel={() => {setShowEditor(false); setEditing(null)}}
            />
          </DialogContent>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({...snackbar, open: false})}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({...snackbar, open: false})}
            severity={snackbar.severity}
            sx={{
              width: '100%',
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Floating Action Button for mobile */}
        <FloatingActionButton
          hasRules={rules && rules.length > 0}
          onCreateRule={() => { setEditing(null); setShowEditor(true) }}
        />
      </Box>
    </ThemeProvider>
  )
}