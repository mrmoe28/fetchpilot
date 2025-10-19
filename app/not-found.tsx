import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import Button from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-content-center p-6">
      <div className="max-w-md text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 grid place-content-center">
            <FileQuestion className="text-slate-400" size={40} />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-fetchpilot-text">404</h1>
            <h2 className="text-2xl font-semibold text-fetchpilot-text">
              Page Not Found
            </h2>
            <p className="text-slate-600 pt-2">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>

          <Link href="/">
            <Button className="bg-fetchpilot-primary hover:bg-fetchpilot-accent">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
