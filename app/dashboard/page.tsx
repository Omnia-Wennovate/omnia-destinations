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
  annualOmniaValue: number
  referralCode: string
  totalReferrals: number
  phone: string
  role: string
  createdAt: any
}

// ── Tier configuration ─────────────────────────────────────────────────────────
const TIER_CONFIG = [
  { name: 'Hope', icon: '⭐', minCoins: 0, minSpend: 0, multiplier: '1x', benefit: '1× coin multiplier on every booking', badgeBg: 'bg-blue-100 dark:bg-blue-950/60', badgeText: 'text-blue-700 dark:text-blue-300', badgeBorder: 'border-blue-300 dark:border-blue-700', bar: 'bg-blue-500' },
  { name: 'Explorer', icon: '🧭', minCoins: 500, minSpend: 50_000, multiplier: '1.2x', benefit: '1.2× coins — earn 20% more per trip', badgeBg: 'bg-gray-100 dark:bg-gray-800/60', badgeText: 'text-gray-700 dark:text-gray-300', badgeBorder: 'border-gray-300 dark:border-gray-600', bar: 'bg-gray-500' },
  { name: 'Gold', icon: '👑', minCoins: 1_000, minSpend: 100_000, multiplier: '1.5x', benefit: '1.5× coins — half again more rewards', badgeBg: 'bg-amber-100 dark:bg-amber-950/60', badgeText: 'text-amber-700 dark:text-amber-300', badgeBorder: 'border-amber-300 dark:border-amber-700', bar: 'bg-amber-500' },
  { name: 'Platinum', icon: '💎', minCoins: 1_500, minSpend: 200_000, multiplier: '2x', benefit: '2× coins + priority support', badgeBg: 'bg-purple-100 dark:bg-purple-950/60', badgeText: 'text-purple-700 dark:text-purple-300', badgeBorder: 'border-purple-300 dark:border-purple-700', bar: 'bg-gradient-to-r from-purple-500 to-pink-500' },
] as const

function getTierConfig(tier: string) {
  return TIER_CONFIG.find(t => t.name === tier) ?? TIER_CONFIG[0]
}

function getTierProgress(tier: string, totalCoinsEarned: number, annualOmniaValue: number) {
  const currentIdx = TIER_CONFIG.findIndex(t => t.name === tier)
  if (currentIdx === TIER_CONFIG.length - 1) return null // already Platinum
  const next = TIER_CONFIG[currentIdx + 1]
  // Use whichever metric gives the better (higher) progress
  const coinsPct = next.minCoins > 0 ? Math.min(100, Math.round((totalCoinsEarned / next.minCoins) * 100)) : 100
  const spendPct = next.minSpend > 0 ? Math.min(100, Math.round((annualOmniaValue / next.minSpend) * 100)) : 100
  const percent = Math.max(coinsPct, spendPct)
  const coinsLeft = Math.max(0, next.minCoins - totalCoinsEarned)
  const spendLeft = Math.max(0, next.minSpend - annualOmniaValue)
  const parts: string[] = []
  if (coinsLeft > 0) parts.push(`earn ${coinsLeft.toLocaleString()} more coins`)
  if (spendLeft > 0) parts.push(`spend ${spendLeft.toLocaleString()} ETB more`)
  const hint = parts.length > 0 ? `${parts.join(' or ')} to reach ${next.name}` : `You qualify for ${next.name}!`
  return { nextTier: next.name, nextIcon: next.icon, percent, hint, bar: next.bar }
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

  // Real-time listener: users/{uid} → profile (tier, loyaltyPoints, etc.)
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !user) return

    let unsubscribeProfile: (() => void) | null = null

    async function subscribeToProfile() {
      const db = await getFirebaseDb()
      const modules = await getFirebaseModules()
      if (!db || !modules.firestore) {
        // Fallback when Firebase not available
        setProfile({
          name: `${user!.firstName} ${user!.lastName}`.trim(),
          email: user!.email,
          loyaltyPoints: 0,
          tier: 'Hope',
          totalCoinsEarned: 0,
          annualOmniaValue: 0,
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
          console.log('[Dashboard] user.tier:', data.tier)
          setProfile({
            name: data.name || `${user!.firstName} ${user!.lastName}`,
            email: data.email || user!.email,
            loyaltyPoints: data.loyaltyPoints ?? 0,
            tier: data.tier ?? 'Hope',
            totalCoinsEarned: data.totalCoinsEarned ?? 0,
            annualOmniaValue: data.annualOmniaValue ?? 0,
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
            annualOmniaValue: 0,
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

  // Fetch user data from Firestore (bookings only — profile and rewards use onSnapshot above)
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !user) return

    async function fetchData() {
      try {
        setLoading(true)

        // Fetch bookings using the service
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
            paymentStatus: b.paymentStatus || 'unpaid',
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



  // Real-time listener: users/{uid}/coinsHistory → Rewards History section
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
        console.log('[Dashboard] coinsHistory length:', list.length)
        setRewards(list)
      }, (err: any) => {
        console.error('[Dashboard] coinsHistory listener error:', err)
        setRewards([])
      })
    }

    subscribeToHistory()
    return () => { if (unsubscribe) unsubscribe() }
  }, [isInitialized, isAuthenticated, user])

  // Real-time listener: users/{uid}/favorites → Favorites section
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
        snap.forEach((d: any) => {
          list.push(d.data() as FavoritePackage)
        })
        // sort locally by addedAt desc
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

  // ── Passport: load existing data on mount ──────────────────────────────
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

  // ── Passport: upload handler ────────────────────────────────────────────
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
    if (!user) return;
    try {
      await removeFromFavorites(user.id, packageId);
    } catch (error) {
      console.error('[Dashboard] Error removing favorite:', error);
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
    } catch {
      // Ignore Firebase signout errors for hardcoded admin
    }
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

              {/* Loyalty Points */}
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50">
                      <Star className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loyalty Points</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{profile?.loyaltyPoints.toLocaleString() || 0}</p>

                  {/* ── Enhanced Tier Display ─────────────────────────────── */}
                  {profile && (() => {
                    const cfg = getTierConfig(profile.tier)
                    const progress = getTierProgress(profile.tier, profile.totalCoinsEarned, profile.annualOmniaValue)
                    return (
                      <div className="mt-3 space-y-2.5" style={{ animation: 'tierFadeIn 0.5s ease-out' }}>
                        {/* Tier Badge */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} transition-all duration-300`}>
                          <span role="img" aria-label={cfg.name}>{cfg.icon}</span>
                          <span>{cfg.name} Member</span>
                        </div>

                        {/* Benefit text */}
                        <p className="text-xs text-muted-foreground leading-snug">{cfg.benefit}</p>

                        {/* Progress bar */}
                        {progress && (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Progress to {progress.nextIcon} {progress.nextTier}</span>
                              <span className="text-xs font-semibold text-foreground">{progress.percent}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${progress.bar} transition-all duration-700`}
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground leading-snug">{progress.hint}</p>
                          </div>
                        )}
                        {!progress && (
                          <p className="text-xs font-medium text-purple-600 dark:text-purple-400">🏆 Maximum tier reached!</p>
                        )}
                      </div>
                    )
                  })()
                  }
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
                  <p className="text-2xl font-bold text-foreground">{profile?.totalReferrals || 0}</p>
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
                      <p className="text-sm text-muted-foreground">Share this code and earn rewards when friends sign up</p>
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

            {/* Loyalty Program Section */}
            <Card className="border-border/50 mb-8">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Loyalty Program</p>
                      <p className="text-sm text-muted-foreground">Learn how to earn and redeem your loyalty points</p>
                    </div>
                  </div>
                  <a
                    href="/omnia-loyalty-program.pdf"
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-transparent text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Loyalty Program PDF
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* ── Passport Upload Section ──────────────────────────────────── */}
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

                    {/* ── Existing passport display ── */}
                    {passport && (() => {
                      const daysLeft = calcDaysLeft(passport.expiryDate)
                      const status  = getPassportStatus(daysLeft)
                      return (
                        <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-3">
                          <p className="text-sm font-semibold text-foreground">Current Passport</p>
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
                              <span
                                className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                  status.bg
                                } ${status.color} ${status.border}`}
                              >
                                <span>{status.emoji}</span>
                                {status.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* ── Upload form ── */}
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-foreground">
                        {passport ? 'Replace Passport' : 'Upload Passport'}
                      </p>

                      {/* File drop zone */}
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

                      {/* Expiry date */}
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

                      {/* Error */}
                      {passportError && (
                        <p className="text-sm text-red-500">{passportError}</p>
                      )}

                      {/* Upload progress */}
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

                      {/* Submit button */}
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
                    <Button variant="outline" size="sm" className="bg-transparent">
                      Discover More
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No favorites yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Packages you save will appear here</p>
                    <Link href="/tours">
                      <Button className="mt-4">Explore Packages</Button>
                    </Link>
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
                              <Button className="w-full" variant="outline" size="sm">
                                View Details
                              </Button>
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
                    <Button variant="outline" size="sm" className="bg-transparent">
                      Browse Tours
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No bookings yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Your upcoming trips will appear here</p>
                    <Link href="/tours">
                      <Button className="mt-4">Explore Tours</Button>
                    </Link>
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

            {/* Rewards Section */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Rewards History
                </CardTitle>
                <CardDescription>
                  {rewards.length} reward{rewards.length !== 1 ? 's' : ''} earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rewards.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No rewards yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Book tours and refer friends to earn points</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${reward.type === 'referral'
                              ? 'bg-blue-50 dark:bg-blue-950/50'
                              : 'bg-amber-50 dark:bg-amber-950/50'
                            }`}>
                            {reward.type === 'referral' ? (
                              <Share2 className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Star className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{reward.reason || 'Points earned'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDate(reward.createdAt)}
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {reward.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          +{reward.points}
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
