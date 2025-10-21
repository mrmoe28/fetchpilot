import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapedProducts, scrapingJobs } from '@/lib/db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'

// GET /api/products/duplicates - Find duplicate products for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find duplicates based on URL
    // Get all products with their job's userId
    const productsWithUser = await db
      .select({
        id: scrapedProducts.id,
        url: scrapedProducts.url,
        title: scrapedProducts.title,
        price: scrapedProducts.price,
        image: scrapedProducts.image,
        createdAt: scrapedProducts.createdAt,
        categoryId: scrapedProducts.categoryId,
        userId: scrapingJobs.userId
      })
      .from(scrapedProducts)
      .innerJoin(scrapingJobs, eq(scrapedProducts.jobId, scrapingJobs.id))
      .where(eq(scrapingJobs.userId, session.user.id))

    // Group by URL and find duplicates
    const urlGroups = new Map<string, typeof productsWithUser>()
    
    productsWithUser.forEach(product => {
      const url = product.url.toLowerCase().trim()
      if (!urlGroups.has(url)) {
        urlGroups.set(url, [])
      }
      urlGroups.get(url)!.push(product)
    })

    // Filter to only duplicates (URLs with more than 1 product)
    const duplicates = Array.from(urlGroups.entries())
      .filter(([_, products]) => products.length > 1)
      .map(([url, products]) => ({
        url,
        count: products.length,
        products: products.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }))

    return NextResponse.json({
      totalDuplicates: duplicates.length,
      totalDuplicateProducts: duplicates.reduce((sum, d) => sum + d.count - 1, 0), // -1 because we keep one
      duplicates
    })
  } catch (error) {
    console.error('Failed to find duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to find duplicates' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/duplicates - Remove duplicate products, keeping the most recent one
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { strategy = 'keep-newest' } = body // keep-newest or manual with productIds

    if (strategy === 'manual' && body.productIds) {
      // Manual deletion of specific products
      const { productIds } = body

      // Verify ownership before deleting
      const productsToDelete = await db
        .select({
          productId: scrapedProducts.id,
          userId: scrapingJobs.userId
        })
        .from(scrapedProducts)
        .innerJoin(scrapingJobs, eq(scrapedProducts.jobId, scrapingJobs.id))
        .where(inArray(scrapedProducts.id, productIds))

      if (productsToDelete.some(p => p.userId !== session.user.id)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      await db.delete(scrapedProducts).where(inArray(scrapedProducts.id, productIds))

      return NextResponse.json({
        message: `${productIds.length} duplicate products deleted successfully`,
        deletedCount: productIds.length
      })
    }

    // Automatic deduplication - keep newest
    const productsWithUser = await db
      .select({
        id: scrapedProducts.id,
        url: scrapedProducts.url,
        createdAt: scrapedProducts.createdAt,
        userId: scrapingJobs.userId
      })
      .from(scrapedProducts)
      .innerJoin(scrapingJobs, eq(scrapedProducts.jobId, scrapingJobs.id))
      .where(eq(scrapingJobs.userId, session.user.id))

    // Group by URL
    const urlGroups = new Map<string, typeof productsWithUser>()
    
    productsWithUser.forEach(product => {
      const url = product.url.toLowerCase().trim()
      if (!urlGroups.has(url)) {
        urlGroups.set(url, [])
      }
      urlGroups.get(url)!.push(product)
    })

    // Find products to delete (all except the newest in each group)
    const productIdsToDelete: string[] = []
    
    urlGroups.forEach((products) => {
      if (products.length > 1) {
        // Sort by createdAt descending (newest first)
        const sorted = products.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        // Delete all except the first (newest)
        const toDelete = sorted.slice(1).map(p => p.id)
        productIdsToDelete.push(...toDelete)
      }
    })

    if (productIdsToDelete.length > 0) {
      await db.delete(scrapedProducts).where(inArray(scrapedProducts.id, productIdsToDelete))
    }

    return NextResponse.json({
      message: `${productIdsToDelete.length} duplicate products removed successfully`,
      deletedCount: productIdsToDelete.length
    })
  } catch (error) {
    console.error('Failed to remove duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to remove duplicates' },
      { status: 500 }
    )
  }
}
