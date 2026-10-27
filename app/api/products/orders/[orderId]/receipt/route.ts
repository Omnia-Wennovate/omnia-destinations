/**
 * /api/products/orders/[orderId]/receipt
 *
 * Returns a printable HTML receipt for a PAID product order's Chapa deposit.
 *
 * Security:
 *  1. Requires a Firebase ID token (Authorization: Bearer).
 *  2. Only the order's owner or an admin may read it.
 *  3. Only paid orders have a receipt.
 *  4. All stored values are HTML-escaped before rendering.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin'

function esc(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function etb(val: unknown): string {
  const n = Number(val)
  return `${(isNaN(n) ? 0 : n).toLocaleString('en-US')} ETB`
}

function formatDate(val: unknown): string {
  const date = typeof (val as any)?.toDate === 'function' ? (val as any).toDate() : new Date(String(val ?? ''))
  if (isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Addis_Ababa' })
}

async function isAdmin(uid: string, role: unknown): Promise<boolean> {
  if (role === 'admin' || role === 'ADMIN') return true
  const adminDoc = await getAdminDb().collection('admins').doc(uid).get()
  return adminDoc.exists
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  if (!orderId) return new NextResponse('Missing order ID', { status: 400 })

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return new NextResponse('Unauthorized', { status: 401 })

  let caller: { uid: string; role?: unknown }
  try {
    caller = await getAdminAuth().verifyIdToken(authHeader.slice(7))
  } catch {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const snap = await getAdminDb().collection('productOrders').doc(orderId).get()
    if (!snap.exists) return new NextResponse('Order not found', { status: 404 })
    const order = snap.data() ?? {}

    // Same 404 for "not yours" so order IDs can't be probed
    if (order.userId !== caller.uid && !(await isAdmin(caller.uid, caller.role))) {
      return new NextResponse('Order not found', { status: 404 })
    }

    if (order.paymentStatus !== 'paid') {
      return new NextResponse('A receipt is available once the Chapa payment is complete.', { status: 409 })
    }

    const qty = Number(order.quantity ?? 1)
    const unitPrice = Number(order.productPrice ?? 0)
    const total = Number(order.totalAmount ?? unitPrice * qty)
    const deposit = Number(order.depositAmount ?? Math.round(total * 0.1))
    const paid = Number(order.paidAmount ?? deposit)
    const remaining = Math.max(total - paid, 0)
    const chapaRef = order.chapaReference || 'N/A'
    const txRef = order.tx_ref || 'N/A'

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Omnia Shop Receipt — ${esc(chapaRef)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; color: #1f2937; display: flex; justify-content: center; padding: 40px 16px; min-height: 100vh; }
    .receipt { background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 520px; width: 100%; overflow: hidden; height: fit-content; }
    .receipt-header { background: linear-gradient(135deg, #c8a85c 0%, #b8963e 100%); color: #fff; padding: 32px 28px 24px; text-align: center; }
    .receipt-header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .receipt-header p { font-size: 13px; opacity: 0.85; }
    .status-badge { display: inline-block; margin-top: 12px; padding: 6px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: #f0fdf4; color: #16a34a; }
    .receipt-body { padding: 28px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin: 20px 0 12px; }
    .section-title:first-child { margin-top: 0; }
    .row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .row:last-child { border-bottom: none; }
    .row .label { font-size: 13px; color: #6b7280; }
    .row .value { font-size: 13px; font-weight: 600; color: #1f2937; text-align: right; max-width: 60%; word-break: break-all; }
    .amount-row { margin-top: 16px; padding: 16px 0; border-top: 2px solid #f3f4f6; }
    .amount-row .label { font-size: 15px; font-weight: 600; color: #1f2937; }
    .amount-row .value { font-size: 20px; font-weight: 800; color: #c8a85c; }
    .receipt-footer { padding: 20px 28px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; }
    .receipt-footer p { font-size: 11px; color: #9ca3af; }
    .print-btn { display: inline-block; margin-top: 12px; padding: 10px 28px; background: #c8a85c; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .print-btn:hover { background: #b8963e; }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { box-shadow: none; border-radius: 0; max-width: 100%; }
      .print-btn { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="receipt-header">
      <h1>Omnia Destinations</h1>
      <p>Shop Payment Receipt</p>
      <div class="status-badge">✓ Paid via Chapa</div>
    </div>
    <div class="receipt-body">
      <div class="section-title">Transaction Details</div>
      <div class="row"><span class="label">Chapa Reference</span><span class="value">${esc(chapaRef)}</span></div>
      <div class="row"><span class="label">Transaction Ref</span><span class="value">${esc(txRef)}</span></div>
      <div class="row"><span class="label">Date &amp; Time</span><span class="value">${esc(formatDate(order.paidAt))}</span></div>
      <div class="row"><span class="label">Payment Method</span><span class="value">Chapa</span></div>

      <div class="section-title">Order Details</div>
      <div class="row"><span class="label">Product</span><span class="value">${esc(order.productName || 'Product')}</span></div>
      <div class="row"><span class="label">Quantity</span><span class="value">${esc(qty)}</span></div>
      <div class="row"><span class="label">Unit Price</span><span class="value">${esc(etb(unitPrice))}</span></div>
      <div class="row"><span class="label">Customer</span><span class="value">${esc(order.customerName || 'N/A')}</span></div>
      <div class="row"><span class="label">Phone</span><span class="value">${esc(order.customerPhone || 'N/A')}</span></div>
      <div class="row"><span class="label">Order Date</span><span class="value">${esc(formatDate(order.createdAt))}</span></div>

      <div class="section-title">Payment Summary</div>
      <div class="row"><span class="label">Order Total</span><span class="value">${esc(etb(total))}</span></div>
      <div class="row"><span class="label">Deposit (${esc(order.depositPercentage ?? 10)}%)</span><span class="value">${esc(etb(deposit))}</span></div>
      <div class="row"><span class="label">Remaining Balance</span><span class="value">${esc(etb(remaining))}</span></div>
      <div class="row amount-row"><span class="label">Amount Paid via Chapa</span><span class="value">${esc(etb(paid))}</span></div>
    </div>
    <div class="receipt-footer">
      <p>Order ID: ${esc(orderId)}</p>
      <p style="margin-top: 4px;">This receipt was generated by Omnia Destinations</p>
      <button class="print-btn" onclick="window.print()">🖨️ Print / Download PDF</button>
    </div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('[api/products/orders/[orderId]/receipt]', error)
    return new NextResponse('Failed to load receipt', { status: 500 })
  }
}
