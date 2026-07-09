import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { shareAPI } from '@/services/api'
import { MapPin, ShieldCheck, Loader2, Clock, AlertCircle, Navigation2, Phone, User, Crosshair } from 'lucide-react'

type Loc = {
  label: string; lat: number | null; lng: number | null
  speed: number; ignition: boolean; status: string
  updatedAt: string | null; expiresAt: string
}
type Phase = 'loading' | 'form' | 'otp' | 'view' | 'invalid' | 'inactive'

const fmtTime = (d?: string | null) => {
  if (!d) return '—'
  try { return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return '—' }
}

// Straight-line distance (km) between two lat/lng points — for the "X km away" hint.
const distanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

// Defined at module scope (NOT inside the component) — otherwise it is a new
// component type on every render, so React remounts the whole subtree and the
// name/phone inputs lose focus after each keystroke.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F3F5F9' }} className="flex flex-col">
      <Head><title>Live Location — Bharat Mechanics</title></Head>
      <div className="px-4 py-3 text-white flex items-center gap-2" style={{ background: 'linear-gradient(120deg,#0E2042,#1B3B6F)' }}>
        <ShieldCheck className="h-5 w-5 text-[#6EE7B7]" />
        <span className="font-extrabold tracking-tight">Bharat Mechanics</span>
        <span className="ml-auto text-[11px] text-white/60 font-semibold uppercase tracking-wider">Live Location</span>
      </div>
      <div className="flex-1 flex items-start justify-center p-4">
        <div className="w-full max-w-md mt-6">{children}</div>
      </div>
    </div>
  )
}

export default function ShareTrackPage() {
  const router = useRouter()
  const token = (router.query.token as string) || ''
  const [phase, setPhase] = useState<Phase>('loading')
  const [meta, setMeta] = useState<any>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [loc, setLoc] = useState<Loc | null>(null)
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Once viewing, ask the viewer's browser for their own location so we can draw
  // the route to the vehicle and offer turn-by-turn navigation. Best-effort — if
  // they decline, we still show the vehicle location as before.
  useEffect(() => {
    if (phase !== 'view' || typeof navigator === 'undefined' || !navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => { /* permission denied / unavailable — ignore */ },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 20000 },
    )
    return () => { try { navigator.geolocation.clearWatch(id) } catch { /* noop */ } }
  }, [phase])

  // ── Interactive, zoomable map (Leaflet + OpenStreetMap) — stays inside the
  // page, no Google redirect. Shows the vehicle AND the viewer, with a line
  // between them; users can pinch/scroll/±-zoom freely.
  const mapDivRef = useRef<HTMLDivElement | null>(null)
  const LRef = useRef<any>(null)
  const mapRef = useRef<any>(null)
  const vehMarkerRef = useRef<any>(null)
  const meMarkerRef = useRef<any>(null)
  const lineRef = useRef<any>(null)
  const fittedRef = useRef(false)

  const loadLeaflet = () => new Promise<any>((resolve) => {
    const w = window as any
    if (w.L) return resolve(w.L)
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'; link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    const existing = document.getElementById('leaflet-js') as HTMLScriptElement | null
    if (existing) { existing.addEventListener('load', () => resolve((window as any).L)); return }
    const s = document.createElement('script')
    s.id = 'leaflet-js'; s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    s.onload = () => resolve((window as any).L)
    document.head.appendChild(s)
  })

  const fitBoth = useCallback(() => {
    const L = LRef.current, map = mapRef.current
    if (!L || !map) return
    const hasV = loc && typeof loc.lat === 'number' && typeof loc.lng === 'number'
    if (hasV && me) map.fitBounds([[me.lat, me.lng], [loc!.lat, loc!.lng]], { padding: [55, 55], maxZoom: 16 })
    else if (hasV) map.setView([loc!.lat as number, loc!.lng as number], 16)
    else if (me) map.setView([me.lat, me.lng], 15)
  }, [loc, me])

  useEffect(() => {
    if (phase !== 'view') return
    let cancelled = false
    loadLeaflet().then((L) => {
      if (cancelled) return
      LRef.current = L
      if (!mapRef.current && mapDivRef.current) {
        const map = L.map(mapDivRef.current, { zoomControl: true, attributionControl: false }).setView([20.5937, 78.9629], 5)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, subdomains: 'abc' }).addTo(map)
        mapRef.current = map
        setTimeout(() => { try { map.invalidateSize() } catch { /* noop */ } }, 60)
      }
      const map = mapRef.current
      if (!map) return
      const vehIcon = L.divIcon({ className: '', iconSize: [40, 40], iconAnchor: [20, 20], html: '<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center"><div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(255,107,53,.22)"></div><div style="width:30px;height:30px;border-radius:50%;background:#fff;border:2px solid #FF6B35;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,.25)">🚗</div></div>' })
      const meIcon = L.divIcon({ className: '', iconSize: [24, 24], iconAnchor: [12, 12], html: '<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center"><div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(37,99,235,.22)"></div><div style="width:14px;height:14px;border-radius:50%;background:#2563EB;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div></div>' })
      const hasV = loc && typeof loc.lat === 'number' && typeof loc.lng === 'number'
      if (hasV) {
        const vp: [number, number] = [loc!.lat as number, loc!.lng as number]
        if (vehMarkerRef.current) vehMarkerRef.current.setLatLng(vp)
        else vehMarkerRef.current = L.marker(vp, { icon: vehIcon }).addTo(map)
      }
      if (me) {
        const mp: [number, number] = [me.lat, me.lng]
        if (meMarkerRef.current) meMarkerRef.current.setLatLng(mp)
        else meMarkerRef.current = L.marker(mp, { icon: meIcon }).addTo(map)
      }
      if (hasV && me) {
        const pts: [number, number][] = [[me.lat, me.lng], [loc!.lat as number, loc!.lng as number]]
        if (lineRef.current) lineRef.current.setLatLngs(pts)
        else lineRef.current = L.polyline(pts, { color: '#1B3B6F', weight: 3, dashArray: '6 9', opacity: 0.7 }).addTo(map)
      }
      if (!fittedRef.current && (hasV || me)) { fitBoth(); fittedRef.current = true }
    })
    return () => { cancelled = true }
  }, [phase, loc, me, fitBoth])

  useEffect(() => () => { try { mapRef.current?.remove() } catch { /* noop */ } mapRef.current = null }, [])

  useEffect(() => {
    if (!token) return
    shareAPI.meta(token)
      .then((r) => {
        const d = r.data?.data
        setMeta(d)
        if (!r.data?.success || !d) setPhase('invalid')
        else if (!d.active) setPhase('inactive')
        else setPhase('form')
      })
      .catch(() => setPhase('invalid'))
  }, [token])

  const fetchLoc = useCallback(async (at: string) => {
    try {
      const r = await shareAPI.location(token, at)
      if (r.data?.success) setLoc(r.data.data)
    } catch (e: any) {
      const s = e?.response?.status
      if (s === 410) { setPhase('inactive'); if (pollRef.current) clearInterval(pollRef.current) }
      else if (s === 401 || s === 403) { setPhase('form'); setAccessToken(''); if (pollRef.current) clearInterval(pollRef.current) }
    }
  }, [token])

  useEffect(() => {
    if (phase === 'view' && accessToken) {
      fetchLoc(accessToken)
      pollRef.current = setInterval(() => fetchLoc(accessToken), 15000)
      return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }
  }, [phase, accessToken, fetchLoc])

  const sendOtp = async () => {
    setErr('')
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) { setErr('Enter your name and a valid 10-digit phone number.'); return }
    setBusy(true)
    try {
      const r = await shareAPI.requestOtp(token, name.trim(), phone.trim())
      if (r.data?.success) setPhase('otp'); else setErr(r.data?.message || 'Could not send OTP.')
    } catch (e: any) { setErr(e?.response?.data?.message || 'Could not send OTP.') } finally { setBusy(false) }
  }

  const verify = async () => {
    setErr('')
    if (otp.trim().length < 4) { setErr('Enter the OTP sent to your phone.'); return }
    setBusy(true)
    try {
      const r = await shareAPI.verify(token, name.trim(), phone.trim(), otp.trim())
      if (r.data?.success && r.data?.data?.accessToken) { setAccessToken(r.data.data.accessToken); setPhase('view') }
      else setErr(r.data?.message || 'Invalid OTP.')
    } catch (e: any) { setErr(e?.response?.data?.message || 'Invalid OTP.') } finally { setBusy(false) }
  }

  if (phase === 'loading') {
    return <Shell><div className="flex flex-col items-center gap-3 py-20 text-[#5B6B85]"><Loader2 className="h-7 w-7 animate-spin text-[#1B3B6F]" /> Loading…</div></Shell>
  }

  if (phase === 'invalid' || phase === 'inactive') {
    const inactive = phase === 'inactive'
    return (
      <Shell>
        <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-6 text-center">
          <div className="h-12 w-12 rounded-full bg-[#FEECEC] text-[#DC2626] flex items-center justify-center mx-auto"><AlertCircle className="h-6 w-6" /></div>
          <h1 className="mt-3 font-extrabold text-[18px] text-[#13203A]">{inactive ? 'Link no longer active' : 'Invalid link'}</h1>
          <p className="mt-1.5 text-[13.5px] text-[#5B6B85]">{inactive ? 'This shared live-location link has expired or was stopped by the owner.' : 'This live-location link is invalid or has been removed.'}</p>
        </div>
      </Shell>
    )
  }

  if (phase === 'form' || phase === 'otp') {
    return (
      <Shell>
        <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-6">
          <div className="h-12 w-12 rounded-2xl bg-[#EAF1FE] text-[#1B3B6F] flex items-center justify-center"><MapPin className="h-6 w-6" /></div>
          <h1 className="mt-3 font-extrabold text-[19px] text-[#13203A]">{meta?.label || 'Live vehicle location'}</h1>
          <p className="mt-1 text-[13px] text-[#5B6B85]">Verify with your name and phone to view the live location shared with you.</p>

          {err && <div className="mt-3 bg-red-50 text-red-600 text-[13px] p-2.5 rounded-lg border border-red-200">{err}</div>}

          {phase === 'form' ? (
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[12.5px] font-semibold text-[#475569]">Your name</span>
                <div className="mt-1 relative"><User className="h-4 w-4 text-[#7B8AA3] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul" className="w-full h-11 pl-9 pr-3 rounded-lg border border-[#E7ECF3] text-sm focus:ring-2 focus:ring-[#1B3B6F] focus:border-transparent" /></div>
              </label>
              <label className="block">
                <span className="text-[12.5px] font-semibold text-[#475569]">Mobile number</span>
                <div className="mt-1 relative"><Phone className="h-4 w-4 text-[#7B8AA3] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="10-digit number" className="w-full h-11 pl-9 pr-3 rounded-lg border border-[#E7ECF3] text-sm tracking-wide focus:ring-2 focus:ring-[#1B3B6F] focus:border-transparent" /></div>
              </label>
              <button onClick={sendOtp} disabled={busy} className="w-full h-11 rounded-lg bg-[#1B3B6F] hover:bg-[#15315C] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Get OTP</button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[12.5px] font-semibold text-[#475569]">Enter OTP</span>
                <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="------" autoFocus className="mt-1 w-full h-12 px-3 rounded-lg border border-[#E7ECF3] text-center text-lg font-bold tracking-[0.4em] focus:ring-2 focus:ring-[#1B3B6F] focus:border-transparent" />
              </label>
              <p className="text-[11.5px] text-[#7B8AA3]">Sent to +91 {phone}. <span className="font-semibold">Demo OTP: 123456</span></p>
              <button onClick={verify} disabled={busy} className="w-full h-11 rounded-lg bg-[#FF6B35] hover:bg-[#F2541B] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Verify & view location</button>
              <button onClick={() => { setPhase('form'); setOtp(''); setErr('') }} className="w-full text-[12.5px] text-[#7B8AA3] hover:text-[#475569]">← Change details</button>
            </div>
          )}
        </div>
      </Shell>
    )
  }

  // phase === 'view'
  const hasFix = loc && typeof loc.lat === 'number' && typeof loc.lng === 'number'
  const distKm = hasFix && me ? distanceKm(me.lat, me.lng, loc!.lat as number, loc!.lng as number) : null
  return (
    <Shell>
      <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#E7F6F0] text-[#15936B] flex items-center justify-center"><Navigation2 className="h-5 w-5" /></div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-[15.5px] text-[#13203A] truncate">{loc?.label || meta?.label || 'Vehicle'}</div>
            <div className="text-[12px] text-[#15936B] font-semibold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#15936B] animate-pulse" /> Live{distKm != null ? ` · ${distKm < 1 ? Math.round(distKm * 1000) + ' m' : distKm.toFixed(1) + ' km'} away` : ''}</div>
          </div>
          <button onClick={fitBoth} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#EEF3F9] hover:bg-[#E2E9F2] text-[#1B3B6F] font-bold text-[12px] px-2.5 py-1.5 transition-colors">
            <Crosshair className="h-3.5 w-3.5" /> Recenter
          </button>
        </div>
        <div className="relative bg-[#eef3f9]" style={{ height: 360 }}>
          <div ref={mapDivRef} className="absolute inset-0 w-full h-full" />
          {!hasFix && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-white/95 rounded-full shadow px-3 py-1.5 text-[12px] font-semibold text-[#5B6B85] flex items-center gap-2 pointer-events-none">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1B3B6F]" /> Waiting for vehicle location…
            </div>
          )}
          <div className="absolute left-3 bottom-3 z-[500] bg-white/95 rounded-lg shadow px-2.5 py-1.5 text-[11px] font-semibold text-[#475569] flex flex-col gap-1 pointer-events-none">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FF6B35' }} /> Vehicle</span>
            {me && <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#2563EB' }} /> You</span>}
          </div>
        </div>
        {!me && hasFix && (
          <div className="px-4 py-2 border-t border-[#EFF2F7] text-center text-[11.5px] text-[#7B8AA3]">
            Allow location access to see yourself on the map and the distance.
          </div>
        )}
        <div className="grid grid-cols-3 divide-x divide-[#EFF2F7] border-t border-[#EFF2F7]">
          <div className="p-3 text-center"><div className="text-[11px] text-[#7B8AA3] font-semibold uppercase tracking-wide">Status</div><div className="text-[13.5px] font-bold text-[#13203A] capitalize mt-0.5">{loc?.status || '—'}</div></div>
          <div className="p-3 text-center"><div className="text-[11px] text-[#7B8AA3] font-semibold uppercase tracking-wide">Speed</div><div className="text-[13.5px] font-bold text-[#13203A] mt-0.5">{Math.round(loc?.speed || 0)} km/h</div></div>
          <div className="p-3 text-center"><div className="text-[11px] text-[#7B8AA3] font-semibold uppercase tracking-wide">Engine</div><div className="text-[13.5px] font-bold text-[#13203A] mt-0.5">{loc?.ignition ? 'On' : 'Off'}</div></div>
        </div>
        <div className="px-4 py-2.5 border-t border-[#EFF2F7] flex items-center justify-between text-[11.5px] text-[#7B8AA3]">
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Updated {fmtTime(loc?.updatedAt)}</span>
          <span>Expires {fmtTime(loc?.expiresAt)}</span>
        </div>
      </div>
      <p className="mt-3 text-center text-[11.5px] text-[#7B8AA3]">Refreshes automatically · Shared via Bharat Mechanics</p>
    </Shell>
  )
}
