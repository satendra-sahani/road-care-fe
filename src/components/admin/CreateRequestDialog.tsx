'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  X, ClipboardPlus, User, MapPin, Phone, MessageCircle, Send, Link2, Smartphone, Copy, RefreshCw, Check, CheckCircle2, Loader2, Search,
  ExternalLink, Pencil, Car, Wrench, ArrowRight, ArrowLeft, Save, ImagePlus, Plus, Clock, AlertTriangle, CalendarDays, Info, History,
  SlidersHorizontal, ClipboardCheck,
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { toast } from 'sonner'
import api, { serviceRequestAPI, uploadAPI, adminLocationRequestAPI } from '@/services/api'
import { CreateRequestMap } from './CreateRequestMap'
import { NearbyPartners } from './NearbyPartners'
import { PartnerDetailsDialog, type PartnerTarget } from './PartnerDetailsDialog'
import type { NearbyPin } from './partnerItems'
import type { Mechanic } from '@/store/slices/mechanicSlice'
import { initialsOf, vehicleIconFor } from './serviceRequestUi'
import { BRANDS, MODELS, PRIORITIES, SERVICES, SERVICE_TYPES, TIME_SLOTS, VEHICLE_KINDS, type VehicleKind } from './createRequestData'

// "Create Service Request" — the admin books a job for a customer who phoned in.
// 4 steps: Customer & Location → Vehicle & Service → Additional Info → Review.
// The location comes from the customer's phone when possible: the admin asks for
// the CURRENT location (one fix, not live tracking) on WhatsApp, by SMS, with a
// bare web link, or as a popup in the customer app; the map fills in as soon as
// the customer shares it. It can always be typed / pinned by hand instead.
// Server: POST /admin/service-requests + /admin/location-requests.

type Channel = 'whatsapp' | 'sms' | 'link' | 'app'
type Lang = 'en' | 'hi'
const LANG_KEY = 'bm_job_message_lang' // the same choice as the message cards inside a request
type Delivery = { channel: Channel; mode: 'sent' | 'manual' | 'failed'; detail: string; link: string; text?: string; waLink?: string; lang?: Lang }
type LocReq = {
  id: string; link: string; phone: string
  status: 'pending' | 'captured' | 'declined' | 'expired'
  openedAt: string | null
  /** `refining`: the customer's phone is still sending sharper fixes */
  location: { latitude: number; longitude: number; accuracy: number | null; source: 'web' | 'app' | null; capturedAt: string | null; refining?: boolean } | null
  sends: { channel: Channel; at: string; mode: Delivery['mode']; detail: string }[]
}
type RecentLoc = { label: string; source: 'saved' | 'request'; address: string; landmark: string; city: string; state: string; pincode: string; latitude: number | null; longitude: number | null }
type KnownVehicle = { type: string; brand: string; model: string; year: string; registrationNumber: string }
type Lookup = {
  phone: string; exists: boolean; bookable: boolean; message?: string
  customer: { id: string; name: string; phone: string; isActive: boolean } | null
  app: { installed: boolean; popup: boolean }
  channels?: { sms: 'auto' | 'manual'; whatsapp: 'auto' | 'manual' }
  recentLocations: RecentLoc[]; vehicles: KnownVehicle[]; totalRequests: number
}
type Form = {
  mode: 'new' | 'existing'
  phone: string; name: string; altPhone: string; saveAddress: boolean
  address: string; landmark: string; city: string; state: string; pincode: string; lat: string; lng: string
  vehicleType: VehicleKind | ''; brand: string; model: string; reg: string
  services: string[]; description: string
  serviceType: 'home' | 'roadside' | 'walkin'; priority: 'low' | 'medium' | 'high' | 'urgent'
  when: 'now' | 'later'; date: string; slot: string
  notes: string; photos: string[]
}
/** where the pin on the map came from */
type Fix = { source: 'web' | 'app' | 'manual' | 'recent' | 'search'; accuracy?: number | null; at?: string | null; refining?: boolean }
/** above this margin a phone fix is only "somewhere around here" (network / approximate permission) */
const ROUGH_M = 100
const metresBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const rad = (d: number) => (d * Math.PI) / 180
  const x = rad(b.lng - a.lng) * Math.cos(rad((a.lat + b.lat) / 2)), y = rad(b.lat - a.lat)
  return Math.sqrt(x * x + y * y) * 6371000
}

const BLUE = '#1E40E0'
const NAVY = '#0F2A5F'
const DRAFT_KEY = 'bm_new_request_draft'
const MAX_PHOTOS = 10
const NONE: any[] = []
const MAX_MB = 5
// the local calendar date (toISOString alone is UTC — before 5:30 am IST that is still yesterday)
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
const emptyForm = (): Form => ({
  mode: 'new', phone: '', name: '', altPhone: '', saveAddress: true,
  address: '', landmark: '', city: '', state: '', pincode: '', lat: '', lng: '',
  vehicleType: '', brand: '', model: '', reg: '', services: [], description: '',
  serviceType: 'home', priority: 'medium', when: 'now', date: today(), slot: '', notes: '', photos: [],
})
const validPhone = (p: string) => /^[6-9]\d{9}$/.test(p)
const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, 10)
const timeOf = (d?: string | null) => { try { return d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '' } catch { return '' } }
const copyText = async (t: string) => { try { await navigator.clipboard.writeText(t); return true } catch { return false } }
/** address + the parts it does not already mention (geocoded addresses often end with the city) */
const joinAddr = (address: string, ...rest: (string | undefined | false | null)[]) => {
  const low = address.toLowerCase()
  return [address, ...rest.filter((p): p is string => !!p && !low.includes(p.toLowerCase()))].filter(Boolean).join(', ')
}
const kindOf = (t?: string): VehicleKind | '' => {
  const s = String(t || '').toLowerCase()
  return /scoot/.test(s) ? 'scooter' : /bike|motor|two/.test(s) ? 'bike' : /auto|rick/.test(s) ? 'auto' : /truck|tempo|pickup|bus/.test(s) ? 'truck' : /car|suv|sedan|hatch/.test(s) ? 'car' : ''
}

type Place = { address: string; city: string; state: string; pincode: string }
const placeFrom = (j: any): Place => {
  const a = j?.address || {}
  const city = a.city || a.town || a.county || a.state_district || ''
  return {
    address: [a.house_number, a.road, a.suburb || a.neighbourhood || a.village || a.hamlet, city].filter(Boolean).join(', ') || j?.display_name || '',
    city, state: a.state || '', pincode: /^\d{6}$/.test(a.postcode || '') ? a.postcode : '',
  }
}
// Google's geocoder (same key as the map) knows Indian localities best. It is
// used when the Maps script is loaded and the key allows geocoding; otherwise —
// and on any failure — OpenStreetMap's Nominatim answers instead.
let googleGeocoderOff = false
// "PRMG+QVP, Hetimpur, …" — a plus code, which nobody can read out to a mechanic
const PLUS_CODE = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4},?\s*/i
const TOO_COARSE = ['country', 'administrative_area_level_1', 'administrative_area_level_2', 'postal_code']
const placeFromGoogle = (r: any): Place => {
  const part = (t: string) => (r?.address_components || []).find((c: any) => (c.types || []).includes(t))?.long_name || ''
  const pin = part('postal_code')
  return {
    // without the country, and without a place name said twice in a row ("Hetimpur, Hetimpur, …")
    address: String(r?.formatted_address || '').replace(/,\s*India$/, '').split(/,\s*/)
      .filter((part, n, all) => n === 0 || part.toLowerCase() !== all[n - 1].toLowerCase()).join(', '),
    city: part('locality') || part('administrative_area_level_3') || part('administrative_area_level_2'),
    state: part('administrative_area_level_1'),
    pincode: /^\d{6}$/.test(pin) ? pin : '',
  }
}
/** results, [] when Google found nothing, null when Google could not be asked */
const googleGeocode = async (req: Record<string, any>): Promise<any[] | null> => {
  if (googleGeocoderOff || typeof window === 'undefined') return null
  const g = (window as any).google?.maps
  if (!g) return null
  try {
    const Geocoder = g.Geocoder || (g.importLibrary ? (await g.importLibrary('geocoding'))?.Geocoder : null)
    if (!Geocoder) return null
    const res: any = await Promise.race([
      new Geocoder().geocode(req),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
    ])
    return res?.results || []
  } catch (e: any) {
    const code = String(e?.code || e?.message || '')
    if (/ZERO_RESULTS/.test(code)) return []
    if (/REQUEST_DENIED|ApiNotActivated|InvalidKey/i.test(code)) googleGeocoderOff = true // key has no geocoding — stop asking
    return null
  }
}
type Hit = { key: string; label: string; lat: number; lng: number; place: Place }
const searchPlaces = async (q: string): Promise<Hit[]> => {
  const g = await googleGeocode({ address: q, componentRestrictions: { country: 'IN' } })
  if (g) {
    return g.slice(0, 5).map((r, i) => {
      const place = placeFromGoogle(r)
      return { key: String(r.place_id || i), label: place.address, lat: r.geometry.location.lat(), lng: r.geometry.location.lng(), place }
    })
  }
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=in&limit=5&addressdetails=1&accept-language=en`)
  const list = await r.json()
  return (Array.isArray(list) ? list : []).map((h: any, i: number) => ({ key: String(h.place_id || i), label: String(h.display_name || ''), lat: parseFloat(h.lat), lng: parseFloat(h.lon), place: placeFrom(h) }))
}
const reverseGeocode = async (lat: number, lng: number): Promise<Place | null> => {
  const g = await googleGeocode({ location: { lat, lng } })
  if (g && g.length) {
    // Google lists the most exact answer first, but away from named streets that
    // is often a plus code. Take the first answer a person can read (a road, a
    // locality…); if there is none, drop the code from the front of the first.
    const places = g.map(placeFromGoogle)
    const i = g.findIndex((r, n) => {
      const types: string[] = r.types || []
      return !types.includes('plus_code') && !types.some((t) => TOO_COARSE.includes(t)) && !PLUS_CODE.test(places[n].address)
    })
    const address = i >= 0 ? places[i].address : places[0].address.replace(PLUS_CODE, '')
    // city / state / pincode: from that answer, else from whichever answer has them
    const part = (k: 'city' | 'state' | 'pincode') => (i >= 0 && places[i][k]) || places.find((p) => p[k])?.[k] || ''
    if (address) return { address, city: part('city'), state: part('state'), pincode: part('pincode') }
  }
  try {
    const ctrl = new AbortController()
    const tm = setTimeout(() => ctrl.abort(), 7000)
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`, { signal: ctrl.signal })
    clearTimeout(tm)
    return placeFrom(await r.json())
  } catch { return null } // the address is a bonus — the pin is what the mechanic follows
}

const CHANNELS: { key: Channel; label: string; again: string; icon: typeof Send }[] = [
  { key: 'whatsapp', label: 'Ask on WhatsApp', again: 'Resend on WhatsApp', icon: Send },
  { key: 'sms', label: 'Send SMS Link', again: 'Resend SMS', icon: MessageCircle },
  { key: 'link', label: 'Copy Web Link', again: 'Copy Link Again', icon: Link2 },
  { key: 'app', label: 'Ask in Customer App', again: 'Resend to App', icon: Smartphone },
]
const CHANNEL_NAME: Record<Channel, string> = { whatsapp: 'WhatsApp', sms: 'SMS', link: 'Web link', app: 'Customer app' }
const STEPS = [
  { title: 'Customer & Location', sub: 'Customer details and exact location' },
  { title: 'Vehicle & Service', sub: 'Vehicle type and issue details' },
  { title: 'Additional Info', sub: 'Priority, timing and notes' },
  { title: 'Review & Create', sub: 'Confirm and create request' },
]

const label = 'mb-1.5 block text-[13px] font-semibold text-[#1F2937]'
const field = 'h-10 w-full rounded-lg border border-[#DFE5EE] bg-white px-3 text-[13.5px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#2447D6] disabled:bg-[#F5F7FA] read-only:bg-[#F8FAFC]'
const Req = () => <span className="text-[#DC2626]">*</span>
const Opt = () => <span className="font-normal text-[#6B7280]">(Optional)</span>

function Band({ icon, children, right }: { icon: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex min-h-[46px] flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-t-xl bg-[#EEF3FD] px-4 py-2">
      <h3 className="flex items-center gap-2.5 text-[15.5px] font-bold text-[#0F1E46]"><span style={{ color: BLUE }}>{icon}</span>{children}</h3>
      {right}
    </div>
  )
}
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-[#E6ECF5] bg-white ${className}`}>{children}</section>
)
const Line = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="flex gap-3 text-[13.5px]"><span className="w-[118px] shrink-0 text-[#6B7280]">{k}</span><span className="min-w-0 flex-1 break-words font-semibold text-[#111827]">{children}</span></div>
)

export function CreateRequestDialog({ open, onClose, onCreated, shops = NONE, mechanics = NONE, partnersLoading = false }: {
  open: boolean
  onClose: () => void
  /** called with the new service request after it is created */
  onCreated: (request: any) => void
  /** garages (shop partners + field garages) and mechanics, for the nearest list — the same ones the assign dialog offers */
  shops?: any[]
  mechanics?: Mechanic[]
  partnersLoading?: boolean
}) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Form>(emptyForm)
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [custQ, setCustQ] = useState('')
  const [custHits, setCustHits] = useState<{ id: string; name: string; phone: string }[]>([])
  const [locReq, setLocReq] = useState<LocReq | null>(null)
  const [deliveries, setDeliveries] = useState<Partial<Record<Channel, Delivery>>>({})
  const [asking, setAsking] = useState<Channel | null>(null)
  // language of the WhatsApp / SMS that asks for the location — remembered on this computer
  const [msgLang, setMsgLang] = useState<Lang>('hi')
  useEffect(() => {
    if (!open) return
    try { const l = localStorage.getItem(LANG_KEY); if (l === 'en' || l === 'hi') setMsgLang(l) } catch { /* ignore */ }
  }, [open])
  const chooseLang = (l: Lang) => { setMsgLang(l); try { localStorage.setItem(LANG_KEY, l) } catch { /* ignore */ } }
  const [fix, setFix] = useState<Fix | null>(null)
  const [addrQ, setAddrQ] = useState('')
  const [addrHits, setAddrHits] = useState<Hit[]>([])
  const [addrBusy, setAddrBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fees, setFees] = useState<{ normal: number; emergency: number } | null>(null)
  // nearest garages / mechanics: their pins on the map, and the contact card of the one that was tapped
  const [nearPins, setNearPins] = useState<NearbyPin[]>([])
  const [fitKey, setFitKey] = useState(0)
  const [radiusKm, setRadiusKm] = useState(10) // search radius around the customer, km (0 = any)
  const [partner, setPartner] = useState<PartnerTarget | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLTextAreaElement>(null)
  const lastLooked = useRef('')
  // true while the address text was filled in by us (geocoder / saved address) —
  // a fresh pin may then replace it; once the admin types, we never overwrite it
  const addrAuto = useRef(true)
  // the name we filled in from the customer record — cleared again if the number changes to someone else
  const autoName = useRef('')
  const applied = useRef('')       // capturedAt of the customer fix already on the map
  const handMoved = useRef(false)  // the admin corrected the pin after it arrived — leave it alone
  const seenStatus = useRef('')    // to announce "declined" once
  const lastGeo = useRef<{ lat: number; lng: number } | null>(null) // where the address was last looked up
  const set = useCallback((patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch })), [])

  const phoneOk = validPhone(form.phone)
  const lat = parseFloat(form.lat), lng = parseFloat(form.lng)
  const hasPos = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
  const pos = useMemo(() => (hasPos ? { lat, lng } : null), [hasPos, lat, lng])
  const dirty = !!(form.phone || form.name || form.address || form.brand || form.services.length || form.notes || form.photos.length)

  // ── open / close ──
  useEffect(() => {
    if (!open) return
    setStep(0); setLookup(null); setLocReq(null); setDeliveries({}); setFix(null); setAddrQ(''); setAddrHits([]); setCustQ(''); setCustHits([])
    setNearPins([]); setPartner(null)
    lastLooked.current = ''; addrAuto.current = true; autoName.current = ''
    applied.current = ''; handMoved.current = false; seenStatus.current = ''; lastGeo.current = null
    let draft: { form?: Form; locReqId?: string; fix?: Fix | null } | null = null
    try { const s = localStorage.getItem(DRAFT_KEY); draft = s ? JSON.parse(s) : null } catch { /* no draft */ }
    if (draft?.form) {
      setForm({ ...emptyForm(), ...draft.form })
      setFix(draft.fix || null)
      addrAuto.current = !draft.form.address
      toast.info('Draft restored', { action: { label: 'Start fresh', onClick: () => { try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ } setForm(emptyForm()); setFix(null); setLocReq(null); setDeliveries({}); addrAuto.current = true } } })
      if (draft.locReqId) adminLocationRequestAPI.get(draft.locReqId).then((r) => {
        const d: LocReq | undefined = r.data?.data
        if (!d || d.phone !== draft?.form?.phone) return
        // whatever it holds is already part of the draft — don't put it on top of later edits
        applied.current = d.location?.capturedAt || ''
        handMoved.current = !!applied.current
        seenStatus.current = d.status
        setLocReq(d)
      }).catch(() => {})
    } else setForm(emptyForm())
    api.get('/common/config').then((r) => {
      const d = r.data?.data
      if (d?.bookingFeeAmount) setFees({ normal: d.bookingFeeAmount, emergency: d.emergencyBookingFeeAmount || d.bookingFeeAmount })
    }).catch(() => {})
  }, [open])

  const saveDraft = useCallback((quiet = false) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, locReqId: locReq?.id, fix }))
      if (!quiet) toast.success('Draft saved on this device')
    } catch { if (!quiet) toast.error('Could not save the draft') }
  }, [form, locReq?.id, fix])
  const requestClose = useCallback(() => {
    if (saving) return
    if (dirty) { saveDraft(true); toast.info('Saved as a draft — open “Add Service Request” to continue') }
    onClose()
  }, [saving, dirty, saveDraft, onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) requestClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, requestClose])

  // ── who is calling? ──
  const runLookup = useCallback(async (phone: string, announce: boolean) => {
    lastLooked.current = phone
    setLookingUp(true)
    try {
      const res = await adminLocationRequestAPI.lookup(phone)
      const d: Lookup | undefined = res.data?.data
      if (!d || lastLooked.current !== phone) return
      setLookup(d)
      setLocReq((r) => (r && r.phone !== phone ? null : r)) // a link sent to another number is not this customer's
      if (d.exists && d.bookable && d.customer) {
        const name = d.customer.name
        setForm((f) => ({ ...f, mode: 'existing', name: name || f.name }))
        autoName.current = name
        if (announce) toast.success(`${name || 'Customer'} found — ${d.totalRequests} earlier request${d.totalRequests === 1 ? '' : 's'}`)
      } else if (!d.exists) {
        // a new number: don't carry over the previous customer's name
        const stale = autoName.current
        autoName.current = ''
        setForm((f) => ({ ...f, mode: 'new', name: stale && f.name === stale ? '' : f.name }))
        if (announce) toast.info('New customer — enter the name')
      } else if (announce) toast.error(d.message || 'This number cannot be used for a booking')
    } catch (e: any) {
      if (announce) toast.error(e?.response?.data?.message || 'Could not fetch the customer')
    } finally { setLookingUp(false) }
  }, [])
  useEffect(() => {
    if (!open) return
    if (!validPhone(form.phone)) {
      if (lastLooked.current) {
        lastLooked.current = ''; setLookup(null); setLocReq(null); setDeliveries({})
        const stale = autoName.current
        autoName.current = ''
        if (stale) setForm((f) => (f.name === stale ? { ...f, name: '' } : f))
      }
      return
    }
    if (form.phone === lastLooked.current) return
    const t = setTimeout(() => runLookup(form.phone, false), 350)
    return () => clearTimeout(t)
  }, [open, form.phone, runLookup])

  // existing-customer search (name or number)
  useEffect(() => {
    if (!open || form.mode !== 'existing' || custQ.trim().length < 2) { setCustHits([]); return }
    let off = false
    const t = setTimeout(() => {
      adminLocationRequestAPI.customers(custQ.trim()).then((r) => { if (!off) setCustHits(r.data?.data || []) }).catch(() => { if (!off) setCustHits([]) })
    }, 300)
    return () => { off = true; clearTimeout(t) }
  }, [open, form.mode, custQ])

  // ── location ──
  /** put the pin somewhere and (unless the admin typed the address) look the address up */
  const placePin = useCallback(async (la: number, ln: number, f: Fix, known?: Partial<Place> & { landmark?: string }) => {
    setFix(f)
    setForm((p) => ({ ...p, lat: la.toFixed(6), lng: ln.toFixed(6) }))
    if (f.source !== 'web' && f.source !== 'app') handMoved.current = true
    if (known?.address) {
      addrAuto.current = true
      lastGeo.current = { lat: la, lng: ln }
      setForm((p) => ({ ...p, address: known.address || '', landmark: known.landmark ?? p.landmark, city: known.city || '', state: known.state || '', pincode: known.pincode || '' }))
      return
    }
    if (!addrAuto.current) return
    // a fix that only sharpened by a few metres has the same address
    if (lastGeo.current && metresBetween(lastGeo.current, { lat: la, lng: ln }) < 15) return
    lastGeo.current = { lat: la, lng: ln }
    const place = await reverseGeocode(la, ln)
    if (place?.address && addrAuto.current) setForm((p) => ({ ...p, address: place.address, city: place.city, state: place.state, pincode: place.pincode }))
  }, [])

  // Follow the request: quickly while we wait for the customer and while their
  // phone is still sending sharper fixes (the first one arrives within a second
  // or two, the exact GPS fix a few seconds later), then slowly in case they
  // press "Share again". A pin the admin corrected by hand is left alone.
  useEffect(() => {
    if (!open || !locReq || locReq.status === 'expired') return
    let off = false
    const id = locReq.id
    const tick = async () => {
      try {
        const d: LocReq | undefined = (await adminLocationRequestAPI.get(id)).data?.data
        if (off || !d) return
        const loc = d.location
        const was = seenStatus.current
        seenStatus.current = d.status
        setLocReq((p) => (p && p.id === d.id && p.status === d.status && p.openedAt === d.openedAt
          && (p.location?.capturedAt || '') === (loc?.capturedAt || '') && !!p.location?.refining === !!loc?.refining ? p : d))
        if (d.status === 'pending') { applied.current = ''; return } // asked again somewhere — a fresh answer is coming
        if (d.status === 'declined') { if (was !== 'declined') toast.error('The customer declined to share the location in the app'); return }
        if (d.status !== 'captured' || !loc?.capturedAt) return
        if (loc.capturedAt !== applied.current) {
          const first = !applied.current
          applied.current = loc.capturedAt
          if (first) handMoved.current = false // the customer's real spot beats whatever was typed before
          if (!handMoved.current) {
            addrAuto.current = true
            placePin(loc.latitude, loc.longitude, { source: loc.source || 'web', accuracy: loc.accuracy, at: loc.capturedAt, refining: !!loc.refining })
          }
          if (first) toast.success('The customer shared the current location')
        } else if (!loc.refining) {
          setFix((f) => (f?.refining ? { ...f, refining: false } : f))
        }
      } catch { /* keep trying */ }
    }
    const busy = locReq.status === 'pending' || !!locReq.location?.refining
    const t = setInterval(tick, busy ? 1500 : 6000)
    return () => { off = true; clearInterval(t) }
  }, [open, locReq?.id, locReq?.status, locReq?.location?.refining, placePin]) // eslint-disable-line react-hooks/exhaustive-deps

  const ask = async (channel: Channel) => {
    if (!phoneOk) { toast.error('Enter the customer’s 10-digit mobile number first'); return }
    if (lookup && !lookup.bookable) { toast.error(lookup.message || 'This number cannot be used for a booking'); return }
    // Until the approved WhatsApp template is set up, WhatsApp opens with the message
    // ready. The tab must be opened inside the click, before the request goes out.
    let tab: Window | null = null
    if (channel === 'whatsapp' && lookup?.channels?.whatsapp !== 'auto') { tab = window.open('', '_blank'); if (tab) tab.opener = null }
    setAsking(channel)
    try {
      const res = await adminLocationRequestAPI.ask({ phone: form.phone, name: form.name.trim(), channel, lang: msgLang })
      const { request, delivery } = (res.data?.data || {}) as { request: LocReq; delivery: Delivery }
      if (!request || !delivery) throw new Error('bad response')
      applied.current = ''; seenStatus.current = request.status // a fresh ask: the next fix is a new answer
      setLocReq(request)
      setDeliveries((d) => ({ ...d, [channel]: delivery }))
      if (delivery.mode === 'failed') { tab?.close(); toast.error(delivery.detail); return }
      if (channel === 'whatsapp') {
        if (delivery.mode === 'manual' && delivery.waLink) {
          if (tab) tab.location.href = delivery.waLink
          toast.info(tab ? 'WhatsApp opened with the message ready — press send' : 'Press “Open WhatsApp” below to send the message')
        } else { tab?.close(); toast.success(delivery.detail) }
      } else if (channel === 'sms') {
        if (delivery.mode === 'manual') toast.info((await copyText(delivery.text || delivery.link)) ? 'SMS template is not set up yet — message copied, send it from your phone' : delivery.detail)
        else toast.success(delivery.detail)
      } else if (channel === 'link') {
        toast.success((await copyText(delivery.link)) ? 'Link copied — paste it anywhere or read it out' : 'Link ready — copy it from below')
      } else toast.success(delivery.detail)
    } catch (e: any) {
      tab?.close()
      toast.error(e?.response?.data?.message || 'Could not ask for the location')
    } finally { setAsking(null) }
  }

  // address search
  const searchAddress = async () => {
    const q = addrQ.trim()
    if (q.length < 3) { toast.error('Type at least 3 letters of the address'); return }
    setAddrBusy(true)
    try {
      const list = await searchPlaces(q)
      setAddrHits(list)
      if (!list.length) toast.info('No place found — type the address below and drop the pin on the map')
    } catch { toast.error('Address search is not reachable — type the address below') } finally { setAddrBusy(false) }
  }
  const pickHit = (h: Hit) => {
    placePin(h.lat, h.lng, { source: 'search' }, { ...h.place, address: h.place.address || h.label })
    setAddrHits([]); setAddrQ('')
  }
  const pickRecent = (r: RecentLoc) => {
    if (r.latitude != null && r.longitude != null) placePin(r.latitude, r.longitude, { source: 'recent' }, r)
    else { addrAuto.current = true; setFix(null); set({ address: r.address, landmark: r.landmark, city: r.city, state: r.state, pincode: r.pincode, lat: '', lng: '' }) }
  }

  // ── photos ──
  const addFiles = async (list: FileList | File[] | null) => {
    const files = Array.from(list || [])
    if (!files.length) return
    const room = MAX_PHOTOS - form.photos.length
    const good = files.filter((f) => f.type.startsWith('image/') && f.size <= MAX_MB * 1024 * 1024).slice(0, room)
    if (good.length < files.length) toast.error(room <= 0 ? `Maximum ${MAX_PHOTOS} photos` : `Only images up to ${MAX_MB} MB are accepted (max ${MAX_PHOTOS})`)
    if (!good.length) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (let i = 0; i < good.length; i += 5) {
        const res = await uploadAPI.uploadImages(good.slice(i, i + 5), 'service-requests')
        for (const u of res.data?.data?.uploaded || []) if (u?.url) urls.push(u.url)
      }
      if (urls.length) setForm((f) => ({ ...f, photos: [...f.photos, ...urls] }))
      if (urls.length < good.length) toast.error('Some photos could not be uploaded')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not upload the photos')
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  // ── steps ──
  const stepError = (n: number): string | null => {
    if (n === 0) {
      if (!phoneOk) return 'Enter the customer’s 10-digit mobile number'
      if (lookup && !lookup.bookable) return lookup.message || 'This number cannot be used for a booking'
      if (!form.name.trim()) return 'Enter the customer’s name'
      if (form.altPhone && !validPhone(form.altPhone)) return 'The alternate number must be 10 digits (or leave it empty)'
      if (!form.address.trim()) return 'Enter the service address, or ask the customer to share the location'
    }
    if (n === 1) {
      if (!form.vehicleType) return 'Choose the vehicle type'
      if (!form.brand.trim()) return 'Enter the vehicle brand'
      if (!form.model.trim()) return 'Enter the vehicle model'
      if (!form.services.length) return 'Choose the service required'
    }
    if (n === 2 && form.when === 'later' && !form.date) return 'Choose the preferred date'
    return null
  }
  const goTo = (n: number) => {
    for (let i = 0; i < n; i++) { const err = stepError(i); if (err) { toast.error(err); setStep(i); return } }
    setStep(n)
  }
  const submit = async () => {
    for (let i = 0; i < 3; i++) { const err = stepError(i); if (err) { toast.error(err); setStep(i); return } }
    setSaving(true)
    try {
      const res = await serviceRequestAPI.create({
        customerPhone: form.phone, customerName: form.name.trim(), alternatePhone: form.altPhone || undefined,
        serviceType: form.serviceType, serviceCategory: form.services[0], issues: form.services,
        description: form.description.trim() || form.services.join(', '),
        priority: form.priority, isEmergency: form.priority === 'urgent',
        vehicleType: form.vehicleType, vehicleBrand: form.brand.trim(), vehicleModel: form.model.trim(), registrationNumber: form.reg.trim().toUpperCase(),
        address: form.address.trim(), landmark: form.landmark.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim(),
        ...(pos ? { latitude: pos.lat, longitude: pos.lng } : {}),
        // how exact the pin is, when it is the customer's own GPS fix (not a pin placed by hand)
        ...(pos && (fix?.source === 'web' || fix?.source === 'app') && fix.accuracy ? { locationAccuracy: fix.accuracy } : {}),
        preferredDate: form.when === 'later' ? form.date : new Date().toISOString(),
        preferredTimeSlot: form.when === 'later' ? form.slot : 'As soon as possible',
        notes: form.notes.trim(), images: form.photos, saveAddress: form.saveAddress,
        locationRequestId: locReq?.id, paymentMethod: 'cod',
      })
      if (res.data?.success) {
        try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
        toast.success(res.data.message || 'Service request created')
        onCreated(res.data.data)
      } else toast.error(res.data?.message || 'Could not create the request')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not create the request')
    } finally { setSaving(false) }
  }

  if (!open) return null

  const V = vehicleIconFor(form.vehicleType || 'car')
  const existing = !!(lookup?.exists && lookup.bookable && lookup.customer)
  const nameLocked = existing && !!lookup?.customer?.name
  const sentOn = (c: Channel) => [...(locReq?.sends || [])].reverse().find((s) => s.channel === c)
  const appHint = !lookup || !phoneOk ? '' : !lookup.exists ? 'No app account' : !lookup.app.installed ? 'Not logged in to the app' : lookup.app.popup ? 'Popup supported' : 'Old app version'
  const bestChannel: Channel = lookup?.app.popup ? 'app' : 'whatsapp'
  const brandList = form.vehicleType ? BRANDS[form.vehicleType] : []
  const modelList = MODELS[`${form.vehicleType}:${form.brand.trim()}`] || []
  const prio = PRIORITIES.find((p) => p.key === form.priority)!
  const fee = fees ? (form.priority === 'urgent' ? fees.emergency : fees.normal) : null
  // the typed address in two forms, for the nearest list while there is no pin
  const addrQueries = form.address.trim().length >= 4
    ? [joinAddr(form.address.trim(), form.city.trim(), form.state.trim(), form.pincode.trim()), form.city.trim() ? [form.city.trim(), form.state.trim(), form.pincode.trim()].filter(Boolean).join(', ') : ''].filter((q, i, all) => q && all.indexOf(q) === i)
    : []
  const fixLabel = fix?.source === 'app' ? 'From the customer app' : fix?.source === 'web' ? 'From the customer (web link)' : fix?.source === 'recent' ? 'From an earlier address' : fix?.source === 'search' ? 'From address search' : fix ? 'Pinned by you' : ''

  // ── location status banner ──
  const st = locReq?.status
  const captured = (fix?.source === 'web' || fix?.source === 'app') && hasPos
  const margin = fix?.accuracy ?? null
  const rough = captured && !fix?.refining && margin != null && margin > ROUGH_M
  // asked (again): we are waiting, whatever an earlier answer left on the map
  const Waiting = (
    <div className="flex items-start gap-3 rounded-xl border border-[#F7D58A] bg-[#FFF8E6] px-3.5 py-3" data-loc-status="pending">
      <Loader2 className="mt-1 h-6 w-6 shrink-0 animate-spin text-[#D97706]" />
      <div className="min-w-0 flex-1">
        <b className="block text-[14px] text-[#0F1E46]">Waiting for the customer to share the location…</b>
        <span className="text-[12.5px] text-[#4B5563]">{locReq?.openedAt ? `The customer opened it at ${timeOf(locReq.openedAt)} — ask them to press “Share my location”.` : 'This fills in by itself as soon as they share. You can keep filling the form.'}{captured ? ' The earlier location stays on the map until the new one arrives.' : ''}</span>
      </div>
    </div>
  )
  const Banner = st === 'pending' ? Waiting : captured && fix?.refining ? (
    <div className="flex items-start gap-3 rounded-xl border border-[#BCD0FB] bg-[#EEF3FD] px-3.5 py-3" data-loc-status="refining">
      <Loader2 className="mt-1 h-6 w-6 shrink-0 animate-spin" style={{ color: BLUE }} />
      <div className="min-w-0 flex-1">
        <b className="block text-[14px] text-[#0F1E46]">Location received — getting more exact…</b>
        <span className="text-[12.5px] text-[#4B5563]">Lat: {lat.toFixed(4)}, Long: {lng.toFixed(4)}{margin ? ` • ±${margin} m so far` : ''}. The pin settles by itself in a few seconds.</span>
      </div>
      <span className="shrink-0 text-[12px] text-[#4B5563]">{timeOf(fix?.at)}</span>
    </div>
  ) : rough ? (
    <div className="flex items-start gap-3 rounded-xl border border-[#F7D58A] bg-[#FFF8E6] px-3.5 py-3" data-loc-status="rough">
      <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-[#D97706]" />
      <div className="min-w-0 flex-1">
        <b className="block text-[14px] text-[#0F1E46]">Approximate location only (±{margin} m)</b>
        <span className="text-[12.5px] text-[#4B5563]">The phone had no GPS fix — the customer can be anywhere inside the circle. Ask them to turn on Location (GPS) with <b>precise location</b>, step outside and share again (press Resend) — or confirm the spot on the call and drag the pin.</span>
      </div>
      <span className="shrink-0 text-[12px] text-[#4B5563]">{timeOf(fix?.at)}</span>
    </div>
  ) : captured ? (
    <div className="flex items-start gap-3 rounded-xl border border-[#A7E3BC] bg-[#EAFBF0] px-3.5 py-3" data-loc-status="captured">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white"><Check className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <b className="block text-[14px] text-[#0F1E46]">Current location captured successfully</b>
        <span className="text-[12.5px] text-[#4B5563]">Lat: {lat.toFixed(4)}, Long: {lng.toFixed(4)}{fix?.accuracy ? ` • ±${fix.accuracy} m` : ''}{form.city ? ` • ${form.city}` : ''}</span>
      </div>
      <span className="shrink-0 text-[12px] text-[#4B5563]">{timeOf(fix?.at)}</span>
    </div>

  ) : st === 'declined' || st === 'expired' ? (
    <div className="flex items-start gap-3 rounded-xl border border-[#FBC5C5] bg-[#FEF1F1] px-3.5 py-3" data-loc-status={st}>
      <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-[#DC2626]" />
      <div className="min-w-0 flex-1">
        <b className="block text-[14px] text-[#0F1E46]">{st === 'declined' ? 'The customer declined in the app' : 'The link has expired'}</b>
        <span className="text-[12.5px] text-[#4B5563]">Ask again with any option below, or enter the location yourself.</span>
      </div>
    </div>
  ) : (
    <div className="flex items-start gap-3 rounded-xl border border-[#DCE4F2] bg-[#F6F8FD] px-3.5 py-3" data-loc-status="none">
      <Info className="mt-0.5 h-5 w-5 shrink-0" style={{ color: BLUE }} />
      <span className="text-[13px] text-[#374151]">Ask the customer to share their <b>current location</b> — one tap on their phone, and the map fills in here. It is a single location, not live tracking.</span>
    </div>
  )

  const StepOne = (
    <>
      <Card>
        <Band icon={<User className="h-[18px] w-[18px]" />} right={
          <div className="flex overflow-hidden rounded-lg border border-[#D5DDEC] bg-white text-[12.5px] font-semibold">
            {(['existing', 'new'] as const).map((m) => (
              <button key={m} type="button" onClick={() => set({ mode: m })} aria-pressed={form.mode === m}
                className={`h-8 whitespace-nowrap px-3.5 ${form.mode === m ? 'bg-[#E3EBFF] text-[#1E40E0]' : 'text-[#374151] hover:bg-[#F6F8FB]'}`}>{m === 'existing' ? 'Existing Customer' : 'New Customer'}</button>
            ))}
          </div>
        }>1. Customer Information</Band>
        <div className="space-y-3 p-3.5">
          {form.mode === 'existing' && (
            <div className="relative">
              <label className={label}>Find Customer</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                <input className={`${field} pl-9`} placeholder="Search by name or mobile number…" value={custQ} onChange={(e) => setCustQ(e.target.value)} aria-label="Find customer" />
              </div>
              {custHits.length > 0 && (
                <div className="scrollbar-admin absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[#DFE5EE] bg-white py-1 shadow-xl">
                  {custHits.map((c) => (
                    <button key={c.id} type="button" onClick={() => { autoName.current = c.name; set({ phone: c.phone, name: c.name }); setCustQ(''); setCustHits([]) }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#F3F6FC]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3EBFF] text-[11.5px] font-bold text-[#1E40E0]">{initialsOf(c.name)}</span>
                      <span className="min-w-0 flex-1"><b className="block truncate text-[13.5px] text-[#111827]">{c.name || 'Customer'}</b><span className="text-[12px] text-[#6B7280]">+91 {c.phone}</span></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <label className={label}>Mobile Number <Req /></label>
            <div className="flex flex-wrap gap-2">
              <div className="flex h-10 min-w-[220px] flex-1 overflow-hidden rounded-lg border border-[#DFE5EE] bg-white focus-within:border-[#2447D6]">
                <span className="flex shrink-0 items-center gap-1.5 border-r border-[#DFE5EE] px-3 text-[13.5px] font-medium text-[#111827]"><span aria-hidden className="flex h-3.5 w-5 flex-col overflow-hidden rounded-[2px] border border-[#E5E7EB]"><i className="flex-1 bg-[#FF9933]" /><i className="flex-1 bg-white" /><i className="flex-1 bg-[#138808]" /></span>+91</span>
                <input className="min-w-0 flex-1 bg-transparent px-3 text-[14px] tracking-wide text-[#111827] outline-none placeholder:text-[#9CA3AF]" inputMode="numeric" autoComplete="off" placeholder="10-digit mobile number"
                  value={form.phone} onChange={(e) => set({ phone: onlyDigits(e.target.value) })} aria-label="Mobile Number" />
                {phoneOk && !lookingUp && lookup?.bookable !== false && <span className="flex items-center pr-3 text-[#16A34A]"><CheckCircle2 className="h-5 w-5" /></span>}
                {lookingUp && <span className="flex items-center pr-3"><Loader2 className="h-4 w-4 animate-spin text-[#6B7280]" /></span>}
              </div>
              <button type="button" onClick={() => (phoneOk ? runLookup(form.phone, true) : toast.error('Enter a 10-digit mobile number'))} disabled={lookingUp}
                className="flex h-10 items-center gap-2 rounded-lg px-4 text-[13.5px] font-bold text-white disabled:opacity-60" style={{ background: NAVY }}>
                <RefreshCw className={`h-4 w-4 ${lookingUp ? 'animate-spin' : ''}`} /> Fetch Details
              </button>
            </div>
            {lookup && !lookup.bookable && <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] font-semibold text-[#B91C1C]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{lookup.message}</p>}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>Customer Name <Req /></label>
              <input className={field} placeholder="Full name" value={form.name} readOnly={nameLocked} onChange={(e) => set({ name: e.target.value })} aria-label="Customer Name" />
              {nameLocked && <p className="mt-1 text-[11.5px] text-[#6B7280]">Registered name of this customer.</p>}
            </div>
            <div>
              <label className={label}>Alternate Number <Opt /></label>
              <input className={field} inputMode="numeric" placeholder="Another number to reach them" value={form.altPhone} onChange={(e) => set({ altPhone: onlyDigits(e.target.value) })} aria-label="Alternate Number" />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#374151]">
            <input type="checkbox" checked={form.saveAddress} onChange={(e) => set({ saveAddress: e.target.checked })} className="h-[18px] w-[18px] rounded accent-[#1E40E0]" />
            Save this address with the customer for future bookings
          </label>
        </div>
      </Card>

      <Card>
        <Band icon={<MapPin className="h-[18px] w-[18px]" />} right={
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-[#4B5563]">Message in</span>
            <div className="flex overflow-hidden rounded-lg border border-[#D5DDEC] bg-white text-[12.5px] font-semibold" role="group" aria-label="Message language">
              {(['hi', 'en'] as const).map((l) => (
                <button key={l} type="button" onClick={() => chooseLang(l)} aria-pressed={msgLang === l} data-msg-lang={l}
                  title={`The WhatsApp message and the SMS go out in ${l === 'hi' ? 'Hindi' : 'English'}`}
                  className={`h-8 whitespace-nowrap px-3.5 ${msgLang === l ? 'bg-[#E3EBFF] text-[#1E40E0]' : 'text-[#374151] hover:bg-[#F6F8FB]'}`}>{l === 'hi' ? 'हिंदी' : 'English'}</button>
              ))}
            </div>
          </div>
        }>2. Customer Location</Band>
        <div className="space-y-3 p-3.5">
          {Banner}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CHANNELS.map((c) => {
              const used = !!sentOn(c.key)
              const primary = c.key === 'whatsapp'
              const off = c.key === 'app' && phoneOk && !!lookup && !lookup.app.installed
              const Icon = used ? RefreshCw : c.icon
              return (
                <button key={c.key} type="button" onClick={() => ask(c.key)} disabled={!!asking || off} data-ask={c.key}
                  title={off ? 'This customer is not logged in to the Bharat Mechanics app' : undefined}
                  className={`flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-[13.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${primary ? 'border-transparent text-white hover:brightness-110' : 'border-[#CBD5E8] bg-white text-[#0F1E46] hover:bg-[#F3F6FC]'}`}
                  style={primary ? { background: '#1D4ED8' } : undefined}>
                  {asking === c.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                  {used ? c.again : c.label}
                  {c.key === 'app' && appHint && <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${lookup?.app.popup ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{appHint}</span>}
                </button>
              )
            })}
          </div>
          {locReq && locReq.sends.length > 0 && (
            <div className="divide-y divide-[#EEF1F6] rounded-lg border border-[#E6ECF5] bg-[#FBFCFE]">
              {CHANNELS.map((c) => {
                const s = sentOn(c.key)
                if (!s) return null
                const d = deliveries[c.key]
                const tone = s.mode === 'sent' ? 'text-[#15803D]' : s.mode === 'failed' ? 'text-[#B91C1C]' : 'text-[#B45309]'
                return (
                  <div key={c.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[12.5px]" data-sent={c.key}>
                    <b className="w-[92px] shrink-0 text-[#0F1E46]">{CHANNEL_NAME[c.key]}</b>
                    <span className={`min-w-0 flex-1 ${tone}`}>{timeOf(s.at)} · {s.detail}</span>
                    <span className="flex shrink-0 gap-1.5">
                      {c.key === 'whatsapp' && d?.waLink && s.mode !== 'sent' && <a href={d.waLink} target="_blank" rel="noopener noreferrer" className="flex h-7 items-center gap-1 rounded-md border border-[#B7E4C7] bg-white px-2 font-bold text-[#15803D] hover:bg-[#F0FDF4]"><ExternalLink className="h-3.5 w-3.5" />Open WhatsApp</a>}
                      {c.key === 'sms' && d?.text && s.mode !== 'sent' && <button type="button" onClick={async () => ((await copyText(d.text || '')) ? toast.success('Message copied') : toast.error('Could not copy — select the text and copy it'))} className="flex h-7 items-center gap-1 rounded-md border border-[#CBD5E8] bg-white px-2 font-bold text-[#0F1E46] hover:bg-[#F3F6FC]"><Copy className="h-3.5 w-3.5" />Copy message</button>}
                      <button type="button" onClick={() => ask(c.key)} disabled={!!asking} className="flex h-7 items-center gap-1 rounded-md border border-[#CBD5E8] bg-white px-2 font-bold text-[#0F1E46] hover:bg-[#F3F6FC] disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" />Resend</button>
                    </span>
                  </div>
                )
              })}
              <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#4B5563]">
                <Link2 className="h-3.5 w-3.5 shrink-0" style={{ color: BLUE }} />
                <span className="min-w-0 flex-1 truncate font-mono" data-loc-link>{locReq.link}</span>
                <button type="button" onClick={async () => ((await copyText(locReq.link)) ? toast.success('Link copied') : toast.error('Could not copy — select the link and copy it'))} className="flex h-7 shrink-0 items-center gap-1 rounded-md border border-[#CBD5E8] bg-white px-2 font-bold text-[#0F1E46] hover:bg-[#F3F6FC]"><Copy className="h-3.5 w-3.5" />Copy</button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 text-[12px] font-semibold text-[#6B7280]"><span className="h-px flex-1 bg-[#E6ECF5]" />OR<span className="h-px flex-1 bg-[#E6ECF5]" /></div>

          <div className="relative">
            <label className={label}>Enter Location Manually</label>
            <div className="flex h-10 overflow-hidden rounded-lg border border-[#DFE5EE] bg-white focus-within:border-[#2447D6]">
              <span className="flex w-10 shrink-0 items-center justify-center text-[#6B7280]"><Search className="h-4 w-4" /></span>
              <input className="min-w-0 flex-1 bg-transparent pr-3 text-[13.5px] text-[#111827] outline-none placeholder:text-[#9CA3AF]" placeholder="Search area, landmark or street…" value={addrQ}
                onChange={(e) => setAddrQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchAddress() } }} aria-label="Search address" />
              <button type="button" onClick={searchAddress} disabled={addrBusy} title="Search" className="flex w-11 shrink-0 items-center justify-center border-l border-[#DFE5EE] hover:bg-[#F3F6FC]" style={{ color: BLUE }}>
                {addrBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {addrHits.length > 0 && (
              <div className="scrollbar-admin absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-[#DFE5EE] bg-white py-1 shadow-xl">
                {addrHits.map((h) => (
                  <button key={h.key} type="button" onClick={() => pickHit(h)} className="flex w-full items-start gap-2 px-3 py-2 text-left text-[13px] text-[#1F2937] hover:bg-[#F3F6FC]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BLUE }} />{h.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className={label}>Service Address <Req /></label>
            <textarea ref={addressRef} rows={2} className={`${field} scrollbar-admin h-auto py-2`} placeholder="House / shop no., street, area" value={form.address}
              onChange={(e) => { addrAuto.current = false; set({ address: e.target.value }) }} aria-label="Service Address" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div><label className={label}>Landmark <Opt /></label><input className={field} placeholder="Near…" value={form.landmark} onChange={(e) => set({ landmark: e.target.value })} aria-label="Landmark" /></div>
            <div><label className={label}>City</label><input className={field} placeholder="City" value={form.city} onChange={(e) => set({ city: e.target.value })} aria-label="City" /></div>
            <div><label className={label}>Pincode</label><input className={field} inputMode="numeric" placeholder="6 digits" value={form.pincode} onChange={(e) => set({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} aria-label="Pincode" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Latitude <Opt /></label><input className={field} inputMode="decimal" placeholder="e.g. 26.7606" value={form.lat} onChange={(e) => { handMoved.current = true; setFix({ source: 'manual' }); set({ lat: e.target.value.replace(/[^0-9.\-]/g, '') }) }} aria-label="Latitude" /></div>
            <div><label className={label}>Longitude <Opt /></label><input className={field} inputMode="decimal" placeholder="e.g. 83.3732" value={form.lng} onChange={(e) => { handMoved.current = true; setFix({ source: 'manual' }); set({ lng: e.target.value.replace(/[^0-9.\-]/g, '') }) }} aria-label="Longitude" /></div>
          </div>
        </div>
      </Card>
    </>
  )

  const StepTwo = (
    <Card>
      <Band icon={<Car className="h-[18px] w-[18px]" />}>3. Vehicle &amp; Service Details</Band>
      <div className="space-y-3.5 p-3.5">
        {lookup && lookup.vehicles.length > 0 && (
          <div>
            <label className={label}>Customer’s Vehicles</label>
            <div className="flex flex-wrap gap-2">
              {lookup.vehicles.map((v, i) => (
                <button key={i} type="button" onClick={() => set({ vehicleType: kindOf(v.type) || form.vehicleType, brand: v.brand, model: v.model, reg: v.registrationNumber })}
                  className="flex items-center gap-2 rounded-lg border border-[#CBD5E8] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#0F1E46] hover:bg-[#F3F6FC]">
                  <History className="h-3.5 w-3.5" style={{ color: BLUE }} />{[v.brand, v.model].filter(Boolean).join(' ') || 'Vehicle'}{v.registrationNumber ? ` · ${v.registrationNumber}` : ''}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className={label}>Vehicle Type <Req /></label>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {VEHICLE_KINDS.map((k) => {
              const on = form.vehicleType === k.key
              const I = vehicleIconFor(k.key === 'auto' ? 'car' : k.key)
              return (
                <button key={k.key} type="button" onClick={() => set({ vehicleType: k.key, ...(form.vehicleType && form.vehicleType !== k.key ? { brand: '', model: '' } : {}) })} aria-pressed={on} data-vehicle={k.key}
                  className={`relative flex h-[72px] flex-col items-center justify-center gap-1 rounded-xl border text-[12.5px] font-semibold ${on ? 'border-[#1E40E0] bg-[#EEF3FF] text-[#1E40E0]' : 'border-[#E1E7F0] bg-[#F7F9FC] text-[#4B5563] hover:bg-[#EEF2F8]'}`}>
                  {on && <span className="absolute left-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#1E40E0] text-white"><Check className="h-3 w-3" /></span>}
                  <I size={26} />{k.label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={label}>Vehicle Brand <Req /></label>
            <input className={field} list="bm-cr-brands" placeholder={form.vehicleType ? 'e.g. ' + (brandList[0] || 'Honda') : 'Choose the type first'} value={form.brand} onChange={(e) => set({ brand: e.target.value })} aria-label="Vehicle Brand" />
            <datalist id="bm-cr-brands">{brandList.map((b) => <option key={b} value={b} />)}</datalist>
          </div>
          <div>
            <label className={label}>Model <Req /></label>
            <input className={field} list="bm-cr-models" placeholder={modelList[0] ? `e.g. ${modelList[0]}` : 'Model'} value={form.model} onChange={(e) => set({ model: e.target.value })} aria-label="Model" />
            <datalist id="bm-cr-models">{modelList.map((m) => <option key={m} value={m} />)}</datalist>
          </div>
          <div>
            <label className={label}>Registration Number <Opt /></label>
            <input className={`${field} uppercase`} placeholder="UP 53 AB 1234" value={form.reg} onChange={(e) => set({ reg: e.target.value.toUpperCase().slice(0, 14) })} aria-label="Registration Number" />
          </div>
        </div>
        <div>
          <label className={label}>Service Required <Req /> <span className="font-normal text-[#6B7280]">— choose all that apply</span></label>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((s) => {
              const on = form.services.includes(s)
              return (
                <button key={s} type="button" aria-pressed={on} data-service={s} onClick={() => set({ services: on ? form.services.filter((x) => x !== s) : [...form.services, s] })}
                  className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold ${on ? 'border-[#1E40E0] bg-[#EEF3FF] text-[#1E40E0]' : 'border-[#E1E7F0] bg-[#F7F9FC] text-[#374151] hover:bg-[#EEF2F8]'}`}>
                  {on ? <CheckCircle2 className="h-4 w-4" /> : <Wrench className="h-3.5 w-3.5 text-[#6B7280]" />}{s}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label className={label}>Problem in the Customer’s Words <Opt /></label>
          <textarea rows={3} className={`${field} h-auto py-2`} maxLength={1500} placeholder="e.g. Bike stopped suddenly near the petrol pump, self is not working…" value={form.description} onChange={(e) => set({ description: e.target.value })} aria-label="Problem description" />
        </div>
      </div>
    </Card>
  )

  const StepThree = (
    <Card>
      <Band icon={<SlidersHorizontal className="h-[18px] w-[18px]" />}>4. Additional Information</Band>
      <div className="space-y-3.5 p-3.5">
        <div>
          <label className={label}>Where is the Service Needed?</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {SERVICE_TYPES.map((t) => {
              const on = form.serviceType === t.key
              return (
                <button key={t.key} type="button" aria-pressed={on} onClick={() => set({ serviceType: t.key })}
                  className={`flex flex-col items-start justify-start rounded-xl border px-3 py-2.5 text-left ${on ? 'border-[#1E40E0] bg-[#EEF3FF]' : 'border-[#E1E7F0] bg-[#F7F9FC] hover:bg-[#EEF2F8]'}`}>
                  <b className={`block text-[13.5px] ${on ? 'text-[#1E40E0]' : 'text-[#111827]'}`}>{t.label}</b>
                  <span className="text-[12px] text-[#6B7280]">{t.hint}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label className={label}>Priority</label>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => {
              const on = form.priority === p.key
              return (
                <button key={p.key} type="button" aria-pressed={on} data-priority={p.key} onClick={() => set({ priority: p.key })}
                  className={`h-9 rounded-full border px-4 text-[13px] font-bold ${on ? 'border-transparent' : 'border-[#E1E7F0] bg-white text-[#374151] hover:bg-[#F3F6FC]'}`}
                  style={on ? { background: p.bg, color: p.fg } : undefined}>{p.label}</button>
              )
            })}
          </div>
          {form.priority === 'urgent' && <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#B91C1C]"><AlertTriangle className="h-4 w-4" />Emergency request{fees ? ` — visiting charge ₹${fees.emergency} instead of ₹${fees.normal}` : ''}.</p>}
        </div>
        <div>
          <label className={label}>When?</label>
          <div className="flex flex-wrap gap-2">
            {([['now', 'As soon as possible', Clock], ['later', 'Schedule for later', CalendarDays]] as const).map(([k, t, I]) => (
              <button key={k} type="button" aria-pressed={form.when === k} onClick={() => set({ when: k })}
                className={`flex h-10 items-center gap-2 rounded-lg border px-3.5 text-[13.5px] font-semibold ${form.when === k ? 'border-[#1E40E0] bg-[#EEF3FF] text-[#1E40E0]' : 'border-[#E1E7F0] bg-white text-[#374151] hover:bg-[#F3F6FC]'}`}><I className="h-4 w-4" />{t}</button>
            ))}
          </div>
          {form.when === 'later' && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label className={label}>Preferred Date <Req /></label><input type="date" className={field} min={today()} value={form.date} onChange={(e) => set({ date: e.target.value })} aria-label="Preferred Date" /></div>
              <div>
                <label className={label}>Time Slot <Opt /></label>
                <select className={field} value={form.slot} onChange={(e) => set({ slot: e.target.value })} aria-label="Time Slot">
                  <option value="">Any time</option>
                  {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className={label}>Notes for the Mechanic <Opt /></label>
          <textarea rows={2} className={`${field} h-auto py-2`} maxLength={1000} placeholder="Gate code, call before coming, vehicle is in the basement…" value={form.notes} onChange={(e) => set({ notes: e.target.value })} aria-label="Notes" />
        </div>
        <div>
          <label className={label}>Photos <Opt /></label>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
              className="flex h-[110px] min-w-[230px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#C9D3E3] bg-[#FAFBFE] px-3 text-center hover:bg-[#F3F6FC]">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" style={{ color: BLUE }} /> : <ImagePlus className="h-6 w-6" style={{ color: BLUE }} />}
              <b className="mt-1.5 text-[13.5px] font-bold text-[#0F1E46]">{uploading ? 'Uploading…' : 'Upload photos'}</b>
              <span className="text-[12px] text-[#4B5563]">Photos the customer sent on WhatsApp — drag &amp; drop or click</span>
              <i className="text-[11.5px] text-[#6B7280]">JPG, PNG (max {MAX_PHOTOS} files, {MAX_MB} MB each)</i>
            </button>
            {form.photos.map((src, i) => (
              <div key={src + i} className="relative h-[110px] w-[120px] shrink-0 overflow-hidden rounded-xl border border-[#E6ECF5] bg-[#F1F5F9]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <a href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" /></a>
                <button type="button" aria-label="Remove photo" onClick={() => set({ photos: form.photos.filter((_, j) => j !== i) })}
                  className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0F172A]/80 text-white hover:bg-[#0F172A]"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {form.photos.length > 0 && form.photos.length < MAX_PHOTOS && (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex h-[110px] w-[100px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#C9D3E3] text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F3F6FC]"><Plus className="h-6 w-6" style={{ color: BLUE }} />Add More</button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )

  const EditBtn = (n: number) => <button type="button" onClick={() => setStep(n)} className="flex items-center gap-1.5 text-[13px] font-bold hover:underline" style={{ color: BLUE }}><Pencil className="h-3.5 w-3.5" />Edit</button>
  const StepFour = (
    <>
      <Card>
        <Band icon={<User className="h-[18px] w-[18px]" />} right={EditBtn(0)}>Customer &amp; Location</Band>
        <div className="space-y-2 p-3.5">
          <Line k="Customer">{form.name || '—'} <span className="font-normal text-[#6B7280]">· {existing ? 'existing customer' : 'new customer — an account is created with this number'}</span></Line>
          <Line k="Mobile">+91 {form.phone}{form.altPhone ? ` · alt +91 ${form.altPhone}` : ''}</Line>
          <Line k="Address">{joinAddr(form.address, form.landmark && `Near ${form.landmark}`, form.city, form.pincode) || '—'}</Line>
          <Line k="Map location">{hasPos ? <>{lat.toFixed(5)}, {lng.toFixed(5)} <span className="font-normal text-[#6B7280]">· {fixLabel}</span></> : <span className="text-[#B45309]">No pin on the map — the nearest mechanic cannot be worked out. Go back and add it if you can.</span>}</Line>
        </div>
      </Card>
      <Card>
        <Band icon={<Car className="h-[18px] w-[18px]" />} right={EditBtn(1)}>Vehicle &amp; Service</Band>
        <div className="space-y-2 p-3.5">
          <Line k="Vehicle">{[VEHICLE_KINDS.find((k) => k.key === form.vehicleType)?.label, form.brand, form.model].filter(Boolean).join(' · ') || '—'}{form.reg ? ` · ${form.reg}` : ''}</Line>
          <Line k="Service">{form.services.join(', ') || '—'}</Line>
          {form.description.trim() && <Line k="Problem">{form.description.trim()}</Line>}
        </div>
      </Card>
      <Card>
        <Band icon={<SlidersHorizontal className="h-[18px] w-[18px]" />} right={EditBtn(2)}>Additional Info</Band>
        <div className="space-y-2 p-3.5">
          <Line k="Service at">{SERVICE_TYPES.find((t) => t.key === form.serviceType)?.label}</Line>
          <Line k="Priority"><span className="rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={{ background: prio.bg, color: prio.fg }}>{prio.label}</span></Line>
          <Line k="When">{form.when === 'now' ? 'As soon as possible' : `${new Date(form.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${form.slot ? `, ${form.slot}` : ''}`}</Line>
          {form.notes.trim() && <Line k="Notes">{form.notes.trim()}</Line>}
          {form.photos.length > 0 && <Line k="Photos">{form.photos.length} attached</Line>}
          {fee != null && <Line k="Visiting charge">₹{fee} <span className="font-normal text-[#6B7280]">· added to the final bill, collected at the service</span></Line>}
        </div>
      </Card>
      <p className="flex items-start gap-2 rounded-xl border border-[#DCE4F2] bg-[#F6F8FD] px-3.5 py-3 text-[12.5px] text-[#374151]">
        <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BLUE }} />
        <span>The request is created as <b>Pending</b>. Assign a garage or mechanic from the list afterwards. The customer gets a notification in the Bharat Mechanics app if they have it installed.</span>
      </p>
    </>
  )

  // the customer's earlier addresses: in the map card until a location is on the map,
  // under the nearest list after that (so that list is in view without scrolling)
  const Recent = lookup && lookup.recentLocations.length > 0 ? (
    <>
      <span className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-[#0F1E46]"><History className="h-4 w-4" style={{ color: BLUE }} />Recent Locations</span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {lookup.recentLocations.map((r, i) => (
          <button key={i} type="button" onClick={() => { pickRecent(r); setStep(0) }} data-recent={i} className="rounded-lg border border-[#E6ECF5] bg-[#FAFBFE] px-2.5 py-2 text-left hover:bg-[#F1F5FB]">
            <b className="block truncate text-[12.5px] text-[#111827]">{r.label}</b>
            <span className="line-clamp-2 text-[11.5px] text-[#6B7280]">{joinAddr(r.address, r.city)}</span>
          </button>
        ))}
      </div>
    </>
  ) : null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0B1730]/60 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="Create Service Request">
      <div className="flex h-full max-h-[980px] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-7">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white" style={{ background: BLUE }}><ClipboardPlus className="h-[22px] w-[22px]" /></span>
            <div className="min-w-0">
              <h2 className="text-[23px] font-extrabold leading-tight text-[#0F1E46]">Create Service Request</h2>
              <p className="mt-0.5 text-[13.5px] text-[#6B7280]">Add a new customer request manually or via phone call. Our team will find and assign the nearest garage / mechanic.</p>
            </div>
          </div>
          <button type="button" onClick={requestClose} disabled={saving} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#16305C] hover:bg-[#F1F5F9]"><X className="h-6 w-6" /></button>
        </div>

        {/* steps */}
        <div className="mx-4 mb-3 flex shrink-0 items-stretch gap-1 overflow-x-auto rounded-xl border border-[#E6ECF5] bg-[#FAFBFE] p-1 [scrollbar-width:none] sm:mx-6 [&::-webkit-scrollbar]:hidden">
          {STEPS.map((s, i) => {
            const on = i === step, done = i < step
            return (
              <button key={s.title} type="button" onClick={() => goTo(i)} aria-current={on ? 'step' : undefined} data-step={i + 1}
                className={`flex min-w-[190px] flex-1 items-center gap-3 rounded-lg px-3 py-2 text-left ${on ? 'bg-[#E6EEFF]' : 'hover:bg-[#F1F5FB]'}`}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${on ? 'text-white' : done ? 'bg-[#DCFCE7] text-[#15803D]' : 'border border-[#CBD5E8] bg-white text-[#475569]'}`} style={on ? { background: BLUE } : undefined}>{done ? <Check className="h-4 w-4" /> : i + 1}</span>
                <span className="min-w-0"><b className="block truncate text-[13.5px] text-[#0F1E46]">{s.title}</b><span className="block truncate text-[11.5px] text-[#6B7280]">{s.sub}</span></span>
              </button>
            )
          })}
        </div>

        <div className="scrollbar-admin grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-4 pb-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_410px] lg:overflow-hidden">
          {/* ───────── form ───────── */}
          <div className="scrollbar-admin space-y-3 lg:overflow-y-auto lg:pr-1.5 lg:[scrollbar-gutter:stable]" data-cr-step={step + 1}>
            {step === 0 ? StepOne : step === 1 ? StepTwo : step === 2 ? StepThree : StepFour}
          </div>

          {/* ───────── preview ───────── */}
          <div className="scrollbar-admin space-y-3 lg:overflow-y-auto lg:pr-1.5 lg:[scrollbar-gutter:stable]">
            <Card className="overflow-hidden">
              <Band icon={<MapPin className="h-[18px] w-[18px]" />}>Location Preview</Band>
              <div className="relative h-[280px]">
                <CreateRequestMap value={pos} accuracy={fix?.accuracy} onChange={(p) => placePin(p.lat, p.lng, { source: 'manual' })} className="h-full w-full" offsetX={0} radiusKm={radiusKm}
                  focusKey={fix && fix.source !== 'manual' ? `${fix.source}|${fix.at || ''}|${form.lat},${form.lng}` : ''}
                  nearby={nearPins} fitKey={fitKey} />
                {pos ? (
                  <>
                    {/* the search radius around the customer — the nearest list and the ring on the map follow it */}
                    <label data-radius className="absolute right-2.5 top-2.5 z-10 flex h-9 items-center gap-1 rounded-lg bg-white px-2.5 text-[12.5px] font-bold text-[#0F1E46] shadow-[0_2px_8px_rgba(15,23,42,.18)]">
                      <span className="font-semibold text-[#4B5563]">Radius:</span>
                      <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} aria-label="Radius" className="bg-transparent font-bold outline-none">
                        {[5, 10, 20, 50].map((k) => <option key={k} value={k}>{k} km</option>)}<option value={0}>Any</option>
                      </select>
                    </label>
                    {fix?.accuracy && rough ? <span className="pointer-events-none absolute right-2.5 top-12 z-10 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-bold text-[#B45309] shadow">Accuracy ±{fix.accuracy} m{fix.refining ? ' …' : ''}</span> : null}
                    <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noopener noreferrer"
                      className="absolute bottom-8 left-2.5 z-10 flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-[12.5px] font-bold text-[#0F1E46] shadow-[0_2px_8px_rgba(15,23,42,.18)] hover:bg-[#F3F6FC]"><MapPin className="h-4 w-4" style={{ color: BLUE }} />View on Google Maps</a>
                  </>
                ) : (
                  <div className="pointer-events-none absolute left-14 right-3 top-3 z-10 rounded-lg bg-white/95 px-3 py-2 text-center text-[12.5px] font-semibold text-[#475569] shadow">No location yet — ask the customer, or tap the map to drop the pin.</div>
                )}
              </div>
              <div className="flex items-start gap-2.5 border-t border-[#EEF1F6] px-3.5 py-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BLUE }} />
                <div className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-[#6B7280]">Location Address{fixLabel ? ` · ${fixLabel}` : ''}</span>
                  <span className="block break-words text-[13px] text-[#111827]">{joinAddr(form.address, form.city, form.pincode) || 'Not entered yet'}</span>
                  {pos && <span className="mt-0.5 block text-[11.5px] text-[#6B7280]">Wrong spot? Press “Change Location”, then drag the pin.</span>}
                </div>
                <button type="button" onClick={() => { setStep(0); setTimeout(() => addressRef.current?.focus(), 60) }} className="flex shrink-0 items-center gap-1.5 text-[13px] font-bold hover:underline" style={{ color: BLUE }}><Pencil className="h-3.5 w-3.5" />Edit</button>
              </div>
              {Recent && !pos && <div className="border-t border-[#EEF1F6] px-3.5 py-2.5">{Recent}</div>}
            </Card>

            {/* who is closest to this customer — fills in as soon as there is a location */}
            <NearbyPartners pos={pos} addressQueries={addrQueries} shops={shops} mechanics={mechanics} loading={partnersLoading} radiusKm={radiusKm}
              onOpen={(it, from) => setPartner({ show: it.kind, ...(it.kind === 'garage' ? { garage: { id: it.id, field: it.field, raw: it.raw, name: it.name, phone: it.phone } } : { mechanic: { id: it.id, raw: it.raw, name: it.name, phone: it.phone } }), customer: from.customer, approx: from.approx })}
              onPins={setNearPins} onShowOnMap={() => setFitKey((k) => k + 1)} />
            {Recent && pos && <Card><div className="px-3.5 py-2.5" data-recent-below>{Recent}</div></Card>}

            <Card>
              <Band icon={<User className="h-[18px] w-[18px]" />}>Customer Preview</Band>
              <div className="flex items-center gap-3 p-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E3EBFF] text-[15px] font-bold text-[#1E40E0]">{initialsOf(form.name || '?')}</span>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-[14.5px] text-[#111827]">{form.name || 'Customer name'}</b>
                  <span className="block text-[12.5px] text-[#4B5563]">{form.phone ? `+91 ${form.phone}` : 'Mobile number'}</span>
                  {phoneOk && lookup && lookup.bookable && <span className={`mt-1 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${existing ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEF3C7] text-[#B45309]'}`}>{existing ? `Existing · ${lookup.totalRequests} request${lookup.totalRequests === 1 ? '' : 's'}` : 'New customer'}</span>}
                </div>
                {phoneOk && (
                  <div className="flex shrink-0 gap-1.5">
                    <a href={`https://wa.me/91${form.phone}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E3E8EF] px-2.5 text-[12.5px] font-bold text-[#15803D] hover:bg-[#F0FDF4]"><WhatsAppIcon className="h-4 w-4" />WhatsApp</a>
                    <a href={`tel:+91${form.phone}`} title="Call" className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E3E8EF] px-2.5 text-[12.5px] font-bold hover:bg-[#F3F6FC]" style={{ color: BLUE }}><Phone className="h-4 w-4" />Call</a>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <Band icon={<Car className="h-[18px] w-[18px]" />}>Vehicle Preview</Band>
              <div className="flex items-center gap-3 p-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F7] text-[#16305C]"><V size={28} /></span>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-[14.5px] text-[#111827]">{[form.brand, form.model].filter(Boolean).join(' ') || 'Vehicle not chosen yet'}</b>
                  <span className="block truncate text-[12.5px] text-[#4B5563]">{form.reg || (form.services.length ? form.services.join(', ') : 'Step 2 — vehicle and service')}</span>
                </div>
                <button type="button" onClick={() => goTo(1)} className="flex shrink-0 items-center gap-1.5 text-[13px] font-bold hover:underline" style={{ color: BLUE }}><Pencil className="h-3.5 w-3.5" />Edit</button>
              </div>
            </Card>

            {step === 0 && !captured && (
              <div className="flex items-center gap-3 rounded-xl border border-[#CFDCF8] bg-[#EEF3FD] p-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white" style={{ background: BLUE }}><Phone className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <b className="block text-[13.5px] text-[#0F1E46]">Customer Called Us?</b>
                  <span className="text-[11.5px] leading-snug text-[#4B5563]">Send a location request while they are on the call — they just tap and share.</span>
                </div>
                <button type="button" onClick={() => ask(bestChannel)} disabled={!!asking} className="flex h-9 shrink-0 items-center rounded-lg px-3 text-[12.5px] font-bold text-white disabled:opacity-60" style={{ background: '#1D4ED8' }}>
                  {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : locReq ? 'Resend Request' : 'Send Location Link'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#E6ECF5] bg-white px-4 py-3 sm:px-6">
          <button type="button" onClick={() => saveDraft()} disabled={saving || !dirty} className="flex h-11 items-center gap-2 rounded-xl border border-[#CBD5E8] bg-white px-4 text-[13.5px] font-bold disabled:opacity-50" style={{ color: BLUE }}><Save className="h-4 w-4" />Save as Draft</button>
          <div className="flex flex-1 flex-wrap justify-end gap-2.5">
            <button type="button" onClick={step === 0 ? requestClose : () => setStep(step - 1)} disabled={saving}
              className="flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-[#D5DDEC] bg-white px-5 text-[14px] font-bold text-[#111827] hover:bg-[#F6F8FB]">
              {step === 0 ? 'Cancel' : <><ArrowLeft className="h-4 w-4" />Back</>}
            </button>
            {step < 3 ? (
              <button type="button" onClick={() => goTo(step + 1)} data-cr-next className="flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-xl px-6 text-[14px] font-bold text-white hover:brightness-110" style={{ background: NAVY }}>Next<ArrowRight className="h-4 w-4" /></button>
            ) : (
              <button type="button" onClick={submit} disabled={saving} data-cr-submit className="flex h-11 min-w-[230px] items-center justify-center gap-2 rounded-xl bg-[#FF5A1F] px-6 text-[14px] font-bold text-white hover:bg-[#F04E14] disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}{saving ? 'Creating…' : 'Create Request & Notify Customer'}
              </button>
            )}
          </div>
        </div>
      </div>
      <PartnerDetailsDialog target={partner} mechanics={mechanics} onClose={() => setPartner(null)} />
    </div>
  )
}
