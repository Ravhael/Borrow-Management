import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { getToken } from 'next-auth/jwt'
import { emailService } from '../../../../utils/emailService'
import {
  generateExtendSubBorrowerEmail,
  generateExtendSubCompanyEmail,
  generateExtendSubEntitasEmail,
  generateExtendSubMarketingEmail,
  type ExtendRequestInfo,
} from '../../../../utils/email-templates/extendRequestTemplates'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const { id } = req.query
  if (!id || Array.isArray(id)) return res.status(400).json({ message: 'Invalid loan id' })
  const backgroundTasks: Array<() => Promise<void>> = []

  try {
    // Attach authenticated user info if present
    let tokenAny: any = null
    try {
      tokenAny = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    } catch (_) { /* ignore */ }

    // Fetch loan and helpful parents
    const loan = await prisma.loan.findUnique({
      where: { id: String(id) },
      select: {
        id: true,
        borrowerName: true,
        borrowerPhone: true,
        borrowerEmail: true,
        entitasId: true,
        company: true,
        needType: true,
        needDetails: true,
        outDate: true,
        useDate: true,
        returnDate: true,
        productDetailsText: true,
        pickupMethod: true,
        note: true,
        submittedAt: true,
        warehouseStatus: true,
        returnStatus: true,
        extendStatus: true
      }
    })

    if (!loan) return res.status(404).json({ message: 'Loan not found' })

    const { note, requestedReturnDate } = req.body || {}

    // server-side validation: note and requestedReturnDate are required
    if (!note || String(note).trim() === '') {
      return res.status(400).json({ message: 'Catatan harus diisi' })
    }
    if (!requestedReturnDate || String(requestedReturnDate).trim() === '') {
      return res.status(400).json({ message: 'Tanggal kembali yang diusulkan harus diisi' })
    }

    // Determine the previous status (best-effort) — if extendStatus is an array, prefer the latest entry
    const currentExtendAny: any = loan.extendStatus
    const latestExtend = Array.isArray(currentExtendAny) && currentExtendAny.length > 0 ? currentExtendAny[currentExtendAny.length - 1] : currentExtendAny
    const prev = (latestExtend as any)?.status ?? (loan.warehouseStatus as any)?.status ?? (loan.returnStatus as any)?.status ?? null

    // Prefer the user's display name when available — do not use email as primary
    const requestedBy = tokenAny?.name || tokenAny?.sub || 'system'

    // Map into the new extendStatus shape
    const requestAt = new Date().toISOString()
    const historyEntry = {
      id: `extend-request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'ExtendRequested',
      processedAt: requestAt,
      processedBy: requestedBy,
      note: note || ''
    }

    const extendStatus = {
      note: note || '',
      requestedReturnDate: requestedReturnDate ?? '',
      requestAt,
      requestBy: requestedBy,
      reqStatus: 'Diminta Perpanjangan',
      photoResults: [],
      approveAt: '',
      approveBy: '',
      approveNote: '',
      approveStatus: '',
      previousStatus: prev || '',
      status: 'ExtendRequested',
      history: [historyEntry]
    }

    // Build extendNotification with new structured shape containing two parts:
    // 1) extendSubmitNotifications (companies -> Admin, Marketing only)
    // 2) extendApproveNotifications (entitas, companies, borrower)
    const extendSubmitNotifications: any = { companies: {} }
    const extendApproveNotifications: any = { entitas: {}, companies: {}, borrower: null }

    type CompanyRecipientEntry = { company: string; role: string; email: string }
    const marketingSubmitEntries: CompanyRecipientEntry[] = []
    const companySubmitEntries: CompanyRecipientEntry[] = []
    const marketingRecipients: string[] = []
    const companyRecipients: string[] = []
    const entitasRecipients: string[] = []
    const borrowerRecipient = typeof loan.borrowerEmail === 'string' ? loan.borrowerEmail.trim() : ''

    const dedupeEmails = (emails: string[]): string[] => {
      const seen = new Set<string>()
      const unique: string[] = []
      emails.forEach(email => {
        const normalized = String(email || '').trim()
        if (!normalized) return
        const key = normalized.toLowerCase()
        if (seen.has(key)) return
        seen.add(key)
        unique.push(normalized)
      })
      return unique
    }

    // entitas emails → goes to APPROVE notifications
    if (loan.entitasId) {
      const entitasRow = await prisma.entitas.findUnique({ where: { code: String(loan.entitasId) }, select: { emails: true } })
      const entitasEmails = entitasRow?.emails ?? {}
      if (entitasEmails && Object.keys(entitasEmails).length > 0) {
        extendApproveNotifications.entitas[loan.entitasId] = {}
        Object.entries(entitasEmails).forEach(([role, email]) => {
          const normalized = String(email ?? '').trim()
          extendApproveNotifications.entitas[loan.entitasId][role] = { sent: false, email: normalized, sentAt: '' }
          if (normalized) entitasRecipients.push(normalized)
        })
      }
    }

    // company emails
    if (loan.company && Array.isArray(loan.company) && loan.company.length > 0) {
      const companyRows = await prisma.mktCompany.findMany({ where: { value: { in: loan.company } }, select: { value: true, emails: true } })
      companyRows.forEach(c => {
        if (!c?.value || !c?.emails) return
        extendSubmitNotifications.companies[c.value] = {}

        // For approve notifications include all configured roles
        extendApproveNotifications.companies[c.value] = {}
        Object.entries(c.emails as any).forEach(([role, email]) => {
          const normalized = String(email ?? '').trim()
          extendApproveNotifications.companies[c.value][role] = { sent: false, email: normalized, sentAt: '' }
          extendSubmitNotifications.companies[c.value][role] = { sent: false, email: normalized, sentAt: '' }
          if (!normalized) return
          const entry: CompanyRecipientEntry = { company: c.value, role, email: normalized }
          const roleLower = String(role || '').toLowerCase()
          if (roleLower === 'marketing') {
            marketingRecipients.push(normalized)
            marketingSubmitEntries.push(entry)
            return
          }
          companyRecipients.push(normalized)
          companySubmitEntries.push(entry)
        })
      })
    }

    // borrower → part of APPROVE notifications
    if (borrowerRecipient) {
      extendApproveNotifications.borrower = { sent: false, email: borrowerRecipient, sentAt: '' }
    }

    // Append to existing extendStatus array if present — do not overwrite history
    let newExtendStatus: any
    if (Array.isArray(loan.extendStatus)) {
      newExtendStatus = [...loan.extendStatus, extendStatus]
    } else if (loan.extendStatus) {
      // existing shape (single object) — preserve as first entry
      newExtendStatus = [loan.extendStatus, extendStatus]
    } else {
      newExtendStatus = [extendStatus]
    }

    const loanForEmail = { ...loan, extendStatus: newExtendStatus }
    const extendInfoPayload: ExtendRequestInfo = {
      requestBy: extendStatus.requestBy,
      requestAt: extendStatus.requestAt,
      requestedReturnDate: extendStatus.requestedReturnDate,
      note: extendStatus.note,
    }
    const subjectToken = loan.borrowerName || loan.id || (loan as any).form_number || 'FormFlow'
    const subject = `Permintaan Perpanjangan - ${subjectToken}`.trim()

    const markSubmitSent = (entries: CompanyRecipientEntry[]) => {
      if (!entries.length) return
      const sentAt = new Date().toISOString()
      entries.forEach(entry => {
        const bucket = extendSubmitNotifications.companies?.[entry.company]?.[entry.role]
        if (bucket) {
          bucket.sent = true
          bucket.sentAt = sentAt
        }
      })
    }

    const emailJobs: Array<{ label: string; recipients: string[]; body: () => string; entries?: CompanyRecipientEntry[] }> = []
    if (marketingRecipients.length) {
      emailJobs.push({
        label: 'extend-marketing',
        recipients: marketingRecipients,
        body: () => generateExtendSubMarketingEmail(loanForEmail, extendInfoPayload, false),
        entries: marketingSubmitEntries
      })
    }
    if (companyRecipients.length) {
      emailJobs.push({
        label: 'extend-company',
        recipients: companyRecipients,
        body: () => generateExtendSubCompanyEmail(loanForEmail, extendInfoPayload, false),
        entries: companySubmitEntries
      })
    }
    if (entitasRecipients.length) {
      emailJobs.push({
        label: 'extend-entitas',
        recipients: entitasRecipients,
        body: () => generateExtendSubEntitasEmail(loanForEmail, extendInfoPayload, false)
      })
    }
    if (borrowerRecipient) {
      emailJobs.push({
        label: 'extend-borrower',
        recipients: [borrowerRecipient],
        body: () => generateExtendSubBorrowerEmail(loanForEmail, extendInfoPayload, false)
      })
    }

    // persist extendStatus (array) and new array shape extendNotification
    const updated = await prisma.loan.update({ where: { id: loan.id }, data: { extendStatus: newExtendStatus as any, extendNotification: [{ extendSubmitNotifications }, { extendApproveNotifications }] as any } })

    if (emailJobs.length) {
      backgroundTasks.push(async () => {
        const sendEmailsSafely = async (recipients: string[], body: string, entriesToMark?: CompanyRecipientEntry[]) => {
          const uniqueRecipients = dedupeEmails(recipients)
          if (!uniqueRecipients.length) return false
          try {
            const result = await emailService.sendCustomEmail({ to: uniqueRecipients, subject, body })
            if (result?.ok && entriesToMark?.length) {
              markSubmitSent(entriesToMark)
            }
            if (!result?.ok) {
              console.error('extend submit email send failed', result?.error)
              return false
            }
            return true
          } catch (error) {
            console.error('extend submit email error', error)
            return false
          }
        }

        let notificationsChanged = false
        for (const job of emailJobs) {
          const sent = await sendEmailsSafely(job.recipients, job.body(), job.entries)
          if (sent && job.entries?.length) {
            notificationsChanged = true
          }
        }

        if (notificationsChanged) {
          try {
            await prisma.loan.update({
              where: { id: loan.id },
              data: { extendNotification: [{ extendSubmitNotifications }, { extendApproveNotifications }] as any }
            })
          } catch (err) {
            console.warn('extend handler: failed to persist notification sent flags', err)
          }
        }
      })
    }

    res.status(200).json({ ok: true, data: updated })

    if (backgroundTasks.length) {
      setImmediate(() => {
        backgroundTasks.forEach(async (task, index) => {
          try {
            await task()
            console.debug(`[extend][background:${id}-${index}] completed`)
          } catch (err) {
            console.error(`[extend][background:${id}-${index}] failed`, err)
          }
        })
      })
    }
    return
  } catch (err: any) {
    console.error('extend handler failed', err)
    return res.status(500).json({ message: String(err?.message || 'internal error') })
  }
}
