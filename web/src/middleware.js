// /**
//  * Middleware - Route Protection & Auth Check
//  * Runs at the edge to verify authentication before routes are loaded
//  */

// import { NextResponse } from 'next/server';

// // Protected routes that require authentication
// const protectedRoutes = ['/driver', '/mechanic', '/admin'];

// // Public routes that don't require authentication
// const publicRoutes = ['/', '/login', '/register'];

// export function middleware(request) {
//   const pathname = request.nextUrl.pathname;
//   const token = request.cookies.get('auth_token')?.value;

//   // Check if route is protected
//   const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
//   const isPublic = publicRoutes.some((route) => pathname === route || pathname.startsWith(route));

//   // If protected route and no token, redirect to login
//   if (isProtected && !token) {
//     return NextResponse.redirect(new URL('/login', request.url));
//   }

//   // If public route and user is authenticated, allow access
//   if (isPublic && token) {
//     return NextResponse.next();
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     '/((?!_next/static|_next/image|favicon.ico).*)',
//   ],
// };


// web/src/middleware.js
// This runs on every request BEFORE the page loads.
// If the user is not authenticated, they get redirected to login.
// If they are authenticated but hit the wrong role's route, redirect them.

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // create a server supabase client that can read/write cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refresh session if it exists — keeps JWT alive
  const { data: { user } } = await supabase.auth.getUser()

  // --- UNAUTHENTICATED GUARD ---
  // if user hits any /driver, /mechanic, or /admin route without a session
  // send them to login
  const protectedPaths = ['/driver', '/mechanic', '/admin']
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // --- ALREADY LOGGED IN GUARD ---
  // if a logged-in user hits /login or /register, redirect to their dashboard
  const authPaths = ['/login', '/register']
  const isAuthPage = authPaths.some(path => pathname.startsWith(path))

  if (isAuthPage && user) {
    // fetch their role to redirect correctly
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role) {
      return NextResponse.redirect(new URL(`/${profile.role}`, request.url))
    }
  }

  return response
}

// tell Next.js which routes this middleware applies to
// excludes static files, images, and api routes from the auth check
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}