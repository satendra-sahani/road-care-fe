import { useEffect, useState } from 'react'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { GpsOrderFlow } from '@/components/tracker/GpsOrderFlow'
import { userTrackerAPI } from '@/services/api'
import {
  MapPin, Power, Bell, Route, Cpu, ShieldOff,
  Check, ArrowRight, Satellite, Smartphone, ShoppingCart,
} from 'lucide-react'

const FEATURES = [
  { icon: MapPin, title: 'Live location, 24×7', desc: 'Real-time GPS position of your vehicle, right on your phone — anytime.', color: 'bg-[#E7F6F0] text-[#15936B]' },
  { icon: Power, title: 'Remote engine cut-off', desc: 'Stolen or misused? Immobilise the vehicle safely from the app.', color: 'bg-[#FEECEC] text-[#DC2626]' },
  { icon: Bell, title: 'Geo-fence & alerts', desc: 'Get pinged on movement, over-speed and boundary breaches.', color: 'bg-[#FFF1EB] text-[#FF6B35]' },
  { icon: Route, title: 'Trip history', desc: 'Every route, stop and distance — replayable on the map.', color: 'bg-[#EAF1FE] text-[#2563EB]' },
  { icon: Cpu, title: 'SIM + cloud included', desc: 'Pre-fitted SIM and cloud connectivity — nothing else to buy.', color: 'bg-[#F1EBFE] text-[#7C3AED]' },
  { icon: ShieldOff, title: 'Tamper alerts', desc: 'Know the instant the device is unplugged or disturbed.', color: 'bg-[#FEF3E2] text-[#D97706]' },
]

const STEPS = [
  { n: '1', title: 'Order the device', desc: 'One-time all-inclusive price. We provision the SIM and cloud for you.' },
  { n: '2', title: 'We configure & ship', desc: 'Our team activates and dispatches your tracker, ready to fit.' },
  { n: '3', title: 'Fit & wire it', desc: 'A quick install on your vehicle by you or any technician.' },
  { n: '4', title: 'Track live', desc: 'Open the app — live location, alerts and engine cut-off are on.' },
]

const fmtInr = (n: number) => Number(n || 0).toLocaleString('en-IN')

export default function TrackerPage() {
  const [ordering, setOrdering] = useState(false)
  // Live device pricing (admin-editable). Guests aren't logged in, so a 401
  // simply keeps these defaults — which mirror the backend's launch offer.
  const [price, setPrice] = useState({ payToday: 2999, originalPrice: 10995, serviceMonthly: 99 })
  useEffect(() => {
    userTrackerAPI.getDeviceConfig()
      .then((r) => { if (r.data?.success && r.data.data) setPrice((p) => ({ ...p, ...r.data.data })) })
      .catch(() => { /* guest / offline — keep defaults */ })
  }, [])

  return (
    <>
      <SEOHead
        title="GPS Vehicle Tracker — Live Location & Engine Cut-off | Bharat Mechanics"
        description="Track your vehicle live 24×7, get theft & geo-fence alerts, and remotely cut the engine. Bharat Mechanics GPS Tracker — ₹1,999 device + ₹99/month, SIM & cloud included."
      />
      <UserLayout>
        <div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-6">
          {/* ─── Hero ─── */}
          <section
            className="relative overflow-hidden rounded-2xl md:rounded-[26px] ring-1 ring-white/10 shadow-[0_18px_54px_-18px_rgba(15,37,71,0.6)]"
            style={{ background: 'linear-gradient(120deg,#0E2042 0%,#1B3B6F 55%,#173461 100%)' }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="pointer-events-none absolute -right-16 -top-16 w-72 h-72 bg-[#6EE7B7]/[0.16] rounded-full blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.9) 0.8px,transparent 0.8px)', backgroundSize: '16px 16px' }} />

            <div className="relative px-5 py-8 md:px-10 md:py-12 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] ring-1 ring-white/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6EE7B7]">
                <Satellite className="h-3.5 w-3.5" /> GPS · 24×7 Live
              </span>
              <h1 className="mt-4 text-white font-extrabold tracking-[-0.02em] text-[28px] md:text-[40px] leading-[1.08]">
                Live Vehicle <span className="text-[#6EE7B7]">Tracker</span>
              </h1>
              <p className="mt-3 text-white/70 text-[14px] md:text-[16px] font-medium max-w-2xl leading-relaxed">
                Track your vehicle in real time, get theft &amp; geo-fence alerts, and cut the engine
                remotely — from anywhere. SIM &amp; cloud included, no hidden charges.
              </p>

              {/* Pricing pills — live admin-set pricing */}
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-baseline gap-1.5 rounded-xl bg-white/[0.08] ring-1 ring-white/10 px-3.5 py-2 text-white">
                  <span className="text-[19px] font-extrabold">₹{fmtInr(price.payToday)}</span>
                  {price.originalPrice > price.payToday && (
                    <span className="text-[12px] font-bold text-white/45 line-through">₹{fmtInr(price.originalPrice)}</span>
                  )}
                  <span className="text-[11.5px] text-white/60 font-semibold">one-time device</span>
                </span>
                <span className="inline-flex items-baseline gap-1.5 rounded-xl bg-white/[0.08] ring-1 ring-white/10 px-3.5 py-2 text-white">
                  <span className="text-[19px] font-extrabold">₹{fmtInr(price.serviceMonthly)}</span>
                  <span className="text-[11.5px] text-white/60 font-semibold">/ month service</span>
                </span>
                {price.originalPrice > price.payToday && (
                  <span className="inline-flex items-center rounded-xl bg-[#6EE7B7]/15 ring-1 ring-[#6EE7B7]/30 px-3 py-2 text-[11.5px] font-extrabold text-[#6EE7B7]">SAVE ₹{fmtInr(price.originalPrice - price.payToday)}</span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => setOrdering(true)} className="inline-flex items-center gap-2 bg-[#6EE7B7] hover:bg-white text-[#052E2B] font-bold px-5 py-2.5 rounded-full text-[13.5px] transition-colors">
                  <ShoppingCart className="h-4 w-4" /> Order now <ArrowRight className="h-4 w-4" />
                </button>
                <span className="inline-flex items-center gap-2 text-white/70 text-[12.5px] font-semibold px-2 py-2.5">
                  <Smartphone className="h-4 w-4 text-[#6EE7B7]" /> Also on the Bharat Mechanics app
                </span>
              </div>
            </div>
          </section>

          {/* ─── Features ─── */}
          <h2 className="mt-8 md:mt-10 text-[#13203A] font-extrabold text-[20px] md:text-[24px] tracking-[-0.01em]">Everything the tracker does</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-4 md:p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${f.color}`}><f.icon className="h-5 w-5" /></div>
                <div className="mt-3 font-bold text-[15px] text-[#13203A]">{f.title}</div>
                <p className="mt-1 text-[13px] text-[#5B6B85] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* ─── How it works ─── */}
          <h2 className="mt-8 md:mt-10 text-[#13203A] font-extrabold text-[20px] md:text-[24px] tracking-[-0.01em]">How you get set up</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {STEPS.map((s) => (
              <div key={s.n} className="relative bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-4 md:p-5">
                <div className="h-8 w-8 rounded-full bg-[#0F2545] text-white font-extrabold text-sm flex items-center justify-center">{s.n}</div>
                <div className="mt-3 font-bold text-[14.5px] text-[#13203A]">{s.title}</div>
                <p className="mt-1 text-[12.5px] text-[#5B6B85] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* ─── CTA strip ─── */}
          <div className="mt-8 md:mt-10 rounded-2xl bg-[#0F2545] text-white px-5 py-6 md:px-8 md:py-7 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="font-extrabold text-[18px] md:text-[20px]">Secure your ride today</div>
              <p className="text-white/65 text-[13px] mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#6EE7B7]" /> Theft protection</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#6EE7B7]" /> Engine cut-off</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#6EE7B7]" /> Family safety</span>
              </p>
            </div>
            <button onClick={() => setOrdering(true)} className="inline-flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#F2541B] text-white font-bold px-5 py-3 rounded-full text-[14px] transition-colors shrink-0">
              <ShoppingCart className="h-4 w-4" /> Order now — ₹{fmtInr(price.payToday)}
            </button>
          </div>
        </div>

        {ordering && <GpsOrderFlow onClose={() => setOrdering(false)} />}
      </UserLayout>
    </>
  )
}
