import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapedProducts, scrapingJobs } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

// GET /api/products/uncategorized - Get all uncategorized products for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch uncategorized products that belong to user's jobs
    const products = await db
      .select({
        id: scrapedProducts.id,
        jobId: scrapedProducts.jobId,
        url: scrapedProducts.url,
        title: scrapedProducts.title,
        price: scrapedProducts.price,
        image: scrapedProducts.image,
        inStock: scrapedProducts.inStock,
        sku: scrapedProducts.sku,
        currency: scrapedProducts.currency,
        description: scrapedProducts.description,
        brand: scrapedProducts.brand,
        rating: scrapedProducts.rating,
        reviewCount: scrapedProducts.reviewCount,
        createdAt: scrapedProducts.createdAt,
        categoryId: scrapedProducts.categoryId,
      })
      .from(scrapedProducts)
      .innerJoin(scrapingJobs, eq(scrapedProducts.jobId, scrapingJobs.id))
      .where(
        and(
          eq(scrapingJobs.userId, session.user.id),
          isNull(scrapedProducts.categoryId)
        )
      )
      .orderBy(scrapedProducts.createdAt)
      .limit(100) // Limit to prevent overload

    return NextResponse.json(products)
  } catch (error) {
    console.error('Failed to fetch uncategorized products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch uncategorized products' },
      { status: 500 }
    )
  }
}
