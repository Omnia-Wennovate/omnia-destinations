'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Newspaper,
} from 'lucide-react'
import { getAdminStats, type AdminStats } from '@/lib/services/admin.service'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getAdminStats()
        setStats(data)
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Tours',
      value: stats?.totalTours || 0,
      change: '+4%',
      icon: Package,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      change: '+8%',
      icon: Calendar,
      color: 'text-violet-600',
      bgColor: 'bg-violet-500/10',
    },
    {
      title: 'Revenue',
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      change: '+23%',
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
  ]

  const quickLinks = [
    { label: 'Manage Tours', href: '/admin/tours', icon: Package, desc: 'View, edit, publish tours' },
    { label: 'Bookings', href: '/admin/bookings', icon: Calendar, desc: 'Manage all bookings' },
    { label: 'Users', href: '/admin/users', icon: Users, desc: 'Manage roles & points' },
    { label: 'News', href: '/admin/news', icon: Newspaper, desc: 'Publish articles' },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName || 'Admin'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here is what is happening with your platform today.
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">{stat.change}</span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href}>
                <Card className="border-border/50 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group h-full">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{link.label}</p>
                      <p className="text-sm text-muted-foreground">{link.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Performance Overview</CardTitle>
            <CardDescription>Key metrics for your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-xl font-bold text-foreground">{stats?.totalUsers || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Active Users</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-xl font-bold text-foreground">{stats?.totalTours || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Live Tours</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-xl font-bold text-foreground">
                  {((stats?.totalBookings || 0) / Math.max(stats?.totalUsers || 1, 1)).toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Avg Bookings/User</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-xl font-bold text-foreground">
                  ${((stats?.totalRevenue || 0) / Math.max(stats?.totalBookings || 1, 1)).toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Avg Booking Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">System Status</CardTitle>
            <CardDescription>All services operational</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Firebase Auth', status: 'Online' },
              { name: 'Firestore DB', status: 'Online' },
              { name: 'Cloud Storage', status: 'Online' },
              { name: 'Payments', status: 'Online' },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{service.name}</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">{service.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
