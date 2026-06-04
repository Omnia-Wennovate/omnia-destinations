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
  Shield,
  Phone,
  Shirt,
  DollarSign,
  AlertTriangle,
  Check,
  Plane,
  Compass,
  Sunset,
  Palmtree,
  Ship,
  Sparkles,
  Map,
} from 'lucide-react'

/* ─────────────────────────────────── Data ─────────────────────────────────── */

const quickExperiences = [
  {
    title: 'Safari World',
    description: 'Immersive safari drive showcasing exotic African and Asian wildlife in open habitats.',
    image: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80',
    color: '#e5a832',
    icon: Compass,
  },
  {
    title: 'Marine Park',
    description: 'Spectacular marine shows, dolphin encounters, and exciting exhibits.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    color: '#3b82f6',
    icon: Waves,
  },
  {
    title: 'Coral Island',
    description: 'Pristine white sand beaches and crystal-clear turquoise waters of Koh Larn.',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
    color: '#06b6d4',
    icon: Palmtree,
  },
  {
    title: 'Nong Nooch Village',
    description: 'World-renowned botanical gardens and vibrant traditional Thai cultural performances.',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80',
    color: '#10b981',
    icon: Landmark,
  },
  {
    title: 'Sanctuary of Truth',
    description: 'A breathtaking, hand-carved wooden temple exploring art, philosophy, and faith.',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
    color: '#a855f7',
    icon: Sparkles,
  },
  {
    title: 'Pattaya View Point',
    description: 'Panoramic views of the crescent bay of Pattaya at sunset.',
    image: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=800&q=80',
    color: '#f97316',
    icon: Sunset,
  },
  {
    title: 'Speedboat Experience',
    description: 'Thrilling ocean rides over the emerald waters of the Gulf of Thailand.',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
    color: '#ec4899',
    icon: Ship,
  },
  {
    title: 'Beach Leisure',
    description: 'Unwind on tropical coastlines with gold sands and luxury beachfront service.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    color: '#e5a832',
    icon: Sun,
  },
]

const itinerary = [
  {
    day: 'Day 1',
    title: 'Addis Ababa to Bangkok',
    subtitle: 'Departure Journey',
    time: 'Flight Scheduled',
    meals: 'In-flight meals',
    icon: Plane,
    color: '#e5a832',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
    summary: 'Embark on your luxury escape. Begin with an effortless airport check-in at Bole International Airport in Addis Ababa, followed by your departure flight to Bangkok. Enjoy premium in-flight hospitality as you cross continents.',
    highlight: 'Premium departure experience at Bole Airport',
    activities: [
      'Airport check-in at Bole International Airport (ADD)',
      'Boarding departure flight to Bangkok (BKK)',
      'Cinematic night flight journey and visual relaxation'
    ]
  },
  {
    day: 'Day 2',
    title: 'Arrival in Bangkok',
    subtitle: 'Welcome to the Kingdom of Thailand',
    time: 'Arrival Transfer',
    meals: 'Welcome Dinner Included',
    icon: Landmark,
    color: '#3b82f6',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
    summary: 'Land at Suvarnabhumi Airport in Bangkok. Move smoothly through the Visa on Arrival process with our guide\'s assistance. Step into a meet-and-greet service followed by a private transfer to your luxury hotel. Settle in, relax, and stay overnight.',
    highlight: 'Private luxury meet-and-greet & Mercedes-Benz or private VIP VIP transfers',
    activities: [
      'Touch down at Bangkok Suvarnabhumi Airport',
      'Assisted Visa on arrival processing',
      'Meet & Greet with your private local guide',
      'Private transfer to your luxury Bangkok hotel',
      'Hotel check-in and evening at leisure'
    ]
  },
  {
    day: 'Day 3',
    title: 'Safari World & Marine Park',
    subtitle: 'Wildlife Safari & Spectacular Shows',
    time: '08:30 AM - 04:30 PM',
    meals: 'Breakfast & Buffet Lunch Included',
    icon: Compass,
    color: '#10b981',
    image: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80',
    summary: 'Fuel up with breakfast at the hotel, then set out for a full-day adventure at Safari World and Marine Park. Drive through the open animal habitats to spot giraffes, lions, and zebras. Attend exciting marine shows and enjoy a grand buffet lunch before returning to the hotel.',
    highlight: 'Up-close wildlife encounters & exclusive dolphin show access',
    activities: [
      'International buffet breakfast at the hotel',
      'Guided drive through Safari World open park',
      'Adrenaline-filled stunt shows & Marine Park attractions',
      'Premium multi-cuisine buffet lunch',
      'Return private transfer to hotel'
    ]
  },
  {
    day: 'Day 4',
    title: 'Bangkok to Pattaya',
    subtitle: 'Botanical Wonders & Traditional Culture',
    time: '09:00 AM - 05:00 PM',
    meals: 'Breakfast & Traditional Thai Lunch',
    icon: Map,
    color: '#a855f7',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80',
    summary: 'Check out after breakfast and enjoy a private transfer to the coastal town of Pattaya. Along the way, visit the spectacular Nong Nooch Tropical Botanical Garden. Witness a vibrant Thai cultural show and elephant performances, accompanied by an authentic Thai lunch.',
    highlight: 'Exploring the award-winning Nong Nooch Gardens',
    activities: [
      'Breakfast and checkout at Bangkok hotel',
      'Private transfer towards the Gulf Coast (Pattaya)',
      'Explore Nong Nooch Botanical Gardens',
      'Spectacular Thai cultural and folk dance showcase',
      'Lakeside Thai lunch experience',
      'Hotel check-in at Pattaya luxury resort'
    ]
  },
  {
    day: 'Day 5',
    title: 'Coral Island Speedboat Experience',
    subtitle: 'Island Haven & Azure Waters',
    time: '08:30 AM - 03:30 PM',
    meals: 'Breakfast & Beachside Seafood Lunch',
    icon: Waves,
    color: '#06b6d4',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
    summary: 'Embark on a high-speed private speedboat transfer across the Gulf of Thailand to Coral Island (Koh Larn). Relax on the fine white sands of Haad Tien beach, swim in the clear blue waters, and enjoy a fresh lunch. Spend the afternoon in beach leisure before heading back.',
    highlight: 'Speedboat cruise & pristine white-sand Haad Tien beach relaxation',
    activities: [
      'Breakfast at hotel',
      'Exciting speedboat cruise to Koh Larn (Coral Island)',
      'Beachfront leisure and sunbathing at Haad Tien beach',
      'Swimming, optional parasailing, or snorkeling',
      'Fresh seafood lunch by the beach',
      'Return speedboat and private transfer to resort'
    ]
  },
  {
    day: 'Day 6',
    title: 'Sanctuary of Truth & View Point',
    subtitle: 'Wooden Architecture & Golden Sunsets',
    time: '09:00 AM - 05:30 PM',
    meals: 'Breakfast & Local Lunch',
    icon: Sparkles,
    color: '#f97316',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
    summary: 'Explore the spectacular Sanctuary of Truth, a massive hand-carved wooden temple that blends religious and philosophical meanings. In the afternoon, ascend the Pattaya View Point for panoramic sunset views, complete with a professional photography session.',
    highlight: 'Marveling at the 105m tall wooden structure of Sanctuary of Truth',
    activities: [
      'Breakfast at the hotel',
      'Guided visit inside the wooden architectural masterpiece',
      'Learn about traditional hand-carving techniques',
      'Drive to Phra Tamnak Mountain viewpoint',
      'Sunset photography session overlooking Pattaya Bay',
      'Return transfer to resort'
    ]
  },
  {
    day: 'Day 7',
    title: 'Free Leisure Day',
    subtitle: 'Relaxation & Personal Exploration',
    time: 'All Day',
    meals: 'Breakfast Included',
    icon: Sun,
    color: '#ec4899',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    summary: 'A completely free day to unwind. Relax at your luxury beach resort, pamper yourself with a traditional Thai massage, explore Pattaya\'s vibrant shopping districts, or take an optional cooking class. Embrace the peace of the tropics.',
    highlight: 'Rejuvenating beach resort amenities & spa day option',
    activities: [
      'Breakfast at the hotel',
      'Leisurely swim in the resort infinity pool',
      'Optional traditional Thai spa treatments',
      'Explore local markets or shopping centers',
      'Cocktails at sunset on the beachfront'
    ]
  },
  {
    day: 'Day 8',
    title: 'Departure Transfer',
    subtitle: 'Farewell Thailand',
    time: 'Scheduled Checkout',
    meals: 'Breakfast Included',
    icon: Plane,
    color: '#e5a832',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
    summary: 'Savor your final breakfast in paradise. Prepare for hotel checkout, take in the parting beach views, and transfer via private VIP vehicle to Suvarnabhumi Airport for your return flight home. Depart with memories of temples, islands, and Thai smiles.',
    highlight: 'Worry-free private airport transfer for departure',
    activities: [
      'Final breakfast at the resort',
      'Hotel checkout and luggage coordination',
      'Private air-conditioned transfer to Suvarnabhumi Airport (Bangkok)',
      'Assistance at airport drop-off for flight check-in'
    ]
  }
]

const includedServices = [
  { name: 'Safari World Entry', desc: 'Full access to the open safari park drive.' },
  { name: 'Marine Park Shows', desc: 'Tickets to all major live dolphin, bird and stunt performances.' },
  { name: 'Nong Nooch Village', desc: 'Entry to botanical gardens and Thai cultural shows.' },
  { name: 'Coral Island Tour', desc: 'Excursion to the beautiful Koh Larn island.' },
  { name: 'Speedboat Transfer', desc: 'Round-trip private speedboat cruise to Coral Island.' },
  { name: 'Airport Transfers', desc: 'Private, air-conditioned VIP transfers on arrival & departure.' },
  { name: 'Hotel Transfers', desc: 'All daily itinerary tours served with private vehicles.' },
  { name: 'Lunch Experiences', desc: 'Delicious buffet, local and beachside lunches as scheduled.' },
  { name: 'Guided Tours', desc: 'Certified local English-speaking guides providing stories.' },
]

const usefulInformation = [
  {
    title: 'Climate & Weather',
    icon: Sun,
    color: '#e5a832',
    items: [
      'Thailand has a tropical climate with three main seasons: hot, wet, and cool.',
      'Average temperatures range from 28°C to 34°C year-round.',
      'Pattaya and Bangkok are generally humid. Light summer rains can occur in the afternoon.',
      'We recommend sunscreen, sunglasses, and a compact umbrella for sun or light rain.'
    ]
  },
  {
    title: 'Clothing Recommendations',
    icon: Shirt,
    color: '#f97316',
    items: [
      'Pack lightweight, loose-fitting cotton clothing for daily tours.',
      'For temples like the Sanctuary of Truth, shoulders and knees must be covered.',
      'Slip-on shoes are recommended, as you must remove footwear at sacred thresholds.',
      'Bring swimwear, beach cover-ups, and a light jacket for air-conditioned vehicles.'
    ]
  },
  {
    title: 'Visa Information',
    icon: Shield,
    color: '#3b82f6',
    items: [
      'Ethiopian passport holders require a tourist visa to enter Thailand.',
      'Visa on Arrival (VoA) is available at Suvarnabhumi Airport (fee is around 2,000 THB in cash).',
      'Ensure your passport has at least 6 months validity from departure date.',
      'Keep copies of hotel reservations, flight itineraries, and 1 passport photo.'
    ]
  },
  {
    title: 'Currency Exchange',
    icon: DollarSign,
    color: '#10b981',
    items: [
      'The local currency is the Thai Baht (THB).',
      'USD, EUR and major cards are accepted in hotels and upscale restaurants.',
      'Carry cash (Baht) for local markets, street food, and minor services.',
      'ATMs are widely available in Bangkok and Pattaya. ATMs charge a standard flat fee (approx. 220 THB).'
    ]
  },
  {
    title: 'Yellow Fever Requirements',
    icon: AlertTriangle,
    color: '#ef4444',
    items: [
      'Ethiopia is listed as a Yellow Fever transmission area.',
      'A valid Yellow Fever Vaccination Certificate is mandatory upon arrival.',
      'You will be directed to the Health Control counter at the airport before regular immigration.',
      'Failure to show the vaccine card can result in entry denial.'
    ]
  },
  {
    title: 'Travel Tips',
    icon: Compass,
    color: '#a855f7',
    items: [
      'Always drink bottled water and avoid ice from street carts.',
      'Respect local traditions; never touch someone\'s head or point your feet at people or shrines.',
      'Respect the Royal Family; comments regarding the Monarchy are strictly governed by local laws.',
      'Download translation or ride apps (like Grab) for convenience during free leisure time.'
    ]
  },
  {
    title: 'Beach Essentials',
    icon: Waves,
    color: '#06b6d4',
    items: [
      'Bring coral-safe waterproof sunscreen (SPF 50+) for island trips.',
      'Dry bag is highly recommended for speedboat rides to keep cameras/phones dry.',
      'A beach towel, sandals/water shoes, and a wide-brimmed hat.',
      'Keep hydrated under the sun by purchasing fresh young coconuts on Haad Tien beach.'
    ]
  }
]

const destinationHighlights = [
  {
    title: 'Bangkok City',
    description: 'A vibrant capital combining towering skyscrapers with historical temples. Indulge in bustling street markets, fine dining on the Chao Phraya River, and endless cultural sites.',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80',
    tag: 'Metropolis',
  },
  {
    title: 'Pattaya Beach',
    description: 'A glowing coastal city nestled along the Gulf of Thailand. Famed for its beach lifestyle, marine sports, high-end oceanfront resorts, and dynamic nightlife.',
    image: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=1200&q=80',
    tag: 'Coastal Bliss',
  },
  {
    title: 'Coral Island',
    description: 'An idyllic getaway just off the Pattaya coast. Boasting soft white sand beaches, coral reefs teeming with sea life, and warm turquoise waters ideal for swimming and marine activities.',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=80',
    tag: 'Island Escape',
  },
  {
    title: 'Safari World',
    description: 'Thailand\'s top open zoo. Embark on an African-style safari drive to observe wild lions, tigers, and zebras roam freely, coupled with marine parks showcasing friendly animal shows.',
    image: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=1200&q=80',
    tag: 'Wild Adventure',
  },
  {
    title: 'Sanctuary of Truth',
    description: 'An architectural wonder constructed entirely of wood without a single metal nail. Each detail reflects Eastern philosophies, towering dramatically against the coastline.',
    image: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=1200&q=80',
    tag: 'Philosophy & Woodcarving',
  },
  {
    title: 'Nong Nooch Village',
    description: 'A vast botanical garden featuring meticulously landscaped themed zones. Stroll through French gardens, explore prehistoric valleys, and watch rich Thai classical dance.',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=80',
    tag: 'Botanical Sanctuary',
  }
]

/* ────────────────────────── Utility Components ─────────────────────────────── */

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ────────────────────────────── Main Page ──────────────────────────────────── */

export default function ThailandPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])

  const [openInfo, setOpenInfo] = useState<number | null>(0)
  const [openDay, setOpenDay] = useState<number | null>(0)

  // Page reading scroll bar
  const { scrollYProgress: pageProgress } = useScroll()
  const progressWidth = useTransform(pageProgress, [0, 1], ['0%', '100%'])

  return (
    <div className="bg-[#050505] text-white overflow-x-hidden min-h-screen">
      {/* ── Scroll Progress Bar ── */}
      <motion.div
        className="fixed top-0 left-0 h-[3px] z-[999] origin-left"
        style={{ width: progressWidth, background: 'linear-gradient(90deg, #e5a832, #f97316, #a855f7, #3b82f6)' }}
      />

      {/* ══════════════════ 1. HERO SECTION ══════════════════ */}
      <section ref={heroRef} className="relative h-screen min-h-[650px] flex items-center justify-center overflow-hidden">
        {/* Parallax image */}
        <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
          <Image
            src="https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=90"
            alt="Thailand Landscape, Bangkok & Pattaya"
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        {/* Elegant dark luxury overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#050505]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />

        {/* Floating animated ambient orbs */}
        <motion.div
          className="absolute top-[20%] left-[10%] w-72 h-72 rounded-full pointer-events-none filter blur-[80px]"
          style={{ background: 'radial-gradient(circle, rgba(229,168,50,0.18) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[25%] right-[10%] w-96 h-96 rounded-full pointer-events-none filter blur-[90px]"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto flex flex-col items-center">
          {/* Tag Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full border border-white/10 backdrop-blur-md"
            style={{ background: 'rgba(229,168,50,0.12)' }}
          >
            <Star className="w-4 h-4 text-[#e5a832] fill-[#e5a832]" />
            <span className="text-white/95 text-xs font-semibold tracking-[0.25em] uppercase">Premium Journey</span>
            <Star className="w-4 h-4 text-[#e5a832] fill-[#e5a832]" />
          </motion.div>

          {/* Titles */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-6xl sm:text-7xl lg:text-[7.5rem] font-bold text-white mb-2 leading-none tracking-tight font-serif"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}
          >
            Thailand Escape
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="flex items-center justify-center gap-4 mb-4 w-full max-w-lg"
          >
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#e5a832]" />
            <span className="text-[#e5a832] text-sm sm:text-base font-bold tracking-[0.35em] uppercase">Southeast Asia</span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#e5a832]" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-white/80 text-lg sm:text-xl lg:text-2xl font-light max-w-2xl mx-auto leading-relaxed mb-12"
          >
            Bangkok &amp; Pattaya Luxury Experience
          </motion.p>

          {/* Floating Premium Glass Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 w-full max-w-5xl mt-6 px-2"
          >
            {[
              'Safari World',
              'Coral Island',
              'Pattaya Beaches',
              'Sanctuary of Truth',
              'Marine Adventure',
              'Tropical Escape',
            ].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -6, scale: 1.03, borderColor: 'rgba(229, 168, 50, 0.4)' }}
                className="rounded-xl border border-white/10 backdrop-blur-md p-4 text-center cursor-default transition-all duration-300"
                style={{ background: 'rgba(255, 255, 255, 0.03)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#e5a832] mx-auto mb-2 animate-pulse" />
                <span className="text-white/95 text-xs sm:text-sm font-medium tracking-wide block">{item}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll indication */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="absolute bottom-6 flex flex-col items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            <span className="text-white/40 text-[10px] tracking-widest uppercase">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-5 h-9 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
            >
              <div className="w-1 h-1.5 bg-white/60 rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ 2. QUICK EXPERIENCE SHOWCASE ══════════════════ */}
      <section className="py-24 bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[#e5a832] text-xs font-bold tracking-[0.25em] uppercase mb-3">Moments of Thailand</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight">Quick Experience Showcase</h2>
              <div className="w-12 h-1 bg-[#e5a832] mx-auto mt-4" />
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickExperiences.map((exp, idx) => (
              <FadeUp key={idx} delay={idx * 0.08}>
                <motion.div
                  className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-default border border-white/5"
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  {/* Zoom background image */}
                  <div className="absolute inset-0">
                    <Image
                      src={exp.image}
                      alt={exp.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                  </div>

                  {/* Shading gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(to top, ${exp.color}45, transparent 65%)` }}
                  />

                  {/* Dynamic hovering border glow */}
                  <div className="absolute inset-0 border border-transparent group-hover:border-white/10 rounded-2xl transition-colors duration-300" />

                  {/* Header floating icons */}
                  <div
                    className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center border border-white/15 backdrop-blur-sm transition-transform duration-300 group-hover:rotate-12"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                  >
                    <exp.icon className="w-4 h-4" style={{ color: exp.color }} />
                  </div>

                  <div
                    className="absolute top-4 left-4 text-[10px] font-bold tracking-wider px-2 py-1 rounded"
                    style={{ background: `${exp.color}d5`, color: '#000' }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  {/* Core content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end h-1/2">
                    <h3 className="text-white font-semibold text-lg sm:text-xl mb-1.5 group-hover:text-[#e5a832] transition-colors duration-300">
                      {exp.title}
                    </h3>
                    <p className="text-white/60 text-xs sm:text-sm leading-relaxed overflow-hidden transition-all duration-300 opacity-80 group-hover:opacity-100 group-hover:text-white/95">
                      {exp.description}
                    </p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ 3. INTERACTIVE ITINERARY TIMELINE ══════════════════ */}
      <section className="py-24 bg-[#090909]">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[#e5a832] text-xs font-bold tracking-[0.25em] uppercase mb-3">Day-By-Day Schedule</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight">Interactive Itinerary Timeline</h2>
              <p className="text-white/50 text-sm max-w-xl mx-auto mt-3">
                Eight luxury days covering the best hotspots of Bangkok and Pattaya with private guides.
              </p>
              <div className="w-12 h-1 bg-[#e5a832] mx-auto mt-4" />
            </div>
          </FadeUp>

          <div className="relative mt-12">
            {/* Elegant vertical spinal connector */}
            <div className="absolute left-6 lg:left-8 top-2 bottom-6 w-[1px] bg-gradient-to-b from-[#e5a832] via-[#a855f7]/40 to-transparent" />

            <div className="space-y-6">
              {itinerary.map((dayItem, idx) => {
                const isOpen = openDay === idx
                return (
                  <FadeUp key={idx} delay={idx * 0.05}>
                    <div className="relative pl-16 lg:pl-20">
                      {/* Interactive circular day point */}
                      <motion.button
                        onClick={() => setOpenDay(isOpen ? null : idx)}
                        className="absolute left-2.5 lg:left-4.5 top-6 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 cursor-pointer shadow-lg outline-none"
                        style={{
                          borderColor: dayItem.color,
                          background: isOpen ? dayItem.color : '#090909',
                        }}
                        animate={{ scale: isOpen ? 1.15 : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <dayItem.icon className="w-3.5 h-3.5" style={{ color: isOpen ? '#000' : dayItem.color }} />
                      </motion.button>

                      {/* Itinerary Container Card */}
                      <motion.div
                        className="rounded-2xl border transition-all duration-300 overflow-hidden"
                        style={{
                          background: isOpen ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                          borderColor: isOpen ? `${dayItem.color}35` : 'rgba(255, 255, 255, 0.05)',
                        }}
                        whileHover={{ borderColor: `${dayItem.color}25` }}
                      >
                        {/* Header Header */}
                        <div
                          className="flex items-center justify-between p-5 lg:p-6 cursor-pointer select-none"
                          onClick={() => setOpenDay(isOpen ? null : idx)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <span
                              className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full w-fit"
                              style={{ background: `${dayItem.color}20`, color: dayItem.color }}
                            >
                              {dayItem.day}
                            </span>
                            <div>
                              <h3 className="text-white font-semibold text-base sm:text-lg lg:text-xl">
                                {dayItem.title}
                              </h3>
                              <p className="text-white/40 text-xs mt-0.5 font-light">{dayItem.subtitle}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-white/30 text-xs hidden md:inline-block">{dayItem.time}</span>
                            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                              <ChevronDown className="w-5 h-5 text-white/40" />
                            </motion.div>
                          </div>
                        </div>

                        {/* Collapsible content */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                              <div className="px-5 lg:px-6 pb-6 border-t border-white/5 pt-5">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                  {/* Left details pane */}
                                  <div className="md:col-span-7 flex flex-col justify-between">
                                    <div>
                                      <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-5 font-light">
                                        {dayItem.summary}
                                      </p>

                                      {/* Highlight card */}
                                      <div
                                        className="flex items-start gap-3 p-4 rounded-xl mb-5"
                                        style={{
                                          background: `${dayItem.color}0a`,
                                          border: `1px solid ${dayItem.color}20`,
                                        }}
                                      >
                                        <Star className="w-4 h-4 mt-0.5 fill-current shrink-0" style={{ color: dayItem.color }} />
                                        <div>
                                          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Exclusive Highlight</p>
                                          <p className="text-white/95 text-xs sm:text-sm mt-0.5 font-medium">{dayItem.highlight}</p>
                                        </div>
                                      </div>

                                      {/* Activities Bullet list */}
                                      <div className="space-y-2 mb-4">
                                        <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Included Events</p>
                                        {dayItem.activities.map((act, actIdx) => (
                                          <div key={actIdx} className="flex items-center gap-3">
                                            <Check className="w-3.5 h-3.5 shrink-0" style={{ color: dayItem.color }} />
                                            <span className="text-white/80 text-xs sm:text-sm font-light">{act}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Bottom tags & meals info */}
                                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/5">
                                      <div className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-full">
                                        <Utensils className="w-3.5 h-3.5 text-[#e5a832]" />
                                        <span>{dayItem.meals}</span>
                                      </div>
                                      <div className="text-xs text-white/35 font-light">
                                        Timing: {dayItem.time}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right side cinematic imagery preview */}
                                  <div className="md:col-span-5 relative h-56 md:h-auto min-h-[220px] rounded-xl overflow-hidden shadow-2xl">
                                    <Image
                                      src={dayItem.image}
                                      alt={dayItem.title}
                                      fill
                                      className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
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

      {/* ══════════════════ 4. INCLUDED SERVICES SECTION ══════════════════ */}
      <section className="py-24 bg-gradient-to-b from-[#090909] to-[#050505] border-t border-white/5">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[#e5a832] text-xs font-bold tracking-[0.25em] uppercase mb-3">All-Inclusive Luxury</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight">Included Services Section</h2>
              <div className="w-12 h-1 bg-[#e5a832] mx-auto mt-4" />
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {includedServices.map((svc, idx) => (
              <FadeUp key={idx} delay={idx * 0.06}>
                <motion.div
                  className="group relative rounded-2xl border border-white/5 p-6 overflow-hidden flex gap-4 transition-all duration-300"
                  style={{ background: 'rgba(255, 255, 255, 0.015)', backdropFilter: 'blur(8px)' }}
                  whileHover={{
                    y: -5,
                    borderColor: 'rgba(229,168,50,0.3)',
                    background: 'rgba(229,168,50,0.02)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: 'rgba(229,168,50,0.08)' }}
                  >
                    <Check className="w-5 h-5 text-[#e5a832] group-hover:scale-120 transition-transform" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base mb-1 transition-colors duration-300 group-hover:text-[#e5a832]">
                      {svc.name}
                    </h3>
                    <p className="text-white/50 text-xs sm:text-sm leading-relaxed font-light">
                      {svc.desc}
                    </p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ 5. USEFUL INFORMATION SECTION ══════════════════ */}
      <section className="py-24 bg-[#070707] border-t border-white/5">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[#e5a832] text-xs font-bold tracking-[0.25em] uppercase mb-3">Prepared Travel</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight">Useful Information Section</h2>
              <div className="w-12 h-1 bg-[#e5a832] mx-auto mt-4" />
            </div>
          </FadeUp>

          <div className="space-y-4">
            {usefulInformation.map((info, idx) => {
              const isOpen = openInfo === idx
              return (
                <FadeUp key={idx} delay={idx * 0.05}>
                  <motion.div
                    className="rounded-2xl border overflow-hidden transition-all duration-300"
                    style={{
                      background: isOpen ? `${info.color}05` : 'rgba(255, 255, 255, 0.01)',
                      borderColor: isOpen ? `${info.color}35` : 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {/* Accordion header button */}
                    <button
                      onClick={() => setOpenInfo(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left outline-none cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                          style={{ background: `${info.color}15` }}
                        >
                          <info.icon className="w-4.5 h-4.5" style={{ color: info.color }} />
                        </div>
                        <span className="text-white font-medium text-sm sm:text-base">{info.title}</span>
                      </div>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown className="w-5 h-5 text-white/40" />
                      </motion.div>
                    </button>

                    {/* Accordion body content */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="px-5 pb-5 pt-1 border-t border-white/5">
                            <ul className="space-y-3 mt-4">
                              {info.items.map((bullet, bulletIdx) => (
                                <li key={bulletIdx} className="flex items-start gap-3">
                                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: info.color }} />
                                  <span className="text-white/70 text-xs sm:text-sm font-light leading-relaxed">
                                    {bullet}
                                  </span>
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

      {/* ══════════════════ 6. DESTINATION HIGHLIGHTS SECTION ══════════════════ */}
      <section className="py-24 bg-[#050505] border-t border-white/5">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-20">
              <p className="text-[#e5a832] text-xs font-bold tracking-[0.25em] uppercase mb-3">Immersive Visuals</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight">Destination Highlights Section</h2>
              <div className="w-12 h-1 bg-[#e5a832] mx-auto mt-4" />
            </div>
          </FadeUp>

          <div className="space-y-24 max-w-6xl mx-auto">
            {destinationHighlights.map((highlight, idx) => {
              const isEven = idx % 2 === 0
              return (
                <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {/* Visual block */}
                  <div
                    className={`lg:col-span-7 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ${
                      isEven ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <Image
                      src={highlight.image}
                      alt={highlight.title}
                      fill
                      className="object-cover transition-transform duration-1000 ease-out hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    
                    {/* Glowing floating decorative tag */}
                    <div className="absolute top-4 left-4 bg-black/50 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold tracking-widest text-[#e5a832] uppercase">
                      {highlight.tag}
                    </div>
                  </div>

                  {/* Text/Narrative block */}
                  <div className={`lg:col-span-5 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                    <FadeUp>
                      <span className="text-[#e5a832] text-xs font-bold tracking-widest uppercase block mb-2">
                        {String(idx + 1).padStart(2, '0')} / Showcase
                      </span>
                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
                        {highlight.title}
                      </h3>
                      <p className="text-white/60 text-sm sm:text-base leading-relaxed font-light mb-6">
                        {highlight.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#e5a832] tracking-wider uppercase border border-[#e5a832]/20 rounded-full w-fit px-4 py-2 bg-[#e5a832]/5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Luxury Experiences Included</span>
                      </div>
                    </FadeUp>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════ EXTRA PREMIUM CLOSING ══════════════════ */}
      <section className="relative py-32 overflow-hidden border-t border-white/5">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1920&q=85"
            alt="Bangkok Luxury Skyline Landscape"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/80" />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(229,168,50,0.15) 0%, transparent 50%, rgba(59,130,246,0.12) 100%)',
            }}
          />
        </div>

        <FadeUp>
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <span className="text-5xl block mb-6 animate-bounce">🛕</span>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
              Thailand Awaits<br />
              <span className="text-[#e5a832]">Your Luxury Footprint</span>
            </h2>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-10 font-light">
              From the high-octane city vistas of Bangkok to Pattaya\'s calm seaside shores, experience Southeast Asia in absolute ultimate luxury comfort.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Temples', 'Speedboats', 'Wildlife', 'Tropical Gardens', 'Gold Beaches', 'Vip Transfers'].map((tag, idx) => (
                <span
                  key={idx}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold border border-white/10 text-white/80 backdrop-blur-md bg-white/5 hover:border-[#e5a832]/50 hover:bg-white/10 transition-all duration-300 cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      </section>
    </div>
  )
}
