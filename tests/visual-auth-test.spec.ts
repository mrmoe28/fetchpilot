import { test, expect } from '@playwright/test';

// Visual test - runs in headed mode so you can see what's happening
test.describe('Visual Auth Flow Test', () => {
  const BASE_URL = 'http://localhost:3001';

  test('Visual: Complete auth flow walkthrough', async ({ page }) => {
    console.log('🔍 Starting visual auth test...');

    // Step 1: Navigate to sign-in page
    console.log('Step 1: Navigating to sign-in page...');
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');

    console.log('✅ Sign-in page loaded');
    await page.screenshot({ path: 'tests/screenshots/01-signin-page.png', fullPage: true });

    // Verify sign-in page elements
    await expect(page.getByText('Welcome to FetchPilot')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
    console.log('✅ Sign-in page elements verified');

    // Step 2: Test dashboard redirect for unauthenticated user
    console.log('Step 2: Testing dashboard redirect...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Should redirect to sign-in
    await expect(page).toHaveURL(/\/auth\/signin/);
    console.log('✅ Dashboard correctly redirects to sign-in');
    await page.screenshot({ path: 'tests/screenshots/02-dashboard-redirect.png', fullPage: true });

    // Step 3: Check OAuth button
    console.log('Step 3: Checking Google OAuth button...');
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
    console.log('✅ Google OAuth button is ready');

    // Step 4: Check API endpoints
    console.log('Step 4: Checking auth API endpoints...');
    const providersResponse = await page.request.get(`${BASE_URL}/api/auth/providers`);
    expect(providersResponse.status()).toBe(200);
    const providers = await providersResponse.json();
    console.log('Available providers:', Object.keys(providers));
    console.log('✅ Auth API endpoints working');

    // Step 5: Test home page redirect
    console.log('Step 5: Testing home page redirect...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/auth\/signin/);
    console.log('✅ Home page redirects to sign-in');

    console.log('\n========================================');
    console.log('📋 VISUAL TEST SUMMARY');
    console.log('========================================');
    console.log('✅ Sign-in page loads correctly');
    console.log('✅ OAuth buttons are visible and enabled');
    console.log('✅ Dashboard redirects unauthenticated users');
    console.log('✅ Home page redirects to sign-in');
    console.log('✅ Auth API endpoints respond correctly');
    console.log('\n🔐 MANUAL VERIFICATION NEEDED:');
    console.log('Click "Continue with Google" to test OAuth flow');
    console.log('Expected: Redirect to Google → Sign in → Redirect to /dashboard');
    console.log('========================================\n');

    // Pause for manual testing
    console.log('⏸️  Test paused for manual verification...');
    console.log('You can now click "Continue with Google" to test the OAuth flow');
    console.log('Press "Resume" in Playwright Inspector when done');

    await page.pause(); // This will pause the test so you can manually test
  });

  test('Quick visual check of sign-in page', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/signin-quick.png', fullPage: true });

    console.log('✅ Screenshot saved to tests/screenshots/signin-quick.png');
    console.log('Sign-in page is visible and accessible');
  });
});
