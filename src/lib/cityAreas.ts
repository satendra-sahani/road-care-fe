// The outline of a city / district, to shade it on a map ("highlight Gorakhpur and Deoria"),
// and the point a city's name stands for (a map of "contacts per city").
//
// The outline comes from OpenStreetMap (Nominatim's search, which can return a place's
// boundary as GeoJSON) and is kept in this browser for a month, so a city is asked for once.
// "Gorakhpur" can mean the municipal area, the district or the division: the one chosen is
// the smallest boundary that still holds the garages we have under that city — a garage
// entered as "Gorakhpur" may sit in a village of the district. When OpenStreetMap has no
// boundary for a name, the area is a circle around the garages of that city instead.
import { loadGoogleMaps, googleMapsFailed } from '@/lib/googleMaps'

export type LatLng = { lat: number; lng: number }
export type MapArea = {
  id: string
  label: string
  color: string
  /** GeoJSON Polygon / MultiPolygon ([lng, lat] pairs) */
  geometry?: { type: 'Polygon' | 'MultiPolygon'; coordinates: any } | null
  /** used when there is no boundary: metres around a point */
  circle?: { lat: number; lng: number; radius: number } | null
}

const COLOURS = ['#F4511E', '#2563EB', '#16A34A', '#7C3AED', '#DB2777', '#0891B2', '#B45309', '#DC2626', '#4F46E5', '#0D9488']
/** the same colour for a city every time (its place in the alphabetical list of all cities) */
export const cityColour = (city: string, all: string[]) => {
  const list = [...new Set(all.map((c) => c.trim().toLowerCase()))].sort()
  const i = Math.max(0, list.indexOf(city.trim().toLowerCase()))
  return COLOURS[i % COLOURS.length]
}

// scope: a page that picks the outline by other pins than the garages keeps its own answer
const KEY = (city: string, scope = '') => `bm_city_area_v1${scope ? `.${scope}` : ''}:${city.trim().toLowerCase()}`
const MONTH = 30 * 86400000
type Stored = { at: number; geometry: MapArea['geometry']; centre: LatLng | null }
const read = (city: string, scope = ''): Stored | null => {
  try { const s = JSON.parse(localStorage.getItem(KEY(city, scope)) || 'null'); return s && Date.now() - s.at < MONTH ? s : null } catch { return null }
}
const save = (city: string, v: Stored, scope = '') => { try { localStorage.setItem(KEY(city, scope), JSON.stringify(v)) } catch { /* storage full: ask again next time */ } }

const km = (a: LatLng, b: LatLng) => {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
/** kilometres between two points */
export const kmBetween = km
const centreOf = (pts: LatLng[]): LatLng | null => (pts.length ? { lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length, lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length } : null)

/** [south, north, west, east] of a GeoJSON Polygon / MultiPolygon */
export function boundsOf(geometry: NonNullable<MapArea['geometry']>): [number, number, number, number] {
  let s = 90, n = -90, w = 180, e = -180
  const ring = (r: number[][]) => r.forEach(([lng, lat]) => { if (lat < s) s = lat; if (lat > n) n = lat; if (lng < w) w = lng; if (lng > e) e = lng })
  if (geometry.type === 'Polygon') geometry.coordinates.forEach(ring)
  else geometry.coordinates.forEach((poly: number[][][]) => poly.forEach(ring))
  return [s, n, w, e]
}

/**
 * Ask OpenStreetMap for the boundary of a place name in India.
 * near = where our garages of that city are (to tell two places of the same name apart).
 */
async function fetchBoundary(city: string, pins: LatLng[]): Promise<Stored> {
  const near = centreOf(pins)
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&polygon_geojson=1&polygon_threshold=0.003&limit=8&countrycodes=in&q=${encodeURIComponent(city)}`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 9000)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
    const hits: any[] = r.ok ? await r.json() : []
    const places = hits
      .filter((h) => h && isFinite(parseFloat(h.lat)) && !['country', 'state'].includes(h.addresstype))
      .map((h) => ({ centre: { lat: parseFloat(h.lat), lng: parseFloat(h.lon) }, geometry: ['Polygon', 'MultiPolygon'].includes(h.geojson?.type) ? h.geojson : null }))
      .filter((p) => !near || km(p.centre, near) < 120) // another place of the same name, far from our garages, is not it
    const shaped = places.filter((p) => p.geometry).map((p) => {
      const [s, n, w, e] = boundsOf(p.geometry)
      const holds = pins.filter((q) => q.lat >= s && q.lat <= n && q.lng >= w && q.lng <= e).length
      return { ...p, holds, size: (n - s) * (e - w) }
    })
    // the boundary that holds the most of our garages; among equals, the smallest
    shaped.sort((a, b) => b.holds - a.holds || a.size - b.size)
    const best = shaped[0]
    return { at: Date.now(), geometry: best?.geometry || null, centre: best?.centre || places[0]?.centre || null }
  } catch {
    return { at: 0, geometry: null, centre: null } // not kept: asked again next time
  } finally { clearTimeout(timer) }
}

/**
 * The area to shade for a city. pins = where our garages of that city are.
 * Returns null when there is neither a boundary nor a garage with a position to draw around.
 * scope = a name for the page asking, when its pins are not the garages (it then keeps its own answer,
 * and uses the garages' one when there is one).
 */
export async function cityArea(city: string, color: string, pins: LatLng[], scope = ''): Promise<MapArea | null> {
  let found = read(city, scope) || (scope ? read(city) : null)
  if (!found) {
    found = await fetchBoundary(city, pins)
    if (found.at) save(city, found, scope)
  }
  const id = `city:${city.trim().toLowerCase()}`
  if (found.geometry) return { id, label: city, color, geometry: found.geometry }
  const centre = centreOf(pins) || found.centre
  if (!centre) return null
  const reach = pins.length ? Math.max(...pins.map((p) => km(p, centre))) : 0
  return { id, label: city, color, circle: { ...centre, radius: Math.round(Math.max(3, reach * 1.25) * 1000) } }
}

// ── Where a name is: one point per city, for many cities ──────────────────────────────────────
// A list of contacts has the name of a city (or a village), not a position. The points found are
// kept together in one small entry in this browser: a place that was found for half a year, a
// name that was not for two weeks (it is asked again then — the map may have learnt it since).
const POINTS = 'bm_city_points_v1'
const FOUND_FOR = 180 * 86400000, MISSING_FOR = 14 * 86400000
/** key → [lat, lng, when]; lat = lng = 0 means "asked, not found" */
type Points = Record<string, [number, number, number]>
const points = (): Points => { try { const p = JSON.parse(localStorage.getItem(POINTS) || '{}'); return p && typeof p === 'object' ? p : {} } catch { return {} } }
const cityKey = (city: string) => city.replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * What this browser already knows of these names: a point, or null = asked and not found.
 * A name that is not in the answer has not been asked yet.
 */
export function knownCityPoints(cities: string[]): Record<string, LatLng | null> {
  const all = points(), out: Record<string, LatLng | null> = {}
  for (const c of cities) {
    const v = all[cityKey(c)]
    if (!Array.isArray(v)) continue
    const found = !!(v[0] || v[1])
    if (Date.now() - v[2] < (found ? FOUND_FOR : MISSING_FOR)) out[cityKey(c)] = found ? { lat: v[0], lng: v[1] } : null
  }
  return out
}

/** "around here": the district and its neighbours — and, wider, the region */
const NEAR_KM = 75, WIDE_KM = 250
type Hit = { at: LatLng; /** a town everybody knows, not a hamlet */ known: boolean }

/**
 * Which of the answers is meant. They come best-known first. A village's name exists many times over
 * in India: the one meant is the one near where most of the people are (hubs) — around here first,
 * then in the region; a namesake further away is believed only when it is a known town.
 */
const choose = (hits: Hit[], hubs: LatLng[]): LatLng | null => {
  if (!hubs.length) return hits[0]?.at || null
  const within = (d: number) => hits.find((h) => hubs.some((x) => km(h.at, x) <= d))?.at
  return within(NEAR_KM) || within(WIDE_KM) || hits.find((h) => h.known)?.at || null
}

let googleOff = false
/**
 * The same question to Google (the key the map is drawn with), for the names OpenStreetMap does not
 * have — it knows many more small places in India. 'off' = it cannot be asked at all (no key, no
 * geocoding on the key); undefined = it did not answer this time.
 */
async function askGoogle(city: string, hubs: LatLng[]): Promise<Hit[] | 'off' | undefined> {
  if (googleOff || typeof window === 'undefined') return 'off'
  let g: any
  try { g = await loadGoogleMaps() } catch { googleOff = true; return 'off' }
  if (googleMapsFailed()) { googleOff = true; return 'off' }
  try {
    const Geocoder = g.Geocoder || (g.importLibrary ? (await g.importLibrary('geocoding'))?.Geocoder : null)
    if (!Geocoder) { googleOff = true; return 'off' }
    const hub = hubs[0]
    const res: any = await Promise.race([
      new Geocoder().geocode({ address: city, componentRestrictions: { country: 'IN' }, ...(hub ? { bounds: { south: hub.lat - 1.5, west: hub.lng - 1.5, north: hub.lat + 1.5, east: hub.lng + 1.5 } } : {}) }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 7000)),
    ])
    return ((res?.results || []) as any[])
      // "India" or a whole state is not where a place is
      .filter((r) => r?.geometry?.location && !(r.types || []).some((t: string) => ['country', 'administrative_area_level_1'].includes(t)))
      .map((r) => ({ at: { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() }, known: !r.partial_match && (r.types || []).includes('locality') }))
  } catch (e: any) {
    const why = `${e?.code || ''} ${e?.message || ''}`
    if (/ZERO_RESULTS/i.test(why)) return []
    if (/REQUEST_DENIED|ApiNotActivated|InvalidKey|OVER_DAILY_LIMIT/i.test(why)) { googleOff = true; return 'off' } // the key has no geocoding — stop asking
    return undefined
  }
}

/**
 * Ask where a place is, and remember the answer: OpenStreetMap first, Google for a name it does not have.
 * hubs = where most of the people are (see choose).
 * Returns the point, null when there is no fitting place, undefined when the question could not
 * be asked (no network) — that is not remembered.
 */
export async function findCityPoint(city: string, hubs: LatLng[] = []): Promise<LatLng | null | undefined> {
  const hub = hubs[0]
  const box = hub ? `&viewbox=${(hub.lng - 1.5).toFixed(3)},${(hub.lat + 1.5).toFixed(3)},${(hub.lng + 1.5).toFixed(3)},${(hub.lat - 1.5).toFixed(3)}&bounded=0` : ''
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=in${box}&q=${encodeURIComponent(city)}`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 9000)
  let best: LatLng | null = null
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
    if (!r.ok) return undefined
    const hits: Hit[] = ((await r.json()) as any[])
      .filter((h) => h && isFinite(parseFloat(h.lat)) && isFinite(parseFloat(h.lon)) && !['country', 'state'].includes(h.addresstype))
      .map((h) => ({ at: { lat: parseFloat(h.lat), lng: parseFloat(h.lon) }, known: (Number(h.place_rank) || 30) <= 16 && (Number(h.importance) || 0) >= 0.45 }))
    best = choose(hits, hubs)
  } catch { return undefined } finally { clearTimeout(timer) }
  if (!best) {
    const more = await askGoogle(city, hubs)
    if (more === undefined) return null // it did not answer: not on the map for now, and asked again next time
    if (more !== 'off') best = choose(more, hubs)
  }
  try {
    const all = points()
    all[cityKey(city)] = best ? [+best.lat.toFixed(5), +best.lng.toFixed(5), Date.now()] : [0, 0, Date.now()]
    localStorage.setItem(POINTS, JSON.stringify(all))
  } catch { /* storage full: asked again next time */ }
  return best
}
