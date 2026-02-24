import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' })
  }

  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return res.status(200).json({ message: 'No token found (unauthenticated)' })
    // avoid echoing sessionToken back to client
    const safeToken: any = { ...token }
    if (safeToken.sessionToken) delete safeToken.sessionToken
    return res.status(200).json({ token: safeToken })
  } catch (err) {
    console.error('[debug/session] failed to read token', err)
    return res.status(500).json({ message: 'Failed to read token' })
  }
}
