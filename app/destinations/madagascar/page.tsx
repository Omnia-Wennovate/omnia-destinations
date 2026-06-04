'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Star,
  Car,
  Coffee,
  Landmark,
  ChevronDown,
  Shield,
  Check,
  X,
  Leaf,
  Clock,
  Plane,
  Hotel,
  TreePine,
  Bird,
  Mountain,
  Camera,
  Moon,
  Sun,
  Compass,
  Heart,
  Globe,
  DollarSign,
  Shirt,
  AlertTriangle,
  Phone,
  ShoppingBag,
  Binoculars,
  Crown,
  Sparkles,
} from 'lucide-react'

/* ─────────────────────────────────────── Data ─────────────────────────────────────── */

const quickInfoCards = [
  { icon: Calendar, label: '6 Days', sub: '5 Nights', color: '#10b981' },
  { icon: Car, label: 'Private Tours', sub: 'Fully Guided', color: '#e5a832' },
  { icon: Plane, label: 'Airport Transfers', sub: 'Included', color: '#3b82f6' },
  { icon: Hotel, label: 'Premium Hotels', sub: 'Quality Stays', color: '#a855f7' },
  { icon: Coffee, label: 'Daily Breakfast', sub: 'Included', color: '#f97316' },
  { icon: Binoculars, label: 'Wildlife Excursion', sub: 'Vohimana Forest', color: '#06b6d4' },
]

const experienceCards = [
  {
    title: 'Antananarivo',
    description: 'Madagascar\'s vibrant capital — a hillside city of French colonial charm, bustling markets, and panoramic skyline views',
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
    icon: Landmark,
    color: '#e5a832',
  },
  {
    title: 'Vohimana Forest',
    description: 'Ancient rainforest sanctuary — home to rare orchids, towering ferns, and Madagascar\'s most iconic wildlife',
    image: 'https://images.unsplash.com/photo-1504567961542-e24d9439a724?w=800&q=80',
    icon: TreePine,
    color: '#10b981',
  },
  {
    title: 'Lemur Encounters',
    description: 'Come face-to-face with the extraordinary Indri Indri — the largest living lemur found nowhere else on Earth',
    image: 'https://images.unsplash.com/photo-1632255646075-f399e14649da?w=800&q=80',
    icon: Heart,
    color: '#f97316',
  },
  {
    title: 'Sacred Hill',
    description: 'Ambohimanga — UNESCO World Heritage royal fortress, sacred to the Merina Kingdom for five centuries',
    image: 'https://images.unsplash.com/photo-1590418606746-018840f9cd0f?w=800&q=80',
    icon: Crown,
    color: '#a855f7',
  },
  {
    title: 'Waterfalls',
    description: 'Cascading forest waterfalls hidden deep in the Vohimana reserve — an untouched paradise of mist and emerald pools',
    image: 'https://images.unsplash.com/photo-1546587348-d12660c30c50?w=800&q=80',
    icon: Mountain,
    color: '#06b6d4',
  },
  {
    title: 'Natural Pools',
    description: 'Crystal-clear natural swimming pools carved by centuries of flowing mountain water through volcanic rock',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    icon: Compass,
    color: '#3b82f6',
  },
  {
    title: 'Night Experience',
    description: 'Antananarivo after dark — rooftop dining, vibrant nightlife, and the glittering city lights across the hills',
    image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80',
    icon: Moon,
    color: '#ec4899',
  },
  {
    title: 'Local Markets',
    description: 'Explore colourful Malagasy artisan markets — handcrafted raffia, vanilla, precious stones, and exotic spices',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&q=80',
    icon: ShoppingBag,
    color: '#84cc16',
  },
]

const itinerary = [
  {
    day: 'Day 1',
    title: 'Arrival in Antananarivo',
    icon: Plane,
    color: '#3b82f6',
    time: 'Upon Arrival',
    services: [
      'Airport meet & greet with private representative',
      'Private luxury transfer to hotel',
      'Hotel check-in and welcome refreshments',
      'Leisure afternoon — rest and acclimatise',
      'Evening city exploration at your own pace',
    ],
    tags: ['Airport Transfer', 'Hotel Check-in', 'Leisure Day'],
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
    highlight: 'Private meet-and-greet — your Madagascar adventure begins',
  },
  {
    day: 'Day 2',
    title: 'Antananarivo Full Day Tour',
    icon: Camera,
    color: '#e5a832',
    time: 'Pickup 08:00 AM',
    services: [
      'Guided tour of historical Antananarivo landmarks',
      'Visit cultural monuments and colonial architecture',
      'Explore local attractions and panoramic viewpoints',
      'Flora and fauna discovery at botanical sites',
      'Traditional Malagasy lunch experience',
      'Return private transfer to hotel',
    ],
    tags: ['City Tour', 'Cultural Heritage', 'Flora & Fauna', 'Guided Tour'],
    image: 'https://images.unsplash.com/photo-1590418606746-018840f9cd0f?w=800&q=80',
    highlight: 'Immerse yourself in Madagascar\'s rich cultural tapestry',
  },
  {
    day: 'Day 3',
    title: 'Vohimana Rainforest Adventure',
    icon: TreePine,
    color: '#10b981',
    time: 'Early Morning Departure',
    services: [
      'Scenic private drive to Vohimana Reserve',
      'Guided rainforest exploration and nature walk',
      'Botanical trail through ancient flora',
      'Discover hidden waterfalls deep in the forest',
      'Explore ancient tunnels and rock formations',
      'Swim in natural crystal-clear mountain pool',
    ],
    tags: ['Rainforest', 'Waterfalls', 'Swimming Pool', 'Ancient Tunnels', 'Botanical Trail'],
    image: 'https://images.unsplash.com/photo-1504567961542-e24d9439a724?w=800&q=80',
    highlight: 'Complete rainforest immersion — waterfalls, tunnels & wild swimming',
  },
  {
    day: 'Day 4',
    title: 'Wildlife Discovery & Return',
    icon: Binoculars,
    color: '#f97316',
    time: 'Morning Departure',
    services: [
      'Guided forest hike through Vohimana canopy',
      'Indri Indri lemur encounter — the world\'s largest lemur',
      'Bird watching in pristine tropical habitat',
      'Reptile and chameleon observation',
      'Return private transfer to Antananarivo',
      'Afternoon market exploration at Analakely',
    ],
    tags: ['Lemurs', 'Bird Watching', 'Reptiles', 'Market Visit', 'Forest Hike'],
    image: 'https://images.unsplash.com/photo-1632255646075-f399e14649da?w=800&q=80',
    highlight: 'Face-to-face with the legendary Indri Indri lemurs',
  },
  {
    day: 'Day 5',
    title: 'Ambohimanga Sacred Hill + Night Tour',
    icon: Crown,
    color: '#a855f7',
    time: 'Morning Departure',
    services: [
      'Visit UNESCO Royal Hill of Ambohimanga',
      'Explore the historic royal palace and fortifications',
      'Discover royal bathing pools and sacred grounds',
      'Walk through medicinal gardens of the Merina kings',
      'Panoramic city views at sunset',
      'Traditional Malagasy dinner experience',
      'Guided Antananarivo nightlife exploration',
    ],
    tags: ['UNESCO Heritage', 'Royal Palace', 'Night Tour', 'Traditional Dinner', 'City Views'],
    image: 'https://images.unsplash.com/photo-1590418606746-018840f9cd0f?w=800&q=80',
    highlight: 'Walk the sacred grounds of Madagascar\'s royal heritage',
  },
  {
    day: 'Day 6',
    title: 'Departure — Farewell to Madagascar',
    icon: Plane,
    color: '#06b6d4',
    time: 'Scheduled by Flight',
    services: [
      'Leisurely breakfast at hotel',
      'Hotel checkout and luggage preparation',
      'Private luxury airport transfer',
      'Premium departure service',
      'Veloma! — Thank you for choosing OMNIA',
    ],
    tags: ['Hotel Checkout', 'Airport Transfer', 'Departure'],
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
    highlight: 'Smooth private departure — carry Madagascar in your heart forever',
  },
]

const wildlifeShowcase = [
  {
    name: 'Indri Indri Lemurs',
    description: 'The largest living lemur species — their haunting calls echo through Madagascar\'s ancient rainforests. Found nowhere else on Earth.',
    image: 'https://images.unsplash.com/photo-1632255646075-f399e14649da?w=800&q=80',
    tag: 'Iconic Species',
  },
  {
    name: 'Exotic Birds',
    description: 'Over 280 bird species call Madagascar home — from the vivid Madagascar kingfisher to the rare velvet asity.',
    image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=80',
    tag: 'Avian Paradise',
  },
  {
    name: 'Tropical Forests',
    description: 'Ancient rainforests that predate human settlement — towering canopies sheltering 90% of species found nowhere else.',
    image: 'https://images.unsplash.com/photo-1504567961542-e24d9439a724?w=800&q=80',
    tag: 'Ecosystem',
  },
  {
    name: 'Reptiles & Chameleons',
    description: 'Home to half the world\'s chameleon species — from the tiny Brookesia micra to the spectacular panther chameleon.',
    image: 'https://images.unsplash.com/photo-1504450874802-0ba2bcd659e3?w=800&q=80',
    tag: 'Unique Wildlife',
  },
  {
    name: 'Native Flora',
    description: 'Iconic baobab avenues, rare orchids, and the traveller\'s palm — botanical wonders sculpted by millions of years of isolation.',
    image: 'https://images.unsplash.com/photo-1509515837298-2c67a3933321?w=800&q=80',
    tag: 'Botanical Heritage',
  },
]

const included = [
  '5 nights premium hotel accommodation',
  'Daily breakfast at hotel',
  'All private airport transfers (both ways)',
  'All guided tours as per itinerary',
  'Vohimana Rainforest excursion (2 days)',
  'Wildlife & lemur tracking experience',
  'Ambohimanga Sacred Hill guided tour',
  'Night city tour of Antananarivo',
  'Professional licensed local guide',
  'Private air-conditioned vehicle throughout',
]

const excluded = [
  'International flights to/from Antananarivo',
  'Tourist visa fee (if applicable)',
  'Travel insurance (strongly recommended)',
  'Personal expenses and souvenirs',
  'Tips and gratuities',
  'Optional evening activities not in itinerary',
]

const travelGuide = [
  {
    icon: Shield,
    title: 'Travel Documents',
    color: '#3b82f6',
    items: [
      'Valid passport required — at least 6 months validity beyond travel date',
      'Tourist visa required for most nationalities (available on arrival or eVisa)',
      'Ethiopian passport holders — visa on arrival available (approx. USD 37)',
      'Keep digital and physical copies of all documents',
      'Yellow fever vaccination certificate may be required',
    ],
  },
  {
    icon: DollarSign,
    title: 'Currency',
    color: '#10b981',
    items: [
      'Local currency: Malagasy Ariary (MGA)',
      'EUR and USD accepted at major hotels and tourist areas',
      'ATMs available in Antananarivo — limited in rural areas',
      'Carry small denominations for markets and tips',
      'Credit cards accepted at upscale establishments',
    ],
  },
  {
    icon: Binoculars,
    title: 'Wildlife Information',
    color: '#f97316',
    items: [
      'Madagascar is the world\'s 4th largest island with 90% endemic species',
      'Lemurs are the island\'s most iconic animals — over 100 species exist',
      'Best wildlife viewing: early morning and late afternoon',
      'Maintain 3-metre distance from all wildlife',
      'Photography allowed — no flash near animals',
    ],
  },
  {
    icon: Shirt,
    title: 'Packing Guide',
    color: '#a855f7',
    items: [
      'Lightweight, breathable clothing for tropical climate',
      'Sturdy hiking boots for rainforest trails',
      'Rain jacket — tropical showers are common',
      'Insect repellent (DEET recommended for forest areas)',
      'Sunscreen SPF 50+ and wide-brim hat',
      'Binoculars for wildlife and bird watching',
    ],
  },
  {
    icon: Heart,
    title: 'Cultural Etiquette',
    color: '#ec4899',
    items: [
      '"Fady" (taboos) are deeply respected — ask your guide about local customs',
      'Always ask permission before photographing people',
      'Remove shoes when entering homes or sacred sites',
      'Greetings are important — "Salama" means hello',
      'Tipping is appreciated but not obligatory',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Health & Safety',
    color: '#ef4444',
    items: [
      'Anti-malaria prophylaxis recommended — consult your doctor',
      'Drink bottled or purified water only',
      'Travel insurance is strongly recommended',
      'OMNIA provides 24/7 local emergency support',
      'Hospitals available in Antananarivo — limited in rural areas',
    ],
  },
  {
    icon: Car,
    title: 'Transportation',
    color: '#06b6d4',
    items: [
      'All transfers in private air-conditioned vehicles',
      'Road conditions vary — some routes are unpaved',
      'Drive time to Vohimana: approx. 3-4 hours scenic route',
      'Domestic flights available for longer distances',
      'Your driver and guide are with you throughout',
    ],
  },
  {
    icon: ShoppingBag,
    title: 'Local Markets',
    color: '#84cc16',
    items: [
      'Analakely Market is Antananarivo\'s largest daily market',
      'Famous exports: vanilla, cloves, ylang-ylang, precious stones',
      'Handcrafted raffia products make excellent souvenirs',
      'Bargaining is expected and part of the experience',
      'Support local artisans — buy direct when possible',
    ],
  },
]

/* ────────────────────────────── Utility Components ─────────────────────────────────── */

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
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

/* ──────────────────────────────────── Page ──────────────────────────────────────── */

export default function MadagascarPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '32%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])

  const [openDay, setOpenDay] = useState<number | null>(0)
  const [openGuide, setOpenGuide] = useState<number | null>(null)

  const { scrollYProgress: pageProgress } = useScroll()
  const barWidth = useTransform(pageProgress, [0, 1], ['0%', '100%'])

  return (
    <div className="bg-white overflow-x-hidden font-sans">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 h-[3px] z-[999] origin-left"
        style={{ width: barWidth, background: 'linear-gradient(90deg, #10b981, #06b6d4, #3b82f6)' }}
      />

      {/* ══════════════ HERO ══════════════ */}
      <section ref={heroRef} className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
          <Image
            src="https://images.unsplash.com/photo-1504567961542-e24d9439a724?w=1920&q=90"
            alt="Madagascar Rainforest"
            fill
            className="object-cover"
            priority
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/35" />

        <motion.div className="relative z-10 text-center px-4 max-w-5xl mx-auto" style={{ opacity: heroOpacity }}>
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="inline-flex items-center gap-2 mb-7 px-5 py-2 rounded-full border border-white/20 backdrop-blur-sm"
            style={{ background: 'rgba(16,185,129,0.13)' }}
          >
            <Star className="w-4 h-4 text-[#10b981] fill-[#10b981]" />
            <span className="text-white/90 text-xs font-semibold tracking-[0.25em] uppercase">Premium Eco-Adventure</span>
            <Star className="w-4 h-4 text-[#10b981] fill-[#10b981]" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.35 }}
            className="text-6xl sm:text-7xl lg:text-[7rem] font-bold text-white leading-none tracking-tight mb-3"
            style={{ textShadow: '0 6px 40px rgba(0,0,0,0.55)' }}
          >
            Discover Madagascar
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.65, delay: 0.75 }}
            className="flex items-center justify-center gap-3 mb-5"
          >
            <div className="h-px flex-1 max-w-[100px]" style={{ background: 'linear-gradient(to right, transparent, rgba(16,185,129,0.75))' }} />
            <span className="text-[#10b981] text-xs font-bold tracking-[0.32em] uppercase">Rainforests • Wildlife • Culture • Adventure</span>
            <div className="h-px flex-1 max-w-[100px]" style={{ background: 'linear-gradient(to left, transparent, rgba(16,185,129,0.75))' }} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.95 }}
            className="text-white/75 text-lg sm:text-xl lg:text-2xl font-light max-w-xl mx-auto leading-relaxed"
          >
            6 Days • 5 Nights Premium Madagascar Experience
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 1.25 }}
            className="flex flex-wrap justify-center gap-3 mt-9"
          >
            {['Antananarivo', 'Vohimana Rainforest', 'Lemur Encounters', 'UNESCO Heritage', 'Waterfall Trails', 'Malagasy Culture'].map((item, i) => (
              <span key={i} className="px-4 py-2 rounded-full text-sm font-medium text-white/90 border border-white/15 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.07)' }}>
                {item}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="absolute bottom-[-175px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-white/40 text-[10px] tracking-[0.25em] uppercase">Scroll to explore</span>
            <motion.div animate={{ y: [0, 9, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className="w-6 h-10 rounded-full border border-white/25 flex items-start justify-center pt-2">
              <div className="w-1 h-2 bg-white/55 rounded-full" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════ QUICK INFO CARDS ══════════════ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-[#10b981] text-sm font-semibold tracking-widest uppercase mb-3">The Details</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">Your Adventure at a Glance</h2>
            </div>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickInfoCards.map((card, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ duration: 0.25 }}
                  className="group relative rounded-2xl p-5 text-center cursor-default overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at center, ${card.color}08, transparent 70%)` }} />
                  <div className="relative w-11 h-11 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: `${card.color}15` }}>
                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <p className="relative text-gray-900 font-bold text-sm leading-tight">{card.label}</p>
                  <p className="relative text-gray-400 text-xs mt-1">{card.sub}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ EXPERIENCE CARDS ══════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[#10b981] text-sm font-semibold tracking-widest uppercase mb-3">Curated Destinations</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">8 Unforgettable Experiences</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Each experience handpicked to reveal the true soul of Madagascar</p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {experienceCards.map((exp, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <motion.div
                  className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-default shadow-md hover:shadow-xl transition-shadow duration-500"
                  whileHover={{ y: -7 }}
                  transition={{ duration: 0.32 }}
                >
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                      <Image src={exp.image} alt={exp.title} fill className="object-cover" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(to top, ${exp.color}55, transparent 60%)` }} />
                  <div className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.45)' }}>
                    <exp.icon className="w-4 h-4 text-white/80" />
                  </div>
                  <div className="absolute top-4 left-4 text-xs font-bold px-2 py-1 rounded-md" style={{ background: `${exp.color}cc`, color: '#fff' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-xl mb-2 group-hover:text-[#10b981] transition-colors duration-300">{exp.title}</h3>
                    <p className="text-white/0 group-hover:text-white/80 text-sm leading-relaxed transition-all duration-500 translate-y-3 group-hover:translate-y-0">{exp.description}</p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ ITINERARY ══════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[#10b981] text-xs font-semibold tracking-[0.3em] uppercase mb-3">Day by Day</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">Your Madagascar Itinerary</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-[#10b981] to-[#06b6d4] mx-auto rounded-full" />
              <p className="text-gray-500 max-w-xl mx-auto mt-4">6 extraordinary days crafted to immerse you in the magic of the Great Red Island</p>
            </div>
          </FadeUp>

          <div className="space-y-3">
            {itinerary.map((item, i) => {
              const isOpen = openDay === i
              return (
                <FadeUp key={i} delay={i * 0.06}>
                  <motion.div
                    layout
                    className="rounded-2xl overflow-hidden border bg-white transition-shadow duration-300"
                    style={{
                      borderColor: isOpen ? `${item.color}40` : '#e5e7eb',
                      boxShadow: isOpen ? `0 4px 24px ${item.color}15` : '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  >
                    <button onClick={() => setOpenDay(isOpen ? null : i)} className="w-full text-left">
                      <div className="flex items-center p-5 lg:p-6 gap-4">
                        <span
                          className="shrink-0 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                          style={{ background: `${item.color}12`, color: item.color }}
                        >
                          {item.day}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 font-semibold text-base lg:text-lg leading-snug">{item.title}</h3>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-400 text-xs">{item.time}</span>
                          </div>
                        </div>
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0 ml-3">
                          <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ background: isOpen ? `${item.color}12` : '#f9fafb', borderColor: isOpen ? `${item.color}40` : '#e5e7eb' }}>
                            <ChevronDown className="w-4 h-4" style={{ color: isOpen ? item.color : '#9ca3af' }} />
                          </div>
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="px-5 lg:px-6 pb-6 pt-2 bg-gray-50 border-t border-gray-100 grid md:grid-cols-2 gap-6">
                            <div>
                              <ul className="space-y-2 mb-4">
                                {item.services.map((svc, si) => (
                                  <li key={si} className="flex items-start gap-3">
                                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: item.color }} />
                                    <span className="text-gray-600 text-sm leading-relaxed">{svc}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
                                <Star className="w-4 h-4 shrink-0 mt-0.5 fill-current" style={{ color: item.color }} />
                                <p className="text-sm font-medium" style={{ color: item.color }}>{item.highlight}</p>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-4">
                                {item.tags.map((tag, ti) => (
                                  <span key={ti} className="text-xs px-3 py-1 rounded-full bg-white text-gray-500 border border-gray-200">{tag}</span>
                                ))}
                              </div>
                            </div>
                            <div className="relative h-48 md:h-auto rounded-xl overflow-hidden">
                              <Image src={item.image} alt={item.title} fill className="object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            </div>
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

      {/* ══════════════ WILDLIFE EXPERIENCE ══════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[#10b981] text-sm font-semibold tracking-widest uppercase mb-3">Wild Madagascar</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">Wildlife Experience</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Home to species found nowhere else on Earth — Madagascar is a living laboratory of evolution</p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Featured large card */}
            <FadeUp delay={0.1} className="md:col-span-2 lg:col-span-2">
              <motion.div
                className="group relative rounded-2xl overflow-hidden aspect-[16/9] cursor-default shadow-lg hover:shadow-xl transition-shadow duration-500"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.4 }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
                    <Image src={wildlifeShowcase[0].image} alt={wildlifeShowcase[0].name} fill className="object-cover" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute top-5 left-5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#10b981] text-white">
                  {wildlifeShowcase[0].tag}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <h3 className="text-white font-bold text-2xl lg:text-3xl mb-3 group-hover:text-[#10b981] transition-colors duration-300">
                    {wildlifeShowcase[0].name}
                  </h3>
                  <p className="text-white/80 text-sm lg:text-base leading-relaxed max-w-lg">{wildlifeShowcase[0].description}</p>
                </div>
              </motion.div>
            </FadeUp>

            {/* Side card */}
            <FadeUp delay={0.2}>
              <motion.div
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-default shadow-lg hover:shadow-xl transition-shadow duration-500"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.4 }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                    <Image src={wildlifeShowcase[1].image} alt={wildlifeShowcase[1].name} fill className="object-cover" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full bg-[#10b981] text-white">
                  {wildlifeShowcase[1].tag}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#10b981] transition-colors duration-300">{wildlifeShowcase[1].name}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{wildlifeShowcase[1].description}</p>
                </div>
              </motion.div>
            </FadeUp>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
            {wildlifeShowcase.slice(2).map((item, i) => (
              <FadeUp key={i} delay={0.1 + i * 0.1}>
                <motion.div
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-default shadow-md hover:shadow-xl transition-shadow duration-500"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full bg-[#10b981] text-white">
                    {item.tag}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[#10b981] transition-colors duration-300">{item.name}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ UNESCO HERITAGE ══════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[#a855f7] text-sm font-semibold tracking-widest uppercase mb-3">World Heritage</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">Ambohimanga Sacred Hill</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">UNESCO World Heritage Site — the spiritual heart of Madagascar&apos;s royal Merina kingdom</p>
            </div>
          </FadeUp>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <FadeUp delay={0.1}>
              <motion.div
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] shadow-lg"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
                    <Image
                      src="https://images.unsplash.com/photo-1590418606746-018840f9cd0f?w=1200&q=85"
                      alt="Ambohimanga Sacred Hill"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-5 left-5 inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border border-white/30 bg-white/20">
                  <Crown className="w-4 h-4 text-[#a855f7]" />
                  <span className="text-white text-xs font-semibold tracking-wider uppercase">UNESCO Listed</span>
                </div>
              </motion.div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <div className="space-y-4">
                {[
                  { title: 'Royal Fortress', desc: 'For five centuries, Ambohimanga served as the seat of Madagascar\'s Merina monarchy — a fortified hilltop of sacred significance.', icon: Crown },
                  { title: 'Historic Palace', desc: 'Explore the royal rova, the king\'s residence with original furnishings, and the queens\' quarters that witnessed centuries of intrigue.', icon: Landmark },
                  { title: 'Sacred Grounds', desc: 'Walk through royal bathing pools, medicinal herb gardens, and sacrificial sites still revered by the Malagasy people today.', icon: Leaf },
                  { title: 'Panoramic Views', desc: 'From the hilltop, gaze across the central highlands — an endless tapestry of terraced rice paddies and rolling hills.', icon: Sun },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="group flex items-start gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-[#a855f7]/25 transition-all duration-300"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  >
                    <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: '#a855f715' }}>
                      <item.icon className="w-5 h-5 text-[#a855f7]" />
                    </div>
                    <div>
                      <h4 className="text-gray-900 font-semibold mb-1">{item.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════ NIGHTLIFE EXPERIENCE ══════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&q=85"
            alt="Antananarivo Night"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/65" />
        </div>

        <div className="relative z-10 container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[#ec4899] text-sm font-semibold tracking-widest uppercase mb-3">After Dark</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">Antananarivo by Night</h2>
              <p className="text-white/70 max-w-2xl mx-auto">When the sun sets, Madagascar&apos;s capital transforms — discover panoramic rooftops, traditional cuisine, and vibrant local culture</p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: 'Panoramic Views', desc: 'Hilltop viewpoints overlooking the glittering city', icon: Sun, color: '#e5a832' },
              { title: 'Traditional Dining', desc: 'Authentic Malagasy cuisine at premium restaurants', icon: Coffee, color: '#10b981' },
              { title: 'Cultural Shows', desc: 'Live traditional music and Malagasy performances', icon: Sparkles, color: '#a855f7' },
              { title: 'Local Nightlife', desc: 'Vibrant bars and lounges with a distinctly Malagasy soul', icon: Moon, color: '#ec4899' },
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <motion.div
                  className="group rounded-2xl p-6 border border-white/15 backdrop-blur-md text-center cursor-default"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: `${item.color}25` }}>
                    <item.icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ INCLUDED / EXCLUDED ══════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-[#10b981] text-sm font-semibold tracking-widest uppercase mb-3">What&apos;s Covered</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-3">Included & Excluded</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Complete transparency — know exactly what your premium package covers</p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-6">
            <FadeUp delay={0.1}>
              <div className="bg-white border border-emerald-100 rounded-3xl p-8 h-full shadow-sm">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-emerald-50 border border-emerald-100">
                  <Check className="w-5 h-5 text-[#10b981]" />
                </div>
                <h3 className="text-gray-900 font-bold text-xl mb-1">What&apos;s Included</h3>
                <p className="text-[#10b981] text-xs font-medium mb-5">All covered for you</p>
                <div className="h-px mb-5 bg-emerald-100" />
                <ul className="space-y-3">
                  {included.map((item, i) => (
                    <motion.li key={i} className="flex items-start gap-3" initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.4 }}>
                      <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <div className="bg-white border border-rose-100 rounded-3xl p-8 h-full shadow-sm">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-rose-50 border border-rose-100">
                  <X className="w-5 h-5 text-[#ef4444]" />
                </div>
                <h3 className="text-gray-900 font-bold text-xl mb-1">Not Included</h3>
                <p className="text-[#ef4444] text-xs font-medium mb-5">Plan for these extras</p>
                <div className="h-px mb-5 bg-rose-100" />
                <ul className="space-y-3">
                  {excluded.map((item, i) => (
                    <motion.li key={i} className="flex items-start gap-3" initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}>
                      <X className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-5 p-3 rounded-xl bg-rose-50 border border-rose-100">
                  <p className="text-gray-500 text-xs leading-relaxed">
                    💡 Travel insurance is strongly recommended. OMNIA can assist with recommendations — ask your travel advisor.
                  </p>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════ TRAVEL GUIDE ══════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[#10b981] text-sm font-semibold tracking-widest uppercase mb-3">Essential Knowledge</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">Travel Guide</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Everything you need for a seamless and respectful Madagascar experience</p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-4">
            {travelGuide.map((guide, i) => {
              const isOpen = openGuide === i
              return (
                <FadeUp key={i} delay={i * 0.06}>
                  <motion.div
                    className="rounded-2xl overflow-hidden border bg-white transition-shadow duration-300 cursor-pointer"
                    style={{
                      borderColor: isOpen ? `${guide.color}40` : '#e5e7eb',
                      boxShadow: isOpen ? `0 4px 20px ${guide.color}12` : '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                    onClick={() => setOpenGuide(isOpen ? null : i)}
                  >
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${guide.color}12` }}>
                          <guide.icon className="w-5 h-5" style={{ color: guide.color }} />
                        </div>
                        <span className="text-gray-900 font-semibold">{guide.title}</span>
                      </div>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    </div>

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
                                  <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
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

      {/* ══════════════ PRICE SHOWCASE ══════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <FadeUp>
            <motion.div
              className="relative rounded-3xl overflow-hidden border border-emerald-100 bg-white p-10 lg:p-14 text-center shadow-lg"
              whileHover={{ shadow: '0 12px 40px rgba(16,185,129,0.12)' }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative">
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-emerald-200 bg-emerald-50">
                  <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="text-[#10b981] text-xs font-semibold tracking-wider uppercase">Premium Package</span>
                </div>

                <h3 className="text-gray-500 text-lg font-medium mb-2">Price Per Person</h3>

                <div className="mb-3">
                  <span
                    className="text-5xl lg:text-7xl font-bold bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #10b981, #06b6d4, #10b981)' }}
                  >
                    509,000
                  </span>
                  <span className="text-gray-400 text-2xl lg:text-3xl font-semibold ml-3">ETB</span>
                </div>

                <p className="text-gray-400 text-sm mb-8">6 Days • 5 Nights • All Inclusive Experience</p>

                <div className="flex flex-wrap justify-center gap-3">
                  {['Premium Hotels', 'Private Tours', 'Wildlife Excursion', 'UNESCO Heritage'].map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50"
                    >
                      <Check className="w-3 h-3 text-[#10b981]" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════ CLOSING CTA ══════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1509515837298-2c67a3933321?w=1920&q=85" alt="Madagascar Baobabs" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <FadeUp>
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Begin Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#06b6d4]">Madagascar Adventure</span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              Ancient rainforests, extraordinary wildlife, royal heritage, and the warmth of Malagasy culture — all crafted into one unforgettable journey.
            </p>
            <button className="px-10 py-4 bg-[#10b981] text-white font-bold rounded-full text-sm tracking-wide hover:bg-[#059669] hover:scale-105 transition-all duration-300 shadow-lg">
              Start Planning
            </button>
          </div>
        </FadeUp>
      </section>
    </div>
  )
}
