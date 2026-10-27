/**
 * Products Service — Client-side Firestore operations.
 * Completely separate from the package/booking/loyalty system.
 * NO loyalty logic here.
 */

import { getFirebaseDb, getFirebaseModules } from '@/lib/firebase/config'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageURL: string          // cover image — always images[0] when images is set
  images?: string[]         // up to 3; missing on products created before multi-image support
  stock: number
  status: 'published' | 'unpublished'
  createdAt?: any
  updatedAt?: any
}

export interface ProductOrder {
  id: string
  userId: string
  productId: string
  productName: string
  productPrice: number
  quantity: number
  totalAmount: number
  depositAmount: number
  depositPercentage: number
  customerName?: string
  customerPhone?: string
  paymentStatus: 'unpaid' | 'pending_payment' | 'pending' | 'paid' | 'failed' | 'cancelled'
  chapaReference?: string
  tx_ref?: string
  paidAmount?: number
  paidAt?: any
  paymentCompleted?: boolean
  createdAt?: any
  updatedAt?: any
}

export interface FavoriteProduct {
  productId: string
  name: string
  imageURL: string
  price: number
  addedAt?: any
}

// ── Products CRUD ──────────────────────────────────────────────────────────────

export async function getPublishedProducts(): Promise<Product[]> {
  const db = await getFirebaseDb()
  const modules = await getFirebaseModules()
  if (!db || !modules.firestore) return []

  const { collection, getDocs, query, where, orderBy } = modules.firestore

  try {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Product))
  } catch (error) {
    console.error('[products.service] Error fetching products:', error)
    return []
  }
}

export async function getProductById(productId: string): Promise<Product | null> {
  const db = await getFirebaseDb()
  const modules = await getFirebaseModules()
  if (!db || !modules.firestore) return null

  const { doc, getDoc } = modules.firestore

  try {
    const snap = await getDoc(doc(db, 'products', productId))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as Product
  } catch (error) {
    console.error('[products.service] Error fetching product:', error)
    return null
  }
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export async function addProductToFavorites(userId: string, product: FavoriteProduct): Promise<void> {
  const db = await getFirebaseDb()
  const modules = await getFirebaseModules()
  if (!db || !modules.firestore) throw new Error('Database not initialized')

  const { doc, setDoc, serverTimestamp } = modules.firestore

  await setDoc(doc(db, 'users', userId, 'productFavorites', product.productId), {
    productId: product.productId,
    name: product.name,
    imageURL: product.imageURL,
    price: product.price,
    addedAt: serverTimestamp(),
  })
}

export async function removeProductFromFavorites(userId: string, productId: string): Promise<void> {
  const db = await getFirebaseDb()
  const modules = await getFirebaseModules()
  if (!db || !modules.firestore) throw new Error('Database not initialized')

  const { doc, deleteDoc } = modules.firestore
  await deleteDoc(doc(db, 'users', userId, 'productFavorites', productId))
}

export async function checkIsProductFavorite(userId: string, productId: string): Promise<boolean> {
  const db = await getFirebaseDb()
  const modules = await getFirebaseModules()
  if (!db || !modules.firestore) return false

  const { doc, getDoc } = modules.firestore
  const snap = await getDoc(doc(db, 'users', userId, 'productFavorites', productId))
  return snap.exists()
}

export async function getUserProductFavorites(userId: string): Promise<FavoriteProduct[]> {
  const db = await getFirebaseDb()
  const modules = await getFirebaseModules()
  if (!db || !modules.firestore) return []

  const { collection, getDocs } = modules.firestore

  try {
    const snap = await getDocs(collection(db, 'users', userId, 'productFavorites'))
    return snap.docs.map((d: any) => d.data() as FavoriteProduct)
  } catch (error) {
    console.error('[products.service] Error fetching product favorites:', error)
    return []
  }
}

// ── Product Orders ─────────────────────────────────────────────────────────────

import { getFirebaseAuth } from '@/lib/firebase/config'

export async function createProductOrder(
  userId: string,
  productId: string,
  productName: string,
  productPrice: number,
  quantity: number = 1
): Promise<string> {
  const auth = await getFirebaseAuth()
  if (!auth?.currentUser) throw new Error('Not authenticated')
  const token = await auth.currentUser.getIdToken()

  const res = await fetch('/api/products/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, productName, productPrice, quantity }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Failed to create order')

  return data.orderId
}


export async function getUserProductOrders(userId: string): Promise<ProductOrder[]> {
  const db = await getFirebaseDb()
  const modules = await getFirebaseModules()
  if (!db || !modules.firestore) return []

  const { collection, getDocs, query, where, orderBy } = modules.firestore

  try {
    const q = query(
      collection(db, 'productOrders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as ProductOrder))
  } catch (error) {
    console.error('[products.service] Error fetching product orders:', error)
    return []
  }
}

// ── Receipts ──────────────────────────────────────────────────────────────────

/**
 * Opens the Chapa receipt for a paid product order in a new tab.
 * The receipt endpoint requires an ID token, which a plain link can't send,
 * so the HTML is fetched here and shown from a blob URL.
 * Call directly from a click handler so the new tab isn't popup-blocked.
 */
export async function openProductReceipt(orderId: string): Promise<void> {
  const win = window.open('', '_blank')
  win?.document.write('<p style="font-family:sans-serif;padding:24px;color:#6b7280">Loading receipt…</p>')

  try {
    const auth = await getFirebaseAuth()
    if (!auth?.currentUser) throw new Error('Please log in again to view this receipt.')
    const token = await auth.currentUser.getIdToken()

    const res = await fetch(`/api/products/orders/${encodeURIComponent(orderId)}/receipt`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error((await res.text()) || 'Could not load the receipt.')

    const url = URL.createObjectURL(new Blob([await res.text()], { type: 'text/html' }))
    if (win) {
      win.location.href = url
    } else {
      // Popup blocked — save the receipt as a file instead
      const a = document.createElement('a')
      a.href = url
      a.download = `omnia-receipt-${orderId}.html`
      a.click()
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    win?.close()
    throw err
  }
}
