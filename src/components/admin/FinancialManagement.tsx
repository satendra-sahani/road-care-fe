'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  Plus,
  DollarSign,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Receipt,
  Wrench,
  Truck,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { paymentAPI, financialAPI } from '@/services/api'

const statusConfig: Record<string, { color: string; label: string }> = {
  completed: { color: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
  processed: { color: 'bg-blue-100 text-blue-700', label: 'Processed' },
  failed: { color: 'bg-red-100 text-red-700', label: 'Failed' },
  pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
  processing: { color: 'bg-blue-100 text-blue-700', label: 'Processing' },
  paid: { color: 'bg-emerald-100 text-emerald-700', label: 'Paid' }
}

const typeConfig: Record<string, { color: string; label: string }> = {
  sale: { color: 'bg-emerald-100 text-emerald-700', label: 'Sale' },
  refund: { color: 'bg-red-100 text-red-700', label: 'Refund' },
  service: { color: 'bg-blue-100 text-blue-700', label: 'Service' },
  delivery: { color: 'bg-violet-100 text-violet-700', label: 'Delivery' }
}

// Left-edge stripe color per transaction status — makes the table scannable at a glance.
const STATUS_STRIPE: Record<string, string> = {
  completed: '#22c55e', paid: '#22c55e',
  processed: '#3b82f6', processing: '#3b82f6',
  pending: '#f59e0b',
  failed: '#ef4444',
}

export function FinancialManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('transactions')
  const [loading, setLoading] = useState(true)

  // Data from API
  const [stats, setStats] = useState({ totalRevenue: 0, totalRefunds: 0, totalCommissions: 0, pendingPayouts: 0 })
  const [transactions, setTransactions] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])

  // Tax & commission settings (already connected to API)
  const [serviceChargeRate, setServiceChargeRate] = useState('0')
  const [taxSaving, setTaxSaving] = useState(false)
  const [taxSaveMsg, setTaxSaveMsg] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, txnRes, comRes, pricingRes] = await Promise.all([
        financialAPI.getStats().catch(() => ({ data: { data: {} } })),
        financialAPI.getTransactions({ limit: 50 }).catch(() => ({ data: { data: [] } })),
        financialAPI.getCommissions().catch(() => ({ data: { data: [] } })),
        paymentAPI.getPricing().catch(() => ({ data: {} })),
      ])

      const s = statsRes.data?.data || statsRes.data || {}
      setStats({
        totalRevenue: s.totalRevenue || 0,
        totalRefunds: s.totalRefunds || 0,
        totalCommissions: s.totalCommissions || 0,
        pendingPayouts: s.pendingPayouts || 0,
      })

      setTransactions(txnRes.data?.data || [])
      setCommissions(comRes.data?.data || [])

      const pricingData = pricingRes.data?.data || pricingRes.data || {}
      if (pricingData.serviceChargePercent != null) setServiceChargeRate(String(pricingData.serviceChargePercent))
    } catch (err) {
      console.error('Financial data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTaxSettings = async () => {
    setTaxSaving(true)
    setTaxSaveMsg('')
    try {
      await paymentAPI.updatePricing({
        serviceChargePercent: parseFloat(serviceChargeRate) || 0,
      })
      setTaxSaveMsg('Tax settings updated successfully!')
      setTimeout(() => setTaxSaveMsg(''), 3000)
    } catch (err: any) {
      setTaxSaveMsg(err.response?.data?.message || 'Failed to update tax settings')
    } finally {
      setTaxSaving(false)
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction: any) => {
      const matchesSearch =
        (transaction.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.orderId || '').toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [transactions, searchQuery, statusFilter, typeFilter])

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

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending
    return <Badge className={`${config.color} border-0 rounded-full px-2.5 py-0.5 font-semibold`}>{config.label}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const config = typeConfig[type] || typeConfig.sale
    return <Badge className={`${config.color} border-0 rounded-full px-2.5 py-0.5 font-semibold`}>{config.label}</Badge>
  }

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    )
  }

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([])
    } else {
      setSelectedTransactions(filteredTransactions.map((t: any) => t.id))
    }
  }

  // ── REAL export: download the current financial snapshot as CSV ──
  const exportCsv = () => {
    const lines: string[] = [
      'Bharat Mechanics — Financial report',
      `Generated,${new Date().toLocaleString('en-IN')}`,
      '',
      'Metric,Value',
      `Total revenue,${stats.totalRevenue}`,
      `Total refunds,${stats.totalRefunds}`,
      `Total commissions,${stats.totalCommissions}`,
      `Pending payouts,${stats.pendingPayouts}`,
      '',
      'Transaction ID,Type,Customer,Amount,Method,Status,Commission,Date',
      ...transactions.map((t: any) =>
        `${t.id || ''},${t.type || ''},"${t.customer || ''}",${t.amount || 0},${t.method || ''},${t.status || ''},${t.commission || 0},${t.timestamp || ''}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bm-financial-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // Export only the checked rows.
  const exportSelectedCsv = () => {
    const rows = transactions.filter((t: any) => selectedTransactions.includes(t.id))
    const lines: string[] = [
      'Transaction ID,Type,Customer,Amount,Method,Status,Commission,Date',
      ...rows.map((t: any) =>
        `${t.id || ''},${t.type || ''},"${t.customer || ''}",${t.amount || 0},${t.method || ''},${t.status || ''},${t.commission || 0},${t.timestamp || ''}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bm-selected-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // Per-transaction receipt, built entirely from data already in state.
  const downloadReceipt = (transaction: any) => {
    if (!transaction) return
    const lines: string[] = [
      'Bharat Mechanics — Transaction receipt',
      `Transaction ID,${transaction.id || ''}`,
      `Order ID,${transaction.orderId || ''}`,
      `Customer,${transaction.customer || ''}`,
      `Type,${transaction.type || ''}`,
      `Status,${transaction.status || ''}`,
      `Payment Method,${transaction.method || ''}`,
      `Date,${transaction.timestamp || ''}`,
      '',
      `Gross amount,${Math.abs(transaction.amount || 0)}`,
      `Tax,${transaction.tax || 0}`,
      `Commission,${transaction.commission || 0}`,
      `Net amount,${transaction.netAmount || 0}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `receipt-${transaction.id || 'transaction'}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1D29]">Financial Management</h1>
          <p className="text-[#6B7280] mt-1">Monitor revenue, transactions, and financial performance</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={exportCsv} className="h-10 rounded-xl border-gray-200">
            <Download className="h-4 w-4 mr-2" />
            Export Financial Report
          </Button>
          <Button className="h-10 rounded-xl bg-[#1B3B6F] hover:bg-[#16305c]">
            <Plus className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] p-5 shadow-md">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
          <div className="absolute -right-2 top-14 h-20 w-20 rounded-full bg-white/[0.05]" />
          <div className="relative flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">Total Revenue</p>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
              <IndianRupee className="h-[18px] w-[18px] text-white" />
            </div>
          </div>
          <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-white">{formatCurrency(stats.totalRevenue)}</p>
          <p className="relative mt-1 text-[12px] text-white/55">across {transactions.length} transactions</p>
        </div>

        <Card className="rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Total Refunds</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-600">
                <RefreshCw className="h-[18px] w-[18px]" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#1A1D29]">{formatCurrency(stats.totalRefunds)}</p>
            <p className="mt-1 text-xs text-gray-400">Refunded to customers</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Total Commissions</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="h-[18px] w-[18px]" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#1A1D29]">{formatCurrency(stats.totalCommissions)}</p>
            <p className="mt-1 text-xs text-gray-400">Earned across partners</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Pending Payouts</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-[18px] w-[18px]" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#1A1D29]">{formatCurrency(stats.pendingPayouts)}</p>
            <p className="mt-1 text-xs text-gray-400">Awaiting settlement</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTransactions.length > 0 && (
                <div className="mt-4 p-3 bg-[#1B3B6F]/5 rounded-xl border border-[#1B3B6F]/15">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1B3B6F]">
                      {selectedTransactions.length} transaction(s) selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={exportSelectedCsv}>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export Selected
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F6F8FB] hover:bg-[#F6F8FB] border-b border-gray-200">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={filteredTransactions.length > 0 && selectedTransactions.length === filteredTransactions.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Commission</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                              <Receipt className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-[#1A1D29]">No transactions found</p>
                            <p className="text-xs text-[#6B7280] mt-1">Try adjusting your search or filter criteria</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction: any) => (
                        <TableRow
                          key={transaction.id}
                          className="hover:bg-[#1B3B6F]/[0.03] transition-colors border-l-[3px]"
                          style={{ borderLeftColor: STATUS_STRIPE[transaction.status] || 'transparent' }}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedTransactions.includes(transaction.id)}
                              onCheckedChange={() => handleSelectTransaction(transaction.id)}
                            />
                          </TableCell>
                          <TableCell className="font-semibold text-[#1B3B6F] text-sm">
                            {transaction.id}
                          </TableCell>
                          <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                          <TableCell className="font-medium text-[#1A1D29]">{transaction.customer}</TableCell>
                          <TableCell>
                            <div className={`font-semibold tabular-nums ${transaction.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {formatCurrency(transaction.amount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-[#1A1D29]">
                              <CreditCard className="h-4 w-4 mr-1.5 text-[#6B7280]" />
                              {transaction.method}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell className="font-medium tabular-nums text-[#1A1D29]">{formatCurrency(transaction.commission)}</TableCell>
                          <TableCell className="text-sm text-[#6B7280]">{formatDate(transaction.timestamp)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSelectedTransaction(transaction)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadReceipt(transaction)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Receipt
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-6">
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Commission Management</span>
                <Button className="rounded-xl bg-[#1B3B6F] hover:bg-[#16305c]">
                  <Plus className="h-4 w-4 mr-2" />
                  Process Payouts
                </Button>
              </CardTitle>
              <CardDescription>Manage partner commissions and payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {commissions.length === 0 ? (
                  <div className="py-10 text-center">
                    <TrendingUp className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                    <p className="text-sm text-[#6B7280]">No commission data available</p>
                  </div>
                ) : (
                  commissions.map((commission: any) => {
                    const isMechanic = commission.type === 'mechanic'
                    const PartnerIcon = isMechanic ? Wrench : Truck
                    return (
                      <div
                        key={commission.id}
                        className="rounded-2xl border border-gray-100 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-l-[3px]"
                        style={{ borderLeftColor: STATUS_STRIPE[commission.status] || 'transparent' }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`grid h-9 w-9 place-items-center rounded-xl ${isMechanic ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                              <PartnerIcon className="h-[18px] w-[18px]" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-[#1A1D29]">{commission.partnerName}</h3>
                              <p className="text-xs text-[#6B7280]">
                                {isMechanic ? 'Mechanic' : 'Delivery Partner'}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(commission.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Total Revenue</p>
                            <p className="mt-0.5 font-semibold tabular-nums text-[#1A1D29]">{formatCurrency(commission.totalRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Commission Rate</p>
                            <p className="mt-0.5 font-semibold tabular-nums text-[#1A1D29]">{commission.commissionRate}%</p>
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Commission Amount</p>
                            <p className="mt-0.5 font-semibold tabular-nums text-emerald-600">{formatCurrency(commission.commissionAmount)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  Revenue Reports
                </CardTitle>
                <CardDescription>Generate detailed revenue analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full rounded-xl border-gray-200" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Daily Revenue Report
                </Button>
                <Button className="w-full rounded-xl border-gray-200" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Monthly Revenue Report
                </Button>
                <Button className="w-full rounded-xl border-gray-200" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Yearly Revenue Report
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  Tax Reports
                </CardTitle>
                <CardDescription>Generate tax compliance reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full rounded-xl border-gray-200" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  TDS Report
                </Button>
                <Button className="w-full rounded-xl border-gray-200" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Annual Tax Summary
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle>Commission Settings</CardTitle>
                <CardDescription>Configure commission rates for partners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A1D29]">Mechanic Commission Rate (%)</label>
                  <Input type="number" defaultValue="15" className="bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A1D29]">Delivery Partner Commission Rate (%)</label>
                  <Input type="number" defaultValue="20" className="bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
                <Button className="w-full rounded-xl bg-[#1B3B6F] hover:bg-[#16305c]">
                  Update Rates
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle>Tax Settings</CardTitle>
                <CardDescription>Configure service charge rate for product orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A1D29]">Service Charge (%)</label>
                  <Input type="number" min="0" max="100" value={serviceChargeRate} onChange={e => setServiceChargeRate(e.target.value)} className="bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
                {taxSaveMsg && (
                  <p className={`text-sm font-medium ${taxSaveMsg.includes('success') ? 'text-emerald-600' : 'text-red-600'}`}>
                    {taxSaveMsg}
                  </p>
                )}
                <Button className="w-full rounded-xl bg-[#1B3B6F] hover:bg-[#16305c]" onClick={handleUpdateTaxSettings} disabled={taxSaving}>
                  {taxSaving ? 'Saving...' : 'Update Tax Settings'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction Details Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-[#1B3B6F]/10 flex items-center justify-center shrink-0">
                    <Receipt className="h-[18px] w-[18px] text-[#1B3B6F]" />
                  </div>
                  <span className="text-[#1A1D29]">Transaction {selectedTransaction?.id}</span>
                </DialogTitle>
                <DialogDescription className="mt-1.5">
                  Complete transaction information and breakdown
                </DialogDescription>
              </div>
              {selectedTransaction && (
                <p className="shrink-0 text-2xl font-extrabold tabular-nums text-[#1B3B6F]">
                  {formatCurrency(Math.abs(selectedTransaction.amount))}
                </p>
              )}
            </div>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-[#1A1D29] mb-3">Transaction Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#6B7280]">Transaction ID:</span> {selectedTransaction.id}</p>
                    <p><span className="text-[#6B7280]">Order ID:</span> {selectedTransaction.orderId}</p>
                    <p className="flex items-center gap-1.5"><span className="text-[#6B7280]">Type:</span> {getTypeBadge(selectedTransaction.type)}</p>
                    <p className="flex items-center gap-1.5"><span className="text-[#6B7280]">Status:</span> {getStatusBadge(selectedTransaction.status)}</p>
                    <p><span className="text-[#6B7280]">Payment Method:</span> {selectedTransaction.method}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-[#1A1D29] mb-3">Financial Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Gross Amount</span>
                      <span className="font-medium tabular-nums">{formatCurrency(Math.abs(selectedTransaction.amount))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Tax</span>
                      <span className="font-medium tabular-nums">{formatCurrency(selectedTransaction.tax || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Commission</span>
                      <span className="font-medium tabular-nums">{formatCurrency(selectedTransaction.commission || 0)}</span>
                    </div>
                    <div className="mt-1 -mx-4 -mb-1 flex items-center justify-between rounded-xl bg-[#1B3B6F] px-4 py-3">
                      <span className="text-sm font-semibold text-white/80">Net Amount</span>
                      <span className="text-lg font-extrabold text-white tabular-nums">{formatCurrency(selectedTransaction.netAmount || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3.5">
                <h4 className="font-semibold text-[#1A1D29] mb-2">Customer Information</h4>
                <p className="text-sm text-[#6B7280]">Customer: {selectedTransaction.customer}</p>
                <p className="text-sm text-[#6B7280]">Date: {formatDate(selectedTransaction.timestamp)}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setSelectedTransaction(null)}>
              Close
            </Button>
            <Button className="rounded-xl bg-[#1B3B6F] hover:bg-[#16305c]" onClick={() => downloadReceipt(selectedTransaction)}>
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
