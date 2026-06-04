'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Star,
  Utensils,
  Car,
  Users,
  Coffee,
  Waves,
  Camera,
  Landmark,
  ChevronDown,
  Sun,
  DollarSign,
  AlertTriangle,
  Check,
  Ship,
  FileText,
  Map,
} from 'lucide-react'

/* ─────────────────────────────────── Data ─────────────────────────────────── */

const quickInfoCards = [
  { icon: Calendar, label: '6 Days', sub: '5 Nights', color: '#e5a832' },
  { icon: MapPin, label: 'Hanoi', sub: 'Ha Long Bay', color: '#0ea5e9' },
  { icon: Ship, label: 'Luxury Cruise', sub: 'Ha Long Bay', color: '#06b6d4' },
  { icon: Star, label: 'Premium Stays', sub: '4-Star Hotels', color: '#a855f7' },
  { icon: Car, label: 'Private Transfers', sub: 'Door to Door', color: '#f97316' },
  { icon: Users, label: 'Guided Experience', sub: 'Expert Guides', color: '#ec4899' },
]

const itinerary = [
  {
    day: 'Day 1',
    label: 'Arrival',
    title: 'Arrival in Hanoi',
    subtitle: 'The Historic Capital',
    summary: 'Arrive at Noi Bai International Airport where you will be greeted by our representative. Enjoy a private luxury transfer to your hotel. After settling in, experience a warm welcome to Vietnam with a delightful dinner at Sen Tay Ho Buffet Restaurant, offering a vast array of authentic dishes.',
    highlight: 'Warm welcome and authentic dinner at Sen Tay Ho',
    image: '/images/vietnam/day1.jpg',
    accent: '#e5a832',
    icon: MapPin,
    meals: ['Dinner'],
    tags: ['Arrival', 'Private Transfer', 'Welcome Dinner'],
  },
  {
    day: 'Day 2',
    label: 'Cruise',
    title: 'Hanoi → Ha Long Bay',
    subtitle: 'Embarkation & Exploration',
    summary: 'Take a scenic drive to the UNESCO World Heritage site of Ha Long Bay. Embark on your luxury cruise and enjoy a magnificent seafood lunch while cruising among the limestone islands. Explore hidden caves, go kayaking in emerald waters, and join a traditional cooking class on the sundeck at sunset.',
    highlight: 'Luxury cruise embarkation and sunset cooking class',
    image: '/images/vietnam/day2.jpg',
    accent: '#0ea5e9',
    icon: Ship,
    meals: ['Breakfast', 'Lunch', 'Dinner'],
    tags: ['Ha Long Bay', 'Luxury Cruise', 'Kayaking', 'Cooking Class'],
  },
  {
    day: 'Day 3',
    label: 'Bay',
    title: 'Ha Long Bay Cruise',
    subtitle: 'A Full Day on the Water',
    summary: 'Start your day with a tranquil Tai Chi session on the sundeck as the sun rises over the bay. Enjoy a full day of cruising deeper into the bay, exploring remote limestone karsts and pristine beaches. Relax, take in the breathtaking views, and savor exquisite meals prepared by the onboard chef.',
    highlight: 'Morning Tai Chi and full-day scenic cruising',
    image: '/images/vietnam/day3.jpg',
    accent: '#06b6d4',
    icon: Sun,
    meals: ['Breakfast', 'Lunch', 'Dinner'],
    tags: ['Tai Chi', 'Scenic Cruising', 'Limestone Islands', 'Relaxation'],
  },
  {
    day: 'Day 4',
    label: 'Culture',
    title: 'Ha Long Bay → Hanoi',
    subtitle: 'Cultural Heritage Tour',
    summary: 'Begin with morning Tai Chi and brunch as the ship cruises back to harbor. Return to Hanoi for a captivating city tour — visit the historic Temple of Literature, experience a cyclo ride through the Old Quarter, and stroll the serene shores of Hoan Kiem Lake.',
    highlight: 'Temple of Literature & traditional Cyclo ride',
    image: '/images/vietnam/day4.jpg',
    accent: '#a855f7',
    icon: Landmark,
    meals: ['Breakfast', 'Brunch'],
    tags: ['Temple of Literature', 'Cyclo Tour', 'Hoan Kiem Lake', 'Old Quarter'],
  },
  {
    day: 'Day 5',
    label: 'Leisure',
    title: 'Hanoi Leisure Day',
    subtitle: 'Personal Exploration',
    summary: 'Enjoy a full free day to explore Hanoi at your own pace. Wander through the Old Quarter to shop for silk, handicrafts, and souvenirs. Relax at a local café to try famous Vietnamese egg coffee, visit local markets, or simply soak in the vibrant atmosphere of the city.',
    highlight: 'Free time for shopping and local café culture',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
    accent: '#10b981',
    icon: Coffee,
    meals: ['Breakfast'],
    tags: ['Leisure Time', 'Shopping', 'Local Culture', 'Café Hopping'],
  },
  {
    day: 'Day 6',
    label: 'Departure',
    title: 'Farewell to Vietnam',
    subtitle: 'Departure Day',
    summary: 'Savor your final breakfast in Hanoi. Spend your remaining leisure time picking up last-minute souvenirs or taking a final stroll. Our private transfer will then take you to Noi Bai International Airport for your departure flight, bringing your unforgettable Vietnamese journey to a close.',
    highlight: 'Private airport transfer and departure',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
    accent: '#f97316',
    icon: Car,
    meals: ['Breakfast'],
    tags: ['Departure', 'Airport Transfer', 'Farewell'],
  },
]

const experiences = [
  {
    title: 'Ha Long Bay Cruise',
    description: 'Sail through emerald waters surrounded by thousands of towering limestone islands.',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
    icon: Ship,
    color: '#06b6d4',
  },
  {
    title: 'Hanoi Old Quarter',
    description: 'Navigate the bustling historic streets filled with rich culture and vibrant life.',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80',
    icon: Map,
    color: '#e5a832',
  },
  {
    title: 'Temple of Literature',
    description: "Visit Vietnam's first national university, a stunning example of traditional architecture.",
    image: 'https://images.unsplash.com/photo-1531737212413-667205e1cda7?w=800&q=80',
    icon: Landmark,
    color: '#ec4899',
  },
  {
    title: 'Kayaking Adventure',
    description: 'Paddle through hidden caves and tranquil lagoons in the heart of Ha Long Bay.',
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
    icon: Waves,
    color: '#0ea5e9',
  },
  {
    title: 'Hoan Kiem Lake',
    description: 'Stroll around the scenic "Lake of the Restored Sword" in the center of Hanoi.',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80',
    icon: Camera,
    color: '#f97316',
  },
  {
    title: 'Vietnamese Cuisine',
    description: 'Savor authentic dishes from street food pho to premium seafood banquets.',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
    icon: Utensils,
    color: '#10b981',
  },
]

const guidelines = [
  {
    icon: FileText,
    title: 'Visa & Immigration',
    color: '#3b82f6',
    items: [
      'E-visa is available for most nationalities (apply online in advance)',
      'Passport must be valid for at least 6 months beyond arrival date',
      'Ensure you have at least two blank pages in your passport',
      'Keep your e-visa printout handy for immigration checks',
    ],
  },
  {
    icon: DollarSign,
    title: 'Currency & Payments',
    color: '#10b981',
    items: [
      'Local currency: Vietnamese Dong (VND)',
      'US Dollars are widely accepted in tourist areas, but VND is preferred for small purchases',
      'ATMs are readily available in Hanoi; use them to withdraw local currency',
      'Major credit cards are accepted at hotels and upscale restaurants',
      'Bargaining is common in local markets (e.g., in the Old Quarter)',
    ],
  },
  {
    icon: Sun,
    title: 'Weather & Packing',
    color: '#f97316',
    items: [
      'Northern Vietnam (Hanoi/Ha Long) has distinct seasons (cold winters, hot summers)',
      'Pack lightweight, breathable clothing for summer months',
      'Bring a light jacket or sweater if traveling between November and March',
      'Comfortable walking shoes are essential for exploring the Old Quarter',
      'Modest clothing (covering shoulders and knees) is required for temple visits',
    ],
  },
  {
    icon: Ship,
    title: 'Cruise Information',
    color: '#0ea5e9',
    items: [
      'Pack a smaller overnight bag for the cruise to save space in your cabin',
      'Large luggage can often be securely stored at your Hanoi hotel or the cruise office',
      'Wi-Fi on the cruise may be spotty due to the remote location',
      'Motion sickness medication is recommended if you are sensitive, though the bay is generally calm',
    ],
  },
  {
    icon: Users,
    title: 'Local Etiquette',
    color: '#a855f7',
    items: [
      'Dress modestly when visiting temples and pagodas',
      "Remove your shoes when entering someone's home or certain places of worship",
      'Avoid public displays of affection',
      'Use both hands when giving or receiving something (like a business card or money)',
      'Tipping is not mandatory but highly appreciated for guides and drivers',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Safety Tips',
    color: '#ef4444',
    items: [
      'Drink only bottled or filtered water; avoid tap water and ice in street stalls',
      'Be cautious of traffic in Hanoi; cross streets slowly and steadily',
      'Keep valuables secure, especially in crowded markets',
      'Use reliable taxi companies (like Mai Linh) or ride-hailing apps (like Grab)',
      'Travel insurance covering medical expenses and trip cancellation is strongly recommended',
    ],
  },
]

const inclusions = [
  'Accommodation in well-appointed hotels & luxury cruise',
  'Private airport transfers and ground transportation',
  'Professional English-speaking local guides',
  'Overnight luxury cruise experience in Ha Long Bay',
  'Meals as specified in the itinerary',
  'All entrance fees for sightseeing tours',
  'Mineral water during excursions',
  'Assistance with Visa processing',
]

const exclusions = [
  'International flight tickets',
  'Visa stamping fees upon arrival',
  'Personal expenses (laundry, telephone, drinks)',
  'Meals not mentioned in the itinerary',
  'Travel insurance',
  'Tips for guides, drivers, and cruise staff',
]

/* ────────────────────────── Utility Components ─────────────────────────────── */

function FadeInWhenVisible({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ────────────────────────────── Main Page ──────────────────────────────────── */

export default function VietnamPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])

  const [openGuideline, setOpenGuideline] = useState<number | null>(null)
  const [openDay, setOpenDay] = useState<number | null>(0)

  const { scrollYProgress: pageProgress } = useScroll()
  const progressWidth = useTransform(pageProgress, [0, 1], ['0%', '100%'])

  return (
    <div className="bg-white overflow-x-hidden font-sans">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 h-[3px] z-[999] origin-left"
        style={{ width: progressWidth, background: 'linear-gradient(90deg, #e5a832, #0ea5e9, #10b981)' }}
      />

      {/* ══════════════════ HERO ══════════════════ */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
          <Image
            src="https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=90"
            alt="Ha Long Bay, Vietnam"
            fill
            className="object-cover"
            priority
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

        <motion.div className="relative z-10 text-center px-4 max-w-5xl mx-auto" style={{ opacity: heroOpacity }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full border border-white/20 backdrop-blur-sm"
            style={{ background: 'rgba(229,168,50,0.15)' }}
          >
            <Star className="w-4 h-4 text-[#e5a832] fill-[#e5a832]" />
            <span className="text-white/90 text-sm font-medium tracking-widest uppercase">Premium Experience</span>
            <Star className="w-4 h-4 text-[#e5a832] fill-[#e5a832]" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-6xl sm:text-7xl lg:text-9xl font-bold text-white mb-4 leading-none tracking-tight"
            style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
          >
            Discover Vietnam
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-white/80 text-lg sm:text-xl font-light tracking-[0.2em] uppercase mb-4"
          >
            Hanoi • Ha Long Bay • Cultural Heritage
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-[#e5a832] text-sm tracking-widest uppercase font-semibold"
          >
            6 Days • 5 Nights Luxury Journey
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          >
            <span className="text-white/50 text-[10px] tracking-[0.3em] uppercase">Begin Journey</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 rounded-full border border-white/30 flex items-start justify-center pt-2"
            >
              <div className="w-1 h-2 bg-white/60 rounded-full" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════ QUICK INFO CARDS ══════════════════ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInWhenVisible>
            <div className="text-center mb-14">
              <p className="text-[#e5a832] text-sm font-semibold tracking-widest uppercase mb-3">The Details</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">Your Journey at a Glance</h2>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickInfoCards.map((card, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.03 }}
                  className="group relative rounded-2xl p-5 text-center cursor-default overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{ background: `radial-gradient(circle at center, ${card.color}08, transparent 70%)` }}
                  />
                  <div
                    className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.color}15` }}
                  >
                    <card.icon className="w-6 h-6" style={{ color: card.color }} />
                  </div>
                  <p className="text-gray-900 font-bold text-base leading-tight">{card.label}</p>
                  <p className="text-gray-400 text-xs mt-1">{card.sub}</p>
                </motion.div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ DESTINATION HIGHLIGHTS ══════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInWhenVisible>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div className="max-w-2xl">
                <p className="text-[#e5a832] text-sm font-semibold tracking-widest uppercase mb-4 flex items-center gap-2">
                  <span className="w-8 h-px bg-[#e5a832]" /> Immersive Experiences
                </p>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Discover the Soul<br />of Northern Vietnam
                </h2>
              </div>
              <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
                From the bustling, historic streets of Hanoi's Old Quarter to the serene, emerald waters and limestone karsts of Ha Long Bay.
              </p>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((exp, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <motion.div
                  className="group relative rounded-3xl overflow-hidden aspect-[4/5] cursor-default shadow-md hover:shadow-xl transition-shadow duration-500"
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <div className="absolute inset-0 bg-gray-200">
                    <Image
                      src={exp.image}
                      alt={exp.title}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(to top, ${exp.color}50, transparent 70%)` }}
                  />
                  <div className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <exp.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-7">
                    <h3 className="text-white font-bold text-xl mb-2">{exp.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">{exp.description}</p>
                    <div className="w-0 h-0.5 mt-3 transition-all duration-700 group-hover:w-10" style={{ background: exp.color }} />
                  </div>
                </motion.div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ ITINERARY ══════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInWhenVisible>
            <div className="text-center mb-16">
              <p className="text-[#e5a832] text-xs font-semibold tracking-[0.3em] uppercase mb-3">Day by Day</p>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Your Vietnam Journey</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-[#e5a832] to-[#0ea5e9] mx-auto rounded-full" />
              <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed mt-4">
                Six unforgettable days through the ancient streets of Hanoi and the emerald waters of Ha Long Bay.
              </p>
            </div>
          </FadeInWhenVisible>

          <div className="space-y-3 max-w-4xl mx-auto">
            {itinerary.map((item, i) => {
              const isOpen = openDay === i
              return (
                <FadeInWhenVisible key={i} delay={i * 0.06}>
                  <motion.div
                    layout
                    className="rounded-2xl overflow-hidden border bg-white transition-shadow duration-300"
                    style={{
                      borderColor: isOpen ? `${item.accent}40` : '#e5e7eb',
                      boxShadow: isOpen ? `0 4px 24px ${item.accent}18` : '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  >
                    {/* Header row */}
                    <button onClick={() => setOpenDay(isOpen ? null : i)} className="w-full text-left">
                      <div className="flex items-center min-h-[80px]">
                        {/* Day pill */}
                        <div
                          className="shrink-0 w-16 h-full flex flex-col items-center justify-center py-5 self-stretch"
                          style={{ background: `${item.accent}10` }}
                        >
                          <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: item.accent }}>Day</span>
                          <span className="text-2xl font-black text-gray-900 leading-none">{i + 1}</span>
                        </div>

                        {/* Thumbnail */}
                        <div className="relative shrink-0 w-24 h-[80px] hidden sm:block overflow-hidden">
                          <Image src={item.image} alt={item.title} fill className="object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 px-5 py-3 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full"
                              style={{ color: item.accent, background: `${item.accent}12` }}
                            >
                              {item.label}
                            </span>
                            <div className="hidden sm:flex gap-1 ml-auto">
                              {item.meals.map((m, mi) => (
                                <span key={mi} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">{m}</span>
                              ))}
                            </div>
                          </div>
                          <h3 className="text-gray-900 font-bold text-base leading-snug truncate">{item.title}</h3>
                          <p className="text-gray-400 text-xs mt-0.5 hidden sm:block">{item.subtitle}</p>
                        </div>

                        {/* Chevron */}
                        <div className="shrink-0 px-4">
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-8 h-8 rounded-full border flex items-center justify-center"
                            style={{
                              background: isOpen ? `${item.accent}12` : '#f9fafb',
                              borderColor: isOpen ? `${item.accent}40` : '#e5e7eb',
                            }}
                          >
                            <ChevronDown className="w-4 h-4" style={{ color: isOpen ? item.accent : '#9ca3af' }} />
                          </motion.div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                          style={{ overflow: 'hidden' }}
                        >
                          {/* Hero image */}
                          <div className="relative w-full h-[280px] sm:h-[380px] lg:h-[440px]">
                            <Image src={item.image} alt={item.title} fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex items-end justify-between gap-4">
                              <div>
                                <div
                                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3 backdrop-blur-md border"
                                  style={{ background: `${item.accent}20`, borderColor: `${item.accent}40` }}
                                >
                                  <item.icon className="w-4 h-4" style={{ color: item.accent }} />
                                  <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: item.accent }}>{item.subtitle}</span>
                                </div>
                                <h4 className="text-white text-2xl sm:text-3xl font-bold leading-tight">{item.title}</h4>
                              </div>
                              <div className="text-5xl sm:text-7xl font-black opacity-30 text-white leading-none shrink-0">{i + 1}</div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="p-6 sm:p-8 grid sm:grid-cols-2 gap-6 bg-gray-50">
                            <div>
                              <p className="text-gray-600 leading-relaxed text-sm mb-5">{item.summary}</p>
                              <div className="flex flex-wrap gap-2">
                                {item.tags.map((tag, ti) => (
                                  <span
                                    key={ti}
                                    className="text-xs px-3 py-1.5 rounded-full border font-medium"
                                    style={{ color: item.accent, borderColor: `${item.accent}30`, background: `${item.accent}08` }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="p-4 rounded-xl border bg-white" style={{ borderColor: `${item.accent}25` }}>
                                <div className="flex items-start gap-3">
                                  <Star className="w-4 h-4 shrink-0 mt-0.5" style={{ color: item.accent }} />
                                  <div>
                                    <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Day Highlight</p>
                                    <p className="text-gray-800 font-semibold text-sm">{item.highlight}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 rounded-xl border border-gray-100 bg-white">
                                <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-2.5 flex items-center gap-2">
                                  <Utensils className="w-3.5 h-3.5" /> Meals Included
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {item.meals.map((m, mi) => (
                                    <span key={mi} className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 font-medium">{m}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </FadeInWhenVisible>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════ INCLUSIONS / EXCLUSIONS ══════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <FadeInWhenVisible>
            <div className="text-center mb-14">
              <p className="text-[#e5a832] text-sm font-semibold tracking-widest uppercase mb-3">Package Details</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">What's Included</h2>
            </div>
          </FadeInWhenVisible>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Inclusions */}
            <FadeInWhenVisible>
              <div className="bg-white border border-emerald-100 rounded-3xl p-8 lg:p-10 h-full shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-7 border border-emerald-100">
                  <Check className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-7">Included</h3>
                <ul className="space-y-4">
                  {inclusions.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInWhenVisible>

            {/* Exclusions */}
            <FadeInWhenVisible delay={0.15}>
              <div className="bg-white border border-rose-100 rounded-3xl p-8 lg:p-10 h-full shadow-sm">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-7 border border-rose-100">
                  <span className="text-rose-400 font-bold text-lg">✕</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-7">Not Included</h3>
                <ul className="space-y-4">
                  {exclusions.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                        <span className="text-rose-400 text-[10px] font-bold">✕</span>
                      </div>
                      <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInWhenVisible>
          </div>
        </div>
      </section>

      {/* ══════════════════ TRAVEL GUIDELINES ══════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeInWhenVisible>
            <div className="text-center mb-14">
              <p className="text-[#a855f7] text-sm font-semibold tracking-widest uppercase mb-3">Be Prepared</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-3">Travel Information</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-sm">Essential details to ensure your journey through Vietnam is smooth and enjoyable.</p>
            </div>
          </FadeInWhenVisible>

          <div className="grid md:grid-cols-2 gap-3">
            {guidelines.map((guide, i) => {
              const isOpen = openGuideline === i
              return (
                <FadeInWhenVisible key={i} delay={i * 0.05}>
                  <motion.div
                    className="rounded-2xl overflow-hidden border bg-white cursor-pointer transition-all duration-200 hover:shadow-md"
                    style={{ borderColor: isOpen ? `${guide.color}35` : '#e5e7eb', boxShadow: isOpen ? `0 4px 20px ${guide.color}10` : undefined }}
                    onClick={() => setOpenGuideline(isOpen ? null : i)}
                  >
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${guide.color}10`, borderColor: `${guide.color}20` }}>
                          <guide.icon className="w-5 h-5" style={{ color: guide.color }} />
                        </div>
                        <span className="text-gray-800 font-semibold">{guide.title}</span>
                      </div>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-5 pb-5 pt-1 bg-gray-50 border-t border-gray-100">
                            <div className="space-y-2.5 pt-2">
                              {guide.items.map((item, ii) => (
                                <div key={ii} className="flex items-start gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: guide.color }} />
                                  <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </FadeInWhenVisible>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════ CLOSING CTA ══════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=85"
            alt="Vietnam Journey"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/65" />
        </div>

        <FadeInWhenVisible>
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Begin Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5a832] to-[#0ea5e9]">
                Vietnamese Journey
              </span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              Immerse yourself in the timeless beauty, rich heritage, and unparalleled luxury of Northern Vietnam.
            </p>
            <button className="px-10 py-4 bg-[#e5a832] text-white font-bold rounded-full text-sm tracking-wide hover:bg-[#d49728] hover:scale-105 transition-all duration-300 shadow-lg">
              Start Planning
            </button>
          </div>
        </FadeInWhenVisible>
      </section>
    </div>
  )
}
