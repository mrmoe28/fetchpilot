import { chromium } from 'playwright';

async function testSignIn() {
  console.log('🚀 Starting sign-in test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down so we can see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to sign-in page
    console.log('📍 Step 1: Navigating to sign-in page...');
    await page.goto('http://localhost:3000/auth/signin', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Take screenshot of sign-in page
    await page.screenshot({ path: 'screenshots/1-signin-page.png' });
    console.log('✅ Sign-in page loaded');
    console.log('📸 Screenshot saved: screenshots/1-signin-page.png\n');

    // Step 2: Verify page elements
    console.log('🔍 Step 2: Checking page elements...');
    const heading = await page.textContent('h1');
    console.log(`   - Heading: "${heading}"`);

    // Check for Google button
    const googleButton = await page.locator('button:has-text("Continue with Google")').first();
    const isVisible = await googleButton.isVisible();
    console.log(`   - Google button visible: ${isVisible}`);

    // Check for GitHub button
    const githubButton = await page.locator('button:has-text("Continue with GitHub")').first();
    const isGithubVisible = await githubButton.isVisible();
    console.log(`   - GitHub button visible: ${isGithubVisible}\n`);

    // Step 3: Click Google sign-in button
    console.log('🖱️  Step 3: Clicking "Continue with Google"...');
    await googleButton.click();

    // Wait for navigation to Google
    await page.waitForTimeout(2000);

    // Take screenshot after clicking
    await page.screenshot({ path: 'screenshots/2-after-click.png' });

    // Check current URL
    const currentUrl = page.url();
    console.log(`✅ Redirected to: ${currentUrl}`);
    console.log('📸 Screenshot saved: screenshots/2-after-click.png\n');

    // Step 4: Verify we're on Google OAuth page
    if (currentUrl.includes('accounts.google.com')) {
      console.log('✅ SUCCESS: Redirected to Google OAuth!');
      console.log('🔐 Google sign-in flow initiated correctly.\n');

      // Take screenshot of Google page
      await page.screenshot({ path: 'screenshots/3-google-oauth.png' });
      console.log('📸 Screenshot saved: screenshots/3-google-oauth.png\n');

      console.log('📋 Next Steps:');
      console.log('   1. OAuth configuration is working correctly');
      console.log('   2. Manual sign-in required (Google security prevents automation)');
      console.log('   3. After signing in, you should be redirected to /dashboard\n');
    } else {
      console.log('⚠️  Not redirected to Google. Current URL:', currentUrl);
      console.log('   This might indicate a configuration issue.\n');
    }

    // Keep browser open for manual testing
    console.log('🎯 Browser will stay open for 30 seconds for manual testing...');
    console.log('   You can manually complete the Google sign-in if you want!\n');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: 'screenshots/error.png' });
    console.log('📸 Error screenshot saved: screenshots/error.png\n');
  } finally {
    await browser.close();
    console.log('✨ Test complete!\n');
  }
}

// Create screenshots directory
import { mkdirSync } from 'fs';
try {
  mkdirSync('screenshots', { recursive: true });
} catch (err) {
  // Directory might already exist
}

testSignIn().catch(console.error);
