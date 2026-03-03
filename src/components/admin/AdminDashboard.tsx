'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Wrench,
  TrendingUp,
  TrendingDown,
  Eye,
  MoreHorizontal,
  Calendar,
  Download,
  Loader2,
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
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { dashboardAPI } from '@/services/api'
import Link from 'next/link'
import { AdminHeader } from './AdminHeader'

export function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await dashboardAPI.getOverview()
      const data = res.data?.data || res.data
      setDashboardData(data)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusConfig = (status: string) => {
    const config: Record<string, { color: string; bg: string; label: string; icon: any }> = {
      placed: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Placed', icon: Clock },
      pending: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Pending', icon: Clock },
      confirmed: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Confirmed', icon: CheckCircle2 },
      processing: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Processing', icon: Package },
      shipped: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', label: 'Shipped', icon: Truck },
      out_for_delivery: { color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', label: 'Out for Delivery', icon: Truck },
      delivered: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Delivered', icon: CheckCircle2 },
      completed: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Completed', icon: CheckCircle2 },
      cancelled: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Cancelled', icon: XCircle },
    }
    return config[status] || config.pending
  }

  const getActivityIcon = (type: string) => {
    const config: Record<string, { icon: any; color: string; bg: string }> = {
      order: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
      user: { icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
      service: { icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-100' },
      payment: { icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
      inventory: { icon: Package, color: 'text-orange-600', bg: 'bg-orange-100' },
    }
    return config[type] || { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100' }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDays = Math.floor(diffHr / 24)
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="p-6 lg:p-8">
          {/* Skeleton loading */}
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[140px] bg-white rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-[400px] bg-white rounded-2xl" />
              <div className="h-[400px] bg-white rounded-2xl" />
            </div>
          </div>
        </div>
      </>
    )
  }

  const summary = dashboardData?.summary || {}
  const recentOrders = dashboardData?.recentOrders || []
  const topCategories = dashboardData?.topCategories || []
  const recentActivities = dashboardData?.recentActivities || []

  const ordersByStatus = dashboardData?.orders?.byStatus || {}
  const activeOrders = (ordersByStatus.placed || 0) + (ordersByStatus.confirmed || 0) +
    (ordersByStatus.processing || 0) + (ordersByStatus.shipped || 0) + (ordersByStatus.out_for_delivery || 0)

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue || 0),
      subtitle: `From ${summary.totalOrders || 0} orders`,
      icon: IndianRupee,
      iconBg: 'bg-emerald-500',
      trend: summary.revenueGrowth || null,
      href: '/admin/financial/revenue',
    },
    {
      title: 'Active Orders',
      value: activeOrders,
      subtitle: `${summary.totalOrders || 0} total orders`,
      icon: ShoppingCart,
      iconBg: 'bg-blue-500',
      trend: null,
      href: '/admin/orders',
    },
    {
      title: 'Total Users',
      value: (summary.totalUsers || 0).toLocaleString(),
      subtitle: `${summary.totalProducts || 0} products listed`,
      icon: Users,
      iconBg: 'bg-violet-500',
      trend: summary.userGrowth || null,
      href: '/admin/users/customers',
    },
    {
      title: 'Service Requests',
      value: summary.activeServiceRequests || 0,
      subtitle: 'Active requests',
      icon: Wrench,
      iconBg: 'bg-orange-500',
      trend: null,
      href: '/admin/services/requests',
    },
  ]

  const progressBarColors = [
    'bg-[#1B3B6F]',
    'bg-[#FF6B35]',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-blue-500',
    'bg-amber-500',
  ]

  return (
    <>
      <AdminHeader />
      <div className="p-5 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1D29] tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[150px] bg-white border-gray-200 rounded-xl h-10">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="rounded-xl h-10 border-gray-200 hidden sm:flex">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <Link key={idx} href={card.href}>
                <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 rounded-2xl cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">{card.title}</p>
                        <p className="text-2xl lg:text-3xl font-bold text-[#1A1D29] mt-1.5 tracking-tight">{card.value}</p>
                        <p className="text-xs text-gray-400 mt-1.5">{card.subtitle}</p>
                      </div>
                      <div className={`${card.iconBg} h-11 w-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    {card.trend != null && (
                      <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${card.trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
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

        {/* Order Status Overview */}
        {Object.keys(ordersByStatus).length > 0 && (
          <Card className="border border-gray-100 shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1A1D29]">Order Pipeline</h3>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm" className="text-[#1B3B6F] text-xs h-8">
                    View All <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { key: 'placed', label: 'Placed', color: 'bg-amber-500' },
                  { key: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
                  { key: 'processing', label: 'Processing', color: 'bg-indigo-500' },
                  { key: 'shipped', label: 'Shipped', color: 'bg-purple-500' },
                  { key: 'delivered', label: 'Delivered', color: 'bg-emerald-500' },
                  { key: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
                ].map(status => {
                  const count = ordersByStatus[status.key] || 0
                  return (
                    <div key={status.key} className="bg-gray-50 rounded-xl p-3.5 text-center hover:bg-gray-100 transition-colors">
                      <div className={`${status.color} h-2 w-8 rounded-full mx-auto mb-2.5`} />
                      <p className="text-xl font-bold text-[#1A1D29]">{count}</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">{status.label}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-[#1A1D29]">Recent Orders</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Latest transactions</CardDescription>
                </div>
                <Link href="/admin/orders">
                  <Button variant="outline" size="sm" className="rounded-lg text-xs h-8 border-gray-200">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-2.5">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingCart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No orders yet</p>
                  </div>
                ) : (
                  recentOrders.slice(0, 6).map((order: any) => {
                    const statusCfg = getStatusConfig(order.status)
                    const StatusIcon = statusCfg.icon
                    return (
                      <div key={order.id || order._id} className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-gray-50 transition-colors group">
                        {/* Status icon */}
                        <div className={`h-9 w-9 rounded-lg ${statusCfg.bg} border flex items-center justify-center shrink-0`}>
                          <StatusIcon className={`h-4 w-4 ${statusCfg.color}`} />
                        </div>
                        {/* Order info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#1A1D29]">{order.id}</span>
                            <Badge className={`${statusCfg.bg} ${statusCfg.color} border text-[10px] font-semibold px-1.5 py-0 h-5`}>
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{order.customer} {order.product ? `• ${order.product}` : ''}</p>
                        </div>
                        {/* Amount & time */}
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[#1A1D29]">{formatFullCurrency(order.amount)}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{formatTimeAgo(order.timestamp)}</p>
                        </div>
                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Update Status</DropdownMenuItem>
                            <DropdownMenuItem>Contact Customer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A1D29]">Activity Feed</CardTitle>
              <CardDescription className="text-xs mt-0.5">Real-time platform updates</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-10">
                    <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  recentActivities.slice(0, 8).map((activity: any, index: number) => {
                    const actCfg = getActivityIcon(activity.type)
                    const ActIcon = actCfg.icon
                    return (
                      <div key={activity.id || index} className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-lg ${actCfg.bg} flex items-center justify-center shrink-0`}>
                          <ActIcon className={`h-3.5 w-3.5 ${actCfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1A1D29] leading-snug">{activity.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          {/* Top Categories */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-[#1A1D29]">Top Categories</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Revenue by category</CardDescription>
                </div>
                <Link href="/admin/inventory/categories">
                  <Button variant="ghost" size="sm" className="text-[#1B3B6F] text-xs h-8">
                    View All <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-4">
                {topCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No category data yet</p>
                  </div>
                ) : (
                  topCategories.slice(0, 5).map((category: any, index: number) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-[#1A1D29]">{category.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[#1A1D29]">
                            {formatCurrency(category.revenue)}
                          </span>
                          <span className="text-[11px] text-gray-400 w-16 text-right">
                            {category.orders} orders
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`${progressBarColors[index % progressBarColors.length]} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(category.percentage || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A1D29]">Quick Actions</CardTitle>
              <CardDescription className="text-xs mt-0.5">Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: 'Add Product', icon: Package, href: '/admin/inventory/products', color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
                  { title: 'View Orders', icon: ShoppingCart, href: '/admin/orders', color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100' },
                  { title: 'Manage Users', icon: Users, href: '/admin/users/customers', color: 'text-violet-600', bg: 'bg-violet-50 hover:bg-violet-100' },
                  { title: 'Service Requests', icon: Wrench, href: '/admin/services/requests', color: 'text-orange-600', bg: 'bg-orange-50 hover:bg-orange-100' },
                  { title: 'Payments', icon: IndianRupee, href: '/admin/services/payments', color: 'text-green-600', bg: 'bg-green-50 hover:bg-green-100' },
                  { title: 'Notifications', icon: Activity, href: '/admin/communication/notifications', color: 'text-pink-600', bg: 'bg-pink-50 hover:bg-pink-100' },
                ].map((action, idx) => {
                  const ActionIcon = action.icon
                  return (
                    <Link key={idx} href={action.href}>
                      <div className={`${action.bg} rounded-xl p-4 flex items-center gap-3 transition-colors cursor-pointer`}>
                        <ActionIcon className={`h-5 w-5 ${action.color} shrink-0`} />
                        <span className="text-sm font-medium text-[#1A1D29]">{action.title}</span>
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
