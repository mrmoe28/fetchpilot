import { NextRequest, NextResponse } from "next/server"
import { scrapeProducts } from "@/lib/agent"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { scrapingJobs, scrapedProducts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"
export const preferredRegion = "home"

const RequestSchema = z.object({
  url: z.string().url(),
  goal: z.string().optional().default("Extract product cards and canonical links"),
  config: z.object({
    maxTotalPages: z.number().min(1).max(50).optional().default(12),
    browserEnabled: z.boolean().optional().default(false),
  }).optional(),
})

// ResponseSchema removed - not currently used but may be needed for future validation
// const ResponseSchema = z.object({
//   success: z.boolean(),
//   data: z.object({
//     jobId: z.string(),
//     products: z.array(z.any()),
//     stats: z.object({
//       pagesProcessed: z.number(),
//       productsFound: z.number(),
//       duration: z.number(),
//     }),
//   }).optional(),
//   error: z.object({
//     code: z.string(),
//     message: z.string(),
//     details: z.any().optional(),
//   }).optional(),
//   meta: z.object({
//     version: z.string(),
//     timestamp: z.string(),
//   }),
// })

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const session = await auth()

  try {
    const json = await req.json()
    const { url, goal, config } = RequestSchema.parse(json)

    // Create job in database if user is authenticated
    let jobId: string | undefined

    if (session?.user?.id) {
      const [job] = await db.insert(scrapingJobs).values({
        userId: session.user.id,
        url,
        goal,
        status: 'running',
        startedAt: new Date(),
        config,
      }).returning()

      jobId = job.id
    }

    // Run scrape
    const logs: string[] = []
    const products = await scrapeProducts(url, goal, {
      anthropicKey: process.env.ANTHROPIC_API_KEY || "",
      userId: session?.user?.id, // Pass userId for categorization
      browser: undefined,
      maxTotalPages: config?.maxTotalPages || 12,
      logs,
      runId: jobId,
      logger: (event) => {
        // Optional: Log events for debugging
        console.log(`[${jobId}] ${event.stage}:`, event)
      }
    })

    const duration = Date.now() - startTime

    // Save products and update job if authenticated
    if (jobId) {
      if (products.length > 0) {
        await db.insert(scrapedProducts).values(
          products.map(p => ({
            jobId,
            categoryId: (p as any).categoryId || null,
            url: p.url,
            title: p.title,
            price: p.price,
            image: p.image,
            inStock: p.inStock,
            sku: p.sku,
            currency: p.currency,
            description: (p as any).description || null,
            brand: (p as any).brand || null,
            rating: (p as any).rating || null,
            reviewCount: (p as any).reviewCount || null,
            breadcrumbs: p.breadcrumbs,
            extra: p.extra,
          }))
        )
      }

      await db.update(scrapingJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          productsFound: products.length,
          logs,
        })
        .where(eq(scrapingJobs.id, jobId))
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: jobId || 'anonymous',
        products,
        stats: {
          pagesProcessed: logs.filter(l => l.includes('Fetch HTTP')).length,
          productsFound: products.length,
          duration,
        },
      },
      meta: {
        version: 'v1',
        timestamp: new Date().toISOString(),
      },
    })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors,
        },
        meta: {
          version: 'v1',
          timestamp: new Date().toISOString(),
        },
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
      },
      meta: {
        version: 'v1',
        timestamp: new Date().toISOString(),
      },
    }, { status: 500 })
  }
}
