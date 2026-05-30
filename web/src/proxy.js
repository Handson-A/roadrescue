import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const createSupabaseClient = (request, response) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}

const roleRoutes = {
  driver: '/dashboard/driver',
  mechanic: '/dashboard/mechanic',
  admin: '/dashboard/admin',
}

const protectedPaths = Object.values(roleRoutes)

const dashboardPathToRole = {
  '/dashboard/driver': 'driver',
  '/dashboard/mechanic': 'mechanic',
  '/dashboard/admin': 'admin',
}

export async function proxy(request) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })
  const supabase = createSupabaseClient(request, response)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && protectedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const userRole = profile?.role || user.user_metadata?.role || null
    const homePath = userRole ? roleRoutes[userRole] : '/auth/login'

    if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')) {
      return NextResponse.redirect(new URL(homePath, request.url))
    }

    for (const [dashPath, requiredRole] of Object.entries(dashboardPathToRole)) {
      if (pathname.startsWith(dashPath)) {
        if (!userRole || userRole !== requiredRole) {
          if (userRole && userRole !== requiredRole) {
            console.warn(
              `[SECURITY] Cross-role access attempt: User ${user.id} (${userRole}) tried to access ${requiredRole} dashboard at ${pathname}`
            )
          }
          return NextResponse.redirect(new URL(homePath, request.url))
        }
        break
      }
    }

    if (protectedPaths.some((path) => pathname.startsWith(path))) {
      if (!userRole || !pathname.startsWith(roleRoutes[userRole])) {
        return NextResponse.redirect(new URL(homePath, request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}