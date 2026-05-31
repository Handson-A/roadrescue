'use client'

import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout({
  children,
}) {
  const { role } = useAuth()

  return (
    <div className="min-h-screen bg-[#F6F2E7] text-[#1f1b10]">
      <Sidebar />

      <div className="md:pl-64">
        <Navbar />

        <main className="px-4 py-5 pb-36 md:px-6 md:py-6 md:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}