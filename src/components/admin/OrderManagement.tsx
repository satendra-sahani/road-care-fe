// @ts-nocheck
'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
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
  Star
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
import { 
  mockOrders, 
  mockCustomers,
  mockDeliveryPartners
} from '@/data/mockData'

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Dialog states
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

  // Status configuration
  const statusConfig = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
    confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    processing: { label: 'Processing', className: 'bg-orange-100 text-orange-800', icon: Package },
    packed: { label: 'Packed', className: 'bg-purple-100 text-purple-800', icon: Package },
    shipped: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-800', icon: Truck },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800', icon: XCircle },
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

  // Mock delivery partners with distances for the modal
  const deliveryPartnersWithDistance = mockDeliveryPartners.map((partner, index) => ({
    ...partner,
    distance: [2.1, 3.5, 1.8][index] || (2 + Math.random() * 3) // Random distances between 2-5 km
  }))

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
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      processingOrders: orders.filter(o => o.status === 'processing').length,
      shippedOrders: orders.filter(o => o.status === 'shipped').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / orders.length : 0
    }
  }, [orders])

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchTerm === '' ||
        (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
      const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.paymentStatus === selectedPaymentStatus
      const matchesPaymentMethod = selectedPaymentMethod === 'all' || order.paymentMethod === selectedPaymentMethod

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPaymentMethod
    })
  }, [orders, searchTerm, selectedStatus, selectedPaymentStatus, selectedPaymentMethod])

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Order Management Operations
  const handleUpdateOrderStatus = () => {
    if (!selectedOrder) return
    
    const updatedOrder: Order = {
      ...selectedOrder,
      status: statusUpdateData.status as Order['status'],
      trackingNumber: statusUpdateData.trackingNumber || selectedOrder.trackingNumber,
      courierPartner: statusUpdateData.courierPartner || selectedOrder.courierPartner,
      estimatedDelivery: statusUpdateData.estimatedDelivery || selectedOrder.estimatedDelivery,
      notes: statusUpdateData.notes || selectedOrder.notes,
      updatedAt: new Date().toISOString() // This is client-side only, so it's safe
    }

    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o))
    setIsUpdateStatusOpen(false)
    setSelectedOrder(null)
    setStatusUpdateData({
      status: '',
      trackingNumber: '',
      courierPartner: '',
      estimatedDelivery: '',
      notes: ''
    })
  }

  const handleBulkStatusUpdate = (status: Order['status']) => {
    setOrders(prev => prev.map(o => 
      selectedOrders.includes(o.id)
        ? { ...o, status, updatedAt: new Date().toISOString() }
        : o
    ))
    setSelectedOrders([])
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

  const handleAssignDelivery = () => {
    if (selectedOrder && deliveryAssignment.partnerId) {
      // Here you would typically make an API call to assign the order to delivery partner
      console.log('Assigning order to delivery partner:', {
        orderId: selectedOrder.id,
        ...deliveryAssignment
      })
      
      // Update the order status to 'shipped' when assigned to delivery
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: 'shipped' as any }
            : order
        )
      )
      
      setIsAssignDeliveryOpen(false)
      // Show success message
      alert('Order successfully assigned to delivery partner!')
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
          <Button variant="outline" className="text-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Orders
          </Button>
          <Button className="bg-[#1B3B6F] hover:bg-[#0F2545] text-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

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
                            setSelectedOrders(paginatedOrders.map(o => o.id))
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
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedOrders(prev => [...prev, order.id])
                            } else {
                              setSelectedOrders(prev => prev.filter(id => id !== order.id))
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
                            <AvatarImage src={order.customer.avatar} alt={order.customer.name} />
                            <AvatarFallback>
                              {order.customer.name.split(' ').map(n => n[0]).join('')}
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
                              {order.customer.name}
                            </button>
                            <p className="text-sm text-[#6B7280]">{order.customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.products.length} item{order.products.length > 1 ? 's' : ''}</p>
                          <p className="text-sm text-[#6B7280]">
                            {order.products[0]?.name}
                            {order.products.length > 1 && ` +${order.products.length - 1} more`}
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
                        <Badge className={statusConfig[order.status].className}>
                          {statusConfig[order.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentStatusConfig[order.paymentStatus].className}>
                          {paymentStatusConfig[order.paymentStatus].label}
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
                        <p className="text-sm">{formatDate(order.orderDate)}</p>
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
                            <DropdownMenuItem>
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

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-[#1A1D29]">No orders found</p>
                  <p className="text-[#6B7280]">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <p className="text-sm text-[#6B7280] text-center sm:text-left">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
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
            <Button onClick={handleUpdateOrderStatus} className="bg-[#1B3B6F] hover:bg-[#0F2545]">
              Update Order
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
                  {mockDeliveryPartners.filter(partner => partner.status === 'active').map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name} - {partner.contactPerson}
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
              disabled={!deliveryAssignment.partnerId}
            >
              Assign Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                        <p className="font-semibold">{selectedOrder.customer.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="font-semibold">{selectedOrder.customer.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                        <p className="font-semibold">{selectedOrder.customer.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Customer ID</Label>
                        <p className="font-mono text-sm">{selectedOrder.customer.id}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                      <p className="text-sm">
                        {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}, 
                        {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.zipCode}
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
                        <p className="font-semibold">{formatDate(selectedOrder.orderDate)}</p>
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
                      {deliveryPartnersWithDistance.map((partner) => (
                        <div key={partner.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-sm">{partner.name}</h4>
                              <p className="text-xs text-muted-foreground">{partner.contactPerson}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-sm font-medium text-[#1B3B6F]">
                                <MapPin className="w-3 h-3" />
                                {partner.distance.toFixed(1)} km
                              </div>
                              <div className="flex items-center gap-1 text-xs text-emerald-600">
                                <BadgeCheck className="w-3 h-3" />
                                {partner.onTimeDeliveryRate}% On-time
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {partner.phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {partner.rating} ⭐
                            </div>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Local: </span>
                                <span className="font-medium">₹{partner.rateCard.localDelivery}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Inter-city: </span>
                                <span className="font-medium">₹{partner.rateCard.intercityDelivery}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="w-full mt-3 bg-[#1B3B6F] hover:bg-[#1B3B6F]/90"
                            onClick={() => {
                              // Handle assign delivery partner
                              setDeliveryAssignment({
                                ...deliveryAssignment,
                                partnerId: partner.id
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
                  <AvatarImage src={selectedOrder.customer.avatar} />
                  <AvatarFallback>
                    {selectedOrder.customer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedOrder.customer.name}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customer.email}</p>
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
                  <p>{formatDate(selectedOrder.orderDate)}</p>
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
                <p>{formatDate(selectedOrder.feedbackDate || selectedOrder.orderDate)}</p>
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
          <DialogDescription>Complete order information and status</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status and Basic Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-gray-500">Order Status</Label>
              <Badge className={statusConfig[order.status].className + " mt-1"}>
                {statusConfig[order.status].label}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Payment Status</Label>
              <Badge className={paymentStatusConfig[order.paymentStatus].className + " mt-1"}>
                {paymentStatusConfig[order.paymentStatus].label}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Order Date</Label>
              <p>{formatDate(order.orderDate)}</p>
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
                <AvatarImage src={order.customer.avatar} alt={order.customer.name} />
                <AvatarFallback>
                  {order.customer.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-[#1A1D29]">{order.customer.name}</p>
                <div className="flex items-center space-x-2 text-sm text-[#6B7280] mt-1">
                  <Mail className="h-4 w-4" />
                  <span>{order.customer.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-[#6B7280] mt-1">
                  <Phone className="h-4 w-4" />
                  <span>{order.customer.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.products.map((product, index) => (
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
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{formatCurrency(order.shippingCharges)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
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
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p className="text-sm text-[#6B7280]">{order.shippingAddress.phone}</p>
                  <p className="text-sm mt-1">
                    {order.shippingAddress.addressLine1}
                    {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                  </p>
                  <p className="text-sm">
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                  {order.shippingAddress.landmark && (
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
