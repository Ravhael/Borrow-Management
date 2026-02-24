import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' })

  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ ok: false, code: 'MISSING_CREDENTIALS' })

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }]
      }
    })

    if (!user) return res.status(200).json({ ok: false, code: 'USER_NOT_FOUND' })
    if (!user.isActive) return res.status(200).json({ ok: false, code: 'ACCOUNT_INACTIVE' })

    const stored = user.password ?? ''
    const isBcrypt = typeof stored === 'string' && stored.startsWith('$2')
    let passwordOk = false
    if (isBcrypt) passwordOk = await bcrypt.compare(password, stored)
    else passwordOk = password === stored

    if (!passwordOk) return res.status(200).json({ ok: false, code: 'INVALID_PASSWORD' })

    // success
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[validate-credentials] error', err)
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR' })
  }
}
