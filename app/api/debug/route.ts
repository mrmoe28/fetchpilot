import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables (without exposing secrets)
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_preview: process.env.DATABASE_URL?.substring(0, 20) + '...',
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GITHUB_ID: !!process.env.GITHUB_ID,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL
    }
    
    return NextResponse.json({ 
      status: 'ok',
      environment: envCheck,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug check failed:', error)
    
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
