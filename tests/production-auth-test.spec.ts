import { test, expect } from '@playwright/test';

test.describe('Production Authentication Tests - fetchpilot.vercel.app', () => {
  const PROD_URL = 'https://fetchpilot.vercel.app';

  test('should show sign-in page on production', async ({ page }) => {
    console.log('🚀 Testing production URL:', PROD_URL);
    
    await page.goto(`${PROD_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');

    // Check that we're on the sign-in page
    await expect(page).toHaveURL(/\/auth\/signin/);

    // Check for welcome message
    await expect(page.getByText('Welcome to FetchPilot')).toBeVisible();

    // Check for Google sign-in button
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    await expect(googleButton).toBeVisible();

    // Check for GitHub sign-in button
    const githubButton = page.getByRole('button', { name: /Continue with GitHub/i });
    await expect(githubButton).toBeVisible();

    console.log('✅ Production sign-in page loads correctly with OAuth buttons');
  });

  test('should redirect to sign-in when accessing dashboard unauthenticated on production', async ({ page }) => {
    await page.goto(`${PROD_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/\/auth\/signin/);

    // Check for callbackUrl parameter
    const url = page.url();
    expect(url).toContain('callbackUrl');
    expect(url).toContain('dashboard');

    console.log('✅ Production dashboard redirects unauthenticated users correctly');
  });

  test('should redirect to sign-in when accessing root page unauthenticated on production', async ({ page }) => {
    console.log('Testing root page redirect on production...');
    
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle');

    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/\/auth\/signin/);

    console.log('✅ Production root page redirects unauthenticated users to sign-in');
  });

  test('should have working auth API endpoints on production', async ({ page }) => {
    // Test that auth API endpoints work
    const response = await page.request.get(`${PROD_URL}/api/auth/providers`);

    expect(response.status()).toBe(200);
    const providers = await response.json();

    // Should have Google and GitHub providers
    expect(providers).toHaveProperty('google');
    expect(providers).toHaveProperty('github');

    console.log('✅ Production auth API endpoints are accessible');
    console.log('Available providers:', Object.keys(providers));
  });

  test('should check production OAuth configuration', async ({ page }) => {
    const response = await page.request.get(`${PROD_URL}/api/auth/providers`);
    const providers = await response.json();

    // Verify providers are configured
    expect(providers.google).toBeDefined();
    expect(providers.google.id).toBe('google');
    expect(providers.google.name).toBe('Google');

    expect(providers.github).toBeDefined();
    expect(providers.github.id).toBe('github');
    expect(providers.github.name).toBe('GitHub');

    console.log('✅ Production OAuth providers are correctly configured');
  });

  test('should test landing page accessibility', async ({ page }) => {
    await page.goto(`${PROD_URL}/landing`);
    await page.waitForLoadState('networkidle');

    // Landing page should load without redirect
    await expect(page).toHaveURL(/\/landing/);
    console.log('✅ Production landing page is accessible');
  });

  test('should verify middleware protection on production', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/settings', 
      '/dashboard/profile',
      '/dashboard/metrics'
    ];

    for (const route of protectedRoutes) {
      console.log(`Testing protection for: ${route}`);
      await page.goto(`${PROD_URL}${route}`);
      await page.waitForLoadState('networkidle');

      // Should redirect to sign-in
      await expect(page).toHaveURL(/\/auth\/signin/);
      console.log(`✅ Production middleware protecting: ${route}`);
    }
  });

  test('visual production sign-in page test', async ({ page }) => {
    await page.goto(`${PROD_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of production sign-in page
    await page.screenshot({ 
      path: 'tests/screenshots/production-signin.png', 
      fullPage: true 
    });

    // Verify key elements
    await expect(page.getByText('Welcome to FetchPilot')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with GitHub/i })).toBeVisible();

    console.log('✅ Production sign-in page screenshot saved');
    console.log('✅ All sign-in elements are visible on production');
  });

  test('should check what happens when clicking Google OAuth on production', async ({ page }) => {
    await page.goto(`${PROD_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');

    // Click the Google button
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });
    
    // Listen for navigation
    const navigationPromise = page.waitForURL(/accounts\.google\.com|fetchpilot\.vercel\.app\/api\/auth/, {
      timeout: 15000
    }).catch(() => null);

    await googleButton.click();

    // Wait for either Google's login page or auth callback
    await navigationPromise;

    const currentUrl = page.url();

    if (currentUrl.includes('accounts.google.com')) {
      console.log('✅ Production Google OAuth flow initiated successfully');
      console.log('Redirected to:', currentUrl);
    } else if (currentUrl.includes('/api/auth/')) {
      console.log('✅ Production auth API callback triggered');
      console.log('Callback URL:', currentUrl);
    } else {
      console.log('Production OAuth result - Current URL:', currentUrl);
    }
  });
});

test.describe('Production Manual Testing Instructions', () => {
  test.skip('Full production OAuth flow verification', async () => {
    console.log(`
🌐 PRODUCTION TESTING INSTRUCTIONS:

To fully test the Google sign-in redirect on production:

1. Visit: https://fetchpilot.vercel.app/auth/signin
2. Click "Continue with Google"  
3. Complete Google OAuth consent
4. VERIFY: You are redirected to https://fetchpilot.vercel.app/dashboard
5. VERIFY: If you visit /auth/signin while logged in, you're redirected to /dashboard

Expected Production Flow:
/auth/signin → Google OAuth → /api/auth/callback/google → /dashboard ✅

Production-Specific Checks:
✅ HTTPS URLs are used throughout
✅ Google OAuth redirect URI matches: https://fetchpilot.vercel.app/api/auth/callback/google
✅ Environment variables are set in Vercel dashboard
✅ Domain is authorized in Google Cloud Console

Google Cloud Console Production Setup:
Authorized JavaScript origins: https://fetchpilot.vercel.app
Authorized redirect URIs: https://fetchpilot.vercel.app/api/auth/callback/google
    `);
  });
});
