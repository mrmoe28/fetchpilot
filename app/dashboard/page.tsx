import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { scrapingJobs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { Card, CardContent } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, Loader } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'View your scraping job history and results',
}

async function getJobs(userId: string) {
  return await db.query.scrapingJobs.findMany({
    where: eq(scrapingJobs.userId, userId),
    orderBy: [desc(scrapingJobs.createdAt)],
    limit: 50,
  })
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { icon: typeof CheckCircle; className: string }> = {
    pending: { icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
    running: { icon: Loader, className: 'bg-blue-100 text-blue-800' },
    completed: { icon: CheckCircle, className: 'bg-green-100 text-green-800' },
    failed: { icon: XCircle, className: 'bg-red-100 text-red-800' },
  }

  const variant = variants[status] || variants.pending
  const Icon = variant.icon

  return (
    <Badge className={variant.className}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  )
}

async function JobsList({ userId }: { userId: string }) {
  const jobs = await getJobs(userId)

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No scraping jobs yet. Start your first job from the home page.</p>
        <Link href="/" className="text-fetchpilot-primary hover:underline mt-2 inline-block">
          Go to scraper
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="shadow-soft border-0 rounded-2xl hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={job.status} />
                  <span className="text-xs text-slate-500">
                    {job.createdAt.toLocaleString()}
                  </span>
                </div>
                <p className="font-medium text-fetchpilot-text truncate mb-1">
                  {job.url}
                </p>
                {job.goal && (
                  <p className="text-sm text-slate-600 mb-3">{job.goal}</p>
                )}
                <div className="flex gap-4 text-sm text-slate-600">
                  <span>Pages: {job.pagesProcessed || 0}</span>
                  <span>Products: {job.productsFound || 0}</span>
                  {job.completedAt && job.startedAt && (
                    <span>
                      Duration: {Math.round((job.completedAt.getTime() - job.startedAt.getTime()) / 1000)}s
                    </span>
                  )}
                </div>
                {job.error && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800 font-mono">{job.error}</p>
                  </div>
                )}
              </div>
              <Link
                href={`/dashboard/jobs/${job.id}`}
                className="px-4 py-2 bg-fetchpilot-primary text-white rounded-lg hover:bg-fetchpilot-accent transition-colors text-sm font-medium whitespace-nowrap"
              >
                View Details
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-fetchpilot-text">Dashboard</h1>
          <p className="text-slate-600 mt-1">View and manage your scraping jobs</p>
        </div>
        <Link
          href="/"
          className="px-6 py-3 bg-fetchpilot-primary text-white rounded-lg hover:bg-fetchpilot-accent transition-colors font-medium"
        >
          New Job
        </Link>
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading jobs...</div>}>
        <JobsList userId={session.user.id} />
      </Suspense>
    </div>
  )
}
