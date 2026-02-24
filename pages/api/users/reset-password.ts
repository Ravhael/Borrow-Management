import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'
import { emailService } from '../../../utils/emailService'
import { logAudit } from '../../../utils/auditLogger'
import { broadcastPresence } from '../../../lib/presence'
import crypto from 'crypto'

function generateTempPassword(length = 12) {
  // generate URL-safe base64 and trim to length
  return crypto.randomBytes(Math.ceil(length * 0.75)).toString('base64').replace(/\+/g, '0').replace(/\//g, '0').slice(0, length)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' })

  try {
    const { userId, newPassword: providedPassword, sendEmail = true } = req.body
    if (!userId) return res.status(400).json({ ok: false, message: 'userId required' })

    const user = await prisma.user.findUnique({ where: { id: String(userId) } })
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' })

    if (sendEmail && !user.email) return res.status(400).json({ ok: false, message: 'User has no email on record' })

    const temp = providedPassword ? String(providedPassword) : generateTempPassword(12)
    const hashed = await bcrypt.hash(temp, 12)

    // Update password and mark user logged out
    const updated = await prisma.user.update({ where: { id: user.id }, data: { password: hashed, IsLoggedIn: false } })
    try { broadcastPresence({ userId: updated.id, IsLoggedIn: updated.IsLoggedIn, timestamp: new Date().toISOString() }) } catch (e) { /* ignore */ }

    if (sendEmail) {
      try {
        // construct and send reset email using the centralized helper on the emailService
        const sendOk = await emailService.sendPasswordResetNotification({ name: user.name ?? user.username ?? '', email: user.email ?? '', username: user.username ?? '' }, temp)
        const pwNotif: any = { type: 'password_reset', sentAt: new Date().toISOString(), to: user.email, success: !!sendOk, error: sendOk ? null : 'send failed' }
        pwNotif.actorId = (req.body as any).actorId ?? null
        pwNotif.actorName = (req.body as any).actorName ?? null
        try { await import('../../../utils/serverNotifications').then(m => m.appendUserNotification(user.id, pwNotif)) } catch (err) { console.error('[reset-password] append notification failed', err) }
      } catch (err) {
        console.error('[reset-password] email send failed', err)
        // continue — password is updated even if email failed
      }
    }

    try {
      await logAudit({ userId: user.id, actorId: (req.body as any).actorId ?? null, actorName: (req.body as any).actorName ?? 'admin', action: 'reset_password', details: `Password reset for ${user.id}`, ip: String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? ''), meta: { sentEmail: sendEmail } })
    } catch (e) { }

    return res.status(200).json({ ok: true, message: 'Password set', password: sendEmail ? null : temp })
  } catch (err: any) {
    console.error('[reset-password] error', err)
    return res.status(500).json({ ok: false, message: err?.message ?? 'server error' })
  }
}
