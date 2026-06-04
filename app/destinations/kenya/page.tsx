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

/* ───────────────────────────────── Data ────────────────────────────────────────── */

const C = {
  primary: '#f59e0b',
  secondary: '#f97316',
  accent: '#ef4444',
  teal: '#14b8a6',
}

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
    description: "One of Africa's finest white-coral beaches — powder sand, swaying palms, and turquoise waters",
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

/* ─────────────────────── Utility Components ─────────────────────────────────── */

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-65px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 42 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
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
    <div className="bg-white overflow-x-hidden font-sans">
      {/* Progress Bar */}
      <motion.div className="fixed top-0 left-0 h-[3px] z-[999] origin-left" style={{ width: barWidth, background: `linear-gradient(90deg, ${C.primary}, ${C.secondary}, ${C.accent})` }} />

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section ref={heroRef} className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
          <Image src="https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1920&q=90" alt="Mombasa, Kenya" fill className="object-cover" priority />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/88" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

        <motion.div className="relative z-10 text-center px-4 max-w-5xl mx-auto" style={{ opacity: heroOpacity }}>
          <motion.div initial={{ opacity: 0, y: -22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15 }} className="inline-flex items-center gap-2 mb-7 px-5 py-2 rounded-full border border-white/20 backdrop-blur-sm" style={{ background: `${C.primary}18` }}>
            <Star className="w-4 h-4 fill-current" style={{ color: C.primary }} />
            <span className="text-white/90 text-xs font-semibold tracking-[0.25em] uppercase">Luxury Coastal Safari</span>
            <Star className="w-4 h-4 fill-current" style={{ color: C.primary }} />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 38 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.05, delay: 0.35 }} className="text-6xl sm:text-7xl lg:text-[6.5rem] font-bold text-white leading-none tracking-tight mb-3" style={{ textShadow: '0 6px 40px rgba(0,0,0,0.6)' }}>
            Mombasa
          </motion.h1>

          <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 0.65, delay: 0.75 }} className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px flex-1 max-w-[110px]" style={{ background: `linear-gradient(to right, transparent, ${C.primary}90)` }} />
            <span className="text-xs font-bold tracking-[0.32em] uppercase" style={{ color: C.primary }}>Kenya</span>
            <div className="h-px flex-1 max-w-[110px]" style={{ background: `linear-gradient(to left, transparent, ${C.primary}90)` }} />
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.95 }} className="text-white/75 text-lg sm:text-xl lg:text-2xl font-light max-w-xl mx-auto leading-relaxed mb-10">
            3 Nights · 4 Days Luxury Coastal Escape
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 1.2 }} className="flex flex-wrap justify-center gap-3">
            {['Diani Reef Resort', 'Wasini Island Tour', 'Dolphin Experience', 'Candle-lit Dinner', 'Snorkeling'].map((item, i) => (
              <motion.span key={i} className="px-4 py-2 rounded-full text-sm font-medium text-white/88 border border-white/15 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.07)' }} whileHover={{ scale: 1.06, borderColor: `${C.primary}60` }} transition={{ duration: 0.18 }}>
                {item}
              </motion.span>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }} className="absolute bottom-[-180px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-white/38 text-[10px] tracking-[0.25em] uppercase">Scroll to explore</span>
            <motion.div animate={{ y: [0, 9, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className="w-6 h-10 rounded-full border border-white/22 flex items-start justify-center pt-2">
              <div className="w-1 h-2 bg-white/50 rounded-full" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════ QUICK INFO CARDS ══════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-[#f59e0b] text-sm font-semibold tracking-widest uppercase mb-3">The Details</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">Your Escape at a Glance</h2>
            </div>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickInfoCards.map((card, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <motion.div whileHover={{ y: -6, scale: 1.03 }} transition={{ duration: 0.25 }} className="group relative rounded-2xl p-5 text-center cursor-default overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
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

      {/* ══════════════════════ EXPERIENCE SHOWCASE ══════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[#f59e0b] text-sm font-semibold tracking-widest uppercase mb-3">Curated Experiences</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">6 Unforgettable Moments</h2>
              <p className="text-gray-500 max-w-xl mx-auto">From wild dolphins to candle-lit rivers — every moment crafted for luxury</p>
            </div>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((exp, i) => (
              <FadeUp key={i} delay={i * 0.07}>
                <motion.div className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-default shadow-md hover:shadow-xl transition-shadow duration-500" whileHover={{ y: -7 }} transition={{ duration: 0.3 }}>
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                      <Image src={exp.image} alt={exp.title} fill className="object-cover" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/25 to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(to top, ${exp.color}50, transparent 60%)` }} />
                  <div className="absolute top-4 left-4 text-xs font-bold px-2 py-1 rounded-md" style={{ background: `${exp.color}cc`, color: '#fff' }}>{String(i + 1).padStart(2, '0')}</div>
                  <div className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.42)' }}>
                    <exp.icon className="w-4 h-4 text-white/80" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-xl mb-2 transition-colors duration-300 group-hover:text-[#f59e0b]">{exp.title}</h3>
                    <p className="text-white/0 group-hover:text-white/78 text-sm leading-relaxed transition-all duration-500 translate-y-3 group-hover:translate-y-0">{exp.description}</p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ ITINERARY ══════════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeUp>
            <div className="text-center mb-16">
              <p className="text-[#f59e0b] text-xs font-semibold tracking-[0.3em] uppercase mb-3">Day by Day</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">Your Kenya Itinerary</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-[#f59e0b] to-[#f97316] mx-auto rounded-full" />
              <p className="text-gray-500 max-w-xl mx-auto mt-4">4 extraordinary days on the Kenyan coast — crafted for relaxation, adventure, and wonder</p>
            </div>
          </FadeUp>

          <div className="space-y-3">
            {itinerary.map((item, i) => {
              const isOpen = openDay === i
              return (
                <FadeUp key={i} delay={i * 0.07}>
                  <motion.div layout className="rounded-2xl overflow-hidden border bg-white transition-shadow duration-300" style={{ borderColor: isOpen ? `${item.color}40` : '#e5e7eb', boxShadow: isOpen ? `0 4px 24px ${item.color}15` : '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <button onClick={() => setOpenDay(isOpen ? null : i)} className="w-full text-left">
                      <div className="flex items-center p-5 lg:p-6 gap-4">
                        <span className="shrink-0 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: `${item.color}12`, color: item.color }}>{item.day}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 font-semibold text-base lg:text-lg leading-snug">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-400 text-xs">{item.time}</span>
                            <span className="text-gray-300 text-xs">·</span>
                            <span className="text-gray-400 text-xs italic">{item.atmosphere}</span>
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
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: 'hidden' }}>
                          <div className="px-5 lg:px-6 pb-6 pt-2 bg-gray-50 border-t border-gray-100">
                            <div className="grid md:grid-cols-2 gap-6 pt-2">
                              <div>
                                <ul className="space-y-2 mb-4">
                                  {item.services.map((svc, si) => (
                                    <li key={si} className="flex items-start gap-3">
                                      <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: item.color }} />
                                      <span className="text-gray-600 text-sm leading-relaxed">{svc}</span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="flex items-start gap-3 p-3 rounded-xl mb-4" style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
                                  <Star className="w-4 h-4 shrink-0 mt-0.5 fill-current" style={{ color: item.color }} />
                                  <p className="text-sm font-medium" style={{ color: item.color }}>{item.highlight}</p>
                                </div>
                                {'whatToBring' in item && item.whatToBring && (
                                  <div className="mb-3">
                                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">What to Bring</p>
                                    <div className="flex flex-wrap gap-2">
                                      {(item.whatToBring as string[]).map((w, wi) => (
                                        <span key={wi} className="text-xs px-3 py-1 rounded-full border" style={{ background: `${item.color}10`, color: item.color, borderColor: `${item.color}30` }}>{w}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {item.tags.map((tag, ti) => (
                                    <span key={ti} className="text-xs px-3 py-1 rounded-full bg-white text-gray-500 border border-gray-200">{tag}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="relative h-52 md:h-auto rounded-xl overflow-hidden">
                                <Image src={item.image} alt={item.title} fill className="object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                              </div>
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

      {/* ══════════════════════ INCLUDED / EXCLUDED ══════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-[#f59e0b] text-sm font-semibold tracking-widest uppercase mb-3">What's Covered</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-3">Included & Excluded</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Full transparency — no surprises. Know exactly what your luxury package covers</p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-6">
            <FadeUp delay={0.1}>
              <div className="bg-white border border-emerald-100 rounded-3xl p-8 h-full shadow-sm">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-emerald-50 border border-emerald-100">
                  <Check className="w-5 h-5 text-[#10b981]" />
                </div>
                <h3 className="text-gray-900 font-bold text-xl mb-1">What's Included</h3>
                <p className="text-[#10b981] text-xs font-medium mb-5">Everything covered</p>
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
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════ PRACTICAL INFORMATION ══════════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <FadeUp>
            <div className="text-center mb-14">
              <p className="text-[#f59e0b] text-sm font-semibold tracking-widest uppercase mb-3">Be Prepared</p>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-3">Practical Information</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Everything you need to know for a seamless Kenyan coastal adventure</p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-3">
            {practicalInfo.map((info, i) => {
              const isOpen = openInfo === i
              return (
                <FadeUp key={i} delay={i * 0.05}>
                  <motion.div
                    className="rounded-2xl overflow-hidden border bg-white cursor-pointer transition-all duration-200 hover:shadow-md"
                    style={{ borderColor: isOpen ? `${info.color}35` : '#e5e7eb', boxShadow: isOpen ? `0 4px 20px ${info.color}10` : undefined }}
                    onClick={() => setOpenInfo(isOpen ? null : i)}
                  >
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${info.color}10`, borderColor: `${info.color}20` }}>
                          <info.icon className="w-5 h-5" style={{ color: info.color }} />
                        </div>
                        <span className="text-gray-800 font-semibold">{info.title}</span>
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
                              {info.items.map((item, ii) => (
                                <div key={ii} className="flex items-start gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: info.color }} />
                                  <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
                                </div>
                              ))}
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

      {/* ══════════════════════ CLOSING CTA ══════════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85" alt="Diani Beach Kenya" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <FadeUp>
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Begin Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f59e0b] to-[#f97316]">Kenyan Adventure</span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              Wild dolphins, pristine coral reefs, and candlelit riverside dinners — Kenya's coast is waiting.
            </p>
            <button className="px-10 py-4 bg-[#f59e0b] text-white font-bold rounded-full text-sm tracking-wide hover:bg-[#d97706] hover:scale-105 transition-all duration-300 shadow-lg">
              Start Planning
            </button>
          </div>
        </FadeUp>
      </section>
    </div>
  )
}
