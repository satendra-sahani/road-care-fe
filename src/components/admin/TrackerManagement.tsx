'use client'

// Admin — GPS tracker devices & subscriptions: live device list, health
// (last-seen / telemetry), activate / deactivate / extend. Hardware & data-plan
// pricing is managed in Plan Pricing.
import { useCallback, useEffect, useState } from 'react'
import { adminTrackerAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, Satellite, Search, RefreshCw, CalendarPlus, Power, PowerOff, Clock, Radio, MapPin, ShoppingCart, IndianRupee, CheckCircle2, ShieldCheck, FileText, Barcode } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-amber-100 text-amber-700',
  deactivated: 'bg-slate-200 text-slate-600',
}
// Left-edge stripe color per device status — makes the table scannable at a glance.
const STATUS_STRIPE: Record<string, string> = {
  active: '#22c55e',
  inactive: '#f59e0b',
  deactivated: '#94a3b8',
}
const fmt = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
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
  imei?: string
  user?: { fullName?: string; phone?: string }
  hardwareKey?: string
  sim?: { number?: string }
  vehicle?: { name?: string; regNo?: string }
  status: string
  cycle?: string
  renewsAt?: string
  lastSeenAt?: string
  telemetry?: { lat?: number; lng?: number; battery?: number; status?: string; updatedAt?: string }
  odometer?: number
  warranty?: { months?: number; startAt?: string }
  installedAt?: string
  activatedAt?: string
  createdAt?: string
}

// Warranty presets offered in the Assign form + Devices table (months).
const WARRANTY_OPTIONS = [3, 6, 9, 12, 15, 18, 24]

// Open the print window SYNCHRONOUSLY on click (before any await) so pop-up
// blockers don't kill it, then fill it with the receipt once the fetch returns.
function openPrintWindow(): Window | null {
  const w = window.open('', '_blank', 'width=380,height=640')
  if (w) { try { w.document.write('<!doctype html><meta charset="utf-8"><title>Invoice</title><p style="font:14px sans-serif;padding:16px;color:#555">Preparing invoice…</p>') } catch { /* ignore */ } }
  return w
}
// Write the thermal-receipt HTML into the window; it auto-fires the print
// dialog on load (sized for a 58mm mini printer).
function fillPrintWindow(w: Window, html: string) {
  w.document.open(); w.document.write(html); w.document.close()
}
// Pull a readable message from an axios error whose body may be a JSON string
// (responseType 'text') or an object.
function errMsg(e: any, fallback: string): string {
  const d = e?.response?.data
  if (typeof d === 'string') { try { return JSON.parse(d).message || fallback } catch { return fallback } }
  return d?.message || fallback
}

export function TrackerManagement() {
  const [rows, setRows] = useState<Device[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [assign, setAssign] = useState({ imei: '', simNumber: '', userPhone: '', vehicleName: '', regNo: '', warrantyMonths: '' })
  const [assigning, setAssigning] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await adminTrackerAPI.getDevices({ status, search: q || undefined, limit: 100 })
      if (r.data?.success) { setRows(r.data.data || []); setStats(r.data.stats || null) }
    } catch { toast.error('Could not load tracker devices') } finally { setLoading(false) }
  }, [status, q])

  useEffect(() => { load() }, [load])

  // ── GPS orders (customer device requests, from VehicleQr provisioning) ──
  const [view, setView] = useState<'devices' | 'orders'>('devices')
  const [orders, setOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [warrantyDraft, setWarrantyDraft] = useState<Record<string, string>>({})
  const [savingWty, setSavingWty] = useState<string | null>(null)
  const [invoiceBusy, setInvoiceBusy] = useState<string | null>(null)
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const r = await adminTrackerAPI.getVehicles({ limit: 300 })
      const all: any[] = r.data?.data || []
      // Only vehicles where the customer actually placed a GPS order/request.
      setOrders(all.filter((v) => (v.status && v.status !== 'none') || v.provisioning?.paid))
    } catch { toast.error('Could not load GPS orders') } finally { setOrdersLoading(false) }
  }, [])

  // Warranty "valid till" = start (warrantyStart → delivered → order date) + months.
  const warrantyTill = (o: any): string | undefined => {
    const m = o.provisioning?.warrantyMonths
    if (!m) return undefined
    const startIso = o.provisioning?.warrantyStart || o.provisioning?.deliveredAt || o.createdAt
    const start = startIso ? new Date(startIso) : new Date()
    const end = new Date(start)
    end.setMonth(end.getMonth() + m)
    return end.toISOString()
  }

  const saveWarranty = async (id: string) => {
    const months = parseInt(warrantyDraft[id], 10)
    if (!Number.isFinite(months) || months <= 0) { toast.error('Enter warranty in months'); return }
    setSavingWty(id)
    try {
      const r = await adminTrackerAPI.provisionVehicle(id, { warrantyMonths: months })
      if (r.data?.success) { toast.success('Warranty saved'); loadOrders() } else toast.error(r.data?.message || 'Failed')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') } finally { setSavingWty(null) }
  }

  const openInvoice = async (id: string) => {
    const w = openPrintWindow()
    if (!w) { toast.error('Please allow pop-ups to print the invoice'); return }
    setInvoiceBusy(id)
    try {
      const r = await adminTrackerAPI.getVehicleInvoice(id)
      fillPrintWindow(w, r.data as string)
    } catch (e: any) {
      w.close(); toast.error(errMsg(e, 'Could not open invoice'))
    } finally { setInvoiceBusy(null) }
  }

  const [labelBusy, setLabelBusy] = useState<string | null>(null)
  const openLabel = async (id: string) => {
    const w = openPrintWindow()
    if (!w) { toast.error('Please allow pop-ups to print the label'); return }
    setLabelBusy(id)
    try {
      const r = await adminTrackerAPI.getVehicleLabel(id)
      fillPrintWindow(w, r.data as string)
    } catch (e: any) {
      w.close(); toast.error(errMsg(e, 'Could not open label'))
    } finally { setLabelBusy(null) }
  }
  useEffect(() => { if (view === 'orders') loadOrders() }, [view, loadOrders])
  const tabCls = (on: boolean) => `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-bold transition-colors ${on ? 'bg-[#1B3B6F] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`

  const act = async (id: string, data: { status?: string; extendDays?: number }, ok: string) => {
    setBusyId(id)
    try {
      const r = await adminTrackerAPI.update(id, data)
      if (r.data?.success) { toast.success(ok); load() } else toast.error(r.data?.message || 'Failed')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') } finally { setBusyId(null) }
  }

  // Warranty "valid till" for a device = start (warranty.startAt → install → activate) + months.
  const devWarrantyTill = (d: Device): string | undefined => {
    const m = d.warranty?.months
    if (!m) return undefined
    const startIso = d.warranty?.startAt || d.installedAt || d.activatedAt || d.createdAt
    const start = startIso ? new Date(startIso) : new Date()
    const end = new Date(start)
    end.setMonth(end.getMonth() + m)
    return end.toISOString()
  }

  // Set / update / clear a device's warranty (months '' clears it).
  const setDeviceWarranty = async (id: string, months: string) => {
    setBusyId(id)
    try {
      const r = await adminTrackerAPI.update(id, { warrantyMonths: months ? Number(months) : 0 })
      if (r.data?.success) { toast.success(months ? `Warranty set to ${months} months` : 'Warranty cleared'); load() }
      else toast.error(r.data?.message || 'Failed')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') } finally { setBusyId(null) }
  }

  const [invoiceBusyDev, setInvoiceBusyDev] = useState<string | null>(null)
  const openDeviceInvoice = async (id: string) => {
    const w = openPrintWindow()
    if (!w) { toast.error('Please allow pop-ups to print the invoice'); return }
    setInvoiceBusyDev(id)
    try {
      const r = await adminTrackerAPI.getDeviceInvoice(id)
      fillPrintWindow(w, r.data as string)
    } catch (e: any) {
      w.close(); toast.error(errMsg(e, 'Could not open invoice'))
    } finally { setInvoiceBusyDev(null) }
  }

  const [labelBusyDev, setLabelBusyDev] = useState<string | null>(null)
  const openDeviceLabel = async (id: string) => {
    const w = openPrintWindow()
    if (!w) { toast.error('Please allow pop-ups to print the label'); return }
    setLabelBusyDev(id)
    try {
      const r = await adminTrackerAPI.getDeviceLabel(id)
      fillPrintWindow(w, r.data as string)
    } catch (e: any) {
      w.close(); toast.error(errMsg(e, 'Could not open label'))
    } finally { setLabelBusyDev(null) }
  }

  const doAssign = async () => {
    if (!assign.imei.trim() || !assign.userPhone.trim()) { toast.error('GPS IMEI and app user phone are required'); return }
    setAssigning(true)
    try {
      const r = await adminTrackerAPI.assign({
        imei: assign.imei, simNumber: assign.simNumber, userPhone: assign.userPhone,
        vehicleName: assign.vehicleName, regNo: assign.regNo,
        warrantyMonths: assign.warrantyMonths ? Number(assign.warrantyMonths) : undefined,
      })
      if (r.data?.success) {
        toast.success(r.data.message || 'GPS assigned to user')
        setAssign({ imei: '', simNumber: '', userPhone: '', vehicleName: '', regNo: '', warrantyMonths: '' })
        load()
      } else toast.error(r.data?.message || 'Failed to assign')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to assign') } finally { setAssigning(false) }
  }

  // Quick-filter stat cards — reuse the existing `status` filter state/setter,
  // no new logic. "Reporting (24h)" has no matching filter, so it stays a plain tile.
  const statCards = [
    { key: 'all', label: 'Total devices', value: stats?.total, icon: Satellite, tint: 'bg-slate-100 text-slate-600' },
    { key: 'active', label: 'Active', value: stats?.active, icon: Power, tint: 'bg-emerald-50 text-emerald-600' },
    { key: 'inactive', label: 'Awaiting install', value: stats?.inactive, icon: Clock, tint: 'bg-amber-50 text-amber-600' },
    { key: 'deactivated', label: 'Deactivated', value: stats?.deactivated, icon: PowerOff, tint: 'bg-slate-100 text-slate-500' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* view tabs */}
      <div className="flex items-center gap-2">
        <button onClick={() => setView('devices')} className={tabCls(view === 'devices')}><Satellite className="h-4 w-4" /> Devices</button>
        <button onClick={() => setView('orders')} className={tabCls(view === 'orders')}><ShoppingCart className="h-4 w-4" /> GPS Orders</button>
      </div>

      {view === 'devices' && (<>
      {/* stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {statCards.map((s) => {
            const Icon = s.icon
            const active = status === s.key
            return (
              <button
                key={s.key}
                onClick={() => setStatus(s.key)}
                className={`text-left rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-[#1B3B6F] ring-2 ring-[#1B3B6F]/15' : 'border-gray-100'}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl ${s.tint}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {active && <span className="text-[9px] font-bold uppercase tracking-wide text-[#1B3B6F]">Filtered</span>}
                </div>
                <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#1A1D29]">{s.value ?? '—'}</p>
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
              </button>
            )
          })}

          {/* Reporting (24h) — informational only, no matching filter */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#1B3B6F]/10 text-[#1B3B6F]">
                <Radio className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#1A1D29]">{stats.reporting24h ?? '—'}</p>
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-gray-400">Reporting (24h)</p>
          </div>
        </div>
      )}

      {/* Assign GPS device to an app user (by phone) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Satellite className="h-4 w-4 text-[#1B3B6F]" />
          <h3 className="text-sm font-bold text-slate-700">Assign GPS device to a user</h3>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
          <input value={assign.imei} onChange={(e) => setAssign(p => ({ ...p, imei: e.target.value }))} placeholder="GPS IMEI *" className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#1B3B6F]/50" />
          <input value={assign.simNumber} onChange={(e) => setAssign(p => ({ ...p, simNumber: e.target.value }))} placeholder="SIM number" className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#1B3B6F]/50" />
          <input value={assign.userPhone} onChange={(e) => setAssign(p => ({ ...p, userPhone: e.target.value }))} placeholder="App user phone *" className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#1B3B6F]/50" />
          <input value={assign.vehicleName} onChange={(e) => setAssign(p => ({ ...p, vehicleName: e.target.value }))} placeholder="Vehicle name" className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#1B3B6F]/50" />
          <input value={assign.regNo} onChange={(e) => setAssign(p => ({ ...p, regNo: e.target.value }))} placeholder="Bike number" className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#1B3B6F]/50" />
          <select value={assign.warrantyMonths} onChange={(e) => setAssign(p => ({ ...p, warrantyMonths: e.target.value }))} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-[#1B3B6F]/50">
            <option value="">Warranty…</option>
            {WARRANTY_OPTIONS.map((m) => <option key={m} value={m}>{m} months</option>)}
          </select>
          <button onClick={doAssign} disabled={assigning} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1B3B6F] px-3 text-sm font-bold text-white transition-colors hover:bg-[#16305c] disabled:opacity-50">
            {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Satellite className="h-4 w-4" />} Assign
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Enter the GPS IMEI + the customer&apos;s app login phone number. Pick a warranty (optional) — it prints on the invoice. The device links to that user so it appears in their app.</p>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 transition-colors focus-within:border-[#1B3B6F]/40 focus-within:ring-2 focus-within:ring-[#1B3B6F]/10">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search device / owner / plate…" className="h-9 w-56 text-sm outline-none" />
        </div>
        {['all', 'active', 'inactive', 'deactivated'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold capitalize transition-colors ${status === s ? 'bg-[#1B3B6F] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{s}</button>
        ))}
        <button onClick={load} className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-600 transition-colors hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-14"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-slate-400">
            <Satellite className="h-9 w-9" />
            <p className="mt-2 text-sm font-semibold">No tracker devices yet</p>
            <p className="text-[12px]">Devices appear here after a customer buys a GPS tracker.</p>
          </div>
        ) : (
          <table className="w-full min-w-[1300px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-[#F6F8FB] text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Telemetry</th>
                <th className="px-4 py-3">Renews</th>
                <th className="px-4 py-3">Warranty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr
                  key={d._id}
                  className="border-b border-slate-50 border-l-[3px] transition-colors hover:bg-[#1B3B6F]/[0.03]"
                  style={{ borderLeftColor: STATUS_STRIPE[d.status] || 'transparent' }}
                >
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{d.deviceId}</div>
                    {d.sim?.number ? <div className="text-[11px] font-semibold text-slate-500">SIM: {d.sim.number}</div> : null}
                    <div className="text-[11px] text-slate-400">{d.hardwareKey || (d.imei ? `IMEI ${d.imei}` : '')} · {d.cycle === 'mo' ? 'monthly' : 'yearly'}</div>
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
                  <td className="px-4 py-3">
                    <select
                      value={d.warranty?.months ? String(d.warranty.months) : ''}
                      onChange={(e) => setDeviceWarranty(d._id, e.target.value)}
                      disabled={busyId === d._id}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-600 outline-none focus:border-[#1B3B6F]/50 disabled:opacity-50">
                      <option value="">— set —</option>
                      {WARRANTY_OPTIONS.map((m) => <option key={m} value={m}>{m} mo</option>)}
                    </select>
                    {d.warranty?.months ? <div className="mt-1 text-[10.5px] text-slate-400">till {fmt(devWarrantyTill(d))}</div> : null}
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold capitalize ${STATUS_STYLES[d.status] || 'bg-slate-100'}`}>{d.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button disabled={invoiceBusyDev === d._id} onClick={() => openDeviceInvoice(d._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50">
                        {invoiceBusyDev === d._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} Invoice
                      </button>
                      <button disabled={labelBusyDev === d._id} onClick={() => openDeviceLabel(d._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50">
                        {labelBusyDev === d._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Barcode className="h-3.5 w-3.5" />} Label
                      </button>
                      {d.status !== 'deactivated' ? (
                        <button disabled={busyId === d._id} onClick={() => act(d._id, { status: 'deactivated' }, 'Device deactivated')}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-[11.5px] font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50">
                          <Power className="h-3.5 w-3.5" /> Deactivate
                        </button>
                      ) : (
                        <button disabled={busyId === d._id} onClick={() => act(d._id, { status: 'active' }, 'Device reactivated')}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-[11.5px] font-bold text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50">
                          <Power className="h-3.5 w-3.5" /> Activate
                        </button>
                      )}
                      <button disabled={busyId === d._id} onClick={() => act(d._id, { extendDays: 30 }, 'Subscription extended by 30 days')}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50">
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
      </>)}

      {/* ── GPS Orders (customer device requests + payment) ── */}
      {view === 'orders' && (
        <>
          <div className="flex items-center gap-2">
            <p className="text-[12px] text-slate-500">Every GPS device a customer orders shows here with its payment status.</p>
            <button onClick={loadOrders} className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-600 transition-colors hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            {ordersLoading ? (
              <div className="flex justify-center py-14"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-slate-400">
                <ShoppingCart className="h-9 w-9" />
                <p className="mt-2 text-sm font-semibold">No GPS orders yet</p>
                <p className="text-[12px]">When a customer orders a GPS device, it appears here.</p>
              </div>
            ) : (
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#F6F8FB] text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Ordered</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Warranty</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Print</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: any) => {
                    const paid = !!o.provisioning?.paid
                    const amount = o.provisioning?.amountPaid
                    return (
                      <tr key={o._id} className="border-b border-slate-50 border-l-[3px] transition-colors hover:bg-[#1B3B6F]/[0.03]"
                        style={{ borderLeftColor: paid ? '#22c55e' : '#f59e0b' }}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-700">{o.user?.fullName || o.user?.username || '—'}</div>
                          <div className="text-[11px] text-slate-400">{o.user?.phone || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{o.name || '—'}{o.regNo ? <span className="text-[11px] text-slate-400"> · {o.regNo}</span> : null}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(o.createdAt)}</td>
                        <td className="px-4 py-3">
                          {paid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Paid</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-700"><Clock className="h-3.5 w-3.5" /> Not paid</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {amount != null ? <span className="inline-flex items-center tabular-nums"><IndianRupee className="h-3.5 w-3.5" />{Number(amount).toLocaleString('en-IN')}</span> : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number" min={1}
                              value={warrantyDraft[o._id] ?? (o.provisioning?.warrantyMonths ? String(o.provisioning.warrantyMonths) : '')}
                              onChange={(e) => setWarrantyDraft((p) => ({ ...p, [o._id]: e.target.value }))}
                              placeholder="mo"
                              className="h-8 w-14 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-[#1B3B6F]/50"
                            />
                            <button disabled={savingWty === o._id} onClick={() => saveWarranty(o._id)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#1B3B6F]/30 px-2 text-[11.5px] font-bold text-[#1B3B6F] transition-colors hover:bg-[#1B3B6F]/5 disabled:opacity-50">
                              {savingWty === o._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />} Save
                            </button>
                          </div>
                          {o.provisioning?.warrantyMonths ? (
                            <div className="mt-1 text-[10.5px] text-slate-400">till {fmt(warrantyTill(o))}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold capitalize text-slate-600">{o.status}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {paid ? (
                              <button disabled={invoiceBusy === o._id} onClick={() => openInvoice(o._id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50">
                                {invoiceBusy === o._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} Invoice
                              </button>
                            ) : null}
                            <button disabled={labelBusy === o._id} onClick={() => openLabel(o._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50">
                              {labelBusy === o._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Barcode className="h-3.5 w-3.5" />} Label
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
