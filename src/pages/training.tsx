import { useState } from 'react'
import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import {
  GraduationCap, Award, BadgeCheck, Wrench, Bike, Car, Zap, Clock,
  CheckCircle2, CreditCard, Star, ShieldCheck, ArrowRight, Search,
} from 'lucide-react'

const PROGRAMS = [
  {
    icon: Bike,
    title: 'Certified Two-Wheeler Technician',
    level: 'Foundation',
    duration: '30 days',
    modules: ['Engine & transmission basics', 'Brakes, clutch & suspension', 'Electrical & battery', 'Doorstep service workflow'],
  },
  {
    icon: Car,
    title: 'Certified Car Mechanic',
    level: 'Professional',
    duration: '45 days',
    modules: ['Petrol & diesel engines', 'AC, electrical & diagnostics', 'Brakes, steering & suspension', 'OBD scanning & reporting'],
  },
  {
    icon: Zap,
    title: 'EV Service Specialist',
    level: 'Advanced',
    duration: '30 days',
    modules: ['High-voltage safety', 'Battery & BMS diagnostics', 'Motor & controller service', 'Charging systems'],
  },
  {
    icon: Award,
    title: 'Master Technician',
    level: 'Expert',
    duration: '60 days',
    modules: ['Advanced diagnostics', 'Workshop & team management', 'Customer handling & quality', 'Bharat Mechanics standards'],
  },
]

const BENEFITS = [
  { icon: BadgeCheck, title: 'Verified Certificate', desc: 'Official certificate with a unique, verifiable ID.' },
  { icon: CreditCard, title: 'Photo ID Card', desc: 'Official Bharat Mechanics technician ID card.' },
  { icon: Star, title: 'Listed on Platform', desc: 'Your certified profile appears in the Certified Mechanics directory.' },
  { icon: Wrench, title: 'Priority Jobs', desc: 'Certified pros get doorstep jobs first.' },
]

// Demo certificate registry — replace with a backend verify API later.
const SAMPLE_CERTS: Record<string, { name: string; program: string; issued: string }> = {
  'BM-2W-100245': { name: 'Rahul Verma', program: 'Certified Two-Wheeler Technician', issued: 'Mar 2026' },
  'BM-CAR-100871': { name: 'Imran Shaikh', program: 'Certified Car Mechanic', issued: 'Apr 2026' },
  'BM-MT-100012': { name: 'Suresh Patel', program: 'Master Technician', issued: 'Feb 2026' },
}

export default function TrainingPage() {
  const [certId, setCertId] = useState('')
  const [result, setResult] = useState<null | { ok: boolean; data?: { name: string; program: string; issued: string } }>(null)

  const verify = (e: React.FormEvent) => {
    e.preventDefault()
    const key = certId.trim().toUpperCase()
    if (!key) return
    const found = SAMPLE_CERTS[key]
    setResult(found ? { ok: true, data: found } : { ok: false })
  }

  return (
    <>
      <SEOHead
        title="Training & Certification"
        description="Bharat Mechanics technician training and certification programs for two-wheeler, car, EV and master technicians."
        noIndex
      />
      <UserLayout>
        <div className="bg-[#F7F8FA] min-h-screen">
          {/* Hero */}
          <div className="bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] text-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 md:h-12 md:w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <span className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF8A5B]">Training &amp; Certification</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight max-w-2xl">Become a Bharat Mechanics Certified Technician</h1>
              <p className="mt-3 text-sm md:text-base text-white/80 max-w-2xl leading-relaxed">
                Hands-on training, real workshop practice, and a verifiable certificate that gets you listed on India&rsquo;s
                trusted doorstep service platform.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#programs" className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#FF7C49] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors">
                  View Programs <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#verify" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 ring-1 ring-white/25 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors">
                  Verify a Certificate
                </a>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-12 space-y-12">
            {/* Programs */}
            <section id="programs">
              <h2 className="text-xl md:text-2xl font-extrabold text-[#0F2545]">Certification Programs</h2>
              <p className="text-sm text-gray-500 mt-1 mb-6">Choose a track based on your experience and the vehicles you want to service.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {PROGRAMS.map((p) => (
                  <div key={p.title} className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-5 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-xl bg-[#1B3B6F]/[0.08] text-[#1B3B6F] flex items-center justify-center">
                        <p.icon className="h-6 w-6" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FF6B35]/10 text-[#FF6B35]">{p.level}</span>
                    </div>
                    <h3 className="mt-4 text-base md:text-lg font-bold text-[#0F2545]">{p.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1"><Clock className="h-3.5 w-3.5" /> {p.duration} &middot; certificate on completion</div>
                    <ul className="mt-4 space-y-2">
                      {p.modules.map((m) => (
                        <li key={m} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Benefits */}
            <section>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#0F2545] mb-6">What you earn</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-5">
                    <div className="h-11 w-11 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center mb-3">
                      <b.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-sm text-[#0F2545]">{b.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Verify */}
            <section id="verify">
              <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-[#1B3B6F]" />
                  <h2 className="text-lg md:text-xl font-extrabold text-[#0F2545]">Verify a Certificate</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">Enter the certificate ID printed on the certificate or technician ID card.</p>
                <form onSubmit={verify} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={certId}
                      onChange={(e) => { setCertId(e.target.value); setResult(null) }}
                      placeholder="e.g. BM-CAR-100871"
                      className="w-full pl-10 pr-3 h-11 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B6F]/30"
                    />
                  </div>
                  <button type="submit" className="h-11 px-6 rounded-lg bg-[#1B3B6F] hover:bg-[#152d55] text-white text-sm font-semibold transition-colors">Verify</button>
                </form>
                {result && (
                  <div className={`mt-4 rounded-xl p-4 text-sm ${result.ok ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                    {result.ok && result.data ? (
                      <div className="flex items-start gap-2">
                        <BadgeCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold">Valid certificate</p>
                          <p className="mt-0.5">{result.data.name} &mdash; {result.data.program} &middot; Issued {result.data.issued}</p>
                        </div>
                      </div>
                    ) : (
                      <p>No certificate found for that ID. Please check and try again.</p>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-3">Try a sample:{' '}
                  <button type="button" onClick={() => { setCertId('BM-CAR-100871'); setResult(null) }} className="underline">BM-CAR-100871</button>
                </p>
              </div>
            </section>

            {/* CTA */}
            <section>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3B6F] to-[#0F2545] text-white p-6 md:p-10">
                <h2 className="text-xl md:text-2xl font-extrabold">Ready to get certified?</h2>
                <p className="text-sm text-white/80 mt-2 max-w-xl">Apply now, train with experts, and start earning doorstep jobs as a Bharat Mechanics certified technician.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/shop-partner/login" className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#FF7C49] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors">Apply for Training <ArrowRight className="h-4 w-4" /></Link>
                  <Link href="/mechanics" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 ring-1 ring-white/25 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors">See Certified Mechanics</Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </UserLayout>
    </>
  )
}
