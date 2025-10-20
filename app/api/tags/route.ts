import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tags, jobTags, type NewTag } from '@/lib/db/schema'
import { eq, and, desc, count, inArray } from 'drizzle-orm'
import { z } from 'zod'

// Validation schemas
const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

// GET /api/tags - Get all tags for the current user with usage count
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        createdAt: tags.createdAt,
        usageCount: count(jobTags.jobId),
      })
      .from(tags)
      .leftJoin(jobTags, eq(jobTags.tagId, tags.id))
      .where(eq(tags.userId, session.user.id))
      .groupBy(tags.id)
      .orderBy(desc(count(jobTags.jobId)), desc(tags.createdAt))

    return NextResponse.json(userTags)
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tags - Create a new tag
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = createTagSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, color } = validation.data

    // Check if tag name already exists for this user (case-insensitive)
    const existing = await db
      .select()
      .from(tags)
      .where(and(
        eq(tags.userId, session.user.id),
        eq(tags.name, name.toLowerCase().trim())
      ))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Tag already exists' },
        { status: 409 }
      )
    }

    const newTag: NewTag = {
      userId: session.user.id,
      name: name.toLowerCase().trim(),
      color: color || '#10B981',
    }

    const [tag] = await db
      .insert(tags)
      .values(newTag)
      .returning()

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Failed to create tag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/tags - Bulk delete tags
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tagIds = searchParams.get('ids')?.split(',') || []

    if (tagIds.length === 0) {
      return NextResponse.json({ error: 'No tag IDs provided' }, { status: 400 })
    }

    // Verify ownership - only get tags that belong to this user
    const userTags = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(
        eq(tags.userId, session.user.id),
        inArray(tags.id, tagIds)
      ))

    const validTagIds = userTags.map(t => t.id)

    if (validTagIds.length === 0) {
      return NextResponse.json({ error: 'No valid tags found to delete' }, { status: 404 })
    }

    // First delete all job_tags relationships for these tags
    await db
      .delete(jobTags)
      .where(inArray(jobTags.tagId, validTagIds))

    // Then delete the tags themselves
    const deletedTags = await db
      .delete(tags)
      .where(and(
        eq(tags.userId, session.user.id),
        inArray(tags.id, validTagIds)
      ))
      .returning({ id: tags.id, name: tags.name })

    return NextResponse.json({
      message: `${deletedTags.length} tags deleted successfully`,
      deletedTags
    })
  } catch (error) {
    console.error('Failed to delete tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
