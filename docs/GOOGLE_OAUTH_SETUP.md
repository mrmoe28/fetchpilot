# Google OAuth Setup Guide

## Critical 404 Fix Applied

The Google sign-in 404 error has been fixed by adding the following to auth configuration:

1. **Added `basePath: "/api/auth"`** - Required for NextAuth v5
2. **Added `trustHost: true`** - Allows flexible host configuration
3. **Added Google authorization params** - Ensures proper OAuth flow

## Required Google Cloud Console Configuration

### For Local Development (http://localhost:3000)

In your Google Cloud Console OAuth 2.0 Client:

**Authorized JavaScript origins:**
```
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
```

### For Production (https://yourdomain.com)

**Authorized JavaScript origins:**
```
https://yourdomain.com
```

**Authorized redirect URIs:**
```
https://yourdomain.com/api/auth/callback/google
```

## Common Issues & Solutions

### Issue 1: 404 on Callback
**Cause:** Missing `basePath` in auth config
**Solution:** Already fixed - `basePath: "/api/auth"` added

### Issue 2: Redirect URI Mismatch
**Cause:** Google Console doesn't have exact redirect URI
**Solution:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client
3. Add EXACT redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Save and wait 5 minutes for changes to propagate

### Issue 3: "Error 400: redirect_uri_mismatch"
**Cause:**
- Protocol mismatch (http vs https)
- Port mismatch
- Trailing slash difference
- Domain case sensitivity

**Solution:** Redirect URI must match EXACTLY:
- ✅ `http://localhost:3000/api/auth/callback/google`
- ❌ `http://localhost:3000/api/auth/callback/google/`
- ❌ `https://localhost:3000/api/auth/callback/google`
- ❌ `http://localhost/api/auth/callback/google`

### Issue 4: Database Session Errors
**Cause:** Missing or incorrect database tables
**Solution:** Run database migration:
```bash
npx drizzle-kit push
```

## Testing the Fix

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to sign-in page:**
   ```
   http://localhost:3000/auth/signin
   ```

3. **Click "Continue with Google"**
   - Should redirect to Google OAuth consent screen
   - After consent, should redirect back to `/dashboard`

4. **Check for errors:**
   - Open browser DevTools (F12)
   - Check Console for errors
   - Check Network tab for failed requests

## Environment Variables Checklist

Required in `.env.local`:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000  # Change for production
NEXTAUTH_SECRET=your-secret-here     # Generate with: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here

# Database
DATABASE_URL=postgresql://...
```

## Production Deployment Checklist

Before deploying to production (Vercel):

1. **Update Environment Variables:**
   - `NEXTAUTH_URL=https://yourdomain.com`
   - Keep same `NEXTAUTH_SECRET`
   - Keep same Google credentials (or create new ones)

2. **Update Google Cloud Console:**
   - Add production URLs to Authorized JavaScript origins
   - Add production callback URL to Authorized redirect URIs

3. **Run Database Migrations:**
   ```bash
   npx drizzle-kit push
   ```

4. **Test on Production:**
   - Clear browser cache
   - Test sign-in flow
   - Verify session persistence

## Additional Notes

### NextAuth v5 Beta Changes
- `basePath` is now required when not using default `/api/auth`
- `trustHost` recommended for flexible deployments
- Database session strategy requires proper adapter setup

### Database Schema Requirements
- `users` table with UUID primary key
- `accounts` table for OAuth providers
- `sessions` table for session management
- `verification_tokens` table with composite primary key

### Security Best Practices
- Never commit `.env.local` to git
- Rotate secrets regularly
- Use strong `NEXTAUTH_SECRET` (min 32 characters)
- Enable 2FA on Google Cloud Console
- Restrict OAuth scopes to minimum required
