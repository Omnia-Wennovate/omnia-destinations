'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  MapPin, 
  Clock, 
  Star, 
  Users, 
  Calendar,
  Check,
  X,
  ChevronRight,
  PlayCircle,
  Award,
  Shield,
  Heart
} from 'lucide-react'
import type { Tour } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { BookingDialog } from '@/components/booking-dialog'
import { cn } from '@/lib/utils'

interface TourDetailClientProps {
  tour: Tour
}

export function TourDetailClient({ tour }: TourDetailClientProps) {
  const [selectedMedia, setSelectedMedia] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const images = tour.gallery || [tour.image]
  
  // Create media array with images and video
  const mediaItems = [
    ...images.map(img => ({ type: 'image' as const, src: img })),
    ...(tour.videoUrl ? [{ type: 'video' as const, src: tour.videoUrl }] : [])
  ]

  const currentMedia = mediaItems[selectedMedia]
  const isVideoSelected = currentMedia?.type === 'video'

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Mixed Media Display */}
      <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        {isVideoSelected ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <iframe
              width="100%"
              height="100%"
              src={currentMedia.src}
              title={tour.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          <>
            <Image
              src={currentMedia?.src || "/placeholder.svg"}
              alt={tour.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/5" />
          </>
        )}
      </section>

      {/* Media Gallery Thumbnails - Below Hero */}
      <div className="bg-background border-y py-4">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {mediaItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedMedia(idx)
                  if (item.type === 'image') setShowVideo(false)
                }}
                className={cn(
                  'relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 transition-all',
                  selectedMedia === idx ? 'border-primary ring-2 ring-primary/20' : 'border-muted hover:border-muted-foreground/50'
                )}
              >
                {item.type === 'video' ? (
                  <div className="relative w-full h-full bg-black/80 flex items-center justify-center">
                    <PlayCircle className="h-8 w-8 md:h-10 md:w-10 text-white" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent" />
                  </div>
                ) : (
                  <Image 
                    src={item.src || "/placeholder.svg"} 
                    alt={`View ${idx + 1}`} 
                    width={96} 
                    height={96} 
                    className="object-cover w-full h-full" 
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Title and Info Section - Below Hero */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="max-w-4xl">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {tour.difficulty && (
                <span className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  {tour.difficulty}
                </span>
              )}
              <span className="px-3 py-1.5 bg-muted text-foreground text-sm font-medium rounded-full flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {tour.rating} · {tour.reviews} reviews
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              {tour.title}
            </h1>

            <div className="flex flex-wrap gap-6 text-muted-foreground text-sm md:text-base">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{tour.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>{tour.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>{tour.groupSize}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Next: {tour.nextAvailable}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">About This Experience</h2>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                {tour.description || `Join us for an unforgettable journey through ${tour.location}. This carefully curated experience offers the perfect blend of adventure, culture, and relaxation.`}
              </p>
            </Card>

            {/* Tabs for Details */}
            <Card className="p-6 md:p-8">
              <Tabs defaultValue="itinerary" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                  <TabsTrigger value="included">What's Included</TabsTrigger>
                  <TabsTrigger value="highlights">Highlights</TabsTrigger>
                </TabsList>

                {/* Itinerary Timeline */}
                <TabsContent value="itinerary" className="mt-6">
                  <div className="space-y-6">
                    {tour.itinerary && tour.itinerary.length > 0 ? (
                      tour.itinerary.map((day, index) => (
                        <div key={day.day} className="relative pl-8 pb-8 border-l-2 border-primary/30 last:border-0">
                          {/* Timeline Dot */}
                          <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                          
                          {/* Day Badge */}
                          <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-3">
                            Day {day.day}
                          </div>

                          <h3 className="text-xl font-bold mb-2">{day.title}</h3>
                          <p className="text-muted-foreground mb-4">{day.description}</p>

                          {/* Activities */}
                          {day.activities && day.activities.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Activities</h4>
                              <ul className="space-y-2">
                                {day.activities.map((activity, actIdx) => (
                                  <li key={actIdx} className="flex items-start gap-2">
                                    <ChevronRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <span className="text-sm">{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Meals & Accommodation */}
                          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {day.meals && day.meals.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Meals:</span>
                                <span>{day.meals.join(', ')}</span>
                              </div>
                            )}
                            {day.accommodation && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Stay:</span>
                                <span>{day.accommodation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Detailed itinerary coming soon. Contact us for more information.</p>
                    )}
                  </div>
                </TabsContent>

                {/* What's Included */}
                <TabsContent value="included" className="mt-6 space-y-6">
                  {tour.included && tour.included.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        Included
                      </h3>
                      <ul className="grid gap-3">
                        {tour.included.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tour.excluded && tour.excluded.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <X className="h-5 w-5 text-red-600" />
                        Not Included
                      </h3>
                      <ul className="grid gap-3">
                        {tour.excluded.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                            <X className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                {/* Highlights */}
                <TabsContent value="highlights" className="mt-6">
                  {tour.highlights && tour.highlights.length > 0 ? (
                    <ul className="grid gap-4">
                      {tour.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                          <Award className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm md:text-base">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Experience the best of {tour.location} with expert guides and unforgettable moments.</p>
                  )}
                </TabsContent>
              </Tabs>
            </Card>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="p-4 flex flex-col items-center text-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <h4 className="font-semibold text-sm">Secure Booking</h4>
                <p className="text-xs text-muted-foreground">Your safety is our priority</p>
              </Card>
              <Card className="p-4 flex flex-col items-center text-center gap-2">
                <Award className="h-8 w-8 text-primary" />
                <h4 className="font-semibold text-sm">Best Price</h4>
                <p className="text-xs text-muted-foreground">Guaranteed lowest rates</p>
              </Card>
              <Card className="p-4 flex flex-col items-center text-center gap-2">
                <Heart className="h-8 w-8 text-primary" />
                <h4 className="font-semibold text-sm">24/7 Support</h4>
                <p className="text-xs text-muted-foreground">We're here to help</p>
              </Card>
            </div>
          </div>

          {/* Right Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <div className="space-y-6">
                {/* Price */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">From</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">${tour.price}</span>
                    <span className="text-muted-foreground">/person</span>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="space-y-3 py-4 border-y">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{tour.duration}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Group Size</span>
                    <span className="font-medium">{tour.groupSize}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next Available</span>
                    <span className="font-medium">{tour.nextAvailable}</span>
                  </div>
                  {tour.minAge && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Min Age</span>
                      <span className="font-medium">{tour.minAge}+</span>
                    </div>
                  )}
                </div>

                {/* Booking Button */}
                <BookingDialog
                  packageData={{
                    id: tour.id,
                    title: tour.title,
                    location: tour.location,
                    price: tour.price,
                    duration: tour.duration
                  }}
                >
                  <Button className="w-full" size="lg">
                    Book Now
                  </Button>
                </BookingDialog>

                <p className="text-xs text-center text-muted-foreground">
                  Free cancellation up to 24 hours before departure
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Video Dialog */}
      {tour.videoUrl && (
        <Dialog open={showVideo} onOpenChange={setShowVideo}>
          <DialogContent className="max-w-4xl">
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={tour.videoUrl}
                title={tour.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
