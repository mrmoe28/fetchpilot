import { PlaneTakeoff, BookOpen } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { UserMenu } from "./user-menu";

export default async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 glass shadow-sm border-b border-white/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl blur opacity-60 animate-pulse-slow"></div>
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white grid place-content-center shadow-md">
              <PlaneTakeoff size={20} />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              FetchPilot
            </h1>
            <p className="text-xs text-slate-500 -mt-0.5">Autonomous web intelligence</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {session?.user && (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all duration-200"
              >
                <span className="hidden md:inline">Dashboard</span>
                <span className="md:hidden">📊</span>
              </Link>
              <Link
                href="/dashboard/categories"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all duration-200"
              >
                <span className="hidden md:inline">Categories</span>
                <span className="md:hidden">📁</span>
              </Link>
              <Link
                href="/dashboard/scheduled"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all duration-200"
              >
                <span className="hidden md:inline">Scheduled</span>
                <span className="md:hidden">⏰</span>
              </Link>
            </>
          )}
          <a
            href="/docs"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all duration-200"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">Docs</span>
          </a>

          {session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <Link
              href="/auth/signin"
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-sky-600 hover:to-blue-700 transition-all duration-200 shadow-md"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
