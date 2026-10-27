/**
 * /api/product-payment/initialize
 *
 * Initialises a Chapa payment session for a product order.
 * SEPARATE from /api/chapa/initialize which handles package bookings.
 *
 * Security:
 *  1. IGNORES any amount from the client.
 *  2. Reads depositAmount from the productOrder document in Firestore.
 *  3. The depositAmount is server-calculated at order creation (10% of product price).
 *  4. NO loyalty coins are awarded — products are loyalty-system-agnostic.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // `amount` from body is intentionally IGNORED — fetched from Firestore
    const { email, first_name, last_name, orderId } = body as Record<string, string>

    // ── Input validation ────────────────────────────────────────────────────────
    if (!email || !first_name || !orderId) {
      return NextResponse.json(
        { message: 'Missing required fields: email, first_name, orderId' },
        { status: 400 }
      )
    }

    if (typeof orderId !== 'string' || !/^[a-zA-Z0-9_-]{10,128}$/.test(orderId)) {
      return NextResponse.json({ message: 'Invalid orderId format' }, { status: 400 })
    }

    const chapaSecretKey = process.env.CHAPA_SECRET_KEY
    if (!chapaSecretKey) {
      console.error('[product-payment/initialize] CRITICAL: CHAPA_SECRET_KEY is not set')
      return NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 })
    }

    // ── Fetch product order from Firestore ─────────────────────────────────────
    const db = getAdminDb()
    const orderSnap = await db.collection('productOrders').doc(orderId).get()

    if (!orderSnap.exists) {
      return NextResponse.json({ message: 'Product order not found' }, { status: 404 })
    }

    const orderData = orderSnap.data() as Record<string, any>

    // Guard: don't re-initialise a paid order
    if (orderData.paymentStatus === 'paid') {
      return NextResponse.json({ message: 'Order already paid' }, { status: 409 })
    }

    // ── Server-side deposit amount (already computed at order creation) ─────────
    const trustedDepositAmount: number = Number(orderData.depositAmount ?? 0)
    if (trustedDepositAmount <= 0) {
      return NextResponse.json({ message: 'Invalid order deposit amount' }, { status: 400 })
    }

    // Build a unique tx_ref for this product order payment
    const tx_ref = `prod_${orderId}`

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin

    const chapaPayload = {
      amount: trustedDepositAmount.toString(),
      currency: 'ETB',
      email,
      first_name,
      last_name: last_name || '',
      tx_ref,
      callback_url: `${appUrl}/api/product-payment/verify?tx_ref=${encodeURIComponent(tx_ref)}`,
      return_url: `${appUrl}/api/product-payment/verify?tx_ref=${encodeURIComponent(tx_ref)}`,
      customization: {
        title: 'Omnia Shop',
        description: `Product deposit - ${(orderData.productName || 'Product').replace(/[^a-zA-Z0-9\-_ .]/g, ' ').trim().slice(0, 60)}`,
      },
    }

    const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chapaPayload),
      signal: AbortSignal.timeout(15_000),
    })

    const data = await response.json()

    if (data.status === 'success') {
      // Store tx_ref on the order so the verify handler can look it up
      await db.collection('productOrders').doc(orderId).update({
        tx_ref,
        paymentStatus: 'unpaid',
        paymentInitiatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      return NextResponse.json({
        message: 'Product payment initialized',
        checkoutUrl: data.data.checkout_url,
      })
    } else {
      const chapaErrMsg = typeof data.message === 'string'
        ? data.message
        : JSON.stringify(data.message ?? data.errors ?? 'Failed to initialize payment')
      console.error('[product-payment/initialize] Chapa error:', chapaErrMsg)
      return NextResponse.json(
        { message: chapaErrMsg },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('[product-payment/initialize] Error:', error?.message ?? error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
