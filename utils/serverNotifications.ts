import { prisma } from '../lib/prisma'

export interface NotificationEntry {
  type: string
  sentAt: string
  to?: string
  success?: boolean
  error?: string | null
  meta?: any
  actorId?: string | null
  actorName?: string | null
}

/** Append a notification entry to the user's notification.history array and set lastNotification */
export async function appendUserNotification(userId: string, entry: NotificationEntry) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { notification: true } })
  const existing = (u && u.notification) ? (u.notification as any) : {}
  const history = Array.isArray(existing?.history) ? existing.history : []
  const next = { ...existing, history: [...history, entry], lastNotification: entry }
  await prisma.user.update({ where: { id: userId }, data: { notification: next } as any })
  return next
}

/** Convenience helper to safely append by email: finds user then appends */
export async function appendUserNotificationByEmail(email: string, entry: NotificationEntry) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) return null
  return appendUserNotification(user.id, entry)
}
