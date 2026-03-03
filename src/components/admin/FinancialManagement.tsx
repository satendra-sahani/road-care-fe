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
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2
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
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
  processed: { color: 'bg-blue-100 text-blue-800', label: 'Processed' },
  failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
  paid: { color: 'bg-green-100 text-green-800', label: 'Paid' }
}

const typeConfig: Record<string, { color: string; label: string }> = {
  sale: { color: 'bg-green-100 text-green-800', label: 'Sale' },
  refund: { color: 'bg-red-100 text-red-800', label: 'Refund' },
  service: { color: 'bg-blue-100 text-blue-800', label: 'Service' },
  delivery: { color: 'bg-purple-100 text-purple-800', label: 'Delivery' }
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
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const config = typeConfig[type] || typeConfig.sale
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29]">Financial Management</h1>
          <p className="text-[#6B7280] mt-1">Monitor revenue, transactions, and financial performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Financial Report
          </Button>
          <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
            <Plus className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-[#6B7280]">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{formatCurrency(stats.totalRefunds)}</p>
                <p className="text-xs text-[#6B7280]">Total Refunds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{formatCurrency(stats.totalCommissions)}</p>
                <p className="text-xs text-[#6B7280]">Total Commissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-[#1A1D29]">{formatCurrency(stats.pendingPayouts)}</p>
                <p className="text-xs text-[#6B7280]">Pending Payouts</p>
              </div>
            </div>
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
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
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
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">
                      {selectedTransactions.length} transaction(s) selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">Export Selected</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredTransactions.length > 0 && selectedTransactions.length === filteredTransactions.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-[#6B7280]">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction: any) => (
                      <TableRow key={transaction.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedTransactions.includes(transaction.id)}
                            onCheckedChange={() => handleSelectTransaction(transaction.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-[#1B3B6F]">
                          {transaction.id}
                        </TableCell>
                        <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                        <TableCell className="font-medium">{transaction.customer}</TableCell>
                        <TableCell>
                          <div className={`font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(transaction.amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-1 text-[#6B7280]" />
                            {transaction.method}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(transaction.commission)}</TableCell>
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
                              <DropdownMenuItem>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Commission Management</span>
                <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
                  <Plus className="h-4 w-4 mr-2" />
                  Process Payouts
                </Button>
              </CardTitle>
              <CardDescription>Manage partner commissions and payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commissions.length === 0 ? (
                  <p className="text-sm text-[#6B7280] text-center py-8">No commission data available</p>
                ) : (
                  commissions.map((commission: any) => (
                    <div key={commission.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-[#1A1D29]">{commission.partnerName}</h3>
                          <p className="text-sm text-[#6B7280]">
                            {commission.type === 'mechanic' ? 'Mechanic' : 'Delivery Partner'}
                          </p>
                        </div>
                        {getStatusBadge(commission.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-[#6B7280]">Total Revenue</p>
                          <p className="font-medium">{formatCurrency(commission.totalRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-[#6B7280]">Commission Rate</p>
                          <p className="font-medium">{commission.commissionRate}%</p>
                        </div>
                        <div>
                          <p className="text-[#6B7280]">Commission Amount</p>
                          <p className="font-medium text-green-600">{formatCurrency(commission.commissionAmount)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Revenue Reports</CardTitle>
                <CardDescription>Generate detailed revenue analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Daily Revenue Report
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Monthly Revenue Report
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Yearly Revenue Report
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Tax Reports</CardTitle>
                <CardDescription>Generate tax compliance reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  TDS Report
                </Button>
                <Button className="w-full" variant="outline">
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
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Commission Settings</CardTitle>
                <CardDescription>Configure commission rates for partners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mechanic Commission Rate (%)</label>
                  <Input type="number" defaultValue="15" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Delivery Partner Commission Rate (%)</label>
                  <Input type="number" defaultValue="20" />
                </div>
                <Button className="w-full bg-[#1B3B6F] hover:bg-[#0F2545]">
                  Update Rates
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Tax Settings</CardTitle>
                <CardDescription>Configure service charge rate for product orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Charge (%)</label>
                  <Input type="number" min="0" max="100" value={serviceChargeRate} onChange={e => setServiceChargeRate(e.target.value)} />
                </div>
                {taxSaveMsg && (
                  <p className={`text-sm font-medium ${taxSaveMsg.includes('success') ? 'text-emerald-600' : 'text-red-600'}`}>
                    {taxSaveMsg}
                  </p>
                )}
                <Button className="w-full bg-[#1B3B6F] hover:bg-[#0F2545]" onClick={handleUpdateTaxSettings} disabled={taxSaving}>
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
          <DialogHeader>
            <DialogTitle>Transaction Details - {selectedTransaction?.id}</DialogTitle>
            <DialogDescription>
              Complete transaction information and breakdown
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-3">Transaction Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#6B7280]">Transaction ID:</span> {selectedTransaction.id}</p>
                    <p><span className="text-[#6B7280]">Order ID:</span> {selectedTransaction.orderId}</p>
                    <p><span className="text-[#6B7280]">Type:</span> {getTypeBadge(selectedTransaction.type)}</p>
                    <p><span className="text-[#6B7280]">Status:</span> {getStatusBadge(selectedTransaction.status)}</p>
                    <p><span className="text-[#6B7280]">Payment Method:</span> {selectedTransaction.method}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-3">Financial Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#6B7280]">Gross Amount:</span> {formatCurrency(Math.abs(selectedTransaction.amount))}</p>
                    <p><span className="text-[#6B7280]">Tax:</span> {formatCurrency(selectedTransaction.tax || 0)}</p>
                    <p><span className="text-[#6B7280]">Commission:</span> {formatCurrency(selectedTransaction.commission || 0)}</p>
                    <p className="font-medium border-t pt-2">
                      <span className="text-[#6B7280]">Net Amount:</span> {formatCurrency(selectedTransaction.netAmount || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-[#1A1D29] mb-2">Customer Information</h4>
                <p className="text-sm text-[#6B7280]">Customer: {selectedTransaction.customer}</p>
                <p className="text-sm text-[#6B7280]">Date: {formatDate(selectedTransaction.timestamp)}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
              Close
            </Button>
            <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]">
              Download Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
