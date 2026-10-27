'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart, ShoppingBag, CheckCircle, Clock, XCircle, Download, Loader2, AlertCircle,
} from 'lucide-react'
import { getFirebaseAuth } from '@/lib/firebase/config'
import { openProductReceipt } from '@/lib/services/products.service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface MyProductOrder {
  id: string
  productName: string
  imageURL: string
  productPrice: number
  quantity: number
  totalAmount: number
  depositAmount: number
  depositPercentage: number
  paymentStatus: string
  chapaReference: string | null
  paidAmount: number | null
  paidAt: string | null
  createdAt: number | null
}

// Server returns only the caller's own orders (uid comes from the verified token)
async function fetchMyProductOrders(): Promise<MyProductOrder[]> {
  const auth = await getFirebaseAuth()
  if (!auth?.currentUser) throw new Error('Not authenticated')
  const token = await auth.currentUser.getIdToken()
  const res = await fetch('/api/products/orders', { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Failed to load orders')
  const data = await res.json()
  return (data.orders ?? []) as MyProductOrder[]
}

function formatDate(val: number | string | null): string {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function PaymentNotice({ order, deposit, remaining, receiptLoading, onReceipt }: {
  order: MyProductOrder
  deposit: number
  remaining: number
  receiptLoading: boolean
  onReceipt: () => void
}) {
  const status = (order.paymentStatus ?? '').toLowerCase()

  if (status === 'paid') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 hidden sm:block" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            You've paid the {deposit.toLocaleString()} ETB deposit via Chapa
          </p>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
            Please wait — our team will contact you about the remaining {remaining.toLocaleString()} ETB.
            {order.paidAt && <> Paid {formatDate(order.paidAt)}.</>}
          </p>
        </div>
        <button
          onClick={onReceipt}
          disabled={receiptLoading}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-md px-3 py-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors whitespace-nowrap disabled:opacity-60"
        >
          {receiptLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Receipt
        </button>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Chapa payment failed</p>
          <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-0.5">
            The {deposit.toLocaleString()} ETB deposit wasn't completed, so this reservation was released.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
        <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm font-semibold text-muted-foreground">This order was cancelled</p>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Chapa payment pending</p>
        <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
          Your {deposit.toLocaleString()} ETB deposit hasn't been paid yet.
        </p>
      </div>
    </div>
  )
}

export function MyProductOrders({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<MyProductOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    fetchMyProductOrders()
      .then(setOrders)
      .catch((err) => {
        console.error('[MyProductOrders] load error:', err)
        setLoadError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (userId) load()
  }, [userId, load])

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

  const paidCount = orders.filter((o) => o.paymentStatus === 'paid').length

  return (
    <Card className="border-border/50 mb-8">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              My Product Orders
            </CardTitle>
            <CardDescription className="mt-1">
              {orders.length} order{orders.length !== 1 ? 's' : ''} · {paidCount} paid
            </CardDescription>
          </div>
          <Link href="/products">
            <Button variant="outline" size="sm" className="bg-transparent">Browse Shop</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : loadError ? (
          <div className="text-center py-12">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Couldn't load your orders</p>
            <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={load}>Try again</Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No product orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">Products you reserve will appear here</p>
            <Link href="/products"><Button className="mt-4">Explore Products</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const qty = Number(order.quantity) || 1
              const unitPrice = Number(order.productPrice) || 0
              const total = Number(order.totalAmount) || unitPrice * qty
              const deposit = Number(order.depositAmount) || Math.round(total * 0.1)
              const remaining = Math.max(total - deposit, 0)

              return (
                <div key={order.id} className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-3">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {order.imageURL ? (
                        <img src={order.imageURL} alt={order.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <ShoppingBag className="h-6 w-6 text-primary/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <h3 className="font-semibold text-foreground truncate">{order.productName || 'Product'}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(order.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {qty} × {unitPrice.toLocaleString()} ETB · Total <span className="font-semibold text-foreground">{total.toLocaleString()} ETB</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Deposit <span className="font-semibold text-emerald-600 dark:text-emerald-400">{deposit.toLocaleString()} ETB</span>
                        {' '}· Remaining <span className="font-medium text-foreground">{remaining.toLocaleString()} ETB</span>
                      </p>
                    </div>
                  </div>
                  <PaymentNotice
                    order={order}
                    deposit={deposit}
                    remaining={remaining}
                    receiptLoading={receiptLoadingId === order.id}
                    onReceipt={() => handleReceipt(order.id)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
