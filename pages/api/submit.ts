import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import { prisma } from '../../lib/prisma'
import { getToken } from 'next-auth/jwt'
import { emailService, EmailRecipient } from '../../utils/emailService'
import { GoogleSheetsService } from '../../utils/googleSheetsService'

// data/loans.json is a seed fixture only — runtime uses the Loans DB table

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  try {
    const data = req.body

    // NOTE: we no longer persist runtime data to data/loans.json
    // runtime persistence is handled by the Loans DB table via Prisma.

    // Add timestamp and generate a human-friendly submission ID yyyyMMdd-<seq>
    // e.g. 20251203-1
    async function generateSubmissionId() {
      const now = new Date()
      const yyyy = String(now.getFullYear())
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      const prefix = `${yyyy}${mm}${dd}`

      // Count existing loans for today to choose the next sequence number
      // This uses the `id` field which will include previous generated ids with this prefix.
      const existing = await prisma.loan.count({ where: { id: { startsWith: `${prefix}-` } } })
      const seq = existing + 1
      return `${prefix}-${seq}`
    }

    const loanId = await generateSubmissionId()

    // Add timestamp and ID
    const loanData = {
      id: loanId,
      submittedAt: new Date().toISOString(),
      isDraft: data.isDraft || false,
      ...data
    }

    // Initialize submit notifications structure (only Marketing & Admin from companies)
    const submitNotifications: any = {
      companies: {}
    }

    // Add company emails (only Marketing & Admin)
    if (loanData.company) {
      // Handle both string (radio button) and array (checkbox) formats
      const companies = Array.isArray(loanData.company) ? loanData.company : [loanData.company]
      // Fetch company rows from DB for this submission
      const companyRows = await prisma.mktCompany.findMany({ where: { value: { in: companies } } })
      companies.forEach((companyName: string) => {
        const companyData = companyRows.find(c => c.value === companyName)
        if (companyData && companyData.emails) {
          submitNotifications.companies[companyName] = {}
          // Only add Marketing and Admin roles for submit notifications
          ;['Marketing', 'Admin'].forEach(role => {
            const emailVal = (companyData!.emails as any)[role]
            if (emailVal) {
              submitNotifications.companies[companyName][role] = {
                sent: false,
                email: emailVal
              }
            }
          })
        }
      })
      // Ensure company is always stored as array for consistency
      loanData.company = companies
    }

    // Add submit notifications to loan data
    loanData.submitNotifications = submitNotifications

    // Initialize approval notifications structure (all roles from all entities)
    const approvalNotifications: any = {
      entitas: {},
      companies: {}
    }
    let entitasEmailsCache: Record<string, string> | null = null
    let approvalCompanyRows: any[] = []

    // Add entitas emails for approval notifications (fetch from DB)
    if (loanData.entitasId) {
      const entitasRow = await prisma.entitas.findUnique({ where: { code: String(loanData.entitasId) } })
      const entitasEmails: any = entitasRow?.emails ?? {}
      entitasEmailsCache = entitasEmails
      if (entitasEmails && Object.keys(entitasEmails).length > 0) {
        approvalNotifications.entitas[loanData.entitasId] = {}
        Object.entries(entitasEmails).forEach(([role, email]) => {
          approvalNotifications.entitas[loanData.entitasId][role] = {
            sent: false,
            email: String(email)
          }
        })
      }
    }

    // Add all company emails for approval notifications
    if (loanData.company) {
      // Handle both string (radio button) and array (checkbox) formats
      const companies = Array.isArray(loanData.company) ? loanData.company : [loanData.company]
      // Fetch company rows for approval mapping
      const companyRows = await prisma.mktCompany.findMany({ where: { value: { in: companies } } })
      approvalCompanyRows = companyRows
      companyRows.forEach((companyData: any) => {
        if (companyData?.emails) {
          approvalNotifications.companies[companyData.value] = {}
          Object.entries(companyData.emails).forEach(([role, email]) => {
            approvalNotifications.companies[companyData.value][role] = {
              sent: false,
              email: email
            }
          })
        }
      })
      // Ensure company is always stored as array for consistency
      loanData.company = companies
    }

    // Add approval notifications to loan data
    // Also track the borrower as a potential approval notification recipient so
    // we can persist whether the borrower received the final-approved email.
    if (loanData.borrowerEmail) {
      approvalNotifications.borrower = {
        sent: false,
        email: String(loanData.borrowerEmail)
      }
    }

    loanData.approvalNotifications = approvalNotifications

    // Initialize return notifications so DB rows always have borrower + recipients tracked
    const returnNotifications: any = {
      entitas: {},
      companies: {}
    }

    if (loanData.entitasId && entitasEmailsCache && Object.keys(entitasEmailsCache).length > 0) {
      returnNotifications.entitas[loanData.entitasId] = {}
      Object.entries(entitasEmailsCache).forEach(([role, email]) => {
        returnNotifications.entitas[loanData.entitasId][role] = {
          sent: false,
          email: String(email)
        }
      })
    }

    if (approvalCompanyRows.length > 0) {
      approvalCompanyRows.forEach(companyData => {
        if (!companyData?.value || !companyData?.emails) return
        returnNotifications.companies[companyData.value] = {}
        Object.entries(companyData.emails).forEach(([role, email]) => {
          returnNotifications.companies[companyData.value][role] = {
            sent: false,
            email: String(email)
          }
        })
      })
    }

    if (loanData.borrowerEmail) {
      returnNotifications.borrower = {
        sent: false,
        email: String(loanData.borrowerEmail)
      }
    }

    loanData.returnNotifications = returnNotifications

    // Initialize approvals structure
    const approvals: any = {
      companies: {}
    }

    // Add company approvals (initially not approved)
    if (loanData.company && Array.isArray(loanData.company)) {
      loanData.company.forEach((companyName: string) => {
        approvals.companies[companyName] = {
          approved: false,
          note: null
        }
      })
    }

    // Add approvals to loan data
    loanData.approvals = approvals

    // Initialize reminder status structure (notifications will be added when reminders are sent)
    loanData.reminderStatus = {}

    // Ensure `needDetails` exists and has a sensible value (backwards-compatible with demo/backup/lainnya)
    if (!loanData.needDetails) {
      // derive needDetails based on needType
      try {
        const nt = String(loanData.needType || '').toUpperCase()
        if (nt === 'DEMO_PRODUCT' && loanData.demo) {
          loanData.needDetails = loanData.demo
        } else if (nt === 'BARANG_BACKUP' && loanData.backup) {
          loanData.needDetails = loanData.backup
        } else if (nt === 'LAINNYA' && loanData.lainnya) {
          // keep the original 'lainnya' text inside needDetails for consistency
          loanData.needDetails = { lainnya: loanData.lainnya }
        } else {
          // keep any existing needDetails structure or empty object
          loanData.needDetails = loanData.needDetails || {}
        }
      } catch (e) {
        loanData.needDetails = loanData.needDetails || {}
      }
    }

    // Ensure the submission records the authenticated user server-side
    try {
      const tokenAny: any = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
      // Prefer explicit userId in payload if provided; otherwise use token.sub (NextAuth user id)
      if (!loanData.userId && tokenAny?.sub) {
        loanData.userId = String(tokenAny.sub)
      }
    } catch (e) {
      // If token lookup fails, we continue — loan may be created as anonymous
      // but in typical deployments middleware will reject unauthenticated requests
      console.warn('submit: failed to resolve user token', e)
    }

    // Persist the loan into the DB Loans table
    // Use a retry loop to handle potential race conditions on ID generation (yyyyMMdd-<seq>)
    const maxAttempts = 10
    let createdLoan: any = null

    // helper: compute the next sequence number for a date prefix by reading the current max id
    async function computeNextSeqForPrefix(prefix: string) {
      // Find latest id with this prefix ordered desc, then parse numeric suffix
      const latest = await prisma.loan.findFirst({ where: { id: { startsWith: `${prefix}-` } }, orderBy: { id: 'desc' }, select: { id: true } })
      if (!latest || !latest.id) return 1
      const parts = String(latest.id).split('-')
      const lastSeq = parseInt(parts[parts.length - 1] ?? '0', 10)
      return (Number.isNaN(lastSeq) ? 0 : lastSeq) + 1
    }

    // Build a base prefix for today's date
    const now = new Date()
    const yyyy = String(now.getFullYear())
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const prefix = `${yyyy}${mm}${dd}`

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // compute candidate sequence (fresh on each attempt to reduce collision likelihood)
        const seq = await computeNextSeqForPrefix(prefix)
        const candidateId = `${prefix}-${seq}`

        createdLoan = await prisma.loan.create({
          data: {
            id: candidateId,
            submittedAt: loanData.submittedAt ? new Date(loanData.submittedAt) : undefined,
            isDraft: !!loanData.isDraft,
            entitasId: loanData.entitasId || null,
            userId: loanData.userId || null,
            borrowerPhone: loanData.borrowerPhone || null,
            borrowerEmail: loanData.borrowerEmail || null,
            borrowerName: loanData.borrowerName || null,
            needType: loanData.needType || null,
            needDetails: loanData.needDetails || {},
            company: Array.isArray(loanData.company) ? loanData.company : (loanData.company ? [loanData.company] : []),
            outDate: loanData.outDate ? new Date(loanData.outDate) : null,
            useDate: loanData.useDate ? new Date(loanData.useDate) : null,
            returnDate: loanData.returnDate ? new Date(loanData.returnDate) : null,
            productDetailsText: loanData.productDetailsText || null,
            pickupMethod: loanData.pickupMethod || null,
            note: loanData.note || null,
            approvalAgreementFlag: !!loanData.approvalAgreementFlag,
            submitNotifications: loanData.submitNotifications || {},
            approvalNotifications: loanData.approvalNotifications || {},
            approvals: loanData.approvals || {},
            reminderStatus: loanData.reminderStatus || {},
            warehouseStatus: loanData.warehouseStatus || {},
            returnNotifications: loanData.returnNotifications || {}
          } as any
        })

        // success — break out
        loanData.id = candidateId
        break
      } catch (err: any) {
        // If duplicate id error, retry with next sequence; otherwise rethrow
        if (err && err.code === 'P2002' && String(err?.meta?.target || '').toLowerCase().includes('id')) {
          console.warn('Duplicate loan id generated, retrying with next sequence (attempt', attempt + 1, ')')
          // small delay to reduce tight-loop collisions
          await new Promise(r => setTimeout(r, 50))
          continue
        }
        // rethrow unexpected errors
        throw err
      }
    }

    if (!createdLoan) {
      throw new Error('Failed to create loan after multiple attempts due to duplicate id collisions')
    }

    // Sync Loan <-> MktCompany mappings for each company value
    try {
      const companies = Array.isArray(createdLoan.company) ? createdLoan.company : (createdLoan.company ? [createdLoan.company] : [])
      for (const comp of companies) {
        const normalized = String(comp || '').trim()
        if (!normalized) continue

        // Try exact match (case-insensitive) then startsWith word match
        let companyRow = await prisma.mktCompany.findFirst({ where: { value: { equals: normalized, mode: 'insensitive' } } })
        if (!companyRow) {
          companyRow = await prisma.mktCompany.findFirst({ where: { value: { startsWith: normalized.split(' ')[0] || normalized, mode: 'insensitive' } } })
        }

        if (!companyRow) {
          // create an inactive placeholder company so mapping exists
          try {
            companyRow = await prisma.mktCompany.create({ data: { value: normalized, label: normalized, isActive: false, emails: {} as any } })
          } catch (err) {
            console.warn('Failed to create placeholder MktCompany for', normalized, err)
            continue
          }
        }

        // create mapping if not exists
        try {
          await prisma.loanMktCompany.create({ data: { loanId: createdLoan.id, companyId: companyRow.id } })
        } catch (err) {
          // ignore unique violation that may happen under race conditions
        }
      }
    } catch (e) {
      console.warn('Failed to sync loan company mappings', e)
    }

    // Send email notifications using the submission templates for every audience
    try {
      const initialRecipients: EmailRecipient[] = []
      const seen = new Set<string>()

      const addRecipient = (recipient: EmailRecipient) => {
        const email = String(recipient.email || '').trim()
        if (!email) return
        const key = `${email.toLowerCase()}|${recipient.audience || recipient.role}`
        if (seen.has(key)) return
        seen.add(key)
        initialRecipients.push({ ...recipient, email })
      }

      const ensureCompanyRows = async () => {
        if (approvalCompanyRows.length || !loanData.company || !Array.isArray(loanData.company) || !loanData.company.length) return
        approvalCompanyRows = await prisma.mktCompany.findMany({ where: { value: { in: loanData.company } } })
      }

      await ensureCompanyRows()

      approvalCompanyRows.forEach(companyData => {
        if (!companyData?.emails) return
        Object.entries(companyData.emails as Record<string, any>).forEach(([role, value]) => {
          const email = String(value || '').trim()
          if (!email) return
          const roleLower = String(role || '').toLowerCase()
          if (roleLower === 'warehouse') return
          if (roleLower === 'marketing') {
            addRecipient({ email, role: role || 'Marketing', audience: 'marketing' })
            return
          }
          addRecipient({
            email,
            role: role || 'Company',
            audience: 'company'
          })
        })
      })

      if (entitasEmailsCache) {
        Object.entries(entitasEmailsCache).forEach(([role, value]) => {
          const email = String(value || '').trim()
          if (!email) return
          addRecipient({
            email,
            role: role || 'Entitas',
            audience: 'entitas'
          })
        })
      }

      const borrowerEmail = loanData.borrowerEmail ? String(loanData.borrowerEmail).trim() : ''
      if (borrowerEmail) {
        addRecipient({
          email: borrowerEmail,
          role: 'Borrower',
          audience: 'borrower'
        })
      }

      // Send initial notification
      if (initialRecipients.length > 0) {
        const emailSent = await emailService.sendLoanSubmissionNotification(loanData, initialRecipients)
        if (emailSent) {
          console.log(`Initial email sent to ${initialRecipients.length} recipients (Marketing/Company/Entitas/Borrower)`)
          // Update email status for sent emails
          const currentTime = new Date().toISOString()
          initialRecipients.forEach(recipient => {
            // Find the company that contains this email and update the status
            Object.keys(loanData.submitNotifications.companies).forEach(companyName => {
              const companyEmails = loanData.submitNotifications.companies[companyName]
              Object.keys(companyEmails).forEach(role => {
                if (companyEmails[role].email === recipient.email && (role === 'Marketing' || role === 'Admin')) {
                  companyEmails[role].sent = true
                  companyEmails[role].sentAt = currentTime
                }
              })
            })
          })

          // persist updated submitNotifications to DB once
          try {
            await prisma.loan.update({ where: { id: loanData.id }, data: { submitNotifications: loanData.submitNotifications } })
          } catch (err) {
            console.warn('Failed to persist submitNotifications update for loan', loanData.id, err)
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending initial email notification:', emailError)
      // Don't fail the submission if email fails
    }

    // runtime persistence is now DB driven; we do not write to data/loans.json

    // Submit to Google Sheets (don't fail the submission if this fails)
    try {
      const sheetsSuccess = await GoogleSheetsService.submitToGoogleSheets(loanData)
      if (sheetsSuccess) {
        console.log('Data successfully submitted to Google Sheets')
      } else {
        console.log('Failed to submit data to Google Sheets')
      }
    } catch (sheetsError) {
      console.error('Error submitting to Google Sheets:', sheetsError)
      // Don't fail the submission if Google Sheets fails
    }

    // Add diagnostic header (helps clients/proxies correlate requests when debugging proxy issues)
    res.setHeader('X-Submission-ID', String(loanData.id))
    return res.status(200).json({ message: 'Form berhasil dikirim dan disimpan', id: loanData.id })
  } catch (error) {
    console.error('Error saving loan:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan data' })
  }
}
