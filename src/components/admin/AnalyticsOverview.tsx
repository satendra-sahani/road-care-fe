'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Wrench,
  Calendar,
  Download,
  Filter,
  RefreshCw
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
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

// Mock analytics data
const revenueData = {
  current: 1250000,
  previous: 1180000,
  growth: 5.9,
  breakdown: {
    products: 750000,
    services: 400000,
    delivery: 100000
  }
}

const userGrowthData = [
  { month: 'Jan', customers: 1200, mechanics: 45, delivery: 23 },
  { month: 'Feb', customers: 1350, mechanics: 52, delivery: 28 },
  { month: 'Mar', customers: 1480, mechanics: 58, delivery: 32 },
  { month: 'Apr', customers: 1620, mechanics: 65, delivery: 38 },
  { month: 'May', customers: 1750, mechanics: 72, delivery: 42 },
  { month: 'Jun', customers: 1890, mechanics: 78, delivery: 48 }
]

const topProductCategories = [
  { name: 'Engine Parts', revenue: 450000, percentage: 36, orders: 1234 },
  { name: 'Brake System', revenue: 320000, percentage: 26, orders: 987 },
  { name: 'Electrical', revenue: 280000, percentage: 22, orders: 756 },
  { name: 'Tyres & Tubes', revenue: 150000, percentage: 12, orders: 345 },
  { name: 'Body Parts', revenue: 50000, percentage: 4, orders: 123 }
]

const geographicData = [
  { city: 'Mumbai', revenue: 425000, orders: 2341, growth: 12.5 },
  { city: 'Delhi', revenue: 385000, orders: 2156, growth: 8.7 },
  { city: 'Bangalore', revenue: 295000, orders: 1845, growth: 15.2 },
  { city: 'Chennai', revenue: 185000, orders: 1234, growth: 6.9 },
  { city: 'Pune', revenue: 160000, orders: 987, growth: 9.8 }
]

const conversionFunnelData = [
  { stage: 'Website Visitors', count: 125000, percentage: 100 },
  { stage: 'Product Views', count: 85000, percentage: 68 },
  { stage: 'Add to Cart', count: 35000, percentage: 28 },
  { stage: 'Checkout Started', count: 28000, percentage: 22 },
  { stage: 'Orders Completed', count: 24500, percentage: 19.6 }
]

interface AnalyticsOverviewProps {
  type?: 'overview' | 'revenue' | 'performance' | 'general'
}

export function AnalyticsOverview({ type = 'overview' }: AnalyticsOverviewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [isLoading, setIsLoading] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  const getTitle = () => {
    switch (type) {
      case 'revenue':
        return 'Revenue Analytics'
      case 'performance':
        return 'Performance Analytics'
      case 'general':
        return 'Analytics Dashboard'
      default:
        return 'Analytics Overview'
    }
  }

  const getDescription = () => {
    switch (type) {
      case 'revenue':
        return 'Track revenue trends, income sources, and financial performance'
      case 'performance':
        return 'Monitor platform performance, user engagement, and system metrics'
      case 'general':
        return 'Comprehensive analytics and business intelligence dashboard'
      default:
        return 'Comprehensive view of your platform analytics and performance metrics'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">{getTitle()}</h1>
          <p className="text-[#6B7280] mt-1">{getDescription()}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {type === 'revenue' ? (
        // Revenue-specific metrics
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-[#1B3B6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1D29]">
                {formatCurrency(revenueData.current)}
              </div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{revenueData.growth}% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Product Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-[#1B3B6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1D29]">
                {formatCurrency(revenueData.breakdown.products)}
              </div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15.2% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Service Revenue</CardTitle>
              <Wrench className="h-4 w-4 text-[#1B3B6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1D29]">
                {formatCurrency(revenueData.breakdown.services)}
              </div>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +22.8% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Delivery Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-[#1B3B6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1D29]">
                {formatCurrency(revenueData.breakdown.delivery)}
              </div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.1% from last period
              </div>
            </CardContent>
          </Card>
        </div>
      ) : type === 'performance' ? (
        // Performance-specific metrics
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Page Load Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#1B3B6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1D29]">1.2s</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingDown className="h-3 w-3 mr-1" />
                -15% faster
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Conversion Rate</CardTitle>
              <BarChart className="h-4 w-4 text-[#1B3B6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1D29]">3.4%</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +0.8% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Bounce Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-[#1B3B6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1D29]">42.1%</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingDown className="h-3 w-3 mr-1" />
                -5.2% improvement
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">User Engagement</CardTitle>
              <Users className="h-4 w-4 text-[#1B3B6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1D29]">4.7 min</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last period
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Default overview metrics
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-[#1B3B6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1D29]">
                {formatCurrency(revenueData.current)}
              </div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{revenueData.growth}% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-[#1B3B6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1D29]">5,847</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.3% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Active Users</CardTitle>
              <Users className="h-4 w-4 text-[#1B3B6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1D29]">18,945</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.7% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">Service Requests</CardTitle>
              <Wrench className="h-4 w-4 text-[#1B3B6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1D29]">892</div>
              <div className="flex items-center text-xs text-red-600 mt-1">
                <TrendingDown className="h-3 w-3 mr-1" />
                -2.1% from last period
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
        </TabsList>

        {/* Revenue Analytics */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Revenue Chart Placeholder</p>
                    <p className="text-sm text-gray-400">Integration with charting library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Revenue by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Products</span>
                    <span className="text-sm text-[#6B7280]">{formatCurrency(revenueData.breakdown.products)}</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Services</span>
                    <span className="text-sm text-[#6B7280]">{formatCurrency(revenueData.breakdown.services)}</span>
                  </div>
                  <Progress value={32} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Delivery</span>
                    <span className="text-sm text-[#6B7280]">{formatCurrency(revenueData.breakdown.delivery)}</span>
                  </div>
                  <Progress value={8} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Analytics */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">User Growth Chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Current active users by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium">Customers</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">15,678</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <Wrench className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium">Mechanics</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">234</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <ShoppingCart className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="font-medium">Delivery Partners</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">156</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Product Analytics */}
        <TabsContent value="products" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Top Product Categories</CardTitle>
              <CardDescription>Performance metrics by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProductCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[#1A1D29]">{category.name}</span>
                        <span className="text-sm text-[#6B7280]">{category.orders} orders</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#1B3B6F] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-[#6B7280]">{category.percentage}% of total</span>
                        <span className="text-sm font-medium">{formatCurrency(category.revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Analytics */}
        <TabsContent value="geography" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Performance by City</CardTitle>
              <CardDescription>Revenue and order distribution across major cities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {geographicData.map((city, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-[#1A1D29]">{city.city}</h3>
                      <Badge className={`${city.growth > 10 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        +{city.growth}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[#6B7280]">Revenue</span>
                        <span className="text-sm font-medium">{formatCurrency(city.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[#6B7280]">Orders</span>
                        <span className="text-sm font-medium">{city.orders.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Analytics */}
        <TabsContent value="conversion" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>User journey from visitor to customer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnelData.map((stage, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[#1A1D29]">{stage.stage}</span>
                      <span className="text-sm text-[#6B7280]">{stage.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8 relative">
                      <div
                        className="bg-gradient-to-r from-[#1B3B6F] to-[#2E5090] h-8 rounded-full transition-all duration-500 flex items-center justify-between px-4"
                        style={{ width: `${stage.percentage}%` }}
                      >
                        <span className="text-white font-medium">{stage.count.toLocaleString()}</span>
                      </div>
                    </div>
                    {index < conversionFunnelData.length - 1 && (
                      <div className="absolute right-0 top-full mt-2 text-xs text-red-600">
                        -{((conversionFunnelData[index].count - conversionFunnelData[index + 1].count) / conversionFunnelData[index].count * 100).toFixed(1)}% drop-off
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}