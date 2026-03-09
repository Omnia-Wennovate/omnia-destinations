import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { PackageCard } from '@/components/package-card'
import { ScrollReveal } from '@/components/scroll-reveal'
import { PACKAGES } from '@/lib/data/packages'

export function PackagesSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            New <span className="text-primary">Packages</span>
          </h2>
          <Link
            href="/packages"
            className="group inline-flex items-center gap-2 border-b-2 border-border pb-1 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            All Packages
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Package Cards Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {PACKAGES.map((pkg, index) => (
            <ScrollReveal key={pkg.id} direction="up" delay={index * 0.1}>
              <PackageCard {...pkg} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
