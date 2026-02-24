/* reminder-daemon.js
 * Simple long-running process to schedule daily reminder checks at 09:00 server local time.
 * Designed to be started by PM2 alongside the Next.js app.
 */

const DEFAULT_RUN_HOUR = 9 // 9am local time (default)
const ONE_DAY_MS = 24 * 60 * 60 * 1000

// Allow override via REMINDER_RUN_HOUR environment variable (0-23)
const RUN_HOUR = (typeof process.env.REMINDER_RUN_HOUR !== 'undefined' && !Number.isNaN(Number(process.env.REMINDER_RUN_HOUR)))
  ? Math.max(0, Math.min(23, Number(process.env.REMINDER_RUN_HOUR)))
  : DEFAULT_RUN_HOUR

const REMINDER_ENDPOINT = process.env.REMINDER_API_URL || (process.env.INTERNAL_BASE_URL ? `${process.env.INTERNAL_BASE_URL.replace(/\/$/, '')}/api/reminders` : (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/api/reminders` : 'http://127.0.0.1:3002/api/reminders'))
const RETRY_DELAY_MS = 60 * 1000 // 1min retry on failure

async function runReminders() {
  try {
    console.log(`[reminder-daemon] running reminder check against ${REMINDER_ENDPOINT}`)
    const headers = { 'Content-Type': 'application/json' }
    if (process.env.REMINDER_AUTH_TOKEN) headers['Authorization'] = `Bearer ${process.env.REMINDER_AUTH_TOKEN}`

    const resp = await fetch(REMINDER_ENDPOINT, { method: 'POST', headers, timeout: 120000 })
    if (resp.ok) {
      try {
        const j = await resp.json()
        console.log('[reminder-daemon] success', j)
      } catch (e) {
        console.log('[reminder-daemon] success (no JSON) status=', resp.status)
      }
    } else {
      console.warn('[reminder-daemon] reminder endpoint returned', resp.status, resp.statusText)
    }
  } catch (err) {
    console.error('[reminder-daemon] failed to run reminders', err)
    // nothing else — we'll rely on scheduled retry or next run
  }
}

function msUntilNextRunAtHour(hour) {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0)
  if (next.getTime() <= now.getTime()) next.setTime(next.getTime() + ONE_DAY_MS)
  return next.getTime() - now.getTime()
}

async function scheduleLoop() {
  // run once immediately on startup so you don't have to wait until the configured hour
  await runReminders()

  // schedule next run at configured hour
  const ms = msUntilNextRunAtHour(RUN_HOUR)
  console.log(`[reminder-daemon] configured run hour: ${RUN_HOUR}. next scheduled run in ${Math.round(ms / 1000)}s (${new Date(Date.now() + ms).toString()})`)

  setTimeout(async function tick() {
    try {
      await runReminders()
    } catch (err) {
      console.error('[reminder-daemon] scheduled run failed', err)
    }
    // schedule next day
    setTimeout(tick, ONE_DAY_MS)
  }, ms)
}

// Start the scheduler
console.log('[reminder-daemon] starting reminder daemon')

// Ensure global fetch is available (Node 18+ has native fetch)
if (typeof fetch !== 'function') {
  try {
    global.fetch = require('node-fetch')
  } catch (e) {
    console.warn('[reminder-daemon] node does not provide global fetch and node-fetch is not installed; install node-fetch or use Node 18+')
  }
}

scheduleLoop()

// keep process alive
process.on('unhandledRejection', (r) => console.warn('[reminder-daemon] unhandledRejection', r))
process.on('uncaughtException', (err) => { console.error('[reminder-daemon] uncaughtException', err); /* let pm2 restart it */ })
