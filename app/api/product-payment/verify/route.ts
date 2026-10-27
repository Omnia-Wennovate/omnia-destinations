/**
 * /api/product-payment/verify
 *
 * Chapa callback/return handler for PRODUCT orders.
 * SEPARATE from /api/verify-payment which handles package bookings.
 *
 * Security:
 *  1. Verifies the transaction with Chapa server-to-server.
 *  2. Looks up the productOrder by tx_ref in Firestore.
 *  3. Uses an atomic Firestore transaction to prevent duplicate processing.
 *  4. NO loyalty coins, NO referral rewards, NO loyalty system interaction.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

interface ProductOrderDoc {
  id: string
  userId: string
  productId: string
  productName: string
  depositAmount: number
  paymentStatus: string
  tx_ref?: string
  [key: string]: unknown
}

async function getOrderByTxRef(tx_ref: string): Promise<ProductOrderDoc | null> {
  const db = getAdminDb()
  const snap = await db
    .collection('productOrders')
    .where('tx_ref', '==', tx_ref)
    .limit(1)
    .get()

  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...docSnap.data() } as ProductOrderDoc
}

export async function GET(req: NextRequest) {
  const tx_ref = req.nextUrl.searchParams.get('tx_ref')

  if (!tx_ref || typeof tx_ref !== 'string' || tx_ref.trim() === '') {
    return NextResponse.redirect(
      new URL('/dashboard?product_payment=error&reason=missing_ref', req.url)
    )
  }

  const chapaSecretKey = process.env.CHAPA_SECRET_KEY
  if (!chapaSecretKey) {
    console.error('[product-payment/verify] CRITICAL: CHAPA_SECRET_KEY is not set')
    return NextResponse.redirect(new URL('/dashboard?product_payment=error', req.url))
  }

  try {
    // ── Step 1: Verify with Chapa server-to-server ────────────────────────────
    const chapaRes = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(tx_ref)}`,
      {
        headers: { Authorization: `Bearer ${chapaSecretKey}` },
        signal: AbortSignal.timeout(10_000),
      }
    )

    if (!chapaRes.ok) {
      console.error('[product-payment/verify] Chapa HTTP error:', chapaRes.status)
      return NextResponse.redirect(new URL('/dashboard?product_payment=error', req.url))
    }

    const chapaData = await chapaRes.json()
    const chapaSuccess =
      chapaData?.status === 'success' && chapaData?.data?.status === 'success'

    if (!chapaSuccess) {
      try {
        const order = await getOrderByTxRef(tx_ref)
        if (order && order.productId && order.paymentStatus !== 'failed' && order.paymentStatus !== 'paid') {
          const db = getAdminDb()
          const orderRef = db.collection('productOrders').doc(order.id)
          const productRef = db.collection('products').doc(order.productId)
          await db.runTransaction(async (tx) => {
            const oSnap = await tx.get(orderRef)
            if (!oSnap.exists) return
            const oData = oSnap.data() || {}
            if (oData.paymentStatus === 'failed' || oData.paymentStatus === 'paid') return
            tx.update(orderRef, {
              paymentStatus: 'failed',
              updatedAt: FieldValue.serverTimestamp(),
            })
            const qty = Number(oData.quantity ?? 1)
            tx.update(productRef, {
              stock: FieldValue.increment(qty),
              updatedAt: FieldValue.serverTimestamp(),
            })
          })
          console.log(`[product-payment/verify] Payment failed for ${tx_ref}, stock restored.`)
        }
      } catch (restoreErr) {
        console.error('[product-payment/verify] Error restoring stock on failed payment:', restoreErr)
      }
      return NextResponse.redirect(new URL('/dashboard?product_payment=failed', req.url))
    }

    const chapaAmount = Number(chapaData?.data?.amount ?? 0)

    // ── Step 2: Fetch the productOrder by tx_ref ──────────────────────────────
    const order = await getOrderByTxRef(tx_ref)
    if (!order) {
      console.error('[product-payment/verify] Order not found for tx_ref:', tx_ref)
      return NextResponse.redirect(
        new URL('/dashboard?product_payment=error&reason=order_not_found', req.url)
      )
    }

    // ── Step 3: Amount integrity check ────────────────────────────────────────
    const expectedDeposit = Number(order.depositAmount ?? 0)
    if (expectedDeposit > 0 && Math.abs(chapaAmount - expectedDeposit) > 1) {
      console.error(
        '[product-payment/verify] Amount mismatch — chapa:',
        chapaAmount,
        'expected:',
        expectedDeposit,
        'order:',
        order.id
      )
      return NextResponse.redirect(
        new URL('/dashboard?product_payment=error&reason=amount_mismatch', req.url)
      )
    }

    const chapaReference = chapaData?.data?.reference ?? chapaData?.data?.tx_ref ?? tx_ref

    // ── Step 4: Atomic update — idempotent ────────────────────────────────────
    const db = getAdminDb()
    const orderRef = db.collection('productOrders').doc(order.id)

    let alreadyProcessed = false
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef)
      if (!snap.exists) throw new Error('Order disappeared during transaction')

      const data = snap.data() ?? {}
      if (data.paymentCompleted === true) {
        alreadyProcessed = true
        return
      }

      // Mark as paid — NO loyalty system calls
      tx.update(orderRef, {
        paymentStatus: 'paid',
        chapaReference,
        paidAmount: chapaAmount,
        paymentMethod: 'chapa',
        paidAt: new Date().toISOString(),
        paymentCompleted: true,
        updatedAt: FieldValue.serverTimestamp(),
      })

      console.log('✅ [product-payment/verify] Product order paid — orderId:', order.id, 'tx_ref:', tx_ref)
    })

    return NextResponse.redirect(new URL('/dashboard?product_payment=success', req.url))
  } catch (error) {
    console.error('[product-payment/verify] Unexpected error:', error)
    return NextResponse.redirect(new URL('/dashboard?product_payment=error', req.url))
  }
}
