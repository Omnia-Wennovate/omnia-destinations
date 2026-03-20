'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { TOURS } from '@/lib/data/tours'
import { TourDetailClient } from '@/components/tour-detail-client'
import { useRouteGuard } from '@/hooks/use-route-guard'
import type { Tour } from '@/lib/types'

export default function TourDetailPage() {
  const params = useParams()
  const id = params.id as string

  // 🔐 Only authenticated regular users may access this page.
  // Unauthenticated → /login?redirect=...   Admin → /admin
  const { isReady } = useRouteGuard('user')

  const [tour, setTour] = useState<Tour | null>(null)
  const [notFoundState, setNotFoundState] = useState(false)

  // All hooks must be declared before any conditional returns.
  useEffect(() => {
    if (!isReady) return
    const found = TOURS.find((t) => t.id === id)
    if (found) {
      setTour(found)
    } else {
      setNotFoundState(true)
    }
  }, [id, isReady])

  // While auth state is being determined, show a spinner.
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFoundState || (!tour && isReady)) {
    notFound()
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <TourDetailClient tour={tour} />
}
