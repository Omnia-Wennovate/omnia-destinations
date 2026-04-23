'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getPackageById, getPackageBySlug, type PackageData } from '@/lib/services/packages.service'
import { PACKAGES } from '@/lib/data/packages'
import { TourDetailClient } from '@/components/tour-detail-client'

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
        console.log("URL SLUG:", slug)

        // 🔹 Fetch from Firestore
        const firestorePkg = await getPackageBySlug(slug)

        if (firestorePkg) {
          console.log("✅ Package found in Firestore/Fallback:", firestorePkg.title)
          setPackageData(firestorePkg)
          return
        }

        // 🔹 Fallback to static packages
        const staticPkg = PACKAGES.find((p) => p.id === slug)

        if (staticPkg) {
          console.log("✅ Package found in Static Data:", staticPkg.title)
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
          console.log("❌ Package not found for slug:", slug)
          setNotFoundState(true)
        }

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
    durationDays: packageData.duration,
    availableFrom: packageData.availableFrom,
    availableUntil: packageData.availableUntil,
  }

  return <TourDetailClient tour={tourData as any} />
}