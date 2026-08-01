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

  let role = authUser.user_metadata?.role || null

  if (!role) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle()

    if (profileError) {
      redirect('/auth/login')
    }

    role = profile?.role || null
  }

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
    // Chat & Map screens: full viewport size, locked scrolling, simple padding-top matching thin navbar
    mainClass = "flex-1 flex flex-col overflow-hidden pt-16 md:pt-0"
  } else {
    // Regular scrollable pages: scrollable viewport, no mobile top padding (delegated to child pages to avoid scroll gaps)
    mainClass = "flex-1 flex flex-col overflow-y-auto px-4 pb-5 md:px-6 md:py-6 md:pb-8 md:pt-6"
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F6F2E7] text-[#1f1b10]">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col md:pl-64 min-w-0 min-h-0 overflow-hidden">
          <Navbar />

          <main className={mainClass}>
            {children}
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
