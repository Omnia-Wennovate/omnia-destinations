import { DestinationCard } from '@/components/destination-card'

const destinations = [
  {
    name: 'Zanzibar',
    image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&q=80',
    href: '/destinations/zanzibar',
  },
  {
    name: 'Thailand',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80',
    tourCount: 2,
    href: '/destinations/thailand',
  },
  {
    name: 'South Africa',
    image: 'https://images.unsplash.com/photo-1484318571209-661cf29a69c3?w=800&q=80',
    href: '/destinations/south-africa',
  },
  {
    name: 'Singapore',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
    tourCount: 1,
    href: '/destinations/singapore',
  },
  {
    name: 'Seychelles',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    tourCount: 1,
    description: 'Seychelles, a paradise of national parks and beaches, invites private yacht exploration with its pristine waters and ideal climate, a year-round cruising haven.',
    href: '/destinations/seychelles',
  },
  {
    name: 'Kenya',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80',
    tourCount: 1,
    href: '/destinations/kenya',
  },
  {
    name: 'Rome',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
    tourCount: 1,
    href: '/destinations/rome',
  },
  {
    name: 'Bali',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    tourCount: 1,
    href: '/destinations/bali',
  },
  {
    name: 'India',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80',
    tourCount: 1,
    href: '/destinations/india',
  },
]

export default function DestinationsPage() {
  return (
    <>
      {/* Hero Section with World Map */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-muted/30 to-background">
        {/* Dotted World Map Background */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <svg
            className="w-full h-full"
            viewBox="0 0 1200 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Generate dots for world map effect */}
            {Array.from({ length: 120 }).map((_, i) =>
              Array.from({ length: 60 }).map((_, j) => (
                <circle
                  key={`${i}-${j}`}
                  cx={i * 10 + 5}
                  cy={j * 10 + 5}
                  r="1.5"
                  fill="currentColor"
                  opacity="0.3"
                />
              ))
            )}
          </svg>

          {/* Location Markers */}
          <div className="absolute inset-0">
            <div className="absolute top-[25%] left-[15%] w-3 h-3 bg-primary rounded-full animate-pulse" />
            <div className="absolute top-[35%] left-[25%] w-3 h-3 bg-primary rounded-full animate-pulse delay-100" />
            <div className="absolute top-[45%] left-[50%] w-3 h-3 bg-primary rounded-full animate-pulse delay-200" />
            <div className="absolute top-[30%] left-[60%] w-3 h-3 bg-primary rounded-full animate-pulse delay-300" />
            <div className="absolute top-[52%] left-[68%] w-3 h-3 bg-primary rounded-full animate-pulse delay-400" />
            <div className="absolute top-[48%] left-[75%] w-3 h-3 bg-primary rounded-full animate-pulse delay-500" />
            <div className="absolute top-[60%] left-[52%] w-3 h-3 bg-primary rounded-full animate-pulse delay-600" />
            <div className="absolute top-[70%] left-[80%] w-3 h-3 bg-primary rounded-full animate-pulse delay-700" />
          </div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
              <span className="text-foreground">EXPLORE THE </span>
              <span className="text-primary">WORLD</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto text-pretty">
              Immerse yourself in the rich culture, stunning landscapes, and vibrant history. Get ready for an
              unforgettable journey with Omina.
            </p>
          </div>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {destinations.map((destination) => (
              <DestinationCard key={destination.name} {...destination} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
