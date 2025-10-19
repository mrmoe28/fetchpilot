# OAuth Configuration Fix

## The Problem
You're getting "Error 400: redirect_uri_mismatch" because:
1. Missing environment variables for NextAuth
2. Google OAuth redirect URI not properly configured

## Step 1: Create `.env.local` file
Create a file named `.env.local` in the project root with these contents:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=hJlaU8t7XhYkTTuq5Ex3ZpL8FonQemp0XYJAHKv/Weo=

# Google OAuth (replace with your actual credentials)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Database
DATABASE_URL=file:./dev.db
```

## Step 2: Configure Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Enable the Google+ API or Google Identity Services
4. Go to "Credentials" → "OAuth 2.0 Client IDs"
5. Edit your OAuth client or create a new one
6. Add this **exact** redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Copy the Client ID and Client Secret to your `.env.local` file

## Step 3: Restart the Development Server
After creating the `.env.local` file, restart your Next.js server:
```bash
npm run dev
```

## Quick Test
Run this command to verify your redirect URI:
```bash
echo "Your redirect URI should be: http://localhost:3000/api/auth/callback/google"
```

## Notes
- The redirect URI must match exactly (including the port number)
- Make sure you're using the correct Google Cloud project
- Environment variables are loaded when the server starts, so restart after changes
