'use client'

import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout({
  children,
}) {
  const { role } = useAuth()
  const hasDesktopSidebar = role === 'admin' || role === 'mechanic'

  return (
    <div className="min-h-screen bg-[#F6F2E7] text-[#1f1b10]">
      <Sidebar />

      <div className={hasDesktopSidebar ? 'lg:pl-64' : ''}>
        <Navbar />

        <main className="px-4 py-5 pb-36 lg:px-6 lg:py-6 lg:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}