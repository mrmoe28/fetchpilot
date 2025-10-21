import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { categories, scrapedProducts, type NewCategory } from '@/lib/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import { z } from 'zod'

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(50).optional(),
})

// GET /api/categories - Get all categories for the current user
export async function GET(req: NextRequest) {
  const startTime = performance.now()
  const requestId = req.headers.get('x-request-id') || req.headers.get('request-id')
  let userId: string | undefined
  let resultCount = 0
  let error: string | undefined

  try {
    const session = await auth()
    userId = session?.user?.id
    
    if (!session?.user?.id) {
      const durationMs = Math.round(performance.now() - startTime)
      console.info({
        requestId,
        userId: undefined,
        durationMs,
        status: 'unauthorized',
        error: 'No valid session'
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userCategoriesRaw = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        color: categories.color,
        icon: categories.icon,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        productCount: count(scrapedProducts.id)
      })
      .from(categories)
      .leftJoin(scrapedProducts, eq(categories.id, scrapedProducts.categoryId))
      .where(eq(categories.userId, session.user.id))
      .groupBy(categories.id)
      .orderBy(desc(categories.updatedAt))

    // Transform to match expected format
    const userCategories = userCategoriesRaw.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      color: cat.color,
      icon: cat.icon,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      _count: {
        scrapedProducts: cat.productCount
      }
    }))

    resultCount = userCategories.length
    const durationMs = Math.round(performance.now() - startTime)
    
    console.info({
      requestId,
      userId,
      durationMs,
      resultCount,
      status: 'success'
    })

    return NextResponse.json(userCategories)
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error'
    const durationMs = Math.round(performance.now() - startTime)
    
    console.info({
      requestId,
      userId,
      durationMs,
      status: 'error',
      error
    })
    
    console.error('Failed to fetch categories:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/categories - Create a new category
export async function POST(req: NextRequest) {
  const startTime = performance.now()
  const requestId = req.headers.get('x-request-id') || req.headers.get('request-id')
  let userId: string | undefined
  let error: string | undefined

  try {
    const session = await auth()
    userId = session?.user?.id
    
    if (!session?.user?.id) {
      const durationMs = Math.round(performance.now() - startTime)
      console.info({
        requestId,
        userId: undefined,
        durationMs,
        status: 'unauthorized',
        error: 'No valid session'
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = createCategorySchema.safeParse(body)
    
    if (!validation.success) {
      const durationMs = Math.round(performance.now() - startTime)
      console.info({
        requestId,
        userId,
        durationMs,
        status: 'validation_error',
        error: 'Invalid input schema'
      })
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, description, color, icon } = validation.data

    // Check if category name already exists for this user
    const existing = await db
      .select()
      .from(categories)
      .where(and(
        eq(categories.userId, session.user.id),
        eq(categories.name, name)
      ))
      .limit(1)

    if (existing.length > 0) {
      const durationMs = Math.round(performance.now() - startTime)
      console.info({
        requestId,
        userId,
        durationMs,
        status: 'conflict',
        error: 'Category name already exists'
      })
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 409 }
      )
    }

    const newCategory: NewCategory = {
      userId: session.user.id,
      name,
      description: description || null,
      color: color || '#3B82F6',
      icon: icon || 'folder',
    }

    const [category] = await db
      .insert(categories)
      .values(newCategory)
      .returning()

    const durationMs = Math.round(performance.now() - startTime)
    console.info({
      requestId,
      userId,
      durationMs,
      status: 'created',
      resultCount: 1
    })

    return NextResponse.json(category, { status: 201 })
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error'
    const durationMs = Math.round(performance.now() - startTime)
    
    console.info({
      requestId,
      userId,
      durationMs,
      status: 'error',
      error
    })
    
    console.error('Failed to create category:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
