import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const { pathname } = nextUrl

  // Middleware logic for authentication

  // 1. Allow all API routes (they handle their own auth if needed)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // 2. Public pages that don't require authentication
  const publicPages = [
    '/auth/signin',
    '/auth/error', 
    '/privacy',
    '/terms',
    '/landing'
  ]

  if (publicPages.includes(pathname)) {
    // Redirect logged-in users from sign-in page to dashboard
    if (isLoggedIn && pathname === '/auth/signin') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
    }
    return NextResponse.next()
  }

  // 3. Protected pages require authentication
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname + nextUrl.search)
    const signInUrl = new URL(`/auth/signin?callbackUrl=${callbackUrl}`, nextUrl.origin)
    return NextResponse.redirect(signInUrl)
  }

  // 4. User is authenticated, allow access
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files) 
     * - favicon.ico (favicon file)
     * - public folder files (.svg, .png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
