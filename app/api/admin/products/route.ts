/**
 * /api/admin/products
 *
 * Server-side product management (Admin SDK — bypasses Firestore security rules).
 * Only admins may call these endpoints (verified via Firebase ID token).
 *
 * GET  → list all products
 * POST → create a product
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
    // Accept both 'admin' (custom claim) and check /admins doc
    if (decoded.role === 'admin' || decoded.role === 'ADMIN') return decoded
    // Fallback: check /admins collection
    const db = getAdminDb()
    const adminDoc = await db.collection('admins').doc(decoded.uid).get()
    if (adminDoc.exists) return decoded
    return null
  } catch {
    return null
  }
}

// Keeps at most 3 non-empty image URLs; falls back to a single legacy imageURL.
function sanitizeImages(images: unknown, fallback?: unknown): string[] {
  const list = Array.isArray(images) ? images : fallback ? [fallback] : []
  return list
    .filter((u): u is string => typeof u === 'string' && u.trim() !== '')
    .map((u) => u.trim())
    .slice(0, 3)
}

export async function GET(req: NextRequest) {
  const caller = await verifyAdmin(req)
  if (!caller) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const db = getAdminDb()
    const snap = await db.collection('products').orderBy('createdAt', 'desc').get()
    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ products })
  } catch (error: any) {
    console.error('[api/admin/products GET]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const caller = await verifyAdmin(req)
  if (!caller) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, description, price, stock, status, imageURL } = body
    const images = sanitizeImages(body.images, imageURL)

    // Drafts only need a name; price and stock default to 0 until published
    const isPublished = status === 'published'
    const priceNum = Number(price ?? 0)
    const stockNum = Number(stock ?? 0)
    if (!name?.trim()) return NextResponse.json({ message: 'Name is required' }, { status: 400 })
    if (isNaN(priceNum) || priceNum < 0 || (isPublished && priceNum <= 0))
      return NextResponse.json({ message: 'Valid price required' }, { status: 400 })
    if (isNaN(stockNum) || stockNum < 0 || (isPublished && stock === undefined))
      return NextResponse.json({ message: 'Valid stock required' }, { status: 400 })

    const db = getAdminDb()
    const docData = {
      name: String(name).trim(),
      description: String(description ?? '').trim(),
      price: priceNum,
      stock: stockNum,
      status: isPublished ? 'published' : 'unpublished',
      images,
      imageURL: images[0] ?? '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const ref = await db.collection('products').add(docData)
    return NextResponse.json({ id: ref.id, message: 'Product created' }, { status: 201 })
  } catch (error: any) {
    console.error('[api/admin/products POST]', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
