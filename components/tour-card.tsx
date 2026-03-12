'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, Star, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TourCardProps {
  id: string
  title: string
  location: string
  duration: string
  price: number
  rating: number
  reviews: number
  image: string
  groupSize: string
  nextAvailable: string
}

export function TourCard({
  id,
  title,
  location,
  duration,
  price,
  rating,
  reviews,
  image,
  groupSize,
  nextAvailable,
}: TourCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl bg-card shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
    >
      <div className="flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Overlay Content - Revealed on Hover */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
              <div className="space-y-4 text-center transform transition-all duration-300"
                style={{
                  transform: isHovered ? 'translateY(0)' : 'translateY(20px)',
                  opacity: isHovered ? 1 : 0,
                }}
              >
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{groupSize}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{nextAvailable}</span>
                  </div>
                </div>
                <p className="text-sm opacity-90 line-clamp-3">
                  Experience the beauty and culture of {location} with expert guides and unforgettable moments.
                </p>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
                >
                  <Link href={`/tours/${id}`}>View Details</Link>
                </Button>
              </div>
            </div>
            
            {/* Rating Badge - Always Visible */}
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="text-sm font-semibold text-foreground">{rating}</span>
              <span className="text-xs text-muted-foreground">({reviews})</span>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6 space-y-4">
            {/* Duration */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Price & Book Button */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="text-2xl font-bold text-primary">
                  ${price}
                  <span className="text-sm font-normal text-muted-foreground">/person</span>
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="rounded-full bg-transparent border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Link href={`/tours/${id}`}>Book Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
