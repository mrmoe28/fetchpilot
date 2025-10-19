import { NextRequest, NextResponse } from 'next/server'
import { runScheduledScrapes } from '@/lib/cron/scheduler'

export const runtime = 'nodejs'
export const preferredRegion = 'home'

// This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions, etc.)
// Protect it with a secret token
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET || 'your-secret-token'

  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runScheduledScrapes()
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
