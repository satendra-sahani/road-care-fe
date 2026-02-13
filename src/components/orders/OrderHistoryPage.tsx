'use client'

import * as React from 'react'
import { useState } from 'react'
import { 
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Calendar,
  MapPin,
  Phone,
  Star,
  Search,
  Filter,
  Download,
  RefreshCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

// Mock order data
const mockOrders = [
  {
    id: 'ORD-2024-001',
    date: '2024-01-15T10:30:00Z',
    status: 'Delivered',
    total: 6847,
    items: [
      {
        id: 'ITEM-001',
        name: 'Premium Brake Pads Set - Front',
        brand: 'Bosch',
        price: 3499,
        quantity: 2,
        image: '/products/brake-pads-1.jpg'
      },
      {
        id: 'ITEM-002',
        name: 'Engine Oil Filter',
        brand: 'Mann-Filter',
        price: 849,
        quantity: 1,
        image: '/products/oil-filter-1.jpg'
      }
    ],
    tracking: {
      carrier: 'BlueDart',
      trackingNumber: 'BD123456789IN',
      estimatedDelivery: '2024-01-16T18:00:00Z',
      currentLocation: 'Delivered',
      timeline: [
        { status: 'Ordered', date: '2024-01-15T10:30:00Z', completed: true },
        { status: 'Confirmed', date: '2024-01-15T11:00:00Z', completed: true },
        { status: 'Shipped', date: '2024-01-15T16:00:00Z', completed: true },
        { status: 'Out for Delivery', date: '2024-01-16T09:00:00Z', completed: true },
        { status: 'Delivered', date: '2024-01-16T15:30:00Z', completed: true }
      ]
    },
    deliveryAddress: {
      name: 'Rajesh Kumar',
      address: '123, Sector 15, Gurgaon, Haryana - 122001',
      phone: '+91 98765 43210'
    },
    canCancel: false,
    canReturn: true,
    canReview: true
  },
  {
    id: 'ORD-2024-002',
    date: '2024-01-20T14:15:00Z',
    status: 'Shipped',
    total: 2299,
    items: [
      {
        id: 'ITEM-003',
        name: 'LED Headlight Bulbs - H4 Type',
        brand: 'Philips',
        price: 2299,
        quantity: 1,
        image: '/products/led-headlight-1.jpg'
      }
    ],
    tracking: {
      carrier: 'Delhivery',
      trackingNumber: 'DL987654321IN',
      estimatedDelivery: '2024-01-22T18:00:00Z',
      currentLocation: 'Gurgaon Hub',
      timeline: [
        { status: 'Ordered', date: '2024-01-20T14:15:00Z', completed: true },
        { status: 'Confirmed', date: '2024-01-20T14:45:00Z', completed: true },
        { status: 'Shipped', date: '2024-01-20T18:00:00Z', completed: true },
        { status: 'Out for Delivery', date: '', completed: false },
        { status: 'Delivered', date: '', completed: false }
      ]
    },
    deliveryAddress: {
      name: 'Rajesh Kumar',
      address: '123, Sector 15, Gurgaon, Haryana - 122001',
      phone: '+91 98765 43210'
    },
    canCancel: true,
    canReturn: false,
    canReview: false
  },
  {
    id: 'ORD-2024-003',
    date: '2024-01-18T09:20:00Z',
    status: 'Processing',
    total: 1599,
    items: [
      {
        id: 'ITEM-004',
        name: 'Air Freshener - Lavender',
        brand: 'Godrej',
        price: 299,
        quantity: 3,
        image: '/products/air-freshener-1.jpg'
      },
      {
        id: 'ITEM-005',
        name: 'Car Wash Shampoo',
        brand: '3M',
        price: 699,
        quantity: 1,
        image: '/products/car-wash-1.jpg'
      }
    ],
    tracking: {
      carrier: 'Ekart',
      trackingNumber: 'EK456789123IN',
      estimatedDelivery: '2024-01-23T18:00:00Z',
      currentLocation: 'Processing Center',
      timeline: [
        { status: 'Ordered', date: '2024-01-18T09:20:00Z', completed: true },
        { status: 'Confirmed', date: '2024-01-18T10:00:00Z', completed: true },
        { status: 'Shipped', date: '', completed: false },
        { status: 'Out for Delivery', date: '', completed: false },
        { status: 'Delivered', date: '', completed: false }
      ]
    },
    deliveryAddress: {
      name: 'Rajesh Kumar',
      address: '456, DLF Phase 2, Gurgaon, Haryana - 122002',
      phone: '+91 98765 43211'
    },
    canCancel: true,
    canReturn: false,
    canReview: false
  }
]

export function OrderHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null)
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'shipped':
      case 'out for delivery':
        return <Truck className="h-4 w-4 text-blue-600" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'shipped':
      case 'out for delivery':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    } else if (sortBy === 'oldest') {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    } else if (sortBy === 'amount-high') {
      return b.total - a.total
    } else if (sortBy === 'amount-low') {
      return a.total - b.total
    }
    return 0
  })

  const handleCancelOrder = (orderId: string) => {
    // Handle order cancellation
    setShowCancelModal(false)
    setCancelReason('')
  }

  const orderStats = {
    total: mockOrders.length,
    delivered: mockOrders.filter(o => o.status.toLowerCase() === 'delivered').length,
    inProgress: mockOrders.filter(o => ['processing', 'shipped', 'out for delivery'].includes(o.status.toLowerCase())).length,
    cancelled: mockOrders.filter(o => o.status.toLowerCase() === 'cancelled').length
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">Order History</h1>
          <p className="text-[#6B7280] mt-1">{mockOrders.length} orders found</p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1D29]">{orderStats.total}</p>
                <p className="text-sm text-[#6B7280]">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1D29]">{orderStats.delivered}</p>
                <p className="text-sm text-[#6B7280]">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1D29]">{orderStats.inProgress}</p>
                <p className="text-sm text-[#6B7280]">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1D29]">{orderStats.cancelled}</p>
                <p className="text-sm text-[#6B7280]">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount-high">Amount: High to Low</SelectItem>
                  <SelectItem value="amount-low">Amount: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Order Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-[#6B7280]">
                      Order #{order.id}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-[#6B7280]">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(order.date)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Package className="h-4 w-4" />
                      <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="text-lg font-bold text-[#1A1D29]">
                    {formatCurrency(order.total)}
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="flex-1 max-w-lg">
                  <div className="flex items-center space-x-3">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={item.id} className="relative">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.png'
                            }}
                          />
                        </div>
                        {item.quantity > 1 && (
                          <div className="absolute -top-2 -right-2 bg-[#1B3B6F] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {item.quantity}
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-[#6B7280]">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Dialog open={showTrackingModal && selectedOrder?.id === order.id} onOpenChange={setShowTrackingModal}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Track Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Track Order #{order.id}</DialogTitle>
                      </DialogHeader>
                      {selectedOrder && (
                        <div className="space-y-6">
                          {/* Tracking Info */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-[#6B7280]">Carrier</p>
                                <p className="font-medium">{selectedOrder.tracking.carrier}</p>
                              </div>
                              <div>
                                <p className="text-[#6B7280]">Tracking Number</p>
                                <p className="font-medium">{selectedOrder.tracking.trackingNumber}</p>
                              </div>
                              <div>
                                <p className="text-[#6B7280]">Current Location</p>
                                <p className="font-medium">{selectedOrder.tracking.currentLocation}</p>
                              </div>
                              <div>
                                <p className="text-[#6B7280]">Expected Delivery</p>
                                <p className="font-medium">
                                  {formatDate(selectedOrder.tracking.estimatedDelivery)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div>
                            <h4 className="font-medium mb-4">Tracking Timeline</h4>
                            <div className="space-y-4">
                              {selectedOrder.tracking.timeline.map((event, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      event.completed ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                                  />
                                  <div className="flex-1">
                                    <p className={`font-medium ${
                                      event.completed ? 'text-[#1A1D29]' : 'text-[#6B7280]'
                                    }`}>
                                      {event.status}
                                    </p>
                                    {event.date && (
                                      <p className="text-sm text-[#6B7280]">
                                        {formatDate(event.date)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delivery Address */}
                          <div>
                            <h4 className="font-medium mb-2">Delivery Address</h4>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="font-medium">{selectedOrder.deliveryAddress.name}</p>
                              <p className="text-sm text-[#6B7280]">{selectedOrder.deliveryAddress.address}</p>
                              <p className="text-sm text-[#6B7280]">{selectedOrder.deliveryAddress.phone}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {order.canCancel && (
                    <Dialog open={showCancelModal && selectedOrder?.id === order.id} onOpenChange={setShowCancelModal}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Cancel Order
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Order #{order.id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-[#6B7280]">
                            Are you sure you want to cancel this order? This action cannot be undone.
                          </p>
                          <div>
                            <label className="text-sm font-medium text-[#1A1D29] mb-2 block">
                              Reason for cancellation (optional)
                            </label>
                            <Textarea
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              placeholder="Please let us know why you're cancelling..."
                              rows={3}
                            />
                          </div>
                          <div className="flex space-x-2 pt-4">
                            <Button
                              onClick={() => handleCancelOrder(order.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Cancel Order
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowCancelModal(false)
                                setCancelReason('')
                              }}
                            >
                              Keep Order
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {order.canReturn && (
                    <Button variant="outline">
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Return
                    </Button>
                  )}

                  {order.canReview && (
                    <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                      <Star className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  )}
                </div>
              </div>

              {/* Order Items Details (Expandable) */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-[#1B3B6F] hover:text-[#0F2545] flex items-center">
                  <span>View order details</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </summary>
                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-product.png'
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <Badge variant="secondary" className="text-xs mb-1">
                          {item.brand}
                        </Badge>
                        <h4 className="font-medium text-[#1A1D29]">{item.name}</h4>
                        <p className="text-sm text-[#6B7280]">
                          Quantity: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#1A1D29]">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#1A1D29] mb-2">No orders found</h3>
              <p className="text-[#6B7280] mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? "Try adjusting your search or filter criteria"
                  : "You haven't placed any orders yet"}
              </p>
              <Link href="/shop">
                <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                  Start Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}