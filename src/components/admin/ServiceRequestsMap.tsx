'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X, Phone, MapPin, User, Star, ArrowRight, UserPlus, LocateFixed, Plus, Minus, Maximize, Minimize, Layers, ChevronDown, Check,
  MoreHorizontal, Loader2, UserRound,
} from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { ServiceRequest } from '@/store/slices/serviceRequestSlice'
import { loadGoogleMaps, googleMapsFailed } from '@/lib/googleMaps'
import { GarageMap } from '@/components/manager/GarageMap'
import { STATUS_PILL, initialsOf, kmBetween, vehicleIconFor, vehicleName } from './serviceRequestUi'

// Map View of admin Service Management: every request that matches the page's
// search / filters on a Google map, with a "Live Requests" list beside it.
// Pick a pin or a card to see the request, call the customer or mechanic, open
// the full request, or assign a mechanic.

type Pt = { lat: number; lng: number }
const coordsOf = (r: ServiceRequest): Pt | null => {
  const c = r.location?.coordinates
  return c?.latitude != null && c?.longitude != null ? { lat: c.latitude, lng: c.longitude } : null
}
const CLOSED = ['paid', 'completed', 'cancelled', 'payment_pending']
const CHIPS = [
  { key: 'pending', label: 'Pending', statuses: ['pending'] },
  { key: 'diagnosis', label: 'Diagnosis', statuses: ['diagnosis'] },
  { key: 'in_progress', label: 'In Progress', statuses: ['in_progress', 'in-progress', 'approved'] },
  { key: 'completed', label: 'Completed', statuses: ['completed', 'payment_pending'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
]
const pinSvg = (color: string, big: boolean) => {
  const s = big ? 46 : 34
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24"><path fill="${color}" stroke="#fff" stroke-width="1.2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.9" fill="#fff"/></svg>`
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, s }
}
const km = (n: number | null) => (n == null ? '' : `${n < 10 ? n.toFixed(1) : Math.round(n)} km`)

export function ServiceRequestsMap({
  requests, loading, selectedId, onSelect, mechanicInfo, onView, onAssign, renderMenu, displayId, formatCurrency, statusFilter, onStatusFilter,
}: {
  requests: ServiceRequest[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
  mechanicInfo: (id?: string) => { rating?: number; jobs?: number } | undefined
  onView: (r: ServiceRequest) => void
  onAssign: (r: ServiceRequest) => void
  renderMenu: (r: ServiceRequest) => React.ReactNode
  displayId: (r: ServiceRequest) => string
  formatCurrency: (n: number) => string
  statusFilter: string
  onStatusFilter: (k: string) => void
}) {
  const [engine, setEngine] = useState<'loading' | 'google' | 'osm'>('loading')
  const [me, setMe] = useState<Pt | null>(null)
  const [sort, setSort] = useState<'nearest' | 'newest'>('nearest')
  const [full, setFull] = useState(false)
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid' | 'terrain'>('roadmap')
  const [traffic, setTraffic] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const el = useRef<HTMLDivElement | null>(null)
  const map = useRef<any>(null)
  const overlay = useRef<any>(null)
  const markers = useRef<any[]>([])
  const extras = useRef<any[]>([]) // mechanic marker + route of the selected request
  const meMarker = useRef<any>(null)
  const trafficLayer = useRef<any>(null)
  const fitted = useRef('')
  const cb = useRef({ onSelect })
  cb.current = { onSelect }
  const selRef = useRef<Pt | null>(null)

  const withPin = useMemo(() => requests.filter((r) => coordsOf(r)), [requests])
  const selected = requests.find((r) => r._id === selectedId) || null
  const selPt = selected ? coordsOf(selected) : null
  selRef.current = selPt

  // distance shown on a card: from the admin (once located), else from the assigned mechanic
  const distOf = (r: ServiceRequest) => {
    const c = r.location?.coordinates
    if (me) return kmBetween({ latitude: me.lat, longitude: me.lng }, c)
    return kmBetween(r.mechanic?.currentLocation, c)
  }
  const list = useMemo(() => {
    const a = [...requests]
    if (sort === 'nearest' && me) a.sort((x, y) => (distOf(x) ?? 1e9) - (distOf(y) ?? 1e9))
    else a.sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())
    return a
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, sort, me])

  const locate = (pan = true) => navigator.geolocation?.getCurrentPosition(
    (p) => { const pt = { lat: p.coords.latitude, lng: p.coords.longitude }; setMe(pt); if (pan && map.current) { map.current.panTo(pt); if ((map.current.getZoom() || 0) < 13) map.current.setZoom(13) } },
    () => undefined, { enableHighAccuracy: true, timeout: 12000 },
  )

  // ── Google map ──
  useEffect(() => {
    let off = false
    loadGoogleMaps().then(() => { if (!off) setEngine(googleMapsFailed() ? 'osm' : 'google') }).catch(() => { if (!off) setEngine('osm') })
    locate(false) // for "Nearest First" + distances; the map isn't moved
    return () => { off = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const place = () => {
    const proj = overlay.current?.getProjection?.()
    const g = (window as any).google?.maps
    if (!proj || !g || !selRef.current) { setPos(null); return }
    const p = proj.fromLatLngToContainerPixel(new g.LatLng(selRef.current.lat, selRef.current.lng))
    setPos(p ? { x: p.x, y: p.y } : null)
  }

  useEffect(() => {
    if (engine !== 'google' || !el.current || map.current) return
    const g = (window as any).google.maps
    const m = new g.Map(el.current, {
      center: { lat: 22.6, lng: 79 }, zoom: 5, disableDefaultUI: true, scaleControl: true,
      gestureHandling: 'greedy', clickableIcons: false, keyboardShortcuts: false,
    })
    const ov = new g.OverlayView()
    ov.onAdd = () => undefined; ov.onRemove = () => undefined; ov.draw = () => place()
    ov.setMap(m)
    overlay.current = ov
    m.addListener('click', () => cb.current.onSelect(null))
    m.addListener('bounds_changed', place)
    map.current = m
    const t = setInterval(() => { if (googleMapsFailed()) { clearInterval(t); setEngine('osm') } }, 1000)
    const stop = setTimeout(() => clearInterval(t), 8000)
    return () => { clearInterval(t); clearTimeout(stop); markers.current.forEach((x) => x.setMap(null)); extras.current.forEach((x) => x.setMap(null)); map.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine])

  // pins
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    if (engine !== 'google' || !g || !m) return
    markers.current.forEach((x) => x.setMap(null))
    markers.current = []
    for (const r of withPin) {
      const big = r._id === selectedId
      const { url, s } = pinSvg(STATUS_PILL[r.status]?.pin || '#64748B', big)
      const mk = new g.Marker({ map: m, position: coordsOf(r), zIndex: big ? 1000 : 1, title: displayId(r), icon: { url, scaledSize: new g.Size(s, s), anchor: new g.Point(s / 2, s - 2) } })
      mk.addListener('click', () => cb.current.onSelect(r._id))
      markers.current.push(mk)
    }
    const sig = withPin.map((r) => r._id).join(',')
    if (withPin.length && sig !== fitted.current) {
      fitted.current = sig
      if (withPin.length === 1) { m.setCenter(coordsOf(withPin[0])); m.setZoom(14) } else {
        const b = new g.LatLngBounds()
        withPin.forEach((r) => b.extend(coordsOf(r)))
        m.fitBounds(b, { top: 80, bottom: 60, left: 50, right: 70 })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, withPin, selectedId])

  // selected request: centre it under its card, and draw the mechanic → customer line
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    if (engine !== 'google' || !g || !m) return
    extras.current.forEach((x) => x.setMap(null))
    extras.current = []
    if (!selPt) { setPos(null); return }
    m.panTo(selPt)
    m.panBy(0, -150) // leave room above the pin for the card
    const ml = selected?.mechanic?.currentLocation
    if (ml?.latitude != null && ml?.longitude != null) {
      const from = { lat: ml.latitude, lng: ml.longitude }
      extras.current.push(new g.Polyline({
        map: m, path: [from, selPt], strokeOpacity: 0, zIndex: 5,
        icons: [{ icon: { path: g.SymbolPath.CIRCLE, fillColor: '#2563EB', fillOpacity: 1, strokeOpacity: 0, scale: 3 }, offset: '0', repeat: '12px' }],
      }))
      extras.current.push(new g.Marker({
        map: m, position: from, zIndex: 900, title: selected?.mechanic?.name,
        label: { text: initialsOf(selected?.mechanic?.name), color: '#FFFFFF', fontSize: '11px', fontWeight: '700' },
        icon: { path: g.SymbolPath.CIRCLE, scale: 15, fillColor: '#16305C', fillOpacity: 1, strokeColor: '#FFFFFF', strokeWeight: 3 },
      }))
    }
    setTimeout(place, 60)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, selectedId, selPt?.lat, selPt?.lng])

  // layers
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    if (engine !== 'google' || !g || !m) return
    m.setMapTypeId(mapType)
    if (traffic) { trafficLayer.current = trafficLayer.current || new g.TrafficLayer(); trafficLayer.current.setMap(m) } else trafficLayer.current?.setMap(null)
  }, [engine, mapType, traffic])

  // "you are here"
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    if (engine !== 'google' || !g || !m || !me) return
    if (meMarker.current) { meMarker.current.setPosition(me); return }
    meMarker.current = new g.Marker({ map: m, position: me, clickable: false, zIndex: 0, title: 'You are here', icon: { path: g.SymbolPath.CIRCLE, scale: 7, fillColor: '#2563EB', fillOpacity: 1, strokeColor: '#FFFFFF', strokeWeight: 2.5 } })
  }, [engine, me])

  // a resized container (full screen) needs the map to re-measure
  useEffect(() => {
    const g = (window as any).google?.maps
    if (g && map.current) setTimeout(() => { g.event.trigger(map.current, 'resize'); place() }, 80)
    if (!full) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [full])

  const zoom = (d: number) => map.current?.setZoom((map.current.getZoom() || 10) + d)
  const count = (statuses: string[]) => requests.filter((r) => statuses.includes(r.status)).length
  const ctl = 'flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#16305C] shadow-[0_2px_8px_rgba(15,23,42,.16)] hover:bg-[#F3F5F9]'

  const Pill = ({ status }: { status: string }) => {
    const s = STATUS_PILL[status] || STATUS_PILL.pending
    return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold" style={{ color: s.fg, background: s.bg }}>{['paid', 'completed'].includes(status) && <Check className="h-3 w-3" />}{s.label}</span>
  }
  const MechLine = ({ r, big = false }: { r: ServiceRequest; big?: boolean }) => {
    if (!r.mechanic && !r.shopPartner) return <span className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-[#6B7280]"><UserRound className="h-4 w-4" /> Not assigned</span>
    const name = r.mechanic?.name || r.shopPartner?.shopName || 'Shop partner'
    const info = mechanicInfo(r.mechanic?._id)
    return (
      <span className="flex min-w-0 items-center gap-2">
        <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#16305C] font-bold text-white ${big ? 'h-9 w-9 text-[12px]' : 'h-7 w-7 text-[10.5px]'}`}>{initialsOf(name)}</span>
        <span className={`min-w-0 ${big ? '' : 'flex items-center gap-2'}`}>
          <b className="block truncate text-[13px] text-[#111827]">{name}</b>
          {!!info?.rating && <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#B45309]"><Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />{info.rating}{info.jobs ? <span className="font-normal text-[#6B7280]">({info.jobs})</span> : null}</span>}
        </span>
      </span>
    )
  }
  const costOf = (r: ServiceRequest) => formatCurrency(r.diagnosis?.costBreakdown?.totalEstimate || r.finalCost || r.totalCost || r.estimatedCost || 0)

  return (
    <div className={full ? 'fixed inset-0 z-[70] grid gap-4 bg-[#F5F7FA] p-3 xl:grid-cols-[1fr_390px]' : 'grid gap-4 xl:grid-cols-[1fr_390px]'}>
      {/* ───────── map ───────── */}
      <div className={`relative overflow-hidden rounded-2xl border border-[#EAEEF3] bg-[#E8EEF4] ${full ? 'h-full min-h-[420px]' : 'h-[640px]'}`}>
        {engine === 'google' && <div ref={el} className="absolute inset-0" />}
        {engine === 'osm' && (
          <GarageMap className="absolute inset-0 h-full w-full" selectedId={selectedId} onSelect={onSelect}
            pins={withPin.map((r) => ({ id: r._id, ...coordsOf(r)!, color: STATUS_PILL[r.status]?.pin || '#64748B' }))} />
        )}
        {(engine === 'loading' || loading) && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40"><Loader2 className="h-7 w-7 animate-spin text-[#16305C]" /></div>}

        {/* counts */}
        <div className="pointer-events-none absolute left-3 right-16 top-3 z-10 flex flex-wrap gap-2">
          <span className="rounded-xl bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#1F2937] shadow-[0_2px_8px_rgba(15,23,42,.14)]"><b className="mr-1 text-[16px]">{withPin.length}</b> requests on map{withPin.length < requests.length ? <span className="font-normal text-[#6B7280]"> · {requests.length - withPin.length} without location</span> : null}</span>
          {CHIPS.map((c) => {
            const on = statusFilter === c.key
            return (
              <button key={c.key} type="button" onClick={() => onStatusFilter(on ? 'all' : c.key)} aria-pressed={on}
                className={`pointer-events-auto flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12.5px] font-semibold text-[#1F2937] shadow-[0_2px_8px_rgba(15,23,42,.14)] ${on ? 'ring-2 ring-[#16305C]' : ''}`}>
                <span className="h-3 w-3 rounded-full ring-2 ring-white" style={{ background: STATUS_PILL[c.key].pin, boxShadow: `0 0 0 1.5px ${STATUS_PILL[c.key].pin}` }} />
                {c.label} ({count(c.statuses)})
              </button>
            )
          })}
        </div>

        {/* selected request */}
        {selected && (engine !== 'google' || pos) && (
          <div className="absolute z-20 w-[310px] max-w-[calc(100%-1.5rem)] rounded-2xl bg-white p-3.5 shadow-[0_10px_30px_rgba(15,23,42,.25)]"
            style={engine === 'google' && pos ? { left: pos.x, top: pos.y, transform: 'translate(-50%, calc(-100% - 46px))' } : { left: 12, top: 60 }}>
            {engine === 'google' && <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />}
            <button type="button" onClick={() => onSelect(null)} aria-label="Close" className="absolute right-2.5 top-2.5 rounded-full p-1 text-[#64748B] hover:bg-[#F1F5F9]"><X className="h-4 w-4" /></button>
            <div className="flex gap-3 pr-6">
              {(() => { const V = vehicleIconFor(selected.vehicle?.type); return <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F7] text-[#16305C]"><V size={30} /></span> })()}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><b className="text-[14.5px] text-[#111827]">{displayId(selected)}</b><Pill status={selected.status} /></div>
                <b className="mt-0.5 block truncate text-[13px] text-[#111827]">{selected.customer.name}</b>
                <p className="flex items-center gap-1.5 text-[12.5px] text-[#374151]"><Phone className="h-3.5 w-3.5 text-[#16305C]" />{selected.customer.phone || '—'}</p>
              </div>
            </div>
            <p className="mt-1.5 truncate text-[12.5px] text-[#374151]">{vehicleName(selected.vehicle)} <span className="text-[#94A3B8]">•</span> <span className="text-[#6B7280]">{selected.serviceType}</span></p>
            <p className="flex items-start gap-1.5 text-[12.5px] text-[#6B7280]"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#16305C]" /><span className="line-clamp-2">{selected.location?.address || selected.location?.city}{distOf(selected) != null ? ` (${km(distOf(selected))})` : ''}</span></p>
            <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-3 border-t border-[#EEF2F7] pt-2.5">
              <div className="min-w-0">
                <span className="mb-1 block text-[11.5px] text-[#6B7280]">Assigned Mechanic</span>
                <div className="flex items-center justify-between gap-2">
                  <MechLine r={selected} big />
                  {selected.mechanic?.phone && <a href={`tel:${selected.mechanic.phone}`} title="Call mechanic" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E3E8EF] text-[#2563EB] hover:bg-[#EFF4FF]"><Phone className="h-4 w-4" /></a>}
                </div>
              </div>
              <div className="border-l border-[#EEF2F7] pl-3 text-right">
                <span className="mb-1 block text-[11.5px] text-[#6B7280]">Est. Cost</span>
                <b className="text-[15px] text-[#111827]">{costOf(selected)}</b>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onView(selected)} className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#FF5A1F] text-[12.5px] font-bold text-white hover:bg-[#F04E14]">View Request <ArrowRight className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => onAssign(selected)} disabled={CLOSED.includes(selected.status)} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#BFD3F5] text-[12.5px] font-bold text-[#1D4ED8] hover:bg-[#EFF4FF] disabled:opacity-40"><UserPlus className="h-3.5 w-3.5" /> {selected.mechanic ? 'Reassign' : 'Assign Mechanic'}</button>
            </div>
          </div>
        )}

        {/* controls */}
        {engine === 'google' && (
          <>
            <div className="absolute bottom-16 right-3 z-10 flex flex-col gap-2">
              <button type="button" onClick={() => locate(true)} title="My location" className={ctl}><LocateFixed className="h-5 w-5" /></button>
              <button type="button" onClick={() => zoom(1)} title="Zoom in" className={ctl}><Plus className="h-5 w-5" /></button>
              <button type="button" onClick={() => zoom(-1)} title="Zoom out" className={ctl}><Minus className="h-5 w-5" /></button>
              <button type="button" onClick={() => setFull((v) => !v)} title={full ? 'Exit full screen' : 'Full screen'} className={ctl}>{full ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}</button>
            </div>
            <div className="absolute bottom-8 left-3 z-10">
              {layersOpen && (
                <div className="mb-2 w-[190px] rounded-xl bg-white p-1.5 shadow-[0_6px_20px_rgba(15,23,42,.2)]">
                  {([['roadmap', 'Map'], ['hybrid', 'Satellite'], ['terrain', 'Terrain']] as const).map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setMapType(k)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-semibold text-[#1F2937] hover:bg-[#F3F5F9]">{l}{mapType === k && <Check className="h-4 w-4 text-[#16A34A]" />}</button>
                  ))}
                  <div className="my-1 h-px bg-[#EEF2F7]" />
                  <button type="button" onClick={() => setTraffic((v) => !v)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-semibold text-[#1F2937] hover:bg-[#F3F5F9]">Live traffic{traffic && <Check className="h-4 w-4 text-[#16A34A]" />}</button>
                </div>
              )}
              <button type="button" onClick={() => setLayersOpen((v) => !v)} aria-expanded={layersOpen} className="flex h-11 items-center gap-2 rounded-xl bg-white px-3.5 text-[13.5px] font-semibold text-[#111827] shadow-[0_2px_8px_rgba(15,23,42,.16)]">
                <Layers className="h-5 w-5 text-[#16305C]" /> Layers <ChevronDown className={`h-4 w-4 transition-transform ${layersOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </>
        )}
        {!loading && requests.length > 0 && withPin.length === 0 && <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"><span className="rounded-xl bg-white/95 px-4 py-3 text-[13.5px] font-semibold text-[#64748B] shadow">None of these requests has a map location.</span></div>}
      </div>

      {/* ───────── live requests ───────── */}
      <div className={`flex flex-col overflow-hidden rounded-2xl border border-[#EAEEF3] bg-white ${full ? 'h-full' : 'h-[640px]'}`}>
        <div className="flex items-center justify-between gap-2 px-4 py-3.5">
          <b className="text-[16px] text-[#111827]">Live Requests</b>
          <select value={sort} onChange={(e) => { const v = e.target.value as 'nearest' | 'newest'; setSort(v); if (v === 'nearest' && !me) locate(false) }} aria-label="Sort"
            className="h-9 rounded-lg border border-[#E3E8EF] bg-white px-2.5 text-[12.5px] font-semibold text-[#111827] outline-none">
            <option value="nearest">Nearest First</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
        {sort === 'nearest' && !me && <p className="mx-4 mb-2 rounded-lg bg-[#F1F5F9] px-3 py-2 text-[12px] text-[#475569]">Allow location in the browser to sort by distance from you. Showing newest first.</p>}
        <div className="flex-1 space-y-2.5 overflow-y-auto px-3 pb-3">
          {loading && !requests.length ? <div className="py-16 text-center text-[#64748B]"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
            : !list.length ? <div className="px-4 py-16 text-center text-[13.5px] text-[#6B7280]">No service requests match these filters.</div>
              : list.map((r) => {
                const V = vehicleIconFor(r.vehicle?.type)
                const d = distOf(r)
                const on = r._id === selectedId
                const hasPin = !!coordsOf(r)
                return (
                  <div key={r._id} data-request-card onClick={() => hasPin && onSelect(r._id)} role={hasPin ? 'button' : undefined} tabIndex={hasPin ? 0 : undefined}
                    onKeyDown={(e) => { if (hasPin && e.key === 'Enter') onSelect(r._id) }}
                    className={`flex gap-2.5 rounded-xl border bg-white p-2.5 transition-colors ${hasPin ? 'cursor-pointer hover:bg-[#FAFBFD]' : ''} ${on ? 'border-[#FF5A1F]' : 'border-[#EEF2F7]'}`}
                    style={{ boxShadow: `inset 3px 0 0 ${STATUS_PILL[r.status]?.pin || '#94A3B8'}` }}>
                    <span className="ml-1 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#EEF2F7] text-[#16305C]"><V size={28} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <b className="shrink-0 text-[13px] text-[#1D4ED8]">{displayId(r)}</b>
                        <Pill status={r.status} />
                        <span className="ml-auto flex shrink-0 items-center gap-1 text-[12px] text-[#6B7280]">{d != null && <><MapPin className="h-3.5 w-3.5" />{km(d)}</>}</span>
                        <span onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><button type="button" title="More actions" className="flex h-6 w-6 items-center justify-center rounded-md text-[#475569] hover:bg-[#F1F5F9]"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
                            {renderMenu(r)}
                          </DropdownMenu>
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] font-bold text-[#111827]"><User className="h-3.5 w-3.5 shrink-0 text-[#16305C]" />{r.customer.name || '—'}</p>
                      <p className="truncate pl-5 text-[12.5px] text-[#374151]">{vehicleName(r.vehicle)} <span className="text-[#94A3B8]">•</span> <span className="text-[#6B7280]">{r.serviceType}</span></p>
                      <p className="flex items-center gap-1.5 truncate text-[12.5px] text-[#6B7280]"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#16305C]" />{[r.location?.address?.split(',')[0], r.location?.city].filter((x, i, a) => x && a.indexOf(x) === i).join(', ') || '—'}{!hasPin && <i className="ml-1 text-[#DC2626]/70">no map location</i>}</p>
                      <div className="mt-1.5 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                        <MechLine r={r} />
                        <span className="flex shrink-0 items-center gap-1.5">
                          <button type="button" onClick={() => onView(r)} className="h-8 rounded-lg border border-[#BFD3F5] px-3 text-[12.5px] font-bold text-[#1D4ED8] hover:bg-[#EFF4FF]">View</button>
                          {r.customer.phone && <a href={`tel:${r.customer.phone}`} title="Call customer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#BFD3F5] text-[#1D4ED8] hover:bg-[#EFF4FF]"><Phone className="h-4 w-4" /></a>}
                          {!CLOSED.includes(r.status) && <button type="button" onClick={() => onAssign(r)} className="h-8 rounded-lg border border-[#FFC9B3] px-3 text-[12.5px] font-bold text-[#EA580C] hover:bg-[#FFF4EE]">{r.mechanic ? 'Reassign' : 'Assign'}</button>}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
        </div>
      </div>
    </div>
  )
}
