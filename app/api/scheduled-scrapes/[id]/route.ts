import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scheduledScrapes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

// Validation schema
const updateScheduledScrapeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().optional(),
  goal: z.string().optional(),
  schedule: z.string().min(1).max(100).optional(),
  enabled: z.boolean().optional(),
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

// GET /api/scheduled-scrapes/[id] - Get single scheduled scrape
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scheduledScrape = await db.query.scheduledScrapes.findFirst({
      where: and(
        eq(scheduledScrapes.id, id),
        eq(scheduledScrapes.userId, session.user.id)
      ),
    })

    if (!scheduledScrape) {
      return NextResponse.json({ error: 'Scheduled scrape not found' }, { status: 404 })
    }

    return NextResponse.json(scheduledScrape)
  } catch (error) {
    console.error('Failed to fetch scheduled scrape:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/scheduled-scrapes/[id] - Update scheduled scrape
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = updateScheduledScrapeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Check ownership
    const existing = await db.query.scheduledScrapes.findFirst({
      where: and(
        eq(scheduledScrapes.id, id),
        eq(scheduledScrapes.userId, session.user.id)
      ),
    })

    if (!existing) {
      return NextResponse.json({ error: 'Scheduled scrape not found' }, { status: 404 })
    }

    const { name, url, goal, schedule, enabled, maxTotalPages, browserEnabled, notifyOnComplete } = validation.data

    // Calculate next run if schedule or enabled changed
    let nextRunAt = existing.nextRunAt
    if (schedule !== undefined || enabled !== undefined) {
      const newSchedule = schedule ?? existing.schedule
      const newEnabled = enabled ?? existing.enabled
      nextRunAt = newEnabled ? calculateNextRun(newSchedule) : null
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateData.name = name
    if (url !== undefined) updateData.url = url
    if (goal !== undefined) updateData.goal = goal
    if (schedule !== undefined) updateData.schedule = schedule
    if (enabled !== undefined) updateData.enabled = enabled
    if (nextRunAt !== existing.nextRunAt) updateData.nextRunAt = nextRunAt

    // Update config if any config fields changed
    if (maxTotalPages !== undefined || browserEnabled !== undefined || notifyOnComplete !== undefined) {
      updateData.config = {
        ...existing.config,
        ...(maxTotalPages !== undefined && { maxTotalPages }),
        ...(browserEnabled !== undefined && { browserEnabled }),
        ...(notifyOnComplete !== undefined && { notifyOnComplete }),
      }
    }

    const [updatedScheduledScrape] = await db
      .update(scheduledScrapes)
      .set(updateData)
      .where(and(
        eq(scheduledScrapes.id, id),
        eq(scheduledScrapes.userId, session.user.id)
      ))
      .returning()

    return NextResponse.json(updatedScheduledScrape)
  } catch (error) {
    console.error('Failed to update scheduled scrape:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/scheduled-scrapes/[id] - Delete scheduled scrape
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ownership before deleting
    const existing = await db.query.scheduledScrapes.findFirst({
      where: and(
        eq(scheduledScrapes.id, id),
        eq(scheduledScrapes.userId, session.user.id)
      ),
    })

    if (!existing) {
      return NextResponse.json({ error: 'Scheduled scrape not found' }, { status: 404 })
    }

    await db
      .delete(scheduledScrapes)
      .where(and(
        eq(scheduledScrapes.id, id),
        eq(scheduledScrapes.userId, session.user.id)
      ))

    return NextResponse.json({ message: 'Scheduled scrape deleted successfully' })
  } catch (error) {
    console.error('Failed to delete scheduled scrape:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
