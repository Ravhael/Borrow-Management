import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { emailService, buildPasswordResetUrl } from '../../../utils/emailService'
import { generateAccountCreationEmail, generateAccountApprovalEmail, generatePasswordResetEmail, generateonSubmitMarketingEmail, generateonSubmitCompanyEmail } from '../../../utils/emailTemplates'
import { appendUserNotificationByEmail } from '../../../utils/serverNotifications'
import { prisma } from '../../../lib/prisma'
import { logAudit } from '../../../utils/auditLogger'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' })

  try {
    // ensure caller is authenticated + authorized (admin or superadmin)
    const session = await getServerSession(req, res, authOptions as any) as any
    if (!session?.user?.id) return res.status(401).json({ ok: false, message: 'Not authenticated' })

    const roleName = session.user?.role?.name ?? session.user?.role ?? ''
    const canonical = typeof roleName === 'string' ? roleName.toLowerCase() : ''
    if (!(canonical.includes('admin') || canonical.includes('superadmin'))) return res.status(403).json({ ok: false, message: 'Forbidden' })
    const { type, email, userId, username, temporaryPassword } = req.body as any
    if (!email && !userId) return res.status(400).json({ ok: false, message: 'email or userId required' })

    // resolve recipient
    const recipient = email || null

    // Use the low-level sendCustomEmail method (returns { ok, error }) so admins get a structured result
    let result: { ok: boolean; error?: string | null } = { ok: false, error: 'unknown type' }
    if (type === 'account_creation') {
      const subject = `Selamat datang ${username ?? recipient ?? ''}`
      const body = generateAccountCreationEmail(username ?? recipient ?? '', recipient ?? '', username ?? recipient ?? '')
      result = await emailService.sendCustomEmail({ to: [recipient ?? ''], subject, body })
    } else if (type === 'account_approval') {
      const subject = `Akun Anda telah disetujui`
      const body = generateAccountApprovalEmail(username ?? recipient ?? '', recipient ?? '', username ?? recipient ?? '')
      result = await emailService.sendCustomEmail({ to: [recipient ?? ''], subject, body })
    } else if (type === 'password_reset') {
      const temp = temporaryPassword ?? (Math.random().toString(36).slice(2, 12))
      const subject = 'Password reset oleh administrator'
      const resetLink = buildPasswordResetUrl(username ?? '', temp)
      const body = generatePasswordResetEmail(username ?? recipient ?? '', resetLink, temp)
      result = await emailService.sendCustomEmail({ to: [recipient ?? ''], subject, body })
    } else if (type === 'marketing' || type === 'marketing_admin') {
      // Try to load the latest persisted loan from DB so preview-send uses the authoritative needDetails
      let loanToUse: any = null
      try {
        const latest = await prisma.loan.findFirst({ orderBy: { submittedAt: 'desc' } })
        if (latest) loanToUse = latest
      } catch (err) {
        // failed to load latest loan — we'll return a clear error when no persisted loan is available
        console.debug('[send-preview-email] failed to load latest loan from DB', err?.message ?? err)
      }

      // If DB doesn't contain any loans, do not fall back to a local sample.
      // Require the caller/admin to have actual persisted loan data so preview-send matches production.
      if (!loanToUse) {
        return res.status(400).json({ ok: false, message: 'No persisted loan found in the database. Preview-send requires a loan in DB (delete sample/mock fallback if you want exact DB-only behavior).' })
      }
      const src = loanToUse

      // Build a marketing-style HTML body for preview so it matches the preview UI exactly
      const subject = type === 'marketing'
        ? `Permintaan Peminjaman Baru - ${src.borrowerName ?? 'Peminjam'}`
        : `Notifikasi Permintaan Peminjaman - ${src.borrowerName ?? 'Peminjam'}`

      const body = type === 'marketing'
        ? generateonSubmitMarketingEmail(src, [], false)
        : generateonSubmitCompanyEmail(src, [], 'Admin', false)

      result = await emailService.sendCustomEmail({ to: [recipient ?? ''], subject, body })
    } else {
      return res.status(400).json({ ok: false, message: 'unknown type' })
    }

    // record notification to user's history if email or userId provided
    const note: any = { type, sentAt: new Date().toISOString(), to: recipient ?? null, success: !!result?.ok, error: result?.ok ? null : (result?.error ?? 'unknown'), meta: { userId, username, temporaryPassword } }
    // attach actor info so admins can trace who triggered manual sends
    note.actorId = String(session.user.id)
    note.actorName = session.user.name ?? session.user.email ?? null
    try {
      if (userId) await import('../../../utils/serverNotifications').then(m => m.appendUserNotification(userId, note))
      else if (recipient) await appendUserNotificationByEmail(recipient, note)
    } catch (err) { console.error('[send-preview-email] append notification failed', err) }

    try { await logAudit({ actorId: String(session.user.id), actorName: session.user.name ?? session.user.email ?? null, action: 'admin_send_preview', details: `Manual send ${type} -> ${recipient ?? userId}`, userId: userId ?? null }) } catch (e) {}

    return res.status(200).json({ ok: result?.ok ?? false, message: result?.ok ? undefined : (result?.error ?? 'unknown') })
  } catch (err: any) {
    console.error('[send-preview-email] error', err)
    return res.status(500).json({ ok: false, message: err?.message ?? 'server error' })
  }
}
