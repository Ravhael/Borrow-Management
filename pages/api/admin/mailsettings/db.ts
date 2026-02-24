import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const row = await prisma.mailSettings.findUnique({ where: { id: 1 } })
      if (!row) return res.status(404).json({ message: 'Mail settings not found in DB' })
      return res.status(200).json(row)
    }

    if (req.method === 'PUT') {
      const { smtp, notes } = req.body
      if (!smtp) return res.status(400).json({ message: 'Missing smtp payload' })

      const existing = await prisma.mailSettings.findUnique({ where: { id: 1 } })
      if (existing) {
        const updated = await prisma.mailSettings.update({ where: { id: 1 }, data: { smtp, notes } })
        return res.status(200).json(updated)
      }

      const created = await prisma.mailSettings.create({ data: { smtp, notes } })
      return res.status(201).json(created)
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (err) {
    console.error('mailsettings db api error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
