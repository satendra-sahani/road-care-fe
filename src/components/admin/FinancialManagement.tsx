'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
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
  AlertTriangle
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
import { formatDate } from '@/lib/utils'

// Mock financial data
const mockTransactions = [
  {
    id: 'TXN-001',
    type: 'sale',
    orderId: 'ORD-2026-001',
    customer: 'John Smith',
    amount: 2580,
    method: 'UPI',
    status: 'completed',
    commission: 258,
    tax: 464.4,
    netAmount: 1857.6,
    timestamp: '2026-02-12T10:30:00Z',
    gatewayRef: 'GP123456789'
  },
  {
    id: 'TXN-002',
    type: 'refund',
    orderId: 'ORD-2026-002',
    customer: 'Sarah Johnson',
    amount: -1200,
    method: 'Credit Card',
    status: 'processed',
    commission: -120,
    tax: -216,
    netAmount: -864,
    timestamp: '2026-02-12T09:15:00Z',
    gatewayRef: 'RF987654321',
    refundReason: 'Product defect'
  },
  {
    id: 'TXN-003',
    type: 'service',
    orderId: 'SRV-2026-001',
    customer: 'Mike Wilson',
    amount: 3500,
    method: 'Cash',
    status: 'completed',
    commission: 525,
    tax: 630,
    netAmount: 2345,
    timestamp: '2026-02-11T16:45:00Z',
    mechanicId: 'MEC-001'
  },
  {
    id: 'TXN-004',
    type: 'sale',
    orderId: 'ORD-2026-003',
    customer: 'Emily Davis',
    amount: 4500,
    method: 'Wallet',
    status: 'failed',
    commission: 0,
    tax: 0,
    netAmount: 0,
    timestamp: '2026-02-11T14:20:00Z',
    gatewayRef: 'WL456789123',
    failureReason: 'Insufficient balance'
  },
  {
    id: 'TXN-005',
    type: 'delivery',
    orderId: 'ORD-2026-004',
    customer: 'Robert Brown',
    amount: 150,
    method: 'UPI',
    status: 'completed',
    commission: 45,
    tax: 27,
    netAmount: 78,
    timestamp: '2026-02-11T12:00:00Z',
    deliveryPartnerId: 'DEL-001'
  }
]

const mockCommissions = [
  {
    id: 'COM-001',
    type: 'mechanic',
    partnerId: 'MEC-001',
    partnerName: 'Rajesh Kumar',
    totalJobs: 24,
    totalRevenue: 84000,
    commissionRate: 15,
    commissionAmount: 12600,
    status: 'pending',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28'
  },
  {
    id: 'COM-002',
    type: 'delivery',
    partnerId: 'DEL-001',
    partnerName: 'Priya Sharma',
    totalDeliveries: 156,
    totalRevenue: 23400,
    commissionRate: 20,
    commissionAmount: 4680,
    status: 'paid',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31'
  },
  {
    id: 'COM-003',
    type: 'mechanic',
    partnerId: 'MEC-002',
    partnerName: 'Suresh Kumar',
    totalJobs: 18,
    totalRevenue: 63000,
    commissionRate: 15,
    commissionAmount: 9450,
    status: 'processing',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28'
  }
]

const statusConfig = {
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
  processed: { color: 'bg-blue-100 text-blue-800', label: 'Processed' },
  failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
  paid: { color: 'bg-green-100 text-green-800', label: 'Paid' }
}

const typeConfig = {
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

  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter(transaction => {
      const matchesSearch = 
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.orderId.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })
  }, [searchQuery, statusFilter, typeFilter])

  const getFinancialStats = () => {
    const totalRevenue = mockTransactions
      .filter(t => t.status === 'completed' && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalRefunds = mockTransactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const totalCommissions = mockCommissions
      .reduce((sum, c) => sum + c.commissionAmount, 0)
    
    const pendingPayouts = mockCommissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.commissionAmount, 0)
    
    return { totalRevenue, totalRefunds, totalCommissions, pendingPayouts }
  }

  const stats = getFinancialStats()

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
    const config = statusConfig[status as keyof typeof statusConfig]
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const config = typeConfig[type as keyof typeof typeConfig]
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    )
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
      setSelectedTransactions(filteredTransactions.map(transaction => transaction.id))
    }
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
          {/* Filters and Search */}
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

              {/* Bulk Actions */}
              {selectedTransactions.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">
                      {selectedTransactions.length} transaction(s) selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        Export Selected
                      </Button>
                      <Button size="sm" variant="outline">
                        Bulk Refund
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTransactions.length === filteredTransactions.length}
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
                  {filteredTransactions.map((transaction) => (
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
                      <TableCell>
                        {getTypeBadge(transaction.type)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.customer}
                      </TableCell>
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
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(transaction.commission)}
                      </TableCell>
                      <TableCell className="text-sm text-[#6B7280]">
                        {formatDate(transaction.timestamp)}
                      </TableCell>
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
                            {transaction.type === 'sale' && transaction.status === 'completed' && (
                              <DropdownMenuItem>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Process Refund
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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
                {mockCommissions.map((commission) => (
                  <div key={commission.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-[#1A1D29]">{commission.partnerName}</h3>
                        <p className="text-sm text-[#6B7280]">
                          {commission.type === 'mechanic' ? 'Mechanic' : 'Delivery Partner'} • {commission.id}
                        </p>
                      </div>
                      {getStatusBadge(commission.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-[#6B7280]">
                          {commission.type === 'mechanic' ? 'Total Jobs' : 'Total Deliveries'}
                        </p>
                        <p className="font-medium">
                          {commission.type === 'mechanic' ? commission.totalJobs : commission.totalDeliveries}
                        </p>
                      </div>
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
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-[#6B7280]">
                        Period: {formatDate(commission.periodStart)} - {formatDate(commission.periodEnd)}
                      </p>
                    </div>
                  </div>
                ))}
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
                  GST Return Report
                </Button>
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
                <CardDescription>Configure tax rates and compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">GST Rate (%)</label>
                  <Input type="number" defaultValue="18" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">TDS Rate (%)</label>
                  <Input type="number" defaultValue="1" />
                </div>
                <Button className="w-full bg-[#1B3B6F] hover:bg-[#0F2545]">
                  Update Tax Settings
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
                    {selectedTransaction.gatewayRef && (
                      <p><span className="text-[#6B7280]">Gateway Ref:</span> {selectedTransaction.gatewayRef}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-3">Financial Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#6B7280]">Gross Amount:</span> {formatCurrency(selectedTransaction.amount)}</p>
                    <p><span className="text-[#6B7280]">Tax:</span> {formatCurrency(selectedTransaction.tax)}</p>
                    <p><span className="text-[#6B7280]">Commission:</span> {formatCurrency(selectedTransaction.commission)}</p>
                    <p className="font-medium border-t pt-2">
                      <span className="text-[#6B7280]">Net Amount:</span> {formatCurrency(selectedTransaction.netAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-[#1A1D29] mb-2">Customer Information</h4>
                <p className="text-sm text-[#6B7280]">Customer: {selectedTransaction.customer}</p>
                <p className="text-sm text-[#6B7280]">Date: {formatDate(selectedTransaction.timestamp)}</p>
              </div>

              {selectedTransaction.refundReason && (
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-2">Refund Information</h4>
                  <p className="text-sm text-[#6B7280]">Reason: {selectedTransaction.refundReason}</p>
                </div>
              )}

              {selectedTransaction.failureReason && (
                <div>
                  <h4 className="font-medium text-[#1A1D29] mb-2">Failure Information</h4>
                  <p className="text-sm text-red-600">Reason: {selectedTransaction.failureReason}</p>
                </div>
              )}
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