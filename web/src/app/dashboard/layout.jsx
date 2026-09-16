import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const roleRoutes = {
  driver: '/dashboard/driver',
  mechanic: '/dashboard/mechanic',
  admin: '/dashboard/admin',
}

const isPathForRole = (pathname, role) => {
  const base = roleRoutes[role]
  return pathname === base || pathname.startsWith(`${base}/`)
}

export default async function DashboardLayout({ children }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/dashboard'

  const supabase = await createClient()
  const auth = await supabase.auth.getUser()
  const authUser = auth.data?.user
  const authError = auth.error

  if (authError || !authUser) {
    redirect('/auth/login')
  }

  // Prioritize checking the profile table database record (matches proxy.js behavior)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .maybeSingle()

  if (profileError) {
    redirect('/auth/login')
  }

  const role = profile?.role || authUser.user_metadata?.role || null

  if (!role || !roleRoutes[role]) {
    redirect('/auth/login')
  }

  const homePath = roleRoutes[role]

  if (!isPathForRole(pathname, role)) {
    redirect(homePath)
  }

  const isFullHeightPage = pathname?.includes('/ai') || pathname?.includes('/chat') || pathname?.includes('/explore')


let mainClass = ""
  
  if (isFullHeightPage) {
    // Chat & Map screens: full viewport size, locked scrolling below the header
    mainClass = "flex-1 flex flex-col h-full min-h-0 overflow-hidden pt-[60px] md:pt-[65px]"
  } else {
    // Regular scrollable pages: starts cleanly below the header
    mainClass = "flex-1 flex flex-col overflow-y-auto px-4 pb-5 md:px-6 md:pb-8 pt-[74px] md:pt-[96px]"
  }


  return (
    <div className={`flex flex-col bg-[#F6F2E7] text-[#1f1b10] ${isFullHeightPage ? 'h-dvh h-screen overflow-hidden' : 'min-h-screen'}`}>
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
