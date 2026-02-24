import React from 'react'
import { useRouter } from 'next/router'
import Header from './Header'
import Footer from './Footer'

interface PublicPageLayoutProps {
  children: React.ReactNode
}

const MINIMAL_ROUTES = new Set(['/', '/login', '/register', '/forgot-password'])
const NON_STICKY_ROUTES = new Set(['/login', '/register', '/forgot-password'])

export default function PublicPageLayout({ children }: PublicPageLayoutProps) {
  const router = useRouter()
  const path = router.pathname
  const minimal = MINIMAL_ROUTES.has(path)
  const sticky = !NON_STICKY_ROUTES.has(path)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header minimal={minimal} sticky={sticky} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
