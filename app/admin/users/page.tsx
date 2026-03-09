'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Search,
  RefreshCw,
  MoreHorizontal,
  ArrowLeft,
  ShieldCheck,
  ShieldOff,
  Star,
  UserPlus,
  Filter,
  Mail,
  Award,
  Minus,
  Plus,
} from 'lucide-react'
import {
  getUsersFromFirestore,
  updateUserRole,
  adjustLoyaltyPoints,
  type FirestoreUser,
} from '@/lib/services/users.service'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ── Role Badge ─────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
        <ShieldCheck className="h-3 w-3" />
        Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
      User
    </span>
  )
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string
  value: string | number
  icon: any
  color: string
  bgColor: string
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

// ── Avatar ─────────────────────────────────────────────────────
function UserAvatar({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || email[0]?.toUpperCase() || '?'

  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <Mail className="h-3 w-3 shrink-0" />
          {email}
        </p>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function AdminUsersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [users, setUsers] = useState<FirestoreUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  // Role dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [roleTarget, setRoleTarget] = useState<FirestoreUser | null>(null)
  const [roleAction, setRoleAction] = useState<'admin' | 'user'>('user')
  const [updatingRole, setUpdatingRole] = useState(false)

  // Loyalty dialog
  const [loyaltyDialogOpen, setLoyaltyDialogOpen] = useState(false)
  const [loyaltyTarget, setLoyaltyTarget] = useState<FirestoreUser | null>(null)
  const [loyaltyAmount, setLoyaltyAmount] = useState('')
  const [loyaltyMode, setLoyaltyMode] = useState<'add' | 'subtract'>('add')
  const [adjustingPoints, setAdjustingPoints] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const data = await getUsersFromFirestore()
      setUsers(data)
    } catch {
      // handled silently
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchUsers()
    setRefreshing(false)
  }

  // ── Role logic ───────────────────────────────────────────────
  function openRoleDialog(u: FirestoreUser, action: 'admin' | 'user') {
    setRoleTarget(u)
    setRoleAction(action)
    setRoleDialogOpen(true)
  }

  async function confirmRoleChange() {
    if (!roleTarget) return
    try {
      setUpdatingRole(true)
      await updateUserRole(roleTarget.id, roleAction)
      setUsers((prev) =>
        prev.map((u) => (u.id === roleTarget.id ? { ...u, role: roleAction } : u)),
      )
      setRoleDialogOpen(false)
      setRoleTarget(null)
    } catch {
      // silent
    } finally {
      setUpdatingRole(false)
    }
  }

  // ── Loyalty logic ────────────────────────────────────────────
  function openLoyaltyDialog(u: FirestoreUser) {
    setLoyaltyTarget(u)
    setLoyaltyAmount('')
    setLoyaltyMode('add')
    setLoyaltyDialogOpen(true)
  }

  async function confirmLoyaltyAdjust() {
    if (!loyaltyTarget || !loyaltyAmount) return
    const parsed = Number.parseInt(loyaltyAmount, 10)
    if (Number.isNaN(parsed) || parsed <= 0) return

    const actualAmount = loyaltyMode === 'subtract' ? -parsed : parsed

    try {
      setAdjustingPoints(true)
      await adjustLoyaltyPoints(loyaltyTarget.id, actualAmount)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === loyaltyTarget.id
            ? { ...u, loyaltyPoints: Math.max(0, u.loyaltyPoints + actualAmount) }
            : u,
        ),
      )
      setLoyaltyDialogOpen(false)
      setLoyaltyTarget(null)
      setLoyaltyAmount('')
    } catch {
      // silent
    } finally {
      setAdjustingPoints(false)
    }
  }

  // ── Filtering ────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const matchesSearch =
      searchQuery === '' ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  // ── Summary stats ────────────────────────────────────────────
  const totalUsers = users.length
  const adminCount = users.filter((u) => u.role === 'admin').length
  const totalLoyalty = users.reduce((s, u) => s + u.loyaltyPoints, 0)
  const totalReferrals = users.reduce((s, u) => s + u.totalReferrals, 0)

  // ── Loading ──────────────────────────────────────────────────
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
            <Skeleton key={i} className="h-16 w-full mb-2 rounded-lg" />
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
                  <Users className="h-8 w-8 text-primary" />
                  User Management
                </h1>
                <p className="text-muted-foreground mt-1">
                  {totalUsers} total user{totalUsers !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-transparent gap-2 w-fit"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Users"
            value={totalUsers}
            icon={Users}
            color="text-blue-600"
            bgColor="bg-blue-50 dark:bg-blue-950"
          />
          <StatCard
            title="Admins"
            value={adminCount}
            icon={ShieldCheck}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <StatCard
            title="Total Loyalty Points"
            value={totalLoyalty.toLocaleString()}
            icon={Star}
            color="text-amber-600"
            bgColor="bg-amber-50 dark:bg-amber-950"
          />
          <StatCard
            title="Total Referrals"
            value={totalReferrals.toLocaleString()}
            icon={UserPlus}
            color="text-green-600"
            bgColor="bg-green-50 dark:bg-green-950"
          />
        </div>

        {/* Toolbar */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'admin', 'user'] as const).map((r) => (
                  <Button
                    key={r}
                    variant={roleFilter === r ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRoleFilter(r)}
                    className={roleFilter !== r ? 'bg-transparent' : ''}
                  >
                    {r === 'all' ? (
                      <>
                        <Filter className="h-3.5 w-3.5 mr-1.5" />
                        All
                      </>
                    ) : r === 'admin' ? (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                        Admins ({adminCount})
                      </>
                    ) : (
                      <>
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Users ({totalUsers - adminCount})
                      </>
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
                  <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">
                    User
                  </th>
                  <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground">
                    Role
                  </th>
                  <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground">
                    Loyalty Points
                  </th>
                  <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground">
                    Referrals
                  </th>
                  <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Users className="h-12 w-12 opacity-30" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">
                          {searchQuery || roleFilter !== 'all'
                            ? 'Try adjusting your search or filters.'
                            : 'Users will appear here once they sign up.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {/* User */}
                      <td className="py-3.5 px-4">
                        <UserAvatar name={u.name} email={u.email} />
                      </td>
                      {/* Role */}
                      <td className="py-3.5 px-4 text-center">
                        <RoleBadge role={u.role} />
                      </td>
                      {/* Loyalty */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                          {u.loyaltyPoints.toLocaleString()}
                        </span>
                      </td>
                      {/* Referrals */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <UserPlus className="h-3.5 w-3.5" />
                          {u.totalReferrals}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {u.role === 'user' ? (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => openRoleDialog(u, 'admin')}
                              >
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Promote to Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                                onClick={() => openRoleDialog(u, 'user')}
                              >
                                <ShieldOff className="h-4 w-4" />
                                Demote to User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => openLoyaltyDialog(u)}
                            >
                              <Award className="h-4 w-4 text-amber-500" />
                              Adjust Loyalty Points
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="border-t bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Showing {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
            </div>
          )}
        </Card>
      </div>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {roleAction === 'admin' ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Promote to Admin
                </>
              ) : (
                <>
                  <ShieldOff className="h-5 w-5 text-red-500" />
                  Demote to User
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {roleAction === 'admin'
                ? 'This user will gain full admin privileges including access to the admin dashboard.'
                : 'This user will lose all admin privileges and revert to a standard user account.'}
            </DialogDescription>
          </DialogHeader>
          {roleTarget && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User</span>
                <span className="font-medium text-foreground">{roleTarget.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{roleTarget.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Role</span>
                <RoleBadge role={roleTarget.role} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">New Role</span>
                <RoleBadge role={roleAction} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="bg-transparent"
              onClick={() => setRoleDialogOpen(false)}
              disabled={updatingRole}
            >
              Cancel
            </Button>
            {roleAction === 'admin' ? (
              <Button onClick={confirmRoleChange} disabled={updatingRole}>
                {updatingRole ? 'Promoting...' : 'Promote to Admin'}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={confirmRoleChange}
                disabled={updatingRole}
              >
                {updatingRole ? 'Demoting...' : 'Demote to User'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loyalty Points Dialog */}
      <Dialog open={loyaltyDialogOpen} onOpenChange={setLoyaltyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Adjust Loyalty Points
            </DialogTitle>
            <DialogDescription>
              Add or subtract loyalty points for this user.
            </DialogDescription>
          </DialogHeader>
          {loyaltyTarget && (
            <div className="space-y-5">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium text-foreground">{loyaltyTarget.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Points</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                    <Star className="h-3.5 w-3.5 text-amber-500" />
                    {loyaltyTarget.loyaltyPoints.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Operation</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={loyaltyMode === 'add' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoyaltyMode('add')}
                    className={`gap-2 ${loyaltyMode !== 'add' ? 'bg-transparent' : ''}`}
                  >
                    <Plus className="h-4 w-4" />
                    Add Points
                  </Button>
                  <Button
                    variant={loyaltyMode === 'subtract' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoyaltyMode('subtract')}
                    className={`gap-2 ${loyaltyMode !== 'subtract' ? 'bg-transparent' : ''}`}
                  >
                    <Minus className="h-4 w-4" />
                    Subtract Points
                  </Button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="loyalty-amount" className="text-sm font-medium">
                  Amount
                </Label>
                <Input
                  id="loyalty-amount"
                  type="number"
                  min="1"
                  placeholder="Enter points amount"
                  value={loyaltyAmount}
                  onChange={(e) => setLoyaltyAmount(e.target.value)}
                />
              </div>

              {/* Preview */}
              {loyaltyAmount && Number(loyaltyAmount) > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">New Balance</span>
                    <span className="font-bold text-foreground text-lg">
                      {Math.max(
                        0,
                        loyaltyMode === 'add'
                          ? loyaltyTarget.loyaltyPoints + Number(loyaltyAmount)
                          : loyaltyTarget.loyaltyPoints - Number(loyaltyAmount),
                      ).toLocaleString()}{' '}
                      pts
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {loyaltyMode === 'add' ? '+' : '-'}
                    {Number(loyaltyAmount).toLocaleString()} points
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="bg-transparent"
              onClick={() => setLoyaltyDialogOpen(false)}
              disabled={adjustingPoints}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmLoyaltyAdjust}
              disabled={adjustingPoints || !loyaltyAmount || Number(loyaltyAmount) <= 0}
            >
              {adjustingPoints
                ? 'Updating...'
                : loyaltyMode === 'add'
                  ? `Add ${loyaltyAmount || 0} Points`
                  : `Subtract ${loyaltyAmount || 0} Points`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
