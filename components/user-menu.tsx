'use client'

import { Avatar } from './ui/avatar'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from './ui/dropdown-menu'
import { User, Settings, LogOut, LayoutDashboard } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' })
  }

  return (
    <DropdownMenu
      trigger={
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-white/60 transition-all duration-200 cursor-pointer">
          <Avatar src={user.image} fallback={user.name || user.email || 'U'} size="sm" />
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-slate-900">{user.name || 'User'}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      }
    >
      <DropdownMenuLabel>My Account</DropdownMenuLabel>

      <DropdownMenuItem
        icon={<LayoutDashboard className="w-4 h-4" />}
        onClick={() => router.push('/dashboard')}
      >
        Dashboard
      </DropdownMenuItem>

      <DropdownMenuItem
        icon={<User className="w-4 h-4" />}
        onClick={() => router.push('/dashboard/profile')}
      >
        Profile
      </DropdownMenuItem>

      <DropdownMenuItem
        icon={<Settings className="w-4 h-4" />}
        onClick={() => router.push('/dashboard/settings')}
      >
        Settings
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        icon={<LogOut className="w-4 h-4" />}
        onClick={handleSignOut}
        className="text-red-600 hover:bg-red-50"
      >
        Sign Out
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
