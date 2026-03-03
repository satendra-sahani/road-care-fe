'use client'

import { useState, useEffect } from 'react'
import { userWalletAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  TrendingUp,
  TrendingDown,
  Filter,
} from 'lucide-react'

type Transaction = {
  _id: string
  type: 'credit' | 'debit'
  amount: number
  balanceAfter: number
  category: string
  description: string
  reference?: string
  status: string
  createdAt: string
}

type WalletData = {
  balance: number
  totalCredited: number
  totalDebited: number
  user: any
  isActive: boolean
}

type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
}

const filterOptions = [
  { label: 'All', value: '' },
  { label: 'Credits', value: 'credit' },
  { label: 'Debits', value: 'debit' },
]

function formatCurrency(amount: number): string {
  return `Rs.${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'bg-green-100 text-green-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    case 'failed':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [txnLoading, setTxnLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('')

  useEffect(() => {
    fetchWallet()
  }, [])

  useEffect(() => {
    fetchTransactions(1, activeFilter)
  }, [activeFilter])

  const fetchWallet = async () => {
    setLoading(true)
    try {
      const res = await userWalletAPI.getWallet()
      if (res.data.success) {
        setWallet(res.data.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch wallet:', err)
      toast.error(err.response?.data?.message || 'Failed to load wallet')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (page: number, type?: string) => {
    setTxnLoading(true)
    try {
      const params: any = { page, limit: 10 }
      if (type) params.type = type
      const res = await userWalletAPI.getTransactions(params)
      if (res.data.success) {
        setTransactions(res.data.data)
        if (res.data.pagination) {
          setPagination(res.data.pagination)
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err)
      toast.error(err.response?.data?.message || 'Failed to load transactions')
    } finally {
      setTxnLoading(false)
    }
  }

  const handleFilterChange = (value: string) => {
    setActiveFilter(value)
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.pages) return
    fetchTransactions(page, activeFilter)
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-8 max-w-2xl md:max-w-4xl animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="h-48 bg-gray-200 rounded-xl mb-6" />
          <div className="h-10 bg-gray-200 rounded w-2/3 mb-4" />
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded-xl" />
            <div className="h-20 bg-gray-200 rounded-xl" />
            <div className="h-20 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-6 max-w-2xl md:max-w-4xl">
        {/* Page Header */}
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">My Wallet</h1>

        {/* Wallet Balance Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1B3B6F] to-[#2E5090] p-6 sm:p-8 mb-6 text-white shadow-lg">
          {/* Background Wallet Icon */}
          <Wallet className="absolute right-4 top-4 h-24 w-24 text-white/10" />

          <div className="relative z-10">
            <p className="text-sm text-white/70 font-medium mb-1">Available Balance</p>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
              {formatCurrency(wallet?.balance ?? 0)}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-white/60">Total Credited</p>
                  <p className="text-lg font-semibold text-green-400">
                    {formatCurrency(wallet?.totalCredited ?? 0)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-white/60">Total Debited</p>
                  <p className="text-lg font-semibold text-red-400">
                    {formatCurrency(wallet?.totalDebited ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Filters */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFilterChange(opt.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === opt.value
                    ? 'bg-[#1B3B6F] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">Transaction History</h2>

          {txnLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#1B3B6F]" />
              <span className="ml-2 text-sm text-muted-foreground">Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            /* Empty State */
            <div className="bg-white border rounded-xl p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Receipt className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No transactions yet</h3>
              <p className="text-sm text-muted-foreground">
                {activeFilter === 'credit'
                  ? 'No credit transactions found.'
                  : activeFilter === 'debit'
                  ? 'No debit transactions found.'
                  : 'Your transaction history will appear here.'}
              </p>
            </div>
          ) : (
            /* Transaction List */
            <div className="space-y-3">
              {transactions.map((txn) => {
                const isCredit = txn.type === 'credit'
                return (
                  <div
                    key={txn._id}
                    className="bg-white border rounded-xl overflow-hidden flex transition-shadow hover:shadow-md"
                  >
                    {/* Left Color Strip */}
                    <div className={`w-1.5 ${isCredit ? 'bg-green-500' : 'bg-red-500'}`} />

                    <div className="flex-1 p-4 flex items-center gap-3 sm:gap-4">
                      {/* Icon */}
                      <div
                        className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${
                          isCredit ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-600" />
                        )}
                      </div>

                      {/* Description & Meta */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {txn.description || (isCredit ? 'Amount Credited' : 'Amount Debited')}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-blue-50 text-[#1B3B6F] capitalize">
                            {txn.category || 'general'}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {formatDate(txn.createdAt)} at {formatTime(txn.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Amount & Status */}
                      <div className="text-right shrink-0">
                        <p
                          className={`text-sm sm:text-base font-bold ${
                            isCredit ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isCredit ? '+' : '-'}{formatCurrency(txn.amount)}
                        </p>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium capitalize ${getStatusColor(
                            txn.status
                          )}`}
                        >
                          {txn.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || txnLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show first, last, current, and adjacent pages
                  return p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1
                })
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                    acc.push('...')
                  }
                  acc.push(p)
                  return acc
                }, [])
                .map((item, idx) =>
                  typeof item === 'string' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => handlePageChange(item)}
                      disabled={txnLoading}
                      className={`h-8 w-8 rounded text-sm font-medium transition-colors ${
                        item === pagination.page
                          ? 'bg-[#1B3B6F] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages || txnLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </UserLayout>
  )
}
