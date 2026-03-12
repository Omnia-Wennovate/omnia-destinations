'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminNavbar } from '@/components/admin/admin-navbar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized } = useAuthStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!isInitialized) return

    if (!isAuthenticated || !user) {
      router.replace('/login')
      return
    }

    if (user.role !== 'ADMIN') {
      router.replace('/dashboard')
      return
    }
  }, [isInitialized, isAuthenticated, user, router])

  // Still loading auth state
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-sm">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <AdminNavbar
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-[68px]' : 'ml-[240px]'
        )}
      >
        {children}
      </main>
    </div>
  )
}
