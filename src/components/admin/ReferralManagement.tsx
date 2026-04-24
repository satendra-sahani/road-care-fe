'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Search, Users, Gift, Trophy, Loader2, AlertCircle, XCircle, CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AdminHeader } from './AdminHeader'
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

  return (
    <div className="p-6 space-y-6">
      <AdminHeader title="Referrals" subtitle="Refer & earn program — monitor activity and top referrers" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-sm text-gray-500">Total (30d)</div>
          <div className="text-2xl font-bold flex items-center gap-2 mt-1"><Users className="h-5 w-5 text-blue-500"/>{analytics?.recentCount ?? 0}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-sm text-gray-500">Rewarded</div>
          <div className="text-2xl font-bold flex items-center gap-2 mt-1"><Gift className="h-5 w-5 text-emerald-500"/>{byStatusMap.rewarded || 0}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold flex items-center gap-2 mt-1"><Loader2 className="h-5 w-5 text-amber-500"/>{byStatusMap.pending || 0}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-sm text-gray-500">Rejected</div>
          <div className="text-2xl font-bold flex items-center gap-2 mt-1"><XCircle className="h-5 w-5 text-red-500"/>{byStatusMap.rejected || 0}</div>
        </CardContent></Card>
      </div>

      {/* Top referrers */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500"/> Top referrers (30d)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 border-b">
                <tr><th className="py-2">Name</th><th>Phone</th><th>Code</th><th className="text-right">Referrals</th><th className="text-right">Earned</th></tr>
              </thead>
              <tbody>
                {(analytics?.topReferrers || []).map(r => (
                  <tr key={r._id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{r.fullName || '—'}</td>
                    <td>{r.phone}</td>
                    <td><Badge variant="outline">{r.referralCode}</Badge></td>
                    <td className="text-right">{r.rewardedCount}</td>
                    <td className="text-right font-semibold">₹{r.totalEarned}</td>
                  </tr>
                ))}
                {(analytics?.topReferrers || []).length === 0 && (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-6">No rewarded referrals yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Filters + list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All referrals</CardTitle>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1"/>Refresh</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
              <Input className="pl-9" placeholder="Search phone, name or code"
                value={search} onChange={e => { setPage(1); setSearch(e.target.value) }}/>
            </div>
            <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v) }}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rewarded">Rewarded</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
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
                    <th className="py-2">Referrer</th><th>Code</th><th>Referee</th><th>Status</th>
                    <th className="text-right">Referrer reward</th><th className="text-right">Referee reward</th>
                    <th>Created</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(r => (
                    <tr key={r._id} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        <div className="font-medium">{r.referrer?.fullName || '—'}</div>
                        <div className="text-xs text-gray-500">{r.referrer?.phone}</div>
                      </td>
                      <td><Badge variant="outline">{r.code}</Badge></td>
                      <td>
                        <div className="font-medium">{r.referee?.fullName || '—'}</div>
                        <div className="text-xs text-gray-500">{r.referee?.phone}</div>
                      </td>
                      <td><Badge className={statusBadge(r.status)}>{r.status}</Badge></td>
                      <td className="text-right">₹{r.referrerReward}</td>
                      <td className="text-right">₹{r.refereeReward}</td>
                      <td className="text-xs text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>
                        {r.status === 'pending' && (
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => reject(r._id)}>
                            <XCircle className="h-4 w-4 mr-1"/>Reject
                          </Button>
                        )}
                        {r.status === 'rewarded' && <CheckCircle className="h-4 w-4 text-emerald-500 inline"/>}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={8} className="text-center text-gray-500 py-8">No referrals found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-500">{pagination.total} referrals · Page {page} of {pagination.pages || 1}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" disabled={page >= (pagination.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
