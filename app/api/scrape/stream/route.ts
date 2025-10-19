import { NextRequest } from "next/server"
import { scrapeProducts } from "@/lib/agent"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { scrapingJobs, scrapedProducts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"
export const preferredRegion = "home"

const Body = z.object({
  url: z.string().url(),
  goal: z.string().optional().default("Extract product cards and canonical links")
})

export async function POST(req: NextRequest) {
  const session = await auth()

  // Create a TransformStream for Server-Sent Events
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const sendEvent = async (event: string, data: any) => {
    await writer.write(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    )
  }

  // Start the scraping process in the background
  ;(async () => {
    try {
      const json = await req.json()
      const { url, goal } = Body.parse(json)

      // Create job in database
      const [job] = await db.insert(scrapingJobs).values({
        userId: session?.user?.id,
        url,
        goal,
        status: 'running',
        startedAt: new Date(),
      }).returning()

      await sendEvent('job-created', { jobId: job.id })

      const logs: string[] = []
      const products = await scrapeProducts(url, goal!, {
        anthropicKey: process.env.ANTHROPIC_API_KEY || "",
        browser: undefined,
        maxTotalPages: 12,
        logs
      })

      // Send progress updates as logs accumulate
      let lastLogCount = 0
      const logInterval = setInterval(async () => {
        if (logs.length > lastLogCount) {
          const newLogs = logs.slice(lastLogCount)
          await sendEvent('logs', { logs: newLogs })
          lastLogCount = logs.length
        }
      }, 500)

      // Wait for scraping to complete
      await new Promise(resolve => setTimeout(resolve, 100))
      clearInterval(logInterval)

      // Save products to database
      if (products.length > 0 && job.id) {
        await db.insert(scrapedProducts).values(
          products.map(p => ({
            jobId: job.id,
            url: p.url,
            title: p.title,
            price: p.price,
            image: p.image,
            inStock: p.inStock,
            sku: p.sku,
            currency: p.currency,
            breadcrumbs: p.breadcrumbs,
            extra: p.extra,
          }))
        )
      }

      // Update job status
      await db.update(scrapingJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          pagesProcessed: 12, // TODO: track actual pages
          productsFound: products.length,
          logs,
        })
        .where(eq(scrapingJobs.id, job.id))

      await sendEvent('progress', {
        products: products.length,
        status: 'completed'
      })

      await sendEvent('complete', {
        products,
        logs,
        jobId: job.id
      })

      await writer.close()
    } catch (e: any) {
      await sendEvent('error', { message: e?.message || "Unknown error" })
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
