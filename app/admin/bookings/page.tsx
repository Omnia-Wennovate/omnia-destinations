'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Search,
  RefreshCw,
  MoreHorizontal,
  XCircle,
  DollarSign,
  ArrowLeft,
  Users,
  CreditCard,
  Filter,
  Ban,
  FileText,
  Check,
} from 'lucide-react'
import {
  getBookingsFromFirestore,
  cancelBooking,
  markAsRefunded,
  updateBookingStatus,
  updatePaymentStatus,
  type FirestoreBooking,
} from '@/lib/services/bookings.service'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

// ── Status Badge ────────────────────────────────────────────────
function BookingStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    confirmed: { label: 'Confirmed', classes: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
    completed: { label: 'Completed', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    pending:   { label: 'Pending',   classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  }
  const c = config[status] || { label: status, classes: 'bg-muted text-muted-foreground' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.classes}`}>{c.label}</span>
}

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    paid:     { label: 'Paid',     classes: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
    pending:  { label: 'Pending',  classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    refunded: { label: 'Refunded', classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
    failed:   { label: 'Failed',   classes: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  }
  const c = config[status] || { label: status, classes: 'bg-muted text-muted-foreground' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.classes}`}>{c.label}</span>
}

// ── Stat Card ───────────────────────────────────────────────────
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

// ── Main Page ───────────────────────────────────────────────────
export default function AdminBookingsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [bookings, setBookings] = useState<FirestoreBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<FirestoreBooking | null>(null)
  const [cancelling, setCancelling] = useState(false)

  // Refund dialog
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundTarget, setRefundTarget] = useState<FirestoreBooking | null>(null)
  const [refundNote, setRefundNote] = useState('')
  const [refunding, setRefunding] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  async function fetchBookings() {
    try {
      setLoading(true)
      const data = await getBookingsFromFirestore()
      setBookings(data)
    } catch {
      // handled silently
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchBookings()
    setRefreshing(false)
  }

  // ── Cancel logic ──────────────────────────────────────────────
  function openCancelDialog(booking: FirestoreBooking) {
    setCancelTarget(booking)
    setCancelDialogOpen(true)
  }

  async function confirmCancel() {
    if (!cancelTarget) return
    try {
      setCancelling(true)
      await cancelBooking(cancelTarget.id)
      setBookings((prev) =>
        prev.map((b) => b.id === cancelTarget.id ? { ...b, bookingStatus: 'cancelled' as const } : b)
      )
      setCancelDialogOpen(false)
      setCancelTarget(null)
    } catch {
      // silent
    } finally {
      setCancelling(false)
    }
  }

  // ── Refund logic ──────────────────────────────────────────────
  function openRefundDialog(booking: FirestoreBooking) {
    setRefundTarget(booking)
    setRefundNote(booking.refundNote || '')
    setRefundDialogOpen(true)
  }

  async function confirmRefund() {
    if (!refundTarget) return
    try {
      setRefunding(true)
      await markAsRefunded(refundTarget.id, refundNote)
      setBookings((prev) =>
        prev.map((b) =>
          b.id === refundTarget.id
            ? { ...b, paymentStatus: 'refunded' as const, refundNote }
            : b
        )
      )
      setRefundDialogOpen(false)
      setRefundTarget(null)
      setRefundNote('')
    } catch {
      // silent
    } finally {
      setRefunding(false)
    }
  }

  // ── Status update handlers ─────────────────────────────────────
  async function handleUpdateBookingStatus(bookingId: string, newStatus: "confirmed" | "pending" | "cancelled" | "completed") {
    try {
      if (newStatus === 'completed' || newStatus === 'confirmed') {
        console.log('🔥 Calling approve-booking API for:', bookingId, 'with status:', newStatus)
        // Use server-side API for approval — atomic status + loyalty in one round-trip
        const res = await fetch('/api/admin/approve-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, adminId: user?.id || 'admin', targetStatus: newStatus }),
        })
        const data = await res.json()
        console.log('📦 API response:', res.status, data)
        if (!res.ok) {
          throw new Error(data.error || 'Approval failed')
        }
        setBookings((prev) =>
          prev.map((b) => b.id === bookingId ? { ...b, bookingStatus: newStatus as "confirmed" | "completed", paymentStatus: 'paid' as const } : b)
        )
        console.log('✅ Booking approved successfully:', bookingId)
      } else {
        await updateBookingStatus(bookingId, newStatus)
        setBookings((prev) =>
          prev.map((b) => b.id === bookingId ? { ...b, bookingStatus: newStatus } : b)
        )
      }
    } catch (err) {
      console.error('❌ handleUpdateBookingStatus failed:', err)
    }
  }

  async function handleUpdatePaymentStatus(bookingId: string, newStatus: "paid" | "pending" | "failed") {
    try {
      await updatePaymentStatus(bookingId, newStatus)
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, paymentStatus: newStatus } : b)
      )
    } catch {
      // silent
    }
  }

  // ── Filtering ─────────────────────────────────────────────────
  const filtered = bookings.filter((b) => {
    const matchesSearch =
      searchQuery === '' ||
      b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.tourTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || b.bookingStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  // ── Summary stats ─────────────────────────────────────────────
  const totalRevenue = bookings.reduce((s, b) => s + (b.paymentStatus === 'paid' ? (b.amount || b.totalAmount || 0) : 0), 0)
  const confirmedCount = bookings.filter((b) => b.bookingStatus === 'confirmed').length
  const pendingCount = bookings.filter((b) => b.bookingStatus === 'pending').length
  const cancelledCount = bookings.filter((b) => b.bookingStatus === 'cancelled').length

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
          {[...Array(5)].map((_, i) => (
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
                  <Calendar className="h-8 w-8 text-primary" />
                  Bookings
                </h1>
                <p className="text-muted-foreground mt-1">
                  {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
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
          <StatCard title="Revenue (Paid)" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="text-green-600" bgColor="bg-green-50 dark:bg-green-950" />
          <StatCard title="Confirmed" value={confirmedCount} icon={Calendar} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-950" />
          <StatCard title="Pending" value={pendingCount} icon={CreditCard} color="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-950" />
          <StatCard title="Cancelled" value={cancelledCount} icon={XCircle} color="text-red-600" bgColor="bg-red-50 dark:bg-red-950" />
        </div>

        {/* Toolbar */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, tour, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'confirmed', 'pending', 'cancelled', 'completed'] as const).map((s) => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                    className={statusFilter !== s ? 'bg-transparent' : ''}
                  >
                    {s === 'all' ? (
                      <><Filter className="h-3.5 w-3.5 mr-1.5" />All</>
                    ) : (
                      <>{s.charAt(0).toUpperCase() + s.slice(1)}</>
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
                  <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground">Tour</th>
                  <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground">Guests</th>
                  <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground">Room Type</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-muted-foreground">Amount</th>
                  <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground">Payment</th>
                  <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground">Status</th>
                  <th className="text-center py-3.5 px-4 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Calendar className="h-12 w-12 opacity-30" />
                        <p className="text-lg font-medium">No bookings found</p>
                        <p className="text-sm">
                          {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your search or filters.'
                            : 'Bookings will appear here once customers start booking tours.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((booking) => (
                    <tr key={booking.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-medium text-foreground">{booking.userName}</p>
                          <p className="text-xs text-muted-foreground">{booking.userEmail}</p>
                        </div>
                      </td>
                      {/* Tour */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-foreground max-w-[200px] truncate">{booking.tourTitle}</p>
                      </td>
                      {/* Guests */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {booking.guests}
                        </span>
                      </td>
                      {/* Room Type */}
                      <td className="py-3.5 px-4 text-center text-sm">
                        <span className="capitalize font-medium text-foreground">
                          {booking.roomType || 'Single'}
                        </span>
                      </td>
                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-semibold text-foreground">
                        ${booking.amount?.toLocaleString() || booking.totalAmount?.toLocaleString()}
                      </td>
                      {/* Payment */}
                      <td className="py-3.5 px-4 text-center">
                        <PaymentStatusBadge status={booking.paymentStatus} />
                      </td>
                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <BookingStatusBadge status={booking.bookingStatus} />
                      </td>
                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            {/* Booking Status Options */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Booking Status</div>
                            {booking.bookingStatus !== 'confirmed' && (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                                Mark Confirmed
                              </DropdownMenuItem>
                            )}
                            {booking.bookingStatus !== 'completed' && (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                              >
                                <Calendar className="h-4 w-4 text-blue-600" />
                                Mark Completed
                              </DropdownMenuItem>
                            )}
                            {booking.bookingStatus !== 'cancelled' && (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                                onClick={() => openCancelDialog(booking)}
                              >
                                <Ban className="h-4 w-4" />
                                Cancel Booking
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            {/* Payment Status Options */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Payment Status</div>
                            {booking.paymentStatus !== 'paid' && (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => handleUpdatePaymentStatus(booking.id, 'paid')}
                              >
                                <DollarSign className="h-4 w-4 text-green-600" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {booking.paymentStatus !== 'refunded' && (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => openRefundDialog(booking)}
                              >
                                <FileText className="h-4 w-4" />
                                Mark as Refunded
                              </DropdownMenuItem>
                            )}
                            {booking.paymentStatus !== 'failed' && (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                                onClick={() => handleUpdatePaymentStatus(booking.id, 'failed')}
                              >
                                <XCircle className="h-4 w-4" />
                                Mark as Failed
                              </DropdownMenuItem>
                            )}
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
              Showing {filtered.length} of {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            </div>
          )}
        </Card>
      </div>

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {cancelTarget && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User</span>
                <span className="font-medium text-foreground">{cancelTarget.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tour</span>
                <span className="font-medium text-foreground">{cancelTarget.tourTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium text-foreground">${(cancelTarget.amount || cancelTarget.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="bg-transparent" onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
              Keep Booking
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Refunded Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Refunded</DialogTitle>
            <DialogDescription>
              Add a note about this refund. The payment status will be updated to &quot;Refunded&quot;.
            </DialogDescription>
          </DialogHeader>
          {refundTarget && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium text-foreground">{refundTarget.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tour</span>
                  <span className="font-medium text-foreground">{refundTarget.tourTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium text-foreground">${(refundTarget.amount || refundTarget.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <label htmlFor="refund-note" className="block text-sm font-medium text-foreground mb-1.5">
                  Refund Note
                </label>
                <textarea
                  id="refund-note"
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="e.g. Refunded via bank transfer on 2026-02-10"
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="bg-transparent" onClick={() => setRefundDialogOpen(false)} disabled={refunding}>
              Cancel
            </Button>
            <Button onClick={confirmRefund} disabled={refunding || !refundNote.trim()}>
              {refunding ? 'Saving...' : 'Mark as Refunded'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
