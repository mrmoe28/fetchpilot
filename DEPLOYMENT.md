# FetchPilot - Production Deployment Guide

## 🚀 Quick Deployment Status

**Project**: FetchPilot
**GitHub**: https://github.com/mrmoe28/fetchpilot
**Vercel**: Linked and ready to deploy
**Status**: Environment configuration required

---

## 📋 Pre-Deployment Checklist

### 1. NeonDB Database Setup (Required)

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to https://vercel.com/dashboard
2. Select the `fetchpilot` project
3. Navigate to **Storage** tab
4. Click **Create Database** → Select **Neon (Postgres)**
5. Follow the wizard to create a new database
6. Database URL will be automatically added to environment variables

**Option B: Manual NeonDB Setup**
1. Go to https://neon.tech
2. Create a new project named `fetchpilot`
3. Copy the connection string
4. Add to Vercel environment variables as `DATABASE_URL`

---

## 🔐 Environment Variables Setup

### Required Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Anthropic API (Required for scraping)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Database (Auto-added by Neon integration or manual)
DATABASE_URL=postgresql://user:pass@host/db

# NextAuth Configuration
NEXTAUTH_URL=https://fetchpilot.vercel.app  # Your production URL
NEXTAUTH_SECRET=hJlaU8t7XhYkTTuq5Ex3ZpL8FonQemp0XYJAHKv/Weo=

# Cron Job Secret
CRON_SECRET=QX41VMymkKEHzB2BzELyYEeT7RDJbIfx67Y3g2yo1aw=
```

### Optional Variables (for full features)

```bash
# Browser Worker (Optional - for JS-heavy sites)
BROWSER_WORKER_URL=https://your-worker-url.com/openPage
PLAYWRIGHT_ENABLED=false

# Google OAuth (Optional but recommended)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth (Optional but recommended)
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-secret
```

---

## 🔑 OAuth Provider Configuration

### Google OAuth Setup

1. **Google Cloud Console**: https://console.cloud.google.com
2. Create a new project or select existing
3. Enable Google+ API
4. **Credentials** → Create OAuth 2.0 Client ID
5. **Authorized JavaScript origins**:
   ```
   https://fetchpilot.vercel.app
   ```
6. **Authorized redirect URIs**:
   ```
   https://fetchpilot.vercel.app/api/auth/callback/google
   ```
7. Copy Client ID and Client Secret to Vercel env vars

### GitHub OAuth Setup

1. **GitHub Settings**: https://github.com/settings/developers
2. Click **New OAuth App**
3. **Application name**: FetchPilot
4. **Homepage URL**: `https://fetchpilot.vercel.app`
5. **Authorization callback URL**:
   ```
   https://fetchpilot.vercel.app/api/auth/callback/github
   ```
6. Copy Client ID and Client Secret to Vercel env vars

---

## 🗄️ Database Migration

After deployment, push the database schema:

```bash
# Pull environment variables locally
vercel env pull .env.local

# Push database schema to NeonDB
npm run db:push

# (Optional) Open Drizzle Studio to verify
npm run db:studio
```

---

## 🚀 Deployment Steps

### Automated Deployment (Recommended)

```bash
# Deploy to production
vercel --prod

# Follow prompts and confirm
```

### Manual Deployment via Dashboard

1. Go to https://vercel.com/dashboard
2. Select `fetchpilot` project
3. Click **Deployments** → **Deploy**
4. Or push to `main` branch (auto-deploys)

---

## ✅ Post-Deployment Verification

### 1. Check Deployment Status
```bash
vercel ls
```

### 2. Test Endpoints

**Homepage**:
```bash
curl https://fetchpilot.vercel.app
```

**API Health Check**:
```bash
curl https://fetchpilot.vercel.app/api/v1
```

**Test Scrape (requires auth)**:
```bash
curl -X POST https://fetchpilot.vercel.app/api/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","goal":"Extract product listings"}'
```

### 3. Test Authentication
1. Visit https://fetchpilot.vercel.app
2. Click sign in
3. Test Google/GitHub OAuth flow
4. Verify redirect to dashboard

### 4. Test Cron Jobs
- Cron jobs run automatically every 15 minutes
- Check logs in Vercel Dashboard → Deployments → Logs

---

## 🔧 Troubleshooting

### Issue: "DATABASE_URL not set"
**Solution**: Add NeonDB integration via Vercel Dashboard or manually set DATABASE_URL

### Issue: "NEXTAUTH_SECRET required"
**Solution**: Add NEXTAUTH_SECRET to environment variables (already generated above)

### Issue: OAuth redirect mismatch
**Solution**:
1. Verify production URL in NEXTAUTH_URL
2. Add exact callback URLs to OAuth provider settings
3. Ensure URLs match exactly (protocol, domain, path)

### Issue: Build fails
**Solution**:
```bash
# Test build locally
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Check ESLint
npm run lint
```

### Issue: Cron jobs not running
**Solution**:
1. Verify `vercel.json` exists with cron configuration
2. Check cron logs in Vercel Dashboard
3. Ensure CRON_SECRET is set

---

## 📊 Monitoring & Logs

### View Logs
```bash
vercel logs fetchpilot --prod
```

### Vercel Dashboard
- **Analytics**: Monitor page views, performance
- **Functions**: Check serverless function executions
- **Cron Jobs**: View scheduled job runs
- **Environment Variables**: Manage secrets

---

## 🔒 Security Best Practices

1. ✅ **Never commit** `.env.local` or secrets to Git
2. ✅ **Rotate secrets** periodically (NEXTAUTH_SECRET, CRON_SECRET)
3. ✅ **Use HTTPS** only (enforced by Vercel)
4. ✅ **Limit OAuth scopes** to minimum required
5. ✅ **Monitor API usage** to detect abuse
6. ✅ **Set rate limits** on scraping endpoints

---

## 🎯 Production Optimization

### Performance
- Enable Vercel Analytics
- Monitor Web Vitals
- Optimize images (already using next/image)
- Enable Vercel Edge Network

### Scaling
- Database: Upgrade Neon plan as needed
- Serverless: Vercel auto-scales functions
- Cron: Adjust frequency in vercel.json

### Cost Management
- Monitor Anthropic API usage
- Set Vercel function timeout limits
- Optimize database queries
- Cache frequently scraped URLs

---

## 📝 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| ANTHROPIC_API_KEY | ✅ Yes | Claude API key for LLM decisions | sk-ant-... |
| DATABASE_URL | ✅ Yes | NeonDB PostgreSQL connection | postgresql://... |
| NEXTAUTH_URL | ✅ Yes | Production URL | https://fetchpilot.vercel.app |
| NEXTAUTH_SECRET | ✅ Yes | NextAuth encryption secret | (generated) |
| CRON_SECRET | ✅ Yes | Cron endpoint protection | (generated) |
| GOOGLE_CLIENT_ID | ⚠️ Optional | Google OAuth client ID | ....apps.googleusercontent.com |
| GOOGLE_CLIENT_SECRET | ⚠️ Optional | Google OAuth secret | GOCSPX-... |
| GITHUB_ID | ⚠️ Optional | GitHub OAuth app ID | Iv1... |
| GITHUB_SECRET | ⚠️ Optional | GitHub OAuth secret | ... |
| BROWSER_WORKER_URL | ⚠️ Optional | Playwright worker endpoint | https://... |

---

## 🆘 Support & Resources

- **Documentation**: See CLAUDE.md and FEATURES.md
- **GitHub Issues**: https://github.com/mrmoe28/fetchpilot/issues
- **Vercel Docs**: https://vercel.com/docs
- **NeonDB Docs**: https://neon.tech/docs
- **NextAuth Docs**: https://next-auth.js.org

---

**Generated**: 2025-10-19
**Status**: Ready for Production Deployment 🚀
