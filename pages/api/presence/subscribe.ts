import type { NextApiRequest, NextApiResponse } from 'next'
import { addSubscriber } from '../../../lib/presence'

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    externalResolver: true,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, message: 'Method not allowed' })

  // Set SSE headers
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
    try { (res as any).flushHeaders() } catch {}
  }
  // hint to clients how long to wait before reconnecting (ms)
  try { res.write('retry: 2000\n\n') } catch {}
  // send an initial large comment (4KB) to help bypass aggressive proxy buffering
  try { res.write(':' + ' '.repeat(4096) + '\n\n') } catch {}
  try { console.debug('[presence] subscribe headers', { 'x-forwarded-host': req.headers['x-forwarded-host'], 'x-forwarded-proto': req.headers['x-forwarded-proto'], accept: req.headers['accept'], connection: req.headers['connection'] }) } catch {}

  // Assign a subscriber id
  const id = 'sse_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
  await addSubscriber(id, res as any)

  // do not close the handler — leave open for SSE
}
