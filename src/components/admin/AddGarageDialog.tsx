'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, Navigation, Plus, Save, Search, X, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { adminGarageAPI, uploadAPI } from '@/services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { GarageMap, type LatLng } from '@/components/manager/GarageMap'
import { DAYS, DISTANCES, SERVICES, VEHICLES, mapsLink } from '@/components/manager/garageOptions'

// Admin → Garage Partners → Add Garage: the office adds a garage itself (found on
// Google Maps, over the phone…) instead of a field executive registering it at a
// visit. Its place is picked on the map, or pasted as "lat, long" or a Google Maps
// link. "Visited in person" starts at No — that is how the team can tell a garage
// we added from one somebody has been to.
// The same dialog edits a garage (given `garage`): every field is filled in from it,
// and saving changes it (PUT) instead of adding a new one. Its status is not changed
// here — that stays with the Verify / Inactive / Pending buttons of the details.
const ORANGE = '#FF5A1F'
const inp = 'h-10 w-full rounded-lg border border-[#DDE4EC] bg-white px-3 text-[13.5px] text-[#13203A] outline-none focus:border-[#1B3B6F]'
const digits = (v: string) => v.replace(/\D/g, '').slice(0, 10)
const isPhone = (p: string) => /^[6-9]\d{9}$/.test(p)

type Form = {
  garageName: string; ownerName: string; whatsapp: string; callNumber: string
  address: string; area: string; city: string; pincode: string
  location: LatLng | null; mapUrl: string; photos: string[]
  vehicleTypes: string[]; services: string[]; otherWork: string
  openTime: string; closeTime: string; weeklyOff: string
  emergency: boolean; sendsMechanic: boolean; travelKm: string
  upi: string; partsWarranty: string; gst: string
  visited: boolean; status: 'pending' | 'active'; adminNote: string
}
const blank = (): Form => ({
  garageName: '', ownerName: '', whatsapp: '', callNumber: '', address: '', area: '', city: '', pincode: '',
  location: null, mapUrl: '', photos: [],
  vehicleTypes: [], services: [], otherWork: '', openTime: '09:00', closeTime: '21:00', weeklyOff: 'none',
  emergency: false, sendsMechanic: false, travelKm: '', upi: '', partsWarranty: '', gst: '',
  visited: false, status: 'pending', adminNote: '',
})
const s = (v: any) => (v == null ? '' : String(v))
/** an existing garage → the form (for Edit) */
const fromGarage = (g: any): Form => ({
  garageName: s(g.garageName), ownerName: s(g.ownerName), whatsapp: s(g.whatsapp), callNumber: s(g.callNumber),
  address: s(g.address), area: s(g.area), city: s(g.city), pincode: s(g.pincode),
  location: g.location?.lat != null && g.location?.lng != null ? { lat: Number(g.location.lat), lng: Number(g.location.lng) } : null,
  mapUrl: s(g.mapUrl), photos: Array.isArray(g.photos) ? g.photos.filter(Boolean) : [],
  vehicleTypes: Array.isArray(g.vehicleTypes) ? g.vehicleTypes : [], services: Array.isArray(g.services) ? g.services : [], otherWork: s(g.otherWork),
  openTime: g.openTime || '09:00', closeTime: g.closeTime || '21:00', weeklyOff: g.weeklyOff || 'none',
  emergency: !!g.emergency, sendsMechanic: !!g.sendsMechanic, travelKm: s(g.travelKm),
  upi: s(g.upi), partsWarranty: s(g.partsWarranty), gst: s(g.gst),
  visited: g.visited !== false, status: g.status === 'active' ? 'active' : 'pending', adminNote: s(g.adminNote),
})

/** the address at a point (OpenStreetMap) — a bonus, the pin is what matters */
async function addressAt(p: LatLng) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 6000)
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${p.lat}&lon=${p.lng}&zoom=17&addressdetails=1&accept-language=en`, { signal: ctrl.signal })
    clearTimeout(t)
    const a = (await r.json())?.address || {}
    return {
      area: a.suburb || a.neighbourhood || a.village || a.hamlet || a.town || a.road || '',
      city: a.city || a.town || a.county || a.state_district || '',
      pincode: /^\d{6}$/.test(a.postcode || '') ? a.postcode : '',
      line: [a.road, a.suburb || a.neighbourhood || a.village, a.city || a.town || a.county, a.state, a.postcode].filter(Boolean).join(', '),
    }
  } catch { return null }
}

const L = ({ t, req, children }: { t: string; req?: boolean; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1 block text-[12.5px] font-semibold text-[#475569]">{t}{req && <b className="ml-0.5 text-[#E11D48]">*</b>}</span>
    {children}
  </label>
)
const YesNo = ({ value, onChange, name }: { value: boolean; onChange: (v: boolean) => void; name: string }) => (
  <div className="inline-flex overflow-hidden rounded-lg border border-[#DDE4EC] bg-white" data-yesno={name}>
    {[true, false].map((v) => (
      <button key={String(v)} type="button" data-value={v ? 'yes' : 'no'} onClick={() => onChange(v)} className="h-9 min-w-[64px] px-3 text-[13px] font-bold" style={value === v ? { background: ORANGE, color: '#fff' } : { color: '#475569' }}>{v ? 'Yes' : 'No'}</button>
    ))}
  </div>
)
const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} className="h-8 rounded-full border px-3 text-[12.5px] font-semibold" style={on ? { borderColor: ORANGE, background: '#FFF1EB', color: '#C2410C' } : { borderColor: '#DDE4EC', color: '#334155', background: '#fff' }}>{children}</button>
)

export function AddGarageDialog({ open, onClose, onCreated, garage }: { open: boolean; onClose: () => void; onCreated: (g: any) => void; garage?: any | null }) {
  const editing = !!garage?._id
  const [f, setF] = useState<Form>(blank)
  const [paste, setPaste] = useState('')
  const [finding, setFinding] = useState(false)
  const [where, setWhere] = useState('') // what the last location came from / a warning about it
  const [filling, setFilling] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    setF(garage?._id ? fromGarage(garage) : blank())
    setPaste(garage?._id ? s(garage.mapUrl) : '')
    setWhere(garage?._id && garage.location?.lat != null ? 'The saved location' : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, garage?._id])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))
  const txt = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as any)
  const toggle = (k: 'vehicleTypes' | 'services', v: string) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }))

  // the address fields from the pin, only where they are still empty (or all of them when asked)
  const fillFrom = async (p: LatLng, all = false) => {
    setFilling(true)
    const a = await addressAt(p)
    setFilling(false)
    if (!a) { if (all) toast.error('Could not find the address for this pin — type it in'); return }
    setF((x) => ({
      ...x,
      area: all || !x.area.trim() ? a.area || x.area : x.area,
      city: all || !x.city.trim() ? a.city || x.city : x.city,
      pincode: all || !x.pincode.trim() ? a.pincode || x.pincode : x.pincode,
      address: all || !x.address.trim() ? a.line || x.address : x.address,
    }))
  }

  const pinAt = (p: LatLng, note: string) => {
    setF((x) => ({ ...x, location: p }))
    setWhere(note)
    if (!f.address.trim() || !f.city.trim()) fillFrom(p)
  }

  const find = async () => {
    if (!paste.trim()) return toast.error('Paste the latitude, longitude or a Google Maps link')
    setFinding(true)
    try {
      const r = await adminGarageAPI.locate(paste.trim())
      const d = r.data?.data
      if (d?.lat == null) throw new Error('none')
      set('mapUrl', d.url || '')
      pinAt({ lat: d.lat, lng: d.lng }, d.note || (d.how === 'coordinates' ? 'From the latitude, longitude you pasted' : d.exact ? 'From the Google Maps link (the place pin)' : 'From the Google Maps link — this is the middle of the map that was on screen, check the pin'))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not read this location')
    } finally { setFinding(false) }
  }

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please choose a photo')
    setUploading(true)
    try {
      const r = await uploadAPI.uploadImage(file, 'garage-photos')
      const url = r.data?.data?.url
      if (!url) throw new Error('no url')
      setF((x) => ({ ...x, photos: [...x.photos, url].slice(0, 6) }))
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Photo upload failed') } finally { setUploading(false) }
  }

  const check = () => {
    if (f.garageName.trim().length < 2) return 'Enter the garage name'
    if (f.ownerName.trim().length < 2) return 'Enter the owner name'
    if (!isPhone(f.whatsapp)) return 'Enter a valid 10-digit WhatsApp number'
    if (f.callNumber && !isPhone(f.callNumber)) return 'The calling number must be a valid 10-digit number (or leave it empty)'
    // (an older garage that never had a pin can still be edited without one)
    if (!f.location && (!editing || garage?.location?.lat != null)) return 'Set the location: tap the map, or paste the latitude, longitude or a Google Maps link and press Find'
    if (f.address.trim().length < 6) return 'Enter the address'
    if (!f.vehicleTypes.length) return 'Select at least one vehicle type'
    if (!f.services.length) return 'Select at least one service'
    if (f.services.includes('other') && !f.otherWork.trim()) return 'Describe the other work they do'
    return ''
  }

  const save = async (force = false) => {
    const m = check()
    if (m) return toast.error(m)
    setSaving(true)
    try {
      const payload: any = { ...f, travelKm: f.sendsMechanic ? f.travelKm : '', force }
      let r
      if (editing) {
        delete payload.status // the status has its own buttons (verify = verifiedAt / verifiedBy)
        r = await adminGarageAPI.update(garage._id, payload)
      } else {
        r = await adminGarageAPI.create(payload)
      }
      toast.success(editing ? 'Garage updated' : r.data?.message || 'Garage added')
      onCreated(r.data?.data)
    } catch (e: any) {
      const d = e?.response?.data
      if (e?.response?.status === 409 && d?.duplicate && !force) {
        setSaving(false)
        if (window.confirm(`${d.message}.\n\n${editing ? 'Save it anyway?' : 'Add this garage anyway?'}`)) return save(true)
        return
      }
      toast.error(d?.message || 'Could not add the garage')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-h-[94vh] max-w-[860px] overflow-y-auto" data-add-garage-dialog data-garage-form={editing ? 'edit' : 'add'}>
        <DialogHeader>
          <DialogTitle className="text-[19px]">{editing ? `Edit Garage · ${garage.code || ''}` : 'Add Garage'}</DialogTitle>
          <DialogDescription>{editing
            ? 'Change any detail and press Save Changes. Mechanics, rates and the field visit notes stay as they are; the status is changed with the buttons on the garage.'
            : 'Add a garage from the office — found on Google Maps, over the phone or from a reference. Field executives keep registering garages from /manager/garage as before.'}</DialogDescription>
        </DialogHeader>
        {editing && garage.shopPartner && (
          <p className="rounded-lg bg-[#FFF7E6] px-3 py-2 text-[12.5px] text-[#92400E]" data-partner-note>This garage is also a Shop Partner (it has been given a job). Saving here changes the garage record; its Shop Partner profile is edited on the Shop Partners page.</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <L t="Garage name" req><input className={inp} value={f.garageName} onChange={txt('garageName')} maxLength={120} placeholder="e.g. Ram Auto Garage" data-f="garageName" /></L>
          <L t="Owner name" req><input className={inp} value={f.ownerName} onChange={txt('ownerName')} maxLength={80} placeholder="e.g. Ramesh Yadav" data-f="ownerName" /></L>
          <L t="WhatsApp number (gets the leads)" req><input className={inp} value={f.whatsapp} onChange={(e) => set('whatsapp', digits(e.target.value))} inputMode="numeric" placeholder="10-digit number" data-f="whatsapp" /></L>
          <L t="Calling number"><input className={inp} value={f.callNumber} onChange={(e) => set('callNumber', digits(e.target.value))} inputMode="numeric" placeholder="10-digit number (optional)" data-f="callNumber" /></L>
        </div>

        {/* where it is */}
        <div className="rounded-xl border border-[#E7ECF3] p-3">
          <b className="mb-2 flex items-center gap-1.5 text-[14px] text-[#13203A]"><MapPin className="h-4 w-4 text-[#FF5A1F]" />Location<b className="text-[#E11D48]">*</b></b>
          <div className="flex gap-2">
            <input className={inp} value={paste} onChange={(e) => setPaste(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); find() } }}
              placeholder="Paste latitude, longitude (26.7409, 83.8901) or a Google Maps link" data-locate-input />
            <button type="button" onClick={find} disabled={finding} className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-4 text-[13.5px] font-bold text-white disabled:opacity-60" style={{ background: '#1B3B6F' }} data-locate-btn>
              {finding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Find
            </button>
          </div>
          <p className="mt-1.5 text-[12px] text-[#64748B]">…or tap the map to drop the pin on the garage, and drag it to move it.</p>
          <div className="relative mt-2 h-[280px] overflow-hidden rounded-lg border border-[#E7ECF3]">
            <GarageMap picker={{ value: f.location, onChange: (p) => pinAt(p, 'Picked on the map') }} className="h-full w-full" />
          </div>
          {f.location && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#475569]" data-location-set>
              <b className="text-[#13203A]">{f.location.lat.toFixed(6)}, {f.location.lng.toFixed(6)}</b>
              {where && <span>· {where}</span>}
              <a href={mapsLink(f.location)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#1B3B6F] underline"><Navigation className="h-3.5 w-3.5" />Check in Google Maps</a>
              <button type="button" onClick={() => f.location && fillFrom(f.location, true)} disabled={filling} className="font-semibold text-[#2563EB] hover:underline disabled:opacity-60">{filling ? 'Finding the address…' : 'Fill the address from the pin'}</button>
              <button type="button" onClick={() => { set('location', null); set('mapUrl', ''); setWhere('') }} className="font-semibold text-[#B91C1C] hover:underline">Remove pin</button>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><L t="Full address" req><input className={inp} value={f.address} onChange={txt('address')} maxLength={400} placeholder="Shop, road, locality" data-f="address" /></L></div>
          <L t="Area / locality"><input className={inp} value={f.area} onChange={txt('area')} maxLength={80} data-f="area" /></L>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <L t="City"><input className={inp} value={f.city} onChange={txt('city')} maxLength={80} data-f="city" /></L>
            <L t="Pincode"><input className={inp} value={f.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" data-f="pincode" /></L>
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-[12.5px] font-semibold text-[#475569]">Vehicles they work on<b className="ml-0.5 text-[#E11D48]">*</b></span>
          <div className="flex flex-wrap gap-1.5" data-vehicles>{VEHICLES.map((v) => <Chip key={v.key} on={f.vehicleTypes.includes(v.key)} onClick={() => toggle('vehicleTypes', v.key)}>{v.label}</Chip>)}</div>
        </div>
        <div>
          <span className="mb-1.5 block text-[12.5px] font-semibold text-[#475569]">Services<b className="ml-0.5 text-[#E11D48]">*</b></span>
          <div className="flex flex-wrap gap-1.5" data-services>{SERVICES.map((s) => <Chip key={s.key} on={f.services.includes(s.key)} onClick={() => toggle('services', s.key)}>{s.label}</Chip>)}</div>
          {f.services.includes('other') && <input className={`${inp} mt-2`} value={f.otherWork} onChange={txt('otherWork')} maxLength={200} placeholder="What other work do they do?" />}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <L t="Opens at"><input type="time" className={inp} value={f.openTime} onChange={txt('openTime')} /></L>
          <L t="Closes at"><input type="time" className={inp} value={f.closeTime} onChange={txt('closeTime')} /></L>
          <L t="Weekly off"><select className={inp} value={f.weeklyOff} onChange={txt('weeklyOff')}>{DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}</select></L>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-[12.5px] font-semibold text-[#475569]">Doorstep service (sends a mechanic to the customer)</span>
            <div className="flex flex-wrap items-center gap-2">
              <YesNo name="sendsMechanic" value={f.sendsMechanic} onChange={(v) => set('sendsMechanic', v)} />
              {f.sendsMechanic && <select className={`${inp} w-[150px]`} value={f.travelKm} onChange={txt('travelKm')}><option value="">Up to how far?</option>{DISTANCES.map((d) => <option key={d} value={d}>Up to {d} km</option>)}</select>}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-[12.5px] font-semibold text-[#475569]">Night / emergency calls</span>
            <YesNo name="emergency" value={f.emergency} onChange={(v) => set('emergency', v)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <L t="UPI ID / number"><input className={inp} value={f.upi} onChange={txt('upi')} maxLength={80} placeholder="optional" data-f="upi" /></L>
          <L t="Warranty on parts"><input className={inp} value={f.partsWarranty} onChange={txt('partsWarranty')} maxLength={200} placeholder="optional" data-f="partsWarranty" /></L>
          <L t="GST / registration"><input className={inp} value={f.gst} onChange={txt('gst')} maxLength={40} placeholder="optional" data-f="gst" /></L>
        </div>

        <div>
          <span className="mb-1.5 block text-[12.5px] font-semibold text-[#475569]">Photos (optional)</span>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} />
          <div className="flex flex-wrap gap-2">
            {f.photos.map((p) => (
              <div key={p} className="relative h-[72px] w-[100px] overflow-hidden rounded-lg bg-[#EEF2F7]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${p}?tr=w-200,h-144,fo-auto`} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => set('photos', f.photos.filter((x) => x !== p))} aria-label="Remove photo" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {f.photos.length < 6 && (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex h-[72px] w-[100px] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#C7D2E3] text-[12px] font-bold text-[#1B3B6F] disabled:opacity-60">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}{uploading ? 'Uploading…' : 'Add photo'}
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 rounded-xl bg-[#F6F8FB] p-3 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-[12.5px] font-semibold text-[#475569]">Visited in person?</span>
            <YesNo name="visited" value={f.visited} onChange={(v) => set('visited', v)} />
            <p className="mt-1 text-[11.5px] text-[#64748B]">{f.visited ? 'Yes — somebody of ours has been to this garage.' : 'No — added by the office (e.g. from Google Maps), nobody has visited it yet.'}</p>
          </div>
          {!editing && (
            <div>
              <span className="mb-1 block text-[12.5px] font-semibold text-[#475569]">Status</span>
              <select className={`${inp} w-[220px]`} value={f.status} onChange={(e) => set('status', e.target.value as Form['status'])} data-f="status">
                <option value="pending">Pending verification</option>
                <option value="active">Active (verified now)</option>
              </select>
            </div>
          )}
          <div className="sm:col-span-2"><L t="Admin note"><textarea value={f.adminNote} onChange={txt('adminNote')} rows={2} maxLength={1000} placeholder="e.g. Found on Google Maps, owner agreed on the phone" className="w-full rounded-lg border border-[#DDE4EC] p-2.5 text-[13.5px] outline-none focus:border-[#1B3B6F]" /></L></div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#EEF2F7] pt-3">
          <button type="button" onClick={onClose} disabled={saving} className="h-10 rounded-lg border border-[#DDE4EC] bg-white px-4 text-[13.5px] font-bold text-[#334155] disabled:opacity-60">Cancel</button>
          <button type="button" onClick={() => save()} disabled={saving} className="flex h-10 items-center gap-1.5 rounded-lg px-5 text-[13.5px] font-bold text-white disabled:opacity-60" style={{ background: ORANGE }} data-save-garage>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editing ? 'Save Changes' : 'Add Garage'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
