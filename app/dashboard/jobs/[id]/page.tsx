import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { scrapingJobs, scrapedProducts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { Card, CardContent } from '@/components/ui/card'
import ResultsTable from '@/components/results-table'
import LogView from '@/components/log-view'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ExportButtons from '@/components/export-buttons'

export const metadata: Metadata = {
  title: 'Job Details',
}

async function getJobWithProducts(jobId: string, userId: string) {
  const job = await db.query.scrapingJobs.findFirst({
    where: and(
      eq(scrapingJobs.id, jobId),
      eq(scrapingJobs.userId, userId)
    ),
  })

  if (!job) return null

  const products = await db.query.scrapedProducts.findMany({
    where: eq(scrapedProducts.jobId, jobId),
  })

  return { job, products }
}

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const data = await getJobWithProducts(id, session.user.id)

  if (!data) {
    notFound()
  }

  const { job, products } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-fetchpilot-text">Job Details</h1>
            <p className="text-sm text-slate-600">{job.id}</p>
          </div>
        </div>
        {products.length > 0 && <ExportButtons jobId={id} />}
      </div>

      <Card className="shadow-soft border-0 rounded-2xl">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-fetchpilot-text mb-3">Job Information</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">URL</dt>
                  <dd className="font-medium break-all">{job.url}</dd>
                </div>
                {job.goal && (
                  <div>
                    <dt className="text-slate-500">Goal</dt>
                    <dd className="font-medium">{job.goal}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-medium capitalize">{job.status}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="font-semibold text-fetchpilot-text mb-3">Statistics</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">Pages Processed</dt>
                  <dd className="font-medium">{job.pagesProcessed || 0}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Products Found</dt>
                  <dd className="font-medium">{job.productsFound || 0}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Created</dt>
                  <dd className="font-medium">{job.createdAt.toLocaleString()}</dd>
                </div>
                {job.completedAt && (
                  <div>
                    <dt className="text-slate-500">Completed</dt>
                    <dd className="font-medium">{job.completedAt.toLocaleString()}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-soft border-0 rounded-2xl">
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-fetchpilot-text">
                Products ({products.length})
              </h3>
            </div>
            <ResultsTable rows={products} />
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0 rounded-2xl">
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-fetchpilot-text">Logs</h3>
            </div>
            <LogView logs={job.logs || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
