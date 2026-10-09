'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Download, Search, MapPin, List, Phone, Star, User, X, Loader2, Warehouse, CheckCircle2, Clock, XCircle, Users,
  Navigation, Trash2, ShieldCheck, Maximize2, Minimize2, Eye, UserPlus, Copy,
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { toast } from 'sonner'
import { adminGarageAPI, adminGarageStaffAPI } from '@/services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { GarageMap } from '@/components/manager/GarageMap'
import { DAYS, SERVICES, SIZES, STATUS, VEHICLES, GarageStatus, mapsLink, serviceLabel, time12, vehicleLabel, waLink } from '@/components/manager/garageOptions'

// Admin: garages registered on site by field executives (/manager/garage). Shown on
// a map and as a list; the admin opens one to see everything collected at the
// visit and verifies it (pending → active) or marks it inactive.
const ORANGE = '#FF5A1F'
const sel = 'h-10 rounded-lg border border-[#DDE4EC] bg-white px-3 text-[13px] font-medium text-[#334155] outline-none focus:border-[#1B3B6F]'
const thumb = (url?: string, w = 160, h = 160) => (url ? `${url}?tr=w-${w},h-${h},fo-auto` : '')
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
const place = (g: any) => [g.area, g.city].filter(Boolean).join(', ') || g.address

function Pill({ status }: { status: GarageStatus }) {
  const s = STATUS[status] || STATUS.pending
  return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ color: s.fg, background: s.bg }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: s.pin }} />{s.short}</span>
}
function Photo({ url, size = 76 }: { url?: string; size?: number }) {
  return url
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={thumb(url, size * 2, size * 2)} alt="" loading="lazy" className="shrink-0 rounded-lg object-cover" style={{ width: size, height: size }} />
    : <div className="flex shrink-0 items-center justify-center rounded-lg bg-[#EEF2F7] text-[#94A3B8]" style={{ width: size, height: size }}><Warehouse className="h-6 w-6" /></div>
}
const Stars = ({ n }: { n?: number }) => (n ? <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#B45309]"><Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />{n}/5</span> : null)

function csv(rows: any[]) {
  const cols: [string, (g: any) => any][] = [
    ['Code', (g) => g.code], ['Garage', (g) => g.garageName], ['Owner', (g) => g.ownerName], ['WhatsApp', (g) => g.whatsapp], ['Call', (g) => g.callNumber],
    ['Address', (g) => g.address], ['Area', (g) => g.area], ['City', (g) => g.city], ['Lat', (g) => g.location?.lat], ['Lng', (g) => g.location?.lng],
    ['Vehicles', (g) => (g.vehicleTypes || []).map(vehicleLabel).join(' / ')], ['Services', (g) => (g.services || []).map(serviceLabel).join(' / ')],
    ['Open', (g) => g.openTime], ['Close', (g) => g.closeTime], ['Weekly off', (g) => g.weeklyOff], ['Emergency', (g) => (g.emergency ? 'Yes' : 'No')],
    ['Doorstep service', (g) => (g.sendsMechanic ? 'Yes' : 'No')], ['Travel km', (g) => g.travelKm], ['Mechanics', (g) => (g.mechanics || []).length],
    ['UPI', (g) => g.upi], ['GST', (g) => g.gst], ['Staff rating', (g) => g.visit?.rating], ['Status', (g) => g.status],
    ['Visited by', (g) => g.visit?.by || g.staff?.name], ['Staff phone', (g) => g.staff?.phone], ['Registered', (g) => (g.createdAt ? new Date(g.createdAt).toISOString().slice(0, 10) : '')],
  ]
  const q = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const text = [cols.map((c) => q(c[0])).join(','), ...rows.map((g) => cols.map((c) => q(c[1](g))).join(','))].join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }))
  a.download = `garages-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export function GarageManagement() {
  const [rows, setRows] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [f, setF] = useState({ city: '', area: '', vehicle: '', service: '', status: '', search: '' })
  const [sort, setSort] = useState<'newest' | 'name' | 'rating'>('newest')
  const [selId, setSelId] = useState<string | null>(null)
  const [open, setOpen] = useState<any | null>(null)
  const [full, setFull] = useState(false)
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')
  const [staffOpen, setStaffOpen] = useState(false)

  const loadStats = useCallback(() => adminGarageAPI.getStats().then((r) => setStats(r.data?.data)).catch(() => undefined), [])
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => String(v).trim()))
      const r = await adminGarageAPI.getAll(params)
      setRows(r.data?.data || [])
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not load garages') } finally { setLoading(false) }
  }, [f])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])
  useEffect(() => { loadStats() }, [loadStats])

  const sorted = useMemo(() => {
    const a = [...rows]
    if (sort === 'name') a.sort((x, y) => String(x.garageName).localeCompare(String(y.garageName)))
    if (sort === 'rating') a.sort((x, y) => (y.visit?.rating || 0) - (x.visit?.rating || 0))
    return a
  }, [rows, sort])
  const pins = useMemo(() => rows.filter((g) => g.location?.lat != null && g.location?.lng != null).map((g) => ({ id: g._id, lat: g.location.lat, lng: g.location.lng, color: STATUS[g.status as GarageStatus]?.pin || '#F59E0B' })), [rows])
  const selG = rows.find((g) => g._id === selId) || null
  const count = (s: string) => rows.filter((g) => g.status === s).length
  const setFilter = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }))
  const openGarage = (g: any) => { setOpen(g); setNote(g.adminNote || '') }

  const setStatus = async (g: any, status: GarageStatus) => {
    setBusy(status)
    try {
      const r = await adminGarageAPI.setStatus(g._id, status, note)
      const u = r.data?.data
      setRows((list) => list.map((x) => (x._id === g._id ? u : x)))
      setOpen(u)
      toast.success(status === 'active' ? 'Garage verified' : status === 'inactive' ? 'Garage marked inactive' : 'Garage moved back to pending')
      loadStats()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not update the garage') } finally { setBusy('') }
  }
  // Doorstep service = the garage sends a mechanic to the customer. The executive
  // records it at the visit; the admin can correct it here.
  const setDoorstep = async (g: any, yes: boolean) => {
    setBusy('doorstep')
    try {
      const r = await adminGarageAPI.update(g._id, { sendsMechanic: yes })
      const u = r.data?.data
      setRows((list) => list.map((x) => (x._id === g._id ? u : x)))
      setOpen(u)
      toast.success(yes ? 'Doorstep service marked available' : 'Doorstep service marked not available')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not update the garage') } finally { setBusy('') }
  }
  const remove = async (g: any) => {
    if (!window.confirm(`Delete "${g.garageName}" permanently? This cannot be undone.`)) return
    setBusy('delete')
    try {
      await adminGarageAPI.remove(g._id)
      setRows((list) => list.filter((x) => x._id !== g._id)); setOpen(null); setSelId(null)
      toast.success('Garage deleted'); loadStats()
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not delete the garage') } finally { setBusy('') }
  }

  const pct = (n: number) => (stats?.total ? `${Math.round((n / stats.total) * 100)}% of total` : '—')
  const cards = [
    { l: 'Total Garages', n: stats?.total, s: `+${stats?.thisMonth ?? 0} this month`, Icon: Warehouse, fg: '#2563EB', bg: '#EFF4FF' },
    { l: 'Active Garages', n: stats?.active, s: pct(stats?.active || 0), Icon: CheckCircle2, fg: '#16A34A', bg: '#ECFDF3' },
    { l: 'Pending Verification', n: stats?.pending, s: pct(stats?.pending || 0), Icon: Clock, fg: '#D97706', bg: '#FFF7E6' },
    { l: 'Inactive Garages', n: stats?.inactive, s: pct(stats?.inactive || 0), Icon: XCircle, fg: '#DC2626', bg: '#FEF0F0' },
    { l: 'Total Mechanics', n: stats?.mechanics, s: 'Across all garages', Icon: Users, fg: '#7C3AED', bg: '#F3EEFF' },
    { l: 'Avg. Staff Rating', n: stats?.avgRating ? stats.avgRating.toFixed(1) : '—', s: `From ${stats?.ratedCount ?? 0} visits`, Icon: Star, fg: '#2563EB', bg: '#EFF4FF' },
  ]

  const ListCard = ({ g }: { g: any }) => (
    <div onClick={() => setSelId(g._id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelId(g._id)}
      className="flex cursor-pointer gap-3 rounded-xl border bg-white p-3 transition-colors hover:border-[#FFB89C]" style={{ borderColor: selId === g._id ? ORANGE : '#E7ECF3', boxShadow: selId === g._id ? `0 0 0 1px ${ORANGE}` : undefined }}>
      <Photo url={g.photos?.[0]} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <b className="truncate text-[14px] text-[#13203A]">{g.garageName}</b>
          <Pill status={g.status} />
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#64748B]"><Stars n={g.visit?.rating} /><span>{g.code}</span></div>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[#64748B]"><User className="h-3 w-3 shrink-0" />{g.ownerName}</p>
        <p className="flex items-center gap-1 truncate text-[12px] text-[#64748B]"><MapPin className="h-3 w-3 shrink-0" />{place(g)}</p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="truncate text-[11.5px] font-semibold text-[#8A97AB]">{(g.vehicleTypes || []).map(vehicleLabel).join(' · ')}</span>
          <span className="flex shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
            <a href={`tel:+91${g.callNumber || g.whatsapp}`} title="Call" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7ECF3] text-[#16A34A] hover:bg-[#F0FDF4]"><Phone className="h-4 w-4" /></a>
            <a href={waLink(g.whatsapp)} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7ECF3] text-[#16A34A] hover:bg-[#F0FDF4]"><WhatsAppIcon className="h-4 w-4" /></a>
            <button type="button" onClick={() => openGarage(g)} title="View details" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7ECF3] text-[#1B3B6F] hover:bg-[#EFF4FF]"><Eye className="h-4 w-4" /></button>
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6">
      {/* header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-extrabold leading-tight text-[#13203A]">Garage Partners</h1>
          <p className="text-[13.5px] text-[#64748B]">View all registered garages on map or list, manage details, verify, and track performance.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setStaffOpen(true)} className="flex h-10 items-center gap-1.5 rounded-lg px-4 text-[13.5px] font-bold text-white" style={{ background: ORANGE }}><Users className="h-4 w-4" /> Field Staff</button>
          <button type="button" onClick={() => csv(sorted)} disabled={!rows.length} className="flex h-10 items-center gap-1.5 rounded-lg border border-[#DDE4EC] bg-white px-4 text-[13.5px] font-bold text-[#13203A] disabled:opacity-50"><Download className="h-4 w-4" /> Export</button>
        </div>
      </div>

      {/* stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <div key={c.l} className="flex items-center gap-2.5 rounded-xl border border-[#E7ECF3] bg-white p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: c.bg, color: c.fg }}><c.Icon className="h-5 w-5" /></span>
            <div className="min-w-0">
              <span className="block text-[12px] leading-tight text-[#64748B]">{c.l}</span>
              <b className="block text-[22px] leading-tight text-[#13203A]">{c.n ?? '—'}</b>
              <span className="block text-[11.5px] leading-tight text-[#8A97AB]">{c.s}</span>
            </div>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-[#DDE4EC] bg-white">
          {(['map', 'list'] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className="flex h-10 items-center gap-1.5 px-3.5 text-[13.5px] font-bold" style={view === v ? { background: ORANGE, color: '#fff' } : { color: '#334155' }}>
              {v === 'map' ? <MapPin className="h-4 w-4" /> : <List className="h-4 w-4" />}{v === 'map' ? 'Map View' : 'List View'}
            </button>
          ))}
        </div>
        <select className={sel} value={f.city} onChange={setFilter('city')} aria-label="City"><option value="">All Cities</option>{(stats?.cities || []).map((c: string) => <option key={c}>{c}</option>)}</select>
        <select className={sel} value={f.area} onChange={setFilter('area')} aria-label="Area"><option value="">All Areas</option>{(stats?.areas || []).map((c: string) => <option key={c}>{c}</option>)}</select>
        <select className={sel} value={f.vehicle} onChange={setFilter('vehicle')} aria-label="Vehicle type"><option value="">All Vehicle Types</option>{VEHICLES.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}</select>
        <select className={sel} value={f.service} onChange={setFilter('service')} aria-label="Service"><option value="">All Services</option>{SERVICES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
        <select className={sel} value={f.status} onChange={setFilter('status')} aria-label="Status"><option value="">All Status</option>{(Object.keys(STATUS) as GarageStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].short}</option>)}</select>
        <div className="relative ml-auto min-w-[220px] flex-1 sm:max-w-[340px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input className={`${sel} w-full pl-9`} value={f.search} onChange={setFilter('search')} placeholder="Search by garage name, owner, area…" />
        </div>
      </div>

      {view === 'map' ? (
        <div className={full ? 'fixed inset-0 z-[80] bg-white p-3' : 'grid gap-4 xl:grid-cols-[1fr_400px]'}>
          <div className={`relative overflow-hidden rounded-xl border border-[#E7ECF3] ${full ? 'h-full' : 'h-[640px]'}`}>
            <GarageMap pins={pins} selectedId={selId} onSelect={setSelId} className="h-full w-full" />
            <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex flex-wrap items-start gap-2">
              <span className="rounded-lg bg-white px-3 py-2 text-[12.5px] font-semibold text-[#334155] shadow">Showing <b>{rows.length}</b> garages{pins.length < rows.length ? ` · ${rows.length - pins.length} without a map pin` : ''}</span>
              {(['active', 'pending', 'inactive'] as const).map((s) => (
                <span key={s} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-semibold text-[#334155] shadow"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS[s].pin }} />{STATUS[s].short} ({count(s)})</span>
              ))}
              <button type="button" onClick={() => setFull((v) => !v)} className="pointer-events-auto ml-auto flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-bold text-[#13203A] shadow">{full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}{full ? 'Exit Full Screen' : 'Full Screen'}</button>
            </div>
            {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50"><Loader2 className="h-7 w-7 animate-spin text-[#1B3B6F]" /></div>}
            {selG && (
              <div className="absolute left-3 top-[60px] z-10 w-[330px] max-w-[calc(100%-1.5rem)] rounded-xl bg-white p-3.5 shadow-xl">
                <button type="button" onClick={() => setSelId(null)} aria-label="Close" className="absolute right-2 top-2 rounded-full p-1 text-[#94A3B8] hover:bg-[#F1F5F9]"><X className="h-4 w-4" /></button>
                <div className="flex gap-3 pr-5">
                  <Photo url={selG.photos?.[0]} size={84} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5"><b className="text-[15px] text-[#13203A]">{selG.garageName}</b><Pill status={selG.status} /></div>
                    <Stars n={selG.visit?.rating} />
                    <p className="flex items-center gap-1 truncate text-[12.5px] text-[#475569]"><User className="h-3.5 w-3.5 shrink-0" />{selG.ownerName}</p>
                    <p className="flex items-center gap-1 text-[12.5px] text-[#475569]"><WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />+91 {selG.whatsapp}</p>
                    <p className="flex items-center gap-1 truncate text-[12.5px] text-[#475569]"><MapPin className="h-3.5 w-3.5 shrink-0" />{place(selG)}</p>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {(selG.vehicleTypes || []).map((v: string) => <span key={v} className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#334155]">{vehicleLabel(v)}</span>)}
                  {(selG.services || []).slice(0, 2).map((v: string) => <span key={v} className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#334155]">{serviceLabel(v)}</span>)}
                </div>
                <button type="button" onClick={() => openGarage(selG)} className="mt-3 h-10 w-full rounded-lg text-[13.5px] font-bold text-white" style={{ background: ORANGE }}>View Details →</button>
              </div>
            )}
          </div>

          {!full && (
            <div className="flex h-[640px] flex-col rounded-xl border border-[#E7ECF3] bg-[#FAFBFD]">
              <div className="flex items-center justify-between gap-2 border-b border-[#E7ECF3] p-3.5">
                <div><b className="block text-[16px] text-[#13203A]">Garages</b><span className="text-[12.5px] text-[#64748B]">{rows.length} garages found</span></div>
                <label className="flex items-center gap-2 text-[12.5px] text-[#64748B]">Sort by
                  <select className={`${sel} h-9`} value={sort} onChange={(e) => setSort(e.target.value as any)}><option value="newest">Newest</option><option value="name">Name</option><option value="rating">Rating</option></select>
                </label>
              </div>
              <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
                {loading && !rows.length ? <div className="py-16 text-center text-[#64748B]"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
                  : !sorted.length ? <Empty />
                    : sorted.map((g) => <ListCard key={g._id} g={g} />)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E7ECF3] bg-white">
          <table className="w-full min-w-[980px] text-left text-[13px]">
            <thead className="bg-[#F6F8FB] text-[12px] uppercase tracking-wide text-[#64748B]">
              <tr>{['Garage', 'Owner / Contact', 'Location', 'Vehicles', 'Mechanics', 'Rating', 'Visited by', 'Status', ''].map((h) => <th key={h} className="px-3.5 py-3 font-bold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && !rows.length ? <tr><td colSpan={9} className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#64748B]" /></td></tr>
                : !sorted.length ? <tr><td colSpan={9}><Empty /></td></tr>
                  : sorted.map((g) => (
                    <tr key={g._id} className="border-t border-[#EEF2F7] hover:bg-[#FAFBFD]">
                      <td className="px-3.5 py-2.5"><div className="flex items-center gap-2.5"><Photo url={g.photos?.[0]} size={44} /><div><b className="block text-[#13203A]">{g.garageName}</b><span className="text-[12px] text-[#8A97AB]">{g.code} · {fmtDate(g.createdAt)}</span></div></div></td>
                      <td className="px-3.5 py-2.5"><span className="block text-[#13203A]">{g.ownerName}</span><span className="text-[12px] text-[#64748B]">+91 {g.whatsapp}</span></td>
                      <td className="max-w-[220px] px-3.5 py-2.5 text-[#475569]"><span className="line-clamp-2">{place(g)}</span></td>
                      <td className="px-3.5 py-2.5 text-[#475569]">{(g.vehicleTypes || []).map(vehicleLabel).join(', ')}</td>
                      <td className="px-3.5 py-2.5 text-[#475569]">{(g.mechanics || []).length}</td>
                      <td className="px-3.5 py-2.5">{g.visit?.rating ? <Stars n={g.visit.rating} /> : '—'}</td>
                      <td className="px-3.5 py-2.5 text-[#475569]">{g.visit?.by || g.staff?.name || '—'}</td>
                      <td className="px-3.5 py-2.5"><Pill status={g.status} /></td>
                      <td className="px-3.5 py-2.5 text-right"><button type="button" onClick={() => openGarage(g)} className="rounded-lg border border-[#DDE4EC] px-3 py-1.5 text-[12.5px] font-bold text-[#1B3B6F] hover:bg-[#EFF4FF]">View</button></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      <FieldStaffDialog open={staffOpen} onClose={() => setStaffOpen(false)} />

      {/* details */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[92vh] max-w-[760px] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 pr-6 text-[19px]">{open.garageName} <Pill status={open.status} /></DialogTitle>
                <DialogDescription>{open.code} · registered {fmtDate(open.createdAt)} by {open.staff?.name || '—'}{open.staff?.phone ? ` (+91 ${open.staff.phone})` : ''}{open.shopPartner ? ' · now also a Shop Partner (it has been given a job)' : ''}</DialogDescription>
              </DialogHeader>

              {!!open.photos?.length && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {open.photos.map((p: string) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={p} href={p} target="_blank" rel="noopener noreferrer" className="shrink-0"><img src={thumb(p, 480, 320)} alt="Garage" className="h-[150px] w-[225px] rounded-lg object-cover" /></a>
                  ))}
                </div>
              )}

              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Info l="Owner" v={open.ownerName} />
                <Info l="WhatsApp (leads)" v={<a className="font-semibold text-[#16A34A] underline" href={waLink(open.whatsapp)} target="_blank" rel="noopener noreferrer">+91 {open.whatsapp}</a>} />
                <Info l="Call number" v={open.callNumber ? <a className="font-semibold text-[#1B3B6F] underline" href={`tel:+91${open.callNumber}`}>+91 {open.callNumber}</a> : '—'} />
                <Info l="Timing" v={`${time12(open.openTime)} – ${time12(open.closeTime)} · off: ${DAYS.find((d) => d.key === open.weeklyOff)?.label.replace(/ \(.*/, '') || open.weeklyOff}`} />
                <Info wide l="Address" v={<>{open.address}{open.location?.lat != null && <a href={mapsLink(open.location, open.address)} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 font-semibold text-[#1B3B6F] underline"><Navigation className="h-3.5 w-3.5" />Open in Maps</a>}</>} />
                <Info l="Vehicles" v={(open.vehicleTypes || []).map(vehicleLabel).join(', ')} />
                <Info l="Emergency / night" v={open.emergency ? 'Yes' : 'No'} />
                <Info wide l="Services" v={<span className="flex flex-wrap gap-1.5">{(open.services || []).map((s: string) => <span key={s} className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[12px] font-semibold text-[#334155]">{serviceLabel(s)}{s === 'other' && open.otherWork ? `: ${open.otherWork}` : ''}</span>)}</span>} />
                <Info l="Doorstep service (sends a mechanic to the customer)" v={<span className="flex flex-wrap items-center gap-2">{open.sendsMechanic ? `Available${open.travelKm ? ` · up to ${open.travelKm} km` : ''}` : 'Not available — workshop only'}<button type="button" data-doorstep-toggle disabled={!!busy} onClick={() => setDoorstep(open, !open.sendsMechanic)} className="rounded-md border border-[#DDE4EC] px-2 py-0.5 text-[12px] font-bold text-[#1B3B6F] hover:bg-[#EFF4FF] disabled:opacity-60">{busy === 'doorstep' ? 'Saving…' : open.sendsMechanic ? 'Mark not available' : 'Mark available'}</button></span>} />
                <Info l="Parts warranty" v={open.partsWarranty} />
                <Info l="UPI" v={open.upi} />
                <Info l="GST / registration" v={open.gst} />
                <Info l="Running since" v={open.yearsRunning != null ? `${open.yearsRunning} years` : ''} />
                <Info l="Own vehicle for visits" v={open.hasOwnVehicle == null ? '' : open.hasOwnVehicle ? 'Yes' : 'No'} />
                <Info wide l="Usual rates" v={[['Puncture', open.rates?.puncture], ['Battery jump-start', open.rates?.battery], ['General service', open.rates?.service], ['Visit charge', open.rates?.visit]].filter((r) => r[1] != null).map((r) => `${r[0]} ₹${r[1]}`).join(' · ')} />
              </div>

              <div>
                <b className="mb-2 block text-[14px] text-[#13203A]">Mechanics ({(open.mechanics || []).length})</b>
                {!(open.mechanics || []).length ? <p className="text-[13px] text-[#8A97AB]">No mechanic details were added.</p> : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {open.mechanics.map((m: any, i: number) => (
                      <div key={i} className="flex gap-3 rounded-lg border border-[#E7ECF3] p-2.5">
                        <Photo url={m.photo} size={56} />
                        <div className="min-w-0 text-[12.5px] text-[#475569]">
                          <b className="block truncate text-[13.5px] text-[#13203A]">{m.name}</b>
                          <a href={`tel:+91${m.phone}`} className="font-semibold text-[#1B3B6F] underline">+91 {m.phone}</a>
                          <p className="truncate">{[m.vehicle, m.skills].filter(Boolean).join(' · ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-[#F6F8FB] p-3">
                <b className="mb-2 block text-[14px] text-[#13203A]">Field visit (internal)</b>
                <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  <Info l="Visited on" v={fmtDate(open.visit?.date)} />
                  <Info l="Visited by" v={open.visit?.by || open.staff?.name} />
                  <Info l="Garage size" v={SIZES.find((s) => s.key === open.visit?.garageSize)?.label} />
                  <Info l="Mechanics seen" v={open.visit?.mechanicCount} />
                  <Info l="Trust rating" v={open.visit?.rating ? <Stars n={open.visit.rating} /> : ''} />
                  <Info l="Owner on the offer" v={open.visit?.offerNote} />
                  <Info wide l="Notes" v={open.visit?.notes} />
                  {open.ownerIdPhoto && <Info wide l="Owner ID (internal — do not share)" v={<a href={open.ownerIdPhoto} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1B3B6F] underline">View ID photo</a>} />}
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-[12.5px] font-semibold text-[#475569]">Admin note</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} placeholder="Saved when you change the status" className="w-full rounded-lg border border-[#DDE4EC] p-2.5 text-[13.5px] outline-none focus:border-[#1B3B6F]" />
              </label>

              <div className="flex flex-wrap items-center gap-2 border-t border-[#EEF2F7] pt-3">
                {open.status !== 'active' && <button type="button" disabled={!!busy} onClick={() => setStatus(open, 'active')} className="flex h-10 items-center gap-1.5 rounded-lg bg-[#16A34A] px-4 text-[13.5px] font-bold text-white disabled:opacity-60">{busy === 'active' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Verify &amp; Activate</button>}
                {open.status !== 'inactive' && <button type="button" disabled={!!busy} onClick={() => setStatus(open, 'inactive')} className="flex h-10 items-center gap-1.5 rounded-lg border border-[#FECACA] bg-white px-4 text-[13.5px] font-bold text-[#B91C1C] disabled:opacity-60">{busy === 'inactive' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Mark Inactive</button>}
                {open.status !== 'pending' && <button type="button" disabled={!!busy} onClick={() => setStatus(open, 'pending')} className="flex h-10 items-center gap-1.5 rounded-lg border border-[#DDE4EC] bg-white px-4 text-[13.5px] font-bold text-[#334155] disabled:opacity-60">{busy === 'pending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />} Back to Pending</button>}
                <button type="button" disabled={!!busy} onClick={() => remove(open)} className="ml-auto flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold text-[#B91C1C] hover:bg-[#FEF2F2] disabled:opacity-60"><Trash2 className="h-4 w-4" /> Delete</button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

const Empty = () => (
  <div className="px-4 py-14 text-center">
    <Warehouse className="mx-auto mb-2 h-9 w-9 text-[#CBD5E1]" />
    <b className="block text-[14.5px] text-[#334155]">No garages found</b>
    <p className="text-[13px] text-[#8A97AB]">Garages registered by your field staff at /manager/garage appear here. Add staff with the Field Staff button.</p>
  </div>
)

function Info({ l, v, wide }: { l: string; v: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <span className="block text-[11.5px] font-semibold uppercase tracking-wide text-[#8A97AB]">{l}</span>
      <div className="text-[13.5px] text-[#13203A]">{v === '' || v == null ? '—' : v}</div>
    </div>
  )
}

// Field staff = the people who register garages at /manager/garage. Only an admin
// can create them (here); each logs in at /manager/login with an OTP on this number.
function FieldStaffDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/manager/login` : '/manager/login'

  useEffect(() => {
    if (!open) return
    setLoading(true)
    adminGarageStaffAPI.getAll().then((r) => setRows(r.data?.data || [])).catch((e: any) => toast.error(e?.response?.data?.message || 'Could not load staff')).finally(() => setLoading(false))
  }, [open])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) return toast.error('Enter the staff member\'s name')
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error('Enter a valid 10-digit mobile number')
    setSaving(true)
    try {
      const r = await adminGarageStaffAPI.create({ name: name.trim(), phone })
      setRows((x) => [r.data.data, ...x]); setName(''); setPhone('')
      toast.success(r.data?.message || 'Staff added')
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Could not add staff') } finally { setSaving(false) }
  }
  const toggle = async (u: any) => {
    setBusyId(u.id)
    try {
      const r = await adminGarageStaffAPI.update(u.id, { isActive: !u.isActive })
      setRows((x) => x.map((y) => (y.id === u.id ? r.data.data : y)))
      toast.success(r.data?.data?.isActive ? `${u.name} can log in again` : `${u.name}'s login is switched off`)
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Could not update staff') } finally { setBusyId('') }
  }
  // somebody added by mistake / never used: the login goes away and the number is free again
  const removeStaff = async (u: any) => {
    if (!window.confirm(`Remove ${u.name} (+91 ${u.phone}) from field staff?\n\nThe login is deleted permanently and this number becomes free to use again. This cannot be undone.`)) return
    setBusyId(u.id)
    try {
      const r = await adminGarageStaffAPI.remove(u.id)
      setRows((x) => x.filter((y) => y.id !== u.id))
      toast.success(r.data?.message || `${u.name} removed`)
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Could not remove staff') } finally { setBusyId('') }
  }
  const copy = () => navigator.clipboard?.writeText(loginUrl).then(() => toast.success('Login link copied')).catch(() => undefined)
  const inputCls = 'h-10 w-full rounded-lg border border-[#DDE4EC] bg-white px-3 text-[13.5px] outline-none focus:border-[#1B3B6F]'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-[680px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[19px]">Field Staff</DialogTitle>
          <DialogDescription>Staff register garages from their phone. Only you can add them — they cannot sign up themselves. Each logs in with an OTP on the number you enter here.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#F6F8FB] px-3 py-2.5 text-[13px] text-[#475569]">
          Staff login link: <b className="break-all text-[#13203A]">{loginUrl}</b>
          <button type="button" onClick={copy} className="ml-auto flex items-center gap-1 rounded-md border border-[#DDE4EC] bg-white px-2.5 py-1 text-[12.5px] font-bold text-[#1B3B6F]"><Copy className="h-3.5 w-3.5" /> Copy</button>
        </div>

        <form onSubmit={add} className="grid gap-2.5 rounded-lg border border-[#E7ECF3] p-3 sm:grid-cols-[1fr_190px_auto] sm:items-end">
          <label className="block"><span className="mb-1 block text-[12.5px] font-semibold text-[#475569]">Staff name</span><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="e.g. Rakesh Yadav" /></label>
          <label className="block"><span className="mb-1 block text-[12.5px] font-semibold text-[#475569]">Mobile number (for OTP)</span><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="10-digit number" /></label>
          <button type="submit" disabled={saving} className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-[13.5px] font-bold text-white disabled:opacity-60" style={{ background: ORANGE }}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add Staff</button>
        </form>

        <div className="overflow-x-auto rounded-lg border border-[#E7ECF3]">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead className="bg-[#F6F8FB] text-[11.5px] uppercase tracking-wide text-[#64748B]">
              <tr>{['Staff', 'Garages', 'Last login', 'Login', ''].map((h) => <th key={h} className="px-3 py-2.5 font-bold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-[#64748B]" /></td></tr>
                : !rows.length ? <tr><td colSpan={5} className="px-3 py-10 text-center text-[#8A97AB]">No field staff yet. Add the first one above.</td></tr>
                  : rows.map((u) => (
                    <tr key={u.id} className="border-t border-[#EEF2F7]">
                      <td className="px-3 py-2.5"><b className="block text-[#13203A]">{u.name}</b><span className="text-[12px] text-[#64748B]">+91 {u.phone}</span></td>
                      <td className="px-3 py-2.5 text-[#475569]"><b className="text-[#13203A]">{u.garages?.total || 0}</b> total<span className="block text-[12px]">{u.garages?.active || 0} active · {u.garages?.pending || 0} pending</span></td>
                      <td className="px-3 py-2.5 text-[#475569]">{u.lastLogin ? fmtDate(u.lastLogin) : 'Never'}</td>
                      <td className="px-3 py-2.5"><span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={u.isActive ? { color: '#15803D', background: '#DCFCE7' } : { color: '#B91C1C', background: '#FEE2E2' }}>{u.isActive ? 'Allowed' : 'Switched off'}</span></td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <button type="button" disabled={busyId === u.id} onClick={() => toggle(u)} className="rounded-lg border border-[#DDE4EC] px-3 py-1.5 text-[12.5px] font-bold text-[#334155] hover:bg-[#F6F8FB] disabled:opacity-60">{busyId === u.id ? '…' : u.isActive ? 'Switch off' : 'Allow login'}</button>
                        {/* one who registered garages stays (the garages point at them) — only the login can be switched off */}
                        {(u.garages?.total || 0) === 0 && (
                          <button type="button" data-staff-remove={u.phone} disabled={busyId === u.id} onClick={() => removeStaff(u)} title="Remove this staff member — the number becomes free again" className="ml-1.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 align-middle text-[12.5px] font-bold text-[#B91C1C] hover:bg-[#FEF2F2] disabled:opacity-60"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
