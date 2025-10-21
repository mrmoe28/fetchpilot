# Smart Search Production Deployment Guide

## Overview

The Smart Browser Search feature uses Playwright to automate web browsing and search multiple sources for product pages. This requires special configuration for production deployment.

## Local Development

### Installation

Browsers are automatically installed via the `postinstall` script:

```bash
npm install
```

This will install the Chromium browser required for Playwright.

### Manual Installation

If needed, you can manually install browsers:

```bash
npx playwright install chromium
```

## Production Deployment on Vercel

⚠️ **Important**: Playwright with Chromium does **NOT** work well on Vercel serverless functions due to:

1. **Size Limits**: Chromium browser is ~300MB, exceeds Vercel's 50MB limit
2. **Memory Constraints**: Browser automation requires more memory than serverless allows
3. **Cold Starts**: Launching a browser adds significant latency

### Recommended Production Solutions

#### Option 1: Separate Worker Service (Recommended)

Deploy the smart search functionality as a separate long-running service:

1. **Deploy search worker** to a platform that supports long-running processes:
   - Railway.app
   - Render.com
   - AWS EC2/ECS
   - DigitalOcean App Platform

2. **Architecture**:
   ```
   Vercel (API) → Queue (Redis/BullMQ) → Worker Service (Playwright)
                                          ↓
                                      Database (NeonDB)
   ```

3. **Implementation**:
   - Vercel API creates search jobs in queue
   - Worker service processes jobs with Playwright
   - Results stored in database
   - Frontend polls for results

#### Option 2: Browserless.io (Easiest)

Use a managed browser automation service:

1. Sign up at [browserless.io](https://www.browserless.io)
2. Get API token
3. Update `lib/smart-search/orchestrator.ts`:

```typescript
import { chromium } from 'playwright-core'

// Connect to browserless instead of local chromium
const browser = await chromium.connect({
  wsEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`
})
```

4. Add to `.env.local`:
```
BROWSERLESS_TOKEN=your_token_here
```

**Pros**: Easy setup, managed infrastructure
**Cons**: Additional cost (~$50/month for production)

#### Option 3: Puppeteer with Chrome AWS Lambda

Use a lighter browser setup optimized for serverless:

1. Install packages:
```bash
npm install puppeteer-core chrome-aws-lambda
```

2. Replace Playwright with Puppeteer in orchestrator
3. Use `chrome-aws-lambda` for browser binary

**Pros**: Works on Vercel with some limitations
**Cons**: Still has memory/timeout constraints, code changes needed

#### Option 4: Disable in Production (Temporary)

If you need to deploy now, disable the feature in production:

```typescript
// lib/smart-search/orchestrator.ts
if (process.env.VERCEL_ENV === 'production') {
  throw new Error('Smart search not available in production. Use local development or configure a worker service.')
}
```

## Environment Variables

Add to Vercel environment variables:

```env
# For browserless.io
BROWSERLESS_TOKEN=your_token_here

# Or for worker service
SMART_SEARCH_WORKER_URL=https://your-worker.railway.app
```

## Testing

### Local Testing

```bash
# Start dev server
npm run dev

# In another terminal, ensure browsers are installed
npx playwright install chromium

# Test the search feature at http://localhost:3000
```

### Production Testing

1. Deploy to Vercel
2. Check deployment logs for any browser-related errors
3. Test search feature on production URL
4. If errors occur, implement one of the solutions above

## Monitoring

Monitor these metrics for smart search:

- Search completion rate
- Average search duration
- Browser memory usage
- Failed searches (track errors in database)

## Troubleshooting

### "Executable doesn't exist" Error

**Cause**: Playwright browsers not installed

**Solution**:
```bash
npx playwright install chromium
```

### "Function Payload Size Exceeded" on Vercel

**Cause**: Chromium too large for serverless

**Solution**: Use Option 1 (Worker Service) or Option 2 (Browserless.io)

### Search Timeouts

**Cause**: Browser automation is slow, hits Vercel's 10s timeout

**Solution**:
- Increase timeout in `vercel.json`
- Or move to worker service for long-running processes

## Cost Considerations

| Solution | Monthly Cost | Complexity | Performance |
|----------|--------------|------------|-------------|
| Worker Service (Railway) | $5-20 | Medium | Excellent |
| Browserless.io | $50+ | Low | Good |
| Puppeteer + Lambda | $0 (included) | High | Limited |
| Local Only | $0 | Low | N/A |

## Recommended Setup

For production, we recommend:

1. **Start**: Use browserless.io for quick setup
2. **Scale**: Move to Railway/Render worker service
3. **Optimize**: Fine-tune worker performance and costs

## Support

For issues or questions:
- Check Playwright docs: https://playwright.dev
- Review Vercel limits: https://vercel.com/docs/limits
- Open GitHub issue in this repo
