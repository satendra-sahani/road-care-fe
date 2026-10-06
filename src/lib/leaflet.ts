// Leaflet (+ OpenStreetMap tiles) loaded on demand from the CDN — no API key,
// and none of it lands in the JS bundle of pages that never show a map.
let pending: Promise<any> | null = null

export function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  const w = window as any
  if (w.L) return Promise.resolve(w.L)
  if (pending) return pending
  pending = new Promise<any>((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'; link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    const existing = document.getElementById('leaflet-js') as HTMLScriptElement | null
    const done = () => (w.L ? resolve(w.L) : reject(new Error('Leaflet failed to load')))
    if (existing) { existing.addEventListener('load', done); existing.addEventListener('error', () => reject(new Error('Leaflet failed to load'))); return }
    const s = document.createElement('script')
    s.id = 'leaflet-js'; s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    s.onload = done
    s.onerror = () => { pending = null; s.remove(); reject(new Error('Leaflet failed to load')) }
    document.head.appendChild(s)
  })
  return pending
}

export const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
