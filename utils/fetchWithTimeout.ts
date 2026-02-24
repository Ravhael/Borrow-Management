export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs?: number) {
  const timeout = typeof timeoutMs === 'number'
    ? timeoutMs
    : (Number(process.env.GOOGLE_SHEETS_TIMEOUT_MS) || 15000)
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const resp = await fetch(url, { ...init, signal: controller.signal })
    return resp
  } finally {
    clearTimeout(id)
  }
}