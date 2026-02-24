import { getToken } from 'next-auth/jwt'
import { prisma } from '../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCanonicalRole } from '../config/roleConfig'

// Read permission values (expanded)
export type ReadPermissionValue = 'Owner' | 'OwnEntitas' | 'MarketingOwner' | 'OwnMarketing' | 'WarehouseOwner' | 'All' | 'Disable' | 'Own'
export type PermissionValue = 'Own' | 'All' | 'Disable'
// Permissions are now limited to Read and Delete scopes only (Create/Update removed)
export type PermissionsMap = { read: ReadPermissionValue; delete: PermissionValue }

const DEFAULT_PERMS: PermissionsMap = { read: 'Disable', delete: 'Disable' }

const mapArrayToPerms = (arr: string[]): PermissionsMap => {
  const low = arr.map(a => String(a).toLowerCase())
  const has = (k: string) => low.includes(k)

  // Derive read value from string hints (support legacy tokens like 'read','view','owner','marketing', etc.)
  let readVal: ReadPermissionValue = 'Disable'
  if (has('all') || has('admin') || has('read') || has('view')) readVal = 'All'
  else if (has('ownentitas') || has('own entitas') || has('entitas')) readVal = 'OwnEntitas'
  else if (has('ownmarketing') || has('own marketing') || (has('own') && has('marketing'))) readVal = 'OwnMarketing'
  else if (has('marketing') || has('marketing owner')) readVal = 'MarketingOwner'
  else if (has('warehouse') || has('warehouse owner') || has('wh')) readVal = 'WarehouseOwner'
  else if (has('owner') || has('own')) readVal = 'Owner'

  const deleteVal: PermissionValue = (has('delete') || has('admin')) ? 'All' : 'Disable'

  return {
    read: readVal,
    delete: deleteVal
  }
}

export const normalizePermissions = (raw: any): PermissionsMap => {
  if (!raw) return { ...DEFAULT_PERMS }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    // normalize legacy 'Own' -> 'Owner' for read
    let readRaw = raw.read as any
    if (readRaw === 'Own') readRaw = 'Owner'
    return {
      read: (readRaw as ReadPermissionValue) || 'Disable',
      delete: (raw.delete as PermissionValue) || 'Disable',
    }
  }
  if (Array.isArray(raw)) return mapArrayToPerms(raw)
  return { ...DEFAULT_PERMS }
}

async function getUserWithRoleFromToken(req: NextApiRequest) {
  let token: any = null
  try { token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) } catch (_) { token = null }
  if (!token || !token.sub) return null
  const userId = String(token.sub)
  // include entitas so we can check OwnEntitas easily
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true, entitas: true } })
  return user
}

export const checkCrudPermission = ({
  roleName,
  rolePermissionsRaw,
  userPermissionsRaw,
  action,
  resourceOwnerId,
  currentUserId,
  resourceEntitasId,
  currentUserEntitasId
}: {
  roleName?: string | null
  rolePermissionsRaw?: any
  userPermissionsRaw?: any
  action: 'read' | 'delete'
  resourceOwnerId?: string | null
  currentUserId?: string | null
  // optional context for read checks
  resourceEntitasId?: string | null
  currentUserEntitasId?: string | null
}): boolean => {
  const roleKey = roleName ? getCanonicalRole(roleName) : null
  // superadmin/admin bypass
  if (roleKey === 'superadmin' || roleKey === 'admin') return true

  let perms = normalizePermissions(rolePermissionsRaw)
  // fallback to user-level perms when role-level object not provided
  if (perms === DEFAULT_PERMS && userPermissionsRaw) {
    perms = normalizePermissions(userPermissionsRaw)
  }

  const val = perms[action]

  if (val === 'All') return true
  if (action === 'read') {
    // Owner semantics
    if (val === 'Owner' || val === 'Own') {
      if (!resourceOwnerId || !currentUserId) return false
      return String(resourceOwnerId) === String(currentUserId)
    }

    // OwnEntitas semantics (can be checked without DB when entitas context available)
    if (val === 'OwnEntitas') {
      if (!resourceEntitasId || !currentUserEntitasId) return false
      return String(resourceEntitasId) === String(currentUserEntitasId)
    }

    // MarketingOwner and WarehouseOwner need DB checks (handled in requireCrudPermission)
    return false
  }

  // delete semantics (unchanged)
  if (val === 'Own') {
    if (!resourceOwnerId || !currentUserId) return false
    return String(resourceOwnerId) === String(currentUserId)
  }
  return false
}

export async function requireCrudPermission({
  req,
  res,
  action,
  resourceOwnerId,
  resourceName,
  resourceEntitasId,
  resourceCompanyValues
}: {
  req: NextApiRequest
  res: NextApiResponse
  action: 'read' | 'delete'
  resourceOwnerId?: string | null
  resourceName?: string
  resourceEntitasId?: string | null
  resourceCompanyValues?: string[] | null
}) {
  const user = await getUserWithRoleFromToken(req)
  if (!user) {
    console.warn('[auth] requireCrudPermission: unauthenticated request')
    res.status(401).json({ message: 'Not authenticated' })
    return null
  }

  const roleObj = user.role
  const roleName = roleObj?.name ?? null

  // check simple cases (All / Owner / OwnEntitas / delete) using checkCrudPermission
  const allowedSimple = checkCrudPermission({
    roleName,
    rolePermissionsRaw: roleObj?.permissions,
    userPermissionsRaw: user.permissions,
    action,
    resourceOwnerId: resourceOwnerId ?? null,
    currentUserId: String(user.id),
    resourceEntitasId: resourceEntitasId ?? null,
    currentUserEntitasId: (user as any)?.entitas?.code ?? null
  })

  if (allowedSimple) return { user, role: roleObj }

  // If not allowed yet, handle read cases that require DB checks (MarketingOwner / WarehouseOwner)
  if (action === 'read') {
    const perms = normalizePermissions(roleObj?.permissions ?? user.permissions ?? null)
    const readVal = perms.read

    if ((readVal === 'MarketingOwner') && Array.isArray(resourceCompanyValues) && resourceCompanyValues.length > 0) {
      const found = await prisma.mktCompany.findMany({ where: { value: { in: resourceCompanyValues }, userId: String(user.id) }, select: { value: true } })
      if (found && found.length > 0) return { user, role: roleObj }
    }

    // OwnMarketing: allow if any company value for the resource is associated with the same Entitas as the current user.
    if ((readVal === 'OwnMarketing') && Array.isArray(resourceCompanyValues) && resourceCompanyValues.length > 0) {
      const entitasCode = (user as any)?.entitas?.code
      if (entitasCode) {
        const normalizedCode = String(entitasCode).trim().toLowerCase()
        const matched = resourceCompanyValues.some((v: any) => String(v || '').trim().toLowerCase().startsWith(normalizedCode))
        if (matched) return { user, role: roleObj }
      }
    }

    if ((readVal === 'WarehouseOwner') && Array.isArray(resourceCompanyValues) && resourceCompanyValues.length > 0) {
      const found = await prisma.mktCompany.findMany({ where: { value: { in: resourceCompanyValues }, whId: String(user.id) }, select: { value: true } })
      if (found && found.length > 0) return { user, role: roleObj }
    }
  }

  // Log contextual info to help diagnose unexpected denials during development
  try {
    console.warn('[auth] requireCrudPermission: denied', { roleName, rolePerms: roleObj?.permissions, userPerms: user.permissions, action, resourceName, resourceOwnerId, resourceEntitasId, resourceCompanyValues, currentUserId: user.id })
  } catch (e) { }

  res.status(403).json({ message: `Forbidden: insufficient ${action} permission${resourceName ? ` for ${resourceName}` : ''}` })
  return null
}
