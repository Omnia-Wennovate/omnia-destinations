"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Heart, Share2 } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

interface Testimonial {
  id: number
  name: string
  avatar?: string
  badge?: string          // e.g. "Local Guide"
  reviews: number
  photos: number
  rating: number          // 1–5
  time: string            // e.g. "4 months ago"
  text: string
  images?: string[]       // optional travel photos (max 3)
  likes: number
}

// ── Data ───────────────────────────────────────────────────────────────────────

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Elias Demisse",
    reviews: 2,
    photos: 1,
    rating: 5,
    time: "4 months ago",
    text: "Omnia Business and leisure Travel is the best of the best. The team made every detail feel effortless — from flights to accommodation. Truly a world-class agency.",
    likes: 3,
  },
  {
    id: 2,
    name: "Meski Abebe",
    reviews: 1,
    photos: 0,
    rating: 5,
    time: "2 years ago",
    text: "I was pleased with all Omnia has done, to facilitate the trip I was in. I have traveled far and beyond, but the one I had with you is the best service. Hope to travel more with you guys.",
    likes: 2,
  },
  {
    id: 3,
    name: "Netsanet Zenebe Worku",
    badge: "Local Guide",
    reviews: 35,
    photos: 88,
    rating: 5,
    time: "2 years ago",
    text: "We got the best service on our cruise ship trip. Everything was organized perfectly and the Omnia team was always available. Highly recommended to anyone who loves premium travel.",
    likes: 2,
  },
  {
    id: 4,
    name: "Sheila Del Gaudio",
    reviews: 8,
    photos: 5,
    rating: 5,
    time: "a month ago",
    text: "My first time using Omnia Travel Agency was excellent. They were always checking on us and making sure everything was going well. The whole holiday was very well organized. Will definitely book again!",
    likes: 5,
  },
  {
    id: 5,
    name: "Yohannes Tesfaye",
    reviews: 4,
    photos: 2,
    rating: 5,
    time: "6 months ago",
    text: "An absolutely outstanding experience from start to finish. Omnia handled every detail with professionalism and warmth. The Seychelles trip was beyond our wildest expectations.",
    likes: 7,
  },
  {
    id: 6,
    name: "Rahel Haile",
    reviews: 3,
    photos: 6,
    rating: 5,
    time: "1 year ago",
    text: "Best travel agency in Ethiopia, hands down. The Dubai package was flawlessly planned. Every hotel, every transfer, every activity was perfectly timed. Omnia truly cares about its clients.",
    likes: 4,
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-[#e5a832]" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function Avatar({ name, src }: { name: string; src?: string }) {
  const initial = name.charAt(0).toUpperCase()

  if (src) {
    return (
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-[#e5a832]/30">
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="44px"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
        />
      </div>
    )
  }

  // Deterministic color based on name for visual variety
  const colors = [
    "bg-slate-600", "bg-teal-600", "bg-violet-600",
    "bg-rose-600", "bg-amber-600", "bg-sky-600",
  ]
  const colorClass = colors[name.charCodeAt(0) % colors.length]

  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white text-lg font-semibold ${colorClass} ring-2 ring-[#e5a832]/30`}>
      {initial}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function TestimonialsSlider() {
  const [active, setActive] = useState(0)
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = TESTIMONIALS.length

  const go = useCallback(
    (dir: "prev" | "next") => {
      setActive((prev) => (dir === "next" ? (prev + 1) % total : (prev - 1 + total) % total))
    },
    [total]
  )

  // Auto-slide
  useEffect(() => {
    if (paused) return
    intervalRef.current = setInterval(() => go("next"), 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [go, paused])

  const toggleLike = (id: number) =>
    setLikedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // Visible indices: prev, active, next (cyclic)
  const getIdx = (offset: number) => (active + offset + total) % total

  return (
    <section
      className="py-16 md:py-24 bg-muted/30 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#e5a832]">
            What Our Clients Say
          </p>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Trusted by <span className="text-[#e5a832]">Travelers</span> Worldwide
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            Real experiences from real guests who journeyed with Omnia — the luxury travel agency that cares.
          </p>
        </div>

        {/* Slider Track */}
        <div className="relative flex items-center justify-center gap-4 md:gap-6">
          {/* Left Arrow */}
          <button
            onClick={() => go("prev")}
            aria-label="Previous testimonial"
            className="z-20 shrink-0 rounded-full border border-border bg-card p-2.5 shadow-md transition-all hover:border-[#e5a832] hover:text-[#e5a832] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#e5a832]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Cards */}
          <div className="flex w-full max-w-5xl items-center justify-center gap-4 md:gap-6">
            {/* Prev card — hidden on mobile */}
            <div className="hidden md:block w-full max-w-sm transition-all duration-500 ease-in-out scale-95 opacity-50 blur-[1px] pointer-events-none select-none">
              <TestimonialCard
                testimonial={TESTIMONIALS[getIdx(-1)]}
                isActive={false}
                liked={likedIds.has(TESTIMONIALS[getIdx(-1)].id)}
                onLike={toggleLike}
              />
            </div>

            {/* Active card */}
            <div className="w-full max-w-sm md:max-w-md transition-all duration-500 ease-in-out scale-100 opacity-100 z-10">
              <TestimonialCard
                testimonial={TESTIMONIALS[active]}
                isActive={true}
                liked={likedIds.has(TESTIMONIALS[active].id)}
                onLike={toggleLike}
              />
            </div>

            {/* Next card — hidden on mobile */}
            <div className="hidden md:block w-full max-w-sm transition-all duration-500 ease-in-out scale-95 opacity-50 blur-[1px] pointer-events-none select-none">
              <TestimonialCard
                testimonial={TESTIMONIALS[getIdx(1)]}
                isActive={false}
                liked={likedIds.has(TESTIMONIALS[getIdx(1)].id)}
                onLike={toggleLike}
              />
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => go("next")}
            aria-label="Next testimonial"
            className="z-20 shrink-0 rounded-full border border-border bg-card p-2.5 shadow-md transition-all hover:border-[#e5a832] hover:text-[#e5a832] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#e5a832]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="mt-8 flex items-center justify-center gap-2" role="tablist" aria-label="Testimonial pagination">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to testimonial ${i + 1}`}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#e5a832] ${
                i === active
                  ? "w-7 h-2.5 bg-[#e5a832]"
                  : "w-2.5 h-2.5 bg-border hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>

        {/* Trust badge */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <StarRating rating={5} />
          <span className="font-medium text-foreground">5.0</span>
          <span>·</span>
          <span>Rated on Google Reviews</span>
        </div>
      </div>
    </section>
  )
}

// ── Card Sub-component ─────────────────────────────────────────────────────────

function TestimonialCard({
  testimonial: t,
  isActive,
  liked,
  onLike,
}: {
  testimonial: Testimonial
  isActive: boolean
  liked: boolean
  onLike: (id: number) => void
}) {
  const metaParts: string[] = []
  if (t.badge) metaParts.push(t.badge)
  if (t.reviews) metaParts.push(`${t.reviews} review${t.reviews !== 1 ? "s" : ""}`)
  if (t.photos) metaParts.push(`${t.photos} photo${t.photos !== 1 ? "s" : ""}`)
  const meta = metaParts.join(" · ")

  return (
    <article
      className={`
        rounded-3xl bg-card p-6 flex flex-col gap-4
        border border-border
        transition-all duration-500 ease-in-out
        ${isActive
          ? "shadow-2xl ring-1 ring-[#e5a832]/20"
          : "shadow-md"
        }
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={t.name} src={t.avatar} />
          <div>
            <p className="font-semibold text-card-foreground leading-tight">{t.name}</p>
            {meta && (
              <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>
            )}
          </div>
        </div>

        {/* Google-style three-dot menu (decorative) */}
        <button
          aria-label="More options"
          className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Rating + time */}
      <div className="flex items-center gap-2">
        <StarRating rating={t.rating} />
        <span className="text-xs text-muted-foreground">{t.time}</span>
      </div>

      {/* Review text */}
      <p className="text-sm leading-relaxed text-card-foreground line-clamp-4">
        {t.text}
      </p>

      {/* Optional travel images */}
      {t.images && t.images.length > 0 && (
        <div className={`grid gap-2 ${t.images.length === 1 ? "grid-cols-1" : t.images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {t.images.slice(0, 3).map((src, i) => (
            <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
              <Image
                src={src}
                alt={`${t.name}'s travel photo ${i + 1}`}
                fill
                loading="lazy"
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 768px) 33vw, 15vw"
                onError={(e) => {
                  const parent = (e.target as HTMLImageElement).parentElement
                  if (parent) parent.style.display = "none"
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-4 pt-1 border-t border-border">
        <button
          onClick={() => onLike(t.id)}
          aria-label={liked ? "Unlike" : "Like"}
          aria-pressed={liked}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-[#e5a832] focus:outline-none"
        >
          <Heart
            className={`h-4 w-4 transition-all duration-200 ${liked ? "fill-red-500 text-red-500 scale-110" : ""}`}
          />
          <span className={liked ? "text-red-500 font-medium" : ""}>
            {t.likes + (liked ? 1 : 0)}
          </span>
        </button>

        <button
          aria-label="Share review"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-[#e5a832] focus:outline-none"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}
