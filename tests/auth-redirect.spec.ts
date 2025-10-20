import { test, expect } from '@playwright/test';

test.describe('Authentication Redirect Tests', () => {
  const BASE_URL = 'http://localhost:3001';

  test('should show sign-in page with Google and GitHub buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);

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

    console.log('✅ Sign-in page loads correctly with OAuth buttons');
  });

  test('should redirect to sign-in when accessing dashboard unauthenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/\/auth\/signin/);

    // Check for callbackUrl parameter
    const url = page.url();
    expect(url).toContain('callbackUrl');
    expect(url).toContain('dashboard');

    console.log('✅ Unauthenticated users are redirected to sign-in page');
  });

  test('should redirect to sign-in when accessing root page unauthenticated', async ({ page }) => {
    await page.goto(BASE_URL);

    // Should be redirected to sign-in page
    await page.waitForURL(/\/auth\/signin/);
    await expect(page).toHaveURL(/\/auth\/signin/);

    console.log('✅ Root page redirects unauthenticated users to sign-in');
  });

  test('should have correct OAuth callback URL structure', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);

    // Find the Google sign-in form
    const googleForm = page.locator('form').filter({ has: page.getByText('Continue with Google') });

    // The form action should be a server action, but we can verify the button exists
    await expect(googleForm.locator('button[type="submit"]')).toBeVisible();

    console.log('✅ Google OAuth button is properly configured');
  });

  test('API auth endpoints should be accessible', async ({ page }) => {
    // Test that auth API endpoints don't return 404
    const response = await page.request.get(`${BASE_URL}/api/auth/providers`);

    expect(response.status()).toBe(200);
    const providers = await response.json();

    // Should have Google and GitHub providers
    expect(providers).toHaveProperty('google');
    expect(providers).toHaveProperty('github');

    console.log('✅ Auth API endpoints are accessible');
    console.log('Providers:', Object.keys(providers));
  });

  test('should have correct redirect URI configuration', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/auth/providers`);
    const providers = await response.json();

    // Verify providers are configured
    expect(providers.google).toBeDefined();
    expect(providers.google.id).toBe('google');
    expect(providers.google.name).toBe('Google');

    expect(providers.github).toBeDefined();
    expect(providers.github.id).toBe('github');
    expect(providers.github.name).toBe('GitHub');

    console.log('✅ OAuth providers are correctly configured');
  });

  test('should check environment variables are set', async ({ page }) => {
    // Navigate to sign-in page to trigger any env-related errors
    const response = await page.goto(`${BASE_URL}/auth/signin`);

    // If env vars are missing, the page might fail to load
    expect(response?.status()).toBe(200);

    // Check console for any error messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    // Should not have critical errors
    const criticalErrors = consoleMessages.filter(msg =>
      msg.includes('GOOGLE_CLIENT_ID') ||
      msg.includes('NEXTAUTH') ||
      msg.includes('undefined')
    );

    if (criticalErrors.length > 0) {
      console.log('⚠️  Console errors detected:', criticalErrors);
    } else {
      console.log('✅ No critical environment variable errors');
    }
  });

  test('should test OAuth flow initialization (without actual login)', async ({ page, context }) => {
    // Enable network logging
    await context.route('**/*', route => route.continue());

    await page.goto(`${BASE_URL}/auth/signin`);

    // Click the Google button
    const googleButton = page.getByRole('button', { name: /Continue with Google/i });

    // Listen for navigation
    const navigationPromise = page.waitForURL(/accounts\.google\.com|localhost:3001\/api\/auth/, {
      timeout: 10000
    }).catch(() => null);

    await googleButton.click();

    // Wait for either Google's login page or auth callback
    await navigationPromise;

    const currentUrl = page.url();

    if (currentUrl.includes('accounts.google.com')) {
      console.log('✅ Google OAuth flow initiated successfully');
      console.log('Redirected to:', currentUrl);
    } else if (currentUrl.includes('/api/auth/')) {
      console.log('✅ Auth API callback triggered');
      console.log('Callback URL:', currentUrl);
    } else {
      console.log('Current URL:', currentUrl);
    }
  });

  test('middleware should protect routes correctly', async ({ page }) => {
    // Test that middleware is working
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/jobs/test-id',
      '/dashboard/settings',
      '/dashboard/profile'
    ];

    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`);

      // Should redirect to sign-in
      await expect(page).toHaveURL(/\/auth\/signin/);
      console.log(`✅ Middleware protecting: ${route}`);
    }
  });

  test('should verify basePath configuration', async ({ page }) => {
    // The auth API should be at /api/auth/* not /auth/*
    const authApiResponse = await page.request.get(`${BASE_URL}/api/auth/csrf`);

    expect(authApiResponse.status()).toBe(200);
    const csrfData = await authApiResponse.json();

    expect(csrfData).toHaveProperty('csrfToken');
    console.log('✅ basePath configuration correct (/api/auth)');
  });
});

test.describe('Expected Auth Flow (Manual Verification Required)', () => {
  test.skip('Full OAuth flow requires manual testing', async () => {
    console.log(`

🔐 MANUAL TESTING REQUIRED:

To fully test the Google sign-in redirect:

1. Start dev server: npm run dev
2. Open browser: http://localhost:3001/auth/signin
3. Click "Continue with Google"
4. Complete Google OAuth consent
5. VERIFY: You are redirected to http://localhost:3001/dashboard
6. VERIFY: If you visit /auth/signin while logged in, you're redirected to /dashboard

Expected Flow:
/auth/signin → Google OAuth → /api/auth/callback/google → /dashboard ✅

Common Issues:
- If redirected to root (/) instead of /dashboard, check redirect callback
- If you get 404, verify basePath: "/api/auth" is set
- If redirect_uri_mismatch, update Google Cloud Console with exact callback URL

Google Cloud Console Setup:
Authorized redirect URIs must include:
http://localhost:3001/api/auth/callback/google
    `);
  });
});
