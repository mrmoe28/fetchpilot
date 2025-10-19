import { ReactNode } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Calendar, User, Settings, Home, FolderOpen, Activity } from 'lucide-react'
import { clsx } from 'clsx'

interface DashboardLayoutProps {
  children: ReactNode
}

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Categories', href: '/dashboard/categories', icon: FolderOpen },
  { name: 'Insights', href: '/dashboard/metrics', icon: Activity },
  { name: 'Scheduled Jobs', href: '/dashboard/scheduled', icon: Calendar },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="flex gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-64 shrink-0">
        <div className="sticky top-24 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all duration-200 mb-4"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
