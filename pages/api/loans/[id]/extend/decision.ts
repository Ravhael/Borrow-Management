import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../../lib/prisma'
import { emailService } from '../../../../../utils/emailService'
import { getToken } from 'next-auth/jwt'
import {
  generateExtendAppBorrowerEmail,
  generateExtendAppCompanyEmail,
  generateExtendAppEntitasEmail,
} from '../../../../../utils/email-templates/extendApprovedTemplates'
import { getCanonicalRole } from '../../../../../config/roleConfig'
import {
  generateExtendRejectBorrowerEmail,
  generateExtendRejectCompanyEmail,
  generateExtendRejectEntitasEmail
} from '../../../../../utils/email-templates/mktExtendRejectTemplates'
import { formatDateDisplay, formatDateRangeDisplay } from '../../../../../utils/email-templates/shared'
import { GoogleSheetsService } from '../../../../../utils/googleSheetsService'

const cloneDeep = <T>(value: T): T => {
  if (value === null || value === undefined) return value
  return JSON.parse(JSON.stringify(value))
}

const uniqueEmails = (emails: string[]): string[] => {
  const seen = new Set<string>()
  const result: string[] = []
  emails.forEach(email => {
    const normalized = String(email || '').trim()
    if (!normalized) return
    const key = normalized.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    result.push(normalized)
  })
  return result
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const { id } = req.query
  if (!id || Array.isArray(id)) return res.status(400).json({ message: 'Invalid loan id' })
  const backgroundTasks: Array<() => Promise<void>> = []

  const { action, note } = req.body || {}
  if (!action || !['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Missing or invalid action' })

  try {
    const formatProcessedAt = (value: string | Date) => {
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) return String(value)

      try {
        const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Jakarta',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).formatToParts(date)

        const get = (type: string) => parts.find(p => p.type === type)?.value || ''
        const dd = get('day')
        const mm = get('month')
        const yyyy = get('year')
        const HH = get('hour')
        const MM = get('minute')
        if (dd && mm && yyyy && HH && MM) return `${dd}-${mm}-${yyyy}/${HH}-${MM}`
      } catch (_) {
        // ignore
      }

      const pad2 = (n: number) => String(n).padStart(2, '0')
      return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}/${pad2(date.getHours())}-${pad2(date.getMinutes())}`
    }

    let tokenAny: any = null
    try { tokenAny = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) } catch (_) {}

    if (!tokenAny || !tokenAny.sub) return res.status(401).json({ message: 'Unauthorized' })

    // load loan and companies
    const loan = await prisma.loan.findUnique({
      where: { id: String(id) },
      select: {
        id: true,
        submittedAt: true,
        borrowerName: true,
        borrowerPhone: true,
        borrowerEmail: true,
        entitasId: true,
        company: true,
        userId: true,
        needType: true,
        needDetails: true,
        outDate: true,
        useDate: true,
        returnDate: true,
        productDetailsText: true,
        pickupMethod: true,
        note: true,
        extendStatus: true,
        extendNotification: true,
      },
    })
    if (!loan) return res.status(404).json({ message: 'Loan not found' })

    if (!loan.extendStatus) return res.status(400).json({ message: 'No extension request present for this loan' })

    // find the latest extend request entry
    const esAny: any = loan.extendStatus
    const latestIndex = Array.isArray(esAny) ? esAny.length - 1 : 0
    const latestEntry = Array.isArray(esAny) ? esAny[latestIndex] : esAny
    if (!latestEntry) return res.status(400).json({ message: 'No extension request present for this loan' })

    // ensure not already decided for the latest request
    const currentApprove = String(latestEntry?.approveStatus || '')
    if (currentApprove.trim() !== '') return res.status(400).json({ message: 'Extension request already processed' })

    // verify user and role
    const userId = String(tokenAny.sub)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, roleid: true, role: true } })
    if (!user) return res.status(401).json({ message: 'Unauthorized' })

    // determine role and check whether user is allowed to process extend decisions
    const roleKey = getCanonicalRole(user.role)

    // check company owner membership
    const companyValues = Array.isArray(loan.company) ? loan.company : (loan.company ? [loan.company] : [])
    const owners = companyValues.length
      ? await prisma.mktCompany.findMany({ where: { value: { in: companyValues }, userId: user.id }, select: { value: true, userId: true } })
      : []

    const isOwner = owners && owners.length > 0

    // allow if admin/superadmin, otherwise require marketing owner
    if (roleKey !== 'superadmin' && roleKey !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Anda tidak berhak memproses permintaan perpanjangan — hanya Marketing Owner atau Admin yang dapat melakukannya.' })
    }

    let extendNotificationPayload: any = cloneDeep((loan as any).extendNotification)
    let notificationsChanged = false

    const ensureApproveNotifications = (): any => {
      if (!extendNotificationPayload) {
        extendNotificationPayload = [{ extendApproveNotifications: { entitas: {}, companies: {}, borrower: null } }]
        notificationsChanged = true
      }
      if (Array.isArray(extendNotificationPayload)) {
        let entry = extendNotificationPayload.find((item: any) => item && typeof item === 'object' && 'extendApproveNotifications' in item)
        if (!entry) {
          entry = { extendApproveNotifications: { entitas: {}, companies: {}, borrower: null } }
          extendNotificationPayload.push(entry)
          notificationsChanged = true
        }
        if (!entry.extendApproveNotifications) {
          entry.extendApproveNotifications = { entitas: {}, companies: {}, borrower: null }
          notificationsChanged = true
        }
        return entry.extendApproveNotifications
      }
      if (extendNotificationPayload && typeof extendNotificationPayload === 'object') {
        if (!extendNotificationPayload.extendApproveNotifications) {
          extendNotificationPayload.extendApproveNotifications = { entitas: {}, companies: {}, borrower: null }
          notificationsChanged = true
        }
        return extendNotificationPayload.extendApproveNotifications
      }
      return null
    }

    // perform update
    const now = new Date().toISOString()
    const approver = user.name || user.id

    const updatedEntry = {
      ...latestEntry,
      approveAt: now,
      approveBy: approver,
      approveNote: typeof note === 'string' ? note : '',
      approveStatus: action === 'approve' ? 'Disetujui' : 'Ditolak'
    }

    const historyList = Array.isArray(latestEntry?.history) ? [...latestEntry.history] : []
    const currentStatus = action === 'approve' ? 'ExtendApproved' : 'ExtendRejected'
    const historyRecord = {
      id: `extend-${currentStatus}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: currentStatus,
      processedAt: now,
      processedBy: approver,
      note: updatedEntry.approveNote || ''
    }
    updatedEntry.status = currentStatus
    updatedEntry.history = [...historyList, historyRecord]

    let updatedExtendStatus: any
    if (Array.isArray(esAny)) {
      updatedExtendStatus = [...esAny.slice(0, latestIndex), updatedEntry]
    } else {
      updatedExtendStatus = updatedEntry
    }

    const companyRows = companyValues.length
      ? await prisma.mktCompany.findMany({ where: { value: { in: companyValues } }, select: { value: true, emails: true } })
      : []

    type CompanyRecipient = { company: string; role: string; email: string }
    const companyRecipients: CompanyRecipient[] = []
    companyRows.forEach(c => {
      const emails = (c.emails || {}) as Record<string, string>
      Object.entries(emails).forEach(([role, email]) => {
        const normalized = String(email || '').trim()
        if (!normalized) return
        companyRecipients.push({ company: c.value, role, email: normalized })
      })
    })

    const entitasRecipients: Array<{ role: string; email: string }> = []
    if (loan.entitasId) {
      const entitasRow = await prisma.entitas.findUnique({ where: { code: loan.entitasId }, select: { code: true, emails: true } })
      const entitasEmails = (entitasRow?.emails || {}) as Record<string, string>
      Object.entries(entitasEmails).forEach(([role, email]) => {
        const normalized = String(email || '').trim()
        if (!normalized) return
        entitasRecipients.push({ role, email: normalized })
      })
    }

    const borrowerEmail = String(loan.borrowerEmail || '').trim()

    const durationLabel = formatDateRangeDisplay(loan.useDate ?? loan.outDate, updatedEntry.requestedReturnDate || loan.returnDate)
    const extendInfo = {
      approveBy: updatedEntry.approveBy,
      approveAt: updatedEntry.approveAt,
      approveStatus: updatedEntry.approveStatus,
      approveNote: updatedEntry.approveNote,
      durationLabel: durationLabel === '-' ? undefined : durationLabel,
      requestedDuration: updatedEntry.requestedReturnDate ? formatDateDisplay(updatedEntry.requestedReturnDate) : undefined,
    }

    const loanForEmail = { ...loan, extendStatus: updatedExtendStatus }
    const statusLabel = action === 'approve' ? 'Disetujui' : 'Ditolak'
    const subject = `Status Permintaan Perpanjangan (${statusLabel}) - ${loan.borrowerName || loan.id}`

    const markCompanyNotifications = () => {
      if (!companyRecipients.length) return
      const bucket = ensureApproveNotifications()
      if (!bucket) return
      if (!bucket.companies) bucket.companies = {}
      const sentAt = new Date().toISOString()
      companyRecipients.forEach(({ company, role, email }) => {
        if (!company || !role) return
        if (!bucket.companies[company]) bucket.companies[company] = {}
        const entry = bucket.companies[company][role] || {}
        bucket.companies[company][role] = { ...entry, sent: true, sentAt, email }
      })
      notificationsChanged = true
    }

    const markEntitasNotifications = () => {
      if (!entitasRecipients.length || !loan.entitasId) return
      const bucket = ensureApproveNotifications()
      if (!bucket) return
      if (!bucket.entitas) bucket.entitas = {}
      if (!bucket.entitas[loan.entitasId]) bucket.entitas[loan.entitasId] = {}
      const sentAt = new Date().toISOString()
      entitasRecipients.forEach(({ role, email }) => {
        if (!role) return
        const entry = bucket.entitas[loan.entitasId][role] || {}
        bucket.entitas[loan.entitasId][role] = { ...entry, sent: true, sentAt, email }
      })
      notificationsChanged = true
    }

    const markBorrowerNotification = () => {
      if (!borrowerEmail) return
      const bucket = ensureApproveNotifications()
      if (!bucket) return
      const sentAt = new Date().toISOString()
      bucket.borrower = { ...(bucket.borrower || {}), sent: true, sentAt, email: borrowerEmail }
      notificationsChanged = true
    }

    const sendEmailGroup = async (recipients: string[], body: string): Promise<boolean> => {
      const deduped = uniqueEmails(recipients)
      if (!deduped.length) return false
      try {
        const result = await emailService.sendCustomEmail({ to: deduped, subject, body })
        if (!result?.ok) {
          console.error('extend decision email send failed', result?.error)
          return false
        }
        return true
      } catch (err) {
        console.error('extend decision email error', err)
        return false
      }
    }

    const companyEmails = companyRecipients.map(r => r.email)
    const entitasEmails = entitasRecipients.map(r => r.email)

    if (companyEmails.length || entitasEmails.length || borrowerEmail) {
      const rejectionInfo = action === 'reject' && updatedEntry.approveNote
        ? { note: updatedEntry.approveNote }
        : undefined
      backgroundTasks.push(async () => {
        if (action === 'approve') {
          if (companyEmails.length && await sendEmailGroup(companyEmails, generateExtendAppCompanyEmail(loanForEmail, extendInfo, true))) {
            markCompanyNotifications()
          }

          if (entitasEmails.length && await sendEmailGroup(entitasEmails, generateExtendAppEntitasEmail(loanForEmail, extendInfo, true))) {
            markEntitasNotifications()
          }

          if (borrowerEmail) {
            const sentBorrower = await sendEmailGroup([borrowerEmail], generateExtendAppBorrowerEmail(loanForEmail, extendInfo, true))
            if (sentBorrower) {
              markBorrowerNotification()
            }
          }
        } else {
          if (companyEmails.length && await sendEmailGroup(companyEmails, generateExtendRejectCompanyEmail(loanForEmail, [], 'Marketing', false, rejectionInfo))) {
            markCompanyNotifications()
          }

          if (entitasEmails.length && await sendEmailGroup(entitasEmails, generateExtendRejectEntitasEmail(loanForEmail, [], false, rejectionInfo))) {
            markEntitasNotifications()
          }

          if (borrowerEmail) {
            const sentBorrower = await sendEmailGroup([borrowerEmail], generateExtendRejectBorrowerEmail(loanForEmail, [], false, rejectionInfo))
            if (sentBorrower) {
              markBorrowerNotification()
            }
          }
        }

        if (notificationsChanged) {
          try {
            await prisma.loan.update({
              where: { id: loan.id },
              data: { extendNotification: extendNotificationPayload as any }
            })
          } catch (err) {
            console.warn('[extend-decision] failed to persist extend notifications', err)
          }
        }
      })
    }

    const updateData: any = { extendStatus: updatedExtendStatus as any }
    const updatedLoan = await prisma.loan.update({ where: { id: loan.id }, data: updateData })

    if (action === 'approve') {
      backgroundTasks.push(async () => {
        try {
          const approveStatus = String((updatedEntry as any)?.approveStatus ?? '').trim() || 'Disetujui'
          const approveBy = String((updatedEntry as any)?.approveBy ?? '').trim() || String(user.name || user.id)
          const approveAt = String((updatedEntry as any)?.approveAt ?? '').trim() || now
          const approveNote = String((updatedEntry as any)?.approveNote ?? '').trim()

          const extendStatusText = `Status : ${approveStatus}, Diproses oleh : ${approveBy}, Diproses pada : ${formatProcessedAt(approveAt)}, Catatan : ${approveNote}`
          console.log('[extend-decision] attempting Extend Status sheet update', { loanId: updatedLoan.id, needType: (updatedLoan as any).needType })
          const ok = await GoogleSheetsService.updateExtendStatusForLoan(updatedLoan, extendStatusText)
          console.log('[extend-decision] Extend Status sheet update result', { ok, loanId: updatedLoan.id })
        } catch (err) {
          console.error('[extend-decision] Extend Status sheet update failed (ignored)', err)
        }
      })
    }

    res.status(200).json({ ok: true, data: updatedLoan })

    if (backgroundTasks.length) {
      setImmediate(() => {
        backgroundTasks.forEach(async (task, idx) => {
          try {
            await task()
            console.debug(`[extend-decision][background:${loan.id}-${idx}] completed`)
          } catch (err) {
            console.error(`[extend-decision][background:${loan.id}-${idx}] failed`, err)
          }
        })
      })
    }

    return
  } catch (err: any) {
    console.error('extend decision failed', err)
    return res.status(500).json({ message: String(err?.message || 'internal error') })
  }
}
