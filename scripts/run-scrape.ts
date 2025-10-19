#!/usr/bin/env tsx

/**
 * FetchPilot Batch Scraping Script
 * 
 * Loads URLs and goals from JSON config, runs scrapeProducts with structured logging,
 * saves metrics to database, and outputs summary to stdout.
 * 
 * Usage:
 *   tsx scripts/run-scrape.ts [config.json]
 *   npm run verify:scrape
 * 
 * Config format:
 * {
 *   "runs": [
 *     {
 *       "url": "https://example.com/products",
 *       "goal": "Extract product listings with prices",
 *       "minProducts": 5,
 *       "maxPages": 10
 *     }
 *   ],
 *   "anthropicKey": "sk-ant-...",  // Optional, uses env var if not provided
 *   "userId": "test-user"          // Optional
 * }
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { scrapeProducts } from '../lib/agent'
import { saveScrapeRun } from '../lib/db'

interface ScrapingRun {
  url: string
  goal: string
  minProducts?: number
  maxPages?: number
}

interface Config {
  runs: ScrapingRun[]
  anthropicKey?: string
  userId?: string
}

interface RunResult {
  runId: string
  url: string
  goal: string
  success: boolean
  totalProducts: number
  durationMs: number
  error?: string
  summary?: any
}

async function main() {
  const configPath = process.argv[2] || join(__dirname, 'scrape-config.json')
  
  console.log(`🚀 FetchPilot Batch Scraper`)
  console.log(`📄 Config: ${configPath}`)
  
  let config: Config
  try {
    const configContent = readFileSync(configPath, 'utf-8')
    config = JSON.parse(configContent)
  } catch (error) {
    console.error(`❌ Failed to load config from ${configPath}:`, error)
    process.exit(1)
  }

  const anthropicKey = config.anthropicKey || process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    console.error('❌ Missing ANTHROPIC_API_KEY in config or environment')
    process.exit(1)
  }

  console.log(`📊 Running ${config.runs.length} scraping jobs...`)
  console.log('')

  const results: RunResult[] = []
  let hasFailures = false

  for (let i = 0; i < config.runs.length; i++) {
    const run = config.runs[i]
    const runId = randomUUID()
    const startTime = new Date()
    
    console.log(`[${i + 1}/${config.runs.length}] 🔍 ${run.url}`)
    console.log(`  Goal: ${run.goal}`)
    console.log(`  Run ID: ${runId}`)

    const logs: string[] = []
    const events: any[] = []
    
    const logger = (event: any) => {
      events.push(event)
      if (process.env.DEBUG) {
        console.log(`  📝 ${event.stage}: ${JSON.stringify(event)}`)
      }
    }

    let result: RunResult
    const perfStart = performance.now()

    try {
      const products = await scrapeProducts(run.url, run.goal, {
        anthropicKey,
        maxTotalPages: run.maxPages || 10,
        runId,
        logger,
        logs
      })

      const durationMs = Math.round(performance.now() - perfStart)
      const summary = events.find(e => e.stage === 'scrape_complete' || e.stage === 'scrape_complete_early')
      
      result = {
        runId,
        url: run.url,
        goal: run.goal,
        success: products.length >= (run.minProducts || 1),
        totalProducts: products.length,
        durationMs,
        summary
      }

      // Save to database
      await saveScrapeRun({
        runId,
        userId: config.userId,
        startedAt: startTime,
        finishedAt: new Date(),
        totalProducts: products.length,
        metrics: {
          durationMs,
          pagesProcessed: summary?.pagesProcessed || 0,
          failureCounters: summary?.failureCounters,
          successRate: summary?.successRate,
          stopReason: summary?.stopReason,
          startUrl: run.url,
          goal: run.goal
        }
      })

      console.log(`  ✅ Success: ${products.length} products (${durationMs}ms)`)
      
      if (!result.success) {
        console.log(`  ⚠️  Warning: Only ${products.length} products, expected ${run.minProducts || 1}`)
        hasFailures = true
      }

    } catch (error) {
      const durationMs = Math.round(performance.now() - perfStart)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      result = {
        runId,
        url: run.url,
        goal: run.goal,
        success: false,
        totalProducts: 0,
        durationMs,
        error: errorMessage
      }

      // Save error run to database
      await saveScrapeRun({
        runId,
        userId: config.userId,
        startedAt: startTime,
        finishedAt: new Date(),
        totalProducts: 0,
        metrics: {
          durationMs,
          startUrl: run.url,
          goal: run.goal
        }
      })

      console.log(`  ❌ Failed: ${errorMessage} (${durationMs}ms)`)
      hasFailures = true
    }

    results.push(result)
    console.log('')
  }

  // Output summary
  const totalProducts = results.reduce((sum, r) => sum + r.totalProducts, 0)
  const successfulRuns = results.filter(r => r.success).length
  const avgDuration = results.reduce((sum, r) => sum + r.durationMs, 0) / results.length

  console.log('📊 SUMMARY')
  console.log('=' .repeat(50))
  console.log(`Total runs: ${results.length}`)
  console.log(`Successful: ${successfulRuns}/${results.length} (${(successfulRuns/results.length*100).toFixed(1)}%)`)
  console.log(`Total products: ${totalProducts}`)
  console.log(`Average duration: ${Math.round(avgDuration)}ms`)
  console.log('')

  // Detailed results
  console.log('📝 DETAILED RESULTS')
  console.log(JSON.stringify(results, null, 2))

  // Exit with error code if any run failed to meet minimum requirements
  if (hasFailures) {
    console.error('')
    console.error('❌ Some runs failed to meet minimum product requirements')
    process.exit(1)
  }

  console.log('')
  console.log('✅ All scraping runs completed successfully!')
  process.exit(0)
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled rejection:', reason)
  process.exit(1)
})

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
}

export { main }
