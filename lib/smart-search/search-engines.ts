import type { Page, Browser } from 'playwright'

export interface SearchResult {
  url: string
  title: string
  snippet: string
  source: string
}

/**
 * Search Google Shopping for products
 */
export async function searchGoogle(
  browser: Browser,
  query: string
): Promise<SearchResult[]> {
  const page = await browser.newPage()
  const results: SearchResult[] = []

  try {
    // Navigate to Google Shopping
    await page.goto(
      `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`,
      { timeout: 15000, waitUntil: 'domcontentloaded' }
    )

    // Wait for results
    await page.waitForSelector('.sh-dgr__grid-result, div[data-content-feature="1"]', {
      timeout: 5000,
    }).catch(() => {
      console.log('Google Shopping results not found')
    })

    // Extract results
    const items = await page.evaluate(() => {
      const results: Array<{ url: string; title: string; snippet: string }> = []

      // Try multiple selectors for Google's changing DOM
      const selectors = [
        '.sh-dgr__grid-result',
        'div[data-content-feature="1"]',
        '.sh-np__click-target',
      ]

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector)

        if (elements.length > 0) {
          elements.forEach((el, index) => {
            if (index >= 15) return // Limit to 15 results

            const linkEl = el.querySelector('a')
            const titleEl = el.querySelector('h3, .tAxDx, .sh-np__product-title')
            const priceEl = el.querySelector('.a8Pemb, .sh-np__product-price')

            const url = linkEl?.getAttribute('href') || ''
            const title = titleEl?.textContent?.trim() || ''
            const snippet = priceEl?.textContent?.trim() || ''

            if (url && title) {
              results.push({ url, title, snippet })
            }
          })

          if (results.length > 0) break
        }
      }

      return results
    })

    results.push(...items.map(item => ({ ...item, source: 'google' })))
  } catch (error) {
    console.error('Error searching Google:', error)
  } finally {
    await page.close()
  }

  return results
}

/**
 * Search Bing Shopping for products
 */
export async function searchBing(
  browser: Browser,
  query: string
): Promise<SearchResult[]> {
  const page = await browser.newPage()
  const results: SearchResult[] = []

  try {
    await page.goto(
      `https://www.bing.com/shop?q=${encodeURIComponent(query)}`,
      { timeout: 15000, waitUntil: 'domcontentloaded' }
    )

    // Wait for results
    await page.waitForSelector('.productCard, .b_pag', { timeout: 5000 }).catch(() => {
      console.log('Bing Shopping results not found')
    })

    const items = await page.evaluate(() => {
      const results: Array<{ url: string; title: string; snippet: string }> = []
      const elements = document.querySelectorAll('.productCard')

      elements.forEach((el, index) => {
        if (index >= 15) return

        const linkEl = el.querySelector('a')
        const titleEl = el.querySelector('.productTitle, h3')
        const priceEl = el.querySelector('.productPrice, .price')

        const url = linkEl?.getAttribute('href') || ''
        const title = titleEl?.textContent?.trim() || ''
        const snippet = priceEl?.textContent?.trim() || ''

        if (url && title) {
          results.push({ url, title, snippet })
        }
      })

      return results
    })

    results.push(...items.map(item => ({ ...item, source: 'bing' })))
  } catch (error) {
    console.error('Error searching Bing:', error)
  } finally {
    await page.close()
  }

  return results
}

/**
 * Search DuckDuckGo for products
 */
export async function searchDuckDuckGo(
  browser: Browser,
  query: string
): Promise<SearchResult[]> {
  const page = await browser.newPage()
  const results: SearchResult[] = []

  try {
    await page.goto(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=shopping`,
      { timeout: 15000, waitUntil: 'domcontentloaded' }
    )

    // Wait for results
    await page.waitForSelector('.tile--shop, article', { timeout: 5000 }).catch(() => {
      console.log('DuckDuckGo results not found')
    })

    const items = await page.evaluate(() => {
      const results: Array<{ url: string; title: string; snippet: string }> = []
      const elements = document.querySelectorAll('.tile--shop, article[data-testid]')

      elements.forEach((el, index) => {
        if (index >= 10) return

        const linkEl = el.querySelector('a')
        const titleEl = el.querySelector('.tile__title, h2')
        const priceEl = el.querySelector('.tile__price, .price')

        const url = linkEl?.getAttribute('href') || ''
        const title = titleEl?.textContent?.trim() || ''
        const snippet = priceEl?.textContent?.trim() || ''

        if (url && title) {
          results.push({ url, title, snippet })
        }
      })

      return results
    })

    results.push(...items.map(item => ({ ...item, source: 'duckduckgo' })))
  } catch (error) {
    console.error('Error searching DuckDuckGo:', error)
  } finally {
    await page.close()
  }

  return results
}

/**
 * Search Amazon for products
 */
export async function searchAmazon(
  browser: Browser,
  query: string
): Promise<SearchResult[]> {
  const page = await browser.newPage()
  const results: SearchResult[] = []

  try {
    // Set user agent to avoid bot detection
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    await page.goto(
      `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
      { timeout: 15000, waitUntil: 'domcontentloaded' }
    )

    // Wait for results
    await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item', {
      timeout: 5000,
    }).catch(() => {
      console.log('Amazon results not found')
    })

    const items = await page.evaluate(() => {
      const results: Array<{ url: string; title: string; snippet: string }> = []
      const elements = document.querySelectorAll('[data-component-type="s-search-result"]')

      elements.forEach((el, index) => {
        if (index >= 15) return

        const linkEl = el.querySelector('h2 a, .a-link-normal')
        const titleEl = el.querySelector('h2 span, .a-text-normal')
        const priceEl = el.querySelector('.a-price-whole, .a-price .a-offscreen')

        const href = linkEl?.getAttribute('href') || ''
        const url = href.startsWith('http') ? href : `https://www.amazon.com${href}`
        const title = titleEl?.textContent?.trim() || ''
        const snippet = priceEl?.textContent?.trim() || ''

        if (url && title) {
          results.push({ url, title, snippet })
        }
      })

      return results
    })

    results.push(...items.map(item => ({ ...item, source: 'amazon' })))
  } catch (error) {
    console.error('Error searching Amazon:', error)
  } finally {
    await page.close()
  }

  return results
}

/**
 * Search eBay for products
 */
export async function searchEbay(
  browser: Browser,
  query: string
): Promise<SearchResult[]> {
  const page = await browser.newPage()
  const results: SearchResult[] = []

  try {
    await page.goto(
      `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`,
      { timeout: 15000, waitUntil: 'domcontentloaded' }
    )

    // Wait for results
    await page.waitForSelector('.s-item, .srp-results .s-item', { timeout: 5000 }).catch(() => {
      console.log('eBay results not found')
    })

    const items = await page.evaluate(() => {
      const results: Array<{ url: string; title: string; snippet: string }> = []
      const elements = document.querySelectorAll('.s-item')

      elements.forEach((el, index) => {
        if (index >= 15) return

        const linkEl = el.querySelector('.s-item__link')
        const titleEl = el.querySelector('.s-item__title')
        const priceEl = el.querySelector('.s-item__price')

        const url = linkEl?.getAttribute('href') || ''
        const title = titleEl?.textContent?.trim() || ''
        const snippet = priceEl?.textContent?.trim() || ''

        if (url && title && !title.toLowerCase().includes('shop on ebay')) {
          results.push({ url, title, snippet })
        }
      })

      return results
    })

    results.push(...items.map(item => ({ ...item, source: 'ebay' })))
  } catch (error) {
    console.error('Error searching eBay:', error)
  } finally {
    await page.close()
  }

  return results
}

/**
 * Execute search on specified engine
 */
export async function executeSearch(
  browser: Browser,
  engine: string,
  query: string
): Promise<SearchResult[]> {
  console.log(`Searching ${engine} for: ${query}`)

  switch (engine.toLowerCase()) {
    case 'google':
      return searchGoogle(browser, query)
    case 'bing':
      return searchBing(browser, query)
    case 'duckduckgo':
      return searchDuckDuckGo(browser, query)
    case 'amazon':
      return searchAmazon(browser, query)
    case 'ebay':
      return searchEbay(browser, query)
    default:
      console.warn(`Unknown search engine: ${engine}`)
      return []
  }
}
