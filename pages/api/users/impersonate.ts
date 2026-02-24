import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import { randomBytes } from 'crypto'
import { encode as jwtEncode } from 'next-auth/jwt'
import { logAudit } from '../../../utils/auditLogger'

const SESSION_COOKIE_NAMES = ['__Secure-next-auth.session-token', 'next-auth.session-token']

function findSessionCookie(req: NextApiRequest) {
  for (const name of SESSION_COOKIE_NAMES) {
    if (req.cookies && req.cookies[name]) return name
  }
  return SESSION_COOKIE_NAMES[0]
}

// POST: start impersonation (admin -> target user)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  try {
    // ensure calling admin is authenticated + authorized
    const session = await getServerSession(req, res, authOptions as any) as any
    if (!session?.user?.id) return res.status(401).json({ message: 'Not authenticated' })

    // only allow admin / superadmin to impersonate
    const roleName = session.user?.role?.name ?? session.user?.role ?? ''
    const canonical = typeof roleName === 'string' ? roleName.toLowerCase() : ''
    if (!(canonical.includes('admin') || canonical.includes('superadmin'))) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const { userId } = req.body || {}
    if (!userId) return res.status(400).json({ message: 'Missing userId' })

    const target = await prisma.user.findUnique({ where: { id: String(userId) }, include: { role: true, directorate: true, entitas: true } })
    if (!target) return res.status(404).json({ message: 'Target user not found' })


    // create a DB-backed session for the impersonated user (so we can revoke it later)
    const sessionToken = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    await prisma.session.create({ data: { sessionToken, userId: String(target.id), expires } })

    // Save current session token (if any) into an impersonator cookie so admin can restore later
    const sessionCookieName = findSessionCookie(req)
    const currentToken = req.cookies?.[sessionCookieName] ?? ''

    // Set impersonator cookie (httpOnly) and new session token cookie for target
    const cookies: string[] = []
    if (currentToken) {
      cookies.push(`${encodeURIComponent('impersonator-token')}=${encodeURIComponent(currentToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60}`)
    }
    // sign a JWT which includes the sessionToken and write it into the client cookie
    // NextAuth uses its own signing; use NEXTAUTH_SECRET to encode a token that the app will trust
    const tokenPayload = {
      sub: String(target.id),
      name: target.name ?? target.username,
      email: target.email,
      role: target.role,
      directorate: target.directorate,
      entitas: target.entitas,
      isActive: target.isActive,
      sessionToken
    }

    const encoded = await jwtEncode({ token: tokenPayload, secret: process.env.NEXTAUTH_SECRET as string })

    cookies.push(`${sessionCookieName}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`)

    // send Set-Cookie header(s)
    res.setHeader('Set-Cookie', cookies)

    // audit
    try { await logAudit({ userId: String(target.id), actorId: String(session.user.id), actorName: session.user.name ?? session.user.email ?? null, action: 'impersonation_start', details: `Admin ${String(session.user.id)} impersonated ${String(target.id)}`, ip: String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '') }) } catch (e) {}

    return res.status(200).json({ message: 'Impersonation started', user: { id: target.id, name: target.name, email: target.email } })

  } catch (err) {
    console.error('impersonate error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
