import { db } from '@/lib/db'
import { scheduledScrapes, scrapingJobs } from '@/lib/db/schema'
import { eq, and, lte } from 'drizzle-orm'
import { scrapeProducts } from '@/lib/agent'

export async function runScheduledScrapes() {
  const now = new Date()

  // Find all enabled scrapes that are due to run
  const dueScapes = await db.query.scheduledScrapes.findMany({
    where: and(
      eq(scheduledScrapes.enabled, true),
      lte(scheduledScrapes.nextRunAt, now)
    ),
  })

  for (const scrape of dueScapes) {
    try {
      console.log(`Running scheduled scrape: ${scrape.name} (${scrape.id})`)

      // Create a new job
      const [job] = await db.insert(scrapingJobs).values({
        userId: scrape.userId,
        url: scrape.url,
        goal: scrape.goal,
        status: 'running',
        startedAt: new Date(),
        config: scrape.config,
      }).returning()

      // Run the scrape
      const logs: string[] = []
      const products = await scrapeProducts(scrape.url, scrape.goal || '', {
        anthropicKey: process.env.ANTHROPIC_API_KEY || "",
        maxTotalPages: scrape.config?.maxTotalPages || 12,
        logs,
      })

      // Update job with results
      await db.update(scrapingJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          productsFound: products.length,
          logs,
        })
        .where(eq(scrapingJobs.id, job.id))

      // Calculate next run time
      const nextRunAt = calculateNextRun(scrape.schedule, now)

      // Update scheduled scrape
      await db.update(scheduledScrapes)
        .set({
          lastRunAt: now,
          nextRunAt,
        })
        .where(eq(scheduledScrapes.id, scrape.id))

      console.log(`Completed scheduled scrape: ${scrape.name}`)
    } catch (error) {
      console.error(`Error running scheduled scrape ${scrape.id}:`, error)
    }
  }

  return { processed: dueScapes.length }
}

// Simple cron parser for common patterns
export function calculateNextRun(cronExpression: string, from: Date = new Date()): Date {
  const next = new Date(from)

  // Support simple patterns:
  // @hourly, @daily, @weekly, @monthly
  // or "every X hours/days"

  if (cronExpression === '@hourly') {
    next.setHours(next.getHours() + 1)
  } else if (cronExpression === '@daily') {
    next.setDate(next.getDate() + 1)
  } else if (cronExpression === '@weekly') {
    next.setDate(next.getDate() + 7)
  } else if (cronExpression === '@monthly') {
    next.setMonth(next.getMonth() + 1)
  } else if (cronExpression.startsWith('every ')) {
    const match = cronExpression.match(/every (\d+) (hour|day|week)s?/)
    if (match) {
      const [, amount, unit] = match
      const num = parseInt(amount)

      switch (unit) {
        case 'hour':
          next.setHours(next.getHours() + num)
          break
        case 'day':
          next.setDate(next.getDate() + num)
          break
        case 'week':
          next.setDate(next.getDate() + (num * 7))
          break
      }
    }
  }

  return next
}
