import { test, expect } from '@playwright/test';

test.use({
  headless: false,
  viewport: { width: 1280, height: 720 },
  launchOptions: {
    slowMo: 1000, // Slow down actions by 1 second so you can see what's happening
  }
});

test('Open browser and test auth flow', async ({ page }) => {
  const BASE_URL = 'http://localhost:3001';

  console.log('\n🌐 Opening browser to test authentication flow...\n');

  // Step 1: Go to sign-in page
  console.log('Step 1: Navigating to /auth/signin...');
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.waitForLoadState('networkidle');
  console.log('✅ Sign-in page loaded\n');

  // Step 2: Verify page elements
  console.log('Step 2: Checking page elements...');
  await expect(page.getByText('Welcome to FetchPilot')).toBeVisible();
  console.log('✅ Welcome message visible');

  const googleButton = page.getByRole('button', { name: /Continue with Google/i });
  await expect(googleButton).toBeVisible();
  console.log('✅ Google button visible');

  const githubButton = page.getByRole('button', { name: /Continue with GitHub/i });
  await expect(githubButton).toBeVisible();
  console.log('✅ GitHub button visible\n');

  // Step 3: Test dashboard redirect
  console.log('Step 3: Testing dashboard redirect...');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');

  // Should redirect back to sign-in
  await expect(page).toHaveURL(/\/auth\/signin/);
  console.log('✅ Dashboard redirects to sign-in (unauthenticated)\n');

  // Step 4: Go back to sign-in page
  console.log('Step 4: Returning to sign-in page...');
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.waitForLoadState('networkidle');
  console.log('✅ Back on sign-in page\n');

  // Step 5: Highlight the Google button
  console.log('Step 5: Highlighting Google OAuth button...');
  await googleButton.scrollIntoViewIfNeeded();
  await googleButton.hover();
  await page.waitForTimeout(2000);
  console.log('✅ Google button is ready to click\n');

  console.log('========================================');
  console.log('📋 TEST RESULTS');
  console.log('========================================');
  console.log('✅ Sign-in page loads correctly');
  console.log('✅ OAuth buttons are visible');
  console.log('✅ Dashboard redirects unauthenticated users');
  console.log('✅ Middleware is working');
  console.log('\n🔐 READY FOR MANUAL TEST:');
  console.log('The browser is now on the sign-in page.');
  console.log('You can manually click "Continue with Google" to test the OAuth flow.');
  console.log('\nExpected flow:');
  console.log('1. Click "Continue with Google"');
  console.log('2. Google OAuth consent screen opens');
  console.log('3. After consent, redirects to: http://localhost:3001/dashboard');
  console.log('========================================\n');

  // Keep browser open for manual testing
  console.log('⏸️  Browser will stay open for 2 minutes for manual testing...');
  await page.waitForTimeout(120000); // Keep open for 2 minutes
});
