// The outline of a city / district, to shade it on a map ("highlight Gorakhpur and Deoria").
//
// The outline comes from OpenStreetMap (Nominatim's search, which can return a place's
// boundary as GeoJSON) and is kept in this browser for a month, so a city is asked for once.
// "Gorakhpur" can mean the municipal area, the district or the division: the one chosen is
// the smallest boundary that still holds the garages we have under that city — a garage
// entered as "Gorakhpur" may sit in a village of the district. When OpenStreetMap has no
// boundary for a name, the area is a circle around the garages of that city instead.

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

const KEY = (city: string) => `bm_city_area_v1:${city.trim().toLowerCase()}`
const MONTH = 30 * 86400000
type Stored = { at: number; geometry: MapArea['geometry']; centre: LatLng | null }
const read = (city: string): Stored | null => {
  try { const s = JSON.parse(localStorage.getItem(KEY(city)) || 'null'); return s && Date.now() - s.at < MONTH ? s : null } catch { return null }
}
const save = (city: string, v: Stored) => { try { localStorage.setItem(KEY(city), JSON.stringify(v)) } catch { /* storage full: ask again next time */ } }

const km = (a: LatLng, b: LatLng) => {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
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
 */
export async function cityArea(city: string, color: string, pins: LatLng[]): Promise<MapArea | null> {
  let found = read(city)
  if (!found) {
    found = await fetchBoundary(city, pins)
    if (found.at) save(city, found)
  }
  const id = `city:${city.trim().toLowerCase()}`
  if (found.geometry) return { id, label: city, color, geometry: found.geometry }
  const centre = centreOf(pins) || found.centre
  if (!centre) return null
  const reach = pins.length ? Math.max(...pins.map((p) => km(p, centre))) : 0
  return { id, label: city, color, circle: { ...centre, radius: Math.round(Math.max(3, reach * 1.25) * 1000) } }
}
