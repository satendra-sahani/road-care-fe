'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X, MapPin, Star, Clock, Phone, MessageCircle, Navigation, ArrowRight, ExternalLink, List, Map as MapIcon, Check, Loader2, Layers, Plus, Minus,
  LocateFixed, Store, User, Wrench, SlidersHorizontal, BadgeCheck, ChevronDown, Home,
} from 'lucide-react'
import type { ServiceRequest } from '@/store/slices/serviceRequestSlice'
import type { Mechanic } from '@/store/slices/mechanicSlice'
import { loadGoogleMaps, googleMapsFailed } from '@/lib/googleMaps'
import { initialsOf, kmBetween, vehicleIconFor, vehicleName } from './serviceRequestUi'

// "Assign Mechanic / Garage" — pick who does a service request.
//  • Garages  = shop partners + the garages our field staff registered (those become
//               shop partners with their first job), nearest first, with their own mechanics
//  • Mechanics = independent platform mechanics
// A map shows the customer, the search radius and the numbered candidates.
// Assigning calls the same APIs the old dialog used.

type Pt = { lat: number; lng: number }
type Item = {
  id: string; kind: 'garage' | 'mechanic'; name: string; photo?: string; verified: boolean
  rating: number; ratings: number; place: string; pt: Pt | null; km: number | null
  open: boolean | null; hours: string; status: 'available' | 'busy' | 'closed' | 'offline'
  chips: string[]; vehicles: string[]; phone?: string; raw: any
  // field = registered by our field staff, not a shop partner yet; doorstep = sends a mechanic to the customer (null = not recorded)
  field: boolean; fieldBy: string; pending: boolean; doorstep: boolean | null
}

const ORANGE = '#FF5A1F'
const NAVY = '#16305C'
const to12 = (t?: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); if (!m) return ''; const h = +m[1]; return `${h % 12 || 12}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}` }
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const isOpenNow = (h?: { open?: string; close?: string; workingDays?: string[] }): boolean | null => {
  if (!h?.open || !h?.close) return null
  const now = new Date()
  if (h.workingDays?.length && !h.workingDays.includes(DAYS[now.getDay()])) return false
  const mins = (t: string) => { const [a, b] = t.split(':').map(Number); return a * 60 + (b || 0) }
  const n = now.getHours() * 60 + now.getMinutes()
  return n >= mins(h.open) && n < mins(h.close)
}
const vehicleKind = (t?: string) => { const s = String(t || '').toLowerCase(); return /scoot/.test(s) ? 'scooter' : /bike|motor|two/.test(s) ? 'bike' : /truck|bus|tempo/.test(s) ? 'truck' : /car|suv|sedan|hatch/.test(s) ? 'car' : '' }
const norm = (s: string) => s.toLowerCase().replace(/service|repair|system|replacement|work|[^a-z]/g, '')
const STATUS = {
  available: { label: 'Available Now', fg: '#15803D', bg: '#DCFCE7', dot: '#16A34A' },
  busy: { label: 'Busy', fg: '#B45309', bg: '#FEF3C7', dot: '#F59E0B' },
  closed: { label: 'Closed', fg: '#B91C1C', bg: '#FEE2E2', dot: '#DC2626' },
  offline: { label: 'Offline', fg: '#475569', bg: '#E2E8F0', dot: '#64748B' },
} as const
const numPin = (n: number | string, color: string, big: boolean) => {
  const s = big ? 44 : 36
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24"><path fill="${color}" stroke="#fff" stroke-width="1.2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><text x="12" y="12.2" text-anchor="middle" font-family="Arial,sans-serif" font-size="7.5" font-weight="700" fill="#fff">${n}</text></svg>`
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, s }
}
const sel = 'h-11 appearance-none rounded-xl border border-[#E3E8EF] bg-white pl-10 pr-8 text-[13.5px] font-medium text-[#1F2937] outline-none focus:border-[#16305C]'

/** where a written address is, roughly — Google first (same key as the map), OpenStreetMap otherwise */
const geocodeOne = async (q: string): Promise<Pt | null> => {
  try {
    const g = await loadGoogleMaps()
    const Geocoder = g.Geocoder || (g.importLibrary ? (await g.importLibrary('geocoding'))?.Geocoder : null)
    if (Geocoder) {
      const res: any = await Promise.race([
        new Geocoder().geocode({ address: q, componentRestrictions: { country: 'IN' } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
      ])
      const r = res?.results?.[0]
      // "India" or a whole state is not a place to measure from
      const coarse = (r?.types || []).some((t: string) => ['country', 'administrative_area_level_1'].includes(t))
      if (r?.geometry?.location && !coarse) return { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() }
    }
  } catch { /* fall through */ }
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=in&limit=1`)
    const h = (await r.json())?.[0]
    if (h && isFinite(parseFloat(h.lat)) && !['state', 'country'].includes(h.addresstype)) return { lat: parseFloat(h.lat), lng: parseFloat(h.lon) }
  } catch { /* no network */ }
  return null
}
/** the full address first, then simpler forms of it (village + state, village) */
const geocodeAddress = async (queries: string[]): Promise<Pt | null> => {
  for (const q of queries) { const p = await geocodeOne(q); if (p) return p }
  return null
}

export function AssignDialog({
  open, request, mechanics, shops, shopsLoading, displayId, onClose, onAssignShop, onAssignMechanic,
}: {
  open: boolean
  request: ServiceRequest | null
  mechanics: Mechanic[]
  shops: any[]
  shopsLoading: boolean
  displayId: (r: ServiceRequest) => string
  onClose: () => void
  onAssignShop: (shopId: string) => Promise<boolean>
  onAssignMechanic: (mechanicId: string) => Promise<boolean> | boolean
}) {
  const [kind, setKind] = useState<'garage' | 'mechanic'>('garage')
  const [view, setView] = useState<'list' | 'map'>('list')
  const [sort, setSort] = useState<'nearest' | 'rating' | 'jobs'>('nearest')
  const [vehicle, setVehicle] = useState<'any' | 'match'>('any')
  const [service, setService] = useState<'any' | 'match'>('any')
  const [avail, setAvail] = useState<'any' | 'available'>('any')
  const [minRating, setMinRating] = useState(0)
  const [doorstep, setDoorstep] = useState<'any' | 'yes'>('any') // garages: only those that send a mechanic to the customer
  const [radius, setRadius] = useState(10) // km; 0 = any distance
  const [showPins, setShowPins] = useState(true)
  const [selId, setSelId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const exact: Pt | null = request?.location?.coordinates?.latitude != null && request?.location?.coordinates?.longitude != null
    ? { lat: request.location.coordinates.latitude, lng: request.location.coordinates.longitude } : null
  // No pin on the request (phone / old bookings): place the customer from the
  // written address so distances can still be shown — marked as approximate.
  const [approx, setApprox] = useState<Pt | null>(null)
  const addrText = [request?.location?.address, request?.location?.city, request?.location?.state, request?.location?.pincode]
    .map((x) => String(x || '').trim()).filter((x, i, a) => x && a.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i).join(', ')
  useEffect(() => {
    setApprox(null)
    if (!open || exact || addrText.length < 4) return
    let off = false
    const first = String(request?.location?.address || '').split(',')[0].trim()
    const state = String(request?.location?.state || '').trim() || 'Uttar Pradesh'
    const queries = [addrText, first.length > 2 ? `${first}, ${state}` : ''].filter((q, i, all) => q && all.indexOf(q) === i)
    geocodeAddress(queries).then((p) => { if (!off && p) setApprox(p) })
    return () => { off = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request?._id, addrText, exact?.lat])
  const cust: Pt | null = exact || approx
  const approxCust = !exact && !!approx
  const reqKind = vehicleKind(request?.vehicle?.type)
  const reqService = request?.serviceType || ''

  // fresh state every time the dialog opens for a request
  useEffect(() => {
    if (!open) return
    setKind('garage'); setView('list'); setSort('nearest'); setVehicle('any'); setService('any'); setAvail('any'); setMinRating(0); setDoorstep('any'); setRadius(10)
    setSelId(null); setConfirmId(null); setBusyId(null)
  }, [open, request?._id])
  useEffect(() => { if (!confirmId) return; const t = setTimeout(() => setConfirmId(null), 4000); return () => clearTimeout(t) }, [confirmId])

  const all: Item[] = useMemo(() => {
    const c = cust ? { latitude: cust.lat, longitude: cust.lng } : null
    if (kind === 'garage') {
      return (shops || []).map((s: any) => {
        const co = s.address?.coordinates
        const pt = co?.latitude != null && co?.longitude != null ? { lat: co.latitude, lng: co.longitude } : null
        const openNow = isOpenNow(s.operatingHours)
        return {
          id: s._id, kind: 'garage' as const, name: s.shopName || 'Garage', photo: s.shopImages?.[0]?.url || s.logo || undefined, verified: !!s.isVerified,
          rating: s.rating || 0, ratings: s.totalRatings || 0, place: [s.address?.area || s.address?.street, s.address?.city].filter(Boolean).join(', ') || s.address?.city || '—',
          pt, km: pt && c ? kmBetween(c, { latitude: pt.lat, longitude: pt.lng }) : null,
          open: openNow, hours: s.operatingHours?.open ? `${to12(s.operatingHours.open)} – ${to12(s.operatingHours.close)}` : '',
          status: s.isAvailable === false ? 'offline' as const : openNow === false ? 'closed' as const : 'available' as const,
          chips: s.specializations || [], vehicles: s.vehicleTypes || [], phone: s.shopPhone || s.user?.phone, raw: s,
          field: s.source === 'field', fieldBy: s.fieldStaff || '', pending: s.source === 'field' && s.fieldStatus !== 'active', doorstep: typeof s.doorstepService === 'boolean' ? s.doorstepService : null,
        }
      })
    }
    return (mechanics || []).map((m) => {
      const pt = m.currentLocation?.latitude != null && m.currentLocation?.longitude != null ? { lat: m.currentLocation.latitude, lng: m.currentLocation.longitude } : null
      return {
        id: m._id, kind: 'mechanic' as const, name: m.name || 'Mechanic', photo: m.kyc?.photo || undefined, verified: !!m.isVerified,
        rating: m.rating || 0, ratings: m.completedServices || 0, place: [m.location, m.city].filter(Boolean).join(', ') || '—',
        pt, km: pt && c ? kmBetween(c, { latitude: pt.lat, longitude: pt.lng }) : null,
        open: null, hours: m.experience ? `${m.experience} experience` : '',
        status: m.availability === 'available' ? 'available' as const : m.availability === 'busy' ? 'busy' as const : 'offline' as const,
        chips: m.specializations || [], vehicles: m.vehicleTypes || [], phone: m.phone, raw: m,
        field: false, fieldBy: '', pending: false, doorstep: null,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, shops, mechanics, cust?.lat, cust?.lng])

  const matchVehicle = (it: Item) => !reqKind || !it.vehicles.length || it.vehicles.some((v) => vehicleKind(v) === reqKind)
  const matchService = (it: Item) => { const want = norm(reqService); return !want || !it.chips.length || it.chips.some((c) => { const n = norm(c); return n.includes(want) || want.includes(n) }) }
  // every filter except the radius
  const passes = (it: Item) => (vehicle === 'any' || matchVehicle(it)) && (service === 'any' || matchService(it)) && (avail === 'any' || it.status === 'available') && it.rating >= minRating && (doorstep === 'any' || it.kind !== 'garage' || it.doorstep === true)
  const items = useMemo(() => {
    let a = all.filter(passes)
    // the radius only drops candidates KNOWN to be farther; ones without a location stay (listed last)
    if (radius > 0 && cust) a = a.filter((it) => it.km == null || it.km <= radius)
    const by = { nearest: (x: Item, y: Item) => (x.km ?? 1e9) - (y.km ?? 1e9), rating: (x: Item, y: Item) => y.rating - x.rating || y.ratings - x.ratings, jobs: (x: Item, y: Item) => (y.raw.totalJobsCompleted ?? y.ratings) - (x.raw.totalJobsCompleted ?? x.ratings) }
    return a.sort(by[sort]).slice(0, 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, vehicle, service, avail, minRating, doorstep, radius, sort, cust?.lat])
  // candidates that match but are only hidden by the radius — a garage 30 km away is still worth knowing about
  const farther = radius > 0 && cust ? all.filter((it) => it.km != null && it.km > radius && passes(it)).length : 0
  const selected = items.find((x) => x.id === selId) || null
  const filtersOn = vehicle !== 'any' || service !== 'any' || avail !== 'any' || minRating > 0 || doorstep !== 'any'
  const clearFilters = () => { setVehicle('any'); setService('any'); setAvail('any'); setMinRating(0); setDoorstep('any') }

  const assign = async (it: Item) => {
    if (busyId) return
    if (confirmId !== it.id) { setConfirmId(it.id); setSelId(it.id); return }
    setBusyId(it.id); setConfirmId(null)
    try { await (it.kind === 'garage' ? onAssignShop(it.id) : onAssignMechanic(it.id)) } finally { setBusyId(null) }
  }

  // ── map ──
  const [engine, setEngine] = useState<'loading' | 'google' | 'none'>('loading')
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap')
  const el = useRef<HTMLDivElement | null>(null)
  const map = useRef<any>(null)
  const layers = useRef<any[]>([])
  const fitted = useRef('')
  const pick = useRef(setSelId)
  pick.current = setSelId

  useEffect(() => {
    if (!open) return
    let off = false
    loadGoogleMaps().then(() => { if (!off) setEngine(googleMapsFailed() ? 'none' : 'google') }).catch(() => { if (!off) setEngine('none') })
    return () => { off = true }
  }, [open])
  useEffect(() => {
    if (!open || engine !== 'google' || !el.current) return
    const g = (window as any).google.maps
    map.current = new g.Map(el.current, { center: cust || { lat: 22.6, lng: 79 }, zoom: cust ? 12 : 5, disableDefaultUI: true, gestureHandling: 'greedy', clickableIcons: false, keyboardShortcuts: false })
    fitted.current = ''
    return () => { layers.current.forEach((x) => x.setMap(null)); layers.current = []; map.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, engine, request?._id, view])
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    if (!open || engine !== 'google' || !g || !m) return
    layers.current.forEach((x) => x.setMap(null)); layers.current = []
    m.setMapTypeId(mapType)
    const b = new g.LatLngBounds()
    if (cust) {
      if (radius > 0) {
        const circle = new g.Circle({ map: m, center: cust, radius: radius * 1000, strokeColor: '#2563EB', strokeOpacity: 0.9, strokeWeight: 1.5, fillColor: '#3B82F6', fillOpacity: 0.07, clickable: false })
        layers.current.push(circle); b.union(circle.getBounds())
      }
      layers.current.push(new g.Marker({ map: m, position: cust, zIndex: 900, title: 'Customer', icon: { path: g.SymbolPath.CIRCLE, scale: 9, fillColor: '#FFFFFF', fillOpacity: 1, strokeColor: '#DC2626', strokeWeight: 5, labelOrigin: new g.Point(0, 2.9) }, label: { text: approxCust ? 'Customer (approx.)' : 'Customer', className: 'bm-cust-label', color: '#FFFFFF', fontSize: '11px', fontWeight: '700' } }))
      b.extend(cust)
    }
    if (showPins) {
      items.forEach((it, i) => {
        if (!it.pt) return
        const on = it.id === selId
        const { url, s } = numPin(i + 1, on ? ORANGE : it.status === 'available' ? '#2563EB' : '#64748B', on)
        const mk = new g.Marker({ map: m, position: it.pt, zIndex: on ? 1000 : 100 - i, title: it.name, icon: { url, scaledSize: new g.Size(s, s), anchor: new g.Point(s / 2, s - 2) } })
        mk.addListener('click', () => pick.current(it.id))
        layers.current.push(mk); b.extend(it.pt)
      })
    }
    const sig = `${radius}|${showPins}|${items.map((x) => x.id).join(',')}`
    if (sig !== fitted.current && !b.isEmpty()) { fitted.current = sig; m.fitBounds(b, 36) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, engine, items, selId, radius, showPins, mapType, cust?.lat, cust?.lng, approxCust, view])
  useEffect(() => { const m = map.current; if (selected?.pt && m && !m.getBounds()?.contains(selected.pt)) m.panTo(selected.pt) }, [selected?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])

  if (!open || !request) return null
  const V = vehicleIconFor(request.vehicle?.type)
  const noun = kind === 'garage' ? 'Garages' : 'Mechanics'
  const loading = kind === 'garage' && shopsLoading
  const ctl = 'flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#16305C] shadow-[0_2px_8px_rgba(15,23,42,.16)] hover:bg-[#F3F5F9]'
  const Pill = ({ s }: { s: Item['status'] }) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-bold" style={{ color: STATUS[s].fg, background: STATUS[s].bg }}><span className="h-2 w-2 rounded-full border-2" style={{ borderColor: STATUS[s].dot }} />{STATUS[s].label}</span>
  const Verified = () => <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11.5px] font-bold text-[#15803D]"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>
  const NotVerified = () => <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11.5px] font-bold text-[#B45309]" title="Registered by field staff, not verified by the admin yet">Not verified yet</span>
  const tag = 'shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11.5px] font-bold'
  const Tags = ({ it }: { it: Item }) => (
    <>
      {it.doorstep === true && <span data-doorstep="yes" className={`${tag} bg-[#DCFCE7] text-[#15803D]`}>Doorstep service</span>}
      {it.doorstep === false && <span data-doorstep="no" className={`${tag} bg-[#F1F5F9] text-[#475569]`}>Workshop only</span>}
      {it.field && <span data-field-garage className={`${tag} bg-[#EDE9FE] text-[#5B21B6]`} title="Registered on site by our field staff">Field staff{it.fieldBy ? ` · ${it.fieldBy}` : ''}</span>}
    </>
  )
  const Photo = ({ it, cls }: { it: Item; cls: string }) => it.photo
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={`${it.photo}${it.photo.includes('ik.imagekit.io') ? '?tr=w-260,h-240,fo-auto' : ''}`} alt="" loading="lazy" className={`shrink-0 rounded-xl object-cover ${cls}`} />
    : <span className={`flex shrink-0 items-center justify-center rounded-xl bg-[#EEF2F7] text-[#16305C] ${cls}`}>{it.kind === 'garage' ? <Store className="h-8 w-8" /> : <span className="text-[20px] font-bold">{initialsOf(it.name)}</span>}</span>
  const AssignBtn = ({ it, solid, wide }: { it: Item; solid?: boolean; wide?: boolean }) => {
    const confirming = confirmId === it.id
    const filled = solid || confirming
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); assign(it) }} disabled={!!busyId}
        className={`flex items-center justify-center gap-1.5 rounded-xl border text-[13.5px] font-bold transition-colors disabled:opacity-60 ${wide ? 'h-11 w-full' : 'h-9 w-[100px]'} ${filled ? 'border-transparent text-white' : 'border-[#FFB89C] bg-white text-[#EA580C] hover:bg-[#FFF4EE]'}`}
        style={filled ? { background: confirming ? '#16A34A' : ORANGE } : undefined}>
        {busyId === it.id ? <Loader2 className="h-4 w-4 animate-spin" /> : confirming ? <><Check className="h-4 w-4" /> Confirm</> : wide ? <>Assign This {it.kind === 'garage' ? 'Garage' : 'Mechanic'} <ArrowRight className="h-4 w-4" /></> : 'Assign'}
      </button>
    )
  }
  const shopMechs: { name: string; sub: string; phone?: string }[] = selected?.kind === 'garage'
    ? (selected.raw.mechanics || []).filter((m: any) => m?.isActive !== false && m?.name).map((m: any) => ({ name: m.name, sub: m.specialization || 'Mechanic', phone: m.phone }))
    : []

  const MapBox = (
    <div className={`relative overflow-hidden rounded-2xl border border-[#EAEEF3] bg-[#E8EEF4] ${view === 'map' ? 'h-full min-h-[420px]' : 'h-[300px] lg:h-[46%] lg:min-h-[260px]'}`}>
      {engine === 'google' && <div ref={el} className="absolute inset-0" />}
      {engine === 'loading' && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#16305C]" /></div>}
      {engine === 'none' && <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-[13px] font-semibold text-[#64748B]">The map could not load. The list still works.</div>}
      {approxCust && engine === 'google' && <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-lg bg-white/95 px-3 py-2 text-center text-[12px] font-semibold text-[#B45309] shadow">No map pin on this request — the customer is placed from the address, so distances are approximate.</div>}
      {!cust && engine === 'google' && <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-lg bg-white/95 px-3 py-2 text-center text-[12px] font-semibold text-[#B45309] shadow">This request has no map location, so distances and the radius are not available.</div>}
      <label className="absolute left-3 top-3 z-10 flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-white px-3 text-[12.5px] font-semibold text-[#1F2937] shadow-[0_2px_8px_rgba(15,23,42,.16)]">
        <input type="checkbox" checked={showPins} onChange={(e) => setShowPins(e.target.checked)} className="h-4 w-4 accent-[#16305C]" /> Show {items.length} {noun}
      </label>
      <div className="absolute right-3 top-3 z-10 flex h-10 items-center rounded-xl bg-white pl-3 text-[12.5px] font-semibold text-[#1F2937] shadow-[0_2px_8px_rgba(15,23,42,.16)]">
        Radius:
        <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} disabled={!cust} aria-label="Radius" className="h-10 rounded-xl bg-transparent pl-1.5 pr-2 font-bold outline-none">
          {[5, 10, 20, 50].map((r) => <option key={r} value={r}>{r} km</option>)}
          <option value={0}>Any</option>
        </select>
      </div>
      {engine === 'google' && (
        <>
          <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2">
            {cust && <button type="button" title="Back to the customer" onClick={() => { map.current?.panTo(cust); map.current?.setZoom(13) }} className={ctl}><LocateFixed className="h-5 w-5" /></button>}
            <button type="button" title="Zoom in" onClick={() => map.current?.setZoom((map.current.getZoom() || 10) + 1)} className={ctl}><Plus className="h-5 w-5" /></button>
            <button type="button" title="Zoom out" onClick={() => map.current?.setZoom((map.current.getZoom() || 10) - 1)} className={ctl}><Minus className="h-5 w-5" /></button>
          </div>
          <button type="button" onClick={() => setMapType((t) => (t === 'roadmap' ? 'hybrid' : 'roadmap'))} className="absolute bottom-3 left-3 z-10 flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-[13px] font-semibold text-[#111827] shadow-[0_2px_8px_rgba(15,23,42,.16)]">
            <Layers className="h-[18px] w-[18px] text-[#16305C]" /> {mapType === 'roadmap' ? 'Layers' : 'Satellite'}
          </button>
        </>
      )}
    </div>
  )

  const Detail = selected ? (
    <div className="scrollbar-admin flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex gap-3">
        <Photo it={selected} cls="h-[88px] w-[96px]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <b className="text-[16px] text-[#111827]">{selected.name}</b>
            {selected.verified && <Verified />}
            {selected.pending && <NotVerified />}
            <Pill s={selected.status} />
          </div>
          <div className="mt-1 flex items-start justify-between gap-2">
            <div className="min-w-0 text-[12.5px] text-[#475569]">
              {selected.rating > 0 && <p className="flex items-center gap-1"><Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" /><b className="text-[#111827]">{selected.rating}</b> ({selected.ratings} {selected.kind === 'garage' ? 'reviews' : 'jobs'})</p>}
              <p className="flex items-center gap-1 truncate"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#16305C]" />{selected.place}{selected.km != null ? ` (${approxCust ? '~' : ''}${selected.km.toFixed(1)} km)` : ''}</p>
              {selected.hours && <p className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 shrink-0 text-[#16A34A]" />{selected.open != null && <b className={selected.open ? 'text-[#16A34A]' : 'text-[#DC2626]'}>{selected.open ? 'Open Now' : 'Closed'}</b>}{selected.open != null && <span>•</span>}{selected.hours}</p>}
            </div>
            <div className="flex shrink-0 gap-1.5">
              {selected.phone && <a href={`tel:${selected.phone}`} title="Call" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E8EF] text-[#16A34A] hover:bg-[#F0FDF4]"><Phone className="h-4 w-4" /></a>}
              {selected.phone && <a href={`https://wa.me/91${String(selected.phone).replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E8EF] text-[#16A34A] hover:bg-[#F0FDF4]"><MessageCircle className="h-4 w-4" /></a>}
              {selected.pt && <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.pt.lat},${selected.pt.lng}`} target="_blank" rel="noopener noreferrer" title="Directions" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E8EF] text-[#2563EB] hover:bg-[#EFF4FF]"><Navigation className="h-4 w-4" /></a>}
            </div>
          </div>
        </div>
      </div>

      {selected.kind === 'garage' ? (
        <div className="mt-3">
          {(selected.doorstep != null || selected.field) && <div className="mb-2 flex flex-wrap gap-1.5"><Tags it={selected} /></div>}
          {selected.field && <p data-field-note className="mb-2 rounded-lg bg-[#F5F3FF] px-2.5 py-2 text-[12px] leading-snug text-[#4C1D95]">Registered by our field staff. When you assign this job it is also added to Shop Partners, so its mechanic, status, payment and calls work as for any garage.</p>}
          <b className="text-[13.5px] text-[#111827]">Garage Mechanics ({shopMechs.length})</b>
          {shopMechs.length === 0 ? <p className="mt-1 text-[12.5px] text-[#6B7280]">This garage has not listed its mechanics yet.</p> : (
            <div className="mt-2 grid grid-cols-2 gap-2 xl:grid-cols-3">
              {shopMechs.slice(0, 6).map((m, i) => (
                <div key={i} className="rounded-xl border border-[#EAEEF3] p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#16305C] text-[11.5px] font-bold text-white">{initialsOf(m.name)}</span>
                    <b className="truncate text-[12.5px] text-[#111827]">{m.name}</b>
                  </div>
                  <p className="mt-1 truncate text-[11.5px] text-[#6B7280]">{m.sub}</p>
                  {m.phone && <a href={`tel:${m.phone}`} className="text-[11.5px] font-semibold text-[#2563EB]">{m.phone}</a>}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">{selected.chips.slice(0, 8).map((c) => <span key={c} className="rounded-lg bg-[#EEF3FB] px-2.5 py-1 text-[12px] font-medium text-[#16305C]">{c}</span>)}</div>
      )}

      <div className={`mt-auto grid gap-2.5 pt-3 ${selected.kind === 'garage' ? 'grid-cols-2' : ''}`}>
        <AssignBtn it={selected} solid wide />
        {selected.kind === 'garage' && (
          <a href={selected.field ? '/admin/garages' : '/admin/shops'} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#FFB89C] text-[13.5px] font-bold text-[#16305C] hover:bg-[#FFF4EE]">View Full Details <ExternalLink className="h-4 w-4" /></a>
        )}
      </div>
    </div>
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-6 text-center">
      <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF2F7] text-[#16305C]">{kind === 'garage' ? <Store className="h-6 w-6" /> : <User className="h-6 w-6" />}</span>
      <b className="text-[14px] text-[#111827]">Pick a {kind === 'garage' ? 'garage' : 'mechanic'}</b>
      <p className="text-[12.5px] text-[#6B7280]">Select one from the list or the map to see its details and assign this request.</p>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0B1730]/60 p-2 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true" aria-label="Assign Mechanic / Garage">
      <style>{'.bm-cust-label{background:#DC2626;padding:2px 7px;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,.3)}'}</style>
      <div className="flex h-full max-h-[940px] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-7">
          <div className="min-w-0">
            <h2 className="text-[24px] font-extrabold leading-tight text-[#111827]">Assign Mechanic / Garage</h2>
            <p className="mt-0.5 text-[13.5px] text-[#6B7280]">Nearest garages and available mechanics for this service request.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-[#E3E8EF] bg-[#F8FAFD] px-3 py-2">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-[#16305C]"><V size={26} /></span>
              <div className="border-r border-[#E3E8EF] pr-3">
                <span className="block text-[11.5px] text-[#6B7280]">Service Request</span>
                <b className="whitespace-nowrap text-[14px] text-[#111827]">{displayId(request)}</b>
              </div>
              <div className="min-w-0 max-w-[260px] text-[12.5px] text-[#374151]">
                <p className="truncate">{vehicleName(request.vehicle)} <span className="text-[#94A3B8]">•</span> {request.serviceType}</p>
                <p className="flex items-center gap-1 truncate text-[#6B7280]"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#16305C]" />{request.location?.address || request.location?.city || '—'}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E3E8EF] text-[#111827] hover:bg-[#F3F5F9]"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-2 px-5 pb-3 sm:px-7">
          <span className="relative"><MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#16305C]" /><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <select className={sel} value={sort} onChange={(e) => setSort(e.target.value as any)} aria-label="Sort"><option value="nearest">Nearest First</option><option value="rating">Top Rated</option><option value="jobs">Most Jobs Done</option></select></span>
          <span className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#16305C]"><V size={18} /></span><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <select className={sel} value={vehicle} onChange={(e) => setVehicle(e.target.value as any)} aria-label="Vehicle"><option value="any">Any vehicle</option><option value="match">{vehicleName(request.vehicle)}</option></select></span>
          <span className="relative"><Wrench className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563EB]" /><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <select className={sel} value={service} onChange={(e) => setService(e.target.value as any)} aria-label="Service"><option value="any">Any service</option><option value="match">{reqService || 'This service'}</option></select></span>
          <span className="relative"><span className="pointer-events-none absolute left-3.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#16A34A]" /><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <select className={sel} value={avail} onChange={(e) => setAvail(e.target.value as any)} aria-label="Availability"><option value="any">Any availability</option><option value="available">Available Now</option></select></span>
          {kind === 'garage' && (
            <span className="relative"><Home className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#15803D]" /><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <select className={sel} value={doorstep} onChange={(e) => setDoorstep(e.target.value as any)} aria-label="Doorstep service"><option value="any">Workshop or doorstep</option><option value="yes">Doorstep service</option></select></span>
          )}
          <span className="relative"><Star className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-[#F59E0B] text-[#F59E0B]" /><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <select className={sel} value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} aria-label="Rating"><option value={0}>Any rating</option><option value={3}>Rating 3+</option><option value={4}>Rating 4+</option><option value={4.5}>Rating 4.5+</option></select></span>
          <button type="button" onClick={clearFilters} disabled={!filtersOn} title="Show everyone again" className="flex h-11 items-center gap-2 rounded-xl border border-[#E3E8EF] bg-white px-3.5 text-[13.5px] font-medium text-[#1F2937] hover:bg-[#F8FAFC] disabled:opacity-50"><SlidersHorizontal className="h-4 w-4" /> {filtersOn ? 'Clear Filters' : 'All Filters'}</button>
        </div>

        {/* body */}
        <div className={`scrollbar-admin grid min-h-0 flex-1 gap-4 overflow-y-auto px-5 pb-5 sm:px-7 lg:overflow-hidden ${view === 'list' ? 'lg:grid-cols-[1.2fr_1fr]' : 'lg:grid-cols-[1.5fr_1fr]'}`}>
          <div className="flex min-h-0 flex-col">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
              {/* the heading doubles as the Garages / Mechanics switch */}
              <div className="flex min-w-0 items-center gap-1">
                {(['garage', 'mechanic'] as const).map((k) => {
                  const on = kind === k
                  const label = k === 'garage' ? 'Garages' : 'Mechanics'
                  return (
                    <button key={k} type="button" onClick={() => { setKind(k); setSelId(null); setConfirmId(null) }} aria-pressed={on}
                      className={`flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl text-[14px] ${on ? 'pr-1.5 text-[#111827]' : 'border border-[#E3E8EF] px-2.5 text-[12.5px] font-bold text-[#16305C] hover:bg-[#F3F5F9]'}`}>
                      {on ? <><b>{items.length} {cust && radius > 0 ? 'Nearby ' : ''}{label}</b>{cust && radius > 0 ? <span className="text-[#475569]">(within {radius} km)</span> : null}</> : <>{k === 'garage' ? <Store className="h-4 w-4" /> : <User className="h-4 w-4" />}{label}</>}
                    </button>
                  )
                })}
              </div>
              <div className="flex overflow-hidden rounded-xl border border-[#E3E8EF]">
                {(['list', 'map'] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={`flex h-10 items-center gap-1.5 whitespace-nowrap px-2.5 text-[12.5px] font-bold ${view === v ? 'bg-[#E8F0FE] text-[#16305C]' : 'bg-white text-[#1F2937] hover:bg-[#F3F5F9]'}`}>
                    {v === 'list' ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}{v === 'list' ? 'List View' : 'Map View'}
                  </button>
                ))}
              </div>
            </div>

            {view === 'map' ? MapBox : (
              <div data-assign-list className="scrollbar-admin min-h-[280px] flex-1 space-y-2.5 overflow-y-auto pr-1.5">
                {loading ? <div className="py-16 text-center text-[#64748B]"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
                  : items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#CBD5E1] px-4 py-12 text-center">
                      <b className="block text-[14.5px] text-[#334155]">No {noun.toLowerCase()} match</b>
                      <p className="mt-1 text-[13px] text-[#6B7280]">{all.length === 0 ? `There are no active ${noun.toLowerCase()} yet.` : cust && radius > 0 ? `None within ${radius} km with these filters. Try a bigger radius or clear the filters.` : 'Try clearing the filters.'}</p>
                      {all.length > 0 && <div className="mt-3 flex justify-center gap-2">{cust && radius > 0 && <button type="button" onClick={() => setRadius(0)} className="h-9 rounded-lg border border-[#E3E8EF] px-3 text-[13px] font-bold text-[#16305C]">Any distance</button>}{filtersOn && <button type="button" onClick={clearFilters} className="h-9 rounded-lg border border-[#E3E8EF] px-3 text-[13px] font-bold text-[#16305C]">Clear filters</button>}</div>}
                    </div>
                  ) : <>{items.map((it, i) => {
                    const on = it.id === selId
                    return (
                      <div key={it.id} data-assign-card onClick={() => setSelId(it.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setSelId(it.id) }}
                        className={`flex cursor-pointer gap-3 rounded-2xl border bg-white p-3 transition-colors hover:bg-[#FAFBFD] ${on ? 'border-[#FF5A1F] ring-1 ring-[#FF5A1F]' : 'border-[#EAEEF3]'}`}>
                        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13.5px] font-bold text-white" style={{ background: on || i === 0 ? ORANGE : '#3B82F6' }}>{i + 1}</span>
                        <Photo it={it} cls="h-[92px] w-[104px]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 flex-wrap items-center gap-1.5"><b className="truncate text-[15.5px] text-[#111827]">{it.name}</b>{it.verified && <Verified />}{it.pending && <NotVerified />}</div>
                            <Pill s={it.status} />
                          </div>
                          <div className="mt-0.5 flex items-start justify-between gap-2">
                            <div className="min-w-0 text-[12.5px] text-[#475569]">
                              <p className="flex items-center gap-1">{it.rating > 0 ? <><Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" /><b className="text-[#111827]">{it.rating}</b> ({it.ratings}{it.kind === 'garage' ? ' reviews' : ' jobs'})</> : <span className="text-[#94A3B8]">No ratings yet</span>}</p>
                              <p className="flex items-center gap-1 truncate"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#16305C]" />{it.place}</p>
                              {it.hours && <p className="flex items-center gap-1 truncate"><Clock className="h-3.5 w-3.5 shrink-0 text-[#16A34A]" />{it.open != null && <b className={it.open ? 'text-[#16A34A]' : 'text-[#DC2626]'}>{it.open ? 'Open Now' : 'Closed'}</b>}{it.open != null && <span>•</span>}{it.hours}</p>}
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                              <span className="flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-[#111827]" title={it.km != null ? (approxCust ? 'Approximate — this request has no map pin, so the customer is placed from the written address' : undefined) : !it.pt ? (it.kind === 'garage' ? 'This shop has no map location saved — open the shop in Shop Partners and set it' : 'This mechanic has not shared a location yet') : 'This request has no customer map location, so distance cannot be measured'}><MapPin className="h-4 w-4 fill-[#2563EB] text-white" />{it.km != null ? `${approxCust ? '~' : ''}${it.km.toFixed(1)} km` : <span className="text-[12px] font-medium text-[#94A3B8]">{!it.pt ? (it.kind === 'garage' ? 'shop location not set' : 'location not shared') : 'customer location missing'}</span>}</span>
                              <AssignBtn it={it} solid={on} />
                            </div>
                          </div>
                          {(it.chips.length > 0 || it.doorstep != null || it.field) && <div className="mt-1.5 flex gap-1.5 overflow-hidden"><Tags it={it} />{it.chips.slice(0, 4).map((c) => <span key={c} className="shrink-0 whitespace-nowrap rounded-lg bg-[#EEF3FB] px-2.5 py-1 text-[11.5px] font-medium text-[#16305C]">{c}</span>)}{it.chips.length > 4 && <span className="shrink-0 rounded-lg bg-[#F1F5F9] px-2 py-1 text-[11.5px] font-medium text-[#64748B]" title={it.chips.slice(4).join(', ')}>+{it.chips.length - 4}</span>}</div>}
                        </div>
                      </div>
                    )
                  })}{farther > 0 && (
                    <button type="button" data-farther onClick={() => setRadius(0)} className="w-full rounded-xl border border-dashed border-[#CBD5E1] bg-white px-3 py-2.5 text-[13px] font-bold text-[#16305C] hover:bg-[#F8FAFD]">
                      +{farther} more {farther === 1 ? noun.toLowerCase().replace(/s$/, '') : noun.toLowerCase()} farther than {radius} km — show any distance
                    </button>
                  )}</>}
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            {view === 'list' && MapBox}
            <div className="flex min-h-[220px] flex-1 flex-col rounded-2xl border border-[#EAEEF3] bg-white p-3.5">{Detail}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
