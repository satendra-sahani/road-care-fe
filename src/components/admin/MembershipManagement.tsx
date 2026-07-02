'use client'

// Admin — BM Care membership subscriptions: live list, stats, cancel /
// reactivate / extend. Pricing itself is managed in Plan Pricing.
import { useCallback, useEffect, useState } from 'react'
import { adminMembershipsAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, Crown, Search, Users, XCircle, RefreshCw, CalendarPlus } from 'lucide-react'

const NAVY = '#1B3B6F'
const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-amber-100 text-amber-700',
  expired: 'bg-slate-200 text-slate-600',
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

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ['Total', stats.total, 'text-slate-800'],
            ['Active', stats.active, 'text-emerald-600'],
            ['Cancelled', stats.cancelled, 'text-amber-600'],
            ['Expired', stats.expired, 'text-slate-500'],
            ['Revenue', inr(stats.revenue), 'text-[#1B3B6F]'],
          ].map(([label, value, cls]) => (
            <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
              <div className={`mt-1 text-xl font-extrabold ${cls}`}>{value as any}</div>
            </div>
          ))}
        </div>
      )}

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / phone / plan…" className="h-9 w-56 text-sm outline-none" />
        </div>
        {['all', 'active', 'cancelled', 'expired'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold capitalize ${status === s ? 'bg-[#1B3B6F] text-white' : 'bg-slate-100 text-slate-500'}`}>{s}</button>
        ))}
        <button onClick={load} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-600"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
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
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
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
                <tr key={m._id} className="border-b border-slate-50 hover:bg-slate-50/60">
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
                  <td className="px-4 py-3 font-bold text-slate-800">{inr(m.pricePaid)}</td>
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
