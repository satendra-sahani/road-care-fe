import { useEffect, useState, useCallback } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { adminTrackerAPI } from '@/services/api'
import { toast } from 'sonner'

// ────────────────────────────────────────────────────────────────────────────
// GPS Provisioning — admin sees every customer's registered vehicle and drives
// the provisioning: assign a device (software level) → lock SIM to our server →
// activate SIM → ship → mark active. The customer only wires it physically.
// ────────────────────────────────────────────────────────────────────────────

type Prov = { simLocked?: boolean; simActivated?: boolean; note?: string; configuredAt?: string; shippedAt?: string; deliveredAt?: string; paid?: boolean; paymentId?: string; amountPaid?: number }
type Vehicle = {
  _id: string
  name: string
  regNo?: string
  type?: string
  em?: string
  status: string
  provisioning?: Prov
  user?: { _id: string; fullName?: string; username?: string; phone?: string; gpsPlan?: any }
  device?: { deviceId?: string; imei?: string; status?: string } | null
}

const STATUS_TABS = ['all', 'pending', 'assigned', 'configured', 'shipped', 'active', 'inactive']
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  assigned: 'bg-blue-100 text-blue-700',
  configured: 'bg-violet-100 text-violet-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-200 text-slate-600',
}

export default function GpsProvisioningPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [sel, setSel] = useState<Vehicle | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await adminTrackerAPI.getVehicles({ status, search, limit: 300 })
      setVehicles(r.data?.data || [])
    } catch { toast.error('Could not load vehicles') }
    setLoading(false)
  }, [status, search])

  useEffect(() => { load() }, [load])

  const counts = STATUS_TABS.reduce((a, s) => {
    a[s] = s === 'all' ? vehicles.length : vehicles.filter((v) => v.status === s).length
    return a
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar currentPath="/admin/subscriptions/provisioning" />
      <main className="lg:pl-72 transition-all duration-300">
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <h1 className="text-xl font-extrabold text-slate-800">GPS Provisioning</h1>
          <p className="text-[13px] text-slate-500">Customer vehicles · assign device · lock &amp; activate SIM · ship · go live</p>
        </div>

        <div className="p-6 space-y-4">
          {/* filters */}
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold border capitalize ${status === s ? 'bg-[#1B3B6F] text-white border-[#1B3B6F]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {s} {counts[s] ? `(${counts[s]})` : ''}
              </button>
            ))}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vehicle / plate / customer / phone…"
              className="ml-auto w-72 max-w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1B3B6F]"
            />
          </div>

          {/* table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[12px] uppercase text-slate-400">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">SIM</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>
                ) : vehicles.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No vehicles</td></tr>
                ) : vehicles.map((v) => (
                  <tr key={v._id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700">{v.user?.fullName || v.user?.username || '—'}</div>
                      <div className="text-[12px] text-slate-400">{v.user?.phone || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700">{v.em} {v.name}</div>
                      <div className="text-[12px] text-slate-400">{v.regNo || v.type}</div>
                    </td>
                    <td className="px-4 py-3 text-[12px]">
                      {v.provisioning?.paid
                        ? <span className="inline-block rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 text-[11px] font-bold">Paid{v.provisioning.amountPaid ? ` ₹${v.provisioning.amountPaid}` : ''}</span>
                        : <span className="inline-block rounded-full bg-amber-100 text-amber-700 px-2.5 py-1 text-[11px] font-bold">Unpaid</span>}
                    </td>
                    <td className="px-4 py-3 text-[12px]">
                      {v.device?.deviceId ? <span className="font-mono text-slate-700">{v.device.deviceId}</span> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[12px]">
                      <span className={v.provisioning?.simLocked ? 'text-emerald-600' : 'text-slate-400'}>🔒{v.provisioning?.simLocked ? '' : '✗'}</span>{' '}
                      <span className={v.provisioning?.simActivated ? 'text-emerald-600' : 'text-slate-400'}>📶{v.provisioning?.simActivated ? '' : '✗'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_COLOR[v.status] || 'bg-slate-100 text-slate-600'}`}>{v.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSel(v)} className="rounded-lg bg-[#1B3B6F] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#0F2545]">Provision</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sel && <ProvisionDrawer vehicle={sel} onClose={() => setSel(null)} onSaved={() => { setSel(null); load() }} />}
      </main>
    </div>
  )
}

function ProvisionDrawer({ vehicle, onClose, onSaved }: { vehicle: Vehicle; onClose: () => void; onSaved: () => void }) {
  const [deviceId, setDeviceId] = useState(vehicle.device?.deviceId || '')
  const [simLocked, setSimLocked] = useState(!!vehicle.provisioning?.simLocked)
  const [simActivated, setSimActivated] = useState(!!vehicle.provisioning?.simActivated)
  const [note, setNote] = useState(vehicle.provisioning?.note || '')
  const [busy, setBusy] = useState(false)

  const save = async (nextStatus?: string) => {
    setBusy(true)
    try {
      await adminTrackerAPI.provisionVehicle(vehicle._id, {
        deviceId: deviceId.trim() || undefined,
        simLocked, simActivated, note,
        status: nextStatus,
      })
      toast.success(nextStatus ? `Marked ${nextStatus}` : 'Saved')
      onSaved()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-[#1B3B6F] px-5 py-4 text-white">
          <div>
            <div className="text-base font-extrabold">{vehicle.em} {vehicle.name}</div>
            <div className="text-[12px] text-white/70">{vehicle.user?.fullName} · {vehicle.user?.phone}</div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>

        <div className="space-y-5 p-5">
          {/* payment status */}
          <div className={`rounded-xl border p-4 ${vehicle.provisioning?.paid ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold text-slate-700">Payment</div>
              {vehicle.provisioning?.paid
                ? <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">Paid{vehicle.provisioning.amountPaid ? ` · ₹${vehicle.provisioning.amountPaid}` : ''}</span>
                : <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white">Unpaid</span>}
            </div>
            {vehicle.provisioning?.paymentId && <div className="mt-1 text-[11px] font-mono text-slate-500">{vehicle.provisioning.paymentId}</div>}
          </div>

          {/* device */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="text-[13px] font-bold text-slate-700">Device (software level)</div>
            <input value={deviceId} onChange={(e) => setDeviceId(e.target.value.toUpperCase())} placeholder="Device ID e.g. BMG-DECA1B" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono" />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={simLocked} onChange={(e) => setSimLocked(e.target.checked)} /> SIM locked to our server
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={simActivated} onChange={(e) => setSimActivated(e.target.checked)} /> SIM activated (data plan on)
            </label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note (optional)" rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <button onClick={() => save()} disabled={busy} className="w-full rounded-lg border border-slate-300 py-2 text-[13px] font-semibold text-slate-700 disabled:opacity-50">Save details</button>
          </div>

          {/* lifecycle */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 text-[13px] font-bold text-slate-700">Provisioning steps</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => save('assigned')} disabled={busy || !deviceId.trim()} className="rounded-lg bg-blue-600 py-2 text-[13px] font-semibold text-white disabled:opacity-40">1 · Assign device</button>
              <button onClick={() => save('configured')} disabled={busy} className="rounded-lg bg-violet-600 py-2 text-[13px] font-semibold text-white disabled:opacity-40">2 · Configured</button>
              <button onClick={() => save('shipped')} disabled={busy} className="rounded-lg bg-cyan-600 py-2 text-[13px] font-semibold text-white disabled:opacity-40">3 · Shipped</button>
              <button onClick={() => save('active')} disabled={busy} className="rounded-lg bg-emerald-600 py-2 text-[13px] font-semibold text-white disabled:opacity-40">4 · Go live</button>
            </div>
            <button onClick={() => save('inactive')} disabled={busy} className="mt-2 w-full rounded-lg border border-red-200 py-2 text-[12px] font-semibold text-red-600 disabled:opacity-40">Deactivate</button>
          </div>
        </div>
      </div>
    </div>
  )
}
