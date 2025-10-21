import { chromium, type Browser } from 'playwright'
import { executeSearch, type SearchResult } from './search-engines'
import { detectProductPage, extractDomain, shouldExcludeDomain } from './product-detector'

export interface SearchConfig {
  query: string
  minSources: number
  searchEngines: string[]
  directSites: string[]
  filterNonProducts: boolean
}

// Check if running on Vercel production
function isVercelProduction() {
  return process.env.VERCEL_ENV === 'production'
}

export interface SearchProgress {
  stage: 'search_engines' | 'direct_sites' | 'product_detection' | 'completed'
  completed: number
  total: number
  sourcesFound: number
  productPagesFound?: number
  currentEngine?: string
}

export interface EnrichedSearchResult extends SearchResult {
  domain: string
  isProductPage?: boolean
  productScore?: number
  metadata?: {
    hasPrice: boolean
    hasAddToCart: boolean
    hasProductImages: boolean
    hasStructuredData: boolean
    schemaType?: string
  }
}

/**
 * Main orchestrator for smart product search
 * Coordinates search across multiple sources and filters for product pages
 */
export async function orchestrateSmartSearch(
  config: SearchConfig,
  onProgress?: (update: SearchProgress) => void | Promise<void>
): Promise<EnrichedSearchResult[]> {
  // Use Browserless.io for production, local chromium for development
  let browser: Browser
  
  if (isVercelProduction()) {
    // Use Browserless.io for production deployment
    if (!process.env.BROWSERLESS_TOKEN) {
      throw new Error(
        'Smart search requires BROWSERLESS_TOKEN environment variable in production. ' +
        'Please add your Browserless.io token to Vercel environment variables. ' +
        'See SMART_SEARCH_DEPLOYMENT.md for setup instructions.'
      )
    }
    
    browser = await chromium.connect({
      wsEndpoint: `wss://production-sfo.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`
    })
  } else {
    // Use local chromium for development
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  const allResults: EnrichedSearchResult[] = []
  const seenUrls = new Set<string>()

  try {
    console.log(`Starting smart search for: "${config.query}"`)

    // Phase 1: Search engines (Google, Bing, DuckDuckGo)
    console.log('Phase 1: Searching engines...')
    for (let i = 0; i < config.searchEngines.length; i++) {
      const engine = config.searchEngines[i]

      await onProgress?.({
        stage: 'search_engines',
        completed: i,
        total: config.searchEngines.length,
        sourcesFound: allResults.length,
        currentEngine: engine,
      })

      try {
        const results = await executeSearch(browser, engine, config.query)

        // Add results with deduplication
        for (const result of results) {
          if (!seenUrls.has(result.url)) {
            seenUrls.add(result.url)
            allResults.push({
              ...result,
              domain: extractDomain(result.url),
            })
          }
        }

        console.log(`${engine}: Found ${results.length} results`)

        // Rate limiting between engines
        await sleep(2000)
      } catch (error) {
        console.error(`Error searching ${engine}:`, error)
      }
    }

    await onProgress?.({
      stage: 'search_engines',
      completed: config.searchEngines.length,
      total: config.searchEngines.length,
      sourcesFound: allResults.length,
    })

    // Phase 2: Direct site searches (Amazon, eBay, etc.)
    console.log('Phase 2: Searching direct sites...')
    for (let i = 0; i < config.directSites.length; i++) {
      const site = config.directSites[i]

      await onProgress?.({
        stage: 'direct_sites',
        completed: i,
        total: config.directSites.length,
        sourcesFound: allResults.length,
        currentEngine: site,
      })

      try {
        const results = await executeSearch(browser, site.replace('.com', ''), config.query)

        for (const result of results) {
          if (!seenUrls.has(result.url)) {
            seenUrls.add(result.url)
            allResults.push({
              ...result,
              domain: extractDomain(result.url),
            })
          }
        }

        console.log(`${site}: Found ${results.length} results`)

        // Rate limiting between sites
        await sleep(2000)
      } catch (error) {
        console.error(`Error searching ${site}:`, error)
      }
    }

    await onProgress?.({
      stage: 'direct_sites',
      completed: config.directSites.length,
      total: config.directSites.length,
      sourcesFound: allResults.length,
    })

    console.log(`Total sources found: ${allResults.length}`)

    // Phase 3: Filter for product pages
    if (config.filterNonProducts) {
      console.log('Phase 3: Detecting product pages...')
      const productResults: EnrichedSearchResult[] = []
      const page = await browser.newPage()

      // Set user agent
      await page.setExtraHTTPHeaders({
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      })

      for (let i = 0; i < allResults.length; i++) {
        const result = allResults[i]

        // Skip if we already have enough sources
        if (productResults.length >= config.minSources) {
          console.log(`Reached minimum ${config.minSources} product pages`)
          break
        }

        // Skip excluded domains
        if (shouldExcludeDomain(result.domain)) {
          console.log(`Skipping excluded domain: ${result.domain}`)
          continue
        }

        await onProgress?.({
          stage: 'product_detection',
          completed: i + 1,
          total: Math.min(allResults.length, config.minSources + 10),
          sourcesFound: allResults.length,
          productPagesFound: productResults.length,
        })

        try {
          console.log(`Checking ${i + 1}/${allResults.length}: ${result.url}`)

          // Navigate to page with timeout
          await page.goto(result.url, {
            timeout: 10000,
            waitUntil: 'domcontentloaded',
          })

          // Get HTML content
          const html = await page.content()

          // Detect if it's a product page
          const detection = await detectProductPage(result.url, html)

          if (detection.isProductPage) {
            productResults.push({
              ...result,
              isProductPage: true,
              productScore: detection.score,
              metadata: detection.metadata,
            })
            console.log(`✓ Product page found (score: ${detection.score}): ${result.title}`)
          } else {
            console.log(`✗ Not a product page (score: ${detection.score}): ${result.title}`)
          }

          // Rate limiting
          await sleep(1500)
        } catch (error) {
          console.error(`Error checking ${result.url}:`, error)
          // Continue to next result on error
        }
      }

      await page.close()

      console.log(`Found ${productResults.length} product pages out of ${allResults.length} sources`)

      await onProgress?.({
        stage: 'completed',
        completed: allResults.length,
        total: allResults.length,
        sourcesFound: allResults.length,
        productPagesFound: productResults.length,
      })

      return productResults
    }

    // Return all results if filtering is disabled
    await onProgress?.({
      stage: 'completed',
      completed: allResults.length,
      total: allResults.length,
      sourcesFound: allResults.length,
    })

    return allResults.slice(0, config.minSources)
  } finally {
    await browser.close()
  }
}

/**
 * Helper to sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get deduplicated results by domain (keep highest scoring)
 */
export function deduplicateByDomain(
  results: EnrichedSearchResult[]
): EnrichedSearchResult[] {
  const domainMap = new Map<string, EnrichedSearchResult>()

  for (const result of results) {
    const existing = domainMap.get(result.domain)

    if (!existing || (result.productScore || 0) > (existing.productScore || 0)) {
      domainMap.set(result.domain, result)
    }
  }

  return Array.from(domainMap.values())
}
