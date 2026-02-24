import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { getCanonicalRole } from '../../../../config/roleConfig'
import { requireCrudPermission } from '../../../../utils/authorization'
import { emailService, EmailRecipient } from '../../../../utils/emailService'
import { getEffectiveReturnDate } from '../../../../utils/loanHelpers'
import { GoogleSheetsService } from '../../../../utils/googleSheetsService'
import {
  generateSubmitRejectBorrowerEmail,
  generateSubmitRejectCompanyEmail,
  generateSubmitRejectEntitasEmail
} from '../../../../utils/email-templates/mktRejectTemplates'

// Runtime data now stored in DB (Loans table) — not reading/writing data/loans.json

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  const formatApprovedAt = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)

    // Prefer Asia/Jakarta for consistent business-facing timestamps
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

    // Fallback to server-local time
    const pad2 = (n: number) => String(n).padStart(2, '0')
    return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}/${pad2(date.getHours())}-${pad2(date.getMinutes())}`
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'ID is required' })
  }

  const sendRejectionEmails = async (
    loanPayload: any,
    entitasEmails: string[],
    companyEmails: string[],
    borrowerEmail?: string | null
  ): Promise<{ ok: boolean; sentEmails: string[] }> => {
    const maybeHelper = (emailService as any)?.sendLoanRejectionNotifications
    if (typeof maybeHelper === 'function') {
      return maybeHelper.call(emailService, loanPayload, entitasEmails, companyEmails, borrowerEmail)
    }

    const normalizeEmail = (value?: string | null) => {
      if (!value) return ''
      return String(value).trim()
    }
    const uniqueEmails = (list: string[]) => Array.from(new Set(list.map(normalizeEmail).filter(Boolean)))
    const sentEmails = new Set<string>()
    const subject = `Peminjaman DITOLAK - ${loanPayload?.borrowerName || loanPayload?.id || ''}`.trim()

    const sendGroup = async (emails: string[], body: string): Promise<boolean> => {
      if (!emails.length) return true
      const result = await emailService.sendCustomEmail({ to: emails, subject, body })
      if (!result?.ok) return false
      emails.forEach(email => {
        const normalized = normalizeEmail(email)
        if (normalized) sentEmails.add(normalized)
      })
      return true
    }

    const companyList = uniqueEmails(companyEmails)
    const entitasList = uniqueEmails(entitasEmails)
    const borrowerList = borrowerEmail ? uniqueEmails([borrowerEmail]) : []

    const companyBody = generateSubmitRejectCompanyEmail(loanPayload, [], 'Marketing', false)
    if (!(await sendGroup(companyList, companyBody))) {
      return { ok: false, sentEmails: Array.from(sentEmails) }
    }

    const entitasBody = generateSubmitRejectEntitasEmail(loanPayload, [], false)
    if (!(await sendGroup(entitasList, entitasBody))) {
      return { ok: false, sentEmails: Array.from(sentEmails) }
    }

    if (borrowerList.length) {
      const borrowerBody = generateSubmitRejectBorrowerEmail(loanPayload, [], false)
      if (!(await sendGroup(borrowerList, borrowerBody))) {
        return { ok: false, sentEmails: Array.from(sentEmails) }
      }
    }

    return { ok: true, sentEmails: Array.from(sentEmails) }
  }

  try {
    console.debug('[approve] start', { id, body: req.body })
    const loan = await prisma.loan.findUnique({ where: { id } })
    if (!loan) return res.status(404).json({ message: 'Loan not found' })
    const { approved, reason, note } = req.body

    // For now, we'll approve/reject all companies at once
    // In a real app, you might want to approve per company
    const approvalsAny = (loan.approvals as any) || {}
    if (!approvalsAny || !approvalsAny.companies) {
      return res.status(400).json({ message: 'Loan has no approval structure' })
    }
    const companies = Object.keys(approvalsAny.companies)
    // Authenticate + role check
    const session = (await getServerSession(req, res, authOptions as any)) as any
    if (!session?.user?.id) return res.status(401).json({ message: 'Not authenticated' })
    const role = getCanonicalRole(session?.user?.role)
    console.debug('[approve] session', { userId: session?.user?.id, role })
    const currentUserId = String(session.user.id)
    const currentUser = session.user?.name || session.user?.username || 'Unknown User'
    const currentTime = new Date().toISOString()

    // require admin or the loan owner to approve/reject
    try {
      const session = (await getServerSession(req, res, authOptions as any)) as any
      if (!session?.user?.id) return res.status(401).json({ message: 'Not authenticated' })
      const roleKey = getCanonicalRole(session.user.role)
      // Allow admins and superadmins to proceed. Marketing users are also allowed to proceed
      // to the company-level ownership check implemented below. Other users must be the loan owner.
      if (!(roleKey === 'admin' || roleKey === 'superadmin' || roleKey === 'marketing')) {
        if (String(loan.userId) !== String(session.user.id)) return res.status(403).json({ message: 'Forbidden' })
      }
    } catch (err) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    // Determine which company keys the current user is allowed to update.
    // Marketing users can only act on companies they own (MktCompany.userId)
    let allowedCompanies = companies
    if (role === 'marketing') {
      // Fetch both value and label to make matching more permissive (some loans might use label vs value)
      const owned = await prisma.mktCompany.findMany({ where: { userId: currentUserId }, select: { value: true, label: true } })

      // Build normalized sets from both value & label for robust matching
      const normalize = (v?: string) => String(v ?? '').trim().toLowerCase()
      const ownedValues = owned.map(o => String(o.value ?? '').trim())
      const ownedLabels = owned.map(o => String(o.label ?? '').trim())

      const ownedSet = new Set<string>()
      ownedValues.forEach(v => { const n = normalize(v); if (n) ownedSet.add(n) })
      ownedLabels.forEach(l => { const n = normalize(l); if (n) ownedSet.add(n) })

      // Normalize loan companies for comparison (be defensive if companies include objects)
      const companiesNormalized = (companies || []).map((c: any) => normalize(typeof c === 'string' ? c : (c && (c.value || c.label)) || String(c ?? '')))

      // Only keep companies that belong to the current user (normalized compare)
      allowedCompanies = companies.filter((c, idx) => ownedSet.has(companiesNormalized[idx]))

      // Helpful debug info for dev — show what was attempted vs owned
      console.debug('[approve] marketing-owned-companies', {
        userId: currentUserId,
        ownedValues,
        ownedLabels,
        ownedNormalized: Array.from(ownedSet),
        companies,
        companiesNormalized,
        allowedCompanies
      })

      if (allowedCompanies.length === 0) {
        // Marketing user cannot approve companies they don't own
        const message = 'Forbidden: you cannot approve items for companies you do not own'
        // Include contextual details in non-production for easier debugging
        if (process.env.NODE_ENV !== 'production') {
          return res.status(403).json({
            message,
            detail: {
              ownedValues,
              ownedLabels,
              ownedNormalized: Array.from(ownedSet),
              companies,
              companiesNormalized,
              intersection: companiesNormalized.filter(cn => ownedSet.has(cn))
            }
          })
        }
        return res.status(403).json({ message })
      }
    }

    // Update approval status for allowed companies (in-memory copy first)
    const newApprovals = { ...(loan.approvals as any) }
    companies.forEach(companyName => {
      // Skip companies that current user isn't allowed to change
      if (!allowedCompanies.includes(companyName)) return
      newApprovals.companies[companyName] = {
        approved: approved,
        approvedBy: currentUser,
        approvedAt: currentTime,
        ...(approved ? {} : { rejectionReason: reason }),
        note: note ?? (newApprovals.companies[companyName] && newApprovals.companies[companyName].note ? newApprovals.companies[companyName].note : null)
      }
    })

    // Determine whether this approval action results in *all* approvals completed
    const companiesApproved = Object.keys(newApprovals.companies || {}).length > 0 &&
      Object.keys(newApprovals.companies).every(name => newApprovals.companies[name].approved === true)

    // Send email notifications to all recipients after approval
    try {
      const allRecipients: EmailRecipient[] = []
      // group-specific lists used when final approval happens (marketing-triggered)
      let companyEmailsExWarehouse: string[] = []
      let warehouseEmails: string[] = []

      // Add all company emails (complete mapping) fetched from DB
      if (loan.company && Array.isArray(loan.company) && loan.company.length > 0) {
        try {
          const rows = await prisma.mktCompany.findMany({ where: { value: { in: loan.company } } })
          // Collect group-specific recipient lists for final-approved sends
          // (use outer-scope marketingEmails / warehouseEmails so lists are available later)
          rows.forEach(r => {
            const emails = (r.emails as any) || {}
            Object.entries(emails).forEach(([role, email]) => {
              allRecipients.push({ email: email as string, role })
            })
            Object.entries(emails).forEach(([role, email]) => {
              const normalized = typeof email === 'string' ? email.trim() : ''
              if (!normalized) return
              if (String(role || '').toLowerCase() === 'warehouse') {
                warehouseEmails.push(normalized)
              } else {
                companyEmailsExWarehouse.push(normalized)
              }
            })
          })
        } catch (err) {
          console.warn('Unable to fetch company emails for approval', err)
          console.debug('[approve] loan.company rows fetch error, loan.company=', loan.company)
        }
      }

      // Always include borrower as a recipient so they can get final-approved notifications
      if (loan.borrowerEmail && String(loan.borrowerEmail).trim()) {
        allRecipients.push({ email: String(loan.borrowerEmail).trim(), role: 'Borrower' })
      }

      // Add all entitas emails (from DB)
      // Build entitas-specific recipient list
      const entitasRecipients: { email: string; role: string }[] = []
      if (loan.entitasId) {
        try {
          const entitasData = await prisma.entitas.findUnique({ where: { code: String(loan.entitasId) } })
          const entitasEmails = (entitasData?.emails ?? {}) as Record<string, string>
          Object.entries(entitasEmails).forEach(([role, email]) => {
            if (email && String(email).trim()) {
              allRecipients.push({ email: String(email).trim(), role })
              entitasRecipients.push({ email: String(email).trim(), role })
            }
          })
        } catch (err) {
          console.warn('Unable to fetch entitas emails for', loan.entitasId, err)
        }
      }

      // Send approval notification(s)
      if (allRecipients.length > 0) {
        // If this results in complete approvals AND the action is performed by a Marketing user,
        // send the specialized RAW Email Approved flows to Entitas, Marketing and Warehouse.
        if (companiesApproved && role === 'marketing' && approved === true) {
            // Derive recipients per group and remove duplicates
            console.debug(
              '[approve] entitasRecipients=%o, companyEmails=%o, warehouseEmails=%o',
              entitasRecipients,
              companyEmailsExWarehouse,
              warehouseEmails
            )
          const entitasEmailsList = entitasRecipients.map(r => r.email).filter(Boolean)
          const companyEmailsList = Array.from(new Set(companyEmailsExWarehouse))
          const warehouseEmailsList = typeof warehouseEmails !== 'undefined' ? Array.from(new Set((warehouseEmails as string[]))) : []

          // compute approvalInfo override so the emails show the current approver/time
          const effectiveReturn = getEffectiveReturnDate(loan)
          const durationStr = `${loan.useDate ?? '-'} → ${effectiveReturn ?? (loan.returnDate ?? '-')}`
          const computeDurationDays = (start?: string, end?: string) => {
            if (!start || !end) return undefined
            const s = new Date(start)
            const e = new Date(end)
            if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return undefined
            const msPerDay = 1000 * 60 * 60 * 24
            const diffDays = Math.round((e.getTime() - s.getTime()) / msPerDay) + 1
            return diffDays >= 0 ? diffDays : undefined
          }
          const approvalInfoOverride = {
            approverName: currentUser,
            approvedAt: currentTime,
            note: note ?? undefined,
            duration: durationStr,
            durationDays: computeDurationDays(String(loan.useDate), String(effectiveReturn ?? loan.returnDate))
          }

          const borrowerEmail = (() => {
            try {
              if (loan.borrowerEmail && String(loan.borrowerEmail).trim()) {
                return String(loan.borrowerEmail).trim()
              }
            } catch (err) {
              console.warn('[approve] borrowerEmail normalization failed', err)
            }
            return undefined
          })()

          const normalizeEmail = (value?: string | null) => {
            if (!value) return ''
            const trimmed = String(value).trim()
            return trimmed
          }
          const successfulEmails = new Set<string>()
          const trackSuccessfulEmail = (value?: string | null) => {
            const normalized = normalizeEmail(value)
            if (normalized) successfulEmails.add(normalized)
            return normalized
          }

          let emailSent = false
          try {
            const finalEmailSent = await emailService.sendFinalApprovedNotifications({ ...loan, approvals: newApprovals }, entitasEmailsList, companyEmailsList, warehouseEmailsList, approvalInfoOverride)

            if (finalEmailSent) {
              entitasEmailsList.forEach(trackSuccessfulEmail)
              companyEmailsList.forEach(trackSuccessfulEmail)
              warehouseEmailsList.forEach(trackSuccessfulEmail)
              trackSuccessfulEmail(borrowerEmail)

              const extraRecipientsMap = new Map<string, EmailRecipient>()
              allRecipients.forEach(recipient => {
                const normalized = normalizeEmail(recipient.email)
                if (!normalized) return
                if (successfulEmails.has(normalized)) return
                if (!extraRecipientsMap.has(normalized)) {
                  extraRecipientsMap.set(normalized, recipient)
                }
              })

              let extraEmailsSent = true
              const extraRecipients = Array.from(extraRecipientsMap.values())
              if (extraRecipients.length > 0) {
                try {
                  extraEmailsSent = await emailService.sendLoanApprovalNotification({ ...loan, approvals: newApprovals }, extraRecipients, approved, currentUser, approvalInfoOverride)
                } catch (err) {
                  console.error('[approve] sendLoanApprovalNotification (extra recipients) failed', err)
                  extraEmailsSent = false
                }
                if (extraEmailsSent) {
                  extraRecipients.forEach(recipient => trackSuccessfulEmail(recipient.email))
                }
              }

              emailSent = finalEmailSent && extraEmailsSent
            } else {
              emailSent = false
            }
          } catch (err) {
            console.error('[approve] sendFinalApprovedNotifications failed', err)
            emailSent = false
          }
          if (emailSent) {
          console.log(`Approval email sent to ${allRecipients.length} recipients (complete mapping)`)
                  // Update email status for all sent emails and persist
                  const currentTime = new Date().toISOString()
                  const updatedApprovalNotifications = { ...(loan.approvalNotifications as any || {}) }

                  allRecipients.forEach(recipient => {
                    const normalizedRecipientEmail = normalizeEmail(recipient.email)
                    if (!normalizedRecipientEmail || !successfulEmails.has(normalizedRecipientEmail)) {
                      return
                    }
                    // Update company emails in the copy (defensive)
                    if (updatedApprovalNotifications.companies && typeof updatedApprovalNotifications.companies === 'object') {
                      Object.keys(updatedApprovalNotifications.companies).forEach(companyName => {
                        const companyEmails = updatedApprovalNotifications.companies[companyName]
                        if (!companyEmails || typeof companyEmails !== 'object') return
                        Object.keys(companyEmails).forEach(role => {
                          const entry = companyEmails[role]
                          if (entry && entry.email === normalizedRecipientEmail) {
                            entry.sent = true
                            entry.sentAt = currentTime
                          }
                        })
                      })
                    }

                    // Update entitas emails (defensive)
                    if (updatedApprovalNotifications.entitas && updatedApprovalNotifications.entitas[loan.entitasId]) {
                      const entitasEmails = updatedApprovalNotifications.entitas[loan.entitasId]
                      if (entitasEmails && typeof entitasEmails === 'object') {
                        Object.keys(entitasEmails).forEach(role => {
                          const entry = entitasEmails[role]
                          if (entry && entry.email === normalizedRecipientEmail) {
                            entry.sent = true
                            entry.sentAt = currentTime
                          }
                        })
                      }
                    }
                    // Update borrower email entry (if present) so we track message status
                    try {
                      if (loan.borrowerEmail && String(loan.borrowerEmail).trim()) {
                        const bEmail = String(loan.borrowerEmail).trim()
                        if (!updatedApprovalNotifications.borrower) {
                          updatedApprovalNotifications.borrower = { sent: false, email: bEmail }
                        }
                        if (successfulEmails.has(bEmail) && updatedApprovalNotifications.borrower && updatedApprovalNotifications.borrower.email === normalizedRecipientEmail) {
                          updatedApprovalNotifications.borrower.sent = true
                          updatedApprovalNotifications.borrower.sentAt = currentTime
                        }
                      }
                    } catch (e) { /* swallow - defensive */ }
                  })
          // persist updated approvals + approvalNotifications into DB
          try {
            // If this update results in all companies approved, also update loanStatus -> 'Approved'
            const dataToUpdate: any = { approvals: newApprovals, approvalNotifications: updatedApprovalNotifications }
            if (approved === true && companiesApproved) {
              dataToUpdate.loanStatus = 'Approved'
            } else if (approved === false) {
              dataToUpdate.loanStatus = 'Rejected'
            }
            const updated = await prisma.loan.update({ where: { id }, data: dataToUpdate })
            // Whenever Marketing (or Superadmin acting on approvals) approves (approved=true),
            // also update the MKT Status column in Google Sheets.
            // This is best-effort and must not block the approval flow.
            if ((role === 'marketing' || role === 'superadmin') && approved === true) {
              try {
                const noteText = (note ?? '').toString().trim()
                const approvedAtText = formatApprovedAt(currentTime)
                const statusText = `Status : Disetujui, Disetujui oleh : ${currentUser}, Disetujui pada : ${approvedAtText}, Catatan : ${noteText}`
                console.debug('[approve] attempting Google Sheets MKT Status update', { id, role, sheetNeedType: updated?.needType })
                // fire-and-forget Google Sheets update (best-effort). Do not block response on external call.
                GoogleSheetsService.updateMktStatusForLoan(updated, statusText)
                  .then(gsUpdated => console.log('GoogleSheetsService.updateMktStatusForLoan result=', gsUpdated))
                  .catch(err => console.warn('Failed to update MKT Status in Google Sheets after final approval', err))
              } catch (err) {
                console.warn('Failed to update MKT Status in Google Sheets after final approval', err)
              }
            }
            return res.status(200).json({ message: approved ? 'Loan approved successfully' : 'Loan rejected successfully', loan: updated })
          } catch (err) {
            console.warn('Failed to persist approval update for loan', id, err)
            return res.status(200).json({ message: approved ? 'Loan approved successfully' : 'Loan rejected successfully', loan: { ...loan, approvals: newApprovals, approvalNotifications: updatedApprovalNotifications } })
          }
          }
        } else if (approved === false) {
          const entitasEmailsList = entitasRecipients.map(r => r.email).filter(Boolean)
          const companyEmailsCombined = Array.from(new Set([
            ...companyEmailsExWarehouse,
            ...warehouseEmails
          ].map(email => (typeof email === 'string' ? email.trim() : '')).filter(Boolean)))
          const borrowerEmail = (() => {
            try {
              if (loan.borrowerEmail && String(loan.borrowerEmail).trim()) {
                return String(loan.borrowerEmail).trim()
              }
            } catch (err) {
              console.warn('[approve] borrowerEmail normalization failed (reject branch)', err)
            }
            return ''
          })()
          const loanPayloadForReject: any = {
            ...loan,
            approvals: newApprovals
          }
          if (reason) loanPayloadForReject.rejectionReason = reason
          if (note) loanPayloadForReject.rejectionNote = note

          let emailSent = false
          let sentEmails: string[] = []
          try {
            const rejectionResult = await sendRejectionEmails(
              loanPayloadForReject,
              entitasEmailsList,
              companyEmailsCombined,
              borrowerEmail || undefined
            )
            emailSent = rejectionResult?.ok ?? false
            sentEmails = rejectionResult?.sentEmails ?? []
          } catch (err) {
            console.error('[approve] sendRejectionEmails fallback failed', err)
            emailSent = false
          }

          if (emailSent) {
            console.log(`Rejection email sent to ${sentEmails.length} recipients (complete mapping)`)
            const currentTime = new Date().toISOString()
            const normalizeEmail = (value?: string | null) => {
              if (!value) return ''
              return String(value).trim()
            }
            const normalizedSent = sentEmails.map(email => normalizeEmail(email)).filter(Boolean)
            const sentEmailSet = new Set(normalizedSent)
            const updatedApprovalNotifications = { ...(loan.approvalNotifications as any || {}) }

            normalizedSent.forEach(normalizedRecipientEmail => {
              if (!normalizedRecipientEmail) return
              if (updatedApprovalNotifications.companies && typeof updatedApprovalNotifications.companies === 'object') {
                Object.keys(updatedApprovalNotifications.companies).forEach(companyName => {
                  const companyEmails = updatedApprovalNotifications.companies[companyName]
                  if (!companyEmails || typeof companyEmails !== 'object') return
                  Object.keys(companyEmails).forEach(role => {
                    const entry = companyEmails[role]
                    if (entry && entry.email === normalizedRecipientEmail) {
                      entry.sent = true
                      entry.sentAt = currentTime
                    }
                  })
                })
              }

              if (loan.entitasId && updatedApprovalNotifications.entitas && updatedApprovalNotifications.entitas[loan.entitasId]) {
                const entitasEmails = updatedApprovalNotifications.entitas[loan.entitasId]
                if (entitasEmails && typeof entitasEmails === 'object') {
                  Object.keys(entitasEmails).forEach(role => {
                    const entry = entitasEmails[role]
                    if (entry && entry.email === normalizedRecipientEmail) {
                      entry.sent = true
                      entry.sentAt = currentTime
                    }
                  })
                }
              }
            })

            try {
              if (borrowerEmail) {
                if (!updatedApprovalNotifications.borrower) {
                  updatedApprovalNotifications.borrower = { sent: false, email: borrowerEmail }
                }
                if (sentEmailSet.has(borrowerEmail)) {
                  updatedApprovalNotifications.borrower.sent = true
                  updatedApprovalNotifications.borrower.sentAt = currentTime
                }
              }
            } catch (e) {
              /* swallow - defensive */
            }

            try {
              const dataToUpdate: any = { approvals: newApprovals, approvalNotifications: updatedApprovalNotifications, loanStatus: 'Rejected' }
              const updated = await prisma.loan.update({ where: { id }, data: dataToUpdate })
              return res.status(200).json({ message: 'Loan rejected successfully', loan: updated })
            } catch (err) {
              console.warn('Failed to persist rejection update for loan', id, err)
              return res.status(200).json({ message: 'Loan rejected successfully', loan: { ...loan, approvals: newApprovals, approvalNotifications: updatedApprovalNotifications, loanStatus: 'Rejected' } })
            }
          }
        } else {
          // Non-final approval: fall back to the general approval-notification flow
          let emailSent = false
          try {
            emailSent = await emailService.sendLoanApprovalNotification({ ...loan, approvals: newApprovals }, allRecipients, approved, currentUser)
          } catch (err) {
            console.error('[approve] sendLoanApprovalNotification failed', err)
            emailSent = false
          }
          if (emailSent) {
            console.log(`Approval email sent to ${allRecipients.length} recipients (complete mapping)`)
            const currentTime = new Date().toISOString()
            const updatedApprovalNotifications = { ...(loan.approvalNotifications as any || {}) }
            allRecipients.forEach(recipient => {
              // Update company emails in the copy (defensive)
              if (updatedApprovalNotifications.companies && typeof updatedApprovalNotifications.companies === 'object') {
                Object.keys(updatedApprovalNotifications.companies).forEach(companyName => {
                  const companyEmails = updatedApprovalNotifications.companies[companyName]
                  if (!companyEmails || typeof companyEmails !== 'object') return
                  Object.keys(companyEmails).forEach(role => {
                    const entry = companyEmails[role]
                    if (entry && entry.email === recipient.email) {
                      entry.sent = true
                      entry.sentAt = currentTime
                    }
                  })
                })
              }

              // Update entitas emails (defensive)
              if (updatedApprovalNotifications.entitas && updatedApprovalNotifications.entitas[loan.entitasId]) {
                const entitasEmails = updatedApprovalNotifications.entitas[loan.entitasId]
                if (entitasEmails && typeof entitasEmails === 'object') {
                  Object.keys(entitasEmails).forEach(role => {
                    const entry = entitasEmails[role]
                    if (entry && entry.email === recipient.email) {
                      entry.sent = true
                      entry.sentAt = currentTime
                    }
                  })
                }
              }
                   // Update borrower email entry (if present) so we track message status
                    try {
                      if (loan.borrowerEmail && String(loan.borrowerEmail).trim()) {
                        const bEmail = String(loan.borrowerEmail).trim()
                        if (!updatedApprovalNotifications.borrower) {
                          updatedApprovalNotifications.borrower = { sent: false, email: bEmail }
                        }
                        if (updatedApprovalNotifications.borrower && updatedApprovalNotifications.borrower.email === recipient.email) {
                          updatedApprovalNotifications.borrower.sent = true
                          updatedApprovalNotifications.borrower.sentAt = currentTime
                        }
                      }
                    } catch (e) { /* swallow - defensive */ }
            })

            // persist updated approvals + approvalNotifications into DB
            try {
              const dataToUpdate: any = { approvals: newApprovals, approvalNotifications: updatedApprovalNotifications }
              if (approved === true && companiesApproved) {
                dataToUpdate.loanStatus = 'Approved'
              } else if (approved === false) {
                dataToUpdate.loanStatus = 'Rejected'
              }
              const updated = await prisma.loan.update({ where: { id }, data: dataToUpdate })

              // Best-effort: also write MKT Status to Google Sheets on approve=true.
              // (This branch is used for non-final approval notifications, so it must also update Sheets.)
              if ((role === 'marketing' || role === 'superadmin') && approved === true) {
                try {
                  const noteText = (note ?? '').toString().trim()
                  const approvedAtText = formatApprovedAt(currentTime)
                  const statusText = `Status : Disetujui, Disetujui oleh : ${currentUser}, Disetujui pada : ${approvedAtText}, Catatan : ${noteText}`
                  console.debug('[approve] attempting Google Sheets MKT Status update (non-final branch)', { id, role, sheetNeedType: updated?.needType })
                  // fire-and-forget Google Sheets update (best-effort). Do not block response on external call.
                  GoogleSheetsService.updateMktStatusForLoan(updated, statusText)
                    .then(gsUpdated => console.log('GoogleSheetsService.updateMktStatusForLoan result=', gsUpdated))
                    .catch(err => console.warn('Failed to update MKT Status in Google Sheets (non-final branch)', err))
                } catch (err) {
                  console.warn('Failed to update MKT Status in Google Sheets (non-final branch)', err)
                }
              }

              return res.status(200).json({ message: approved ? 'Loan approved successfully' : 'Loan rejected successfully', loan: updated })
            } catch (err) {
              console.warn('Failed to persist approval update for loan', id, err)
              return res.status(200).json({ message: approved ? 'Loan approved successfully' : 'Loan rejected successfully', loan: { ...loan, approvals: newApprovals, approvalNotifications: updatedApprovalNotifications } })
            }
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending approval email notification:', emailError)
      // Don't fail the approval if email fails
    }

    // No email or email sending failed. Persist approvals (and any approvalNotifications changes) to DB in all cases.
    try {
      const finalApprovalNotifications = (loan.approvalNotifications as any) || {}
      const dataToUpdate: any = { approvals: newApprovals, approvalNotifications: finalApprovalNotifications }
      if (approved === true && companiesApproved) {
        dataToUpdate.loanStatus = 'Approved'
      } else if (approved === false) {
        dataToUpdate.loanStatus = 'Rejected'
      }
      const final = await prisma.loan.update({ where: { id }, data: dataToUpdate })

      // Whenever Marketing (or Superadmin acting on approvals) approves (approved=true),
      // also update the MKT Status in Google Sheets.
      // This is best-effort and must not block the approval flow.
      if ((role === 'marketing' || role === 'superadmin') && approved === true) {
        try {
          const noteText = (note ?? '').toString().trim()
          const approvedAtText = formatApprovedAt(currentTime)
          const statusText = `Status : Disetujui, Disetujui oleh : ${currentUser}, Disetujui pada : ${approvedAtText}, Catatan : ${noteText}`
          console.debug('[approve] attempting Google Sheets MKT Status update (post-persist)', { id, role, sheetNeedType: final?.needType })
          // fire-and-forget Google Sheets update (best-effort). Do not block response on external call.
          GoogleSheetsService.updateMktStatusForLoan(final, statusText)
            .then(gsUpdated => console.log('GoogleSheetsService.updateMktStatusForLoan result=', gsUpdated))
            .catch(err => console.warn('Failed to update MKT Status in Google Sheets after final approval (post-persist)', err))
        } catch (err) {
          console.warn('Failed to update MKT Status in Google Sheets after final approval (post-persist)', err)
        }
      }

      return res.status(200).json({ message: approved ? 'Loan approved successfully' : 'Loan rejected successfully', loan: final })
    } catch (err) {
      console.warn('Failed to persist final approval state for loan', id, err)
      // return best-effort object (loan from DB + new approvals applied locally)
      return res.status(200).json({ message: approved ? 'Loan approved successfully' : 'Loan rejected successfully', loan: { ...loan, approvals: newApprovals } })
    }

  } catch (error: any) {
    console.error('Error processing approval:', error?.message ?? error, error?.stack ?? '')
    // Include stack in dev so debugging is easier when testing locally
    const payload: any = { message: 'Terjadi kesalahan saat memproses approval' }
    if (process.env.NODE_ENV !== 'production') payload.error = String(error?.stack ?? error?.message ?? error)
    return res.status(500).json(payload)
  }
}