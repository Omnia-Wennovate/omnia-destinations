'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Calendar, Grid, List, SlidersHorizontal, Clock, X, Loader2 } from 'lucide-react'
import { PackageCard } from '@/components/package-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getPublishedPackages, type PackageListItem } from '@/lib/services/packages.service'
import { PACKAGES } from '@/lib/data/packages'

type SortOption = 'release-date' | 'destination' | 'price' | 'duration'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

const durations = ['Any', '1-3 Days', '4-7 Days', '1-2 Weeks', '2+ Weeks']
const months = [
  'Any',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export default function PackagesPage() {
  const [keywords, setKeywords] = useState('')
  const [duration, setDuration] = useState('Any')
  const [date, setDate] = useState('')
  const [month, setMonth] = useState('Any')
  const [sortBy, setSortBy] = useState<SortOption>('release-date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [firestorePackages, setFirestorePackages] = useState<PackageListItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch packages from Firestore on mount
  useEffect(() => {
    async function fetchPackages() {
      try {
        setLoading(true)
        const packages = await getPublishedPackages()
        console.log("🔥 Firestore packages:", packages)
        setFirestorePackages(packages)
      } catch (error) {
        console.error('Failed to fetch packages:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPackages()
  }, [])

  // Combine Firestore packages with static fallback data
  const allPackages = useMemo(() => {
    const firestoreConverted = firestorePackages.map((pkg) => ({
      id: pkg.slug || pkg.id,
      title: pkg.title,
      location: pkg.location,
      image: pkg.featuredImageURL || pkg.images?.[0] || "/images/placeholder.jpg",
      duration: `${pkg.duration} Days`,
      singlePrice: Number(pkg.singlePrice) || 0,
      sharingPrice: Number(pkg.sharingPrice) || 0,
      rating: 4.5,
      availableFrom: pkg.availableFrom,
      availableUntil: pkg.availableUntil,
    }))

    if (firestoreConverted.length > 0) {
      return firestoreConverted
    }

    return PACKAGES.map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      location: pkg.location,
      image: pkg.image,
      duration: pkg.duration,
      singlePrice: pkg.singlePrice || 0,
      sharingPrice: pkg.sharingPrice || 0,
      rating: pkg.rating,
    }))
  }, [firestorePackages])

  // Filter and sort packages
  const filteredPackages = useMemo(() => {
    let results = [...allPackages]

    const today = new Date()

    // Remove expired packages
    results = results.filter((pkg: any) => {
      const untilDate = pkg.availableUntil || pkg.availableTo
      if (!untilDate) return true
      const endDate = new Date(untilDate)
      return endDate >= today
    })

    // Filter by keywords
    if (keywords) {
      const searchTerm = keywords.toLowerCase()
      results = results.filter(
        (pkg) =>
          pkg.title.toLowerCase().includes(searchTerm) ||
          pkg.location.toLowerCase().includes(searchTerm)
      )
    }

    // Sort results
    results.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'release-date':
          comparison = 0
          break
        case 'destination':
          comparison = a.location.localeCompare(b.location)
          break
        case 'price':
          comparison = a.singlePrice - b.singlePrice
          break
        case 'duration':
          comparison = a.duration.localeCompare(b.duration)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return results
  }, [keywords, duration, sortBy, sortOrder, allPackages])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] lg:h-[55vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-zoom scale-105"
          style={{ backgroundImage: "url('/images/packages-hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/25 to-background/90" />
        <div className="container relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-2xl animate-fade-in tracking-tight">
            Search for <span className="text-primary">Packages</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 drop-shadow-lg max-w-2xl animate-fade-in">
            Discover handcrafted travel experiences to destinations around the world
          </p>
          <div className="mt-6 h-1 w-32 rounded-full bg-primary animate-fade-in shadow-lg shadow-primary/50" />
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-lg sticky top-24 transition-all hover:shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Filters</h2>
                </div>
              </div>

              <div className="space-y-5">
                {/* Keywords */}
                <div className="space-y-3">
                  <Label htmlFor="keywords" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Keywords
                  </Label>
                  <div className="relative">
                    <Input
                      id="keywords"
                      type="text"
                      placeholder="Search packages..."
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="pr-10 h-11 rounded-lg border-border bg-background/50 focus:bg-background transition-colors"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-3">
                  <Label htmlFor="duration" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Duration
                  </Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="duration" className="h-11 rounded-lg border-border bg-background/50 hover:bg-background transition-colors">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any">Any Duration</SelectItem>
                      {durations.map((dur) => (
                        <SelectItem key={dur} value={dur}>
                          {dur}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset Button */}
                <Button
                  variant="outline"
                  className="w-full h-11 bg-transparent hover:bg-primary/10 hover:text-primary hover:border-primary transition-all rounded-lg font-semibold"
                  onClick={() => {
                    setKeywords('')
                    setDuration('Any')
                    setDate('')
                    setMonth('Any')
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Results Section */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {filteredPackages.length} Result{filteredPackages.length !== 1 ? 's' : ''} Found
              </h2>
            </div>

            {/* Package Cards */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <p className="text-lg text-muted-foreground">No packages found matching your criteria.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid gap-6 lg:grid-cols-2 lg:gap-8' : 'flex flex-col gap-6'}>
                {filteredPackages.map((pkg) => (
                  <PackageCard key={pkg.id} package={pkg} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}