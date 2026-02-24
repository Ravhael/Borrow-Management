// Prefer explicit public base path, otherwise derive from NEXT_PUBLIC_APP_URL if available
const normalizeBasePath = (value?: string | null) => {
  if (!value) return ''
  let result = value.trim()
  if (!result) return ''
  if (!result.startsWith('/')) result = `/${result}`
  if (result !== '/' && result.endsWith('/')) result = result.slice(0, -1)
  return result
}

let BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH || '')
if (!BASE_PATH && typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_APP_URL)
    // use pathname as default base path (ensure it starts with / and no trailing slash)
    BASE_PATH = normalizeBasePath(url.pathname)
  } catch (err) {
    // ignore invalid URL and keep BASE_PATH empty
  }
}

const isAbsoluteUrl = (path: string) => /^https?:\/\//i.test(path)

/**
 * Prefix a relative path with the deployment base path (e.g. /formflow).
 * If the path already starts with the base path or is an absolute URL,
 * it will be returned unchanged.
 */
export const withBasePath = (path: string) => {
  if (!path) return BASE_PATH || '/'
  if (isAbsoluteUrl(path)) return path

  const normalized = path.startsWith('/') ? path : `/${path}`

  if (!BASE_PATH) return normalized
  if (normalized.startsWith(BASE_PATH)) return normalized

  return `${BASE_PATH}${normalized}`
}

export const basePath = BASE_PATH

export const apiFetch = (path: string, init?: RequestInit) => fetch(withBasePath(path), { credentials: 'include', ...init })

let fetchPatched = false

export const ensureBasePathFetch = () => {
  if (fetchPatched) return
  if (typeof globalThis.fetch !== 'function') return

  const originalFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') {
      if (input.startsWith('/api/')) {
        return originalFetch(withBasePath(input), init)
      }
      if (input.startsWith('/')) {
        // Leave other root-relative paths alone (e.g. /formflow already prefixed)
        return originalFetch(input, init)
      }
    }
    return originalFetch(input, init)
  }) as typeof fetch

  fetchPatched = true
}
