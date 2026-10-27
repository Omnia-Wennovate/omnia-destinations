'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Heart, ShoppingBag, Search, Package, Loader2,
  ShoppingCart, X, AlertCircle, Phone, User, Hash, CheckCircle2,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import {
  type Product,
  addProductToFavorites, removeProductFromFavorites, checkIsProductFavorite,
} from '@/lib/services/products.service'
import { getFirebaseAuth } from '@/lib/firebase/config'
import { Button } from '@/components/ui/button'
import { NewBadge, ViewCountBadge } from '@/components/listing-badges'
import Link from 'next/link'

function safeStr(val, fallback) {
  if (fallback === undefined) fallback = '';
  if (val == null) return fallback
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  return fallback
}

// Converts any value (including Chapa object errors) to a safe display string
function safeError(val, fallback) {
  if (fallback === undefined) fallback = 'An unexpected error occurred.'
  if (!val) return fallback
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    // Chapa may return {customization: {description: "..."}} or similar
    try { return JSON.stringify(val) } catch { return fallback }
  }
  return String(val)
}

// Products have up to 3 images; older products only have imageURL.
function getProductImages(product) {
  const list = Array.isArray(product?.images)
    ? product.images.filter(u => typeof u === 'string' && u)
    : []
  if (list.length) return list.slice(0, 3)
  const cover = safeStr(product?.imageURL)
  return cover ? [cover] : []
}

function ProductImageGallery({ images, alt, imgClassName = '' }) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const count = images.length

  const go = (delta) => setIndex(i => (i + delta + count) % count)
  const onArrow = (delta) => (e) => { e.stopPropagation(); go(delta) }

  const arrowClass = 'absolute top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 text-gray-800 shadow-md flex items-center justify-center transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100'

  return (
    <div
      className="group relative w-full h-full overflow-hidden"
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (touchStartX.current == null || count < 2) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        touchStartX.current = null
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
      }}
    >
      <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
        {images.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={count > 1 ? `${alt} (${i + 1} of ${count})` : alt}
            loading={i === 0 ? undefined : 'lazy'}
            className={`w-full h-full flex-shrink-0 object-cover ${imgClassName}`}
          />
        ))}
      </div>
      {count > 1 && (
        <>
          <button type="button" onClick={onArrow(-1)} aria-label="Previous image" className={`${arrowClass} left-2`}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={onArrow(1)} aria-label="Next image" className={`${arrowClass} right-2`}>
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={e => { e.stopPropagation(); setIndex(i) }}
                aria-label={`Show image ${i + 1}`}
                className={`h-1.5 rounded-full shadow transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ProductCard({ product, userId, onReserve }) {
  const [isFav, setIsFav] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [favMsg, setFavMsg] = useState<string | null>(null)

  // Check if already favorited on mount
  useEffect(() => {
    if (!userId) return
    checkIsProductFavorite(userId, product.id)
      .then(setIsFav)
      .catch(() => {})
  }, [userId, product.id])

  const toggleFav = async (e) => {
    e.stopPropagation()
    if (!userId) {
      window.location.href = '/login?redirect=/products'
      return
    }
    // Optimistic update
    const wasAlreadyFav = isFav
    setIsFav(!wasAlreadyFav)
    setFavLoading(true)
    setFavMsg(null)
    try {
      if (wasAlreadyFav) {
        await removeProductFromFavorites(userId, product.id)
        setFavMsg('Removed from favorites')
      } else {
        await addProductToFavorites(userId, {
          productId: product.id,
          name: safeStr(product.name, 'Product'),
          imageURL: safeStr(product.imageURL),
          price: Number(product.price) || 0,
        })
        setFavMsg('Added to favorites!')
      }
    } catch (err: any) {
      console.error('Favorite toggle error:', err)
      // Revert optimistic update on error
      setIsFav(wasAlreadyFav)
      setFavMsg('Error: ' + (err?.message || 'Please try again'))
    } finally {
      setFavLoading(false)
      setTimeout(() => setFavMsg(null), 2500)
    }
  }

  const isOutOfStock = Number(product.stock) <= 0
  const name = safeStr(product.name, 'Product')
  const description = safeStr(product.description)
  const price = Number(product.price) || 0
  const images = getProductImages(product)

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {images.length > 0 ? (
          <ProductImageGallery images={images} alt={name} imgClassName="transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Package className="h-16 w-16 text-primary/30" />
          </div>
        )}
        <ViewCountBadge type="product" id={product.id} className="absolute bottom-3 left-3" />
        <div className="absolute top-3 left-3 flex gap-2">
          <NewBadge createdAt={product.createdAt} />
          {isOutOfStock && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white">Out of Stock</span>}
          {!isOutOfStock && Number(product.stock) <= 5 && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">Only {product.stock} left</span>}
        </div>
        <button onClick={toggleFav} disabled={favLoading} className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-60" aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}>
          {favLoading
            ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            : <Heart className={`h-4 w-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />}
        </button>
        {favMsg && (
          <div className={`absolute bottom-2 left-2 right-2 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-lg z-10 ${favMsg.startsWith('Error') ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
            {favMsg.startsWith('Error') ? <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> : <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />}
            <span>{favMsg}</span>
            {!favMsg.startsWith('Error') && isFav && (
              <a href="/dashboard" className="ml-auto underline font-bold whitespace-nowrap">View →</a>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">{name}</h3>
          {description ? <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{description}</p> : null}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Price</p>
            <p className="text-2xl font-black text-primary">{price.toLocaleString()}<span className="text-sm font-semibold ml-1 text-muted-foreground">ETB</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Deposit</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{Math.round(price * 0.1).toLocaleString()} ETB</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <span className="text-xs text-muted-foreground">{isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}</span>
        </div>
        <Button onClick={() => onReserve(product)} disabled={isOutOfStock} className="w-full gap-2 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" size="lg">
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? 'Unavailable' : 'Reserve Now'}
        </Button>
      </div>
    </div>
  )
}


function ReservationModal({ product, user, onClose }) {
  const router = useRouter()
  const submittingRef = useRef(false)
  const defaultName = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  const [form, setForm] = useState({ fullName: defaultName, phone: user?.phone ?? '', quantity: '1' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!product) return null

  const stock = Number(product.stock) || 0
  const unitPrice = Number(product.price) || 0
  const rawQty = parseInt(form.quantity, 10)
  const qty = isNaN(rawQty) ? 1 : Math.max(1, rawQty)
  const total = unitPrice * qty
  const deposit = Math.round(total * 0.1)
  const remaining = total - deposit
  const images = getProductImages(product)

  function validate() {
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Full name is required.'
    const pc = form.phone.replace(/\s/g, '')
    if (!pc) next.phone = 'Phone number is required.'
    else if (!/^\+?[0-9]{7,15}$/.test(pc)) next.phone = 'Enter a valid phone number (7-15 digits, optional leading +).'
    const q = parseInt(form.quantity, 10)
    if (!form.quantity || isNaN(q) || q < 1) next.quantity = 'Quantity must be at least 1.'
    else if (q > stock) next.quantity = `Only ${stock} item${stock !== 1 ? 's' : ''} in stock.`
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    if (submittingRef.current) return
    submittingRef.current = true
    if (!user) { router.push('/login?redirect=/products'); return }
    setLoading(true)
    setErrors({})
    try {
      const auth = await getFirebaseAuth()
      if (!auth?.currentUser) throw new Error('Not authenticated')
      const token = await auth.currentUser.getIdToken()
      const orderRes = await fetch('/api/products/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, productName: safeStr(product.name, 'Product'), quantity: parseInt(form.quantity, 10), customerName: form.fullName.trim(), customerPhone: form.phone.trim() }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) { setErrors({ general: safeError(orderData.message, 'Failed to create order. Please try again.') }); return }
      const payRes = await fetch('/api/product-payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, first_name: form.fullName.split(' ')[0] || user.firstName, last_name: form.fullName.split(' ').slice(1).join(' ') || user.lastName, orderId: orderData.orderId }),
      })
      const payData = await payRes.json()
      if (payData.checkoutUrl) { window.location.href = payData.checkoutUrl }
      else { setErrors({ general: safeError(payData.message, 'Failed to initialize payment. Please try again.') }) }
    } catch (err) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const fi = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: undefined }))
  }

  const borderFor = (field) => errors[field] ? 'border-red-400' : 'border-border'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border/60 overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} disabled={loading} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors z-10 disabled:opacity-50"><X className="h-4 w-4" /></button>
        {images.length > 0 && (
          <div className="relative h-56 w-full bg-muted">
            <ProductImageGallery images={images} alt={safeStr(product.name, 'Product')} />
          </div>
        )}
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-xl font-black text-foreground">{safeStr(product.name, 'Product')}</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Complete your reservation details below</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-1.5"><User className="h-3.5 w-3.5 text-primary" />Full Name <span className="text-red-500">*</span></label>
              <input id="reservation-name" type="text" value={form.fullName} onChange={fi('fullName')} placeholder="Your full name" disabled={loading} className={`w-full h-10 px-3 rounded-lg border ${borderFor('fullName')} bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-60`} />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-1.5"><Phone className="h-3.5 w-3.5 text-primary" />Phone Number <span className="text-red-500">*</span></label>
              <input id="reservation-phone" type="tel" value={form.phone} onChange={fi('phone')} placeholder="+251 91 234 5678" disabled={loading} className={`w-full h-10 px-3 rounded-lg border ${borderFor('phone')} bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-60`} />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-1.5"><Hash className="h-3.5 w-3.5 text-primary" />Quantity <span className="text-red-500">*</span></label>
              <input id="reservation-quantity" type="number" min={1} max={stock} value={form.quantity} onChange={fi('quantity')} disabled={loading} className={`w-full h-10 px-3 rounded-lg border ${borderFor('quantity')} bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-60`} />
              {errors.quantity ? <p className="text-xs text-red-500 mt-1">{errors.quantity}</p> : <p className="text-xs text-muted-foreground mt-1">{stock} available in stock</p>}
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2.5">
            <p className="text-sm font-semibold text-foreground">Order Summary</p>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Unit Price</span><span className="font-medium text-foreground">{unitPrice.toLocaleString()} ETB</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Quantity</span><span className="font-medium text-foreground">x {qty}</span></div>
            <div className="border-t border-border/40 pt-2 flex justify-between text-sm"><span className="text-muted-foreground">Order Total</span><span className="font-bold text-foreground">{total.toLocaleString()} ETB</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Deposit (10%)</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{deposit.toLocaleString()} ETB</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Remaining</span><span className="font-medium text-foreground">{remaining.toLocaleString()} ETB</span></div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <span className="text-primary flex-shrink-0 mt-0.5 text-sm">i</span>
            <p className="text-xs text-muted-foreground">You will pay <strong className="text-foreground">{deposit.toLocaleString()} ETB</strong> as a deposit now via Chapa. The remaining <strong className="text-foreground">{remaining.toLocaleString()} ETB</strong> will be arranged separately.</p>
          </div>
          {errors.general && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{errors.general}</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl bg-transparent" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button className="flex-1 gap-2 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20" onClick={handleSubmit} disabled={loading}>
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Processing...</>) : (<><ShoppingCart className="h-4 w-4" />Pay {deposit.toLocaleString()} ETB</>)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    const n = safeStr(p.name).toLowerCase()
    const d = safeStr(p.description).toLowerCase()
    const q = search.toLowerCase()
    return n.includes(q) || d.includes(q)
  })

  const handleReserve = (product) => {
    if (!isAuthenticated) { router.push('/login?redirect=/products'); return }
    setSelectedProduct(product)
  }

  return (
    <>
      {selectedProduct && (
        <ReservationModal
          product={selectedProduct}
          user={user ? { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone } : null}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      <main className="min-h-screen bg-background">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background pt-28 pb-16 px-4">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary/8 rounded-full blur-2xl" />
          </div>
          <div className="container mx-auto max-w-6xl relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
              <ShoppingBag className="h-4 w-4" />Omnia Shop
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">Explore Our Products</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Discover exclusive travel merchandise and accessories. Reserve with just a 10% deposit.</p>
          </div>
        </div>
        <div className="sticky top-20 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
          <div className="container mx-auto max-w-6xl px-4 py-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-full border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow" />
              {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>}
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-6xl px-4 py-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/60 bg-card overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-5 space-y-3"><div className="h-5 bg-muted rounded w-3/4" /><div className="h-4 bg-muted rounded w-full" /><div className="h-10 bg-muted rounded-xl mt-4" /></div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-xl font-bold text-foreground">{search ? 'No products found' : 'No products available'}</p>
              <p className="text-muted-foreground mt-2">{search ? `No results for "${search}"` : 'Check back soon for new products.'}</p>
              {search && <Button variant="outline" className="mt-6 bg-transparent" onClick={() => setSearch('')}>Clear search</Button>}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">Showing <strong className="text-foreground">{filtered.length}</strong> product{filtered.length !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map(product => <ProductCard key={product.id} product={product} userId={user?.id ?? null} onReserve={handleReserve} />)}
              </div>
            </>
          )}
          {!isAuthenticated && !loading && filtered.length > 0 && (
            <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
              <ShoppingBag className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Ready to reserve?</h3>
              <p className="text-muted-foreground mb-6">Sign in or create an account to purchase products and save your favorites.</p>
              <div className="flex justify-center gap-4">
                <Link href="/login"><Button className="rounded-full px-8 bg-primary text-primary-foreground">Login</Button></Link>
                <Link href="/signup"><Button variant="outline" className="rounded-full px-8 bg-transparent border-primary text-primary">Sign Up</Button></Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}