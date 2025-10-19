import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Mail, Calendar, Shield } from 'lucide-react'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { scrapingJobs } from '@/lib/db/schema'
import { eq, count, and } from 'drizzle-orm'

export const metadata: Metadata = {
  title: 'Profile',
  description: 'View and manage your profile settings',
}

async function getUserStats(userId: string) {
  const [totalJobs] = await db
    .select({ count: count() })
    .from(scrapingJobs)
    .where(eq(scrapingJobs.userId, userId))

  const [completedJobs] = await db
    .select({ count: count() })
    .from(scrapingJobs)
    .where(and(
      eq(scrapingJobs.userId, userId),
      eq(scrapingJobs.status, 'completed')
    ))

  return {
    totalJobs: totalJobs?.count || 0,
    completedJobs: completedJobs?.count || 0,
  }
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = session.user
  const stats = await getUserStats(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-fetchpilot-text">Profile</h1>
        <p className="text-slate-600 mt-1">Manage your account information and view your activity</p>
      </div>

      {/* Profile Overview Card */}
      <Card className="shadow-soft border-0 rounded-2xl">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <Avatar src={user.image} fallback={user.name || user.email || 'U'} size="xl" />

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">{user.name || 'User'}</h2>
              <div className="flex flex-col gap-2 mt-3 text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Authenticated User</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft border-0 rounded-2xl">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-slate-600 mb-1">Total Scraping Jobs</div>
            <div className="text-3xl font-bold text-fetchpilot-text">{stats.totalJobs}</div>
            <div className="text-xs text-slate-500 mt-1">All time</div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0 rounded-2xl">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-slate-600 mb-1">Completed Jobs</div>
            <div className="text-3xl font-bold text-green-600">{stats.completedJobs}</div>
            <div className="text-xs text-slate-500 mt-1">Successfully finished</div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0 rounded-2xl">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-slate-600 mb-1">Success Rate</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalJobs > 0 ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Completion rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card className="shadow-soft border-0 rounded-2xl">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Account Information</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Full Name</label>
                <div className="mt-1 px-4 py-2.5 bg-slate-50 rounded-lg text-slate-900">
                  {user.name || 'Not set'}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Email Address</label>
                <div className="mt-1 px-4 py-2.5 bg-slate-50 rounded-lg text-slate-900">
                  {user.email}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">User ID</label>
              <div className="mt-1 px-4 py-2.5 bg-slate-50 rounded-lg text-slate-600 font-mono text-sm">
                {user.id}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              To update your profile information, please sign in with your OAuth provider and update your details there.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
