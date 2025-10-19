'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import Button from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen grid place-content-center p-6">
      <div className="max-w-md">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 grid place-content-center">
            <AlertCircle className="text-red-600" size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-fetchpilot-text">
              Something went wrong
            </h1>
            <p className="text-slate-600">
              An unexpected error occurred while processing your request.
            </p>
          </div>

          {error.message && (
            <div className="w-full p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-800 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          {error.digest && (
            <p className="text-xs text-slate-400">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={reset}
              className="bg-fetchpilot-primary hover:bg-fetchpilot-accent"
            >
              Try again
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700"
            >
              Go home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
