'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Search, Wallet as WalletIcon, TrendingUp, TrendingDown, Loader2, AlertCircle, Plus, Minus,
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rewards Wallet</h1>
        <p className="text-sm text-gray-500 mt-1">User wallet balances — credits from spin, referrals, manual adjustments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-sm text-gray-500">Liability (total balance)</div>
          <div className="text-2xl font-bold flex items-center gap-2 mt-1"><WalletIcon className="h-5 w-5 text-blue-500"/>₹{stats?.totals.totalBalance ?? 0}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-sm text-gray-500">Lifetime earned</div>
          <div className="text-2xl font-bold flex items-center gap-2 mt-1"><TrendingUp className="h-5 w-5 text-emerald-500"/>₹{stats?.totals.totalEarned ?? 0}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-sm text-gray-500">Lifetime spent</div>
          <div className="text-2xl font-bold flex items-center gap-2 mt-1"><TrendingDown className="h-5 w-5 text-red-500"/>₹{stats?.totals.totalSpent ?? 0}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-sm text-gray-500">Wallets</div>
          <div className="text-2xl font-bold flex items-center gap-2 mt-1">{stats?.totals.walletCount ?? 0}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdjustOpen(true)}><Plus className="h-4 w-4 mr-1"/>Manual adjust</Button>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1"/>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
              <Input className="pl-9" placeholder="Search user phone or name"
                value={search} onChange={e => { setPage(1); setSearch(e.target.value) }}/>
            </div>
            <Select value={source} onValueChange={(v) => { setPage(1); setSource(v) }}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
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

          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded flex items-center gap-2"><AlertCircle className="h-4 w-4"/>{error}</div>}

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6"/></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500 border-b">
                  <tr>
                    <th className="py-2">When</th><th>User</th><th>Type</th><th>Source</th>
                    <th className="text-right">Amount</th><th className="text-right">Balance after</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(t => (
                    <tr key={t._id} className="border-b hover:bg-gray-50">
                      <td className="py-2 text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="font-medium">{t.user?.fullName || '—'}</div>
                        <div className="text-xs text-gray-500">{t.user?.phone}</div>
                      </td>
                      <td>
                        <Badge className={t.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                          {t.type === 'credit' ? '+' : '-'} {t.type}
                        </Badge>
                      </td>
                      <td><Badge className={sourceColor(t.source)}>{t.source}</Badge></td>
                      <td className={`text-right font-semibold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                      </td>
                      <td className="text-right text-gray-700">₹{t.balanceAfter}</td>
                      <td className="text-gray-600 max-w-xs truncate">{t.description || '—'}</td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={7} className="text-center text-gray-500 py-8">No transactions found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-500">{pagination.total} txns · Page {page} of {pagination.pages || 1}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" disabled={page >= (pagination.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual adjust dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual wallet adjustment</DialogTitle>
            <DialogDescription>Positive amount credits the user, negative debits. All changes are audited.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>User ID</Label>
              <Input value={adjustUserId} onChange={e => setAdjustUserId(e.target.value)} placeholder="MongoDB ObjectId"/>
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(Number(e.target.value))} placeholder="e.g. 100 or -50"/>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={adjustDesc} onChange={e => setAdjustDesc(e.target.value)} placeholder="Reason for adjustment"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button onClick={submitAdjust} disabled={adjusting}>
              {adjusting ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : (adjustAmount >= 0 ? <Plus className="h-4 w-4 mr-2"/> : <Minus className="h-4 w-4 mr-2"/>)}
              Apply adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
