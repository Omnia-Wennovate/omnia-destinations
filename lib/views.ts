/**
 * Client-side view counters for packages and products (see /api/views).
 *
 * - Count lookups from every card on a page are batched into one request.
 * - A visitor records at most one view per item per day (localStorage).
 * - Subscribers update live when a view is recorded.
 */

export type ViewType = 'package' | 'product'

const DAY_MS = 24 * 60 * 60 * 1000
const BATCH_SIZE = 50

const counts = new Map<string, number>()
const listeners = new Map<string, Set<(count: number) => void>>()
const queued = new Map<ViewType, Set<string>>()
const inFlight = new Set<string>()
const recordedThisSession = new Set<string>()
let flushTimer: ReturnType<typeof setTimeout> | null = null

const keyOf = (type: ViewType, id: string) => `${type}:${id}`

function setCount(type: ViewType, id: string, count: number) {
  const key = keyOf(type, id)
  counts.set(key, count)
  listeners.get(key)?.forEach((fn) => fn(count))
}

async function flush() {
  flushTimer = null
  const batches = [...queued.entries()]
  queued.clear()

  for (const [type, idSet] of batches) {
    const ids = [...idSet]
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const chunk = ids.slice(i, i + BATCH_SIZE)
      try {
        const res = await fetch(`/api/views?type=${type}&ids=${chunk.map(encodeURIComponent).join(',')}`)
        const data = res.ok ? await res.json() : null
        chunk.forEach((id) => setCount(type, id, Number(data?.counts?.[id]) || 0))
      } catch {
        // Leave these unknown; the badge simply stays hidden
      } finally {
        chunk.forEach((id) => inFlight.delete(keyOf(type, id)))
      }
    }
  }
}

function queueFetch(type: ViewType, id: string) {
  const key = keyOf(type, id)
  if (counts.has(key) || inFlight.has(key)) return
  inFlight.add(key)
  if (!queued.has(type)) queued.set(type, new Set())
  queued.get(type)!.add(id)
  if (!flushTimer) flushTimer = setTimeout(flush, 30)
}

/** Calls `fn` with the current count now (if known) and whenever it changes. */
export function subscribeViewCount(type: ViewType, id: string, fn: (count: number) => void): () => void {
  const key = keyOf(type, id)
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key)!.add(fn)

  if (counts.has(key)) fn(counts.get(key)!)
  else queueFetch(type, id)

  return () => { listeners.get(key)?.delete(fn) }
}

export function getCachedViewCount(type: ViewType, id: string): number | null {
  return counts.get(keyOf(type, id)) ?? null
}

/** Records one view, unless this visitor already viewed the item in the last 24h. */
export async function recordView(type: ViewType, id: string): Promise<void> {
  if (!id) return
  const key = keyOf(type, id)
  if (recordedThisSession.has(key)) return
  recordedThisSession.add(key)

  const storageKey = `omnia:viewed:${key}`
  try {
    const last = Number(localStorage.getItem(storageKey))
    if (last && Date.now() - last < DAY_MS) return
    // Mark before sending so a card and a detail page can't both count the same visit
    localStorage.setItem(storageKey, String(Date.now()))
  } catch {
    // Storage unavailable (private mode) — the session set above still dedupes
  }

  try {
    const res = await fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
      keepalive: true,
    })
    if (!res.ok) return
    const data = await res.json()
    if (typeof data?.count === 'number') setCount(type, id, data.count)
  } catch {
    // Non-critical
  }
}
