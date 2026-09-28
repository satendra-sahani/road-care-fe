'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Pencil, Store } from 'lucide-react'
import { toast } from 'sonner'
import { franchiseAPI } from '@/services/api'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { useFranchise } from './FranchiseContext'
import { Panel, PrimaryBtn, GhostBtn, Field, inputCls, Modal, ActivePill, Empty, Spinner, PLANS, dateIN, errMsg } from './ui'

type Shop = any
const blank = { shopName: '', ownerName: '', ownerPhone: '', ownerEmail: '', shopPhone: '', street: '', landmark: '', city: '', state: '', pincode: '', planKey: 'standard' }

export function FranchiseShops() {
  const { me } = useFranchise()
  const [rows, setRows] = useState<Shop[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState<Shop | 'new' | null>(null)
  const [form, setForm] = useState<any>(blank)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await franchiseAPI.shops({ page, limit: 20, search: q || undefined })
      setRows(r.data?.data || []); setTotal(r.data?.pagination?.total || 0)
    } catch (e) { toast.error(errMsg(e, 'Could not load shops')) } finally { setLoading(false) }
  }, [page, q])
  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setTimeout(() => { setPage(1); setQ(search.trim()) }, 350); return () => clearTimeout(t) }, [search])

  const openNew = () => { setForm({ ...blank, city: me?.franchise?.city || '' }); setEdit('new') }
  const openEdit = (s: Shop) => {
    setForm({
      shopName: s.shopName || '', ownerName: s.user?.fullName || '', ownerPhone: s.user?.phone || '', ownerEmail: s.user?.email || '',
      shopPhone: s.shopPhone || '', street: s.address?.street || '', landmark: s.address?.landmark || '', city: s.address?.city || '',
      state: s.address?.state || '', pincode: s.address?.pincode || '', planKey: s.partnerPlan?.key || 'standard', isActive: s.isActive !== false,
    })
    setEdit(s)
  }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f: any) => ({ ...f, [k]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const r = edit === 'new' ? await franchiseAPI.createShop(form) : await franchiseAPI.updateShop((edit as Shop)._id, form)
      toast.success(r.data?.message || 'Saved'); setEdit(null); load()
    } catch (err) { toast.error(errMsg(err, 'Could not save the shop')) } finally { setSaving(false) }
  }

  const isNew = edit === 'new'
  return (
    <>
      <Panel
        title={`Your shops (${total})`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-10 items-center gap-2 rounded-xl border border-[#DDE4EC] bg-white px-3">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shop, phone, city" className="w-48 bg-transparent text-[13px] outline-none" />
            </div>
            <PrimaryBtn onClick={openNew}><Plus className="h-4 w-4" /> Add shop</PrimaryBtn>
          </div>
        }
      >
        {loading ? <Spinner /> : rows.length === 0 ? (
          <Empty><Store className="mx-auto mb-2 h-8 w-8 text-[#CBD5E1]" />No shops yet. Add your first partner shop.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F8FAFC] text-left text-[11.5px] font-bold uppercase tracking-wide text-[#7B8AA3]">
                <tr><th className="px-4 py-3">Shop</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Added</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s._id} className="border-t border-[#EEF1F6]">
                    <td className="px-4 py-3"><b className="text-[#13203A]">{s.shopName}</b><div className="text-[11.5px] text-[#7B8AA3]">{s.shopPhone}</div></td>
                    <td className="px-4 py-3">{s.user?.fullName}<div className="text-[11.5px] text-[#7B8AA3]">{s.user?.phone}</div></td>
                    <td className="px-4 py-3">{s.address?.city || '—'}</td>
                    <td className="px-4 py-3">{s.partnerPlan?.name || 'Standard'}</td>
                    <td className="px-4 py-3"><ActivePill active={s.isActive} /></td>
                    <td className="px-4 py-3 text-[#52667C]">{dateIN(s.createdAt)}</td>
                    <td className="px-4 py-3 text-right"><GhostBtn onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /> Edit</GhostBtn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination page={page} pageSize={20} total={total} onPageChange={setPage} label="shops" />
      </Panel>

      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={isNew ? 'Add a shop' : 'Edit shop'}
        description={isNew ? 'The owner can log in to the Shop Partner app with an OTP on their phone number.' : undefined}>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Shop name" required><input className={inputCls} value={form.shopName} onChange={set('shopName')} required /></Field>
          <Field label="Shop phone"><input className={inputCls} value={form.shopPhone} onChange={set('shopPhone')} inputMode="numeric" /></Field>
          <Field label="Owner name" required><input className={inputCls} value={form.ownerName} onChange={set('ownerName')} required /></Field>
          <Field label="Owner mobile" required hint={isNew ? 'Used for OTP login' : 'Contact admin to change the login number'}>
            <input className={inputCls} value={form.ownerPhone} onChange={set('ownerPhone')} inputMode="numeric" required={isNew} disabled={!isNew} />
          </Field>
          {isNew && <Field label="Owner email"><input className={inputCls} type="email" value={form.ownerEmail} onChange={set('ownerEmail')} /></Field>}
          <Field label="Street / area"><input className={inputCls} value={form.street} onChange={set('street')} /></Field>
          <Field label="Landmark"><input className={inputCls} value={form.landmark} onChange={set('landmark')} /></Field>
          <Field label="City"><input className={inputCls} value={form.city} onChange={set('city')} /></Field>
          <Field label="State"><input className={inputCls} value={form.state} onChange={set('state')} /></Field>
          <Field label="PIN code"><input className={inputCls} value={form.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} /></Field>
          <div className="sm:col-span-2">
            <Field label="Partner plan"><select className={inputCls} value={form.planKey} onChange={set('planKey')}>{PLANS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}</select></Field>
          </div>
          {!isNew && (
            <label className="flex items-center gap-2 text-[13px] font-semibold text-[#13203A] sm:col-span-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} /> Shop is active (receives jobs)
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
            <GhostBtn type="button" onClick={() => setEdit(null)} className="h-10">Cancel</GhostBtn>
            <PrimaryBtn type="submit" loading={saving}>{isNew ? 'Add shop' : 'Save changes'}</PrimaryBtn>
          </div>
        </form>
      </Modal>
    </>
  )
}
