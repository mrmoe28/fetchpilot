import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapedProducts, scrapingJobs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// DELETE /api/products/[id] - Delete a single product
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId } = await params

    // First, verify the product belongs to a job owned by this user
    const product = await db
      .select({
        productId: scrapedProducts.id,
        jobId: scrapedProducts.jobId,
        userId: scrapingJobs.userId
      })
      .from(scrapedProducts)
      .innerJoin(scrapingJobs, eq(scrapedProducts.jobId, scrapingJobs.id))
      .where(eq(scrapedProducts.id, productId))
      .limit(1)

    if (!product.length || product[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete the product
    await db.delete(scrapedProducts).where(eq(scrapedProducts.id, productId))

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Failed to delete product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
