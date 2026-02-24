import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { getCanonicalRole } from '../../config/roleConfig'
// using prisma for data persistence (no file reads/writes)
import { emailService, EmailRecipient } from '../../utils/emailService'
import { WAREHOUSE_STATUS, LOAN_LIFECYCLE } from '../../types/loanStatus'
import { prisma } from '../../lib/prisma'
import { getEffectiveReturnDate } from '../../utils/loanHelpers'
import { computeDaysUntil } from '../../utils/email-templates/reminderShared'

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
  reminderStatus?: {
    [key: string]: {
      sent: boolean
      sentAt?: string
      type: string
      notifications?: {
        borrower?: { sent: boolean; sentAt?: string; email: string }
        entitas?: Record<string, Record<string, { sent: boolean; sentAt?: string; email: string }>>
        companies?: Record<string, Record<string, { sent: boolean; sentAt?: string; email: string }>>
      }
    }
  }
  userId?: string
}

const REMINDER_BEFORE_OFFSETS = [7, 3, 1, 0] as const
const REMINDER_AFTER_OFFSETS = Array.from({ length: 30 }, (_, idx) => -(idx + 1))
const REMINDER_OFFSETS = [...REMINDER_BEFORE_OFFSETS, ...REMINDER_AFTER_OFFSETS]

function describeReminderOffset(offset: number): string {
  if (offset === 0) return 'on the return date (H)'
  if (offset > 0) return `${offset} day(s) before return (H-${offset})`
  return `${Math.abs(offset)} day(s) after return (H+${Math.abs(offset)})`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Token-based protection: if REMINDER_AUTH_TOKEN is configured, require it
  const expectedToken = process.env.REMINDER_AUTH_TOKEN
  if (expectedToken) {
    const authHeader = (req.headers['authorization'] || req.headers['x-reminder-token']) as string | undefined
    const provided = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader

    let authorized = false
    if (provided && provided === expectedToken) authorized = true

    // allow admin/superadmin users (so Admin UI can trigger reminders without token)
    if (!authorized) {
      try {
        const session: any = await getServerSession(req, res, authOptions as any)
        const roleKey = getCanonicalRole(session?.user?.role)
        if (roleKey === 'admin' || roleKey === 'superadmin') authorized = true
      } catch (err) {
        // ignore and fail below
      }
    }

    if (!authorized) return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    // Fetch current loans from the DB
    const loans: any[] = await prisma.loan.findMany()

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const testOffset = typeof req.query?.testOffset !== 'undefined' ? Number(req.query.testOffset) : undefined
    const dryRun = (typeof req.query?.dryRun !== 'undefined') && String(req.query?.dryRun).toLowerCase() !== 'false'

    let remindersSent = 0

    // Check each loan for reminder needs
    for (const loan of loans) {
      // Skip if loan is draft, rejected, or not approved
      if (loan.isDraft) continue

      // Use effective return date (prefer last approved extension when present)
      const effectiveReturn = getEffectiveReturnDate(loan)
      if (!effectiveReturn) continue

      // Skip if already returned — prefer top-level returnStatus (new schema) and fallback to warehouseStatus or loanStatus
      if ((loan as any).returnStatus?.status === WAREHOUSE_STATUS.RETURNED) continue
      if (loan.warehouseStatus?.status === WAREHOUSE_STATUS.RETURNED) continue
      if (loan.loanStatus && String(loan.loanStatus).toLowerCase().includes('return')) continue

      // Only consider active loans: prefer those that are currently borrowed (warehouse) or fully approved in lifecycle
      const isBorrowed = loan.warehouseStatus?.status === WAREHOUSE_STATUS.BORROWED
      const isApprovedLifecycle = String(loan.loanStatus) === LOAN_LIFECYCLE.APPROVED
      if (!isBorrowed && !isApprovedLifecycle) continue

      // Calculate days until return using shared helper to avoid off-by-one rounding
      // computeDaysUntil returns positive numbers for days until return, 0 for due today, and negative for overdue days
      let daysUntilReturn = computeDaysUntil(effectiveReturn)

      // If testOffset is provided, override daysUntilReturn for testing purposes so all loans can be tested at a specific offset
      if (typeof testOffset === 'number' && !Number.isNaN(testOffset)) {
        daysUntilReturn = testOffset
      }

      // Define reminder triggers (H-7 .. H, plus H+1 .. H+30)
      for (const offset of REMINDER_OFFSETS) {
        if (daysUntilReturn === offset) {
          const reminderType = `reminder_${offset}_days`
          const reminderKey = `${loan.id}_${reminderType}`

          // Check if reminder already sent
          if (loan.reminderStatus?.[reminderKey]?.sent) continue

          // Send reminder email (skip actual send if dryRun)
          let success = false
          if (dryRun) {
            console.log(`🧪 Dry run: would send reminder for loan ${loan.id} at offset ${offset} (${describeReminderOffset(offset)})`)
            success = true
          } else {
            success = await sendReminderEmail(loan, offset)
          }

          if (success) {
              // Build an updated reminder object and populate notifications
              const updatedReminder: any = {
                sent: true,
                sentAt: now.toISOString(),
                type: reminderType,
                notifications: {}
              }

              // populate notifications: borrower
              if (loan.borrowerEmail) {
                updatedReminder.notifications.borrower = {
                  sent: true,
                  sentAt: now.toISOString(),
                  email: loan.borrowerEmail
                }
              }

            // populate notifications: entitas
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
                      sentAt: now.toISOString(),
                      email: email
                    }
                  }
                })
              }
            } catch (err) {
              console.warn('Unable to fetch entitas emails for scheduled reminder', loan.entitasId, err)
            }

            // populate notifications: companies
            try {
              updatedReminder.notifications.companies = {}
              if (loan.company && Array.isArray(loan.company) && loan.company.length > 0) {
                const rows = await prisma.mktCompany.findMany({ where: { value: { in: loan.company } } })
                rows.forEach(r => {
                  updatedReminder.notifications.companies[r.value] = {}
                  Object.entries((r.emails as any) || {}).forEach(([role, email]) => {
                    if (email && typeof email === 'string') {
                      updatedReminder.notifications.companies[r.value][role] = {
                        sent: true,
                        sentAt: now.toISOString(),
                        email: String(email)
                      }
                    }
                  })
                })
              }
            } catch (err) {
              console.warn('Unable to fetch company emails for scheduled reminder', err)
            }
            // Persist updated reminder status back to DB for this loan
            try {
              const previous = (loan.reminderStatus as any) || {}
              previous[reminderKey] = updatedReminder
              await prisma.loan.update({ where: { id: loan.id }, data: { reminderStatus: previous } })
            } catch (err) {
              console.warn('Failed to persist reminderStatus for loan', loan.id, err)
            }

            remindersSent++
            console.log(`✅ Reminder sent for loan ${loan.id}: ${describeReminderOffset(offset)}`)
          }
        }
      }
    }

    // Persist the run result for monitoring
    try {
      // use raw SQL insert to avoid requiring regenerated Prisma client types immediately
      await prisma.$executeRaw`INSERT INTO "ReminderRun" ("ranAt", "remindersSent", "checkedLoans", "details") VALUES (now(), ${remindersSent}, ${loans.length}, ${JSON.stringify({})})`
    } catch (err) {
      console.warn('Failed to persist ReminderRun (raw insert)', err)
    }

    // All updates persisted per-loan in the DB; no file writes are performed
    res.status(200).json({
      message: 'Reminder check completed',
      remindersSent,
      checkedLoans: loans.length
    })

  } catch (error) {
    console.error('Error processing reminders:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

async function sendReminderEmail(loan: LoanData, daysUntilReturn: number): Promise<boolean> {
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
      pushRecipient(loan.borrowerEmail, 'Borrower Reminder', 'borrower')
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
        // Don't block reminders if entitas lookup fails
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
        console.warn('Unable to fetch company emails for reminder', err)
      }
    }

    // If no emails found, skip sending
    if (emailRecipients.length === 0) {
      console.log(`⚠️ No email recipients found for loan ${loan.id}`)
      return false
    }

    const success = await emailService.sendReminderNotification(loan, emailRecipients, { daysUntilReturn })

    if (success) {
      const uniqueEmails = new Set(emailRecipients.map(r => r.email))
      console.log(`📧 Reminder sent to ${uniqueEmails.size} recipients for loan ${loan.id}`)
    }

    return success

  } catch (error) {
    console.error('Error sending reminder email:', error)
    return false
  }
}

