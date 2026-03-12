'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getPackageBySlug, type PackageData } from '@/lib/services/packages.service'
import { PACKAGES } from '@/lib/data/packages'
import { TourDetailClient } from '@/components/tour-detail-client'

export default function PackageDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [packageData, setPackageData] = useState<PackageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  useEffect(() => {
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
            price: staticPkg.price,
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
  }, [id])

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

  const tourData = {
    id: packageData.id,
    title: packageData.title,
    location: packageData.location,
    image: packageData.featuredImageURL,
    duration: `${packageData.duration} Days`,
    price: packageData.price,
    rating: 4.5,
    reviews: 0,
    groupSize: 'Flexible',
    nextAvailable: 'Contact us',
    description: packageData.fullDescription || packageData.shortDescription,
    difficulty: 'Easy',
    minAge: 0,
    maxPeople: 20,
    highlights: [],
    included: packageData.includedServices,
    excluded: packageData.excludedServices,
    gallery: packageData.galleryImageURLs,
    videoUrl: packageData.videoURL,
    itinerary: [],
  }

  return <TourDetailClient tour={tourData} />
}