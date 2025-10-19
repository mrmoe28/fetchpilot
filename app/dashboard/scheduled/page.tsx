import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { scheduledScrapes } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { Card, CardContent } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import { Clock, Calendar } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scheduled Scrapes',
  description: 'Manage your recurring scraping jobs',
}

async function getScheduledScrapes(userId: string) {
  return await db.query.scheduledScrapes.findMany({
    where: eq(scheduledScrapes.userId, userId),
    orderBy: [desc(scheduledScrapes.createdAt)],
  })
}

async function ScheduledScrapesList({ userId }: { userId: string }) {
  const scrapes = await getScheduledScrapes(userId)

  if (scrapes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No scheduled scrapes yet. Create your first one below.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {scrapes.map((scrape) => (
        <Card key={scrape.id} className="shadow-soft border-0 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-fetchpilot-text">{scrape.name}</h3>
                  <Badge className={scrape.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {scrape.enabled ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3 truncate">{scrape.url}</p>
                <div className="flex gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {scrape.schedule}
                  </span>
                  {scrape.nextRunAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Next: {scrape.nextRunAt.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/dashboard/scheduled/${scrape.id}`}
                className="px-4 py-2 bg-fetchpilot-primary text-white rounded-lg hover:bg-fetchpilot-accent transition-colors text-sm font-medium"
              >
                Edit
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function ScheduledScrapesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-fetchpilot-text">Scheduled Scrapes</h1>
          <p className="text-slate-600 mt-1">Automate recurring scraping jobs</p>
        </div>
        <Link
          href="/dashboard/scheduled/new"
          className="px-6 py-3 bg-fetchpilot-primary text-white rounded-lg hover:bg-fetchpilot-accent transition-colors font-medium"
        >
          New Schedule
        </Link>
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading schedules...</div>}>
        <ScheduledScrapesList userId={session.user.id} />
      </Suspense>
    </div>
  )
}
