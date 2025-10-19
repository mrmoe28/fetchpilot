import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { categories, scrapingJobs } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(50).optional(),
})

// GET /api/categories/[id] - Get a specific category with job count
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const categoryId = params.id

    // Get category with job count
    const [category] = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        color: categories.color,
        icon: categories.icon,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        jobCount: count(scrapingJobs.id),
      })
      .from(categories)
      .leftJoin(scrapingJobs, eq(scrapingJobs.categoryId, categories.id))
      .where(and(
        eq(categories.id, categoryId),
        eq(categories.userId, session.user.id)
      ))
      .groupBy(categories.id)

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to fetch category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/categories/[id] - Update a category
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const categoryId = params.id
    const body = await req.json()
    const validation = updateCategorySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const updates = validation.data

    // Verify category exists and belongs to user
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(and(
        eq(categories.id, categoryId),
        eq(categories.userId, session.user.id)
      ))
      .limit(1)

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if new name conflicts with existing category (if name is being updated)
    if (updates.name && updates.name !== existingCategory.name) {
      const [nameConflict] = await db
        .select()
        .from(categories)
        .where(and(
          eq(categories.userId, session.user.id),
          eq(categories.name, updates.name)
        ))
        .limit(1)

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Category name already exists' },
          { status: 409 }
        )
      }
    }

    // Update category
    const [updatedCategory] = await db
      .update(categories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(categories.id, categoryId),
        eq(categories.userId, session.user.id)
      ))
      .returning()

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Failed to update category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const categoryId = params.id

    // Check if category exists and belongs to user
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(and(
        eq(categories.id, categoryId),
        eq(categories.userId, session.user.id)
      ))
      .limit(1)

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if category has associated jobs
    const [jobCount] = await db
      .select({ count: count(scrapingJobs.id) })
      .from(scrapingJobs)
      .where(eq(scrapingJobs.categoryId, categoryId))

    if (jobCount.count > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category with associated jobs',
          message: `This category has ${jobCount.count} associated scraping jobs. Please reassign or remove them first.`
        },
        { status: 409 }
      )
    }

    // Delete category
    await db
      .delete(categories)
      .where(and(
        eq(categories.id, categoryId),
        eq(categories.userId, session.user.id)
      ))

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Failed to delete category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
