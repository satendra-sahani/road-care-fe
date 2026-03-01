'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import Cookies from 'js-cookie'
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Settings,
  IndianRupee,
  Banknote,
  Handshake,
  Save,
  Loader2,
  ArrowUpDown,
  BadgeCheck,
  Receipt,
  Send,
  Minus,
  Users,
  Truck,
  Wrench,
  Package,
  ArrowRight,
  ArrowUpCircle,
  Image as ImageIcon,
  FileText,
  Download,
  Eye,
  Calendar,
  CalendarDays,
  CalendarRange,
  History,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { paymentAPI } from '@/services/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PaymentRecord {
  _id: string
  paymentFor?: 'service' | 'product'
  serviceRequest?: { _id?: string; requestId?: string; serviceCategory?: string; status?: string }
  order?: { _id?: string; orderId?: string; status?: string; totalAmount?: number; deliveryBoy?: string; deliveryStatus?: string; items?: any[] }
  customer?: { fullName?: string; email?: string; phone?: string }
  mechanic?: { user?: { fullName?: string; phone?: string } }
  deliveryBoy?: { _id?: string; fullName?: string; phone?: string }
  paymentMethod: 'online' | 'cod' | 'wallet'
  paymentStatus: 'pending' | 'initiated' | 'paid' | 'failed' | 'refunded' | 'cod_collected' | 'settled'
  totalAmount: number
  platformCommissionPct: number
  platformAmount: number
  mechanicAmount: number
  walletTransferred?: boolean
  walletTransferredAt?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  codCollectedAt?: string
  codCollectedNote?: string
  codSettledAt?: string
  createdAt: string
  updatedAt: string
}

interface WalletRecord {
  _id: string
  user?: { _id?: string; fullName?: string; email?: string; phone?: string; role?: string }
  balance: number
  totalCredited: number
  totalDebited: number
  lastTransaction?: string
  createdAt: string
  updatedAt: string
}

interface TransactionRecord {
  _id: string
  user?: { _id?: string; fullName?: string; email?: string }
  type: 'credit' | 'debit'
  amount: number
  balance: number
  description?: string
  category?: string
  reference?: string
  createdAt: string
}

interface PaymentStats {
  totalRevenue: number
  platformRevenue: number
  mechanicPayout: number
  totalPayments: number
  onlinePayments: number
  codPayments: number
  pendingCOD: number
  totalWalletBalance?: number
  totalTransactions?: number
}

interface PricingConfig {
  baseFare: number
  pricePerKm: number
  minimumFare: number
  emergencySurcharge: number
  surgeMultiplier: number
  platformCommissionPct: number
  mechanicCommissionPct: number
  updatedAt?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api'

function getToken() {
  return Cookies.get('token') || ''
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Request failed')
  return json
}

// ─── Status config ─────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:       { label: 'Pending',       color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  initiated:     { label: 'Initiated',     color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: RefreshCw },
  paid:          { label: 'Paid',          color: 'bg-green-100 text-green-800 border-green-200',    icon: CheckCircle },
  failed:        { label: 'Failed',        color: 'bg-red-100 text-red-800 border-red-200',          icon: XCircle },
  refunded:      { label: 'Refunded',      color: 'bg-purple-100 text-purple-800 border-purple-200', icon: ArrowUpDown },
  cod_collected: { label: 'COD Collected', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Banknote },
  settled:       { label: 'Settled',       color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: BadgeCheck },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function MethodBadge({ method }: { method: string }) {
  if (method === 'online') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><CreditCard className="h-3 w-3" />Online</span>
  }
  if (method === 'wallet') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200"><Wallet className="h-3 w-3" />Wallet</span>
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Banknote className="h-3 w-3" />COD</span>
}

function PaymentForBadge({ paymentFor }: { paymentFor?: string }) {
  if (paymentFor === 'product') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200"><Package className="h-3 w-3" />Product</span>
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"><Wrench className="h-3 w-3" />Service</span>
}

function fmt(amount: number) {
  return `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Period Type ──────────────────────────────────────────────────────────────
type StatsPeriod = 'today' | 'week' | 'month' | 'all'

const periodOptions: { value: StatsPeriod; label: string; icon: React.ElementType }[] = [
  { value: 'today', label: 'Today', icon: Calendar },
  { value: 'week', label: 'This Week', icon: CalendarDays },
  { value: 'month', label: 'This Month', icon: CalendarRange },
  { value: 'all', label: 'All Time', icon: History },
]

// ─── Stats Cards ─────────────────────────────────────────────────────────────
function StatsCards({
  stats,
  loading,
  period,
  onPeriodChange,
}: {
  stats: PaymentStats | null
  loading: boolean
  period: StatsPeriod
  onPeriodChange: (p: StatsPeriod) => void
}) {
  const cards = [
    {
      title: 'Total Revenue',
      value: fmt(stats?.totalRevenue || 0),
      sub: `${stats?.totalPayments || 0} transactions`,
      icon: IndianRupee,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Platform Revenue',
      value: fmt(stats?.platformRevenue || 0),
      sub: 'Our commission share',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Mechanic Payouts',
      value: fmt(stats?.mechanicPayout || 0),
      sub: 'Mechanics\' share',
      icon: Wallet,
      gradient: 'from-violet-500 to-violet-600',
    },
    {
      title: 'Pending COD',
      value: fmt(stats?.pendingCOD || 0),
      sub: 'Awaiting settlement',
      icon: Handshake,
      gradient: 'from-orange-500 to-orange-600',
    },
  ]

  return (
    <div className="mb-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-500 mr-1">Period:</span>
        <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1">
          {periodOptions.map((opt) => {
            const Icon = opt.icon
            const isActive = period === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => onPeriodChange(opt.value)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            )
          })}
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-500 ml-2" />}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.title} className="overflow-hidden border-0 shadow-sm">
              <div className={`bg-gradient-to-br ${c.gradient} p-4 ${loading ? 'opacity-60' : ''} transition-opacity`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs font-medium">{c.title}</p>
                    <p className="text-white text-2xl font-bold mt-1">{loading ? '...' : c.value}</p>
                    <p className="text-white/70 text-xs mt-0.5">{c.sub}</p>
                  </div>
                  <div className="bg-white/20 rounded-full p-2.5">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── Payment History Tab ──────────────────────────────────────────────────────
function PaymentHistoryTab() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [methodFilter, setMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [transferring, setTransferring] = useState<string | null>(null)
  const [confirmTransfer, setConfirmTransfer] = useState<PaymentRecord | null>(null)
  const [transferPct, setTransferPct] = useState('80')
  const [transferHistory, setTransferHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (methodFilter !== 'all') params.set('paymentMethod', methodFilter)
      if (statusFilter !== 'all') params.set('paymentStatus', statusFilter)
      if (typeFilter !== 'all') params.set('paymentFor', typeFilter)

      const data = await apiFetch(`/admin/payments?${params}`)
      setPayments(data.payments || [])
      setTotalPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, methodFilter, statusFilter, typeFilter])

  useEffect(() => { load() }, [load])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [methodFilter, statusFilter, typeFilter])

  const handleTransferToWallet = async (payment: PaymentRecord) => {
    const pct = parseFloat(transferPct) || 0
    if (pct <= 0 || pct > 100) {
      setError('Percentage must be between 1 and 100')
      return
    }
    setTransferring(payment._id)
    setError('')
    try {
      const calcAmount = parseFloat(((payment.totalAmount * pct) / 100).toFixed(2))
      await apiFetch(`/admin/payments/transfer-to-wallet/${payment._id}`, {
        method: 'POST',
        body: JSON.stringify({ percentage: pct })
      })
      setSuccessMsg(
        payment.paymentFor === 'product'
          ? `${fmt(calcAmount)} (${pct}%) transferred to delivery wallet`
          : `${fmt(calcAmount)} (${pct}%) transferred to mechanic wallet`
      )
      setTimeout(() => setSuccessMsg(''), 4000)
      setPayments(prev => prev.map(p => p._id === payment._id ? { ...p, walletTransferred: true, walletTransferredAt: new Date().toISOString() } : p))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTransferring(null)
      setConfirmTransfer(null)
      setTransferPct('80')
    }
  }

  // Load transfer history when dialog opens
  const openTransferDialog = async (p: PaymentRecord) => {
    setConfirmTransfer(p)
    setTransferPct('80')
    setTransferHistory([])
    setHistoryLoading(true)
    try {
      const data = await apiFetch('/admin/payments/transfer-history?limit=50')
      setTransferHistory(data.transfers || [])
    } catch {
      // Ignore — history is optional
    } finally {
      setHistoryLoading(false)
    }
  }

  // Helper to get order/service status
  const getLinkedStatus = (p: PaymentRecord) => {
    if (p.paymentFor === 'product') {
      return p.order?.status || null
    }
    return p.serviceRequest?.status || null
  }

  // Status badge styling for order/service statuses
  const linkedStatusConfig: Record<string, { label: string; className: string }> = {
    // Order statuses
    placed: { label: 'Placed', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    confirmed: { label: 'Confirmed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    processing: { label: 'Processing', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    shipped: { label: 'Shipped', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    out_for_delivery: { label: 'Out for Delivery', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    delivered: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' },
    returned: { label: 'Returned', className: 'bg-gray-50 text-gray-700 border-gray-200' },
    return_requested: { label: 'Return Requested', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    // Service request statuses
    pending: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    accepted: { label: 'Accepted', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    assigned: { label: 'Assigned', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    in_progress: { label: 'In Progress', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    on_the_way: { label: 'On the Way', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }

  // Check if transfer is possible — show button for all paid/settled rows
  const canTransfer = (p: PaymentRecord) => {
    if (p.walletTransferred) return false
    if (!['paid', 'settled', 'cod_collected'].includes(p.paymentStatus)) return false
    return true
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Payment For" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="service">Service Request</SelectItem>
            <SelectItem value="product">Product Order</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="cod">Cash on Delivery</SelectItem>
            <SelectItem value="wallet">Wallet</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="initiated">Initiated</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cod_collected">COD Collected</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load} className="h-9 gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
        <div className="ml-auto text-sm text-gray-500 flex items-center">
          {total} payment{total !== 1 ? 's' : ''}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-200">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm mb-4 border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />{successMsg}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Request / Order</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Order / Service Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Method</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Total</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Payout</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Wallet</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading payments…
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((p, idx) => {
                  const linkedStatus = getLinkedStatus(p)
                  return (
                    <tr key={p._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                      <td className="px-4 py-3">
                        <PaymentForBadge paymentFor={p.paymentFor} />
                      </td>
                      <td className="px-4 py-3">
                        {p.paymentFor === 'product' ? (
                          <>
                            <div className="font-medium text-cyan-700">{p.order?.orderId || '—'}</div>
                            <div className="text-xs text-gray-500">{p.order?.items?.length || 0} item{(p.order?.items?.length || 0) !== 1 ? 's' : ''}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium text-blue-700">{p.serviceRequest?.requestId || '—'}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[120px]">{p.serviceRequest?.serviceCategory || ''}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.customer?.fullName || '—'}</div>
                        <div className="text-xs text-gray-500">{p.customer?.phone || p.customer?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        {linkedStatus ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${linkedStatusConfig[linkedStatus]?.className || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {p.paymentFor === 'product' ? (
                              <Package className="h-3 w-3" />
                            ) : (
                              <Wrench className="h-3 w-3" />
                            )}
                            {linkedStatusConfig[linkedStatus]?.label || linkedStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><MethodBadge method={p.paymentMethod} /></td>
                      <td className="px-4 py-3 text-right font-semibold">{fmt(p.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-violet-700 font-medium">{fmt(p.mechanicAmount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.paymentStatus} /></td>
                      <td className="px-4 py-3">
                        {p.walletTransferred ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="h-3 w-3" />Sent
                          </span>
                        ) : canTransfer(p) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 border-violet-300 text-violet-700 hover:bg-violet-50"
                            disabled={transferring === p._id}
                            onClick={() => openTransferDialog(p)}
                          >
                            {transferring === p._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <ArrowRight className="h-3 w-3" />
                                {p.paymentFor === 'product' ? 'To Delivery' : 'To Mechanic'}
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transfer Confirmation Dialog */}
      <Dialog open={!!confirmTransfer} onOpenChange={(o) => { if (!o) { setConfirmTransfer(null); setTransferPct('80') } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-violet-600" />
              Transfer to {confirmTransfer?.paymentFor === 'product' ? 'Delivery' : 'Mechanic'} Wallet
            </DialogTitle>
            <DialogDescription>
              Enter percentage to calculate transfer amount for the {confirmTransfer?.paymentFor === 'product' ? 'delivery boy' : 'mechanic'}.
            </DialogDescription>
          </DialogHeader>

          {confirmTransfer && (() => {
            const pct = parseFloat(transferPct) || 0
            const calcAmount = parseFloat(((confirmTransfer.totalAmount * pct) / 100).toFixed(2))
            const retained = parseFloat((confirmTransfer.totalAmount - calcAmount).toFixed(2))

            return (
              <div className="space-y-4 py-2">
                {/* Payment Info */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment For</span>
                    <PaymentForBadge paymentFor={confirmTransfer.paymentFor} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{confirmTransfer.paymentFor === 'product' ? 'Order' : 'Request'}</span>
                    <span className="font-medium">
                      {confirmTransfer.paymentFor === 'product'
                        ? confirmTransfer.order?.orderId || '—'
                        : confirmTransfer.serviceRequest?.requestId || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recipient</span>
                    <span className="font-medium flex items-center gap-1">
                      {confirmTransfer.paymentFor === 'product' ? (
                        <><Truck className="h-3 w-3 text-cyan-600" />{confirmTransfer.deliveryBoy?.fullName || '—'}</>
                      ) : (
                        <><Wrench className="h-3 w-3 text-indigo-600" />{confirmTransfer.mechanic?.user?.fullName || '—'}</>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-500">Total Payment</span>
                    <span className="font-bold text-lg">{fmt(confirmTransfer.totalAmount)}</span>
                  </div>
                </div>

                {/* Percentage Input */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Transfer Percentage</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={transferPct}
                      onChange={(e) => setTransferPct(e.target.value)}
                      className="w-24 h-10 text-center text-lg font-bold"
                      placeholder="%"
                    />
                    <span className="text-gray-400 font-medium text-lg">%</span>
                    <div className="flex-1 flex gap-1.5">
                      {[60, 70, 80, 90, 100].map(v => (
                        <Button
                          key={v}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`h-8 px-2.5 text-xs ${transferPct === String(v) ? 'bg-violet-100 border-violet-400 text-violet-700' : ''}`}
                          onClick={() => setTransferPct(String(v))}
                        >
                          {v}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Live Calculation */}
                  {pct > 0 && pct <= 100 && (
                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-violet-600">Transfer to {confirmTransfer.paymentFor === 'product' ? 'Delivery' : 'Mechanic'}</span>
                        <span className="font-bold text-violet-700 text-lg">{fmt(calcAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Platform Retains</span>
                        <span className="font-medium text-emerald-700">{fmt(retained)}</span>
                      </div>
                      <div className="text-xs text-violet-500 mt-1">
                        {pct}% of {fmt(confirmTransfer.totalAmount)} = {fmt(calcAmount)}
                      </div>
                    </div>
                  )}
                  {(pct <= 0 || pct > 100) && transferPct !== '' && (
                    <div className="text-xs text-red-500">Percentage must be between 1 and 100</div>
                  )}
                </div>

                {/* Transfer History */}
                <div className="border-t border-gray-200 pt-3">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                    <Receipt className="h-4 w-4 text-gray-400" />
                    Recent Transfer History
                  </h4>
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-4 text-gray-400 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />Loading…
                    </div>
                  ) : transferHistory.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">No transfers yet</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {transferHistory.map((t: any) => (
                        <div key={t._id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <PaymentForBadge paymentFor={t.paymentFor} />
                              <span className="font-medium text-gray-700 truncate">
                                {t.paymentFor === 'product' ? t.order?.orderId : t.serviceRequest?.requestId || '—'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              {t.recipientRole === 'delivery' ? (
                                <Truck className="h-3 w-3 text-cyan-500" />
                              ) : (
                                <Wrench className="h-3 w-3 text-indigo-500" />
                              )}
                              <span>{t.recipientUser?.fullName || '—'}</span>
                              <span className="text-gray-300 mx-1">|</span>
                              <span>by {t.transferredBy?.fullName || 'Admin'}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-violet-700">{fmt(t.transferAmount)}</div>
                            <div className="text-gray-400">{t.percentage}% of {fmt(t.paymentTotalAmount)}</div>
                            <div className="text-gray-400">{fmtDate(t.createdAt)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmTransfer(null)}>Cancel</Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
              disabled={!!transferring || (parseFloat(transferPct) || 0) <= 0 || (parseFloat(transferPct) || 0) > 100}
              onClick={() => confirmTransfer && handleTransferToWallet(confirmTransfer)}
            >
              {transferring ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Transferring…</>
              ) : (
                <><Send className="h-4 w-4" />Transfer {fmt(((confirmTransfer?.totalAmount || 0) * (parseFloat(transferPct) || 0)) / 100)}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── COD Management Tab ───────────────────────────────────────────────────────
function CODManagementTab({ onSettled }: { onSettled: () => void }) {
  const [pending,  setPending]  = useState<PaymentRecord[]>([])
  const [settled,  setSettled]  = useState<PaymentRecord[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [settling, setSettling] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [pendingData, settledData] = await Promise.all([
        apiFetch('/admin/payments?paymentMethod=cod&paymentStatus=cod_collected&limit=50'),
        apiFetch('/admin/payments?paymentMethod=cod&paymentStatus=settled&limit=20'),
      ])
      setPending(pendingData.payments || [])
      setSettled(settledData.payments || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Get the settle/reference ID for a payment — service request, order, or payment itself
  const getRefId = (p: PaymentRecord) => {
    if (p.paymentFor === 'product' && p.order?._id) return p.order._id
    if (p.serviceRequest?._id) return p.serviceRequest._id
    return p._id
  }

  const handleSettle = async (refId: string) => {
    setSettling(refId)
    try {
      await apiFetch(`/admin/payments/settle/${refId}`, { method: 'POST' })
      // Move payment from pending to settled list
      const moved = pending.find(p => getRefId(p) === refId)
      if (moved) {
        setPending(prev => prev.filter(p => getRefId(p) !== refId))
        setSettled(prev => [{ ...moved, paymentStatus: 'settled', codSettledAt: new Date().toISOString() }, ...prev])
      }
      onSettled()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSettling(null)
      setConfirmId(null)
    }
  }

  // ── Card for a single COD payment ─────────────────────────────────────────
  const CODCard = ({ p, showSettle }: { p: PaymentRecord; showSettle: boolean }) => {
    const refId = getRefId(p)
    const isProduct = p.paymentFor === 'product'
    const assigneeName = isProduct
      ? (p.deliveryBoy?.fullName || '—')
      : (p.mechanic?.user?.fullName || '—')
    const assigneePhone = isProduct
      ? (p.deliveryBoy?.phone || '')
      : (p.mechanic?.user?.phone || '')

    return (
      <div className={`bg-white rounded-xl border shadow-sm p-4 ${showSettle ? 'border-orange-200' : 'border-emerald-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">

          {/* Info grid */}
          <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-medium">
                {isProduct ? 'Order ID' : 'Request ID'}
              </p>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-blue-700">
                  {isProduct ? (p.order?.orderId || '—') : (p.serviceRequest?.requestId || '—')}
                </p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isProduct ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-purple-50 text-purple-600 border border-purple-200'}`}>
                  {isProduct ? 'Product' : 'Service'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Customer</p>
              <p className="font-medium text-gray-800">{p.customer?.fullName || '—'}</p>
              {p.customer?.phone && (
                <p className="text-xs text-gray-400">{p.customer.phone}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">
                {isProduct ? 'Delivery Boy' : 'Mechanic'}
              </p>
              <p className="font-medium text-gray-800">{assigneeName}</p>
              {assigneePhone && (
                <p className="text-xs text-gray-400">{assigneePhone}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">
                {showSettle ? 'Collected At' : 'Settled At'}
              </p>
              <p className="font-medium text-gray-700 text-xs">
                {fmtDate(showSettle ? p.codCollectedAt : p.codSettledAt)}
              </p>
            </div>
            {/* Collection note */}
            {p.codCollectedNote && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 font-medium">Collection Note</p>
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1 mt-0.5 border border-gray-100 italic">
                  &ldquo;{p.codCollectedNote}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Amount breakdown */}
          <div className="flex gap-4 text-sm sm:border-l sm:pl-4 border-gray-200 shrink-0">
            <div className="text-center">
              <p className="text-gray-400 text-xs font-medium">Total</p>
              <p className="font-bold text-gray-900">{fmt(p.totalAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs font-medium">Platform</p>
              <p className="font-semibold text-emerald-700">{fmt(p.platformAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs font-medium">{isProduct ? 'Payout' : 'Mechanic'}</p>
              <p className="font-semibold text-violet-700">{fmt(p.mechanicAmount)}</p>
            </div>
          </div>

          {/* Action */}
          {showSettle ? (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0 self-center"
              disabled={settling === refId}
              onClick={() => setConfirmId(refId)}
            >
              {settling === refId ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Settling…</>
              ) : (
                <><Handshake className="h-3.5 w-3.5" />Mark Settled</>
              )}
            </Button>
          ) : (
            <div className="shrink-0 self-center">
              <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 gap-1 px-2">
                <BadgeCheck className="h-3 w-3" />
                Settled
              </Badge>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ── Pending Settlement ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-orange-500" />
              Pending Settlement
              {pending.length > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full border border-orange-200">
                  {pending.length}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">Mechanics / delivery boys have collected cash — confirm settlement to close.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-200">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading…
          </div>
        ) : pending.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
            <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <p className="font-medium text-gray-700">All COD payments are settled!</p>
            <p className="text-sm text-gray-500 mt-1">No pending COD collections at the moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(p => <CODCard key={p._id} p={p} showSettle={true} />)}
          </div>
        )}
      </div>

      {/* ── Settled History ────────────────────────────────────── */}
      {!loading && settled.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
            Recently Settled
            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              {settled.length}
            </span>
          </h3>
          <div className="space-y-3">
            {settled.map(p => <CODCard key={p._id} p={p} showSettle={false} />)}
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm COD Settlement</DialogTitle>
            <DialogDescription>
              This will mark the payment as settled. The cash has been confirmed collected.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!!settling}
              onClick={() => confirmId && handleSettle(confirmId)}
            >
              {settling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Handshake className="h-4 w-4 mr-2" />}
              Confirm Settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Pricing Config Tab ───────────────────────────────────────────────────────
function PricingConfigTab() {
  const [config, setConfig] = useState<PricingConfig>({
    baseFare: 100,
    pricePerKm: 15,
    minimumFare: 200,
    emergencySurcharge: 100,
    surgeMultiplier: 1,
    platformCommissionPct: 20,
    mechanicCommissionPct: 80,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    apiFetch('/admin/payments/pricing')
      .then(d => setConfig(d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key: keyof PricingConfig, value: string) => {
    const num = parseFloat(value) || 0
    setConfig(prev => {
      const next = { ...prev, [key]: num }
      // Auto-sync the other commission pct
      if (key === 'platformCommissionPct') {
        next.mechanicCommissionPct = Math.max(0, Math.min(100, parseFloat((100 - num).toFixed(2))))
      } else if (key === 'mechanicCommissionPct') {
        next.platformCommissionPct = Math.max(0, Math.min(100, parseFloat((100 - num).toFixed(2))))
      }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const data = await apiFetch('/admin/payments/pricing', {
        method: 'PUT',
        body: JSON.stringify(config),
      })
      setConfig(data.data)
      setSuccess('Pricing configuration saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading configuration…
      </div>
    )
  }

  // Calculate example fare
  const exampleFare = Math.max(
    config.baseFare + config.pricePerKm * 10,
    config.minimumFare
  ) * config.surgeMultiplier

  const commissionValid = Math.round(config.platformCommissionPct + config.mechanicCommissionPct) === 100

  return (
    <div className="max-w-3xl">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-200">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm mb-4 border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />{success}
        </div>
      )}

      {/* Fare Configuration */}
      <Card className="mb-5 border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-blue-600" />
            Fare Configuration
          </CardTitle>
          <CardDescription>Configure how service fares are calculated</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="baseFare" className="text-sm font-medium">Base Fare (₹)</Label>
            <p className="text-xs text-gray-500 mb-1.5">Fixed charge regardless of distance</p>
            <Input
              id="baseFare"
              type="number"
              min="0"
              value={config.baseFare}
              onChange={e => handleChange('baseFare', e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="pricePerKm" className="text-sm font-medium">Price per Km (₹)</Label>
            <p className="text-xs text-gray-500 mb-1.5">Charge for each kilometre of distance</p>
            <Input
              id="pricePerKm"
              type="number"
              min="0"
              value={config.pricePerKm}
              onChange={e => handleChange('pricePerKm', e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="minimumFare" className="text-sm font-medium">Minimum Fare (₹)</Label>
            <p className="text-xs text-gray-500 mb-1.5">Minimum total charge per service</p>
            <Input
              id="minimumFare"
              type="number"
              min="0"
              value={config.minimumFare}
              onChange={e => handleChange('minimumFare', e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="emergencySurcharge" className="text-sm font-medium">Emergency Surcharge (₹)</Label>
            <p className="text-xs text-gray-500 mb-1.5">Extra charge for emergency/roadside requests</p>
            <Input
              id="emergencySurcharge"
              type="number"
              min="0"
              value={config.emergencySurcharge}
              onChange={e => handleChange('emergencySurcharge', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="surgeMultiplier" className="text-sm font-medium">
              Surge Multiplier: <span className="text-blue-600">{config.surgeMultiplier}x</span>
            </Label>
            <p className="text-xs text-gray-500 mb-1.5">Multiplies total fare during high demand (1 = no surge)</p>
            <input
              id="surgeMultiplier"
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={config.surgeMultiplier}
              onChange={e => handleChange('surgeMultiplier', e.target.value)}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>1x (normal)</span>
              <span>2x</span>
              <span>3x</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Split */}
      <Card className="mb-5 border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-violet-600" />
            Revenue Split
          </CardTitle>
          <CardDescription>Platform commission vs. mechanic payout (must total 100%)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-emerald-700">Platform Commission (%)</Label>
              <p className="text-xs text-gray-500 mb-1.5">Percentage we keep</p>
              <Input
                type="number"
                min="0"
                max="100"
                value={config.platformCommissionPct}
                onChange={e => handleChange('platformCommissionPct', e.target.value)}
                className="h-9 border-emerald-300 focus:ring-emerald-500"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-violet-700">Mechanic Payout (%)</Label>
              <p className="text-xs text-gray-500 mb-1.5">Percentage mechanic earns</p>
              <Input
                type="number"
                min="0"
                max="100"
                value={config.mechanicCommissionPct}
                onChange={e => handleChange('mechanicCommissionPct', e.target.value)}
                className="h-9 border-violet-300 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Visual split bar */}
          <div>
            <div className="flex text-xs text-gray-600 mb-1 justify-between">
              <span className="text-emerald-700 font-medium">Platform: {config.platformCommissionPct}%</span>
              <span className={`font-medium ${commissionValid ? 'text-gray-500' : 'text-red-500'}`}>
                Total: {(config.platformCommissionPct + config.mechanicCommissionPct).toFixed(1)}%
                {!commissionValid && ' ⚠️ Must be 100%'}
              </span>
              <span className="text-violet-700 font-medium">Mechanic: {config.mechanicCommissionPct}%</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden bg-gray-200 flex">
              <div
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(100, config.platformCommissionPct)}%` }}
              />
              <div
                className="bg-violet-500 transition-all duration-300"
                style={{ width: `${Math.min(100, config.mechanicCommissionPct)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example Calculation */}
      <Card className="mb-5 bg-blue-50 border-blue-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
            <DollarSign className="h-4 w-4" />
            Example: 10 km service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3 text-center border border-blue-200">
              <p className="text-gray-500 text-xs">Customer Pays</p>
              <p className="font-bold text-gray-900 text-lg">{fmt(exampleFare)}</p>
              <p className="text-gray-400 text-xs">{config.baseFare} + {config.pricePerKm}×10{config.surgeMultiplier !== 1 ? ` × ${config.surgeMultiplier}x` : ''}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-200">
              <p className="text-emerald-600 text-xs">Platform Gets</p>
              <p className="font-bold text-emerald-700 text-lg">{fmt(exampleFare * config.platformCommissionPct / 100)}</p>
              <p className="text-emerald-400 text-xs">{config.platformCommissionPct}%</p>
            </div>
            <div className="bg-violet-50 rounded-lg p-3 text-center border border-violet-200">
              <p className="text-violet-600 text-xs">Mechanic Gets</p>
              <p className="font-bold text-violet-700 text-lg">{fmt(exampleFare * config.mechanicCommissionPct / 100)}</p>
              <p className="text-violet-400 text-xs">{config.mechanicCommissionPct}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !commissionValid}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
          ) : (
            <><Save className="h-4 w-4" />Save Configuration</>
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Wallets Tab ──────────────────────────────────────────────────────────────
function WalletsTab() {
  const [wallets, setWallets] = useState<WalletRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Transfer / Debit dialog state
  const [actionDialog, setActionDialog] = useState<{ type: 'transfer' | 'debit'; wallet: WalletRecord } | null>(null)
  const [actionAmount, setActionAmount] = useState('')
  const [actionDescription, setActionDescription] = useState('')
  const [actionCategory, setActionCategory] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  // Percentage-based transfer state
  const [transferMode, setTransferMode] = useState<'fixed' | 'percentage'>('fixed')
  const [baseAmount, setBaseAmount] = useState('')
  const [percentage, setPercentage] = useState('')
  const calculatedAmount = transferMode === 'percentage'
    ? ((parseFloat(baseAmount) || 0) * (parseFloat(percentage) || 0) / 100).toFixed(2)
    : actionAmount

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = { page, limit: 15 }
      if (roleFilter !== 'all') params.role = roleFilter
      if (searchTerm) params.search = searchTerm

      const response = await paymentAPI.getWallets(params)
      const data = response.data
      setWallets(data.wallets || data.data || [])
      setTotalPages(data.totalPages || data.pages || 1)
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load wallets')
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, searchTerm])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [roleFilter, searchTerm])

  const handleAction = async () => {
    const finalAmount = transferMode === 'percentage' ? parseFloat(calculatedAmount) : parseFloat(actionAmount)
    if (!actionDialog || isNaN(finalAmount) || finalAmount <= 0) {
      setActionError('Please enter a valid amount')
      return
    }
    setActionLoading(true)
    setActionError('')
    try {
      const userId = actionDialog.wallet.user?._id || actionDialog.wallet._id

      const desc = transferMode === 'percentage' && actionDialog.type === 'transfer'
        ? (actionDescription || `${percentage}% of ₹${baseAmount}`)
        : (actionDescription || undefined)

      if (actionDialog.type === 'transfer') {
        await paymentAPI.transfer({ userId, amount: finalAmount, description: desc })
      } else {
        await paymentAPI.debit({
          userId,
          amount: finalAmount,
          description: actionDescription || undefined,
          category: actionCategory || undefined,
        })
      }

      setActionDialog(null)
      resetActionForm()
      load() // Refresh wallets
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const resetActionForm = () => {
    setActionAmount('')
    setActionDescription('')
    setActionCategory('')
    setTransferMode('fixed')
    setBaseAmount('')
    setPercentage('')
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="mechanic">Mechanic</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load} className="h-9 gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
        <div className="ml-auto text-sm text-gray-500 flex items-center">
          {total} wallet{total !== 1 ? 's' : ''}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-200">{error}</div>
      )}

      {/* Wallets Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Role</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Balance</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Total Credited</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Total Debited</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Last Transaction</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading wallets...
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No wallets found
                  </td>
                </tr>
              ) : (
                wallets.map((w, idx) => (
                  <tr key={w._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{w.user?.fullName || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{w.user?.email || w.user?.phone || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                        {w.user?.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(w.balance)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">{fmt(w.totalCredited)}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">{fmt(w.totalDebited)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(w.lastTransaction || w.updatedAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => setActionDialog({ type: 'transfer', wallet: w })}
                        >
                          <Send className="h-3 w-3" />
                          Credit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 text-red-700 border-red-200 hover:bg-red-50"
                          onClick={() => setActionDialog({ type: 'debit', wallet: w })}
                        >
                          <Minus className="h-3 w-3" />
                          Debit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transfer / Debit Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => { if (!o) { setActionDialog(null); setActionError(''); resetActionForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === 'transfer' ? 'Credit Wallet' : 'Debit Wallet'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.type === 'transfer'
                ? `Add funds to ${actionDialog?.wallet.user?.fullName || 'user'}'s wallet (${actionDialog?.wallet.user?.role || 'user'})`
                : `Deduct funds from ${actionDialog?.wallet.user?.fullName || 'user'}'s wallet`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Current Balance</Label>
                <p className="font-bold text-lg">{fmt(actionDialog?.wallet.balance || 0)}</p>
              </div>
              {actionDialog?.wallet.user?.role && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                  {actionDialog.wallet.user.role}
                </span>
              )}
            </div>

            {/* Transfer Mode Toggle (only for credit) */}
            {actionDialog?.type === 'transfer' && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Transfer Mode</Label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTransferMode('fixed')}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      transferMode === 'fixed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <IndianRupee className="h-3.5 w-3.5" />
                    Fixed Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferMode('percentage')}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      transferMode === 'percentage'
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Percentage Based
                  </button>
                </div>
              </div>
            )}

            {/* Fixed Amount Input */}
            {(actionDialog?.type === 'debit' || transferMode === 'fixed') && (
              <div>
                <Label htmlFor="amount" className="text-sm font-medium">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="h-9 mt-1"
                />
              </div>
            )}

            {/* Percentage Based Inputs */}
            {actionDialog?.type === 'transfer' && transferMode === 'percentage' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="baseAmount" className="text-sm font-medium">Total / Base Amount (₹)</Label>
                  <p className="text-xs text-gray-500 mb-1">E.g. payment total or service cost</p>
                  <Input
                    id="baseAmount"
                    type="number"
                    min="1"
                    placeholder="Enter total amount"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="percentage" className="text-sm font-medium">
                    Percentage (%)
                  </Label>
                  <p className="text-xs text-gray-500 mb-1">How much to transfer from the base amount</p>
                  <Input
                    id="percentage"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g. 80"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Calculation Preview */}
                {parseFloat(baseAmount) > 0 && parseFloat(percentage) > 0 && (
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-violet-700 font-medium">Transfer Amount:</span>
                      <span className="text-violet-900 font-bold text-lg">
                        ₹{parseFloat(calculatedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-xs text-violet-500 mt-1">
                      {percentage}% of ₹{parseFloat(baseAmount).toLocaleString('en-IN')} = ₹{parseFloat(calculatedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Reason for this transaction"
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                className="h-9 mt-1"
              />
            </div>

            {actionDialog?.type === 'debit' && (
              <div>
                <Label htmlFor="category" className="text-sm font-medium">Category (optional)</Label>
                <Select value={actionCategory} onValueChange={setActionCategory}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="penalty">Penalty</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {actionError && (
              <div className="bg-red-50 text-red-700 p-2 rounded text-sm border border-red-200">{actionError}</div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setActionDialog(null); setActionError(''); resetActionForm(); }}>Cancel</Button>
            <Button
              className={actionDialog?.type === 'transfer' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
              disabled={
                actionLoading ||
                (transferMode === 'fixed' && !actionAmount) ||
                (transferMode === 'percentage' && (!baseAmount || !percentage || parseFloat(calculatedAmount) <= 0))
              }
              onClick={handleAction}
            >
              {actionLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</>
              ) : actionDialog?.type === 'transfer' ? (
                <><Send className="h-4 w-4 mr-2" />Credit {transferMode === 'percentage' ? fmt(parseFloat(calculatedAmount) || 0) : 'Wallet'}</>
              ) : (
                <><Minus className="h-4 w-4 mr-2" />Debit Wallet</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────
function TransactionsTab() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = { page, limit: 20 }
      if (typeFilter !== 'all') params.type = typeFilter
      if (categoryFilter !== 'all') params.category = categoryFilter

      const response = await paymentAPI.getTransactions(params)
      const data = response.data
      setTransactions(data.transactions || data.data || [])
      setTotalPages(data.totalPages || data.pages || 1)
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, categoryFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [typeFilter, categoryFilter])

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
            <SelectItem value="debit">Debit</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="order">Order</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="penalty">Penalty</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="fee">Fee</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load} className="h-9 gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
        <div className="ml-auto text-sm text-gray-500 flex items-center">
          {total} transaction{total !== 1 ? 's' : ''}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-200">{error}</div>
      )}

      {/* Transactions Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Amount</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Balance After</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Description</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((t, idx) => (
                  <tr key={t._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.user?.fullName || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{t.user?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      {t.type === 'credit' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <TrendingUp className="h-3 w-3" />
                          Credit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          <Minus className="h-3 w-3" />
                          Debit
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${t.type === 'credit' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {t.type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{fmt(t.balance)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate">{t.description || '-'}</td>
                    <td className="px-4 py-3">
                      {t.category ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 capitalize">
                          {t.category}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Withdrawals Tab ─────────────────────────────────────────────────────────
interface WithdrawalRecord {
  _id: string
  withdrawalId: string
  user?: { fullName?: string; email?: string; phone?: string; role?: string }
  amount: number
  status: 'pending' | 'processed' | 'rejected'
  paymentId?: string
  paymentMode?: string
  screenshot?: { url?: string; fileId?: string }
  notes?: string
  rejectionReason?: string
  processedBy?: { fullName?: string; role?: string }
  processedAt?: string
  createdAt: string
}

interface WithdrawalStats {
  pending: { count: number; totalAmount: number }
  processed: { count: number; totalAmount: number }
  rejected: { count: number; totalAmount: number }
}

function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([])
  const [wStats, setWStats] = useState<WithdrawalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Process dialog
  const [processDialog, setProcessDialog] = useState<WithdrawalRecord | null>(null)
  const [processPaymentId, setProcessPaymentId] = useState('')
  const [processPaymentMode, setProcessPaymentMode] = useState('')
  const [processNotes, setProcessNotes] = useState('')
  const [processScreenshot, setProcessScreenshot] = useState<File | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState<WithdrawalRecord | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // View screenshot dialog
  const [viewScreenshot, setViewScreenshot] = useState<string | null>(null)

  const loadWithdrawals = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 15 }
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await paymentAPI.getWithdrawals(params)
      if (res.data?.success) {
        setWithdrawals(res.data.data || [])
        setTotalPages(res.data.pagination?.pages || 1)
        setTotal(res.data.pagination?.total || 0)
      }
    } catch (e) {
      console.error('Load withdrawals error:', e)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  const loadStats = useCallback(async () => {
    try {
      const res = await paymentAPI.getWithdrawalStats()
      if (res.data?.success) {
        setWStats(res.data.data)
      }
    } catch (e) {
      console.error('Load withdrawal stats error:', e)
    }
  }, [])

  useEffect(() => {
    loadWithdrawals()
    loadStats()
  }, [loadWithdrawals])

  const handleProcess = async () => {
    if (!processDialog || !processPaymentId.trim() || !processPaymentMode) return
    setActionLoading(true)
    try {
      const formData = new FormData()
      formData.append('paymentId', processPaymentId.trim())
      formData.append('paymentMode', processPaymentMode)
      if (processNotes.trim()) formData.append('notes', processNotes.trim())
      if (processScreenshot) formData.append('screenshot', processScreenshot)

      const res = await paymentAPI.processWithdrawal(processDialog._id, formData)
      if (res.data?.success) {
        setProcessDialog(null)
        resetProcessForm()
        loadWithdrawals()
        loadStats()
      } else {
        alert(res.data?.message || 'Failed to process withdrawal')
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error processing withdrawal')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectDialog) return
    setActionLoading(true)
    try {
      const res = await paymentAPI.rejectWithdrawal(rejectDialog._id, { reason: rejectReason.trim() || 'No reason provided' })
      if (res.data?.success) {
        setRejectDialog(null)
        setRejectReason('')
        loadWithdrawals()
        loadStats()
      } else {
        alert(res.data?.message || 'Failed to reject withdrawal')
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error rejecting withdrawal')
    } finally {
      setActionLoading(false)
    }
  }

  const resetProcessForm = () => {
    setProcessPaymentId('')
    setProcessPaymentMode('')
    setProcessNotes('')
    setProcessScreenshot(null)
  }

  const openProcessDialog = (w: WithdrawalRecord) => {
    resetProcessForm()
    setProcessDialog(w)
  }

  const openRejectDialog = (w: WithdrawalRecord) => {
    setRejectReason('')
    setRejectDialog(w)
  }

  const paymentModeOptions = [
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'other', label: 'Other' },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Processed</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  const formatDate = (d?: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {wStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">₹{(wStats.pending.totalAmount || 0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400">{wStats.pending.count} request(s)</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Processed</p>
                  <p className="text-2xl font-bold text-green-600">₹{(wStats.processed.totalAmount || 0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400">{wStats.processed.count} completed</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">₹{(wStats.rejected.totalAmount || 0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400">{wStats.rejected.count} rejected</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => { loadWithdrawals(); loadStats() }}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        <span className="ml-auto text-sm text-gray-500">{total} withdrawal(s)</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ArrowUpCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No withdrawal requests</p>
          <p className="text-sm">Requests from mechanics and delivery users will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Payment Info</th>
                  <th className="px-4 py-3 text-left">Requested</th>
                  <th className="px-4 py-3 text-left">Processed</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w, idx) => (
                  <tr key={w._id} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-violet-600">{w.withdrawalId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{w.user?.fullName || '—'}</div>
                      <div className="text-xs text-gray-400">{w.user?.phone || w.user?.email || ''}</div>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{w.user?.role || 'mechanic'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-base font-bold text-gray-800">₹{w.amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(w.status)}</td>
                    <td className="px-4 py-3">
                      {w.status === 'processed' ? (
                        <div>
                          <div className="font-medium text-xs text-gray-700">
                            {paymentModeOptions.find(p => p.value === w.paymentMode)?.label || w.paymentMode || '—'}
                          </div>
                          {w.paymentId && (
                            <div className="text-xs text-gray-400 font-mono">{w.paymentId}</div>
                          )}
                          {w.screenshot?.url && (
                            <button
                              onClick={() => setViewScreenshot(w.screenshot?.url || null)}
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Eye className="h-3 w-3" /> View Proof
                            </button>
                          )}
                          {w.notes && (
                            <div className="text-[10px] text-gray-400 mt-0.5">Note: {w.notes}</div>
                          )}
                        </div>
                      ) : w.status === 'rejected' ? (
                        <div className="text-xs text-red-500 max-w-[200px] truncate" title={w.rejectionReason}>
                          {w.rejectionReason || '—'}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(w.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {w.processedAt ? (
                        <div>
                          <div>{formatDate(w.processedAt)}</div>
                          {w.processedBy && (
                            <div className="text-[10px] text-gray-400">By {w.processedBy.fullName}</div>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {w.status === 'pending' && (
                        <div className="flex items-center gap-1 justify-center">
                          <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => openProcessDialog(w)}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Process
                          </Button>
                          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => openRejectDialog(w)}>
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Process Dialog ── */}
      <Dialog open={!!processDialog} onOpenChange={() => { setProcessDialog(null); resetProcessForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Process Withdrawal
            </DialogTitle>
            <DialogDescription>
              Confirm payment details for withdrawal {processDialog?.withdrawalId}
            </DialogDescription>
          </DialogHeader>

          {processDialog && (
            <div className="space-y-4 py-2">
              {/* Withdrawal Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{processDialog.user?.fullName || '—'}</p>
                    <p className="text-xs text-gray-500">{processDialog.user?.phone || processDialog.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">₹{processDialog.amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400">{processDialog.withdrawalId}</p>
                  </div>
                </div>
              </div>

              {/* Payment ID */}
              <div>
                <Label className="text-sm font-semibold">Payment Reference ID <span className="text-red-500">*</span></Label>
                <Input
                  className="mt-1"
                  placeholder="e.g. UPI-REF-12345 or NEFT-TXN-567"
                  value={processPaymentId}
                  onChange={(e) => setProcessPaymentId(e.target.value)}
                />
              </div>

              {/* Payment Mode */}
              <div>
                <Label className="text-sm font-semibold">Payment Mode <span className="text-red-500">*</span></Label>
                <Select value={processPaymentMode} onValueChange={setProcessPaymentMode}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentModeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Screenshot */}
              <div>
                <Label className="text-sm font-semibold">Payment Screenshot <span className="text-xs text-gray-400">(optional)</span></Label>
                <Input
                  type="file"
                  accept="image/*"
                  className="mt-1"
                  onChange={(e) => setProcessScreenshot(e.target.files?.[0] || null)}
                />
                {processScreenshot && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" /> {processScreenshot.name}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label className="text-sm font-semibold">Notes <span className="text-xs text-gray-400">(optional)</span></Label>
                <Textarea
                  className="mt-1"
                  placeholder="Any additional notes..."
                  rows={2}
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setProcessDialog(null); resetProcessForm() }}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={!processPaymentId.trim() || !processPaymentMode || actionLoading}
              onClick={handleProcess}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Confirm & Process ₹{processDialog?.amount.toLocaleString('en-IN')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectReason('') }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Withdrawal
            </DialogTitle>
            <DialogDescription>
              Reject withdrawal {rejectDialog?.withdrawalId} of ₹{rejectDialog?.amount.toLocaleString('en-IN')} from {rejectDialog?.user?.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Label className="text-sm font-semibold">Reason for Rejection</Label>
            <Textarea
              className="mt-1"
              placeholder="Provide reason for rejection..."
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectReason('') }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={handleReject}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
              Reject Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Screenshot Viewer ── */}
      <Dialog open={!!viewScreenshot} onOpenChange={() => setViewScreenshot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          {viewScreenshot && (
            <div className="flex justify-center">
              <img src={viewScreenshot} alt="Payment Screenshot" className="max-h-[70vh] rounded-lg object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PaymentManagement() {
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('history')
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('month')

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const response = await paymentAPI.getStats({ period: statsPeriod })
      const data = response.data
      setStats(data.data || data)
    } catch {
      // silently ignore
    } finally {
      setStatsLoading(false)
    }
  }, [statsPeriod])

  useEffect(() => { loadStats() }, [loadStats])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            Payment Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Monitor revenue, manage wallets, transactions, and configure service pricing
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStats}
          disabled={statsLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={statsLoading} period={statsPeriod} onPeriodChange={setStatsPeriod} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-5 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Receipt className="h-4 w-4" />
            Payment History
          </TabsTrigger>
          <TabsTrigger value="wallets" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Wallet className="h-4 w-4" />
            Wallets
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ArrowUpDown className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="cod" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Banknote className="h-4 w-4" />
            COD Settlement
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ArrowUpCircle className="h-4 w-4" />
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Settings className="h-4 w-4" />
            Pricing Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <PaymentHistoryTab />
        </TabsContent>

        <TabsContent value="wallets">
          <WalletsTab />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTab />
        </TabsContent>

        <TabsContent value="cod">
          <CODManagementTab onSettled={loadStats} />
        </TabsContent>

        <TabsContent value="withdrawals">
          <WithdrawalsTab />
        </TabsContent>

        <TabsContent value="pricing">
          <PricingConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
