'use client'

import Image from 'next/image'
import Link from 'next/link'

interface DestinationCardProps {
  name: string
  image: string
  tourCount?: number
  description?: string
  href: string
}

export function DestinationCard({ name, image, tourCount, description, href }: DestinationCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl aspect-[4/3] block transition-all duration-300 hover:shadow-2xl hover:scale-105"
    >
      {/* Background Image */}
      <Image
        src={image || "/placeholder.svg"}
        alt={name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Tour Count Badge */}
      {tourCount && (
        <div className="absolute top-4 right-4 bg-primary px-4 py-2 rounded-full">
          <span className="text-primary-foreground text-sm font-semibold">{tourCount} tour{tourCount > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <h3 className="text-white text-2xl lg:text-3xl font-bold mb-2 drop-shadow-lg">
          {name}
        </h3>
        
        {/* Description - shows on hover for cards with description */}
        {description && (
          <p className="text-white/90 text-sm lg:text-base leading-relaxed opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 max-w-lg">
            {description}
          </p>
        )}
      </div>

      {/* Hover Border Effect */}
      <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 rounded-2xl transition-colors duration-300" />
    </Link>
  )
}
