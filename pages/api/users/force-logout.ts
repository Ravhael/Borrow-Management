import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { broadcastPresence, broadcastToUser, getUserSubscriberCount } from '../../../lib/presence'
import { logAudit } from '../../../utils/auditLogger'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' })

  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ ok: false, message: 'userId required' })

    const user = await prisma.user.findUnique({ where: { id: String(userId) } })
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' })

    // set IsLoggedIn flag to false to force logout (NextAuth JWT sessions will still be valid until cleared; this is a best-effort server-side flag)
    const updated = await prisma.user.update({ where: { id: String(userId) }, data: { IsLoggedIn: false } })

    // broadcast presence update to subscribers
    try { broadcastPresence({ userId: updated.id, IsLoggedIn: updated.IsLoggedIn, timestamp: new Date().toISOString() }) } catch (e) { /* continue */ }

    // Revoke DB sessions (delete session rows) so tokens are invalidated
    try {
      const deleted = await prisma.session.deleteMany({ where: { userId: String(updated.id) } })
      // include number of deleted sessions in response/logs
      const deletedCount = deleted && typeof (deleted as any).count === 'number' ? (deleted as any).count : 0
      ;(res as any).locals = { ...((res as any).locals || {}), deletedSessions: deletedCount }
    } catch (e) { /* continue */ }

    // notify the user's browser(s) to sign out if they are connected via SSE
    // notify connected browser(s). include a localized message and a redirect instruction
    try {
      broadcastToUser(String(updated.id), 'force_logout', {
        message: 'Akun anda sudah logout, silahkan login kembali',
        redirectTo: '/403?from=force-logout&message=' + encodeURIComponent('akun anda sudah logout, silahkan login kembali')
      })
    } catch (e) { /* continue */ }

    // write audit log
    try { await logAudit({ userId: updated.id, actorId: (req.body as any).actorId ?? null, actorName: (req.body as any).actorName ?? 'admin', action: 'force_logout', details: `Force logout for ${updated.id}`, ip: String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '') }) } catch (e) { }

    // include subscriber info so admin can see whether a real-time signal was delivered
    const subs = getUserSubscriberCount(String(updated.id))
    return res.status(200).json({ ok: true, message: 'User forced to logout', user: { id: updated.id, IsLoggedIn: updated.IsLoggedIn }, deletedSessions: (res as any).locals?.deletedSessions ?? null, sseSubscribers: subs })
  } catch (err: any) {
    console.error('[force-logout] error', err)
    return res.status(500).json({ ok: false, message: err?.message ?? 'server error' })
  }
}
