/**
 * /api/products/orders
 *
 * GET  → the caller's own product orders (never anyone else's).
 * POST → creates a product order.
 * Security:
 *  1. Requires authenticated user (ID token).
 *  2. Fetches and snapshots the canonical unit price from Firestore — ignores any client-supplied price.
 *  3. Uses an atomic Firestore transaction to check and decrement stock, preventing overselling.
 *  4. NO loyalty coins, NO referral rewards.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

async function verifyAuth(req: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const idToken = authHeader.slice(7)
  try {
    const adminAuth = getAdminAuth()
    return await adminAuth.verifyIdToken(idToken)
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const caller = await verifyAuth(req)
  if (!caller) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const db = getAdminDb()
    // Scoped to the verified uid from the token — the client cannot ask for another user's orders
    const snap = await db.collection('productOrders').where('userId', '==', caller.uid).get()

    // Attach current product images (orders don't store them)
    const productIds = [...new Set(snap.docs.map((d) => d.get('productId')).filter((id) => typeof id === 'string' && id))]
    const productSnaps = productIds.length
      ? await db.getAll(...productIds.map((id) => db.collection('products').doc(id)))
      : []
    const imageById = new Map(productSnaps.map((p) => [p.id, (p.get('imageURL') as string) || '']))

    const orders = snap.docs
      .map((d) => {
        const data = d.data()
        return {
          id:                d.id,
          productId:         data.productId ?? null,
          productName:       data.productName ?? '',
          imageURL:          imageById.get(data.productId) ?? '',
          productPrice:      data.productPrice ?? 0,
          quantity:          data.quantity ?? 1,
          totalAmount:       data.totalAmount ?? 0,
          depositAmount:     data.depositAmount ?? 0,
          depositPercentage: data.depositPercentage ?? 10,
          paymentStatus:     data.paymentStatus ?? 'pending_payment',
          chapaReference:    data.chapaReference ?? null,
          paidAmount:        data.paidAmount ?? null,
          paidAt:            typeof data.paidAt === 'string' ? data.paidAt : data.paidAt?.toDate?.().toISOString() ?? null,
          createdAt:         data.createdAt?.toMillis?.() ?? null,
        }
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('[api/products/orders GET]', error?.message ?? error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const caller = await verifyAuth(req)
  if (!caller) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { productId, productName, quantity, customerName, customerPhone } = body

    // ── Input validation ────────────────────────────────────────────────────
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ message: 'Invalid productId' }, { status: 400 })
    }
    const qty = parseInt(String(quantity), 10)
    if (isNaN(qty) || qty < 1) {
      return NextResponse.json({ message: 'Quantity must be a positive integer' }, { status: 400 })
    }
    if (!customerName?.trim()) {
      return NextResponse.json({ message: 'Customer name is required' }, { status: 400 })
    }
    const phoneClean = String(customerPhone ?? '').replace(/\s/g, '')
    if (!phoneClean || !/^\+?[0-9]{7,15}$/.test(phoneClean)) {
      return NextResponse.json({ message: 'Valid customer phone number is required' }, { status: 400 })
    }

    const db = getAdminDb()
    const productRef = db.collection('products').doc(productId)

    let orderId: string

    // ── Atomic transaction: verify stock + create order ──────────────────────
    await db.runTransaction(async (tx) => {
      const productSnap = await tx.get(productRef)
      if (!productSnap.exists) {
        throw Object.assign(new Error('Product not found'), { code: 404 })
      }

      const productData = productSnap.data() as Record<string, any>

      if (productData.status !== 'published') {
        throw Object.assign(new Error('Product is not available'), { code: 400 })
      }

      const currentStock = Number(productData.stock ?? 0)
      if (currentStock < qty) {
        throw Object.assign(new Error(`Only ${currentStock} item${currentStock !== 1 ? 's' : ''} available in stock`), { code: 400 })
      }

      // Snapshot the canonical server-side price — NEVER trust client
      const unitPrice = Number(productData.price ?? 0)
      if (unitPrice <= 0) {
        throw Object.assign(new Error('Product price is invalid'), { code: 500 })
      }

      const DEPOSIT_PERCENTAGE = 10
      const totalAmount = unitPrice * qty
      const depositAmount = Math.round((totalAmount * DEPOSIT_PERCENTAGE) / 100)

      // Decrement stock atomically
      tx.update(productRef, {
        stock: currentStock - qty,
        updatedAt: FieldValue.serverTimestamp(),
      })

      // Create the order document
      const orderRef = db.collection('productOrders').doc()
      orderId = orderRef.id

      tx.set(orderRef, {
        userId: caller.uid,
        productId,
        productName: String(productName ?? productData.name ?? '').trim(),
        productPrice: unitPrice,          // server-verified price snapshot
        quantity: qty,
        totalAmount,
        depositAmount,
        depositPercentage: DEPOSIT_PERCENTAGE,
        customerName: String(customerName).trim(),
        customerPhone: phoneClean,
        paymentStatus: 'pending_payment',
        paymentCompleted: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    })

    return NextResponse.json({ orderId: orderId! }, { status: 200 })
  } catch (error: any) {
    const statusCode = error?.code === 404 ? 404 : error?.code === 400 ? 400 : 500
    console.error('[api/products/orders POST]', error?.message ?? error)
    return NextResponse.json({ message: error?.message || 'Server error' }, { status: statusCode })
  }
}
