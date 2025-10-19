# Google OAuth Redirect URI Mismatch - EXACT FIX

## The Problem
Google is rejecting this redirect URI: `https://fetchpilot.vercel.app/api/auth/callback/google`

## The Solution (DO EXACTLY THIS)

### 1. Go to Google Cloud Console
- Open: https://console.cloud.google.com/
- Navigate to: **APIs & Services** → **Credentials**

### 2. Find Your OAuth Client
Look for the OAuth 2.0 Client ID that matches your GOOGLE_CLIENT_ID (check .env.production file)

### 3. Edit the OAuth Client
- Click **Edit** (pencil icon) on your OAuth client
- Scroll to **Authorized redirect URIs** section

### 4. Add These EXACT URLs

**A) Authorized JavaScript origins:**
```
https://fetchpilot.vercel.app
```

**B) Authorized redirect URIs:**
```
https://fetchpilot.vercel.app/api/auth/callback/google
```

**CRITICAL**: 
- JavaScript origins: NO trailing slash, NO path, just the domain
- Redirect URIs: EXACT path to `/api/auth/callback/google`
- Both must be HTTPS, no www subdomain

### 5. Save Changes
- Click **Save** 
- Wait 1-2 minutes for changes to propagate

### 6. Test Again
- Visit: https://fetchpilot.vercel.app/auth/signin
- Click "Continue with Google"
- Should work without redirect_uri_mismatch error

## Common Mistakes That Cause This Error
- ❌ `http://fetchpilot.vercel.app/api/auth/callback/google` (HTTP instead of HTTPS)
- ❌ `https://fetchpilot.vercel.app/api/auth/callback/google/` (trailing slash)
- ❌ `https://www.fetchpilot.vercel.app/api/auth/callback/google` (www subdomain)
- ❌ Wrong Google Client ID (multiple OAuth apps in same project)

## Verification
After adding, your Authorized redirect URIs should show:
✅ `https://fetchpilot.vercel.app/api/auth/callback/google`
