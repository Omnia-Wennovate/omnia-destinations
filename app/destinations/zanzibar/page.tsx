'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Star,
  Car,
  Coffee,
  Waves,
  Landmark,
  ChevronDown,
  Shield,
  Check,
  X,
  Anchor,
  UtensilsCrossed,
  Fish,
  Leaf,
  Clock,
  Plane,
  Hotel,
} from 'lucide-react'

/* ─────────────────────────────────────── Data ─────────────────────────────────────── */

const quickInfoCards = [
  { icon: Calendar, label: '5 Days', sub: '4 Nights', color: '#10b981' },
  { icon: Car,      label: 'Private Tours', sub: 'Fully Guided', color: '#e5a832' },
  { icon: Plane,    label: 'Airport Transfers', sub: 'Included', color: '#3b82f6' },
  { icon: Hotel,    label: '4-Star Hotels', sub: 'Premium Stays', color: '#a855f7' },
  { icon: Coffee,   label: 'Breakfast', sub: 'Daily Included', color: '#f97316' },
  { icon: Anchor,   label: 'Private Boats', sub: 'Island Access', color: '#ec4899' },
]

const experienceCards = [
  {
    title: 'Dolphin Tour',
    description: 'Swim alongside wild dolphins in the turquoise Indian Ocean off Mnemba Atoll',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    icon: Fish,
    color: '#3b82f6',
  },
  {
    title: 'Mnemba Island',
    description: 'Pristine white-sand strip surrounded by crystal waters and vibrant coral reefs',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    icon: Waves,
    color: '#10b981',
  },
  {
    title: 'Turtle Swimming',
    description: 'Dive into the Salaam Cave Aquarium and swim face-to-face with sea turtles',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    icon: Waves,
    color: '#06b6d4',
  },
  {
    title: 'Prison Island',
    description: 'Discover historic ruins and giant Aldabra tortoises on this legendary island',
    image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&q=80',
    icon: Landmark,
    color: '#e5a832',
  },
  {
    title: 'Spice Farm',
    description: 'Walk through lush tropical gardens and taste Zanzibar\'s legendary exotic spices',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    icon: Leaf,
    color: '#84cc16',
  },
  {
    title: 'The Rock Restaurant',
    description: 'Dine in the iconic ocean-perched restaurant — one of the world\'s most unique settings',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    icon: UtensilsCrossed,
    color: '#f97316',
  },
]

const itinerary = [
  {
    day: 'Day 1',
    title: 'Arrival — Transfer & Relax',
    icon: Plane,
    color: '#3b82f6',
    time: 'Upon Arrival',
    services: [
      'Private meet-and-greet at Zanzibar Airport',
      'Luxury private vehicle transfer to hotel',
      'Hotel check-in and welcome refreshments',
      'Leisure afternoon — rest and explore the resort',
      'No rush — today is yours to unwind',
    ],
    tags: ['Airport Transfer', 'Hotel Check-in', 'Leisure Day'],
    image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&q=80',
    highlight: 'Private meet-and-greet service upon landing',
  },
  {
    day: 'Day 2',
    title: 'Stone Town & Mnemba Island — Dolphin Tour',
    icon: Waves,
    color: '#10b981',
    time: 'Pickup 08:30 AM',
    services: [
      'Private boat to pristine Mnemba Island',
      'White sand beach swim and relaxation',
      'Wild dolphin watching in the Indian Ocean',
      'Snorkelling among vibrant coral reefs',
      'Fresh seafood lunch on the water',
      'Guided Stone Town cultural walking tour',
      'Return private transfer to hotel',
    ],
    tags: ['Mnemba Island', 'Dolphin Watch', 'Snorkelling', 'Stone Town'],
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    highlight: 'Wild dolphin encounter & Mnemba Island white sands',
  },
  {
    day: 'Day 3',
    title: 'Salaam Cave Aquarium + The Rock Restaurant',
    icon: Fish,
    color: '#06b6d4',
    time: 'Morning Departure',
    services: [
      'Private transfer to Salaam Cave Aquarium',
      'Swim with gentle sea turtles up close',
      'Professional guide throughout',
      'Private boat ride to The Rock Restaurant',
      'Iconic ocean-perched dining experience',
      'Return private boat transfer to hotel',
    ],
    tags: ['Turtle Swimming', 'Cave Aquarium', 'The Rock Restaurant', 'Private Boat'],
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    highlight: 'Dining at The Rock — one of the world\'s most iconic restaurants',
  },
  {
    day: 'Day 4',
    title: 'Spice Farm & Prison Island',
    icon: Leaf,
    color: '#84cc16',
    time: 'Morning Departure',
    services: [
      'Guided walk through aromatic spice plantation',
      'Tropical fruit tasting experience',
      'Traditional farm lunch with local cuisine',
      'Private boat ride to Prison Island',
      'Giant Aldabra tortoise encounter',
      'Free time to explore and relax on the island',
      'Return transfer to hotel',
    ],
    tags: ['Spice Farm', 'Fruit Tasting', 'Prison Island', 'Giant Tortoises'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    highlight: 'Giant tortoise sanctuary & Zanzibar spice heritage',
  },
  {
    day: 'Day 5',
    title: 'Departure — Farewell Transfer',
    icon: Plane,
    color: '#e5a832',
    time: 'Scheduled by Flight',
    services: [
      'Leisurely hotel checkout',
      'Private vehicle pickup from hotel',
      'Comfortable airport transfer',
      'Premium departure service',
      'Safe travels and thank you for choosing OMNIA',
    ],
    tags: ['Hotel Checkout', 'Airport Transfer', 'Departure'],
    image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&q=80',
    highlight: 'Smooth private departure — no stress, no rush',
  },
]

const included = [
  'Return international flights',
  '4 nights in 4-star hotel accommodation',
  'Daily breakfast at hotel',
  'All guided tours as per itinerary',
  'Private airport transfers (both ways)',
  'Professional licensed local guide',
  'Private boats for island excursions',
  'Seafood lunch on Day 2',
  'Farm lunch on Day 4',
]

const excluded = [
  'Tourist visa fee (if applicable)',
  'Travel insurance (strongly recommended)',
  'Personal expenses and souvenirs',
  'Tips and gratuities',
  'Optional evening activities',
]

const highlights = [
  {
    title: 'Mnemba Island',
    description: 'Exclusive private island strip — snorkelling, dolphins, and white sand paradise',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    icon: Waves,
  },
  {
    title: 'Stone Town',
    description: 'UNESCO World Heritage City of rich culture, Arab architecture and spice bazaars',
    image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&q=80',
    icon: Landmark,
  },
  {
    title: 'Prison Island',
    description: 'Historic island sanctuary home to giant Aldabra tortoises over 100 years old',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    icon: Shield,
  },
  {
    title: 'Turtle Cave',
    description: 'The Salaam Cave Aquarium — swim face-to-face with beautiful sea turtles',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    icon: Fish,
  },
  {
    title: 'Spice Farm',
    description: 'Wander through lush Zanzibar spice plantations — cloves, vanilla, cinnamon and more',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    icon: Leaf,
  },
  {
    title: 'The Rock Restaurant',
    description: 'Perched on a rock in the Indian Ocean — one of the world\'s most spectacular dining venues',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    icon: UtensilsCrossed,
  },
]

/* ────────────────────────────── Utility Components ─────────────────────────────────── */

function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-70px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 44 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#10b981] text-xs font-bold tracking-[0.25em] uppercase mb-3">
      {children}
    </p>
  )
}

/* ──────────────────────────────────── Page ──────────────────────────────────────── */

export default function ZanzibarPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '32%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])
  const heroScale   = useTransform(scrollYProgress, [0, 1], [1, 1.1])

  const [openDay, setOpenDay] = useState<number | null>(0)

  const { scrollYProgress: pageProgress } = useScroll()
  const barWidth = useTransform(pageProgress, [0, 1], ['0%', '100%'])

  return (
    <div className="bg-[#050a0a] overflow-x-hidden">
      {/* ─── Scroll Progress Bar ─── */}
      <motion.div
        className="fixed top-0 left-0 h-[3px] z-[999] origin-left"
        style={{ width: barWidth, background: 'linear-gradient(90deg, #10b981, #06b6d4, #3b82f6)' }}
      />

      {/* ══════════════ HERO ══════════════ */}
      <section
        ref={heroRef}
        className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden"
      >
        {/* Parallax image */}
        <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
          <Image
            src="https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1920&q=90"
            alt="Zanzibar, Tanzania"
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/35" />

        {/* Teal ambient orbs */}
        <motion.div
          className="absolute top-[15%] right-[12%] w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[18%] left-[8%] w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />

        {/* Hero Content */}
        <motion.div
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
          style={{ opacity: heroOpacity }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="inline-flex items-center gap-2 mb-7 px-5 py-2 rounded-full border border-white/20 backdrop-blur-sm"
            style={{ background: 'rgba(16,185,129,0.13)' }}
          >
            <Star className="w-4 h-4 text-[#10b981] fill-[#10b981]" />
            <span className="text-white/90 text-xs font-semibold tracking-[0.25em] uppercase">
              Premium Island Experience
            </span>
            <Star className="w-4 h-4 text-[#10b981] fill-[#10b981]" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.35 }}
            className="text-6xl sm:text-7xl lg:text-[7rem] font-bold text-white leading-none tracking-tight mb-3"
            style={{ textShadow: '0 6px 40px rgba(0,0,0,0.55)' }}
          >
            Zanzibar
          </motion.h1>

          {/* Subtitle divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.65, delay: 0.75 }}
            className="flex items-center justify-center gap-3 mb-5"
          >
            <div
              className="h-px flex-1 max-w-[100px]"
              style={{ background: 'linear-gradient(to right, transparent, rgba(16,185,129,0.75))' }}
            />
            <span className="text-[#10b981] text-xs font-bold tracking-[0.32em] uppercase">Tanzania</span>
            <div
              className="h-px flex-1 max-w-[100px]"
              style={{ background: 'linear-gradient(to left, transparent, rgba(16,185,129,0.75))' }}
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.95 }}
            className="text-white/75 text-lg sm:text-xl lg:text-2xl font-light max-w-xl mx-auto leading-relaxed"
          >
            5 Days Luxury Island Escape
          </motion.p>

          {/* Glassmorphism info pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 1.25 }}
            className="flex flex-wrap justify-center gap-3 mt-9"
          >
            {['4 Nights', 'Private Tours', 'Airport Transfers', '4-Star Hotels'].map((item, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full text-sm font-medium text-white/90 border border-white/15 backdrop-blur-md"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                {item}
              </span>
            ))}
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="absolute bottom-[-175px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-white/40 text-[10px] tracking-[0.25em] uppercase">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="w-6 h-10 rounded-full border border-white/25 flex items-start justify-center pt-2"
            >
              <div className="w-1 h-2 bg-white/55 rounded-full" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════ QUICK INFO CARDS ══════════════ */}
      <section className="py-20 bg-gradient-to-b from-[#050a0a] to-[#0a1210]">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-14">
              <SectionLabel>The Details</SectionLabel>
              <h2 className="text-3xl lg:text-5xl font-bold text-white">Your Escape at a Glance</h2>
            </div>
          </FadeUp>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickInfoCards.map((card, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -9, scale: 1.05 }}
                  transition={{ duration: 0.25 }}
                  className="group relative rounded-2xl p-5 text-center cursor-default overflow-hidden border border-white/5"
                  style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
                >
                  {/* Glow bg */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at center, ${card.color}15, transparent 70%)`,
                      boxShadow: `0 0 40px ${card.color}25`,
                    }}
                  />
                  <div
                    className="relative w-11 h-11 mx-auto mb-3 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.color}1e` }}
                  >
                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <p className="relative text-white font-bold text-sm leading-tight">{card.label}</p>
                  <p className="relative text-white/45 text-xs mt-1">{card.sub}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ QUICK EXPERIENCE CARDS ══════════════ */}
      <section className="py-24 bg-[#06100d]">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <SectionLabel>Curated Moments</SectionLabel>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">6 Unforgettable Experiences</h2>
              <p className="text-white/45 max-w-2xl mx-auto text-base">
                Each experience handpicked to give you the full soul of Zanzibar
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {experienceCards.map((exp, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <motion.div
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-default"
                  whileHover={{ y: -7 }}
                  transition={{ duration: 0.32 }}
                >
                  {/* Image with zoom */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                      <Image src={exp.image} alt={exp.title} fill className="object-cover" />
                    </div>
                  </div>

                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(to top, ${exp.color}55, transparent 60%)` }}
                  />

                  {/* Icon badge */}
                  <div
                    className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm"
                    style={{ background: 'rgba(0,0,0,0.45)' }}
                  >
                    <exp.icon className="w-4 h-4 text-white/80" />
                  </div>

                  {/* Number badge */}
                  <div
                    className="absolute top-4 left-4 text-xs font-bold px-2 py-1 rounded-md"
                    style={{ background: `${exp.color}cc`, color: '#fff' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-xl mb-2 group-hover:text-[#10b981] transition-colors duration-300">
                      {exp.title}
                    </h3>
                    <p className="text-white/0 group-hover:text-white/80 text-sm leading-relaxed transition-all duration-500 translate-y-3 group-hover:translate-y-0">
                      {exp.description}
                    </p>
                  </div>

                  {/* Border glow on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-white/20 transition-colors duration-400"
                  />
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ INTERACTIVE ITINERARY TIMELINE ══════════════ */}
      <section className="py-24 bg-[#050a0a]">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <FadeUp>
            <div className="text-center mb-16">
              <SectionLabel>Day by Day</SectionLabel>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Your Zanzibar Itinerary</h2>
              <p className="text-white/45 max-w-xl mx-auto">
                5 extraordinary days crafted to immerse you in the magic of the Spice Island
              </p>
            </div>
          </FadeUp>

          <div className="relative">
            {/* Vertical spine */}
            <div className="absolute left-6 lg:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#10b981]/70 via-[#06b6d4]/40 to-transparent" />

            <div className="space-y-4">
              {itinerary.map((item, i) => {
                const isOpen = openDay === i
                return (
                  <FadeUp key={i} delay={i * 0.06}>
                    <div className="relative pl-16 lg:pl-20">
                      {/* Timeline dot */}
                      <motion.div
                        className="absolute left-[10px] lg:left-[14px] top-6 w-7 h-7 rounded-full border-2 flex items-center justify-center z-10"
                        style={{
                          borderColor: item.color,
                          background: isOpen ? item.color : '#050a0a',
                        }}
                        animate={{ scale: isOpen ? 1.2 : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <item.icon
                          className="w-3 h-3"
                          style={{ color: isOpen ? '#000' : item.color }}
                        />
                      </motion.div>

                      {/* Card */}
                      <motion.div
                        className="rounded-2xl overflow-hidden border cursor-pointer"
                        style={{
                          background: isOpen
                            ? `${item.color}08`
                            : 'rgba(255,255,255,0.025)',
                          borderColor: isOpen
                            ? `${item.color}45`
                            : 'rgba(255,255,255,0.06)',
                        }}
                        whileHover={{ borderColor: `${item.color}30` }}
                        onClick={() => setOpenDay(isOpen ? null : i)}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 lg:p-6">
                          <div className="flex items-center gap-4 min-w-0">
                            <span
                              className="shrink-0 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                              style={{ background: `${item.color}20`, color: item.color }}
                            >
                              {item.day}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-white font-semibold text-base lg:text-lg leading-snug truncate">
                                {item.title}
                              </h3>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-white/35 shrink-0" />
                                <span className="text-white/40 text-xs">{item.time}</span>
                              </div>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="shrink-0 ml-3"
                          >
                            <ChevronDown className="w-5 h-5 text-white/35" />
                          </motion.div>
                        </div>

                        {/* Expanded */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <div className="px-5 lg:px-6 pb-6 grid md:grid-cols-2 gap-6">
                                {/* Left: services + highlight */}
                                <div>
                                  <ul className="space-y-2 mb-4">
                                    {item.services.map((svc, si) => (
                                      <li key={si} className="flex items-start gap-3">
                                        <Check
                                          className="w-4 h-4 shrink-0 mt-0.5"
                                          style={{ color: item.color }}
                                        />
                                        <span className="text-white/70 text-sm leading-relaxed">
                                          {svc}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>

                                  {/* Highlight badge */}
                                  <div
                                    className="flex items-start gap-3 p-3 rounded-xl"
                                    style={{
                                      background: `${item.color}10`,
                                      border: `1px solid ${item.color}25`,
                                    }}
                                  >
                                    <Star
                                      className="w-4 h-4 shrink-0 mt-0.5 fill-current"
                                      style={{ color: item.color }}
                                    />
                                    <p
                                      className="text-sm font-medium"
                                      style={{ color: item.color }}
                                    >
                                      {item.highlight}
                                    </p>
                                  </div>

                                  {/* Tags */}
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    {item.tags.map((tag, ti) => (
                                      <span
                                        key={ti}
                                        className="text-xs px-3 py-1 rounded-full text-white/55"
                                        style={{ background: 'rgba(255,255,255,0.06)' }}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Right: image */}
                                <div className="relative h-48 md:h-auto rounded-xl overflow-hidden">
                                  <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </FadeUp>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ INCLUDED / EXCLUDED ══════════════ */}
      <section className="py-24 bg-[#06100d]">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeUp>
            <div className="text-center mb-14">
              <SectionLabel>What's Covered</SectionLabel>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Included &amp; Excluded</h2>
              <p className="text-white/45 max-w-xl mx-auto">
                Complete transparency — know exactly what your luxury package covers
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Included */}
            <FadeUp delay={0.1}>
              <motion.div
                className="rounded-2xl p-6 border h-full"
                style={{
                  background: 'rgba(16,185,129,0.05)',
                  borderColor: 'rgba(16,185,129,0.2)',
                }}
                whileHover={{ borderColor: 'rgba(16,185,129,0.4)' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.18)' }}
                  >
                    <Check className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">What's Included</h3>
                    <p className="text-[#10b981] text-xs font-medium">All covered for you</p>
                  </div>
                </div>
                <div className="h-px mb-5" style={{ background: 'rgba(16,185,129,0.15)' }} />
                <ul className="space-y-3">
                  {included.map((item, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06, duration: 0.4 }}
                    >
                      <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                      <span className="text-white/75 text-sm leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </FadeUp>

            {/* Excluded */}
            <FadeUp delay={0.2}>
              <motion.div
                className="rounded-2xl p-6 border h-full"
                style={{
                  background: 'rgba(239,68,68,0.04)',
                  borderColor: 'rgba(239,68,68,0.15)',
                }}
                whileHover={{ borderColor: 'rgba(239,68,68,0.35)' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.15)' }}
                  >
                    <X className="w-5 h-5 text-[#ef4444]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Not Included</h3>
                    <p className="text-[#ef4444] text-xs font-medium">Plan for these extras</p>
                  </div>
                </div>
                <div className="h-px mb-5" style={{ background: 'rgba(239,68,68,0.12)' }} />
                <ul className="space-y-3">
                  {excluded.map((item, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                    >
                      <X className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
                      <span className="text-white/65 text-sm leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Tip */}
                <div
                  className="mt-5 p-3 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  <p className="text-white/55 text-xs leading-relaxed">
                    💡 We recommend purchasing travel insurance before departure. Our team can advise on suitable providers.
                  </p>
                </div>
              </motion.div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════ DESTINATION HIGHLIGHTS ══════════════ */}
      <section className="py-24 bg-[#050a0a]">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <SectionLabel>Must-See</SectionLabel>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Destination Highlights</h2>
              <p className="text-white/45 max-w-2xl mx-auto">
                Six iconic locations that define the Zanzibar experience
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {highlights.map((h, i) => (
              <FadeUp key={i} delay={i * 0.07}>
                <motion.div
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-default"
                  whileHover={{ y: -6, boxShadow: '0 24px 60px rgba(16,185,129,0.12)' }}
                  transition={{ duration: 0.32 }}
                >
                  {/* Image zoom */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                      <Image src={h.image} alt={h.title} fill className="object-cover" />
                    </div>
                  </div>

                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'linear-gradient(to top, rgba(16,185,129,0.35), transparent 60%)' }}
                  />

                  {/* Icon */}
                  <div
                    className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm"
                    style={{ background: 'rgba(0,0,0,0.4)' }}
                  >
                    <h.icon className="w-4 h-4 text-white/80" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#10b981] transition-colors duration-300">
                      {h.title}
                    </h3>
                    <p className="text-white/0 group-hover:text-white/75 text-sm leading-relaxed transition-all duration-500 translate-y-3 group-hover:translate-y-0">
                      {h.description}
                    </p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CLOSING BANNER ══════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85"
            alt="Zanzibar beach"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/72" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, transparent 50%, rgba(6,182,212,0.09) 100%)',
            }}
          />
        </div>

        <FadeUp>
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <motion.div
              className="inline-block mb-6"
              animate={{ rotate: [0, 6, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-5xl">🌊</span>
            </motion.div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-5 leading-tight">
              Zanzibar Awaits<br />
              <span style={{ color: '#10b981' }}>Your Paradise</span>
            </h2>
            <p className="text-white/65 text-lg leading-relaxed mb-9">
              From the powder-white shores of Mnemba to the ancient streets of Stone Town — every
              breath of Zanzibar air carries five centuries of magic.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Ocean', 'Culture', 'Wildlife', 'Spices', 'History', 'Luxury'].map((tag, i) => (
                <motion.span
                  key={i}
                  className="px-5 py-2 rounded-full text-sm font-medium border border-white/18 text-white/75 backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  whileHover={{ scale: 1.06, borderColor: 'rgba(16,185,129,0.5)', color: '#10b981' }}
                  transition={{ duration: 0.18 }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: i * 0.09, duration: 0.55 },
                  }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </div>
        </FadeUp>
      </section>
    </div>
  )
}
