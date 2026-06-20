import { useState } from 'react'
import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import {
  Wrench, Snowflake, Disc3, BatteryCharging, Droplet, Paintbrush, Sparkles,
  LifeBuoy, Settings2, Car, Bike, Truck, Star, ShieldCheck, Clock, MapPin,
  User, CheckCircle2, ArrowRight, Search, Calendar, Phone, Zap,
} from 'lucide-react'

interface Service {
  name: string; desc: string; price: string; mrp: string; save: string; time: string
  icon: typeof Wrench; color: string; cat: string; rating: string; booked: string; pop: boolean
}

const SERVICES: Service[] = [
  { name: 'Periodic Service', desc: 'Complete 30-point inspection, oil change, filter clean & top-ups.', price: '2,499', mrp: '3,200', save: 'Save 22%', time: '3-4 hrs', icon: Wrench, color: 'bg-[#E8EEF7] text-[#1B3B6F]', cat: 'periodic', rating: '4.8', booked: '12.4k', pop: true },
  { name: 'AC Service & Gas Refill', desc: 'AC inspection, gas top-up, cooling coil clean & odour removal.', price: '1,799', mrp: '2,250', save: 'Save 20%', time: '2 hrs', icon: Snowflake, color: 'bg-[#EAF1FE] text-[#2563EB]', cat: 'ac', rating: '4.7', booked: '8.1k', pop: true },
  { name: 'Brake Service', desc: 'Brake pad check, fluid top-up, rotor inspection & adjustment.', price: '999', mrp: '1,300', save: 'Save 25%', time: '1-2 hrs', icon: Disc3, color: 'bg-[#E7F6F0] text-[#15936B]', cat: 'repairs', rating: '4.9', booked: '9.6k', pop: false },
  { name: 'Battery Replacement', desc: 'Genuine battery with old-battery buyback & free fitting.', price: '4,499', mrp: '5,200', save: 'Save 15%', time: '45 min', icon: BatteryCharging, color: 'bg-[#FEF3E2] text-[#D97706]', cat: 'repairs', rating: '4.8', booked: '5.3k', pop: false },
  { name: 'Oil Change', desc: 'Premium engine oil + filter replacement at your doorstep.', price: '599', mrp: '999', save: 'Save 40%', time: '45 min', icon: Droplet, color: 'bg-[#FFF1EB] text-[#FF6B35]', cat: 'periodic', rating: '4.9', booked: '15.2k', pop: true },
  { name: 'Denting & Painting', desc: 'Dent removal, primer & paint match with showroom finish.', price: '1,499', mrp: '2,100', save: 'Save 30%', time: '1 day', icon: Paintbrush, color: 'bg-[#F1EBFE] text-[#7C3AED]', cat: 'detailing', rating: '4.7', booked: '3.8k', pop: false },
  { name: 'Car Spa & Detailing', desc: 'Foam wash, interior vacuum, polish & ceramic coating options.', price: '899', mrp: '1,400', save: 'Save 35%', time: '2-3 hrs', icon: Sparkles, color: 'bg-[#E7F6F0] text-[#15936B]', cat: 'detailing', rating: '4.8', booked: '6.9k', pop: false },
  { name: 'Roadside Assistance', desc: '24/7 emergency help — jump-start, flat tyre, towing & fuel.', price: '499', mrp: '750', save: 'Save 33%', time: '30 min ETA', icon: LifeBuoy, color: 'bg-[#FFF1EB] text-[#FF6B35]', cat: 'emergency', rating: '4.9', booked: '4.2k', pop: true },
  { name: 'Wheel Alignment & Balancing', desc: 'Computerised alignment, balancing & tyre rotation.', price: '799', mrp: '1,100', save: 'Save 27%', time: '1 hr', icon: Settings2, color: 'bg-[#EAF1FE] text-[#2563EB]', cat: 'repairs', rating: '4.6', booked: '3.1k', pop: false },
]

const TABS: [string, string][] = [['all', 'All Services'], ['periodic', 'Periodic'], ['repairs', 'Repairs'], ['ac', 'AC & Cooling'], ['detailing', 'Detailing'], ['emergency', 'Emergency']]
const VEHICLES: [string, string, string][] = [['M', 'Maruti Suzuki', '#0d6efd'], ['H', 'Hyundai', '#1b3b6f'], ['T', 'Tata', '#1769aa'], ['M', 'Mahindra', '#b91c1c'], ['H', 'Honda', '#c1121f'], ['H', 'Hero', '#d97706'], ['R', 'Royal Enfield', '#1f2937']]
const TRUST = [
  { icon: User, color: 'bg-[#F2F6FC] text-[#1B3B6F]', title: 'Certified Mechanics', desc: 'ID-verified, trained & rated' },
  { icon: ShieldCheck, color: 'bg-[#E7F6F0] text-[#15936B]', title: 'Genuine Parts Only', desc: 'OEM with verifiable invoice' },
  { icon: Clock, color: 'bg-[#FFF1EB] text-[#FF6B35]', title: 'On-time, Live Tracked', desc: 'Know your mechanic ETA' },
  { icon: BatteryCharging, color: 'bg-[#F1EBFE] text-[#7C3AED]', title: 'Pay After Service', desc: 'Transparent, no hidden fees' },
]
const STEPS = [
  { icon: Search, title: 'Choose a service', desc: 'Pick from periodic, repairs or detailing' },
  { icon: Calendar, title: 'Pick a time slot', desc: 'Same-day or schedule for later' },
  { icon: User, title: 'Mechanic arrives', desc: 'Track them live to your doorstep' },
  { icon: BatteryCharging, title: 'Pay after service', desc: 'Rate your mechanic & relax' },
]
const VEH_TYPES: [string, typeof Car][] = [['Car', Car], ['Bike', Bike], ['SUV', Truck]]

export default function ServicesLandingPage() {
  const [cat, setCat] = useState('all')
  const [veh, setVeh] = useState('Car')
  const list = SERVICES.filter((s) => cat === 'all' || s.cat === cat)

  return (
    <>
      <SEOHead
        title="Book Car & Bike Service"
        description="Book certified mechanics for doorstep car and bike service. Transparent pricing, genuine parts, 30-day warranty, live tracking, pay after service."
      />
      <UserLayout>
        <div className="bg-white">
          {/* HERO + BOOKING */}
          <section className="relative overflow-hidden bg-gradient-to-br from-[#0F2547] via-[#1B3B6F] to-[#2A5298] text-white">
            <div className="absolute -top-20 -right-10 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,107,53,0.22),transparent_65%)] pointer-events-none" />
            <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 grid lg:grid-cols-[1.15fr_0.85fr] gap-9 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-[#FF6B35]/20 text-[#FFB199] ring-1 ring-[#FF6B35]/30 rounded-full px-3 py-1 text-xs font-bold mb-4">⚡ Doorstep service · Free pickup</span>
                <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">Expert car &amp; bike service, at your doorstep.</h1>
                <p className="mt-4 text-[#c8d4e8] text-base md:text-lg max-w-lg">Certified mechanics, genuine parts, and transparent pricing. Book in 60 seconds — we come to you.</p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {['30-day warranty', 'Pay after service', 'Live tracking'].map((p) => (
                    <span key={p} className="inline-flex items-center gap-1.5 bg-white/10 ring-1 ring-white/[0.16] px-3.5 py-2 rounded-full text-[13px] font-semibold"><CheckCircle2 className="h-3.5 w-3.5 text-[#FF6B35]" /> {p}</span>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-2xl p-6 text-[#13203A]">
                <h3 className="text-lg font-extrabold">Book a service</h3>
                <p className="text-[13px] text-[#7B8AA3] mb-4">सर्विस बुक करें · Takes 60 seconds</p>
                <label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">Vehicle type</label>
                <div className="flex gap-2.5 mb-3.5">
                  {VEH_TYPES.map(([label, Icon]) => {
                    const on = veh === label
                    return (
                      <button key={label} onClick={() => setVeh(label)} className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-[1.5px] text-[12.5px] font-bold transition-colors ${on ? 'border-[#1B3B6F] bg-[#F2F6FC] text-[#1B3B6F]' : 'border-[#E7ECF3] text-[#475569]'}`}>
                        <Icon className="h-6 w-6" /> {label}
                      </button>
                    )
                  })}
                </div>
                <label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">Brand &amp; model</label>
                <div className="flex items-center gap-2.5 h-12 border border-[#E7ECF3] rounded-xl px-3.5 bg-[#F6F8FB] text-sm text-[#475569] mb-3.5"><Car className="h-[18px] w-[18px] text-[#7B8AA3]" /> Maruti Suzuki Swift</div>
                <label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">Service location</label>
                <div className="flex items-center gap-2.5 h-12 border border-[#E7ECF3] rounded-xl px-3.5 bg-[#F6F8FB] text-sm text-[#475569] mb-4"><MapPin className="h-[18px] w-[18px] text-[#7B8AA3]" /> Detected automatically at booking</div>
                <Link href="/service" className="flex items-center justify-center gap-2 w-full bg-[#FF6B35] hover:bg-[#F2541B] text-white font-semibold py-3.5 rounded-full transition-colors">Check available slots <ArrowRight className="h-4 w-4" /></Link>
                <p className="text-center mt-3 text-xs text-[#7B8AA3]">🎙️ Or <Link href="/ai-booking" className="text-[#FF6B35] font-bold">book by voice</Link> in Hindi / English</p>
              </div>
            </div>
          </section>

          {/* TRUST ROW */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {TRUST.map((t) => (
                <div key={t.title} className="bg-white border border-[#E7ECF3] rounded-xl p-5 text-center shadow-sm">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${t.color}`}><t.icon className="h-[23px] w-[23px]" /></div>
                  <b className="block text-[15px] text-[#13203A] mb-1">{t.title}</b>
                  <span className="text-[12.5px] text-[#475569]">{t.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* CATALOG */}
          <section className="bg-[#F6F8FB]">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
              <div className="text-center mb-7">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF6B35]">Choose your service</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#13203A] mt-2">Popular services, transparent prices</h2>
                <p className="text-[#475569] mt-2 max-w-xl mx-auto text-sm">Up to 50% cheaper than authorised garages. Pay only after the job is done.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mb-7">
                {TABS.map(([k, label]) => (
                  <button key={k} onClick={() => setCat(k)} className={`px-4 py-2.5 rounded-full font-bold text-sm border transition-colors ${cat === k ? 'bg-[#1B3B6F] text-white border-[#1B3B6F]' : 'bg-white text-[#475569] border-[#E7ECF3] hover:border-[#1B3B6F]/40'}`}>{label}</button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {list.map((s) => (
                  <div key={s.name} className="relative bg-white border border-[#E7ECF3] rounded-2xl shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                    {s.pop && <span className="absolute top-0 right-5 bg-[#FF6B35] text-white text-[10.5px] font-extrabold px-2.5 py-1 rounded-b-lg">★ Most booked</span>}
                    <div className="px-5 pt-5 flex items-start justify-between">
                      <div className={`h-13 w-13 rounded-2xl flex items-center justify-center ${s.color}`} style={{ width: 52, height: 52 }}><s.icon className="h-[26px] w-[26px]" /></div>
                      <span className="text-[11px] font-extrabold text-[#15936B] bg-[#E7F6F0] px-2.5 py-1 rounded-md">{s.save}</span>
                    </div>
                    <div className="px-5 pt-3.5 pb-5 flex flex-col flex-1">
                      <h4 className="text-[17px] font-extrabold text-[#13203A]">{s.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#475569] my-2"><span className="text-[#F5A623]">★ {s.rating}</span><span className="text-[#7B8AA3] font-medium">· {s.booked} booked</span></div>
                      <p className="text-[13px] text-[#475569] leading-relaxed mb-3.5">{s.desc}</p>
                      <div className="flex gap-4 mb-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569]"><Clock className="h-3.5 w-3.5 text-[#1B3B6F]" /> {s.time}</div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569]"><ShieldCheck className="h-3.5 w-3.5 text-[#1B3B6F]" /> 30-day warranty</div>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-3.5 border-t border-[#EFF2F7]">
                        <div><small className="text-[11px] text-[#7B8AA3]">Starts at</small><b className="block text-[22px] text-[#1B3B6F] leading-none">₹{s.price}<span className="text-xs text-[#7B8AA3] line-through ml-1 font-normal">₹{s.mrp}</span></b></div>
                        <Link href="/service" className="bg-[#1B3B6F] hover:bg-[#15315C] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Book</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* VEHICLES */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
            <div className="text-center mb-6">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF6B35]">All makes, all models</span>
              <h2 className="text-2xl font-extrabold text-[#13203A] mt-2">Vehicles we service</h2>
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {VEHICLES.map(([m, name, c], i) => (
                <div key={`${name}-${i}`} className="flex items-center gap-2.5 bg-white border border-[#E7ECF3] rounded-full pl-2 pr-4 py-2 shadow-sm font-bold text-sm text-[#475569]">
                  <span className="h-[34px] w-[34px] rounded-full flex items-center justify-center text-white font-extrabold text-sm" style={{ background: c }}>{m}</span>{name}
                </div>
              ))}
              <div className="bg-[#F2F6FC] text-[#1B3B6F] font-extrabold rounded-full px-5 py-2.5 text-sm">+ 40 more brands</div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="bg-[#F6F8FB]">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
              <div className="text-center mb-10">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF6B35]">Simple process</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#13203A] mt-2">Booking in 4 easy steps</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {STEPS.map((s, i) => (
                  <div key={s.title} className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-[#E7ECF3] shadow flex items-center justify-center">
                      <span className="absolute -top-2 -right-2 w-[26px] h-[26px] rounded-full bg-[#FF6B35] text-white text-xs font-extrabold flex items-center justify-center border-[3px] border-white">{i + 1}</span>
                      <s.icon className="h-7 w-7 text-[#1B3B6F]" />
                    </div>
                    <h4 className="text-base font-bold text-[#13203A] mb-1">{s.title}</h4>
                    <p className="text-[13px] text-[#475569]">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* EMERGENCY CTA */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3B6F] to-[#0F2547] text-white p-8 md:p-12 text-center">
              <div className="absolute -top-16 right-0 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(255,107,53,0.25),transparent_65%)]" />
              <h2 className="relative text-2xl md:text-3xl font-extrabold">Need help right now?</h2>
              <p className="relative text-white/80 mt-2 max-w-xl mx-auto text-sm">Our 24/7 emergency roadside assistance reaches you in under 30 minutes across 40+ cities.</p>
              <div className="relative mt-6 flex gap-3 justify-center flex-wrap">
                <Link href="/emergency" className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#F2541B] text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors"><Zap className="h-4 w-4" /> Get emergency help</Link>
                <a href="tel:18001234567" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 ring-1 ring-white/25 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors"><Phone className="h-4 w-4" /> Call 1800-123-4567</a>
              </div>
            </div>
          </section>
        </div>
      </UserLayout>
    </>
  )
}
