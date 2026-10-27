/**
 * /api/views
 *
 * Public view counters for packages and products.
 *
 * GET  ?type=package|product&ids=a,b,c → { counts: { [id]: number } }
 * POST { type, id }                     → { count }   (records one view)
 *
 * Counts live in their own collection (viewCounts/{type}_{id}) so package and
 * product documents are never touched. Only the Admin SDK writes there —
 * no Firestore rule grants clients access.
 *
 * Abuse guards: ids must belong to a real published package/product, and each
 * IP may record a limited number of views per minute. The client also only
 * records one view per visitor per item per day.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { PACKAGES } from '@/lib/data/packages'

type ViewType = 'package' | 'product'

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/
const MAX_IDS = 50
const STATIC_PACKAGE_IDS = new Set(PACKAGES.map((p) => p.id))

function parseType(val: unknown): ViewType | null {
  return val === 'package' || val === 'product' ? val : null
}

const counterRef = (type: ViewType, id: string) =>
  getAdminDb().collection('viewCounts').doc(`${type}_${id}`)

// Best-effort per-instance limiter: 60 recorded views per IP per minute
const RATE_LIMIT = 60
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || entry.resetAt < now) {
    if (hits.size > 5000) hits.clear()
    hits.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

async function isViewable(type: ViewType, id: string): Promise<boolean> {
  if (type === 'package' && STATIC_PACKAGE_IDS.has(id)) return true
  const snap = await getAdminDb().collection(type === 'package' ? 'packages' : 'products').doc(id).get()
  return snap.exists && snap.get('status') === 'published'
}

export async function GET(req: NextRequest) {
  const type = parseType(req.nextUrl.searchParams.get('type'))
  const ids = [...new Set((req.nextUrl.searchParams.get('ids') ?? '').split(',').filter((id) => ID_PATTERN.test(id)))]
    .slice(0, MAX_IDS)

  if (!type || ids.length === 0) {
    return NextResponse.json({ message: 'type and ids are required' }, { status: 400 })
  }

  try {
    const snaps = await getAdminDb().getAll(...ids.map((id) => counterRef(type, id)))
    const counts: Record<string, number> = {}
    snaps.forEach((snap, i) => { counts[ids[i]] = Number(snap.get('count')) || 0 })
    return NextResponse.json({ counts }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    console.error('[api/views GET]', error?.message ?? error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const type = parseType(body?.type)
    const id = typeof body?.id === 'string' ? body.id : ''

    if (!type || !ID_PATTERN.test(id)) {
      return NextResponse.json({ message: 'Invalid type or id' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    if (rateLimited(ip)) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 })
    }

    if (!(await isViewable(type, id))) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const ref = counterRef(type, id)
    await ref.set(
      { type, itemId: id, count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    )
    const snap = await ref.get()
    return NextResponse.json({ count: Number(snap.get('count')) || 0 })
  } catch (error: any) {
    console.error('[api/views POST]', error?.message ?? error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
