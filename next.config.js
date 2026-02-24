const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const assetPrefix = basePath || ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serve the app under a subpath (e.g. /formflow) when deployed behind a reverse proxy
  basePath: basePath || '',
  assetPrefix: assetPrefix || '',
  reactStrictMode: true,
  // Redirect legacy role-specific dashboards to the new centralized /dashboard
  async redirects() {
    return [
      { source: '/superadmin/dashboard', destination: '/dashboard', permanent: false },
      { source: '/admin/dashboard', destination: '/dashboard', permanent: false },
      { source: '/user/dashboard', destination: '/dashboard', permanent: false },
      { source: '/marketing/dashboard', destination: '/dashboard', permanent: false },
      { source: '/gudang/dashboard', destination: '/dashboard', permanent: false },
    ]
  }
}

module.exports = nextConfig