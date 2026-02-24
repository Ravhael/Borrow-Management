import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, message: 'Method not allowed' })

  try {
    const last: any = await prisma.$queryRaw`SELECT * FROM "ReminderRun" ORDER BY "ranAt" DESC LIMIT 1`
    const recent: any[] = await prisma.$queryRaw`SELECT * FROM "ReminderRun" ORDER BY "ranAt" DESC LIMIT 10`
    return res.json({ ok: true, lastRun: last?.[0] ?? null, recentRuns: recent })
  } catch (err) {
    console.warn('[reminders/status] error', err)
    return res.status(500).json({ ok: false, message: 'internal error' })
  }
}
