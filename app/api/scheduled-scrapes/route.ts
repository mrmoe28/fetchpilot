import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scheduledScrapes, type NewScheduledScrape } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

// Validation schema
const createScheduledScrapeSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  goal: z.string().optional(),
  schedule: z.string().min(1).max(100), // Cron expression
  enabled: z.boolean().default(true),
  maxTotalPages: z.number().min(1).max(50).optional(),
  browserEnabled: z.boolean().optional(),
  notifyOnComplete: z.boolean().optional(),
})

// Helper to calculate next run time from cron expression
function calculateNextRun(cronExpression: string): Date {
  // Simple implementation - always return 1 hour from now
  // In production, use a library like 'cron-parser' for accurate cron parsing
  const nextRun = new Date()
  nextRun.setHours(nextRun.getHours() + 1)
  return nextRun
}

// POST /api/scheduled-scrapes - Create new scheduled scrape
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = createScheduledScrapeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, url, goal, schedule, enabled, maxTotalPages, browserEnabled, notifyOnComplete } = validation.data

    const nextRunAt = enabled ? calculateNextRun(schedule) : null

    const newScheduledScrape: NewScheduledScrape = {
      userId: session.user.id,
      name,
      url,
      goal: goal || null,
      schedule,
      enabled,
      nextRunAt,
      config: {
        maxTotalPages,
        browserEnabled,
        notifyOnComplete,
      },
    }

    const [scheduledScrape] = await db
      .insert(scheduledScrapes)
      .values(newScheduledScrape)
      .returning()

    return NextResponse.json(scheduledScrape, { status: 201 })
  } catch (error) {
    console.error('Failed to create scheduled scrape:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/scheduled-scrapes - Get all scheduled scrapes for the user
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userScheduledScrapes = await db.query.scheduledScrapes.findMany({
      where: eq(scheduledScrapes.userId, session.user.id),
      orderBy: (scheduledScrapes, { desc }) => [desc(scheduledScrapes.createdAt)],
    })

    return NextResponse.json(userScheduledScrapes)
  } catch (error) {
    console.error('Failed to fetch scheduled scrapes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
