import { test, expect } from '@playwright/test'

test.describe('Debug Scraping Issues', () => {
  const testUrl = 'https://signaturesolar.com/all-products/inverters/'
  const localHost = 'http://localhost:3000'

  test('debug why scraper finds 0 products', async ({ page }) => {
    console.log('=== DEBUGGING SCRAPER ISSUES ===')
    
    // Test 1: Direct API call to see logs
    console.log('1. Testing scrape API directly...')
    const scrapeResponse = await page.request.post(`${localHost}/api/scrape`, {
      data: {
        url: testUrl,
        goal: 'Find EG4 inverters with prices'
      }
    })

    const scrapeData = await scrapeResponse.json()
    console.log('All scrape logs:')
    scrapeData.logs?.forEach((log: string, i: number) => {
      console.log(`  ${i + 1}. ${log}`)
    })

    // Test 2: Check what our scraper actually receives
    console.log('\n2. Checking what HTML the scraper gets...')
    
    // Simulate what our scraper does - fetch the URL directly
    const directResponse = await page.request.get(testUrl)
    const html = await directResponse.text()
    
    console.log('Response status:', directResponse.status())
    console.log('Response headers:', Object.fromEntries(directResponse.headers()))
    console.log('HTML length:', html.length)
    console.log('HTML contains "EG4":', html.includes('EG4'))
    console.log('HTML contains "Inverter":', html.includes('Inverter'))
    console.log('HTML contains "$":', html.includes('$'))
    
    // Check for common product indicators
    const productIndicators = [
      'Add to Cart',
      'price',
      'product',
      'item',
      'grid-item',
      'EG4 6000XP',
      'application/ld+json'
    ]
    
    productIndicators.forEach(indicator => {
      console.log(`HTML contains "${indicator}":`, html.includes(indicator))
    })

    // Test 3: Try the page with a real browser to see if JS is needed
    console.log('\n3. Testing with browser rendering...')
    try {
      await page.goto(testUrl, { timeout: 10000 })
      await page.waitForTimeout(3000) // Wait for JS to load
      
      const content = await page.content()
      console.log('Browser-rendered HTML length:', content.length)
      console.log('Browser HTML contains "EG4":', content.includes('EG4'))
      console.log('Browser HTML contains "Add to Cart":', content.includes('Add to Cart'))
      
      // Check if products are dynamically loaded
      const productCount = await page.locator('text=/EG4.*Inverter/i').count()
      console.log('Visible EG4 products in browser:', productCount)
      
      const priceCount = await page.locator('text=/\\$[0-9,]+/').count()
      console.log('Visible prices in browser:', priceCount)
      
    } catch (e) {
      console.log('Browser loading failed:', e)
    }
  })

  test('test authentication and job saving', async ({ page }) => {
    console.log('=== DEBUGGING AUTH ISSUES ===')
    
    // Test auth endpoint directly
    console.log('1. Testing auth endpoints...')
    
    const healthResponse = await page.request.get(`${localHost}/api/health`)
    console.log('Health check status:', healthResponse.status())
    
    // Try to get session info
    try {
      await page.goto(localHost)
      const sessionData = await page.evaluate(() => {
        // Check if there's any session info in the page
        return {
          hasSessionProvider: !!document.querySelector('[data-session]'),
          cookieCount: document.cookie.split(';').length,
          cookies: document.cookie
        }
      })
      console.log('Session data:', sessionData)
    } catch (e) {
      console.log('Could not check session:', e)
    }

    // Test job saving with minimal data
    console.log('2. Testing job save with minimal data...')
    const testProduct = {
      title: 'Test EG4 Inverter',
      price: '$1549.00',
      url: 'https://signaturesolar.com/test'
    }

    const jobResponse = await page.request.post(`${localHost}/api/jobs`, {
      data: {
        url: testUrl,
        goal: 'Test save',
        products: [testProduct],
        productsFound: 1
      }
    })

    console.log('Job save status:', jobResponse.status())
    const jobData = await jobResponse.json()
    console.log('Job save response:', jobData)

    if (jobResponse.status() === 401) {
      console.log('AUTH ISSUE: Need to implement session handling for API calls')
    }
  })

  test('test scraper with simpler URL', async ({ page }) => {
    console.log('=== TESTING SIMPLER URL ===')
    
    // Test with a simpler e-commerce site first
    const simpleUrl = 'https://example.com'
    
    const scrapeResponse = await page.request.post(`${localHost}/api/scrape`, {
      data: {
        url: simpleUrl,
        goal: 'Test basic scraping'
      }
    })

    const scrapeData = await scrapeResponse.json()
    console.log('Simple URL scrape results:')
    console.log('Products found:', scrapeData.products?.length || 0)
    console.log('Last 3 logs:', scrapeData.logs?.slice(-3))
    
    // Now test a known working e-commerce site structure
    console.log('\n=== TESTING FALLBACK STRATEGIES ===')
    
    // Test our current scraper's fallback behavior
    const strategies = ['HYBRID', 'JSONLD']
    for (const strategy of strategies) {
      console.log(`Testing ${strategy} strategy...`)
      // This would test if our scraper could be configured for different strategies
    }
  })
})
