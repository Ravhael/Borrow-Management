import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { getCanonicalRole } from '../../../../config/roleConfig'
import { emailService, sendReturnRejectionEmails } from '../../../../utils/emailService'
import { CUSTOM_RETURN_STATUS, RETURN_STATUS_TOKENS, WAREHOUSE_STATUS } from '../../../../types/loanStatus'
import { GoogleSheetsService } from '../../../../utils/googleSheetsService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startedAt = Date.now()
  const requestLabel = `[request-return-action:${req.query?.id ?? 'unknown'}]`
  const logStep = (step: string) => console.info(`${requestLabel} ${step} +${Date.now() - startedAt}ms`)
  let clientAborted = false
  req.on('close', () => {
    clientAborted = true
    console.warn(`${requestLabel} client connection closed (aborted) +${Date.now() - startedAt}ms`)
  })

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ message: 'ID is required' })
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

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

    const session = (await getServerSession(req as any, res as any, authOptions as any)) as any
    logStep('session fetched')
    if (!session || !session.user || !session.user.id) return res.status(401).json({ message: 'Not authenticated' })
    const role = getCanonicalRole(session.user?.role)
    if (!['gudang','admin','superadmin'].includes(role)) return res.status(403).json({ message: 'Not allowed' })

    const bodyRaw = (req as any).body
    const body = typeof bodyRaw === 'string' ? (bodyRaw ? JSON.parse(bodyRaw) : {}) : bodyRaw || {}
    logStep('body parsed (built-in)')

    const { action, requestId, note, condition } = body || {}
    if (!action || !requestId) return res.status(400).json({ message: 'action and requestId are required' })

    // support legacy action names and newer explicit statuses
    const allowedActions = ['approve','reject','confirm','returnaccepted','return_rejected','completed']
    const normAction = String(action).toLowerCase()
    if (!allowedActions.includes(normAction)) return res.status(400).json({ message: 'Invalid action' })

    const loan = await prisma.loan.findUnique({ where: { id } })
    logStep('loan fetched')
    if (!loan) return res.status(404).json({ message: 'Loan not found' })
    const currentWarehouseStatus = (loan.warehouseStatus ?? {}) as Record<string, any>

    const collectReturnNotificationTargets = async () => {
      const returnNotifications: any = { entitas: {}, companies: {} }
      const entitasEmails = new Set<string>()
      const companyEmails = new Set<string>()
      const borrowerEmail = loan.borrowerEmail && String(loan.borrowerEmail).trim()

      if (loan.entitasId) {
        try {
          const entitasData = await prisma.entitas.findUnique({ where: { code: String(loan.entitasId) } })
          returnNotifications.entitas[loan.entitasId] = {}
          const entitasEmailMap = (entitasData?.emails ?? {}) as Record<string, string>
          Object.entries(entitasEmailMap).forEach(([role, email]) => {
            const trimmed = String(email || '').trim()
            if (!trimmed) return
            entitasEmails.add(trimmed)
            returnNotifications.entitas[loan.entitasId][role] = { sent: false, email: trimmed }
          })
        } catch (err) {
          console.warn('Unable to fetch entitas emails for return notification', err)
        }
      }

      if (loan.company && Array.isArray(loan.company) && loan.company.length > 0) {
        try {
          const rows = await prisma.mktCompany.findMany({ where: { value: { in: loan.company } } })
          rows.forEach(row => {
            if (!returnNotifications.companies[row.value]) {
              returnNotifications.companies[row.value] = {}
            }
            Object.entries((row.emails as any) || {}).forEach(([roleName, email]) => {
              const trimmed = String(email || '').trim()
              if (!trimmed) return
              companyEmails.add(trimmed)
              returnNotifications.companies[row.value][roleName] = { sent: false, email: trimmed }
            })
          })
        } catch (err) {
          console.warn('Unable to fetch company emails for return notification', err)
        }
      }

      if (borrowerEmail) {
        returnNotifications.borrower = { sent: false, email: borrowerEmail }
      }

      return {
        returnNotifications,
        entitasEmailList: Array.from(entitasEmails),
        companyEmailList: Array.from(companyEmails),
        borrowerEmail: borrowerEmail || null
      }
    }

    const currentRequests = Array.isArray((loan as any).returnRequest) ? (loan as any).returnRequest : []
    const idx = currentRequests.findIndex((r: any) => String(r.id) === String(requestId))
    if (idx === -1) return res.status(404).json({ message: 'Return request not found' })

    const now = new Date().toISOString()
    const processedBy = String(session.user.name || session.user.username || 'Warehouse Staff')

    // Keep an immutable copy of existing requests and locate the original request
    // We'll append processing events (accept/reject/complete) as new entries so that
    // the original request (submitted by borrower) is preserved in history.
    const nextRequests = currentRequests.map((r: any) => ({ ...r }))
    const target = nextRequests[idx]

    const cloneReturnHistory = () => {
      if (Array.isArray((dataToUpdate as any)?.returnStatus?.history)) {
        return [...((dataToUpdate as any).returnStatus.history as any[])]
      }
      if (Array.isArray((loan as any)?.returnStatus?.history)) {
        return [...((loan as any).returnStatus.history as any[])]
      }
      return [] as any[]
    }

    const buildHistoryEntry = (statusValue: string, noteValue?: string, conditionValue?: string) => ({
      status: statusValue,
      note: noteValue ?? undefined,
      processedAt: now,
      processedBy,
      condition: conditionValue ?? undefined
    })

    const buildReturnMetadata = (statusValue: string, noteValue?: string, conditionValue?: string) => {
      const historyEntries = cloneReturnHistory()
      historyEntries.push(buildHistoryEntry(statusValue, noteValue, conditionValue))

      const previousStatus =
        (dataToUpdate as any)?.returnStatus?.status ||
        (loan as any)?.returnStatus?.status ||
        (loan as any)?.warehouseStatus?.status

      return {
        status: statusValue,
        previousStatus: previousStatus ?? WAREHOUSE_STATUS.BORROWED,
        note: noteValue ?? undefined,
        processedAt: now,
        processedBy,
        condition: conditionValue ?? undefined,
        history: historyEntries
      }
    }

    let dataToUpdate: any = { returnRequest: nextRequests }

    let returnAcceptedEvent: null | {
      status: string
      processedBy: string
      processedAt: string
      processedNote: string
      condition?: string
    } = null

    let completedEvent: null | {
      status: string
      processedBy: string
      processedAt: string
      processedNote: string
      condition?: string
      noFine?: boolean
    } = null

    let backgroundEmailContext: null | {
      loanId: string
      loanSnapshot: any
      entitasEmailList: string[]
      companyEmailList: string[]
      borrowerEmail: string | null
      processedBy: string
      processedAt: string
      note?: string
      condition?: string
      noFine?: boolean
      event: 'returnAccepted' | 'completed'
    } = null

    let returnRejectedContext: null | {
      loanId: string
      loanSnapshot: any
      entitasEmailList: string[]
      companyEmailList: string[]
      borrowerEmail: string | null
      processedBy: string
      processedAt: string
      note?: string
    } = null

    const COMPLETE_CONDITIONS = new Set(['dikembalikan lengkap'])
    const FOLLOW_UP_CONDITIONS = new Set(['dikembalikan rusak/cacat'])
    const FOLLOW_UP_STATUS = RETURN_STATUS_TOKENS.FOLLOW_UP
    const FOLLOW_UP_LABEL = CUSTOM_RETURN_STATUS.FOLLOW_UP
    const normalizeCondition = (value?: string | null) => (value ? String(value).trim().toLowerCase() : '')
    const normalizedCondition = normalizeCondition(condition)

    // Map the action into a clear return-request status
    if (normAction === 'approve' || normAction === 'returnaccepted' || normAction.includes('accept')) {
      // If condition indicates final completion without fines, treat as completed
      if (normalizedCondition && COMPLETE_CONDITIONS.has(normalizedCondition)) {
        const completedEntry = {
          id: `rr_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          status: 'completed',
          processedAt: now,
          processedBy,
          processedNote: note && String(note).trim() ? String(note).trim() : undefined,
          condition: condition ? String(condition) : undefined,
          requestedAt: target?.requestedAt ?? undefined,
          requestedBy: target?.requestedBy ?? undefined,
          requestId: target?.id ?? undefined
        }
        nextRequests.push(completedEntry)

        completedEvent = {
          status: String(completedEntry.status || 'completed'),
          processedBy: String(completedEntry.processedBy || processedBy),
          processedAt: String(completedEntry.processedAt || now),
          processedNote: String(completedEntry.processedNote || ''),
          condition: completedEntry.condition ? String(completedEntry.condition) : undefined,
          noFine: true
        }

        const currentWarehouse = (loan.warehouseStatus as any) || { status: WAREHOUSE_STATUS.BORROWED }
        const historyEntries = cloneReturnHistory()
        historyEntries.push(buildHistoryEntry('completed', completedEntry.processedNote, completedEntry.condition))

        const updatedReturnStatus: any = {
          status: WAREHOUSE_STATUS.RETURNED,
          previousStatus: currentWarehouse.status ?? WAREHOUSE_STATUS.BORROWED,
          note: completedEntry.processedNote ?? undefined,
          processedAt: now,
          processedBy,
          photoResults: target?.photoResults ?? [],
          condition: completedEntry.condition ?? undefined,
          noFine: true
        }
        updatedReturnStatus.history = historyEntries

        const notificationTargets = await collectReturnNotificationTargets()
        dataToUpdate.returnStatus = updatedReturnStatus
        dataToUpdate.returnNotifications = notificationTargets.returnNotifications
        dataToUpdate.loanStatus = 'completed'

        backgroundEmailContext = {
          loanId: id,
          loanSnapshot: { ...loan, returnStatus: updatedReturnStatus, returnRequest: nextRequests },
          entitasEmailList: notificationTargets.entitasEmailList,
          companyEmailList: notificationTargets.companyEmailList,
          borrowerEmail: notificationTargets.borrowerEmail,
          processedBy,
          processedAt: now,
          note: updatedReturnStatus.note,
          condition: updatedReturnStatus.condition,
          noFine: true,
          event: 'completed'
        }
      } else if (normalizedCondition && FOLLOW_UP_CONDITIONS.has(normalizedCondition)) {
        const followUpEntry = {
          id: `rr_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          status: FOLLOW_UP_STATUS,
          processedAt: now,
          processedBy,
          processedNote: note && String(note).trim() ? String(note).trim() : undefined,
          condition: condition ? String(condition) : undefined,
          requestedAt: target?.requestedAt ?? undefined,
          requestedBy: target?.requestedBy ?? undefined,
          requestId: target?.id ?? undefined
        }
        nextRequests.push(followUpEntry)
        dataToUpdate.loanStatus = FOLLOW_UP_STATUS
        const followUpStatus = buildReturnMetadata(FOLLOW_UP_STATUS, followUpEntry.processedNote, followUpEntry.condition)
        ;(followUpStatus as any).displayStatus = FOLLOW_UP_LABEL
        ;(followUpStatus as any).finePaused = true
        dataToUpdate.returnStatus = followUpStatus

        returnAcceptedEvent = {
          status: FOLLOW_UP_LABEL,
          processedBy: String(followUpEntry.processedBy || processedBy),
          processedAt: String(followUpEntry.processedAt || now),
          processedNote: String(followUpEntry.processedNote || ''),
          condition: followUpEntry.condition ? String(followUpEntry.condition) : undefined
        }

        const notificationTargets = await collectReturnNotificationTargets()
        dataToUpdate.returnNotifications = notificationTargets.returnNotifications
        backgroundEmailContext = {
          loanId: id,
          loanSnapshot: { ...loan, returnStatus: dataToUpdate.returnStatus, returnRequest: nextRequests },
          entitasEmailList: notificationTargets.entitasEmailList,
          companyEmailList: notificationTargets.companyEmailList,
          borrowerEmail: notificationTargets.borrowerEmail,
          processedBy,
          processedAt: now,
          note: followUpEntry.processedNote,
          condition: followUpEntry.condition,
          event: 'returnAccepted'
        }
      } else {
        // mark as accepted/acknowledged by warehouse (not yet fully completed)
        // append a new processing entry rather than mutating the original request
        const newEntry = {
          id: `rr_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          status: 'returnAccepted',
          processedAt: now,
          processedBy,
          processedNote: note && String(note).trim() ? String(note).trim() : undefined,
          // optional condition chosen by warehouse staff (e.g. 'Dikembalikan Lengkap')
          condition: condition ? String(condition) : undefined,
          requestedAt: target?.requestedAt ?? undefined,
          requestedBy: target?.requestedBy ?? undefined,
          // reference the original request id to avoid copying large arrays like photoResults
          requestId: target?.id ?? undefined
        }
        nextRequests.push(newEntry)
        dataToUpdate.loanStatus = 'returnAccepted'
        dataToUpdate.returnStatus = buildReturnMetadata('returnAccepted', newEntry.processedNote, newEntry.condition)

        returnAcceptedEvent = {
          status: String(newEntry.status || 'returnAccepted'),
          processedBy: String(newEntry.processedBy || processedBy),
          processedAt: String(newEntry.processedAt || now),
          processedNote: String(newEntry.processedNote || ''),
          condition: newEntry.condition ? String(newEntry.condition) : undefined
        }

        const notificationTargets = await collectReturnNotificationTargets()
        dataToUpdate.returnNotifications = notificationTargets.returnNotifications
        backgroundEmailContext = {
          loanId: id,
          loanSnapshot: { ...loan, returnStatus: dataToUpdate.returnStatus, returnRequest: nextRequests },
          entitasEmailList: notificationTargets.entitasEmailList,
          companyEmailList: notificationTargets.companyEmailList,
          borrowerEmail: notificationTargets.borrowerEmail,
          processedBy,
          processedAt: now,
          note: newEntry.processedNote,
          event: 'returnAccepted'
        }
      }
    } else if (normAction === 'reject' || normAction === 'return_rejected' || normAction.includes('reject')) {
      // append a reject event preserving the previous request entry
      const newEntry = {
        id: `rr_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        status: 'return_rejected',
        processedAt: now,
        processedBy,
        processedNote: note && String(note).trim() ? String(note).trim() : undefined,
        requestedAt: target?.requestedAt ?? undefined,
        requestedBy: target?.requestedBy ?? undefined,
        requestId: target?.id ?? undefined
      }
      nextRequests.push(newEntry)
      dataToUpdate.loanStatus = WAREHOUSE_STATUS.BORROWED
      dataToUpdate.returnStatus = buildReturnMetadata('return_rejected', newEntry.processedNote)
      if (dataToUpdate.returnStatus) {
        dataToUpdate.returnStatus.previousStatus = WAREHOUSE_STATUS.BORROWED
      }

      const revertedWarehouseStatus = {
        ...currentWarehouseStatus,
        status: WAREHOUSE_STATUS.BORROWED,
        processedAt: now,
        processedBy,
        note: newEntry.processedNote ?? (currentWarehouseStatus?.note ?? undefined)
      }
      dataToUpdate.warehouseStatus = revertedWarehouseStatus

      const notificationTargets = await collectReturnNotificationTargets()
      dataToUpdate.returnNotifications = notificationTargets.returnNotifications
      returnRejectedContext = {
        loanId: id,
        loanSnapshot: { ...loan, returnStatus: dataToUpdate.returnStatus, returnRequest: nextRequests, loanStatus: WAREHOUSE_STATUS.BORROWED, warehouseStatus: revertedWarehouseStatus },
        entitasEmailList: notificationTargets.entitasEmailList,
        companyEmailList: notificationTargets.companyEmailList,
        borrowerEmail: notificationTargets.borrowerEmail,
        processedBy,
        processedAt: now,
        note: newEntry.processedNote
      }
    }
    // Finalize the return flow - previously 'confirm', now also accept 'completed'
    if (normAction === 'confirm' || normAction === 'completed' || normAction.includes('complete')) {
      // append a completed entry so earlier statuses remain intact
      const completedEntry = {
        id: `rr_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        status: 'completed',
        processedAt: now,
        processedBy,
        processedNote: note && String(note).trim() ? String(note).trim() : undefined,
        requestedAt: target?.requestedAt ?? undefined,
        requestedBy: target?.requestedBy ?? undefined,
        requestId: target?.id ?? undefined
      }
      nextRequests.push(completedEntry)

      completedEvent = {
        status: String(completedEntry.status || 'completed'),
        processedBy: String(completedEntry.processedBy || processedBy),
        processedAt: String(completedEntry.processedAt || now),
        processedNote: String(completedEntry.processedNote || '')
      }
      const currentWarehouse = (loan.warehouseStatus as any) || { status: WAREHOUSE_STATUS.BORROWED }
      const historyEntries = cloneReturnHistory()
      historyEntries.push(buildHistoryEntry('completed', completedEntry.processedNote))

      const updatedReturnStatus: any = {
        status: WAREHOUSE_STATUS.RETURNED,
        previousStatus: currentWarehouse.status ?? WAREHOUSE_STATUS.BORROWED,
        note: completedEntry.processedNote ?? undefined,
        processedAt: now,
        processedBy,
        // Keep top-level photoResults on returnStatus but reference original request's photos
        photoResults: target?.photoResults ?? []
      }
      updatedReturnStatus.history = historyEntries

      const notificationTargets = await collectReturnNotificationTargets()
      dataToUpdate.returnStatus = updatedReturnStatus
      dataToUpdate.returnNotifications = notificationTargets.returnNotifications
      // Set a top-level loan status indicating the loan has been completed/returned
      dataToUpdate.loanStatus = 'completed'

      // We'll perform notification sends in background after we update the DB
      // capture values we need to pass to the background worker
      backgroundEmailContext = {
        loanId: id,
        loanSnapshot: { ...loan, returnStatus: updatedReturnStatus, returnRequest: nextRequests },
        entitasEmailList: notificationTargets.entitasEmailList,
        companyEmailList: notificationTargets.companyEmailList,
        borrowerEmail: notificationTargets.borrowerEmail,
        processedBy,
        processedAt: now,
        note: updatedReturnStatus.note,
        event: 'completed'
      }
    }

    // Update the loan record first — keep the HTTP response fast
    const updatedLoan = await prisma.loan.update({ where: { id }, data: dataToUpdate })
    logStep('loan updated')

    // Best-effort Google Sheets update for Return Accepted (do not block approve flow)
    if (returnAcceptedEvent) {
      try {
        const text = `Status : ${returnAcceptedEvent.status}${returnAcceptedEvent.condition ? ` (${returnAcceptedEvent.condition})` : ''}, Diproses oleh : ${returnAcceptedEvent.processedBy}, Diproses pada : ${formatProcessedAt(returnAcceptedEvent.processedAt)}, Catatan : ${returnAcceptedEvent.processedNote}`
        console.log('[request-return-action] attempting Return Accepted sheet update', { loanId: id, needType: (updatedLoan as any).needType })
        const ok = await GoogleSheetsService.updateReturnAcceptedForLoan(updatedLoan, text)
        console.log('[request-return-action] Return Accepted sheet update result', { ok, loanId: id })
      } catch (err) {
        console.error('[request-return-action] Return Accepted sheet update failed (ignored)', err)
      }
    }

    // Best-effort Google Sheets update for Completed (do not block complete flow)
    if (completedEvent) {
      try {
        const text = `Status : ${completedEvent.status}${completedEvent.condition ? ` (${completedEvent.condition})` : ''}, Diproses oleh : ${completedEvent.processedBy}, Diproses pada : ${formatProcessedAt(completedEvent.processedAt)}, Catatan : ${completedEvent.processedNote}`
        console.log('[request-return-action] attempting Completed sheet update', { loanId: id, needType: (updatedLoan as any).needType })
        const ok = await GoogleSheetsService.updateCompletedForLoan(updatedLoan, text)
        console.log('[request-return-action] Completed sheet update result', { ok, loanId: id })
      } catch (err) {
        console.error('[request-return-action] Completed sheet update failed (ignored)', err)
      }
    }

    if (backgroundEmailContext) {
      const ctx = backgroundEmailContext
      setImmediate(async () => {
        try {
          console.info('[request-return-action] background: starting notification sends for loan', id)

          const sendForAudience = async (emails: string[] | undefined, label: 'Entitas' | 'Company' | 'Borrower') => {
            if (!emails || !emails.length) return
            if (ctx.event === 'completed') {
              await emailService.sendLoanCompletedNotification(ctx.loanSnapshot, emails, label, {
                completedBy: ctx.processedBy,
                completedAt: ctx.processedAt,
                note: ctx.note,
                conditionNote: ctx.condition
              })
            } else {
              await emailService.sendLoanReturnNotification(ctx.loanSnapshot, emails, label, {
                processedBy: ctx.processedBy,
                processedAt: ctx.processedAt,
                note: ctx.note,
                condition: ctx.condition
              })
            }
          }

          await sendForAudience(ctx.entitasEmailList, 'Entitas')
          await sendForAudience(ctx.companyEmailList, 'Company')
          if (ctx.borrowerEmail) {
            await sendForAudience([ctx.borrowerEmail], 'Borrower')
          }

          try {
            await prisma.loan.update({ where: { id }, data: { returnNotifications: updatedLoan.returnNotifications } })
          } catch (e) {
            console.warn('[request-return-action] background: unable to persist notification status', e)
          }

          console.info('[request-return-action] background: completed notification sends for loan', id)
        } catch (err) {
          console.warn('[request-return-action] background notification error', err)
        }
      })
    }

    if (returnRejectedContext) {
      const ctx = returnRejectedContext
      setImmediate(async () => {
        try {
          console.info('[request-return-action] background: starting return rejection notifications for loan', ctx.loanId)
          const ok = await sendReturnRejectionEmails(
            ctx.loanSnapshot,
            ctx.entitasEmailList,
            ctx.companyEmailList,
            ctx.borrowerEmail
          )
          if (!ok) {
            console.warn('[request-return-action] background: some return rejection notifications failed for loan', ctx.loanId)
          }
        } catch (err) {
          console.warn('[request-return-action] background return rejection notification error', err)
        }
      })
    }

    const payload = { message: 'Return request updated', loan: updatedLoan }
    if (clientAborted) {
      console.warn(`${requestLabel} client aborted before response, but operation succeeded`)
      return res.status(200).json(payload)
    }
    logStep('response sent')
    return res.status(200).json(payload)
  } catch (err) {
    console.error('Error in request-return-action', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
