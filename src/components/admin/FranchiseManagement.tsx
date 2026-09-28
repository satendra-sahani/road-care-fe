'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Pencil, Network, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { adminFranchiseAPI } from '@/services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

// Admin: create and manage franchises. A franchise adds its own shops / mechanics,
// books jobs, and earns `earningPct` % of the value of every paid job of its network.
const inr = (n?: number) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const inputCls = 'h-10 w-full rounded-lg border border-[#DDE4EC] bg-white px-3 text-[13.5px] outline-none focus:border-[#1B3B6F] disabled:bg-[#F6F8FB]'
const blank = { name: '', ownerName: '', ownerPhone: '', ownerEmail: '', city: '', area: '', address: '', pincode: '', earningPct: '1', notes: '', isActive: true }
// Lowest platform fee a partner pays (Pro plan). A franchise share above it means
// Bharat Mechanics pays out more than it collects on those jobs.
const MIN_PARTNER_FEE_PCT = 3

export function FranchiseManagement() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [edit, setEdit] = useState<any | 'new' | null>(null)
  const [form, setForm] = useState<any>(blank)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await adminFranchiseAPI.getAll({ search: search.trim() || undefined }); setRows(r.data?.data || []) }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not load franchises') } finally { setLoading(false) }
  }, [search])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  const openNew = () => { setForm(blank); setEdit('new') }
  const openEdit = (f: any) => {
    setForm({ name: f.name || '', ownerName: f.ownerName || f.owner?.fullName || '', ownerPhone: f.phone || f.owner?.phone || '', ownerEmail: f.email || '', city: f.city || '', area: f.area || '', address: f.address || '', pincode: f.pincode || '', earningPct: String(f.earningPct ?? 1), notes: f.notes || '', isActive: f.isActive !== false })
    setEdit(f)
  }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((x: any) => ({ ...x, [k]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, earningPct: Number(form.earningPct) }
      const r = edit === 'new' ? await adminFranchiseAPI.create(payload) : await adminFranchiseAPI.update(edit._id, payload)
      toast.success(r.data?.message || 'Saved'); setEdit(null); load()
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Could not save') } finally { setSaving(false) }
  }
  const toggle = async (f: any) => {
    try { await adminFranchiseAPI.update(f._id, { isActive: !f.isActive }); toast.success(f.isActive ? 'Franchise deactivated' : 'Franchise activated'); load() }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Could not update') }
  }

  const isNew = edit === 'new'
  const pctHigh = Number(form.earningPct) >= MIN_PARTNER_FEE_PCT

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#1A1D29]">Franchises</h1>
          <p className="text-sm text-[#6B7280]">Franchises add their own shops and mechanics, book jobs, and earn a share of every paid job. Owners log in at <b>/franchise/login</b>.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-[#DDE4EC] bg-white px-3">
            <Search className="h-4 w-4 text-[#94A3B8]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, code, city" className="w-44 bg-transparent text-[13px] outline-none" />
          </div>
          <button onClick={openNew} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#1B3B6F] px-4 text-[13.5px] font-bold text-white hover:bg-[#15305A]"><Plus className="h-4 w-4" /> Add franchise</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E7ECF3] bg-white">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#1B3B6F]" /></div> : rows.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-[#6B7280]"><Network className="mx-auto mb-2 h-8 w-8 text-[#CBD5E1]" />No franchises yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F8FAFC] text-left text-[11.5px] font-bold uppercase tracking-wide text-[#6B7280]">
                <tr><th className="px-4 py-3">Franchise</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">City</th><th className="px-4 py-3 text-right">Share</th><th className="px-4 py-3 text-right">Shops</th><th className="px-4 py-3 text-right">Mechanics</th><th className="px-4 py-3 text-right">Earned</th><th className="px-4 py-3 text-right">Wallet</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f._id} className="border-t border-[#EEF1F6]">
                    <td className="px-4 py-3"><b className="text-[#1A1D29]">{f.name}</b><div className="font-mono text-[11px] text-[#6B7280]">{f.code}</div></td>
                    <td className="px-4 py-3">{f.ownerName || f.owner?.fullName}<div className="text-[11.5px] text-[#6B7280]">{f.phone || f.owner?.phone}</div></td>
                    <td className="px-4 py-3">{f.city || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{f.earningPct}%</td>
                    <td className="px-4 py-3 text-right tabular-nums">{f.stats?.shops ?? 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{f.stats?.mechanics ?? 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{inr(f.stats?.earnings)}<div className="text-[11px] text-[#6B7280]">{f.stats?.paidJobs || 0} jobs</div></td>
                    <td className="px-4 py-3 text-right tabular-nums">{inr(f.stats?.walletBalance)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(f)} className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${f.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`} title="Click to change">{f.isActive ? 'Active' : 'Inactive'}</button>
                    </td>
                    <td className="px-4 py-3 text-right"><button onClick={() => openEdit(f)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E1E8F0] px-2.5 text-[12px] font-bold text-[#1B3B6F] hover:border-[#1B3B6F]"><Pencil className="h-3.5 w-3.5" /> Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => { if (!o) setEdit(null) }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isNew ? 'Add a franchise' : `Edit ${edit?.name || 'franchise'}`}</DialogTitle>
            {isNew && <DialogDescription>The owner can log in at /franchise/login with an OTP on their mobile. Use a number that has no Bharat Mechanics account yet.</DialogDescription>}
          </DialogHeader>
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            {[['name', 'Franchise name', true], ['ownerName', 'Owner name', true]].map(([k, l, req]) => (
              <label key={k as string} className="block"><span className="mb-1 block text-[12px] font-bold text-[#52667C]">{l}{req && <span className="text-red-500"> *</span>}</span><input className={inputCls} value={form[k as string]} onChange={set(k as string)} required={!!req} /></label>
            ))}
            <label className="block"><span className="mb-1 block text-[12px] font-bold text-[#52667C]">Owner mobile{isNew && <span className="text-red-500"> *</span>}</span>
              <input className={inputCls} value={form.ownerPhone} onChange={set('ownerPhone')} inputMode="numeric" required={isNew} disabled={!isNew} />
            </label>
            <label className="block"><span className="mb-1 block text-[12px] font-bold text-[#52667C]">Owner email</span><input className={inputCls} type="email" value={form.ownerEmail} onChange={set('ownerEmail')} /></label>
            {[['city', 'City'], ['area', 'Area'], ['address', 'Office address'], ['pincode', 'PIN code']].map(([k, l]) => (
              <label key={k} className="block"><span className="mb-1 block text-[12px] font-bold text-[#52667C]">{l}</span><input className={inputCls} value={form[k]} onChange={set(k)} /></label>
            ))}
            <label className="block sm:col-span-2"><span className="mb-1 block text-[12px] font-bold text-[#52667C]">Franchise share — % of every paid job's value</span>
              <input className={`${inputCls} max-w-[160px]`} type="number" min={0} max={50} step="0.1" value={form.earningPct} onChange={set('earningPct')} />
              <span className="mt-1 block text-[11.5px] text-[#6B7280]">Paid on jobs done by the franchise's shops / mechanics (or booked by it), once the customer has paid. Credited to the franchise wallet — 100% withdrawable.</span>
              {pctHigh && (
                <span className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Partners pay a {MIN_PARTNER_FEE_PCT}–5% platform fee. At {form.earningPct}% the franchise may earn more than Bharat Mechanics collects on those jobs.
                </span>
              )}
            </label>
            <label className="block sm:col-span-2"><span className="mb-1 block text-[12px] font-bold text-[#52667C]">Notes (admin only)</span><textarea className={`${inputCls} h-16 py-2`} value={form.notes} onChange={set('notes')} /></label>
            {!isNew && (
              <label className="flex items-center gap-2 text-[13px] font-semibold sm:col-span-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((x: any) => ({ ...x, isActive: e.target.checked }))} /> Active (owner and team can use the dashboard; earnings continue)</label>
            )}
            <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
              <button type="button" onClick={() => setEdit(null)} className="h-10 rounded-lg border border-[#E1E8F0] px-4 text-[13px] font-bold">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1B3B6F] px-4 text-[13.5px] font-bold text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{isNew ? 'Create franchise' : 'Save changes'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
