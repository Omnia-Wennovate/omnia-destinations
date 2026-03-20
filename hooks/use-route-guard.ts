'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

type AllowedRole = 'user' | 'admin'

/**
 * useRouteGuard – protects a page based on auth state and role.
 *
 * @param requiredRole
 *   'user'  → page is only for authenticated non-admin users.
 *             Unauthenticated → /login?redirect=<current-path>
 *             Admin           → /admin
 *
 *   'admin' → page is only for admin users.
 *             Unauthenticated → /login
 *             Non-admin       → /dashboard
 *
 * @returns { isReady } — true once auth is initialised AND the user is allowed.
 *                        Render nothing (return null) from the page while !isReady.
 */
export function useRouteGuard(requiredRole: AllowedRole = 'user') {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isInitialized } = useAuthStore()

  useEffect(() => {
    if (!isInitialized) return

    if (requiredRole === 'user') {
      if (!isAuthenticated || !user) {
        // Not logged in → send to login with a redirect back here
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }
      if (user.role === 'ADMIN') {
        // Admins must not access user-facing booking pages
        router.replace('/admin')
        return
      }
    }

    if (requiredRole === 'admin') {
      if (!isAuthenticated || !user) {
        router.replace('/login')
        return
      }
      if (user.role !== 'ADMIN') {
        router.replace('/dashboard')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, router, pathname, requiredRole])

  if (!isInitialized) return { isReady: false }

  if (requiredRole === 'user') {
    const allowed = isAuthenticated && !!user && user.role !== 'ADMIN'
    return { isReady: allowed }
  }

  if (requiredRole === 'admin') {
    const allowed = isAuthenticated && !!user && user.role === 'ADMIN'
    return { isReady: allowed }
  }

  return { isReady: false }
}
