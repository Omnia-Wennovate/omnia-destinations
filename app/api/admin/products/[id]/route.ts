/**
 * /api/admin/products/[id]
 *
 * GET    → fetch one product (any status)
 * PATCH  → update product fields
 * DELETE → delete product
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

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

// Keeps at most 3 non-empty image URLs.
function sanitizeImages(images: unknown[]): string[] {
  return images
    .filter((u): u is string => typeof u === 'string' && u.trim() !== '')
    .map((u) => u.trim())
    .slice(0, 3)
}

export async function GET(req: NextRequest, context: any) {
  const caller = await verifyAdmin(req)
  if (!caller) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ message: 'Product ID required' }, { status: 400 })

  try {
    const snap = await getAdminDb().collection('products').doc(id).get()
    if (!snap.exists) return NextResponse.json({ message: 'Product not found' }, { status: 404 })
    return NextResponse.json({ product: { id: snap.id, ...snap.data() } })
  } catch (error: any) {
    console.error('[api/admin/products/[id] GET]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: any) {
  const caller = await verifyAdmin(req)
  if (!caller) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ message: 'Product ID required' }, { status: 400 })

  try {
    const body = await req.json()
    const { name, description, price, stock, status, imageURL, images } = body

    const db = getAdminDb()
    const productRef = db.collection('products').doc(id)
    const snap = await productRef.get()
    if (!snap.exists) return NextResponse.json({ message: 'Product not found' }, { status: 404 })

    const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() }
    if (name !== undefined)        updates.name        = String(name).trim()
    if (description !== undefined) updates.description = String(description).trim()
    if (price !== undefined)       updates.price       = Number(price)
    if (stock !== undefined)       updates.stock       = Number(stock)
    if (status !== undefined)      updates.status      = status === 'published' ? 'published' : 'unpublished'
    if (Array.isArray(images)) {
      // images wins over imageURL; the cover is always the first image
      updates.images   = sanitizeImages(images)
      updates.imageURL = updates.images[0] ?? ''
    } else if (imageURL !== undefined) {
      updates.imageURL = imageURL
    }

    // Drafts may have no price yet, but a published product must have one
    const current = snap.data() ?? {}
    const finalStatus = updates.status ?? current.status
    const finalPrice  = updates.price  ?? current.price
    if (finalStatus === 'published' && !(Number(finalPrice) > 0)) {
      return NextResponse.json({ message: 'Set a price before publishing this product.' }, { status: 400 })
    }

    await productRef.update(updates)
    return NextResponse.json({ message: 'Product updated' })
  } catch (error: any) {
    console.error('[api/admin/products/[id] PATCH]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: any) {
  const caller = await verifyAdmin(req)
  if (!caller) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ message: 'Product ID required' }, { status: 400 })

  try {
    const db = getAdminDb()
    await db.collection('products').doc(id).delete()
    return NextResponse.json({ message: 'Product deleted' })
  } catch (error: any) {
    console.error('[api/admin/products/[id] DELETE]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
