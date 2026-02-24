import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { prisma } from '../../../lib/prisma'
import { emailService } from '../../../utils/emailService'
import { appendUserNotificationByEmail } from '../../../utils/serverNotifications'
import { logAudit } from '../../../utils/auditLogger'

// intentionally no temporary password — request-reset creates a one-time token

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' })

  try {
    const { email } = req.body ?? {}
    if (!email || typeof email !== 'string') return res.status(400).json({ ok: false, message: 'email required' })

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email: String(email) } })

    // Always return OK to avoid user enumeration
    const genericResponse = { ok: true, message: 'If an account exists for that email we will send a password reset link.' }
    if (!user) {
      // record an audit event (non-sensitive) and return
      try { await logAudit({ userId: null, actorId: null, actorName: 'public', action: 'request_password_reset', details: `Reset requested for ${email} (no user found)`, ip: String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '') }) } catch (e) {}
      return res.status(200).json(genericResponse)
    }

    if (!user.email) {
      // user exists but has no email — behave as if we've sent (but will not send)
      try { await logAudit({ userId: user.id, actorId: null, actorName: 'public', action: 'request_password_reset', details: `Reset requested for ${email} (no email on file)`, ip: String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '') }) } catch (e) {}
      return res.status(200).json(genericResponse)
    }

    // generate single-use reset token (not the password) and save hashed token + expiry
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours

    // Persist the hashed token and expiry to the user record
    const updated = await prisma.user.update({ where: { id: user.id }, data: { passwordResetToken: tokenHash, passwordResetExpiresAt: expiresAt } as any })

    // send email containing reset link using shared emailService helper and capture the result
    const sendOk = await emailService.sendPasswordResetNotification({ name: user.name ?? user.username ?? '', email: user.email ?? '', username: user.username ?? '' }, rawToken)

    // append a notification entry
    try {
      await appendUserNotificationByEmail(user.email, { type: 'password_reset_request', sentAt: new Date().toISOString(), to: user.email, success: !!sendOk, error: sendOk ? null : 'send failed' })
    } catch (err) {
      console.error('[request-reset] appendUserNotification failed', err)
    }

    try { await logAudit({ userId: user.id, actorId: null, actorName: 'public', action: 'request_password_reset', details: `Reset requested for ${user.id}`, ip: String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '') }) } catch (e) {}

    if (!sendOk) {
      // send failed — still return generic success but include a detail for admin debugging
      return res.status(200).json({ ...genericResponse, ok: true, message: genericResponse.message, details: 'email send failed' })
    }

    return res.status(200).json(genericResponse)
  } catch (err: any) {
    console.error('[request-reset] error', err)
    return res.status(500).json({ ok: false, message: err?.message ?? 'server error' })
  }
}
