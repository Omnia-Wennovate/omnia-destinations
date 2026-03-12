'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getFirebaseAuth, getFirebaseDb, getFirebaseModules } from '@/lib/firebase/config'
import { getUserBookings, type FirestoreBooking } from '@/lib/services/bookings.service'
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
} from 'lucide-react'


interface UserProfile {
  name: string
  email: string
  loyaltyPoints: number
  referralCode: string
  totalReferrals: number
  phone: string
  role: string
  createdAt: any
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
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isInitialized, isAuthenticated, router])

  // Fetch user data from Firestore
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !user) return

    async function fetchData() {
      try {
        setLoading(true)
        const db = await getFirebaseDb()
        const modules = await getFirebaseModules()
        
        // Fetch user profile
        if (db && modules.firestore) {
          const { doc, getDoc, collection, query, where, orderBy, getDocs } = modules.firestore
          
          try {
            const userDocRef = doc(db, 'users', user!.id)
            const userDocSnap = await getDoc(userDocRef)
            if (userDocSnap.exists()) {
              const data = userDocSnap.data()
              setProfile({
                name: data.name || `${user!.firstName} ${user!.lastName}`,
                email: data.email || user!.email,
                loyaltyPoints: data.loyaltyPoints || 0,
                referralCode: data.referralCode || '------',
                totalReferrals: data.totalReferrals || 0,
                phone: data.phone || '',
                role: data.role || 'USER',
                createdAt: data.createdAt,
              })
            } else {
              // Fallback to store data
              setProfile({
                name: `${user!.firstName} ${user!.lastName}`.trim(),
                email: user!.email,
                loyaltyPoints: 0,
                referralCode: '------',
                totalReferrals: 0,
                phone: '',
                role: 'USER',
                createdAt: null,
              })
            }
          } catch {
            setProfile({
              name: `${user!.firstName} ${user!.lastName}`.trim(),
              email: user!.email,
              loyaltyPoints: 0,
              referralCode: '------',
              totalReferrals: 0,
              phone: '',
              role: 'USER',
              createdAt: null,
            })
          }

          // Fetch bookings using the service
        try {
<<<<<<< HEAD
  const firestoreBookings = await getUserBookings(user!.id)
=======
  const firestoreBookings = await getUserBookings(userId)
>>>>>>> 4c57566027f0d79a8001fe43943a3fa318651381

  const bookingsList: Booking[] = firestoreBookings.map((b) => ({
    id: b.id,
    tourTitle: b.packageTitle || b.tourTitle || "Unknown Package",
    travelDate: b.travelDate || "",
    createdAt: b.createdAt,
    guests: b.guests || 1,
    amount: b.totalAmount || b.amount || 0,
    status: b.bookingStatus || "pending",
    paymentStatus: b.paymentStatus || "unpaid",
  }))

  setBookings(bookingsList)
} catch (error) {
  console.error("Error loading bookings:", error)
}

          // Fetch rewards for this user
          try {
            const rewardsQuery = query(
              collection(db, 'rewards'),
              where('userId', '==', user!.id),
              orderBy('createdAt', 'desc')
            )
            const rewardsSnap = await getDocs(rewardsQuery)
            const rewardsList: Reward[] = []
            rewardsSnap.forEach((d: any) => {
              const data = d.data()
              rewardsList.push({
                id: d.id,
                points: data.points || 0,
                type: data.type || 'loyalty',
                reason: data.reason || '',
                createdAt: data.createdAt,
              })
            })
            setRewards(rewardsList)
          } catch {
            setRewards([])
          }
        } else {
          // Fallback when Firebase not available
          setProfile({
            name: `${user!.firstName} ${user!.lastName}`.trim(),
            email: user!.email,
            loyaltyPoints: 0,
            referralCode: '------',
            totalReferrals: 0,
            phone: '',
            role: 'USER',
            createdAt: null,
          })
        }
      } catch {
        // Errors handled per-section above
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isInitialized, isAuthenticated, user])

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
                          <div className={`p-2 rounded-lg ${
                            reward.type === 'referral'
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
