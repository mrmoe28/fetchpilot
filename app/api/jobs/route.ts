import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapingJobs, scrapedProducts } from '@/lib/db/schema'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    // Allow anonymous job saving for better UX
    // Jobs will be saved without userId for anonymous users

    const body = await req.json()
    const { url, goal, products, categoryId, productsFound } = body

    if (!url || !products || products.length === 0) {
      return NextResponse.json(
        { error: 'URL and products are required' },
        { status: 400 }
      )
    }

    // Create scraping job
    const jobId = randomUUID()
    const now = new Date()

    await db
      .insert(scrapingJobs)
      .values({
        id: jobId,
        userId: session?.user?.id || null, // Allow null for anonymous users
        url,
        goal: goal || null,
        status: 'completed',
        productsFound: productsFound || products.length,
        categoryId: categoryId || null,
        createdAt: now,
        updatedAt: now,
        completedAt: now,
      })
      .returning()

    // Save all products
    const productRecords = products.map((product: any) => ({
      id: randomUUID(),
      jobId,
      categoryId: product.categoryId || null,
      url: product.url,
      title: product.title,
      price: product.price || null,
      image: product.image || null,
      inStock: product.inStock ?? null,
      sku: product.sku || null,
      currency: product.currency || null,
      description: product.description || null,
      brand: product.brand || null,
      rating: product.rating || null,
      reviewCount: product.reviewCount || null,
      extra: product.extra || null,
      createdAt: now,
    }))

    await db.insert(scrapedProducts).values(productRecords)

    return NextResponse.json({
      id: jobId,
      productsCount: products.length,
      message: 'Job saved successfully',
    })
  } catch (error) {
    console.error('Failed to save job:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobs = await db.query.scrapingJobs.findMany({
      where: (scrapingJobs, { eq }) => eq(scrapingJobs.userId, session.user!.id),
      orderBy: (scrapingJobs, { desc }) => [desc(scrapingJobs.createdAt)],
      limit: 50,
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}
