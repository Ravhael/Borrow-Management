import { prisma } from '../lib/prisma'

export type AuditEvent = {
  userId?: string | null
  actorId?: string | null
  actorName?: string | null
  action: string
  details?: string | null
  ip?: string | null
  meta?: any
}

export async function logAudit(event: AuditEvent) {
  try {
    // only attempt to write if prisma.auditLog exists (migration not applied yet in some environments)
    if ((prisma as any).auditLog === undefined) {
      // gracefully fallback to console log
      console.info('[audit] (mock) ', event)
      return null
    }

    const created = await (prisma as any).auditLog.create({
      data: {
        userId: event.userId ?? null,
        actorId: event.actorId ?? null,
        actorName: event.actorName ?? null,
        action: event.action,
        details: event.details ?? null,
        ip: event.ip ?? null,
        meta: event.meta ?? null
      }
    })

    return created
  } catch (err) {
    console.error('[audit] failed to log audit event', err)
    return null
  }
}
