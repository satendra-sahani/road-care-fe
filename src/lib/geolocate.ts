// The pin a service request carries — the point a mechanic drives to.
// Browser helpers for reading it carefully and for deciding when to send it.

export type Fix = { latitude: number; longitude: number; accuracy: number }

/** Above this margin (metres) a fix is not a pin to drive to. */
export const PIN_MAX_M = 200

/** A real place on the map, or null: both numbers present, in range, and not 0,0. */
export const validCoords = (latitude: unknown, longitude: unknown): { latitude: number; longitude: number } | null => {
  if (latitude == null || longitude == null || latitude === '' || longitude === '') return null
  const lat = Number(latitude), lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null
  return { latitude: lat, longitude: lng }
}

// split on spaces and punctuation (works for any script, Hindi included); one-letter bits don't count
const words = (s: string) => String(s || '').toLowerCase().split(/[\s,.;:()[\]/\\|#'"`~!?&+*=<>_-]+/).filter((w) => w.length >= 2)

/**
 * Does the address the customer ends up with still describe the place the pin
 * was taken at? Adding a flat number keeps it; typing a different address does
 * not — and then the pin must NOT be sent, or the mechanic is routed to where
 * the customer was sitting instead of where the vehicle is.
 */
export const sameSpot = (pinnedLine: string, currentLine: string): boolean => {
  const pinned = words(pinnedLine)
  if (!pinned.length) return false
  const now = new Set(words(currentLine))
  return pinned.filter((w) => now.has(w)).length / pinned.length >= 0.6
}

/**
 * The best position the browser can give within a few seconds. A bare
 * getCurrentPosition() answers at once with a network guess that can be hundreds
 * of metres off; this watches the GPS, resolves the moment a fix is sharp
 * (25 m or better) and otherwise with the sharpest one after `settleMs`.
 * Rejects with Error('denied' | 'unsupported' | 'timeout').
 */
export const bestPosition = (settleMs = 3500): Promise<Fix> => new Promise((resolve, reject) => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) { reject(new Error('unsupported')); return }
  let best: Fix | null = null
  let done = false
  let id = -1
  const timers: ReturnType<typeof setTimeout>[] = []
  const finish = (err?: Error) => {
    if (done) return
    done = true
    try { navigator.geolocation.clearWatch(id) } catch { /* noop */ }
    timers.forEach(clearTimeout)
    if (best) resolve(best); else reject(err || new Error('timeout'))
  }
  id = navigator.geolocation.watchPosition(
    (p) => {
      const f = { latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy > 0 ? p.coords.accuracy : 9999 }
      if (!best || f.accuracy < best.accuracy) best = f
      if (f.accuracy <= 25) finish()
    },
    (e) => { if (e.code === 1) finish(new Error('denied')) },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
  )
  timers.push(setTimeout(() => { if (best) finish() }, settleMs))
  timers.push(setTimeout(() => finish(new Error('timeout')), 12000))
})
