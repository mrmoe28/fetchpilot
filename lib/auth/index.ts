import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db),
  basePath: "/api/auth",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string)
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  trustHost: true,
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async signIn() {
      return true
    },
    async redirect({ url, baseUrl }) {
      // Handles redirects after authentication actions

      // Always redirect to dashboard after successful sign-in
      if (url.startsWith("/api/auth/callback")) {
        return `${baseUrl}/dashboard`
      }

      // If redirect URL is root, go to dashboard
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`
      }

      // Allow relative callback URLs (like /dashboard, /settings)
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }

      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url
      }

      // Default fallback - go to dashboard
      return `${baseUrl}/dashboard`
    },
  },
  session: {
    strategy: "database",
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
