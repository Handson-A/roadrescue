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

  const isFullHeightPage = pathname?.includes('/ai') || pathname?.includes('/chat')


let mainClass = ""
  
  if (isFullHeightPage) {
    // Chat & Map screens: full viewport size, locked scrolling
    mainClass = "flex-1 flex flex-col overflow-hidden pt-16 md:pt-0"
  } else {
    // Regular scrollable pages: scrollable viewport, allows content to slide under the fixed navbar
    // Increased to 104px for extra breathing room below the 68px navbar
    mainClass = "flex-1 flex flex-col overflow-y-auto px-4 pb-5 md:px-6 md:pb-8 md:pt-[104px]"
  }


  return (
    <div className="min-h-screen flex flex-col bg-[#F6F2E7] text-[#1f1b10]">
      <div className="flex flex-1 min-h-full bg-[#F6F2E7]">
        <Sidebar />

        <div className="flex-1 flex flex-col md:pl-64 min-w-0 min-h-full bg-[#F6F2E7] overflow-hidden">
          <Navbar />

          <main className={`${mainClass} min-h-full bg-[#F6F2E7]`}>
            <div className="flex-1 flex flex-col min-h-full bg-[#F6F2E7]">
              {children}
            </div>
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
