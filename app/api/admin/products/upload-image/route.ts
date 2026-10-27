/**
 * /api/admin/products/upload-image
 *
 * Accepts a multipart form upload (field "file", plus "productId"),
 * writes the image to Firebase Storage via the Admin SDK (bypasses
 * Storage security rules), and returns the public download URL.
 *
 * Only admin callers are accepted (verified via Firebase ID token).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

// ── helpers ──────────────────────────────────────────────────────────────────

function getAdminApp() {
  // Re-use the already initialized 'admin-app' (from lib/firebase/admin.ts)
  const existing = getApps().find((a) => a.name === 'admin-app')
  if (existing) return existing

  // Fallback: initialize if needed (e.g. cold start where admin.ts runs first)
  const projectId    = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!
  const clientEmail  = process.env.FIREBASE_ADMIN_CLIENT_EMAIL!
  const rawKey       = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? ''
  const privateKey   = rawKey.replace(/^[\"']|[\"']$/g, '').replace(/\\n/g, '\n')

  return initializeApp(
    {
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket: 'omnia-destination.firebasestorage.app',
    },
    'admin-app'
  )
}

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

// ── route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const caller = await verifyAdmin(req)
  if (!caller) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })


  try {
    const formData = await req.formData()
    const file      = formData.get('file') as File | null
    const productId = formData.get('productId') as string | null

    if (!file || !productId) {
      return NextResponse.json({ message: 'file and productId are required' }, { status: 400 })
    }

    // Max 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'File must be under 10 MB' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Only image files are allowed' }, { status: 400 })
    }

    // Convert File → Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer      = Buffer.from(arrayBuffer)

    // Upload via Admin SDK — bypasses storage security rules
    const app    = getAdminApp()
    const bucket = getStorage(app).bucket('omnia-destination.firebasestorage.app')

    const fileName = `products/${productId}/${Date.now()}_${file.name.replace(/[^a-z0-9._-]/gi, '_')}`

    const storageFile = bucket.file(fileName)
    await storageFile.save(buffer, {
      metadata: { contentType: file.type },
    })

    // Make file publicly readable, get download URL
    await storageFile.makePublic()
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`

    return NextResponse.json({ url: publicUrl }, { status: 200 })
  } catch (error: any) {
    console.error('[api/admin/products/upload-image]', error)
    return NextResponse.json({ message: error?.message || 'Upload failed' }, { status: 500 })
  }
}
