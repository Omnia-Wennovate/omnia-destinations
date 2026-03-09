'use client'

import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollReveal } from '@/components/scroll-reveal'
import { Search, MapPin, Clock } from 'lucide-react'
import ShinyText from '@/components/shiny-text'

const DESTINATIONS = ['Ethiopia', 'Dubai', 'Indonesia', 'Kenya']
const DURATIONS = ['1 week', '2 weeks', '1 month', '3 months']

export function SearchSection() {
  const [keywords, setKeywords] = useState('')
  const [destination, setDestination] = useState('')
  const [duration, setDuration] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSearch = () => {
    console.log('Searching for:', keywords, destination, duration)
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden min-h-[85vh] flex items-end justify-center pb-16">
        {/* Background Image with Ken Burns Effect */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-zoom"
            style={{
              backgroundImage: "url('/images/hero-background.jpg')",
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-background" />
        </div>

        {/* Hero Content */}
        <div className="container relative z-10 mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight bg-gradient-to-r from-white to-[#e5a832] bg-clip-text text-transparent">
              OMNIA
            </h1>
            <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            <p className="text-xl sm:text-2xl md:text-3xl font-light tracking-wide">
              <span className="text-white/90">Business and</span>{' '}
              <span className="text-amber-400/90">Leisure</span>{' '}
              <span className="text-white/90">Travel</span>
            </p>
            <p className="text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed pt-2">
              <span className="text-white/95">Your journey begins with us — where every destination feels like </span>
              <span className="text-amber-300 font-normal">home</span>
            </p>
          </div>
        </div>
      </section>

      {/* Tagline Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal direction="up" delay={0}>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight text-balance">
                Explore the world with curated travel experiences tailored just for you
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
                From business trips to dream vacations, we make every journey unforgettable.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Personalized Itineraries</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Best Price Guarantee</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <ScrollReveal direction="up" delay={0}>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Destinations</div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.1}>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">10K+</div>
                <div className="text-sm text-muted-foreground">Happy Travelers</div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.2}>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">50+</div>
                <div className="text-sm text-muted-foreground">Tour Packages</div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.3}>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  )
}
