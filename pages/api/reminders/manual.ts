import { NextApiRequest, NextApiResponse } from 'next'
// using prisma for data persistence (no file reads/writes)
import { emailService, EmailRecipient } from '../../../utils/emailService'
import { prisma } from '../../../lib/prisma'
import { getEffectiveReturnDate } from '../../../utils/loanHelpers'
import { WAREHOUSE_STATUS } from '../../../types/loanStatus'

// data/loans.json is now a seed fixture only — runtime uses the DB Loans table

interface LoanData {
  id: string
  submittedAt: string
  borrowerName: string
  entitasId: string
  borrowerPhone: string
  needType: string
  company: string[]
  outDate: string
  useDate: string
  returnDate: string
  productDetailsText: string
  pickupMethod: string
  note: string
  approvalAgreementFlag: boolean
  isDraft: boolean
  borrowerEmail?: string
  warehouseStatus?: {
    status: string
    processedAt?: string
    processedBy?: string
    rejectionReason?: string
    returnedAt?: string
    returnedBy?: string
  }
  submitNotifications?: {
    companies: Record<string, Record<string, {
      sent: boolean;
      sentAt?: string;
      email: string;
    }>>;
  };
  approvalNotifications?: {
    entitas: Record<string, Record<string, {
      sent: boolean;
      sentAt?: string;
      email: string;
    }>>;
    companies: Record<string, Record<string, {
      sent: boolean;
      sentAt?: string;
      email: string;
    }>>;
  };
  reminderStatus?: {
    [key: string]: {
      sent: boolean;
      sentAt?: string;
      type: string;
      notifications?: {
        borrower?: { sent: boolean; sentAt?: string; email: string };
        entitas?: Record<string, Record<string, { sent: boolean; sentAt?: string; email: string }>>;
        companies?: Record<string, Record<string, { sent: boolean; sentAt?: string; email: string }>>;
      };
    };
  };
  // retained for compatibility: detailed shape defined above
  userId?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { loanId, reminderType, requestedBy } = req.body

    if (!loanId || !reminderType) {
      return res.status(400).json({ message: 'loanId and reminderType are required' })
    }

    const beforeMap = { '7_days': 7, '3_days': 3, '1_day': 1, '0_days': 0 }
    let daysUntilReturn: number | undefined = beforeMap[reminderType as keyof typeof beforeMap]

    if (typeof daysUntilReturn === 'undefined') {
      const afterMatch = /^after_(\d+)_days$/.exec(String(reminderType))
      if (afterMatch) {
        const afterDays = Number(afterMatch[1])
        if (!Number.isNaN(afterDays) && afterDays >= 1 && afterDays <= 30) {
          daysUntilReturn = -afterDays
        }
      }
    }

    if (typeof daysUntilReturn === 'undefined') {
      return res.status(400).json({
        message: 'Invalid reminderType. Use one of 7_days, 3_days, 1_day, 0_days, or after_{1-30}_days'
      })
    }

    // Read the loan from DB
    const loan: any = await prisma.loan.findUnique({ where: { id: loanId } })
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' })
    }

    // Check if this loan is returned — don't allow sending reminders for already-returned loans.
    if ((loan as any).returnStatus?.status === WAREHOUSE_STATUS.RETURNED) {
      return res.status(400).json({ message: 'Loan has already been returned' })
    }
    // legacy rows may have returnedAt/returnedBy on warehouseStatus — treat those as returned as well
    if (loan.warehouseStatus?.status === WAREHOUSE_STATUS.RETURNED) {
      return res.status(400).json({ message: 'Loan has already been returned' })
    }
    if (loan.warehouseStatus?.returnedAt || loan.warehouseStatus?.returnedBy || (loan.warehouseStatus as any).returnProofFiles?.length > 0) {
      return res.status(400).json({ message: 'Loan has already been returned' })
    }
    if (loan.loanStatus && String(loan.loanStatus).toLowerCase().includes('return')) {
      return res.status(400).json({ message: 'Loan has already been returned' })
    }

    // Check if loan is currently borrowed
    if (loan.warehouseStatus?.status !== WAREHOUSE_STATUS.BORROWED) {
      return res.status(400).json({ message: 'Loan is not currently borrowed' })
    }

    // Check if loan has an effective return date (prefer approved extension)
    const effectiveReturn = getEffectiveReturnDate(loan)
    if (!effectiveReturn) {
      return res.status(400).json({ message: 'Loan does not have a return date' })
    }

    const reminderKey = `${loan.id}_reminder_${daysUntilReturn}_days`

    // Check if reminder already sent
    if (loan.reminderStatus?.[reminderKey]?.sent) {
      return res.status(400).json({
        message: `Reminder for ${daysUntilReturn} days before return has already been sent`,
        sentAt: loan.reminderStatus[reminderKey].sentAt
      })
    }

    // Send reminder email
    const triggeredBy = typeof requestedBy === 'string' && requestedBy.trim().length ? requestedBy.trim() : undefined
    const success = await sendReminderEmail(loan, daysUntilReturn, triggeredBy)

    if (success) {
      // Build and persist updated reminderStatus for this loan
      const currentTime = new Date().toISOString()

      const updatedReminder: any = {
        sent: true,
        sentAt: currentTime,
        type: `reminder_${daysUntilReturn}_days`,
        notifications: {}
      }

      if (loan.borrowerEmail) {
        updatedReminder.notifications.borrower = {
          sent: true,
          sentAt: currentTime,
          email: loan.borrowerEmail
        }
      }

      // entitas
      try {
        const entitasData = await prisma.entitas.findUnique({ where: { code: String(loan.entitasId) } })
        const entitasEmails = (entitasData?.emails ?? {}) as Record<string, string>
        updatedReminder.notifications.entitas = {}
        if (entitasEmails && Object.keys(entitasEmails).length > 0) {
          updatedReminder.notifications.entitas[loan.entitasId] = {}
          Object.entries(entitasEmails).forEach(([role, email]) => {
            if (email && typeof email === 'string') {
              updatedReminder.notifications.entitas[loan.entitasId][role] = {
                sent: true,
                sentAt: currentTime,
                email: email
              }
            }
          })
        }
      } catch (err) {
        console.warn('Unable to fetch entitas emails for', loan.entitasId, err)
      }

      // companies
      try {
        updatedReminder.notifications.companies = {}
        if (loan.company && Array.isArray(loan.company) && loan.company.length > 0) {
          const rows = await prisma.mktCompany.findMany({ where: { value: { in: loan.company } } })
          rows.forEach(r => {
            const companyName = r.value
            updatedReminder.notifications.companies[companyName] = {}
            Object.entries((r.emails as any) || {}).forEach(([role, email]) => {
              if (email && typeof email === 'string') {
                updatedReminder.notifications.companies[companyName][role] = {
                  sent: true,
                  sentAt: currentTime,
                  email: email
                }
              }
            })
          })
        }
      } catch (err) {
        console.warn('Unable to fetch company emails for manual reminder', err)
      }

      // merge into previous reminderStatus and persist
      try {
        const previous = (loan.reminderStatus as any) || {}
        previous[reminderKey] = updatedReminder
        await prisma.loan.update({ where: { id: loan.id }, data: { reminderStatus: previous } })
      } catch (err) {
        console.warn('Failed to persist reminderStatus for loan', loan.id, err)
      }

      if (daysUntilReturn >= 0) {
        console.log(`✅ Manual reminder sent for loan ${loan.id}: ${daysUntilReturn} days before return`)
      } else {
        console.log(`✅ Manual reminder sent for loan ${loan.id}: ${Math.abs(daysUntilReturn)} days after return`)
      }
      console.log(`📧 Email notifications updated for companies and entitas`)

      res.status(200).json({
        message: 'Manual reminder sent successfully',
        loanId: loan.id,
        reminderType: `reminder_${daysUntilReturn}_days`,
        sentAt: updatedReminder.sentAt
      })
    } else {
      res.status(500).json({ message: 'Failed to send reminder email' })
    }

  } catch (error) {
    console.error('Error sending manual reminder:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

async function sendReminderEmail(loan: LoanData, daysUntilReturn: number, requestedBy?: string): Promise<boolean> {
  try {
    const emailRecipients: EmailRecipient[] = []
    const dedupe = new Set<string>()

    const pushRecipient = (email: unknown, role: string, audience: EmailRecipient['audience']) => {
      if (typeof email !== 'string') return
      const normalized = email.trim()
      if (!normalized) return
      const key = `${audience || 'general'}:${normalized.toLowerCase()}`
      if (dedupe.has(key)) return
      dedupe.add(key)
      emailRecipients.push({ email: normalized, role, audience })
    }

    // Add borrower email if available
    if (loan.borrowerEmail) {
      pushRecipient(loan.borrowerEmail, 'Borrower Manual Reminder', 'borrower')
    }

    // Add all emails from entitas mapping (read from DB)
    if (loan.entitasId) {
      try {
        const entitasData = await prisma.entitas.findUnique({ where: { code: String(loan.entitasId) } })
        const entitasEmails = (entitasData?.emails ?? {}) as Record<string, string>
        Object.entries(entitasEmails).forEach(([role, email]) => {
          pushRecipient(email, role || 'Entitas', 'entitas')
        })
      } catch (err) {
        console.warn('Unable to fetch entitas emails for', loan.entitasId, err)
      }
    }

    // Add all emails from company mappings (fetch from DB)
    if (loan.company && Array.isArray(loan.company) && loan.company.length > 0) {
      try {
        const rows = await prisma.mktCompany.findMany({ where: { value: { in: loan.company } } })
        rows.forEach(r => {
          Object.entries((r.emails as any) || {}).forEach(([role, email]) => {
            pushRecipient(email, role || 'Company', 'company')
          })
        })
      } catch (err) {
        console.warn('Unable to fetch company emails for manual reminder', err)
      }
    }

    // If no emails found, skip sending
    if (emailRecipients.length === 0) {
      console.log(`⚠️ No email recipients found for loan ${loan.id}`)
      return false
    }

    const actor = requestedBy && requestedBy.length ? requestedBy : 'Admin'
    const success = await emailService.sendReminderNotification(loan, emailRecipients, {
      daysUntilReturn,
      manual: true,
      triggeredBy: actor
    })

    if (success) {
      const uniqueEmails = new Set(emailRecipients.map(r => r.email))
      console.log(`📧 Manual reminder sent to ${uniqueEmails.size} recipients for loan ${loan.id}`)
    }

    return success

  } catch (error) {
    console.error('Error sending manual reminder email:', error)
    return false
  }
}

