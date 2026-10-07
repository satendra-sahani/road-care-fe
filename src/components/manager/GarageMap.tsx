'use client'

import { useEffect, useRef, useState } from 'react'
import { loadLeaflet, OSM_TILES } from '@/lib/leaflet'
import { loadGoogleMaps, googleMapsFailed } from '@/lib/googleMaps'

export type MapPin = { id: string; lat: number; lng: number; color: string }
export type LatLng = { lat: number; lng: number }

const INDIA: [number, number] = [22.6, 79.0]

const pinHtml = (color: string, big: boolean) => {
  const s = big ? 44 : 32
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))"><path fill="${color}" stroke="#fff" stroke-width="1.2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.7" fill="#fff"/></svg>`
}

type Props = {
  pins?: MapPin[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  picker?: { value: LatLng | null; onChange: (p: LatLng) => void }
  me?: LatLng | null
  className?: string
  zoomControl?: boolean
  interactive?: boolean
}

/**
 * One map for three jobs:
 *  • `pins` + `onSelect`  — garages on a map (staff "My Visits", admin page)
 *  • `picker`             — pick the garage's exact spot: tap the map or drag the pin
 *  • `me`                 — the viewer's own position as a blue dot
 *
 * It is a Google map (shop / landmark names, Map ⇄ Satellite). If Google Maps
 * can't load — no key, key refused, blocked network — the same props are served
 * by an OpenStreetMap map instead, so the screen never ends up without a map.
 */
export function GarageMap(props: Props) {
  const [engine, setEngine] = useState<'loading' | 'google' | 'osm'>('loading')
  useEffect(() => {
    let off = false
    loadGoogleMaps().then(() => { if (!off) setEngine(googleMapsFailed() ? 'osm' : 'google') }).catch(() => { if (!off) setEngine('osm') })
    return () => { off = true }
  }, [])
  if (engine === 'google') return <GoogleGarageMap {...props} onFail={() => setEngine('osm')} />
  if (engine === 'osm') return <LeafletGarageMap {...props} />
  return <div className={`relative flex items-center justify-center bg-[#E8EEF4] text-[13px] font-semibold text-[#64748B] ${props.className || ''}`}>Loading map…</div>
}

const svgUrl = (color: string, big: boolean) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinHtml(color, big).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '))}`

// ───────────────────────── Google Maps ─────────────────────────
function GoogleGarageMap({
  pins = [], selectedId, onSelect, picker, me, className = '', zoomControl = true, interactive = true, onFail,
}: Props & { onFail: () => void }) {
  const el = useRef<HTMLDivElement | null>(null)
  const map = useRef<any>(null)
  const markers = useRef<Map<string, any>>(new Map())
  const pickMarker = useRef<any>(null)
  const meMarker = useRef<any>(null)
  const fitted = useRef('')
  const cb = useRef({ onSelect, picker })
  cb.current = { onSelect, picker }
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const g = (window as any).google?.maps
    if (!g || !el.current) { onFail(); return }
    const m = new g.Map(el.current, {
      center: { lat: INDIA[0], lng: INDIA[1] }, zoom: 5,
      disableDefaultUI: true,
      zoomControl: zoomControl && interactive,
      mapTypeControl: interactive, // Map ⇄ Satellite: rooftops help find the exact garage
      mapTypeControlOptions: { position: g.ControlPosition.LEFT_BOTTOM, style: g.MapTypeControlStyle.HORIZONTAL_BAR },
      gestureHandling: interactive ? 'greedy' : 'none',
      keyboardShortcuts: false,
      clickableIcons: false, // tapping a shop name moves the pin instead of opening Google's card
    })
    m.addListener('click', (e: any) => {
      if (cb.current.picker) cb.current.picker.onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() })
      else cb.current.onSelect?.(null)
    })
    map.current = m
    setReady(true)
    // Google reports a refused key (billing / referrer) only after the map exists
    const t = setInterval(() => { if (googleMapsFailed()) { clearInterval(t); onFail() } }, 1000)
    const stop = setTimeout(() => clearInterval(t), 8000)
    return () => { clearInterval(t); clearTimeout(stop); markers.current.forEach((x) => x.setMap(null)); markers.current.clear(); map.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // garages
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    if (!ready || !g || !m) return
    markers.current.forEach((x) => x.setMap(null))
    markers.current.clear()
    for (const p of pins) {
      const big = p.id === selectedId
      const s = big ? 44 : 32
      const mk = new g.Marker({
        map: m, position: { lat: p.lat, lng: p.lng }, zIndex: big ? 1000 : 1,
        icon: { url: svgUrl(p.color, big), scaledSize: new g.Size(s, s), anchor: new g.Point(s / 2, s - 2) },
      })
      mk.addListener('click', () => cb.current.onSelect?.(p.id))
      markers.current.set(p.id, mk)
    }
    const sig = pins.map((p) => p.id).join(',')
    if (pins.length && sig !== fitted.current) {
      fitted.current = sig
      if (pins.length === 1) { m.setCenter({ lat: pins[0].lat, lng: pins[0].lng }); m.setZoom(interactive ? 16 : 17) } else {
        const b = new g.LatLngBounds()
        pins.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }))
        m.fitBounds(b, 48)
      }
    }
  }, [ready, pins, selectedId, interactive])

  // bring the selected garage into view
  useEffect(() => {
    const m = map.current
    const p = pins.find((x) => x.id === selectedId)
    if (ready && m && p && !m.getBounds()?.contains({ lat: p.lat, lng: p.lng })) m.panTo({ lat: p.lat, lng: p.lng })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selectedId])

  // location picker: one draggable pin
  const pv = picker?.value
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    if (!ready || !g || !m || !picker) return
    if (!pv) { pickMarker.current?.setMap(null); pickMarker.current = null; return }
    if (!pickMarker.current) {
      pickMarker.current = new g.Marker({
        map: m, position: pv, draggable: true, zIndex: 2000,
        icon: { url: svgUrl('#FF5A1F', true), scaledSize: new g.Size(48, 48), anchor: new g.Point(24, 46) },
      })
      pickMarker.current.addListener('dragend', (e: any) => cb.current.picker?.onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() }))
      m.setCenter(pv)
      if ((m.getZoom() || 0) < 18) m.setZoom(18) // close enough to read shop names
    } else {
      pickMarker.current.setPosition(pv)
      if (!m.getBounds()?.contains(pv)) m.panTo(pv)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pv?.lat, pv?.lng])

  // the viewer
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    if (!ready || !g || !m) return
    if (!me) { meMarker.current?.setMap(null); meMarker.current = null; return }
    if (meMarker.current) { meMarker.current.setPosition(me); return }
    meMarker.current = new g.Marker({
      map: m, position: me, clickable: false, zIndex: 0,
      icon: { path: g.SymbolPath.CIRCLE, scale: 7, fillColor: '#2563EB', fillOpacity: 1, strokeColor: '#FFFFFF', strokeWeight: 2.5 },
    })
    if (!pins.length && !picker?.value) { m.setCenter(me); m.setZoom(15) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, me?.lat, me?.lng])

  return (
    <div className={`relative overflow-hidden bg-[#E8EEF4] ${className}`}>
      <div ref={el} className="absolute inset-0 z-0" />
    </div>
  )
}

// ───────────────────────── OpenStreetMap fallback ─────────────────────────
function LeafletGarageMap({

  pins = [], selectedId, onSelect, picker, me, className = '', zoomControl = true, interactive = true,
}: Props) {
  const el = useRef<HTMLDivElement | null>(null)
  const map = useRef<any>(null)
  const L = useRef<any>(null)
  const layer = useRef<any>(null)
  const pickMarker = useRef<any>(null)
  const meMarker = useRef<any>(null)
  const fitted = useRef('')
  const cb = useRef({ onSelect, picker })
  cb.current = { onSelect, picker }
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let off = false
    loadLeaflet().then((lib) => {
      if (off || !el.current || map.current) return
      L.current = lib
      const m = lib.map(el.current, {
        zoomControl: false, attributionControl: false,
        dragging: interactive, touchZoom: interactive, scrollWheelZoom: interactive, doubleClickZoom: interactive, boxZoom: interactive, keyboard: interactive,
      }).setView(INDIA, 5)
      lib.tileLayer(OSM_TILES, { maxZoom: 19, subdomains: 'abc' }).addTo(m)
      if (zoomControl && interactive) lib.control.zoom({ position: 'bottomright' }).addTo(m)
      layer.current = lib.layerGroup().addTo(m)
      m.on('click', (e: any) => {
        if (cb.current.picker) cb.current.picker.onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
        else cb.current.onSelect?.(null)
      })
      map.current = m
      setReady(true)
      setTimeout(() => { try { m.invalidateSize() } catch { /* unmounted */ } }, 80)
    }).catch(() => { if (!off) setFailed(true) })
    return () => { off = true; try { map.current?.remove() } catch { /* noop */ } map.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // garages
  useEffect(() => {
    const lib = L.current, m = map.current
    if (!ready || !lib || !m) return
    layer.current.clearLayers()
    for (const p of pins) {
      const big = p.id === selectedId
      const s = big ? 44 : 32
      const mk = lib.marker([p.lat, p.lng], {
        icon: lib.divIcon({ className: '', iconSize: [s, s], iconAnchor: [s / 2, s - 2], html: pinHtml(p.color, big) }),
        zIndexOffset: big ? 1000 : 0,
      })
      mk.on('click', (e: any) => { lib.DomEvent.stopPropagation(e); cb.current.onSelect?.(p.id) })
      mk.addTo(layer.current)
    }
    // frame the pins once per pin set (not on every selection)
    const sig = pins.map((p) => p.id).join(',')
    if (pins.length && sig !== fitted.current) {
      fitted.current = sig
      if (pins.length === 1) m.setView([pins[0].lat, pins[0].lng], 15)
      else m.fitBounds(pins.map((p) => [p.lat, p.lng]), { padding: [40, 40], maxZoom: 15 })
    }
  }, [ready, pins, selectedId])

  // bring the selected garage into view
  useEffect(() => {
    const m = map.current
    const p = pins.find((x) => x.id === selectedId)
    if (ready && m && p && !m.getBounds().pad(-0.15).contains([p.lat, p.lng])) m.panTo([p.lat, p.lng], { animate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selectedId])

  // location picker: one draggable pin
  const pv = picker?.value
  useEffect(() => {
    const lib = L.current, m = map.current
    if (!ready || !lib || !m || !picker) return
    if (!pv) { pickMarker.current?.remove(); pickMarker.current = null; return }
    if (!pickMarker.current) {
      pickMarker.current = lib.marker([pv.lat, pv.lng], {
        draggable: true, autoPan: true,
        icon: lib.divIcon({ className: '', iconSize: [48, 48], iconAnchor: [24, 46], html: pinHtml('#FF5A1F', true) }),
      }).addTo(m)
      pickMarker.current.on('dragend', () => { const ll = pickMarker.current.getLatLng(); cb.current.picker?.onChange({ lat: ll.lat, lng: ll.lng }) })
      m.setView([pv.lat, pv.lng], Math.max(m.getZoom(), 17))
    } else {
      pickMarker.current.setLatLng([pv.lat, pv.lng])
      if (!m.getBounds().pad(-0.2).contains([pv.lat, pv.lng])) m.panTo([pv.lat, pv.lng])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pv?.lat, pv?.lng])

  // the viewer
  useEffect(() => {
    const lib = L.current, m = map.current
    if (!ready || !lib || !m) return
    if (!me) { meMarker.current?.remove(); meMarker.current = null; return }
    if (meMarker.current) { meMarker.current.setLatLng([me.lat, me.lng]); return }
    meMarker.current = lib.marker([me.lat, me.lng], {
      interactive: false, zIndexOffset: -100,
      icon: lib.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], html: '<div style="width:22px;height:22px;border-radius:50%;background:rgba(37,99,235,.25);display:flex;align-items:center;justify-content:center"><div style="width:12px;height:12px;border-radius:50%;background:#2563EB;border:2px solid #fff"></div></div>' }),
    }).addTo(m)
    if (!pins.length && !picker?.value) m.setView([me.lat, me.lng], 14)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, me?.lat, me?.lng])

  return (
    <div className={`relative overflow-hidden bg-[#E8EEF4] ${className}`}>
      <div ref={el} className="absolute inset-0 z-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-[#64748B]">
          {failed ? 'Map could not load — check your internet' : 'Loading map…'}
        </div>
      )}
    </div>
  )
}
