import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

// Pages that should always be public
const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/404', '/403', '/_next', '/api/auth', '/favicon.ico', '/static']

// Map path prefixes to required role keys matching getCanonicalRole values
const ROLE_PATH_MAP: { prefix: string; role: string }[] = [
  { prefix: '/superadmin', role: 'superadmin' },
  { prefix: '/admin', role: 'admin' },
  { prefix: '/user', role: 'regular' },
  { prefix: '/marketing', role: 'marketing' },
  { prefix: '/gudang', role: 'gudang' },
]

function isPublicPath(pathname: string) {
  // quick allow: common static file extensions (images, icons) so public assets (like /logo_indovisual.png) don't get redirected to login
  if (/\.(png|jpg|jpeg|svg|ico)$/i.test(pathname)) return true
  // allow exact public matches or _next/static assets
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return true
  // allow some library/build resources
  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/') || pathname.startsWith('/assets/')) return true
  return false
}

function requiredRoleForPath(pathname: string): string | null {
  for (const m of ROLE_PATH_MAP) {
    if (pathname === m.prefix || pathname.startsWith(m.prefix + '/')) return m.role
  }
  return null
}

const stripBasePath = (pathname: string) => {
  if (!BASE_PATH) return pathname
  if (pathname === BASE_PATH || pathname === `${BASE_PATH}/`) return '/'
  return pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) || '/' : pathname
}

const addBasePath = (pathname: string) => {
  if (!BASE_PATH) return pathname
  if (!pathname.startsWith('/')) return `${BASE_PATH}/${pathname}`
  if (pathname.startsWith(BASE_PATH)) return pathname
  if (pathname === '/') return BASE_PATH || '/'
  return `${BASE_PATH}${pathname}`
}

/**
 * Determine the external origin for the current request, preferring
 * X-Forwarded-* headers when present (so redirects use the proxy host).
 */
const getRequestOrigin = (req: NextRequest) => {
  const forwardedProto = req.headers.get('x-forwarded-proto')
  const forwardedHost = req.headers.get('x-forwarded-host')
  const host = forwardedHost || req.headers.get('host') || req.nextUrl.host
  const proto = forwardedProto || (req.headers.get('x-forwarded-proto') ? req.headers.get('x-forwarded-proto') : 'http')
  // proto may include port or be 'http'/'https'
  return `${proto}://${host}`
}

// allow superadmin access to all role gated paths; otherwise role must match exactly
function isRoleAuthorized(userRole: string | undefined, required: string) {
  if (!userRole) return false
  const normalized = String(userRole).toLowerCase()
  if (normalized.includes('super')) return true
  return normalized.includes(required)
}

export async function middleware(req: NextRequest) {
  const rawPathname = req.nextUrl.pathname || '/'
  const pathname = stripBasePath(rawPathname)

  // allow public paths
  if (isPublicPath(pathname)) return NextResponse.next()

  // allow unauthenticated requests to certain public API endpoints
  // - GET /api/roles should always be public (registration picks role list)
  // - POST /api/users is the registration endpoint and must be public
  // - GET /api/entitas should be public so the public registration form can fetch available entitas
  if (pathname.startsWith('/api/roles')) return NextResponse.next()
  // public password reset request (from forgot-password form)
  if (pathname === '/api/users/request-reset' && req.method === 'POST') return NextResponse.next()
  // publicly accept token-based reset submissions
  if (pathname === '/api/users/perform-reset' && req.method === 'POST') return NextResponse.next()
  if (pathname.startsWith('/api/entitas') && req.method === 'GET') return NextResponse.next()
  // allow reminders endpoints to be triggered without auth in local/dev environments (use with caution)
  if (pathname.startsWith('/api/reminders')) return NextResponse.next()
  if (pathname === '/api/users' && req.method === 'POST') return NextResponse.next()

  // get token (from next-auth jwt) if present
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // not signed in → redirect to login
  if (!token) {
    const origin = getRequestOrigin(req)
    const loginUrl = new URL(addBasePath('/login'), origin)
    loginUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // If we have a token but it does not expose a usable role value
  // (no canonical roleName, and no role string/object), treat the
  // session as unauthenticated so we force sign-in. This prevents
  // a situation where the client sees "authenticated" and redirects
  // to a role-gated page, only for middleware to send a 403 because
  // the token lacks a role claim.
  const tokenAny: any = token as any
  const effectiveRole = tokenAny?.roleName ?? (typeof tokenAny?.role === 'string' ? tokenAny.role : tokenAny?.role?.name)
  // If there is no server-side sessionToken on the token, this may be a
  // stale JWT-only session (created before we started writing DB sessions),
  // or a session that was revoked in the DB. Treat tokens without a server
  // sessionToken as unauthenticated and redirect to login so the client
  // can re-authenticate and create a fresh DB-backed session.
  if (!tokenAny?.sessionToken) {
      const origin = getRequestOrigin(req)
      const loginUrl = new URL(addBasePath('/login'), origin)
    loginUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
      // mark that this login page is the result of a stale/missing server session
      loginUrl.searchParams.set('stale', '1')
    return NextResponse.redirect(loginUrl)
  }
    if (!effectiveRole) {
      const origin = getRequestOrigin(req)
      const loginUrl = new URL(addBasePath('/login'), origin)
      loginUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
      // indicate to the client that this redirect is due to a stale/missing role
      loginUrl.searchParams.set('stale', '1')
      return NextResponse.redirect(loginUrl)
    }

    // Mode-based access control for loan detail paths.
    // Example: /peminjaman/1764670814893?mode=warehouse should only be accessible by `gudang` (warehouse) or superadmin.
    //          /peminjaman/1764670814893?mode=approve should only be accessible by `marketing` or superadmin.
    try {
      const mode = String(req.nextUrl.searchParams.get('mode') ?? '').toLowerCase()
      if (pathname.startsWith('/peminjaman/') && mode) {
        let modeRequiredRole: string | null = null
        if (mode === 'warehouse') modeRequiredRole = 'gudang'
        else if (mode === 'approve') modeRequiredRole = 'marketing'

        if (modeRequiredRole) {
          const userRole = (token as any).roleName ?? (token as any).role
          // debug log
          try { console.debug('[middleware] mode guard:', mode, 'requires:', modeRequiredRole, 'userRole:', JSON.stringify(userRole)) } catch {}

          if (!isRoleAuthorized(userRole, modeRequiredRole)) {
            const origin = getRequestOrigin(req)
            const forbiddenUrl = new URL(addBasePath('/403'), origin)
            forbiddenUrl.searchParams.set('from', req.nextUrl.pathname + req.nextUrl.search)
            forbiddenUrl.searchParams.set('required', modeRequiredRole)
            try { const roleName = (token as any)?.roleName ?? (token as any)?.role?.name ?? String((token as any)?.role ?? '') ; forbiddenUrl.searchParams.set('current', roleName) } catch {}
            return NextResponse.redirect(forbiddenUrl.toString())
          }
        }
      }
    } catch (e) {
      // ignore errors when parsing mode; fallback to default behavior
    }

  // check required role for path
  const requiredRole = requiredRoleForPath(pathname)
  if (!requiredRole) {
    // no specific role required — authenticated users can proceed
    return NextResponse.next()
  }

  // token.role may be an object or string — prefer a normalized roleName if available
  const userRole = (token as any).roleName ?? (token as any).role

  // debug: log token role (dev only)
  try {
    // eslint-disable-next-line no-console
    console.debug('[middleware] userRole:', JSON.stringify(userRole), 'required:', requiredRole, 'path:', pathname)
  } catch {}

  // If the role has an explicit allowedMenus whitelist (item-level grants), prefer that as the source of truth.
  // - If the requested path matches one of the allowed menu hrefs, grant access regardless of the prefix-based role.
  // - If the role defines an allowedMenus list but the requested path is not included, deny access.
  try {
    const tokenAny: any = token
    const allowedMenusAny = Array.isArray(tokenAny?.allowedMenus) ? tokenAny.allowedMenus : null
    if (allowedMenusAny && allowedMenusAny.length > 0) {
      const userAny: any = tokenAny
      const slugBase = (userAny?.username) || userAny?.name || (userAny?.email ? String(userAny.email).split('@')[0] : '') || 'me'
      const slug = String(slugBase).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

      const pathMatchesAllowed = allowedMenusAny.some((href: string) => {
        if (!href) return false
        if (href === pathname) return true
        if (href.includes('[namauser]')) {
          try {
            const resolved = href.replace('[namauser]', encodeURIComponent(slug))
            if (resolved === pathname) return true
          } catch (e) { }
          const patternStr = '^' + href.replace(/[[\]{}()+?.\\^$|]/g, ch => (ch === '[' ? '\[' : ch)).replace(/\[namauser\]/g, '[^/]+') + '$'
          try { if (new RegExp(patternStr).test(pathname)) return true } catch (e) { }
        }
        if (href.endsWith('/') && pathname.startsWith(href)) return true
        if (!href.endsWith('/') && pathname.startsWith(href + '/')) return true
        return false
      })

      // DEBUG: log allowedMenus and result to help diagnose mismatches
      try { console.debug('[middleware] allowedMenus check', { allowedMenus: allowedMenusAny, path: pathname, matches: pathMatchesAllowed }) } catch (e) {}

      if (pathMatchesAllowed) {
        return NextResponse.next()
      }

      // explicit allowedMenus defined but path not matched -> deny
      const origin = getRequestOrigin(req)
      const forbiddenUrl = new URL(addBasePath('/403'), origin)
      forbiddenUrl.searchParams.set('from', req.nextUrl.pathname + req.nextUrl.search)
      forbiddenUrl.searchParams.set('required', String(tokenAny?.roleName ?? tokenAny?.role?.name ?? ''))
      try { forbiddenUrl.searchParams.set('current', String(tokenAny?.roleName ?? tokenAny?.role?.name ?? '')) } catch (e) { }
      return NextResponse.redirect(forbiddenUrl.toString())
    }
  } catch (err) {
    // on error, be conservative: allow through so we don't accidentally lock out users due to parsing bugs
    console.warn('[middleware] allowed-menus enforcement skipped due to error', err)
  }

  // No explicit allowedMenus list defined for this role — fall back to role prefix check
  if (isRoleAuthorized(userRole, requiredRole)) {
    return NextResponse.next()
  }

  // authenticated but not authorized — redirect to dedicated 403 page
  try { console.debug('[middleware] 403 redirect decision', { host: req.headers.get('host'), xForwardedHost: req.headers.get('x-forwarded-host'), reqUrl: req.url }) } catch {}
  // Build an absolute 403 URL on the same origin and redirect
  const forbiddenPath = addBasePath('/403')
  const origin = getRequestOrigin(req)
  const temp = new URL(forbiddenPath, origin)
  temp.searchParams.set('from', req.nextUrl.pathname + req.nextUrl.search)
  temp.searchParams.set('required', requiredRole)
  try {
    const roleName = (token as any)?.roleName ?? (token as any)?.role?.name ?? String((token as any)?.role ?? '')
    temp.searchParams.set('current', roleName)
  } catch {}
  return NextResponse.redirect(temp.toString())
}

export const config = {
  // run middleware for everything except API auth routes and some static build paths
  matcher: [
    '/((?!_next/static|static|favicon.ico|api/auth/|api/presence/subscribe|api/presence/subscribe-user).*)'
  ]
}
