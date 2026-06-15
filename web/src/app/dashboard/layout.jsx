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

  if (auth.error || !auth.data?.user) {
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.data.user.id)
    .maybeSingle()

  if (profileError || !profile?.role || !roleRoutes[profile.role]) {
    redirect('/auth/login')
  }

  const role = profile.role
  const homePath = roleRoutes[role]

  if (!isPathForRole(pathname, role)) {
    redirect(homePath)
  }

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
