'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getPackageById, getPackageBySlug, findStaticPackage, type PackageData } from '@/lib/services/packages.service'
import { TourDetailClient } from '@/components/tour-detail-client'
import { recordView } from '@/lib/views'

export default function PackageDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [packageData, setPackageData] = useState<PackageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  // All hooks must be declared before any conditional returns.
  useEffect(() => {
    async function fetchPackage() {
      try {
        setLoading(true)

        // 🔹 1. Check authentic static packages by ID, slug, or alias
        const staticPkg = findStaticPackage(slug)
        if (staticPkg) {
          const pkgDetails = await getPackageById(staticPkg.id)
          if (pkgDetails) {
            setPackageData(pkgDetails)
            return
          }
        }

        // 🔹 2. Fetch from Firestore
        const firestorePkg = await getPackageBySlug(slug)
        if (firestorePkg) {
          setPackageData(firestorePkg)
          return
        }

        // 🔹 3. Fallback: fetch by ID directly
        const byIdPkg = await getPackageById(slug)
        if (byIdPkg) {
          setPackageData(byIdPkg)
          return
        }

        // 🔹 4. Not found — show package-not-found state
        setNotFoundState(true)
      } catch (error) {
        console.error('Failed to fetch package:', error)
        setNotFoundState(true)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchPackage()
    }
  }, [slug])

  // Count a view for visitors who land here directly (deduped with card views)
  useEffect(() => {
    if (packageData?.id) recordView('package', packageData.id)
  }, [packageData?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFoundState || !packageData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-2">Package Not Found</h2>
        <p className="text-muted-foreground mb-6">We couldn't find the package you're looking for.</p>
        <Link href="/packages" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 rounded-lg">
          Browse all packages
        </Link>
      </div>
    )
  }

  // Build itinerary: prioritize structured itinerary array, fallback to day1..dayN strings
  let finalItinerary = (packageData as any).itinerary || []
  if (!finalItinerary || finalItinerary.length === 0) {
    const parsedItinerary: { day: number; title: string; description: string; activities: string[] }[] = []
    let dayIdx = 1
    while (true) {
      const text = (packageData as any)[`day${dayIdx}`]
      if (text === undefined && dayIdx > 14) break
      if (text?.trim()) {
        parsedItinerary.push({
          day: dayIdx,
          title: `Day ${dayIdx}`,
          description: text.trim(),
          activities: [],
        })
      }
      dayIdx++
      if (dayIdx > 100) break
    }
    if (parsedItinerary.length > 0) {
      finalItinerary = parsedItinerary
    }
  }

  const tourData = {
    id: packageData.id,
    title: packageData.title,
    location: packageData.location,
    image: packageData.featuredImageURL,
    duration: `${packageData.duration} Days`,
    singlePrice: packageData.singlePrice,
    sharingPrice: packageData.sharingPrice,
    rating: (packageData as any).rating || 4.9,
    reviews: (packageData as any).reviews || 342,
    groupSize: (packageData as any).groupSize || 'Private or Small Group',
    nextAvailable: (packageData as any).nextAvailable || 'Year Round',
    description: packageData.fullDescription || packageData.shortDescription,
    difficulty: (packageData as any).difficulty || 'Easy',
    minAge: (packageData as any).minAge || 0,
    maxPeople: (packageData as any).maxPeople || 16,
    highlights: (packageData as any).highlights || [],
    included: packageData.includedServices || (packageData as any).included || [],
    excluded: packageData.excludedServices || (packageData as any).excluded || [],
    gallery: (packageData as any).gallery || packageData.galleryImageURLs || [],
    videoUrl: packageData.videoURL,
    itinerary: finalItinerary,
    durationDays: typeof packageData.duration === 'number' ? packageData.duration : parseInt(packageData.duration) || 8,
    availableFrom: packageData.availableFrom,
    availableUntil: packageData.availableUntil,
  }

  return <TourDetailClient tour={tourData as any} />
}