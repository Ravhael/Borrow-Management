import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { getCanonicalRole } from '../../config/roleConfig'
import { menuGroups } from '../../config/menuGroups'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' })

    const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } })
    const allowed: Record<string, string[]> = {}
    const allowedItems: Record<string, string[]> = {}

    for (const r of roles) {
      const key = getCanonicalRole(r.name)
      // Read either new `allowedMenus` or legacy `menuGroups` stored in DB for backward compatibility
      const rawMenus = (r as any).allowedMenus ?? (r as any).menuGroups ?? []
      if (rawMenus && Array.isArray(rawMenus) && rawMenus.length > 0) {
        try {
          const vals = (rawMenus as any[]).map(v => String(v))
          allowed[key] = vals

          // build item-level href list: if val is an href keep it, otherwise expand group title
          const items: string[] = []
          for (const v of vals) {
            if (v.startsWith('/')) {
              items.push(v)
            } else {
              // expand group using local config for label/icon lookup only
              const g = menuGroups.find(m => String(m.title).toLowerCase() === String(v).toLowerCase())
              if (g && Array.isArray((g as any).items)) {
                (g as any).items.forEach((it: any) => items.push(it.href))
              }
            }
          }

          allowedItems[key] = Array.from(new Set(items))
        } catch {
          // If parsing fails, skip exposing mapping for this role (do not fallback to defaults)
          continue
        }
      }
    }
      // Build mappings keyed by the exact role name (case-insensitive key)
      const allowedByRoleName: Record<string, string[]> = {}
      const allowedItemsByRoleName: Record<string, string[]> = {}

      for (const r of roles) {
        const roleKey = String(r.name).toLowerCase()
        // Read either new `allowedMenus` or legacy `menuGroups` stored in DB for backward compatibility
        const rawMenus = (r as any).allowedMenus ?? (r as any).menuGroups ?? []
        if (rawMenus && Array.isArray(rawMenus) && rawMenus.length > 0) {
          try {
            const vals = (rawMenus as any[]).map(v => String(v))
            allowedByRoleName[roleKey] = vals

            // build item-level href list: if val is an href keep it, otherwise expand group title
            const items: string[] = []
            for (const v of vals) {
              if (v.startsWith('/')) {
                items.push(v)
              } else {
                // expand group using local config for label/icon lookup only
                const g = menuGroups.find(m => String(m.title).toLowerCase() === String(v).toLowerCase())
                if (g && Array.isArray((g as any).items)) {
                  (g as any).items.forEach((it: any) => items.push(it.href))
                }
              }
            }

            allowedItemsByRoleName[roleKey] = Array.from(new Set(items))
          } catch {
            // If parsing fails, skip exposing mapping for this role (do not fallback to defaults)
            continue
          }
        }
      }

    // Resolve current session and prefer the freshest role from DB for the current user.
    const session = await getServerSession(req, res, authOptions as any) as any
    let currentKey: string | null = null
    let currentRoleNameKey: string | null = null
    if (session?.user) {
      try {
        // try to lookup the user record in DB by id (fresh source of truth)
        const u = await prisma.user.findUnique({ where: { id: String(session.user.id) }, include: { role: true } })
        const roleNameFromDb = (u && ((u as any).role ? (u as any).role.name : (u as any).role)) || session.user.role || session.user.name || session.user.email
        currentKey = getCanonicalRole(roleNameFromDb)
        currentRoleNameKey = u && (u as any).role ? String((u as any).role.name).toLowerCase() : null
      } catch (e) {
        // fallback to session-derived role if DB lookup fails
        currentKey = getCanonicalRole(session.user.role ?? session.user.name ?? session.user.email)
        currentRoleNameKey = session.user.role ? String(session.user.role).toLowerCase() : null
      }
    }

    // If no authenticated session or no mapping for current role, return empty mappings (conservative)
    if (!currentKey) {
      return res.status(200).json({ ok: true, roles, allowedMenusByRole: {}, allowedMenuItemsByRole: {} })
    }

      const allowedForCurrent = currentRoleNameKey && allowedByRoleName[currentRoleNameKey] ? allowedByRoleName[currentRoleNameKey] : []
      const itemsForCurrent = currentRoleNameKey && allowedItemsByRoleName[currentRoleNameKey] ? allowedItemsByRoleName[currentRoleNameKey] : []

    const payloadAllowed: Record<string, string[]> = {}
    const payloadItems: Record<string, string[]> = {}
    payloadAllowed[currentKey] = allowedForCurrent
    payloadItems[currentKey] = itemsForCurrent

    return res.status(200).json({ ok: true, roles, currentRole: currentKey, allowedMenusByRole: payloadAllowed, allowedMenuItemsByRole: payloadItems })
  } catch (err: any) {
    console.error('/api/menu-groups error:', err)
    return res.status(500).json({ ok: false, error: err?.message ?? 'server-error' })
  }
}
