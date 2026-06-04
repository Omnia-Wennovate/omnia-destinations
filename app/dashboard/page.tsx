'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getFirebaseAuth, getFirebaseDb, getFirebaseModules } from '@/lib/firebase/config'
import { getUserBookings } from '@/lib/services/bookings.service'
import { removeFromFavorites, type FavoritePackage } from '@/lib/services/favorites.service'
import {
  uploadPassportFile,
  savePassportData,
  getPassportData,
  calcDaysLeft,
  getPassportStatus,
  type PassportData,
} from '@/lib/services/passport.service'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Gift,
  Share2,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Clock,
  Star,
  LogOut,
  Copy,
  Check,
  Loader2,
  Plane,
  Download,
  Heart,
  Trash2,
  ShieldCheck,
  Upload,
  FileText,
  ExternalLink,
} from 'lucide-react'


interface UserProfile {
  name: string
  email: string
  loyaltyPoints: number
  tier: string
  totalCoinsEarned: number
  /** Total completed trips ever */
  totalCompletedTrips: number
  /** Completed trips within the current 12-month membership year — drives tier qualification */
  completedTripsThisYear: number
  totalSpend: number
  referralCode: string
  totalReferrals: number
  phone: string
  role: string
  createdAt: any
}

// ── Tier configuration aligned with the Omnia Loyalty Program document ────────
//
// Tiers (in order):
//   Hope      → Bronze        (0 trips,  1.0×, open enrolment)
//   HopePlus  → Hope+/Preferred (1 trip, 1.1×, auto after first paid trip)
//   Explorer  → Silver        (2 trips,  1.2×, open enrolment)
//   Royal     → Gold          (3 trips,  1.5×, invite/approval)
//   Timeless  → Platinum      (4 trips,  2.0×, invite/approval)
//   Diamond   → Diamond       (5+ trips, 3.0×, invite/approval)
//
// Tier qualification is based SOLELY on completed trips in a 12-month
// membership year.  Referred trips that complete count toward the referrer's
// personal trip total.
//
// Gold / Platinum / Diamond require Omnia team confirmation (up to 5 business
// days).  Until confirmed the previous tier benefits remain active — we show
// a "pending review" note in the UI.

const TIER_CONFIG = [
  {
    name: 'Hope',
    label: 'Hope (Bronze)',
    icon: '🥉',
    minTrips: 0,
    multiplier: '1×',
    requiresApproval: false,
    benefit: '1× coin multiplier · standard-plus priority · early package access',
    benefits: [
      '1× coin multiplier on every booking',
      'Standard-plus priority handling',
      'Early access to packages',
      '100 welcome coins on first booking',
    ],
    badgeBg:     'bg-orange-100 dark:bg-orange-950/60',
    badgeText:   'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-300 dark:border-orange-700',
    bar:         'bg-orange-400',
  },
  {
    name: 'HopePlus',
    label: 'Hope+ (Preferred)',
    icon: '⭐',
    minTrips: 1,
    multiplier: '1.1×',
    requiresApproval: false,
    benefit: '1.1× coin multiplier · recognised returning client',
    benefits: [
      '1.1× coin multiplier',
      'Priority handling — recognised returning client',
      '1 more trip qualifies you for Silver',
    ],
    badgeBg:     'bg-orange-100 dark:bg-orange-950/60',
    badgeText:   'text-orange-600 dark:text-orange-200',
    badgeBorder: 'border-orange-400 dark:border-orange-600',
    bar:         'bg-orange-500',
  },
  {
    name: 'Explorer',
    label: 'Explorer (Silver)',
    icon: '🧭',
    minTrips: 2,
    multiplier: '1.2×',
    requiresApproval: false,
    benefit: '1.2× coins · 1% discount · ET Lounge 1×/year · 1 eSIM',
    benefits: [
      '1.2× coin multiplier',
      '1% discount on all displayed prices',
      'Ethiopian Airlines Lounge access 1× per year',
      '1 international eSIM per year',
      'Corporate hotel deals up to 30%',
    ],
    badgeBg:     'bg-gray-100 dark:bg-gray-800/60',
    badgeText:   'text-gray-700 dark:text-gray-300',
    badgeBorder: 'border-gray-300 dark:border-gray-600',
    bar:         'bg-gray-500',
  },
  {
    name: 'Royal',
    label: 'Royal (Gold)',
    icon: '🥇',
    minTrips: 3,
    multiplier: '1.5×',
    requiresApproval: true,
    benefit: '1.5× coins · 2% discount · ET Lounge 2×/year · 2 eSIMs · domestic flight',
    benefits: [
      '1.5× coin multiplier',
      '2% discount on all displayed prices',
      'ET Lounge access 2× per year',
      '2 eSIMs per year',
      'Dedicated account support',
      '1 complimentary domestic flight per year',
      '1 free spa voucher',
      '50% one-way business class upgrade',
    ],
    badgeBg:     'bg-amber-100 dark:bg-amber-950/60',
    badgeText:   'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-300 dark:border-amber-700',
    bar:         'bg-amber-500',
  },
  {
    name: 'Timeless',
    label: 'Timeless (Platinum)',
    icon: '💎',
    minTrips: 4,
    multiplier: '2×',
    requiresApproval: true,
    benefit: '2× coins · 3% discount · ET Lounge 3×/year · domestic flight · 2 spa vouchers',
    benefits: [
      '2× coin multiplier',
      '3% discount on all displayed prices',
      'ET Lounge access 3× per year',
      'Multiple eSIMs (fair-use)',
      'Absolute priority handling',
      '1 complimentary domestic flight per year',
      '2 free spa vouchers',
      'Free one-way business upgrade or 50% package discount',
    ],
    badgeBg:     'bg-purple-100 dark:bg-purple-950/60',
    badgeText:   'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-300 dark:border-purple-700',
    bar:         'bg-gradient-to-r from-purple-500 to-pink-500',
  },
  {
    name: 'Diamond',
    label: 'Diamond',
    icon: '👑',
    minTrips: 5,
    multiplier: '3×',
    requiresApproval: true,
    benefit: '3× coins · 5% discount · ET Lounge 4×/year · domestic flight · 3 spa vouchers',
    benefits: [
      '3× coin multiplier',
      '5% discount on all displayed prices',
      'ET Lounge access 4× per year',
      'Multiple eSIMs (fair-use)',
      'Absolute priority in every interaction',
      '1 complimentary domestic flight per year',
      '3 free spa vouchers',
      'Full return business class upgrade or 100% package discount',
    ],
    badgeBg:     'bg-yellow-100 dark:bg-yellow-950/60',
    badgeText:   'text-yellow-700 dark:text-yellow-300',
    badgeBorder: 'border-yellow-300 dark:border-yellow-700',
    bar:         'bg-gradient-to-r from-yellow-400 to-amber-500',
  },
] as const

type TierConfigName = typeof TIER_CONFIG[number]['name']

function getTierConfig(tier: string) {
  return TIER_CONFIG.find(t => t.name === tier) ?? TIER_CONFIG[0]
}

function getMonthsLeft(expiryDate: string) {
  const expiry = new Date(expiryDate)
  const now = new Date()
  return (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth())
}

/**
 * Calculate tier progress based on completedTripsThisYear only.
 * Returns null when the user is already at Diamond (max tier).
 */
function getTierProgress(tier: string, completedTripsThisYear: number) {
  const currentIdx = TIER_CONFIG.findIndex(t => t.name === tier)
  // Already at max tier
  if (currentIdx === TIER_CONFIG.length - 1) return null

  const next = TIER_CONFIG[currentIdx + 1]
  const tripsNeeded = next.minTrips
  const percent = tripsNeeded > 0
    ? Math.min(100, Math.round((completedTripsThisYear / tripsNeeded) * 100))
    : 100
  const tripsLeft = Math.max(0, tripsNeeded - completedTripsThisYear)

  const hint = tripsLeft > 0
    ? `${tripsLeft} more completed trip${tripsLeft !== 1 ? 's' : ''} to reach ${next.label}`
    : `You qualify for ${next.label}!${next.requiresApproval ? ' (pending Omnia review)' : ''}`

  return {
    nextTier: next.name,
    nextLabel: next.label,
    nextIcon: next.icon,
    percent,
    hint,
    bar: next.bar,
    requiresApproval: next.requiresApproval,
  }
}

interface Booking {
  id: string
  tourTitle: string
  travelDate: string
  createdAt: any
  guests: number
  amount: number
  status: string
  paymentStatus: string
  receiptSubmitted: boolean
}

interface Reward {
  id: string
  points: number
  type: string
  reason: string
  createdAt: any
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized, logout: storeLogout } = useAuthStore()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [favorites, setFavorites] = useState<FavoritePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // ── Passport state ──────────────────────────────────────────────────────
  const [passport, setPassport] = useState<PassportData | null>(null)
  const [passportLoading, setPassportLoading] = useState(false)
  const [passportUploading, setPassportUploading] = useState(false)
  const [passportProgress, setPassportProgress] = useState(0)
  const [passportExpiryInput, setPassportExpiryInput] = useState('')
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [passportError, setPassportError] = useState('')
  const passportInputRef = useRef<HTMLInputElement>(null)

  // Redirect if not authenticated or role mismatch
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (user?.role === 'ADMIN') {
        router.replace('/admin')
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  // Passport expiry notification (≤ 8 months left)
  useEffect(() => {
    if (!passport || !user?.id) return
    const monthsLeft = getMonthsLeft(passport.expiryDate)
    const key = `passport_notified_${user.id}`
    const alreadyNotified = localStorage.getItem(key)
    if (Notification.permission !== 'granted') Notification.requestPermission()
    if (monthsLeft <= 8 && monthsLeft > 0 && !alreadyNotified) {
      if (Notification.permission === 'granted') {
        new Notification('⚠️ Passport Expiry Warning', {
          body: `Your passport expires in ${monthsLeft} month(s). Please renew it.`,
        })
      }
      localStorage.setItem(key, 'true')
    }
    if (monthsLeft > 8) localStorage.removeItem(key)
  }, [passport, user])

  // Real-time listener: users/{uid} → profile
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !user) return
    let unsubscribeProfile: (() => void) | null = null

    async function subscribeToProfile() {
      const db = await getFirebaseDb()
      const modules = await getFirebaseModules()
      if (!db || !modules.firestore) {
        setProfile({
          name: `${user!.firstName} ${user!.lastName}`.trim(),
          email: user!.email,
          loyaltyPoints: 0,
          tier: 'Hope',
          totalCoinsEarned: 0,
          totalCompletedTrips: 0,
          completedTripsThisYear: 0,
          totalSpend: 0,
          referralCode: '------',
          totalReferrals: 0,
          phone: '',
          role: 'USER',
          createdAt: null,
        })
        return
      }

      const { doc, onSnapshot } = modules.firestore
      const userDocRef = doc(db, 'users', user!.id)

      unsubscribeProfile = onSnapshot(userDocRef, (snap: any) => {
        if (snap.exists()) {
          const data = snap.data()
          console.log('[Dashboard] user.tier:', data.tier, 'tripsThisYear:', data.completedTripsThisYear)
          setProfile({
            name: data.name || `${user!.firstName} ${user!.lastName}`,
            email: data.email || user!.email,
            loyaltyPoints: data.loyaltyPoints ?? 0,
            tier: data.tier ?? 'Hope',
            totalCoinsEarned: data.totalCoinsEarned ?? 0,
            totalCompletedTrips: data.totalCompletedTrips ?? 0,
            // completedTripsThisYear drives tier progress UI
            completedTripsThisYear: data.completedTripsThisYear ?? 0,
            totalSpend: data.totalSpend ?? 0,
            referralCode: data.referralCode || '------',
            totalReferrals: data.totalReferrals ?? 0,
            phone: data.phone || '',
            role: data.role || 'USER',
            createdAt: data.createdAt,
          })
        } else {
          setProfile({
            name: `${user!.firstName} ${user!.lastName}`.trim(),
            email: user!.email,
            loyaltyPoints: 0,
            tier: 'Hope',
            totalCoinsEarned: 0,
            totalCompletedTrips: 0,
            completedTripsThisYear: 0,
            totalSpend: 0,
            referralCode: '------',
            totalReferrals: 0,
            phone: '',
            role: 'USER',
            createdAt: null,
          })
        }
      }, (err: any) => {
        console.error('[Dashboard] profile listener error:', err)
      })
    }

    subscribeToProfile()
    return () => { if (unsubscribeProfile) unsubscribeProfile() }
  }, [isInitialized, isAuthenticated, user])

  // Fetch bookings
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !user) return

    async function fetchData() {
      try {
        setLoading(true)
        try {
          const firestoreBookings = await getUserBookings(user!.id)
          const bookingsList: Booking[] = firestoreBookings.map((b) => ({
            id: b.id,
            tourTitle: b.packageTitle || b.tourTitle || 'Unknown Package',
            travelDate: b.travelDate || '',
            createdAt: b.createdAt,
            guests: b.guests || 1,
            amount: b.totalAmount || b.amount || 0,
            status: b.bookingStatus || 'pending',
            paymentStatus: b.paymentStatus || 'pending',
            receiptSubmitted: b.paymentCompleted === true || !!b.receiptUrl || !!b.paymentReceipt,
          }))
          setBookings(bookingsList)
        } catch (error) {
          console.error('[Dashboard] Error loading bookings:', error)
        }
      } catch {
        // Errors handled per-section above
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isInitialized, isAuthenticated, user])

  // Real-time listener: coinsHistory → Rewards History
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !user) return
    let unsubscribe: (() => void) | null = null

    async function subscribeToHistory() {
      const db = await getFirebaseDb()
      const modules = await getFirebaseModules()
      if (!db || !modules.firestore) return

      const { collection, query, orderBy, onSnapshot } = modules.firestore
      const histRef = query(
        collection(db, 'users', user!.id, 'coinsHistory'),
        orderBy('createdAt', 'desc')
      )

      unsubscribe = onSnapshot(histRef, (snap: any) => {
        const list: Reward[] = []
        snap.forEach((d: any) => {
          const data = d.data()
          list.push({
            id: d.id,
            points: data.amount ?? 0,
            type: data.type || 'booking',
            reason: data.reason || data.relatedBookingId || '—',
            createdAt: data.createdAt,
          })
        })
        setRewards(list)
      }, (err: any) => {
        console.error('[Dashboard] coinsHistory listener error:', err)
        setRewards([])
      })
    }

    subscribeToHistory()
    return () => { if (unsubscribe) unsubscribe() }
  }, [isInitialized, isAuthenticated, user])

  // Real-time listener: favorites
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !user) return
    let unsubscribe: (() => void) | null = null

    async function subscribeToFavorites() {
      const db = await getFirebaseDb()
      const modules = await getFirebaseModules()
      if (!db || !modules.firestore) return

      const { collection, onSnapshot } = modules.firestore
      const favRef = collection(db, 'users', user!.id, 'favorites')

      unsubscribe = onSnapshot(favRef, (snap: any) => {
        const list: FavoritePackage[] = []
        snap.forEach((d: any) => list.push(d.data() as FavoritePackage))
        list.sort((a, b) => {
          const timeA = a.addedAt?.toMillis?.() || 0
          const timeB = b.addedAt?.toMillis?.() || 0
          return timeB - timeA
        })
        setFavorites(list)
      }, (err: any) => {
        console.error('[Dashboard] favorites listener error:', err)
        setFavorites([])
      })
    }

    subscribeToFavorites()
    return () => { if (unsubscribe) unsubscribe() }
  }, [isInitialized, isAuthenticated, user])

  // Passport: load on mount
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !user) return
    setPassportLoading(true)
    getPassportData(user.id)
      .then((data) => {
        if (data) {
          setPassport(data)
          setPassportExpiryInput(data.expiryDate)
        }
      })
      .catch((err) => console.error('[Dashboard] passport load error:', err))
      .finally(() => setPassportLoading(false))
  }, [isInitialized, isAuthenticated, user])

  // Passport: upload handler
  const handlePassportUpload = async () => {
    if (!user || !passportFile || !passportExpiryInput) {
      setPassportError('Please select a file and enter the expiry date.')
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(passportFile.type)) {
      setPassportError('Only JPG, PNG, or PDF files are accepted.')
      return
    }
    if (passportFile.size > 10 * 1024 * 1024) {
      setPassportError('File must be under 10 MB.')
      return
    }
    setPassportError('')
    setPassportUploading(true)
    setPassportProgress(0)
    try {
      const url = await uploadPassportFile(user.id, passportFile, (pct) => setPassportProgress(pct))
      await savePassportData(user.id, {
        fileUrl: url,
        fileName: passportFile.name,
        expiryDate: passportExpiryInput,
      })
      const fresh = await getPassportData(user.id)
      setPassport(fresh)
      setPassportFile(null)
      if (passportInputRef.current) passportInputRef.current.value = ''
    } catch (err: any) {
      console.error('[Dashboard] passport upload error:', err)
      setPassportError(err?.message || 'Upload failed. Please try again.')
    } finally {
      setPassportUploading(false)
      setPassportProgress(0)
    }
  }

  const handleRemoveFavorite = async (packageId: string) => {
    if (!user) return
    try {
      await removeFromFavorites(user.id, packageId)
    } catch (error) {
      console.error('[Dashboard] Error removing favorite:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const auth = await getFirebaseAuth()
      const modules = await getFirebaseModules()
      if (auth && modules.auth) {
        const { signOut } = modules.auth
        await signOut(auth)
      }
    } catch { /* ignore */ }
    storeLogout()
    router.replace('/login')
  }

  const handleCopyReferral = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function formatDate(ts: any) {
    if (!ts) return '--'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  function getPaymentColor(status: string) {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'unpaid':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
      case 'refunded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  if (!isInitialized || (!isAuthenticated && isInitialized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back{profile ? `, ${profile.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-muted-foreground mt-1">Here is your travel dashboard overview</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 bg-transparent text-muted-foreground hover:text-destructive hover:border-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-border/50 animate-pulse">
                <CardContent className="p-5">
                  <div className="h-4 w-20 bg-muted rounded mb-3" />
                  <div className="h-8 w-16 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Profile & Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

              {/* User Info */}
              <Card className="border-border/50 md:col-span-2 lg:col-span-2">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-7 w-7 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-lg text-foreground truncate">{profile?.name || 'User'}</p>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{profile?.email}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loyalty Points + Tier */}
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50">
                      <Star className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Omnia Coins</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {profile?.loyaltyPoints.toLocaleString() ?? 0}
                  </p>

                  {profile && (() => {
                    const cfg = getTierConfig(profile.tier)
                    // Tier progress uses completedTripsThisYear only
                    const progress = getTierProgress(profile.tier, profile.completedTripsThisYear)

                    return (
                      <div className="mt-3 space-y-2.5" style={{ animation: 'tierFadeIn 0.5s ease-out' }}>

                        {/* Tier Badge */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} transition-all duration-300`}>
                          <span role="img" aria-label={cfg.label}>{cfg.icon}</span>
                          <span>{cfg.label}</span>
                        </div>

                        {/* Short benefit summary */}
                        <p className="text-xs text-muted-foreground leading-snug">{cfg.benefit}</p>

                        {/* Trips this year */}
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{profile.completedTripsThisYear}</span> completed trip{profile.completedTripsThisYear !== 1 ? 's' : ''} this membership year
                        </p>

                        {/* Progress to next tier */}
                        {progress ? (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">
                                Progress to {progress.nextIcon} {progress.nextLabel}
                              </span>
                              <span className="text-xs font-semibold text-foreground">{progress.percent}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${progress.bar} transition-all duration-700`}
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground leading-snug">{progress.hint}</p>
                            {progress.requiresApproval && progress.percent >= 100 && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                🕐 Pending Omnia team review (up to 5 business days)
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                            👑 Maximum tier reached!
                          </p>
                        )}

                        {/* Key benefits list for current tier */}
                        <details className="group">
                          <summary className="text-xs text-primary cursor-pointer hover:underline list-none flex items-center gap-1">
                            <span>View tier benefits</span>
                            <span className="group-open:rotate-90 transition-transform inline-block">›</span>
                          </summary>
                          <ul className="mt-2 space-y-1">
                            {cfg.benefits.map((b, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                                {b}
                              </li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    )
                  })()}
                  <style>{`@keyframes tierFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
                </CardContent>
              </Card>

              {/* Referrals */}
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                      <Share2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Referrals</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{profile?.totalReferrals ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Earn 150–600 coins per successful referral
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Referral Code Card */}
            <Card className="border-border/50 mb-8">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Your Referral Code</p>
                      <p className="text-sm text-muted-foreground">
                        Earn 150 coins per individual · 350 for groups · 600 for corporate referrals
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-4 py-2 bg-secondary rounded-lg text-lg font-mono font-bold text-foreground tracking-widest">
                      {profile?.referralCode || '------'}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyReferral}
                      className="bg-transparent"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Program Card */}
            <Card className="border-border/50 mb-8">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Loyalty Program</p>
                      <p className="text-sm text-muted-foreground">
                        Earn 1 coin per ETB 1,000 spent · redeem for discounts up to 25%
                      </p>
                    </div>
                  </div>
                  <a
                    href="/omnia-loyalty-program.pdf"
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-transparent text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Loyalty PDF
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* ── Passport Section ─────────────────────────────────────────── */}
            <Card className="border-border/50 mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Passport
                </CardTitle>
                <CardDescription>Upload your passport and track its expiry status</CardDescription>
              </CardHeader>
              <CardContent>
                {passportLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">

                    {/* Existing passport display */}
                    {passport && (() => {
                      const daysLeft = calcDaysLeft(passport.expiryDate)
                      const status  = getPassportStatus(daysLeft)
                      const monthsLeft = getMonthsLeft(passport.expiryDate)
                      return (
                        <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-3">
                          <p className="text-sm font-semibold text-foreground">Current Passport</p>

                          {/* ≤ 8 months warning */}
                          {monthsLeft <= 8 && monthsLeft > 0 && (
                            <div className="p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 text-sm font-medium">
                              ⚠️ Your passport expires in {monthsLeft} month{monthsLeft !== 1 ? 's' : ''}. Please renew it soon.
                            </div>
                          )}
                          {monthsLeft <= 0 && (
                            <div className="p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 text-sm font-medium">
                              ❌ Your passport has expired. Please renew immediately.
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            {/* File link */}
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border/40">
                              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                              <a
                                href={passport.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-primary hover:underline truncate flex items-center gap-1"
                              >
                                {passport.fileName}
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            </div>

                            {/* Expiry date */}
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border/40">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Expiry Date</p>
                                <p className="font-medium text-foreground">
                                  {new Date(passport.expiryDate).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Days remaining + status */}
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border/40">
                              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Days Remaining</p>
                                <p className="font-bold text-foreground">
                                  {daysLeft <= 0 ? '—' : `${daysLeft} days`}
                                </p>
                              </div>
                              <span className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.color} ${status.border}`}>
                                <span>{status.emoji}</span>
                                {status.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Upload form */}
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-foreground">
                        {passport ? 'Replace Passport' : 'Upload Passport'}
                      </p>

                      <div
                        className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer p-8 bg-secondary/10 hover:bg-secondary/20"
                        onClick={() => passportInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">
                          {passportFile
                            ? <span className="font-medium text-foreground">{passportFile.name}</span>
                            : <><span className="font-medium text-primary">Click to choose</span> or drag your passport file here</>}
                        </p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, or PDF · Max 10 MB</p>
                        <input
                          ref={passportInputRef}
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null
                            setPassportFile(f)
                            setPassportError('')
                          }}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground" htmlFor="passportExpiryDate">
                          Passport Expiry Date
                        </label>
                        <input
                          id="passportExpiryDate"
                          type="date"
                          value={passportExpiryInput}
                          onChange={(e) => setPassportExpiryInput(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="h-10 w-full sm:w-60 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                        />
                      </div>

                      {passportError && (
                        <p className="text-sm text-red-500">{passportError}</p>
                      )}

                      {passportUploading && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Uploading…</span>
                            <span>{passportProgress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${passportProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handlePassportUpload}
                        disabled={passportUploading || !passportFile || !passportExpiryInput}
                        className="gap-2"
                      >
                        {passportUploading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                        ) : (
                          <><Upload className="h-4 w-4" /> Upload Passport</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Favorites Section */}
            <Card className="border-border/50 mb-8">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                      Favorite Packages
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {favorites.length} saved package{favorites.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Link href="/tours">
                    <Button variant="outline" size="sm" className="bg-transparent">Discover More</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No favorites yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Packages you save will appear here</p>
                    <Link href="/tours"><Button className="mt-4">Explore Packages</Button></Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((fav) => (
                      <div key={fav.packageId} className="group relative overflow-hidden rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                        <div className="aspect-video w-full overflow-hidden relative">
                          <img
                            src={fav.featuredImageURL || '/placeholder.svg'}
                            alt={fav.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-2 right-2">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveFavorite(fav.packageId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-4">
                          <Link href={`/packages/${fav.packageId}`}>
                            <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                              {fav.title}
                            </h3>
                          </Link>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">From</span>
                            <span className="font-bold text-primary">${fav.price}</span>
                          </div>
                          <div className="mt-4">
                            <Link href={`/packages/${fav.packageId}`} className="block">
                              <Button className="w-full" variant="outline" size="sm">View Details</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bookings Section */}
            <Card className="border-border/50 mb-8">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Plane className="h-5 w-5 text-primary" />
                      My Bookings
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {bookings.length} booking{bookings.length !== 1 ? 's' : ''} total
                    </CardDescription>
                  </div>
                  <Link href="/tours">
                    <Button variant="outline" size="sm" className="bg-transparent">Browse Tours</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No bookings yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Your upcoming trips will appear here</p>
                    <Link href="/tours"><Button className="mt-4">Explore Tours</Button></Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Package</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Travel Date</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Guests</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Payment</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-medium text-foreground text-sm">{booking.tourTitle}</p>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {booking.travelDate || formatDate(booking.createdAt)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-3.5 w-3.5" />
                                {booking.guests}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1 text-sm font-medium text-foreground">
                                <DollarSign className="h-3.5 w-3.5" />
                                {booking.amount.toLocaleString()}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="secondary" className={`text-xs font-medium ${getPaymentColor(booking.paymentStatus)}`}>
                                {booking.paymentStatus}
                              </Badge>
                              {booking.receiptSubmitted && (
                                <>
                                  <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5">Receipt Submitted</p>
                                  <div className="flex items-center justify-center gap-1.5 mt-1">
                                    <button
                                      onClick={() => window.open(`/api/receipt/${booking.id}`, '_blank')}
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-md px-3 py-1 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer bg-transparent transition-colors"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      View
                                    </button>
                                    <button
                                      onClick={() => window.open(`/api/receipt/${booking.id}`, '_blank')}
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 rounded-md px-3 py-1 hover:bg-green-50 dark:hover:bg-green-950/40 cursor-pointer bg-transparent transition-colors"
                                    >
                                      <Download className="h-3 w-3" />
                                      Download
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="secondary" className={`text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rewards History */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Rewards History
                </CardTitle>
                <CardDescription>
                  {rewards.length} transaction{rewards.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rewards.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No rewards yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete trips to earn coins · refer friends for bonus coins
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            reward.type === 'referral'
                              ? 'bg-blue-50 dark:bg-blue-950/50'
                              : reward.type === 'redemption'
                              ? 'bg-red-50 dark:bg-red-950/50'
                              : reward.type === 'welcome_bonus'
                              ? 'bg-green-50 dark:bg-green-950/50'
                              : 'bg-amber-50 dark:bg-amber-950/50'
                          }`}>
                            {reward.type === 'referral' ? (
                              <Share2 className="h-4 w-4 text-blue-500" />
                            ) : reward.type === 'redemption' ? (
                              <Download className="h-4 w-4 text-red-500" />
                            ) : reward.type === 'welcome_bonus' ? (
                              <Gift className="h-4 w-4 text-green-500" />
                            ) : (
                              <Star className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{reward.reason || 'Coins earned'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDate(reward.createdAt)}
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {reward.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${
                          reward.points < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {reward.points >= 0 ? '+' : ''}{reward.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </>
        )}
      </div>
    </div>
  )
}