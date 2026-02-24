import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { prisma } from '../../../lib/prisma'
import { authOptions } from '../auth/[...nextauth]'

interface FineUpdatePayload {
  id: string
  totalDenda: {
    fineAmount: number
    daysOverdue: number
    updatedAt?: string
  }
}

const sanitizeUpdates = (payload: any): FineUpdatePayload[] => {
  if (!Array.isArray(payload)) return []
  return payload.reduce<FineUpdatePayload[]>((acc, entry) => {
    const id = typeof entry?.id === 'string' ? entry.id : null
    const fineAmount = Number(entry?.totalDenda?.fineAmount)
    const daysOverdue = Number(entry?.totalDenda?.daysOverdue)
    if (!id || !Number.isFinite(fineAmount) || fineAmount <= 0 || !Number.isFinite(daysOverdue) || daysOverdue <= 0) {
      return acc
    }
    acc.push({
      id,
      totalDenda: {
        fineAmount,
        daysOverdue,
        updatedAt: entry?.totalDenda?.updatedAt || new Date().toISOString()
      }
    })
    return acc
  }, [])
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = (await getServerSession(req, res, authOptions as any)) as Session | null
    if (!session?.user) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const rawUpdates = Array.isArray(req.body) ? req.body : req.body?.updates
    const updates = sanitizeUpdates(rawUpdates)
    if (!updates.length) {
      return res.status(400).json({ message: 'updates array is required' })
    }

    await prisma.$transaction(
      updates.map((entry) =>
        prisma.loan.update({
          where: { id: entry.id },
          data: { totalDenda: entry.totalDenda }
        })
      )
    )

    return res.status(200).json({ updated: updates.length })
  } catch (error) {
    console.error('Failed to update fines:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui denda' })
  }
}
