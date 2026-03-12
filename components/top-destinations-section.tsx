import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ScrollReveal } from '@/components/scroll-reveal'
import { TOP_DESTINATIONS } from '@/lib/data/destinations'

export function TopDestinationsSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Top <span className="text-primary">Destinations</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            Explore our top destinations voted by more than 100,000+ customers around the world.
          </p>
          <Link
            href="/destinations"
            className="group mt-6 inline-flex items-center gap-2 border-b-2 border-border pb-1 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            All Destinations
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Destination Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TOP_DESTINATIONS.map((destination, index) => (
            <div key={destination.id} className="group relative overflow-hidden rounded-2xl aspect-[4/3] shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] block">
              {/* Image */}
              <Image
                src={destination.image || "/placeholder.svg"}
                alt={destination.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Tour Count Badge */}
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-lg">
                {destination.tours} tour{destination.tours > 1 ? 's' : ''}
              </div>
              
              {/* Destination Name */}
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold text-white drop-shadow-lg md:text-3xl">
                  {destination.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
