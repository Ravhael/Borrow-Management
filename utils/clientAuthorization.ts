import { PermissionsMap, normalizePermissions } from './authorization'
import type { Session } from 'next-auth'

export const getClientPermissions = (session: Session | null | undefined): PermissionsMap => {
  if (!session || !session.user) return normalizePermissions(null)
  // session.user.role may be an object with permissions or a string
  const roleAny: any = (session as any).role
  const roleNameFallback = (session as any).roleName ?? (typeof roleAny === 'string' ? roleAny : undefined)
  const rolePerms = roleAny?.permissions ?? null
  const userPerms = (session.user as any).permissions
  // prefer role-level permissions when present, otherwise fall back to user-level permissions
  return normalizePermissions(rolePerms ?? userPerms ?? null)
}

export const isAdmin = (session: Session | null | undefined) => {
  if (!session || !session.user) return false
  const roleAny: any = (session as any).role
  const roleName = roleAny?.name ?? (typeof roleAny === 'string' ? roleAny : (session as any).roleName ?? null)
  if (typeof roleName === 'string') {
    const key = roleName.toLowerCase()
    return key.includes('super') || key.includes('admin')
  }
  return false
}

export const canPerform = (session: Session | null | undefined, action: 'read' | 'delete', resourceOwnerId?: string | null, resourceEntitasId?: string | null) => {
  if (!session || !session.user) return false
  // admins bypass
  if (isAdmin(session)) return true
  const perms = getClientPermissions(session)

  const value: any = perms[action]
  if (value === 'All') return true
  // Owner / Own (legacy) mapping
  if (value === 'Owner' || value === 'Own') {
    if (!resourceOwnerId) return false
    const currentUserId = String(session.user.id)
    return String(resourceOwnerId) === currentUserId
  }
  // OwnEntitas client-side heuristic: compare user's entitas code to the resource
  if (value === 'OwnEntitas') {
    const userEntitas = (session.user as any)?.entitas?.code ?? (session.user as any)?.entitas ?? null
    if (!userEntitas || !resourceEntitasId) return false
    return String(userEntitas) === String(resourceEntitasId)
  }
  // MarketingOwner / WarehouseOwner cannot be reliably checked client-side without extra context (server enforces)
  return false
}

export const isMenuAllowed = (session: Session | null | undefined, pathname: string): boolean => {
  if (!session) return false
  const mgAny: any = (session as any).allowedMenus
  if (!Array.isArray(mgAny) || mgAny.length === 0) return true // no restriction
  const slugBase = (session.user as any)?.username || (session.user as any)?.name || (session.user as any)?.email?.split('@')[0] || 'me'
  const slug = String(slugBase).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  return mgAny.some((href: string) => {
    if (!href) return false
    if (href === pathname) return true
    if (href.includes('[namauser]')) {
      try { if (href.replace('[namauser]', encodeURIComponent(slug)) === pathname) return true } catch (e) {}
      const patternStr = '^' + href.replace(/[[\]{}()+?.\\^$|]/g, ch => (ch === '[' ? '\[' : ch)).replace(/\[namauser\]/g, '[^/]+') + '$'
      try { if (new RegExp(patternStr).test(pathname)) return true } catch (_) {}
    }
    if (href.endsWith('/') && pathname.startsWith(href)) return true
    if (!href.endsWith('/') && pathname.startsWith(href + '/')) return true
    return false
  })
}
