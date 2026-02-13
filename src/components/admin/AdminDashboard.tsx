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
  Filter,
  Download
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
import { Progress } from '@/components/ui/progress'

// Mock data
const kpiData = {
  totalRevenue: {
    value: 125840,
    change: 12.5,
    trend: 'up',
    period: 'vs last month'
  },
  activeOrders: {
    value: 342,
    change: -2.3,
    trend: 'down',
    period: 'vs last week'
  },
  totalUsers: {
    value: 15679,
    change: 8.7,
    trend: 'up',
    period: 'vs last month'
  },
  serviceRequests: {
    value: 89,
    change: 15.2,
    trend: 'up',
    period: 'vs last week'
  }
}

const recentOrders = [
  {
    id: 'ORD-001',
    customer: 'John Smith',
    product: 'Brake Pads Set',
    amount: 2580,
    status: 'shipped',
    timestamp: '2 hours ago'
  },
  {
    id: 'ORD-002',
    customer: 'Sarah Johnson',
    product: 'Engine Oil Change',
    amount: 1200,
    status: 'processing',
    timestamp: '4 hours ago'
  },
  {
    id: 'ORD-003',
    customer: 'Mike Wilson',
    product: 'Tire Replacement',
    amount: 8900,
    status: 'pending',
    timestamp: '6 hours ago'
  },
  {
    id: 'ORD-004',
    customer: 'Emily Davis',
    product: 'AC Service',
    amount: 3400,
    status: 'completed',
    timestamp: '1 day ago'
  },
  {
    id: 'ORD-005',
    customer: 'Robert Brown',
    product: 'Battery Replacement',
    amount: 4500,
    status: 'shipped',
    timestamp: '1 day ago'
  }
]

const topCategories = [
  { name: 'Engine Parts', revenue: 45000, percentage: 35, change: 8.2 },
  { name: 'Brake System', revenue: 32000, percentage: 25, change: 12.1 },
  { name: 'Electrical', revenue: 28000, percentage: 22, change: -3.4 },
  { name: 'Tyres & Tubes', revenue: 18000, percentage: 14, change: 5.7 },
  { name: 'Body Parts', revenue: 8000, percentage: 6, change: -1.2 }
]

const recentActivities = [
  {
    id: 1,
    type: 'order',
    message: 'New order #ORD-001 placed by John Smith',
    timestamp: '5 minutes ago',
    status: 'new'
  },
  {
    id: 2,
    type: 'user',
    message: 'New mechanic registered: Mike Johnson',
    timestamp: '15 minutes ago',
    status: 'success'
  },
  {
    id: 3,
    type: 'service',
    message: 'Service request completed by Alex Brown',
    timestamp: '30 minutes ago',
    status: 'completed'
  },
  {
    id: 4,
    type: 'payment',
    message: 'Payment of ₹2,580 received for order #ORD-001',
    timestamp: '45 minutes ago',
    status: 'success'
  },
  {
    id: 5,
    type: 'inventory',
    message: 'Low stock alert: Brake pads quantity below threshold',
    timestamp: '1 hour ago',
    status: 'warning'
  }
]

export function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      shipped: { color: 'bg-purple-100 text-purple-800', label: 'Shipped' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-4 w-4 text-blue-600" />
      case 'user': return <Users className="h-4 w-4 text-green-600" />
      case 'service': return <Wrench className="h-4 w-4 text-purple-600" />
      case 'payment': return <DollarSign className="h-4 w-4 text-green-600" />
      case 'inventory': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Eye className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">Dashboard Overview</h1>
          <p className="text-[#6B7280] mt-1">Welcome back! Here's what's happening with your platform.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#1B3B6F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1D29]">
              {formatCurrency(kpiData.totalRevenue.value)}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{kpiData.totalRevenue.change}% {kpiData.totalRevenue.period}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">Active Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-[#1B3B6F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1D29]">
              {kpiData.activeOrders.value.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <TrendingDown className="h-3 w-3 mr-1" />
              {kpiData.activeOrders.change}% {kpiData.activeOrders.period}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">Total Users</CardTitle>
            <Users className="h-4 w-4 text-[#1B3B6F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1D29]">
              {kpiData.totalUsers.value.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{kpiData.totalUsers.change}% {kpiData.totalUsers.period}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">Service Requests</CardTitle>
            <Wrench className="h-4 w-4 text-[#1B3B6F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1D29]">
              {kpiData.serviceRequests.value}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{kpiData.serviceRequests.change}% {kpiData.serviceRequests.period}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#1A1D29]">Recent Orders</CardTitle>
                <CardDescription>Latest order transactions and their status</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-[#1A1D29]">{order.id}</h4>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-[#6B7280] mt-1">{order.customer} • {order.product}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">{order.timestamp}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#1A1D29]">{formatCurrency(order.amount)}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Update Status</DropdownMenuItem>
                        <DropdownMenuItem>Contact Customer</DropdownMenuItem>
                        <DropdownMenuItem>Print Invoice</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1A1D29]">Recent Activities</CardTitle>
            <CardDescription>Latest platform activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1A1D29]">{activity.message}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1A1D29]">Top Categories by Revenue</CardTitle>
          <CardDescription>Best performing product categories this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#1A1D29]">{category.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-[#1A1D29]">
                        {formatCurrency(category.revenue)}
                      </span>
                      <span className={`text-xs flex items-center ${
                        category.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {category.change > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(category.change)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#1B3B6F] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-[#6B7280] mt-1">{category.percentage}% of total revenue</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}