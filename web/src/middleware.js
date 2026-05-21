/**
 * Middleware - Route Protection & Auth Check
 * Runs at the edge to verify authentication before routes are loaded
 */

import { NextResponse } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/driver', '/mechanic', '/admin'];

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register'];

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('auth_token')?.value;

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublic = publicRoutes.some((route) => pathname === route || pathname.startsWith(route));

  // If protected route and no token, redirect to login
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If public route and user is authenticated, allow access
  if (isPublic && token) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
