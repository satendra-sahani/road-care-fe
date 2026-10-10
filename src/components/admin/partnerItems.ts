import type { Mechanic } from '@/store/slices/mechanicSlice'
import { loadGoogleMaps } from '@/lib/googleMaps'
import { kmBetween } from './serviceRequestUi'

// A garage (shop partner, or a garage our field staff registered) and an independent
// mechanic as one kind of row: who it is, where it is and how far from the customer.
// Shared by "Assign Mechanic / Garage", the nearest list of "Create Service Request"
// and the contact card of an assigned garage / mechanic — so all three agree.

export type Pt = { lat: number; lng: number }
export type PartnerItem = {
  id: string; kind: 'garage' | 'mechanic'; name: string; photo?: string; verified: boolean
  rating: number; ratings: number; place: string; pt: Pt | null; km: number | null
  open: boolean | null; hours: string; status: 'available' | 'busy' | 'closed' | 'offline'
  chips: string[]; vehicles: string[]; phone?: string; raw: any
  // a garage's mechanics with their numbers (those with their own accounts and the ones the garage only listed)
  team: { name: string; phone: string }[]
  // field = registered by our field staff, not a shop partner yet; doorstep = sends a mechanic to the customer (null = not recorded)
  field: boolean; fieldBy: string; pending: boolean; doorstep: boolean | null
}

/** a row of the nearest list as a numbered pin on the map of Create Service Request */
export type NearbyPin = { id: string; n: number; lat: number; lng: number; title: string; color: string; onClick?: () => void }

export const to12 = (t?: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); if (!m) return ''; const h = +m[1]; return `${h % 12 || 12}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}` }
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const isOpenNow = (h?: { open?: string; close?: string; workingDays?: string[] }): boolean | null => {
  if (!h?.open || !h?.close) return null
  const now = new Date()
  if (h.workingDays?.length && !h.workingDays.includes(DAYS[now.getDay()])) return false
  const mins = (t: string) => { const [a, b] = t.split(':').map(Number); return a * 60 + (b || 0) }
  const n = now.getHours() * 60 + now.getMinutes()
  return n >= mins(h.open) && n < mins(h.close)
}
export const PARTNER_STATUS = {
  available: { label: 'Available Now', fg: '#15803D', bg: '#DCFCE7', dot: '#16A34A' },
  busy: { label: 'Busy', fg: '#B45309', bg: '#FEF3C7', dot: '#F59E0B' },
  closed: { label: 'Closed', fg: '#B91C1C', bg: '#FEE2E2', dot: '#DC2626' },
  offline: { label: 'Offline', fg: '#475569', bg: '#E2E8F0', dot: '#64748B' },
} as const
/** a numbered map pin as an image link */
export const numPin = (n: number | string, color: string, big: boolean) => {
  const s = big ? 44 : 36
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24"><path fill="${color}" stroke="#fff" stroke-width="1.2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><text x="12" y="12.2" text-anchor="middle" font-family="Arial,sans-serif" font-size="7.5" font-weight="700" fill="#fff">${n}</text></svg>`
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, s }
}

const kmFrom = (cust: Pt | null, pt: Pt | null) => (pt && cust ? kmBetween({ latitude: cust.lat, longitude: cust.lng }, { latitude: pt.lat, longitude: pt.lng }) : null)

/** a shop partner (or a field garage shaped like one) as a row; `cust` = where the customer is, when known */
export const garageItem = (s: any, cust: Pt | null): PartnerItem => {
  const co = s.address?.coordinates
  const pt = co?.latitude != null && co?.longitude != null ? { lat: co.latitude, lng: co.longitude } : null
  const openNow = isOpenNow(s.operatingHours)
  // `team` comes with the admin's list (GET /admin/shops/teams); without it, the names the garage listed itself
  const team: { name: string; phone: string }[] = (Array.isArray(s.team) ? s.team : (s.mechanics || []).filter((m: any) => m?.isActive !== false))
    .filter((m: any) => m?.name || m?.phone).map((m: any) => ({ name: String(m.name || 'Mechanic'), phone: String(m.phone || '') }))
  return {
    id: s._id, kind: 'garage', name: s.shopName || 'Garage', photo: s.shopImages?.[0]?.url || s.logo || undefined, verified: !!s.isVerified,
    rating: s.rating || 0, ratings: s.totalRatings || 0, place: [s.address?.area || s.address?.street, s.address?.city].filter(Boolean).join(', ') || s.address?.city || '—',
    pt, km: kmFrom(cust, pt),
    open: openNow, hours: s.operatingHours?.open ? `${to12(s.operatingHours.open)} – ${to12(s.operatingHours.close)}` : '',
    status: s.isAvailable === false ? 'offline' : openNow === false ? 'closed' : 'available',
    chips: s.specializations || [], vehicles: s.vehicleTypes || [], phone: s.shopPhone || s.user?.phone, raw: s, team,
    field: s.source === 'field', fieldBy: s.fieldStaff || '', pending: s.source === 'field' && s.fieldStatus !== 'active', doorstep: typeof s.doorstepService === 'boolean' ? s.doorstepService : null,
  }
}

/** an independent platform mechanic as a row */
export const mechanicItem = (m: Mechanic, cust: Pt | null): PartnerItem => {
  const pt = m.currentLocation?.latitude != null && m.currentLocation?.longitude != null ? { lat: m.currentLocation.latitude, lng: m.currentLocation.longitude } : null
  return {
    id: m._id, kind: 'mechanic', name: m.name || 'Mechanic', photo: m.kyc?.photo || undefined, verified: !!m.isVerified,
    rating: m.rating || 0, ratings: m.completedServices || 0, place: [m.location, m.city].filter(Boolean).join(', ') || '—',
    pt, km: kmFrom(cust, pt),
    open: null, hours: m.experience ? `${m.experience} experience` : '',
    status: m.availability === 'available' ? 'available' : m.availability === 'busy' ? 'busy' : 'offline',
    chips: m.specializations || [], vehicles: m.vehicleTypes || [], phone: m.phone, raw: m, team: [],
    field: false, fieldBy: '', pending: false, doorstep: null,
  }
}

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
export const geocodeAddress = async (queries: string[]): Promise<Pt | null> => {
  for (const q of queries) { const p = await geocodeOne(q); if (p) return p }
  return null
}

// ── phone numbers: stored as 10 digits, sometimes with +91 or spaces ──
export const phone10 = (p?: string | null) => String(p || '').replace(/\D/g, '').slice(-10)
export const hasPhone = (p?: string | null) => phone10(p).length === 10
export const prettyPhone = (p?: string | null) => { const d = phone10(p); return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : String(p || '').trim() }
export const telHref = (p?: string | null) => `tel:+91${phone10(p)}`
export const waHref = (p?: string | null) => `https://wa.me/91${phone10(p)}`

/** "5 min ago", "3 h ago", "2 days ago" */
export const agoText = (d?: string | null) => {
  const t = d ? new Date(d).getTime() : NaN
  if (!isFinite(t)) return ''
  const m = Math.max(0, Math.round((Date.now() - t) / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  if (m < 60 * 36) return `${Math.round(m / 60)} h ago`
  return `${Math.round(m / 1440)} days ago`
}
export const kmText = (km: number | null | undefined, approx = false) => (km == null ? '' : `${approx ? '~' : ''}${km < 10 ? km.toFixed(1) : Math.round(km)} km`)
