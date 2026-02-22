'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  ArrowUp,
  ArrowDown,
  Calendar,
  BarChart3,
  PieChart,
  Minus,
  Plus,
  Eye,
  Download,
  FileText,
  Wallet,
  CreditCard,
  IndianRupee,
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
import { Progress } from '@/components/ui/progress'
import {
  mockSales,
  mockPurchases,
  mockExpenses,
  mockDailySummaries,
  getBusinessMetrics,
  Expense,
} from '@/data/businessMockData'

// INR currency formatter
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

// Expense category config
const categoryConfig: Record<string, { label: string; color: string }> = {
  rent: { label: 'Rent', color: 'bg-blue-100 text-blue-800' },
  salary: { label: 'Salary', color: 'bg-purple-100 text-purple-800' },
  transport: { label: 'Transport', color: 'bg-yellow-100 text-yellow-800' },
  electricity: { label: 'Electricity', color: 'bg-orange-100 text-orange-800' },
  marketing: { label: 'Marketing', color: 'bg-pink-100 text-pink-800' },
  packaging: { label: 'Packaging', color: 'bg-teal-100 text-teal-800' },
  misc: { label: 'Miscellaneous', color: 'bg-gray-100 text-gray-800' },
}

export function ProfitAnalytics() {
  const [activeTab, setActiveTab] = useState('daily-pl')
  const [dateFilter, setDateFilter] = useState('')
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'misc' as Expense['category'],
    description: '',
    amount: '',
    paidTo: '',
    paymentMethod: 'cash' as Expense['paymentMethod'],
  })

  // ---------- Aggregated Metrics ----------
  const metrics = useMemo(() => getBusinessMetrics(), [])

  const totalRevenue = metrics.totalSalesAmount
  const totalCost = metrics.totalPurchaseAmount
  const grossProfit = metrics.totalProfit
  const totalExpenses = metrics.totalExpenses
  const netProfit = metrics.netProfit
  const profitMargin = metrics.profitMargin

  // ---------- Product-wise Profit ----------
  const productProfitData = useMemo(() => {
    const productMap: Record<
      string,
      {
        productId: string
        productName: string
        unitsSold: number
        totalRevenue: number
        totalCost: number
        totalProfit: number
      }
    > = {}

    mockSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productMap[item.productId]) {
          productMap[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            unitsSold: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
          }
        }
        const entry = productMap[item.productId]
        entry.unitsSold += item.quantity
        entry.totalRevenue += item.totalPrice
        entry.totalCost += item.costPrice * item.quantity
        entry.totalProfit += item.profit
      })
    })

    return Object.values(productMap)
      .map((p) => ({
        ...p,
        profitPerUnit: p.unitsSold > 0 ? p.totalProfit / p.unitsSold : 0,
        profitMargin: p.totalRevenue > 0 ? (p.totalProfit / p.totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit)
  }, [])

  // ---------- Expense by Category ----------
  const expenseByCategory = useMemo(() => {
    const catMap: Record<string, number> = {}
    mockExpenses.forEach((exp) => {
      catMap[exp.category] = (catMap[exp.category] || 0) + exp.amount
    })
    return Object.entries(catMap)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
  }, [])

  // ---------- Daily P&L with filter ----------
  const filteredDailySummaries = useMemo(() => {
    if (!dateFilter) return mockDailySummaries
    return mockDailySummaries.filter((d) => d.date.includes(dateFilter))
  }, [dateFilter])

  const dailyTotals = useMemo(() => {
    return filteredDailySummaries.reduce(
      (acc, d) => ({
        totalPurchases: acc.totalPurchases + d.totalPurchases,
        totalSales: acc.totalSales + d.totalSales,
        totalProfit: acc.totalProfit + d.totalProfit,
        totalOrders: acc.totalOrders + d.totalOrders,
        itemsSold: acc.itemsSold + d.itemsSold,
        netCashFlow: acc.netCashFlow + (d.cashIn - d.cashOut),
      }),
      { totalPurchases: 0, totalSales: 0, totalProfit: 0, totalOrders: 0, itemsSold: 0, netCashFlow: 0 }
    )
  }, [filteredDailySummaries])

  // ---------- Financial Summary ----------
  const financialSummary = useMemo(() => {
    const dailySales = mockDailySummaries.map((d) => d.totalSales)
    const avgDailySales = dailySales.length > 0 ? dailySales.reduce((a, b) => a + b, 0) / dailySales.length : 0
    const topSellingDay = mockDailySummaries.reduce(
      (best, d) => (d.totalSales > best.totalSales ? d : best),
      mockDailySummaries[0]
    )

    const avgPurchaseAmount =
      mockPurchases.length > 0 ? metrics.totalPurchaseAmount / mockPurchases.length : 0

    const totalCashIn = mockDailySummaries.reduce((sum, d) => sum + d.cashIn, 0)
    const totalCashOut =
      mockDailySummaries.reduce((sum, d) => sum + d.cashOut, 0) + metrics.totalExpenses

    return {
      avgDailySales,
      topSellingDay,
      avgPurchaseAmount,
      totalCashIn,
      totalCashOut,
      netCashPosition: totalCashIn - totalCashOut,
      totalInvestment: metrics.totalInvestment,
      roi:
        metrics.totalInvestment > 0
          ? (metrics.netProfit / metrics.totalInvestment) * 100
          : 0,
    }
  }, [metrics])

  // ---------- Add expense handler ----------
  const handleAddExpense = () => {
    // In production this would POST to an API
    console.log('New expense:', newExpense)
    setAddExpenseOpen(false)
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      category: 'misc',
      description: '',
      amount: '',
      paidTo: '',
      paymentMethod: 'cash',
    })
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#1B3B6F' }}>
            Profit &amp; Loss Analytics
          </h2>
          <p className="text-muted-foreground">
            Complete financial transparency for all stakeholders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button size="sm" style={{ backgroundColor: '#FF6B35' }} className="text-white hover:opacity-90">
            <FileText className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
        </div>
      </div>

      {/* ---- Top KPI Cards (2 rows x 3) ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Revenue */}
        <Card className="border-0 shadow-md" style={{ backgroundColor: '#f0fdf4' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Revenue</CardTitle>
            <IndianRupee className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatINR(totalRevenue)}</div>
            <p className="mt-1 text-xs text-green-600">
              From {metrics.totalSalesCount} sales transactions
            </p>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card className="border-0 shadow-md" style={{ backgroundColor: '#fef2f2' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total Cost (Purchases)</CardTitle>
            <ShoppingCart className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{formatINR(totalCost)}</div>
            <p className="mt-1 text-xs text-red-600">
              {metrics.totalPurchaseCount} purchase orders &bull; Pending: {formatINR(metrics.pendingPayments)}
            </p>
          </CardContent>
        </Card>

        {/* Gross Profit */}
        <Card className="border-0 shadow-md" style={{ backgroundColor: '#eff6ff' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Gross Profit</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatINR(grossProfit)}</div>
            <p className="mt-1 text-xs text-blue-600">Revenue minus COGS</p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-0 shadow-md" style={{ backgroundColor: '#fff7ed' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Total Expenses</CardTitle>
            <Wallet className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{formatINR(totalExpenses)}</div>
            <p className="mt-1 text-xs text-orange-600">
              {mockExpenses.length} expense entries this period
            </p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card
          className="border-0 shadow-lg"
          style={{
            backgroundColor: netProfit >= 0 ? '#f0fdf4' : '#fef2f2',
            border: netProfit >= 0 ? '2px solid #22c55e' : '2px solid #ef4444',
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={`text-sm font-medium ${netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}
            >
              Net Profit
            </CardTitle>
            {netProfit >= 0 ? (
              <ArrowUp className="h-5 w-5 text-green-600" />
            ) : (
              <ArrowDown className="h-5 w-5 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-extrabold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}
            >
              {formatINR(netProfit)}
            </div>
            <p
              className={`mt-1 text-xs ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              Gross Profit minus all Expenses
            </p>
          </CardContent>
        </Card>

        {/* Profit Margin % */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#1B3B6F' }}>
              Profit Margin
            </CardTitle>
            <BarChart3 className="h-5 w-5" style={{ color: '#FF6B35' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#1B3B6F' }}>
              {profitMargin.toFixed(1)}%
            </div>
            <Progress
              value={Math.min(profitMargin, 100)}
              className="mt-3 h-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">Of total sales revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Tabs ---- */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily-pl">Daily P&amp;L</TabsTrigger>
          <TabsTrigger value="product-profit">Product-wise Profit</TabsTrigger>
          <TabsTrigger value="expense-tracker">Expense Tracker</TabsTrigger>
          <TabsTrigger value="financial-summary">Financial Summary</TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* TAB 1 - Daily P&L                                               */}
        {/* ================================================================ */}
        <TabsContent value="daily-pl" className="space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle style={{ color: '#1B3B6F' }}>Daily Profit &amp; Loss</CardTitle>
                  <CardDescription>Day-by-day financial performance overview</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-44"
                    placeholder="Filter by date"
                  />
                  {dateFilter && (
                    <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Purchases</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-center">Orders</TableHead>
                      <TableHead className="text-center">Items Sold</TableHead>
                      <TableHead>Top Product</TableHead>
                      <TableHead className="text-right">Net Cash Flow</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDailySummaries.map((day) => {
                      const netCashFlow = day.cashIn - day.cashOut
                      const isHighProfit = day.totalProfit >= 2000
                      const isLowProfit = day.totalProfit > 0 && day.totalProfit < 1200

                      return (
                        <TableRow
                          key={day.date}
                          className={
                            isHighProfit
                              ? 'bg-green-50/60'
                              : isLowProfit
                                ? 'bg-yellow-50/60'
                                : ''
                          }
                        >
                          <TableCell className="font-medium">
                            {new Date(day.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            {day.totalPurchases > 0 ? formatINR(day.totalPurchases) : '—'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatINR(day.totalSales)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className={day.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}>
                              {formatINR(day.totalProfit)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">{day.totalOrders}</TableCell>
                          <TableCell className="text-center">{day.itemsSold}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {day.topProduct}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}>
                              {formatINR(netCashFlow)}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {/* Running Total Row */}
                    <TableRow className="border-t-2 font-bold" style={{ backgroundColor: '#eff6ff' }}>
                      <TableCell style={{ color: '#1B3B6F' }}>TOTAL</TableCell>
                      <TableCell className="text-right text-red-700">
                        {formatINR(dailyTotals.totalPurchases)}
                      </TableCell>
                      <TableCell className="text-right text-green-700">
                        {formatINR(dailyTotals.totalSales)}
                      </TableCell>
                      <TableCell className="text-right text-green-700">
                        {formatINR(dailyTotals.totalProfit)}
                      </TableCell>
                      <TableCell className="text-center">{dailyTotals.totalOrders}</TableCell>
                      <TableCell className="text-center">{dailyTotals.itemsSold}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            dailyTotals.netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'
                          }
                        >
                          {formatINR(dailyTotals.netCashFlow)}
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 2 - Product-wise Profit                                     */}
        {/* ================================================================ */}
        <TabsContent value="product-profit" className="space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle style={{ color: '#1B3B6F' }}>Product-wise Profitability</CardTitle>
              <CardDescription>
                Per-product performance sorted by most profitable first
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="text-center">Units Sold</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">Total Profit</TableHead>
                      <TableHead className="text-right">Profit / Unit</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productProfitData.map((product, idx) => {
                      const marginClass =
                        product.profitMargin > 30
                          ? 'text-green-700 bg-green-50'
                          : product.profitMargin >= 20
                            ? 'text-yellow-700 bg-yellow-50'
                            : 'text-red-700 bg-red-50'

                      return (
                        <TableRow key={product.productId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {idx === 0 && (
                                <Badge
                                  className="text-[10px] text-white"
                                  style={{ backgroundColor: '#FF6B35' }}
                                >
                                  Most Profitable
                                </Badge>
                              )}
                              {idx === productProfitData.length - 1 && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Least Profitable
                                </Badge>
                              )}
                              <span className="font-medium">{product.productName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{product.unitsSold}</TableCell>
                          <TableCell className="text-right">{formatINR(product.totalRevenue)}</TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatINR(product.totalCost)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-700">
                            {formatINR(product.totalProfit)}
                          </TableCell>
                          <TableCell className="text-right">{formatINR(product.profitPerUnit)}</TableCell>
                          <TableCell className="text-right">
                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${marginClass}`}>
                              {product.profitMargin.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 3 - Expense Tracker                                         */}
        {/* ================================================================ */}
        <TabsContent value="expense-tracker" className="space-y-4">
          {/* Total Expenses bar */}
          <Card className="shadow-md" style={{ backgroundColor: '#fff7ed' }}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Total Expenses This Period</p>
                  <p className="text-2xl font-bold text-orange-700">{formatINR(totalExpenses)}</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setAddExpenseOpen(true)}
                style={{ backgroundColor: '#FF6B35' }}
                className="text-white hover:opacity-90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </CardContent>
          </Card>

          {/* Expense by Category */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle style={{ color: '#1B3B6F' }}>Expenses by Category</CardTitle>
              <CardDescription>Breakdown of expenses across all categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {expenseByCategory.map(({ category, total }) => {
                  const config = categoryConfig[category] || categoryConfig.misc
                  const percentage = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
                  return (
                    <div key={category} className="rounded-lg border p-3">
                      <Badge className={`mb-2 ${config.color}`} variant="secondary">
                        {config.label}
                      </Badge>
                      <p className="text-lg font-bold" style={{ color: '#1B3B6F' }}>
                        {formatINR(total)}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={percentage} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Expense Table */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle style={{ color: '#1B3B6F' }}>All Expenses</CardTitle>
              <CardDescription>Complete list of all recorded expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Paid To</TableHead>
                      <TableHead>Payment Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockExpenses.map((expense) => {
                      const config = categoryConfig[expense.category] || categoryConfig.misc
                      return (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">
                            {new Date(expense.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge className={config.color} variant="secondary">
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="text-right font-semibold text-orange-700">
                            {formatINR(expense.amount)}
                          </TableCell>
                          <TableCell>{expense.paidTo}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs uppercase">
                              {expense.paymentMethod.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Add Expense Dialog */}
          <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle style={{ color: '#1B3B6F' }}>Add New Expense</DialogTitle>
                <DialogDescription>
                  Record a new business expense. All fields are required.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exp-date">Date</Label>
                    <Input
                      id="exp-date"
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-category">Category</Label>
                    <Select
                      value={newExpense.category}
                      onValueChange={(val) =>
                        setNewExpense({ ...newExpense, category: val as Expense['category'] })
                      }
                    >
                      <SelectTrigger id="exp-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryConfig).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            {cfg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-desc">Description</Label>
                  <Input
                    id="exp-desc"
                    placeholder="e.g. Shop rent for March"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exp-amount">Amount (INR)</Label>
                    <Input
                      id="exp-amount"
                      type="number"
                      placeholder="0"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-paid-to">Paid To</Label>
                    <Input
                      id="exp-paid-to"
                      placeholder="e.g. Landlord"
                      value={newExpense.paidTo}
                      onChange={(e) => setNewExpense({ ...newExpense, paidTo: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-method">Payment Method</Label>
                  <Select
                    value={newExpense.paymentMethod}
                    onValueChange={(val) =>
                      setNewExpense({ ...newExpense, paymentMethod: val as Expense['paymentMethod'] })
                    }
                  >
                    <SelectTrigger id="exp-method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddExpenseOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddExpense}
                  style={{ backgroundColor: '#FF6B35' }}
                  className="text-white hover:opacity-90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 4 - Financial Summary                                       */}
        {/* ================================================================ */}
        <TabsContent value="financial-summary" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Revenue Section */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <CardTitle className="text-green-800">Revenue</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                  <span className="text-sm text-green-700">Total Sales Revenue</span>
                  <span className="text-lg font-bold text-green-800">{formatINR(totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <span className="text-sm text-gray-600">Average Daily Sales</span>
                  <span className="font-semibold">{formatINR(financialSummary.avgDailySales)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <span className="text-sm text-gray-600">Top Selling Day</span>
                  <div className="text-right">
                    <span className="font-semibold">
                      {formatINR(financialSummary.topSellingDay.totalSales)}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(financialSummary.topSellingDay.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <span className="text-sm text-gray-600">Total Discounts Given</span>
                  <span className="font-semibold text-orange-600">
                    {formatINR(metrics.totalDiscounts)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cost Section */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                    <ShoppingCart className="h-4 w-4 text-red-600" />
                  </div>
                  <CardTitle className="text-red-800">Cost of Goods</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                  <span className="text-sm text-red-700">Total Purchase Cost</span>
                  <span className="text-lg font-bold text-red-800">{formatINR(totalCost)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <span className="text-sm text-gray-600">Average Purchase Order</span>
                  <span className="font-semibold">
                    {formatINR(financialSummary.avgPurchaseAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <span className="text-sm text-gray-600">Amount Paid to Suppliers</span>
                  <span className="font-semibold">{formatINR(metrics.totalPaidToPurchase)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
                  <span className="text-sm text-yellow-700">Pending Supplier Payments</span>
                  <span className="font-bold text-yellow-800">
                    {formatINR(metrics.pendingPayments)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Profit Section */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: '#dbeafe' }}
                  >
                    <BarChart3 className="h-4 w-4" style={{ color: '#1B3B6F' }} />
                  </div>
                  <CardTitle style={{ color: '#1B3B6F' }}>Profit Breakdown</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                  <span className="text-sm text-blue-700">Gross Profit (Revenue - COGS)</span>
                  <span className="text-lg font-bold text-blue-800">{formatINR(grossProfit)}</span>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-medium text-gray-600">Expense Breakdown:</p>
                  {expenseByCategory.map(({ category, total }) => {
                    const config = categoryConfig[category] || categoryConfig.misc
                    return (
                      <div key={category} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-500">{config.label}</span>
                        <span className="text-sm font-medium text-orange-600">
                          - {formatINR(total)}
                        </span>
                      </div>
                    )
                  })}
                  <div className="mt-2 border-t pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Total Expenses</span>
                      <span className="font-bold text-orange-700">{formatINR(totalExpenses)}</span>
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center justify-between rounded-lg p-3"
                  style={{
                    backgroundColor: netProfit >= 0 ? '#f0fdf4' : '#fef2f2',
                    border: netProfit >= 0 ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  }}
                >
                  <span
                    className={`text-sm font-medium ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}
                  >
                    Net Profit
                  </span>
                  <span
                    className={`text-xl font-extrabold ${netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}
                  >
                    {formatINR(netProfit)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Section */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                  </div>
                  <CardTitle className="text-purple-800">Cash Flow</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                  <span className="text-sm text-green-700">Total Cash In (from sales)</span>
                  <span className="text-lg font-bold text-green-800">
                    {formatINR(financialSummary.totalCashIn)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                  <span className="text-sm text-red-700">Total Cash Out (purchases + expenses)</span>
                  <span className="text-lg font-bold text-red-800">
                    {formatINR(financialSummary.totalCashOut)}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between rounded-lg p-3"
                  style={{
                    backgroundColor:
                      financialSummary.netCashPosition >= 0 ? '#f0fdf4' : '#fef2f2',
                    border:
                      financialSummary.netCashPosition >= 0
                        ? '1px solid #bbf7d0'
                        : '1px solid #fecaca',
                  }}
                >
                  <span
                    className={`text-sm font-medium ${
                      financialSummary.netCashPosition >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    Net Cash Position
                  </span>
                  <span
                    className={`text-xl font-extrabold ${
                      financialSummary.netCashPosition >= 0 ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {formatINR(financialSummary.netCashPosition)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investment ROI - Full Width */}
          <Card className="shadow-lg" style={{ border: '2px solid #1B3B6F' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#1B3B6F' }}
                >
                  <IndianRupee className="h-4 w-4 text-white" />
                </div>
                <CardTitle style={{ color: '#1B3B6F' }}>Investment ROI</CardTitle>
              </div>
              <CardDescription>Return on investment for all stakeholders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: '#eff6ff' }}>
                  <p className="text-sm text-blue-600">Total Investment</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: '#1B3B6F' }}>
                    {formatINR(financialSummary.totalInvestment)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    From all investors &amp; partners
                  </p>
                </div>
                <div
                  className="rounded-lg p-4 text-center"
                  style={{
                    backgroundColor: netProfit >= 0 ? '#f0fdf4' : '#fef2f2',
                  }}
                >
                  <p className={`text-sm ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Current Net Profit
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      netProfit >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {formatINR(netProfit)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">After all expenses</p>
                </div>
                <div
                  className="rounded-lg p-4 text-center"
                  style={{
                    backgroundColor: financialSummary.roi >= 0 ? '#fff7ed' : '#fef2f2',
                  }}
                >
                  <p className="text-sm" style={{ color: '#FF6B35' }}>
                    ROI Percentage
                  </p>
                  <p
                    className="mt-1 text-2xl font-bold"
                    style={{ color: financialSummary.roi >= 0 ? '#FF6B35' : '#ef4444' }}
                  >
                    {financialSummary.roi >= 0 ? '+' : ''}
                    {financialSummary.roi.toFixed(2)}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Net Profit / Total Investment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
