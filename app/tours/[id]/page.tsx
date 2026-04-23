'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { TOURS } from '@/lib/data/tours'
import { TourDetailClient } from '@/components/tour-detail-client'
import type { Tour } from '@/lib/types'

export default function TourDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [tour, setTour] = useState<Tour | null>(null)
  const [notFoundState, setNotFoundState] = useState(false)
  const [loading, setLoading] = useState(true)

  // All hooks must be declared before any conditional returns.
  useEffect(() => {
    const found = TOURS.find((t) => t.id === id)
    if (found) {
      setTour(found)
    } else {
      setNotFoundState(true)
    }
    setLoading(false)
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFoundState || !tour) {
    notFound()
  }

  return <TourDetailClient tour={tour} />
}
