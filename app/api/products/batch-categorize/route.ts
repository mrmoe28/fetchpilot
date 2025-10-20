import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapedProducts } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'
import { z } from 'zod'

// Validation schema
const batchCategorizeSchema = z.object({
  productIds: z.array(z.string()).min(1),
  categoryId: z.string(),
})

// POST /api/products/batch-categorize - Update category for multiple products
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = batchCategorizeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { productIds, categoryId } = validation.data

    // Update all products in the batch
    const result = await db
      .update(scrapedProducts)
      .set({
        categoryId,
      })
      .where(inArray(scrapedProducts.id, productIds))
      .returning({ id: scrapedProducts.id })

    return NextResponse.json({
      message: `${result.length} products categorized successfully`,
      updatedCount: result.length,
    })
  } catch (error) {
    console.error('Failed to batch categorize products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
