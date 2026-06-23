/**
 * Main dashboard layout with sidebar and responsive header.
 */

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar, { MobileMenuButton } from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
          <span className="text-lg font-bold">StudyMind</span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
