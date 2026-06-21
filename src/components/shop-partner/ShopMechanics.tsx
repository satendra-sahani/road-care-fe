'use client'

import { useEffect, useState } from 'react'
import { shopAPI } from '@/services/api'
import { toast } from 'sonner'
import {
  Loader2, Plus, Phone, MapPin, Trash2, Star, ShieldCheck, AlertTriangle,
  Users, X, Check,
} from 'lucide-react'

const DIST = '#D97706', DIST_50 = '#FEF3E2', DIST_2 = '#B45309', NAVY = '#1B3B6F', GREEN = '#15936B', STAR = '#F5A623'

interface Mech {
  _id?: string; name?: string; fullName?: string; phone?: string; specialization?: string
  isActive?: boolean; rating?: number; jobsDone?: number; isVerified?: boolean
  user?: { fullName?: string; phone?: string }
  kind?: 'own' | 'platform'
}

function Kpi({ bg, fg, path, val, label }: { bg: string; fg: string; path: string; val: string; label: string }) {
  return (
    <div className="bg-white border border-[#E7ECF3] rounded-2xl p-[18px] shadow-sm">
      <div className="h-[42px] w-[42px] rounded-xl flex items-center justify-center mb-3" style={{ background: bg, color: fg }}>
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
      </div>
      <div className="text-[27px] font-extrabold tracking-tight text-[#13203A] leading-none">{val}</div>
      <div className="text-[13px] text-[#7B8AA3] mt-1.5">{label}</div>
    </div>
  )
}

export function ShopMechanics() {
  const [mechs, setMechs] = useState<Mech[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'verified'>('all')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', specialization: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [p, a] = await Promise.all([
        shopAPI.getProfile().catch(() => null),
        shopAPI.getAssignedMechanics().catch(() => null),
      ])
      const own: Mech[] = ((p?.data?.data?.mechanics) || []).map((m: any) => ({ ...m, kind: 'own' as const }))
      const platRaw = a?.data?.data?.mechanics || a?.data?.data || []
      const plat: Mech[] = (Array.isArray(platRaw) ? platRaw : []).map((m: any) => ({ ...m, kind: 'platform' as const }))
      setMechs([...own, ...plat])
    } catch { toast.error('Could not load mechanics') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error('Name and phone are required'); return }
    setSaving(true)
    try {
      const r = await shopAPI.addMechanic({ name: form.name.trim(), phone: form.phone.trim(), specialization: form.specialization.trim() || undefined })
      if (r.data?.success) { toast.success('Mechanic added'); setAdding(false); setForm({ name: '', phone: '', specialization: '' }); load() }
      else toast.error(r.data?.message || 'Could not add')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Could not add mechanic') } finally { setSaving(false) }
  }

  const remove = async (m: Mech) => {
    if (m.kind !== 'own' || !m._id) { toast.error('Platform mechanics are managed by admin'); return }
    if (!confirm(`Remove ${m.name}?`)) return
    try { await shopAPI.removeMechanic(m._id); toast.success('Removed'); load() }
    catch (e: any) { toast.error(e.response?.data?.message || 'Could not remove') }
  }

  if (loading) return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>

  const nm = (m: Mech) => m.name || m.fullName || m.user?.fullName || 'Mechanic'
  const isActive = (m: Mech) => m.isActive !== false
  const shown = mechs.filter((m) => filter === 'all' || (filter === 'active' && isActive(m)) || (filter === 'verified' && m.isVerified))

  const total = mechs.length
  const online = mechs.filter(isActive).length
  const verified = mechs.filter((m) => m.isVerified).length
  const rated = mechs.filter((m) => m.rating)
  const avg = rated.length ? (rated.reduce((s, m) => s + (m.rating || 0), 0) / rated.length).toFixed(1) : '—'

  return (
    <div className="p-4 md:p-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-[18px]">
        <Kpi bg={DIST_50} fg={DIST_2} path="M9 8m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M3 21a6 6 0 0 1 12 0" val={String(total)} label="Total mechanics" />
        <Kpi bg="#E7F6EF" fg={GREEN} path="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" val={String(online)} label="Active now" />
        <Kpi bg="#FFF7E6" fg={STAR} path="M12 2l2.9 6.3L22 9.3l-5 4.7 1.2 6.8L12 17.6 5.8 20.8 7 14 2 9.3l7.1-1z" val={String(avg)} label="Avg. rating" />
        <Kpi bg={DIST_50} fg={DIST_2} path="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" val={String(verified)} label="Verified" />
      </div>

      {/* Filters + Add */}
      <div className="flex gap-2.5 flex-wrap mb-4 items-center">
        {(['all', 'active', 'verified'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-[15px] py-2.5 rounded-full text-[13px] font-bold border capitalize transition ${filter === f ? 'text-white border-transparent' : 'bg-white text-[#475569] border-[#E7ECF3]'}`}
            style={filter === f ? { background: DIST } : {}}>{f}</button>
        ))}
        <button onClick={() => setAdding(true)} className="ml-auto inline-flex items-center gap-2 text-white font-bold text-[14px] rounded-[11px] px-[18px] py-[11px]" style={{ background: DIST }}>
          <Plus className="h-[17px] w-[17px]" /> Add mechanic
        </button>
      </div>

      {/* Grid of mcards */}
      {!shown.length ? (
        <div className="bg-white border border-[#E7ECF3] rounded-2xl py-14 text-center text-[#7B8AA3]">
          <Users className="h-12 w-12 mx-auto mb-3 text-[#E7ECF3]" />
          <p className="text-sm">No mechanics yet. Add your shop staff to start accepting jobs.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((m, i) => {
            const active = isActive(m)
            return (
              <div key={m._id || i} className="bg-white border border-[#E7ECF3] rounded-2xl p-[18px] shadow-sm">
                <div className="flex items-center gap-3 mb-3.5">
                  <div className="relative h-12 w-12 rounded-[13px] flex items-center justify-center text-white font-extrabold text-[17px] shrink-0" style={{ background: `linear-gradient(135deg, ${NAVY}, #2A5298)` }}>
                    {nm(m).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 h-[13px] w-[13px] rounded-full border-[2.5px] border-white" style={{ background: active ? '#22C55E' : '#94A3B8' }} />
                  </div>
                  <div className="min-w-0">
                    <b className="font-extrabold text-[15px] flex items-center gap-1.5 text-[#13203A]"><span className="truncate">{nm(m)}</span>{m.isVerified && <Check className="h-[15px] w-[15px] text-[#15936B] shrink-0" />}</b>
                    <span className="text-[12px] text-[#7B8AA3]">{m.specialization || 'Mechanic'}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap mb-3.5">
                  <span className="text-[11px] font-bold px-2.5 py-[5px] rounded-lg bg-[#F6F8FB] inline-flex items-center gap-1.5" style={{ color: active ? GREEN : '#7B8AA3' }}><Star className="h-3 w-3" />{active ? 'Active' : 'Inactive'}</span>
                  {m.rating ? <span className="text-[11px] font-bold px-2.5 py-[5px] rounded-lg bg-[#F6F8FB] text-[#475569] inline-flex items-center gap-1.5"><Star className="h-3 w-3" />{Number(m.rating).toFixed(1)}</span> : null}
                  {m.isVerified
                    ? <span className="text-[11px] font-bold px-2.5 py-[5px] rounded-lg bg-[#F6F8FB] inline-flex items-center gap-1.5" style={{ color: GREEN }}><ShieldCheck className="h-3 w-3" />Verified</span>
                    : <span className="text-[11px] font-bold px-2.5 py-[5px] rounded-lg bg-[#F6F8FB] inline-flex items-center gap-1.5" style={{ color: DIST }}><AlertTriangle className="h-3 w-3" />Pending</span>}
                </div>

                <div className="flex justify-between py-3 border-t border-b border-[#EEF1F6] mb-3.5">
                  <div className="text-center"><b className="block font-extrabold text-[16px] text-[#13203A]">{m.jobsDone ?? 0}</b><span className="text-[10.5px] text-[#7B8AA3]">Jobs done</span></div>
                  <div className="text-center"><b className="block font-extrabold text-[16px] text-[#13203A]">★{m.rating ? Number(m.rating).toFixed(1) : '—'}</b><span className="text-[10.5px] text-[#7B8AA3]">Rating</span></div>
                  <div className="text-center"><b className="block font-extrabold text-[16px] text-[#13203A]">{m.kind === 'own' ? 'Staff' : 'Platform'}</b><span className="text-[10.5px] text-[#7B8AA3]">Type</span></div>
                </div>

                <div className="flex gap-2">
                  <a href={`tel:${m.phone || m.user?.phone || ''}`} className="flex-1 border border-[#E7ECF3] bg-white rounded-[9px] py-2.5 font-bold text-[12.5px] text-[#475569] flex items-center justify-center gap-1.5 hover:border-[#D97706] hover:text-[#D97706]"><Phone className="h-3.5 w-3.5" />Call</a>
                  <button className="flex-1 border border-[#E7ECF3] bg-white rounded-[9px] py-2.5 font-bold text-[12.5px] text-[#475569] flex items-center justify-center gap-1.5 hover:border-[#D97706] hover:text-[#D97706]"><MapPin className="h-3.5 w-3.5" />Track</button>
                  {m.kind === 'own' && (
                    <button onClick={() => remove(m)} className="flex-1 rounded-[9px] py-2.5 font-bold text-[12.5px] text-white flex items-center justify-center gap-1.5" style={{ background: DIST }}><Trash2 className="h-3.5 w-3.5" />Remove</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add mechanic modal */}
      {adding && (
        <div className="fixed inset-0 z-[80] bg-[#0F2547]/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setAdding(false) }}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-[#13203A]">Add mechanic</h3>
              <button onClick={() => setAdding(false)} className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#7B8AA3]"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name *" className="w-full h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Phone (10 digits) *" inputMode="numeric" className="w-full h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
              <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Specialization (e.g. Engine, AC)" className="w-full h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
            </div>
            <button onClick={add} disabled={saving} className="w-full h-11 rounded-xl text-white font-bold mt-4 inline-flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: DIST }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add mechanic
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
