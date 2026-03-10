'use client'

import { useEffect, useState } from 'react'
import { shopAPI } from '@/services/api'
import {
  ClipboardList, DollarSign, CheckCircle, Clock, TrendingUp,
  AlertCircle, Users, Star, ArrowRight, Loader2, IndianRupee
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function ShopDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await shopAPI.getDashboard()
        if (res.data?.success) setData(res.data.data)
      } catch (err) {
        console.error('Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          Unable to load dashboard. Please try again.
        </div>
      </div>
    )
  }

  const { shop, stats, earnings, recentOrders } = data

  const statCards = [
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      href: '/shop-partner/orders?status=pending'
    },
    {
      title: 'Active Orders',
      value: stats.activeOrders,
      icon: ClipboardList,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      href: '/shop-partner/orders?status=active'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      href: '/shop-partner/orders?status=completed'
    },
    {
      title: 'Total Completed',
      value: stats.totalCompleted,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      href: '/shop-partner/orders?status=completed'
    },
  ]

  const earningCards = [
    { title: 'Today', value: earnings.today?.totalEarning || 0, jobs: earnings.today?.count || 0 },
    { title: 'This Week', value: earnings.thisWeek?.totalEarning || 0, jobs: earnings.thisWeek?.count || 0 },
    { title: 'This Month', value: earnings.thisMonth?.totalEarning || 0, jobs: earnings.thisMonth?.count || 0 },
    { title: 'Pending Settlement', value: earnings.pendingSettlement || 0, jobs: null },
  ]

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      accepted: 'bg-blue-100 text-blue-700',
      mechanic_assigned: 'bg-indigo-100 text-indigo-700',
      on_way: 'bg-cyan-100 text-cyan-700',
      in_progress: 'bg-orange-100 text-orange-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {shop.shopName}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {shop.ownerName} | Commission: {shop.commissionRate}% |{' '}
            {shop.isVerified ? (
              <span className="text-green-600">Verified</span>
            ) : (
              <span className="text-amber-600">Pending Verification</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {shop.rating > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="font-semibold text-amber-700">{shop.rating}</span>
              <span className="text-xs text-amber-600">({shop.totalRatings})</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{shop.mechanicsCount} Mechanics</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={cn('p-4 rounded-xl border transition-all hover:shadow-md', card.bgColor)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('p-2 rounded-lg', card.color)}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
              <ArrowRight className={cn('h-4 w-4', card.textColor)} />
            </div>
            <p className={cn('text-2xl font-bold', card.textColor)}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.title}</p>
          </Link>
        ))}
      </div>

      {/* Earnings */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-green-600" />
          Earnings Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {earningCards.map((card) => (
            <div key={card.title} className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">{card.title}</p>
              <p className="text-xl font-bold text-gray-900">
                {card.value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
              </p>
              {card.jobs !== null && (
                <p className="text-xs text-gray-400 mt-1">{card.jobs} jobs</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/shop-partner/orders" className="text-sm text-[#FF6B35] hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentOrders?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No orders yet. Orders will appear here when assigned.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders?.map((order: any) => (
              <Link
                key={order._id}
                href={`/shop-partner/orders?id=${order._id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{order.orderId}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(order.status))}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.customer?.fullName} | {order.serviceCategory || 'Service'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {(order.finalCost || order.estimatedCost || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
