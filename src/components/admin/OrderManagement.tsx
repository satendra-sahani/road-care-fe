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
  Loader2,
  ArrowUpRight,
  FileDown,
  ChevronLeft,
  ChevronRight
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
import { AdminHeader } from './AdminHeader'

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
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)

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
    placed: { label: 'Placed', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
    processing: { label: 'Processing', className: 'bg-orange-100 text-orange-800 border-orange-200', icon: Package },
    packed: { label: 'Packed', className: 'bg-purple-100 text-purple-800 border-purple-200', icon: Package },
    shipped: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Truck },
    out_for_delivery: { label: 'Out for Delivery', className: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: Truck },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    return_requested: { label: 'Return Requested', className: 'bg-amber-100 text-amber-800 border-amber-200', icon: RefreshCw },
    returned: { label: 'Returned', className: 'bg-gray-100 text-gray-800 border-gray-200', icon: RefreshCw }
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

  // Left-edge stripe color per status — makes the table scannable at a glance.
  const STATUS_STRIPE: Record<string, string> = {
    placed: '#f59e0b', pending: '#f59e0b', confirmed: '#3b82f6', processing: '#f97316',
    packed: '#a855f7', shipped: '#6366f1', out_for_delivery: '#06b6d4', delivered: '#22c55e',
    cancelled: '#ef4444', return_requested: '#f59e0b', returned: '#94a3b8',
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

  // Export the currently-loaded orders to CSV (respects the active filters).
  const exportCsv = () => {
    const rows: string[][] = [['Order ID', 'Customer', 'Phone', 'Status', 'Payment', 'Method', 'Amount', 'Date']]
    orders.forEach((o: any) => {
      rows.push([
        o.orderId || o.orderNumber || o.id || '',
        o.customer?.name || '',
        o.customer?.phone || '',
        o.status || '',
        o.paymentStatus || '',
        o.paymentMethod || '',
        String(o.totalAmount ?? 0),
        o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '',
      ])
    })
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
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

  // Download invoice handler
  const handleDownloadInvoice = async (order: Order) => {
    const orderId = order.id || order._id
    setDownloadingInvoice(orderId)
    try {
      const res = await orderAPI.downloadInvoice(orderId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${order.orderNumber || orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download invoice')
    } finally {
      setDownloadingInvoice(null)
    }
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
        serviceChargePercent: order.serviceChargePercent || 0,
        serviceChargeAmount: order.serviceChargeAmount || 0,
        discount: order.discount || 0,
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

  // Clickable status quick-filters (count from stats; a click sets the list filter)
  const statusStats = [
    { key: 'all',        label: 'Total Orders', value: stats.totalOrders,      icon: ShoppingBag, tint: 'text-slate-600 bg-slate-100',    bar: 'bg-slate-400' },
    { key: 'pending',    label: 'Pending',      value: stats.pendingOrders,    icon: Clock,       tint: 'text-amber-600 bg-amber-50',     bar: 'bg-amber-400' },
    { key: 'processing', label: 'Processing',   value: stats.processingOrders, icon: Package,     tint: 'text-orange-600 bg-orange-50',   bar: 'bg-orange-400' },
    { key: 'shipped',    label: 'Shipped',      value: stats.shippedOrders,    icon: Truck,       tint: 'text-indigo-600 bg-indigo-50',   bar: 'bg-indigo-400' },
    { key: 'delivered',  label: 'Delivered',    value: stats.deliveredOrders,  icon: CheckCircle, tint: 'text-emerald-600 bg-emerald-50', bar: 'bg-emerald-500' },
  ]
  const pipeTotal = stats.pendingOrders + stats.processingOrders + stats.shippedOrders + stats.deliveredOrders

  return (
    <div className="min-h-screen">
      {/* Admin Header */}
      <AdminHeader />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Order Management</h1>
            <p className="text-[#6B7280] mt-1 text-sm">Manage customer orders, track deliveries, and handle returns</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-9" onClick={exportCsv} disabled={orders.length === 0}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9"
              onClick={() => { fetchOrders(); fetchStats(); }}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button size="sm" className="bg-[#1B3B6F] hover:bg-[#0F2545] text-xs h-9" onClick={() => setIsCreateOrderOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Order
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm border border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError('')} className="h-7 w-7 p-0">
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* KPI row: revenue hero + clickable status filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Revenue hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] p-5 shadow-md">
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
            <div className="absolute -right-2 top-14 h-20 w-20 rounded-full bg-white/[0.05]" />
            <div className="relative flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">Total revenue</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                <IndianRupee className="h-[18px] w-[18px] text-white" />
              </div>
            </div>
            <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-white">
              {statsLoading ? '—' : formatCurrency(stats.totalRevenue)}
            </p>
            <div className="relative mt-3 flex items-center gap-3 text-[12px] text-white/70">
              <span>Avg <b className="text-white">{formatCurrency(stats.averageOrderValue)}</b></span>
              <span className="text-white/30">·</span>
              <span><b className="text-white">{stats.totalOrders}</b> orders</span>
            </div>
          </div>

          {/* Clickable status filter cards */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {statusStats.map((s) => {
              const Icon = s.icon
              const active = selectedStatus === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => setSelectedStatus(s.key)}
                  className={`text-left rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-[#1B3B6F] ring-2 ring-[#1B3B6F]/15' : 'border-gray-100'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`grid h-8 w-8 place-items-center rounded-lg ${s.tint}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {active && <span className="text-[9px] font-bold uppercase tracking-wide text-[#1B3B6F]">Filtered</span>}
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-[#1A1D29]">{statsLoading ? '—' : s.value}</p>
                  <p className="text-[11.5px] font-medium text-gray-500">{s.label}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Pipeline proportion bar */}
        {pipeTotal > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              {statusStats.slice(1).map((s) => (
                s.value > 0 ? <div key={s.key} className={s.bar} style={{ width: `${(s.value / pipeTotal) * 100}%` }} title={`${s.label}: ${s.value}`} /> : null
              ))}
            </div>
            <span className="whitespace-nowrap text-[11px] font-medium text-gray-400">{pipeTotal} in pipeline</span>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search orders, customer name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
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
                  <SelectTrigger className="w-[130px] h-9 text-xs">
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
                  <SelectTrigger className="w-[120px] h-9 text-xs">
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
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedOrders.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-100">
                <span className="text-sm font-medium text-blue-800">
                  {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkStatusUpdate('confirmed')}>
                    Confirm
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkStatusUpdate('processing')}>
                    Process
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkStatusUpdate('shipped')}>
                    Ship
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setSelectedOrders([])}>
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F6F8FB] hover:bg-[#F6F8FB] border-b border-gray-200">
                    <TableHead className="w-[40px]">
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
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Products</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Feedback</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Invoice</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#1B3B6F]" />
                        <p className="text-gray-400 text-sm">Loading orders...</p>
                      </TableCell>
                    </TableRow>
                  ) : paginatedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <ShoppingBag className="h-7 w-7 text-gray-400" />
                          </div>
                          <p className="text-base font-medium text-[#1A1D29]">No orders found</p>
                          <p className="text-sm text-[#6B7280] mt-1">Try adjusting your search or filter criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedOrders.map((order) => {
                    const StatusIcon = statusConfig[order.status]?.icon || Clock
                    return (
                      <TableRow
                        key={order.id || order._id}
                        className="hover:bg-[#1B3B6F]/[0.03] transition-colors border-l-[3px]"
                        style={{ borderLeftColor: STATUS_STRIPE[order.status] || 'transparent' }}
                      >
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
                            <p className="font-semibold text-[#1B3B6F] text-sm">{order.orderNumber}</p>
                            {order.trackingNumber && (
                              <p className="text-xs text-[#6B7280] mt-0.5">Track: {order.trackingNumber}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border border-gray-100">
                              <AvatarImage src={order.customer?.avatar} alt={order.customer?.name} />
                              <AvatarFallback className="bg-[#1B3B6F] text-white text-xs">
                                {(order.customer?.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <button
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setShowUserDetails(true)
                                }}
                                className="font-medium text-sm text-[#1A1D29] hover:text-[#1B3B6F] hover:underline cursor-pointer transition-colors text-left"
                              >
                                {order.customer?.name || 'Unknown'}
                              </button>
                              <p className="text-xs text-[#6B7280]">{order.customer?.email || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{(order.products || []).length} item{(order.products || []).length > 1 ? 's' : ''}</p>
                            <p className="text-xs text-[#6B7280] max-w-[140px] truncate">
                              {order.products?.[0]?.name}
                              {(order.products || []).length > 1 && ` +${(order.products || []).length - 1} more`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold text-sm text-[#1A1D29]">{formatCurrency(order.totalAmount)}</p>
                            <p className="text-xs text-[#6B7280] capitalize">{order.paymentMethod}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs font-medium ${statusConfig[order.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[order.status]?.label || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${paymentStatusConfig[order.paymentStatus]?.className || 'bg-gray-100 text-gray-800'}`}>
                            {paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(order.status === 'delivered' || order.status === 'completed') ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1 hover:bg-amber-50 text-amber-600 h-7 px-2"
                              onClick={() => {
                                setSelectedOrder(order)
                                setIsFeedbackDialogOpen(true)
                              }}
                            >
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-medium">View</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-[#6B7280]">{formatDate(order.orderDate || order.createdAt)}</p>
                        </TableCell>
                        {/* PDF Download Column */}
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50 text-red-500 hover:text-red-700"
                            onClick={() => handleDownloadInvoice(order)}
                            disabled={downloadingInvoice === (order.id || order._id)}
                            title="Download Invoice PDF"
                          >
                            {downloadingInvoice === (order.id || order._id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedOrder(order)
                                setIsViewDialogOpen(true)
                              }} className="text-sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openStatusUpdateDialog(order)} className="text-sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeliveryAssignmentDialog(order)}
                                disabled={order.status === 'delivered' || order.status === 'cancelled'}
                                className="text-sm"
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                Assign Delivery
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-[#6B7280]">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} orders
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {totalPages <= 5 ? (
                Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={cn("h-8 w-8 p-0 text-xs", currentPage === page ? "bg-[#1B3B6F]" : "")}
                  >
                    {page}
                  </Button>
                ))
              ) : (
                <>
                  {currentPage > 2 && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} className="h-8 w-8 p-0 text-xs">1</Button>
                      {currentPage > 3 && <span className="text-[#6B7280] text-xs px-1">...</span>}
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
                        className={cn("h-8 w-8 p-0 text-xs", currentPage === page ? "bg-[#1B3B6F]" : "")}
                      >
                        {page}
                      </Button>
                    ))
                  }
                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && <span className="text-[#6B7280] text-xs px-1">...</span>}
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} className="h-8 w-8 p-0 text-xs">{totalPages}</Button>
                    </>
                  )}
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

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
        onDownloadInvoice={handleDownloadInvoice}
      />

      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Edit className="h-4 w-4 text-blue-600" />
              </div>
              Update Order Status
            </DialogTitle>
            <DialogDescription>
              Update the status for order <span className="font-semibold text-[#1B3B6F]">{selectedOrder?.orderNumber}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Order Status</Label>
              <Select
                value={statusUpdateData.status}
                onValueChange={(value) => setStatusUpdateData({ ...statusUpdateData, status: value })}
              >
                <SelectTrigger className="h-10">
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
                  <Label htmlFor="trackingNumber" className="text-sm font-medium">Tracking Number</Label>
                  <Input
                    id="trackingNumber"
                    value={statusUpdateData.trackingNumber}
                    onChange={(e) => setStatusUpdateData({ ...statusUpdateData, trackingNumber: e.target.value })}
                    placeholder="Enter tracking number"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courierPartner" className="text-sm font-medium">Courier Partner</Label>
                  <Select
                    value={statusUpdateData.courierPartner}
                    onValueChange={(value) => setStatusUpdateData({ ...statusUpdateData, courierPartner: value })}
                  >
                    <SelectTrigger className="h-10">
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
                  <Label htmlFor="estimatedDelivery" className="text-sm font-medium">Estimated Delivery</Label>
                  <Input
                    id="estimatedDelivery"
                    type="datetime-local"
                    value={statusUpdateData.estimatedDelivery}
                    onChange={(e) => setStatusUpdateData({ ...statusUpdateData, estimatedDelivery: e.target.value })}
                    className="h-10"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <Textarea
                id="notes"
                value={statusUpdateData.notes}
                onChange={(e) => setStatusUpdateData({ ...statusUpdateData, notes: e.target.value })}
                placeholder="Add any notes or comments"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsUpdateStatusOpen(false)
                setSelectedOrder(null)
                setStatusUpdateData({ status: '', trackingNumber: '', courierPartner: '', estimatedDelivery: '', notes: '' })
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
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Truck className="h-4 w-4 text-indigo-600" />
              </div>
              Assign Delivery Partner
            </DialogTitle>
            <DialogDescription>
              Assign order <span className="font-semibold text-[#1B3B6F]">{selectedOrder?.orderNumber}</span> to a delivery partner
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryPartner" className="text-sm font-medium">Select Delivery Partner</Label>
              <Select
                value={deliveryAssignment.partnerId}
                onValueChange={(value) => setDeliveryAssignment({ ...deliveryAssignment, partnerId: value })}
              >
                <SelectTrigger className="h-10">
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
              <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
              <Select
                value={deliveryAssignment.priority}
                onValueChange={(value) => setDeliveryAssignment({ ...deliveryAssignment, priority: value })}
              >
                <SelectTrigger className="h-10">
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
              <Label htmlFor="estimatedDelivery" className="text-sm font-medium">Estimated Delivery Date</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={deliveryAssignment.estimatedDelivery}
                onChange={(e) => setDeliveryAssignment({ ...deliveryAssignment, estimatedDelivery: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialInstructions" className="text-sm font-medium">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                value={deliveryAssignment.specialInstructions}
                onChange={(e) => setDeliveryAssignment({ ...deliveryAssignment, specialInstructions: e.target.value })}
                placeholder="Any special delivery instructions..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDeliveryOpen(false)
                setSelectedOrder(null)
                setDeliveryAssignment({ partnerId: '', priority: 'normal', estimatedDelivery: '', specialInstructions: '' })
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              Customer & Order Details
            </DialogTitle>
            <DialogDescription>
              Customer information and available delivery partners
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
                {/* Left Side - User & Order Details */}
                <div className="space-y-5">
                  {/* Customer Info Card */}
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="w-4 h-4 text-[#1B3B6F]" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Name</Label>
                          <p className="font-semibold text-sm">{selectedOrder.customer?.name || 'Unknown'}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Email</Label>
                          <p className="font-semibold text-sm">{selectedOrder.customer?.email || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Phone</Label>
                          <p className="font-semibold text-sm">{selectedOrder.customer?.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Customer ID</Label>
                          <p className="font-mono text-xs text-gray-600">{selectedOrder.customer?.id || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Address</Label>
                        <p className="text-sm">
                          {selectedOrder.shippingAddress?.addressLine1 || selectedOrder.shippingAddress?.street || '-'}, {selectedOrder.shippingAddress?.city || '-'},
                          {selectedOrder.shippingAddress?.state || '-'} - {selectedOrder.shippingAddress?.pincode || selectedOrder.shippingAddress?.zipCode || '-'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Details Card */}
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="w-4 h-4 text-[#1B3B6F]" />
                        Order Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Order Number</Label>
                          <p className="font-mono font-semibold text-sm text-[#1B3B6F]">{selectedOrder.orderNumber}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Order Date</Label>
                          <p className="font-semibold text-sm">{formatDate(selectedOrder.orderDate || selectedOrder.createdAt)}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Total Amount</Label>
                          <p className="font-bold text-emerald-700">{formatCurrency(selectedOrder.totalAmount)}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Payment Method</Label>
                          <p className="font-semibold text-sm capitalize">{selectedOrder.paymentMethod}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Order Status</Label>
                          <Badge className={`${statusConfig[selectedOrder.status as keyof typeof statusConfig]?.className} mt-1`}>
                            {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Payment Status</Label>
                          <Badge className={`${paymentStatusConfig[selectedOrder.paymentStatus as keyof typeof paymentStatusConfig]?.className} mt-1`}>
                            {paymentStatusConfig[selectedOrder.paymentStatus as keyof typeof paymentStatusConfig]?.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Items Ordered</Label>
                        <div className="mt-2 space-y-2">
                          {selectedOrder.products.map((product, index) => (
                            <div key={index} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-sm">Qty: {product.quantity}</p>
                                <p className="text-xs text-emerald-600">{formatCurrency(product.price * product.quantity)}</p>
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
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Truck className="w-4 h-4 text-[#1B3B6F]" />
                        Available Delivery Partners
                      </CardTitle>
                      <CardDescription className="text-xs">
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
                          <div key={partner._id || partner.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-sm">{partner.name || partner.fullName}</h4>
                                <p className="text-xs text-gray-500">{partner.contactPerson || partner.email || ''}</p>
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

                            <div className="flex justify-between items-center text-xs text-gray-500">
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
                                    <span className="text-gray-500">Local: </span>
                                    <span className="font-medium">{formatCurrency(partner.rateCard.localDelivery)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Inter-city: </span>
                                    <span className="font-medium">{formatCurrency(partner.rateCard.intercityDelivery)}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <Button
                              size="sm"
                              className="w-full mt-3 bg-[#1B3B6F] hover:bg-[#1B3B6F]/90 h-8 text-xs"
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-600" />
              </div>
              Order Feedback
            </DialogTitle>
            <DialogDescription>
              Customer feedback for order <span className="font-semibold text-[#1B3B6F]">{selectedOrder?.orderNumber}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="flex-1 overflow-y-auto space-y-5 py-4" style={{ scrollbarWidth: 'thin' }}>
              {/* Customer Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedOrder.customer?.avatar} />
                  <AvatarFallback className="bg-[#1B3B6F] text-white text-xs">
                    {(selectedOrder.customer?.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{selectedOrder.customer?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-600">{selectedOrder.customer?.email || '-'}</p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-xs font-medium text-gray-500">Order Number</Label>
                  <p className="text-sm font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">Order Date</Label>
                  <p className="text-sm">{formatDate(selectedOrder.orderDate || selectedOrder.createdAt)}</p>
                </div>
              </div>

              {/* Overall Rating */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-500">Overall Rating</Label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= (selectedOrder.feedbackRating || 4)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="font-bold text-lg ml-2">{selectedOrder.feedbackRating || 4.0}</span>
                </div>
              </div>

              {/* Feedback Categories */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-gray-500">Category Ratings</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Product Quality', rating: selectedOrder.productQualityRating || 4 },
                    { label: 'Delivery Speed', rating: selectedOrder.deliverySpeedRating || 5 },
                    { label: 'Customer Service', rating: selectedOrder.customerServiceRating || 4 },
                    { label: 'Packaging', rating: selectedOrder.packagingRating || 3 },
                  ].map((cat) => (
                    <div key={cat.label} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-sm">{cat.label}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-3 w-3 ${star <= cat.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="text-xs font-medium ml-1">{cat.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Written Feedback */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-500">Customer Comments</Label>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm leading-relaxed text-gray-700">
                    {selectedOrder.feedbackComments ||
                    "The product quality was excellent and delivery was faster than expected. Very satisfied with the purchase."}
                  </p>
                </div>
              </div>

              {/* Feedback Date */}
              <div className="text-xs text-gray-500">
                <Label className="text-xs font-medium">Feedback submitted:</Label>
                <p>{formatDate(selectedOrder.feedbackDate || selectedOrder.orderDate || selectedOrder.createdAt)}</p>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4 gap-2">
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
  onDownloadInvoice: (order: Order) => void
}

function OrderViewDialog({
  isOpen,
  onClose,
  order,
  formatCurrency,
  formatDate,
  statusConfig,
  paymentStatusConfig,
  onDownloadInvoice
}: OrderViewDialogProps) {
  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="border-b pb-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-[#1B3B6F]/10 flex items-center justify-center shrink-0">
                  <FileText className="h-[18px] w-[18px] text-[#1B3B6F]" />
                </div>
                <span className="text-[#1A1D29]">Order {order.orderNumber}</span>
                <Badge className={`ml-0.5 ${statusConfig[order.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                  {statusConfig[order.status]?.label || order.status}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1.5">
                Placed {formatDate(order.orderDate || order.createdAt)} · {(order.products || []).length} item{(order.products || []).length !== 1 ? 's' : ''}
              </DialogDescription>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Order total</p>
              <p className="text-2xl font-extrabold text-[#1B3B6F] tabular-nums">{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1" style={{ scrollbarWidth: 'thin' }}>
          {/* Order Status and Basic Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Order Status</Label>
              <Badge className={`mt-1.5 ${statusConfig[order.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                {statusConfig[order.status]?.label || order.status}
              </Badge>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Payment Status</Label>
              <Badge className={`mt-1.5 ${paymentStatusConfig[order.paymentStatus]?.className || 'bg-gray-100 text-gray-800'}`}>
                {paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus}
              </Badge>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Order Date</Label>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#1A1D29]">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />{formatDate(order.orderDate || order.createdAt)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Payment Method</Label>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium capitalize text-[#1A1D29]">
                <CreditCard className="h-3.5 w-3.5 text-gray-400" />{order.paymentMethod}
              </p>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-[#1B3B6F]" />
              Customer Information
            </h3>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={order.customer?.avatar} alt={order.customer?.name} />
                <AvatarFallback className="bg-[#1B3B6F] text-white text-xs">
                  {(order.customer?.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm text-[#1A1D29]">{order.customer?.name || 'Unknown'}</p>
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-1">
                  <Mail className="h-3 w-3" />
                  <span>{order.customer?.email || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-0.5">
                  <Phone className="h-3 w-3" />
                  <span>{order.customer?.phone || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-[#1B3B6F]" />
              Order Items
            </h3>
            <div className="space-y-2">
              {(order.products || []).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-[#1A1D29]">{product.name}</p>
                      <p className="text-xs text-[#6B7280]">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#6B7280]">Qty: {product.quantity} x {formatCurrency(product.price)}</p>
                    <p className="font-semibold text-sm text-[#1A1D29]">{formatCurrency(product.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <IndianRupee className="h-4 w-4 text-[#1B3B6F]" />
              Order Summary
            </h3>
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              {(order.serviceChargeAmount != null && order.serviceChargeAmount > 0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service Charge ({order.serviceChargePercent || 0}%):</span>
                  <span className="font-medium">{formatCurrency(order.serviceChargeAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium">{formatCurrency(order.shippingCharges || 0)}</span>
              </div>
              {(order.discount != null && order.discount > 0) && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="mt-1 -mx-4 -mb-4 flex items-center justify-between rounded-b-lg bg-[#1B3B6F] px-4 py-3">
                <span className="text-sm font-semibold text-white/80">Total payable</span>
                <span className="text-lg font-extrabold text-white tabular-nums">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-[#1B3B6F]" />
              Shipping Address
            </h3>
            <div className="p-3 border rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{order.shippingAddress?.name || '-'}</p>
                  <p className="text-xs text-[#6B7280]">{order.shippingAddress?.phone || '-'}</p>
                  <p className="text-sm mt-1">
                    {order.shippingAddress?.addressLine1 || '-'}
                    {order.shippingAddress?.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                  </p>
                  <p className="text-sm">
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                  </p>
                  {order.shippingAddress?.landmark && (
                    <p className="text-xs text-[#6B7280]">Landmark: {order.shippingAddress.landmark}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Information */}
          {order.trackingNumber && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <Truck className="h-4 w-4 text-[#1B3B6F]" />
                Tracking Information
              </h3>
              <div className="p-3 border rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Tracking Number</Label>
                    <p className="font-mono text-sm">{order.trackingNumber}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Courier Partner</Label>
                    <p className="text-sm">{order.courierPartner}</p>
                  </div>
                  {order.estimatedDelivery && (
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Estimated Delivery</Label>
                      <p className="text-sm">{formatDate(order.estimatedDelivery)}</p>
                    </div>
                  )}
                  {order.actualDelivery && (
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Actual Delivery</Label>
                      <p className="text-sm">{formatDate(order.actualDelivery)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Notes</h3>
              <p className="p-3 bg-gray-50 rounded-lg text-sm">{order.notes}</p>
            </div>
          )}

          {/* Cancellation/Return Reason */}
          {(order.cancellationReason || order.returnReason) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                {order.cancellationReason ? 'Cancellation Reason' : 'Return Reason'}
              </h3>
              <p className="p-3 bg-red-50 rounded-lg text-sm border border-red-100">
                {order.cancellationReason || order.returnReason}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
            <div>
              <Label className="text-xs font-medium">Created At</Label>
              <p>{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <Label className="text-xs font-medium">Last Updated</Label>
              <p>{formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="border-t pt-4 flex-shrink-0 gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" onClick={() => onDownloadInvoice(order)}>
            <FileDown className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
