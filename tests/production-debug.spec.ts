import { test, expect } from '@playwright/test';

test.describe('Production Debug Tests', () => {
  const PROD_URL = 'https://fetchpilot.vercel.app';

  test('debug root page loading issue', async ({ page }) => {
    console.log('🔍 Debugging root page loading...');

    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('❌ Console error:', msg.text());
      }
    });

    // Listen for network failures
    page.on('requestfailed', request => {
      console.log('🌐 Request failed:', request.url(), request.failure()?.errorText);
    });

    try {
      console.log('Navigating to root page...');
      await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      console.log('Current URL after navigation:', page.url());
      
      // Take a screenshot to see what's happening
      await page.screenshot({ path: 'tests/screenshots/production-debug-root.png', fullPage: true });
      
      // Check what's actually visible
      const bodyText = await page.textContent('body');
      console.log('Page body text preview:', bodyText?.substring(0, 200) + '...');
      
      // Check if it's actually an infinite redirect loop or just slow loading
      await page.waitForTimeout(3000);
      console.log('URL after 3 seconds:', page.url());
      
    } catch (error) {
      console.log('❌ Error during navigation:', error);
    }

    console.log('Console errors found:', errors.length);
    if (errors.length > 0) {
      console.log('Error details:', errors);
    }
  });

  test('debug sign-in page vs dashboard redirect', async ({ page }) => {
    console.log('🔍 Testing redirect behavior...');
    
    // First, go directly to sign-in page (should work)
    await page.goto(`${PROD_URL}/auth/signin`);
    console.log('✅ Sign-in page loaded successfully');
    
    // Now try dashboard (should redirect to sign-in)
    await page.goto(`${PROD_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    
    console.log('Dashboard redirect result URL:', page.url());
    
    // Check if we're at sign-in page
    const isAtSignIn = page.url().includes('/auth/signin');
    console.log('Redirected to sign-in page:', isAtSignIn);
    
    if (isAtSignIn) {
      const url = page.url();
      const hasCallbackUrl = url.includes('callbackUrl');
      console.log('Has callbackUrl parameter:', hasCallbackUrl);
      console.log('Full redirect URL:', url);
    }
  });

  test('check middleware configuration in production', async ({ page }) => {
    console.log('🔍 Testing middleware behavior...');
    
    // Test various routes to see middleware behavior
    const testRoutes = ['/', '/dashboard', '/landing', '/auth/signin'];
    
    for (const route of testRoutes) {
      console.log(`Testing route: ${route}`);
      try {
        await page.goto(`${PROD_URL}${route}`, { 
          waitUntil: 'domcontentloaded', 
          timeout: 10000 
        });
        console.log(`  → Final URL: ${page.url()}`);
        
        // Check if page loaded or is still loading
        const loadingIndicator = page.locator('text=Loading...');
        const hasLoadingText = await loadingIndicator.isVisible();
        console.log(`  → Has "Loading..." text: ${hasLoadingText}`);
        
      } catch (error) {
        console.log(`  → Error: ${error}`);
      }
    }
  });
});
