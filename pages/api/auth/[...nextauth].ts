import NextAuth from 'next-auth'
import type { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { getCanonicalRole } from '../../../config/roleConfig'
import { randomBytes } from 'crypto'
import { encode as jwtEncode } from 'next-auth/jwt'
import { prisma } from '../../../lib/prisma'
import { broadcastPresence } from '../../../lib/presence'
import { logAudit } from '../../../utils/auditLogger'
import { menuGroups } from '../../../config/menuGroups'

// Keep IsLoggedIn stored in DB only (snapshot file is read-only export)

// Helper: expand stored allowedMenus entries (hrefs or group titles) into href list
function expandAllowedMenus(raw: any): string[] {
  if (!raw) return []
  const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? (raw.trim().startsWith('[') || raw.trim().startsWith('{') ? (() => { try { return JSON.parse(raw) } catch (_) { return raw.split(',').map(s=>s.trim()).filter(Boolean) } })() : raw.split(',').map(s=>s.trim()).filter(Boolean)) : [])
  const out = new Set<string>()
  for (const v of arr) {
    const s = String(v || '').trim()
    if (!s) continue
    if (s.startsWith('/')) { out.add(s); continue }
    const g = menuGroups.find(m => String(m.title).toLowerCase() === s.toLowerCase())
    if (g && Array.isArray((g as any).items)) {
      (g as any).items.forEach((it: any) => out.add(it.href))
      continue
    }
    // as a fallback, if the value looks like a label of an item, map it
    const byLabel = menuGroups.flatMap(m => (m as any).items ?? []).find((it: any) => String(it.label).toLowerCase() === s.toLowerCase())
    if (byLabel) out.add(byLabel.href)
  }
  return Array.from(out)
}

export const authOptions: AuthOptions = {
  // enable debug logging in dev to help diagnose credential failures
  debug: process.env.NODE_ENV !== 'production',
  logger: {
    error(code, ...metadata) {
      console.error('[nextauth][error]', code, ...metadata)
    },
    warn(code, ...metadata) {
      console.warn('[nextauth][warn]', code, ...metadata)
    },
    debug(code, ...metadata) {
      console.debug('[nextauth][debug]', code, ...metadata)
    }
  },
  adapter: PrismaAdapter(prisma),
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      try {
        if (user?.id) {
          const updated = await prisma.user.update({ where: { id: String(user.id) }, data: { IsLoggedIn: true } })
          try { broadcastPresence({ userId: String(updated.id), IsLoggedIn: updated.IsLoggedIn, timestamp: new Date().toISOString() }) } catch (e) { }
          try { await logAudit({ userId: String(updated.id), actorId: String(updated.id), actorName: updated.name ?? updated.username ?? null, action: 'user_signed_in', details: `User ${String(updated.id)} signed in`, ip: null }) } catch (e) { }
        }
      } catch (err) {
        console.warn('[nextauth][events] signIn: failed to set IsLoggedIn in Prisma', err.message || err)
      }

    },
    async signOut({ token }) {
      try {
        const id = token?.sub
          if (id) {
          const updated = await prisma.user.update({ where: { id: String(id) }, data: { IsLoggedIn: false } })
          try { broadcastPresence({ userId: String(updated.id), IsLoggedIn: updated.IsLoggedIn, timestamp: new Date().toISOString() }) } catch (e) { }
          // also remove the DB session record for this sessionToken (if present)
          try {
            if (token?.sessionToken) await prisma.session.deleteMany({ where: { sessionToken: String(token.sessionToken) } })
          } catch (e) { /* ignore */ }
          try { await logAudit({ userId: String(updated.id), actorId: String(updated.id), actorName: updated.name ?? updated.username ?? null, action: 'user_signed_out', details: `User ${String(updated.id)} signed out`, ip: null }) } catch (e) { }
        }
      } catch (err) {
        console.warn('[nextauth][events] signOut: failed to clear IsLoggedIn in Prisma', err.message || err)
      }

      // users.json is a read-only export snapshot — we won't write to it from runtime
    }
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        // Log credentials shape and request origin for debugging (do not log passwords in prod)
        console.log('[authorize] called with username/email:', credentials?.username)
        try {
          if (!credentials?.username || !credentials?.password) {
            console.log('[authorize] Missing credentials')
            return null
          }

          // find user regardless of active state so we can surface precise errors
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: credentials.username },
                { email: credentials.username }
              ]
            },
            include: {
              role: true,
              directorate: true,
              entitas: true
            }
          })
          console.log('[authorize] User found:', user ? 'yes' : 'no', user?.username)

          if (!user) {
            console.log('[authorize] User not found for', credentials.username)
            // explicit error so client can show a helpful message
            throw new Error('USER_NOT_FOUND')
          }

          // if user exists but not active, return an explicit error so frontend can show activation message
          if (!user.isActive) {
            console.log('[authorize] Account inactive for', user.username)
            throw new Error('ACCOUNT_INACTIVE')
          }

          // If the stored password is a bcrypt hash, use bcrypt.compare
          const stored = user.password ?? ''
          const isBcryptHash = typeof stored === 'string' && stored.startsWith('$2')

          let passwordOk = false
          if (isBcryptHash) {
            passwordOk = await bcrypt.compare(credentials.password, stored)
          } else {
            // If seed used plaintext, fallback to direct compare (and upgrade to bcrypt)
            passwordOk = credentials.password === stored
          }

          if (!passwordOk) {
            console.log('[authorize] Password mismatch for', user.username)
            throw new Error('INVALID_PASSWORD')
          }

          // If the password was plaintext in the DB, auto-upgrade to bcrypt (opportunistic re-hash)
          if (!isBcryptHash) {
            try {
              const newHash = await bcrypt.hash(credentials.password, 12)
              await prisma.user.update({ where: { id: user.id }, data: { password: newHash } })
              console.log('[authorize] Upgraded plaintext password to bcrypt for', user.username)
            } catch (err) {
              console.error('[authorize] Failed to upgrade password hash for', user.username, err)
            }
          }

          console.log('Login successful for:', user.username)
          return {
            id: user.id,
            username: user.username,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            directorate: user.directorate,
            entitas: user.entitas,
            isActive: user.isActive
          }
        } catch (error) {
          console.error('[authorize] Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    // use JWT strategy, but we will store a server-side sessionToken in DB
    // so we can revoke user sessions by deleting that token.
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      // on sign-in (user present), create a server-side session record and attach sessionToken to the JWT
      if (user) {
        token.role = user.role
        token.directorate = user.directorate
        token.entitas = user.entitas
        token.phone = (user as any).phone
        token.isActive = user.isActive
        // Debug: log entitas attachment
        console.log('[jwt callback] Attaching entitas to token:', { 
          userId: user.id, 
          entitas: user.entitas,
          entitasCode: (user.entitas as any)?.code
        })
        // expose the role's allowedMenus (item-level allowed hrefs) on the token so middleware can enforce item-level access
        try { token.allowedMenus = expandAllowedMenus((user as any).role?.allowedMenus ?? []) } catch (_) { token.allowedMenus = [] }

        try {
          // clean up stale sessions before creating a new one
          await prisma.session.deleteMany({ where: { expires: { lt: new Date() } } })
          const sessionToken = randomBytes(32).toString('hex')
          const expires = new Date(Date.now() + (24 * 60 * 60 * 1000))
          await prisma.session.create({ data: { sessionToken, userId: String(user.id), expires } })
          token.sessionToken = sessionToken
        } catch (err) {
          console.warn('[nextauth][jwt] Failed to create DB session for user', user?.id, err)
        }
        // add a canonical role name string for reliable middleware checks
        try {
          const roleKey = getCanonicalRole((user as any).role?.name ?? (user as any).role)
          token.roleName = roleKey
        } catch (err) {
          // non-fatal
        }
      } else {
        // on subsequent checks, verify the DB session still exists (i.e. not revoked)
        if (token.sessionToken) {
          try {
            const s = await prisma.session.findUnique({ where: { sessionToken: String(token.sessionToken) } })
            if (!s) {
              return {}
            }
            if (new Date(s.expires) < new Date()) {
              await prisma.session.deleteMany({ where: { sessionToken: String(token.sessionToken) } })
              return {}
            }
          } catch (err) {
            console.warn('[nextauth][jwt] Failed to validate DB session', err)
            return {}
          }
        }

        // Always refresh user's role.allowedMenus from DB when we have a user id on the token so
        // changes in the DB are reflected immediately without requiring users to sign out/in.
        try {
          if (token.sub) {
            const u = await prisma.user.findUnique({ 
              where: { id: String(token.sub) }, 
              include: { 
                role: true,
                directorate: true,
                entitas: true
              } 
            })
            if (u) {
              try {
                // keep the full role object on the token so clients can read role.permissions
                token.role = u.role
                token.roleName = getCanonicalRole((u as any).role?.name ?? (u as any).role)
                // Always refresh allowedMenus to reflect DB changes immediately
                token.allowedMenus = expandAllowedMenus((u as any).role?.allowedMenus ?? [])
                // Also refresh directorate and entitas data
                token.directorate = u.directorate
                token.entitas = u.entitas
              } catch (e) {
                // non-fatal
              }
            }
          }
        } catch (err) {
          console.warn('[nextauth][jwt] Failed to refresh roleName/allowedMenus for token', err)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        // also keep a top-level session.role for older helpers that read it
        ;(session as any).role = token.role

        // expose the canonical role name for UI/middleware
        const _tok: any = token as any
        ;(session as any).roleName = token.roleName ?? (typeof token.role === 'string' ? token.role : (_tok.role?.name ?? 'user'))
        session.user.directorate = token.directorate
        session.user.entitas = token.entitas
        // expose phone on client session so pages can prefill phone
        ;(session.user as any).phone = (token as any).phone ?? null
        session.user.isActive = token.isActive as boolean
        // also allow client-side access to sessionToken if needed
        ;(session as any).sessionToken = token.sessionToken
        // expose allowedMenus on client session (if present on token)
        ;(session as any).allowedMenus = (token as any).allowedMenus ?? []
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions as any)