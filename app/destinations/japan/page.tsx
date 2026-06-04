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
  Mountain,
  Camera,
  ShoppingBag,
  Landmark,
  ChevronDown,
  Train,
  Zap,
  TreePine,
  Flower2,
  Fish,
  Globe,
  Wallet,
  CloudSun,
  BookOpen,
  ShoppingCart,
  AlertTriangle,
  Check,
  Plane,
  Building2,
  Telescope,
  Sparkles,
} from 'lucide-react'

/* ─────────────────────────────────── Data ─────────────────────────────────── */

const quickInfoCards = [
  { icon: Calendar,  label: '13 Days',        sub: '12 Nights',         color: '#e5a832' },
  { icon: MapPin,    label: 'Tokyo • Kyoto',   sub: 'Nara • Yokohama',   color: '#ef4444' },
  { icon: Train,     label: 'Shinkansen',      sub: 'Bullet Train',       color: '#3b82f6' },
  { icon: Coffee,    label: 'Daily Breakfast', sub: 'Included',           color: '#10b981' },
  { icon: Car,       label: 'Private Transfers',sub: 'Door to Door',      color: '#8b5cf6' },
  { icon: Users,     label: 'Expert Guides',   sub: 'Cultural Immersion', color: '#ec4899' },
]

const highlights = [
  { title: 'Tokyo',     subtitle: 'The Electric Megalopolis',   description: 'A city of infinite contrasts — neon-lit skyscrapers meet ancient shrines, futuristic tech blends with centuries-old tradition.',   image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80', icon: Building2, color: '#e5a832' },
  { title: 'Mount Fuji',subtitle: 'Sacred Icon of Japan',       description: "Japan's most iconic symbol rises 3,776m above the clouds — a timeless volcanic masterpiece best viewed at dawn.",                    image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&q=80', icon: Mountain,  color: '#3b82f6' },
  { title: 'Hakone',    subtitle: 'Valley of Mist & Onsen',     description: "Soak in volcanic hot springs while gazing at Fuji across Lake Ashi — a journey into Japan's timeless natural soul.",                   image: 'https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=800&q=80', icon: CloudSun,  color: '#06b6d4' },
  { title: 'Kyoto',     subtitle: 'Ancient Imperial Capital',   description: 'Gilded temples, bamboo groves, geisha districts, and zen gardens — Kyoto is the soul of classical Japan.',                            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', icon: Landmark,  color: '#f97316' },
  { title: 'Nara',      subtitle: 'Where Deer Roam Free',       description: "Walk among sacred deer in ancient parklands, bow before the Great Buddha, and step into Japan's earliest history.",                     image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80', icon: TreePine,  color: '#10b981' },
  { title: 'Yokohama',  subtitle: 'The Cosmopolitan Port City', description: "Japan's most international city blends Western architecture with Japanese elegance along a stunning waterfront.",                        image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80', icon: Globe,     color: '#ec4899' },
  { title: 'Kamakura',  subtitle: 'Ancient Coastal Grandeur',   description: 'The monumental Great Buddha gazes serenely over this historic coastal town — a farewell steeped in spiritual beauty.',                   image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80', icon: Star,      color: '#a855f7' },
]

const itinerary = [
  { day: 'Day 1',  title: 'Arrival — Addis Ababa to Tokyo',              summary: 'Your extraordinary journey begins as you depart Addis Ababa on an international flight to Tokyo Narita or Haneda Airport. After clearing immigration, our representative meets you and escorts you to your luxury Tokyo hotel. Freshen up and enjoy a welcome dinner introducing you to authentic Japanese cuisine.', highlight: 'International flight experience & Tokyo welcome dinner', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', icon: Plane,     tags: ['International Flight', 'Airport Transfer', 'Welcome Dinner', 'Hotel Check-in'] },
  { day: 'Day 2',  title: 'Tokyo Discovery — Shinjuku, Shibuya & Meiji Shrine', summary: "Immerse yourself in Tokyo's electrifying energy. Begin at the iconic Meiji Shrine in Harajuku's forested oasis, then stroll the eclectic Takeshita Street. Witness the mesmerizing Shibuya Scramble Crossing — the world's busiest intersection — and pay homage to the loyal Hachiko. Cap the day with panoramic views from Shibuya Sky observation deck.", highlight: 'Shibuya Crossing & Meiji Shrine cultural experience', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80', icon: Building2, tags: ['Meiji Shrine', 'Harajuku', 'Shibuya Crossing', 'Shibuya Sky', 'Hachiko'] },
  { day: 'Day 3',  title: 'Traditional Tokyo — Asakusa, Senso-ji & Tokyo Skytree', summary: "Discover old Tokyo's timeless charm. Explore Ueno Park and the prestigious Tokyo National Museum, then browse the vibrant Ameyoko Market. Journey to Asakusa and be awestruck by the ancient Senso-ji Temple — Tokyo's most sacred Buddhist site. Conclude with breathtaking views from Tokyo Skytree, the world's tallest broadcasting tower.", highlight: 'Senso-ji Temple & Tokyo Skytree panoramic views', image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80', icon: Landmark,  tags: ['Ueno Park', 'Tokyo National Museum', 'Asakusa', 'Senso-ji', 'Tokyo Skytree'] },
  { day: 'Day 4',  title: "Mount Fuji & Hakone — Japan's Sacred Landscape", summary: 'A cinematic day awaits as you travel to the legendary Mount Fuji 5th Station, climbing into the clouds of Japan\'s most sacred volcano. Descend to Hakone\'s serene gardens, then ascend Owakudani Valley\'s volcanic landscape by ropeway. Cruise across the ethereal Lake Ashi with Fuji\'s reflection shimmering across its surface.', highlight: 'Mt. Fuji 5th Station & Lake Ashi Cruise with Fuji views', image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&q=80', icon: Mountain,  tags: ['Mt. Fuji 5th Station', 'Hakone Gardens', 'Owakudani', 'Hakone Ropeway', 'Lake Ashi Cruise'] },
  { day: 'Day 5',  title: 'Imperial Tokyo — Palace, Ginza & Akihabara',  summary: "Experience Tokyo's imperial and cultural soul. Walk the serene grounds of the Imperial Palace, symbol of Japan's enduring heritage. Stroll the world-renowned Ginza district — Japan's most prestigious shopping boulevard. Experience traditional Kabuki Theatre art, then explore the tech wonderland of Akihabara's electric town.", highlight: 'Imperial Palace & Ginza luxury experience', image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80', icon: Sparkles,  tags: ['Imperial Palace', 'Ginza', 'Kabuki Theatre', 'Akihabara'] },
  { day: 'Day 6',  title: 'Future Tokyo — TeamLab, Odaiba & Rainbow Bridge', summary: 'Step into tomorrow at TeamLab Borderless — the world\'s most immersive digital art museum where boundaries between artwork and visitor dissolve completely. Explore the futuristic Odaiba island, marvel at the iconic Gundam statue, discover Miraikan Science Museum, and photograph the magnificent Rainbow Bridge illuminated at dusk.', highlight: 'TeamLab Borderless digital art immersion', image: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800&q=80', icon: Zap,       tags: ['TeamLab Borderless', 'Odaiba', 'Gundam Statue', 'Miraikan Museum', 'Rainbow Bridge'] },
  { day: 'Day 7',  title: 'The Bullet Train Experience — Tokyo to Kyoto', summary: "Board the legendary Shinkansen — Japan's marvel of modern engineering. At speeds exceeding 320km/h, the landscape transforms from urban Tokyo to the ancient hills of Kyoto in just over two hours. This iconic journey is itself a premium experience, gliding through tunnels and past Mount Fuji's silhouette. Check into your Kyoto ryokan-style hotel.", highlight: 'Premium Shinkansen bullet train journey to Kyoto', image: 'https://images.unsplash.com/photo-1554797589-7241bb691973?w=800&q=80', icon: Train,     tags: ['Shinkansen Experience', 'Tokyo → Kyoto', 'Scenic Journey', 'Ryokan Check-in'] },
  { day: 'Day 8',  title: 'Kyoto Exploration — Bamboo Forest & Tea Ceremony', summary: "Begin in the otherworldly Arashiyama Bamboo Forest where towering green stalks create a cathedral of nature. Cross the romantic Togetsukyo Bridge over the Oi River. Participate in an authentic Japanese tea ceremony in a traditional machiya townhouse. Slip into an elegant kimono for a stroll along the ethereal Philosopher's Path.", highlight: 'Arashiyama Bamboo Forest & authentic tea ceremony', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', icon: TreePine,  tags: ['Arashiyama Bamboo Forest', 'Togetsukyo Bridge', 'Tea Ceremony', 'Kimono Experience', "Philosopher's Path"] },
  { day: 'Day 9',  title: "Kyoto's Sacred Temples & Culinary Arts",       summary: "Discover Kyoto's most sacred Zen gardens. Marvel at the UNESCO-listed Tenryu-ji Temple with its masterful 700-year-old garden. Contemplate the mysterious Ryoan-ji rock garden — one of Japan's greatest philosophical landscapes. In the afternoon, join expert chefs for an immersive Japanese cooking class and authentic sushi-making experience.", highlight: 'Ryoan-ji Zen garden & authentic sushi cooking class', image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80', icon: Utensils,  tags: ['Tenryu-ji Temple', 'Ryoan-ji Temple', 'Cooking Classes', 'Sushi Experience'] },
  { day: 'Day 10', title: 'Nara Day Trip — Great Buddha & Deer Park',     summary: "Journey to ancient Nara, Japan's first permanent capital. Enter the colossal Todai-ji Temple housing the awe-inspiring Great Buddha — cast in 746 AD and still the world's largest bronze Buddha. Roam the vast Nara Deer Park where over 1,200 sacred deer roam freely among ancient cedars. Visit the lantern-lined pathways of Kasuga Taisha Shrine.", highlight: 'Great Buddha of Todai-ji & sacred deer of Nara Park', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80', icon: Landmark,  tags: ['Todai-ji Temple', 'Great Buddha', 'Nara Deer Park', 'Kasuga Taisha Shrine'] },
  { day: 'Day 11', title: 'Kyoto to Yokohama — Waterfront Elegance',      summary: "Board the Shinkansen for your scenic journey from Kyoto to Yokohama — Japan's most cosmopolitan port city. Check into your waterfront hotel with stunning Minato Mirai skyline views. Explore the iconic Landmark Tower and the beautifully restored Red Brick Warehouse district, blending Meiji-era industrial heritage with contemporary dining and culture.", highlight: 'Shinkansen journey & Yokohama waterfront arrival', image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80', icon: Train,     tags: ['Shinkansen Experience', 'Landmark Tower', 'Red Brick Warehouse', 'Waterfront Views'] },
  { day: 'Day 12', title: 'Yokohama Attractions — Gardens, Art & Innovation', summary: "Begin with the exquisite Sankeien Garden — a living museum of traditional Japanese architecture set among seasonal blooms. Visit the prestigious Yokohama Museum of Art for its world-class collection. Experience the playful Cup Noodles Museum celebrating Japan's greatest culinary invention. End at the stunning Minato Mirai 21 waterfront as city lights reflect on the harbor.", highlight: 'Sankeien Garden & Minato Mirai 21 illuminated harbor', image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800&q=80', icon: Camera,    tags: ['Sankeien Garden', 'Yokohama Museum of Art', 'Cup Noodles Museum', 'Minato Mirai 21'] },
  { day: 'Day 13', title: 'Kamakura & Farewell — The Great Buddha & Departure', summary: "Your final Japanese morning takes you to the coastal treasure of Kamakura. Stand in reverence before the magnificent Great Buddha of Kamakura — a 13.35-meter bronze colossus that has meditated serenely since 1252. Wander Kamakura's historic streets and coastal pathways before your private transfer to the airport. Sayonara, Japan — until we meet again.", highlight: 'Great Buddha of Kamakura & emotional farewell to Japan', image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80', icon: Star,      tags: ['Great Buddha of Kamakura', 'Historic Coastal Town', 'Final Transfer', 'Departure'] },
]

const galleryImages = [
  { src: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80', label: 'Tokyo Nights',    span: 'col-span-1 row-span-2' },
  { src: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600&q=80', label: 'Mount Fuji',     span: 'col-span-1' },
  { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', label: 'Kyoto Temples',  span: 'col-span-1' },
  { src: 'https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=600&q=80', label: 'Hakone Lake',   span: 'col-span-1 row-span-2' },
  { src: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80', label: 'Nara Deer',     span: 'col-span-1' },
  { src: 'https://images.unsplash.com/photo-1554797589-7241bb691973?w=600&q=80', label: 'Shinkansen',    span: 'col-span-1' },
  { src: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&q=80', label: 'Yokohama',     span: 'col-span-1' },
  { src: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80', label: 'Kamakura Buddha', span: 'col-span-1' },
]

const cultureGuide = [
  { icon: BookOpen,     title: 'Japanese Etiquette',    color: '#e5a832', items: ['Bow when greeting — deeper bows show more respect', 'Remove shoes before entering homes, ryokans & many restaurants', 'Never tip — it is considered rude in Japan', 'Queue orderly and patiently — cutting in line is extremely impolite', 'Speak quietly on public transport; calls are frowned upon', 'Use two hands when giving or receiving business cards'] },
  { icon: Train,        title: 'Transportation Guide',  color: '#3b82f6', items: ['IC Card (Suica/Pasmo) is essential — loads onto iPhone/Android wallet', 'Shinkansen seats: reserve in advance for guaranteed seating', 'Tokyo Metro is the most efficient way to navigate the city', 'Taxi doors open automatically — do not touch them', 'Uber is available but taxis are safe, metered & reliable', 'Night buses connect major cities at low cost if on budget'] },
  { icon: Wallet,       title: 'Currency & Payments',   color: '#10b981', items: ['Local currency: Japanese Yen (¥ / JPY)', 'Japan remains heavily cash-based outside major cities', '7-Eleven & Japan Post ATMs reliably accept foreign cards', 'Best exchange rates at airport currency counters or banks', 'Major hotels and department stores accept international cards', 'Budget ¥3,000–¥5,000/day for food and local transport'] },
  { icon: Utensils,     title: 'Food Culture',          color: '#f97316', items: ['Slurping noodles is a compliment to the chef — embrace it', 'Do not pass food chopstick-to-chopstick (funeral ritual)', 'Conveyor belt sushi (kaiten-zushi) is affordable & fun', 'Convenience store (conbini) food is genuinely excellent', 'Ramen, sushi, tempura, yakitori & wagyu beef are must-tries', 'Vending machines sell hot & cold drinks on every street corner'] },
  { icon: Landmark,     title: 'Temple Etiquette',      color: '#a855f7', items: ['Purify hands at the temizuya (water pavilion) before entering', 'Toss a coin into the offering box before praying', 'Two bows, two claps, one bow — standard Shinto prayer ritual', 'Photography restrictions vary — always check signage', 'Dress modestly; shoulders and knees should be covered', 'Maintain respectful silence inside main halls'] },
  { icon: ShoppingCart, title: 'Shopping Tips',         color: '#ec4899', items: ['Tax-free shopping available for tourists — passport required', 'Department store basement floors (depachika) offer premium foods', 'Akihabara for electronics; Harajuku for fashion; Ginza for luxury', 'Mandarake & Book-Off for rare collectibles and vintage finds', 'Omiyage (souvenir gifts) culture is important — buy for loved ones', 'Bargaining is NOT practiced in Japan — prices are fixed'] },
  { icon: CloudSun,     title: 'Weather & Best Times',  color: '#06b6d4', items: ['Spring (March–May): Cherry blossom season — most magical', 'Summer (June–August): Hot & humid; typhoon season possible', 'Autumn (Sept–Nov): Stunning red foliage; ideal travel weather', 'Winter (Dec–Feb): Cold but peaceful; excellent for onsen', 'Pack layers — temperatures vary significantly by region', 'Umbrella is essential year-round for afternoon showers'] },
  { icon: AlertTriangle,title: 'Travel Essentials',     color: '#ef4444', items: ['Ethiopian passport: tourist visa required — apply in advance', 'Pocket WiFi or local SIM essential for navigation', 'Download Google Maps offline before arrival', 'Emergency number: 110 (Police), 119 (Fire/Ambulance)', "Earthquake safety: know your hotel's evacuation procedure", 'Travel insurance with medical coverage strongly recommended'] },
]

/* ────────────────────────── Utility Components ─────────────────────────────── */

function FadeInWhenVisible({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }} className={className}>
      {children}
    </motion.div>
  )
}

/* ────────────────────────────── Main Page ──────────────────────────────────── */

export default function JapanPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])

  const [openGuide, setOpenGuide] = useState<number | null>(null)
  const [openDay, setOpenDay] = useState<number | null>(0)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  const { scrollYProgress: pageProgress } = useScroll()
  const progressWidth = useTransform(pageProgress, [0, 1], ['0%', '100%'])

  return (
    <div className="bg-white overflow-x-hidden font-sans">
      {/* Scroll Progress Bar */}
      <motion.div className="fixed top-0 left-0 h-[3px] z-[999] origin-left" style={{ width: progressWidth, background: 'linear-gradient(90deg, #dc143c, #e5a832, #dc143c)' }} />

      {/* ══════════════════ LIGHTBOX ══════════════════ */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightboxImg(null)}>
            <motion.div className="relative w-full max-w-4xl max-h-[85vh] mx-4 rounded-2xl overflow-hidden" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 25 }} onClick={e => e.stopPropagation()}>
              <Image src={lightboxImg} alt="Gallery" fill className="object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ HERO ══════════════════ */}
      <section ref={heroRef} className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
          <Image src="https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=1920&q=90" alt="Mount Fuji, Japan" fill className="object-cover" priority />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />

        <motion.div className="relative z-10 text-center px-4 max-w-5xl mx-auto" style={{ opacity: heroOpacity }}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="inline-flex items-center gap-2 mb-8 px-6 py-2.5 rounded-full border border-white/20 backdrop-blur-sm" style={{ background: 'rgba(220,20,60,0.12)' }}>
            <Star className="w-4 h-4 fill-[#e5a832]" style={{ color: '#e5a832' }} />
            <span className="text-white/90 text-sm font-semibold tracking-[0.25em] uppercase">Premium Destination</span>
            <Star className="w-4 h-4 fill-[#e5a832]" style={{ color: '#e5a832' }} />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }} className="text-5xl sm:text-6xl lg:text-8xl font-bold text-white mb-4 leading-tight" style={{ textShadow: '0 4px 40px rgba(0,0,0,0.6)', letterSpacing: '-0.02em' }}>
            Experience the<br /><span style={{ color: '#dc143c' }}>Spirit of Japan</span>
          </motion.h1>

          <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 0.7, delay: 0.9 }} className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px flex-1 max-w-20" style={{ background: 'linear-gradient(to right, transparent, rgba(229,168,50,0.8))' }} />
            <span className="text-[#e5a832] text-sm font-semibold tracking-[0.3em] uppercase">Japan</span>
            <div className="h-px flex-1 max-w-20" style={{ background: 'linear-gradient(to left, transparent, rgba(229,168,50,0.8))' }} />
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1 }} className="text-white/80 text-base sm:text-lg lg:text-xl font-light tracking-wider mb-3">
            Tokyo • Fuji • Hakone • Kyoto • Nara • Yokohama
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.2 }} className="text-white/50 text-sm tracking-widest uppercase">
            13 Days • 12 Nights Luxury Cultural Journey
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.4 }} className="flex flex-wrap justify-center gap-3 mt-10">
            {['Tokyo', 'Mount Fuji', 'Kyoto', 'Nara', 'Yokohama', 'Bullet Train'].map((city, i) => (
              <motion.span key={city} className="px-4 py-1.5 rounded-full text-white/90 text-xs font-semibold tracking-widest uppercase border border-white/15 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.07)' }} whileHover={{ scale: 1.06, background: 'rgba(220,20,60,0.2)', borderColor: 'rgba(220,20,60,0.5)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 + i * 0.08 }}>
                {city}
              </motion.span>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-[-140px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-white/40 text-xs tracking-widest uppercase">Scroll to explore</span>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-6 h-10 rounded-full border border-white/25 flex items-start justify-center pt-2">
              <div className="w-1 h-2 bg-white/50 rounded-full" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════ QUICK INFO CARDS ══════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInWhenVisible>
            <div className="text-center mb-14">
              <p className="text-[#dc143c] text-sm font-semibold tracking-widest uppercase mb-3">Journey Overview</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">Your Japan Experience at a Glance</h2>
            </div>
          </FadeInWhenVisible>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickInfoCards.map((card, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.08}>
                <motion.div whileHover={{ y: -6, scale: 1.03 }} className="group relative rounded-2xl p-5 text-center cursor-default overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at center, ${card.color}08, transparent 70%)` }} />
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: `${card.color}15` }}>
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
            <div className="text-center mb-16">
              <p className="text-[#dc143c] text-sm font-semibold tracking-widest uppercase mb-3">Iconic Destinations</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">Japan Destination Highlights</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Seven extraordinary destinations — each a world unto itself</p>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {highlights.map((dest, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.07} className={i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}>
                <motion.div className="group relative rounded-2xl overflow-hidden cursor-default shadow-md hover:shadow-xl transition-shadow duration-500" style={{ height: i === 0 ? '480px' : '260px' }} whileHover={{ y: -6 }} transition={{ duration: 0.35 }}>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                      <Image src={dest.image} alt={dest.title} fill className="object-cover" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(to top, ${dest.color}44, transparent 60%)` }} />
                  <div className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm" style={{ background: `${dest.color}33` }}>
                    <dest.icon className="w-4 h-4" style={{ color: dest.color }} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: dest.color }}>{dest.subtitle}</p>
                    <h3 className="text-white font-bold text-2xl mb-2 leading-tight">{dest.title}</h3>
                    <p className="text-white/0 group-hover:text-white/75 text-sm leading-relaxed transition-all duration-500 translate-y-2 group-hover:translate-y-0">{dest.description}</p>
                  </div>
                </motion.div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ 13-DAY ITINERARY ══════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeInWhenVisible>
            <div className="text-center mb-16">
              <p className="text-[#dc143c] text-xs font-semibold tracking-[0.3em] uppercase mb-3">Day by Day</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">Your 13-Day Japan Itinerary</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-[#dc143c] to-[#e5a832] mx-auto rounded-full" />
              <p className="text-gray-500 max-w-2xl mx-auto mt-4">Thirteen extraordinary days crafted to immerse you in the spirit of Japan</p>
            </div>
          </FadeInWhenVisible>

          <div className="space-y-3">
            {itinerary.map((item, i) => {
              const isOpen = openDay === i
              const accentColor = highlights[Math.min(i, highlights.length - 1)].color
              return (
                <FadeInWhenVisible key={i} delay={i * 0.04}>
                  <motion.div layout className="rounded-2xl overflow-hidden border bg-white transition-shadow duration-300" style={{ borderColor: isOpen ? `${accentColor}40` : '#e5e7eb', boxShadow: isOpen ? `0 4px 24px ${accentColor}15` : '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <button onClick={() => setOpenDay(isOpen ? null : i)} className="w-full text-left">
                      <div className="flex items-center gap-4 p-5 lg:p-6">
                        <span className="shrink-0 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: 'rgba(220,20,60,0.08)', color: '#dc143c' }}>{item.day}</span>
                        <h3 className="flex-1 text-gray-900 font-semibold text-base lg:text-lg leading-tight">{item.title}</h3>
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0">
                          <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ background: isOpen ? 'rgba(220,20,60,0.08)' : '#f9fafb', borderColor: isOpen ? 'rgba(220,20,60,0.3)' : '#e5e7eb' }}>
                            <ChevronDown className="w-4 h-4" style={{ color: isOpen ? '#dc143c' : '#9ca3af' }} />
                          </div>
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }} style={{ overflow: 'hidden' }}>
                          <div className="px-5 lg:px-6 pb-6 bg-gray-50 border-t border-gray-100 grid md:grid-cols-2 gap-6 pt-4">
                            <div>
                              <p className="text-gray-600 text-sm leading-relaxed mb-4">{item.summary}</p>
                              <div className="flex items-start gap-3 p-3 rounded-xl mb-4" style={{ background: 'rgba(229,168,50,0.08)', border: '1px solid rgba(229,168,50,0.2)' }}>
                                <Star className="w-4 h-4 text-[#e5a832] fill-[#e5a832] shrink-0 mt-0.5" />
                                <p className="text-[#e5a832] text-sm font-medium">{item.highlight}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {item.tags.map((tag, ti) => (
                                  <span key={ti} className="text-xs px-3 py-1 rounded-full bg-white text-gray-500 border border-gray-200">{tag}</span>
                                ))}
                              </div>
                            </div>
                            <div className="relative h-44 md:h-auto rounded-xl overflow-hidden">
                              <Image src={item.image} alt={item.title} fill className="object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
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

      {/* ══════════════════ GALLERY ══════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeInWhenVisible>
            <div className="text-center mb-16">
              <p className="text-[#dc143c] text-sm font-semibold tracking-widest uppercase mb-3">Visual Journey</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">Japan Experience Gallery</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">A curated visual story of Japan's most breathtaking moments</p>
            </div>
          </FadeInWhenVisible>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[200px]">
            {galleryImages.map((img, i) => (
              <FadeInWhenVisible key={i} delay={i * 0.07} className={img.span}>
                <motion.div className="group relative rounded-xl overflow-hidden h-full cursor-zoom-in shadow-sm hover:shadow-lg transition-shadow duration-300" whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }} onClick={() => setLightboxImg(img.src)}>
                  <Image src={img.src} alt={img.label} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-400">
                    <span className="text-white text-sm font-semibold">{img.label}</span>
                  </div>
                </motion.div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CULTURE GUIDE ══════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeInWhenVisible>
            <div className="text-center mb-14">
              <p className="text-[#dc143c] text-sm font-semibold tracking-widest uppercase mb-3">Know Before You Go</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-3">Japan Culture & Travel Guide</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Your essential guide to navigating Japan with confidence and respect</p>
            </div>
          </FadeInWhenVisible>

          <div className="grid md:grid-cols-2 gap-3">
            {cultureGuide.map((guide, i) => {
              const isOpen = openGuide === i
              return (
                <FadeInWhenVisible key={i} delay={i * 0.05}>
                  <motion.div className="rounded-2xl overflow-hidden border bg-white cursor-pointer transition-all duration-200 hover:shadow-md" style={{ borderColor: isOpen ? `${guide.color}35` : '#e5e7eb', boxShadow: isOpen ? `0 4px 20px ${guide.color}10` : undefined }} onClick={() => setOpenGuide(isOpen ? null : i)}>
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
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                          <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100">
                            <div className="space-y-2.5 pt-3">
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
          <Image src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85" alt="Kyoto Japan" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <FadeInWhenVisible>
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Begin Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#dc143c] to-[#e5a832]">Japanese Journey</span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              From the electric streets of Tokyo to the sacred serenity of Kyoto — Japan is ready to enchant you.
            </p>
            <button className="px-10 py-4 bg-[#dc143c] text-white font-bold rounded-full text-sm tracking-wide hover:bg-[#b50f30] hover:scale-105 transition-all duration-300 shadow-lg">
              Start Planning
            </button>
          </div>
        </FadeInWhenVisible>
      </section>
    </div>
  )
}
