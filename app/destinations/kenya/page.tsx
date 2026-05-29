'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Star,
  Car,
  Waves,
  ChevronDown,
  Check,
  X,
  Fish,
  Plane,
  Hotel,
  Shield,
  DollarSign,
  Backpack,
  Sun,
  Anchor,
  Clock,
  Moon,
  Sunset,
} from 'lucide-react'

/* ─────────────────────── Color Palette (warm amber / coral) ─────────────────────── */
const C = {
  primary: '#f59e0b',   // amber
  secondary: '#f97316', // orange
  accent: '#ef4444',    // coral red
  teal: '#14b8a6',
  bg: '#080603',
  bgAlt: '#0e0a04',
  bgCard: '#120e06',
}

/* ───────────────────────────────── Data ────────────────────────────────────────── */

const quickInfoCards = [
  { icon: Hotel,    label: 'Diani Reef Resort', sub: '& Spa', color: C.primary },
  { icon: Anchor,   label: 'Wasini Island', sub: 'Full-Day Tour', color: C.secondary },
  { icon: Fish,     label: 'Dolphin Experience', sub: 'Marine Cruise', color: C.teal },
  { icon: Moon,     label: 'River Dinner', sub: 'Candle-lit', color: '#a78bfa' },
  { icon: Waves,    label: 'Snorkeling', sub: 'Kisite Park', color: '#22d3ee' },
  { icon: Calendar, label: '4 Days', sub: '3 Nights', color: '#10b981' },
]

const experiences = [
  {
    title: 'Wasini Island',
    description: 'A pristine coral island off the southern Kenya coast — village walks, coral gardens, and total serenity',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80',
    icon: Anchor,
    color: C.primary,
  },
  {
    title: 'Kisite Marine Park',
    description: 'World-class snorkelling above vibrant coral reefs teeming with tropical fish and sea turtles',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    icon: Waves,
    color: C.teal,
  },
  {
    title: 'Dolphin Cruise',
    description: 'Sail with wild spinner dolphins in their natural habitat off the Kenyan Indian Ocean coast',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    icon: Fish,
    color: '#22d3ee',
  },
  {
    title: 'Kongo River Dinner',
    description: 'A magical candle-lit riverside dinner after a sunset canoe through mangrove forests',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    icon: Moon,
    color: '#a78bfa',
  },
  {
    title: 'Diani Beach',
    description: 'One of Africa\'s finest white-coral beaches — powder sand, swaying palms, and turquoise waters',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    icon: Sun,
    color: C.secondary,
  },
  {
    title: 'Snorkeling Adventure',
    description: 'Gear up and dive into the crystal-clear Kisite Marine Park for a world-class reef experience',
    image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&q=80',
    icon: Fish,
    color: '#10b981',
  },
]

const itinerary = [
  {
    day: 'Day 1',
    title: 'Arrival — Transfer & Relax',
    icon: Plane,
    color: C.primary,
    time: 'Upon Arrival',
    atmosphere: 'Coastal arrival & resort check-in',
    services: [
      'Welcome at Mombasa Moi International Airport',
      'Private luxury vehicle transfer to Diani',
      'Check-in at Diani Reef Beach Resort & Spa',
      'Leisure time — pool, beach, relaxation',
      'Welcome dinner at hotel restaurant',
    ],
    tags: ['Airport Transfer', 'Resort Check-in', 'Leisure', 'Welcome Dinner'],
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80',
    highlight: 'Private transfer directly to Diani Reef Beach Resort & Spa',
  },
  {
    day: 'Day 2',
    title: 'Wasini Island Full-Day Tour',
    icon: Anchor,
    color: C.teal,
    time: 'Pickup 07:30 AM',
    atmosphere: 'Ocean adventure & Swahili culture',
    services: [
      '07:30 hotel pickup by private vehicle',
      'Dolphin watching in the open Indian Ocean',
      'Marine cruise through Kisite Marine Park',
      'Snorkelling over vibrant coral reefs',
      'Traditional Swahili seafood lunch on Wasini Island',
      'Guided village walk through Wasini community',
      'Return transfer to Diani Reef',
    ],
    tags: ['Dolphin Watch', 'Kisite Marine Park', 'Snorkelling', 'Seafood Lunch', 'Village Walk'],
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    highlight: 'Wild dolphin encounter + snorkelling at Kisite Marine Park',
    whatToBring: ['Swimwear', 'Sunscreen', 'Hat', 'Water Bottle', 'Dry Bag', 'Camera'],
  },
  {
    day: 'Day 3',
    title: 'Kongo River Sundowner Experience',
    icon: Sunset,
    color: '#a78bfa',
    time: 'Pickup 16:20 PM',
    atmosphere: 'Golden hour on the mangrove river',
    services: [
      '16:20 hotel pickup for golden hour experience',
      'Traditional canoe ride along Kongo River',
      'Mangrove forest exploration',
      'Bird watching — kingfishers, herons & more',
      'Photography moments at sunset viewpoints',
      'Elegant candle-lit riverside dinner',
      'Return transfer to Diani Reef',
    ],
    tags: ['Canoe Ride', 'Mangroves', 'Bird Watching', 'Sunset Views', 'Riverside Dinner'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    highlight: 'Candle-lit dinner along the Kongo River at golden hour',
  },
  {
    day: 'Day 4',
    title: 'Departure — Farewell Morning',
    icon: Plane,
    color: C.secondary,
    time: 'Scheduled by Flight',
    atmosphere: 'A calm, memorable farewell',
    services: [
      'Leisurely final morning at the resort',
      'Last beach walk or breakfast by the ocean',
      'Hotel checkout with assistance',
      'Private luxury vehicle transfer to Mombasa Airport',
      'Smooth, stress-free departure experience',
      'Thank you for travelling with OMNIA',
    ],
    tags: ['Final Morning', 'Hotel Checkout', 'Airport Transfer', 'Departure'],
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    highlight: 'Private farewell transfer — no rush, no stress',
  },
]

const included = [
  'Return international flights',
  '3 nights at Diani Reef Beach Resort & Spa',
  'Daily breakfast, seafood lunch (Day 2) & dinners',
  'Private airport transfers (both ways)',
  'Professional licensed tour guide',
  'Wasini Island full-day tour',
  'Kisite Marine Park snorkelling',
  'Dolphin watching experience',
  'Kongo River canoe & sunset dinner',
]

const excluded = [
  'Anything not listed above',
  'Tourist visa fees',
  'Travel insurance (strongly recommended)',
  'Personal expenses and souvenirs',
  'Optional activities outside the itinerary',
]

const practicalInfo = [
  {
    icon: Shield,
    title: 'Travel Documents',
    color: '#3b82f6',
    items: [
      'Valid passport required — minimum 6 months validity',
      'Kenyan e-Visa available online before travel',
      'Print or save all booking confirmations digitally',
      'Keep emergency contact details accessible',
    ],
  },
  {
    icon: Sun,
    title: 'Health & Safety',
    color: '#ef4444',
    items: [
      'Yellow fever vaccination may be required',
      'Malaria prophylaxis strongly recommended',
      'Apply DEET insect repellent at dawn and dusk',
      'Drink bottled water only',
      'Apply sunscreen generously — coastal UV is intense',
    ],
  },
  {
    icon: DollarSign,
    title: 'Currency & Payments',
    color: '#10b981',
    items: [
      'Local currency: Kenyan Shilling (KES)',
      'USD widely accepted at resorts and tours',
      'ATMs available in Diani and Mombasa town',
      'Carry small denomination cash for tips',
    ],
  },
  {
    icon: Backpack,
    title: 'Packing Essentials',
    color: C.primary,
    items: [
      'Light breathable clothing — tropical climate',
      'Swimwear and quick-dry towels',
      'Comfortable walking sandals',
      'Rain jacket for afternoon showers',
      'Binoculars for bird watching on Day 3',
    ],
  },
  {
    icon: Waves,
    title: 'Beach Essentials',
    color: '#22d3ee',
    items: [
      'Reef-safe sunscreen (SPF 50+)',
      'Waterproof dry bag for boat trips',
      'Snorkel mask (provided on tour)',
      'Hat and UV-protective clothing',
      'Underwater camera or GoPro recommended',
    ],
  },
  {
    icon: Car,
    title: 'Transportation Tips',
    color: '#a78bfa',
    items: [
      'All transfers included in your package',
      'Diani Beach is ~90 min from Mombasa Airport',
      'Tuk-tuks are the local taxi in Diani',
      'Use Bolt app for independent rides',
      'Wasini tour departs from Shimoni — guide arranges all',
    ],
  },
]

const highlights = [
  {
    title: 'Diani Beach',
    description: 'Consistently ranked among Africa\'s most beautiful beaches — white coral sand and crystal waters',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    icon: Sun,
  },
  {
    title: 'Kisite Marine Park',
    description: 'Kenya\'s premier marine sanctuary with dolphins, sea turtles, and extraordinary coral gardens',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    icon: Fish,
  },
  {
    title: 'Wasini Island',
    description: 'A living coral island — no cars, ancient ruins, traditional Swahili village, and ocean silence',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80',
    icon: Anchor,
  },
  {
    title: 'Kongo River',
    description: 'Paddle through ancient mangrove tunnels as the sun sets, then dine by candlelight on the riverbank',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    icon: Moon,
  },
  {
    title: 'Diani Reef Resort',
    description: 'Your 4-star coastal sanctuary — lush gardens, ocean pool, and legendary Kenyan hospitality',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    icon: Hotel,
  },
]

/* ─────────────────────── Utility Components ─────────────────────────────────── */

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
  const isInView = useInView(ref, { once: true, margin: '-65px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 42 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#f59e0b] text-xs font-bold tracking-[0.26em] uppercase mb-3">
      {children}
    </p>
  )
}

/* ─────────────────────────────── Page ──────────────────────────────────────── */

export default function KenyaPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])
  const heroScale   = useTransform(scrollYProgress, [0, 1], [1, 1.09])

  const [openDay,  setOpenDay]  = useState<number | null>(0)
  const [openInfo, setOpenInfo] = useState<number | null>(null)

  const { scrollYProgress: pageProgress } = useScroll()
  const barWidth = useTransform(pageProgress, [0, 1], ['0%', '100%'])

  return (
    <div className="overflow-x-hidden" style={{ background: C.bg }}>

      {/* ── Progress Bar ── */}
      <motion.div
        className="fixed top-0 left-0 h-[3px] z-[999] origin-left"
        style={{ width: barWidth, background: `linear-gradient(90deg, ${C.primary}, ${C.secondary}, ${C.accent})` }}
      />

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section
        ref={heroRef}
        className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden"
      >
        <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
          <Image
            src="https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1920&q=90"
            alt="Mombasa, Kenya"
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/88" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

        {/* Warm amber orbs */}
        <motion.div
          className="absolute top-[12%] left-[8%] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${C.primary}18 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[15%] right-[6%] w-[28rem] h-[28rem] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${C.secondary}12 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.14, 1], opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Hero content */}
        <motion.div
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
          style={{ opacity: heroOpacity }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="inline-flex items-center gap-2 mb-7 px-5 py-2 rounded-full border border-white/20 backdrop-blur-sm"
            style={{ background: `${C.primary}18` }}
          >
            <Star className="w-4 h-4 fill-current" style={{ color: C.primary }} />
            <span className="text-white/90 text-xs font-semibold tracking-[0.25em] uppercase">
              Luxury Coastal Safari
            </span>
            <Star className="w-4 h-4 fill-current" style={{ color: C.primary }} />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 38 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.35 }}
            className="text-6xl sm:text-7xl lg:text-[6.5rem] font-bold text-white leading-none tracking-tight mb-3"
            style={{ textShadow: '0 6px 40px rgba(0,0,0,0.6)' }}
          >
            Mombasa
          </motion.h1>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.65, delay: 0.75 }}
            className="flex items-center justify-center gap-3 mb-5"
          >
            <div className="h-px flex-1 max-w-[110px]"
              style={{ background: `linear-gradient(to right, transparent, ${C.primary}90)` }} />
            <span className="text-xs font-bold tracking-[0.32em] uppercase" style={{ color: C.primary }}>Kenya</span>
            <div className="h-px flex-1 max-w-[110px]"
              style={{ background: `linear-gradient(to left, transparent, ${C.primary}90)` }} />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.95 }}
            className="text-white/75 text-lg sm:text-xl lg:text-2xl font-light max-w-xl mx-auto leading-relaxed mb-10"
          >
            3 Nights · 4 Days Luxury Coastal Escape
          </motion.p>

          {/* Glassmorphism floating cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 1.2 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {['Diani Reef Resort', 'Wasini Island Tour', 'Dolphin Experience', 'Candle-lit Dinner', 'Snorkeling'].map(
              (item, i) => (
                <motion.span
                  key={i}
                  className="px-4 py-2 rounded-full text-sm font-medium text-white/88 border border-white/15 backdrop-blur-md"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                  whileHover={{ scale: 1.06, borderColor: `${C.primary}60` }}
                  transition={{ duration: 0.18 }}
                >
                  {item}
                </motion.span>
              )
            )}
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9 }}
            className="absolute bottom-[-180px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-white/38 text-[10px] tracking-[0.25em] uppercase">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="w-6 h-10 rounded-full border border-white/22 flex items-start justify-center pt-2"
            >
              <div className="w-1 h-2 bg-white/50 rounded-full" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════ QUICK INFO CARDS ══════════════════════ */}
      <section className="py-20" style={{ background: `linear-gradient(to bottom, ${C.bg}, ${C.bgAlt})` }}>
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-14">
              <Label>The Details</Label>
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
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at center, ${card.color}18, transparent 70%)` }}
                  />
                  <div className="relative w-11 h-11 mx-auto mb-3 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.color}22` }}>
                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <p className="relative text-white font-bold text-sm leading-tight">{card.label}</p>
                  <p className="relative text-white/42 text-xs mt-1">{card.sub}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ EXPERIENCE SHOWCASE ══════════════════════ */}
      <section className="py-24" style={{ background: C.bgCard }}>
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <Label>Curated Experiences</Label>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">6 Unforgettable Moments</h2>
              <p className="text-white/42 max-w-xl mx-auto">
                From wild dolphins to candle-lit rivers — every moment crafted for luxury
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((exp, i) => (
              <FadeUp key={i} delay={i * 0.07}>
                <motion.div
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-default"
                  whileHover={{ y: -7 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Image */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                      <Image src={exp.image} alt={exp.title} fill className="object-cover" />
                    </div>
                  </div>

                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/25 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(to top, ${exp.color}50, transparent 60%)` }}
                  />

                  {/* Number */}
                  <div
                    className="absolute top-4 left-4 text-xs font-bold px-2 py-1 rounded-md"
                    style={{ background: `${exp.color}cc`, color: '#fff' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>

                  {/* Icon */}
                  <div
                    className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm"
                    style={{ background: 'rgba(0,0,0,0.42)' }}
                  >
                    <exp.icon className="w-4 h-4 text-white/80" />
                  </div>

                  {/* Text */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3
                      className="text-white font-bold text-xl mb-2 transition-colors duration-300 group-hover:text-[#f59e0b]"
                    >
                      {exp.title}
                    </h3>
                    <p className="text-white/0 group-hover:text-white/78 text-sm leading-relaxed transition-all duration-500 translate-y-3 group-hover:translate-y-0">
                      {exp.description}
                    </p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ ITINERARY TIMELINE ══════════════════════ */}
      <section className="py-24" style={{ background: C.bgAlt }}>
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <FadeUp>
            <div className="text-center mb-16">
              <Label>Day by Day</Label>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Your Kenya Itinerary</h2>
              <p className="text-white/42 max-w-xl mx-auto">
                4 extraordinary days on the Kenyan coast — crafted for relaxation, adventure, and wonder
              </p>
            </div>
          </FadeUp>

          <div className="relative">
            <div
              className="absolute left-6 lg:left-8 top-0 bottom-0 w-px"
              style={{ background: `linear-gradient(to bottom, ${C.primary}70, ${C.secondary}40, transparent)` }}
            />

            <div className="space-y-4">
              {itinerary.map((item, i) => {
                const isOpen = openDay === i
                return (
                  <FadeUp key={i} delay={i * 0.07}>
                    <div className="relative pl-16 lg:pl-20">
                      {/* Dot */}
                      <motion.div
                        className="absolute left-[10px] lg:left-[14px] top-6 w-7 h-7 rounded-full border-2 flex items-center justify-center z-10"
                        style={{ borderColor: item.color, background: isOpen ? item.color : C.bgAlt }}
                        animate={{ scale: isOpen ? 1.2 : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <item.icon className="w-3 h-3" style={{ color: isOpen ? '#000' : item.color }} />
                      </motion.div>

                      {/* Card */}
                      <motion.div
                        className="rounded-2xl overflow-hidden border cursor-pointer"
                        style={{
                          background: isOpen ? `${item.color}08` : 'rgba(255,255,255,0.025)',
                          borderColor: isOpen ? `${item.color}45` : 'rgba(255,255,255,0.06)',
                        }}
                        whileHover={{ borderColor: `${item.color}30` }}
                        onClick={() => setOpenDay(isOpen ? null : i)}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 lg:p-6">
                          <div className="flex items-center gap-4 min-w-0">
                            <span
                              className="shrink-0 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                              style={{ background: `${item.color}22`, color: item.color }}
                            >
                              {item.day}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-white font-semibold text-base lg:text-lg leading-snug">
                                {item.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Clock className="w-3 h-3 text-white/32 shrink-0" />
                                <span className="text-white/38 text-xs">{item.time}</span>
                                <span className="text-white/22 text-xs">·</span>
                                <span className="text-white/32 text-xs italic">{item.atmosphere}</span>
                              </div>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="shrink-0 ml-3"
                          >
                            <ChevronDown className="w-5 h-5 text-white/32" />
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
                              <div className="px-5 lg:px-6 pb-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                  {/* Services */}
                                  <div>
                                    <ul className="space-y-2 mb-4">
                                      {item.services.map((svc, si) => (
                                        <li key={si} className="flex items-start gap-3">
                                          <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: item.color }} />
                                          <span className="text-white/68 text-sm leading-relaxed">{svc}</span>
                                        </li>
                                      ))}
                                    </ul>

                                    {/* Highlight */}
                                    <div
                                      className="flex items-start gap-3 p-3 rounded-xl mb-4"
                                      style={{ background: `${item.color}12`, border: `1px solid ${item.color}28` }}
                                    >
                                      <Star className="w-4 h-4 shrink-0 mt-0.5 fill-current" style={{ color: item.color }} />
                                      <p className="text-sm font-medium" style={{ color: item.color }}>
                                        {item.highlight}
                                      </p>
                                    </div>

                                    {/* What to bring (Day 2 only) */}
                                    {'whatToBring' in item && item.whatToBring && (
                                      <div>
                                        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">
                                          What to Bring
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {(item.whatToBring as string[]).map((w, wi) => (
                                            <span
                                              key={wi}
                                              className="text-xs px-3 py-1 rounded-full"
                                              style={{
                                                background: `${item.color}18`,
                                                color: item.color,
                                                border: `1px solid ${item.color}30`,
                                              }}
                                            >
                                              {w}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mt-4">
                                      {item.tags.map((tag, ti) => (
                                        <span
                                          key={ti}
                                          className="text-xs px-3 py-1 rounded-full text-white/50"
                                          style={{ background: 'rgba(255,255,255,0.06)' }}
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Image */}
                                  <div className="relative h-52 md:h-auto rounded-xl overflow-hidden">
                                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                                  </div>
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

      {/* ══════════════════════ INCLUDED / EXCLUDED ══════════════════════ */}
      <section className="py-24" style={{ background: C.bgCard }}>
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeUp>
            <div className="text-center mb-14">
              <Label>What's Covered</Label>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Included &amp; Excluded</h2>
              <p className="text-white/42 max-w-xl mx-auto">
                Full transparency — no surprises. Know exactly what your luxury package covers
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Included */}
            <FadeUp delay={0.1}>
              <motion.div
                className="rounded-2xl p-6 border h-full"
                style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}
                whileHover={{ borderColor: 'rgba(16,185,129,0.4)' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.18)' }}>
                    <Check className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">What's Included</h3>
                    <p className="text-[#10b981] text-xs font-medium">Everything covered</p>
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
                      <span className="text-white/72 text-sm leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </FadeUp>

            {/* Excluded */}
            <FadeUp delay={0.18}>
              <motion.div
                className="rounded-2xl p-6 border h-full"
                style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.15)' }}
                whileHover={{ borderColor: 'rgba(239,68,68,0.35)' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
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
                      <span className="text-white/62 text-sm leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </ul>
                <div
                  className="mt-6 p-3 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  <p className="text-white/52 text-xs leading-relaxed">
                    💡 Travel insurance is strongly recommended. Our team can provide guidance on suitable options before departure.
                  </p>
                </div>
              </motion.div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════ PRACTICAL INFORMATION ══════════════════════ */}
      <section className="py-24" style={{ background: C.bgAlt }}>
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeUp>
            <div className="text-center mb-14">
              <Label>Essential Knowledge</Label>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Practical Information</h2>
              <p className="text-white/42 max-w-xl mx-auto">
                Everything you need to know for a smooth, comfortable Kenya experience
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-4">
            {practicalInfo.map((info, i) => {
              const isOpen = openInfo === i
              return (
                <FadeUp key={i} delay={i * 0.06}>
                  <motion.div
                    className="rounded-2xl overflow-hidden border cursor-pointer"
                    style={{
                      background: isOpen ? `${info.color}08` : 'rgba(255,255,255,0.025)',
                      borderColor: isOpen ? `${info.color}40` : 'rgba(255,255,255,0.06)',
                    }}
                    whileHover={{ borderColor: `${info.color}28` }}
                    onClick={() => setOpenInfo(isOpen ? null : i)}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `${info.color}20` }}
                        >
                          <info.icon className="w-5 h-5" style={{ color: info.color }} />
                        </div>
                        <span className="text-white font-semibold text-sm">{info.title}</span>
                      </div>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.28 }}>
                        <ChevronDown className="w-4 h-4 text-white/32" />
                      </motion.div>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.36 }}
                        >
                          <div className="px-5 pb-5">
                            <div className="h-px mb-4" style={{ background: `${info.color}20` }} />
                            <ul className="space-y-2">
                              {info.items.map((item, ii) => (
                                <li key={ii} className="flex items-start gap-3">
                                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: info.color }} />
                                  <span className="text-white/65 text-sm leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </FadeUp>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════ DESTINATION HIGHLIGHTS ══════════════════════ */}
      <section className="py-24" style={{ background: C.bgCard }}>
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <Label>Must-See</Label>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Destination Highlights</h2>
              <p className="text-white/42 max-w-2xl mx-auto">
                Five iconic Kenyan coastal experiences that define this journey
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {highlights.map((h, i) => (
              <FadeUp key={i} delay={i * 0.07}>
                <motion.div
                  className={`group relative rounded-2xl overflow-hidden cursor-default ${i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
                  style={{ aspectRatio: '4/3' }}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Image */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                      <Image src={h.image} alt={h.title} fill className="object-cover" />
                    </div>
                  </div>

                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/22 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(to top, ${C.primary}38, transparent 60%)` }}
                  />

                  {/* Icon */}
                  <div
                    className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm"
                    style={{ background: 'rgba(0,0,0,0.42)' }}
                  >
                    <h.icon className="w-4 h-4 text-white/78" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#f59e0b] transition-colors duration-300">
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

      {/* ══════════════════════ CLOSING BANNER ══════════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1920&q=85"
            alt="Kenya coastline"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/74" />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${C.primary}16 0%, transparent 50%, ${C.secondary}10 100%)`,
            }}
          />
        </div>

        <FadeUp>
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <motion.div
              className="inline-block mb-6"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-5xl">🌊</span>
            </motion.div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-5 leading-tight">
              Kenya Awaits<br />
              <span style={{ color: C.primary }}>Your Adventure</span>
            </h2>
            <p className="text-white/62 text-lg leading-relaxed mb-9">
              From the powder-white shores of Diani to the mangrove silhouettes of Kongo River at sunset —
              every moment of Kenya is a memory carved in gold.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Ocean', 'Wildlife', 'Culture', 'Beaches', 'Sunsets', 'Adventure'].map((tag, i) => (
                <motion.span
                  key={i}
                  className="px-5 py-2 rounded-full text-sm font-medium border border-white/16 text-white/72 backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  whileHover={{ scale: 1.06, borderColor: `${C.primary}55`, color: C.primary }}
                  transition={{ duration: 0.18 }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.09, duration: 0.55 } }}
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
