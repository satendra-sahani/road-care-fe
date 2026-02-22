'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Download,
  Filter,
  Package,
  Truck,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Printer,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  PurchaseEntry,
  PurchaseItem,
  mockPurchases,
} from '@/data/businessMockData'

// INR currency formatter
const formatINR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

// Blank purchase item template
const emptyItem: Omit<PurchaseItem, 'productId'> & { productId: string } = {
  productId: '',
  productName: '',
  sku: '',
  quantity: 1,
  costPerUnit: 0,
  totalCost: 0,
  mrp: 0,
  sellingPrice: 0,
}

// Blank purchase entry template
const emptyPurchaseEntry: Omit<PurchaseEntry, 'id'> = {
  invoiceNo: '',
  date: new Date().toISOString().split('T')[0],
  supplierName: '',
  supplierGST: '',
  items: [{ ...emptyItem, productId: 'NEW-001' }],
  totalAmount: 0,
  paidAmount: 0,
  paymentStatus: 'pending',
  paymentMethod: 'cash',
  notes: '',
  createdBy: 'Satendra',
}

export function StockLedger() {
  // Data state
  const [purchases, setPurchases] = useState<PurchaseEntry[]>(mockPurchases)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // Expandable row state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseEntry | null>(null)

  // New entry form state
  const [newEntry, setNewEntry] = useState<Omit<PurchaseEntry, 'id'>>(emptyPurchaseEntry)

  // ------ Summary calculations ------
  const summary = useMemo(() => {
    const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0)
    const paidAmount = purchases.reduce((sum, p) => sum + p.paidAmount, 0)
    const pendingPayments = totalPurchases - paidAmount
    const totalItems = purchases.reduce(
      (sum, p) => sum + p.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    )
    return { totalPurchases, paidAmount, pendingPayments, totalItems }
  }, [purchases])

  // ------ Filtered purchases ------
  const filteredPurchases = useMemo(() => {
    let result = [...purchases]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.supplierName.toLowerCase().includes(q) ||
          p.invoiceNo.toLowerCase().includes(q)
      )
    }

    if (dateFrom) {
      result = result.filter((p) => p.date >= dateFrom)
    }
    if (dateTo) {
      result = result.filter((p) => p.date <= dateTo)
    }

    return result.sort((a, b) => b.date.localeCompare(a.date))
  }, [purchases, searchQuery, dateFrom, dateTo])

  const pendingPurchases = useMemo(
    () => filteredPurchases.filter((p) => p.paymentStatus !== 'paid'),
    [filteredPurchases]
  )

  // ------ Row expand toggle ------
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // ------ View detail dialog ------
  const openViewDialog = (purchase: PurchaseEntry) => {
    setSelectedPurchase(purchase)
    setViewDialogOpen(true)
  }

  // ------ Payment status badge helper ------
  const statusBadge = (status: PurchaseEntry['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle className="w-3 h-3 mr-1" /> Paid
          </Badge>
        )
      case 'partial':
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" /> Partial
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" /> Pending
          </Badge>
        )
    }
  }

  // ------ Payment method badge helper ------
  const methodBadge = (method: PurchaseEntry['paymentMethod']) => {
    const styles: Record<string, string> = {
      cash: 'bg-green-50 text-green-700 border-green-200',
      upi: 'bg-purple-50 text-purple-700 border-purple-200',
      bank_transfer: 'bg-blue-50 text-blue-700 border-blue-200',
      cheque: 'bg-orange-50 text-orange-700 border-orange-200',
    }
    const labels: Record<string, string> = {
      cash: 'Cash',
      upi: 'UPI',
      bank_transfer: 'Bank Transfer',
      cheque: 'Cheque',
    }
    return (
      <Badge variant="outline" className={styles[method]}>
        {labels[method]}
      </Badge>
    )
  }

  // ------ Mark as paid ------
  const markAsPaid = (id: string) => {
    setPurchases((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, paidAmount: p.totalAmount, paymentStatus: 'paid' as const }
          : p
      )
    )
  }

  // ------ New entry form handlers ------
  const updateNewEntryField = (field: string, value: string | number) => {
    setNewEntry((prev) => ({ ...prev, [field]: value }))
  }

  const updateNewEntryItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    setNewEntry((prev) => {
      const items = [...prev.items]
      const item = { ...items[index], [field]: value }

      // Auto-calculate totalCost
      if (field === 'quantity' || field === 'costPerUnit') {
        item.totalCost = Number(item.quantity) * Number(item.costPerUnit)
      }

      items[index] = item

      // Recalculate total
      const totalAmount = items.reduce((sum, i) => sum + i.totalCost, 0)

      return { ...prev, items, totalAmount }
    })
  }

  const addNewItemRow = () => {
    setNewEntry((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { ...emptyItem, productId: `NEW-${prev.items.length + 1}` },
      ],
    }))
  }

  const removeItemRow = (index: number) => {
    if (newEntry.items.length <= 1) return
    setNewEntry((prev) => {
      const items = prev.items.filter((_, i) => i !== index)
      const totalAmount = items.reduce((sum, i) => sum + i.totalCost, 0)
      return { ...prev, items, totalAmount }
    })
  }

  const saveNewEntry = () => {
    const id = `PUR-${String(purchases.length + 1).padStart(3, '0')}`

    // Determine payment status
    let paymentStatus: PurchaseEntry['paymentStatus'] = 'pending'
    if (newEntry.paidAmount >= newEntry.totalAmount && newEntry.totalAmount > 0) {
      paymentStatus = 'paid'
    } else if (newEntry.paidAmount > 0) {
      paymentStatus = 'partial'
    }

    const entry: PurchaseEntry = {
      ...newEntry,
      id,
      paymentStatus,
    }

    setPurchases((prev) => [entry, ...prev])
    setNewEntry({ ...emptyPurchaseEntry, items: [{ ...emptyItem, productId: 'NEW-001' }] })
    setActiveTab('all')
  }

  // ------ Profit potential calculator ------
  const profitPotential = (item: PurchaseItem) =>
    (item.sellingPrice - item.costPerUnit) * item.quantity

  // ==============================
  // RENDER
  // ==============================
  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock & Purchase Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all purchase entries, supplier payments, and stock inflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-[#1B3B6F] hover:bg-[#0F2545] text-white"
            onClick={() => setActiveTab('add')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Purchase Entry
          </Button>
          <Button variant="outline" className="border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* ---- Summary Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Purchases */}
        <Card className="border-l-4 border-l-[#1B3B6F]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Purchases
                </p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {formatINR.format(summary.totalPurchases)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#1B3B6F]/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-[#1B3B6F]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paid Amount */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Amount
                </p>
                <p className="text-xl font-bold text-emerald-700 mt-1">
                  {formatINR.format(summary.paidAmount)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="border-l-4 border-l-[#FF6B35]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending Payments
                </p>
                <p className="text-xl font-bold text-[#FF6B35] mt-1">
                  {formatINR.format(summary.pendingPayments)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-[#FF6B35]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Items Purchased */}
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Items Purchased
                </p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {summary.totalItems.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center">
                <Truck className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---- Tabs ---- */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all" className="data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white">
            All Purchases
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white">
            Pending Payments
            {pendingPurchases.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                {pendingPurchases.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="add" className="data-[state=active]:bg-[#1B3B6F] data-[state=active]:text-white">
            Add New Entry
          </TabsTrigger>
        </TabsList>

        {/* ===================== ALL PURCHASES TAB ===================== */}
        <TabsContent value="all" className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 mb-1 block">Search Supplier / Invoice</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by supplier or invoice..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">From Date</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">To Date</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-40"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setDateFrom('')
                    setDateTo('')
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Purchases Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-10" />
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10 text-gray-400">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No purchase entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchases.map((purchase) => (
                      <>
                        {/* Main row */}
                        <TableRow
                          key={purchase.id}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleRow(purchase.id)}
                        >
                          <TableCell className="text-center">
                            {expandedRows.has(purchase.id) ? (
                              <ArrowUpCircle className="w-4 h-4 text-[#1B3B6F]" />
                            ) : (
                              <ArrowDownCircle className="w-4 h-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {new Date(purchase.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-[#1B3B6F]">
                              {purchase.invoiceNo}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{purchase.supplierName}</p>
                              {purchase.supplierGST && (
                                <p className="text-[10px] text-gray-400">
                                  GST: {purchase.supplierGST}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">
                              {purchase.items.length} items
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            {formatINR.format(purchase.totalAmount)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatINR.format(purchase.paidAmount)}
                          </TableCell>
                          <TableCell>{methodBadge(purchase.paymentMethod)}</TableCell>
                          <TableCell>{statusBadge(purchase.paymentStatus)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-[#1B3B6F]/10"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openViewDialog(purchase)
                                }}
                              >
                                <Eye className="w-4 h-4 text-[#1B3B6F]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-[#FF6B35]/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Edit className="w-4 h-4 text-[#FF6B35]" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded item details */}
                        {expandedRows.has(purchase.id) && (
                          <TableRow key={`${purchase.id}-details`}>
                            <TableCell colSpan={10} className="bg-slate-50 p-0">
                              <div className="px-6 py-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Item Details
                                </p>
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-white">
                                      <TableHead className="text-xs">Product</TableHead>
                                      <TableHead className="text-xs">SKU</TableHead>
                                      <TableHead className="text-xs text-center">Qty</TableHead>
                                      <TableHead className="text-xs text-right">Cost/Unit</TableHead>
                                      <TableHead className="text-xs text-right">Total Cost</TableHead>
                                      <TableHead className="text-xs text-right">MRP</TableHead>
                                      <TableHead className="text-xs text-right">Selling Price</TableHead>
                                      <TableHead className="text-xs text-right">Margin/Unit</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {purchase.items.map((item, idx) => (
                                      <TableRow key={idx} className="bg-white">
                                        <TableCell className="text-sm font-medium">
                                          {item.productName}
                                        </TableCell>
                                        <TableCell>
                                          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                            {item.sku}
                                          </code>
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                          {item.quantity}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                          {formatINR.format(item.costPerUnit)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-semibold">
                                          {formatINR.format(item.totalCost)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-gray-500">
                                          {formatINR.format(item.mrp)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                          {formatINR.format(item.sellingPrice)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <span className="text-sm font-medium text-emerald-600">
                                            {formatINR.format(item.sellingPrice - item.costPerUnit)}
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                {purchase.notes && (
                                  <p className="text-xs text-gray-500 mt-2 italic">
                                    <FileText className="w-3 h-3 inline mr-1" />
                                    {purchase.notes}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== PENDING PAYMENTS TAB ===================== */}
        <TabsContent value="pending" className="mt-4 space-y-4">
          {/* Pending summary */}
          <Card className="bg-gradient-to-r from-[#FF6B35]/5 to-red-50 border-[#FF6B35]/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-[#FF6B35]" />
                <div>
                  <p className="font-semibold text-gray-900">
                    Total Pending: {formatINR.format(summary.pendingPayments)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pendingPurchases.length} purchase(s) with outstanding payments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 mb-1 block">Search Supplier / Invoice</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by supplier or invoice..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-gray-400">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                        All payments are up to date!
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingPurchases.map((purchase) => (
                      <TableRow key={purchase.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="text-sm">
                          {new Date(purchase.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-[#1B3B6F]">
                            {purchase.invoiceNo}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {purchase.supplierName}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatINR.format(purchase.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-emerald-600">
                          {formatINR.format(purchase.paidAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-red-600 text-sm">
                            {formatINR.format(purchase.totalAmount - purchase.paidAmount)}
                          </span>
                        </TableCell>
                        <TableCell>{statusBadge(purchase.paymentStatus)}</TableCell>
                        <TableCell>{methodBadge(purchase.paymentMethod)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                              onClick={() => markAsPaid(purchase.id)}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Mark Paid
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-[#1B3B6F]/10"
                              onClick={() => openViewDialog(purchase)}
                            >
                              <Eye className="w-4 h-4 text-[#1B3B6F]" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== ADD NEW ENTRY TAB ===================== */}
        <TabsContent value="add" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#1B3B6F]" />
                New Purchase Entry
              </CardTitle>
              <CardDescription>
                Record a new stock purchase from a supplier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Supplier & Invoice Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Supplier Name *</Label>
                  <Input
                    placeholder="e.g. Auto Parts Co."
                    className="mt-1"
                    value={newEntry.supplierName}
                    onChange={(e) => updateNewEntryField('supplierName', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Invoice Number *</Label>
                  <Input
                    placeholder="e.g. INV-2026-0220"
                    className="mt-1"
                    value={newEntry.invoiceNo}
                    onChange={(e) => updateNewEntryField('invoiceNo', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Date *</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={newEntry.date}
                    onChange={(e) => updateNewEntryField('date', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Supplier GST (optional)</Label>
                <Input
                  placeholder="e.g. 09AABCU9603R1ZM"
                  className="mt-1 max-w-sm"
                  value={newEntry.supplierGST || ''}
                  onChange={(e) => updateNewEntryField('supplierGST', e.target.value)}
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold">Purchase Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[#1B3B6F] border-[#1B3B6F]/30 hover:bg-[#1B3B6F]/5"
                    onClick={addNewItemRow}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {newEntry.items.map((item, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-gray-50/50 relative group"
                    >
                      {newEntry.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeItemRow(index)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs text-gray-500">Product Name</Label>
                          <Input
                            placeholder="Product name"
                            className="mt-1"
                            value={item.productName}
                            onChange={(e) =>
                              updateNewEntryItem(index, 'productName', e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">SKU</Label>
                          <Input
                            placeholder="SKU"
                            className="mt-1"
                            value={item.sku}
                            onChange={(e) =>
                              updateNewEntryItem(index, 'sku', e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Quantity</Label>
                          <Input
                            type="number"
                            min={1}
                            className="mt-1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateNewEntryItem(index, 'quantity', Number(e.target.value))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Cost / Unit</Label>
                          <Input
                            type="number"
                            min={0}
                            className="mt-1"
                            value={item.costPerUnit || ''}
                            onChange={(e) =>
                              updateNewEntryItem(index, 'costPerUnit', Number(e.target.value))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">MRP</Label>
                          <Input
                            type="number"
                            min={0}
                            className="mt-1"
                            value={item.mrp || ''}
                            onChange={(e) =>
                              updateNewEntryItem(index, 'mrp', Number(e.target.value))
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Selling Price</Label>
                          <Input
                            type="number"
                            min={0}
                            className="mt-1"
                            value={item.sellingPrice || ''}
                            onChange={(e) =>
                              updateNewEntryItem(index, 'sellingPrice', Number(e.target.value))
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-2 text-right">
                        <span className="text-xs text-gray-500">Line Total: </span>
                        <span className="text-sm font-semibold text-[#1B3B6F]">
                          {formatINR.format(item.totalCost)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-3 block">Payment Details</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Total Amount</Label>
                    <div className="mt-1 h-10 flex items-center px-3 rounded-md border bg-gray-100 font-semibold text-[#1B3B6F]">
                      {formatINR.format(newEntry.totalAmount)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Amount Paid</Label>
                    <Input
                      type="number"
                      min={0}
                      className="mt-1"
                      value={newEntry.paidAmount || ''}
                      onChange={(e) =>
                        updateNewEntryField('paidAmount', Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Payment Method</Label>
                    <Select
                      value={newEntry.paymentMethod}
                      onValueChange={(val) => updateNewEntryField('paymentMethod', val)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-sm font-medium">Notes (optional)</Label>
                <Textarea
                  placeholder="Any additional notes about this purchase..."
                  className="mt-1"
                  rows={3}
                  value={newEntry.notes || ''}
                  onChange={(e) => updateNewEntryField('notes', e.target.value)}
                />
              </div>

              {/* Save button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewEntry({
                      ...emptyPurchaseEntry,
                      items: [{ ...emptyItem, productId: 'NEW-001' }],
                    })
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  className="bg-[#1B3B6F] hover:bg-[#0F2545] text-white min-w-[140px]"
                  onClick={saveNewEntry}
                  disabled={
                    !newEntry.supplierName.trim() ||
                    !newEntry.invoiceNo.trim() ||
                    newEntry.totalAmount === 0
                  }
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===================== VIEW PURCHASE DETAIL DIALOG ===================== */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPurchase && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[#1B3B6F]">
                  <FileText className="w-5 h-5" />
                  Purchase Detail &mdash; {selectedPurchase.invoiceNo}
                </DialogTitle>
                <DialogDescription>
                  Full purchase information and cost breakdown
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Header info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Invoice No</p>
                    <p className="font-mono font-semibold">{selectedPurchase.invoiceNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium">
                      {new Date(selectedPurchase.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Supplier</p>
                    <p className="font-medium">{selectedPurchase.supplierName}</p>
                    {selectedPurchase.supplierGST && (
                      <p className="text-[10px] text-gray-400">
                        GST: {selectedPurchase.supplierGST}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created By</p>
                    <p className="font-medium">{selectedPurchase.createdBy}</p>
                  </div>
                </div>

                {/* Items table */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Items Purchased</p>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs">#</TableHead>
                          <TableHead className="text-xs">Product</TableHead>
                          <TableHead className="text-xs text-center">Qty</TableHead>
                          <TableHead className="text-xs text-right">Cost/Unit</TableHead>
                          <TableHead className="text-xs text-right">Total Cost</TableHead>
                          <TableHead className="text-xs text-right">MRP</TableHead>
                          <TableHead className="text-xs text-right">Selling Price</TableHead>
                          <TableHead className="text-xs text-right">Profit Potential</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPurchase.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs text-gray-400">{idx + 1}</TableCell>
                            <TableCell>
                              <p className="text-sm font-medium">{item.productName}</p>
                              <code className="text-[10px] text-gray-400">{item.sku}</code>
                            </TableCell>
                            <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                            <TableCell className="text-right text-sm">
                              {formatINR.format(item.costPerUnit)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold">
                              {formatINR.format(item.totalCost)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-gray-500">
                              {formatINR.format(item.mrp)}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatINR.format(item.sellingPrice)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm font-semibold text-emerald-600">
                                {formatINR.format(profitPotential(item))}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totals row */}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell colSpan={2} className="text-right text-sm">
                            Grand Total
                          </TableCell>
                          <TableCell className="text-center">
                            {selectedPurchase.items.reduce((s, i) => s + i.quantity, 0)}
                          </TableCell>
                          <TableCell />
                          <TableCell className="text-right text-sm text-[#1B3B6F]">
                            {formatINR.format(selectedPurchase.totalAmount)}
                          </TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell className="text-right text-sm text-emerald-600">
                            {formatINR.format(
                              selectedPurchase.items.reduce((s, i) => s + profitPotential(i), 0)
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Payment info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card className="border-gray-200">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Total</p>
                      <p className="text-lg font-bold text-[#1B3B6F]">
                        {formatINR.format(selectedPurchase.totalAmount)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Paid</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {formatINR.format(selectedPurchase.paidAmount)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Pending</p>
                      <p className="text-lg font-bold text-red-600">
                        {formatINR.format(
                          selectedPurchase.totalAmount - selectedPurchase.paidAmount
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Method</p>
                      <div className="mt-1">{methodBadge(selectedPurchase.paymentMethod)}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Status & notes */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Payment Status:</span>
                  {statusBadge(selectedPurchase.paymentStatus)}
                </div>

                {selectedPurchase.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
                    <p className="text-sm text-amber-900">{selectedPurchase.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
                <Button variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                {selectedPurchase.paymentStatus !== 'paid' && (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      markAsPaid(selectedPurchase.id)
                      setSelectedPurchase({
                        ...selectedPurchase,
                        paidAmount: selectedPurchase.totalAmount,
                        paymentStatus: 'paid',
                      })
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
