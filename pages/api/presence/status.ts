import type { NextApiRequest, NextApiResponse } from 'next'
import { getSubscriberCount, getUserSubscriberCount } from '../../../lib/presence'
import { userLastEvents } from '../../../lib/presence'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, message: 'Method not allowed' })

  try {
    const users: Record<string, any> = {}
    for (const [userId, info] of userLastEvents.entries()) {
      users[userId] = info
    }

    const perUserCounts: Record<string, number> = {}
    try {
      for (const u of userLastEvents.keys()) perUserCounts[u] = getUserSubscriberCount(u)
    } catch {}

    return res.json({ ok: true, subscribers: getSubscriberCount(), userSubscribers: perUserCounts, lastEvents: users })
  } catch (err) {
    console.warn('[presence/status] error', err)
    res.status(500).json({ ok: false, message: 'internal error' })
  }
}