'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-primary mb-4">Oops!</h1>
          <p className="text-2xl font-semibold text-foreground mb-2">Something went wrong</p>
          <p className="text-muted-foreground">{error.message || 'An unexpected error occurred'}</p>
        </div>

        <div className="space-y-3 mb-8">
          <Button onClick={reset} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            Try Again
          </Button>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 bg-transparent font-semibold">
              Go Home
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">If the problem persists, please contact our support team.</p>
      </div>
    </div>
  )
}
