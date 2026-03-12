import { Suspense } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { TourCard } from '@/components/tour-card'
import { TourCardSkeleton } from '@/components/tour-card-skeleton'
import { TOURS } from '@/lib/data/tours'

function PopularToursContent() {
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-2 md:-ml-4">
        {TOURS.map((tour) => (
          <CarouselItem key={tour.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
            <TourCard {...tour} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden md:flex -left-6 lg:-left-12 bg-background border-border hover:bg-primary hover:text-primary-foreground hover:border-primary" />
      <CarouselNext className="hidden md:flex -right-6 lg:-right-12 bg-background border-border hover:bg-primary hover:text-primary-foreground hover:border-primary" />
    </Carousel>
  )
}

function PopularToursLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <TourCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function PopularToursSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Popular <span className="text-primary">Tours</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            Discover our most loved tours and experiences, handpicked by thousands of happy travelers.
          </p>
          <Link
            href="/tours"
            className="group mt-6 inline-flex items-center gap-2 border-b-2 border-border pb-1 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            View All Tours
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Tours Carousel with Suspense */}
        <Suspense fallback={<PopularToursLoading />}>
          <PopularToursContent />
        </Suspense>
      </div>
    </section>
  )
}
