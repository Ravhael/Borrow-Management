"use client";
import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  TextField,
  Grid,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
// Preview pages now require DB-backed loans — do not rely on local sample fixtures
import {
  generatePasswordResetEmail,
  generateAccountCreationEmail,
  generateAccountApprovalEmail,
  generateonSubmitMarketingEmail,
  generateonSubmitCompanyEmail,
  generateonSubmitEntitasEmail,
  generateonSubmitBorrowerEmail,
  generateCompletedBorrowerEmail,
  generateCompletedCompanyEmail,
  generateCompletedEntitasEmail,
  generateReturnedSubpBorrowerEmail,
  generateReturnedSubCompanyEmail,
  generateReturnedSubEntitasEmail,
  generateReturnedSubWarehouseEmail,
} from '../utils/emailTemplates'
import { getEffectiveReturnDate } from '../utils/loanHelpers'
import { entitasOptions } from '../data/entitas'

// Small in-file helpers (keeps this page self-contained and avoids missing module errors)
function getEntitasName(entitasId: string) {
  const id = parseInt(entitasId);
  return entitasOptions.find(e => e.id === id)?.label || entitasId;
}
function mapBookingToFormData(raw: any) {
  return {
    form_number: raw?.id ?? '0',
    borrowerName: raw?.borrowerName ?? raw?.name ?? 'Budi Santoso',
    productDetailsText: raw?.productDetailsText ?? raw?.items ?? 'Laptop, Mouse',
    company: raw?.company ?? [],
    useDate: raw?.useDate ?? raw?.startDate ?? '2025-11-02',
    returnDate: raw?.returnDate ?? raw?.endDate ?? '2025-11-05',
    nama_atasan: raw?.nama_atasan ?? 'Atasan Langsung',
    notification: raw?.notification ?? {}
  }
}

// (email body generators use shared templates in utils/emailTemplates)

// use shared template generators for all email preview variants
export default function EmailPreviewPage() {
  const [raw, setRaw] = useState<any | null>(null)
  const [noLoansFound, setNoLoansFound] = useState(false)
  const baseSample = useMemo(() => raw ? mapBookingToFormData(raw as any) : null, [raw])
  const [tabValue, setTabValue] = useState(0)
  const [isUpdate, setIsUpdate] = useState(false)
  const [forceNewSubmission, setForceNewSubmission] = useState(false)
  const [atasanName, setAtasanName] = useState(baseSample?.nama_atasan || 'Atasan Langsung')
  const [atasanEmail, setAtasanEmail] = useState(raw?.notification?.atasanLangsungEmail || 'atasan@example.com')
  const [manualTarget, setManualTarget] = useState('')
  const [manualTemplate, setManualTemplate] = useState<'password_reset'|'account_creation'|'account_approval'>('password_reset')
  const [manualTempPwd, setManualTempPwd] = useState('')
  const [manualStatus, setManualStatus] = useState<string | null>(null)

  // Keep a minimal 'sample' object for UI sections that reference it
  const sample = useMemo(() => (
    baseSample
      ? { ...baseSample, nama_atasan: atasanName }
      : { form_number: '0', borrowerName: '', productDetailsText: '', company: [], useDate: '', returnDate: '', nama_atasan: atasanName, notification: {} }
  ), [baseSample, atasanName]);

  // Booking emails
  const userHtml = useMemo(() => raw ? generateonSubmitMarketingEmail(raw, [], isUpdate) : `<div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB (use the app UI or seed the DB).</div>`, [raw, isUpdate]);
  // admin/approver email for marketing/admin preview
  const approverHtml = useMemo(() => raw ? generateonSubmitCompanyEmail(raw, [], atasanName, isUpdate) : `<div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB (use the app UI or seed the DB).</div>`, [raw, atasanName, isUpdate]);
  // Approver / AM edit emails removed from Raw Email Peminjaman view by request

  // Account emails
  const passwordResetHtml = useMemo(() => generatePasswordResetEmail('John Doe', 'https://example.local/reset-password?token=abc123'), []);
  const accountCreationHtml = useMemo(() => generateAccountCreationEmail('John Doe', 'john.doe@company.com', 'NIK123456'), []);
  // accountVerificationHtml removed per request
  const accountApprovalHtml = useMemo(() => generateAccountApprovalEmail('John Doe', 'john.doe@company.com', 'NIK123456'), []);

  // Completed booking emails
  const completedUserHtml = useMemo(() => raw ? generateCompletedBorrowerEmail(raw, [], undefined, true) : `<div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB (use the app UI or seed the DB).</div>`, [raw]);
  const completedApproverHtml = useMemo(() => raw ? generateCompletedCompanyEmail(raw, [], undefined, true) : `<div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB (use the app UI or seed the DB).</div>`, [raw]);
  const completedStaffAMHtml = useMemo(() => raw ? generateCompletedCompanyEmail(raw, [], undefined, true) : `<div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB (use the app UI or seed the DB).</div>`, [raw]);
  const completedManagerAMHtml = useMemo(() => raw ? generateCompletedCompanyEmail(raw, [], undefined, true) : `<div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB (use the app UI or seed the DB).</div>`, [raw]);

  // Return booking emails
  const returnStaffAMHtml = useMemo(() => raw ? generateReturnedSubCompanyEmail(raw, [], undefined, true) : `<div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB (use the app UI or seed the DB).</div>`, [raw]);
  const returnManagerAMHtml = useMemo(() => raw ? generateReturnedSubCompanyEmail(raw, [], undefined, true) : `<div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB (use the app UI or seed the DB).</div>`, [raw]);

  // Entitas approval & recipient mapping
  const entitasApproval = useMemo(() => {
    if (!raw) return undefined
    const entId = raw?.entitasId
    if (!entId) return undefined
    const entObj = (raw?.approvals && raw.approvals.entitas && raw.approvals.entitas[String(entId)]) || undefined
    if (!entObj) return undefined
    if (entObj && (entObj.approved === true || entObj.approvedAt)) {
      return { approverName: entObj.approvedBy || entObj.approved_by || undefined, approvedAt: entObj.approvedAt || entObj.approved_at || undefined, note: entObj.note || undefined }
    }
    return undefined
  }, [raw])

  const entitasRecipients = useMemo(() => {
    if (!raw?.entitasId) return [] as { role: string; email: string }[]
    const ent = entitasOptions.find(e => String(e.id) === String(raw.entitasId) || String(e.value) === String(raw.entitasId))
    if (!ent) return [] as { role: string; email: string }[]
    const emailsObj = ent.emails || {}
    return Object.entries(emailsObj).map(([role, email]) => ({ role, email: String(email || '').trim() })).filter(e => e.email)
  }, [raw])

  const entitasHtml = useMemo(() => raw ? generateonSubmitEntitasEmail(raw, [], isUpdate, entitasApproval) : `<div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB (use the app UI or seed the DB).</div>`, [raw, isUpdate, entitasApproval]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Try to load latest DB loan for preview-only (no fixtures)
  React.useEffect(() => {
    let cancelled = false
    async function loadLatest() {
      try {
        const res = await fetch('/api/debug/loans/latest')
        if (!res.ok) {
          if (!cancelled) setNoLoansFound(true)
          return
        }
        const json = await res.json()
        const first = Array.isArray(json?.data) && json.data.length ? json.data[0] : null
        if (!first && !cancelled) {
          setNoLoansFound(true)
          return
        }
        if (first && !cancelled) {
          setRaw(first)
          setNoLoansFound(false)
        }
      } catch (err) {
        if (!cancelled) setNoLoansFound(true)
      }
    }

    loadLatest()
    return () => { cancelled = true }
  }, [])

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Email Preview
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Preview generated HTML for emails created by the system. Toggle <strong>isUpdate</strong> to see update-banner variants.
      </Typography>

        {/* Customize Sample Data removed - use generated sample data from DB snapshot or defaults */}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="email preview tabs">
          <Tab label="Raw Email On Submit" id="email-tab-0" aria-controls="email-tabpanel-0" />
          <Tab label="Raw Email Account" id="email-tab-1" aria-controls="email-tabpanel-1" />
          <Tab label="Raw Email Completed" id="email-tab-2" aria-controls="email-tabpanel-2" />
          <Tab label="Raw Email Return" id="email-tab-3" aria-controls="email-tabpanel-3" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Marketing / Admin preview — show both variants without nested tabs */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Marketing Email</Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: userHtml }} />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw HTML</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{
                  whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontSize: '0.875rem', bgcolor: 'grey.100', p: 2, borderRadius: 1
                }}>
                  {userHtml}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Entitas Email</Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: entitasHtml }} />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw HTML</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{
                  whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontSize: '0.875rem', bgcolor: 'grey.100', p: 2, borderRadius: 1
                }}>
                  {entitasHtml}
                </Box>
              </AccordionDetails>
            </Accordion>

            {entitasRecipients && entitasRecipients.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Entitas Recipients</Typography>
                <Box sx={{ mt: 1 }}>
                  {entitasRecipients.map(r => (
                    <Box key={r.role} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.role}:</Typography>
                      <Typography variant="body2">{r.email}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Admin Email</Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: approverHtml }} />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw HTML</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{
                  whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontSize: '0.875rem', bgcolor: 'grey.100', p: 2, borderRadius: 1
                }}>
                  {approverHtml}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Box>
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isUpdate}
                onChange={(e) => setIsUpdate(e.target.checked)}
                color="primary"
              />
            }
            label="isUpdate (show update banner)"
          />
        </Box>

        {/* Marketing/Admin sub-section covers the UI here */}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Manual send UI for admins: send preview email to an address */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Manual send (admin)</Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
            <TextField sx={{ flex: 2 }} label="Recipient email or userId" value={manualTarget} onChange={(e) => setManualTarget(e.target.value)} />
            <TextField
              select
              sx={{ width: { xs: '100%', md: 240 } }}
              label="Template"
              value={manualTemplate}
              onChange={(e) => setManualTemplate(e.target.value as any)}
              SelectProps={{ native: true }}
            >
              <option value="password_reset">Password Reset</option>
              <option value="account_creation">Account Creation</option>
              <option value="account_approval">Account Approval</option>
            </TextField>
            <TextField sx={{ width: { xs: '100%', md: 200 } }} label="Temp password (optional)" value={manualTempPwd} onChange={(e) => setManualTempPwd(e.target.value)} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box component="button" disabled={!raw || noLoansFound} onClick={async () => {
                setManualStatus('Sending...')
                try {
                  if (!manualTarget) throw new Error('recipient required')
                  const body: any = { type: manualTemplate }
                  // if target looks like an email, send by email, otherwise treat as userId
                  if (manualTarget.includes('@')) body.email = manualTarget
                  else body.userId = manualTarget
                  if (manualTempPwd) body.temporaryPassword = manualTempPwd
                  const resp = await fetch('/api/admin/send-preview-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                  const json = await resp.json()
                  setManualStatus(json?.ok ? 'Sent' : `Failed: ${json?.message ?? 'unknown'}`)
                } catch (err: any) {
                  setManualStatus(`Error: ${err?.message ?? String(err)}`)
                }
              }} className="btn btn-primary" sx={{ padding: '8px 12px' }}>
                Send
              </Box>
              <Typography variant="body2">{manualStatus}</Typography>
              {(!raw || noLoansFound) && <Typography variant="body2" color="error" sx={{ ml: 2 }}>No persisted loan found — preview-send requires a loan in the database.</Typography>}
            </Box>
          </Box>
        </Paper>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Password Reset Email */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Password Reset Email
            </Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: passwordResetHtml }} />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw HTML</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1
                }}>
                  {passwordResetHtml}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>

          {/* Account Creation Email */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Creation Email
            </Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: accountCreationHtml }} />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw HTML</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1
                }}>
                  {accountCreationHtml}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>

          {/* Account Verification Email removed */}

          {/* Account Approval Email */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Approval Email
            </Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: accountApprovalHtml }} />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw HTML</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1
                }}>
                  {accountApprovalHtml}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Completed User Email */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Completed User Email
            </Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: completedUserHtml }} />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw HTML</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1
                }}>
                  {completedUserHtml}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>

          {/* Completed Approver Email */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Completed Approver Email
            </Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: completedApproverHtml }} />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw HTML</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1
                }}>
                  {completedApproverHtml}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>

          {/* Completed Staff AM Email */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Completed Staff AM Email
            </Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: completedStaffAMHtml }} />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw HTML</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1
                }}>
                  {completedStaffAMHtml}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>

          {/* Completed Manager AM Email */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Completed Manager AM Email
            </Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: completedManagerAMHtml }} />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw HTML</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1
                }}>
                  {completedManagerAMHtml}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Return Staff AM Email */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Return Staff AM Email
            </Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: returnStaffAMHtml }} />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw HTML</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1
                }}>
                  {returnStaffAMHtml}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>

          {/* Return Manager AM Email */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Return Manager AM Email
            </Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <div dangerouslySetInnerHTML={{ __html: returnManagerAMHtml }} />
            </Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Raw HTML</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1
                }}>
                  {returnManagerAMHtml}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Box>
      </TabPanel>
    </Container>
  );
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`email-tabpanel-${index}`}
      aria-labelledby={`email-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}