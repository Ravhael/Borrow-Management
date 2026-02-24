import { NextApiRequest, NextApiResponse } from 'next'
import formidable, { File as FormidableFile } from 'formidable'
import fs from 'fs'
import path from 'path'
// file-based loans.json not used at runtime — we operate on DB via Prisma
import { prisma } from '../../../../lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { WAREHOUSE_STATUS } from '../../../../types/loanStatus'
import { emailService, sendWarehouseSubmitRejectEmails } from '../../../../utils/emailService'
import { getCanonicalRole } from '../../../../config/roleConfig'
import { GoogleSheetsService } from '../../../../utils/googleSheetsService'

// data/loans.json is a seed fixture only — runtime uses the Loans DB table

interface LoanData {
  id: string
  submittedAt: string
  borrowerName: string
  entitasId: string
  borrowerPhone: string
  borrowerEmail?: string
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
  lainnya?: string
  approvals?: {
    companies: Record<string, {
      approved: boolean;
      approvedBy?: string;
      approvedAt?: string;
      rejectionReason?: string;
    }>;
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
  returnNotifications?: {
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
  warehouseStatus?: {
    status: string;
    processedAt?: string;
    processedBy?: string;
    rejectionReason?: string;
    returnedAt?: string;
    returnedBy?: string;
    note?: string;
    history?: WarehouseHistoryEntry[];
  };
  userId?: string;
}

interface WarehouseHistoryEntry {
  id: string
  action: string
  status: string
  processedAt: string
  processedBy?: string
  note?: string
  reason?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'ID is required' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const loan = await prisma.loan.findUnique({ where: { id } })
    if (!loan) return res.status(404).json({ message: 'Loan not found' })
    // Accept either JSON or multipart form-data (for file uploads)
    let action: string | undefined
    let status: string | undefined
    let reason: string | undefined
    let note: string | undefined
    let uploadedFiles: FormidableFile[] = []
    const backgroundTasks: Array<{ label: string; run: () => Promise<void> }> = []
    let pendingWarehouseNotification: {
      entitasEmails: string[]
      companyEmails: string[]
      processedInfo: { processedBy?: string; processedAt?: string; note?: string }
      variant: 'processed' | 'warehouse-reject'
    } | null = null

    // File limits to avoid long-running uploads or memory/IO spikes that may cause proxy errors
    const MAX_FILES = 6
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB per file

    // If Content-Type is multipart/form-data then parse with formidable
    const contentType = String(req.headers['content-type'] || '').toLowerCase().trim()
    // treat anything containing multipart/form-data as multipart (boundary param will be present)
    if (contentType.includes('multipart/form-data')) {
      // parse form with limits; attach listeners for early failures
      await new Promise<void>((resolve, reject) => {
        const form = formidable({ multiples: true, keepExtensions: true, maxFileSize: MAX_FILE_SIZE })
        form.on('error', (err) => {
          console.warn('[warehouse] formidable error while parsing multipart', err)
          reject(err)
        })
        form.on('fileBegin', (name, file) => {
          try {
            // defensive file name normalization + guard for number of files
            if (!file || !file.originalFilename) return
            // Formidable may stream files; we don't allow too many files
          } catch (e) {
            // ignore
          }
        })
        form.parse(req as any, (err, fields, files) => {
          if (err) return reject(err)
          try {
            // fields may be string or string[], prefer the first if it's an array
            const getFirst = (v: any) => Array.isArray(v) ? v[0] : v
            action = getFirst(fields.action) as string | undefined
            status = getFirst(fields.status) as string | undefined
            reason = getFirst(fields.reason) as string | undefined
            note = getFirst(fields.note) as string | undefined

            // files may be single File or array depending on multiples
            const filesObj = files as any
            if (filesObj) {
              // collect any file entries across all keys (support different client names)
              Object.values(filesObj).forEach((maybe) => {
                if (!maybe) return
                if (Array.isArray(maybe)) uploadedFiles.push(...maybe as FormidableFile[])
                else uploadedFiles.push(maybe as FormidableFile)
              })
            }

            // Validate number and sizes as soon as possible
            if (uploadedFiles.length > MAX_FILES) return reject(new Error(`Too many files uploaded (max ${MAX_FILES})`))
            const large = uploadedFiles.find(f => (f.size ?? 0) > MAX_FILE_SIZE)
            if (large) return reject(new Error('File too large'))

            resolve()
          } catch (e) {
            reject(e)
          }
        })
      })
    } else {
      // Next.js bodyParser is disabled for this route (to allow formidable for multipart).
      // For non-multipart requests (JSON) we need to read the raw body ourselves and parse it.
      const rawBody = await new Promise<string>((resolve, reject) => {
        let data = ''
        req.on('data', (chunk) => { data += chunk })
        req.on('end', () => resolve(data))
        req.on('error', reject)
      })

      let parsed: any = {}
      if (rawBody && rawBody.length > 0) {
        try {
          parsed = JSON.parse(rawBody)
        } catch (err) {
          // invalid json — fallback to empty parsed body and let validation handle missing action
          console.warn('Failed to parse JSON body in warehouse handler', err)
        }
      }

      action = parsed.action
      status = parsed.status
      reason = parsed.reason
      note = parsed.note

      // allow action to come from query string (some callers or clients may issue a POST without body)
      if (!action && req.query?.action) {
        action = String(req.query.action)
      }
    }

    // Initialize warehouseStatus if not exists (in local copy)
    const currentWarehouse = (loan.warehouseStatus as any) || { status: WAREHOUSE_STATUS.PENDING }
    const historyEntries: WarehouseHistoryEntry[] = Array.isArray(currentWarehouse.history)
      ? [...currentWarehouse.history]
      : []

    const now = new Date().toISOString()

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
    // Try to resolve the real user name + role from the authenticated session. Fall back to readable defaults.
    let processedBy = 'Warehouse Staff'
    // getCanonicalRole() returns UserRole keys (e.g. 'gudang', 'superadmin', ...)
    let canonicalRole = 'gudang'
    try {
      const session = await getServerSession(req, res, authOptions as any) as any
      if (session && session.user) {
        processedBy = session.user.name || session.user.username || processedBy
        canonicalRole = getCanonicalRole(session?.user?.role) || canonicalRole
      }
    } catch (err) {
      // keep fallback label on any error — do not block the request
      console.warn('Unable to read session for warehouse handler; using fallback processedBy', err)
    }

    let updatedWarehouse: any = { ...currentWarehouse }
    // prepare returnStatus object which will be persisted at top-level when return occurs
    let updatedReturnStatus: any = undefined
    // normalize action
    const normAction = typeof action === 'string' ? action.toLowerCase().trim() : action

    const appendHistoryEntry = (entry: Partial<WarehouseHistoryEntry> & { status: string; action: string }) => {
      const uniqueId = `${entry.action}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      historyEntries.push({
        id: uniqueId,
        processedAt: entry.processedAt || now,
        processedBy: entry.processedBy || processedBy,
        note: entry.note,
        reason: entry.reason,
        status: entry.status,
        action: entry.action
      })
    }

    // helpful debug when action is missing — this makes it clearer in the response / logs why we returned 400
    if (!normAction) {
      const debugPayload = {
        headers: req.headers['content-type'],
        query: req.query,
        noteLength: note ? String(note).length : 0,
        uploadedFilesCount: uploadedFiles?.length || 0
      }
      console.warn('Warehouse handler missing action. Debug:', JSON.stringify(debugPayload))
      return res.status(400).json({ message: 'Invalid action', debug: debugPayload })
    }

    switch (normAction) {
      case 'process':
        updatedWarehouse = {
          ...currentWarehouse,
          status: WAREHOUSE_STATUS.BORROWED,
          processedAt: now,
          processedBy,
          ...(note ? { note } : {})
        }
        appendHistoryEntry({ action: 'process', status: WAREHOUSE_STATUS.BORROWED, note })
        break
        break

      case 'reject':
        updatedWarehouse = {
          ...currentWarehouse,
          status: WAREHOUSE_STATUS.REJECTED,
          processedAt: now,
          processedBy,
          rejectionReason: reason,
          ...(note ? { note } : {})
        }
        appendHistoryEntry({ action: 'reject', status: WAREHOUSE_STATUS.REJECTED, note, reason })
        break

      case 'return':
        // Keep warehouseStatus focused on the warehouse processing state (e.g. 'Dipinjam').
        // Do NOT overwrite warehouseStatus.status / returnedAt / returnedBy with return-specific data.
        // Return processing results are kept in the separate returnStatus object and top-level returnNotifications.
        updatedWarehouse = {
          ...currentWarehouse,
          // preserve any note on warehouseStatus (do not overwrite with return note)
          ...(note ? { note: currentWarehouse.note || note } : {})
        }
        // build returnStatus: the recorded status for the return should be the NEW return status
        // preserve the previous status in `previousStatus` for auditing/context
        updatedReturnStatus = {
          status: WAREHOUSE_STATUS.RETURNED,
          previousStatus: (currentWarehouse.status ?? WAREHOUSE_STATUS.BORROWED),
          note: note ?? undefined,
          processedAt: now,
          processedBy,
          photoResults: []
        }
        appendHistoryEntry({ action: 'return', status: WAREHOUSE_STATUS.RETURNED, note })
        // if files were uploaded, validate them and save them under public/uploads/loans/<id>/ and add metadata to warehouse status
        if (uploadedFiles && uploadedFiles.length > 0) {
          // server-side validation
          const MAX_FILES = 6
          const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
          if (uploadedFiles.length > MAX_FILES) {
            // cleanup tmp files
            uploadedFiles.forEach(f => {
              try { fs.unlinkSync(String((f.filepath as string) || (f.file as string))) } catch (e) {}
            })
            return res.status(400).json({ message: `Maksimum ${MAX_FILES} file diperbolehkan` })
          }
          const invalidSize = uploadedFiles.find(f => (f.size ?? 0) > MAX_FILE_SIZE)
          if (invalidSize) {
            uploadedFiles.forEach(f => { try { fs.unlinkSync(String((f.filepath as string) || (f.file as string))) } catch (e) {} })
            return res.status(400).json({ message: 'Beberapa file terlalu besar — maksimum 5MB per file' })
          }
          const invalidType = uploadedFiles.find(f => !(String(f.mimetype || '').startsWith('image/')))
          if (invalidType) {
            uploadedFiles.forEach(f => { try { fs.unlinkSync(String((f.filepath as string) || (f.file as string))) } catch (e) {} })
            return res.status(400).json({ message: 'Tipe file tidak valid — hanya gambar diperbolehkan' })
          }
          try {
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'loans', String(id))
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

            const savedFiles = uploadedFiles.map(f => {
              // f has filepath property, originalFilename
              const originalName = (f.originalFilename as string) || (f.originalname as string) || path.basename(String(f.filepath || f.file || f.path || 'upload'))
              const tmpPath = (f.filepath as string) || (f.file as string) || (f.path as string) || (f.tempFilePath as string)
              const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
              const dest = path.join(uploadsDir, safeName)
              // move file (rename) if we have a tmpPath; otherwise skip
              if (tmpPath) {
                try {
                  fs.renameSync(tmpPath, dest)
                } catch (err) {
                  // attempt copy if rename fails
                  try { fs.copyFileSync(tmpPath, dest); fs.unlinkSync(tmpPath) } catch (e) { /* ignore */ }
                }
              }
              const publicUrlPath = `/uploads/loans/${id}/${safeName}`
              const publicUrl = require('../../../../utils/basePath').withBasePath(publicUrlPath)
              return { filename: originalName, url: publicUrl }
            })

            // store files only on the top-level returnStatus / top-level fields; do not attach returnProofFiles to warehouseStatus

                // Build a returnStatus object that records the return processing result and photo/file results.
                // Normalize: ensure returnStatus.status always reflects the new returned state.
                // Older records may have previously stored the PREVIOUS status under `status` (causing UI to show e.g. "Dipinjam"
                // as the return label). Fix that here by moving that value into `previousStatus` and setting `status` -> Returned.
                updatedReturnStatus.photoResults = savedFiles || []
                // If outdated data exists where `status` was the previous state, ensure we preserve it in `previousStatus`.
                if (updatedReturnStatus.status && updatedReturnStatus.status !== WAREHOUSE_STATUS.RETURNED) {
                  updatedReturnStatus.previousStatus = updatedReturnStatus.previousStatus || updatedReturnStatus.status
                  updatedReturnStatus.status = WAREHOUSE_STATUS.RETURNED
                }
            // NOTE: keep returnStatus / proof files only in updatedReturnStatus (top-level), not inside warehouseStatus
          } catch (err) {
            console.warn('Failed to save uploaded return files', err)
            // Surface the failure to the client so UI can show a specific message
            return res.status(500).json({ message: 'Gagal menyimpan file bukti pengembalian. Mohon coba lagi atau laporkan ke admin.' })
          }
        }
        break

      default:
        return res.status(400).json({ message: 'Invalid action' })
    }

    // Prepare notifications for return action
    let returnNotifications: any = (loan.returnNotifications as any) || { entitas: {}, companies: {} }

    // Send warehouse process/reject notifications to company, entitas and borrower
    if (normAction === 'process' || normAction === 'reject') {
      const entitasEmailSet = new Set<string>()
      const companyEmailSet = new Set<string>()
      try {
        if (loan.entitasId) {
          const entitasData = await prisma.entitas.findUnique({ where: { code: String(loan.entitasId) } })
          const entitasEmails = (entitasData?.emails ?? {}) as Record<string, string>
          Object.entries(entitasEmails).forEach(([role, email]) => {
            const trimmed = String(email || '').trim()
            if (!trimmed) return
            entitasEmailSet.add(trimmed)
          })
        }
      } catch (err) {
        console.warn('Unable to fetch entitas emails for warehouse notification', loan.entitasId, err)
      }

      if (loan.company && Array.isArray(loan.company) && loan.company.length > 0) {
        try {
          const rows = await prisma.mktCompany.findMany({ where: { value: { in: loan.company } } })
          rows.forEach(r => {
            Object.entries((r.emails as any) || {}).forEach(([role, email]) => {
              const trimmed = String(email || '').trim()
              if (!trimmed) return
              companyEmailSet.add(trimmed)
            })
          })
        } catch (err) {
          console.warn('Unable to fetch company emails for warehouse notification', err)
        }
      }

      const entitasEmails = Array.from(entitasEmailSet)
      const companyEmails = Array.from(companyEmailSet)
      const processedInfo = {
        processedBy,
        processedAt: updatedWarehouse.processedAt || now,
        note: normAction === 'reject' ? (reason ?? note) : (note ?? undefined)
      }

      pendingWarehouseNotification = {
        entitasEmails,
        companyEmails,
        processedInfo,
        variant: normAction === 'process' ? 'processed' : 'warehouse-reject'
      }
    }

    if (action === 'return') {
      const borrowerEmail = loan.borrowerEmail && String(loan.borrowerEmail).trim()
      const entitasEmailSet = new Set<string>()
      const companyEmailSet = new Set<string>()
      const sentAtTimestamp = new Date().toISOString()

      // Initialize return notifications
      returnNotifications = {
        entitas: {},
        companies: {}
      }

      // Collect entitas emails
      returnNotifications.entitas[loan.entitasId] = {}
      try {
        const entitasData = await prisma.entitas.findUnique({ where: { code: String(loan.entitasId) } })
        const entitasEmails = (entitasData?.emails ?? {}) as Record<string, string>
        Object.entries(entitasEmails).forEach(([role, email]) => {
          const trimmed = String(email || '').trim()
          if (!trimmed) return
          entitasEmailSet.add(trimmed)
          returnNotifications.entitas[loan.entitasId][role] = {
            sent: false,
            email: trimmed
          }
        })
      } catch (err) {
        console.warn('Unable to fetch entitas emails for', loan.entitasId, err)
      }

      // Collect company emails
      if (loan.company && Array.isArray(loan.company) && loan.company.length > 0) {
        try {
          const rows = await prisma.mktCompany.findMany({ where: { value: { in: loan.company } } })
          rows.forEach(r => {
            returnNotifications.companies[r.value] = {}
            Object.entries((r.emails as any) || {}).forEach(([role, email]) => {
              const trimmed = String(email || '').trim()
              if (!trimmed) return
              companyEmailSet.add(trimmed)
              returnNotifications.companies[r.value][role] = {
                sent: false,
                email: trimmed
              }
            })
          })
        } catch (err) {
          console.warn('Unable to fetch company emails for return notifications', err)
        }
      }

      if (borrowerEmail) {
        returnNotifications.borrower = {
          sent: false,
          email: borrowerEmail
        }
      }

      // Attempt to send emails so statuses reflect real deliveries
      const entitasEmails = Array.from(entitasEmailSet)
      const companyEmails = Array.from(companyEmailSet)
      const sendContext = {
        processedBy,
        processedAt: updatedReturnStatus?.processedAt || sentAtTimestamp,
        note: updatedReturnStatus?.note || note
      }

      try {
        const baseLoanPayload = { ...loan, returnStatus: updatedReturnStatus }
        const entitasSent = entitasEmails.length
          ? await emailService.sendLoanReturnNotification(baseLoanPayload, entitasEmails, 'Entitas', sendContext)
          : true
        const companySent = companyEmails.length
          ? await emailService.sendLoanReturnNotification(baseLoanPayload, companyEmails, 'Company', sendContext)
          : true
        const borrowerSent = borrowerEmail
          ? await emailService.sendLoanReturnNotification(baseLoanPayload, [borrowerEmail], 'Borrower', sendContext)
          : true

        if (entitasSent) {
          Object.values(returnNotifications.entitas[loan.entitasId] || {}).forEach((entry: any) => {
            entry.sent = true
            entry.sentAt = sentAtTimestamp
          })
        }
        if (companySent) {
          Object.values(returnNotifications.companies || {}).forEach(companyRoles => {
            Object.values(companyRoles as Record<string, any>).forEach((entry: any) => {
              entry.sent = true
              entry.sentAt = sentAtTimestamp
            })
          })
        }
        if (borrowerSent && returnNotifications.borrower) {
          returnNotifications.borrower.sent = true
          returnNotifications.borrower.sentAt = sentAtTimestamp
        }
      } catch (err) {
        console.error('Failed to send return notifications for loan', loan.id, err)
      }
    }
    // persist updated warehouseStatus + returnNotifications if changed
    updatedWarehouse.history = historyEntries

    const dataToUpdate: any = { warehouseStatus: updatedWarehouse }
    // When warehouse processes a loan mark the loanStatus as Borrowed so other views can rely on it
    if (action === 'process') {
      // store English token 'Borrowed' (the UI mapping layer tolerates localized variants)
      dataToUpdate.loanStatus = 'Borrowed'
    }
    if (action === 'reject') {
      dataToUpdate.loanStatus = 'WhRejected'
    }
    if (action === 'return') {
      dataToUpdate.returnNotifications = returnNotifications
      // store the computed returnStatus into its own top-level column (new in schema)
      if (updatedReturnStatus) {
        // final safety/normalization before persisting: ensure status is the returned token and previousStatus preserved
        if (updatedReturnStatus.status && updatedReturnStatus.status !== WAREHOUSE_STATUS.RETURNED) {
          updatedReturnStatus.previousStatus = updatedReturnStatus.previousStatus || updatedReturnStatus.status
          updatedReturnStatus.status = WAREHOUSE_STATUS.RETURNED
        }
        // if no previousStatus provided, default to current warehouse status or Borrowed
        updatedReturnStatus.previousStatus = updatedReturnStatus.previousStatus ?? (currentWarehouse.status ?? WAREHOUSE_STATUS.BORROWED)
        dataToUpdate.returnStatus = updatedReturnStatus
      }
      // persist proof files in the top-level dataToUpdate if present
      // returnProofFiles stored inside warehouseStatus JSON only (don't write top-level field that is not in Prisma schema)
      // Also mark the high-level loanStatus as Returned so other lists (e.g. gudang) can show it
      dataToUpdate.loanStatus = 'Returned'
    }

    const updatedLoan = await prisma.loan.update({ where: { id }, data: dataToUpdate })

    if (pendingWarehouseNotification) {
      const snapshot = pendingWarehouseNotification
      backgroundTasks.push({
        label: 'warehouse-status-emails',
        run: async () => {
          try {
            if (snapshot.variant === 'processed') {
              const sent = await emailService.sendWarehouseStatusNotifications(
                { ...updatedLoan, warehouseStatus: updatedWarehouse },
                snapshot.entitasEmails,
                snapshot.companyEmails,
                'processed',
                snapshot.processedInfo
              )
              if (!sent) {
                throw new Error(`[warehouse] sendWarehouseStatusNotifications returned false for loan ${id}`)
              }
              console.log(`[warehouse] status notification emails sent for loan ${id} action=${normAction}`)
            } else {
              const sentReject = await sendWarehouseSubmitRejectEmails(
                { ...updatedLoan, warehouseStatus: updatedWarehouse },
                snapshot.entitasEmails,
                snapshot.companyEmails,
                snapshot.processedInfo
              )
              if (!sentReject) {
                throw new Error(`[warehouse] sendWarehouseSubmitRejectNotifications returned false for loan ${id}`)
              }
              console.log(`[warehouse] warehouse rejection emails sent for loan ${id}`)
            }
          } catch (err) {
            console.error('Failed to send warehouse status notifications for loan', id, err)
            throw err
          }
        }
      })
    }

    const shouldSyncGoogleSheet = (canonicalRole === 'gudang' || canonicalRole === 'superadmin') && normAction === 'process'
    if (shouldSyncGoogleSheet) {
      backgroundTasks.push({
        label: 'google-sheets-update',
        run: async () => {
          try {
            const wh = (updatedLoan as any)?.warehouseStatus || {}
            const statusValue = String(wh.status ?? '').trim() || WAREHOUSE_STATUS.BORROWED
            const processedByValue = String(wh.processedBy ?? processedBy).trim() || processedBy
            const processedAtValue = String(wh.processedAt ?? now).trim() || now

            const noteValue = (() => {
              const fromWh = String(wh.note ?? '').trim()
              if (fromWh) return fromWh
              const fromReqNote = String(note ?? '').trim()
              if (fromReqNote) return fromReqNote
              const fromReason = String(reason ?? '').trim()
              if (fromReason) return fromReason
              return '-'
            })()

            const processedAtText = formatProcessedAt(processedAtValue)
            const statusText = `Status : ${statusValue}, Diproses oleh : ${processedByValue}, Diproses pada : ${processedAtText}, Catatan : ${noteValue}`

            console.debug('[warehouse] attempting Google Sheets Warehouse Status update', { id, role: canonicalRole, action: normAction })
            const gsUpdated = await GoogleSheetsService.updateWarehouseStatusForLoan(updatedLoan, statusText)
            console.log('GoogleSheetsService.updateWarehouseStatusForLoan result=', gsUpdated)
            if (!gsUpdated) console.warn('GoogleSheetsService.updateWarehouseStatusForLoan returned false — check Apps Script logs and spreadsheet mapping')
          } catch (err) {
            console.warn('Failed to update Warehouse Status in Google Sheets', err)
            throw err
          }
        }
      })
    }

    res.status(200).json({ message: 'Warehouse update saved', loan: updatedLoan })

    if (backgroundTasks.length) {
      setImmediate(() => {
        backgroundTasks.forEach(({ label, run }) => {
          run()
            .then(() => console.debug(`[warehouse][background:${label}] completed for loan ${id}`))
            .catch(err => console.error(`[warehouse][background:${label}] failed for loan ${id}`, err))
        })
      })
    }
  } catch (error) {
    console.error('Error updating warehouse status:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// Disable Next's default body parser so formidable can handle multipart uploads
export const config = {
  api: {
    bodyParser: false,
  },
}