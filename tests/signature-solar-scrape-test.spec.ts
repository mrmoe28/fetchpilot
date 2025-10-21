import { test, expect } from '@playwright/test'

test.describe('Signature Solar Scraping and Job Saving Tests', () => {
  const testUrl = 'https://signaturesolar.com/all-products/inverters/'
  const localHost = 'http://localhost:3000'

  test('should scrape and save job for Signature Solar inverters', async ({ page }) => {
    // Step 1: Navigate to the app
    await page.goto(localHost)
    
    // Step 2: Handle authentication if needed
    try {
      // Check if we're redirected to sign-in
      await page.waitForURL('**/auth/signin', { timeout: 3000 })
      console.log('Sign-in required - testing without authentication')
    } catch (e) {
      console.log('No sign-in redirect - continuing with test')
    }

    // Step 3: Test the scraping API directly first
    console.log('Testing scrape API directly...')
    const scrapeResponse = await page.request.post(`${localHost}/api/scrape`, {
      data: {
        url: testUrl,
        goal: 'Extract solar inverter products with prices and specifications'
      }
    })

    expect(scrapeResponse.ok()).toBeTruthy()
    const scrapeData = await scrapeResponse.json()
    
    console.log('Scrape Response:', {
      productsFound: scrapeData.stats?.productsFound || 0,
      pagesProcessed: scrapeData.stats?.pagesProcessed || 0,
      duration: scrapeData.stats?.duration || 0,
      logsCount: scrapeData.logs?.length || 0
    })

    // Log the last few log entries to see what happened
    if (scrapeData.logs && scrapeData.logs.length > 0) {
      console.log('Last 3 log entries:', scrapeData.logs.slice(-3))
    }

    // Step 4: Test job saving if we have products
    if (scrapeData.products && scrapeData.products.length > 0) {
      console.log(`Found ${scrapeData.products.length} products, testing job saving...`)
      
      const jobSaveResponse = await page.request.post(`${localHost}/api/jobs`, {
        data: {
          url: testUrl,
          goal: 'Extract solar inverter products with prices and specifications',
          products: scrapeData.products,
          productsFound: scrapeData.products.length
        }
      })

      console.log('Job Save Response Status:', jobSaveResponse.status())
      const jobSaveData = await jobSaveResponse.json()
      console.log('Job Save Response:', jobSaveData)

      if (!jobSaveResponse.ok()) {
        console.error('Job saving failed:', jobSaveData)
        // This will help us identify the exact error
        expect(jobSaveResponse.ok()).toBeTruthy()
      }
    } else {
      console.log('No products found - investigating scraping issue')
      
      // Step 5: Test the actual page to see what products should be available
      await page.goto(testUrl)
      await page.waitForLoadState('networkidle')
      
      // Look for product elements on the page
      const productElements = await page.locator('[class*="product"], [class*="item"], .grid-item, .product-item').count()
      console.log(`Found ${productElements} potential product elements on page`)
      
      // Look for price elements
      const priceElements = await page.locator('[class*="price"], [class*="cost"]').count()
      console.log(`Found ${priceElements} potential price elements on page`)
      
      // Look for specific Signature Solar product patterns
      const eg4Products = await page.locator('text=/EG4.*Inverter/i').count()
      console.log(`Found ${eg4Products} EG4 inverter products`)
      
      // Check if there are Add to Cart buttons
      const addToCartButtons = await page.locator('text=/Add to Cart/i').count()
      console.log(`Found ${addToCartButtons} 'Add to Cart' buttons`)

      // Take a screenshot for debugging
      await page.screenshot({ path: 'tests/screenshots/signature-solar-debug.png', fullPage: true })
      console.log('Screenshot saved to tests/screenshots/signature-solar-debug.png')
    }
  })

  test('should test different extraction strategies', async ({ page }) => {
    console.log('Testing different extraction approaches...')
    
    // Navigate to the page and extract data manually to understand the structure
    await page.goto(testUrl)
    await page.waitForLoadState('networkidle')
    
    // Extract JSON-LD data (if available)
    const jsonLdData = await page.evaluate(() => {
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')
      const data: any[] = []
      jsonLdScripts.forEach(script => {
        try {
          data.push(JSON.parse(script.textContent || ''))
        } catch (e) {
          // Ignore parsing errors
        }
      })
      return data
    })
    
    console.log('JSON-LD data found:', jsonLdData.length > 0 ? 'Yes' : 'No')
    if (jsonLdData.length > 0) {
      console.log('JSON-LD sample:', JSON.stringify(jsonLdData[0], null, 2).substring(0, 500))
    }

    // Extract product data using CSS selectors
    const productData = await page.evaluate(() => {
      const products: any[] = []
      
      // Look for common e-commerce product selectors
      const productSelectors = [
        '.product-item',
        '.grid-item', 
        '[class*="product"]',
        '[data-product]',
        'article',
        '.item'
      ]
      
      for (const selector of productSelectors) {
        const elements = document.querySelectorAll(selector)
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`)
          
          elements.forEach((el, idx) => {
            if (idx < 5) { // Only process first 5 for testing
              const titleEl = el.querySelector('[class*="title"], h1, h2, h3, h4, .name, [class*="name"]')
              const priceEl = el.querySelector('[class*="price"], [class*="cost"], .amount')
              const linkEl = el.querySelector('a[href]')
              
              if (titleEl || priceEl) {
                products.push({
                  title: titleEl?.textContent?.trim() || 'No title',
                  price: priceEl?.textContent?.trim() || 'No price',
                  url: linkEl?.getAttribute('href') || 'No URL',
                  selector: selector,
                  html: el.outerHTML.substring(0, 200) + '...'
                })
              }
            }
          })
          break // Use first successful selector
        }
      }
      
      return products
    })
    
    console.log(`Extracted ${productData.length} products using CSS selectors`)
    if (productData.length > 0) {
      console.log('Sample product:', JSON.stringify(productData[0], null, 2))
    }

    // Test our scraper's fallback strategies
    const strategies = ['HYBRID', 'JSONLD', 'CSS_SELECTORS']
    for (const strategy of strategies) {
      console.log(`Testing strategy: ${strategy}`)
      
      const response = await page.request.post(`${localHost}/api/scrape`, {
        data: {
          url: testUrl,
          goal: `Extract products using ${strategy} strategy`,
          config: { strategy: strategy }
        }
      })
      
      if (response.ok()) {
        const data = await response.json()
        console.log(`${strategy} strategy found: ${data.products?.length || 0} products`)
      }
    }
  })

  test('should verify authentication for job saving', async ({ page }) => {
    console.log('Testing authentication for job saving...')
    
    // Test job saving without authentication
    const unauthorizedResponse = await page.request.post(`${localHost}/api/jobs`, {
      data: {
        url: testUrl,
        goal: 'Test auth',
        products: [{
          title: 'Test Product',
          price: '$100',
          url: 'https://example.com/product'
        }]
      }
    })
    
    console.log('Unauthorized job save status:', unauthorizedResponse.status())
    const unauthorizedData = await unauthorizedResponse.json()
    console.log('Unauthorized response:', unauthorizedData)
    
    // Check if it's an auth issue
    if (unauthorizedResponse.status() === 401) {
      console.log('✓ Confirmed: Job saving requires authentication')
      console.log('Need to implement proper session handling for job saving')
    } else if (unauthorizedResponse.ok()) {
      console.log('✓ Job saving works without authentication')
    } else {
      console.log('✗ Job saving failed for other reasons:', unauthorizedData)
    }
  })
})
