import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../../../lib/prisma'
import { logAudit } from '../../../utils/auditLogger'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' })

  try {
    const { username, token, newPassword } = req.body as any
    if (!username || !token || !newPassword) return res.status(400).json({ ok: false, message: 'username, token, and newPassword required' })
    if (typeof newPassword !== 'string' || newPassword.length < 8) return res.status(400).json({ ok: false, message: 'New password must be at least 8 characters long' })

    // find user
    const user = await prisma.user.findUnique({ where: { username } }) as any
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' })

    if (!user.passwordResetToken || !user.passwordResetExpiresAt) return res.status(400).json({ ok: false, message: 'No active reset token' })

    // verify expiry
    const expiresAt = new Date(user.passwordResetExpiresAt)
    if (expiresAt.getTime() < Date.now()) {
      // clear expired token
      try { await prisma.user.update({ where: { id: user.id }, data: { passwordResetToken: null, passwordResetExpiresAt: null } as any }) } catch (err) { }
      return res.status(400).json({ ok: false, message: 'Reset token expired' })
    }

    // verify token by comparing hashed form
    const providedHash = crypto.createHash('sha256').update(String(token)).digest('hex')
    if (providedHash !== String(user.passwordResetToken)) return res.status(400).json({ ok: false, message: 'Invalid reset token' })

    // all good — update password and clear token
    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed, passwordResetToken: null, passwordResetExpiresAt: null, IsLoggedIn: false } as any })

    // append notification and audit
    try { await import('../../../utils/serverNotifications').then(m => m.appendUserNotification(user.id, { type: 'password_reset', sentAt: new Date().toISOString(), to: user.email, success: true })) } catch (e) { console.error('[perform-reset] append notification failed', e) }
    // audit
    try { await logAudit({ userId: user.id, actorId: null, actorName: 'public', action: 'perform_password_reset', details: `Password reset by user via token`, ip: String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '') }) } catch (e) { }

    return res.status(200).json({ ok: true, message: 'Password updated' })
  } catch (err: any) {
    console.error('[perform-reset] error', err)
    return res.status(500).json({ ok: false, message: err?.message ?? 'server error' })
  }
}
