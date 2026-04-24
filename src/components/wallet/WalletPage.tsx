'use client'

import { useCallback, useEffect, useState } from 'react'
import { userWalletAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  Banknote,
  CreditCard,
  Smartphone,
  Info,
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

type WithdrawalItem = {
  _id: string
  withdrawalId: string
  amount: number
  status: 'pending' | 'processed' | 'rejected'
  payoutMethod?: 'upi' | 'bank' | null
  upiId?: string
  bankDetails?: {
    accountNumber?: string
    ifscCode?: string
    accountHolderName?: string
    bankName?: string
  }
  rejectionReason?: string
  processedAt?: string
  createdAt: string
}

const MIN_WITHDRAWAL = 100

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

function getWithdrawalStatusClasses(status: string): string {
  switch (status) {
    case 'processed':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200'
    default:
      return 'bg-amber-100 text-amber-700 border-amber-200'
  }
}

export function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [txnLoading, setTxnLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('')

  // Withdrawal state
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([])
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi')
  const [upiId, setUpiId] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankIfsc, setBankIfsc] = useState('')
  const [bankHolder, setBankHolder] = useState('')
  const [bankName, setBankName] = useState('')

  useEffect(() => {
    fetchWallet()
    fetchWithdrawals()
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

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await userWalletAPI.getWithdrawals({ page: 1, limit: 5 })
      if (res.data.success) {
        setWithdrawals(res.data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err)
    }
  }, [])

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

  const resetWithdrawForm = () => {
    setWithdrawAmount('')
    setPayoutMethod('upi')
    setUpiId('')
    setBankAccount('')
    setBankIfsc('')
    setBankHolder('')
    setBankName('')
  }

  const openWithdraw = () => {
    resetWithdrawForm()
    setShowWithdraw(true)
  }

  const submitWithdraw = async () => {
    const amt = parseInt(withdrawAmount, 10)
    if (!amt || amt < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is Rs.${MIN_WITHDRAWAL}`)
      return
    }
    if (wallet && amt > wallet.balance) {
      toast.error(`Insufficient balance. Available: Rs.${wallet.balance}`)
      return
    }

    const payload: any = { amount: amt, method: payoutMethod }
    if (payoutMethod === 'upi') {
      const upi = upiId.trim()
      if (!upi || !/^[\w.\-]+@[\w.\-]+$/.test(upi)) {
        toast.error('Please enter a valid UPI ID like name@bank')
        return
      }
      payload.upiId = upi
    } else {
      const acc = bankAccount.trim()
      const ifsc = bankIfsc.trim().toUpperCase()
      const holder = bankHolder.trim()
      if (!acc || acc.length < 6) {
        toast.error('Please enter a valid account number')
        return
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        toast.error('Please enter a valid IFSC code (e.g. SBIN0001234)')
        return
      }
      if (!holder) {
        toast.error('Please enter the account holder name')
        return
      }
      payload.bankDetails = {
        accountNumber: acc,
        ifscCode: ifsc,
        accountHolderName: holder,
        bankName: bankName.trim(),
      }
    }

    try {
      setSubmitting(true)
      const res = await userWalletAPI.requestWithdrawal(payload)
      if (res.data?.success) {
        toast.success('Withdrawal request submitted. Admin will process it shortly.')
        setShowWithdraw(false)
        resetWithdrawForm()
        fetchWithdrawals()
      } else {
        toast.error(res.data?.message || 'Unable to submit withdrawal request')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Unable to submit withdrawal request')
    } finally {
      setSubmitting(false)
    }
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

  const canWithdraw = !!wallet && wallet.balance >= MIN_WITHDRAWAL

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

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-6">
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

            <Button
              onClick={openWithdraw}
              disabled={!canWithdraw}
              className="bg-white text-[#1B3B6F] hover:bg-white/90 font-semibold w-full sm:w-auto"
            >
              <Banknote className="h-4 w-4 mr-2" />
              Withdraw Money
            </Button>
            {!canWithdraw && wallet && (
              <p className="text-xs text-white/70 mt-2">
                Minimum Rs.{MIN_WITHDRAWAL} required to withdraw
              </p>
            )}
          </div>
        </div>

        {/* Recent Withdrawals */}
        {withdrawals.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Recent Withdrawals</h2>
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div
                  key={w._id}
                  className="bg-white border rounded-xl p-4 flex items-start gap-3"
                >
                  <div className="h-10 w-10 shrink-0 rounded-full bg-[#1B3B6F]/10 flex items-center justify-center">
                    <Banknote className="h-5 w-5 text-[#1B3B6F]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-foreground">
                          {formatCurrency(w.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {w.withdrawalId}
                        </p>
                        {w.payoutMethod === 'upi' && w.upiId && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            UPI: <span className="font-mono">{w.upiId}</span>
                          </p>
                        )}
                        {w.payoutMethod === 'bank' && w.bankDetails?.accountNumber && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Bank: ****{w.bankDetails.accountNumber.slice(-4)} • {w.bankDetails.ifscCode}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(w.createdAt)} at {formatTime(w.createdAt)}
                        </p>
                        {w.status === 'rejected' && w.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">
                            Reason: {w.rejectionReason}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${getWithdrawalStatusClasses(w.status)}`}
                      >
                        {w.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

      {/* ── Withdraw Dialog ── */}
      <Dialog
        open={showWithdraw}
        onOpenChange={(o) => {
          if (!submitting) {
            setShowWithdraw(o)
            if (!o) resetWithdrawForm()
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-[#1B3B6F]" />
              Withdraw Money
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Balance */}
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-xs text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold text-[#1B3B6F] mt-1">
                {formatCurrency(wallet?.balance ?? 0)}
              </p>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="wdAmount" className="text-sm font-semibold">
                Enter amount (Rs.)
              </Label>
              <Input
                id="wdAmount"
                className="mt-1 text-lg font-semibold"
                placeholder={`Min Rs.${MIN_WITHDRAWAL}`}
                value={withdrawAmount}
                inputMode="numeric"
                onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={submitting}
              />
            </div>

            {/* Payout method tabs */}
            <div>
              <Label className="text-sm font-semibold">Payout method</Label>
              <Tabs
                value={payoutMethod}
                onValueChange={(v) => setPayoutMethod(v as 'upi' | 'bank')}
                className="mt-2"
              >
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="upi" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" /> UPI
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Bank Account
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upi" className="pt-3">
                  <Label htmlFor="upiId" className="text-sm font-semibold">
                    UPI ID
                  </Label>
                  <Input
                    id="upiId"
                    className="mt-1"
                    placeholder="name@bank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    disabled={submitting}
                    autoComplete="off"
                  />
                </TabsContent>

                <TabsContent value="bank" className="pt-3 space-y-3">
                  <div>
                    <Label htmlFor="bankAcc" className="text-sm font-semibold">
                      Account number
                    </Label>
                    <Input
                      id="bankAcc"
                      className="mt-1"
                      placeholder="e.g. 1234567890"
                      value={bankAccount}
                      inputMode="numeric"
                      onChange={(e) => setBankAccount(e.target.value.replace(/[^0-9]/g, ''))}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankIfsc" className="text-sm font-semibold">
                      IFSC code
                    </Label>
                    <Input
                      id="bankIfsc"
                      className="mt-1 uppercase"
                      placeholder="e.g. SBIN0001234"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankHolder" className="text-sm font-semibold">
                      Account holder name
                    </Label>
                    <Input
                      id="bankHolder"
                      className="mt-1"
                      placeholder="As per bank records"
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName" className="text-sm font-semibold">
                      Bank name <span className="text-xs text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="bankName"
                      className="mt-1"
                      placeholder="e.g. State Bank of India"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Info strip */}
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Withdrawals are reviewed by admin and usually processed within 24–48 hours.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!submitting) {
                  setShowWithdraw(false)
                  resetWithdrawForm()
                }
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#1B3B6F] hover:bg-[#234981] text-white"
              onClick={submitWithdraw}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserLayout>
  )
}
