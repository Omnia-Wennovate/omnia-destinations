import Image from "next/image"
import Link from "next/link"
import { MapPin, Clock, Star } from "lucide-react"
import { BookNowButton } from "@/components/book-now-button"

interface PackageCardProps {
  package: {
    id: string
    title: string
    location: string
    image?: string
    duration: string
    price: number
    rating: number
  }
}

export function PackageCard({ package: pkg }: PackageCardProps) {
  if (!pkg) return null
<<<<<<< HEAD

=======
>>>>>>> 4c57566027f0d79a8001fe43943a3fa318651381
  const { id, title, location, image, duration, price, rating } = pkg

  return (
    <Link
      href={`/packages/${id}`}
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

        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-primary">${price}</span>
            <span className="text-sm text-muted-foreground">/person</span>
          </div>

          <BookNowButton
            packageData={{ id, title, location, price, duration }}
          />
        </div>
      </div>
    </Link>
  )
}