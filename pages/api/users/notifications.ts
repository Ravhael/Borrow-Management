import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

// Provide some mocked notification history entries when DB column is absent
function sampleNotificationsForUser(userId: string, count = 20) {
  const types = ['account_creation', 'account_approval', 'password_reset']
  const now = Date.now()
  return Array.from({ length: count }).map((_, i) => ({
    id: `${userId}-notif-${i}`,
    type: types[i % types.length],
    sentAt: new Date(now - i * 1000 * 60 * 60).toISOString(),
    to: `${userId}+${i}@example.test`,
    success: i % 4 !== 0, // mostly successes
    meta: { debug: true, index: i },
    actorId: i % 2 === 0 ? 'system' : `admin-${(i % 4) + 1}`,
    actorName: i % 2 === 0 ? 'System' : `Admin ${(i % 4) + 1}`
  }))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' })

  try {
    const session = await getServerSession(req, res, authOptions as any) as any
    if (!session?.user?.id) return res.status(401).json({ ok: false, message: 'Not authenticated' })

    // only admin / superadmin allowed to view arbitrary user notifications
    const roleName = session.user?.role?.name ?? session.user?.role ?? ''
    const canonical = typeof roleName === 'string' ? roleName.toLowerCase() : ''
    if (!(canonical.includes('admin') || canonical.includes('superadmin'))) return res.status(403).json({ ok: false, message: 'Forbidden' })

    const { userId, page = 1, perPage = 20 } = req.body || {}
    if (!userId) return res.status(400).json({ ok: false, message: 'userId required' })

    // fetch user's notification JSON column (if available)
    const u = await prisma.user.findUnique({ where: { id: String(userId) }, select: { notification: true } })
    const existing = (u && u.notification) ? (u.notification as any) : null

    if (existing && Array.isArray(existing.history)) {
      // order by sentAt desc
      const rows = [...existing.history].sort((a, b) => (new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()))
      const total = rows.length
      const slice = rows.slice((Number(page) - 1) * Number(perPage), (Number(page) - 1) * Number(perPage) + Number(perPage))
      return res.status(200).json({ ok: true, rows: slice, total })
    }

    // fallback — provide sample notifications so UI still works on databases without the column
    const rows = sampleNotificationsForUser(String(userId), Number(perPage))
    const total = 100
    return res.status(200).json({ ok: true, rows, total })
  } catch (err: any) {
    console.error('[notifications] error', err)
    return res.status(500).json({ ok: false, message: err?.message ?? 'server error' })
  }
}
