'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Gift,
  Search,
  RefreshCw,
  ArrowLeft,
  Star,
  Users,
  Filter,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import {
  getRewardsFromFirestore,
  type FirestoreReward,
} from '@/lib/services/rewards.service'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

// ── Type Badge ─────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    loyalty:  { label: 'Loyalty',  classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    referral: { label: 'Referral', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  }
  const c = config[type] || { label: type, classes: 'bg-muted text-muted-foreground' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.classes}`}>
      {type === 'loyalty' ? <Star className="h-3 w-3" /> : <Users className="h-3 w-3" />}
      {c.label}
    </span>
  )
}

// ── Points Badge ───────────────────────────────────────────────
function PointsBadge({ points }: { points: number }) {
  const isPositive = points >= 0
  return (
    <span className={`inline-flex items-center font-bold text-sm ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {isPositive ? '+' : ''}{points.toLocaleString()}
    </span>
  )
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, bgColor }: {
  title: string; value: string | number; icon: any; color: string; bgColor: string
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Format date ────────────────────────────────────────────────
function formatDate(ts: any): string {
  if (!ts) return '—'
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Main Page ──────────────────────────────────────────────────
export default function AdminRewardsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [rewards, setRewards] = useState<FirestoreReward[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchRewards()
  }, [])

  async function fetchRewards() {
    try {
      setLoading(true)
      const data = await getRewardsFromFirestore()
      setRewards(data)
    } catch {
      // handled silently
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchRewards()
    setRefreshing(false)
  }

  // ── Filtering ─────────────────────────────────────────────────
  const filtered = rewards.filter((r) => {
    const matchesSearch =
      searchQuery === '' ||
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || r.type === typeFilter
    return matchesSearch && matchesType
  })

  // ── Summary stats ─────────────────────────────────────────────
  const totalPoints = rewards.reduce((s, r) => s + r.points, 0)
  const loyaltyCount = rewards.filter((r) => r.type === 'loyalty').length
  const referralCount = rewards.filter((r) => r.type === 'referral').length
  const loyaltyPoints = rewards.filter((r) => r.type === 'loyalty').reduce((s, r) => s + r.points, 0)
  const referralPoints = rewards.filter((r) => r.type === 'referral').reduce((s, r) => s + r.points, 0)

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-12 w-full mb-4 rounded-lg" />
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full mb-2 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="outline" size="icon" className="bg-transparent shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Gift className="h-8 w-8 text-primary" />
                  Rewards Log
                </h1>
                <p className="text-muted-foreground mt-1">
                  {rewards.length} total reward entr{rewards.length !== 1 ? 'ies' : 'y'} &middot; Read-only audit log
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="bg-transparent gap-2 w-fit">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Points Issued" value={totalPoints.toLocaleString()} icon={TrendingUp} color="text-green-600" bgColor="bg-green-50 dark:bg-green-950" />
          <StatCard title="Loyalty Points" value={loyaltyPoints.toLocaleString()} icon={Star} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-950" />
          <StatCard title="Referral Points" value={referralPoints.toLocaleString()} icon={Users} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-950" />
          <StatCard title="Total Entries" value={rewards.length} icon={Calendar} color="text-purple-600" bgColor="bg-purple-50 dark:bg-purple-950" />
        </div>

        {/* Breakdown Mini Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                    <Star className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Loyalty Rewards</p>
                    <p className="text-lg font-bold text-foreground">{loyaltyCount} entries</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-600">{loyaltyPoints.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">total points</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Referral Rewards</p>
                    <p className="text-lg font-bold text-foreground">{referralCount} entries</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{referralPoints.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">total points</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, email, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'loyalty', 'referral'] as const).map((t) => (
                  <Button
                    key={t}
                    variant={typeFilter === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypeFilter(t)}
                    className={typeFilter !== t ? 'bg-transparent' : ''}
                  >
                    {t === 'all' ? (
                      <><Filter className="h-3.5 w-3.5 mr-1.5" />All ({rewards.length})</>
                    ) : t === 'loyalty' ? (
                      <><Star className="h-3.5 w-3.5 mr-1.5" />Loyalty ({loyaltyCount})</>
                    ) : (
                      <><Users className="h-3.5 w-3.5 mr-1.5" />Referral ({referralCount})</>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">User</th>
                  <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground">Points</th>
                  <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground">Type</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Reason</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Gift className="h-12 w-12 opacity-30" />
                        <p className="text-lg font-medium">No reward entries found</p>
                        <p className="text-sm">
                          {searchQuery || typeFilter !== 'all'
                            ? 'Try adjusting your search or filters.'
                            : 'Reward entries will appear here as users earn loyalty and referral points.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((reward) => (
                    <tr key={reward.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {reward.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{reward.userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{reward.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      {/* Points */}
                      <td className="py-3.5 px-4 text-center">
                        <PointsBadge points={reward.points} />
                      </td>
                      {/* Type */}
                      <td className="py-3.5 px-4 text-center">
                        <TypeBadge type={reward.type} />
                      </td>
                      {/* Reason */}
                      <td className="py-3.5 px-4">
                        <p className="text-foreground max-w-[300px] truncate">{reward.reason}</p>
                      </td>
                      {/* Date */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          {formatDate(reward.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="border-t bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Showing {filtered.length} of {rewards.length} entr{rewards.length !== 1 ? 'ies' : 'y'}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
