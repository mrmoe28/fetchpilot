import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { scrapingJobs, scrapedProducts, categories } from '@/lib/db/schema'
import { eq, desc, count, and, sql } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader, 
  TrendingUp, 
  Package, 
  Activity,
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  Star,
  Tag
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'View your scraping job history and results',
}

// Enhanced data fetching functions
async function getDashboardStats(userId: string) {
  // Get basic job counts
  const [totalJobsResult] = await db
    .select({ count: count() })
    .from(scrapingJobs)
    .where(eq(scrapingJobs.userId, userId))

  const [completedJobsResult] = await db
    .select({ count: count() })
    .from(scrapingJobs)
    .where(and(
      eq(scrapingJobs.userId, userId),
      eq(scrapingJobs.status, 'completed')
    ))

  const [totalProductsResult] = await db
    .select({ count: count() })
    .from(scrapedProducts)
    .innerJoin(scrapingJobs, eq(scrapedProducts.jobId, scrapingJobs.id))
    .where(eq(scrapingJobs.userId, userId))

  const [categoriesResult] = await db
    .select({ count: count() })
    .from(categories)
    .where(eq(categories.userId, userId))

  return {
    totalJobs: totalJobsResult?.count || 0,
    completedJobs: completedJobsResult?.count || 0,
    totalProducts: totalProductsResult?.count || 0,
    totalCategories: categoriesResult?.count || 0,
    successRate: totalJobsResult?.count ? Math.round((completedJobsResult?.count || 0) / totalJobsResult.count * 100) : 0
  }
}

async function getRecentJobs(userId: string, limit = 10) {
  return await db.query.scrapingJobs.findMany({
    where: eq(scrapingJobs.userId, userId),
    orderBy: [desc(scrapingJobs.createdAt)],
    limit,
    with: {
      category: true,
      products: {
        limit: 1,
        orderBy: [desc(scrapedProducts.createdAt)]
      }
    }
  })
}

async function getRecentProducts(userId: string, limit = 12) {
  return await db
    .select({
      id: scrapedProducts.id,
      title: scrapedProducts.title,
      price: scrapedProducts.price,
      image: scrapedProducts.image,
      url: scrapedProducts.url,
      brand: scrapedProducts.brand,
      rating: scrapedProducts.rating,
      createdAt: scrapedProducts.createdAt,
      jobId: scrapedProducts.jobId,
      categoryName: categories.name,
      categoryColor: categories.color,
      jobUrl: scrapingJobs.url
    })
    .from(scrapedProducts)
    .innerJoin(scrapingJobs, eq(scrapedProducts.jobId, scrapingJobs.id))
    .leftJoin(categories, eq(scrapedProducts.categoryId, categories.id))
    .where(eq(scrapingJobs.userId, userId))
    .orderBy(desc(scrapedProducts.createdAt))
    .limit(limit)
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

// Activity Overview Component
function ActivityOverview({ stats }: { stats: Awaited<ReturnType<typeof getDashboardStats>> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="shadow-soft border-0 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Jobs</p>
              <p className="text-3xl font-bold text-fetchpilot-text">{stats.totalJobs}</p>
              <p className="text-xs text-slate-500 mt-1">All time</p>
            </div>
            <Activity className="h-8 w-8 text-fetchpilot-primary/30" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-0 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Products Found</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalProducts}</p>
              <p className="text-xs text-slate-500 mt-1">Successfully scraped</p>
            </div>
            <Package className="h-8 w-8 text-green-500/30" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-0 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Success Rate</p>
              <p className="text-3xl font-bold text-blue-600">{stats.successRate}%</p>
              <p className="text-xs text-slate-500 mt-1">Completion rate</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500/30" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-0 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Categories</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalCategories}</p>
              <p className="text-xs text-slate-500 mt-1">Auto-created</p>
            </div>
            <Tag className="h-8 w-8 text-purple-500/30" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Recent Products Component
function RecentProducts({ products }: { products: Awaited<ReturnType<typeof getRecentProducts>> }) {
  if (products.length === 0) {
    return (
      <Card className="shadow-soft border-0 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recent Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ImageIcon className="mx-auto h-12 w-12 text-slate-300" />
            <p className="text-slate-500 mt-2">No products scraped yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-soft border-0 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Recent Products
        </CardTitle>
        <Link 
          href="/dashboard/categories" 
          className="text-sm text-fetchpilot-primary hover:underline flex items-center gap-1"
        >
          View all <ExternalLink className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <Link href={product.url} target="_blank" className="block space-y-3">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  {product.categoryName && (
                    <div className="absolute top-2 left-2">
                      <Badge 
                        className="text-xs"
                        style={{ 
                          backgroundColor: product.categoryColor + '20',
                          color: product.categoryColor,
                          border: `1px solid ${product.categoryColor}40`
                        }}
                      >
                        {product.categoryName}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-fetchpilot-primary transition-colors">
                    {product.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-fetchpilot-text">{product.price}</span>
                    {product.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{product.rating}</span>
                      </div>
                    )}
                  </div>
                  {product.brand && (
                    <p className="text-xs text-slate-400">{product.brand}</p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Job History Component
async function JobHistory({ userId }: { userId: string }) {
  const jobs = await getRecentJobs(userId)

  if (jobs.length === 0) {
    return (
      <Card className="shadow-soft border-0 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-slate-300" />
            <p className="text-slate-500 mt-2">No scraping jobs yet</p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-1 text-fetchpilot-primary hover:underline mt-3"
            >
              Start your first scrape <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-soft border-0 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <Link 
          href="/" 
          className="text-sm text-fetchpilot-primary hover:underline flex items-center gap-1"
        >
          New Job <ExternalLink className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
              <div className="flex-shrink-0 mt-1">
                <div className={`w-3 h-3 rounded-full ${
                  job.status === 'completed' ? 'bg-green-500' :
                  job.status === 'running' ? 'bg-blue-500' :
                  job.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={job.status} />
                  <span className="text-xs text-slate-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  {job.category && (
                    <Badge 
                      className="text-xs"
                      style={{ 
                        backgroundColor: job.category.color + '20',
                        color: job.category.color,
                        border: `1px solid ${job.category.color}40`
                      }}
                    >
                      {job.category.name}
                    </Badge>
                  )}
                </div>
                
                <h4 className="font-medium text-slate-900 mb-1 group-hover:text-fetchpilot-primary transition-colors">
                  {new URL(job.url).hostname}
                </h4>
                
                {job.goal && (
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">{job.goal}</p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {job.productsFound || 0} products
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {job.pagesProcessed || 0} pages
                  </span>
                  {job.completedAt && job.startedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.round((job.completedAt.getTime() - job.startedAt.getTime()) / 1000)}s
                    </span>
                  )}
                </div>
                
                {job.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs text-red-700 font-mono">{job.error}</p>
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0 flex gap-2">
                {job.products.length > 0 && job.products[0].image && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200">
                    <Image
                      src={job.products[0].image}
                      alt="Product preview"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  View <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Fetch all dashboard data
  const [stats, recentProducts] = await Promise.all([
    getDashboardStats(session.user.id),
    getRecentProducts(session.user.id, 12)
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-fetchpilot-text">Dashboard</h1>
          <p className="text-slate-600 mt-1">Overview of your scraping activity and recent results</p>
        </div>
        <Link
          href="/"
          className="px-6 py-3 bg-fetchpilot-primary text-white rounded-xl hover:bg-fetchpilot-accent transition-colors font-medium flex items-center gap-2"
        >
          <Package className="h-4 w-4" />
          Start New Scrape
        </Link>
      </div>

      {/* Activity Overview */}
      <ActivityOverview stats={stats} />

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Products - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <RecentProducts products={recentProducts} />
        </div>
        
        {/* Job History - Takes 1 column on large screens */}
        <div className="lg:col-span-1">
          <Suspense fallback={
            <Card className="shadow-soft border-0 rounded-2xl">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Loader className="mx-auto h-8 w-8 animate-spin text-fetchpilot-primary" />
                  <p className="text-slate-500 mt-2">Loading activity...</p>
                </div>
              </CardContent>
            </Card>
          }>
            <JobHistory userId={session.user.id} />
          </Suspense>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-soft border-0 rounded-2xl bg-gradient-to-r from-fetchpilot-primary/5 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-fetchpilot-text mb-1">Ready to scrape more data?</h3>
              <p className="text-slate-600 text-sm">Discover new products and build your database with FetchPilot</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard/categories"
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Tag className="h-4 w-4" />
                Browse Categories
              </Link>
              <Link
                href="/dashboard/metrics"
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                View Insights
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-fetchpilot-primary text-white rounded-lg hover:bg-fetchpilot-accent transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                New Scrape
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
