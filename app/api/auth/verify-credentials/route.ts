import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ valid: false })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (!user || !user.password) {
      return NextResponse.json({ valid: false })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      }
    })

  } catch (error) {
    console.error('Credential verification error:', error)
    return NextResponse.json({ valid: false })
  }
}
