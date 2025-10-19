import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapedProducts, scrapingJobs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { exportToCSV, exportToJSON } from '@/lib/utils/export'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'json'

  // Verify job belongs to user
  const job = await db.query.scrapingJobs.findFirst({
    where: and(
      eq(scrapingJobs.id, jobId),
      eq(scrapingJobs.userId, session.user.id)
    ),
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Get products
  const products = await db.query.scrapedProducts.findMany({
    where: eq(scrapedProducts.jobId, jobId),
  })

  let content: string
  let mimeType: string
  let filename: string

  switch (format) {
    case 'csv':
      content = exportToCSV(products)
      mimeType = 'text/csv'
      filename = `fetchpilot-${jobId}.csv`
      break

    case 'json':
    default:
      content = exportToJSON(products)
      mimeType = 'application/json'
      filename = `fetchpilot-${jobId}.json`
      break
  }

  return new Response(content, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
