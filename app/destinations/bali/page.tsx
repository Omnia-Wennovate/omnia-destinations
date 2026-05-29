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
  Mountain,
  Camera,
  ShoppingBag,
  Landmark,
  ChevronDown,
  Sun,
  Shield,
  Phone,
  Shirt,
  DollarSign,
  AlertTriangle,
  Check,
} from 'lucide-react'

/* ─────────────────────────────────── Data ─────────────────────────────────── */

const quickInfoCards = [
  { icon: Calendar, label: '7 Days', sub: '6 Nights', color: '#e5a832' },
  { icon: MapPin, label: 'Jakarta + Bali', sub: 'Nusa Penida', color: '#f97316' },
  { icon: Star, label: '4-Star Hotels', sub: 'Premium Stays', color: '#a855f7' },
  { icon: Coffee, label: 'Daily Breakfast', sub: 'Included', color: '#10b981' },
  { icon: Car, label: 'Private Transfers', sub: 'Door to Door', color: '#3b82f6' },
  { icon: Users, label: 'Guided Experience', sub: 'Expert Guides', color: '#ec4899' },
]

const itinerary = [
  {
    day: 'Day 1',
    title: 'Arrive in Jakarta – Gateway to the Archipelago',
    summary:
      'Fly into Soekarno-Hatta International Airport. After immigration and customs, our representative meets you and transfers you to your hotel. Check-in, freshen up, and enjoy a welcome dinner.',
    highlight: 'Welcome dinner with authentic Indonesian cuisine',
    image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80',
    icon: Landmark,
    tags: ['Transfer', 'Welcome Dinner', 'Hotel Check-in'],
  },
  {
    day: 'Day 2',
    title: 'Jakarta City Tour – Colonial Heritage & Modern Skyline',
    summary:
      'Visit the iconic Monas National Monument, explore Kota Tua (Old Batavia), the Fatahillah Museum, and Jakarta Cathedral. In the afternoon, discover Grand Indonesia Mall, then board your evening flight to Bali.',
    highlight: 'Monas Monument, Old Batavia & evening flight to Bali',
    image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80',
    icon: Camera,
    tags: ['City Tour', 'Museum', 'Flight to Bali'],
  },
  {
    day: 'Day 3',
    title: 'Arrive in Bali – Island of the Gods',
    summary:
      'Land at Ngurah Rai International Airport. Transfer to your Bali hotel. Explore Seminyak or Legian beach, enjoy a sunset at Tanah Lot or Kuta Beach. Relax and enjoy Balinese hospitality.',
    highlight: 'Tanah Lot sunset & Seminyak beachfront',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    icon: Sun,
    tags: ['Arrival', 'Tanah Lot', 'Sunset'],
  },
  {
    day: 'Day 4',
    title: 'Bali Adventure – Water Sports & ATV Thrills',
    summary:
      'Morning water sports in Tanjung Benoa (banana boat, parasailing, jet ski). Afternoon ATV ride through Bali\'s rice terraces and jungle. Visit Tegallalang Rice Terrace and a traditional Balinese village.',
    highlight: 'Water sports + ATV ride through rice terraces',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    icon: Waves,
    tags: ['Water Sports', 'ATV', 'Rice Terraces'],
  },
  {
    day: 'Day 5',
    title: 'Cultural Bali – Temples & Sacred Sites',
    summary:
      'Visit Besakih "Mother Temple," then head to Uluwatu Temple perched on dramatic cliffs. Watch the mesmerising Kecak Fire Dance at sunset. Dinner at Jimbaran Bay with fresh seafood on the beach.',
    highlight: 'Uluwatu cliff temple & Kecak Fire Dance at sunset',
    image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80',
    icon: Landmark,
    tags: ['Temples', 'Kecak Dance', 'Jimbaran'],
  },
  {
    day: 'Day 6',
    title: 'Nusa Penida – Dramatic Cliffs & Turquoise Waters',
    summary:
      'Full-day trip to Nusa Penida Island. Visit Kelingking Beach (T-Rex cliff viewpoint), Angel\'s Billabong, Broken Beach, and Crystal Bay. Snorkel with manta rays. Return to Bali by speedboat.',
    highlight: 'Kelingking Beach cliffside & manta ray snorkelling',
    image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80',
    icon: Waves,
    tags: ['Nusa Penida', 'Kelingking', 'Snorkelling'],
  },
  {
    day: 'Day 7',
    title: 'Shopping & Ubud Arts Scene',
    summary:
      'Morning visit to Ubud Monkey Forest, then Ubud Art Market and local silver jewellery workshops. Afternoon leisure shopping at Seminyak boutiques and Sunset Road. Farewell dinner.',
    highlight: 'Ubud Monkey Forest & artisan silver workshops',
    image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80',
    icon: ShoppingBag,
    tags: ['Ubud', 'Shopping', 'Farewell Dinner'],
  },
  {
    day: 'Day 8',
    title: 'Leisure Day – Spa & Beach',
    summary:
      'Your final free day in paradise. Enjoy a traditional Balinese spa massage, sun on Seminyak or Nusa Dua beach, or take an optional cooking class. Evening private transfers to the airport.',
    highlight: 'Traditional Balinese spa & final sunset',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    icon: Star,
    tags: ['Spa', 'Leisure', 'Airport Transfer'],
  },
  {
    day: 'Day 9',
    title: 'Departure – Until We Meet Again',
    summary:
      'Early morning transfer to Ngurah Rai Airport. Board your flight home carrying memories of temples, terraces, and turquoise seas. Thank you for travelling with OMNIA.',
    highlight: 'Final transfer & departure',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    icon: MapPin,
    tags: ['Departure', 'Airport'],
  },
]

const experiences = [
  {
    title: 'Water Sports',
    description: 'Banana boat, parasailing, jet ski & snorkelling at Tanjung Benoa',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    icon: Waves,
  },
  {
    title: 'Uluwatu Temple',
    description: 'Dramatic clifftop temple overlooking the Indian Ocean at sunset',
    image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80',
    icon: Landmark,
  },
  {
    title: 'ATV Adventure',
    description: 'Off-road thrills through jungle, rice paddies & hidden waterfalls',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    icon: Mountain,
  },
  {
    title: 'Rice Terraces',
    description: 'Tegallalang UNESCO rice terrace walk with panoramic valley views',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    icon: Mountain,
  },
  {
    title: 'Kelingking Beach',
    description: 'The iconic T-Rex shaped cliff above crystal-clear turquoise waters',
    image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80',
    icon: Camera,
  },
  {
    title: 'Nusa Penida',
    description: 'Pristine island escape with manta rays, sea arches & secret coves',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    icon: Waves,
  },
  {
    title: 'Shopping & Artisan',
    description: 'Ubud markets, silver workshops, and Seminyak designer boutiques',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80',
    icon: ShoppingBag,
  },
  {
    title: 'Cultural Immersion',
    description: 'Kecak Fire Dance, Besakih Mother Temple & Balinese cooking class',
    image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80',
    icon: Users,
  },
]

const guidelines = [
  {
    icon: Shield,
    title: 'Passport & Visa',
    color: '#3b82f6',
    items: [
      'Ethiopian passport holders require a tourist visa for Indonesia',
      'Visa-on-arrival available at Ngurah Rai Airport (USD 35)',
      'Passport must be valid for at least 6 months beyond travel dates',
      'Keep copies of all travel documents in a separate bag',
    ],
  },
  {
    icon: DollarSign,
    title: 'Currency & Payments',
    color: '#10b981',
    items: [
      'Local currency: Indonesian Rupiah (IDR)',
      'USD is widely accepted in tourist areas',
      'ATMs readily available in Bali and Jakarta',
      'Bargaining is expected at local markets',
      'Avoid exchanging money at airports (poor rates)',
    ],
  },
  {
    icon: Shirt,
    title: 'Clothing & Weather',
    color: '#f97316',
    items: [
      'Tropical climate – pack light breathable clothing',
      'Sarong required to enter temples (available for rent)',
      'Shoulders and knees must be covered at sacred sites',
      'Rain jacket recommended for afternoon showers',
      'Good walking shoes essential for temple visits',
    ],
  },
  {
    icon: Users,
    title: 'Local Culture',
    color: '#a855f7',
    items: [
      'Remove shoes before entering homes and temples',
      'Use right hand for giving and receiving',
      'Avoid pointing feet toward people or sacred objects',
      'Ask permission before photographing locals',
      'Dress modestly when visiting villages',
    ],
  },
  {
    icon: Car,
    title: 'Transportation',
    color: '#ec4899',
    items: [
      'All transfers included – private AC vehicles',
      'Gojek/Grab apps work for local rides',
      'Motorbike hire available but not recommended for first-timers',
      'Speedboat transfers to Nusa Penida (30 min)',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Safety Tips',
    color: '#ef4444',
    items: [
      'Drink bottled water only – avoid tap water',
      'Apply sunscreen regularly – UV levels are intense',
      'Watch for monkey pickpockets at Monkey Forest',
      'Keep valuables in hotel safe',
      'Travel insurance strongly recommended',
    ],
  },
  {
    icon: Phone,
    title: 'Emergency Numbers',
    color: '#e5a832',
    items: [
      'Police: 110',
      'Ambulance: 118',
      'Fire: 113',
      'Tourist Police Bali: +62 361 754 599',
      'OMNIA 24/7 Support: Available via WhatsApp',
    ],
  },
  {
    icon: Utensils,
    title: 'Food Recommendations',
    color: '#06b6d4',
    items: [
      'Try Nasi Goreng, Satay, and Babi Guling',
      'Eat at warungs (local restaurants) for authentic flavours',
      'Avoid raw vegetables if stomach is sensitive',
      'Coconut water is safe and refreshing',
      'Jimbaran seafood dinner is a must-do',
    ],
  },
]

const foods = [
  {
    name: 'Nasi Goreng',
    description: 'Indonesia\'s beloved fried rice with egg, kecap manis, and aromatic spices',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
    tag: 'National Dish',
  },
  {
    name: 'Satay',
    description: 'Grilled skewered meat served with rich peanut sauce and compressed rice',
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
    tag: 'Street Food',
  },
  {
    name: 'Mie Goreng',
    description: 'Indonesian stir-fried noodles with vegetables, egg, and savoury sauce',
    image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80',
    tag: 'Comfort Food',
  },
  {
    name: 'Babi Guling',
    description: 'Bali\'s iconic slow-roasted suckling pig stuffed with herbs and spices',
    image: 'https://images.unsplash.com/photo-1544025162-d76538aa2c55?w=800&q=80',
    tag: 'Balinese Specialty',
  },
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

export default function BaliPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])

  const [openGuideline, setOpenGuideline] = useState<number | null>(null)
  const [openDay, setOpenDay] = useState<number | null>(0)

  // Scroll progress bar
  const { scrollYProgress: pageProgress } = useScroll()
  const progressWidth = useTransform(pageProgress, [0, 1], ['0%', '100%'])

  return (
    <div className="bg-[#0a0a0a] overflow-x-hidden">
      {/* ── Scroll Progress Bar ── */}
      <motion.div
        className="fixed top-0 left-0 h-[3px] z-[999] origin-left"
        style={{ width: progressWidth, background: 'linear-gradient(90deg, #e5a832, #f97316, #ec4899)' }}
      />

      {/* ══════════════════ HERO ══════════════════ */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Parallax image */}
        <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
          <Image
            src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=90"
            alt="Bali, Indonesia"
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

        {/* Floating decorative orbs */}
        <motion.div
          className="absolute top-[20%] left-[10%] w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(229,168,50,0.15) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* Hero content */}
        <motion.div className="relative z-10 text-center px-4 max-w-5xl mx-auto" style={{ opacity: heroOpacity }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full border border-white/20 backdrop-blur-sm"
            style={{ background: 'rgba(229,168,50,0.15)' }}
          >
            <Star className="w-4 h-4 text-[#e5a832] fill-[#e5a832]" />
            <span className="text-white/90 text-sm font-medium tracking-widest uppercase">Premium Destination</span>
            <Star className="w-4 h-4 text-[#e5a832] fill-[#e5a832]" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-6xl sm:text-7xl lg:text-9xl font-bold text-white mb-4 leading-none tracking-tight"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
          >
            Bali
          </motion.h1>

          {/* Country badge */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="h-px flex-1 max-w-24" style={{ background: 'linear-gradient(to right, transparent, rgba(229,168,50,0.7))' }} />
            <span className="text-[#e5a832] text-sm font-semibold tracking-[0.3em] uppercase">Indonesia</span>
            <div className="h-px flex-1 max-w-24" style={{ background: 'linear-gradient(to left, transparent, rgba(229,168,50,0.7))' }} />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-white/80 text-lg sm:text-xl lg:text-2xl font-light max-w-2xl mx-auto leading-relaxed"
          >
            Island of Temples, Beaches &amp; Luxury Escapes
          </motion.p>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="absolute bottom-[-160px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-white/50 text-xs tracking-widest uppercase">Scroll to explore</span>
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
      <section className="py-20 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInWhenVisible>
            <div className="text-center mb-14">
              <p className="text-[#e5a832] text-sm font-semibold tracking-widest uppercase mb-3">The Details</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-white">Your Journey at a Glance</h2>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickInfoCards.map((card, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.04 }}
                  className="group relative rounded-2xl p-5 text-center cursor-default overflow-hidden border border-white/5"
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}
                >
                  {/* Glow */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `0 0 40px ${card.color}33`, background: `radial-gradient(circle at center, ${card.color}11, transparent 70%)` }}
                  />
                  <div
                    className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.color}22` }}
                  >
                    <card.icon className="w-6 h-6" style={{ color: card.color }} />
                  </div>
                  <p className="text-white font-bold text-base leading-tight">{card.label}</p>
                  <p className="text-white/50 text-xs mt-1">{card.sub}</p>
                </motion.div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ ITINERARY TIMELINE ══════════════════ */}
      <section className="py-24 bg-[#0d0d0d]">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <FadeInWhenVisible>
            <div className="text-center mb-16">
              <p className="text-[#e5a832] text-sm font-semibold tracking-widest uppercase mb-3">Day by Day</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Your Bali Itinerary</h2>
              <p className="text-white/50 max-w-2xl mx-auto">9 extraordinary days crafted to immerse you in the soul of Indonesia</p>
            </div>
          </FadeInWhenVisible>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 lg:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#e5a832]/60 via-[#f97316]/40 to-transparent" />

            <div className="space-y-4">
              {itinerary.map((item, i) => {
                const isOpen = openDay === i
                return (
                  <FadeInWhenVisible key={i} delay={i * 0.05}>
                    <div className="relative pl-16 lg:pl-20">
                      {/* Day dot */}
                      <motion.div
                        className="absolute left-3 lg:left-4 top-6 w-7 h-7 rounded-full border-2 border-[#e5a832] flex items-center justify-center z-10"
                        style={{ background: isOpen ? '#e5a832' : '#0d0d0d' }}
                        animate={{ scale: isOpen ? 1.2 : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <item.icon className="w-3 h-3" style={{ color: isOpen ? '#000' : '#e5a832' }} />
                      </motion.div>

                      {/* Card */}
                      <motion.div
                        className="rounded-2xl overflow-hidden border cursor-pointer"
                        style={{
                          background: isOpen ? 'rgba(229,168,50,0.05)' : 'rgba(255,255,255,0.03)',
                          borderColor: isOpen ? 'rgba(229,168,50,0.4)' : 'rgba(255,255,255,0.06)',
                        }}
                        whileHover={{ borderColor: 'rgba(229,168,50,0.3)' }}
                        onClick={() => setOpenDay(isOpen ? null : i)}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 lg:p-6">
                          <div className="flex items-center gap-4">
                            <span
                              className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                              style={{ background: 'rgba(229,168,50,0.15)', color: '#e5a832' }}
                            >
                              {item.day}
                            </span>
                            <h3 className="text-white font-semibold text-base lg:text-lg leading-tight">{item.title}</h3>
                          </div>
                          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            <ChevronDown className="w-5 h-5 text-white/40 shrink-0 ml-2" />
                          </motion.div>
                        </div>

                        {/* Expanded content */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                              <div className="px-5 lg:px-6 pb-6 grid md:grid-cols-2 gap-6">
                                {/* Text content */}
                                <div>
                                  <p className="text-white/70 text-sm leading-relaxed mb-4">{item.summary}</p>
                                  {/* Highlight */}
                                  <div
                                    className="flex items-start gap-3 p-3 rounded-xl"
                                    style={{ background: 'rgba(229,168,50,0.08)', border: '1px solid rgba(229,168,50,0.2)' }}
                                  >
                                    <Star className="w-4 h-4 text-[#e5a832] fill-[#e5a832] shrink-0 mt-0.5" />
                                    <p className="text-[#e5a832] text-sm font-medium">{item.highlight}</p>
                                  </div>
                                  {/* Tags */}
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    {item.tags.map((tag, ti) => (
                                      <span
                                        key={ti}
                                        className="text-xs px-3 py-1 rounded-full text-white/60"
                                        style={{ background: 'rgba(255,255,255,0.06)' }}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                {/* Image */}
                                <div className="relative h-44 md:h-auto rounded-xl overflow-hidden">
                                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </FadeInWhenVisible>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ EXPERIENCE HIGHLIGHTS ══════════════════ */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)' }}>
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInWhenVisible>
            <div className="text-center mb-16">
              <p className="text-[#e5a832] text-sm font-semibold tracking-widest uppercase mb-3">Curated Moments</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Experience Highlights</h2>
              <p className="text-white/50 max-w-2xl mx-auto">Eight unforgettable experiences woven into your Bali journey</p>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {experiences.map((exp, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.07}>
                <motion.div
                  className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-default"
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Image */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                      <Image src={exp.image} alt={exp.title} fill className="object-cover" />
                    </div>
                  </div>

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'linear-gradient(to top, rgba(229,168,50,0.4), transparent 60%)' }}
                  />

                  {/* Icon badge */}
                  <div
                    className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm"
                    style={{ background: 'rgba(0,0,0,0.4)' }}
                  >
                    <exp.icon className="w-4 h-4 text-white/80" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#e5a832] transition-colors duration-300">{exp.title}</h3>
                    <p
                      className="text-white/0 group-hover:text-white/80 text-xs leading-relaxed transition-all duration-400 translate-y-2 group-hover:translate-y-0"
                      style={{ transitionDuration: '400ms' }}
                    >
                      {exp.description}
                    </p>
                  </div>
                </motion.div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ TRAVEL GUIDELINES ══════════════════ */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeInWhenVisible>
            <div className="text-center mb-16">
              <p className="text-[#e5a832] text-sm font-semibold tracking-widest uppercase mb-3">Essential Knowledge</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Travel Guidelines</h2>
              <p className="text-white/50 max-w-xl mx-auto">Everything you need to know for a seamless and respectful Bali experience</p>
            </div>
          </FadeInWhenVisible>

          <div className="grid md:grid-cols-2 gap-4">
            {guidelines.map((guide, i) => {
              const isOpen = openGuideline === i
              return (
                <FadeInWhenVisible key={i} delay={i * 0.06}>
                  <motion.div
                    className="rounded-2xl overflow-hidden border cursor-pointer"
                    style={{
                      background: isOpen ? `${guide.color}08` : 'rgba(255,255,255,0.03)',
                      borderColor: isOpen ? `${guide.color}40` : 'rgba(255,255,255,0.06)',
                    }}
                    whileHover={{ borderColor: `${guide.color}30` }}
                    onClick={() => setOpenGuideline(isOpen ? null : i)}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `${guide.color}20` }}
                        >
                          <guide.icon className="w-5 h-5" style={{ color: guide.color }} />
                        </div>
                        <span className="text-white font-semibold">{guide.title}</span>
                      </div>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown className="w-4 h-4 text-white/40" />
                      </motion.div>
                    </div>

                    {/* Expanded */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35 }}
                        >
                          <div className="px-5 pb-5">
                            <div className="h-px mb-4" style={{ background: `${guide.color}20` }} />
                            <ul className="space-y-2">
                              {guide.items.map((item, ii) => (
                                <li key={ii} className="flex items-start gap-3">
                                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: guide.color }} />
                                  <span className="text-white/70 text-sm leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
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

      {/* ══════════════════ FOOD & CULTURE ══════════════════ */}
      <section className="py-24" style={{ background: 'linear-gradient(to bottom, #0d0d0d, #000)' }}>
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInWhenVisible>
            <div className="text-center mb-16">
              <p className="text-[#e5a832] text-sm font-semibold tracking-widest uppercase mb-3">Taste of Bali</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Food &amp; Culture</h2>
              <p className="text-white/50 max-w-2xl mx-auto">Indonesian cuisine is a symphony of spices, aromas, and centuries of tradition</p>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {foods.map((food, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.1}>
                <motion.div
                  className="group relative rounded-2xl overflow-hidden border border-white/5 cursor-default"
                  whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(229,168,50,0.15)' }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                      <Image src={food.image} alt={food.name} fill className="object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {/* Tag floating */}
                    <div
                      className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: 'rgba(229,168,50,0.9)', color: '#000' }}
                    >
                      {food.tag}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#e5a832] transition-colors duration-300">{food.name}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{food.description}</p>
                  </div>
                </motion.div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CLOSING VISUAL BANNER ══════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85"
            alt="Bali landscape"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(229,168,50,0.15) 0%, transparent 50%, rgba(249,115,22,0.1) 100%)' }} />
        </div>

        <FadeInWhenVisible>
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <motion.div
              className="inline-block mb-6"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-5xl">🌺</span>
            </motion.div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Bali Awaits<br />
              <span style={{ color: '#e5a832' }}>Your Story</span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              From the misty rice terraces of Ubud to the dramatic cliffs of Nusa Penida — every moment in Bali is a memory waiting to be made.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Temples', 'Beaches', 'Culture', 'Adventure', 'Luxury', 'Cuisine'].map((tag, i) => (
                <motion.span
                  key={i}
                  className="px-5 py-2 rounded-full text-sm font-medium border border-white/20 text-white/80 backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </div>
        </FadeInWhenVisible>
      </section>
    </div>
  )
}
