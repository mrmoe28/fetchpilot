import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { smartSearchQueries, searchSources } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ searchId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchId } = await params

    // Get search query
    const [searchQuery] = await db
      .select()
      .from(smartSearchQueries)
      .where(
        and(
          eq(smartSearchQueries.id, searchId),
          eq(smartSearchQueries.userId, session.user.id)
        )
      )
      .limit(1)

    if (!searchQuery) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // Get all sources for this search
    const sources = await db
      .select()
      .from(searchSources)
      .where(eq(searchSources.searchQueryId, searchId))
      .orderBy(searchSources.productScore)

    return NextResponse.json({
      ...searchQuery,
      sources,
    })
  } catch (error) {
    console.error('Error fetching search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
