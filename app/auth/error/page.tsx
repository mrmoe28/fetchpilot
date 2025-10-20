'use client'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There is a problem with the authentication configuration. Please contact support.',
          details: 'This usually indicates a server configuration issue.'
        }
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to sign in.',
          details: 'Your account may not have the required permissions.'
        }
      case 'Verification':
        return {
          title: 'Email Verification Required',
          message: 'Please check your email and click the verification link.',
          details: 'A verification email has been sent to your address.'
        }
      default:
        return {
          title: 'Authentication Error',
          message: 'An error occurred during authentication. Please try again.',
          details: 'If the problem persists, please contact support.'
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen grid place-content-center p-6">
      <Card className="shadow-soft border-0 rounded-2xl w-full max-w-md">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 grid place-content-center">
              <AlertTriangle size={32} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-fetchpilot-text mb-2">
                {errorInfo.title}
              </h1>
              <p className="text-slate-600 mb-3">
                {errorInfo.message}
              </p>
              <p className="text-sm text-slate-500">
                {errorInfo.details}
              </p>
              {error && (
                <p className="text-xs text-slate-400 mt-2 font-mono">
                  Error: {error}
                </p>
              )}
            </div>

            <div className="w-full space-y-3">
              <Link href="/auth/signin">
                <Button className="w-full bg-fetchpilot-primary hover:bg-fetchpilot-accent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Go to Home
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
