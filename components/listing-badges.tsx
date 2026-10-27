'use client'

import { useEffect, useRef, useState } from 'react'
import { Eye } from 'lucide-react'
import { getCachedViewCount, recordView, subscribeViewCount, type ViewType } from '@/lib/views'

const NEW_FOR_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

/** True while an item is within NEW_FOR_DAYS of its creation date. */
export function isNewListing(createdAt: number | string | null | undefined): boolean {
  if (!createdAt) return false
  const t = typeof createdAt === 'number' ? createdAt : Date.parse(createdAt)
  if (isNaN(t)) return false
  const age = Date.now() - t
  return age >= 0 && age < NEW_FOR_DAYS * DAY_MS
}

export function NewBadge({ createdAt, className = '' }: { createdAt?: number | string | null; className?: string }) {
  if (!isNewListing(createdAt)) return null
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-500 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg shadow-rose-500/30 ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      New
    </span>
  )
}

/**
 * Shows how many people viewed an item, and records this visitor's view once
 * the badge has been on screen for a second. Hidden until there is at least one view.
 */
export function ViewCountBadge({ type, id, className = '' }: { type: ViewType; id: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [count, setCount] = useState<number | null>(() => (id ? getCachedViewCount(type, id) : null))
  const [bump, setBump] = useState(false)
  const prevCount = useRef<number | null>(count)

  useEffect(() => {
    if (!id) return
    return subscribeViewCount(type, id, setCount)
  }, [type, id])

  // Brief highlight when the count goes up while on screen
  useEffect(() => {
    const prev = prevCount.current
    prevCount.current = count
    if (prev == null || count == null || count <= prev) return
    setBump(true)
    const t = setTimeout(() => setBump(false), 700)
    return () => clearTimeout(t)
  }, [count])

  useEffect(() => {
    const el = ref.current
    if (!el || !id || typeof IntersectionObserver === 'undefined') return
    let timer: ReturnType<typeof setTimeout> | null = null
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer ??= setTimeout(() => {
            recordView(type, id)
            observer.disconnect()
          }, 1000)
        } else if (timer) {
          clearTimeout(timer)
          timer = null
        }
      },
      { threshold: 1 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [type, id])

  const visible = (count ?? 0) > 0
  return (
    <span
      ref={ref}
      aria-hidden={!visible}
      title={visible ? `${count!.toLocaleString()} ${count === 1 ? 'view' : 'views'}` : undefined}
      className={`pointer-events-none inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-sm transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${bump ? 'scale-110 ring-2 ring-primary/80' : 'scale-100'} ${className}`}
    >
      <Eye className="h-3.5 w-3.5" />
      {compact.format(count ?? 0)} {count === 1 ? 'view' : 'views'}
    </span>
  )
}
