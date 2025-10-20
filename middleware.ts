import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/signin',
    '/auth/error',
    '/privacy',
    '/terms',
    '/landing'
  ]

  // API routes that allow anonymous access
  const publicApiRoutes = [
    '/api/auth',
    '/api/v1',
    '/api/health',
    '/api/debug'
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route =>
    nextUrl.pathname.startsWith(route)
  )

  const isPublicApiRoute = publicApiRoutes.some(route =>
    nextUrl.pathname.startsWith(route)
  )

  // Redirect logged-in users away from sign-in page to dashboard
  if (isLoggedIn && nextUrl.pathname === '/auth/signin') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
  }

  // Allow public routes and API routes
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to sign-in page
  if (!isLoggedIn) {
    const callbackUrl = nextUrl.pathname + nextUrl.search
    const signInUrl = new URL('/auth/signin', nextUrl.origin)
    signInUrl.searchParams.set('callbackUrl', callbackUrl)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
