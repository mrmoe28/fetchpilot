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
    '/terms'
  ]

  // API routes that allow anonymous access
  const publicApiRoutes = [
    '/api/auth',
    '/api/v1'
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )

  const isPublicApiRoute = publicApiRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )

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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
