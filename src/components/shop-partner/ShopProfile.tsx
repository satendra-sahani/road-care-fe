'use client'

import { useEffect, useRef, useState } from 'react'
import { shopAPI, uploadAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, Check, Plus, ShieldCheck } from 'lucide-react'

const DIST = '#D97706', DIST_50 = '#FEF3E2', DIST_2 = '#B45309'
const SPECS = ['Engine Repair', 'Brake System', 'Electrical', 'AC Service', 'Battery', 'Tyre Service', 'Suspension', 'Clutch', 'Oil Change', 'Body Work', 'Painting', 'General Service', 'Denting', 'Washing', 'Towing']
const VTYPES = ['Bike', 'Scooter', 'Car', 'Auto', 'Truck', 'Bus', 'Tractor', 'Electric Vehicle']

function Field({ label, value, onChange, full = true }: { label: string; value: string; onChange: (v: string) => void; full?: boolean }) {
  return (
    <div className={`mb-3.5 ${full ? '' : 'flex-1'}`}>
      <label className="block text-[12px] font-bold text-[#7B8AA3] mb-1.5">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-[#E7ECF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
    </div>
  )
}

export function ShopProfile() {
  const [p, setP] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    shopAPI.getProfile().then((r) => { if (r.data?.success) setP(normalize(r.data.data)) }).catch(() => toast.error('Could not load profile')).finally(() => setLoading(false))
  }, [])

  const normalize = (d: any) => ({
    shopName: d.shopName || '', shopPhone: d.shopPhone || '', shopEmail: d.shopEmail || '',
    street: d.address?.street || '', city: d.address?.city || '', state: d.address?.state || '', pincode: d.address?.pincode || '',
    latitude: d.address?.coordinates?.latitude ?? '', longitude: d.address?.coordinates?.longitude ?? '',
    coverageRadius: d.coverageRadius ?? 10, isAvailable: d.isAvailable !== false, isVerified: d.isVerified,
    open: d.operatingHours?.open || '09:00', close: d.operatingHours?.close || '20:00',
    specializations: d.specializations || [], vehicleTypes: d.vehicleTypes || [], logo: d.logo || '',
  })

  const set = (k: string, v: any) => setP((s: any) => ({ ...s, [k]: v }))

  const onLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setUploadingLogo(true)
    try {
      const r = await uploadAPI.uploadImageAny(file, 'shop-logos')
      const url = r.data?.data?.url || r.data?.url
      if (!url) throw new Error('No URL returned')
      set('logo', url)
      // Persist immediately so the logo survives even without a full profile save.
      await shopAPI.updateProfile({ logo: url })
      toast.success('Logo updated')
    } catch (err: any) { toast.error(err.response?.data?.message || 'Could not upload logo') }
    finally { setUploadingLogo(false); if (logoInput.current) logoInput.current.value = '' }
  }
  const toggleArr = (k: 'specializations' | 'vehicleTypes', v: string) =>
    setP((s: any) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x: string) => x !== v) : [...s[k], v] }))

  const save = async () => {
    setSaving(true)
    try {
      const r = await shopAPI.updateProfile({
        shopName: p.shopName, shopPhone: p.shopPhone, shopEmail: p.shopEmail,
        address: { street: p.street, city: p.city, state: p.state, pincode: p.pincode, coordinates: { latitude: Number(p.latitude) || undefined, longitude: Number(p.longitude) || undefined } },
        coverageRadius: Number(p.coverageRadius), isAvailable: p.isAvailable,
        operatingHours: { open: p.open, close: p.close },
        specializations: p.specializations, vehicleTypes: p.vehicleTypes, logo: p.logo || undefined,
      })
      if (r.data?.success) toast.success('Shop profile saved'); else toast.error(r.data?.message || 'Could not save')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Could not save') } finally { setSaving(false) }
  }

  if (loading || !p) return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>

  const initials = (p.shopName || 'Shop').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="p-4 md:p-6 space-y-[18px] max-w-5xl">
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* Shop details */}
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Shop details</h3></div>
          <div className="p-[18px]">
            <Field label="Shop name" value={p.shopName} onChange={(v) => set('shopName', v)} />
            <div className="flex gap-3"><Field label="Phone" value={p.shopPhone} onChange={(v) => set('shopPhone', v)} full={false} /><Field label="Email" value={p.shopEmail} onChange={(v) => set('shopEmail', v)} full={false} /></div>
            <Field label="Street / address" value={p.street} onChange={(v) => set('street', v)} />
            <div className="flex gap-3"><Field label="City" value={p.city} onChange={(v) => set('city', v)} full={false} /><Field label="State" value={p.state} onChange={(v) => set('state', v)} full={false} /></div>
            <div className="flex gap-3"><Field label="Pincode" value={p.pincode} onChange={(v) => set('pincode', v)} full={false} /><Field label="Coverage radius (km)" value={String(p.coverageRadius)} onChange={(v) => set('coverageRadius', v.replace(/\D/g, ''))} full={false} /></div>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 text-white font-bold text-[14px] rounded-[11px] px-[18px] py-[11px] disabled:opacity-50" style={{ background: DIST }}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save profile</button>
          </div>
        </div>

        {/* Logo & availability */}
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Logo & availability</h3></div>
          <div className="p-[18px]">
            <div className="flex items-center gap-3.5 mb-[18px]">
              {p.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logo} alt="Shop logo" className="h-[72px] w-[72px] rounded-2xl object-cover border border-[#E7ECF3]" />
              ) : (
                <div className="h-[72px] w-[72px] rounded-2xl flex items-center justify-center font-extrabold text-[24px]" style={{ background: DIST_50, color: DIST_2 }}>{initials}</div>
              )}
              <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={onLogoPick} />
              <button onClick={() => logoInput.current?.click()} disabled={uploadingLogo} className="inline-flex items-center gap-2 font-bold text-[14px] rounded-[11px] px-[18px] py-[11px] bg-white border border-[#E7ECF3] disabled:opacity-60" style={{ color: DIST_2 }}>
                {uploadingLogo ? <Loader2 className="h-[15px] w-[15px] animate-spin" /> : <Plus className="h-[15px] w-[15px]" />} {p.logo ? 'Change logo' : 'Upload logo'}
              </button>
            </div>
            <div className="flex items-center justify-between bg-white border border-[#E7ECF3] rounded-[11px] px-3.5 py-2 mb-3.5">
              <b className="text-[13px] text-[#13203A]">Available for new jobs</b>
              <button onClick={() => set('isAvailable', !p.isAvailable)} className={`w-[46px] h-[27px] rounded-full relative transition ${p.isAvailable ? 'bg-[#15936B]' : 'bg-[#E7ECF3]'}`}>
                <span className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow transition-all ${p.isAvailable ? 'left-[22px]' : 'left-[3px]'}`} />
              </button>
            </div>
            <label className="block text-[12px] font-bold text-[#7B8AA3] mb-1.5">Operating hours</label>
            <div className="flex gap-3"><Field label="Opens" value={p.open} onChange={(v) => set('open', v)} full={false} /><Field label="Closes" value={p.close} onChange={(v) => set('close', v)} full={false} /></div>
            {p.isVerified && <div className="flex items-center gap-2 text-[12.5px] text-[#15936B] mt-1"><ShieldCheck className="h-4 w-4" /> Verified shop partner</div>}
          </div>
        </div>
      </div>

      {/* Specializations */}
      <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Specializations</h3><span className="text-[12px] text-[#7B8AA3]">Tap to toggle · Save to apply</span></div>
        <div className="p-[18px] flex flex-wrap gap-2.5">
          {SPECS.map((s) => { const on = p.specializations.includes(s); return (
            <button key={s} onClick={() => toggleArr('specializations', s)} className={`text-[13px] font-bold rounded-full px-3.5 py-2 border transition ${on ? 'text-white border-transparent' : 'bg-white text-[#475569] border-[#E7ECF3]'}`} style={on ? { background: DIST } : {}}>{s}</button>
          )})}
        </div>
      </div>

      {/* Vehicle types */}
      <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
        <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Vehicle types serviced</h3></div>
        <div className="p-[18px] flex flex-wrap gap-2.5">
          {VTYPES.map((v) => { const on = p.vehicleTypes.includes(v); return (
            <button key={v} onClick={() => toggleArr('vehicleTypes', v)} className={`text-[13px] font-bold rounded-full px-3.5 py-2 border transition ${on ? 'text-white border-transparent' : 'bg-white text-[#475569] border-[#E7ECF3]'}`} style={on ? { background: DIST } : {}}>{v}</button>
          )})}
        </div>
      </div>
    </div>
  )
}
