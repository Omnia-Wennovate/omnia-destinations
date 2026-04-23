import Image from "next/image"
import Link from "next/link"
import { MapPin, Clock, Star, Calendar } from "lucide-react"
import { BookNowButton } from "@/components/book-now-button"

interface PackageCardProps {
  package: {
    id: string
    slug?: string
    title: string
    location: string
    image?: string
    duration: string
    singlePrice: number
    sharingPrice: number
    rating: number
    availableFrom?: string
    availableUntil?: string
  }
}

export function PackageCard({ package: pkg }: PackageCardProps) {
  if (!pkg) return null

  const { id, slug, title, location, image, duration, singlePrice, sharingPrice, rating, availableFrom, availableUntil } = pkg
  const linkSlug = slug || id

  const formatAvailability = (start?: string, end?: string) => {
    if (!start && !end) return null
    
    const formatDateStr = (d: string, includeYear: boolean) => 
      new Date(d).toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        ...(includeYear && { year: "numeric" }) 
      })
    
    if (start && end) {
      const startDate = new Date(start)
      const endDate = new Date(end)
      const sameYear = startDate.getFullYear() === endDate.getFullYear()
      return `Available: ${formatDateStr(start, !sameYear)} – ${formatDateStr(end, true)}`
    }
    
    if (start) return `Available from: ${formatDateStr(start, true)}`
    if (end) return `Available until: ${formatDateStr(end, true)}`
    return null
  }

  const availabilityText = formatAvailability(availableFrom, availableUntil)

  return (
    <Link
      href={`/packages/${linkSlug}`}
      className="group overflow-hidden rounded-lg bg-card shadow-md transition-shadow hover:shadow-xl block"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image || "/images/placeholder.jpg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-sm font-medium">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="text-foreground">{rating}</span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="mb-2 text-xl font-semibold text-card-foreground">
          {title}
        </h3>

        <div className="mb-4 flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
          </div>

          {availabilityText && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{availabilityText}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground">Single:</span>
              <span className="text-lg font-bold text-primary">${singlePrice}</span>
              <span className="text-[10px] text-muted-foreground">/person</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground">Sharing:</span>
              <span className="text-lg font-bold text-primary">${sharingPrice}</span>
              <span className="text-[10px] text-muted-foreground">/person</span>
            </div>
          </div>

          <BookNowButton
            packageData={{ id, title, location, singlePrice, sharingPrice, duration }}
          />
        </div>
      </div>
    </Link>
  )
}