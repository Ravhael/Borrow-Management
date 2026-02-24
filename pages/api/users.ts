import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { emailService } from '../../utils/emailService'
import { logAudit } from '../../utils/auditLogger'
import { requireCrudPermission } from '../../utils/authorization'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Determine effective read permission for the current session user and
      // return data accordingly. "Owner" should only return the current user.
      const { getServerSession } = await import('next-auth/next')
      const { authOptions } = await import('./auth/[...nextauth]')
      const sessionAny: any = await getServerSession(req, res, authOptions as any)
      if (!sessionAny || !sessionAny.user || !sessionAny.user.id) return res.status(401).json({ message: 'Not authenticated' })

      const sessionUser: any = sessionAny.user

      // Resolve role permissions robustly:
      // - prefer permissions attached to session.user.role (object)
      // - otherwise try roleid lookup
      // - otherwise try name lookup
      let rolePermissionsRaw: any = null
      if (sessionUser?.role && typeof sessionUser.role === 'object') {
        rolePermissionsRaw = (sessionUser.role as any).permissions ?? null
      } else {
        if (sessionUser?.roleid) {
          const roleRec = await prisma.role.findUnique({ where: { id: sessionUser.roleid } })
          rolePermissionsRaw = roleRec?.permissions ?? null
        } else if (typeof sessionUser?.role === 'string') {
          const roleRecByName = await prisma.role.findFirst({ where: { name: { equals: String(sessionUser.role), mode: 'insensitive' } } })
          rolePermissionsRaw = roleRecByName?.permissions ?? null
        }
      }

      const { normalizePermissions } = await import('../../utils/authorization')
      const perms = normalizePermissions(rolePermissionsRaw ?? sessionUser.permissions ?? null)

      // If user has global read access, return all users
      if (perms.read === 'All') {
        const users = await prisma.user.findMany({ include: { role: true, directorate: true, entitas: true } })
        const out = users.map(u => ({
          id: u.id,
          username: u.username,
          // do not expose password
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role ? String(u.role.name) : '',
          directorate: u.directorate ? String(u.directorate.name) : null,
          entitas: u.entitas ? String(u.entitas.name) : null,
          roleid: u.roleid ?? null,
          directorateid: u.directorateid ?? null,
          entitasid: u.entitasid ?? null,
          isActive: u.isActive,
          IsLoggedIn: u.IsLoggedIn,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          permissions: u.permissions || []
        }))
        return res.status(200).json({ users: out })
      }

      // If user has Owner read, return only their own user record
      if (perms.read === 'Owner' || perms.read === 'Own') {
        const u = await prisma.user.findUnique({ where: { id: String(sessionUser.id) }, include: { role: true, directorate: true, entitas: true } })
        if (!u) return res.status(404).json({ message: 'User not found' })
        const out = {
          id: u.id,
          username: u.username,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role ? String(u.role.name) : '',
          directorate: u.directorate ? String(u.directorate.name) : null,
          entitas: u.entitas ? String(u.entitas.name) : null,
          roleid: u.roleid ?? null,
          directorateid: u.directorateid ?? null,
          entitasid: u.entitasid ?? null,
          isActive: u.isActive,
          IsLoggedIn: u.IsLoggedIn,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          permissions: u.permissions || []
        }
        return res.status(200).json({ users: [out] })
      }

      // OwnEntitas: return only users in the same entitas
      if (perms.read === 'OwnEntitas') {
        const entitasId = sessionUser.entitasid ?? null
        if (!entitasId) return res.status(200).json({ users: [] })
        const users = await prisma.user.findMany({ where: { entitasid: entitasId }, include: { role: true, directorate: true, entitas: true } })
        const out = users.map(u => ({
          id: u.id,
          username: u.username,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role ? String(u.role.name) : '',
          directorate: u.directorate ? String(u.directorate.name) : null,
          entitas: u.entitas ? String(u.entitas.name) : null,
          roleid: u.roleid ?? null,
          directorateid: u.directorateid ?? null,
          entitasid: u.entitasid ?? null,
          isActive: u.isActive,
          IsLoggedIn: u.IsLoggedIn,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          permissions: u.permissions || []
        }))
        return res.status(200).json({ users: out })
      }

      // Otherwise forbidden
      return res.status(403).json({ message: 'Forbidden' })
    } catch (error) {
      console.error('Error fetching users:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      // Allow public registration (no session). If an authenticated session exists, require create permission
      // so admin UI can't create users unless authorized.
      try {
        const { getServerSession } = await import('next-auth/next')
        const { authOptions } = await import('./auth/[...nextauth]')
        const sessionAny: any = await getServerSession(req, res, authOptions as any)
        if (sessionAny && sessionAny.user) {
          const role = (await import('../../config/roleConfig')).getCanonicalRole(sessionAny.user.role)
          if (!(role === 'admin' || role === 'superadmin')) return res.status(403).json({ message: 'Forbidden' })
        }
      } catch (err) {
        // If the session check fails unexpectedly, log and continue to allow registration
        console.warn('[users API] session check failed, allowing public registration', err)
      }

      const {
        username,
        fullName,
        name,
        email,
        password,
        role,
        directorateId,
        entitasId,
        phone
      } = req.body

      // Validate required fields
      const finalName = (fullName || name || '').trim()
      if (!username || !finalName || !email || !password || !role) {
        return res.status(400).json({ message: 'username, name/fullName, email, password and role are required' })
      }

      // Check duplicates in DB
      const existingUserByUsername = await prisma.user.findUnique({ where: { username } })
      if (existingUserByUsername) return res.status(409).json({ message: 'Username already exists' })
      const existingUserByEmail = await prisma.user.findUnique({ where: { email } })
      if (existingUserByEmail) return res.status(409).json({ message: 'Email already exists' })

      // Hash password
      const hashed = await bcrypt.hash(password, 12)

      // Resolve role id from provided role input (accept name or id)
      const roleInput = String(role)
      let roleRecord = await prisma.role.findUnique({ where: { id: roleInput } })
      if (!roleRecord) {
        // try match by name case-insensitive
        roleRecord = await prisma.role.findFirst({ where: { name: { equals: roleInput, mode: 'insensitive' } } })
      }
      if (!roleRecord) {
        return res.status(400).json({ message: 'Invalid role specified' })
      }

      const r = String(roleRecord.name).toLowerCase()
      let prefix = 'usr'
      if (r.includes('super') || r.includes('sp')) prefix = 'sp'
      else if (r.includes('admin')) prefix = 'adm'
      else if (r.includes('market')) prefix = 'mkt'
      else if (r.includes('gudang') || r.includes('warehouse')) prefix = 'wh'
      else if (r.includes('user') || r.includes('peminjam')) prefix = 'pjm'

      // Compute the next numeric suffix for IDs with the same prefix to avoid collisions
      const existingIds = await prisma.user.findMany({ where: { id: { startsWith: prefix } }, select: { id: true } })
      const numericSuffixes = existingIds
        .map(e => {
          const s = String(e.id).slice(prefix.length)
          const n = parseInt(s, 10)
          return Number.isFinite(n) ? n : 0
        })
        .filter(Boolean)

      let nextIndex = (numericSuffixes.length ? Math.max(...numericSuffixes) : 0) + 1

      const now = new Date().toISOString()

      const newUser: any = {
        // id is assigned at write time (candidateId) to avoid using an undefined variable
        username,
        password: hashed,
        name: finalName,
        email,
        phone: phone || '',
        role: roleRecord.name,
        roleid: roleRecord.id,
        directorateid: directorateId ?? null,
        entitasid: entitasId ?? null,
        isActive: false, // newly registered users are inactive until approved
        IsLoggedIn: false,
        createdAt: now,
        updatedAt: now,
        permissions: []
      }

      // Create user in Prisma DB
      // try creating the user, but retry a few times if the computed ID collides (P2002 unique constraint on id)
      let created: any = null
      const maxCreateAttempts = 6
      for (let attempt = 0; attempt < maxCreateAttempts; attempt++) {
        const candidateId = `${prefix}${String(nextIndex).padStart(3, '0')}`
        try {
          created = await prisma.user.create({
            data: {
              id: candidateId,
              username: newUser.username,
              password: newUser.password,
              name: newUser.name,
              email: newUser.email,
              phone: newUser.phone || '',
              roleid: newUser.roleid ?? roleRecord.id,
              directorateid: newUser.directorateid ?? null,
              entitasid: newUser.entitasid ?? null,
              isActive: false,
              IsLoggedIn: false,
              permissions: newUser.permissions || []
            }
          })
          // success — break out of retry loop
          break
        } catch (err: any) {
          // Prisma unique violation errors are P2002 — detect and handle
          // If it's a unique constraint on id, increment and retry.
          const code = err?.code ?? ''
          const metaTarget = err?.meta?.target ?? null
          console.error('[users API] prisma.create error code:', code, 'target:', metaTarget)
          if (code === 'P2002' && Array.isArray(metaTarget) && metaTarget.includes('id')) {
            // collision on id — increment and retry
            nextIndex += 1
            // if we've exhausted attempts, rethrow
            if (attempt === maxCreateAttempts - 1) throw err
            continue
          }
          // if it's a P2002 on username or email, translate to 409 for the client
          if (code === 'P2002' && Array.isArray(metaTarget) && (metaTarget.includes('username') || metaTarget.includes('email'))) {
            const field = metaTarget.includes('username') ? 'username' : 'email'
            return res.status(409).json({ message: `Conflict: ${field} already exists` })
          }
          // otherwise rethrow to outer handler
          throw err
        }
      }

        // return created user (without password) and include resolved names for frontend
        const { password: _p, ...publicUser } = created as any
        const roleName = (await prisma.role.findUnique({ where: { id: publicUser.roleid ?? '' } }))?.name ?? null
        const directorateNameCreated = publicUser.directorateid ? (await prisma.directorate.findUnique({ where: { id: publicUser.directorateid } }))?.name ?? null : null
        const entitasNameCreated = publicUser.entitasid ? (await prisma.entitas.findUnique({ where: { id: publicUser.entitasid } }))?.name ?? null : null
        const responseCreated = { ...publicUser, role: roleName, directorate: directorateNameCreated, entitas: entitasNameCreated }
        // record audit event (opt into actor info in payload)
        try {
          await logAudit({ userId: responseCreated.id, actorId: (req.body as any).actorId ?? null, actorName: (req.body as any).actorName ?? 'system', action: 'user_created', details: `User ${responseCreated.id} created`, ip: String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '') })
        } catch { }

        // Attempt to send account creation email and store notification metadata
        try {
          const tempPass = (req.body as any).temporaryPassword ?? undefined
          const result = await emailService.sendAccountCreationNotification({ name: responseCreated.name, email: responseCreated.email, username: responseCreated.username }, { temporaryPassword: tempPass })
          // persist notification metadata in the user row
          const createdNotif: any = { type: 'account_creation', sentAt: new Date().toISOString(), to: responseCreated.email, success: !!result, error: result ? null : 'send failed' }
          createdNotif.actorId = (req.body as any).actorId ?? null
          createdNotif.actorName = (req.body as any).actorName ?? null
          try {
            // append to history (do not overwrite existing notification json)
            await import('../../utils/serverNotifications').then(m => m.appendUserNotification(responseCreated.id as string, createdNotif))
          } catch (err) { console.error('[users API] append notification failed', err) }
        } catch (err) {
          console.error('[users API] account creation email send failed', err)
        }

        return res.status(201).json({ message: 'User created (pending approval)', user: responseCreated })
    } catch (error) {
      console.error('Error creating user:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }

  } else if (req.method === 'PUT') {
    try {
      const { userId, userData } = req.body

      if (!userId || !userData) {
        return res.status(400).json({ message: 'userId and userData are required' })
      }

      // Check existence in DB
      const existing = await prisma.user.findUnique({ where: { id: userId } })
      if (!existing) return res.status(404).json({ message: 'User not found' })

      // Require admin role or allow users to update their own profile
      try {
        const { getServerSession } = await import('next-auth/next')
        const { authOptions } = await import('./auth/[...nextauth]')
        const sessionAny: any = await getServerSession(req, res, authOptions as any)
        if (!sessionAny || !sessionAny.user) return res.status(401).json({ message: 'Not authenticated' })
        const role = (await import('../../config/roleConfig')).getCanonicalRole(sessionAny.user.role)
        if (!(role === 'admin' || role === 'superadmin')) {
          if (String(userId) !== String(sessionAny.user.id)) return res.status(403).json({ message: 'Forbidden' })
        }
      } catch (err) {
        return res.status(401).json({ message: 'Not authenticated' })
      }

      // Update user data (allow updating name, email, username and isActive / role / directorateid / entitasid)
      const allowedFields = ['name', 'email', 'username', 'isActive', 'role', 'directorateid', 'entitasid', 'phone', 'password']
      // Build update payload for DB
      const prismaUpdate: any = {}
      for (const field of allowedFields) {
        if (userData[field] === undefined) continue
        if (field === 'password') {
          prismaUpdate.password = bcrypt.hashSync(userData.password as string, 12)
        } else if (field === 'role') {
          // map role input to role.id
          const input = String(userData.role)
          let roleRec = await prisma.role.findUnique({ where: { id: input } })
          if (!roleRec) roleRec = await prisma.role.findFirst({ where: { name: { equals: input, mode: 'insensitive' } } })
          if (!roleRec) return res.status(400).json({ message: 'Invalid role specified' })
          prismaUpdate.roleid = roleRec.id
        } else {
          prismaUpdate[field] = userData[field]
        }
      }

        try {
        const updated = await prisma.user.update({ where: { id: userId }, data: prismaUpdate })
        // normalize shape for response
        // fetch related names to include in response so frontend doesn't need a refresh
        const directorateName = updated.directorateid ? (await prisma.directorate.findUnique({ where: { id: updated.directorateid } }))?.name ?? null : null
        const entitasName = updated.entitasid ? (await prisma.entitas.findUnique({ where: { id: updated.entitasid } }))?.name ?? null : null

        const responseUser = {
          id: updated.id,
          username: updated.username,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          role: (await prisma.role.findUnique({ where: { id: updated.roleid ?? '' } }))?.name ?? null,
          roleid: updated.roleid,
          directorateid: updated.directorateid,
          entitasid: updated.entitasid,
          directorate: directorateName,
          entitas: entitasName,
          isActive: updated.isActive,
          IsLoggedIn: updated.IsLoggedIn,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          permissions: updated.permissions
        }
        // audit: record update event
        try {
          await logAudit({ userId: responseUser.id, actorId: (req.body as any).actorId ?? null, actorName: (req.body as any).actorName ?? 'system', action: 'user_updated', details: `Updated user ${responseUser.id}`, ip: String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? ''), meta: { updatedFields: Object.keys(userData) } })
        } catch { }

        // If the user was activated (approved) as part of this update, send approval email
            try {
              if (userData.isActive === true && existing && existing.isActive !== true) {
                const sendOk = await emailService.sendAccountApprovalNotification({ name: updated.name, email: updated.email, username: updated.username })
                const approvalNotif: any = { type: 'account_approval', sentAt: new Date().toISOString(), to: updated.email, success: !!sendOk, error: sendOk ? null : 'send failed' }
                try { approvalNotif.actorId = (req.body as any).actorId ?? null; approvalNotif.actorName = (req.body as any).actorName ?? null; await import('../../utils/serverNotifications').then(m => m.appendUserNotification(updated.id as string, approvalNotif)) } catch (err) { console.error('[users API] append approval notification failed', err) }
              }
            } catch (err) {
              console.error('[users API] account approval email failed', err)
            }

        return res.status(200).json({ message: 'User updated successfully', user: responseUser })
      } catch (err) {
        console.error('[users API] Failed to update user:', err)
        return res.status(500).json({ message: 'Failed to update user in DB' })
      }

    } catch (error) {
      console.error('Error updating user:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { userId } = req.body

      if (!userId) return res.status(400).json({ message: 'userId is required' })

      // Confirm record exists
      const existing = await prisma.user.findUnique({ where: { id: String(userId) } })
      if (!existing) return res.status(404).json({ message: 'User not found' })

      // Require delete permission for this user
      const permCheck = await requireCrudPermission({ req, res, action: 'delete', resourceOwnerId: String(userId), resourceName: 'user' })
      if (!permCheck) return

      // Attempt to delete user. If delete fails due to constraints, return 409
      try {
        await prisma.user.delete({ where: { id: String(userId) } })
        try { await logAudit({ userId: String(userId), actorId: (req.body as any).actorId ?? null, actorName: (req.body as any).actorName ?? 'system', action: 'user_deleted', details: `User ${String(userId)} deleted`, ip: String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '') }) } catch { }
        return res.status(200).json({ message: 'User deleted successfully' })
      } catch (err) {
        console.error('[users API] Failed to delete user:', err)
        return res.status(409).json({ message: 'Failed to delete user — may be constrained by FK relations' })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' })
  }
}
