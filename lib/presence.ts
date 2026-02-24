import { NextApiResponse } from 'next'
import { prisma } from './prisma'

type Subscriber = {
  id: string
  res: NextApiResponse
}

// general subscribers (admin UI, monitoring)
const subscribers = new Map<string, Subscriber>()

// per-user subscribers keyed by userId -> Map<subId, Subscriber>
const userSubscribers = new Map<string, Map<string, Subscriber>>()

// track recent lifecycle events for debugging (last add/close timestamps etc.)
export const userLastEvents = new Map<string, { lastAdd?: number; lastClose?: number; lastAddr?: string; lastSubId?: string; lastHeartbeatAt?: number; lastHeartbeatError?: string }>()

// helper for socket address human readable string
function socketInfo(res: NextApiResponse) {
  try {
    const socket: any = (res as any).socket
    if (socket && socket.remoteAddress) return `${socket.remoteAddress}:${socket.remotePort}`
  } catch {}
  return 'unknown'
}

// Shorter heartbeat helps keep connections alive behind strict proxies.
// Make interval configurable via env var `PRESENCE_HEARTBEAT_MS` for flexibility on servers
const HEARTBEAT_INTERVAL_MS = Number(process.env.PRESENCE_HEARTBEAT_MS) || 7_000

function startHeartbeat(res: NextApiResponse, subId?: string) {
  if (!res || typeof res.write !== 'function') return null
  const socketStr = socketInfo(res)
  let count = 0
  const timer = setInterval(() => {
    try {
      // ensure socket doesn't timeout
      try { const sock: any = (res as any).socket; if (sock && typeof sock.setTimeout === 'function') sock.setTimeout(0) } catch {}
      // comment-based keep-alive so proxies keep the stream open
      res.write(': heartbeat\n\n')
      count += 1
      // occasionally log a debug line to show connection is healthy
      if (count % 30 === 0) {
        try { console.debug(`[presence] heartbeat tick sub=${subId ?? 'unknown'} count=${count} socket=${socketStr}`) } catch {}
      }
    } catch (err: any) {
      clearInterval(timer)
      console.warn(`[presence] heartbeat write failed sub=${subId ?? 'unknown'} socket=${socketStr} count=${count} err=${err?.message ?? err}`, err)
      // record into userLastEvents for diagnostics
      try {
        const prev = userLastEvents.get(subId ?? 'unknown') ?? {}
        userLastEvents.set(String(subId ?? 'unknown'), { ...prev, lastHeartbeatError: String(err?.message ?? err), lastHeartbeatAt: Date.now(), lastAddr: socketStr, lastSubId: subId })
      } catch (e) {}
      try { res.end() } catch (e) {}
    }
  }, HEARTBEAT_INTERVAL_MS)
  return timer
}



function stopHeartbeat(timer: NodeJS.Timeout | null) {
  if (timer) clearInterval(timer)
}

export async function addSubscriber(id: string, res: NextApiResponse) {
  subscribers.set(id, { id, res })

  const addr = socketInfo(res)
  console.debug(`[presence] addSubscriber id=${id} addr=${addr} total=${subscribers.size}`)

  // hint to clients how long to wait before reconnecting (ms)
  try { res.write('retry: 2000\n\n') } catch {}
  // send a comment to keep connection alive
  try { res.write(': connected\n\n') } catch {}
  // send an explicit initial event so intermediaries and clients see a concrete payload
  try { res.write(`event: connected\ndata: ${JSON.stringify({ id, timestamp: new Date().toISOString() })}\n\n`) } catch (err) { console.warn('[presence] failed to write initial connected event', id, err) }
  const heartbeat = startHeartbeat(res, id)

  // send initial snapshot of presence: all users with IsLoggedIn true
  try {
    const online = await prisma.user.findMany({ where: { IsLoggedIn: true }, select: { id: true, IsLoggedIn: true } })
    const payload = JSON.stringify({ type: 'initial_presence', rows: online })
    try { res.write(`event: initial\ndata: ${payload}\n\n`) } catch (err) { console.warn('[presence] write failed when sending initial presence', id, addr, err) }
  } catch (err) {
    // ignore; continue
  }
  // clean up on close
  reqCleanup(res, id, () => stopHeartbeat(heartbeat))
}

export async function addUserSubscriber(userId: string, id: string, res: NextApiResponse) {
  const map = userSubscribers.get(userId) ?? new Map<string, Subscriber>()
  map.set(id, { id, res })
  userSubscribers.set(userId, map)

  const addr = socketInfo(res)
  console.debug(`[presence] addUserSubscriber user=${userId} sub=${id} addr=${addr} total=${userSubscribers.get(userId)?.size ?? 0}`)

  // record last add event
  try { userLastEvents.set(userId, { ...(userLastEvents.get(userId) ?? {}), lastAdd: Date.now(), lastAddr: addr, lastSubId: id }) } catch {}

  // hint to clients how long to wait before reconnecting (ms)
  try { res.write('retry: 2000\n\n') } catch {}
  // keep-alive comment
  try { res.write(': connected\n\n') } catch {}
  // send an explicit initial event so intermediaries and clients see a concrete payload
  try { res.write(`event: connected\ndata: ${JSON.stringify({ id, timestamp: new Date().toISOString() })}\n\n`) } catch (err) { console.warn('[presence] failed to write initial connected event', id, err) }
  const heartbeat = startHeartbeat(res, id)

  // clean up on close
  reqCleanupUser(res, userId, id, () => stopHeartbeat(heartbeat))
}

function reqCleanup(res: NextApiResponse, id: string, onCleanup?: () => void) {
  // Node has no close callback on NextApiResponse; try listening on socket
  const socket: any = (res as any).socket
  if (!socket) return
  const addr = `${socket.remoteAddress}:${socket.remotePort}`
  const onClose = () => {
    console.debug(`[presence] subscriber closed id=${id} addr=${addr}`)
    subscribers.delete(id)
    try { onCleanup?.() } catch {}
    try { socket.removeListener('close', onClose) } catch { }
    try { socket.removeListener('error', onError) } catch {}
  }
  const onError = (err: any) => {
    console.warn(`[presence] socket error id=${id} addr=${addr}`, err)
  }
  socket.on('close', onClose)
  socket.on('error', onError)
}

function reqCleanupUser(res: NextApiResponse, userId: string, id: string, onCleanup?: () => void) {
  const socket: any = (res as any).socket
  if (!socket) return
  const addr = `${socket.remoteAddress}:${socket.remotePort}`
  const onClose = () => {
    console.debug(`[presence] userSubscriber closed user=${userId} sub=${id} addr=${addr}`)
    const map = userSubscribers.get(userId)
    if (map) {
      map.delete(id)
      if (map.size === 0) userSubscribers.delete(userId)
    }    // record last close event and compute duration since last add
    try {
      const prev = userLastEvents.get(userId) ?? {}
      const now = Date.now()
      const lastAdd = prev.lastAdd ?? now
      userLastEvents.set(userId, { ...prev, lastClose: now, lastAddr: addr, lastSubId: id })
      const dur = now - lastAdd
      console.debug(`[presence] user=${userId} sub=${id} closed after ${dur}ms`) 
    } catch (e) { console.warn('[presence] failed to record lastClose', e) }
    try { onCleanup?.() } catch {}
    try { socket.removeListener('close', onClose) } catch { }
    try { socket.removeListener('error', onError) } catch {}
  }
  const onError = (err: any) => {
    console.warn(`[presence] user subscriber socket error user=${userId} sub=${id} addr=${addr}`, err)
  }
  socket.on('close', onClose)
  socket.on('error', onError)
}

export function broadcastPresence(event: { userId: string; IsLoggedIn: boolean; timestamp?: string }) {
  const payload = JSON.stringify({ type: 'presence', ...event })
  for (const { id, res } of subscribers.values()) {
    try {
      res.write(`event: presence\ndata: ${payload}\n\n`)
    } catch (err) {
      const addr = socketInfo(res)
      console.warn(`[presence] write error when broadcasting presence to sub=${id} addr=${addr}`, err)
    }
  }
}

export function broadcastRaw(eventName: string, data: any) {
  const payload = JSON.stringify({ type: eventName, data })
  for (const { id, res } of subscribers.values()) {
    try {
      res.write(`event: ${eventName}\ndata: ${payload}\n\n`)
    } catch (err) {
      const addr = socketInfo(res)
      console.warn(`[presence] write error when broadcasting raw to sub=${id} addr=${addr}`, err)
    }
  }
}

export function broadcastToUser(userId: string, eventName: string, data: any) {
  const map = userSubscribers.get(userId)
  console.debug(`[presence] broadcastToUser user=${userId} event=${eventName} subs=${map?.size ?? 0}`)
  if (!map) return
  const payload = JSON.stringify({ target: userId, data })
  for (const { id, res } of map.values()) {
    try {
      res.write(`event: ${eventName}\ndata: ${payload}\n\n`)
    } catch (err) {
      const addr = socketInfo(res)
      console.warn(`[presence] write error when broadcasting to user=${userId} sub=${id} addr=${addr}`, err)
    }
  }
}

// helper used by server APIs to inspect whether a user currently has open SSE subscribers
export function getUserSubscriberCount(userId: string) {
  return userSubscribers.get(userId)?.size ?? 0
}

export function getSubscriberCount() {
  return subscribers.size
}
