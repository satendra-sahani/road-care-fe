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
  ShoppingBag
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Order, OrderFilters, Customer } from '@/types'
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
  const [activeTab, setActiveTab] = useState('orders')
  
  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    trackingNumber: '',
    courierPartner: '',
    estimatedDelivery: '',
    notes: ''
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
      totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length : 0
    }
  }, [orders])

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">Order Management</h1>
          <p className="text-[#6B7280] mt-1">Manage customer orders, track deliveries, and handle returns</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Orders
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Orders
          </Button>
          <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
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

      {/* Order Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
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
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
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
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                            <p className="font-medium text-[#1A1D29]">{order.customer.name}</p>
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#6B7280]">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-[#1B3B6F]" : ""}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Customer Overview</CardTitle>
              <CardDescription>Track customer activity and order history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockCustomers.map((customer) => (
                  <Card key={customer.id} className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={customer.avatar} alt={customer.name} />
                        <AvatarFallback>
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#1A1D29]">{customer.name}</h3>
                        <p className="text-sm text-[#6B7280]">{customer.email}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <p className="text-sm font-medium">{customer.totalOrders} orders</p>
                            <p className="text-sm text-[#6B7280]">{formatCurrency(customer.totalSpent)} spent</p>
                          </div>
                          <Badge className={
                            customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }>
                            {customer.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Delivery Partners</CardTitle>
              <CardDescription>Manage delivery partners and track performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockDeliveryPartners.map((partner) => (
                  <Card key={partner.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-[#1A1D29]">{partner.name}</h3>
                        <p className="text-sm text-[#6B7280]">{partner.contactPerson}</p>
                        <p className="text-sm text-[#6B7280]">{partner.phone}</p>
                        <div className="mt-2">
                          <p className="text-sm font-medium">{partner.totalDeliveries} deliveries</p>
                          <p className="text-sm text-[#6B7280]">{partner.onTimeDeliveryRate}% on-time</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          partner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }>
                          {partner.status}
                        </Badge>
                        <p className="text-sm mt-2">
                          â˜… {partner.rating}/5
                        </p>
                        <p className="text-sm text-[#6B7280]">
                          Local: {formatCurrency(partner.rateCard.localDelivery)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
