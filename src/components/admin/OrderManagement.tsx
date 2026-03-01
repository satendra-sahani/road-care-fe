// @ts-nocheck
'use client'

import * as React from 'react'
import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  IndianRupee,
  CreditCard,
  Users,
  ShoppingBag,
  User,
  BadgeCheck,
  TrendingUp,
  FileText,
  Star,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Order, OrderFilters, Customer } from '@/types'
import { cn } from '@/lib/utils'
import { orderAPI } from '@/services/api'
import { CreateOrderDialog } from './CreateOrderDialog'

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  // Stats from API
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  })

  // Dialog states
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false)
  const [isAssignDeliveryOpen, setIsAssignDeliveryOpen] = useState(false)
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    trackingNumber: '',
    courierPartner: '',
    estimatedDelivery: '',
    notes: ''
  })
  const [deliveryAssignment, setDeliveryAssignment] = useState({
    partnerId: '',
    priority: 'normal',
    estimatedDelivery: '',
    specialInstructions: ''
  })

  // Delivery boys from API
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([])

  // Status configuration
  const statusConfig = {
    placed: { label: 'Placed', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
    confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    processing: { label: 'Processing', className: 'bg-orange-100 text-orange-800', icon: Package },
    packed: { label: 'Packed', className: 'bg-purple-100 text-purple-800', icon: Package },
    shipped: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-800', icon: Truck },
    out_for_delivery: { label: 'Out for Delivery', className: 'bg-cyan-100 text-cyan-800', icon: Truck },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800', icon: XCircle },
    return_requested: { label: 'Return Requested', className: 'bg-amber-100 text-amber-800', icon: RefreshCw },
    returned: { label: 'Returned', className: 'bg-gray-100 text-gray-800', icon: RefreshCw }
  }

  const paymentStatusConfig = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
    refunded: { label: 'Refunded', className: 'bg-blue-100 text-blue-800' },
    'partially-refunded': { label: 'Partially Refunded', className: 'bg-orange-100 text-orange-800' }
  }

  const paymentMethodConfig = {
    upi: { label: 'UPI', className: 'bg-green-100 text-green-800', icon: CreditCard },
    card: { label: 'Card', className: 'bg-blue-100 text-blue-800', icon: CreditCard },
    cod: { label: 'Cash on Delivery', className: 'bg-orange-100 text-orange-800', icon: IndianRupee },
    netbanking: { label: 'Net Banking', className: 'bg-purple-100 text-purple-800', icon: CreditCard },
    wallet: { label: 'Wallet', className: 'bg-yellow-100 text-yellow-800', icon: CreditCard }
  }

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      }
      if (selectedStatus !== 'all') params.status = selectedStatus
      if (selectedPaymentStatus !== 'all') params.paymentStatus = selectedPaymentStatus
      if (selectedPaymentMethod !== 'all') params.paymentMethod = selectedPaymentMethod
      if (searchTerm) params.search = searchTerm

      const response = await orderAPI.getAll(params)
      const data = response.data
      const rawOrders = data.orders || data.data || []

      // Transform backend order data to match frontend types
      const mappedOrders = rawOrders.map((order: any) => ({
        ...order,
        id: order._id || order.id,
        orderNumber: order.orderId || order.orderNumber || order._id,
        customer: order.customer ? {
          id: order.customer._id || order.customer.id,
          name: order.customer.fullName || order.customer.name || 'Unknown',
          email: order.customer.email || '',
          phone: order.customer.phone || '',
          avatar: order.customer.avatar || '',
        } : { id: '', name: 'Unknown', email: '', phone: '', avatar: '' },
        products: (order.items || order.products || []).map((item: any) => ({
          productId: item.product?._id || item.product || item.productId,
          name: item.name || item.product?.name || 'Unknown Product',
          sku: item.sku || item.product?.sku || '',
          quantity: item.quantity,
          price: item.price,
          total: item.total || item.price * item.quantity,
          thumbnail: item.thumbnail || item.product?.thumbnail?.url || '',
        })),
        totalAmount: order.totalAmount || 0,
        shippingCharges: order.shippingCharge || order.shippingCharges || 0,
        subtotal: order.subtotal || 0,
        paymentMethod: order.paymentMethod || 'cod',
        paymentStatus: order.paymentStatus || 'pending',
        status: order.status || 'placed',
        shippingAddress: order.shippingAddress ? {
          name: order.shippingAddress.fullName || order.shippingAddress.name || '',
          phone: order.shippingAddress.phone || '',
          addressLine1: order.shippingAddress.address || order.shippingAddress.addressLine1 || '',
          addressLine2: order.shippingAddress.addressLine2 || '',
          landmark: order.shippingAddress.landmark || '',
          city: order.shippingAddress.city || '',
          state: order.shippingAddress.state || '',
          pincode: order.shippingAddress.pincode || '',
        } : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        notes: order.notes || '',
        timeline: order.timeline || [],
        deliveryBoy: order.deliveryBoy,
      }))

      setOrders(mappedOrders)
      setTotalPages(data.totalPages || data.pagination?.pages || 1)
      setTotalOrders(data.totalOrders || data.pagination?.total || 0)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, selectedStatus, selectedPaymentStatus, selectedPaymentMethod, searchTerm])

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const response = await orderAPI.getStats()
      const raw = response.data?.data || response.data || {}

      // Map backend stats shape to frontend expected shape
      const byStatus = raw.byStatus || {}
      const revenue = raw.revenue || {}

      setStats({
        totalOrders: raw.total || revenue.totalOrders || raw.totalOrders || 0,
        pendingOrders: (byStatus.placed || 0) + (byStatus.pending || 0) + (byStatus.confirmed || 0),
        processingOrders: byStatus.processing || raw.processingOrders || 0,
        shippedOrders: (byStatus.shipped || 0) + (byStatus.out_for_delivery || 0) + (raw.shippedOrders || 0),
        deliveredOrders: byStatus.delivered || raw.deliveredOrders || 0,
        totalRevenue: revenue.totalRevenue || raw.totalRevenue || 0,
        averageOrderValue: revenue.avgOrderValue || raw.averageOrderValue || 0,
      })
    } catch {
      // silently ignore stats errors
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch delivery boys from API
  const fetchDeliveryBoys = useCallback(async () => {
    try {
      const response = await orderAPI.getDeliveryBoys()
      const data = response.data
      setDeliveryBoys(data.deliveryBoys || data.data || [])
    } catch {
      // silently ignore
    }
  }, [])

  // Load data on mount and when filters/page change
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    fetchStats()
    fetchDeliveryBoys()
  }, [fetchStats, fetchDeliveryBoys])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedStatus, selectedPaymentStatus, selectedPaymentMethod, searchTerm])

  // The orders are already paginated from the server
  const paginatedOrders = orders

  // Order Management Operations
  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return
    setActionLoading(true)
    try {
      await orderAPI.updateStatus(selectedOrder.id || selectedOrder._id, {
        status: statusUpdateData.status,
        note: statusUpdateData.notes || undefined,
      })
      setIsUpdateStatusOpen(false)
      setSelectedOrder(null)
      setStatusUpdateData({
        status: '',
        trackingNumber: '',
        courierPartner: '',
        estimatedDelivery: '',
        notes: ''
      })
      // Refresh data
      fetchOrders()
      fetchStats()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update order status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkStatusUpdate = async (status: Order['status']) => {
    setActionLoading(true)
    try {
      await Promise.all(
        selectedOrders.map(orderId =>
          orderAPI.updateStatus(orderId, { status })
        )
      )
      setSelectedOrders([])
      fetchOrders()
      fetchStats()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update orders')
    } finally {
      setActionLoading(false)
    }
  }

  const openStatusUpdateDialog = (order: Order) => {
    setSelectedOrder(order)
    setStatusUpdateData({
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      courierPartner: order.courierPartner || '',
      estimatedDelivery: order.estimatedDelivery || '',
      notes: order.notes || ''
    })
    setIsUpdateStatusOpen(true)
  }

  const openDeliveryAssignmentDialog = (order: Order) => {
    setSelectedOrder(order)
    setDeliveryAssignment({
      partnerId: '',
      priority: 'normal',
      estimatedDelivery: '',
      specialInstructions: ''
    })
    setIsAssignDeliveryOpen(true)
  }

  const handleAssignDelivery = async () => {
    if (selectedOrder && deliveryAssignment.partnerId) {
      setActionLoading(true)
      try {
        await orderAPI.assignDelivery(
          selectedOrder.id || selectedOrder._id,
          deliveryAssignment.partnerId
        )
        setIsAssignDeliveryOpen(false)
        setSelectedOrder(null)
        setDeliveryAssignment({
          partnerId: '',
          priority: 'normal',
          estimatedDelivery: '',
          specialInstructions: ''
        })
        // Refresh data
        fetchOrders()
        fetchStats()
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to assign delivery')
      } finally {
        setActionLoading(false)
      }
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1A1D29]">Order Management</h1>
          <p className="text-[#6B7280] mt-1 text-sm sm:text-base">Manage customer orders, track deliveries, and handle returns</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <Button variant="outline" className="text-sm">
            <Download className="h-4 w-4 mr-2" />
            Export Orders
          </Button>
          <Button
            variant="outline"
            className="text-sm"
            onClick={() => { fetchOrders(); fetchStats(); }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync Orders
          </Button>
          <Button className="bg-[#1B3B6F] hover:bg-[#0F2545] text-sm" onClick={() => setIsCreateOrderOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError('')}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Order Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5 text-[#1B3B6F]" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.totalOrders}</p>
                <p className="text-xs text-[#6B7280]">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.pendingOrders}</p>
                <p className="text-xs text-[#6B7280]">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.processingOrders}</p>
                <p className="text-xs text-[#6B7280]">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.shippedOrders}</p>
                <p className="text-xs text-[#6B7280]">Shipped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{stats.deliveredOrders}</p>
                <p className="text-xs text-[#6B7280]">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xl font-bold text-[#1A1D29]">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-[#6B7280]">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-xl font-bold text-[#1A1D29]">{formatCurrency(stats.averageOrderValue)}</p>
                <p className="text-xs text-[#6B7280]">Avg Order Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search orders, customer name, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="packed">Packed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Payment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="COD">COD</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Debit Card">Debit Card</SelectItem>
                      <SelectItem value="Net Banking">Net Banking</SelectItem>
                      <SelectItem value="Wallet">Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedOrders.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-blue-800">
                    {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBulkStatusUpdate('confirmed')}
                    >
                      Mark Confirmed
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBulkStatusUpdate('processing')}
                    >
                      Mark Processing
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBulkStatusUpdate('shipped')}
                    >
                      Mark Shipped
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => setSelectedOrders([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] sticky left-0 bg-white z-10">
                      <Checkbox
                        checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOrders(paginatedOrders.map(o => o.id || o._id))
                          } else {
                            setSelectedOrders([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="min-w-[120px]">Order</TableHead>
                    <TableHead className="min-w-[200px]">Customer</TableHead>
                    <TableHead className="min-w-[150px]">Products</TableHead>
                    <TableHead className="min-w-[100px]">Amount</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Payment</TableHead>
                    <TableHead className="min-w-[100px]">Feedback</TableHead>
                    <TableHead className="min-w-[120px]">Date</TableHead>
                    <TableHead className="text-right min-w-[80px] sticky right-0 bg-white z-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-400">Loading orders...</p>
                      </TableCell>
                    </TableRow>
                  ) : paginatedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-[#1A1D29]">No orders found</p>
                        <p className="text-[#6B7280]">Try adjusting your search or filter criteria</p>
                      </TableCell>
                    </TableRow>
                  ) : paginatedOrders.map((order) => (
                    <TableRow key={order.id || order._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id || order._id)}
                          onCheckedChange={(checked) => {
                            const orderId = order.id || order._id
                            if (checked) {
                              setSelectedOrders(prev => [...prev, orderId])
                            } else {
                              setSelectedOrders(prev => prev.filter(id => id !== orderId))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-[#1A1D29]">{order.orderNumber}</p>
                          {order.trackingNumber && (
                            <p className="text-sm text-[#6B7280]">Track: {order.trackingNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={order.customer?.avatar} alt={order.customer?.name} />
                            <AvatarFallback>
                              {(order.customer?.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <button
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowUserDetails(true)
                              }}
                              className="font-medium text-[#1B3B6F] hover:text-[#1B3B6F]/80 hover:underline cursor-pointer transition-colors text-left"
                            >
                              {order.customer?.name || 'Unknown'}
                            </button>
                            <p className="text-sm text-[#6B7280]">{order.customer?.email || '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{(order.products || []).length} item{(order.products || []).length > 1 ? 's' : ''}</p>
                          <p className="text-sm text-[#6B7280]">
                            {order.products?.[0]?.name}
                            {(order.products || []).length > 1 && ` +${(order.products || []).length - 1} more`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-[#1A1D29]">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-sm text-[#6B7280]">via {order.paymentMethod}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[order.status]?.className || 'bg-gray-100 text-gray-800'}>
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentStatusConfig[order.paymentStatus]?.className || 'bg-gray-100 text-gray-800'}>
                          {paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(order.status === 'delivered' || order.status === 'completed') ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex items-center gap-1 hover:bg-blue-50 text-blue-600"
                            onClick={() => {
                              setSelectedOrder(order)
                              setIsFeedbackDialogOpen(true)
                            }}
                          >
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">View Feedback</span>
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-400">No feedback yet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDate(order.orderDate || order.createdAt)}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedOrder(order)
                              setIsViewDialogOpen(true)
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openStatusUpdateDialog(order)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeliveryAssignmentDialog(order)}
                              disabled={order.status === 'delivered' || order.status === 'cancelled'}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Assign Delivery Boy
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={async () => {
                              try {
                                const res = await orderAPI.downloadInvoice(order.id || order._id)
                                const blob = new Blob([res.data], { type: 'application/pdf' })
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `invoice-${order.orderNumber || order.id || order._id}.pdf`
                                document.body.appendChild(a)
                                a.click()
                                window.URL.revokeObjectURL(url)
                                document.body.removeChild(a)
                              } catch (err: any) {
                                setError(err.response?.data?.message || 'Failed to download invoice')
                              }
                            }}>
                              <Download className="h-4 w-4 mr-2" />
                              Download Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <p className="text-sm text-[#6B7280] text-center sm:text-left">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} orders
              </p>
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                
                {/* Show limited page numbers on mobile */}
                <div className="flex items-center space-x-1">
                  {totalPages <= 5 ? (
                    // Show all pages if 5 or fewer
                    Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-8 h-8 p-0",
                          currentPage === page ? "bg-[#1B3B6F]" : ""
                        )}
                      >
                        {page}
                      </Button>
                    ))
                  ) : (
                    // Show abbreviated pagination for many pages
                    <>
                      {currentPage > 2 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            className="w-8 h-8 p-0"
                          >
                            1
                          </Button>
                          {currentPage > 3 && <span className="text-[#6B7280]">...</span>}
                        </>
                      )}
                      
                      {[currentPage - 1, currentPage, currentPage + 1]
                        .filter(page => page >= 1 && page <= totalPages)
                        .map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "w-8 h-8 p-0",
                              currentPage === page ? "bg-[#1B3B6F]" : ""
                            )}
                          >
                            {page}
                          </Button>
                        ))
                      }
                      
                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && <span className="text-[#6B7280]">...</span>}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-8 h-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                </Button>
              </div>
            </div>
          )}

      {/* Order Details Dialog */}
      <OrderViewDialog
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false)
          setSelectedOrder(null)
        }}
        order={selectedOrder}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        statusConfig={statusConfig}
        paymentStatusConfig={paymentStatusConfig}
      />

      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status and tracking information for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Order Status</Label>
              <Select 
                value={statusUpdateData.status} 
                onValueChange={(value) => setStatusUpdateData({ ...statusUpdateData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="packed">Packed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(statusUpdateData.status === 'shipped' || statusUpdateData.status === 'delivered') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <Input
                    id="trackingNumber"
                    value={statusUpdateData.trackingNumber}
                    onChange={(e) => setStatusUpdateData({ ...statusUpdateData, trackingNumber: e.target.value })}
                    placeholder="Enter tracking number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courierPartner">Courier Partner</Label>
                  <Select 
                    value={statusUpdateData.courierPartner} 
                    onValueChange={(value) => setStatusUpdateData({ ...statusUpdateData, courierPartner: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select courier partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BlueDart Express">BlueDart Express</SelectItem>
                      <SelectItem value="Delhivery">Delhivery</SelectItem>
                      <SelectItem value="DTDC">DTDC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
                  <Input
                    id="estimatedDelivery"
                    type="datetime-local"
                    value={statusUpdateData.estimatedDelivery}
                    onChange={(e) => setStatusUpdateData({ ...statusUpdateData, estimatedDelivery: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={statusUpdateData.notes}
                onChange={(e) => setStatusUpdateData({ ...statusUpdateData, notes: e.target.value })}
                placeholder="Add any notes or comments"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUpdateStatusOpen(false)
                setSelectedOrder(null)
                setStatusUpdateData({
                  status: '',
                  trackingNumber: '',
                  courierPartner: '',
                  estimatedDelivery: '',
                  notes: ''
                })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateOrderStatus} className="bg-[#1B3B6F] hover:bg-[#0F2545]" disabled={actionLoading}>
              {actionLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Updating...</> : 'Update Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Delivery Dialog */}
      <Dialog open={isAssignDeliveryOpen} onOpenChange={setIsAssignDeliveryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Delivery Partner</DialogTitle>
            <DialogDescription>
              Assign order {selectedOrder?.orderNumber} to a delivery partner
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryPartner">Select Delivery Partner</Label>
              <Select 
                value={deliveryAssignment.partnerId} 
                onValueChange={(value) => setDeliveryAssignment({ ...deliveryAssignment, partnerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a delivery partner" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryBoys.map((partner) => (
                    <SelectItem key={partner._id || partner.id} value={partner._id || partner.id}>
                      {partner.fullName || partner.name || 'Delivery Partner'} — {partner.phone || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={deliveryAssignment.priority} 
                onValueChange={(value) => setDeliveryAssignment({ ...deliveryAssignment, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="same-day">Same Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDelivery">Estimated Delivery Date</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={deliveryAssignment.estimatedDelivery}
                onChange={(e) => setDeliveryAssignment({ ...deliveryAssignment, estimatedDelivery: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                value={deliveryAssignment.specialInstructions}
                onChange={(e) => setDeliveryAssignment({ ...deliveryAssignment, specialInstructions: e.target.value })}
                placeholder="Any special delivery instructions..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDeliveryOpen(false)
                setSelectedOrder(null)
                setDeliveryAssignment({
                  partnerId: '',
                  priority: 'normal',
                  estimatedDelivery: '',
                  specialInstructions: ''
                })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignDelivery}
              className="bg-[#1B3B6F] hover:bg-[#0F2545]"
              disabled={!deliveryAssignment.partnerId || actionLoading}
            >
              {actionLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Assigning...</> : 'Assign Delivery'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto scrollbar-ultra-narrow">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer & Order Details
            </DialogTitle>
            <DialogDescription>
              Customer information and available delivery partners
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - User & Order Details */}
              <div className="space-y-6">
                {/* Customer Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                        <p className="font-semibold">{selectedOrder.customer?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="font-semibold">{selectedOrder.customer?.email || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                        <p className="font-semibold">{selectedOrder.customer?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Customer ID</Label>
                        <p className="font-mono text-sm">{selectedOrder.customer?.id || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                      <p className="text-sm">
                        {selectedOrder.shippingAddress?.addressLine1 || selectedOrder.shippingAddress?.street || '-'}, {selectedOrder.shippingAddress?.city || '-'},
                        {selectedOrder.shippingAddress?.state || '-'} - {selectedOrder.shippingAddress?.pincode || selectedOrder.shippingAddress?.zipCode || '-'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5" />
                      Order Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Order Number</Label>
                        <p className="font-mono font-semibold text-[#1B3B6F]">{selectedOrder.orderNumber}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Order Date</Label>
                        <p className="font-semibold">{formatDate(selectedOrder.orderDate || selectedOrder.createdAt)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                        <p className="font-bold text-emerald-700">{formatCurrency(selectedOrder.totalAmount)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                        <p className="font-semibold capitalize">{selectedOrder.paymentMethod}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Order Status</Label>
                        <Badge className={statusConfig[selectedOrder.status as keyof typeof statusConfig]?.className}>
                          {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                        <Badge className={paymentStatusConfig[selectedOrder.paymentStatus as keyof typeof paymentStatusConfig]?.className}>
                          {paymentStatusConfig[selectedOrder.paymentStatus as keyof typeof paymentStatusConfig]?.label}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Items Ordered</Label>
                      <div className="mt-2 space-y-2">
                        {selectedOrder.products.map((product, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">Qty: {product.quantity}</p>
                              <p className="text-sm text-emerald-600">{formatCurrency(product.price * product.quantity)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Delivery Partners */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Truck className="w-5 h-5" />
                      Available Delivery Partners
                    </CardTitle>
                    <CardDescription>
                      Nearby delivery partners with distance information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {deliveryBoys.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Truck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">No delivery partners available</p>
                        </div>
                      ) : deliveryBoys.map((partner) => (
                        <div key={partner._id || partner.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-sm">{partner.name || partner.fullName}</h4>
                              <p className="text-xs text-muted-foreground">{partner.contactPerson || partner.email || ''}</p>
                            </div>
                            <div className="text-right">
                              {partner.distance != null && (
                                <div className="flex items-center gap-1 text-sm font-medium text-[#1B3B6F]">
                                  <MapPin className="w-3 h-3" />
                                  {Number(partner.distance).toFixed(1)} km
                                </div>
                              )}
                              {partner.onTimeDeliveryRate != null && (
                                <div className="flex items-center gap-1 text-xs text-emerald-600">
                                  <BadgeCheck className="w-3 h-3" />
                                  {partner.onTimeDeliveryRate}% On-time
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            {partner.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {partner.phone}
                              </div>
                            )}
                            {partner.rating != null && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {partner.rating}
                              </div>
                            )}
                          </div>

                          {partner.rateCard && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Local: </span>
                                  <span className="font-medium">{formatCurrency(partner.rateCard.localDelivery)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Inter-city: </span>
                                  <span className="font-medium">{formatCurrency(partner.rateCard.intercityDelivery)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <Button
                            size="sm"
                            className="w-full mt-3 bg-[#1B3B6F] hover:bg-[#1B3B6F]/90"
                            onClick={() => {
                              setDeliveryAssignment({
                                ...deliveryAssignment,
                                partnerId: partner._id || partner.id
                              })
                              setShowUserDetails(false)
                              setIsAssignDeliveryOpen(true)
                            }}
                          >
                            <Truck className="w-3 h-3 mr-1" />
                            Assign Order
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Feedback</DialogTitle>
            <DialogDescription>
              Customer feedback for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedOrder.customer?.avatar} />
                  <AvatarFallback>
                    {(selectedOrder.customer?.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedOrder.customer?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customer?.email || '-'}</p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium text-gray-700">Order Number</Label>
                  <p>{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <Label className="font-medium text-gray-700">Order Date</Label>
                  <p>{formatDate(selectedOrder.orderDate || selectedOrder.createdAt)}</p>
                </div>
              </div>

              {/* Overall Rating */}
              <div className="space-y-3">
                <Label className="font-medium text-gray-700">Overall Rating</Label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= (selectedOrder.feedbackRating || 4)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="font-medium text-lg ml-2">{selectedOrder.feedbackRating || 4.0}</span>
                </div>
              </div>

              {/* Feedback Categories */}
              <div className="space-y-4">
                <Label className="font-medium text-gray-700">Category Ratings</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Product Quality</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= (selectedOrder.productQualityRating || 4)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm ml-1">{selectedOrder.productQualityRating || 4.0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Delivery Speed</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= (selectedOrder.deliverySpeedRating || 5)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm ml-1">{selectedOrder.deliverySpeedRating || 5.0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Service</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= (selectedOrder.customerServiceRating || 4)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm ml-1">{selectedOrder.customerServiceRating || 4.0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Packaging</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= (selectedOrder.packagingRating || 3)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm ml-1">{selectedOrder.packagingRating || 3.0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Written Feedback */}
              <div className="space-y-3">
                <Label className="font-medium text-gray-700">Customer Comments</Label>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm leading-relaxed">
                    {selectedOrder.feedbackComments || 
                    "The product quality was excellent and delivery was faster than expected. Very satisfied with the purchase. The packaging could be improved to prevent damage during shipping, but overall a great experience with Road Care. Will definitely order again!"}
                  </p>
                </div>
              </div>

              {/* Feedback Date */}
              <div className="text-xs text-gray-500">
                <Label className="font-medium">Feedback submitted on:</Label>
                <p>{formatDate(selectedOrder.feedbackDate || selectedOrder.orderDate || selectedOrder.createdAt)}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={isCreateOrderOpen}
        onOpenChange={setIsCreateOrderOpen}
        onOrderCreated={() => { fetchOrders(); fetchStats(); }}
      />
    </div>
  )
}

// Order View Dialog Component
interface OrderViewDialogProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  formatCurrency: (amount: number) => string
  formatDate: (dateString: string) => string
  statusConfig: any
  paymentStatusConfig: any
}

function OrderViewDialog({ 
  isOpen, 
  onClose, 
  order, 
  formatCurrency, 
  formatDate, 
  statusConfig, 
  paymentStatusConfig 
}: OrderViewDialogProps) {
  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-ultra-narrow">
        <DialogHeader>
          <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
          <DialogDescription>Complete order information and status</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status and Basic Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-gray-500">Order Status</Label>
              <Badge className={(statusConfig[order.status]?.className || 'bg-gray-100 text-gray-800') + " mt-1"}>
                {statusConfig[order.status]?.label || order.status}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Payment Status</Label>
              <Badge className={(paymentStatusConfig[order.paymentStatus]?.className || 'bg-gray-100 text-gray-800') + " mt-1"}>
                {paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Order Date</Label>
              <p>{formatDate(order.orderDate || order.createdAt || order.createdAt)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Payment Method</Label>
              <p>{order.paymentMethod}</p>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
            <div className="flex items-start space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={order.customer?.avatar} alt={order.customer?.name} />
                <AvatarFallback>
                  {(order.customer?.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-[#1A1D29]">{order.customer?.name || 'Unknown'}</p>
                <div className="flex items-center space-x-2 text-sm text-[#6B7280] mt-1">
                  <Mail className="h-4 w-4" />
                  <span>{order.customer?.email || '-'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-[#6B7280] mt-1">
                  <Phone className="h-4 w-4" />
                  <span>{order.customer?.phone || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Order Items</h3>
            <div className="space-y-3">
              {(order.products || []).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1D29]">{product.name}</p>
                      <p className="text-sm text-[#6B7280]">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Qty: {product.quantity}</p>
                    <p className="text-sm text-[#6B7280]">{formatCurrency(product.price)} each</p>
                    <p className="font-semibold text-[#1A1D29]">{formatCurrency(product.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {(order.tax != null && order.tax > 0) && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{formatCurrency(order.shippingCharges || 0)}</span>
              </div>
              {(order.discount != null && order.discount > 0) && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Shipping Address</h3>
            <div className="p-4 border rounded-lg">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                <div>
                  <p className="font-medium">{order.shippingAddress?.name || '-'}</p>
                  <p className="text-sm text-[#6B7280]">{order.shippingAddress?.phone || '-'}</p>
                  <p className="text-sm mt-1">
                    {order.shippingAddress?.addressLine1 || '-'}
                    {order.shippingAddress?.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                  </p>
                  <p className="text-sm">
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                  </p>
                  {order.shippingAddress?.landmark && (
                    <p className="text-sm text-[#6B7280]">Landmark: {order.shippingAddress.landmark}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Information */}
          {order.trackingNumber && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Tracking Information</h3>
              <div className="p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tracking Number</Label>
                    <p className="font-mono">{order.trackingNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Courier Partner</Label>
                    <p>{order.courierPartner}</p>
                  </div>
                  {order.estimatedDelivery && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Estimated Delivery</Label>
                      <p>{formatDate(order.estimatedDelivery)}</p>
                    </div>
                  )}
                  {order.actualDelivery && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Actual Delivery</Label>
                      <p>{formatDate(order.actualDelivery)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Order Notes</h3>
              <p className="p-4 bg-gray-50 rounded-lg text-sm">{order.notes}</p>
            </div>
          )}

          {/* Cancellation/Return Reason */}
          {(order.cancellationReason || order.returnReason) && (
            <div>
              <h3 className="font-semibold text-lg mb-3">
                {order.cancellationReason ? 'Cancellation Reason' : 'Return Reason'}
              </h3>
              <p className="p-4 bg-red-50 rounded-lg text-sm">
                {order.cancellationReason || order.returnReason}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <Label className="font-medium">Created At</Label>
              <p>{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <Label className="font-medium">Last Updated</Label>
              <p>{formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" onClick={async () => {
            try {
              const res = await orderAPI.downloadInvoice(order.id || order._id)
              const blob = new Blob([res.data], { type: 'application/pdf' })
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `invoice-${order.orderNumber || order.id || order._id}.pdf`
              document.body.appendChild(a)
              a.click()
              window.URL.revokeObjectURL(url)
              document.body.removeChild(a)
            } catch (err: any) {
              console.error('Failed to download invoice:', err)
            }
          }}>
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
