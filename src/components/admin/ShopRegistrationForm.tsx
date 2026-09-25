'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Store, User, MapPin, Wrench, Landmark, Wallet, Navigation, Loader2, CheckCircle,
  ArrowLeft, Save, Copy, Check, ShieldCheck, FileText, Plus, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { adminShopAPI } from '@/services/api'
import { cn } from '@/lib/utils'
import { DocUpload } from './DocUpload'
import {
  MECHANIC_SPECIALIZATIONS, VEHICLE_TYPES,
  type PayoutMethod, type BankDetails, type UpiDetails, emptyBank, emptyUpi,
  validatePayout, toPayoutPayload,
  type MechanicFormValues, emptyMechanicForm, validateMechanicForm, toMechanicPayload,
  MechanicFormFields, PayoutFields, useDetectLocation, Section, Field, ChipGroup, StateSelect, selectCls,
} from './MechanicRegistrationForm'

// Shop enum has three extra entries (models/ShopPartner.js)
const SHOP_SPECIALIZATIONS = [...MECHANIC_SPECIALIZATIONS, 'Denting', 'Washing', 'Towing']
const SETTLEMENT_CYCLES: { value: ShopFormValues['settlementCycle']; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
]
/** Platform-wide minimum wallet balance (MIN_WALLET_BALANCE in backend routes/shop/index.js) */
const PLATFORM_MIN_WALLET = 2000
const MAX_SHOP_PHOTOS = 4

export type ShopFormValues = {
  // Shop
  shopName: string
  gstNumber: string
  shopPhone: string
  shopEmail: string
  description: string
  shopImages: string[]
  logo: string
  specializations: string[]
  vehicleTypes: string[]
  // Owner
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  ownerPassword: string
  ownerPhoto: string
  aadhaarNumber: string
  aadhaarImage: string
  panNumber: string
  panImage: string
  gstImage: string
  // Address
  street: string
  landmark: string
  city: string
  state: string
  pincode: string
  latitude: number | null
  longitude: number | null
  coverageRadius: string
  // Mechanics
  mechanicsCount: string
  ownerIsMechanic: boolean
  ownerMechanicSameAddress: boolean
  ownerMechanic: MechanicFormValues
  // Payout
  payoutMethod: PayoutMethod
  bank: BankDetails
  upi: UpiDetails
  // Wallet rule
  commissionRate: string
  settlementCycle: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  walletMinBalance: string
  walletAccepted: boolean
  walletNote: string
}

export const emptyShopForm: ShopFormValues = {
  shopName: '', gstNumber: '', shopPhone: '', shopEmail: '', description: '', shopImages: [], logo: '',
  specializations: [], vehicleTypes: [],
  ownerName: '', ownerPhone: '', ownerEmail: '', ownerPassword: '',
  ownerPhoto: '', aadhaarNumber: '', aadhaarImage: '', panNumber: '', panImage: '', gstImage: '',
  street: '', landmark: '', city: '', state: 'Uttar Pradesh', pincode: '', latitude: null, longitude: null, coverageRadius: '10',
  mechanicsCount: '', ownerIsMechanic: false, ownerMechanicSameAddress: true,
  ownerMechanic: { ...emptyMechanicForm, commissionRate: '' },
  payoutMethod: '', bank: { ...emptyBank }, upi: { ...emptyUpi },
  commissionRate: '25', settlementCycle: 'weekly', walletMinBalance: String(PLATFORM_MIN_WALLET), walletAccepted: false, walletNote: '',
}

const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

export function validateShopForm(v: ShopFormValues): string | null {
  if (v.shopName.trim().length < 2) return 'Shop name is required'
  if (v.gstNumber.trim() && !GST_RE.test(v.gstNumber.trim().toUpperCase())) return 'Invalid GST number (15 characters, e.g. 09ABCDE1234F1Z5)'
  if (v.shopEmail.trim() && !/^\S+@\S+\.\S+$/.test(v.shopEmail.trim())) return 'Enter a valid shop email'
  if (v.ownerName.trim().length < 2) return 'Owner name is required'
  if (v.ownerPhone.replace(/\D/g, '').slice(-10).length !== 10) return 'Enter a valid 10-digit owner mobile number'
  if (v.ownerEmail.trim() && !/^\S+@\S+\.\S+$/.test(v.ownerEmail.trim())) return 'Enter a valid owner email'
  if (v.ownerPassword && v.ownerPassword.length < 6) return 'Password must be at least 6 characters'
  if (v.aadhaarNumber.trim() && !/^\d{12}$/.test(v.aadhaarNumber.replace(/\s/g, ''))) return 'Owner Aadhaar must be 12 digits'
  if (v.panNumber.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.panNumber.trim().toUpperCase())) return 'Invalid owner PAN number'
  if (!v.street.trim()) return 'Shop address is required'
  if (!v.city.trim()) return 'City is required'
  if (!v.state.trim()) return 'State is required'
  if (!/^\d{6}$/.test(v.pincode.trim())) return 'Pincode must be 6 digits'
  if (v.coverageRadius !== '' && (isNaN(Number(v.coverageRadius)) || Number(v.coverageRadius) < 1 || Number(v.coverageRadius) > 50)) return 'Coverage radius must be 1–50 km'
  if (v.mechanicsCount !== '' && (isNaN(Number(v.mechanicsCount)) || Number(v.mechanicsCount) < 0)) return 'Number of mechanics must be 0 or more'
  if (v.ownerIsMechanic) {
    const err = validateMechanicForm(v.ownerMechanic, { requireIdentity: false, requirePayout: false, requireAddress: !v.ownerMechanicSameAddress })
    if (err) return `Owner mechanic details: ${err}`
  }
  const payoutErr = validatePayout(v.payoutMethod, v.bank, v.upi, true)
  if (payoutErr) return payoutErr
  if (v.commissionRate === '' || isNaN(Number(v.commissionRate)) || Number(v.commissionRate) < 0 || Number(v.commissionRate) > 100) return 'Commission must be 0–100%'
  if (v.walletMinBalance === '' || isNaN(Number(v.walletMinBalance)) || Number(v.walletMinBalance) < 0) return 'Minimum wallet balance must be a number'
  if (!v.walletAccepted) return 'Owner must accept the wallet rule before registration'
  return null
}

const compact = (o: Record<string, any>) => {
  const out: Record<string, any> = {}
  for (const [k, val] of Object.entries(o)) {
    if (val === '' || val === undefined || val === null) continue
    if (Array.isArray(val) && val.length === 0) continue
    out[k] = val
  }
  return out
}

/** Map form values → POST /admin/shops body ({ ownerData, shopData, ownerMechanic }). */
export function toShopPayload(v: ShopFormValues) {
  const ownerPhone = v.ownerPhone.replace(/\D/g, '').slice(-10)
  const ownerData = compact({
    fullName: v.ownerName.trim(),
    phone: ownerPhone,
    email: v.ownerEmail.trim().toLowerCase(),
    password: v.ownerPassword,
  })
  const coordinates = v.latitude != null && v.longitude != null ? { latitude: v.latitude, longitude: v.longitude } : undefined
  const shopData = compact({
    shopName: v.shopName.trim(),
    shopPhone: v.shopPhone.replace(/\D/g, '').slice(-10) || ownerPhone,
    shopEmail: v.shopEmail.trim().toLowerCase(),
    description: v.description.trim(),
    logo: v.logo,
    shopImages: v.shopImages.filter(Boolean),
    address: compact({
      street: v.street.trim(), landmark: v.landmark.trim(), city: v.city.trim(), state: v.state.trim(), pincode: v.pincode.trim(),
      coordinates,
    }),
    coverageRadius: v.coverageRadius !== '' ? Number(v.coverageRadius) : undefined,
    specializations: v.specializations,
    vehicleTypes: v.vehicleTypes,
    mechanicsCount: v.mechanicsCount !== '' ? Number(v.mechanicsCount) : undefined,
    commissionRate: Number(v.commissionRate),
    settlementCycle: v.settlementCycle,
    kyc: compact({
      aadhaarNumber: v.aadhaarNumber.replace(/\s/g, ''),
      aadhaarImage: v.aadhaarImage,
      panNumber: v.panNumber.trim().toUpperCase(),
      panImage: v.panImage,
      gstNumber: v.gstNumber.trim().toUpperCase(),
      gstImage: v.gstImage,
      ownerPhoto: v.ownerPhoto,
      ownerName: v.ownerName.trim(),
    }),
    payout: toPayoutPayload(v.payoutMethod, v.bank, v.upi),
    walletRule: compact({
      minBalance: Number(v.walletMinBalance),
      acceptedAt: v.walletAccepted ? new Date().toISOString() : undefined,
      acceptedByName: v.ownerName.trim(),
      note: v.walletNote.trim(),
    }),
    registrationSource: 'admin',
  })

  let ownerMechanic: Record<string, any> | undefined
  if (v.ownerIsMechanic) {
    const m: MechanicFormValues = {
      ...v.ownerMechanic,
      name: v.ownerName,
      phone: v.ownerPhone,
      commissionRate: '', // falls back to the shop's commission on the backend
      ...(v.ownerMechanicSameAddress
        ? { address: v.street, city: v.city, state: v.state, pincode: v.pincode, latitude: v.latitude, longitude: v.longitude }
        : {}),
    }
    ownerMechanic = { enabled: true, ...toMechanicPayload(m, { includePayout: false }) }
  }

  return { ownerData, shopData, ownerMechanic }
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { toast.error('Copy failed') }
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white border border-gray-100 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-sm font-mono text-[#1A1D29] truncate">{value}</p>
      </div>
      <button type="button" onClick={copy} className="text-gray-400 hover:text-[#1B3B6F] shrink-0" aria-label={`Copy ${label}`}>
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

export default function ShopRegistrationForm() {
  const [form, setForm] = useState<ShopFormValues>({ ...emptyShopForm })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<any>(null)

  const set = <K extends keyof ShopFormValues>(k: K, val: ShopFormValues[K]) => setForm((f) => ({ ...f, [k]: val }))

  const { detect, loading: gpsLoading } = useDetectLocation((r) => {
    setForm((f) => ({
      ...f,
      latitude: r.latitude,
      longitude: r.longitude,
      street: r.address || f.street,
      landmark: r.landmark || f.landmark,
      city: r.city || f.city,
      state: r.state || f.state,
      pincode: r.pincode || f.pincode,
    }))
  })

  const submit = async () => {
    const err = validateShopForm(form)
    if (err) { toast.error(err); return }
    setSaving(true)
    try {
      const res = await adminShopAPI.create(toShopPayload(form))
      if (res.data?.success) {
        setResult(res.data)
        toast.success('Shop registered')
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        toast.error(res.data?.message || 'Could not register shop')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not register shop')
    } finally {
      setSaving(false)
    }
  }

  // Owner-as-mechanic block always mirrors the owner's name/phone.
  const ownerMechanicValue: MechanicFormValues = { ...form.ownerMechanic, name: form.ownerName, phone: form.ownerPhone }
  const visiblePhotoSlots = Math.min(MAX_SHOP_PHOTOS, form.shopImages.filter(Boolean).length + 1)

  if (result) {
    const creds = result.credentials || {}
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-600 text-white shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-emerald-900">Shop registered</h2>
              <p className="text-sm text-emerald-800 mt-1"><b>{form.shopName}</b> · owner {form.ownerName} · {form.ownerPhone}</p>
              <p className="text-xs text-emerald-700 mt-2">Share these login details with the owner (shop-partner login). KYC is submitted — verify it from Shop Partners → KYC when you’ve checked the documents.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
            <CopyRow label="Login ID" value={creds.loginId || form.ownerPhone} />
            <CopyRow label="Password" value={creds.password || '—'} />
            <CopyRow label="Login URL" value={`${typeof window !== 'undefined' ? window.location.origin : ''}${creds.loginUrl || '/shop-partner/login'}`} />
          </div>
          {form.ownerIsMechanic && (
            <div className={cn(
              'mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
              result.ownerMechanic ? 'border-emerald-200 bg-white text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800',
            )}>
              {result.ownerMechanic ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
              <span>
                {result.ownerMechanic
                  ? 'Owner is also registered as a mechanic and attached to this shop — you can assign jobs to them directly.'
                  : `Shop was created but the owner-mechanic profile failed: ${result.ownerMechanicError || 'unknown error'}. You can add them from the mechanics page.`}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-5">
            <Button className="bg-[#1B3B6F] hover:bg-[#0F2545]" onClick={() => { setResult(null); setForm({ ...emptyShopForm }) }}>
              <Plus className="h-4 w-4 mr-2" /> Register another shop
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/shops"><Store className="h-4 w-4 mr-2" /> Go to shop partners</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <Link href="/admin/shops" className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1B3B6F] mb-1">
          <ArrowLeft className="h-3 w-3" /> Shop Partners
        </Link>
        <h1 className="text-2xl font-bold text-[#1A1D29] tracking-tight">Mechanic Shop Registration</h1>
        <p className="text-[#6B7280] text-sm mt-1">Onboard a partner shop in person — shop + owner KYC, mechanics, payout and the wallet rule in one go.</p>
      </div>

      {/* ── Shop ── */}
      <Section title="Shop details" icon={Store} description="What customers see when a job is routed to this shop.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Shop name" required>
            <Input value={form.shopName} onChange={(e) => set('shopName', e.target.value)} placeholder="Sharma Auto Works" />
          </Field>
          <Field label="GST number" hint="Optional — 15 characters">
            <Input value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value.toUpperCase())} placeholder="09ABCDE1234F1Z5" className="uppercase font-mono" maxLength={15} />
          </Field>
          <Field label="Shop phone" hint="Defaults to the owner’s number">
            <Input inputMode="numeric" value={form.shopPhone} onChange={(e) => set('shopPhone', e.target.value)} placeholder="Landline / shop mobile" />
          </Field>
          <Field label="Shop email" hint="Optional">
            <Input type="email" value={form.shopEmail} onChange={(e) => set('shopEmail', e.target.value)} placeholder="shop@example.com" />
          </Field>
          <Field label="Services offered" className="md:col-span-2">
            <ChipGroup options={SHOP_SPECIALIZATIONS} value={form.specializations} onChange={(v) => set('specializations', v)} />
          </Field>
          <Field label="Vehicle types" className="md:col-span-2">
            <ChipGroup options={VEHICLE_TYPES} value={form.vehicleTypes} onChange={(v) => set('vehicleTypes', v)} />
          </Field>
          <Field label="About the shop" className="md:col-span-2">
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Short description shown to customers" maxLength={500} />
          </Field>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-[#475569] mb-2">Shop photos <span className="text-gray-400 font-normal">(up to {MAX_SHOP_PHOTOS})</span></p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: visiblePhotoSlots }).map((_, i) => (
                <DocUpload
                  key={i}
                  label={`Shop photo ${i + 1}`}
                  value={form.shopImages[i] || ''}
                  onChange={(u) => {
                    const arr = [...form.shopImages]
                    arr[i] = u
                    set('shopImages', arr.filter(Boolean))
                  }}
                  folder="shop-photos"
                  hint={i === 0 ? 'Shop front' : 'Inside / workshop'}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Owner ── */}
      <Section title="Owner details & KYC" icon={User} description="Owner logs in to the shop-partner panel with this mobile number.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DocUpload label="Owner photo" value={form.ownerPhoto} onChange={(u) => set('ownerPhoto', u)} folder="shop-kyc" hint="Optional" />
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Owner name" required>
              <Input value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} placeholder="Vinod Sharma" />
            </Field>
            <Field label="Owner mobile" required hint="Login ID for the shop panel">
              <Input inputMode="numeric" value={form.ownerPhone} onChange={(e) => set('ownerPhone', e.target.value)} placeholder="98765 43210" />
            </Field>
            <Field label="Owner email" hint="Optional">
              <Input type="email" value={form.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)} placeholder="owner@example.com" />
            </Field>
            <Field label="Login password" hint="Leave blank to use the mobile number as password">
              <Input type="text" value={form.ownerPassword} onChange={(e) => set('ownerPassword', e.target.value)} placeholder="Min 6 characters" />
            </Field>
          </div>
          <Field label="Aadhaar number">
            <Input inputMode="numeric" value={form.aadhaarNumber} onChange={(e) => set('aadhaarNumber', e.target.value.replace(/[^\d\s]/g, ''))} placeholder="XXXX XXXX XXXX" maxLength={14} />
          </Field>
          <Field label="PAN number">
            <Input value={form.panNumber} onChange={(e) => set('panNumber', e.target.value.toUpperCase())} placeholder="ABCDE1234F" className="uppercase font-mono" maxLength={10} />
          </Field>
          <div />
          <DocUpload label="Upload Aadhaar" value={form.aadhaarImage} onChange={(u) => set('aadhaarImage', u)} folder="shop-kyc" hint="Front side, max 5MB" />
          <DocUpload label="Upload PAN" value={form.panImage} onChange={(u) => set('panImage', u)} folder="shop-kyc" hint="JPG/PNG, max 5MB" />
          <DocUpload label="Upload GST certificate" value={form.gstImage} onChange={(u) => set('gstImage', u)} folder="shop-kyc" hint="Optional" />
        </div>
      </Section>

      {/* ── Address ── */}
      <Section title="Shop address & location" icon={MapPin} description="Tap “Use location” while at the shop — coordinates decide which jobs get routed here.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={detect} disabled={gpsLoading} className="border-[#1B3B6F] text-[#1B3B6F]">
              {gpsLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}
              Use current location
            </Button>
            {form.latitude != null && form.longitude != null && (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
              </span>
            )}
          </div>
          <Field label="Address" required className="md:col-span-2">
            <Input value={form.street} onChange={(e) => set('street', e.target.value)} placeholder="Shop no., street, area" />
          </Field>
          <Field label="Landmark">
            <Input value={form.landmark} onChange={(e) => set('landmark', e.target.value)} placeholder="Near…" />
          </Field>
          <Field label="City" required>
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Lucknow" />
          </Field>
          <Field label="Pincode" required>
            <Input inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} placeholder="226001" />
          </Field>
          <Field label="State" required>
            <StateSelect value={form.state} onChange={(v) => set('state', v)} />
          </Field>
          <Field label="Coverage radius (km)" hint="How far the shop will send mechanics (1–50)">
            <Input inputMode="numeric" value={form.coverageRadius} onChange={(e) => set('coverageRadius', e.target.value)} placeholder="10" />
          </Field>
        </div>
      </Section>

      {/* ── Mechanics ── */}
      <Section title="Mechanics" icon={Wrench} description="Headcount now; the roster can be managed later from Shop Partners → Mechanics.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Number of mechanics" hint="Working at this shop (excluding the owner)">
            <Input inputMode="numeric" value={form.mechanicsCount} onChange={(e) => set('mechanicsCount', e.target.value.replace(/\D/g, ''))} placeholder="2" />
          </Field>
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:border-[#1B3B6F]/40 md:mt-5">
            <input type="checkbox" className="h-4 w-4 accent-[#1B3B6F]" checked={form.ownerIsMechanic} onChange={(e) => set('ownerIsMechanic', e.target.checked)} />
            <span className="text-sm font-medium text-[#1A1D29]">Owner also works as a mechanic</span>
          </label>
        </div>

        {form.ownerIsMechanic && (
          <div className="mt-5 space-y-4 rounded-xl border border-dashed border-[#1B3B6F]/30 bg-[#1B3B6F]/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#1B3B6F] uppercase tracking-wide">Owner’s mechanic form</p>
              <label className="flex items-center gap-2 text-xs text-[#475569] cursor-pointer">
                <input type="checkbox" className="h-3.5 w-3.5 accent-[#1B3B6F]" checked={form.ownerMechanicSameAddress} onChange={(e) => set('ownerMechanicSameAddress', e.target.checked)} />
                Same address as shop
              </label>
            </div>
            <p className="text-xs text-[#6B7280]">Name and number are taken from the owner details above. Payout goes to the shop’s bank/UPI below.</p>
            <MechanicFormFields
              value={ownerMechanicValue}
              onChange={(m) => set('ownerMechanic', m)}
              lockIdentity
              showAddress={!form.ownerMechanicSameAddress}
              showPayout={false}
              showAdmin={false}
              folder="shop-kyc"
            />
          </div>
        )}
      </Section>

      {/* ── Payout ── */}
      <Section title="Bank details (payouts)" icon={Landmark} description="Where settlements are paid. Bank account OR UPI.">
        <PayoutFields
          method={form.payoutMethod}
          bank={form.bank}
          upi={form.upi}
          onMethodChange={(m) => set('payoutMethod', m)}
          onBankChange={(b) => set('bank', b)}
          onUpiChange={(u) => set('upi', u)}
          holderHint="Should match the owner / shop name"
        />
      </Section>

      {/* ── Wallet rule ── */}
      <Section title="Wallet rule" icon={Wallet} description="Explain this to the owner before they sign — it’s how the shop gets paid and how the platform takes its share.">
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-900 space-y-1.5 mb-4">
          <p className="flex gap-2"><FileText className="h-4 w-4 mt-0.5 shrink-0" /><span>Shop keeps a minimum <b>₹{Number(form.walletMinBalance || PLATFORM_MIN_WALLET).toLocaleString('en-IN')}</b> in the Bharat Mechanics wallet to keep receiving jobs (top-up via Razorpay in the shop panel).</span></p>
          <p className="flex gap-2"><FileText className="h-4 w-4 mt-0.5 shrink-0" /><span>Platform commission of <b>{form.commissionRate || 0}%</b> is deducted per completed job.</span></p>
          <p className="flex gap-2"><FileText className="h-4 w-4 mt-0.5 shrink-0" /><span>Earnings are settled <b>{SETTLEMENT_CYCLES.find((c) => c.value === form.settlementCycle)?.label.toLowerCase()}</b> to the bank/UPI above.</span></p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Commission (%)" required>
            <Input inputMode="numeric" value={form.commissionRate} onChange={(e) => set('commissionRate', e.target.value)} placeholder="25" />
          </Field>
          <Field label="Settlement cycle" required>
            <select value={form.settlementCycle} onChange={(e) => set('settlementCycle', e.target.value as ShopFormValues['settlementCycle'])} className={selectCls}>
              {SETTLEMENT_CYCLES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Minimum wallet balance (₹)" hint={`Platform default is ₹${PLATFORM_MIN_WALLET.toLocaleString('en-IN')}`}>
            <Input inputMode="numeric" value={form.walletMinBalance} onChange={(e) => set('walletMinBalance', e.target.value.replace(/\D/g, ''))} />
          </Field>
          <Field label="Note" className="md:col-span-3">
            <Input value={form.walletNote} onChange={(e) => set('walletNote', e.target.value)} placeholder="e.g. first top-up collected in cash on registration" maxLength={300} />
          </Field>
          <label className={cn(
            'md:col-span-3 flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer',
            form.walletAccepted ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-[#1B3B6F]/40',
          )}>
            <input type="checkbox" className="h-4 w-4 mt-0.5 accent-[#1B3B6F]" checked={form.walletAccepted} onChange={(e) => set('walletAccepted', e.target.checked)} />
            <span className="text-sm text-[#1A1D29]">
              <b>{form.ownerName.trim() || 'The owner'}</b> has understood and accepted the wallet rule, commission and settlement cycle above.
            </span>
          </label>
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button size="lg" className="bg-[#FF6B35] hover:bg-[#e55a28] text-white shadow-lg" onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Register shop
        </Button>
      </div>
    </div>
  )
}
