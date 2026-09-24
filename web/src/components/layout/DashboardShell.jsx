'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'

export default function DashboardShell({ children }) {
  const pathname = usePathname()

  const isFullHeightPage =
    pathname?.includes('/ai') ||
    pathname?.includes('/chat') ||
    pathname?.includes('/explore') ||
    pathname?.includes('/navigation')

  const mainClass = isFullHeightPage
    ? 'flex-1 flex flex-col h-full min-h-0 overflow-hidden pt-[60px] md:pt-[65px]'
    : 'flex-1 flex flex-col overflow-y-auto px-4 pb-5 md:px-6 md:pb-8 pt-[74px] md:pt-[96px]'

  return (
    <div className={`flex flex-col bg-[#F6F2E7] text-[#1f1b10] ${isFullHeightPage ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}>
      <div className="flex flex-1 min-h-0 h-full bg-[#F6F2E7]">
        <Sidebar />

        <div className="flex-1 flex flex-col md:pl-64 min-w-0 h-full min-h-0 bg-[#F6F2E7] overflow-hidden">
          <Navbar />

          <main className={`${mainClass} bg-[#F6F2E7]`}>
            <div className="flex-1 flex flex-col h-full min-h-0 bg-[#F6F2E7]">
              {children}
            </div>
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
