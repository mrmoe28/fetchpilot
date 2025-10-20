import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// For now, we'll store preferences in memory/localStorage on client
// In a production app, add a 'preferences' json column to users table

const preferencesSchema = z.object({
  notifyOnJobCompletion: z.boolean().optional(),
  notifyOnJobFailure: z.boolean().optional(),
  notifyOnScheduledJobs: z.boolean().optional(),
})

// GET /api/user/preferences - Get user preferences
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return default preferences for now
    // TODO: Add preferences column to users table and fetch from DB
    const preferences = {
      notifyOnJobCompletion: true,
      notifyOnJobFailure: false,
      notifyOnScheduledJobs: false,
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Failed to fetch preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/user/preferences - Update user preferences
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = preferencesSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    // TODO: Add preferences column to users table and save to DB
    // For now, just return success
    // await db.update(users)
    //   .set({ preferences: validation.data })
    //   .where(eq(users.id, session.user.id))

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: validation.data,
    })
  } catch (error) {
    console.error('Failed to update preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
