'use client'

// Admin — discount coupons: create / edit / activate / delete, with live list,
// stats and audience targeting. Applied at customer checkout.
import { useCallback, useEffect, useState } from 'react'
import { adminCouponsAPI } from '@/services/api'
import { toast } from 'sonner'
import {
  Loader2, Ticket, Search, Plus, RefreshCw, Trash2, Pencil, X,
  Percent, IndianRupee, Users, CheckCircle, XCircle,
} from 'lucide-react'

const NAVY = '#1B3B6F'
const AUDIENCES = [
  { key: 'all', label: 'Everyone' },
  { key: 'customer', label: 'Customers' },
  { key: 'mechanic', label: 'Mechanics' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'shop', label: 'Shop partners' },
]
const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN')
const fmt = (iso?: string) => { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '—' } }

interface Coupon {
  _id: string
  code: string
  description?: string
  discountType: 'percent' | 'flat'
  discountValue: number
  maxDiscount?: number
  minOrder?: number
  audience?: string
  usageLimit?: number
  perUserLimit?: number
  usedCount?: number
  validFrom?: string
  validTo?: string
  isActive: boolean
}

const emptyForm = {
  code: '', description: '', discountType: 'percent', discountValue: '',
  maxDiscount: '', minOrder: '', audience: 'all', usageLimit: '', perUserLimit: '1',
  validTo: '', isActive: true,
}

export function CouponManagement() {
  const [rows, setRows] = useState<Coupon[]>([])
  const [stats, setStats] = useState<{ total: number; active: number; redemptions: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Coupon | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await adminCouponsAPI.getAll({ search: q || undefined, status: status === 'all' ? undefined : status })
      if (r.data?.success) { setRows(r.data.data || []); setStats(r.data.stats || null) }
    } catch { toast.error('Could not load coupons') } finally { setLoading(false) }
  }, [q, status])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (c: Coupon) => {
    setEditing(c)
    setForm({
      code: c.code, description: c.description || '', discountType: c.discountType,
      discountValue: String(c.discountValue ?? ''), maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '',
      minOrder: c.minOrder ? String(c.minOrder) : '', audience: c.audience || 'all',
      usageLimit: c.usageLimit ? String(c.usageLimit) : '', perUserLimit: c.perUserLimit != null ? String(c.perUserLimit) : '1',
      validTo: c.validTo ? c.validTo.slice(0, 10) : '', isActive: c.isActive,
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.code.trim() || form.discountValue === '') { toast.error('Code and discount value are required'); return }
    if (form.discountType === 'percent' && Number(form.discountValue) > 100) { toast.error('Percentage cannot exceed 100'); return }
    setSaving(true)
    const payload: any = {
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : 0,
      minOrder: form.minOrder ? Number(form.minOrder) : 0,
      audience: form.audience,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : 0,
      perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : 0,
      validTo: form.validTo || undefined,
      isActive: form.isActive,
    }
    try {
      if (editing) {
        const r = await adminCouponsAPI.update(editing._id, payload)
        if (r.data?.success) { toast.success('Coupon updated'); setShowForm(false); load() } else toast.error(r.data?.message || 'Failed')
      } else {
        const r = await adminCouponsAPI.create({ ...payload, code: form.code.trim().toUpperCase() })
        if (r.data?.success) { toast.success('Coupon created'); setShowForm(false); load() } else toast.error(r.data?.message || 'Failed')
      }
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to save coupon') } finally { setSaving(false) }
  }

  const toggleActive = async (c: Coupon) => {
    setBusyId(c._id)
    try {
      const r = await adminCouponsAPI.update(c._id, { isActive: !c.isActive })
      if (r.data?.success) { toast.success(c.isActive ? 'Coupon disabled' : 'Coupon enabled'); load() }
    } catch { toast.error('Failed') } finally { setBusyId(null) }
  }

  const doDelete = async () => {
    if (!confirmDelete) return
    setBusyId(confirmDelete._id)
    try {
      const r = await adminCouponsAPI.remove(confirmDelete._id)
      if (r.data?.success) { toast.success('Coupon deleted'); setConfirmDelete(null); load() }
    } catch { toast.error('Failed to delete') } finally { setBusyId(null) }
  }

  const discountLabel = (c: Coupon) => c.discountType === 'flat'
    ? inr(c.discountValue)
    : `${c.discountValue}%${c.maxDiscount ? ` (max ${inr(c.maxDiscount)})` : ''}`

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* header + stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Coupons</h1>
          <p className="text-sm text-gray-500">Create discount codes customers can apply at checkout</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#e55a28]">
          <Plus className="h-4 w-4" /> New Coupon
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] p-5 shadow-md">
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
            <div className="relative flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">Total redemptions</p>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><Ticket className="h-[18px] w-[18px] text-white" /></div>
            </div>
            <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-white tabular-nums">{stats.redemptions}</p>
            <p className="relative mt-3 text-[12px] text-white/70"><b className="text-white">{stats.active}</b> active · <b className="text-white">{stats.total}</b> total</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-3">
            {[
              { label: 'Total coupons', value: stats.total, icon: Ticket, tint: 'text-slate-600 bg-slate-100' },
              { label: 'Active', value: stats.active, icon: CheckCircle, tint: 'text-emerald-600 bg-emerald-50' },
              { label: 'Redemptions', value: stats.redemptions, icon: Users, tint: 'text-violet-600 bg-violet-50' },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl ${s.tint}`}><Icon className="h-4 w-4" /></div>
                  <p className="mt-2 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{s.value}</p>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code…" className="h-9 w-52 text-sm outline-none" />
        </div>
        {['all', 'active', 'inactive'].map((s) => (
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
            <Ticket className="h-9 w-9" />
            <p className="mt-2 text-sm font-semibold">No coupons yet</p>
            <button onClick={openCreate} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#1B3B6F] px-3 py-1.5 text-[12px] font-bold text-white"><Plus className="h-3.5 w-3.5" /> Create one</button>
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-[#F6F8FB] text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min order</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Valid till</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c._id} className="border-b border-slate-50 border-l-[3px] transition-colors hover:bg-[#1B3B6F]/[0.03]" style={{ borderLeftColor: c.isActive ? '#10b981' : '#cbd5e1' }}>
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-slate-800">{c.code}</div>
                    {c.description && <div className="text-[11.5px] text-slate-400">{c.description}</div>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{discountLabel(c)}</td>
                  <td className="px-4 py-3 text-slate-600">{c.minOrder ? inr(c.minOrder) : '—'}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{AUDIENCES.find((a) => a.key === (c.audience || 'all'))?.label || c.audience}</td>
                  <td className="px-4 py-3 text-[12.5px] text-slate-500">
                    {c.usedCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}{c.perUserLimit ? ` · ${c.perUserLimit}/user` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{fmt(c.validTo)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button disabled={busyId === c._id} onClick={() => toggleActive(c)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                        {c.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}{c.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => openEdit(c)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-bold text-[#1B3B6F] hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => setConfirmDelete(c)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-[11.5px] font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* create / edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#16305c] via-[#1B3B6F] to-[#2a55a0] px-6 py-5">
              <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/[0.06]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 backdrop-blur"><Ticket className="h-5 w-5 text-white" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{editing ? 'Edit coupon' : 'New coupon'}</h3>
                    <p className="text-[12px] text-white/60">{editing ? editing.code : 'Create a discount code for checkout'}</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <label className="text-xs font-medium text-gray-600">Coupon code <span className="text-[#FF6B35]">*</span></label>
                <input value={form.code} disabled={!!editing} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30 disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="WELCOME10" />
                {editing && <p className="mt-1 text-[11px] text-gray-400">Code can't be changed after creation.</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30" placeholder="10% off your first order" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Type</label>
                  <div className="mt-1 flex rounded-lg border border-gray-200 p-0.5">
                    {(['percent', 'flat'] as const).map((t) => (
                      <button key={t} onClick={() => setForm({ ...form, discountType: t })}
                        className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-bold capitalize ${form.discountType === t ? 'bg-[#1B3B6F] text-white' : 'text-gray-500'}`}>
                        {t === 'percent' ? <Percent className="h-3 w-3" /> : <IndianRupee className="h-3 w-3" />}{t === 'percent' ? 'Percent' : 'Flat'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Value <span className="text-[#FF6B35]">*</span></label>
                  <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30" placeholder={form.discountType === 'percent' ? '10' : '100'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Max discount (₹) {form.discountType === 'flat' && <span className="text-gray-300">n/a</span>}</label>
                  <input type="number" value={form.maxDiscount} disabled={form.discountType === 'flat'} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30 disabled:bg-gray-50" placeholder="Cap (0 = none)" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Min order (₹)</label>
                  <input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Who can use this?</label>
                <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30">
                  {AUDIENCES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Total uses</label>
                  <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30" placeholder="0 = ∞" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Per user</label>
                  <input type="number" value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30" placeholder="1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Expires on</label>
                  <input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30" />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#1B3B6F]" />
                <span className="text-sm font-medium text-gray-700">Active (usable immediately)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1B3B6F] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F2545] disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editing ? 'Save changes' : 'Create coupon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-red-50"><Trash2 className="h-5 w-5 text-red-600" /></div>
            <h3 className="text-center text-lg font-bold text-[#1A1D29]">Delete coupon?</h3>
            <p className="mt-1 text-center text-sm text-gray-500">“{confirmDelete.code}” will be permanently removed.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={doDelete} disabled={busyId === confirmDelete._id} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
