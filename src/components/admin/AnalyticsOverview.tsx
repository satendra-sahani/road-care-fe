'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Wrench,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  Package,
  Truck,
  MapPin,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { analyticsAPI } from '@/services/api'
import { AdminHeader } from './AdminHeader'

interface AnalyticsOverviewProps {
  type?: 'overview' | 'revenue' | 'performance' | 'general'
}

export function AnalyticsOverview({ type = 'overview' }: AnalyticsOverviewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const res = await analyticsAPI.getOverview({ period: selectedPeriod })
      const d = res.data?.data || res.data
      setData(d)
    } catch (err) {
      console.error('Analytics fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }

  const getTitle = () => {
    switch (type) {
      case 'revenue': return 'Revenue Analytics'
      case 'performance': return 'Performance Analytics'
      case 'general': return 'Analytics Dashboard'
      default: return 'Analytics Overview'
    }
  }

  if (isLoading) {
    return (
      <>
        <AdminHeader />
        <div className="p-5 lg:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-[130px] bg-white rounded-2xl" />)}
            </div>
            <div className="h-12 bg-white rounded-xl w-full max-w-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-[300px] bg-white rounded-2xl" />
              <div className="h-[300px] bg-white rounded-2xl" />
            </div>
          </div>
        </div>
      </>
    )
  }

  const revenueData = data?.revenueData || { current: 0, previous: 0, growth: 0, breakdown: { products: 0, services: 0, delivery: 0 } }
  const userGrowthData = data?.userGrowthData || []
  const userDistribution = data?.userDistribution || { customers: 0, mechanics: 0, delivery: 0 }
  const topProductCategories = data?.topProductCategories || []
  const geographicData = data?.geographicData || []
  const metrics = data?.metrics || {}

  const totalUsers = (userDistribution.customers || 0) + (userDistribution.mechanics || 0) + (userDistribution.delivery || 0)

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(revenueData.current),
      trend: revenueData.growth,
      icon: IndianRupee,
      iconBg: 'bg-emerald-500',
    },
    {
      title: 'Total Orders',
      value: (metrics.totalOrders || 0).toLocaleString(),
      subtitle: 'In selected period',
      icon: ShoppingCart,
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Active Users',
      value: (metrics.activeUsers || 0).toLocaleString(),
      subtitle: 'Platform users',
      icon: Users,
      iconBg: 'bg-violet-500',
    },
    {
      title: 'Service Requests',
      value: metrics.activeServiceRequests || 0,
      subtitle: 'Active requests',
      icon: Wrench,
      iconBg: 'bg-orange-500',
    },
  ]

  const revenueBreakdown = [
    { label: 'Products', amount: revenueData.breakdown.products, color: 'bg-[#1B3B6F]', lightBg: 'bg-blue-50', textColor: 'text-[#1B3B6F]', icon: Package },
    { label: 'Services', amount: revenueData.breakdown.services, color: 'bg-[#FF6B35]', lightBg: 'bg-orange-50', textColor: 'text-[#FF6B35]', icon: Wrench },
    { label: 'Delivery', amount: revenueData.breakdown.delivery, color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-600', icon: Truck },
  ]

  const userTypes = [
    { label: 'Customers', count: userDistribution.customers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', barColor: 'bg-blue-500' },
    { label: 'Mechanics', count: userDistribution.mechanics || 0, icon: Wrench, color: 'text-emerald-600', bg: 'bg-emerald-50', barColor: 'bg-emerald-500' },
    { label: 'Delivery Partners', count: userDistribution.delivery || 0, icon: Truck, color: 'text-violet-600', bg: 'bg-violet-50', barColor: 'bg-violet-500' },
  ]

  const progressColors = ['bg-[#1B3B6F]', 'bg-[#FF6B35]', 'bg-emerald-500', 'bg-violet-500', 'bg-blue-500', 'bg-amber-500']

  return (
    <>
      <AdminHeader />
      <div className="p-5 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1A1D29] tracking-tight">{getTitle()}</h1>
            <p className="text-sm text-gray-500 mt-1">Track performance, revenue, and user engagement</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[150px] bg-white border-gray-200 rounded-xl h-10">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchAnalytics} className="rounded-xl h-10 border-gray-200">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
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
              <Card key={idx} className="border border-gray-100 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">{card.title}</p>
                      <p className="text-2xl lg:text-3xl font-bold text-[#1A1D29] mt-1.5 tracking-tight">{card.value}</p>
                      {card.subtitle && <p className="text-xs text-gray-400 mt-1.5">{card.subtitle}</p>}
                    </div>
                    <div className={`${card.iconBg} h-11 w-11 rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  {card.trend != null && (
                    <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${card.trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {card.trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {card.trend >= 0 ? '+' : ''}{card.trend}% from last period
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 rounded-xl p-1 h-auto w-full max-w-2xl">
            <TabsTrigger value="revenue" className="rounded-lg data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white text-sm py-2.5 px-5 flex-1">
              <IndianRupee className="h-4 w-4 mr-2" /> Revenue
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white text-sm py-2.5 px-5 flex-1">
              <Users className="h-4 w-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white text-sm py-2.5 px-5 flex-1">
              <Package className="h-4 w-4 mr-2" /> Products
            </TabsTrigger>
            <TabsTrigger value="geography" className="rounded-lg data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white text-sm py-2.5 px-5 flex-1">
              <MapPin className="h-4 w-4 mr-2" /> Geography
            </TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Revenue Summary */}
              <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-[#1A1D29]">Revenue Summary</CardTitle>
                  <CardDescription className="text-xs">Performance comparison for selected period</CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                      <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Current Period</p>
                      <p className="text-2xl lg:text-3xl font-bold text-emerald-800 mt-2">{formatFullCurrency(revenueData.current)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Period</p>
                      <p className="text-2xl lg:text-3xl font-bold text-gray-700 mt-2">{formatFullCurrency(revenueData.previous)}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl p-4 flex items-center justify-between bg-gradient-to-r from-[#1B3B6F] to-[#0F2545]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                        {revenueData.growth >= 0
                          ? <TrendingUp className="h-5 w-5 text-emerald-400" />
                          : <TrendingDown className="h-5 w-5 text-red-400" />
                        }
                      </div>
                      <div>
                        <p className="text-xs text-white/70">Growth Rate</p>
                        <p className="text-sm font-medium text-white">vs previous period</p>
                      </div>
                    </div>
                    <span className={`text-2xl font-bold ${revenueData.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {revenueData.growth >= 0 ? '+' : ''}{revenueData.growth}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Breakdown */}
              <Card className="border border-gray-100 shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-[#1A1D29]">Revenue Sources</CardTitle>
                  <CardDescription className="text-xs">Breakdown by category</CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="space-y-4">
                    {revenueBreakdown.map((item, idx) => {
                      const pct = revenueData.current > 0 ? Math.round((item.amount / revenueData.current) * 100) : 0
                      const ItemIcon = item.icon
                      return (
                        <div key={idx} className={`${item.lightBg} rounded-xl p-4`}>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <ItemIcon className={`h-4 w-4 ${item.textColor}`} />
                              <span className="text-sm font-medium text-[#1A1D29]">{item.label}</span>
                            </div>
                            <span className="text-sm font-bold text-[#1A1D29]">{formatCurrency(item.amount)}</span>
                          </div>
                          <div className="w-full bg-white rounded-full h-2">
                            <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1.5">{pct}% of total revenue</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* User Growth */}
              <Card className="border border-gray-100 shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-[#1A1D29]">User Growth</CardTitle>
                  <CardDescription className="text-xs">New registrations by month</CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {userGrowthData.length === 0 ? (
                    <div className="text-center py-10">
                      <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No growth data available</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {userGrowthData.map((month: any, idx: number) => {
                        const total = (month.customers || 0) + (month.mechanics || 0) + (month.delivery || 0)
                        return (
                          <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <span className="text-sm font-semibold text-[#1A1D29] w-10">{month.month}</span>
                            <div className="flex-1 flex items-center gap-1.5 h-6">
                              {month.customers > 0 && (
                                <div className="bg-blue-500 rounded h-full transition-all" style={{ flex: month.customers }} title={`Customers: ${month.customers}`} />
                              )}
                              {month.mechanics > 0 && (
                                <div className="bg-emerald-500 rounded h-full transition-all" style={{ flex: month.mechanics }} title={`Mechanics: ${month.mechanics}`} />
                              )}
                              {month.delivery > 0 && (
                                <div className="bg-violet-500 rounded h-full transition-all" style={{ flex: month.delivery }} title={`Delivery: ${month.delivery}`} />
                              )}
                            </div>
                            <span className="text-xs font-medium text-gray-500 w-8 text-right">{total}</span>
                          </div>
                        )
                      })}
                      {/* Legend */}
                      <div className="flex items-center gap-5 pt-3 border-t border-gray-100 mt-3">
                        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-blue-500" /><span className="text-[11px] text-gray-500">Customers</span></div>
                        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /><span className="text-[11px] text-gray-500">Mechanics</span></div>
                        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-violet-500" /><span className="text-[11px] text-gray-500">Delivery</span></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Distribution */}
              <Card className="border border-gray-100 shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-[#1A1D29]">User Distribution</CardTitle>
                  <CardDescription className="text-xs">Active users by type</CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {/* Total badge */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                    <p className="text-xs text-gray-500 font-medium">Total Users</p>
                    <p className="text-3xl font-bold text-[#1A1D29] mt-1">{totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="space-y-3">
                    {userTypes.map((ut, idx) => {
                      const pct = totalUsers > 0 ? Math.round((ut.count / totalUsers) * 100) : 0
                      const UtIcon = ut.icon
                      return (
                        <div key={idx} className={`${ut.bg} rounded-xl p-4`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <UtIcon className={`h-4 w-4 ${ut.color}`} />
                              <span className="text-sm font-medium text-[#1A1D29]">{ut.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-[#1A1D29]">{ut.count.toLocaleString()}</span>
                              <Badge className="bg-white text-gray-600 border-0 text-[10px] font-semibold px-1.5 h-5">{pct}%</Badge>
                            </div>
                          </div>
                          <div className="w-full bg-white rounded-full h-1.5">
                            <div className={`${ut.barColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-5">
            <Card className="border border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#1A1D29]">Top Product Categories</CardTitle>
                <CardDescription className="text-xs">Performance metrics by product category</CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {topProductCategories.length === 0 ? (
                  <div className="text-center py-10">
                    <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No category data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topProductCategories.map((category: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg ${progressColors[index % progressColors.length].replace('bg-', 'bg-')}/10 flex items-center justify-center`}>
                              <span className="text-xs font-bold text-[#1A1D29]">#{index + 1}</span>
                            </div>
                            <span className="text-sm font-semibold text-[#1A1D29]">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-[#1A1D29]">{formatCurrency(category.revenue)}</span>
                            <Badge className="bg-gray-200 text-gray-600 border-0 text-[10px] font-semibold h-5">{category.orders} orders</Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${progressColors[index % progressColors.length]} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(category.percentage || 0, 100)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5">{category.percentage}% of total revenue</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geography Tab */}
          <TabsContent value="geography" className="space-y-5">
            <Card className="border border-gray-100 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#1A1D29]">Performance by City</CardTitle>
                <CardDescription className="text-xs">Revenue and order distribution across locations</CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {geographicData.length === 0 ? (
                  <div className="text-center py-10">
                    <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No geographic data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {geographicData.map((city: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-xl bg-[#1B3B6F]/10 flex items-center justify-center group-hover:bg-[#1B3B6F]/20 transition-colors">
                            <MapPin className="h-5 w-5 text-[#1B3B6F]" />
                          </div>
                          <h3 className="text-base font-semibold text-[#1A1D29]">{city.city}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Revenue</p>
                            <p className="text-lg font-bold text-[#1A1D29] mt-0.5">{formatCurrency(city.revenue)}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Orders</p>
                            <p className="text-lg font-bold text-[#1A1D29] mt-0.5">{(city.orders || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
