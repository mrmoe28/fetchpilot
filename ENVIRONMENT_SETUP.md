# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Required Environment Variables for FetchPilot

# NextAuth Configuration (Required)
NEXTAUTH_SECRET="your-nextauth-secret-key-replace-with-random-string"
NEXTAUTH_URL="http://localhost:3000"

# LLM Provider Configuration (Choose one)
# Option 1: Anthropic Claude (Recommended)
# ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Option 2: Ollama (Local AI - Alternative)
LLM_PROVIDER="ollama"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.3"

# Database Configuration (Required for production)
DATABASE_URL="postgresql://username:password@localhost:5432/fetchpilot"

# Browserless.io Configuration (For Vercel Production Smart Search)
# Note: Uses new production endpoint wss://production-sfo.browserless.io
BROWSERLESS_TOKEN="your-browserless-io-token-here"

# Optional Browser Worker (For JavaScript-heavy sites)
# BROWSER_WORKER_URL="http://localhost:8787/openPage"

# Optional Google OAuth (For social login)
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Development Settings
NODE_ENV="development"
```

## Vercel Deployment

For Vercel deployment, add these environment variables in your Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add each variable for Production environment:

### Required for Vercel:
- `NEXTAUTH_SECRET` - Random string for session encryption
- `NEXTAUTH_URL` - Your Vercel app URL (e.g., `https://your-app.vercel.app`)
- `DATABASE_URL` - PostgreSQL connection string
- `BROWSERLESS_TOKEN` - Your Browserless.io token

### Optional for Vercel:
- `ANTHROPIC_API_KEY` - For Claude AI (if not using Ollama)
- `LLM_PROVIDER` - Set to "anthropic" for Claude, "ollama" for local
- `GOOGLE_CLIENT_ID` - For Google OAuth login
- `GOOGLE_CLIENT_SECRET` - For Google OAuth login

## Browserless.io Setup

1. Sign up at [browserless.io](https://www.browserless.io)
2. Get your API token from the dashboard
3. Add `BROWSERLESS_TOKEN` to your environment variables
4. Smart search will now work in production!

**Note**: The app uses the new production endpoint `wss://production-sfo.browserless.io` (not the legacy `chrome.browserless.io` endpoint).

## Database Setup

### Option 1: Neon (Recommended)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string to `DATABASE_URL`

### Option 2: Local PostgreSQL
1. Install PostgreSQL locally
2. Create database: `createdb fetchpilot`
3. Use: `postgresql://postgres:password@localhost:5432/fetchpilot`

## Testing

### Local Development
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
# Start development server
npm run dev
```

### Production Testing
1. Deploy to Vercel
2. Add environment variables in Vercel dashboard
3. Test smart search functionality
4. Check Vercel function logs for any errors

## Troubleshooting

### "BROWSERLESS_TOKEN not found" Error
- Make sure you added the environment variable to Vercel
- Check that it's set for the Production environment
- Verify your Browserless.io token is correct

### "WebSocket error: 403 Forbidden" Error
- This means you're using the old Browserless.io endpoint
- The app now uses `wss://production-sfo.browserless.io` (updated automatically)
- Make sure you're using the latest version of the code

### Database Connection Errors
- Verify your `DATABASE_URL` is correct
- Check that your database is accessible
- Run `npm run db:push` to create tables

### Authentication Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check that `NEXTAUTH_URL` matches your domain
- Verify OAuth credentials if using social login
