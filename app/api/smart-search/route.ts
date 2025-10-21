import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { smartSearchQueries, searchSources } from '@/lib/db/schema'
import { orchestrateSmartSearch } from '@/lib/smart-search/orchestrator'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { query, minSources = 20 } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const trimmedQuery = query.trim()

    console.log(`Creating smart search for user ${session.user.id}: "${trimmedQuery}"`)

    // Create search query record
    const [searchQuery] = await db
      .insert(smartSearchQueries)
      .values({
        userId: session.user.id,
        query: trimmedQuery,
        status: 'searching',
        startedAt: new Date(),
        config: {
          minSources,
          searchEngines: ['google', 'bing'],
          directSites: ['amazon.com', 'ebay.com'],
          filterNonProducts: true,
        },
      })
      .returning()

    console.log(`Created search query: ${searchQuery.id}`)

    // Start background search (don't await - let it run async)
    orchestrateSmartSearch(
      {
        query: trimmedQuery,
        minSources,
        searchEngines: ['google', 'bing'],
        directSites: ['amazon.com', 'ebay.com'],
        filterNonProducts: true,
      },
      async progress => {
        // Update progress in database
        console.log(`Progress: ${progress.stage} - ${progress.completed}/${progress.total}`)

        await db
          .update(smartSearchQueries)
          .set({
            sourcesFound: progress.sourcesFound,
            productPagesFound: progress.productPagesFound || 0,
          })
          .where(eq(smartSearchQueries.id, searchQuery.id))
      }
    )
      .then(async sources => {
        console.log(`Search completed: Found ${sources.length} product pages`)

        // Save all sources to database
        if (sources.length > 0) {
          await db.insert(searchSources).values(
            sources.map(source => ({
              searchQueryId: searchQuery.id,
              url: source.url,
              domain: source.domain,
              title: source.title,
              snippet: source.snippet,
              isProductPage: source.isProductPage || false,
              productScore: source.productScore || null,
              metadata: source.metadata || null,
            }))
          )
        }

        // Update search query status
        await db
          .update(smartSearchQueries)
          .set({
            status: 'completed',
            completedAt: new Date(),
            sourcesFound: sources.length,
            productPagesFound: sources.filter(s => s.isProductPage).length,
          })
          .where(eq(smartSearchQueries.id, searchQuery.id))

        console.log(`Search ${searchQuery.id} completed successfully`)
      })
      .catch(async error => {
        console.error(`Search ${searchQuery.id} failed:`, error)

        await db
          .update(smartSearchQueries)
          .set({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          })
          .where(eq(smartSearchQueries.id, searchQuery.id))
      })

    // Return immediately with search ID
    return NextResponse.json(
      {
        searchId: searchQuery.id,
        status: 'searching',
        message: 'Smart search started. Check back for results.',
      },
      { status: 202 }
    )
  } catch (error) {
    console.error('Smart search error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all searches for the user
    const searches = await db
      .select()
      .from(smartSearchQueries)
      .where(eq(smartSearchQueries.userId, session.user.id))
      .orderBy(smartSearchQueries.createdAt)
      .limit(50)

    return NextResponse.json(searches)
  } catch (error) {
    console.error('Error fetching searches:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
