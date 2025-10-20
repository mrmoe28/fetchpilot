import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapedProducts, categories } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: categoryId } = await params

    // Verify the category belongs to the user
    const category = await db.query.categories.findFirst({
      where: and(
        eq(categories.id, categoryId),
        eq(categories.userId, session.user.id)
      )
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Fetch products in this category
    const products = await db.query.scrapedProducts.findMany({
      where: eq(scrapedProducts.categoryId, categoryId),
      orderBy: (scrapedProducts, { desc }) => [desc(scrapedProducts.createdAt)],
      with: {
        category: {
          columns: {
            name: true,
            color: true
          }
        }
      }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Failed to fetch category products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category products' },
      { status: 500 }
    )
  }
}
