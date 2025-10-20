import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapingJobs, scrapedProducts, categories, scheduledScrapes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/user/export-data - Export all user data
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all user data
    const [jobs, allCategories, scheduled] = await Promise.all([
      db.query.scrapingJobs.findMany({
        where: eq(scrapingJobs.userId, session.user.id),
      }),
      db.query.categories.findMany({
        where: eq(categories.userId, session.user.id),
      }),
      db.query.scheduledScrapes.findMany({
        where: eq(scheduledScrapes.userId, session.user.id),
      }),
    ])

    // Get all products for user's jobs
    const jobIds = jobs.map(j => j.id)
    const products = jobIds.length > 0
      ? await db.query.scrapedProducts.findMany({
          where: (scrapedProducts, { inArray }) => inArray(scrapedProducts.jobId, jobIds),
        })
      : []

    const exportData = {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      exportedAt: new Date().toISOString(),
      statistics: {
        totalJobs: jobs.length,
        totalProducts: products.length,
        totalCategories: allCategories.length,
        totalScheduledScrapes: scheduled.length,
      },
      data: {
        jobs,
        products,
        categories: allCategories,
        scheduledScrapes: scheduled,
      },
    }

    // Return as JSON file download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="fetchpilot-data-${session.user.id}-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error('Failed to export data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
