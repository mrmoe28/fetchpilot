import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, passwordResetTokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    // Always return success (don't leak if email exists)
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, we have sent a password reset link.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hour

    // Delete any existing reset tokens for this email
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email))

    // Save new reset token
    await db.insert(passwordResetTokens).values({
      email,
      token: resetToken,
      expires,
    })

    // In a real app, you would send an email here
    console.log(`Password reset token for ${email}: ${resetToken}`)
    
    // For development, return the token (remove this in production)
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.',
      ...(isDevelopment && { resetToken }) // Only include in development
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle password reset with token
export async function PUT(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Find valid reset token
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.token, token)
    })

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Update user password
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, resetToken.email))

    // Delete used reset token
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token))

    return NextResponse.json({
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Password update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
