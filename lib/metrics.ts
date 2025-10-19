import { db } from '@/lib/db'
import { scrapeRuns } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

type FailureCounters = {
  httpErrors: number
  noHtml: number
  claudeErrors: number
  parsingErrors: number
  emptyResults: number
  totalPages: number
}

export interface ScrapeRunRecord {
  runId: string
  startedAt: Date
  finishedAt: Date | null
  totalProducts: number
  durationMs?: number
  pagesProcessed?: number
  stopReason?: string
  successRate?: string
  failureCounters: FailureCounters
  startUrl?: string
  goal?: string
}

export interface ScrapeOverview {
  totalRuns: number
  totalProducts: number
  averageDurationMs: number
  successRuns: number
  successRate: number
  averageProductsPerRun: number
  failureBuckets: Record<keyof FailureCounters, number>
}

const defaultFailureCounters: FailureCounters = {
  httpErrors: 0,
  noHtml: 0,
  claudeErrors: 0,
  parsingErrors: 0,
  emptyResults: 0,
  totalPages: 0,
}

export async function getRecentScrapeRuns(userId: string, limit = 50): Promise<ScrapeRunRecord[]> {
  const rows = await db.query.scrapeRuns.findMany({
    where: eq(scrapeRuns.userId, userId),
    orderBy: [desc(scrapeRuns.startedAt)],
    limit,
  })

  return rows.map((run) => {
    const metrics = (run.metrics || {}) as {
      durationMs?: number
      pagesProcessed?: number
      successRate?: string
      stopReason?: string
      startUrl?: string
      goal?: string
      failureCounters?: Partial<FailureCounters>
    }

    return {
      runId: run.runId,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      totalProducts: run.totalProducts || 0,
      durationMs: metrics.durationMs,
      pagesProcessed: metrics.pagesProcessed,
      stopReason: metrics.stopReason,
      successRate: metrics.successRate,
      failureCounters: { ...defaultFailureCounters, ...metrics.failureCounters },
      startUrl: metrics.startUrl,
      goal: metrics.goal,
    }
  })
}

export function buildOverview(runs: ScrapeRunRecord[]): ScrapeOverview {
  if (runs.length === 0) {
    return {
      totalRuns: 0,
      totalProducts: 0,
      averageDurationMs: 0,
      successRuns: 0,
      successRate: 0,
      averageProductsPerRun: 0,
      failureBuckets: { ...defaultFailureCounters },
    }
  }

  const totalProducts = runs.reduce((acc, run) => acc + run.totalProducts, 0)
  const totalDuration = runs.reduce((acc, run) => acc + (run.durationMs ?? 0), 0)
  const successRuns = runs.filter((run) => run.totalProducts > 0).length

  const failureBuckets = runs.reduce<Record<keyof FailureCounters, number>>((acc, run) => {
    for (const key of Object.keys(acc) as Array<keyof FailureCounters>) {
      acc[key] += run.failureCounters[key] ?? 0
    }
    return acc
  }, { ...defaultFailureCounters })

  return {
    totalRuns: runs.length,
    totalProducts,
    averageDurationMs: Math.round(totalDuration / runs.length),
    successRuns,
    successRate: Number(((successRuns / runs.length) * 100).toFixed(1)),
    averageProductsPerRun: Number((totalProducts / runs.length).toFixed(1)),
    failureBuckets,
  }
}

export function bucketRunsByDay(runs: ScrapeRunRecord[]) {
  const buckets = new Map<string, { products: number; duration: number; runs: number }>()

  runs.forEach((run) => {
    const key = run.startedAt.toISOString().slice(0, 10)
    const bucket = buckets.get(key) ?? { products: 0, duration: 0, runs: 0 }
    bucket.products += run.totalProducts
    bucket.duration += run.durationMs ?? 0
    bucket.runs += 1
    buckets.set(key, bucket)
  })

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([label, value]) => ({
      label,
      totalProducts: value.products,
      averageDurationMs: value.runs ? Math.round(value.duration / value.runs) : 0,
    }))
}
