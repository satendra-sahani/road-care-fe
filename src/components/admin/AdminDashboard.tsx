'use client'

// Admin Dashboard — fully dynamic command centre. Every number on this page
// comes from a live API (overview + service-request stats + memberships +
// trackers + shops + call stats fetched in parallel); nothing is fabricated.
import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import {
  ShoppingCart,
  Users,
  Wrench,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  IndianRupee,
  Activity,
  BarChart3,
  RefreshCw,
  Crown,
  Satellite,
  Store,
  Phone,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  dashboardAPI,
  serviceRequestAPI,
  adminMembershipsAPI,
  adminTrackerAPI,
  adminShopAPI,
  adminCallLogsAPI,
} from '@/services/api'
import Link from 'next/link'
import { AdminHeader } from './AdminHeader'

const NAVY = '#1B3B6F'

// ─── formatting helpers ──────────────────────────────────────────────
const compactINR = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}
const fullINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)

const timeAgo = (timestamp: string) => {
  const diffMin = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
  if (isNaN(diffMin) || diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const h = Math.floor(diffMin / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const ORDER_STATUS: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  placed: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Placed', icon: Clock },
  pending: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Pending', icon: Clock },
  confirmed: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Confirmed', icon: CheckCircle2 },
  processing: { color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', label: 'Processing', icon: Package },
  shipped: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', label: 'Shipped', icon: Truck },
  out_for_delivery: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', label: 'On the way', icon: Truck },
  delivered: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Delivered', icon: CheckCircle2 },
  completed: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Completed', icon: CheckCircle2 },
  cancelled: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Cancelled', icon: XCircle },
}

const ACTIVITY_ICON: Record<string, { icon: any; color: string; bg: string }> = {
  order: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
  user: { icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  service: { icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-100' },
  payment: { icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
  inventory: { icon: Package, color: 'text-orange-600', bg: 'bg-orange-100' },
}

const PIPELINE: Array<{ key: string; label: string; bar: string }> = [
  { key: 'placed', label: 'Placed', bar: 'bg-amber-400' },
  { key: 'confirmed', label: 'Confirmed', bar: 'bg-blue-500' },
  { key: 'processing', label: 'Processing', bar: 'bg-indigo-500' },
  { key: 'shipped', label: 'Shipped', bar: 'bg-purple-500' },
  { key: 'delivered', label: 'Delivered', bar: 'bg-emerald-500' },
  { key: 'cancelled', label: 'Cancelled', bar: 'bg-red-400' },
]

export function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dash, setDash] = useState<any>(null)
  const [srStats, setSrStats] = useState<any>(null)
  const [memberStats, setMemberStats] = useState<any>(null)
  const [trackerStats, setTrackerStats] = useState<any>(null)
  const [shopStats, setShopStats] = useState<any>(null)
  const [callStats, setCallStats] = useState<any>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      // Everything in parallel — one slow endpoint never blanks the page.
      const [ov, sr, mem, trk, shops, calls] = await Promise.allSettled([
        dashboardAPI.getOverview(),
        serviceRequestAPI.getStats(),
        adminMembershipsAPI.getAll({ limit: 1 }),
        adminTrackerAPI.getDevices({ limit: 1 }),
        adminShopAPI.getStats(),
        adminCallLogsAPI.getStats(),
      ])
      if (ov.status === 'fulfilled') setDash(ov.value.data?.data || ov.value.data)
      if (sr.status === 'fulfilled') setSrStats(sr.value.data?.data || sr.value.data)
      if (mem.status === 'fulfilled') setMemberStats(mem.value.data?.stats || null)
      if (trk.status === 'fulfilled') setTrackerStats(trk.value.data?.stats || null)
      if (shops.status === 'fulfilled') setShopStats(shops.value.data?.data || shops.value.data)
      if (calls.status === 'fulfilled') setCallStats(calls.value.data?.data || calls.value.data)
      setUpdatedAt(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const t = setInterval(() => fetchAll(true), 60000) // live refresh every 60s
    return () => clearInterval(t)
  }, [fetchAll])

  // ── REAL export: download the current snapshot as CSV ──
  const exportCsv = () => {
    const summary = dash?.summary || {}
    const byStatus = dash?.orders?.byStatus || {}
    const lines: string[] = [
      'Bharat Mechanics — Admin dashboard snapshot',
      `Generated,${new Date().toLocaleString('en-IN')}`,
      '',
      'Metric,Value',
      `Total revenue,${summary.totalRevenue || 0}`,
      `Total orders,${summary.totalOrders || 0}`,
      `Total users,${summary.totalUsers || 0}`,
      `Products listed,${summary.totalProducts || 0}`,
      `Active service requests,${summary.activeServiceRequests || 0}`,
      `Active memberships,${memberStats?.active ?? ''}`,
      `Membership revenue,${memberStats?.revenue ?? ''}`,
      `Tracker devices,${trackerStats?.total ?? ''}`,
      '',
      'Order status,Count',
      ...PIPELINE.map((p) => `${p.label},${byStatus[p.key] || 0}`),
      '',
      'Recent orders',
      'Order,Customer,Status,Amount,Time',
      ...(dash?.recentOrders || []).map((o: any) =>
        `${o.id},"${o.customer || ''}",${o.status},${o.amount || 0},${o.timestamp || ''}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bm-dashboard-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="p-6 lg:p-8 animate-pulse space-y-6">
          <div className="h-24 rounded-2xl bg-slate-200/70" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-[132px] rounded-2xl bg-white" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[380px] rounded-2xl bg-white" />
            <div className="h-[380px] rounded-2xl bg-white" />
          </div>
        </div>
      </>
    )
  }

  const summary = dash?.summary || {}
  const recentOrders = dash?.recentOrders || []
  const topCategories = dash?.topCategories || []
  const recentActivities = dash?.recentActivities || []
  const byStatus = dash?.orders?.byStatus || {}
  const activeOrders = (byStatus.placed || 0) + (byStatus.confirmed || 0) + (byStatus.processing || 0) + (byStatus.shipped || 0) + (byStatus.out_for_delivery || 0)
  const pipelineTotal = PIPELINE.reduce((n, p) => n + (byStatus[p.key] || 0), 0)

  const srActive = srStats ? (srStats.pending || 0) + (srStats.assigned || 0) + (srStats.inProgress || 0) : (summary.activeServiceRequests || 0)
  const srEmergency = srStats?.emergency || 0

  // Platform pulse — live counts across every product area (only render tiles
  // whose endpoint answered, so nothing shows a made-up zero on API failure).
  const pulseTiles = [
    srStats && { icon: Wrench, label: 'Service requests', value: srActive, sub: `${srStats.completed || 0} completed`, href: '/admin/services/requests', tint: 'text-orange-600 bg-orange-50' },
    shopStats && { icon: Store, label: 'Shop partners', value: shopStats.total ?? shopStats.totalShops ?? 0, sub: `${shopStats.verified ?? shopStats.verifiedShops ?? 0} verified`, href: '/admin/shops', tint: 'text-amber-600 bg-amber-50' },
    memberStats && { icon: Crown, label: 'BM Care members', value: memberStats.active || 0, sub: `${compactINR(memberStats.revenue || 0)} revenue`, href: '/admin/subscriptions/memberships', tint: 'text-violet-600 bg-violet-50' },
    trackerStats && { icon: Satellite, label: 'GPS trackers', value: trackerStats.total || 0, sub: `${trackerStats.reporting24h || 0} reporting`, href: '/admin/subscriptions/trackers', tint: 'text-sky-600 bg-sky-50' },
    callStats && { icon: Phone, label: 'Calls today', value: callStats.today ?? callStats.todayCalls ?? 0, sub: `${callStats.total ?? callStats.totalCalls ?? 0} all-time`, href: '/admin/communication/call-logs', tint: 'text-emerald-600 bg-emerald-50' },
  ].filter(Boolean) as Array<{ icon: any; label: string; value: number; sub: string; href: string; tint: string }>

  const kpis = [
    {
      title: 'Active Orders', value: activeOrders, subtitle: `${summary.totalOrders || 0} orders all-time`,
      icon: ShoppingCart, tint: 'bg-blue-500/10 text-blue-600', href: '/admin/orders', trend: null as number | null,
    },
    {
      title: 'Total Users', value: (summary.totalUsers || 0).toLocaleString('en-IN'), subtitle: `${summary.totalProducts || 0} products listed`,
      icon: Users, tint: 'bg-violet-500/10 text-violet-600', href: '/admin/users/customers', trend: summary.userGrowth ?? null,
    },
    {
      title: 'Service Requests', value: srActive, subtitle: srEmergency > 0 ? `${srEmergency} emergency open` : 'No open emergencies',
      icon: Wrench, tint: 'bg-orange-500/10 text-orange-600', href: '/admin/services/requests', trend: null as number | null,
      alert: srEmergency > 0,
    },
  ]

  return (
    <>
      <AdminHeader />
      <div className="p-5 lg:p-8 space-y-6">
        {/* ── Page header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl lg:text-[28px] font-bold tracking-tight text-[#1A1D29]">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {updatedAt && <span className="ml-2 text-[11.5px] text-gray-400">· updated {timeAgo(updatedAt.toISOString())}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" onClick={() => fetchAll(true)} disabled={refreshing} className="h-10 rounded-xl border-gray-200">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={exportCsv} className="h-10 rounded-xl bg-[#1B3B6F] text-white hover:bg-[#16305c]">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {/* ── KPI row: hero revenue card + 3 metric cards ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {/* Revenue hero */}
          <Link href="/admin/financial/revenue" className="group">
            <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] p-5 shadow-md transition-transform duration-200 hover:-translate-y-0.5">
              <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
              <div className="absolute -right-2 top-14 h-20 w-20 rounded-full bg-white/[0.05]" />
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-semibold uppercase tracking-wide text-white/60">Total revenue</p>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                  <IndianRupee className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">{compactINR(summary.totalRevenue || 0)}</p>
              <p className="mt-1 text-[12px] text-white/55">from {summary.totalOrders || 0} orders</p>
              {summary.revenueGrowth != null && (
                <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${summary.revenueGrowth >= 0 ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'}`}>
                  {summary.revenueGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(summary.revenueGrowth)}% vs last period
                </div>
              )}
            </div>
          </Link>

          {kpis.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.title} href={card.href} className="group">
                <Card className="h-full rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[12.5px] font-semibold uppercase tracking-wide text-gray-400">{card.title}</p>
                      <div className={`grid h-9 w-9 place-items-center rounded-xl ${card.tint}`}>
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                    </div>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#1A1D29]">{card.value}</p>
                    <p className={`mt-1 flex items-center gap-1 text-[12px] ${(card as any).alert ? 'font-semibold text-red-500' : 'text-gray-400'}`}>
                      {(card as any).alert && <AlertTriangle className="h-3.5 w-3.5" />}
                      {card.subtitle}
                    </p>
                    {card.trend != null && (
                      <div className={`mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold ${card.trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {card.trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {Math.abs(card.trend)}% vs last period
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* ── Platform pulse — live counts across every product area ── */}
        {pulseTiles.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {pulseTiles.map((t) => {
              const Icon = t.icon
              return (
                <Link key={t.label} href={t.href}>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm transition-colors hover:border-gray-200 hover:bg-gray-50/60">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${t.tint}`}>
                      <Icon className="h-[17px] w-[17px]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-extrabold leading-tight text-[#1A1D29]">{t.value}</p>
                      <p className="truncate text-[11px] font-medium text-gray-500">{t.label} <span className="text-gray-300">·</span> {t.sub}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Order pipeline with proportion bar ── */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#1A1D29]">Order Pipeline</h3>
                <p className="text-[12px] text-gray-400">{pipelineTotal} orders across all stages</p>
              </div>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-[#1B3B6F]">
                  View all <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* proportion bar (real distribution) */}
            {pipelineTotal > 0 && (
              <div className="mb-4 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                {PIPELINE.map((p) => {
                  const n = byStatus[p.key] || 0
                  if (!n) return null
                  return <div key={p.key} className={p.bar} style={{ width: `${(n / pipelineTotal) * 100}%` }} title={`${p.label}: ${n}`} />
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {PIPELINE.map((p) => (
                <div key={p.key} className="rounded-xl bg-gray-50 p-3.5 text-center transition-colors hover:bg-gray-100">
                  <div className={`mx-auto mb-2 h-1.5 w-8 rounded-full ${p.bar}`} />
                  <p className="text-xl font-bold text-[#1A1D29]">{byStatus[p.key] || 0}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-gray-500">{p.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Recent orders + activity ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
          <Card className="rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-[#1A1D29]">Recent Orders</CardTitle>
                  <CardDescription className="mt-0.5 text-xs">Latest transactions</CardDescription>
                </div>
                <Link href="/admin/orders">
                  <Button variant="outline" size="sm" className="h-8 rounded-lg border-gray-200 text-xs">View all</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {recentOrders.length === 0 ? (
                <div className="py-10 text-center">
                  <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">No orders yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentOrders.slice(0, 6).map((order: any) => {
                    const cfg = ORDER_STATUS[order.status] || ORDER_STATUS.pending
                    const StatusIcon = cfg.icon
                    return (
                      <div key={order.id || order._id} className="flex items-center gap-4 px-1 py-3 transition-colors hover:bg-gray-50/60">
                        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${cfg.bg}`}>
                          <StatusIcon className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#1A1D29]">{order.id}</span>
                            <Badge className={`${cfg.bg} ${cfg.color} h-5 border px-1.5 py-0 text-[10px] font-semibold`}>{cfg.label}</Badge>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-gray-500">{order.customer}{order.product ? ` • ${order.product}` : ''}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-[#1A1D29]">{fullINR(order.amount)}</p>
                          <p className="mt-0.5 text-[11px] text-gray-400">{timeAgo(order.timestamp)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A1D29]">Activity Feed</CardTitle>
              <CardDescription className="mt-0.5 text-xs">Real-time platform updates</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {recentActivities.length === 0 ? (
                <div className="py-10 text-center">
                  <Activity className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                </div>
              ) : (
                <div className="relative space-y-4 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-gray-100">
                  {recentActivities.slice(0, 8).map((activity: any, index: number) => {
                    const cfg = ACTIVITY_ICON[activity.type] || { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100' }
                    const ActIcon = cfg.icon
                    return (
                      <div key={activity.id || index} className="relative flex items-start gap-3">
                        <div className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${cfg.bg}`}>
                          <ActIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug text-[#1A1D29]">{activity.message}</p>
                          <p className="mt-1 text-[11px] text-gray-400">{timeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Top categories + quick actions ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-[#1A1D29]">Top Categories</CardTitle>
                  <CardDescription className="mt-0.5 text-xs">Revenue by category</CardDescription>
                </div>
                <Link href="/admin/inventory/categories">
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-[#1B3B6F]">
                    View all <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {topCategories.length === 0 ? (
                <div className="py-8 text-center">
                  <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">No category data yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topCategories.slice(0, 5).map((category: any, index: number) => (
                    <div key={index}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#1A1D29]">{category.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[#1A1D29]">{compactINR(category.revenue)}</span>
                          <span className="w-16 text-right text-[11px] text-gray-400">{category.orders} orders</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[#1B3B6F] to-[#FF6B35] transition-all duration-500"
                          style={{ width: `${Math.min(category.percentage || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A1D29]">Quick Actions</CardTitle>
              <CardDescription className="mt-0.5 text-xs">Jump straight to common tasks</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { title: 'Products', icon: Package, href: '/admin/inventory/products', cls: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
                  { title: 'Orders', icon: ShoppingCart, href: '/admin/orders', cls: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
                  { title: 'Customers', icon: Users, href: '/admin/users/customers', cls: 'text-violet-600 bg-violet-50 hover:bg-violet-100' },
                  { title: 'Services', icon: Wrench, href: '/admin/services/requests', cls: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
                  { title: 'Members', icon: Crown, href: '/admin/subscriptions/memberships', cls: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
                  { title: 'Support', icon: Phone, href: '/admin/communication/support', cls: 'text-pink-600 bg-pink-50 hover:bg-pink-100' },
                ].map((action) => {
                  const ActionIcon = action.icon
                  return (
                    <Link key={action.title} href={action.href}>
                      <div className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-colors ${action.cls}`}>
                        <ActionIcon className="h-5 w-5" />
                        <span className="text-[12.5px] font-semibold text-[#1A1D29]">{action.title}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
