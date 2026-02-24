import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { addUserSubscriber } from '../../../lib/presence'

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    externalResolver: true,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, message: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions as any) as any
  if (!session?.user?.id) return res.status(401).json({ ok: false, message: 'Not authenticated' })

  // apply some defensive socket settings and add detailed debug events so we can
  // observe why connections are closed immediately after subscribing
  try {
    if ((res as any).socket) {
      try { (res as any).socket.setKeepAlive(true, 10000) } catch {}
      try { (res as any).socket.setNoDelay(true) } catch {}
    }
    if ((req as any).socket) {
      try { (req as any).socket.setKeepAlive(true, 10000) } catch {}
      try { (req as any).socket.setNoDelay(true) } catch {}
    }
  } catch {}

  const remote = (() => {
    try { const s: any = (res as any).socket; return s ? `${s.remoteAddress}:${s.remotePort}` : 'unknown' } catch { return 'unknown' }
  })()
  console.debug(`[presence] subscribe-user start user=${session.user.id} path=${req.url} remote=${remote}`)
  try { console.debug('[presence] subscribe-user headers', { 'user-agent': req.headers['user-agent'], accept: req.headers['accept'] }) } catch {}

  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  // prevent compression which can break chunked SSE responses
  res.setHeader('Content-Encoding', 'identity')
  // ensure the response uses chunked encoding explicitly
  try { res.setHeader('Transfer-Encoding', 'chunked') } catch {}
  // help some proxies (nginx, envoy) avoid buffering / closing chunked streams
  res.setHeader('X-Accel-Buffering', 'no')

  // attempt to disable socket timeout which can close idle connections
  try { const sock: any = (res as any).socket; if (sock && typeof sock.setTimeout === 'function') sock.setTimeout(0) } catch {}

  if (typeof (res as any).flushHeaders === 'function') {
    try { (res as any).flushHeaders() } catch (err) { console.warn('[presence] flushHeaders failed', err) }
  }
  // hint to clients how long to wait before reconnecting (ms)
  try { res.write('retry: 2000\n\n') } catch {}
  // send an initial large comment (4KB) to help bypass aggressive proxy buffering
  try { res.write(':' + ' '.repeat(4096) + '\n\n') } catch {}

  // more debug hooks on the response
  try {
    res.on('close', () => console.debug('[presence] subscribe-user res close user=' + session.user.id + ' remote=' + remote))
    res.on('finish', () => console.debug('[presence] subscribe-user res finish user=' + session.user.id + ' remote=' + remote))
    res.on('error', (err) => console.warn('[presence] subscribe-user res error user=' + session.user.id + ' remote=' + remote, err))
    try { console.debug('[presence] subscribe-user socket', { timeout: (res as any).socket?.timeout, remoteAddress: (res as any).socket?.remoteAddress, remotePort: (res as any).socket?.remotePort }) } catch {}
  } catch {}

  const id = `user_${session.user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  try {
    await addUserSubscriber(String(session.user.id), id, res as any)
  } catch (err) {
    console.warn('[presence] addUserSubscriber failed', err)
    try {
      // try to notify client explicitly before closing
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'subscribe failed' })}\n\n`)
    } catch {}
    try { res.end() } catch {}
    return
  }

  // leave connection open
}
