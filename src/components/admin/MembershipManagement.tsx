'use client'

// Admin — BM Care membership subscriptions: live list, stats, cancel /
// reactivate / extend. Pricing itself is managed in Plan Pricing.
import { useCallback, useEffect, useState } from 'react'
import { adminMembershipsAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, Crown, Search, Users, XCircle, RefreshCw, CalendarPlus, IndianRupee, CheckCircle, Clock } from 'lucide-react'

const NAVY = '#1B3B6F'
const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-amber-100 text-amber-700',
  expired: 'bg-slate-200 text-slate-600',
}
// Left-edge table stripe per membership status — mirrors the badge color family.
const STATUS_STRIPE: Record<string, string> = {
  active: '#10b981',
  cancelled: '#f59e0b',
  expired: '#94a3b8',
}
const fmt = (iso?: string) => { try { return new Date(iso || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '—' } }
const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN')

interface Membership {
  _id: string
  user?: { fullName?: string; phone?: string; email?: string }
  planKey: string
  planName: string
  planEmoji?: string
  cycle: 'mo' | 'yr'
  pricePaid: number
  status: string
  autoRenew?: boolean
  startedAt?: string
  renewsAt?: string
  meta?: { freeTotal?: number; servicesUsed?: number; partsDisc?: number }
}

export function MembershipManagement() {
  const [rows, setRows] = useState<Membership[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await adminMembershipsAPI.getAll({ status, search: q || undefined, limit: 100 })
      if (r.data?.success) { setRows(r.data.data || []); setStats(r.data.stats || null) }
    } catch { toast.error('Could not load memberships') } finally { setLoading(false) }
  }, [status, q])

  useEffect(() => { load() }, [load])

  const act = async (id: string, data: { status?: string; extendDays?: number }, ok: string) => {
    setBusyId(id)
    try {
      const r = await adminMembershipsAPI.update(id, data)
      if (r.data?.success) { toast.success(ok); load() } else toast.error(r.data?.message || 'Failed')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') } finally { setBusyId(null) }
  }

  // Non-revenue stat cards double as quick status filters (reuses existing status/setStatus).
  const quickStats = stats ? [
    { key: 'all', label: 'Total members', value: stats.total, icon: Users, tint: 'text-slate-600 bg-slate-100' },
    { key: 'active', label: 'Active', value: stats.active, icon: CheckCircle, tint: 'text-emerald-600 bg-emerald-50' },
    { key: 'cancelled', label: 'Cancelled', value: stats.cancelled, icon: XCircle, tint: 'text-amber-600 bg-amber-50' },
    { key: 'expired', label: 'Expired', value: stats.expired, icon: Clock, tint: 'text-slate-500 bg-slate-100' },
  ] : []

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          {/* Revenue hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] p-5 shadow-md">
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
            <div className="absolute -right-2 top-14 h-20 w-20 rounded-full bg-white/[0.05]" />
            <div className="relative flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">Membership revenue</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                <IndianRupee className="h-[18px] w-[18px] text-white" />
              </div>
            </div>
            <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-white tabular-nums">{inr(stats.revenue)}</p>
            <div className="relative mt-3 flex items-center gap-3 text-[12px] text-white/70">
              <span><b className="text-white">{stats.active}</b> active</span>
              <span className="text-white/30">·</span>
              <span><b className="text-white">{stats.total}</b> total</span>
            </div>
          </div>

          {/* Quick-filter stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-3">
            {quickStats.map((s) => {
              const Icon = s.icon
              const active = status === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-[#1B3B6F] ring-2 ring-[#1B3B6F]/15' : 'border-gray-100'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`grid h-9 w-9 place-items-center rounded-xl ${s.tint}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {active && <span className="text-[9px] font-bold uppercase tracking-wide text-[#1B3B6F]">Filtered</span>}
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{s.value}</p>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / phone / plan…" className="h-9 w-56 text-sm outline-none" />
        </div>
        {['all', 'active', 'cancelled', 'expired'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold capitalize transition-colors ${status === s ? 'bg-[#1B3B6F] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{s}</button>
        ))}
        <button onClick={load} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-600 shadow-sm hover:bg-slate-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-14"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-slate-400">
            <Crown className="h-9 w-9" />
            <p className="mt-2 text-sm font-semibold">No memberships found</p>
          </div>
        ) : (
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-[#F6F8FB] text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Renews</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr
                  key={m._id}
                  className="border-b border-slate-50 border-l-[3px] transition-colors hover:bg-[#1B3B6F]/[0.03]"
                  style={{ borderLeftColor: STATUS_STRIPE[m.status] || 'transparent' }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-[#EAF0FA] text-[#1B3B6F]"><Users className="h-4 w-4" /></div>
                      <div>
                        <div className="font-bold text-slate-800">{m.user?.fullName || 'User'}</div>
                        <div className="text-[11.5px] text-slate-400">{m.user?.phone || m.user?.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{m.planEmoji} {m.planName} <span className="text-[11px] text-slate-400">({m.cycle === 'yr' ? 'yearly' : 'monthly'})</span></td>
                  <td className="px-4 py-3 font-bold text-slate-800 tabular-nums">{inr(m.pricePaid)}</td>
                  <td className="px-4 py-3 text-[12.5px] text-slate-500">
                    {m.meta ? <>Free: {m.meta.servicesUsed ?? 0}/{m.meta.freeTotal === -1 ? '∞' : m.meta.freeTotal ?? 0} · Parts {m.meta.partsDisc ?? 0}%</> : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{fmt(m.renewsAt)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold capitalize ${STATUS_STYLES[m.status] || 'bg-slate-100'}`}>{m.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {m.status === 'active' ? (
                        <button disabled={busyId === m._id} onClick={() => act(m._id, { status: 'cancelled' }, 'Membership cancelled')}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-[11.5px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                          <XCircle className="h-3.5 w-3.5" /> Cancel
                        </button>
                      ) : (
                        <button disabled={busyId === m._id} onClick={() => act(m._id, { status: 'active' }, 'Membership reactivated')}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-[11.5px] font-bold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                          <RefreshCw className="h-3.5 w-3.5" /> Reactivate
                        </button>
                      )}
                      <button disabled={busyId === m._id} onClick={() => act(m._id, { extendDays: 30 }, 'Extended by 30 days')}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                        <CalendarPlus className="h-3.5 w-3.5" /> +30d
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
