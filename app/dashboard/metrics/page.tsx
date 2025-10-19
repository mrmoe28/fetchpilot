import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getRecentScrapeRuns, buildOverview, bucketRunsByDay } from '@/lib/metrics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatDuration(durationMs?: number) {
  if (!durationMs || durationMs <= 0) return '—'
  if (durationMs < 1000) return `${durationMs} ms`
  const seconds = durationMs / 1000
  if (seconds < 60) return `${seconds.toFixed(1)} s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

export default async function MetricsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const runs = await getRecentScrapeRuns(session.user.id, 60)
  const overview = buildOverview(runs)
  const dailyBuckets = bucketRunsByDay(runs).slice(-14) // last 14 days

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-fetchpilot-text">Scrape Insights</h1>
        <p className="text-slate-600 mt-1">Track run volume, product yields, and failure patterns</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Total Runs</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-fetchpilot-text">{overview.totalRuns}</p>
            <p className="text-sm text-slate-500 mt-1">Across the last {runs.length} tracked runs</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Total Products</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-fetchpilot-text">{overview.totalProducts}</p>
            <p className="text-sm text-slate-500 mt-1">
              Avg {overview.averageProductsPerRun} products per run
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-fetchpilot-text">
              {overview.successRate}%
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {overview.successRuns} runs met minimum extraction
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Avg Duration</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold text-fetchpilot-text">
              {formatDuration(overview.averageDurationMs)}
            </p>
            <p className="text-sm text-slate-500 mt-1">Based on recorded run telemetry</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle>14 Day Product Yield</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {dailyBuckets.length === 0 ? (
              <p className="text-slate-500 text-sm">No scrape runs recorded yet.</p>
            ) : (
              <div className="flex items-end gap-3 h-48">
                {dailyBuckets.map((bucket) => {
                  const height = bucket.totalProducts === 0 ? 4 : Math.min(160, bucket.totalProducts * 6)
                  return (
                    <div key={bucket.label} className="flex flex-col items-center gap-2 text-xs text-slate-500">
                      <div
                        className="w-8 rounded-md bg-gradient-to-t from-fetchpilot-primary/30 to-fetchpilot-primary"
                        style={{ height }}
                        aria-label={`${bucket.label} produced ${bucket.totalProducts} products`}
                      />
                      <span className="font-medium text-fetchpilot-text">{bucket.totalProducts}</span>
                      <span className="rotate-45 origin-bottom-left whitespace-nowrap">{bucket.label.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Failure Buckets</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {Object.entries(overview.failureBuckets).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium text-fetchpilot-text">{value}</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-fetchpilot-primary/70"
                    style={{ width: overview.totalRuns ? `${Math.min(100, (value / overview.totalRuns) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {runs.length === 0 ? (
            <p className="text-slate-500 text-sm">Start a scrape to capture metrics.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Started</th>
                    <th className="py-3 pr-4 font-medium">Products</th>
                    <th className="py-3 pr-4 font-medium">Duration</th>
                    <th className="py-3 pr-4 font-medium">Pages</th>
                    <th className="py-3 pr-4 font-medium">Stop reason</th>
                    <th className="py-3 pr-4 font-medium">Goal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {runs.slice(0, 20).map((run) => (
                    <tr key={run.runId} className="hover:bg-slate-50/80">
                      <td className="py-3 pr-4 text-slate-700">
                        {run.startedAt.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 font-medium text-fetchpilot-text">
                        {run.totalProducts}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {formatDuration(run.durationMs)}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {run.pagesProcessed ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-slate-600 capitalize">
                        {run.stopReason?.replace(/_/g, ' ') || '—'}
                      </td>
                      <td className="py-3 pr-4 text-slate-600 max-w-xs truncate">
                        {run.goal || run.startUrl}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
