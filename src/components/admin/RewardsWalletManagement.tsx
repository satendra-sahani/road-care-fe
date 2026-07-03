'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Search, Wallet as WalletIcon, TrendingUp, TrendingDown, Loader2, AlertCircle, Plus, Minus, Users, Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { rewardsWalletAPI } from '@/services/api'

interface Transaction {
  _id: string
  user?: { _id: string; fullName: string; phone: string }
  type: 'credit' | 'debit'
  amount: number
  source: string
  balanceAfter: number
  description?: string
  adjustedBy?: { fullName: string }
  createdAt: string
}

interface Stats {
  totals: { totalBalance: number; totalEarned: number; totalSpent: number; walletCount: number }
  bySource: { _id: { source: string; type: string }; amount: number; count: number }[]
}

const sourceColor = (src: string) => {
  if (src.startsWith('spin')) return 'bg-purple-100 text-purple-700'
  if (src.startsWith('referral')) return 'bg-emerald-100 text-emerald-700'
  if (src === 'admin_adjustment') return 'bg-amber-100 text-amber-700'
  if (src === 'service_payment') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-700'
}

// Left-edge stripe color per transaction type — makes the table scannable at a glance.
const TYPE_STRIPE: Record<string, string> = {
  credit: '#22c55e',
  debit: '#ef4444',
}

// Presentational formatting helper — matches the admin-wide en-IN currency style.
const formatCurrency = (amount: number) => `₹${(amount ?? 0).toLocaleString('en-IN')}`

export function RewardsWalletManagement() {
  const [items, setItems] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [source, setSource] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })

  // Adjust dialog
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustUserId, setAdjustUserId] = useState('')
  const [adjustAmount, setAdjustAmount] = useState(0)
  const [adjustDesc, setAdjustDesc] = useState('')
  const [adjusting, setAdjusting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params: any = { page, limit: 20 }
      if (source !== 'all') params.source = source
      if (search.trim()) params.search = search.trim()
      const [txnRes, statsRes] = await Promise.all([
        rewardsWalletAPI.transactions(params),
        rewardsWalletAPI.statsOverview(),
      ])
      setItems(txnRes.data?.data || [])
      setPagination(txnRes.data?.pagination || { total: 0, pages: 1 })
      setStats(statsRes.data?.data || null)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [page, source, search])

  useEffect(() => { load() }, [load])

  const submitAdjust = async () => {
    if (!adjustUserId.trim()) { alert('User ID required'); return }
    if (!adjustAmount || adjustAmount === 0) { alert('Amount must be non-zero'); return }
    setAdjusting(true)
    try {
      await rewardsWalletAPI.adjust(adjustUserId.trim(), adjustAmount, adjustDesc || 'Admin adjustment')
      setAdjustOpen(false)
      setAdjustUserId(''); setAdjustAmount(0); setAdjustDesc('')
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Adjustment failed')
    } finally {
      setAdjusting(false)
    }
  }

  // Export the currently-loaded transactions to CSV (respects the active filters).
  const exportCsv = () => {
    const rows: string[][] = [['When', 'User', 'Phone', 'Type', 'Source', 'Amount', 'Balance after', 'Description']]
    items.forEach((t) => {
      rows.push([
        t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : '',
        t.user?.fullName || '',
        t.user?.phone || '',
        t.type,
        t.source,
        String(t.amount ?? 0),
        String(t.balanceAfter ?? 0),
        t.description || '',
      ])
    })
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `rewards-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Rewards Wallet</h1>
        <p className="text-[#6B7280] mt-1 text-sm">User wallet balances — credits from spin, referrals, manual adjustments</p>
      </div>

      {/* Stats: navy hero for the headline liability + metric cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] p-5 shadow-md">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
          <div className="absolute -right-2 top-14 h-20 w-20 rounded-full bg-white/[0.05]" />
          <div className="relative flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">Liability (total balance)</p>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
              <WalletIcon className="h-[18px] w-[18px] text-white" />
            </div>
          </div>
          <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-white tabular-nums">
            {formatCurrency(stats?.totals.totalBalance ?? 0)}
          </p>
          <div className="relative mt-3 flex items-center gap-3 text-[12px] text-white/70">
            <span>Across <b className="text-white">{stats?.totals.walletCount ?? 0}</b> wallets</span>
          </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Lifetime earned</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50">
                <TrendingUp className="h-[18px] w-[18px] text-emerald-600" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{formatCurrency(stats?.totals.totalEarned ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Credited to users all-time</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Lifetime spent</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50">
                <TrendingDown className="h-[18px] w-[18px] text-red-600" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{formatCurrency(stats?.totals.totalSpent ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Debited by users all-time</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">Wallets</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50">
                <Users className="h-[18px] w-[18px] text-indigo-600" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{stats?.totals.walletCount ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">Users with a wallet</p>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-white">
          <CardTitle className="text-base font-semibold text-[#1A1D29]">Transactions</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs h-9" onClick={exportCsv} disabled={items.length === 0}>
              <Download className="h-3.5 w-3.5 mr-1.5" />Export
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-9" onClick={() => setAdjustOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Manual adjust
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-9" onClick={load} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
              <Input className="pl-9 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white" placeholder="Search user phone or name"
                value={search} onChange={e => { setPage(1); setSearch(e.target.value) }}/>
            </div>
            <Select value={source} onValueChange={(v) => { setPage(1); setSource(v) }}>
              <SelectTrigger className="w-56 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="spin_reward">Spin reward</SelectItem>
                <SelectItem value="referral_bonus_referrer">Referral (referrer)</SelectItem>
                <SelectItem value="referral_bonus_referee">Referral (referee)</SelectItem>
                <SelectItem value="admin_adjustment">Admin adjustment</SelectItem>
                <SelectItem value="service_payment">Service payment</SelectItem>
                <SelectItem value="cashback">Cashback</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-sm"><AlertCircle className="h-4 w-4 shrink-0"/>{error}</div>}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin h-7 w-7 text-[#1B3B6F]"/>
              <p className="text-sm text-gray-400">Loading transactions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500 bg-[#F6F8FB] border-y border-gray-200">
                  <tr>
                    <th className="py-2.5 pl-6 text-xs font-semibold uppercase tracking-wider text-gray-500">When</th>
                    <th className="text-xs font-semibold uppercase tracking-wider text-gray-500">User</th>
                    <th className="text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                    <th className="text-xs font-semibold uppercase tracking-wider text-gray-500">Source</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Balance after</th>
                    <th className="text-xs font-semibold uppercase tracking-wider text-gray-500 pr-6">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(t => (
                    <tr
                      key={t._id}
                      className="border-b border-gray-100 hover:bg-[#1B3B6F]/[0.03] transition-colors border-l-[3px]"
                      style={{ borderLeftColor: TYPE_STRIPE[t.type] || 'transparent' }}
                    >
                      <td className="py-2.5 pl-6 text-xs text-gray-500 whitespace-nowrap">{new Date(t.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="font-medium text-[#1A1D29]">{t.user?.fullName || '—'}</div>
                        <div className="text-xs text-gray-500">{t.user?.phone}</div>
                      </td>
                      <td>
                        <Badge className={`rounded-full font-medium ${t.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {t.type === 'credit' ? '+' : '-'} {t.type}
                        </Badge>
                      </td>
                      <td><Badge className={`rounded-full font-medium ${sourceColor(t.source)}`}>{t.source}</Badge></td>
                      <td className={`text-right font-semibold tabular-nums ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td className="text-right text-gray-700 tabular-nums">{formatCurrency(t.balanceAfter)}</td>
                      <td className="text-gray-600 max-w-xs truncate pr-6">{t.description || '—'}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-16">
                        <div className="flex flex-col items-center">
                          <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <WalletIcon className="h-7 w-7 text-gray-400" />
                          </div>
                          <p className="text-base font-medium text-[#1A1D29]">No transactions found</p>
                          <p className="text-sm text-[#6B7280] mt-1">Try adjusting your search or filter criteria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-500">{pagination.total} txns · Page {page} of {pagination.pages || 1}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" disabled={page >= (pagination.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual adjust dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                {adjustAmount >= 0 ? <Plus className="h-4 w-4 text-amber-600"/> : <Minus className="h-4 w-4 text-amber-600"/>}
              </div>
              Manual wallet adjustment
            </DialogTitle>
            <DialogDescription>Positive amount credits the user, negative debits. All changes are audited.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>User ID</Label>
              <Input value={adjustUserId} onChange={e => setAdjustUserId(e.target.value)} placeholder="MongoDB ObjectId" className="h-10 mt-1"/>
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(Number(e.target.value))} placeholder="e.g. 100 or -50" className="h-10 mt-1"/>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={adjustDesc} onChange={e => setAdjustDesc(e.target.value)} placeholder="Reason for adjustment" className="h-10 mt-1"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button onClick={submitAdjust} disabled={adjusting} className="bg-[#1B3B6F] hover:bg-[#0F2545]">
              {adjusting ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : (adjustAmount >= 0 ? <Plus className="h-4 w-4 mr-2"/> : <Minus className="h-4 w-4 mr-2"/>)}
              Apply adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
