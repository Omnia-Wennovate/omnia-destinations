'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getPackageBySlug, type PackageData } from '@/lib/services/packages.service'
import { PACKAGES } from '@/lib/data/packages'
import { TourDetailClient } from '@/components/tour-detail-client'
import { useRouteGuard } from '@/hooks/use-route-guard'

export default function PackageDetailPage() {
  const params = useParams()
  const id = params.id as string

  // 🔐 Only authenticated regular users may access this page.
  // Unauthenticated → /login?redirect=...   Admin → /admin
  const { isReady } = useRouteGuard('user')

  const [packageData, setPackageData] = useState<PackageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  // All hooks must be declared before any conditional returns.
  useEffect(() => {
    // Skip fetching until auth is confirmed (isReady) so we don't load
    // data for users who will be redirected away.
    if (!isReady) return

    async function fetchPackage() {
      try {
        setLoading(true)

        // 🔹 Fetch from Firestore
        const firestorePkg = await getPackageBySlug(id)

        if (firestorePkg) {
          setPackageData(firestorePkg)
          return
        }

        // 🔹 Fallback to static packages
        const staticPkg = PACKAGES.find((p) => p.id === id)

        if (staticPkg) {
          setPackageData({
            id: staticPkg.id,
            title: staticPkg.title,
            slug: staticPkg.id,
            shortDescription: staticPkg.description || '',
            fullDescription: staticPkg.description || '',
            singlePrice: staticPkg.singlePrice,
            sharingPrice: staticPkg.sharingPrice,
            duration: parseInt(staticPkg.duration) || 7,
            location: staticPkg.location,
            category: '',
            includedServices: staticPkg.included || [],
            excludedServices: staticPkg.excluded || [],
            status: 'published',
            featuredImageURL: staticPkg.image,
            galleryImageURLs: staticPkg.gallery || [],
            videoURL: staticPkg.videoUrl || '',
          })
        } else {
          setNotFoundState(true)
        }

      } catch (error) {
        console.error('Failed to fetch package:', error)
        setNotFoundState(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPackage()
  }, [id, isReady])

  // While auth state is being determined, show a spinner.
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFoundState || !packageData) {
    notFound()
  }

  // Build itinerary from day1–day7 fields; skip empty days
  const itinerary = [
    packageData.day1,
    packageData.day2,
    packageData.day3,
    packageData.day4,
    packageData.day5,
    packageData.day6,
    packageData.day7,
  ].reduce<{ day: number; title: string; description: string; activities: string[] }[]>(
    (acc, text, i) => {
      if (text?.trim()) {
        acc.push({
          day: i + 1,
          title: `Day ${i + 1}`,
          description: text.trim(),
          activities: [],
        })
      }
      return acc
    },
    []
  )

  const tourData = {
    id: packageData.id,
    title: packageData.title,
    location: packageData.location,
    image: packageData.featuredImageURL,
    duration: `${packageData.duration} Days`,
    singlePrice: packageData.singlePrice,
    sharingPrice: packageData.sharingPrice,
    rating: 4.5,
    reviews: 0,
    groupSize: 'Flexible',
    nextAvailable: 'Contact us',
    description: packageData.fullDescription || packageData.shortDescription,
    difficulty: 'Easy' as const,
    minAge: 0,
    maxPeople: 20,
    highlights: [],
    included: packageData.includedServices,
    excluded: packageData.excludedServices,
    gallery: packageData.galleryImageURLs,
    videoUrl: packageData.videoURL,
    itinerary,
  }

  return <TourDetailClient tour={tourData} />
}