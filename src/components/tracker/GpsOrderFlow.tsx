'use client'

// GPS tracker order flow — web mirror of the app's GpsPlans screen.
// Steps: 1 offer/price → 2 vehicle details → 3 pay (Razorpay, or pay on
// installation) → 4 done. Requires login (the login modal opens first for
// guests, then the flow resumes). Uses the SAME backend endpoints as the app:
// device-config / vehicle-qr / device-order / device-verify / request-device.
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import Link from 'next/link'
import { userTrackerAPI, userVehicleQrAPI } from '@/services/api'
import { useLoginModal } from '@/components/auth/LoginModalProvider'
import type { RootState } from '@/store'
import {
  MapPin, X, Loader2, ArrowRight, Check, ShieldCheck, Satellite,
  IndianRupee, Wallet, CreditCard, PackageCheck,
} from 'lucide-react'

interface DeviceCfg {
  name: string; devicePrice: number; originalPrice: number
  serviceMonthly: number; gstPercent: number; gst: number; payToday: number
}
const DEFAULT_CFG: DeviceCfg = { name: 'GPS Tracker', devicePrice: 2999, originalPrice: 10995, serviceMonthly: 99, gstPercent: 18, gst: 0, payToday: 2999 }

const VEH_TYPES = [
  { type: 'Bike', em: '🏍️' },
  { type: 'Scooter', em: '🛵' },
  { type: 'Car', em: '🚗' },
  { type: 'Auto', em: '🛺' },
  { type: 'Truck', em: '🚚' },
]

const fmtInr = (n: number) => Number(n || 0).toLocaleString('en-IN')

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export function GpsOrderFlow({ onClose }: { onClose: () => void }) {
  const { openLogin } = useLoginModal()
  const isAuthenticated = useSelector((s: RootState) => s.customerAuth?.isAuthenticated)
  const loggedIn = isAuthenticated || (typeof window !== 'undefined' && !!Cookies.get('customer_token'))

  const [step, setStep] = useState(1) // 1 offer · 2 vehicle · 3 pay · 4 done
  const [cfg, setCfg] = useState<DeviceCfg>(DEFAULT_CFG)
  const [name, setName] = useState('')
  const [plate, setPlate] = useState('')
  const [vtype, setVtype] = useState('Bike')
  const [vehicleId, setVehicleId] = useState('')
  const [busy, setBusy] = useState(false)
  const [paidNow, setPaidNow] = useState(false)

  useEffect(() => {
    userTrackerAPI.getDeviceConfig()
      .then((r) => { if (r.data?.success && r.data.data) setCfg({ ...DEFAULT_CFG, ...r.data.data }) })
      .catch(() => { /* keep defaults */ })
  }, [])

  const start = () => {
    if (!loggedIn) { openLogin(() => setStep(2)); return }
    setStep(2)
  }

  const canSaveVehicle = name.trim().length >= 2 && plate.trim().length >= 4

  const saveVehicle = async () => {
    if (!canSaveVehicle || busy) return
    setBusy(true)
    try {
      const em = VEH_TYPES.find((v) => v.type === vtype)?.em || '🚗'
      const r = await userVehicleQrAPI.register({ name: name.trim(), plate: plate.trim().toUpperCase(), type: vtype, em })
      const id = r.data?.data?._id || r.data?.data?.id
      if (r.data?.success && id) { setVehicleId(String(id)); setStep(3) }
      else toast.error(r.data?.message || 'Could not add vehicle. Try again.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not add vehicle. Try again.')
    } finally { setBusy(false) }
  }

  // Pay now via Razorpay → verify → placed (paid).
  const payAndPlace = async () => {
    if (!vehicleId || busy) return
    setBusy(true)
    try {
      const orderRes = await userTrackerAPI.deviceOrder(vehicleId)
      const rzp = orderRes.data?.data?.razorpay
      const ok = await loadRazorpay()
      if (!rzp?.orderId || !ok || !(window as any).Razorpay) {
        toast.error('Payment is unavailable right now — use "Pay on installation" instead')
        setBusy(false)
        return
      }
      const rz = new (window as any).Razorpay({
        key: rzp.keyId,
        order_id: rzp.orderId,
        amount: rzp.amount,
        currency: rzp.currency || 'INR',
        name: 'Bharat Mechanics',
        image: 'https://bharatmechanics.com/favicon.png',
        description: `${cfg.name} · ₹${fmtInr(cfg.payToday)}`,
        theme: { color: '#1B3B6F' },
        handler: async (payRes: any) => {
          try {
            const vr = await userTrackerAPI.deviceVerify({
              vehicleId,
              razorpayOrderId: payRes.razorpay_order_id,
              razorpayPaymentId: payRes.razorpay_payment_id,
              razorpaySignature: payRes.razorpay_signature,
            })
            if (vr.data?.success) { setPaidNow(true); setStep(4) }
            else toast.error(vr.data?.message || 'Payment verification failed')
          } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Payment verification failed')
          } finally { setBusy(false) }
        },
        modal: { ondismiss: () => { setBusy(false); toast.message('Payment cancelled — nothing was charged') } },
      })
      rz.open()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not start the payment')
      setBusy(false)
    }
  }

  // Pay on installation → request placed (unpaid).
  const requestOnly = async () => {
    if (!vehicleId || busy) return
    setBusy(true)
    try {
      const r = await userTrackerAPI.requestDevice(vehicleId)
      if (r.data?.success) { setPaidNow(false); setStep(4) }
      else toast.error(r.data?.message || 'Could not place the request')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not place the request')
    } finally { setBusy(false) }
  }

  const savings = Math.max(0, (cfg.originalPrice || 0) - (cfg.payToday || 0))

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="relative overflow-hidden rounded-t-3xl px-5 pb-5 pt-5 text-white sm:rounded-t-3xl" style={{ background: 'linear-gradient(120deg,#0E2042,#1B3B6F 60%,#2a55a0)' }}>
          <button onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white"><X className="h-4 w-4" /></button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#6EE7B7]">
            <Satellite className="h-3.5 w-3.5" /> GPS Tracker
          </span>
          <h2 className="mt-2 text-xl font-extrabold">{step === 4 ? 'Order placed! 🎉' : 'Order your GPS Tracker'}</h2>
          {step < 4 && (
            <div className="mt-2 flex items-center gap-1.5">
              {[1, 2, 3].map((n) => (
                <span key={n} className={`h-1.5 rounded-full transition-all ${step >= n ? 'w-8 bg-[#6EE7B7]' : 'w-4 bg-white/25'}`} />
              ))}
            </div>
          )}
        </div>

        <div className="p-5">
          {/* ── Step 1 · Offer ── */}
          {step === 1 && (
            <>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#0F2545]">₹{fmtInr(cfg.payToday)}</span>
                  {savings > 0 && <span className="text-sm font-bold text-slate-400 line-through">₹{fmtInr(cfg.originalPrice)}</span>}
                  {savings > 0 && <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-extrabold text-emerald-700">SAVE ₹{fmtInr(savings)}</span>}
                </div>
                <p className="mt-1 text-[12.5px] font-semibold text-slate-500">All-inclusive device price · + ₹{fmtInr(cfg.serviceMonthly)}/month service</p>
              </div>
              <div className="mt-4 space-y-2.5">
                {['Live location 24×7 on app & website', 'Remote engine cut-off', 'Theft, over-speed & geo-fence alerts', 'SIM + cloud included — no hidden charges', 'Trip history with route replay'].map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-[13.5px] font-semibold text-slate-700">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-3 w-3" strokeWidth={3} /></span>
                    {f}
                  </div>
                ))}
              </div>
              <button onClick={start} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] font-extrabold text-white transition-colors hover:bg-[#F2541B]">
                Order now <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Secure payment · Configured &amp; shipped by our team
              </p>
            </>
          )}

          {/* ── Step 2 · Vehicle ── */}
          {step === 2 && (
            <>
              <p className="text-[13px] font-bold text-slate-600">Which vehicle is this tracker for?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {VEH_TYPES.map((v) => (
                  <button key={v.type} onClick={() => setVtype(v.type)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[13px] font-bold transition-colors ${vtype === v.type ? 'border-[#1B3B6F] bg-[#1B3B6F]/[0.06] text-[#1B3B6F]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <span className="text-base">{v.em}</span> {v.type}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vehicle name (e.g. Platina, Swift)"
                  className="h-12 w-full rounded-xl border-[1.5px] border-slate-200 px-4 text-[15px] font-semibold text-[#0F2545] outline-none focus:border-[#1B3B6F]" />
                <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="Number plate (e.g. UP52 AB 1234)" maxLength={14}
                  className="h-12 w-full rounded-xl border-[1.5px] border-slate-200 px-4 text-[15px] font-extrabold tracking-widest text-[#0F2545] outline-none focus:border-[#1B3B6F]" />
              </div>
              <button onClick={saveVehicle} disabled={!canSaveVehicle || busy}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B3B6F] font-extrabold text-white transition-colors hover:bg-[#16305c] disabled:opacity-50">
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Continue
              </button>
            </>
          )}

          {/* ── Step 3 · Pay ── */}
          {step === 3 && (
            <>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-[13.5px] font-semibold text-slate-600">
                  <span>{cfg.name} ({vtype} · {plate})</span>
                  <span className="font-extrabold text-[#0F2545]">₹{fmtInr(cfg.payToday)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[12px] font-semibold text-slate-400">
                  <span>Monthly service (starts after installation)</span>
                  <span>₹{fmtInr(cfg.serviceMonthly)}/mo</span>
                </div>
              </div>
              <button onClick={payAndPlace} disabled={busy}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1BA672] font-extrabold text-white transition-colors hover:bg-[#15925f] disabled:opacity-60">
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-4 w-4" />} Pay ₹{fmtInr(cfg.payToday)} now
              </button>
              <button onClick={requestOnly} disabled={busy}
                className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-slate-200 bg-white font-extrabold text-[#1B3B6F] transition-colors hover:bg-slate-50 disabled:opacity-60">
                <Wallet className="h-4 w-4" /> Pay on installation
              </button>
              <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">Either way, our team configures &amp; ships the device to you.</p>
            </>
          )}

          {/* ── Step 4 · Done ── */}
          {step === 4 && (
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><PackageCheck className="h-8 w-8" /></div>
              <h3 className="mt-3 text-lg font-extrabold text-[#0F2545]">GPS order placed for {name || 'your vehicle'}</h3>
              <p className="mt-1 text-[13px] font-semibold text-slate-500">
                {paidNow
                  ? <>Payment of <b className="inline-flex items-center"><IndianRupee className="h-3 w-3" />{fmtInr(cfg.payToday)}</b> received. Our team will configure &amp; ship your device.</>
                  : 'Request placed — pay when the device is installed. Our team will configure & ship it.'}
              </p>
              <Link href="/orders"
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B3B6F] font-extrabold text-white transition-colors hover:bg-[#16305c]">
                <MapPin className="h-4 w-4" /> Track order status
              </Link>
              <button onClick={onClose} className="mt-2 h-10 w-full text-[13px] font-bold text-slate-500">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
