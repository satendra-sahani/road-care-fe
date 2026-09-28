'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, UserPlus, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { franchiseAPI } from '@/services/api'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { useFranchise } from './FranchiseContext'
import { Panel, PrimaryBtn, GhostBtn, Field, inputCls, Modal, StatusPill, Empty, Spinner, dateIN, inr, errMsg } from './ui'
import { cn } from '@/lib/utils'

const TABS: [string, string][] = [['all', 'All'], ['pending', 'Pending'], ['assigned', 'Assigned'], ['in_progress', 'In progress'], ['completed', 'Completed'], ['paid', 'Paid'], ['cancelled', 'Cancelled']]
const blank = {
  customerName: '', customerPhone: '', vehicleType: 'bike', vehicleBrand: '', vehicleModel: '', registrationNumber: '',
  serviceType: 'home', serviceCategory: 'General Service', description: '', address: '', landmark: '', city: '', pincode: '',
  preferredDate: '', isEmergency: false, assignTo: '',
}
const canAssign = (s?: string) => s === 'pending' || s === 'assigned'
const doneBy = (r: any) => r.shopPartner?.shopName || r.mechanic?.user?.fullName || '—'

export function FranchiseRequests() {
  const { me } = useFranchise()
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [shops, setShops] = useState<any[]>([])
  const [mechs, setMechs] = useState<any[]>([])
  const [booking, setBooking] = useState(false)
  const [form, setForm] = useState<any>(blank)
  const [saving, setSaving] = useState(false)
  const [assignFor, setAssignFor] = useState<any | null>(null)
  const [assignTo, setAssignTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await franchiseAPI.requests({ page, limit: 20, status, search: q || undefined })
      setRows(r.data?.data || []); setTotal(r.data?.pagination?.total || 0)
    } catch (e) { toast.error(errMsg(e, 'Could not load requests')) } finally { setLoading(false) }
  }, [page, status, q])
  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setTimeout(() => { setPage(1); setQ(search.trim()) }, 350); return () => clearTimeout(t) }, [search])
  useEffect(() => {
    franchiseAPI.shops({ limit: 100 }).then((r) => setShops((r.data?.data || []).filter((s: any) => s.isActive !== false))).catch(() => {})
    franchiseAPI.mechanics({ limit: 100 }).then((r) => setMechs((r.data?.data || []).filter((m: any) => m.isActive !== false))).catch(() => {})
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f: any) => ({ ...f, [k]: e.target.value }))
  // "m:<id>" = mechanic, "s:<id>" = shop
  const splitTarget = (v: string) => (v.startsWith('m:') ? { mechanicId: v.slice(2) } : v.startsWith('s:') ? { shopId: v.slice(2) } : {})

  const book = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const t = splitTarget(form.assignTo)
      const r = await franchiseAPI.createRequest({ ...form, assignMechanic: (t as any).mechanicId, assignShop: (t as any).shopId })
      toast.success(r.data?.message || 'Job booked'); setBooking(false); setForm(blank); setStatus('all'); setPage(1); load()
    } catch (err) { toast.error(errMsg(err, 'Could not book the job')) } finally { setSaving(false) }
  }

  const assign = async () => {
    if (!assignFor || !assignTo) return
    setSaving(true)
    try {
      const r = await franchiseAPI.assignRequest(assignFor._id, splitTarget(assignTo))
      toast.success(r.data?.message || 'Assigned'); setAssignFor(null); setAssignTo(''); load()
    } catch (err) { toast.error(errMsg(err, 'Could not assign')) } finally { setSaving(false) }
  }

  const TargetOptions = () => (
    <>
      {mechs.length > 0 && <optgroup label="Mechanics">{mechs.map((m) => <option key={m._id} value={`m:${m._id}`}>{m.user?.fullName || m.phone}{m.assignedShop?.shopName ? ` — ${m.assignedShop.shopName}` : ''}</option>)}</optgroup>}
      {shops.length > 0 && <optgroup label="Shops">{shops.map((s) => <option key={s._id} value={`s:${s._id}`}>{s.shopName}</option>)}</optgroup>}
    </>
  )

  return (
    <>
      <Panel
        title="Service requests"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-10 items-center gap-2 rounded-xl border border-[#DDE4EC] bg-white px-3">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID, customer, phone" className="w-52 bg-transparent text-[13px] outline-none" />
            </div>
            <PrimaryBtn onClick={() => { setForm({ ...blank, city: me?.franchise?.city || '' }); setBooking(true) }}><Plus className="h-4 w-4" /> Book a job</PrimaryBtn>
          </div>
        }
      >
        <div className="flex gap-1.5 overflow-x-auto border-b border-[#EEF1F6] px-4 py-2.5">
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => { setStatus(k); setPage(1) }}
              className={cn('shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-bold', status === k ? 'bg-[#0D9488] text-white' : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]')}>{label}</button>
          ))}
        </div>
        {loading ? <Spinner /> : rows.length === 0 ? (
          <Empty><ClipboardList className="mx-auto mb-2 h-8 w-8 text-[#CBD5E1]" />No requests here yet. Jobs you book, or jobs assigned to your mechanics and shops, show up here.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F8FAFC] text-left text-[11.5px] font-bold uppercase tracking-wide text-[#7B8AA3]">
                <tr><th className="px-4 py-3">Request</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Assigned to</th><th className="px-4 py-3">Bill</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-t border-[#EEF1F6] align-top">
                    <td className="px-4 py-3">
                      <b className="font-mono text-[12.5px] text-[#13203A]">{r.requestId}</b>
                      <div className="text-[11.5px] text-[#7B8AA3]">{dateIN(r.createdAt)}</div>
                      {r.franchise && <span className="mt-1 inline-block rounded bg-[#CCFBF1] px-1.5 py-0.5 text-[10.5px] font-bold text-[#0F766E]">Booked by you</span>}
                    </td>
                    <td className="px-4 py-3">{r.customer?.fullName || '—'}<div className="text-[11.5px] text-[#7B8AA3]">{r.customer?.phone}</div></td>
                    <td className="max-w-[220px] px-4 py-3">{r.serviceCategory}<div className="line-clamp-2 text-[11.5px] text-[#7B8AA3]">{r.location?.address}</div></td>
                    <td className="px-4 py-3">{doneBy(r)}</td>
                    <td className="px-4 py-3 tabular-nums">{r.totalCost ? inr(r.totalCost) : '—'}</td>
                    <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {canAssign(r.status) && <GhostBtn onClick={() => { setAssignFor(r); setAssignTo('') }}><UserPlus className="h-3.5 w-3.5" /> {r.mechanic || r.shopPartner ? 'Reassign' : 'Assign'}</GhostBtn>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination page={page} pageSize={20} total={total} onPageChange={setPage} label="requests" />
      </Panel>

      <Modal open={booking} onClose={() => setBooking(false)} wide title="Book a job for a customer"
        description="For walk-in or phone customers. A customer account is created on their number if they don't have one.">
        <form onSubmit={book} className="grid gap-3 sm:grid-cols-2">
          <Field label="Customer name" required><input className={inputCls} value={form.customerName} onChange={set('customerName')} required /></Field>
          <Field label="Customer mobile" required><input className={inputCls} value={form.customerPhone} onChange={set('customerPhone')} inputMode="numeric" required /></Field>
          <Field label="Vehicle">
            <select className={inputCls} value={form.vehicleType} onChange={set('vehicleType')}>
              <option value="bike">Bike / Scooter</option><option value="car">Car</option><option value="auto">Auto</option><option value="other">Other</option>
            </select>
          </Field>
          <Field label="Brand & model"><input className={inputCls} value={form.vehicleModel} onChange={set('vehicleModel')} placeholder="e.g. Hero Splendor" /></Field>
          <Field label="Registration no."><input className={inputCls} value={form.registrationNumber} onChange={set('registrationNumber')} placeholder="UP52 AB 1234" /></Field>
          <Field label="Service">
            <select className={inputCls} value={form.serviceCategory} onChange={set('serviceCategory')}>
              {['General Service', 'Engine Repair', 'Brake System', 'Electrical', 'Battery', 'Tyre Service', 'Clutch', 'Oil Change', 'AC Service', 'Breakdown'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Problem" required><textarea className={cn(inputCls, 'h-20 py-2')} value={form.description} onChange={set('description')} required placeholder="e.g. Bike is not starting" /></Field></div>
          <div className="sm:col-span-2"><Field label="Service address" required><input className={inputCls} value={form.address} onChange={set('address')} required /></Field></div>
          <Field label="Landmark"><input className={inputCls} value={form.landmark} onChange={set('landmark')} /></Field>
          <Field label="City"><input className={inputCls} value={form.city} onChange={set('city')} /></Field>
          <Field label="PIN code"><input className={inputCls} value={form.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} /></Field>
          <Field label="Where">
            <select className={inputCls} value={form.serviceType} onChange={set('serviceType')}>
              <option value="home">At customer's place</option><option value="roadside">Roadside</option><option value="walkin">Customer comes to shop</option>
            </select>
          </Field>
          <Field label="Preferred date"><input type="date" className={inputCls} value={form.preferredDate} onChange={set('preferredDate')} /></Field>
          <Field label="Assign now (optional)">
            <select className={inputCls} value={form.assignTo} onChange={set('assignTo')}><option value="">Assign later</option><TargetOptions /></select>
          </Field>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[#13203A] sm:col-span-2">
            <input type="checkbox" checked={form.isEmergency} onChange={(e) => setForm((f: any) => ({ ...f, isEmergency: e.target.checked }))} /> Emergency (higher visit charge)
          </label>
          <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
            <GhostBtn type="button" onClick={() => setBooking(false)} className="h-10">Cancel</GhostBtn>
            <PrimaryBtn type="submit" loading={saving}>Book job</PrimaryBtn>
          </div>
        </form>
      </Modal>

      <Modal open={!!assignFor} onClose={() => setAssignFor(null)} title={`Assign ${assignFor?.requestId || ''}`} description="Send this job to one of your mechanics or shops.">
        <div className="space-y-4">
          <select className={inputCls} value={assignTo} onChange={(e) => setAssignTo(e.target.value)}><option value="">Choose…</option><TargetOptions /></select>
          {mechs.length + shops.length === 0 && <p className="text-[12.5px] text-[#B45309]">Add a mechanic or shop first.</p>}
          <div className="flex justify-end gap-2">
            <GhostBtn onClick={() => setAssignFor(null)} className="h-10">Cancel</GhostBtn>
            <PrimaryBtn onClick={assign} loading={saving} disabled={!assignTo}>Assign</PrimaryBtn>
          </div>
        </div>
      </Modal>
    </>
  )
}
