import { NextApiRequest, NextApiResponse } from 'next'
import formidable, { File as FormidableFile } from 'formidable'
import fs from 'fs'
import path from 'path'
import { prisma } from '../../../../lib/prisma'
import { emailService } from '../../../../utils/emailService'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { getEffectiveReturnDate } from '../../../../utils/loanHelpers'
import { GoogleSheetsService } from '../../../../utils/googleSheetsService'
import {
  generateReturnedSubCompanyEmail,
  generateReturnedSubEntitasEmail,
  generateReturnedSubWarehouseEmail,
  generateReturnedSubpBorrowerEmail,
  type ReturnRequestInfo,
} from '../../../../utils/email-templates/returnedRequestTemplates'

export const config = {
  api: {
    bodyParser: false,
  }
}

type CompanyRoleEntry = {
  company: string
  role: string
  isWarehouse: boolean
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ message: 'ID is required' })
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  const backgroundTasks: Array<() => Promise<void>> = []

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

    const loan = await prisma.loan.findUnique({ where: { id } })
    if (!loan) return res.status(404).json({ message: 'Loan not found' })

    // Accept multipart for files or JSON
    let note: string | undefined
    let uploadedFiles: FormidableFile[] = []

    const contentType = String(req.headers['content-type'] || '').toLowerCase()
    if (contentType.includes('multipart/form-data')) {
      await new Promise<void>((resolve, reject) => {
        const form = formidable({ multiples: true, keepExtensions: true })
        form.parse(req as any, (err, fields, files) => {
          if (err) return reject(err)
          const getFirst = (v: any) => Array.isArray(v) ? v[0] : v
          note = getFirst(fields.note) as string | undefined
          const filesObj = files as any
          if (filesObj) {
            Object.values(filesObj).forEach(maybe => {
              if (!maybe) return
              if (Array.isArray(maybe)) uploadedFiles.push(...maybe as FormidableFile[])
              else uploadedFiles.push(maybe as FormidableFile)
            })
          }
          resolve()
        })
      })
    } else {
      const rawBody = await new Promise<string>((resolve, reject) => {
        let data = ''
        req.on('data', (chunk) => { data += chunk })
        req.on('end', () => resolve(data))
        req.on('error', reject)
      })
      let parsed: any = {}
      if (rawBody && rawBody.length > 0) {
        try { parsed = JSON.parse(rawBody) } catch (err) { /* ignore */ }
      }
      note = parsed.note
    }

    // Basic validation
    if (!note || String(note).trim() === '') {
      return res.status(400).json({ message: 'Catatan/ alasan pengembalian wajib diisi' })
    }

    // save files if any
    const MAX_FILES = 6
    const MAX_FILE_SIZE = 5 * 1024 * 1024
    let savedFiles: any[] = []
    if (uploadedFiles && uploadedFiles.length > 0) {
      if (uploadedFiles.length > MAX_FILES) return res.status(400).json({ message: `Maksimum ${MAX_FILES} file diperbolehkan` })
      const invalidSize = uploadedFiles.find(f => (f.size ?? 0) > MAX_FILE_SIZE)
      if (invalidSize) return res.status(400).json({ message: 'Beberapa file terlalu besar — maksimum 5MB per file' })

      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'loans', String(id), 'return-requests')
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

        savedFiles = uploadedFiles.map(f => {
          const originalName = (f.originalFilename as string) || path.basename(String((f.filepath || f.file || f.path || 'upload')))
          const tmpPath = (f.filepath as string) || (f.file as string) || (f.path as string) || (f.tempFilePath as string)
          const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
          const dest = path.join(uploadsDir, safeName)
          if (tmpPath) {
            try { fs.renameSync(tmpPath, dest) } catch (err) { try { fs.copyFileSync(tmpPath, dest); fs.unlinkSync(tmpPath) } catch (e) {} }
          }
          const publicUrlPath = `/uploads/loans/${id}/return-requests/${safeName}`
          const publicUrl = require('../../../../utils/basePath').withBasePath(publicUrlPath)
          return { filename: originalName, url: publicUrl }
        })
      } catch (err) {
        console.warn('Failed to save return-request files', err)
        return res.status(500).json({ message: 'Gagal menyimpan file bukti pengembalian' })
      }
    }

    // get a friendly name for processedBy
    let requestedBy = 'Borrower'
    try {
      const session = await getServerSession(req, res, authOptions as any) as any
      if (session && session.user) requestedBy = session.user.name || session.user.username || requestedBy
    } catch (err) {
      console.warn('Unable to get session for request-return', err)
    }

    // Build a return-request entry and persist into loan.returnRequest (JSON column)
    const now = new Date().toISOString()
    // canonical id for the request (timestamp-based)
    const requestId = `rr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const newEntry = {
      id: requestId,
      requestedAt: now,
      requestedBy,
      note: String(note).trim(),
      photoResults: savedFiles.length ? savedFiles : undefined,
      status: 'returnRequested'
    }

    // existing may be stored as JSON array in loan.returnRequest
    const currentRequests = Array.isArray((loan as any).returnRequest) ? (loan as any).returnRequest : []
    const nextRequests = [...currentRequests, newEntry]

    // Build a proposed top-level returnStatus object to mark the request as active.
    const previousStatus = (loan as any).warehouseStatus?.status ?? (loan as any).loanStatus
    const initialReturnStatus: any = {
      status: 'returnRequested',
      previousStatus: previousStatus ?? undefined,
      note: String(note).trim(),
      photoResults: savedFiles.length ? savedFiles : undefined,
    }

    // Prepare notifications for return request so recipients are aware — similar to warehouse return notifications
    let returnNotifications: any = { entitas: {}, companies: {} }
    const borrowerEmail = loan.borrowerEmail && String(loan.borrowerEmail).trim()
    const entitasEmailSet = new Set<string>()
    const companyEmailSet = new Set<string>()
    const warehouseEmailSet = new Set<string>()
    const entitasRoles: string[] = []
    const companyRoleEntries: CompanyRoleEntry[] = []

    // Collect entitas emails
    if (loan.entitasId) {
      try {
        const entitasData = await prisma.entitas.findUnique({ where: { code: String(loan.entitasId) } })
        returnNotifications.entitas[loan.entitasId] = {}
        const entitasEmails = (entitasData?.emails ?? {}) as Record<string, string>
        Object.entries(entitasEmails).forEach(([role, email]) => {
          const trimmed = String(email || '').trim()
          if (!trimmed) return
          entitasEmailSet.add(trimmed)
          entitasRoles.push(role)
          returnNotifications.entitas[loan.entitasId][role] = { sent: false, email: trimmed }
        })
      } catch (err) {
        console.warn('Unable to fetch entitas emails for return request', err)
      }
    }

    // Collect company emails and split warehouse recipients
    if (loan.company && Array.isArray(loan.company) && loan.company.length > 0) {
      try {
        const rows = await prisma.mktCompany.findMany({ where: { value: { in: loan.company } } })
        rows.forEach(r => {
          if (!r?.value) return
          if (!returnNotifications.companies[r.value]) {
            returnNotifications.companies[r.value] = {}
          }
          Object.entries((r.emails as any) || {}).forEach(([role, email]) => {
            const trimmed = String(email || '').trim()
            if (!trimmed) return
            returnNotifications.companies[r.value][role] = { sent: false, email: trimmed }
            const normalizedRole = String(role || '').trim()
            const isWarehouse = normalizedRole.toLowerCase() === 'warehouse'
            companyRoleEntries.push({ company: r.value, role, isWarehouse })
            if (isWarehouse) {
              warehouseEmailSet.add(trimmed)
            } else {
              companyEmailSet.add(trimmed)
            }
          })
        })
      } catch (err) {
        console.warn('Unable to fetch company emails for return request', err)
      }
    }

    if (borrowerEmail) {
      returnNotifications.borrower = { sent: false, email: borrowerEmail }
    }

    const entitasEmails = Array.from(entitasEmailSet)
    const companyEmails = Array.from(companyEmailSet)
    const warehouseEmails = Array.from(warehouseEmailSet)
    const plannedReturnSource = loan?.returnDate || (loan as any)?.endDate || getEffectiveReturnDate(loan)
    const loanForEmail = { ...loan, returnRequest: nextRequests }
    const requestInfo: ReturnRequestInfo = {
      requestBy: requestedBy,
      requestAt: now,
      plannedReturnDate: plannedReturnSource || undefined,
      note: newEntry.note,
    }
    const subjectToken = loan.borrowerName || loan.id || (loan as any)?.form_number || 'FormFlow'
    const subject = `Permintaan Pengembalian Barang - ${subjectToken}`.trim()

    const markEntitasSent = () => {
      if (!loan.entitasId || !returnNotifications.entitas[loan.entitasId]) return
      const stamp = new Date().toISOString()
      entitasRoles.forEach(role => {
        const entry = returnNotifications.entitas[loan.entitasId][role]
        if (entry) {
          entry.sent = true
          entry.sentAt = stamp
        }
      })
    }

    const markCompanyRoles = (isWarehouse: boolean) => {
      const stamp = new Date().toISOString()
      companyRoleEntries
        .filter(entry => entry.isWarehouse === isWarehouse)
        .forEach(entry => {
          const bucket = returnNotifications.companies?.[entry.company]?.[entry.role]
          if (bucket) {
            bucket.sent = true
            bucket.sentAt = stamp
          }
        })
    }

    const queueEmailTask = (recipients: string[], htmlFactory: () => string, onSuccess?: () => void) => {
      if (!recipients.length) return
      backgroundTasks.push(async () => {
        try {
          const result = await emailService.sendCustomEmail({ to: recipients, subject, body: htmlFactory() })
          if (result?.ok) {
            onSuccess?.()
          } else {
            console.warn('return-request email send failed', result?.error)
          }
        } catch (error) {
          console.warn('return-request email send error', error)
        }
      })
    }

    queueEmailTask(entitasEmails, () => generateReturnedSubEntitasEmail(loanForEmail, [], requestInfo, false), markEntitasSent)
    queueEmailTask(companyEmails, () => generateReturnedSubCompanyEmail(loanForEmail, [], requestInfo, false), () => markCompanyRoles(false))
    queueEmailTask(warehouseEmails, () => generateReturnedSubWarehouseEmail(loanForEmail, [], requestInfo, false), () => markCompanyRoles(true))
    if (borrowerEmail) {
      queueEmailTask([borrowerEmail], () => generateReturnedSubpBorrowerEmail(loanForEmail, [], requestInfo, false), () => {
        if (returnNotifications.borrower) {
          returnNotifications.borrower.sent = true
          returnNotifications.borrower.sentAt = new Date().toISOString()
        }
      })
    }

    // Persist returnRequest, returnStatus, loanStatus and returnNotifications to the loan row atomically
    let updatedLoan: any = null
    try {
      updatedLoan = await prisma.loan.update({ where: { id }, data: { returnRequest: nextRequests, returnStatus: initialReturnStatus, loanStatus: 'returnRequested', returnNotifications } })
    } catch (err) {
      console.warn('Failed to update loan with return request + notifications', err)
      // fallback: try to at least persist the returnRequest alone so the request is recorded
      try { updatedLoan = await prisma.loan.update({ where: { id }, data: { returnRequest: nextRequests } }) } catch (e) { console.warn('Failed to persist returnRequest fallback', e) }
    }

    // Best-effort Google Sheets update for Return Requested (do not block return request submission).
    backgroundTasks.push(async () => {
      try {
        const status = String((newEntry as any)?.status ?? '').trim() || 'returnRequested'
        const processedBy = String((newEntry as any)?.requestedBy ?? requestedBy).trim() || requestedBy
        const processedAt = String((newEntry as any)?.requestedAt ?? now).trim() || now
        const noteText = String((newEntry as any)?.note ?? '').trim()

        const returnRequestedText = `Status : ${status}, Diproses oleh : ${processedBy}, Diproses pada : ${formatProcessedAt(processedAt)}, Catatan : ${noteText}`
        console.log('[request-return] attempting Return Requested sheet update', { loanId: id, needType: (loan as any).needType })
        const ok = await GoogleSheetsService.updateReturnRequestedForLoan(updatedLoan || loan, returnRequestedText)
        console.log('[request-return] Return Requested sheet update result', { ok, loanId: id })
      } catch (err) {
        console.error('[request-return] Return Requested sheet update failed (ignored)', err)
      }
    })

    res.status(201).json({ request: newEntry })

    if (backgroundTasks.length) {
      setImmediate(() => {
        backgroundTasks.forEach(async (task, index) => {
          try {
            await task()
            console.debug(`[request-return][background:${id}-${index}] completed`)
          } catch (err) {
            console.error(`[request-return][background:${id}-${index}] failed`, err)
          }
        })
      })
    }
    return
  } catch (err) {
    console.error('Failed request-return', err)
    return res.status(500).json({ message: 'Terjadi kesalahan saat mengajukan pengembalian' })
  }
}
