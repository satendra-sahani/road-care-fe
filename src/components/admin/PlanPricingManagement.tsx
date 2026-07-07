import { useCallback, useEffect, useState } from 'react'
import {
  Crown, Cpu, Users, Plus, Pencil, Trash2, RefreshCw, X, Save, IndianRupee, Radio,
  Layers, Package, CheckCircle2, Ban, Check,
} from 'lucide-react'
import { planPricingAPI } from '@/services/api'

// ════════════════════════════════════════════════════════════════════════════
// Plan Pricing Management — memberships, GPS hardware packages & family
// add-ons. Backed by /admin/pricing-plans (PlanPricing model). Hardware plans
// carry an internal cost sheet (components) with an auto margin readout.
// ════════════════════════════════════════════════════════════════════════════

type PlanType = 'membership' | 'gps_hardware' | 'gps_subscription' | 'addon'

interface PlanComponent { name: string; cost: number }

interface Plan {
  _id: string
  planType: PlanType
  key: string
  vehicleType: 'bike' | 'car' | 'any'
  name: string
  emoji?: string
  tag?: string
  tagline?: string
  priceYearly?: number
  priceMonthly?: number
  priceOneTime?: number
  benefits: string[]
  components: PlanComponent[]
  totalCost?: number
  notes?: string
  sortOrder: number
  isActive: boolean
}

const TABS: { id: PlanType; label: string; icon: any }[] = [
  { id: 'membership', label: 'Membership Plans', icon: Crown },
  { id: 'gps_hardware', label: 'GPS Hardware', icon: Cpu },
  { id: 'addon', label: 'Family / Fleet Add-ons', icon: Users },
]

// Presentational accent per plan type — used for tab chips & card top stripes.
const PLAN_TYPE_STYLE: Record<PlanType, { tint: string; bar: string; solid: string }> = {
  membership: { tint: 'text-indigo-600 bg-indigo-50', bar: 'bg-indigo-400', solid: 'bg-indigo-500' },
  gps_hardware: { tint: 'text-sky-600 bg-sky-50', bar: 'bg-sky-400', solid: 'bg-sky-500' },
  gps_subscription: { tint: 'text-violet-600 bg-violet-50', bar: 'bg-violet-400', solid: 'bg-violet-500' },
  addon: { tint: 'text-emerald-600 bg-emerald-50', bar: 'bg-emerald-400', solid: 'bg-emerald-500' },
}

const inr = (n?: number) => (n == null ? '—' : `₹${Number(n).toLocaleString('en-IN')}`)

const emptyPlan = (planType: PlanType): Partial<Plan> => ({
  planType, key: '', vehicleType: 'bike', name: '', emoji: '', tag: '', tagline: '',
  priceYearly: 0, priceMonthly: 0, priceOneTime: 0,
  benefits: [], components: [], notes: '', sortOrder: 0, isActive: true,
})

// Shared focus/hover treatment for text inputs & selects inside the modal.
const fieldCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-[#1A1D29] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3B6F]/15 focus:border-[#1B3B6F]'

export function PlanPricingManagement() {
  const [tab, setTab] = useState<PlanType>('membership')
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Partial<Plan> | null>(null) // null = closed
  const [isNew, setIsNew] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await planPricingAPI.getAll()
      if (res.data?.success) setPlans(res.data.data || [])
    } catch (e) {
      console.error('Load plans error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const list = plans.filter((p) => p.planType === tab)

  const openEdit = (p: Plan) => { setEditing(JSON.parse(JSON.stringify(p))); setIsNew(false) }
  const openNew = () => { setEditing(emptyPlan(tab)); setIsNew(true) }

  const saveEdit = async () => {
    if (!editing) return
    if (!editing.name?.trim()) { alert('Plan name is required'); return }
    if (isNew && !editing.key?.trim()) { alert('Plan key is required (e.g. bike_plus)'); return }
    setSaving(true)
    try {
      const payload = { ...editing }
      const res = isNew
        ? await planPricingAPI.create(payload)
        : await planPricingAPI.update(editing._id as string, payload)
      if (res.data?.success) { setEditing(null); await load() }
      else alert(res.data?.message || 'Save failed')
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (p: Plan) => {
    try {
      await planPricingAPI.update(p._id, { isActive: !p.isActive })
      setPlans((prev) => prev.map((x) => (x._id === p._id ? { ...x, isActive: !x.isActive } : x)))
    } catch (e) { console.error(e) }
  }

  const remove = async (p: Plan) => {
    if (!confirm(`Delete "${p.name}" (${p.key})? This cannot be undone.`)) return
    try {
      await planPricingAPI.remove(p._id)
      setPlans((prev) => prev.filter((x) => x._id !== p._id))
    } catch (e) { console.error(e) }
  }

  const restoreDefaults = async () => {
    try {
      const res = await planPricingAPI.seedDefaults()
      alert(res.data?.message || 'Defaults restored')
      load()
    } catch (e) { console.error(e) }
  }

  const componentTotal = (c: PlanComponent[] = []) => c.reduce((s, x) => s + (Number(x.cost) || 0), 0)

  // Presentational-only derived counts for the header strip — read existing state, no new fetches.
  const totalPlans = plans.length
  const activePlans = plans.filter((p) => p.isActive).length
  const inactivePlans = totalPlans - activePlans

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#1B3B6F]/10">
            <Layers className="h-5 w-5 text-[#1B3B6F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Plan Pricing</h1>
            <p className="text-sm text-gray-500 mt-1">Manage membership tiers, GPS hardware packages &amp; family add-ons</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={restoreDefaults}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-[#1A1D29] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Restore defaults
          </button>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B3B6F] text-white text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-[#16305C]">
            <Plus className="h-4 w-4" /> Add plan
          </button>
        </div>
      </div>

      {/* Quick totals strip — plain display cards (no matching filter state exists for active/inactive) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-w-2xl">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Total plans</p>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100">
              <Package className="h-4 w-4 text-slate-600" />
            </div>
          </div>
          <p className="mt-1.5 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{loading ? '—' : totalPlans}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Active</p>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="mt-1.5 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{loading ? '—' : activePlans}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Inactive</p>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50">
              <Ban className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="mt-1.5 text-2xl font-extrabold text-[#1A1D29] tabular-nums">{loading ? '—' : inactivePlans}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {TABS.map((t) => {
          const on = tab === t.id
          const TabIcon = t.icon
          const style = PLAN_TYPE_STYLE[t.id]
          const count = plans.filter((p) => p.planType === t.id).length
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all duration-200 ${on ? 'bg-[#1B3B6F] text-white border-[#1B3B6F] shadow-sm' : 'bg-white text-[#1A1D29] border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5'}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-md ${on ? 'bg-white/15' : style.tint}`}>
                <TabIcon className={`h-3.5 w-3.5 ${on ? 'text-white' : ''}`} />
              </span>
              {t.label}
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${on ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="py-24 text-center text-gray-400 text-sm">Loading plans…</div>
      ) : list.length === 0 ? (
        <div className="py-24 text-center text-gray-400 text-sm">No plans yet — click “Restore defaults” or “Add plan”.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((p) => {
            const cost = p.totalCost || componentTotal(p.components)
            const price = p.planType === 'gps_hardware' ? p.priceOneTime : p.priceYearly
            const margin = p.planType === 'gps_hardware' && cost > 0 && price ? price - cost : null
            const typeStyle = PLAN_TYPE_STYLE[p.planType] || PLAN_TYPE_STYLE.membership
            return (
              <div key={p._id} className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col ${p.isActive ? 'border-gray-100' : 'border-dashed border-gray-300 opacity-60'}`}>
                <div className={`h-1 w-full ${typeStyle.bar}`} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${typeStyle.tint}`}>
                        {p.emoji || '📦'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#1A1D29] truncate">{p.name}</h3>
                          {p.tag ? <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFF1EA] text-[#EA580C]">{p.tag}</span> : null}
                        </div>
                        <p className="text-xs text-gray-400 font-medium">{p.key} · {p.vehicleType}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <label className="inline-flex items-center cursor-pointer" title={p.isActive ? 'Active' : 'Inactive'}>
                        <input type="checkbox" checked={p.isActive} onChange={() => toggleActive(p)} className="sr-only peer" />
                        <div className="w-10 h-5.5 h-6 bg-gray-200 peer-checked:bg-[#1BA672] rounded-full relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                      </label>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-[#1B3B6F] tabular-nums">
                      {p.planType === 'gps_hardware' ? inr(p.priceOneTime) : inr(p.priceYearly)}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">
                      {p.planType === 'gps_hardware' ? 'one-time' : `/year${p.priceMonthly ? ` · ${inr(p.priceMonthly)}/mo` : ''}`}
                    </span>
                  </div>

                  {/* Hardware cost sheet summary */}
                  {p.planType === 'gps_hardware' && (
                    <div className="mt-2 rounded-xl bg-[#F5F7FA] px-3 py-2 text-xs font-semibold text-gray-500">
                      Cost ≈ <span className="text-[#1A1D29]">{inr(cost)}</span>
                      {margin != null && <> · Margin <span className={margin >= 0 ? 'text-[#1BA672]' : 'text-red-500'}>{inr(margin)}</span></>}
                      <span className="text-gray-400"> · {p.components?.length || 0} components</span>
                    </div>
                  )}

                  {/* Benefits */}
                  <ul className="mt-3 space-y-1.5 flex-1">
                    {(p.benefits || []).slice(0, 4).map((b, i) => (
                      <li key={i} className="text-[13px] text-gray-600 flex gap-2 items-start">
                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                    {(p.benefits?.length || 0) > 4 && <li className="text-xs text-gray-400 font-semibold pl-6">+{p.benefits.length - 4} more…</li>}
                  </ul>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => openEdit(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#1B3B6F] transition-colors hover:bg-[#EAF0F9]">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => remove(p)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-red-500 transition-colors hover:bg-red-50" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Edit / create modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4 lg:p-8">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 my-4 shadow-xl">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#1B3B6F]/10">
                  {isNew ? <Plus className="h-4 w-4 text-[#1B3B6F]" /> : <Pencil className="h-4 w-4 text-[#1B3B6F]" />}
                </div>
                <h2 className="text-lg font-bold text-[#1A1D29]">{isNew ? 'Add plan' : `Edit — ${editing.name}`}</h2>
              </div>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {isNew && (
                <>
                  <label className="text-xs font-bold text-gray-500 flex flex-col gap-1.5">PLAN TYPE
                    <select value={editing.planType} onChange={(e) => setEditing({ ...editing, planType: e.target.value as PlanType })} className={fieldCls}>
                      <option value="membership">Membership</option>
                      <option value="gps_hardware">GPS Hardware</option>
                      <option value="addon">Add-on</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-gray-500 flex flex-col gap-1.5">KEY (unique, e.g. bike_plus)
                    <input value={editing.key || ''} onChange={(e) => setEditing({ ...editing, key: e.target.value })} className={fieldCls} />
                  </label>
                </>
              )}
              <label className="text-xs font-bold text-gray-500 flex flex-col gap-1.5">NAME
                <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={fieldCls} />
              </label>
              <label className="text-xs font-bold text-gray-500 flex flex-col gap-1.5">VEHICLE
                <select value={editing.vehicleType} onChange={(e) => setEditing({ ...editing, vehicleType: e.target.value as any })} className={fieldCls}>
                  <option value="bike">Bike</option><option value="car">Car</option><option value="any">Any</option>
                </select>
              </label>
              <label className="text-xs font-bold text-gray-500 flex flex-col gap-1.5">EMOJI
                <input value={editing.emoji || ''} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} className={fieldCls} />
              </label>
              <label className="text-xs font-bold text-gray-500 flex flex-col gap-1.5">TAG (e.g. BEST VALUE)
                <input value={editing.tag || ''} onChange={(e) => setEditing({ ...editing, tag: e.target.value })} className={fieldCls} />
              </label>

              {editing.planType === 'gps_hardware' ? (
                <label className="text-xs font-bold text-gray-500 flex flex-col gap-1.5">CUSTOMER PRICE (ONE-TIME ₹)
                  <input type="number" value={editing.priceOneTime ?? 0} onChange={(e) => setEditing({ ...editing, priceOneTime: Number(e.target.value) })} className={fieldCls} />
                </label>
              ) : (
                <>
                  <label className="text-xs font-bold text-gray-500 flex flex-col gap-1.5">PRICE / YEAR (₹)
                    <input type="number" value={editing.priceYearly ?? 0} onChange={(e) => setEditing({ ...editing, priceYearly: Number(e.target.value) })} className={fieldCls} />
                  </label>
                  <label className="text-xs font-bold text-gray-500 flex flex-col gap-1.5">PRICE / MONTH (₹, optional)
                    <input type="number" value={editing.priceMonthly ?? 0} onChange={(e) => setEditing({ ...editing, priceMonthly: Number(e.target.value) })} className={fieldCls} />
                  </label>
                </>
              )}
              <label className="text-xs font-bold text-gray-500 flex flex-col gap-1.5">SORT ORDER
                <input type="number" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} className={fieldCls} />
              </label>
            </div>

            {/* Benefits */}
            <label className="text-xs font-bold text-gray-500 flex flex-col gap-1.5 mt-4">BENEFITS (one per line)
              <textarea rows={5} value={(editing.benefits || []).join('\n')}
                onChange={(e) => setEditing({ ...editing, benefits: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                className={fieldCls} />
            </label>

            {/* Hardware component cost sheet */}
            {editing.planType === 'gps_hardware' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500">COMPONENT COST SHEET (internal — never shown to customers)</span>
                  <button onClick={() => setEditing({ ...editing, components: [...(editing.components || []), { name: '', cost: 0 }] })}
                    className="text-xs font-bold text-[#1B3B6F] hover:underline">+ Add component</button>
                </div>
                <div className="space-y-2">
                  {(editing.components || []).map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={c.name} placeholder="Component / service name"
                        onChange={(e) => { const next = [...(editing.components || [])]; next[i] = { ...next[i], name: e.target.value }; setEditing({ ...editing, components: next }) }}
                        className={`flex-1 ${fieldCls}`} />
                      <div className="relative w-32">
                        <IndianRupee className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="number" value={c.cost}
                          onChange={(e) => { const next = [...(editing.components || [])]; next[i] = { ...next[i], cost: Number(e.target.value) }; setEditing({ ...editing, components: next }) }}
                          className={`w-full pl-7 pr-2 py-2 border border-gray-200 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B3B6F]/15 focus:border-[#1B3B6F]`} />
                      </div>
                      <button onClick={() => setEditing({ ...editing, components: (editing.components || []).filter((_, j) => j !== i) })}
                        className="px-2 rounded-xl text-red-400 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#16305c] to-[#1B3B6F] px-4 py-3 text-sm font-bold text-white shadow-sm">
                  <span>Total cost ≈ {inr(componentTotal(editing.components))}</span>
                  <span className={((editing.priceOneTime || 0) - componentTotal(editing.components)) >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                    Margin {inr((editing.priceOneTime || 0) - componentTotal(editing.components))}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <label className="text-xs font-bold text-gray-500 flex flex-col gap-1.5 mt-4">INTERNAL NOTES (strategy / break-even — never shown to customers)
              <textarea rows={2} value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className={fieldCls} />
            </label>

            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#1A1D29] hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={saveEdit} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B3B6F] text-white text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-[#16305C] disabled:opacity-60 disabled:hover:translate-y-0">
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
