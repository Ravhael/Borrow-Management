// Email service utility for sending notifications
// In production, this would integrate with an email service like SendGrid, Mailgun, etc.

import { LOAN_LIFECYCLE } from '../types/loanStatus'
import nodemailer from 'nodemailer'
import { prisma } from '../lib/prisma'
import {
  generateAccountCreationEmail,
  generateAccountApprovalEmail,
  generatePasswordResetEmail,
  generateonSubmitMarketingEmail,
  generateonSubmitCompanyEmail,
  generateonSubmitEntitasEmail,
  generateonSubmitBorrowerEmail,
  generateApprovedBorrowerEmail,
  generateApprovedCompanyEmail,
  generateApprovedEntitasEmail,
  generateApprovedWarehouseEmail,
  generateReturnedAppBorrowerEmail,
  generateReturnedAppCompanyEmail,
  generateReturnedAppEntitasEmail,
  generateCompletedBorrowerEmail,
  generateCompletedCompanyEmail,
  generateCompletedEntitasEmail,
  formatDurationRange,
  formatLateDays,
  formatReturnTimestamp,
  makeReminderHtml,
  generateReminderBeforeBorrowerEmail,
  generateReminderBeforeCompanyEmail,
  generateReminderBeforeEntitasEmail,
  generateReminderAfterBorrowerEmail,
  generateReminderAfterCompanyEmail,
  generateReminderAfterEntitasEmail,
  computeDaysUntil,
  formatReminderCountdown,
  buildReminderSubject,
  stripApprovalCta as removeApprovalCta,
  ApprovalInfo
} from './emailTemplates'

// Warehouse-specific templates
import { generateWarehouseBorrowerEmail, generateWarehouseCompanyEmail, generateWarehouseEntitasEmail } from './email-templates/warehouseApprovedTemplates'
import type { ReturnBlockInfo, ReminderBeforeInfo, CompletedInfo } from './emailTemplates'
import {
  generateSubmitRejectBorrowerEmail,
  generateSubmitRejectCompanyEmail,
  generateSubmitRejectEntitasEmail
} from './email-templates/mktRejectTemplates'
import {
  generateSubmitWhRejectCompanyEmail,
  generateSubmitWhRejectEntitasEmail,
  generateSubmitWhRejectBorrowerEmail
} from './email-templates/whRejectTemplates'
import {
  generateReturnRejectCompanyEmail,
  generateReturnRejectEntitasEmail,
  generateReturnRejectBorrowerEmail
} from './email-templates/whReturnedRejectTemplates'

interface ReturnEmailMeta {
  processedBy?: string
  processedAt?: string
  note?: string
  condition?: string
  noFine?: boolean
}

interface ReminderEmailMeta {
  daysUntilReturn?: number
  manual?: boolean
  triggeredBy?: string
}
import fs from 'fs'
import path from 'path'
import { minifyHtmlForEmail } from './minifyHtml'
import { getAppBaseUrl } from './getAppBaseUrl'

export const buildPasswordResetUrl = (username?: string | null, temporaryPassword?: string | null): string => {
  const baseUrl = getAppBaseUrl()
  const configuredPath = (process.env.PASSWORD_RESET_PATH ?? '/reset-password').trim() || '/reset-password'
  const path = configuredPath.startsWith('/') ? configuredPath : `/${configuredPath}`
  const url = new URL(path, baseUrl)
  if (username) url.searchParams.set('user', username)
  if (temporaryPassword) url.searchParams.set('temp', temporaryPassword)
  return url.toString()
}

export interface EmailData {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  attachments?: any[]
}

export interface EmailRecipient {
  email: string
  role: string
  audience?: 'marketing' | 'company' | 'entitas' | 'borrower' | 'reminder' | 'warehouse' | 'custom'
}

class EmailService {
  // cached transporter to avoid recreating on every send if settings don't change
  private _cached: { key?: string; transporter?: any } = {}

  private async getSmtpConfig(): Promise<any | null> {
    // 1) Try DB
    try {
      const row = await prisma.mailSettings.findUnique({ where: { id: 1 } })
      if (row?.smtp && Object.keys(row.smtp).length) return row.smtp
    } catch (err) {
      // ignore DB issues — fallback to file or env
      console.debug('prisma mailSettings lookup failed:', err?.message ?? err)
    }

    // 2) Try dev config file
    try {
      const cfgPath = path.resolve(process.cwd(), 'data', 'mail-settings.json')
      if (fs.existsSync(cfgPath)) {
        const raw = fs.readFileSync(cfgPath, 'utf8')
        const json = JSON.parse(raw)
        if (json?.smtp && Object.keys(json.smtp).length) return json.smtp
      }
    } catch (err) {
      console.debug('Failed to read mail-settings.json', err?.message ?? err)
    }

    // 3) Try environment variables
    if (process.env.SMTP_HOST || process.env.SMTP_USERNAME) {
      return {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
        secure: process.env.SMTP_SECURE === 'true',
        username: process.env.SMTP_USERNAME,
        password: process.env.SMTP_PASSWORD,
        fromEmail: process.env.SMTP_FROM_EMAIL,
        fromName: process.env.SMTP_FROM_NAME
      }
    }

    return null
  }

  private async createTransporterIfNeeded(smtpCfg: any) {
    if (!smtpCfg?.host) return null

    const key = JSON.stringify({ host: smtpCfg.host, port: smtpCfg.port, username: smtpCfg.username })
    if (this._cached.key === key && this._cached.transporter) return this._cached.transporter

    try {
      const transporter = nodemailer.createTransport({
        host: smtpCfg.host,
        port: smtpCfg.port ?? 587,
        secure: !!smtpCfg.secure,
        auth: smtpCfg.username && smtpCfg.password ? { user: smtpCfg.username, pass: smtpCfg.password } : undefined,
        tls: smtpCfg.rejectUnauthorized === false ? { rejectUnauthorized: false } : undefined
      })

      // quick probe (verify) — don't fail hard if it errors here, just log and fallback
      try {
        // nodemailer verify may throw for bad credentials or connectivity
        await transporter.verify()
      } catch (verifyErr) {
        console.debug('SMTP transporter verification failed:', verifyErr?.message ?? verifyErr)
      }

      this._cached = { key, transporter }
      return transporter
    } catch (err) {
      console.error('Failed to create SMTP transporter', err?.message ?? err)
      return null
    }
  }

  public async sendEmail(emailData: EmailData): Promise<{ ok: boolean; error?: string | null }> {
    // Try to get SMTP configuration
    const smtpCfg = await this.getSmtpConfig()

    // Keep the preview body untouched — minify only the outgoing body we send to SMTP
    // Provide a dev toggle via EMAIL_MINIFY (set to 'false' to disable). Default: minify in production, skip in development
    const originalBody = emailData.body
    const envForce = typeof process !== 'undefined' ? String(process.env.EMAIL_MINIFY ?? '') : ''
    const shouldMinify = envForce !== '' ? envForce !== 'false' : (process.env.NODE_ENV === 'production')

    let minifiedBody: any = originalBody
    if (typeof originalBody === 'string' && shouldMinify) {
      minifiedBody = minifyHtmlForEmail(originalBody)
      if (typeof originalBody === 'string') {
        console.debug('emailService: minified HTML →', originalBody.length, '->', String(minifiedBody).length, 'bytes')
      }
    } else {
      if (typeof originalBody === 'string') {
        console.debug(`emailService: skipping HTML minification (EMAIL_MINIFY=${process.env.EMAIL_MINIFY ?? 'unset'}, NODE_ENV=${process.env.NODE_ENV})`)
      }
    }

    // If there's no SMTP config available, fallback to mocked console output
    if (!smtpCfg || !smtpCfg.host) {
      console.log('📧 (MOCK) SENDING EMAIL:')
      console.log('To:', emailData.to.join(', '))
      if (emailData.cc?.length) console.log('CC:', emailData.cc.join(', '))
      if (emailData.bcc?.length) console.log('BCC:', emailData.bcc.join(', '))
      console.log('Subject:', emailData.subject)
      console.log('Body (minified):', (typeof minifiedBody === 'string' ? minifiedBody.substring(0, 200) : minifiedBody) + (typeof minifiedBody === 'string' && minifiedBody.length > 200 ? '...' : ''))
      if (typeof originalBody === 'string') {
        console.log('Body size → original:', originalBody.length, 'bytes, minified:', String(minifiedBody).length, 'bytes')
      }
      console.log('---')
      await new Promise(resolve => setTimeout(resolve, 100))
      return { ok: true }
    }

    // Create or reuse transporter
    const transporter = await this.createTransporterIfNeeded(smtpCfg)
    if (!transporter) {
      console.warn('No transporter available; falling back to mock logs')
      return this.sendEmail({ ...emailData }) // recursion will hit mock case if no smtpCfg
    }

    const fromName = smtpCfg.fromName ?? smtpCfg.fromName ?? 'FormFlow'
    const fromEmail = smtpCfg.fromEmail ?? smtpCfg.fromEmail ?? smtpCfg.username

    const mailOptions: any = {
      from: `${fromName} <${fromEmail}>`,
      to: emailData.to.join(', '),
      subject: emailData.subject,
      // send the minified HTML so outgoing payloads are smaller
      html: minifiedBody
    }

    if (emailData.cc?.length) mailOptions.cc = emailData.cc.join(', ')
    if (emailData.bcc?.length) mailOptions.bcc = emailData.bcc.join(', ')
    if (emailData.attachments) mailOptions.attachments = emailData.attachments

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log(`📧 Email sent via SMTP (${smtpCfg.host}): messageId=${info.messageId}`)
      return { ok: true }
    } catch (err: any) {
      console.error('Failed to send email via SMTP:', err?.message ?? err)
      return { ok: false, error: err?.message ?? String(err) }
    }
  }

  async sendLoanSubmissionNotification(
    loanData: any,
    recipients: EmailRecipient[]
  ): Promise<boolean> {
    // If this call received a transient object (e.g. from a request body), prefer the persisted
    // DB copy when possible. That ensures the template uses the authoritative saved `needDetails`
    // and other server-side normalized fields.
    try {
      if (loanData?.id) {
        const dbLoan = await prisma.loan.findUnique({ where: { id: String(loanData.id) } })
        if (dbLoan) {
          // use the DB copy — but keep original as fallback
          loanData = { ...loanData, ...dbLoan }
        }
      }
    } catch (err) {
      // If anything goes wrong while fetching from DB, continue with provided loanData
      console.debug('sendLoanSubmissionNotification: failed to reload loan from DB', err?.message ?? err)
    }
    const subject = `Permintaan Peminjaman Baru - ${loanData.borrowerName || loanData.id || ''}`.trim()
    const marketingRecipients: string[] = []
    const entitasRecipients: string[] = []
    const borrowerRecipients: string[] = []
    const companyRecipients = new Map<string, string[]>()

    const inferAudience = (recipient: EmailRecipient): EmailRecipient['audience'] => {
      if (recipient.audience) return recipient.audience
      const roleKey = String(recipient.role || '').toLowerCase()
      if (roleKey === 'marketing') return 'marketing'
      if (roleKey === 'borrower') return 'borrower'
      if (roleKey === 'entitas') return 'entitas'
      return 'company'
    }

    const uniqueEmails = (list: string[]): string[] => {
      const normalized = list
        .map(email => String(email || '').trim())
        .filter(Boolean)
      return Array.from(new Set(normalized))
    }

    recipients.forEach(recipient => {
      const audience = inferAudience(recipient)
      const email = String(recipient.email || '').trim()
      if (!email) return
      if (audience === 'marketing') {
        marketingRecipients.push(email)
        return
      }
      if (audience === 'entitas') {
        entitasRecipients.push(email)
        return
      }
      if (audience === 'borrower') {
        borrowerRecipients.push(email)
        return
      }

      const roleLabel = recipient.role?.trim() || 'Company'
      const existing = companyRecipients.get(roleLabel) ?? []
      existing.push(email)
      companyRecipients.set(roleLabel, existing)
    })

    if (marketingRecipients.length) {
      const marketingBody = generateonSubmitMarketingEmail(loanData, [], false)
      const mRes = await this.sendEmail({ to: uniqueEmails(marketingRecipients), subject, body: marketingBody })
      if (!mRes?.ok) return false
    }

    for (const [roleLabel, emails] of companyRecipients.entries()) {
      if (!emails.length) continue
      const companyBody = generateonSubmitCompanyEmail(loanData, [], roleLabel || 'Admin', false)
      const cRes = await this.sendEmail({ to: uniqueEmails(emails), subject, body: companyBody })
      if (!cRes?.ok) return false
    }

    if (entitasRecipients.length) {
      const entitasBody = generateonSubmitEntitasEmail(loanData, [], false)
      const eRes = await this.sendEmail({ to: uniqueEmails(entitasRecipients), subject, body: entitasBody })
      if (!eRes?.ok) return false
    }

    if (borrowerRecipients.length) {
      const borrowerBody = generateonSubmitBorrowerEmail(loanData, [], false)
      const bRes = await this.sendEmail({ to: uniqueEmails(borrowerRecipients), subject, body: borrowerBody })
      if (!bRes?.ok) return false
    }

    return true
  }

  async sendLoanApprovalNotification(
    loanData: any,
    recipients: EmailRecipient[],
    approved: boolean,
    approvedBy: string,
    approvalInfoOverride?: ApprovalInfo
  ): Promise<boolean> {
    // prefer DB copy if available (keeps templates authoritative)
    try {
      if (loanData?.id) {
        const dbLoan = await prisma.loan.findUnique({ where: { id: String(loanData.id) } })
        if (dbLoan) loanData = { ...loanData, ...dbLoan }
      }
    } catch (err) {
      console.debug('sendLoanApprovalNotification: failed to reload loan from DB', err?.message ?? err)
    }

    const statusRaw = approved ? LOAN_LIFECYCLE.APPROVED : LOAN_LIFECYCLE.REJECTED
    const status = String(statusRaw).toUpperCase()
    const subject = `Peminjaman ${status} - ${loanData.borrowerName}`

    // Group recipients by role so we can craft role-specific bodies
    const byRole: Record<string, string[]> = {}
    recipients.forEach(r => {
      if (!byRole[r.role]) byRole[r.role] = []
      byRole[r.role].push(r.email)
    })

    // Find an approval entry — prefer company-keyed approvals if present
    const companyKey = Array.isArray(loanData.company) && loanData.company.length ? loanData.company[0] : undefined
    const approvals = (loanData.approvals?.companies) || {}

    function pickApproval(prefer?: string) {
      if (!approvals) return undefined
      if (prefer && approvals[prefer]) return approvals[prefer]
      // prefer entries with approved true or having approvedAt set
      const keys = Object.keys(approvals || {})
      for (const k of keys) {
        const a = approvals[k]
        if (a && (a.approved === true || a.approvedAt)) return a
      }
      return approvals[keys[0]]
    }

    const firstApproval = pickApproval(companyKey)
    const durationStr = `${loanData.useDate ?? '-'} → ${loanData.returnDate ?? '-'}`
    const computeDurationDays = (start?: string, end?: string) => {
      if (!start || !end) return undefined
      const s = new Date(start)
      const e = new Date(end)
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return undefined
      const msPerDay = 1000 * 60 * 60 * 24
      const diffDays = Math.round((e.getTime() - s.getTime()) / msPerDay) + 1
      return diffDays >= 0 ? diffDays : undefined
    }

    const approvalInfo = approvalInfoOverride ?? (firstApproval ? {
      approverName: firstApproval.approvedBy || firstApproval.approved_by || undefined,
      approvedAt: firstApproval.approvedAt || firstApproval.approved_at || undefined,
      note: firstApproval.note || undefined,
      duration: durationStr,
      durationDays: computeDurationDays(loanData.useDate, loanData.returnDate)
    } : undefined)

    // Decide per-role whether to show approval CTA (keep CTA for Warehouse; hide for Marketing/Entitas/company roles)
    const hideCtaRoles = ['marketing', 'entitas', 'head', 'admin', 'finance', 'others']

    // Send Marketing recipients the approved marketing-style body (hide CTA for Marketing)
    if (byRole['Marketing'] && byRole['Marketing'].length) {
      const info = { ...(approvalInfo || {}), showApprovalCta: false }
      const marketingBody = generateonSubmitMarketingEmail(loanData, [], false, info)
      const mRes = await this.sendEmail({ to: byRole['Marketing'], subject, body: marketingBody })
      if (!mRes?.ok) return false
    }

    // Admin recipients should receive the same marketing-style template to match head/finance/etc
    if (byRole['Admin'] && byRole['Admin'].length) {
      const info = approvalInfo ? { ...approvalInfo, showApprovalCta: false } : { showApprovalCta: false }
      const adminBody = generateonSubmitMarketingEmail(loanData, [], false, info)
      const aRes = await this.sendEmail({ to: byRole['Admin'], subject, body: adminBody })
      if (!aRes?.ok) return false
    }

    // Other roles: default to marketing-style template. Hide CTA except for Warehouse
    const others = Object.keys(byRole).filter(r => r !== 'Marketing' && r !== 'Admin')
    for (const role of others) {
      const roleKey = String(role || '').toLowerCase()
      const shouldHideCta = hideCtaRoles.includes(roleKey)
      const info = approvalInfo ? { ...approvalInfo, showApprovalCta: !shouldHideCta ? true : false } : undefined
      const body = generateonSubmitMarketingEmail(loanData, [], false, info)
      const res = await this.sendEmail({ to: byRole[role], subject, body })
      if (!res?.ok) return false
    }

    return true
  }

  /**
   * Send final 'Raw Email Approved' notifications to the three target groups when
   * a loan becomes fully approved by Marketing: Entitas, Marketing, Warehouse.
   * - entitasEmails / marketingEmails / warehouseEmails are arrays of destination addresses
   * - approvalInfoOverride lets callers pass precise approver/timestamp/duration details
   */
  async sendFinalApprovedNotifications(
    loanData: any,
    entitasEmails: string[],
    companyEmails: string[],
    warehouseEmails: string[],
    approvalInfoOverride?: any
  ): Promise<boolean> {
    // Prefer the DB copy unless an explicit approval override was provided for the current action
    try {
      if (loanData?.id && !approvalInfoOverride) {
        const dbLoan = await prisma.loan.findUnique({ where: { id: String(loanData.id) } })
        if (dbLoan) loanData = { ...loanData, ...dbLoan }
      }
    } catch (err) {
      console.debug('sendFinalApprovedNotifications: failed to reload loan from DB', err?.message ?? err)
    }

    const subject = `Peminjaman APPROVED - ${loanData.borrowerName}`

    // Build approvalInfo from override (if provided) or by picking an approval
    const approvalInfo = approvalInfoOverride ?? (loanData && loanData.approvals ? (() => {
      const approvals = loanData.approvals?.companies || {}
      const keys = Object.keys(approvals || {})
      for (const k of keys) {
        const a = approvals[k]
        if (a && (a.approved === true || a.approvedAt)) return {
          approverName: a.approvedBy || a.approved_by || undefined,
          approvedAt: a.approvedAt || a.approved_at || undefined,
          note: a.note || undefined,
          duration: `${loanData.useDate ?? '-'} → ${loanData.returnDate ?? '-'}`
        }
      }
      return undefined
    })() : undefined)

    // 1) Entitas recipients — dedicated approved template (no CTA needed)
    if (entitasEmails && entitasEmails.length) {
      const body = generateApprovedEntitasEmail(loanData, [], false, approvalInfo)
      const r = await this.sendEmail({ to: entitasEmails, subject, body })
      if (!r?.ok) return false
    }

    // 2) Company recipients (all MktCompany mappings except Warehouse)
    if (companyEmails && companyEmails.length) {
      const body = generateApprovedCompanyEmail(loanData, [], false, approvalInfo)
      const r = await this.sendEmail({ to: companyEmails, subject, body })
      if (!r?.ok) return false
    }

    // 3) Warehouse recipients — approved template with action CTA
    if (warehouseEmails && warehouseEmails.length) {
      const info = approvalInfo ? { ...approvalInfo, showApprovalCta: true } : { showApprovalCta: true }
      const body = generateApprovedWarehouseEmail(loanData, [], false, info)
      const r = await this.sendEmail({ to: warehouseEmails, subject, body })
      if (!r?.ok) return false
    }

    // 4) Borrower — send borrower-approved template if email exists
    try {
      const borrowerEmail = loanData?.borrowerEmail && String(loanData.borrowerEmail).trim()
      if (borrowerEmail) {
        const body = generateApprovedBorrowerEmail(loanData, [], false, approvalInfo)
        const br = await this.sendEmail({ to: [borrowerEmail], subject, body })
        if (!br?.ok) return false
      }
    } catch (err) {
      console.debug('sendFinalApprovedNotifications: borrower send failed', err?.message ?? err)
      return false
    }

    return true
  }

  /**
   * Send submit-reject notifications to company/marketing, entitas, and borrower recipients.
   * Returns the list of emails that were sent successfully so callers can update tracking metadata.
   */
  async sendLoanRejectionNotifications(
    loanData: any,
    entitasEmails: string[],
    companyEmails: string[],
    borrowerEmail?: string | null
  ): Promise<{ ok: boolean; sentEmails: string[] }> {
    try {
      if (loanData?.id) {
        const dbLoan = await prisma.loan.findUnique({ where: { id: String(loanData.id) } })
        if (dbLoan) loanData = { ...dbLoan, ...loanData }
      }
    } catch (err) {
      console.debug('sendLoanRejectionNotifications: failed to reload loan from DB', err?.message ?? err)
    }

    const subject = `Peminjaman DITOLAK - ${loanData.borrowerName || loanData.id || ''}`.trim()
    const sentEmails = new Set<string>()
    const normalizeEmail = (value?: string | null) => {
      if (!value) return ''
      return String(value).trim()
    }
    const uniqueEmails = (list: string[]) => {
      const normalized = list.map(normalizeEmail).filter(Boolean)
      return Array.from(new Set(normalized))
    }
    const sendGroup = async (emails: string[], body: string): Promise<boolean> => {
      if (!emails.length) return true
      const result = await this.sendEmail({ to: emails, subject, body })
      if (!result?.ok) return false
      emails.forEach(email => sentEmails.add(email))
      return true
    }

    const companyList = uniqueEmails(companyEmails)
    const companyBody = generateSubmitRejectCompanyEmail(loanData, [], 'Marketing', false)
    if (!(await sendGroup(companyList, companyBody))) {
      return { ok: false, sentEmails: Array.from(sentEmails) }
    }

    const entitasList = uniqueEmails(entitasEmails)
    const entitasBody = generateSubmitRejectEntitasEmail(loanData, [], false)
    if (!(await sendGroup(entitasList, entitasBody))) {
      return { ok: false, sentEmails: Array.from(sentEmails) }
    }

    const borrowerList = borrowerEmail ? uniqueEmails([borrowerEmail]) : []
    if (borrowerList.length) {
      const borrowerBody = generateSubmitRejectBorrowerEmail(loanData, [], false)
      if (!(await sendGroup(borrowerList, borrowerBody))) {
        return { ok: false, sentEmails: Array.from(sentEmails) }
      }
    }

    return { ok: true, sentEmails: Array.from(sentEmails) }
  }

  /**
   * Send warehouse processing / rejection notifications to company, entitas, and borrower mappings.
   * - status: 'processed' | 'rejected' modifies subject and message semantics
   */
  async sendWarehouseStatusNotifications(
    loanData: any,
    entitasEmails: string[],
    companyEmails: string[],
    status: 'processed' | 'rejected',
    processedInfo?: { processedBy?: string; processedAt?: string; note?: string }
  ): Promise<boolean> {
    try {
      if (loanData?.id) {
        const dbLoan = await prisma.loan.findUnique({ where: { id: String(loanData.id) } })
        if (dbLoan) loanData = { ...loanData, ...dbLoan }
      }
    } catch (err) {
      console.debug('sendWarehouseStatusNotifications: failed to reload loan from DB', err?.message ?? err)
    }

    const statusLabel = status === 'processed' ? 'PROCESSED' : 'REJECTED'
    const subject = `Peminjaman ${statusLabel} - ${loanData.borrowerName}`

    // Build approvalInfo-like payload to pass to warehouse templates
    const approvalInfo: ApprovalInfo = {
      approverName: processedInfo?.processedBy,
      approvedAt: processedInfo?.processedAt,
      note: processedInfo?.note,
    }

    // 1) Entitas recipients
    if (entitasEmails && entitasEmails.length) {
      const body = generateWarehouseEntitasEmail(loanData, [], false, approvalInfo)
      const r = await this.sendEmail({ to: entitasEmails, subject, body })
      if (!r?.ok) return false
    }

    // 2) Company recipients
    if (companyEmails && companyEmails.length) {
      const body = generateWarehouseCompanyEmail(loanData, [], false, approvalInfo)
      const r = await this.sendEmail({ to: companyEmails, subject, body })
      if (!r?.ok) return false
    }

    // 3) Borrower
    try {
      const borrowerEmail = loanData?.borrowerEmail && String(loanData.borrowerEmail).trim()
      if (borrowerEmail) {
        const body = generateWarehouseBorrowerEmail(loanData, [], false, approvalInfo)
        const br = await this.sendEmail({ to: [borrowerEmail], subject, body })
        if (!br?.ok) return false
      }
    } catch (err) {
      console.debug('sendWarehouseStatusNotifications: borrower send failed', err?.message ?? err)
      return false
    }

    return true
  }

  async sendWarehouseSubmitRejectNotifications(
    loanData: any,
    entitasEmails: string[],
    companyEmails: string[],
    processedInfo?: { processedBy?: string; processedAt?: string; note?: string }
  ): Promise<boolean> {
    return sendWarehouseRejectEmailsCore(this, loanData, entitasEmails, companyEmails, processedInfo)
  }



  async sendLoanReturnNotification(
    loanData: any,
    emails: string[],
    audienceLabel: string,
    returnInfo?: ReturnEmailMeta
  ): Promise<boolean> {
    if (!emails || !emails.length) return true

    try {
      if (loanData?.id) {
        const dbLoan = await prisma.loan.findUnique({ where: { id: String(loanData.id) } })
        if (dbLoan) loanData = { ...loanData, ...dbLoan }
      }
    } catch (err) {
      console.debug('sendLoanReturnNotification: failed to reload loan from DB', err?.message ?? err)
    }

    const plannedStart = loanData?.useDate || loanData?.startDate
    const plannedEnd = loanData?.returnDate || loanData?.endDate
    const actualReturn = returnInfo?.processedAt
      || loanData?.returnStatus?.processedAt
      || loanData?.returnStatus?.returnedAt
      || loanData?.warehouseStatus?.returnedAt
      || loanData?.returnDate
      || new Date().toISOString()
    const normalizedInfo: ReturnBlockInfo = {
      processedBy: returnInfo?.processedBy || loanData?.returnStatus?.processedBy || 'Warehouse Team',
      processedAt: actualReturn,
      note: returnInfo?.note || loanData?.returnStatus?.note,
      audienceLabel,
      plannedDurationLabel: formatDurationRange(plannedStart, plannedEnd),
      actualDurationLabel: formatDurationRange(plannedStart, actualReturn),
      latenessLabel: formatLateDays(plannedEnd, actualReturn)
    }

    const audience = (audienceLabel || '').trim().toLowerCase()
    let body: string

    if (audience.includes('entitas')) {
      body = generateReturnedAppEntitasEmail(loanData, [], normalizedInfo, true)
    } else if (audience.includes('borrower')) {
      body = generateReturnedAppBorrowerEmail(loanData, [], normalizedInfo, true)
    } else {
      body = generateReturnedAppCompanyEmail(loanData, [], normalizedInfo, true)
    }
    const subject = `Barang Dikembalikan - ${loanData.borrowerName || loanData.id || ''}`.trim()

    const result = await this.sendEmail({ to: emails, subject, body })
    return !!result?.ok
  }

  async sendReturnRejectionNotifications(
    loanData: any,
    entitasEmails: string[],
    companyEmails: string[],
    borrowerEmail?: string | null
  ): Promise<boolean> {
    return sendReturnRejectionEmailsCore(this, loanData, entitasEmails, companyEmails, borrowerEmail)
  }

  async sendLoanCompletedNotification(
    loanData: any,
    emails: string[],
    audienceLabel: string,
    completedInfo?: CompletedInfo
  ): Promise<boolean> {
    if (!emails || !emails.length) return true

    try {
      if (loanData?.id) {
        const dbLoan = await prisma.loan.findUnique({ where: { id: String(loanData.id) } })
        if (dbLoan) loanData = { ...loanData, ...dbLoan }
      }
    } catch (err) {
      console.debug('sendLoanCompletedNotification: failed to reload loan from DB', err?.message ?? err)
    }

    const normalizedAudience = (audienceLabel || '').trim().toLowerCase()
    let body: string

    const info: CompletedInfo | undefined = completedInfo ? {
      completedBy: completedInfo.completedBy,
      completedAt: completedInfo.completedAt,
      durationLabel: completedInfo.durationLabel,
      actualDurationLabel: completedInfo.actualDurationLabel,
      conditionNote: completedInfo.conditionNote,
      note: completedInfo.note
    } : undefined

    if (normalizedAudience.includes('entitas')) {
      body = generateCompletedEntitasEmail(loanData, [], info, true)
    } else if (normalizedAudience.includes('borrower')) {
      body = generateCompletedBorrowerEmail(loanData, [], info, true)
    } else {
      body = generateCompletedCompanyEmail(loanData, [], info, true)
    }

    const subject = `Peminjaman Selesai - ${loanData.borrowerName || loanData.id || ''}`.trim()
    const result = await this.sendEmail({ to: emails, subject, body })
    return !!result?.ok
  }

  async sendReminderNotification(
    loanData: any,
    recipients: EmailRecipient[],
    meta?: ReminderEmailMeta
  ): Promise<boolean> {
    const borrowerSet = new Set<string>()
    const entitasSet = new Set<string>()
    const companySet = new Set<string>()
    const fallbackSet = new Set<string>()

    const inferFromRole = (role?: string): 'borrower' | 'entitas' | 'company' | 'fallback' => {
      const key = String(role || '').toLowerCase()
      if (key.includes('borrower')) return 'borrower'
      if (key.includes('entitas')) return 'entitas'
      if (key.includes('company') || key.includes('marketing')) return 'company'
      return 'fallback'
    }

    const pickAudience = (recipient: EmailRecipient): 'borrower' | 'entitas' | 'company' | 'fallback' => {
      const explicit = String(recipient.audience || '').toLowerCase()
      if (explicit === 'borrower') return 'borrower'
      if (explicit === 'entitas') return 'entitas'
      if (explicit === 'company' || explicit === 'marketing') return 'company'
      if (explicit === 'reminder' || explicit === 'warehouse' || explicit === 'custom') return 'fallback'
      return inferFromRole(recipient.role)
    }

    recipients.forEach(recipient => {
      const email = String(recipient.email || '').trim()
      if (!email) return
      const bucket = pickAudience(recipient)
      if (bucket === 'borrower') {
        borrowerSet.add(email)
        return
      }
      if (bucket === 'entitas') {
        entitasSet.add(email)
        return
      }
      if (bucket === 'company') {
        companySet.add(email)
        return
      }
      fallbackSet.add(email)
    })

    const borrowerEmails = Array.from(borrowerSet)
    const entitasEmails = Array.from(entitasSet)
    const companyEmails = Array.from(companySet)
    const fallbackEmails = Array.from(fallbackSet)
    const totalRecipients = borrowerEmails.length + entitasEmails.length + companyEmails.length + fallbackEmails.length
    if (!totalRecipients) return true

    try {
      if (loanData?.id) {
        const dbLoan = await prisma.loan.findUnique({ where: { id: String(loanData.id) } })
        if (dbLoan) loanData = { ...loanData, ...dbLoan }
      }
    } catch (err) {
      console.debug('sendReminderNotification: failed to reload loan from DB', err?.message ?? err)
    }

    const plannedReturn = loanData?.returnDate || loanData?.endDate
    const borrowerName = loanData?.borrowerName || loanData?.name || loanData?.id || 'Peminjaman'
    const daysLeft = typeof meta?.daysUntilReturn === 'number' && !Number.isNaN(meta.daysUntilReturn)
      ? meta.daysUntilReturn
      : computeDaysUntil(plannedReturn)

    const isBeforeWindow = typeof daysLeft === 'number' && daysLeft >= 0
    const isAfterWindow = typeof daysLeft === 'number' && daysLeft < 0
    const autoScheduleLabel = meta?.manual
      ? 'Manual (Admin Trigger)'
      : isBeforeWindow
        ? 'H-7 • H-3 • H-1 • H'
        : 'H+1 • H+3 • H+7'
    const manualHint = meta?.manual
      ? `Dikirim manual oleh ${meta?.triggeredBy || 'Admin'} via halaman /admin/reminders`
      : isAfterWindow
        ? 'Pengingat otomatis setelah jatuh tempo. Segera koordinasikan pengembalian bersama borrower.'
        : 'Pengingat otomatis sebelum jatuh tempo. Bisa dikirim manual via halaman /admin/reminders'

    const baseInfo: ReminderBeforeInfo = {
      returnDateLabel: plannedReturn ? formatReturnTimestamp(plannedReturn) : '-',
      daysLeftLabel: formatReminderCountdown(daysLeft),
      autoScheduleLabel,
      manualHint,
      borrowerName
    }

    const subject = buildReminderSubject(borrowerName, daysLeft, meta?.manual)

    const sendTemplateGroup = async (
      emails: string[],
      label: string,
      generator: (loan: any, extra?: any[], overrides?: ReminderBeforeInfo, isUpdate?: boolean) => string
    ): Promise<boolean> => {
      if (!emails.length) return true
      const overrides: ReminderBeforeInfo = {
        ...baseInfo,
        audienceLabel: meta?.manual ? `${label} (Manual)` : label
      }
      const body = generator(loanData, [], overrides)
      const res = await this.sendEmail({ to: emails, subject, body })
      return !!res?.ok
    }

    const sendFallbackReminder = async (emails: string[], label: string): Promise<boolean> => {
      if (!emails.length) return true
      const info: ReminderBeforeInfo = { ...baseInfo, audienceLabel: label }
      let body = generateonSubmitMarketingEmail(loanData, [], false)
      body = removeApprovalCta(makeReminderHtml(body, info))
      const res = await this.sendEmail({ to: emails, subject, body })
      return !!res?.ok
    }

    if (isBeforeWindow) {
      if (!(await sendTemplateGroup(borrowerEmails, 'Borrower', generateReminderBeforeBorrowerEmail))) return false
      if (!(await sendTemplateGroup(entitasEmails, 'Entitas', generateReminderBeforeEntitasEmail))) return false
      if (!(await sendTemplateGroup(companyEmails, 'Company', generateReminderBeforeCompanyEmail))) return false
      const fallbackLabel = meta?.manual ? 'Reminder (Manual)' : 'Reminder'
      if (!(await sendFallbackReminder(fallbackEmails, fallbackLabel))) return false
      return true
    }

    if (isAfterWindow) {
      if (!(await sendTemplateGroup(borrowerEmails, 'Borrower', generateReminderAfterBorrowerEmail))) return false
      if (!(await sendTemplateGroup(entitasEmails, 'Entitas', generateReminderAfterEntitasEmail))) return false
      if (!(await sendTemplateGroup(companyEmails, 'Company', generateReminderAfterCompanyEmail))) return false
      const fallbackLabel = meta?.manual ? 'Reminder (Manual)' : 'Reminder Setelah Jatuh Tempo'
      if (!(await sendFallbackReminder(fallbackEmails, fallbackLabel))) return false
      return true
    }

    const combinedRecipients = Array.from(new Set([
      ...borrowerEmails,
      ...entitasEmails,
      ...companyEmails,
      ...fallbackEmails
    ]))
    if (!combinedRecipients.length) return true
    const combinedLabel = meta?.manual
      ? 'Reminder (Manual)'
      : isAfterWindow
        ? 'Reminder Setelah Jatuh Tempo'
        : 'Reminder'
    return sendFallbackReminder(combinedRecipients, combinedLabel)
  }

  // Public helper for sending arbitrary emails from server code
  async sendCustomEmail(emailData: EmailData): Promise<{ ok: boolean; error?: string | null }> {
    return this.sendEmail(emailData)
  }

  // Account related notifications
  async sendAccountCreationNotification(user: { name?: string; email?: string; username?: string }, options?: { temporaryPassword?: string }): Promise<boolean> {
    if (!user?.email) return false
    const subject = `Selamat datang ${user.name ?? user.username}`
    const body = generateAccountCreationEmail(user.name ?? user.username, user.email, user.username)
    const result = await this.sendEmail({ to: [user.email], subject, body })
    return !!result?.ok
  }

  async sendAccountApprovalNotification(user: { name?: string; email?: string; username?: string }) : Promise<boolean> {
    if (!user?.email) return false
    const subject = `Akun Anda telah disetujui`;
    const body = generateAccountApprovalEmail(user.name ?? user.username, user.email ?? '', user.username ?? '')
    const result = await this.sendEmail({ to: [user.email], subject, body })
    return !!result?.ok
  }

  async sendPasswordResetNotification(user: { name?: string; email?: string; username?: string }, temporaryPassword: string) : Promise<boolean> {
    if (!user?.email) return false
    const subject = 'Permintaan Reset Kata Sandi'
    const resetLink = buildPasswordResetUrl(user.username ?? '', temporaryPassword)
    const body = generatePasswordResetEmail(user.name ?? user.username ?? '', resetLink, temporaryPassword)

    const result = await this.sendEmail({ to: [user.email], subject, body })
    return !!result?.ok
  }
}

type WarehouseRejectProcessedInfo = { processedBy?: string; processedAt?: string; note?: string }

async function sendWarehouseRejectEmailsCore(
  service: EmailService,
  loanData: any,
  entitasEmails: string[],
  companyEmails: string[],
  processedInfo?: WarehouseRejectProcessedInfo
): Promise<boolean> {
  let normalizedLoan = loanData
  try {
    if (normalizedLoan?.id) {
      const dbLoan = await prisma.loan.findUnique({ where: { id: String(normalizedLoan.id) } })
      if (dbLoan) normalizedLoan = { ...dbLoan, ...normalizedLoan }
    }
  } catch (err) {
    console.debug('sendWarehouseSubmitRejectNotifications: failed to reload loan from DB', err?.message ?? err)
  }

  const mergedWarehouseStatus = {
    ...(normalizedLoan?.warehouseStatus || {}),
    ...(processedInfo?.processedBy ? { processedBy: processedInfo.processedBy } : {}),
    ...(processedInfo?.processedAt ? { processedAt: processedInfo.processedAt } : {}),
    ...(processedInfo?.note ? { note: processedInfo.note } : {})
  }
  normalizedLoan = { ...normalizedLoan, warehouseStatus: mergedWarehouseStatus }

  const subject = `Peminjaman DITOLAK GUDANG - ${normalizedLoan.borrowerName || normalizedLoan.id || ''}`.trim()
  const approvalInfo: ApprovalInfo | undefined = processedInfo?.note
    ? { note: processedInfo.note }
    : undefined

  const normalize = (value?: string | null) => (value ? String(value).trim() : '')
  const uniqueEmails = (list: string[]) => Array.from(new Set(list.map(normalize).filter(Boolean)))

  const companyList = uniqueEmails(companyEmails)
  if (companyList.length) {
    const body = generateSubmitWhRejectCompanyEmail(normalizedLoan, [], 'Warehouse', false, approvalInfo)
    const res = await service.sendEmail({ to: companyList, subject, body })
    if (!res?.ok) return false
  }

  const entitasList = uniqueEmails(entitasEmails)
  if (entitasList.length) {
    const body = generateSubmitWhRejectEntitasEmail(normalizedLoan, [], false, approvalInfo)
    const res = await service.sendEmail({ to: entitasList, subject, body })
    if (!res?.ok) return false
  }

  const borrowerEmail = normalize(normalizedLoan?.borrowerEmail)
  if (borrowerEmail) {
    const body = generateSubmitWhRejectBorrowerEmail(normalizedLoan, [], false, approvalInfo)
    const res = await service.sendEmail({ to: [borrowerEmail], subject, body })
    if (!res?.ok) return false
  }

  return true
}

export const emailService = new EmailService()

export async function sendWarehouseSubmitRejectEmails(
  loanData: any,
  entitasEmails: string[],
  companyEmails: string[],
  processedInfo?: WarehouseRejectProcessedInfo
): Promise<boolean> {
  return sendWarehouseRejectEmailsCore(emailService, loanData, entitasEmails, companyEmails, processedInfo)
}

async function sendReturnRejectionEmailsCore(
  service: EmailService,
  loanData: any,
  entitasEmails: string[],
  companyEmails: string[],
  borrowerEmail?: string | null
): Promise<boolean> {
  let normalizedLoan = loanData

  try {
    if (normalizedLoan?.id) {
      const dbLoan = await prisma.loan.findUnique({ where: { id: String(normalizedLoan.id) } })
      if (dbLoan) normalizedLoan = { ...dbLoan, ...normalizedLoan }
    }
  } catch (err) {
    console.debug('sendReturnRejectionNotifications: failed to reload loan from DB', err?.message ?? err)
  }

  const normalizeList = (list?: string[]): string[] => {
    if (!Array.isArray(list) || !list.length) return []
    return Array.from(new Set(list.map(email => String(email || '').trim()).filter(Boolean)))
  }

  const subjectName = normalizedLoan.borrowerName || normalizedLoan.id || ''
  const subject = subjectName
    ? `Pengembalian Barang Ditolak - ${subjectName}`
    : 'Pengembalian Barang Ditolak'

  const approverLabel = normalizedLoan?.returnStatus?.processedBy
    || normalizedLoan?.warehouseStatus?.processedBy
    || 'Warehouse Team'

  const companyList = normalizeList(companyEmails)
  if (companyList.length) {
    const body = generateReturnRejectCompanyEmail(normalizedLoan, [], approverLabel || 'Warehouse Team', true)
    const res = await service.sendEmail({ to: companyList, subject, body })
    if (!res?.ok) return false
  }

  const entitasList = normalizeList(entitasEmails)
  if (entitasList.length) {
    const body = generateReturnRejectEntitasEmail(normalizedLoan, [], true)
    const res = await service.sendEmail({ to: entitasList, subject, body })
    if (!res?.ok) return false
  }

  const borrower = String(borrowerEmail ?? normalizedLoan?.borrowerEmail ?? '').trim()
  if (borrower) {
    const body = generateReturnRejectBorrowerEmail(normalizedLoan, [], true)
    const res = await service.sendEmail({ to: [borrower], subject, body })
    if (!res?.ok) return false
  }

  return true
}

export async function sendReturnRejectionEmails(
  loanData: any,
  entitasEmails: string[],
  companyEmails: string[],
  borrowerEmail?: string | null
): Promise<boolean> {
  return sendReturnRejectionEmailsCore(emailService, loanData, entitasEmails, companyEmails, borrowerEmail)
}