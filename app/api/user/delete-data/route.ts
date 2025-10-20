import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapingJobs, scrapedProducts, categories, scheduledScrapes, tags, jobTags, scrapeRuns } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

// DELETE /api/user/delete-data - Delete all user's scraping data (keeps account)
export async function DELETE(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all job IDs first
    const jobs = await db.query.scrapingJobs.findMany({
      where: eq(scrapingJobs.userId, session.user.id),
      columns: { id: true },
    })
    const jobIds = jobs.map(j => j.id)

    // Get all tag IDs
    const userTags = await db.query.tags.findMany({
      where: eq(tags.userId, session.user.id),
      columns: { id: true },
    })
    const tagIds = userTags.map(t => t.id)

    // Delete in correct order to respect foreign key constraints
    if (tagIds.length > 0) {
      await db.delete(jobTags).where(inArray(jobTags.tagId, tagIds))
      await db.delete(tags).where(eq(tags.userId, session.user.id))
    }

    if (jobIds.length > 0) {
      await db.delete(scrapedProducts).where(inArray(scrapedProducts.jobId, jobIds))
    }

    await db.delete(scrapingJobs).where(eq(scrapingJobs.userId, session.user.id))
    await db.delete(categories).where(eq(categories.userId, session.user.id))
    await db.delete(scheduledScrapes).where(eq(scheduledScrapes.userId, session.user.id))
    await db.delete(scrapeRuns).where(eq(scrapeRuns.userId, session.user.id))

    return NextResponse.json({
      message: 'All scraping data deleted successfully. Your account has been preserved.',
    })
  } catch (error) {
    console.error('Failed to delete user data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
