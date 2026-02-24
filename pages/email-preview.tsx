"use client";
import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Container,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
// Note: preview now prefers DB-only loan data — do not import or rely on local sample fixtures
import {
  generatePasswordResetEmail,
  generateAccountCreationEmail,
  generateAccountApprovalEmail,
  generateonSubmitMarketingEmail,
  generateonSubmitCompanyEmail,
  generateonSubmitEntitasEmail,
  generateonSubmitBorrowerEmail,
  generateApprovedBorrowerEmail,
  generateApprovedCompanyEmail,
  generateApprovedEntitasEmail,
  generateApprovedWarehouseEmail,
  generateExtendSubMarketingEmail,
  generateExtendSubCompanyEmail,
  generateExtendSubBorrowerEmail,
  generateExtendSubEntitasEmail,
  generateExtendAppBorrowerEmail,
  generateExtendAppCompanyEmail,
  generateExtendAppEntitasEmail,
  describeExtendDecision,
  formatExtendRequestTimestamp as formatExtendTimestamp,
  formatDurationRange,
  formatLateDays,
  generateReturnedSubpBorrowerEmail,
  generateReturnedSubCompanyEmail,
  generateReturnedSubEntitasEmail,
  generateReturnedSubWarehouseEmail,
  generateReturnedAppBorrowerEmail,
  generateReturnedAppCompanyEmail,
  generateReturnedAppEntitasEmail,
  buildCompletedInfo,
  generateCompletedBorrowerEmail,
  generateCompletedCompanyEmail,
  generateCompletedEntitasEmail,
  generateReminderBeforeBorrowerEmail,
  generateReminderBeforeCompanyEmail,
  generateReminderBeforeEntitasEmail,
  generateReminderAfterBorrowerEmail,
  generateReminderAfterCompanyEmail,
  generateReminderAfterEntitasEmail,
} from '../utils/emailTemplates'

// Warehouse-specific templates (not in the main barrel)
import {
  generateWarehouseBorrowerEmail,
  generateWarehouseCompanyEmail,
  generateWarehouseEntitasEmail,
} from '../utils/email-templates/warehouseApprovedTemplates'
import type { CompletedInfo, ReturnBlockInfo, ReturnRequestInfo } from '../utils/emailTemplates'
import OnSubmitTab from '../components/email-previews/OnSubmitTab'
import ExtendSubmitTab from '../components/email-previews/ExtendSubmitTab'
import ExtendApprovedTab from '../components/email-previews/ExtendApprovedTab'
import ApprovedTab from '../components/email-previews/ApprovedTab'
import ReturnRequestTab from '../components/email-previews/ReturnRequestTab'
import ReturnApprovedTab from '../components/email-previews/ReturnApprovedTab'
import CompletedTab from '../components/email-previews/CompletedTab'
import ReminderBeforeTab from '../components/email-previews/ReminderBeforeTab'
import ReminderAfterTab from '../components/email-previews/ReminderAfterTab'
import AccountTab from '../components/email-previews/AccountTab'
import RejectSubmitTab from '../components/email-previews/RejectSubmitTab'
import ExtendRejectTab from '../components/email-previews/ExtendRejectTab'
import ReturnRejectTab from '../components/email-previews/ReturnRejectTab'
import WhSubmitRejectTab from '../components/email-previews/WhSubmitRejectTab'
import { entitasOptions } from '../data/entitas'
import { getEffectiveReturnDate } from '../utils/loanHelpers'
import {
  generateSubmitRejectCompanyEmail as generateRejectCompanyEmail,
  generateSubmitRejectEntitasEmail as generateRejectEntitasEmail,
  generateSubmitRejectBorrowerEmail as generateRejectBorrowerEmail,
} from '../utils/email-templates/mktRejectTemplates'
import {
  generateExtendRejectCompanyEmail,
  generateExtendRejectEntitasEmail,
  generateExtendRejectBorrowerEmail,
} from '../utils/email-templates/mktExtendRejectTemplates'
import {
  generateReturnRejectCompanyEmail,
  generateReturnRejectEntitasEmail,
  generateReturnRejectBorrowerEmail,
} from '../utils/email-templates/whReturnedRejectTemplates'
import {
  generateSubmitWhRejectCompanyEmail,
  generateSubmitWhRejectEntitasEmail,
  generateSubmitWhRejectBorrowerEmail
} from '../utils/email-templates/whRejectTemplates'

// Small in-file helpers (keeps this page self-contained and avoids missing module errors)
function getEntitasName(entitasId: string) {
  const id = parseInt(entitasId);
  return entitasOptions.find(e => e.id === id)?.label || entitasId;
}
function mapBookingToFormData(raw: any) {
  // Treat empty strings as missing values so preview fallbacks are used
  const nonEmpty = (v: any) => typeof v === 'string' ? v.trim() !== '' : !!v

  return {
    form_number: nonEmpty(raw?.id) ? raw.id : '0',
    borrowerName: nonEmpty(raw?.borrowerName) ? raw.borrowerName : (nonEmpty(raw?.name) ? raw.name : 'Budi Santoso'),
    productDetailsText: nonEmpty(raw?.productDetailsText) ? raw.productDetailsText : (nonEmpty(raw?.items) ? raw.items : 'Laptop, Mouse'),
    company: Array.isArray(raw?.company) ? raw.company : (nonEmpty(raw?.company) ? [raw.company] : []),
    useDate: nonEmpty(raw?.useDate) ? raw.useDate : (nonEmpty(raw?.startDate) ? raw.startDate : '2025-11-02'),
    returnDate: nonEmpty(raw?.returnDate) ? raw.returnDate : (nonEmpty(raw?.endDate) ? raw.endDate : '2025-11-05'),
    nama_atasan: nonEmpty(raw?.nama_atasan) ? raw.nama_atasan : 'Atasan Langsung',
    notification: raw?.notification ?? {}
  }
}

// Marketing preview markup moved to shared utils to guarantee exact parity with server-side sends.
// The raw HTML is authored in the above shared utils functions and imported by this page.

// Admin/Approver informational preview markup is now shared in utils so preview-send is identical.

function generateStaffEditEmailBody(sample: any, link: string) {
  return `<div style="font-family: Arial, sans-serif; padding: 16px;"><h3>Edit request for ${sample.borrowerName}</h3><p><a href="${link}">Open request</a></p></div>`
}

// Account templates are provided by shared utils (imported above)

const NO_LOAN_HTML = '<div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB (use the app UI or seed the DB).</div>'

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

export default function EmailPreviewPage() {
  // start with no local sample — preview requires DB-backed loan data
  const [raw, setRaw] = useState<any | null>(null)
  const [noLoansFound, setNoLoansFound] = useState(false)
  const baseSample = raw ? mapBookingToFormData(raw as any) : null
  
  const [tabValue, setTabValue] = useState(0);
  const [isUpdate, setIsUpdate] = useState(false);
  const [forceNewSubmission, setForceNewSubmission] = useState(false);
  const [atasanName, setAtasanName] = useState(baseSample?.nama_atasan || 'Atasan Langsung');
  const [atasanEmail, setAtasanEmail] = useState(raw?.notification?.atasanLangsungEmail || 'atasan@example.com');
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // Keep a minimal 'sample' object for UI sections that reference it — avoid spreading when baseSample is null
  const sample = baseSample ? { ...baseSample, nama_atasan: atasanName } : { form_number: '0', borrowerName: '', productDetailsText: '', company: [], useDate: '', returnDate: '', nama_atasan: atasanName, notification: {} };

  const marketingApproval = useMemo(() => {
    if (!raw) return undefined
    const preferredCompany = Array.isArray(raw.company) && raw.company.length ? raw.company[0] : undefined
    return getApprovalInfo(raw, preferredCompany)
  }, [raw])

  const warehouseApproval = useMemo(() => {
    if (!raw) return undefined
    const warehouseKey = Object.keys((raw.approvals?.companies) || {}).find(k => /warehouse|gudang/i.test(String(k)))
    return getApprovalInfo(raw, warehouseKey)
  }, [raw])

  // Booking emails — use the exact same raw HTML generator used for preview-sends
  const userHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    // If 'Force New Submission' is enabled, don't pass approvalInfo so template renders the new submission variant
    const approvalInfo = forceNewSubmission ? undefined : marketingApproval
    return generateonSubmitMarketingEmail(raw, [], isUpdate, approvalInfo)
  }, [raw, isUpdate, forceNewSubmission, marketingApproval])
  // admin/approver email for marketing/admin preview (informational)
  const approverHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    // same logic: when forcing new submission, don't provide approval info
    const approvalInfo = forceNewSubmission ? undefined : marketingApproval
    return generateonSubmitCompanyEmail(raw, [], atasanName, isUpdate, approvalInfo)
  }, [raw, atasanName, isUpdate, forceNewSubmission, marketingApproval])
  const latestExtend = useMemo(() => {
    if (!raw?.extendStatus) return null
    const entries = Array.isArray(raw.extendStatus) ? raw.extendStatus : [raw.extendStatus]
    return entries.length ? entries[entries.length - 1] : null
  }, [raw])

  

  const extendSubmitMarketingHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateExtendSubMarketingEmail(raw, latestExtend, true)
  }, [raw, latestExtend])
  const extendSubmitAdminHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateExtendSubCompanyEmail(raw, latestExtend, true)
  }, [raw, latestExtend])
  const extendSubmitBorrowerHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateExtendSubBorrowerEmail(raw, latestExtend, true)
  }, [raw, latestExtend])
  const extendSubmitEntitasHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateExtendSubEntitasEmail(raw, latestExtend, true)
  }, [raw, latestExtend])
  const extendApprovedBorrowerHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateExtendAppBorrowerEmail(raw, latestExtend, true)
  }, [raw, latestExtend])
  const extendApprovedCompanyHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateExtendAppCompanyEmail(raw, latestExtend, true)
  }, [raw, latestExtend])
  const extendApprovedEntitasHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateExtendAppEntitasEmail(raw, latestExtend, true)
  }, [raw, latestExtend])
  // Approver / AM edit emails removed from Raw Email Peminjaman view by request

  // Account emails
  const passwordResetHtml = useMemo(() => generatePasswordResetEmail('John Doe', 'https://example.local/reset-password?token=abc123'), []);
  const accountCreationHtml = useMemo(() => generateAccountCreationEmail('John Doe', 'john.doe@company.com', 'NIK123456'), []);
  // accountVerificationHtml removed per request
  const accountApprovalHtml = useMemo(() => generateAccountApprovalEmail('John Doe', 'john.doe@company.com', 'NIK123456'), []);

  // Return emails now have their own preview tab so the team can verify Entitas/Marketing variants

  // approval info for the sample loan (used by approved previews)
  // For entitas-specific preview we only honor approvals recorded under approvals.entitas[entitasId]
  const entitasApproval = useMemo(() => {
    if (!raw) return undefined
    const entId = raw?.entitasId
    if (!entId) return undefined
    const entObj = (raw?.approvals && raw.approvals.entitas && raw.approvals.entitas[String(entId)]) || undefined
    if (!entObj) return undefined
    // If any entitas approval was recorded (approved or approvedAt), return its details
    if (entObj && (entObj.approved === true || entObj.approvedAt)) {
      return { approverName: entObj.approvedBy || entObj.approved_by || undefined, approvedAt: entObj.approvedAt || entObj.approved_at || undefined, note: entObj.note || undefined }
    }
    return undefined
  }, [raw])
  const latestReturnRequest = useMemo(() => pickLatestReturnRequest(raw), [raw])
  const hasReturnRequest = !!latestReturnRequest
  const returnRequestInfo = useMemo<ReturnRequestInfo | undefined>(() => buildReturnRequestInfo(raw, latestReturnRequest), [raw, latestReturnRequest])
  const returnApprovedInfo = useMemo<ReturnBlockInfo | undefined>(() => buildReturnApprovedInfo(raw), [raw])
  const hasReturnApproved = !!(
    raw?.returnStatus?.processedAt
    || raw?.returnStatus?.returnedAt
    || raw?.warehouseStatus?.returnedAt
  )
  const completedInfo = useMemo<CompletedInfo | undefined>(() => (raw ? buildCompletedInfo(raw) : undefined), [raw])
  const hasCompletedStatus = hasLoanCompleted(raw)

  // Entitas recipient list and preview HTML for the Marketing tab — prefer DB entitas mapping
  const entitasRecipients = useMemo(() => {
    if (!raw?.entitasId) return [] as { role: string; email: string }[]
    const ent = entitasOptions.find(e => String(e.id) === String(raw.entitasId) || String(e.value) === String(raw.entitasId))
    if (!ent) return [] as { role: string; email: string }[]
    const emailsObj = ent.emails || {}
    return Object.entries(emailsObj).map(([role, email]) => ({ role, email: String(email || '').trim() })).filter(e => e.email)
  }, [raw])

  const entitasHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    const info = !forceNewSubmission && entitasApproval ? { ...entitasApproval, showApprovalCta: false } : undefined
    const base = generateonSubmitEntitasEmail(raw, [], isUpdate, info as any)
    return String(base)
  }, [raw, isUpdate, entitasApproval, forceNewSubmission])

  const borrowerEmail = useMemo(() => {
    if (!raw) return ''
    const picked = raw?.borrowerEmail || raw?.borrower?.email || raw?.notification?.borrowerEmail || ''
    return String(picked || '').trim()
  }, [raw])

  const borrowerHtml = useMemo(() => raw ? generateonSubmitBorrowerEmail(raw, [], isUpdate) : NO_LOAN_HTML, [raw, isUpdate])

  const rejectCompanyHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateRejectCompanyEmail(raw, [], atasanName, isUpdate)
  }, [raw, atasanName, isUpdate])
  const rejectEntitasHtml = useMemo(() => (raw ? generateRejectEntitasEmail(raw, [], isUpdate) : NO_LOAN_HTML), [raw, isUpdate])
  const rejectBorrowerHtml = useMemo(() => (raw ? generateRejectBorrowerEmail(raw, [], isUpdate) : NO_LOAN_HTML), [raw, isUpdate])

  const extendRejectCompanyHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateExtendRejectCompanyEmail(raw, [], atasanName, isUpdate)
  }, [raw, atasanName, isUpdate])
  const extendRejectEntitasHtml = useMemo(() => (raw ? generateExtendRejectEntitasEmail(raw, [], isUpdate) : NO_LOAN_HTML), [raw, isUpdate])
  const extendRejectBorrowerHtml = useMemo(() => (raw ? generateExtendRejectBorrowerEmail(raw, [], isUpdate) : NO_LOAN_HTML), [raw, isUpdate])

  const returnRejectCompanyHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReturnRejectCompanyEmail(raw, [], atasanName, isUpdate)
  }, [raw, atasanName, isUpdate])
  const returnRejectEntitasHtml = useMemo(() => (raw ? generateReturnRejectEntitasEmail(raw, [], isUpdate) : NO_LOAN_HTML), [raw, isUpdate])
  const returnRejectBorrowerHtml = useMemo(() => (raw ? generateReturnRejectBorrowerEmail(raw, [], isUpdate) : NO_LOAN_HTML), [raw, isUpdate])
  const whSubmitRejectCompanyHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateSubmitWhRejectCompanyEmail(raw, [], atasanName, isUpdate)
  }, [raw, atasanName, isUpdate])
  const whSubmitRejectEntitasHtml = useMemo(() => (raw ? generateSubmitWhRejectEntitasEmail(raw, [], isUpdate) : NO_LOAN_HTML), [raw, isUpdate])
  const whSubmitRejectBorrowerHtml = useMemo(() => (raw ? generateSubmitWhRejectBorrowerEmail(raw, [], isUpdate) : NO_LOAN_HTML), [raw, isUpdate])

  const borrowerApprovedHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateApprovedBorrowerEmail(raw, [], isUpdate, marketingApproval)
  }, [raw, isUpdate, marketingApproval])

  const entitasApprovedHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateApprovedEntitasEmail(raw, [], isUpdate, marketingApproval)
  }, [raw, isUpdate, marketingApproval])

  const marketingApprovedHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateApprovedCompanyEmail(raw, [], isUpdate, marketingApproval || (atasanName ? { approverName: atasanName } : undefined))
  }, [raw, isUpdate, marketingApproval, atasanName])

  const warehouseApprovedHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateApprovedWarehouseEmail(raw, [], isUpdate, warehouseApproval)
  }, [raw, isUpdate, warehouseApproval])

  // All warehouse-specific variants (Borrower / Company / Entitas / With CTA)
  const warehouseBorrowerHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateWarehouseBorrowerEmail(raw, [], isUpdate, warehouseApproval)
  }, [raw, isUpdate, warehouseApproval])

  const warehouseCompanyHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateWarehouseCompanyEmail(raw, [], isUpdate, warehouseApproval)
  }, [raw, isUpdate, warehouseApproval])

  const warehouseEntitasHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateWarehouseEntitasEmail(raw, [], isUpdate, warehouseApproval)
  }, [raw, isUpdate, warehouseApproval])


  const extendDecisionSummary = useMemo(() => describeExtendDecision(latestExtend), [latestExtend])

  // Try to load a real DB loan for preview if available — keeps preview up-to-date with persisted data
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
          // Use DB loan when present so needDetails and other authoritative fields are used
          setRaw(first)
          setNoLoansFound(false)
        }
      } catch (err) {
        // network/database error — show helpful state
        if (!cancelled) setNoLoansFound(true)
      }
    }

    loadLatest()
    return () => { cancelled = true }
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const returnRequestBorrowerHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReturnedSubpBorrowerEmail(raw, [], returnRequestInfo, true)
  }, [raw, returnRequestInfo])

  const returnRequestCompanyHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReturnedSubCompanyEmail(raw, [], returnRequestInfo, true)
  }, [raw, returnRequestInfo])

  const returnRequestEntitasHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReturnedSubEntitasEmail(raw, [], returnRequestInfo, true)
  }, [raw, returnRequestInfo])

  const returnRequestWarehouseHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReturnedSubWarehouseEmail(raw, [], returnRequestInfo, true)
  }, [raw, returnRequestInfo])

  const returnApprovedBorrowerHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReturnedAppBorrowerEmail(raw, [], returnApprovedInfo, true)
  }, [raw, returnApprovedInfo])

  const returnApprovedCompanyHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReturnedAppCompanyEmail(raw, [], returnApprovedInfo, true)
  }, [raw, returnApprovedInfo])

  const returnApprovedEntitasHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReturnedAppEntitasEmail(raw, [], returnApprovedInfo, true)
  }, [raw, returnApprovedInfo])

  const completedBorrowerHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateCompletedBorrowerEmail(raw, [], completedInfo, true)
  }, [raw, completedInfo])

  const completedCompanyHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateCompletedCompanyEmail(raw, [], completedInfo, true)
  }, [raw, completedInfo])

  const completedEntitasHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateCompletedEntitasEmail(raw, [], completedInfo, true)
  }, [raw, completedInfo])

  const reminderBeforeBorrowerHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReminderBeforeBorrowerEmail(raw, [], undefined, isUpdate)
  }, [raw, isUpdate])

  const reminderBeforeCompanyHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReminderBeforeCompanyEmail(raw, [], undefined, isUpdate)
  }, [raw, isUpdate])

  const reminderBeforeEntitasHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReminderBeforeEntitasEmail(raw, [], undefined, isUpdate)
  }, [raw, isUpdate])

  const reminderAfterBorrowerHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReminderAfterBorrowerEmail(raw, [], undefined, isUpdate)
  }, [raw, isUpdate])

  const reminderAfterCompanyHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReminderAfterCompanyEmail(raw, [], undefined, isUpdate)
  }, [raw, isUpdate])

  const reminderAfterEntitasHtml = useMemo(() => {
    if (!raw) return NO_LOAN_HTML
    return generateReminderAfterEntitasEmail(raw, [], undefined, isUpdate)
  }, [raw, isUpdate])

  // Read approval info from loan.approvals.companies
  function getApprovalInfo(loan: any, preferCompany?: string) {
    const approvals = loan?.approvals?.companies || {}
    const keys = Object.keys(approvals || {})
    if (!keys || keys.length === 0) return { approverName: undefined, approvedAt: undefined, note: undefined }

    // If a preferred company exists and has an approval entry, use it.
    if (preferCompany && approvals[preferCompany]) {
      const a = approvals[preferCompany]
      return { approverName: a.approvedBy || a.approved_by || undefined, approvedAt: a.approvedAt || a.approved_at || undefined, note: a.note || undefined }
    }

    // Prefer entries where approved === true or have approvedAt set
    for (const k of keys) {
      const a = approvals[k]
      if (a && (a.approved === true || a.approvedAt)) {
        return { approverName: a.approvedBy || a.approved_by || undefined, approvedAt: a.approvedAt || a.approved_at || undefined, note: a.note || undefined }
      }
    }

    // Fallback to first entry
    const first = approvals[keys[0]]
    if (!first) return { approverName: undefined, approvedAt: undefined, note: undefined }
    return { approverName: first.approvedBy || first.approved_by || undefined, approvedAt: first.approvedAt || first.approved_at || undefined, note: first.note || undefined }
  }

  function pickLatestReturnRequest(loan: any) {
    if (!loan?.returnRequest || !Array.isArray(loan.returnRequest)) return undefined
    const entries = (loan.returnRequest as any[]).filter(Boolean)
    if (!entries.length) return undefined
    const preferred = entries
      .slice()
      .reverse()
      .find(entry => {
        const status = String(entry?.status || '').toLowerCase()
        if (!status) return false
        return ['returnrequested', 'submitted', 'pending', 'approved'].some(flag => status.includes(flag))
      })
    return preferred || entries[entries.length - 1]
  }

  function buildReturnRequestInfo(loan: any, entry?: any): ReturnRequestInfo | undefined {
    if (!loan) return undefined
    const plannedReturn = entry?.requestedReturnDate || getEffectiveReturnDate(loan) || loan?.returnDate || loan?.endDate || new Date().toISOString()
    const normalizeText = (value?: string | null) => {
      if (typeof value !== 'string') return undefined
      const trimmed = value.trim()
      return trimmed ? trimmed : undefined
    }
    const requestBy = normalizeText(entry?.requestedBy) || normalizeText(loan?.borrowerName) || normalizeText(loan?.borrower?.name) || 'Borrower'
    const requestAt = entry?.requestedAt || loan?.returnStatus?.processedAt || loan?.submittedAt || new Date().toISOString()
    const pickupPlan = normalizeText(entry?.pickupPlan)
    const handlingNote = normalizeText(entry?.processedNote) || normalizeText(loan?.returnStatus?.note) || normalizeText(loan?.warehouseStatus?.note)
    const borrowerNote = normalizeText(entry?.note)

    return {
      requestBy,
      requestAt,
      plannedReturnDate: plannedReturn,
      pickupPlan,
      handlingNote,
      note: borrowerNote,
    }
  }

  function buildReturnApprovedInfo(loan: any): ReturnBlockInfo | undefined {
    if (!loan) return undefined
    const plannedStart = loan?.useDate || loan?.startDate
    // prefer latest approved extend date when present
    const latestExtend = (() => {
      const entries = Array.isArray(loan?.extendStatus) ? loan.extendStatus : loan?.extendStatus ? [loan.extendStatus] : []
      const approved = entries
        .filter(entry => entry && typeof entry === 'object')
        .filter(entry => {
          const status = String(entry?.approveStatus || '').toLowerCase()
          return status.includes('setuj') || status.includes('approved')
        })
        .map(entry => entry?.requestedReturnDate || entry?.approveAt || entry?.requestAt)
        .filter(Boolean)
      return approved.length ? approved[approved.length - 1] : null
    })()
    const plannedEnd = latestExtend || loan?.returnDate || loan?.endDate
    const processedAt = loan?.returnStatus?.processedAt
      || loan?.returnStatus?.returnedAt
      || loan?.warehouseStatus?.returnedAt
      || getEffectiveReturnDate(loan)
      || latestExtend
      || plannedEnd
      || new Date().toISOString()

    return {
      processedBy: loan?.returnStatus?.processedBy || loan?.warehouseStatus?.processedBy || 'Warehouse Team',
      processedAt,
      note: loan?.returnStatus?.note || loan?.warehouseStatus?.note,
      plannedDurationLabel: formatDurationRange(plannedStart, plannedEnd),
      actualDurationLabel: formatDurationRange(plannedStart, processedAt),
      latenessLabel: formatLateDays(plannedEnd, processedAt),
    }
  }

  function hasLoanCompleted(loan: any): boolean {
    if (!loan) return false
    const status = typeof loan.status === 'string' ? loan.status.toLowerCase() : ''
    if (status.includes('completed') || status.includes('selesai')) return true
    return !!(
      loan?.returnStatus?.completedAt
      || loan?.returnStatus?.returnedAt
      || loan?.warehouseStatus?.returnedAt
      || loan?.returnStatus?.processedAt
      || loan?.warehouseStatus?.processedAt
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Email Preview
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Preview generated HTML for emails created by the system. Toggle <strong>isUpdate</strong> to see update-banner variants.
      </Typography>

        {/* Customize Sample Data removed - use generated sample data from DB snapshot or defaults */}

      {/* Tabs layout: vertical on md+ screens, horizontal on small screens */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="email preview tabs"
            orientation={isSmallScreen ? 'horizontal' : 'vertical'}
            variant={isSmallScreen ? 'scrollable' : 'standard'}
            sx={{
              borderRight: { md: 1 },
              borderBottom: { xs: 1, md: 'none' },
              borderColor: 'divider',
              minWidth: { md: 220 },
            }}
          >
          <Tab label="Raw Email Account" id="email-tab-0" aria-controls="email-tabpanel-0" />
          <Tab label="Raw Email On Submit" id="email-tab-1" aria-controls="email-tabpanel-1" />
          <Tab label="Raw Email Approved" id="email-tab-2" aria-controls="email-tabpanel-2" />
          <Tab label="Raw Email Warehouse Approved" id="email-tab-3" aria-controls="email-tabpanel-3" />
          <Tab label="Raw Email Extend Submit" id="email-tab-4" aria-controls="email-tabpanel-4" />
          <Tab label="Raw Email Extend Approved" id="email-tab-5" aria-controls="email-tabpanel-5" />
          <Tab label="Raw Email Return Request" id="email-tab-6" aria-controls="email-tabpanel-6" />
          <Tab label="Raw Email Return Approved" id="email-tab-7" aria-controls="email-tabpanel-7" />
          <Tab label="Raw Email Completed" id="email-tab-8" aria-controls="email-tabpanel-8" />
          <Tab label="Raw Email Reminder Before" id="email-tab-9" aria-controls="email-tabpanel-9" />
          <Tab label="Raw Email Reminder After" id="email-tab-10" aria-controls="email-tabpanel-10" />
          <Tab label="Raw Email Submit Reject" id="email-tab-11" aria-controls="email-tabpanel-11" />
          <Tab label="Raw Email Extend Reject" id="email-tab-12" aria-controls="email-tabpanel-12" />
          <Tab label="Raw Email Returned Reject" id="email-tab-13" aria-controls="email-tabpanel-13" />
          <Tab label="Raw Email WH Submit Rejected" id="email-tab-14" aria-controls="email-tabpanel-14" />
        </Tabs>
        {/* Right side: tab content stack */}
        <Box sx={{ flex: 1 }}>
          <TabPanel value={tabValue} index={0}>
            <AccountTab
              passwordResetHtml={passwordResetHtml}
              accountCreationHtml={accountCreationHtml}
              accountApprovalHtml={accountApprovalHtml}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <OnSubmitTab
              raw={raw}
              noLoansFound={noLoansFound}
              isUpdate={isUpdate}
              setIsUpdate={setIsUpdate}
              forceNewSubmission={forceNewSubmission}
              setForceNewSubmission={setForceNewSubmission}
              entitasRecipients={entitasRecipients}
              entitasHtml={entitasHtml}
              userHtml={userHtml}
              approverHtml={approverHtml}
              borrowerHtml={borrowerHtml}
              borrowerEmail={borrowerEmail}
              entitasApproval={entitasApproval}
              marketingApproval={marketingApproval}
              formatExtendTimestamp={formatExtendTimestamp}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <ApprovedTab
              entitasApprovedHtml={entitasApprovedHtml}
              marketingApprovedHtml={marketingApprovedHtml}
              borrowerApprovedHtml={borrowerApprovedHtml}
              warehouseApprovedHtml={warehouseApprovedHtml}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Warehouse Email (Borrower)</Typography>
                <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
                  <div dangerouslySetInnerHTML={{ __html: warehouseBorrowerHtml }} />
                </Box>
                <Box component="pre" sx={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontSize: '0.875rem', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>{warehouseBorrowerHtml}</Box>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Warehouse Email (Company)</Typography>
                <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
                  <div dangerouslySetInnerHTML={{ __html: warehouseCompanyHtml }} />
                </Box>
                <Box component="pre" sx={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontSize: '0.875rem', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>{warehouseCompanyHtml}</Box>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Warehouse Email (Entitas)</Typography>
                <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
                  <div dangerouslySetInnerHTML={{ __html: warehouseEntitasHtml }} />
                </Box>
                <Box component="pre" sx={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontSize: '0.875rem', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>{warehouseEntitasHtml}</Box>
              </Paper>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <ExtendSubmitTab
              raw={raw}
              extendSubmitMarketingHtml={extendSubmitMarketingHtml}
              extendSubmitAdminHtml={extendSubmitAdminHtml}
              extendSubmitBorrowerHtml={extendSubmitBorrowerHtml}
              extendSubmitEntitasHtml={extendSubmitEntitasHtml}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <ExtendApprovedTab
              summary={extendDecisionSummary}
              extendApprovedBorrowerHtml={extendApprovedBorrowerHtml}
              extendApprovedCompanyHtml={extendApprovedCompanyHtml}
              extendApprovedEntitasHtml={extendApprovedEntitasHtml}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={6}>
            <ReturnRequestTab
              hasLoan={!!raw}
              hasReturnRequest={hasReturnRequest}
              borrowerHtml={returnRequestBorrowerHtml}
              companyHtml={returnRequestCompanyHtml}
              entitasHtml={returnRequestEntitasHtml}
              warehouseHtml={returnRequestWarehouseHtml}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={7}>
            <ReturnApprovedTab
              hasLoan={!!raw}
              hasReturnStatus={hasReturnApproved}
              borrowerHtml={returnApprovedBorrowerHtml}
              companyHtml={returnApprovedCompanyHtml}
              entitasHtml={returnApprovedEntitasHtml}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={8}>
            <CompletedTab
              hasLoan={!!raw}
              hasCompletedStatus={hasCompletedStatus}
              borrowerHtml={completedBorrowerHtml}
              companyHtml={completedCompanyHtml}
              entitasHtml={completedEntitasHtml}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={9}>
            <ReminderBeforeTab
              hasLoan={!!raw}
              borrowerHtml={reminderBeforeBorrowerHtml}
              companyHtml={reminderBeforeCompanyHtml}
              entitasHtml={reminderBeforeEntitasHtml}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={10}>
            <ReminderAfterTab
              hasLoan={!!raw}
              borrowerHtml={reminderAfterBorrowerHtml}
              companyHtml={reminderAfterCompanyHtml}
              entitasHtml={reminderAfterEntitasHtml}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={11}>
            <RejectSubmitTab
              hasLoan={!!raw}
              companyHtml={rejectCompanyHtml}
              entitasHtml={rejectEntitasHtml}
              borrowerHtml={rejectBorrowerHtml}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={12}>
            <ExtendRejectTab
              hasLoan={!!raw}
              companyHtml={extendRejectCompanyHtml}
              entitasHtml={extendRejectEntitasHtml}
              borrowerHtml={extendRejectBorrowerHtml}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={13}>
            <ReturnRejectTab
              hasLoan={!!raw}
              companyHtml={returnRejectCompanyHtml}
              entitasHtml={returnRejectEntitasHtml}
              borrowerHtml={returnRejectBorrowerHtml}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={14}>
            <WhSubmitRejectTab
              hasLoan={!!raw}
              companyHtml={whSubmitRejectCompanyHtml}
              entitasHtml={whSubmitRejectEntitasHtml}
              borrowerHtml={whSubmitRejectBorrowerHtml}
            />
          </TabPanel>
        </Box>
        </Box>
      </Box>

      
    </Container>
  );
}

