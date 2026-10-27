/**
 * /api/admin/product-orders
 *
 * Admin-only endpoint — returns all product orders.
 * Uses Admin SDK (bypasses Firestore security rules).
 * Protected by admin role verification.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin'

async function verifyAdmin(req: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const idToken = authHeader.slice(7)
  try {
    const adminAuth = getAdminAuth()
    const decoded = await adminAuth.verifyIdToken(idToken)
    if (decoded.role === 'admin' || decoded.role === 'ADMIN') return decoded
    const db = getAdminDb()
    const adminDoc = await db.collection('admins').doc(decoded.uid).get()
    if (adminDoc.exists) return decoded
    return null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const caller = await verifyAdmin(req)
  if (!caller) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const db = getAdminDb()
    const snap = await db
      .collection('productOrders')
      .orderBy('createdAt', 'desc')
      .get()

    const orders = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        userId:          data.userId          ?? null,
        productId:       data.productId       ?? null,
        productName:     data.productName     ?? '',
        productPrice:    data.productPrice    ?? data.productPrice ?? 0,
        quantity:        data.quantity        ?? 1,
        totalAmount:     data.totalAmount     ?? 0,
        depositAmount:   data.depositAmount   ?? 0,
        depositPercentage: data.depositPercentage ?? 10,
        customerName:    data.customerName    ?? '',
        customerPhone:   data.customerPhone   ?? '',
        paymentStatus:   data.paymentStatus   ?? 'pending_payment',
        chapaReference:  data.chapaReference  ?? null,
        tx_ref:          data.tx_ref          ?? null,
        paidAmount:      data.paidAmount      ?? null,
        paidAt:          data.paidAt?.toDate ? data.paidAt.toDate().toISOString() : (typeof data.paidAt === 'string' ? data.paidAt : null),
        paymentMethod:   data.paymentMethod   ?? null,
        paymentCompleted: data.paymentCompleted ?? false,
        createdAt:       data.createdAt?.toMillis?.() ?? null,
        updatedAt:       data.updatedAt?.toMillis?.() ?? null,
      }
    })

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('[api/admin/product-orders GET]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
