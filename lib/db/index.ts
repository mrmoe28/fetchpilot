import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

// Allow build to succeed without DATABASE_URL (will fail at runtime if used)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://placeholder@localhost/placeholder'

const sql = neon(DATABASE_URL)
export const db = drizzle(sql, { schema })

// Export types
export type Database = typeof db
export * from './schema'

// Helper functions
export async function saveScrapeRun(runData: {
  runId: string
  userId?: string
  startedAt: Date
  finishedAt?: Date
  totalProducts: number
  metrics?: {
    durationMs?: number
    pagesProcessed?: number
    failureCounters?: {
      httpErrors: number
      noHtml: number
      claudeErrors: number
      parsingErrors: number
      emptyResults: number
      totalPages: number
    }
    successRate?: string
    stopReason?: string
    startUrl?: string
    goal?: string
  }
}) {
  try {
    const { scrapeRuns } = schema
    
    await db
      .insert(scrapeRuns)
      .values({
        runId: runData.runId,
        userId: runData.userId || null,
        startedAt: runData.startedAt,
        finishedAt: runData.finishedAt || null,
        totalProducts: runData.totalProducts,
        metrics: runData.metrics || null,
      })
      .onConflictDoUpdate({
        target: scrapeRuns.runId,
        set: {
          finishedAt: runData.finishedAt || null,
          totalProducts: runData.totalProducts,
          metrics: runData.metrics || null,
        }
      })

    return { success: true }
  } catch (error) {
    console.error('Failed to save scrape run:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
