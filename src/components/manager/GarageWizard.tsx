'use client'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import {
  IcAdd, IcArrowBack, IcArrowForward, IcCall, IcChat, IcCheck, IcCheckCircle, IcClose, IcDelete, IcDescription, IcEvent, IcLocationOn,
  IcMyLocation, IcNightsStay, IcPayments, IcPerson, IcPhotoCamera, IcStar, IcStarBorder, IcStorefront, IcWbSunny, IcBuild, IcBadge, IcNotes,
} from '@/components/icons/BmIcons'
import { garageFieldAPI } from '@/services/api'
import { GarageMap, LatLng } from './GarageMap'
import { DAYS, DISTANCES, MECH_VEHICLES, SERVICES, SIZES, VEHICLES, time12 } from './garageOptions'
import { clearDraft, compressImage, loadDraft, saveDraft } from './staff'
import { MyGarage, NAVY, ORANGE, StaffShell } from './StaffShell'
import { useStaff } from './StaffAuth'
import { StatusPill } from './StaffScreens'

type Mech = { name: string; phone: string; vehicle: string; skills: string; photo: string }
type Form = {
  garageName: string; ownerName: string; whatsapp: string; callNumber: string; address: string; area: string; city: string; pincode: string
  location: LatLng | null; photos: string[]
  vehicleTypes: string[]; services: string[]; otherWork: string; openTime: string; closeTime: string; weeklyOff: string
  emergency: boolean | null; sendsMechanic: boolean | null; travelKm: string; partsWarranty: string
  mechanics: Mech[]
  upi: string; ownerIdPhoto: string; yearsRunning: string; rates: { puncture: string; battery: string; service: string; visit: string }
  gst: string; hasOwnVehicle: boolean | null
  visit: { date: string; by: string; garageSize: string; mechanicCount: string; rating: number; offerNote: string; notes: string }
}
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const blankMech = (): Mech => ({ name: '', phone: '', vehicle: '', skills: '', photo: '' })
const blank = (): Form => ({
  garageName: '', ownerName: '', whatsapp: '', callNumber: '', address: '', area: '', city: '', pincode: '', location: null, photos: [],
  vehicleTypes: [], services: [], otherWork: '', openTime: '09:00', closeTime: '21:00', weeklyOff: 'sunday',
  emergency: null, sendsMechanic: null, travelKm: '', partsWarranty: '',
  mechanics: [blankMech()],
  upi: '', ownerIdPhoto: '', yearsRunning: '', rates: { puncture: '', battery: '', service: '', visit: '' }, gst: '', hasOwnVehicle: null,
  visit: { date: today(), by: '', garageSize: '', mechanicCount: '', rating: 0, offerNote: '', notes: '' },
})
const STEPS = [
  { n: 1, label: 'Garage', title: 'Garage Details', sub: 'Basic information about your garage' },
  { n: 2, label: 'Services', title: 'Vehicle & Services', sub: 'Vehicles you work on and the services you offer' },
  { n: 3, label: 'Mechanics', title: 'Mechanics Details', sub: 'Mechanics who go to the customer for service' },
  { n: 4, label: 'Payment\n& Others', title: 'Payment & Other Details', sub: 'Payment, documents, rates and visit details' },
]
const isPhone = (p: string) => /^[6-9]\d{9}$/.test(p)
const digits = (v: string, n = 10) => v.replace(/\D/g, '').slice(0, n)

// ───────────────────────── small form pieces ─────────────────────────
const Req = () => <b className="ml-0.5 text-[#E11D48]">*</b>
const Label = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
  <span className="mb-1.5 block text-[13.5px] font-semibold text-[#13203A]">{children}{req && <Req />}</span>
)
const box = 'flex min-h-[50px] items-stretch overflow-hidden rounded-xl border bg-white focus-within:border-[#1B3B6F]'
function Field({ icon, prefix, error, children }: { icon?: React.ReactNode; prefix?: string; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={box} style={{ borderColor: error ? '#F87171' : '#D9E1EC' }}>
      {icon && <span className="flex w-[46px] shrink-0 items-center justify-center border-r border-[#E6EBF2] text-[#1B3B6F]">{icon}</span>}
      {prefix && <span className="flex shrink-0 items-center border-r border-[#E6EBF2] px-3 text-[15px] font-semibold text-[#13203A]">{prefix}</span>}
      {children}
    </div>
  )
}
const inp = 'min-w-0 flex-1 bg-transparent px-3 text-[15px] text-[#13203A] outline-none placeholder:text-[#9AA6B8]'
const YesNo = ({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) => (
  <div className="flex shrink-0 overflow-hidden rounded-xl border border-[#D9E1EC] bg-white">
    {[true, false].map((v) => (
      <button key={String(v)} type="button" onClick={() => onChange(v)} className="h-10 min-w-[68px] px-3 text-[13.5px] font-bold" style={value === v ? { background: ORANGE, color: '#fff' } : { color: '#475569' }}>{v ? 'Yes' : 'No'}</button>
    ))}
  </div>
)
const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <section>
    <h3 className="mb-3 flex items-center gap-2.5 rounded-xl bg-[#EEF3FB] px-3 py-2.5 text-[14.5px] font-bold" style={{ color: NAVY }}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: NAVY }}>{icon}</span>{title}
    </h3>
    <div className="space-y-4">{children}</div>
  </section>
)

// ───────────────────────── photo upload ─────────────────────────
function usePhotoUpload(folder: 'garage-photos' | 'garage-mechanics' | 'garage-owner-ids', onDone: (url: string) => void) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const ref = useRef<HTMLInputElement | null>(null)
  const pick = () => ref.current?.click()
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setErr('Please choose a photo')
    setBusy(true); setErr('')
    try {
      const blob = await compressImage(file)
      const r = await garageFieldAPI.upload(blob, folder, (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg')
      if (!r.data?.data?.url) throw new Error('no url')
      onDone(r.data.data.url)
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Photo upload failed. Check your internet and try again.')
    } finally { setBusy(false) }
  }
  const input = <input ref={ref} type="file" accept="image/*" onChange={onFile} className="hidden" />
  return { busy, err, pick, input }
}
const Spinner = () => <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />

function GaragePhotos({ photos, onChange, error }: { photos: string[]; onChange: (p: string[]) => void; error?: boolean }) {
  const up = usePhotoUpload('garage-photos', (url) => onChange([...photos, url]))
  return (
    <div>
      {up.input}
      <div className="grid grid-cols-2 gap-2.5">
        {photos.map((p) => (
          <div key={p} className="relative h-[120px] overflow-hidden rounded-xl bg-[#E8EEF7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${p}?tr=w-400,h-260,fo-auto`} alt="Garage photo" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(photos.filter((x) => x !== p))} aria-label="Remove photo" className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"><IcClose size={16} /></button>
          </div>
        ))}
        {photos.length < 6 && (
          <button type="button" onClick={up.pick} disabled={up.busy} className="flex h-[120px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed bg-white text-[#1B3B6F] active:bg-[#F3F6FB]" style={{ borderColor: error ? '#F87171' : '#C7D2E3' }}>
            {up.busy ? <><Spinner /><span className="text-[12.5px] font-semibold">Uploading…</span></> : (
              <><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF3FB]"><IcPhotoCamera size={22} /></span>
                <b className="text-[13.5px]">Add Photo</b><span className="px-2 text-center text-[11px] text-[#64748B]">(Clear photo with the signboard)</span></>
            )}
          </button>
        )}
      </div>
      {up.err && <p className="mt-1.5 text-[12.5px] font-semibold text-[#DC2626]">{up.err}</p>}
    </div>
  )
}

// ───────────────────────── location picker (full-screen sheet) ─────────────────────────
function LocationSheet({ value, onPick, onClose }: { value: LatLng | null; onPick: (p: LatLng, place: { area?: string; city?: string; pincode?: string; line?: string }) => void; onClose: () => void }) {
  const [pos, setPos] = useState<LatLng | null>(value)
  const [me, setMe] = useState<LatLng | null>(null)
  const [msg, setMsg] = useState(value ? '' : 'Finding your location…')
  const [saving, setSaving] = useState(false)

  const locate = () => {
    if (!navigator.geolocation) return setMsg('This phone does not support location. Tap the map to choose the spot.')
    setMsg('Finding your location…')
    navigator.geolocation.getCurrentPosition(
      (p) => { const ll = { lat: p.coords.latitude, lng: p.coords.longitude }; setMe(ll); setPos(ll); setMsg(p.coords.accuracy > 60 ? `GPS ±${Math.round(p.coords.accuracy)} m — drag the pin onto the garage gate` : '') },
      () => setMsg('Could not get your location. Turn on location on the phone, or tap the map to choose the spot.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }
  useEffect(() => { if (!value) locate() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const confirm = async () => {
    if (!pos) return
    setSaving(true)
    let place: { area?: string; city?: string; pincode?: string; line?: string } = {}
    try {
      const ctrl = new AbortController()
      const tm = setTimeout(() => ctrl.abort(), 6000)
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.lat}&lon=${pos.lng}&zoom=17&addressdetails=1&accept-language=en`, { signal: ctrl.signal })
      clearTimeout(tm)
      const a = (await r.json())?.address || {}
      place = {
        area: a.suburb || a.neighbourhood || a.village || a.hamlet || a.town || a.road || '',
        city: a.city || a.town || a.county || a.state_district || '',
        pincode: /^\d{6}$/.test(a.postcode || '') ? a.postcode : '',
        line: [a.road, a.suburb || a.neighbourhood || a.village, a.city || a.town || a.county, a.state, a.postcode].filter(Boolean).join(', '),
      }
    } catch { /* address lookup is a bonus — the pin is what matters */ }
    setSaving(false)
    onPick(pos, place)
  }

  return (
    <div className="fixed inset-0 z-[70] mx-auto flex max-w-[480px] flex-col bg-white">
      <div className="flex h-[58px] shrink-0 items-center gap-2 border-b border-[#E6EBF2] px-3">
        <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full text-[#1B3B6F]"><IcClose size={22} /></button>
        <b className="flex-1 text-center text-[16px] text-[#13203A]">Choose the garage location</b>
        <span className="w-10" />
      </div>
      <div className="relative flex-1">
        <GarageMap picker={{ value: pos, onChange: (p) => { setPos(p); setMsg('') } }} me={me} className="h-full w-full" zoomControl={false} />
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 rounded-xl bg-white/95 px-3 py-2 text-center text-[12.5px] font-semibold text-[#334155] shadow">
          {msg || 'Stand at the garage gate and set the pin. Drag the pin or tap the map to move it.'}
        </div>
        <button type="button" onClick={locate} aria-label="My location" className="absolute bottom-4 right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#1B3B6F] shadow-lg"><IcMyLocation size={22} /></button>
      </div>
      <div className="shrink-0 border-t border-[#E6EBF2] p-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <button type="button" onClick={confirm} disabled={!pos || saving} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-bold text-white disabled:opacity-50" style={{ background: ORANGE }}>
          {saving ? <Spinner /> : <IcCheck size={20} />} Use this location
        </button>
      </div>
    </div>
  )
}

// ───────────────────────── mechanic card ─────────────────────────
function MechanicCard({ i, m, onChange, onRemove, errs }: { i: number; m: Mech; onChange: (m: Mech) => void; onRemove?: () => void; errs: Record<string, boolean> }) {
  const up = usePhotoUpload('garage-mechanics', (url) => onChange({ ...m, photo: url }))
  const set = (k: keyof Mech) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...m, [k]: k === 'phone' ? digits(e.target.value) : e.target.value })
  return (
    <div className="rounded-2xl border border-[#E6EBF2] bg-white p-3.5">
      {up.input}
      <div className="mb-3 flex items-center justify-between">
        <b className="text-[15px]" style={{ color: NAVY }}>Mechanic {i + 1}</b>
        {onRemove && <button type="button" onClick={onRemove} className="flex items-center gap-1 text-[13px] font-bold text-[#DC2626]"><IcDelete size={17} /> Remove</button>}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={up.pick} disabled={up.busy} className="relative flex h-[112px] w-[92px] shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed bg-[#F6F8FC] text-[#1B3B6F]" style={{ borderColor: errs.photo ? '#F87171' : '#C7D2E3' }}>
          {m.photo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={`${m.photo}?tr=w-200,h-240,fo-face`} alt="Mechanic" className="absolute inset-0 h-full w-full object-cover" />
            : up.busy ? <Spinner /> : <><IcPhotoCamera size={24} /><span className="text-[11px] font-bold">Take photo</span></>}
          {m.photo && <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10.5px] font-bold text-white">{up.busy ? '…' : 'Change'}</span>}
        </button>
        <div className="min-w-0 flex-1 space-y-2.5">
          <label className="block"><Label req>Name</Label>
            <Field icon={<IcPerson size={19} />} error={errs.name}><input className={inp} value={m.name} onChange={set('name')} placeholder="e.g. Amit Kumar" maxLength={80} /></Field>
          </label>
          <label className="block"><Label req>Mobile number</Label>
            <Field prefix="+91" error={errs.phone}><input className={inp} value={m.phone} onChange={set('phone')} inputMode="numeric" placeholder="Enter number" /></Field>
          </label>
        </div>
      </div>
      <div className="mt-2.5 space-y-2.5">
        <label className="block"><Label req>Vehicle (used to reach the customer)</Label>
          <Field error={errs.vehicle}>
            <select className={`${inp} h-[50px]`} value={m.vehicle} onChange={set('vehicle')}>
              <option value="">Select vehicle</option>
              {MECH_VEHICLES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
        </label>
        <label className="block"><Label req>What is he good at?</Label>
          <Field icon={<IcBuild size={19} />} error={errs.skills}><input className={inp} value={m.skills} onChange={set('skills')} placeholder="e.g. Engine, Electrical, Puncture" maxLength={200} /></Field>
        </label>
      </div>
      {up.err && <p className="mt-1.5 text-[12.5px] font-semibold text-[#DC2626]">{up.err}</p>}
    </div>
  )
}

// ═════════════════════════════ the wizard ═════════════════════════════
export function GarageWizard() {
  const router = useRouter()
  const { me } = useStaff()
  const [f, setF] = useState<Form>(blank)
  const [step, setStep] = useState(1)
  const [errs, setErrs] = useState<Record<string, boolean>>({})
  const [msg, setMsg] = useState('')
  const [picking, setPicking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<MyGarage | null>(null)
  const [restored, setRestored] = useState(false)
  const [hydrated, setHydrated] = useState(false) // the saved draft has been read into the form
  const idUp = usePhotoUpload('garage-owner-ids', (url) => setF((x) => ({ ...x, ownerIdPhoto: url })))

  // restore a half-filled visit, then keep saving it as the executive types
  useEffect(() => {
    const d = loadDraft<{ f: Form; step: number }>()
    if (d?.f?.garageName !== undefined) { setF({ ...blank(), ...d.f, visit: { ...blank().visit, ...d.f.visit }, rates: { ...blank().rates, ...d.f.rates } }); setStep(Math.min(4, Math.max(1, d.step || 1))); setRestored(!!(d.f.garageName || d.f.ownerName || d.f.whatsapp)) }
    setHydrated(true)
  }, [])
  // Only once the draft is in the form — saving earlier would overwrite it with a blank one.
  useEffect(() => { if (hydrated && !done) saveDraft({ f, step }) }, [hydrated, f, step, done])

  const up = <K extends keyof Form>(k: K, v: Form[K]) => { setF((x) => ({ ...x, [k]: v })); if (errs[k as string]) setErrs((e) => ({ ...e, [k]: false })) }
  const txt = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => up(k, e.target.value as any)
  const tel = (k: 'whatsapp' | 'callNumber') => (e: React.ChangeEvent<HTMLInputElement>) => up(k, digits(e.target.value))
  const toggle = (k: 'vehicleTypes' | 'services', v: string) => {
    setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }))
    if (errs[k]) setErrs((e) => ({ ...e, [k]: false }))
  }
  const allVehicles = VEHICLES.every((v) => f.vehicleTypes.includes(v.key))

  // ── validation: one clear Hinglish message + red borders on what's missing ──
  const check = (s: number): { e: Record<string, boolean>; m: string } => {
    const e: Record<string, boolean> = {}
    let m = ''
    const bad = (k: string, text: string) => { e[k] = true; if (!m) m = text }
    if (s === 1) {
      if (f.garageName.trim().length < 2) bad('garageName', 'Enter the garage name')
      if (f.ownerName.trim().length < 2) bad('ownerName', 'Enter the owner name')
      if (!isPhone(f.whatsapp)) bad('whatsapp', 'Enter a valid 10-digit WhatsApp number')
      if (!isPhone(f.callNumber)) bad('callNumber', 'Enter a valid 10-digit calling number')
      if (f.address.trim().length < 6) bad('address', 'Enter the full address and locality')
      if (!f.location) bad('location', 'Set the garage location on the map')
      if (!f.photos.length) bad('photos', 'Add at least one outside photo of the garage (with the signboard)')
    }
    if (s === 2) {
      if (!f.vehicleTypes.length) bad('vehicleTypes', 'Select the vehicles they work on')
      if (!f.services.length) bad('services', 'Select at least one service')
      if (f.services.includes('other') && !f.otherWork.trim()) bad('otherWork', 'Describe the other work they do')
      if (f.emergency === null) bad('emergency', 'Night / emergency service — choose Yes or No')
      if (f.sendsMechanic === null) bad('sendsMechanic', 'Doorstep service available — choose Yes or No')
      if (f.sendsMechanic && !f.travelKm) bad('travelKm', 'Select how far they travel')
      if (!f.partsWarranty.trim()) bad('partsWarranty', 'Describe the warranty on parts (write "None" if they give none)')
    }
    if (s === 3) {
      const list = f.mechanics.filter((x) => x.name || x.phone || x.skills || x.photo || x.vehicle)
      if (f.sendsMechanic && !list.length) bad('mechanics', 'Add at least one mechanic')
      f.mechanics.forEach((x, i) => {
        if (!list.includes(x)) return
        if (x.name.trim().length < 2) bad(`m${i}.name`, `Enter the name of mechanic ${i + 1}`)
        if (!isPhone(x.phone)) bad(`m${i}.phone`, `Enter a valid 10-digit number for mechanic ${i + 1}`)
        if (!x.vehicle) bad(`m${i}.vehicle`, `Select the vehicle of mechanic ${i + 1}`)
        if (!x.skills.trim()) bad(`m${i}.skills`, `Enter what mechanic ${i + 1} is good at`)
        if (!x.photo) bad(`m${i}.photo`, `Take a photo of mechanic ${i + 1}`)
      })
    }
    if (s === 4) {
      if (f.upi.trim().length < 5) bad('upi', 'Enter the UPI ID or UPI number')
      if (!f.visit.date) bad('visit.date', 'Select the visit date')
      if (!f.visit.garageSize) bad('visit.garageSize', 'Select the garage size')
      if (f.visit.mechanicCount === '') bad('visit.mechanicCount', 'Enter how many mechanics you saw')
      if (!f.visit.rating) bad('visit.rating', 'Give your trust rating')
    }
    return { e, m }
  }
  const top = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const next = () => {
    const { e, m } = check(step)
    setErrs(e); setMsg(m)
    if (m) return
    setStep(step + 1); top()
  }
  const prev = () => { setErrs({}); setMsg(''); if (step > 1) { setStep(step - 1); top() } else router.push('/manager/garage') }

  const submit = async () => {
    for (let s = 1; s <= 4; s++) {
      const { e, m } = check(s)
      if (m) { setStep(s); setErrs(e); setMsg(m); top(); return }
    }
    setSaving(true); setMsg('')
    try {
      const mechanics = f.mechanics.filter((x) => x.name || x.phone)
      const r = await garageFieldAPI.submit({
        ...f, mechanics,
        visit: { ...f.visit, by: f.visit.by.trim() || me.name, date: new Date(`${f.visit.date}T${new Date().toTimeString().slice(0, 8)}`).toISOString() },
      })
      clearDraft()
      setDone(r.data?.data)
      top()
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Could not submit. Check your internet and try again — your details are saved on this phone.')
    } finally { setSaving(false) }
  }
  const startNew = () => { clearDraft(); setF(blank()); setStep(1); setErrs({}); setMsg(''); setDone(null); setRestored(false); top() }

  // ── success ──
  if (done) {
    return (
      <StaffShell title="Add New Garage" back="/manager/garage" nav={false}>
        <div className="flex min-h-[calc(100dvh-58px)] flex-col p-5">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]"><IcCheckCircle size={64} /></div>
            <h2 className="text-[22px] font-extrabold leading-tight text-[#13203A]">Garage Registered<br />Successfully!</h2>
            <p className="mt-2 max-w-[300px] text-[14px] text-[#64748B]">{done.garageName} has been submitted for verification.</p>
            <div className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-[#E6EBF2] bg-white p-3 text-left">
              {done.photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={`${done.photo}?tr=w-140,h-140,fo-auto`} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#E8EEF7] text-[#8A97AB]"><IcStorefront size={28} /></div>}
              <div className="min-w-0">
                <b className="block truncate text-[15px] text-[#13203A]">{done.garageName}</b>
                <p className="truncate text-[12.5px] text-[#64748B]">{[done.area, done.city].filter(Boolean).join(', ') || done.address}</p>
                <div className="mt-1 flex items-center gap-2"><StatusPill status={done.status} /><span className="text-[11.5px] font-semibold text-[#8A97AB]">{done.code}</span></div>
              </div>
            </div>
          </div>
          <div className="space-y-2.5 pb-[env(safe-area-inset-bottom)]">
            <button type="button" onClick={startNew} className="h-[52px] w-full rounded-2xl text-[16px] font-bold text-white" style={{ background: NAVY }}>Add Another Garage</button>
            <Link href="/manager/garage/visits" className="flex h-[52px] w-full items-center justify-center rounded-2xl border border-[#D9E1EC] bg-white text-[15px] font-bold text-[#13203A]">View My Submissions</Link>
          </div>
        </div>
      </StaffShell>
    )
  }

  const cur = STEPS[step - 1]
  const mErr = (i: number) => ({ name: !!errs[`m${i}.name`], phone: !!errs[`m${i}.phone`], vehicle: !!errs[`m${i}.vehicle`], skills: !!errs[`m${i}.skills`], photo: !!errs[`m${i}.photo`] })
  const setVisit = (k: keyof Form['visit'], v: any) => { setF((x) => ({ ...x, visit: { ...x.visit, [k]: v } })); if (errs[`visit.${k}`]) setErrs((e) => ({ ...e, [`visit.${k}`]: false })) }
  const setRate = (k: keyof Form['rates']) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, rates: { ...x.rates, [k]: digits(e.target.value, 6) } }))

  return (
    <StaffShell title="Add New Garage" back={prev} nav={false} right={<span className="pr-1 text-[13px] font-bold text-[#8A97AB]">{step}/4</span>}>
      {picking && (
        <LocationSheet value={f.location} onClose={() => setPicking(false)} onPick={(p, place) => {
          setF((x) => ({ ...x, location: p, area: place.area || x.area, city: place.city || x.city, pincode: place.pincode || x.pincode, address: x.address.trim() ? x.address : (place.line || '') }))
          setErrs((e) => ({ ...e, location: false })); setPicking(false)
        }} />
      )}

      {/* stepper */}
      <div className="border-b border-[#E6EBF2] bg-white px-4 pb-3 pt-4">
        <div className="flex items-start">
          {STEPS.map((s, i) => {
            const state = s.n < step ? 'done' : s.n === step ? 'on' : 'todo'
            return (
              <div key={s.n} className="relative flex flex-1 flex-col items-center">
                {i > 0 && <span className="absolute right-1/2 top-[14px] h-[2px] w-full" style={{ background: s.n <= step ? ORANGE : '#D9E1EC' }} />}
                <button type="button" disabled={s.n >= step} onClick={() => { setErrs({}); setMsg(''); setStep(s.n) }}
                  className="relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 text-[13px] font-bold"
                  style={state === 'on' ? { background: ORANGE, borderColor: ORANGE, color: '#fff' } : state === 'done' ? { background: '#fff', borderColor: ORANGE, color: ORANGE } : { background: '#EEF2F8', borderColor: '#D9E1EC', color: '#8A97AB' }}>
                  {state === 'done' ? <IcCheck size={17} /> : s.n}
                </button>
                <span className="mt-1.5 whitespace-pre-line text-center text-[11px] font-semibold leading-tight" style={{ color: state === 'todo' ? '#8A97AB' : state === 'on' ? ORANGE : '#334155' }}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-5 p-4 pb-[120px]">
        <div className="flex items-center gap-3 rounded-2xl bg-[#EEF3FB] p-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[22px] font-extrabold text-white" style={{ background: ORANGE }}>{cur.n}</span>
          <div className="min-w-0">
            <h2 className="text-[18px] font-extrabold leading-tight" style={{ color: NAVY }}>{cur.title}</h2>
            <p className="text-[12.5px] text-[#475569]">{cur.sub}</p>
          </div>
        </div>

        {restored && step === 1 && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2.5 text-[12.5px] font-semibold text-[#1E40AF]">
            Your unfinished entry has been restored.
            <button type="button" onClick={startNew} className="shrink-0 font-bold underline">Start a new one</button>
          </div>
        )}

        {/* ───────────── Step 1 ───────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <label className="block"><Label req>Garage name</Label>
              <Field icon={<IcStorefront size={20} />} error={errs.garageName}><input className={inp} value={f.garageName} onChange={txt('garageName')} placeholder="e.g. Sharma Auto Garage" maxLength={120} /></Field>
            </label>
            <label className="block"><Label req>Owner name</Label>
              <Field icon={<IcPerson size={20} />} error={errs.ownerName}><input className={inp} value={f.ownerName} onChange={txt('ownerName')} placeholder="e.g. Rajesh Sharma" maxLength={80} /></Field>
            </label>
            <label className="block"><Label req>WhatsApp number (leads are sent here)</Label>
              <Field icon={<span className="text-[#16A34A]"><IcChat size={20} /></span>} prefix="+91" error={errs.whatsapp}><input className={inp} value={f.whatsapp} onChange={tel('whatsapp')} inputMode="numeric" placeholder="Enter WhatsApp number" /></Field>
            </label>
            <div>
              <div className="flex items-end justify-between">
                <Label req>Calling number</Label>
                {isPhone(f.whatsapp) && f.callNumber !== f.whatsapp && <button type="button" onClick={() => up('callNumber', f.whatsapp)} className="mb-1.5 text-[12.5px] font-bold underline" style={{ color: NAVY }}>Same as WhatsApp</button>}
              </div>
              <Field icon={<IcCall size={20} />} prefix="+91" error={errs.callNumber}><input className={inp} value={f.callNumber} onChange={tel('callNumber')} inputMode="numeric" placeholder="Enter alternate number" aria-label="Calling number" /></Field>
            </div>
            <label className="block"><Label req>Full address and locality</Label>
              <Field icon={<IcLocationOn size={20} />} error={errs.address}><textarea className={`${inp} min-h-[72px] resize-none py-3`} value={f.address} onChange={txt('address')} placeholder="House/Shop no., Area, Landmark, City" maxLength={400} /></Field>
            </label>

            <div>
              <Label req>Google Maps location</Label>
              <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: errs.location ? '#F87171' : '#D9E1EC' }}>
                {f.location && <GarageMap pins={[{ id: 'g', lat: f.location.lat, lng: f.location.lng, color: ORANGE }]} interactive={false} zoomControl={false} className="h-[130px] w-full" />}
                <div className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <b className="block text-[13.5px]" style={{ color: NAVY }}>{f.location ? 'Location set ✓' : 'Share live location'}</b>
                    <p className="text-[12px] leading-snug text-[#64748B]">{f.location ? `${f.location.lat.toFixed(5)}, ${f.location.lng.toFixed(5)}${f.area ? ` · ${f.area}` : ''}` : 'Stand at the garage and select the exact location (for 10 km routing)'}</p>
                  </div>
                  <button type="button" onClick={() => setPicking(true)} className="h-10 shrink-0 rounded-xl px-3.5 text-[13px] font-bold text-white" style={{ background: ORANGE }}>{f.location ? 'Change' : 'Select on Map'}</button>
                </div>
              </div>
            </div>

            <div>
              <Label req>Outside photo of the garage (with the signboard)</Label>
              <GaragePhotos photos={f.photos} onChange={(p) => up('photos', p)} error={errs.photos} />
            </div>
          </div>
        )}

        {/* ───────────── Step 2 ───────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label req>Which vehicles do they work on?</Label>
              <div className="grid grid-cols-4 gap-2">
                {VEHICLES.map((v) => {
                  const on = f.vehicleTypes.includes(v.key)
                  return (
                    <button key={v.key} type="button" onClick={() => toggle('vehicleTypes', v.key)} className="flex h-[76px] flex-col items-center justify-center gap-1 rounded-xl border-2 bg-white text-[12.5px] font-bold"
                      style={on ? { borderColor: ORANGE, color: NAVY, background: '#FFF4EE' } : { borderColor: errs.vehicleTypes ? '#F87171' : '#E1E7F0', color: '#475569' }}>
                      <v.Icon size={28} />{v.label}
                    </button>
                  )
                })}
              </div>
              <button type="button" onClick={() => up('vehicleTypes', allVehicles ? [] : VEHICLES.map((v) => v.key))} className="mt-2 flex h-11 w-full items-center gap-2.5 rounded-xl border border-[#E1E7F0] bg-white px-3 text-left text-[13.5px] text-[#13203A]">
                <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 text-white" style={allVehicles ? { background: ORANGE, borderColor: ORANGE } : { borderColor: '#B6C2D4' }}>{allVehicles && <IcCheck size={15} />}</span>
                <b>All</b> (Bike + Scooter + Car + Truck)
              </button>
            </div>

            <div>
              <Label req>Which services do they offer? (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICES.map((s) => {
                  const on = f.services.includes(s.key)
                  return (
                    <button key={s.key} type="button" onClick={() => toggle('services', s.key)} className="flex min-h-[46px] items-center gap-2 rounded-xl border bg-white px-2.5 py-2 text-left text-[12.5px] font-semibold leading-tight"
                      style={on ? { borderColor: ORANGE, background: '#FFF4EE', color: '#13203A' } : { borderColor: errs.services ? '#F87171' : '#E1E7F0', color: '#334155' }}>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-white" style={on ? { background: ORANGE, borderColor: ORANGE } : { borderColor: '#B6C2D4' }}>{on && <IcCheck size={15} />}</span>
                      <span className="shrink-0" style={{ color: NAVY }}><s.Icon size={19} /></span>
                      {s.label}
                    </button>
                  )
                })}
              </div>
              {f.services.includes('other') && (
                <div className="mt-2"><Field error={errs.otherWork}><input className={`${inp} h-[50px]`} value={f.otherWork} onChange={txt('otherWork')} placeholder="Other work — what else do they do?" maxLength={200} aria-label="Other work" /></Field></div>
              )}
            </div>

            <div>
              <Label req>Working hours</Label>
              <div className="grid grid-cols-2 gap-2.5">
                {([['openTime', 'Opens at', <span key="s" className="text-[#F59E0B]"><IcWbSunny size={24} /></span>], ['closeTime', 'Closes at', <span key="m" style={{ color: NAVY }}><IcNightsStay size={24} /></span>]] as const).map(([k, label, icon]) => (
                  <label key={k} className="relative flex items-center gap-2.5 rounded-xl border border-[#E1E7F0] bg-white px-3 py-2.5">
                    {icon}
                    <span className="min-w-0"><span className="block text-[11.5px] font-semibold text-[#64748B]">{label}</span><b className="text-[14.5px] text-[#13203A]">{time12(f[k])}</b></span>
                    <input type="time" value={f[k]} onChange={txt(k)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={label} />
                  </label>
                ))}
              </div>
            </div>

            <label className="block"><Label>Weekly off day</Label>
              <Field icon={<IcEvent size={20} />}>
                <select className={`${inp} h-[50px]`} value={f.weeklyOff} onChange={txt('weeklyOff')}>{DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}</select>
              </Field>
            </label>

            <div className="space-y-3 rounded-2xl border border-[#E6EBF2] bg-white p-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] font-semibold" style={{ color: errs.emergency ? '#DC2626' : '#13203A' }}>Night or emergency service?<Req /></span>
                <YesNo value={f.emergency} onChange={(v) => up('emergency', v)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] font-semibold" style={{ color: errs.sendsMechanic ? '#DC2626' : '#13203A' }}>Doorstep service available?<Req /><span className="block text-[11.5px] font-medium text-[#64748B]">Do they send a mechanic to the customer&apos;s home or breakdown spot?</span></span>
                <YesNo value={f.sendsMechanic} onChange={(v) => up('sendsMechanic', v)} />
              </div>
              {f.sendsMechanic && (
                <label className="block"><Label req>How far do they go for doorstep service?</Label>
                  <Field icon={<IcLocationOn size={20} />} error={errs.travelKm}>
                    <select className={`${inp} h-[50px]`} value={f.travelKm} onChange={txt('travelKm')}>
                      <option value="">Select distance</option>
                      {DISTANCES.map((d) => <option key={d} value={d}>Up to {d} km</option>)}
                    </select>
                  </Field>
                </label>
              )}
              <label className="block"><Label req>What warranty do they give on parts?</Label>
                <Field error={errs.partsWarranty}><textarea className={`${inp} min-h-[64px] resize-none py-3`} value={f.partsWarranty} onChange={txt('partsWarranty')} placeholder="In their own words — e.g. 1 month warranty on batteries" maxLength={200} /></Field>
              </label>
            </div>
          </div>
        )}

        {/* ───────────── Step 3 ───────────── */}
        {step === 3 && (
          <div className="space-y-3.5">
            <div className="flex gap-3 rounded-2xl border border-[#FED7C3] bg-[#FFF4EE] p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white" style={{ color: ORANGE }}><IcPhotoCamera size={22} /></span>
              <div>
                <b className="block text-[13.5px]" style={{ color: '#C2410C' }}>Take each mechanic's photo in person.</b>
                <p className="text-[12px] leading-snug text-[#7C2D12]">This photo is sent to the customer so they can recognise the mechanic.</p>
              </div>
            </div>
            {!f.sendsMechanic && <p className="rounded-xl bg-[#F1F5F9] px-3 py-2.5 text-[12.5px] font-semibold text-[#475569]">This garage has no doorstep service (workshop only), so mechanic details are optional. You can go straight to the next step.</p>}
            {f.mechanics.map((m, i) => (
              <MechanicCard key={i} i={i} m={m} errs={mErr(i)}
                onChange={(nm) => { setF((x) => ({ ...x, mechanics: x.mechanics.map((y, j) => (j === i ? nm : y)) })); setErrs((e) => { const n = { ...e }; Object.keys(n).forEach((k) => k.startsWith(`m${i}.`) && delete n[k]); return n }) }}
                onRemove={f.mechanics.length > 1 || !f.sendsMechanic ? () => { setF((x) => ({ ...x, mechanics: x.mechanics.filter((_, j) => j !== i) })); setErrs({}) } : undefined} />
            ))}
            <button type="button" onClick={() => setF((x) => ({ ...x, mechanics: [...x.mechanics, blankMech()] }))} disabled={f.mechanics.length >= 30}
              className="w-full rounded-2xl border-2 border-dashed border-[#C7D2E3] bg-white px-3 py-3.5 text-center" style={{ color: NAVY }}>
              <b className="flex items-center justify-center gap-1.5 text-[14.5px]"><IcAdd size={20} /> Add Another Mechanic</b>
              <span className="text-[12px] text-[#64748B]">You can add as many mechanics as you like</span>
            </button>
          </div>
        )}

        {/* ───────────── Step 4 ───────────── */}
        {step === 4 && (
          <div className="space-y-6">
            <Section icon={<IcPayments size={19} />} title="Payment Details (Required)">
              <label className="block"><Label req>UPI ID or UPI number</Label>
                <Field icon={<b className="text-[11px] italic" style={{ color: '#F97316' }}>UPI</b>} error={errs.upi}><input className={inp} value={f.upi} onChange={txt('upi')} placeholder="e.g. rajesh123@upi / 9876543210" maxLength={80} autoCapitalize="none" /></Field>
              </label>
            </Section>

            <Section icon={<IcDescription size={19} />} title="Optional Details (If possible)">
              <div>
                {idUp.input}
                <Label>Any one owner ID (Aadhaar or Driving Licence)</Label>
                <button type="button" onClick={idUp.pick} disabled={idUp.busy} className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-[#C7D2E3] bg-white p-3 text-left">
                  {f.ownerIdPhoto
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={`${f.ownerIdPhoto}?tr=w-120,h-120,fo-auto`} alt="Owner ID" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EEF3FB]" style={{ color: NAVY }}>{idUp.busy ? <Spinner /> : <IcBadge size={24} />}</span>}
                  <span className="min-w-0 flex-1"><b className="block text-[13.5px]" style={{ color: NAVY }}>{f.ownerIdPhoto ? 'ID photo added ✓ (tap to change)' : idUp.busy ? 'Uploading…' : 'Upload ID Photo'}</b><span className="text-[11.5px] text-[#64748B]">Kept internal only — never shared</span></span>
                </button>
                {f.ownerIdPhoto && <button type="button" onClick={() => up('ownerIdPhoto', '')} className="mt-1 text-[12.5px] font-bold text-[#DC2626]">Remove ID photo</button>}
                {idUp.err && <p className="mt-1 text-[12.5px] font-semibold text-[#DC2626]">{idUp.err}</p>}
              </div>
              <label className="block"><Label>How many years has the garage been running?</Label>
                <Field icon={<IcEvent size={20} />}><input className={inp} value={f.yearsRunning} onChange={(e) => up('yearsRunning', digits(e.target.value, 2))} inputMode="numeric" placeholder="e.g. 5" /></Field>
              </label>
              <div>
                <Label>Usual rate (Approx.)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {([['puncture', 'Puncture', '100'], ['battery', 'Battery Jump-start', '300'], ['service', 'General Service', '500'], ['visit', 'Visit Charge', '200']] as const).map(([k, l, ph]) => (
                    <label key={k} className="block rounded-xl border border-[#E1E7F0] bg-white px-2 py-2">
                      <span className="block h-[26px] text-[10.5px] font-semibold leading-tight text-[#64748B]">{l}</span>
                      <span className="flex items-center text-[14.5px] font-bold text-[#13203A]">₹<input className="ml-0.5 w-full min-w-0 bg-transparent outline-none placeholder:font-semibold placeholder:text-[#B6C2D4]" value={f.rates[k]} onChange={setRate(k)} inputMode="numeric" placeholder={ph} aria-label={l} /></span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="block"><Label>GST number or shop registration</Label>
                <Field icon={<IcDescription size={20} />}><input className={inp} value={f.gst} onChange={txt('gst')} placeholder="e.g. 22AAAAA0000A1Z5" maxLength={40} autoCapitalize="characters" /></Field>
              </label>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] font-semibold text-[#13203A]">Does the garage have its own bike / vehicle to send a mechanic?</span>
                <YesNo value={f.hasOwnVehicle} onChange={(v) => up('hasOwnVehicle', v)} />
              </div>
            </Section>

            <Section icon={<IcNotes size={19} />} title="Your Visit Details (Internal Use)">
              <div className="grid grid-cols-2 items-end gap-2.5">
                <label className="block"><Label req>Visit date</Label>
                  <Field error={errs['visit.date']}><input type="date" className={`${inp} h-[50px]`} value={f.visit.date} max={today()} onChange={(e) => setVisit('date', e.target.value)} /></Field>
                </label>
                <label className="block"><Label req>Visited by</Label>
                  <Field error={errs['visit.by']}><input className={`${inp} h-[50px]`} value={f.visit.by} onChange={(e) => setVisit('by', e.target.value)} placeholder={me.name} maxLength={80} /></Field>
                </label>
                <label className="block"><Label req>Garage size</Label>
                  <Field error={errs['visit.garageSize']}>
                    <select className={`${inp} h-[50px]`} value={f.visit.garageSize} onChange={(e) => setVisit('garageSize', e.target.value)}>
                      <option value="">Select size</option>{SIZES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </Field>
                </label>
                <label className="block"><Label req>Mechanics seen</Label>
                  <Field error={errs['visit.mechanicCount']}><input className={`${inp} h-[50px]`} value={f.visit.mechanicCount} onChange={(e) => setVisit('mechanicCount', digits(e.target.value, 3))} inputMode="numeric" placeholder="e.g. 3" /></Field>
                </label>
              </div>
              <div>
                <Label req>Your opinion — did it seem trustworthy?</Label>
                <div className="flex items-center gap-1" style={{ color: errs['visit.rating'] ? '#F87171' : '#F59E0B' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setVisit('rating', n)} aria-label={`${n} star`} className="p-0.5">{n <= f.visit.rating ? <IcStar size={34} /> : <IcStarBorder size={34} />}</button>
                  ))}
                  <b className="ml-2 text-[15px] text-[#13203A]">{f.visit.rating || '–'} / 5</b>
                </div>
              </div>
              <label className="block"><Label>What did the owner say about the offer?</Label>
                <Field><textarea className={`${inp} min-h-[64px] resize-none py-3`} value={f.visit.offerNote} onChange={(e) => setVisit('offerNote', e.target.value)} placeholder="The owner's response to the offer / partnership" maxLength={500} /></Field>
              </label>
              <label className="block"><Label>Notes</Label>
                <Field><textarea className={`${inp} min-h-[64px] resize-none py-3`} value={f.visit.notes} onChange={(e) => setVisit('notes', e.target.value)} placeholder="Write notes… Any conditions from the owner?" maxLength={1000} /></Field>
              </label>
            </Section>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-[#E6EBF2] bg-white px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5">
        {msg && <p role="alert" className="mb-2 rounded-lg bg-[#FEF2F2] px-3 py-2 text-[13px] font-semibold text-[#B91C1C]">{msg}</p>}
        <div className="flex gap-2.5">
          {step > 1 && (
            <button type="button" onClick={prev} disabled={saving} className="flex h-[52px] w-[108px] shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-[#EEF2F8] text-[15px] font-bold" style={{ color: NAVY }}><IcArrowBack size={19} /> Back</button>
          )}
          {step < 4 ? (
            <button type="button" onClick={next} className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl text-[16px] font-bold text-white active:opacity-90" style={{ background: ORANGE }}>Save &amp; Next <IcArrowForward size={20} /></button>
          ) : (
            <button type="button" onClick={submit} disabled={saving} className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl text-[15.5px] font-bold text-white active:opacity-90 disabled:opacity-70" style={{ background: ORANGE }}>
              {saving ? <><Spinner /> Submitting…</> : <>Submit Garage Details <IcArrowForward size={20} /></>}
            </button>
          )}
        </div>
      </div>
    </StaffShell>
  )
}
