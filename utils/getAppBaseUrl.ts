const DEFAULT_APP_BASE_URL = 'http://103.157.191.102:8086/formflow'
let cachedAppBaseUrl: string | null = null

const normalizeBaseUrl = (value?: string | null): string | null => {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withProtocol.replace(/\/+$/, '')
}

const detectAppBaseUrl = (): string => {
  const candidates = [
    process.env.APP_BASE_URL,
    process.env.APP_ORIGIN,
    process.env.EMAIL_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]

  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate)
    if (normalized) return normalized
  }

  return DEFAULT_APP_BASE_URL
}

export const getAppBaseUrl = (): string => {
  if (!cachedAppBaseUrl) cachedAppBaseUrl = detectAppBaseUrl()
  return cachedAppBaseUrl
}

export default getAppBaseUrl
