import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapingJobs, scrapedProducts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET /api/jobs/[id]/products - Get all products for a specific job
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

    // Verify job ownership
    const job = await db.query.scrapingJobs.findFirst({
      where: and(
        eq(scrapingJobs.id, id),
        eq(scrapingJobs.userId, session.user.id)
      ),
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Fetch all products for this job
    const products = await db.query.scrapedProducts.findMany({
      where: eq(scrapedProducts.jobId, id),
      orderBy: (scrapedProducts, { asc }) => [asc(scrapedProducts.createdAt)],
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Failed to fetch job products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
