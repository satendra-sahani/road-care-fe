// @ts-nocheck
'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Download,
  Plus,
  Eye,
  Printer,
  IndianRupee,
  TrendingUp,
  ShoppingCart,
  Package,
  ReceiptText,
  Truck,
  MapPin,
  Phone,
  User,
  FileText,
  Trash2,
  PlusCircle,
  X,
  CalendarDays,
  CreditCard,
  Wallet,
  Smartphone,
  BadgeCheck,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { SaleRecord, SaleItem, mockSales } from '@/data/businessMockData'
import { DeliveryPartner, mockDeliveryPartners } from '@/data/mockData'

// ---- Currency formatter ----
const formatINR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

// ---- Date formatter ----
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ---- Blank new-sale item template ----
function blankSaleItem(): SaleItem {
  return {
    productId: '',
    productName: '',
    sku: '',
    quantity: 1,
    costPrice: 0,
    sellingPrice: 0,
    discount: 0,
    totalPrice: 0,
    profit: 0,
  }
}

// ---- Blank new-sale template ----
function blankSaleRecord(): Omit<SaleRecord, 'id' | 'invoiceNo'> {
  return {
    date: new Date().toISOString().slice(0, 10),
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    items: [blankSaleItem()],
    subtotal: 0,
    discount: 0,
    totalAmount: 0,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    deliveryMode: 'pickup',
    deliveryBoy: '',
    profit: 0,
    notes: '',
    createdBy: 'Satendra',
  }
}

// ---- Mock delivery partners with distances for the modal ----
const deliveryPartnersWithDistance = mockDeliveryPartners.map((partner, index) => ({
  ...partner,
  distance: [2.1, 3.5, 1.8][index] || (2 + Math.random() * 3) // Random distances between 2-5 km
}))

// ---- Known products for quick selection ----
const knownProducts = [
  { id: 'PRD-001', name: 'Premium Brake Pads Set - Front', sku: 'BP-FRONT-001', cost: 800, sell: 1290 },
  { id: 'PRD-002', name: 'Castrol GTX Engine Oil 5W-30', sku: 'OIL-5W30-001', cost: 620, sell: 850 },
  { id: 'PRD-003', name: 'Michelin Energy XM2+ 195/65 R15', sku: 'TYRE-195-65-R15', cost: 3200, sell: 4500 },
  { id: 'PRD-004', name: 'Exide EEZY 35L Battery', sku: 'BAT-35L-001', cost: 2800, sell: 3850 },
  { id: 'PRD-005', name: 'Bosch Spark Plug Set (4pc)', sku: 'SP-4PC-001', cost: 180, sell: 280 },
  { id: 'PRD-006', name: 'Bosch Air Filter', sku: 'AF-BOSCH-001', cost: 320, sell: 450 },
  { id: 'PRD-007', name: 'Monroe Front Shock Absorber', sku: 'SA-FRONT-001', cost: 1200, sell: 1850 },
  { id: 'PRD-008', name: 'Denso Alternator', sku: 'ALT-DENSO-001', cost: 2500, sell: 3600 },
  { id: 'PRD-009', name: 'Apollo Amazer 4G Life 175/70 R13', sku: 'TYRE-175-70-R13', cost: 2100, sell: 2800 },
  { id: 'PRD-010', name: 'Amaron GO 35AH Battery', sku: 'BAT-35AH-002', cost: 3100, sell: 4200 },
  { id: 'PRD-011', name: 'Shell Helix HX7 10W-40', sku: 'OIL-10W40-001', cost: 700, sell: 950 },
]

// ============================================================
// COMPONENT
// ============================================================

export function SalesLedger() {
  // ---- State: data ----
  const [sales, setSales] = useState<SaleRecord[]>(mockSales)

  // ---- State: filters ----
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [deliveryFilter, setDeliveryFilter] = useState('all')

  // ---- State: dialogs ----
  const [viewSale, setViewSale] = useState<SaleRecord | null>(null)
  const [showNewSale, setShowNewSale] = useState(false)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedUserSale, setSelectedUserSale] = useState<SaleRecord | null>(null)

  // ---- State: new-sale form ----
  const [newSale, setNewSale] = useState(blankSaleRecord())

  // ---- Filtered sales ----
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // date range
      if (dateFrom && s.date < dateFrom) return false
      if (dateTo && s.date > dateTo) return false
      // search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !s.customerName.toLowerCase().includes(q) &&
          !s.customerPhone.includes(q) &&
          !s.invoiceNo.toLowerCase().includes(q)
        )
          return false
      }
      // payment
      if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false
      // delivery
      if (deliveryFilter !== 'all' && s.deliveryMode !== deliveryFilter) return false
      return true
    })
  }, [sales, searchQuery, dateFrom, dateTo, paymentFilter, deliveryFilter])

  // ---- Summary metrics ----
  const metrics = useMemo(() => {
    const totalSales = filteredSales.reduce((a, s) => a + s.totalAmount, 0)
    const totalProfit = filteredSales.reduce((a, s) => a + s.profit, 0)
    const totalItems = filteredSales.reduce(
      (a, s) => a + s.items.reduce((b, i) => b + i.quantity, 0),
      0
    )
    const avgMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0
    const avgOrder = filteredSales.length > 0 ? totalSales / filteredSales.length : 0
    return { totalSales, totalProfit, totalItems, avgMargin, avgOrder }
  }, [filteredSales])

  // ---- Payment status badge ----
  function paymentBadge(status: SaleRecord['paymentStatus']) {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
            <BadgeCheck className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'cod_pending':
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            COD Pending
          </Badge>
        )
    }
  }

  // ---- Payment method icon ----
  function paymentIcon(method: SaleRecord['paymentMethod']) {
    switch (method) {
      case 'cash':
        return <Wallet className="w-3.5 h-3.5 text-[#1B3B6F]" />
      case 'upi':
        return <Smartphone className="w-3.5 h-3.5 text-purple-600" />
      case 'card':
        return <CreditCard className="w-3.5 h-3.5 text-blue-600" />
      case 'cod':
        return <Truck className="w-3.5 h-3.5 text-[#FF6B35]" />
    }
  }

  // ---- New-sale helpers ----
  function recalcNewSale(updated: typeof newSale) {
    let subtotal = 0
    let totalDiscount = 0
    let totalProfit = 0

    const recalcItems = updated.items.map((item) => {
      const totalPrice = item.quantity * item.sellingPrice - item.discount
      const profit = totalPrice - item.quantity * item.costPrice
      subtotal += item.quantity * item.sellingPrice
      totalDiscount += item.discount
      totalProfit += profit
      return { ...item, totalPrice, profit }
    })

    return {
      ...updated,
      items: recalcItems,
      subtotal,
      discount: totalDiscount,
      totalAmount: subtotal - totalDiscount,
      profit: totalProfit,
    }
  }

  function updateNewSaleItem(index: number, field: keyof SaleItem, value: string | number) {
    const items = [...newSale.items]
    items[index] = { ...items[index], [field]: value }
    setNewSale(recalcNewSale({ ...newSale, items }))
  }

  function selectProduct(index: number, productId: string) {
    const prod = knownProducts.find((p) => p.id === productId)
    if (!prod) return
    const items = [...newSale.items]
    items[index] = {
      ...items[index],
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      costPrice: prod.cost,
      sellingPrice: prod.sell,
    }
    setNewSale(recalcNewSale({ ...newSale, items }))
  }

  function addNewItem() {
    setNewSale({ ...newSale, items: [...newSale.items, blankSaleItem()] })
  }

  function removeItem(index: number) {
    if (newSale.items.length <= 1) return
    const items = newSale.items.filter((_, i) => i !== index)
    setNewSale(recalcNewSale({ ...newSale, items }))
  }

  function handleSaveNewSale() {
    if (!newSale.customerName || !newSale.customerPhone) return
    if (newSale.items.some((i) => !i.productName || i.quantity < 1)) return

    const nextId = `SALE-${String(sales.length + 1).padStart(3, '0')}`
    const nextInvoice = `RC-2026-${String(sales.length + 1).padStart(4, '0')}`

    const record: SaleRecord = {
      ...newSale,
      id: nextId,
      invoiceNo: nextInvoice,
    } as SaleRecord

    setSales([record, ...sales])
    setNewSale(blankSaleRecord())
    setShowNewSale(false)
  }

  // ---- CSV export ----
  function exportCSV() {
    const headers = [
      'Date',
      'Invoice No',
      'Customer',
      'Phone',
      'Items',
      'Subtotal',
      'Discount',
      'Total Amount',
      'Profit',
      'Profit %',
      'Payment Method',
      'Payment Status',
      'Delivery Mode',
      'Delivery Boy',
      'Notes',
    ]
    const rows = filteredSales.map((s) => [
      s.date,
      s.invoiceNo,
      s.customerName,
      s.customerPhone,
      s.items.map((i) => `${i.productName} x${i.quantity}`).join('; '),
      s.subtotal,
      s.discount,
      s.totalAmount,
      s.profit,
      s.totalAmount > 0 ? ((s.profit / s.totalAmount) * 100).toFixed(1) + '%' : '0%',
      s.paymentMethod,
      s.paymentStatus,
      s.deliveryMode,
      s.deliveryBoy || '',
      s.notes || '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* ---- HEADER ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1B3B6F] flex items-center gap-2">
            <ReceiptText className="w-7 h-7" />
            Sales Ledger
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete record of every sale &mdash; full investor transparency
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setNewSale(blankSaleRecord())
              setShowNewSale(true)
            }}
            className="bg-[#FF6B35] hover:bg-[#e55a28] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record New Sale
          </Button>
          <Button variant="outline" onClick={exportCSV} className="border-[#1B3B6F] text-[#1B3B6F] hover:bg-[#1B3B6F]/5">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ---- SUMMARY CARDS ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <Card className="border-l-4 border-l-[#1B3B6F]">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">Total Sales Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-[#1B3B6F]">{formatINR.format(metrics.totalSales)}</p>
              <div className="p-2 bg-[#1B3B6F]/10 rounded-lg">
                <IndianRupee className="w-5 h-5 text-[#1B3B6F]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Profit */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">Total Profit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-emerald-600">{formatINR.format(metrics.totalProfit)}</p>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Margin */}
        <Card className="border-l-4 border-l-[#FF6B35]">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">Avg Profit Margin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-[#FF6B35]">{metrics.avgMargin.toFixed(1)}%</p>
              <div className="p-2 bg-orange-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#FF6B35]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Sold */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">Items Sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-purple-600">{metrics.totalItems}</p>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Package className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Order Value */}
        <Card className="border-l-4 border-l-sky-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wide">Avg Order Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-sky-600">{formatINR.format(metrics.avgOrder)}</p>
              <div className="p-2 bg-sky-50 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-sky-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---- FILTERS ---- */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date from */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9"
              />
            </div>
            {/* Date to */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9"
              />
            </div>
            {/* Search */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Customer, phone, invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            {/* Payment filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Payment Method</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cod">COD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Delivery filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Delivery Mode</Label>
              <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- SALES TABLE ---- */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-[#1B3B6F]">All Sales</CardTitle>
              <CardDescription>
                Showing {filteredSales.length} of {sales.length} sales
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1B3B6F]/5">
                  <TableHead className="font-semibold text-[#1B3B6F]">Date</TableHead>
                  <TableHead className="font-semibold text-[#1B3B6F]">Invoice No</TableHead>
                  <TableHead className="font-semibold text-[#1B3B6F]">Customer</TableHead>
                  <TableHead className="font-semibold text-[#1B3B6F] text-center">Items</TableHead>
                  <TableHead className="font-semibold text-[#1B3B6F] text-right">Total Amount</TableHead>
                  <TableHead className="font-semibold text-[#1B3B6F] text-right">Discount</TableHead>
                  <TableHead className="font-semibold text-[#1B3B6F] text-right">Profit</TableHead>
                  <TableHead className="font-semibold text-[#1B3B6F]">Payment</TableHead>
                  <TableHead className="font-semibold text-[#1B3B6F]">Delivery</TableHead>
                  <TableHead className="font-semibold text-[#1B3B6F] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      No sales match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => {
                    const itemCount = sale.items.reduce((a, i) => a + i.quantity, 0)
                    const marginPct =
                      sale.totalAmount > 0
                        ? ((sale.profit / sale.totalAmount) * 100).toFixed(1)
                        : '0'
                    return (
                      <TableRow key={sale.id} className="hover:bg-slate-50/60">
                        {/* Date */}
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm">{formatDate(sale.date)}</span>
                          </div>
                        </TableCell>

                        {/* Invoice */}
                        <TableCell>
                          <span className="font-mono text-xs font-medium text-[#1B3B6F] bg-[#1B3B6F]/5 px-2 py-1 rounded">
                            {sale.invoiceNo}
                          </span>
                        </TableCell>

                        {/* Customer */}
                        <TableCell>
                          <div>
                            <button
                              onClick={() => {
                                setSelectedUserSale(sale)
                                setShowUserDetails(true)
                              }}
                              className="font-medium text-sm text-[#1B3B6F] hover:text-[#1B3B6F]/80 hover:underline cursor-pointer transition-colors text-left"
                            >
                              {sale.customerName}
                            </button>
                            <p className="text-xs text-muted-foreground">{sale.customerPhone}</p>
                          </div>
                        </TableCell>

                        {/* Items */}
                        <TableCell className="text-center">
                          <div className="relative group inline-block">
                            <Badge variant="secondary" className="cursor-help">
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </Badge>
                            <div className="absolute z-50 hidden group-hover:block left-1/2 -translate-x-1/2 top-full mt-1 bg-slate-900 text-white text-xs rounded-md px-3 py-2 shadow-lg w-max max-w-xs">
                              {sale.items.map((item, idx) => (
                                <div key={idx} className="py-0.5">
                                  {item.productName} x{item.quantity}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>

                        {/* Total Amount */}
                        <TableCell className="text-right">
                          <span className="font-bold text-emerald-700">
                            {formatINR.format(sale.totalAmount)}
                          </span>
                        </TableCell>

                        {/* Discount */}
                        <TableCell className="text-right">
                          {sale.discount > 0 ? (
                            <span className="text-sm text-red-500">-{formatINR.format(sale.discount)}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">--</span>
                          )}
                        </TableCell>

                        {/* Profit */}
                        <TableCell className="text-right">
                          <div>
                            <span className="font-semibold text-emerald-600">
                              {formatINR.format(sale.profit)}
                            </span>
                            <p className="text-[10px] text-emerald-500 font-medium">{marginPct}% margin</p>
                          </div>
                        </TableCell>

                        {/* Payment */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {paymentIcon(sale.paymentMethod)}
                              <span className="text-xs font-medium capitalize">{sale.paymentMethod}</span>
                            </div>
                            {paymentBadge(sale.paymentStatus)}
                          </div>
                        </TableCell>

                        {/* Delivery */}
                        <TableCell>
                          {sale.deliveryMode === 'pickup' ? (
                            <Badge variant="outline" className="border-[#1B3B6F]/30 text-[#1B3B6F]">
                              <MapPin className="w-3 h-3 mr-1" />
                              Pickup
                            </Badge>
                          ) : (
                            <div className="space-y-0.5">
                              <Badge className="bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35]/10 border-[#FF6B35]/20">
                                <Truck className="w-3 h-3 mr-1" />
                                Delivery
                              </Badge>
                              {sale.deliveryBoy && (
                                <p className="text-[10px] text-muted-foreground pl-0.5">{sale.deliveryBoy}</p>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#1B3B6F] hover:bg-[#1B3B6F]/10"
                              onClick={() => setViewSale(sale)}
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#FF6B35] hover:bg-[#FF6B35]/10"
                              onClick={() => {
                                setViewSale(sale)
                              }}
                              title="Print invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* SALE DETAIL DIALOG                                           */}
      {/* ============================================================ */}
      <Dialog open={!!viewSale} onOpenChange={(open) => !open && setViewSale(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-ultra-narrow">
          {viewSale && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#1B3B6F] flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Invoice {viewSale.invoiceNo}
                </DialogTitle>
                <DialogDescription>
                  Sale on {formatDate(viewSale.date)} &mdash; {viewSale.id}
                </DialogDescription>
              </DialogHeader>

              {/* Customer Info */}
              <div className="rounded-lg border bg-slate-50/50 p-4 space-y-2">
                <h4 className="text-sm font-semibold text-[#1B3B6F] flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Name</p>
                    <p className="font-medium">{viewSale.customerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {viewSale.customerPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Address</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {viewSale.customerAddress || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#1B3B6F]/5">
                      <TableHead className="text-xs font-semibold text-[#1B3B6F]">Product</TableHead>
                      <TableHead className="text-xs font-semibold text-[#1B3B6F] text-center">Qty</TableHead>
                      <TableHead className="text-xs font-semibold text-[#1B3B6F] text-right">Cost Price</TableHead>
                      <TableHead className="text-xs font-semibold text-[#1B3B6F] text-right">Selling Price</TableHead>
                      <TableHead className="text-xs font-semibold text-[#1B3B6F] text-right">Discount</TableHead>
                      <TableHead className="text-xs font-semibold text-[#1B3B6F] text-right">Total</TableHead>
                      <TableHead className="text-xs font-semibold text-[#1B3B6F] text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewSale.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{item.productName}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{item.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-right text-sm">{formatINR.format(item.costPrice)}</TableCell>
                        <TableCell className="text-right text-sm">{formatINR.format(item.sellingPrice)}</TableCell>
                        <TableCell className="text-right text-sm">
                          {item.discount > 0 ? (
                            <span className="text-red-500">-{formatINR.format(item.discount)}</span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatINR.format(item.totalPrice)}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          {formatINR.format(item.profit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                  <p className="text-lg font-bold text-[#1B3B6F]">{formatINR.format(viewSale.subtotal)}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Discount</p>
                  <p className="text-lg font-bold text-red-500">
                    {viewSale.discount > 0 ? `-${formatINR.format(viewSale.discount)}` : '--'}
                  </p>
                </div>
                <div className="rounded-lg border p-3 text-center bg-[#1B3B6F]/5">
                  <p className="text-xs text-muted-foreground">Grand Total</p>
                  <p className="text-lg font-bold text-[#1B3B6F]">{formatINR.format(viewSale.totalAmount)}</p>
                </div>
                <div className="rounded-lg border p-3 text-center bg-emerald-50">
                  <p className="text-xs text-muted-foreground">Total Profit</p>
                  <p className="text-lg font-bold text-emerald-600">{formatINR.format(viewSale.profit)}</p>
                  <p className="text-[10px] text-emerald-500">
                    {viewSale.totalAmount > 0
                      ? ((viewSale.profit / viewSale.totalAmount) * 100).toFixed(1)
                      : '0'}
                    % margin
                  </p>
                </div>
              </div>

              {/* Payment & Delivery Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-[#1B3B6F] flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    Payment Details
                  </h4>
                  <div className="flex items-center gap-2">
                    {paymentIcon(viewSale.paymentMethod)}
                    <span className="text-sm font-medium capitalize">{viewSale.paymentMethod}</span>
                  </div>
                  <div>{paymentBadge(viewSale.paymentStatus)}</div>
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-[#1B3B6F] flex items-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    Delivery Details
                  </h4>
                  <p className="text-sm font-medium capitalize">{viewSale.deliveryMode}</p>
                  {viewSale.deliveryBoy && (
                    <p className="text-xs text-muted-foreground">
                      Delivery Boy: <span className="font-medium text-foreground">{viewSale.deliveryBoy}</span>
                    </p>
                  )}
                  {viewSale.orderId && (
                    <p className="text-xs text-muted-foreground">
                      Order ID: <span className="font-mono font-medium text-foreground">{viewSale.orderId}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {viewSale.notes && (
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-semibold text-[#1B3B6F] mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{viewSale.notes}</p>
                </div>
              )}

              <DialogFooter>
                <Button
                  className="bg-[#FF6B35] hover:bg-[#e55a28] text-white"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Invoice
                </Button>
                <Button variant="outline" onClick={() => setViewSale(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* RECORD NEW SALE DIALOG                                       */}
      {/* ============================================================ */}
      <Dialog open={showNewSale} onOpenChange={setShowNewSale}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-ultra-narrow">
          <DialogHeader>
            <DialogTitle className="text-[#1B3B6F] flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Record New Sale
            </DialogTitle>
            <DialogDescription>Add a new sale entry to the ledger</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customer">Customer Info</TabsTrigger>
              <TabsTrigger value="items">Items & Pricing</TabsTrigger>
              <TabsTrigger value="payment">Payment & Delivery</TabsTrigger>
            </TabsList>

            {/* ---- Tab: Customer ---- */}
            <TabsContent value="customer" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ns-name" className="text-sm font-medium">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ns-name"
                    placeholder="Full name"
                    value={newSale.customerName}
                    onChange={(e) => setNewSale({ ...newSale, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ns-phone" className="text-sm font-medium">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ns-phone"
                    placeholder="+91 XXXXX XXXXX"
                    value={newSale.customerPhone}
                    onChange={(e) => setNewSale({ ...newSale, customerPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ns-address" className="text-sm font-medium">
                  Address
                </Label>
                <Input
                  id="ns-address"
                  placeholder="Full address"
                  value={newSale.customerAddress || ''}
                  onChange={(e) => setNewSale({ ...newSale, customerAddress: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ns-date" className="text-sm font-medium">
                  Sale Date
                </Label>
                <Input
                  id="ns-date"
                  type="date"
                  value={newSale.date}
                  onChange={(e) => setNewSale({ ...newSale, date: e.target.value })}
                />
              </div>
            </TabsContent>

            {/* ---- Tab: Items ---- */}
            <TabsContent value="items" className="space-y-4 mt-4">
              <div className="space-y-3">
                {newSale.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border p-4 space-y-3 bg-slate-50/50 relative"
                  >
                    {/* Row header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1B3B6F]">Item #{idx + 1}</span>
                      {newSale.items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Product selector */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Product</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(val) => selectProduct(idx, val)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select product..." />
                        </SelectTrigger>
                        <SelectContent>
                          {knownProducts.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Numeric fields */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          className="h-9"
                          value={item.quantity}
                          onChange={(e) =>
                            updateNewSaleItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cost Price</Label>
                        <Input
                          type="number"
                          min={0}
                          className="h-9"
                          value={item.costPrice}
                          onChange={(e) =>
                            updateNewSaleItem(idx, 'costPrice', Math.max(0, parseFloat(e.target.value) || 0))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Selling Price</Label>
                        <Input
                          type="number"
                          min={0}
                          className="h-9"
                          value={item.sellingPrice}
                          onChange={(e) =>
                            updateNewSaleItem(
                              idx,
                              'sellingPrice',
                              Math.max(0, parseFloat(e.target.value) || 0)
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Discount</Label>
                        <Input
                          type="number"
                          min={0}
                          className="h-9"
                          value={item.discount}
                          onChange={(e) =>
                            updateNewSaleItem(idx, 'discount', Math.max(0, parseFloat(e.target.value) || 0))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Line Total</Label>
                        <div className="h-9 flex items-center px-3 bg-white rounded-md border text-sm font-semibold text-emerald-700">
                          {formatINR.format(item.totalPrice)}
                        </div>
                      </div>
                    </div>

                    {/* Per-row profit */}
                    <div className="text-xs text-right">
                      <span className="text-muted-foreground">Profit: </span>
                      <span className={`font-semibold ${item.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {formatINR.format(item.profit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addNewItem}
                className="border-dashed border-[#1B3B6F]/30 text-[#1B3B6F] hover:bg-[#1B3B6F]/5"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>

              {/* Running totals */}
              <div className="rounded-lg border bg-gradient-to-r from-[#1B3B6F]/5 to-emerald-50 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="text-lg font-bold text-[#1B3B6F]">{formatINR.format(newSale.subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Discount</p>
                    <p className="text-lg font-bold text-red-500">
                      {newSale.discount > 0 ? `-${formatINR.format(newSale.discount)}` : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Grand Total</p>
                    <p className="text-lg font-bold text-[#1B3B6F]">{formatINR.format(newSale.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Profit</p>
                    <p className={`text-lg font-bold ${newSale.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {formatINR.format(newSale.profit)}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ---- Tab: Payment & Delivery ---- */}
            <TabsContent value="payment" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment method */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <Select
                    value={newSale.paymentMethod}
                    onValueChange={(val) =>
                      setNewSale({
                        ...newSale,
                        paymentMethod: val as SaleRecord['paymentMethod'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cod">COD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment status */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Payment Status</Label>
                  <Select
                    value={newSale.paymentStatus}
                    onValueChange={(val) =>
                      setNewSale({
                        ...newSale,
                        paymentStatus: val as SaleRecord['paymentStatus'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cod_pending">COD Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Delivery mode */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Delivery Mode</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={newSale.deliveryMode === 'pickup' ? 'default' : 'outline'}
                    className={
                      newSale.deliveryMode === 'pickup'
                        ? 'bg-[#1B3B6F] hover:bg-[#15305a] text-white'
                        : 'border-[#1B3B6F]/30 text-[#1B3B6F]'
                    }
                    onClick={() => setNewSale({ ...newSale, deliveryMode: 'pickup', deliveryBoy: '' })}
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    Pickup
                  </Button>
                  <Button
                    type="button"
                    variant={newSale.deliveryMode === 'delivery' ? 'default' : 'outline'}
                    className={
                      newSale.deliveryMode === 'delivery'
                        ? 'bg-[#FF6B35] hover:bg-[#e55a28] text-white'
                        : 'border-[#FF6B35]/30 text-[#FF6B35]'
                    }
                    onClick={() => setNewSale({ ...newSale, deliveryMode: 'delivery' })}
                  >
                    <Truck className="w-4 h-4 mr-1" />
                    Delivery
                  </Button>
                </div>
              </div>

              {/* Delivery boy */}
              {newSale.deliveryMode === 'delivery' && (
                <div className="space-y-1.5">
                  <Label htmlFor="ns-dboy" className="text-sm font-medium">
                    Delivery Boy Name
                  </Label>
                  <Select
                    value={newSale.deliveryBoy || ''}
                    onValueChange={(val) => setNewSale({ ...newSale, deliveryBoy: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery boy..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Amit Singh">Amit Singh</SelectItem>
                      <SelectItem value="Rajesh Kumar">Rajesh Kumar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="ns-notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Input
                  id="ns-notes"
                  placeholder="Any additional notes..."
                  value={newSale.notes || ''}
                  onChange={(e) => setNewSale({ ...newSale, notes: e.target.value })}
                />
              </div>

              {/* Summary strip */}
              <div className="rounded-lg border bg-gradient-to-r from-[#1B3B6F]/5 to-emerald-50 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="text-lg font-bold text-[#1B3B6F]">{formatINR.format(newSale.subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Discount</p>
                    <p className="text-lg font-bold text-red-500">
                      {newSale.discount > 0 ? `-${formatINR.format(newSale.discount)}` : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Grand Total</p>
                    <p className="text-lg font-bold text-[#1B3B6F]">{formatINR.format(newSale.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Profit</p>
                    <p className={`text-lg font-bold ${newSale.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {formatINR.format(newSale.profit)}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowNewSale(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#1B3B6F] hover:bg-[#15305a] text-white"
              onClick={handleSaveNewSale}
              disabled={
                !newSale.customerName ||
                !newSale.customerPhone ||
                newSale.items.some((i) => !i.productName || i.quantity < 1)
              }
            >
              <ReceiptText className="w-4 h-4 mr-2" />
              Save Sale
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

          {selectedUserSale && (
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
                        <p className="font-semibold">{selectedUserSale.customerName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                        <p className="font-semibold">{selectedUserSale.customerPhone}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                      <p className="text-sm">{selectedUserSale.customerAddress || 'No address provided'}</p>
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
                        <Label className="text-sm font-medium text-muted-foreground">Invoice No</Label>
                        <p className="font-mono font-semibold text-[#1B3B6F]">{selectedUserSale.invoiceNo}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                        <p className="font-semibold">{formatDate(selectedUserSale.date)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                        <p className="font-bold text-emerald-700">{formatINR.format(selectedUserSale.totalAmount)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                        <p className="font-semibold capitalize">{selectedUserSale.paymentMethod}</p>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Items Purchased</Label>
                      <div className="mt-2 space-y-2">
                        {selectedUserSale.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">Qty: {item.quantity}</p>
                              <p className="text-sm text-emerald-600">{formatINR.format(item.totalPrice)}</p>
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
                              console.log('Assigning order to:', partner.name)
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
    </div>
  )
}
