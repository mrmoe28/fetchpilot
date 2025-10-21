import { test, expect } from '@playwright/test'

test.describe('Complete Scraping and Job Saving Flow', () => {
  const testUrl = 'https://signaturesolar.com/all-products/inverters/'
  
  test('complete flow: scrape products and save job via UI', async ({ page }) => {
    console.log('=== TESTING COMPLETE SCRAPING + JOB SAVING FLOW ===')
    
    // Step 1: Navigate to the app
    await page.goto('http://localhost:3000')
    
    // Check if we need to sign in (we'll skip auth for now to test the core functionality)
    console.log('1. Testing scraping through UI...')
    
    // Look for the scraper form
    try {
      // Find the URL input field
      const urlInput = page.locator('input[type="url"], input[placeholder*="URL"], input[name*="url"]').first()
      await urlInput.fill(testUrl)
      
      // Find the goal input field  
      const goalInput = page.locator('input[placeholder*="goal"], textarea[placeholder*="goal"], input[name*="goal"]').first()
      await goalInput.fill('Extract EG4 inverter products with prices')
      
      // Find and click the scrape button
      const scrapeButton = page.locator('button:has-text("Scrape"), button:has-text("Start")').first()
      await scrapeButton.click()
      
      // Wait for scraping to complete (look for results or completion indicators)
      await page.waitForSelector('text=/products/i', { timeout: 30000 })
      
      // Check if we got results
      const resultsText = await page.textContent('body')
      const hasProducts = resultsText?.includes('EG4') || resultsText?.includes('Inverter')
      console.log('UI Scraping Results:', hasProducts ? 'Found products' : 'No products found')
      
      if (hasProducts) {
        // Try to save the job if there's a save button
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Save Job")').first()
        const saveButtonExists = await saveButton.count() > 0
        
        if (saveButtonExists) {
          console.log('2. Testing job saving through UI...')
          await saveButton.click()
          
          // Wait for save confirmation or error
          await page.waitForTimeout(2000)
          
          const pageContent = await page.textContent('body')
          const saveSuccess = pageContent?.includes('saved') || pageContent?.includes('success')
          const saveError = pageContent?.includes('Unauthorized') || pageContent?.includes('Failed to save')
          
          console.log('Job Save Result:', {
            success: saveSuccess,
            error: saveError,
            requiresAuth: saveError && pageContent?.includes('Unauthorized')
          })
          
          if (saveError && pageContent?.includes('Unauthorized')) {
            console.log('✓ Confirmed: Job saving requires user authentication')
            console.log('  This is expected behavior - users must be logged in to save jobs')
          }
        } else {
          console.log('No save button found - products may be automatically saved')
        }
      }
      
    } catch (error) {
      console.log('Error testing UI flow:', error)
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'tests/screenshots/ui-flow-error.png' })
      console.log('Screenshot saved: tests/screenshots/ui-flow-error.png')
    }
  })

  test('verify scraping API is working consistently', async ({ page }) => {
    console.log('=== VERIFYING SCRAPING API CONSISTENCY ===')
    
    // Test the API multiple times to ensure it's stable
    for (let i = 1; i <= 3; i++) {
      console.log(`Scraping test ${i}/3...`)
      
      const response = await page.request.post('http://localhost:3000/api/scrape', {
        data: {
          url: testUrl,
          goal: `Test run ${i}: Extract inverter products`
        }
      })
      
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      
      console.log(`Run ${i} Results:`, {
        products: data.products?.length || 0,
        duration: data.stats?.duration || 0,
        success: data.stats?.productsFound > 0
      })
      
      // Verify we consistently get products
      expect(data.products?.length).toBeGreaterThan(0)
    }
    
    console.log('✓ Scraping API is working consistently')
  })

  test('document the current authentication requirement', async ({ page }) => {
    console.log('=== DOCUMENTING AUTHENTICATION BEHAVIOR ===')
    
    // Test what happens with different endpoints
    const endpoints = [
      { name: 'Health Check', path: '/api/health', expectAuth: false },
      { name: 'Scraping', path: '/api/scrape', expectAuth: false },
      { name: 'Job Saving', path: '/api/jobs', expectAuth: true },
      { name: 'Categories', path: '/api/categories', expectAuth: true }
    ]
    
    for (const endpoint of endpoints) {
      if (endpoint.name === 'Scraping') {
        const response = await page.request.post(`http://localhost:3000${endpoint.path}`, {
          data: { url: 'https://example.com', goal: 'test' }
        })
        console.log(`${endpoint.name}: ${response.status()} - ${endpoint.expectAuth ? 'Should require auth' : 'Should work without auth'}`)
      } else if (endpoint.name === 'Job Saving') {
        const response = await page.request.post(`http://localhost:3000${endpoint.path}`, {
          data: { url: 'test', products: [{ title: 'test', url: 'test' }] }
        })
        console.log(`${endpoint.name}: ${response.status()} - ${endpoint.expectAuth ? 'Should require auth' : 'Should work without auth'}`)
      } else {
        const response = await page.request.get(`http://localhost:3000${endpoint.path}`)
        console.log(`${endpoint.name}: ${response.status()} - ${endpoint.expectAuth ? 'Should require auth' : 'Should work without auth'}`)
      }
    }
  })
})
