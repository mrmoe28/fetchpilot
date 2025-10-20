import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, accounts, sessions, scrapingJobs, scrapedProducts, categories, scheduledScrapes, tags, jobTags, scrapeRuns, siteProfiles } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

// DELETE /api/user/delete-account - Delete user account and all associated data
export async function DELETE(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get all job IDs first
    const jobs = await db.query.scrapingJobs.findMany({
      where: eq(scrapingJobs.userId, userId),
      columns: { id: true },
    })
    const jobIds = jobs.map(j => j.id)

    // Get all tag IDs
    const userTags = await db.query.tags.findMany({
      where: eq(tags.userId, userId),
      columns: { id: true },
    })
    const tagIds = userTags.map(t => t.id)

    // Delete all user data in correct order (respecting foreign key constraints)
    // The schema has ON DELETE CASCADE for most relations, but we'll be explicit

    // 1. Delete job_tags relationships
    if (tagIds.length > 0) {
      await db.delete(jobTags).where(inArray(jobTags.tagId, tagIds))
    }

    // 2. Delete scraped products
    if (jobIds.length > 0) {
      await db.delete(scrapedProducts).where(inArray(scrapedProducts.jobId, jobIds))
    }

    // 3. Delete tags, scraping jobs, categories, scheduled scrapes, site profiles, scrape runs
    await db.delete(tags).where(eq(tags.userId, userId))
    await db.delete(scrapingJobs).where(eq(scrapingJobs.userId, userId))
    await db.delete(categories).where(eq(categories.userId, userId))
    await db.delete(scheduledScrapes).where(eq(scheduledScrapes.userId, userId))
    await db.delete(siteProfiles).where(eq(siteProfiles.userId, userId))
    await db.delete(scrapeRuns).where(eq(scrapeRuns.userId, userId))

    // 4. Delete auth-related data (sessions, accounts)
    await db.delete(sessions).where(eq(sessions.userId, userId))
    await db.delete(accounts).where(eq(accounts.userId, userId))

    // 5. Finally, delete the user
    await db.delete(users).where(eq(users.id, userId))

    return NextResponse.json({
      message: 'Account and all associated data deleted successfully.',
    })
  } catch (error) {
    console.error('Failed to delete account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
