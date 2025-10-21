# Vercel Deployment Fix for Smart Search

## Quick Fix: Use Browserless.io (Recommended)

This is the easiest way to get smart search working on Vercel production.

### Step 1: Sign up for Browserless.io

1. Go to [browserless.io](https://www.browserless.io)
2. Sign up for a free account (includes 1,000 free requests/month)
3. Get your API token from the dashboard

### Step 2: Add Environment Variable to Vercel

1. Go to your Vercel dashboard
2. Select your FetchPilot project
3. Go to Settings → Environment Variables
4. Add a new variable:
   - **Name**: `BROWSERLESS_TOKEN`
   - **Value**: Your Browserless.io token
   - **Environment**: Production (and Preview if you want)

### Step 3: Redeploy

1. Push your changes to GitHub
2. Vercel will automatically redeploy
3. Smart search should now work in production!

## Alternative: Disable Smart Search in Production

If you don't want to use Browserless.io, you can disable the feature entirely:

### Option A: Environment-based disable

Add this to your Vercel environment variables:
- **Name**: `DISABLE_SMART_SEARCH`
- **Value**: `true`
- **Environment**: Production

### Option B: Code-based disable

The code already checks for Vercel production and shows a helpful error message. Users will see:

> "Smart search is not available in production on Vercel. Please test locally or deploy to a worker service."

## Cost Comparison

| Solution | Cost | Setup Time | Features |
|----------|------|------------|----------|
| Browserless.io | $0-50/month | 5 minutes | Full smart search |
| Disable feature | Free | 0 minutes | No smart search |
| Worker service | $5-20/month | 30+ minutes | Full smart search |

## Testing

### Local Development
```bash
npm run dev
# Smart search works with local Playwright
```

### Production Testing
1. Deploy to Vercel
2. Try the smart search feature
3. Check Vercel function logs for any errors

## Troubleshooting

### "BROWSERLESS_TOKEN not found" Error
- Make sure you added the environment variable to Vercel
- Check that it's set for the Production environment
- Redeploy after adding the variable

### "Connection failed" Error
- Verify your Browserless.io token is correct
- Check your Browserless.io account has remaining requests
- Try the connection test in Browserless.io dashboard

### Still getting Playwright errors?
- Make sure you're using the updated code
- Check that the environment variable is properly set
- Try redeploying from Vercel dashboard

## Next Steps

1. **Immediate**: Use Browserless.io for quick fix
2. **Long-term**: Consider setting up a dedicated worker service for better performance
3. **Monitoring**: Track smart search usage and costs

## Support

- Browserless.io docs: https://docs.browserless.io
- Vercel environment variables: https://vercel.com/docs/environment-variables
- This project's SMART_SEARCH_DEPLOYMENT.md for advanced options
