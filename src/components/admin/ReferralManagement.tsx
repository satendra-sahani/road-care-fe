'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Search, Users, Gift, Trophy, Loader2, AlertCircle, XCircle, CheckCircle, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { referralAdminAPI } from '@/services/api'

interface Referral {
  _id: string
  referrer?: { _id: string; fullName: string; phone: string; referralCode: string }
  referee?: { _id: string; fullName: string; phone: string; createdAt: string }
  code: string
  status: 'pending' | 'rewarded' | 'rejected' | 'expired'
  referrerReward: number
  refereeReward: number
  rewardedAt?: string
  rejectedReason?: string
  createdAt: string
}

interface TopReferrer {
  _id: string
  fullName: string
  phone: string
  referralCode: string
  rewardedCount: number
  totalEarned: number
}

interface Analytics {
  byStatus: { _id: string; count: number }[]
  topReferrers: TopReferrer[]
  recentCount: number
  windowDays: number
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    rewarded: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-gray-200 text-gray-700',
  }
  return map[s] || 'bg-gray-100 text-gray-700'
}

// Left-edge stripe color per referral status — makes the table scannable at a glance.
const STATUS_STRIPE: Record<string, string> = {
  pending: '#f59e0b',
  rewarded: '#22c55e',
  rejected: '#ef4444',
  expired: '#94a3b8',
}

const RANK_CHIP = [
  'bg-amber-100 text-amber-700',   // 1st
  'bg-gray-200 text-gray-600',     // 2nd
  'bg-orange-100 text-orange-700', // 3rd
]

export function ReferralManagement() {
  const [items, setItems] = useState<Referral[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params: any = { page, limit: 20 }
      if (status !== 'all') params.status = status
      if (search.trim()) params.search = search.trim()
      const [listRes, analyticsRes] = await Promise.all([
        referralAdminAPI.list(params),
        referralAdminAPI.analytics(30),
      ])
      setItems(listRes.data?.data || [])
      setPagination(listRes.data?.pagination || { total: 0, pages: 1 })
      setAnalytics(analyticsRes.data?.data || null)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load referrals')
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => { load() }, [load])

  const reject = async (id: string) => {
    const reason = prompt('Rejection reason?')
    if (!reason) return
    try {
      await referralAdminAPI.reject(id, reason)
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to reject')
    }
  }

  const byStatusMap = Object.fromEntries((analytics?.byStatus || []).map(b => [b._id, b.count]))

  // Quick-filter stat cards — reuse the existing status filter state/setter, no new logic.
  const statusStats = [
    { key: 'all',      label: 'Total (30d)', value: analytics?.recentCount ?? 0, icon: Users,       tint: 'text-slate-600 bg-slate-100' },
    { key: 'rewarded', label: 'Rewarded',     value: byStatusMap.rewarded || 0,   icon: Gift,        tint: 'text-emerald-600 bg-emerald-50' },
    { key: 'pending',  label: 'Pending',      value: byStatusMap.pending || 0,    icon: Clock,       tint: 'text-amber-600 bg-amber-50' },
    { key: 'rejected', label: 'Rejected',     value: byStatusMap.rejected || 0,   icon: XCircle,     tint: 'text-red-600 bg-red-50' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Referrals</h1>
        <p className="text-sm text-[#6B7280] mt-1">Refer &amp; earn program — monitor activity and top referrers</p>
      </div>

      {/* Stats — clickable quick filters (mirrors the status Select below) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statusStats.map((s) => {
          const Icon = s.icon
          const active = status === s.key
          return (
            <button
              key={s.key}
              onClick={() => { setPage(1); setStatus(s.key) }}
              className={`text-left rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-[#1B3B6F] ring-2 ring-[#1B3B6F]/15' : 'border-gray-100'}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${s.tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{s.value}</p>
              {active && <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#1B3B6F]">Filtered</p>}
            </button>
          )
        })}
      </div>

      {/* Top referrers */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50">
              <Trophy className="h-4 w-4 text-amber-500" />
            </div>
            Top referrers (30d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-400 bg-[#F6F8FB] border-b border-gray-100">
                <tr className="text-[11px] font-semibold uppercase tracking-wide">
                  <th className="py-2.5 pl-3 rounded-l-lg">#</th>
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Phone</th>
                  <th className="py-2.5">Code</th>
                  <th className="py-2.5 text-right">Referrals</th>
                  <th className="py-2.5 pr-3 text-right rounded-r-lg">Earned</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.topReferrers || []).map((r, idx) => (
                  <tr key={r._id} className="border-b border-gray-100 hover:bg-[#1B3B6F]/[0.03] transition-colors">
                    <td className="py-2.5 pl-3">
                      <span className={`inline-grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${idx < 3 ? RANK_CHIP[idx] : 'bg-gray-50 text-gray-400'}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-[#1A1D29]">{r.fullName || '—'}</td>
                    <td className="text-[#6B7280]">{r.phone}</td>
                    <td><Badge variant="outline">{r.referralCode}</Badge></td>
                    <td className="text-right tabular-nums">{r.rewardedCount}</td>
                    <td className="pr-3 text-right font-semibold text-[#1A1D29] tabular-nums">₹{r.totalEarned}</td>
                  </tr>
                ))}
                {(analytics?.topReferrers || []).length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-8">No rewarded referrals yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Filters + list */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1B3B6F]/10">
              <Users className="h-4 w-4 text-[#1B3B6F]" />
            </div>
            All referrals
          </CardTitle>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
              <Input className="pl-9 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white" placeholder="Search phone, name or code"
                value={search} onChange={e => { setPage(1); setSearch(e.target.value) }}/>
            </div>
            <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v) }}>
              <SelectTrigger className="w-48 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rewarded">Rewarded</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0"/>{error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="animate-spin h-6 w-6 text-[#1B3B6F]"/>
              <p className="text-xs text-gray-400">Loading referrals...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-400 bg-[#F6F8FB] border-b border-gray-100">
                  <tr className="text-[11px] font-semibold uppercase tracking-wide">
                    <th className="py-2.5 pl-3">Referrer</th><th>Code</th><th>Referee</th><th>Status</th>
                    <th className="text-right">Referrer reward</th><th className="text-right">Referee reward</th>
                    <th>Created</th><th className="pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(r => (
                    <tr
                      key={r._id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-[#1B3B6F]/[0.03] transition-colors border-l-[3px]"
                      style={{ borderLeftColor: STATUS_STRIPE[r.status] || 'transparent' }}
                    >
                      <td className="py-2.5 pl-3">
                        <div className="font-medium text-[#1A1D29]">{r.referrer?.fullName || '—'}</div>
                        <div className="text-xs text-gray-400">{r.referrer?.phone}</div>
                      </td>
                      <td><Badge variant="outline">{r.code}</Badge></td>
                      <td>
                        <div className="font-medium text-[#1A1D29]">{r.referee?.fullName || '—'}</div>
                        <div className="text-xs text-gray-400">{r.referee?.phone}</div>
                      </td>
                      <td><Badge className={statusBadge(r.status)}>{r.status}</Badge></td>
                      <td className="text-right tabular-nums">₹{r.referrerReward}</td>
                      <td className="text-right tabular-nums">₹{r.refereeReward}</td>
                      <td className="text-xs text-[#6B7280]">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="pr-3">
                        {r.status === 'pending' && (
                          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 h-7 px-2" onClick={() => reject(r._id)}>
                            <XCircle className="h-4 w-4 mr-1"/>Reject
                          </Button>
                        )}
                        {r.status === 'rewarded' && <CheckCircle className="h-4 w-4 text-emerald-500 inline"/>}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-10">No referrals found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-[#6B7280]">{pagination.total} referrals · Page {page} of {pagination.pages || 1}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" disabled={page >= (pagination.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
