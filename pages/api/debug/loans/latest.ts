import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })

  try {
    const latest = await prisma.loan.findMany({ orderBy: { submittedAt: 'desc' }, take: 5 })
    return res.status(200).json({ count: latest.length, data: latest })
  } catch (err) {
    console.error('Debug latest loans error:', err)
    return res.status(500).json({ message: 'Failed to fetch latest loans' })
  }
}
