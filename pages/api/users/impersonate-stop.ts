import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import { logAudit } from '../../../utils/auditLogger'

const SESSION_COOKIE_NAMES = ['__Secure-next-auth.session-token', 'next-auth.session-token']

function findSessionCookie(req: NextApiRequest) {
  for (const name of SESSION_COOKIE_NAMES) {
    if (req.cookies && req.cookies[name]) return name
  }
  return SESSION_COOKIE_NAMES[0]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  try {
    const session = await getServerSession(req, res, authOptions as any) as any
    if (!session?.user?.id) return res.status(401).json({ message: 'Not authenticated' })

    // only admin users can restore (or the impersonated user could stop themselves by clearing their token)
    const sessionCookieName = findSessionCookie(req)
    const impToken = req.cookies?.['impersonator-token']
    if (!impToken) return res.status(400).json({ message: 'No impersonation to stop' })

    // restore saved token and clear impersonator cookie
    const cookies: string[] = []
    cookies.push(`${sessionCookieName}=${impToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`)
    // clear impersonator-token
    cookies.push(`impersonator-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)

    res.setHeader('Set-Cookie', cookies)

    // audit
    try { await logAudit({ userId: String(session.user.id), actorId: String(session.user.id), actorName: session.user.name ?? session.user.email ?? null, action: 'impersonation_stop', details: `Stopped impersonation / restored session`, ip: String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '') }) } catch (e) {}

    return res.status(200).json({ message: 'Impersonation stopped' })
  } catch (err) {
    console.error('impersonate-stop error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
