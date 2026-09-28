'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Pencil, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { franchiseAPI } from '@/services/api'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { useFranchise } from './FranchiseContext'
import { Panel, PrimaryBtn, GhostBtn, Field, inputCls, Modal, ActivePill, Empty, Spinner, PLANS, SPECIALIZATIONS, VEHICLE_TYPES, Chips, dateIN, errMsg } from './ui'

const blank = { fullName: '', phone: '', email: '', street: '', city: '', state: '', pincode: '', experience: '', specializations: [] as string[], vehicleTypes: [] as string[], planKey: 'standard', assignedShop: '' }

export function FranchiseMechanics() {
  const { me } = useFranchise()
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [shops, setShops] = useState<any[]>([])
  const [edit, setEdit] = useState<any | 'new' | null>(null)
  const [form, setForm] = useState<any>(blank)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await franchiseAPI.mechanics({ page, limit: 20, search: q || undefined })
      setRows(r.data?.data || []); setTotal(r.data?.pagination?.total || 0)
    } catch (e) { toast.error(errMsg(e, 'Could not load mechanics')) } finally { setLoading(false) }
  }, [page, q])
  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setTimeout(() => { setPage(1); setQ(search.trim()) }, 350); return () => clearTimeout(t) }, [search])
  useEffect(() => { franchiseAPI.shops({ limit: 100 }).then((r) => setShops(r.data?.data || [])).catch(() => {}) }, [])

  const openNew = () => { setForm({ ...blank, city: me?.franchise?.city || '' }); setEdit('new') }
  const openEdit = (m: any) => {
    setForm({
      fullName: m.user?.fullName || '', phone: m.phone || m.user?.phone || '', email: m.user?.email || '',
      street: m.address?.street || '', city: m.address?.city || '', state: m.address?.state || '', pincode: m.address?.pincode || '',
      experience: m.experience || '', specializations: m.specializations || [], vehicleTypes: m.vehicleTypes || [],
      planKey: m.partnerPlan?.key || 'standard', assignedShop: m.assignedShop?._id || m.assignedShop || '', isActive: m.isActive !== false,
    })
    setEdit(m)
  }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f: any) => ({ ...f, [k]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const r = edit === 'new' ? await franchiseAPI.createMechanic(form) : await franchiseAPI.updateMechanic(edit._id, form)
      toast.success(r.data?.message || 'Saved'); setEdit(null); load()
    } catch (err) { toast.error(errMsg(err, 'Could not save the mechanic')) } finally { setSaving(false) }
  }

  const isNew = edit === 'new'
  return (
    <>
      <Panel
        title={`Your mechanics (${total})`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-10 items-center gap-2 rounded-xl border border-[#DDE4EC] bg-white px-3">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, city" className="w-48 bg-transparent text-[13px] outline-none" />
            </div>
            <PrimaryBtn onClick={openNew}><Plus className="h-4 w-4" /> Add mechanic</PrimaryBtn>
          </div>
        }
      >
        {loading ? <Spinner /> : rows.length === 0 ? (
          <Empty><Wrench className="mx-auto mb-2 h-8 w-8 text-[#CBD5E1]" />No mechanics yet. Add your first mechanic.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F8FAFC] text-left text-[11.5px] font-bold uppercase tracking-wide text-[#7B8AA3]">
                <tr><th className="px-4 py-3">Mechanic</th><th className="px-4 py-3">Skills</th><th className="px-4 py-3">Works at</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Added</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m._id} className="border-t border-[#EEF1F6]">
                    <td className="px-4 py-3"><b className="text-[#13203A]">{m.user?.fullName || 'Mechanic'}</b><div className="text-[11.5px] text-[#7B8AA3]">{m.phone || m.user?.phone}</div></td>
                    <td className="max-w-[220px] px-4 py-3 text-[12px] text-[#52667C]">{(m.specializations || []).join(', ') || '—'}</td>
                    <td className="px-4 py-3">{m.assignedShop?.shopName || 'Independent'}</td>
                    <td className="px-4 py-3">{m.address?.city || '—'}</td>
                    <td className="px-4 py-3"><ActivePill active={m.isActive} /></td>
                    <td className="px-4 py-3 text-[#52667C]">{dateIN(m.createdAt)}</td>
                    <td className="px-4 py-3 text-right"><GhostBtn onClick={() => openEdit(m)}><Pencil className="h-3.5 w-3.5" /> Edit</GhostBtn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination page={page} pageSize={20} total={total} onPageChange={setPage} label="mechanics" />
      </Panel>

      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={isNew ? 'Add a mechanic' : 'Edit mechanic'}
        description={isNew ? 'The mechanic can log in to the Bharat Mechanics mechanic app with an OTP on this number.' : undefined}>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" required><input className={inputCls} value={form.fullName} onChange={set('fullName')} required /></Field>
          <Field label="Mobile" required hint={isNew ? 'Used for OTP login' : 'Contact admin to change the login number'}>
            <input className={inputCls} value={form.phone} onChange={set('phone')} inputMode="numeric" required={isNew} disabled={!isNew} />
          </Field>
          {isNew && <Field label="Email"><input className={inputCls} type="email" value={form.email} onChange={set('email')} /></Field>}
          <Field label="Experience"><input className={inputCls} value={form.experience} onChange={set('experience')} placeholder="e.g. 5 years" /></Field>
          <Field label="Street / area"><input className={inputCls} value={form.street} onChange={set('street')} /></Field>
          <Field label="City"><input className={inputCls} value={form.city} onChange={set('city')} /></Field>
          <Field label="State"><input className={inputCls} value={form.state} onChange={set('state')} /></Field>
          <Field label="PIN code"><input className={inputCls} value={form.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} /></Field>
          <div className="sm:col-span-2"><Field label="Skills"><Chips options={SPECIALIZATIONS} value={form.specializations} onChange={(v) => setForm((f: any) => ({ ...f, specializations: v }))} /></Field></div>
          <div className="sm:col-span-2"><Field label="Vehicle types"><Chips options={VEHICLE_TYPES} value={form.vehicleTypes} onChange={(v) => setForm((f: any) => ({ ...f, vehicleTypes: v }))} /></Field></div>
          <Field label="Works at (optional)" hint="Link to one of your shops, or leave independent">
            <select className={inputCls} value={form.assignedShop} onChange={set('assignedShop')}>
              <option value="">Independent mechanic</option>
              {shops.map((s) => <option key={s._id} value={s._id}>{s.shopName}</option>)}
            </select>
          </Field>
          <Field label="Partner plan"><select className={inputCls} value={form.planKey} onChange={set('planKey')}>{PLANS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}</select></Field>
          {!isNew && (
            <label className="flex items-center gap-2 text-[13px] font-semibold text-[#13203A] sm:col-span-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} /> Mechanic is active (receives jobs)
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
            <GhostBtn type="button" onClick={() => setEdit(null)} className="h-10">Cancel</GhostBtn>
            <PrimaryBtn type="submit" loading={saving}>{isNew ? 'Add mechanic' : 'Save changes'}</PrimaryBtn>
          </div>
        </form>
      </Modal>
    </>
  )
}
