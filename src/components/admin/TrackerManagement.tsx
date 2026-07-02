'use client'

// Admin — GPS tracker devices & subscriptions: live device list, health
// (last-seen / telemetry), activate / deactivate / extend. Hardware & data-plan
// pricing is managed in Plan Pricing.
import { useCallback, useEffect, useState } from 'react'
import { adminTrackerAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, Satellite, Search, RefreshCw, CalendarPlus, Power, MapPin } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-amber-100 text-amber-700',
  deactivated: 'bg-slate-200 text-slate-600',
}
const fmt = (iso?: string) => { try { return new Date(iso || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '—' } }
const rel = (iso?: string) => {
  if (!iso) return 'never'
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

interface Device {
  _id: string
  deviceId: string
  user?: { fullName?: string; phone?: string }
  hardwareKey?: string
  vehicle?: { name?: string; regNo?: string }
  status: string
  cycle?: string
  renewsAt?: string
  lastSeenAt?: string
  telemetry?: { lat?: number; lng?: number; battery?: number; status?: string; updatedAt?: string }
  odometer?: number
}

export function TrackerManagement() {
  const [rows, setRows] = useState<Device[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await adminTrackerAPI.getDevices({ status, search: q || undefined, limit: 100 })
      if (r.data?.success) { setRows(r.data.data || []); setStats(r.data.stats || null) }
    } catch { toast.error('Could not load tracker devices') } finally { setLoading(false) }
  }, [status, q])

  useEffect(() => { load() }, [load])

  const act = async (id: string, data: { status?: string; extendDays?: number }, ok: string) => {
    setBusyId(id)
    try {
      const r = await adminTrackerAPI.update(id, data)
      if (r.data?.success) { toast.success(ok); load() } else toast.error(r.data?.message || 'Failed')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') } finally { setBusyId(null) }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ['Total devices', stats.total, 'text-slate-800'],
            ['Active', stats.active, 'text-emerald-600'],
            ['Awaiting install', stats.inactive, 'text-amber-600'],
            ['Deactivated', stats.deactivated, 'text-slate-500'],
            ['Reporting (24h)', stats.reporting24h, 'text-[#1B3B6F]'],
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
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search device / owner / plate…" className="h-9 w-56 text-sm outline-none" />
        </div>
        {['all', 'active', 'inactive', 'deactivated'].map((s) => (
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
            <Satellite className="h-9 w-9" />
            <p className="mt-2 text-sm font-semibold">No tracker devices yet</p>
            <p className="text-[12px]">Devices appear here after a customer buys a GPS tracker.</p>
          </div>
        ) : (
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Telemetry</th>
                <th className="px-4 py-3">Renews</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d._id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{d.deviceId}</div>
                    <div className="text-[11px] text-slate-400">{d.hardwareKey || ''} · {d.cycle === 'mo' ? 'monthly' : 'yearly'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-700">{d.user?.fullName || '—'}</div>
                    <div className="text-[11px] text-slate-400">{d.user?.phone || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d.vehicle?.name || '—'}{d.vehicle?.regNo ? <span className="text-[11px] text-slate-400"> · {d.vehicle.regNo}</span> : null}</td>
                  <td className="px-4 py-3 text-[12.5px]">
                    {d.telemetry?.updatedAt ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <MapPin className="h-3.5 w-3.5" /> {rel(d.telemetry.updatedAt)}{d.telemetry.battery != null ? ` · 🔋${Math.round(d.telemetry.battery)}%` : ''}
                      </span>
                    ) : (
                      <span className="text-slate-400">No signal yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{fmt(d.renewsAt)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold capitalize ${STATUS_STYLES[d.status] || 'bg-slate-100'}`}>{d.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {d.status !== 'deactivated' ? (
                        <button disabled={busyId === d._id} onClick={() => act(d._id, { status: 'deactivated' }, 'Device deactivated')}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-[11.5px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                          <Power className="h-3.5 w-3.5" /> Deactivate
                        </button>
                      ) : (
                        <button disabled={busyId === d._id} onClick={() => act(d._id, { status: 'active' }, 'Device reactivated')}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-[11.5px] font-bold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                          <Power className="h-3.5 w-3.5" /> Activate
                        </button>
                      )}
                      <button disabled={busyId === d._id} onClick={() => act(d._id, { extendDays: 30 }, 'Subscription extended by 30 days')}
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
