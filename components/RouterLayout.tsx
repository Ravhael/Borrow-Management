import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'

interface RouterLayoutProps {
  children: React.ReactNode
}

export default function RouterLayout({ children }: RouterLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Hide sidebar on homepage, login, register, and forgot-password pages, show minimal header
  const showSidebar = router.pathname !== '/' && router.pathname !== '/login' && router.pathname !== '/register' && router.pathname !== '/forgot-password'
  const isMinimalPage = router.pathname === '/' || router.pathname === '/login' || router.pathname === '/register' || router.pathname === '/forgot-password'
  const isStickyHeader = router.pathname !== '/login' && router.pathname !== '/register' && router.pathname !== '/forgot-password'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Site-wide Header */}
      <Header onToggleSidebar={toggleSidebar} minimal={isMinimalPage} sticky={isStickyHeader} />

      <div className="flex flex-1">
        {showSidebar && <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />}

        <div className="flex-1 flex flex-col">
          <main className="flex-1">
            {children}
          </main>

          {/* Site-wide Footer */}
          <Footer />
        </div>
      </div>
    </div>
  )
}