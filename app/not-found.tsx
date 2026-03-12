'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <p className="text-2xl font-semibold text-foreground mb-2">Page Not Found</p>
          <p className="text-muted-foreground">Sorry, the page you're looking for doesn't exist or has been moved.</p>
        </div>

        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">Go Home</Button>
          </Link>
          <Link href="/packages">
            <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 bg-transparent font-semibold">
              View Packages
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
