import { notFound } from 'next/navigation'
import { TOURS } from '@/lib/data/tours'
import { TourDetailClient } from '@/components/tour-detail-client'

export const dynamicParams = true

export function generateStaticParams() {
  return TOURS.map((tour) => ({
    id: tour.id,
  }))
}

export default async function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tour = TOURS.find((t) => t.id === id)

  if (!tour) {
    notFound()
  }

  return <TourDetailClient tour={tour} />
}
