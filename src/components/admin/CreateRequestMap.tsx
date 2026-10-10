'use client'

import { useEffect, useRef, useState } from 'react'
import { LocateFixed, Minus, Plus, Loader2, MapPin, Map as MapIcon, Layers } from 'lucide-react'
import { loadGoogleMaps, googleMapsFailed } from '@/lib/googleMaps'
import { GarageMap } from '@/components/manager/GarageMap'
import { numPin, type NearbyPin } from './partnerItems'

// Location preview of the "Create Service Request" dialog: a Google map opened
// wide enough to read the area and city names around the customer, with the pin
// (tap the map or drag the pin to correct it) and a circle the size of the
// phone's margin of error: a dot when the GPS is sure, wide when it is not.
// "Change Location" goes down to street level for an exact drop.
// If Google Maps cannot load (no key, key refused, blocked network) the
// OpenStreetMap picker is used instead, so the dialog never loses its map.

type LatLng = { lat: number; lng: number }

const AREA_ZOOM = 14    // neighbourhoods and the city name are readable
const STREET_ZOOM = 18  // shop names and lanes, for an exact pin
const MIN_RADIUS_M = 12 // the circle is the phone's margin of error; never draw it smaller than this
const INDIA: LatLng = { lat: 22.6, lng: 79 }
const PIN = `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 24 24"><path fill="#E11D2E" stroke="#fff" stroke-width="1.2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.8" fill="#fff"/></svg>`
/** map centre that shows `p` shifted `px` pixels to the left of the middle at zoom `z` (room for the info card on the right) */
const centreFor = (p: LatLng, z: number, px: number): LatLng => ({ lat: p.lat, lng: p.lng + (px * 360) / (256 * 2 ** z) })
const ctl = 'flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#16305C] shadow-[0_2px_8px_rgba(15,23,42,.18)] hover:bg-[#F3F5F9]'

export function CreateRequestMap({ value, accuracy, onChange, className = '', offsetX = 0, focusKey = '', nearby, fitKey = 0, radiusKm = 0 }: {
  value: LatLng | null
  /** metres, when the phone reported it */
  accuracy?: number | null
  onChange: (p: LatLng) => void
  className?: string
  /** show the pin this many pixels left of the centre (an overlay covers the right side) */
  offsetX?: number
  /** changes whenever a position arrives that the admin did not place by hand — the map then centres on it */
  focusKey?: string
  /** the nearest garages / mechanics, drawn as small numbered pins (Google map only) */
  nearby?: NearbyPin[]
  /** each change zooms out until the customer and those pins are all in view */
  fitKey?: number
  /** the search radius drawn around the customer, km (0 = none) */
  radiusKm?: number
}) {
  const [engine, setEngine] = useState<'loading' | 'google' | 'osm'>('loading')
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap')
  const [zoom, setZoom] = useState(AREA_ZOOM)
  const el = useRef<HTMLDivElement | null>(null)
  const map = useRef<any>(null)
  const marker = useRef<any>(null)
  const ring = useRef<any>(null) // the search radius
  const circle = useRef<any>(null)
  const pins = useRef<any[]>([])
  const cb = useRef(onChange)
  cb.current = onChange

  useEffect(() => {
    let off = false
    loadGoogleMaps().then(() => { if (!off) setEngine(googleMapsFailed() ? 'osm' : 'google') }).catch(() => { if (!off) setEngine('osm') })
    return () => { off = true }
  }, [])

  useEffect(() => {
    if (engine !== 'google' || !el.current) return
    const g = (window as any).google?.maps
    if (!g) { setEngine('osm'); return }
    const m = new g.Map(el.current, {
      center: value ? centreFor(value, AREA_ZOOM, offsetX) : INDIA, zoom: value ? AREA_ZOOM : 5,
      disableDefaultUI: true, gestureHandling: 'greedy', keyboardShortcuts: false,
      clickableIcons: false, // tapping a shop name moves the pin instead of opening Google's card
    })
    m.addListener('click', (e: any) => cb.current({ lat: e.latLng.lat(), lng: e.latLng.lng() }))
    m.addListener('zoom_changed', () => setZoom(m.getZoom() || AREA_ZOOM))
    map.current = m
    // Google reports a refused key (billing / referrer) only after the map exists
    const t = setInterval(() => { if (googleMapsFailed()) { clearInterval(t); setEngine('osm') } }, 1000)
    const stop = setTimeout(() => clearInterval(t), 8000)
    return () => {
      clearInterval(t); clearTimeout(stop)
      marker.current?.setMap(null); circle.current?.setMap(null)
      pins.current.forEach((x) => x.setMap(null)); pins.current = []
      marker.current = null; circle.current = null; map.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine])

  // the pin and the circle around it
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    if (engine !== 'google' || !g || !m) return
    if (!value) {
      marker.current?.setMap(null); circle.current?.setMap(null); ring.current?.setMap(null)
      marker.current = null; circle.current = null; ring.current = null
      return
    }
    const radius = accuracy && accuracy > 0 ? Math.max(accuracy, MIN_RADIUS_M) : 0 // a hand-placed pin has no margin
    if (!marker.current) {
      marker.current = new g.Marker({
        map: m, position: value, draggable: true, zIndex: 10, title: 'Customer location — drag to correct',
        icon: { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(PIN)}`, scaledSize: new g.Size(46, 46), anchor: new g.Point(23, 44) },
      })
      marker.current.addListener('dragend', (e: any) => cb.current({ lat: e.latLng.lat(), lng: e.latLng.lng() }))
      circle.current = new g.Circle({ map: m, center: value, radius, visible: radius > 0, strokeColor: '#2563EB', strokeOpacity: 0.85, strokeWeight: 1.5, fillColor: '#3B82F6', fillOpacity: 0.14, clickable: false })
      m.setZoom(AREA_ZOOM); m.setCenter(centreFor(value, AREA_ZOOM, offsetX))
      return
    }
    marker.current.setPosition(value)
    circle.current.setCenter(value); circle.current.setRadius(radius); circle.current.setVisible(radius > 0)
    // A new place outside the view (the customer just shared, another address was
    // picked) → show its area. A correction inside the view keeps the admin's zoom.
    if (!m.getBounds()?.contains(value) || (m.getZoom() || 0) < 11) { m.setZoom(AREA_ZOOM); m.setCenter(centreFor(value, AREA_ZOOM, offsetX)) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, value?.lat, value?.lng, accuracy])

  // the search radius: a light ring around the customer; a new radius brings it whole into view
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    if (engine !== 'google' || !g || !m) return
    if (!value || !radiusKm) { ring.current?.setMap(null); ring.current = null; return }
    if (!ring.current) ring.current = new g.Circle({ map: m, strokeColor: '#2563EB', strokeOpacity: 0.9, strokeWeight: 1.5, fillColor: '#3B82F6', fillOpacity: 0.07, clickable: false, zIndex: 1 })
    ring.current.setMap(m); ring.current.setCenter(value); ring.current.setRadius(radiusKm * 1000)
    const b = ring.current.getBounds(); if (b) m.fitBounds(b, { top: 24, bottom: 48, left: 52, right: 24 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, value?.lat, value?.lng, radiusKm])

  // A position that came from the customer's phone (or a picked address) may sit at
  // the edge of what is on screen: bring it into the middle, keeping the admin's zoom.
  // A rough fix is shown with its whole circle, so the uncertainty is plain to see.
  useEffect(() => {
    const m = map.current
    if (engine !== 'google' || !m || !value || !focusKey) return
    if (accuracy && accuracy > 250 && circle.current?.getBounds()) { m.fitBounds(circle.current.getBounds(), 28); return }
    const z = Math.max(m.getZoom() || 0, AREA_ZOOM)
    m.setZoom(z); m.setCenter(centreFor(value, z, offsetX))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, focusKey])

  // the nearest garages / mechanics, numbered like the list beside the map; a tap opens that one's card
  const nearSig = (nearby || []).map((p) => `${p.id}:${p.n}:${p.lat},${p.lng}:${p.color}`).join(';')
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    pins.current.forEach((x) => x.setMap(null)); pins.current = []
    if (engine !== 'google' || !g || !m) return
    ;(nearby || []).forEach((p) => {
      const { url, s } = numPin(p.n, p.color, false)
      const mk = new g.Marker({ map: m, position: { lat: p.lat, lng: p.lng }, zIndex: 5, title: p.title, icon: { url, scaledSize: new g.Size(s, s), anchor: new g.Point(s / 2, s - 2) } })
      mk.addListener('click', () => p.onClick?.())
      pins.current.push(mk)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, nearSig])
  useEffect(() => {
    const g = (window as any).google?.maps, m = map.current
    if (engine !== 'google' || !g || !m || !fitKey || !value || !(nearby || []).length) return
    const b = new g.LatLngBounds()
    b.extend(value)
    ;(nearby || []).forEach((p) => b.extend({ lat: p.lat, lng: p.lng }))
    m.fitBounds(b, { top: 40, bottom: 48, left: 52, right: 36 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, fitKey])

  useEffect(() => { if (engine === 'google') map.current?.setMapTypeId(mapType) }, [engine, mapType])

  if (engine === 'osm') return <GarageMap picker={{ value, onChange }} className={className} zoomControl={false} />

  const close = zoom >= 17
  return (
    <div className={`relative overflow-hidden bg-[#E8EEF4] ${className}`} data-map-engine={engine}>
      <div ref={el} className="absolute inset-0" />
      {engine === 'loading' && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#16305C]" /></div>}
      {engine === 'google' && (
        <>
          <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5">
            <button type="button" title="Zoom in" onClick={() => map.current?.setZoom((map.current.getZoom() || AREA_ZOOM) + 1)} className={ctl}><Plus className="h-[18px] w-[18px]" /></button>
            <button type="button" title="Zoom out" onClick={() => map.current?.setZoom((map.current.getZoom() || AREA_ZOOM) - 1)} className={ctl}><Minus className="h-[18px] w-[18px]" /></button>
            {value && <button type="button" title="Back to the customer" onClick={() => { const z = Math.max(map.current?.getZoom() || 0, AREA_ZOOM); map.current?.setZoom(z); map.current?.setCenter(centreFor(value, z, offsetX)) }} className={ctl}><LocateFixed className="h-[18px] w-[18px]" /></button>}
            <button type="button" title={mapType === 'roadmap' ? 'Satellite view' : 'Map view'} onClick={() => setMapType((t) => (t === 'roadmap' ? 'hybrid' : 'roadmap'))} className={ctl}>
              {mapType === 'roadmap' ? <Layers className="h-[18px] w-[18px]" /> : <MapIcon className="h-[18px] w-[18px]" />}
            </button>
          </div>
          {value && (
            <button type="button" data-change-location onClick={() => { const z = close ? AREA_ZOOM : STREET_ZOOM; map.current?.setZoom(z); map.current?.setCenter(centreFor(value, z, offsetX)) }}
              className="absolute bottom-8 right-2.5 z-10 flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-[12.5px] font-bold text-[#1E40E0] shadow-[0_2px_8px_rgba(15,23,42,.18)] hover:bg-[#F3F6FC]">
              <MapPin className="h-4 w-4" />{close ? 'Show Area' : 'Change Location'}
            </button>
          )}
          {value && close && <div className="pointer-events-none absolute left-14 top-2.5 z-10 max-w-[150px] rounded-lg bg-[#0F1E46]/90 px-2.5 py-1.5 text-[11.5px] font-semibold leading-snug text-white">Drag the pin or tap the exact spot</div>}
        </>
      )}
    </div>
  )
}
