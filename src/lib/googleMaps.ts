// Google Maps JavaScript API, loaded on demand. The browser key is admin-managed
// (Key Management) and served by GET /common/config/maps — it is a client-side
// key by design, restricted by HTTP referrer in Google Cloud Console.
// Rejects when there is no key, the script can't load or Google refuses the key,
// so callers can fall back to the OpenStreetMap map (src/lib/leaflet.ts).
import api from '@/services/api'

let pending: Promise<any> | null = null

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  const w = window as any
  if (w.google?.maps?.Map) return Promise.resolve(w.google.maps)
  if (pending) return pending
  pending = (async () => {
    const r = await api.get('/common/config/maps')
    const key = r.data?.data?.web
    if (!key) throw new Error('No Google Maps key')
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Google Maps timed out')), 12000)
      w.gm_authFailure = () => { clearTimeout(timer); w.__bmGmapsFailed = true; reject(new Error('Google Maps key refused')) }
      w.__bmGmapsReady = () => { clearTimeout(timer); resolve() }
      const s = document.createElement('script')
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=__bmGmapsReady`
      s.async = true
      s.onerror = () => { clearTimeout(timer); s.remove(); reject(new Error('Google Maps failed to load')) }
      document.head.appendChild(s)
    })
    if (!w.google?.maps?.Map) throw new Error('Google Maps unavailable')
    return w.google.maps
  })()
  pending.catch(() => { pending = null })
  return pending
}

/** Google refused the key after the map was created (billing / referrer) — use the fallback map. */
export const googleMapsFailed = () => typeof window !== 'undefined' && !!(window as any).__bmGmapsFailed
