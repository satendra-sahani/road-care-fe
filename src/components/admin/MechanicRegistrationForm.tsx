'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  User, Wrench, MapPin, Navigation, Loader2, FileText, Landmark,
  CheckCircle, ArrowLeft, UserPlus, IndianRupee, Save, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { mechanicAPI } from '@/services/api'
import { cn } from '@/lib/utils'
import { DocUpload } from './DocUpload'

// ─── Constants (mirror backend enums in models/MechanicProfile.js) ───────────
export const MECHANIC_SPECIALIZATIONS = [
  'Engine Repair', 'Brake System', 'Electrical', 'AC Service',
  'Battery', 'Tyre Service', 'Suspension', 'Clutch',
  'Oil Change', 'Body Work', 'Painting', 'General Service',
]
export const VEHICLE_TYPES = ['Bike', 'Scooter', 'Car', 'Auto', 'Truck', 'Bus', 'Tractor', 'Electric Vehicle']
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

// ─── Payout (shared by mechanic + shop forms) ────────────────────────────────
export type PayoutMethod = '' | 'bank' | 'upi'
export type BankDetails = { accountNumber: string; bankName: string; accountHolderName: string; branch: string; ifscCode: string }
export type UpiDetails = { id: string; holderName: string }
export const emptyBank: BankDetails = { accountNumber: '', bankName: '', accountHolderName: '', branch: '', ifscCode: '' }
export const emptyUpi: UpiDetails = { id: '', holderName: '' }

export function validatePayout(method: PayoutMethod, bank: BankDetails, upi: UpiDetails, required = true): string | null {
  if (!method) return required ? 'Choose Bank account or UPI for payouts' : null
  if (method === 'bank') {
    if (!bank.accountNumber.trim() || !bank.bankName.trim() || !bank.accountHolderName.trim() || !bank.ifscCode.trim()) {
      return 'Bank account number, bank name, account holder name and IFSC are required'
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifscCode.trim().toUpperCase())) return 'Invalid IFSC code (e.g. SBIN0001234)'
    if (!/^\d{9,18}$/.test(bank.accountNumber.replace(/\s/g, ''))) return 'Account number should be 9–18 digits'
  }
  if (method === 'upi') {
    if (!upi.id.trim() || !upi.holderName.trim()) return 'UPI ID and account holder name are required'
    if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi.id.trim())) return 'Invalid UPI ID (e.g. name@upi)'
  }
  return null
}

export function toPayoutPayload(method: PayoutMethod, bank: BankDetails, upi: UpiDetails) {
  if (method === 'bank') {
    return { method: 'bank', bank: { ...bank, accountNumber: bank.accountNumber.replace(/\s/g, ''), ifscCode: bank.ifscCode.trim().toUpperCase() } }
  }
  if (method === 'upi') return { method: 'upi', upi: { id: upi.id.trim(), holderName: upi.holderName.trim() } }
  return { method: '' }
}

// ─── Mechanic form model ────────────────────────────────────────────────────
export type MechanicFormValues = {
  name: string
  email: string
  phone: string
  secondPhone: string
  specializations: string[]
  vehicleTypes: string[]
  serviceRangeKm: string
  experience: string
  // Address & location
  address: string
  city: string
  state: string
  pincode: string
  latitude: number | null
  longitude: number | null
  // Documents (ImageKit URLs)
  photo: string
  panNumber: string
  panImage: string
  aadhaarNo: string
  aadhaarFrontImage: string
  aadhaarBackImage: string
  // Payout
  payoutMethod: PayoutMethod
  bank: BankDetails
  upi: UpiDetails
  // Admin
  commissionRate: string
  notes: string
}

export const emptyMechanicForm: MechanicFormValues = {
  name: '', email: '', phone: '', secondPhone: '',
  specializations: [], vehicleTypes: [], serviceRangeKm: '10', experience: '',
  address: '', city: '', state: 'Uttar Pradesh', pincode: '', latitude: null, longitude: null,
  photo: '', panNumber: '', panImage: '', aadhaarNo: '', aadhaarFrontImage: '', aadhaarBackImage: '',
  payoutMethod: '', bank: { ...emptyBank }, upi: { ...emptyUpi },
  commissionRate: '20', notes: '',
}

export type MechanicValidateOpts = { requireIdentity?: boolean; requirePayout?: boolean; requireAddress?: boolean }

export function validateMechanicForm(v: MechanicFormValues, opts: MechanicValidateOpts = {}): string | null {
  const { requireIdentity = true, requirePayout = true, requireAddress = true } = opts
  if (requireIdentity) {
    if (v.name.trim().length < 2) return 'Mechanic name is required'
    if (v.phone.replace(/\D/g, '').slice(-10).length !== 10) return 'Enter a valid 10-digit mobile number'
  }
  if (v.email.trim() && !/^\S+@\S+\.\S+$/.test(v.email.trim())) return 'Enter a valid email'
  if (v.secondPhone.trim() && v.secondPhone.replace(/\D/g, '').slice(-10).length !== 10) return 'Second number must be 10 digits'
  if (v.specializations.length === 0) return 'Select at least one specialisation'
  if (v.vehicleTypes.length === 0) return 'Select at least one vehicle type'
  if (v.serviceRangeKm !== '' && (isNaN(Number(v.serviceRangeKm)) || Number(v.serviceRangeKm) < 0 || Number(v.serviceRangeKm) > 500)) return 'Service range must be 0–500 km'
  if (requireAddress) {
    if (!v.address.trim()) return 'Address is required'
    if (!v.city.trim()) return 'City is required'
    if (!v.state.trim()) return 'State is required'
    if (!/^\d{6}$/.test(v.pincode.trim())) return 'Pincode must be 6 digits'
  }
  if (v.panNumber.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.panNumber.trim().toUpperCase())) return 'Invalid PAN number (e.g. ABCDE1234F)'
  if (v.aadhaarNo.trim() && !/^\d{12}$/.test(v.aadhaarNo.replace(/\s/g, ''))) return 'Aadhaar must be 12 digits'
  if (v.commissionRate !== '' && (isNaN(Number(v.commissionRate)) || Number(v.commissionRate) < 0 || Number(v.commissionRate) > 100)) return 'Commission must be 0–100%'
  const payoutErr = validatePayout(v.payoutMethod, v.bank, v.upi, requirePayout)
  if (payoutErr) return payoutErr
  return null
}

const compact = (o: Record<string, any>) => {
  const out: Record<string, any> = {}
  for (const [k, val] of Object.entries(o)) {
    if (val === '' || val === undefined || val === null) continue
    out[k] = val
  }
  return out
}

/** Map form values → POST /admin/mechanics body (MechanicService.createProfile). */
export function toMechanicPayload(v: MechanicFormValues, opts: { includePayout?: boolean } = {}) {
  const { includePayout = true } = opts
  return compact({
    fullName: v.name.trim(),
    phone: v.phone.replace(/\D/g, '').slice(-10),
    email: v.email.trim().toLowerCase(),
    secondPhone: v.secondPhone.replace(/\D/g, '').slice(-10),
    specializations: v.specializations,
    vehicleTypes: v.vehicleTypes,
    serviceRangeKm: v.serviceRangeKm !== '' ? Number(v.serviceRangeKm) : undefined,
    experience: v.experience.trim(),
    aadhaarNo: v.aadhaarNo.replace(/\s/g, ''),
    street: v.address.trim(),
    city: v.city.trim(),
    state: v.state.trim(),
    pincode: v.pincode.trim(),
    latitude: v.latitude ?? undefined,
    longitude: v.longitude ?? undefined,
    kyc: compact({
      panNumber: v.panNumber.trim().toUpperCase(),
      panImage: v.panImage,
      aadhaarFrontImage: v.aadhaarFrontImage,
      aadhaarBackImage: v.aadhaarBackImage,
      photo: v.photo,
    }),
    payout: includePayout ? toPayoutPayload(v.payoutMethod, v.bank, v.upi) : undefined,
    commissionRate: v.commissionRate !== '' ? Number(v.commissionRate) : undefined,
    notes: v.notes.trim(),
    registrationSource: 'admin',
  })
}

// ─── Reverse-geocode helper ("Use location" button) ─────────────────────────
export type DetectedLocation = {
  latitude: number; longitude: number
  address?: string; city?: string; state?: string; pincode?: string; landmark?: string
}

export function useDetectLocation(onResult: (r: DetectedLocation) => void) {
  const [loading, setLoading] = useState(false)
  const detect = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { toast.error('Geolocation not supported in this browser'); return }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const r: DetectedLocation = { latitude, longitude }
        try {
          // Same parsing as ServicePage / Android reverseGeocode
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`)
          const data = await resp.json()
          const a = data?.address
          if (a) {
            r.address = [a.road, a.neighbourhood, a.suburb].filter(Boolean).join(', ')
            r.city = a.city || a.town || a.village || a.state_district || ''
            r.state = a.state || ''
            r.pincode = a.postcode || ''
            r.landmark = a.suburb || a.neighbourhood || ''
          }
        } catch { /* coordinates alone are still useful */ }
        onResult(r)
        setLoading(false)
        toast.success('Location captured')
      },
      () => { toast.error('Location access denied'); setLoading(false) },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }
  return { detect, loading }
}

// ─── Small layout helpers (exported for the shop form) ──────────────────────
export function Section({ title, icon: Icon, description, children, className }: {
  title: string; icon: any; description?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('rounded-2xl border border-gray-100 bg-white shadow-sm', className)}>
      <div className="flex items-start gap-3 px-5 pt-5 pb-3 border-b border-gray-50">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#1B3B6F]/10 text-[#1B3B6F] shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#1A1D29]">{title}</h3>
          {description && <p className="text-xs text-[#6B7280] mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function Field({ label, required, hint, className, children }: {
  label: string; required?: boolean; hint?: string; className?: string; children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-semibold text-[#475569]">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
    </div>
  )
}

export function ChipGroup({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              on ? 'bg-[#1B3B6F] border-[#1B3B6F] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-[#1B3B6F]/50',
            )}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

export const selectCls = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export function StateSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const options = value && !INDIAN_STATES.includes(value) ? [value, ...INDIAN_STATES] : INDIAN_STATES
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls} disabled={disabled}>
      <option value="">Select state</option>
      {options.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}

export function PayoutFields({ method, bank, upi, onMethodChange, onBankChange, onUpiChange, holderHint }: {
  method: PayoutMethod; bank: BankDetails; upi: UpiDetails
  onMethodChange: (m: PayoutMethod) => void
  onBankChange: (b: BankDetails) => void
  onUpiChange: (u: UpiDetails) => void
  holderHint?: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([['bank', 'Bank account'], ['upi', 'UPI ID']] as [PayoutMethod, string][]).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => onMethodChange(m)}
            className={cn(
              'flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
              method === m ? 'border-[#1B3B6F] bg-[#1B3B6F]/5 text-[#1B3B6F]' : 'border-gray-200 text-gray-600 hover:border-gray-300',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {method === 'bank' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Account number" required>
            <Input inputMode="numeric" value={bank.accountNumber} onChange={(e) => onBankChange({ ...bank, accountNumber: e.target.value })} placeholder="XXXXXXXXXXXX" />
          </Field>
          <Field label="Bank name" required>
            <Input value={bank.bankName} onChange={(e) => onBankChange({ ...bank, bankName: e.target.value })} placeholder="State Bank of India" />
          </Field>
          <Field label="Account holder name" required hint={holderHint}>
            <Input value={bank.accountHolderName} onChange={(e) => onBankChange({ ...bank, accountHolderName: e.target.value })} placeholder="As printed on passbook" />
          </Field>
          <Field label="Branch">
            <Input value={bank.branch} onChange={(e) => onBankChange({ ...bank, branch: e.target.value })} placeholder="Branch name" />
          </Field>
          <Field label="IFSC code" required>
            <Input value={bank.ifscCode} onChange={(e) => onBankChange({ ...bank, ifscCode: e.target.value.toUpperCase() })} placeholder="SBIN0001234" className="uppercase font-mono" maxLength={11} />
          </Field>
        </div>
      )}
      {method === 'upi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="UPI ID" required>
            <Input value={upi.id} onChange={(e) => onUpiChange({ ...upi, id: e.target.value })} placeholder="name@upi" className="font-mono" />
          </Field>
          <Field label="Account holder name" required hint={holderHint}>
            <Input value={upi.holderName} onChange={(e) => onUpiChange({ ...upi, holderName: e.target.value })} placeholder="Name linked to UPI" />
          </Field>
        </div>
      )}
    </div>
  )
}

// ─── The mechanic form fields (reused inside the shop form for the owner) ────
export function MechanicFormFields({
  value, onChange, lockIdentity = false, showAddress = true, showPayout = true, showAdmin = true, folder = 'mechanic-kyc',
}: {
  value: MechanicFormValues
  onChange: (v: MechanicFormValues) => void
  /** name + phone come from somewhere else (shop owner) — show but don't allow editing */
  lockIdentity?: boolean
  showAddress?: boolean
  showPayout?: boolean
  showAdmin?: boolean
  folder?: string
}) {
  const set = <K extends keyof MechanicFormValues>(k: K, val: MechanicFormValues[K]) => onChange({ ...value, [k]: val })
  const { detect, loading: gpsLoading } = useDetectLocation((r) => {
    onChange({
      ...value,
      latitude: r.latitude,
      longitude: r.longitude,
      address: r.address || value.address,
      city: r.city || value.city,
      state: r.state || value.state,
      pincode: r.pincode || value.pincode,
    })
  })

  return (
    <div className="space-y-5">
      <Section title="Mechanic details" icon={User} description="Basic identity, contact numbers and what they can repair.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Mechanic name" required>
            <Input value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Ramesh Kumar" disabled={lockIdentity} />
          </Field>
          <Field label="Email" hint="Optional">
            <Input type="email" value={value.email} onChange={(e) => set('email', e.target.value)} placeholder="mechanic@example.com" />
          </Field>
          <Field label="Mobile number" required hint="Used for OTP login in the mechanic app">
            <Input inputMode="numeric" value={value.phone} onChange={(e) => set('phone', e.target.value)} placeholder="98765 43210" disabled={lockIdentity} />
          </Field>
          <Field label="Second number" hint="Optional — alternate / family number">
            <Input inputMode="numeric" value={value.secondPhone} onChange={(e) => set('secondPhone', e.target.value)} placeholder="Alternate number" />
          </Field>
          <Field label="Specialist in" required className="md:col-span-2">
            <ChipGroup options={MECHANIC_SPECIALIZATIONS} value={value.specializations} onChange={(v) => set('specializations', v)} />
          </Field>
          <Field label="Vehicle types" required className="md:col-span-2">
            <ChipGroup options={VEHICLE_TYPES} value={value.vehicleTypes} onChange={(v) => set('vehicleTypes', v)} />
          </Field>
          <Field label="Service range (km)" hint="How far they will travel for doorstep jobs">
            <Input inputMode="numeric" value={value.serviceRangeKm} onChange={(e) => set('serviceRangeKm', e.target.value)} placeholder="10" />
          </Field>
          <Field label="Experience">
            <Input value={value.experience} onChange={(e) => set('experience', e.target.value)} placeholder="e.g. 5 years" />
          </Field>
        </div>
      </Section>

      {showAddress && (
        <Section title="Address & location" icon={MapPin} description="Tap “Use location” while standing at the mechanic’s shop/home to auto-fill.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={detect} disabled={gpsLoading} className="border-[#1B3B6F] text-[#1B3B6F]">
                {gpsLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
                Use current location
              </Button>
              {value.latitude != null && value.longitude != null && (
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
                </span>
              )}
            </div>
            <Field label="Address" required className="md:col-span-2">
              <Input value={value.address} onChange={(e) => set('address', e.target.value)} placeholder="Shop / house, street, area" />
            </Field>
            <Field label="City" required>
              <Input value={value.city} onChange={(e) => set('city', e.target.value)} placeholder="Lucknow" />
            </Field>
            <Field label="Pincode" required>
              <Input inputMode="numeric" maxLength={6} value={value.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} placeholder="226001" />
            </Field>
            <Field label="State" required>
              <StateSelect value={value.state} onChange={(v) => set('state', v)} />
            </Field>
          </div>
        </Section>
      )}

      <Section title="Documents" icon={FileText} description="Photos are uploaded to ImageKit; only the link is stored with the profile.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DocUpload label="Mechanic photo" value={value.photo} onChange={(u) => set('photo', u)} folder={folder} hint="Passport-style, optional" />
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="PAN number" className="sm:col-span-2">
              <Input value={value.panNumber} onChange={(e) => set('panNumber', e.target.value.toUpperCase())} placeholder="ABCDE1234F" className="uppercase font-mono" maxLength={10} />
            </Field>
            <DocUpload label="Upload PAN" value={value.panImage} onChange={(u) => set('panImage', u)} folder={folder} hint="JPG/PNG, max 5MB" />
          </div>
          <Field label="Aadhaar number" className="md:col-span-3">
            <Input inputMode="numeric" value={value.aadhaarNo} onChange={(e) => set('aadhaarNo', e.target.value.replace(/[^\d\s]/g, ''))} placeholder="XXXX XXXX XXXX" maxLength={14} />
          </Field>
          <DocUpload label="Aadhaar — front" value={value.aadhaarFrontImage} onChange={(u) => set('aadhaarFrontImage', u)} folder={folder} hint="JPG/PNG, max 5MB" />
          <DocUpload label="Aadhaar — back" value={value.aadhaarBackImage} onChange={(u) => set('aadhaarBackImage', u)} folder={folder} hint="JPG/PNG, max 5MB" />
        </div>
      </Section>

      {showPayout && (
        <Section title="Bank details" icon={Landmark} description="Where the mechanic’s earnings are paid out. Bank account OR UPI.">
          <PayoutFields
            method={value.payoutMethod}
            bank={value.bank}
            upi={value.upi}
            onMethodChange={(m) => set('payoutMethod', m)}
            onBankChange={(b) => set('bank', b)}
            onUpiChange={(u) => set('upi', u)}
          />
        </Section>
      )}

      {showAdmin && (
        <Section title="Platform settings" icon={IndianRupee} description="Internal — not shown to the mechanic.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Commission (%)" hint="Platform share per completed job (default 20%)">
              <Input inputMode="numeric" value={value.commissionRate} onChange={(e) => set('commissionRate', e.target.value)} placeholder="20" />
            </Field>
            <Field label="Notes" className="md:col-span-2">
              <Textarea value={value.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything the team should know…" rows={3} maxLength={500} />
            </Field>
          </div>
        </Section>
      )}
    </div>
  )
}

// ─── Standalone page component: /admin/mechanics/register ──────────────────
export default function MechanicRegistrationForm() {
  const [form, setForm] = useState<MechanicFormValues>({ ...emptyMechanicForm })
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState<any>(null)

  const submit = async () => {
    const err = validateMechanicForm(form)
    if (err) { toast.error(err); return }
    setSaving(true)
    try {
      const res = await mechanicAPI.create(toMechanicPayload(form))
      if (res.data?.success) {
        setCreated(res.data.data)
        toast.success('Mechanic registered')
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        toast.error(res.data?.message || 'Could not register mechanic')
      }
    } catch (e: any) {
      const d = e?.response?.data
      toast.error(d?.errors?.[0]?.msg || d?.message || 'Could not register mechanic')
    } finally {
      setSaving(false)
    }
  }

  if (created) {
    const phone = created.phone || form.phone
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-600 text-white shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-emerald-900">Mechanic registered</h2>
              <p className="text-sm text-emerald-800 mt-1">
                <b>{created.user?.fullName || form.name}</b> · {phone}
                {form.specializations.length > 0 && <> · {form.specializations.join(', ')}</>}
              </p>
              <p className="text-xs text-emerald-700 mt-3 leading-relaxed">
                They can log in to the Bharat Mechanics app with this mobile number (OTP). If they don’t use a smartphone,
                you can accept jobs and submit quotations on their behalf from <b>Service Requests → Actions</b>.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]" onClick={() => { setCreated(null); setForm({ ...emptyMechanicForm }) }}>
              <UserPlus className="h-4 w-4 mr-2" /> Register another
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/services/mechanics"><Wrench className="h-4 w-4 mr-2" /> Go to mechanics list</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link href="/admin/services/mechanics" className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1B3B6F] mb-1">
            <ArrowLeft className="h-3 w-3" /> Mechanics
          </Link>
          <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Mechanic Registration</h1>
          <p className="text-[#6B7280] text-sm mt-1">Register a mechanic in person — documents go to ImageKit, login works via OTP on this number.</p>
        </div>
      </div>

      <MechanicFormFields value={form} onChange={setForm} />

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button size="lg" className="bg-[#FF6B35] hover:bg-[#e55a28] text-white shadow-lg" onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Register mechanic
        </Button>
      </div>
    </div>
  )
}
