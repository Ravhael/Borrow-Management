import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions as any) as any
    if (!session?.user?.id) return res.status(401).json({ ok: false, error: 'unauthenticated' })

    const user = await prisma.user.findUnique({ where: { id: String(session.user.id) }, include: { role: true, directorate: true, entitas: true } })
    if (!user) return res.status(404).json({ ok: false, error: 'user-not-found' })

    return res.status(200).json({ ok: true, user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role ? String((user as any).role.name ?? (user as any).role) : null,
      directorate: user.directorate ? String(user.directorate.name) : null,
      entitas: user.entitas ? String(user.entitas.name) : null,
    }})
  } catch (err: any) {
    console.error('/api/me error', err)
    return res.status(500).json({ ok: false, error: err?.message ?? 'server-error' })
  }
}
