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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface PaymentRecord {
  _id: string
  serviceRequest?: { requestId?: string; serviceCategory?: string; status?: string }
  customer?: { fullName?: string; email?: string; phone?: string }
  mechanic?: { user?: { fullName?: string; phone?: string } }
  paymentMethod: 'online' | 'cod'
  paymentStatus: 'pending' | 'initiated' | 'paid' | 'failed' | 'refunded' | 'cod_collected' | 'settled'
  totalAmount: number
  platformCommissionPct: number
  platformAmount: number
  mechanicAmount: number
  razorpayOrderId?: string
  razorpayPaymentId?: string
  codCollectedAt?: string
  codSettledAt?: string
  createdAt: string
  updatedAt: string
}

interface PaymentStats {
  totalRevenue: number
  platformRevenue: number
  mechanicPayout: number
  totalPayments: number
  onlinePayments: number
  codPayments: number
  pendingCOD: number
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
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Banknote className="h-3 w-3" />COD</span>
}

function fmt(amount: number) {
  return `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Stats Cards ─────────────────────────────────────────────────────────────
function StatsCards({ stats }: { stats: PaymentStats | null }) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <Card key={c.title} className="overflow-hidden border-0 shadow-sm">
            <div className={`bg-gradient-to-br ${c.gradient} p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-medium">{c.title}</p>
                  <p className="text-white text-2xl font-bold mt-1">{c.value}</p>
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
  )
}

// ─── Payment History Tab ──────────────────────────────────────────────────────
function PaymentHistoryTab() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [methodFilter, setMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (methodFilter !== 'all') params.set('paymentMethod', methodFilter)
      if (statusFilter !== 'all') params.set('paymentStatus', statusFilter)

      const data = await apiFetch(`/admin/payments?${params}`)
      setPayments(data.payments || [])
      setTotalPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, methodFilter, statusFilter])

  useEffect(() => { load() }, [load])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [methodFilter, statusFilter])

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="cod">Cash on Delivery</SelectItem>
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

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Request</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Method</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Total</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Platform</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Mechanic</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading payments…
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((p, idx) => (
                  <tr key={p._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-blue-700">{p.serviceRequest?.requestId || '—'}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px]">{p.serviceRequest?.serviceCategory || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.customer?.fullName || '—'}</div>
                      <div className="text-xs text-gray-500">{p.customer?.phone || p.customer?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3"><MethodBadge method={p.paymentMethod} /></td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(p.totalAmount)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">{fmt(p.platformAmount)}</td>
                    <td className="px-4 py-3 text-right text-violet-700 font-medium">{fmt(p.mechanicAmount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.paymentStatus} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
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

// ─── COD Management Tab ───────────────────────────────────────────────────────
function CODManagementTab({ onSettled }: { onSettled: () => void }) {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [settling, setSettling] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/admin/payments?paymentStatus=cod_collected&limit=50')
      setPayments(data.payments || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSettle = async (serviceRequestId: string) => {
    setSettling(serviceRequestId)
    try {
      await apiFetch(`/admin/payments/settle/${serviceRequestId}`, { method: 'POST' })
      setPayments(prev => prev.filter(p => p.serviceRequest?._id !== serviceRequestId && p._id !== serviceRequestId))
      onSettled()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSettling(null)
      setConfirmId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Cash on Delivery — Pending Settlement</h3>
          <p className="text-sm text-gray-500">Mechanics have collected cash. Confirm settlement to mark complete.</p>
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
      ) : payments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
          <p className="font-medium text-gray-700">All COD payments are settled!</p>
          <p className="text-sm text-gray-500 mt-1">No pending COD collections at the moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const srId = (p.serviceRequest as any)?._id || p._id
            return (
              <div key={p._id} className="bg-white rounded-xl border border-orange-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Left info */}
                <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1">
                  <div>
                    <p className="text-xs text-gray-500">Request ID</p>
                    <p className="font-semibold text-blue-700">{p.serviceRequest?.requestId || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="font-medium">{p.customer?.fullName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mechanic</p>
                    <p className="font-medium">{p.mechanic?.user?.fullName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Collected At</p>
                    <p className="font-medium text-sm">{fmtDate(p.codCollectedAt)}</p>
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex gap-4 text-sm border-l pl-4 border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Total</p>
                    <p className="font-bold text-gray-900">{fmt(p.totalAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Platform</p>
                    <p className="font-semibold text-emerald-700">{fmt(p.platformAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Mechanic</p>
                    <p className="font-semibold text-violet-700">{fmt(p.mechanicAmount)}</p>
                  </div>
                </div>

                {/* Settle button */}
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0"
                  disabled={settling === srId}
                  onClick={() => setConfirmId(srId)}
                >
                  {settling === srId ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Settling…</>
                  ) : (
                    <><Handshake className="h-3.5 w-3.5" />Mark Settled</>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm COD Settlement</DialogTitle>
            <DialogDescription>
              This will mark the payment as settled. The mechanic has confirmed collecting the cash.
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

// ─── Main Component ───────────────────────────────────────────────────────────
export function PaymentManagement() {
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('history')

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const data = await apiFetch('/admin/payments/stats')
      setStats(data.data)
    } catch {
      // silently ignore
    } finally {
      setStatsLoading(false)
    }
  }, [])

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
            Monitor revenue, manage COD settlements, and configure service pricing
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
      <StatsCards stats={stats} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-5 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Receipt className="h-4 w-4" />
            Payment History
          </TabsTrigger>
          <TabsTrigger value="cod" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Banknote className="h-4 w-4" />
            COD Settlement
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Settings className="h-4 w-4" />
            Pricing Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <PaymentHistoryTab />
        </TabsContent>

        <TabsContent value="cod">
          <CODManagementTab onSettled={loadStats} />
        </TabsContent>

        <TabsContent value="pricing">
          <PricingConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
