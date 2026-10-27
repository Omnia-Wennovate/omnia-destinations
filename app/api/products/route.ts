/**
 * /api/products
 *
 * Public endpoint — returns all published products.
 * Uses Admin SDK to bypass Firestore security rules (no deployment needed).
 */

import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

export async function GET() {
  try {
    const db   = getAdminDb()
    const snap = await db
      .collection('products')
      .where('status', '==', 'published')
      .get()

    const products = snap.docs
      .map((d) => {
        const data = d.data()
        return {
          id:          d.id,
          name:        data.name        ?? '',
          description: data.description ?? '',
          price:       data.price       ?? 0,
          imageURL:    data.imageURL    ?? '',
          images:      Array.isArray(data.images) && data.images.length
                         ? data.images
                         : data.imageURL ? [data.imageURL] : [],
          stock:       data.stock       ?? 0,
          status:      data.status      ?? 'published',
          createdAt:   data.createdAt?.toMillis?.() ?? null,
          updatedAt:   data.updatedAt?.toMillis?.() ?? null,
        }
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))

    return NextResponse.json({ products })
  } catch (error: any) {
    console.error('[api/products GET]', error)
    return NextResponse.json({ products: [] })
  }
}
