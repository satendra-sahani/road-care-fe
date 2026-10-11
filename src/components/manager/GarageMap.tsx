'use client'

import { useEffect, useRef, useState } from 'react'
import { loadLeaflet, OSM_TILES } from '@/lib/leaflet'
import { loadGoogleMaps, googleMapsFailed } from '@/lib/googleMaps'
import type { MapArea } from '@/lib/cityAreas'

export type MapPin = {
  id: string; lat: number; lng: number; color: string
  /** drawn as a round bubble with this text in it (a count) instead of a pin */
  text?: string
  /** the bubble's width in px (34 when not given) */
  size?: number
  /** shown when the pointer rests on it */
  title?: string
}
export type LatLng = { lat: number; lng: number }

const INDIA: [number, number] = [22.6, 79.0]

/** a city's name as a small pill, drawn above its area */
const areaLabel = (text: string, color: string) => {
  const w = Math.max(44, Math.round(text.length * 7.4) + 20)
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  return { w, h: 22, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="22" viewBox="0 0 ${w} 22"><rect x="1" y="1" width="${w - 2}" height="20" rx="10" fill="${color}" stroke="#fff" stroke-width="1.5"/><text x="${w / 2}" y="15" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#fff">${safe}</text></svg>` }
}
/** the outer rings of an area as lists of points, whatever kind of shape it is */
const ringsOf = (a: MapArea): LatLng[][][] => (!a.geometry ? [] : (a.geometry.type === 'Polygon' ? [a.geometry.coordinates] : a.geometry.coordinates)
  .map((rings: number[][][]) => rings.map((r) => r.map(([lng, lat]) => ({ lat, lng })))))
const areaSig = (areas?: MapArea[]) => (areas || []).map((a) => `${a.id}|${a.color}|${a.geometry ? 'outline' : a.circle ? `${a.circle.lat},${a.circle.lng},${a.circle.radius}` : ''}`).join(';')

const pinHtml = (color: string, big: boolean) => {
  const s = big ? 44 : 32
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))"><path fill="${color}" stroke="#fff" stroke-width="1.2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.7" fill="#fff"/></svg>`
}

/** what to draw for a pin — the usual drop, or a round bubble with its text — and where its point sits in it */
const pinArt = (p: MapPin, big: boolean) => {
  if (p.text == null) { const s = big ? 44 : 32; return { html: pinHtml(p.color, big), w: s, h: s, ax: s / 2, ay: s - 2 } }
  const s = Math.round((p.size || 34) * (big ? 1.18 : 1)), r = s / 2
  const safe = p.text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const fs = Math.max(10, Math.round(s * (safe.length >= 4 ? 0.29 : safe.length === 3 ? 0.34 : 0.4)))
  return {
    html: `<svg data-bubble="1" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))"><circle cx="${r}" cy="${r}" r="${r - 2.5}" fill="${p.color}" fill-opacity="${big ? 1 : 0.9}" stroke="${big ? '#0F172A' : '#fff'}" stroke-width="${big ? 2.5 : 2}"/><text x="${r}" y="${r + fs * 0.36}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fs}" font-weight="700" fill="#fff">${safe}</text></svg>`,
    w: s, h: s, ax: r, ay: r,
  }
}
const artUrl = (html: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(html.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '))}`

type Props = {
  pins?: MapPin[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  picker?: { value: LatLng | null; onChange: (p: LatLng) => void }
  me?: LatLng | null
  className?: string
  zoomControl?: boolean
  interactive?: boolean
  /** areas to highlight — a city's outline, or a circle where there is none — shaded in their colour with a name tag */
  areas?: MapArea[]
  /** when the areas change, frame the areas alone — not the pins as well */
  fitAreasOnly?: boolean
  /** frame the pins again whenever this changes (instead of whenever the set of pins does) */
  fitKey?: string
  /** …and frame these points rather than every pin */
  fitPoints?: LatLng[]
}

/**
 * One map for three jobs:
 *  • `pins` + `onSelect`  — garages on a map (staff "My Visits", admin page)
 *  • `picker`             — pick the garage's exact spot: tap the map or drag the pin
 *  • `me`                 — the viewer's own position as a blue dot
 *  • `areas`              — highlighted areas (the cities picked on the admin's Garages page)
 *  • a pin with a `text`  — a round bubble with a number in it (contacts per city)
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
  pins = [], selectedId, onSelect, picker, me, className = '', zoomControl = true, interactive = true, areas, fitAreasOnly, fitKey, fitPoints, onFail,
}: Props & { onFail: () => void }) {
  const el = useRef<HTMLDivElement | null>(null)
  const map = useRef<any>(null)
  const markers = useRef<Map<string, any>>(new Map())
  const pickMarker = useRef<any>(null)
  const meMarker = useRef<any>(null)
  const shapes = useRef<any[]>([])
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
    return () => { clearInterval(t); clearTimeout(stop); markers.current.forEach((x) => x.setMap(null)); markers.current.clear(); shapes.current.forEach((x) => x.setMap(null)); shapes.current = []; map.current = null }
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
      const art = pinArt(p, big)
      const mk = new g.Marker({
        // bubbles: the small ones lie over the big ones, so each can be clicked
        map: m, position: { lat: p.lat, lng: p.lng }, zIndex: big ? 1000 : p.text != null ? 200 - art.w : 1, ...(p.title ? { title: p.title } : {}), ...(p.text != null ? { optimized: false } : {}),
        icon: { url: artUrl(art.html), scaledSize: new g.Size(art.w, art.h), anchor: new g.Point(art.ax, art.ay) },
      })
      mk.addListener('click', () => cb.current.onSelect?.(p.id))
      markers.current.set(p.id, mk)
    }
    const sig = fitKey ?? pins.map((p) => p.id).join(',')
    if (pins.length && sig !== fitted.current) {
      fitted.current = sig
      const frame: LatLng[] = fitPoints?.length ? fitPoints : pins
      if (frame.length === 1) { m.setCenter({ lat: frame[0].lat, lng: frame[0].lng }); m.setZoom(pins[0].text != null ? 10 : interactive ? 16 : 17) } else {
        const b = new g.LatLngBounds()
        frame.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }))
        m.fitBounds(b, 48)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pins, selectedId, interactive, fitKey])

  // highlighted areas: shaded under the pins, named, and brought into view when they change
  const sig = areaSig(areas)
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    shapes.current.forEach((x) => x.setMap(null)); shapes.current = []
    if (!ready || !g || !m || !areas?.length) return
    const b = new g.LatLngBounds()
    for (const a of areas) {
      const look = { map: m, strokeColor: a.color, strokeOpacity: 0.95, strokeWeight: 2.5, fillColor: a.color, fillOpacity: 0.12, clickable: false, zIndex: 0 }
      let top: LatLng | null = null
      for (const paths of ringsOf(a)) {
        shapes.current.push(new g.Polygon({ ...look, paths }))
        for (const p of paths[0] || []) { b.extend(p); if (!top || p.lat > top.lat) top = p }
      }
      if (!a.geometry && a.circle) {
        const c = new g.Circle({ ...look, center: { lat: a.circle.lat, lng: a.circle.lng }, radius: a.circle.radius })
        shapes.current.push(c)
        b.union(c.getBounds())
        top = { lat: c.getBounds().getNorthEast().lat(), lng: a.circle.lng }
      }
      if (top) {
        const tag = areaLabel(a.label, a.color)
        shapes.current.push(new g.Marker({ map: m, position: top, clickable: false, zIndex: 2, icon: { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(tag.svg)}`, scaledSize: new g.Size(tag.w, tag.h), anchor: new g.Point(tag.w / 2, tag.h + 2) } }))
      }
    }
    if (!fitAreasOnly) pins.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }))
    if (!b.isEmpty()) m.fitBounds(b, 40)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sig])

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
    <div className={`relative overflow-hidden bg-[#E8EEF4] ${className}`} data-map-engine="google" data-map-areas={ready ? (areas?.length || 0) : undefined} data-map-pins={ready ? pins.length : undefined}>
      <div ref={el} className="absolute inset-0 z-0" />
    </div>
  )
}

// ───────────────────────── OpenStreetMap fallback ─────────────────────────
function LeafletGarageMap({

  pins = [], selectedId, onSelect, picker, me, className = '', zoomControl = true, interactive = true, areas, fitAreasOnly, fitKey, fitPoints,
}: Props) {
  const el = useRef<HTMLDivElement | null>(null)
  const map = useRef<any>(null)
  const L = useRef<any>(null)
  const layer = useRef<any>(null)
  const areaLayer = useRef<any>(null)
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
      areaLayer.current = lib.layerGroup().addTo(m)
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
      const art = pinArt(p, big)
      const mk = lib.marker([p.lat, p.lng], {
        icon: lib.divIcon({ className: '', iconSize: [art.w, art.h], iconAnchor: [art.ax, art.ay], html: art.html }),
        zIndexOffset: big ? 1000 : p.text != null ? 200 - art.w : 0, ...(p.title ? { title: p.title } : {}),
      })
      mk.on('click', (e: any) => { lib.DomEvent.stopPropagation(e); cb.current.onSelect?.(p.id) })
      mk.addTo(layer.current)
    }
    // frame the pins once per pin set (not on every selection)
    const sig = fitKey ?? pins.map((p) => p.id).join(',')
    if (pins.length && sig !== fitted.current) {
      fitted.current = sig
      const frame: LatLng[] = fitPoints?.length ? fitPoints : pins
      if (frame.length === 1) m.setView([frame[0].lat, frame[0].lng], pins[0].text != null ? 10 : 15)
      else m.fitBounds(frame.map((p) => [p.lat, p.lng]), { padding: [40, 40], maxZoom: 15 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pins, selectedId, fitKey])

  // highlighted areas: shaded under the pins, named, and brought into view when they change
  const sig = areaSig(areas)
  useEffect(() => {
    const lib = L.current, m = map.current
    if (!ready || !lib || !m) return
    areaLayer.current.clearLayers()
    if (!areas?.length) return
    const pts: [number, number][] = fitAreasOnly ? [] : pins.map((p) => [p.lat, p.lng])
    for (const a of areas) {
      const look = { color: a.color, weight: 2.5, opacity: 0.95, fillColor: a.color, fillOpacity: 0.12, interactive: false }
      let top: LatLng | null = null
      for (const paths of ringsOf(a)) {
        lib.polygon(paths.map((r) => r.map((p) => [p.lat, p.lng])), look).addTo(areaLayer.current)
        for (const p of paths[0] || []) { pts.push([p.lat, p.lng]); if (!top || p.lat > top.lat) top = p }
      }
      if (!a.geometry && a.circle) {
        const c = lib.circle([a.circle.lat, a.circle.lng], { ...look, radius: a.circle.radius }).addTo(areaLayer.current)
        const cb2 = c.getBounds()
        pts.push([cb2.getNorth(), cb2.getWest()], [cb2.getSouth(), cb2.getEast()])
        top = { lat: cb2.getNorth(), lng: a.circle.lng }
      }
      if (top) {
        const tag = areaLabel(a.label, a.color)
        lib.marker([top.lat, top.lng], { interactive: false, zIndexOffset: -50, icon: lib.divIcon({ className: '', iconSize: [tag.w, tag.h], iconAnchor: [tag.w / 2, tag.h + 2], html: tag.svg }) }).addTo(areaLayer.current)
      }
    }
    if (pts.length) m.fitBounds(pts, { padding: [40, 40] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sig])

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
    <div className={`relative overflow-hidden bg-[#E8EEF4] ${className}`} data-map-engine="osm" data-map-areas={ready ? (areas?.length || 0) : undefined} data-map-pins={ready ? pins.length : undefined}>
      <div ref={el} className="absolute inset-0 z-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-[#64748B]">
          {failed ? 'Map could not load — check your internet' : 'Loading map…'}
        </div>
      )}
    </div>
  )
}
