import { useEffect, useState, useCallback } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { adminTrackerAPI } from '@/services/api'
import { toast } from 'sonner'

// ────────────────────────────────────────────────────────────────────────────
// GPS Provisioning — admin sees every customer's GPS order and drives the
// DELIVERY: pick a delivery partner, walk the order through the chain
// (prepared → shipped → out for delivery → delivered). Only after it's
// delivered does the admin "Go live" and fit the actual GPS device (IMEI, SIM,
// vehicle) — which creates the tracker record shown on the GPS Trackers page.
// ────────────────────────────────────────────────────────────────────────────

type DeliveryUpdate = { _id?: string; location: string; note?: string; status?: string; at?: string }
type Prov = {
  paid?: boolean; paymentId?: string; amountPaid?: number
  warrantyMonths?: number
  deliveryPartner?: string; deliveryTracking?: string; deliveryStatus?: string; deliveryUpdatedAt?: string
  deliveryAddress?: string
  deliveryUpdates?: DeliveryUpdate[]
}
type Vehicle = {
  _id: string
  name: string
  regNo?: string
  type?: string
  em?: string
  status: string
  provisioning?: Prov
  user?: { _id: string; fullName?: string; username?: string; phone?: string; gpsPlan?: any }
  customerAddress?: string
  device?: { deviceId?: string; imei?: string; status?: string } | null
}

const STATUS_TABS = ['all', 'pending', 'assigned', 'shipped', 'active', 'inactive']
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  assigned: 'bg-blue-100 text-blue-700',
  configured: 'bg-violet-100 text-violet-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-200 text-slate-600',
}

// Delivery chain (order matters — buttons advance through it)
const DELIVERY_STEPS = [
  { id: 'prepared', label: 'Prepared', color: 'bg-blue-600' },
  { id: 'shipped', label: 'Shipped', color: 'bg-cyan-600' },
  { id: 'out_for_delivery', label: 'Out for delivery', color: 'bg-violet-600' },
  { id: 'delivered', label: 'Delivered', color: 'bg-emerald-600' },
]
const DELIVERY_LABEL: Record<string, string> = {
  prepared: 'Prepared', shipped: 'Shipped', out_for_delivery: 'Out for delivery', delivered: 'Delivered',
}
const DELIVERY_PARTNERS = ['Own delivery boy', 'DTDC', 'Delhivery', 'Blue Dart', 'India Post', 'Professional Couriers', 'Ekart', 'Self pickup', 'Other']
const WARRANTY_OPTIONS = [3, 6, 9, 12, 15, 18, 24]

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
          <p className="text-[13px] text-slate-500">Customer GPS orders · pick delivery partner · track delivery · go live &amp; fit the device</p>
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
                  <th className="px-4 py-3">Delivery partner</th>
                  <th className="px-4 py-3">Delivery status</th>
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
                    <td className="px-4 py-3 text-[12px] text-slate-600">
                      {v.provisioning?.deliveryPartner || <span className="text-slate-400">—</span>}
                      {v.provisioning?.deliveryTracking ? <div className="text-[11px] font-mono text-slate-400">{v.provisioning.deliveryTracking}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-[12px]">
                      {v.provisioning?.deliveryStatus
                        ? <span className="inline-block rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-[11px] font-bold">{DELIVERY_LABEL[v.provisioning.deliveryStatus] || v.provisioning.deliveryStatus}</span>
                        : <span className="text-slate-400">Not started</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_COLOR[v.status] || 'bg-slate-100 text-slate-600'}`}>{v.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSel(v)} className="rounded-lg bg-[#1B3B6F] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#0F2545]">Manage</button>
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
  const prov = vehicle.provisioning || {}
  const [partner, setPartner] = useState(prov.deliveryPartner || '')
  const [tracking, setTracking] = useState(prov.deliveryTracking || '')
  const [address, setAddress] = useState(prov.deliveryAddress || '')
  const [deliveryStatus, setDeliveryStatus] = useState(prov.deliveryStatus || '')
  const [busy, setBusy] = useState(false)

  // Courier-style tracking chain — where the device has reached so far
  const [updates, setUpdates] = useState<DeliveryUpdate[]>(prov.deliveryUpdates || [])
  const [newLoc, setNewLoc] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newStep, setNewStep] = useState('')

  const addUpdate = async () => {
    if (!newLoc.trim()) { toast.error('Enter where the device has reached'); return }
    setBusy(true)
    try {
      const r = await adminTrackerAPI.addDeliveryUpdate(vehicle._id, {
        location: newLoc.trim(),
        note: newNote.trim() || undefined,
        status: newStep || undefined,
      })
      const p = r.data?.data?.provisioning || {}
      setUpdates(p.deliveryUpdates || [])
      if (p.deliveryStatus) setDeliveryStatus(p.deliveryStatus)
      setNewLoc(''); setNewNote(''); setNewStep('')
      toast.success('Tracking update added — customer can see it')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    setBusy(false)
  }

  const removeUpdate = async (updateId?: string) => {
    if (!updateId) return
    setBusy(true)
    try {
      const r = await adminTrackerAPI.removeDeliveryUpdate(vehicle._id, updateId)
      setUpdates(r.data?.data?.provisioning?.deliveryUpdates || [])
      toast.success('Update removed')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    setBusy(false)
  }

  // Go-live (assign device) form
  const [showGoLive, setShowGoLive] = useState(vehicle.status === 'active')
  const [imei, setImei] = useState('')
  const [simNumber, setSimNumber] = useState('')
  const [userPhone, setUserPhone] = useState(vehicle.user?.phone || '')
  const [vehicleName, setVehicleName] = useState(vehicle.name || '')
  const [regNo, setRegNo] = useState(vehicle.regNo || '')
  const [warranty, setWarranty] = useState(prov.warrantyMonths ? String(prov.warrantyMonths) : '')

  const savePartner = async () => {
    setBusy(true)
    try {
      await adminTrackerAPI.provisionVehicle(vehicle._id, { deliveryPartner: partner, deliveryTracking: tracking, deliveryAddress: address })
      toast.success('Delivery details saved')
      onSaved()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    setBusy(false)
  }

  const setStep = async (step: string) => {
    if (!partner) { toast.error('Pick a delivery partner first'); return }
    setBusy(true)
    try {
      await adminTrackerAPI.provisionVehicle(vehicle._id, { deliveryPartner: partner, deliveryTracking: tracking, deliveryAddress: address, deliveryStatus: step })
      setDeliveryStatus(step)
      toast.success(`Marked ${DELIVERY_LABEL[step] || step}`)
      if (step !== 'delivered') onSaved()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') }
    setBusy(false)
  }

  const goLive = async () => {
    if (!imei.trim() || !userPhone.trim()) { toast.error('GPS IMEI and app user phone are required'); return }
    setBusy(true)
    try {
      // 1) create/link the physical GPS device to the app user → shows on GPS Trackers
      const r = await adminTrackerAPI.assign({
        imei: imei.trim(), simNumber: simNumber.trim(), userPhone: userPhone.trim(),
        vehicleName: vehicleName.trim(), regNo: regNo.trim(),
        warrantyMonths: warranty ? Number(warranty) : undefined,
      })
      if (!r.data?.success) { toast.error(r.data?.message || 'Could not assign device'); setBusy(false); return }
      // 2) mark this order live + carry the warranty onto the order record
      await adminTrackerAPI.provisionVehicle(vehicle._id, {
        status: 'active',
        warrantyMonths: warranty ? Number(warranty) : undefined,
      })
      toast.success('Device fitted & live — now shows on GPS Trackers')
      onSaved()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to go live') }
    setBusy(false)
  }

  const currentIdx = DELIVERY_STEPS.findIndex((s) => s.id === deliveryStatus)
  const delivered = deliveryStatus === 'delivered'

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-[#1B3B6F] px-5 py-4 text-white">
          <div>
            <div className="text-base font-extrabold">{vehicle.em} {vehicle.name}</div>
            <div className="text-[12px] text-white/70">{vehicle.user?.fullName} · {vehicle.user?.phone}</div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>

        <div className="space-y-5 p-5">
          {/* payment status */}
          <div className={`rounded-xl border p-4 ${prov.paid ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold text-slate-700">Payment</div>
              {prov.paid
                ? <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">Paid{prov.amountPaid ? ` · ₹${prov.amountPaid}` : ''}</span>
                : <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white">Unpaid</span>}
            </div>
            {prov.paymentId && <div className="mt-1 text-[11px] font-mono text-slate-500">{prov.paymentId}</div>}
          </div>

          {/* delivery address */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="text-[13px] font-bold text-slate-700">Delivery address</div>
            {vehicle.customerAddress ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-blue-600">Customer wants delivery at</div>
                  <button
                    onClick={() => setAddress(vehicle.customerAddress || '')}
                    className="rounded-md bg-blue-600 px-2 py-0.5 text-[10.5px] font-bold text-white hover:bg-blue-700">
                    Use this
                  </button>
                </div>
                <div className="text-[12.5px] leading-snug text-slate-700">{vehicle.customerAddress}</div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-400">
                Customer hasn&apos;t saved a delivery address — enter it manually below.
              </div>
            )}
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Delivery address (admin can edit)…"
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-700">
              <span>👁️</span>
              <span>The customer sees this address (and the delivery steps) in their app under GPS order status.</span>
            </div>
            {/* Once shipped, the address matters most — nudge the admin to fill it */}
            {['shipped', 'out_for_delivery'].includes(deliveryStatus) && !address.trim() && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] font-semibold text-amber-700">
                Order is {DELIVERY_LABEL[deliveryStatus]} — please add the delivery address so the customer can see where it&apos;s going.
              </div>
            )}
            <button onClick={savePartner} disabled={busy} className="w-full rounded-lg border border-slate-300 py-2 text-[13px] font-semibold text-slate-700 disabled:opacity-50">
              Save address
            </button>
          </div>

          {/* delivery partner */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="text-[13px] font-bold text-slate-700">Delivery partner</div>
            <select value={partner} onChange={(e) => setPartner(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="">Select partner…</option>
              {DELIVERY_PARTNERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking / AWB number (optional)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <button onClick={savePartner} disabled={busy} className="w-full rounded-lg border border-slate-300 py-2 text-[13px] font-semibold text-slate-700 disabled:opacity-50">Save delivery details</button>
          </div>

          {/* delivery chain */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 text-[13px] font-bold text-slate-700">Delivery status</div>
            <div className="space-y-2">
              {DELIVERY_STEPS.map((step, i) => {
                const done = currentIdx >= i && currentIdx >= 0
                const isCurrent = deliveryStatus === step.id
                return (
                  <button
                    key={step.id}
                    onClick={() => setStep(step.id)}
                    disabled={busy}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold disabled:opacity-50 ${isCurrent ? `${step.color} text-white` : done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${isCurrent ? 'bg-white/25' : done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {done && !isCurrent ? '✓' : i + 1}
                    </span>
                    {step.label}
                  </button>
                )
              })}
            </div>
            {!delivered && (
              <p className="mt-3 text-[11px] text-slate-400">Mark the order <b>Delivered</b> to unlock &ldquo;Go live&rdquo; and fit the GPS device.</p>
            )}
          </div>

          {/* WHERE HAS THE DEVICE REACHED — courier-style tracking chain */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div>
              <div className="text-[13px] font-bold text-slate-700">Where has the device reached?</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Add each location as the device moves — the customer sees this chain live in their app.
              </p>
            </div>

            {/* existing chain (newest first) */}
            {updates.length > 0 ? (
              <div className="space-y-2">
                {[...updates].sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()).map((u, i) => (
                  <div key={u._id || i} className="flex items-start gap-2.5 rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold text-slate-700">{u.location}</div>
                      {u.note && <div className="text-[11px] text-slate-500">{u.note}</div>}
                      <div className="text-[10.5px] text-slate-400">
                        {u.at ? new Date(u.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}
                        {u.status ? ` · ${DELIVERY_LABEL[u.status] || u.status}` : ''}
                      </div>
                    </div>
                    <button onClick={() => removeUpdate(u._id)} disabled={busy}
                      className="text-[11px] font-semibold text-red-500 hover:text-red-600 disabled:opacity-40">Remove</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-slate-400">No location updates yet.</p>
            )}

            {/* add a new location */}
            <div className="space-y-2 rounded-lg border border-dashed border-slate-300 p-3">
              <input value={newLoc} onChange={(e) => setNewLoc(e.target.value)}
                placeholder="Reached where? e.g. Left Noida hub / Reached Gorakhpur"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <input value={newNote} onChange={(e) => setNewNote(e.target.value)}
                placeholder="Note (optional) — e.g. expected delivery tomorrow"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <select value={newStep} onChange={(e) => setNewStep(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <option value="">Keep current status</option>
                  {DELIVERY_STEPS.map((st) => <option key={st.id} value={st.id}>Also mark: {st.label}</option>)}
                </select>
                <button onClick={addUpdate} disabled={busy}
                  className="rounded-lg bg-[#1B3B6F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0F2545] disabled:opacity-50">
                  Add update
                </button>
              </div>
            </div>
          </div>

          {/* go live — assign the physical device (only after delivered) */}
          {(delivered || vehicle.status === 'active') && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[13px] font-bold text-slate-700">Go live · fit GPS device</div>
                {vehicle.status === 'active' && <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">Live</span>}
              </div>

              {vehicle.status === 'active' ? (
                <p className="text-[12px] text-slate-500">This order is live. The fitted device appears on the <b>GPS Trackers</b> page.</p>
              ) : !showGoLive ? (
                <button onClick={() => setShowGoLive(true)} className="w-full rounded-lg bg-emerald-600 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700">Go live &amp; assign device</button>
              ) : (
                <div className="space-y-2.5">
                  <input value={imei} onChange={(e) => setImei(e.target.value)} placeholder="GPS IMEI *" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input value={simNumber} onChange={(e) => setSimNumber(e.target.value)} placeholder="SIM number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="App user phone *" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} placeholder="Vehicle name" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="Bike number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <select value={warranty} onChange={(e) => setWarranty(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <option value="">Warranty…</option>
                    {WARRANTY_OPTIONS.map((m) => <option key={m} value={m}>{m} months</option>)}
                  </select>
                  <button onClick={goLive} disabled={busy} className="w-full rounded-lg bg-emerald-600 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Fit device &amp; go live</button>
                  <p className="text-[11px] text-slate-400">Enter the GPS IMEI + the customer&apos;s app login phone. The device links to that user and appears on the GPS Trackers page.</p>
                </div>
              )}
            </div>
          )}

          {/* deactivate */}
          {vehicle.status === 'active' && (
            <button
              onClick={async () => { setBusy(true); try { await adminTrackerAPI.provisionVehicle(vehicle._id, { status: 'inactive' }); toast.success('Deactivated'); onSaved() } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed') } setBusy(false) }}
              disabled={busy}
              className="w-full rounded-lg border border-red-200 py-2 text-[12px] font-semibold text-red-600 disabled:opacity-40">
              Deactivate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
