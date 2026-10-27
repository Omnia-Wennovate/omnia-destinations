'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Package, Loader2, ShoppingBag,
  CheckCircle, XCircle, Clock, AlertTriangle, HelpCircle, Download,
} from 'lucide-react'
import { getFirebaseAuth } from '@/lib/firebase/config'
import { openProductReceipt } from '@/lib/services/products.service'
import { toast } from '@/hooks/use-toast'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProductOrderAdmin {
  id: string
  userId: string | null
  productId: string | null
  productName: string
  productPrice: number
  quantity: number
  totalAmount: number
  depositAmount: number
  depositPercentage: number
  customerName: string
  customerPhone: string
  paymentStatus: string
  chapaReference: string | null
  tx_ref: string | null
  paidAmount: number | null
  paidAt: string | null
  paymentMethod: string | null
  paymentCompleted: boolean
  createdAt: number | null
  updatedAt: number | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function safeStr(val: unknown, fallback = '—'): string {
  if (val == null || val === '') return fallback
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  return fallback
}

function safeNum(val: unknown, fallback = 0): number {
  const n = Number(val)
  return isNaN(n) ? fallback : n
}

function formatDate(ts: number | null | undefined): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatPaidAt(val: string | null | undefined): string {
  if (!val) return '—'
  try {
    return new Date(val).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return String(val)
  }
}

// ── Payment Status Badge ───────────────────────────────────────────────────────

type PaymentStatus = 'paid' | 'pending_payment' | 'unpaid' | 'failed' | 'cancelled' | string

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const normalized = (status ?? 'pending_payment').toLowerCase()

  if (normalized === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
        <CheckCircle className="h-3.5 w-3.5" />Paid
      </span>
    )
  }
  if (normalized === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
        <XCircle className="h-3.5 w-3.5" />Failed
      </span>
    )
  }
  if (normalized === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
        <XCircle className="h-3.5 w-3.5" />Cancelled
      </span>
    )
  }
  if (normalized === 'pending_payment' || normalized === 'unpaid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
        <Clock className="h-3.5 w-3.5" />Pending Payment
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
      <HelpCircle className="h-3.5 w-3.5" />Verification Required
    </span>
  )
}

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchProductOrders(): Promise<ProductOrderAdmin[]> {
  try {
    const auth = await getFirebaseAuth()
    if (!auth?.currentUser) return []
    const token = await auth.currentUser.getIdToken()
    const res = await fetch('/api/admin/product-orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      console.error('[admin/product-orders] API error:', res.status)
      return []
    }
    const data = await res.json()
    return (data.orders ?? []) as ProductOrderAdmin[]
  } catch (err) {
    console.error('[admin/product-orders] fetch error:', err)
    return []
  }
}

// ── Filter options ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminProductOrdersPage() {
  const [orders, setOrders] = useState<ProductOrderAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null)

  const handleReceipt = async (orderId: string) => {
    setReceiptLoadingId(orderId)
    try {
      await openProductReceipt(orderId)
    } catch (err: any) {
      toast({ title: 'Could not open receipt', description: err?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setReceiptLoadingId(null)
    }
  }

  useEffect(() => {
    fetchProductOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  const filtered = statusFilter
    ? orders.filter(o => {
        const s = (o.paymentStatus ?? '').toLowerCase()
        if (statusFilter === 'pending_payment') return s === 'pending_payment' || s === 'unpaid'
        return s === statusFilter
      })
    : orders

  const paidOrders = orders.filter(o => o.paymentStatus === 'paid')
  const totalDepositsCollected = paidOrders.reduce((sum, o) => sum + safeNum(o.depositAmount), 0)

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/products"
          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Product Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {orders.length} order{orders.length !== 1 ? 's' : ''} · {paidOrders.length} paid
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Deposits Collected</p>
          <p className="text-xl font-black text-primary">{totalDepositsCollected.toLocaleString()} ETB</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="text-xs text-primary hover:underline"
          >
            Clear filter
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          Showing {filtered.length} of {orders.length}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-semibold text-foreground">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1">Product orders will appear here after customers make reservations.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-semibold text-foreground">No orders match this filter</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit Price</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deposit</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Remaining</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Chapa Ref</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paid At</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const unitPrice = safeNum(order.productPrice)
                  const qty = safeNum(order.quantity, 1)
                  const total = safeNum(order.totalAmount, unitPrice * qty)
                  const deposit = safeNum(order.depositAmount, Math.round(total * 0.1))
                  const remaining = total - deposit
                  const isPaid = order.paymentStatus === 'paid'

                  return (
                    <tr key={order.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      {/* Order ID */}
                      <td className="px-4 py-3">
                        <code className="text-xs text-muted-foreground font-mono block">{order.id.slice(0, 12)}…</code>
                        {order.tx_ref && (
                          <code className="text-[10px] text-muted-foreground/60 font-mono block mt-0.5">
                            tx: {safeStr(order.tx_ref).slice(0, 14)}…
                          </code>
                        )}
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{safeStr(order.productName, '—')}</p>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium">{safeStr(order.customerName, '—')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{safeStr(order.customerPhone, '—')}</p>
                      </td>

                      {/* Qty */}
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-foreground">{qty}</span>
                      </td>

                      {/* Unit Price */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-foreground">{unitPrice.toLocaleString()} ETB</span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-foreground">{total.toLocaleString()} ETB</span>
                      </td>

                      {/* Deposit */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{deposit.toLocaleString()} ETB</span>
                        <p className="text-[10px] text-muted-foreground">{safeNum(order.depositPercentage, 10)}%</p>
                      </td>

                      {/* Remaining */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-foreground">{remaining.toLocaleString()} ETB</span>
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-3 text-center">
                        <PaymentBadge status={order.paymentStatus} />
                      </td>

                      {/* Chapa Ref */}
                      <td className="px-4 py-3">
                        {order.chapaReference ? (
                          <code className="text-xs text-muted-foreground font-mono">
                            {safeStr(order.chapaReference).slice(0, 16)}…
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Order Date */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(order.createdAt)}</span>
                      </td>

                      {/* Paid At */}
                      <td className="px-4 py-3">
                        {isPaid ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatPaidAt(order.paidAt)}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Receipt */}
                      <td className="px-4 py-3 text-center">
                        {isPaid ? (
                          <button
                            onClick={() => handleReceipt(order.id)}
                            disabled={receiptLoadingId === order.id}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-md px-3 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors whitespace-nowrap disabled:opacity-60"
                          >
                            {receiptLoadingId === order.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Download className="h-3 w-3" />}
                            Receipt
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
