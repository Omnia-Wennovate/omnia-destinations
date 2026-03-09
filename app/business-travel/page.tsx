'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ScrollReveal } from '@/components/scroll-reveal'
import { ArrowRight, MapPin, Calendar, Users, Briefcase, Globe, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Event {
  id: string
  title: string
  category: string
  location: string
  country: string
  date: string
  description: string
  image: string
  attendees?: string
  featured?: boolean
}

const events: Event[] = [
  {
    id: '1',
    title: '17TH TRADE EXPO INDONESIA',
    category: 'Trade Exhibition',
    location: 'Jakarta',
    country: 'Indonesia',
    date: '19th - 23rd October 2022',
    description: 'HELD IN JAKARTA INDONESIA',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    attendees: '5000+',
    featured: true,
  },
  {
    id: '2',
    title: 'World Travel Market London',
    category: 'Travel & Tourism',
    location: 'ExCeL Centre',
    country: 'London, UK',
    date: '7th - 9th November',
    description: 'The trade event is took place between the 7th and 9th of November at the ExCeL Centre',
    image: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80',
    attendees: '10000+',
    featured: true,
  },
  {
    id: '3',
    title: 'The Pulses Conclave 2023',
    category: 'Indian Pulse and Grain Association',
    location: 'Hotel Grand Hyatt',
    country: 'Mumbai, India',
    date: '16th to 18th February',
    description: 'IPGA presents The Pulses Conclave 2023 to be held from 16th to 18th February at Hotel Grand Hyatt, Mumbai',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
    attendees: '3000+',
  },
  {
    id: '4',
    title: 'Gulfood 2023',
    category: 'Food & Beverage',
    location: 'Dubai World Trade Centre',
    country: 'Dubai, UAE',
    date: '24th February 2023',
    description: 'Driving creativity and change, in February 2023, the 28th edition of Gulfood will continue to unite food and beverage communities around the world',
    image: 'https://images.unsplash.com/photo-1556761175516-6c0f6f954c3f?w=800&q=80',
    attendees: '8000+',
    featured: true,
  },
  {
    id: '5',
    title: 'The 2 Summit',
    category: 'Tourism Summit',
    location: 'Zanzibar',
    country: 'Tanzania',
    date: '23-24 February',
    description: 'The first Tourism Summit for Zanzibar Tourism stakeholders to connect with domestic and East African investors.',
    image: 'https://images.unsplash.com/photo-1589197331516-6c0f6f95e047?w=800&q=80',
    attendees: '2000+',
  },
  {
    id: '6',
    title: 'ITB Berlin 2023',
    category: 'Travel & Tourism',
    location: 'Berlin',
    country: 'Germany',
    date: '7-9 March 2023',
    description: 'Be there when tourism professionals and key players from the global travel industry are reunited in Berlin!',
    image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80',
    attendees: '15000+',
    featured: true,
  },
]

const categories = ['All Events', 'Trade Exhibition', 'Travel & Tourism', 'Food & Beverage', 'Tourism Summit']

export default function BusinessTravelPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Events')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const filteredEvents = selectedCategory === 'All Events' 
    ? events 
    : events.filter(event => event.category === selectedCategory)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] lg:h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center animate-slow-zoom scale-105"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-primary/30" />
        
        <div className="container relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 backdrop-blur-sm px-4 py-2 border border-primary/30">
            <Briefcase className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-white">Business Events & Conferences</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-2xl max-w-4xl leading-tight">
            Connect at <span className="text-primary">Global Events</span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-white/90 drop-shadow-lg max-w-2xl">
            Join industry leaders, network with professionals, and discover opportunities at premier business events worldwide
          </p>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 shadow-lg shadow-primary/30">
              View All Events
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 rounded-full px-8">
              <Building2 className="mr-2 h-4 w-4" />
              For Exhibitors
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">150+</div>
              <div className="text-sm text-muted-foreground">Global Events</div>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">50K+</div>
              <div className="text-sm text-muted-foreground">Attendees</div>
            </div>
            <div className="text-center">
              <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">200+</div>
              <div className="text-sm text-muted-foreground">Exhibitors</div>
            </div>
            <div className="text-center">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">40+</div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Upcoming Events & Conferences
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover opportunities to expand your network and grow your business
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className={cn('group relative overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1', event.featured && 'ring-2 ring-primary/20')}>
                {event.featured && (
                  <div className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    Featured
                  </div>
                )}

                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    fill
                    className={cn(
                      'object-cover transition-transform duration-500',
                      hoveredCard === event.id && 'scale-110'
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {event.attendees && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                      <Users className="h-3.5 w-3.5 text-white" />
                      <span className="text-xs font-medium text-white">{event.attendees} attendees</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-2 text-xs font-semibold text-primary uppercase tracking-wide">
                    {event.category}
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{event.location}, {event.country}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{event.date}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all bg-transparent"
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Expand Your Business Network?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of professionals at our upcoming events and discover new opportunities for growth
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full px-8">
                Register for Events
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent rounded-full px-8">
                Contact Our Team
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
