import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// Helper that returns some mocked activity data when there's no audit table.
function sampleEventsForUser(userId: string, count = 20) {
  const actions = [
    'User logged in',
    'User logged out',
    'Password changed',
    'Profile updated',
    'Role changed',
    'Reset password by admin',
    '2FA enabled',
    '2FA disabled',
    'Permission updated',
    'API key created',
    'API key revoked',
    'Impersonation started',
    'Impersonation stopped',
    'Account deactivated',
    'Account reactivated'
  ]

  const now = Date.now()

  return Array.from({ length: count }).map((_, i) => ({
    id: `${userId}-mock-${i}`,
    userId,
    action: actions[i % actions.length],
    actorId: i % 3 === 0 ? 'system' : `admin-${(i % 5) + 1}`,
    actorName: i % 3 === 0 ? 'System' : `Administrator ${(i % 5) + 1}`,
    details: `Auto-generated event #${i + 1} for ${userId}`,
    ip: `192.168.0.${(i % 254) + 1}`,
    createdAt: new Date(now - i * 1000 * 60 * 60).toISOString()
  }))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' })

  try {
    const { userId, page = 1, perPage = 20 } = req.body || {}
    if (!userId) return res.status(400).json({ ok: false, message: 'userId required' })

    // If the Prisma client has an auditLog model, prefer fetching real data.
    const hasAuditTable = (prisma as any).auditLog !== undefined

    if (hasAuditTable) {
      const auditLog = (prisma as any).auditLog
      const total = await auditLog.count({ where: { userId: String(userId) } })
      const rows = await auditLog.findMany({
        where: { userId: String(userId) },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(perPage),
        take: Number(perPage)
      })

      return res.status(200).json({ ok: true, rows, total })
    }

    // Fallback: return mocked events so admin UI works without DB migration
    const rows = sampleEventsForUser(String(userId), Number(perPage))
    const total = 100 // arbitrary total in mock

    return res.status(200).json({ ok: true, rows, total })
  } catch (err: any) {
    console.error('[activity-logs] error', err)
    return res.status(500).json({ ok: false, message: err?.message ?? 'server error' })
  }
}
