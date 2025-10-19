import { auth } from "@/lib/auth"

export default auth((req) => {
  // Middleware logic here
  // You can protect routes, redirect, etc.
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
