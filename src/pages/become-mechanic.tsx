import { useState } from 'react'
import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { partnerAPI } from '@/services/api'
import {
  Banknote, MapPin, ShieldCheck, GraduationCap, Package, Headphones,
  CheckCircle2, ArrowRight,
} from 'lucide-react'

const BENEFITS = [
  { icon: Banknote, color: 'bg-emerald-50 text-emerald-600', title: 'Instant payouts', desc: 'Money in your bank within 24 hours of completing a job. No waiting, no middlemen.' },
  { icon: MapPin, color: 'bg-[#F2F6FC] text-[#1B3B6F]', title: 'Jobs near you', desc: 'Get matched with customers in your area. Choose jobs that fit your schedule.' },
  { icon: ShieldCheck, color: 'bg-[#FFF1EB] text-[#FF6B35]', title: 'Verified badge', desc: 'Build trust with a verified profile, ratings, and reviews that bring repeat customers.' },
  { icon: GraduationCap, color: 'bg-[#F1EBFE] text-[#7C3AED]', title: 'Free training', desc: 'Upskill with certification courses and earn more with higher-value service tiers.' },
  { icon: Package, color: 'bg-[#EAF1FE] text-[#2563EB]', title: 'Parts at wholesale', desc: 'Source genuine parts at partner prices, delivered straight to your job site.' },
  { icon: Headphones, color: 'bg-[#FEF3E2] text-[#D97706]', title: '24/7 support', desc: 'Dedicated partner helpline in Hindi & English for payments, disputes, and help.' },
]

const STEPS = [
  { n: 1, title: 'Apply online', desc: 'Fill a 2-minute form with your details, skills, and the area you work in.' },
  { n: 2, title: 'Get verified', desc: 'We verify your ID, documents, and a quick skills check. Most approvals in 48 hours.' },
  { n: 3, title: 'Start earning', desc: 'Accept jobs from the partner app, complete them, and get paid instantly.' },
]

const STORIES = [
  { initials: 'RK', color: 'bg-[#1B3B6F]', name: 'Ramesh Kumar', role: 'Car mechanic · Indore', quote: 'Pehle din bhar customer dhoondhta tha. Ab app pe roz 5-6 jobs aate hain. Income double ho gayi.', amount: '₹58k' },
  { initials: 'SP', color: 'bg-[#FF6B35]', name: 'Sunil Pawar', role: 'Two-wheeler · Nagpur', quote: 'The free training course helped me clear the AC specialist tier. Now I get higher-paying jobs every week.', amount: '₹42k' },
  { initials: 'AK', color: 'bg-[#15936B]', name: 'Arjun K.', role: 'Multi-skill · Bhopal', quote: 'Instant payout is the best part, paisa same day bank mein. No more waiting for customers to pay.', amount: '₹65k' },
]

const CHECKS: [string, string][] = [
  ['Zero joining fee', 'Free registration, forever'],
  ['Guaranteed jobs', 'Steady flow of customers nearby'],
  ['Free uniform & toolkit', 'Starter kit on your first 10 jobs'],
  ['Insurance cover', 'Accident & job protection included'],
]

const fmt = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export default function BecomeMechanicPage() {
  const [jobs, setJobs] = useState(7)
  const [form, setForm] = useState({ name: '', phone: '', city: '', exp: '1–3 years', spec: 'Car / four-wheeler mechanic', id: '' })
  const [submitted, setSubmitted] = useState(false)

  const monthly = jobs * 4.3
  const pay = monthly * 1450
  const bonus = pay * 0.15
  const tips = monthly * 46
  const total = pay + bonus + tips
  const pct = Math.round((total / 38000 - 1) * 100)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <>
      <SEOHead
        title="Become a Mechanic Partner"
        description="Join 5,000+ verified mechanics on Bharat Mechanics. Guaranteed jobs, instant payouts, free training and zero customer-hunting."
      />
      <UserLayout>
        <div className="bg-white">
          {/* HERO */}
          <section className="relative overflow-hidden bg-gradient-to-br from-[#0F2547] via-[#1B3B6F] to-[#2A5298] text-white">
            <div className="absolute -top-24 -left-10 w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(255,107,53,0.2),transparent_64%)] pointer-events-none" />
            <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-[#FF6B35]/20 text-[#FFB199] ring-1 ring-[#FF6B35]/30 rounded-full px-3 py-1 text-xs font-bold mb-4">🔧 Partner with Bharat Mechanics</span>
                <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08]">Turn your skills into a <span className="text-[#FF6B35]">steady income.</span></h1>
                <p className="mt-4 text-[#c8d4e8] text-base md:text-lg max-w-lg">Join 5,000+ verified mechanics earning more with guaranteed jobs, instant payouts, and zero customer-hunting.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#apply" className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#F2541B] text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors">Apply now &mdash; it&rsquo;s free <ArrowRight className="h-4 w-4" /></a>
                  <Link href="/training" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 ring-1 ring-white/25 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors">Get certified first</Link>
                </div>
                <div className="mt-8 flex gap-8">
                  {[['₹45,000', 'Avg. monthly earnings'], ['5,000+', 'Active mechanics'], ['40+', 'Cities live']].map(([v, l]) => (
                    <div key={l}><div className="text-2xl md:text-3xl font-extrabold">{v}</div><div className="text-[12.5px] text-[#9fb2d4]">{l}</div></div>
                  ))}
                </div>
              </div>

              {/* Earnings calculator */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-7 text-[#13203A]">
                <div className="text-[13px] text-[#7B8AA3] font-semibold">Estimate your monthly earnings</div>
                <div className="text-4xl md:text-[42px] font-extrabold text-[#1B3B6F] tracking-tight mt-1">{fmt(total)}</div>
                <div className="text-[13px] font-bold text-[#15936B] mb-4">{pct > 0 ? `▲ ${pct}% more` : 'On par with'} than local garage average</div>
                <div className="flex justify-between text-xs font-semibold text-[#475569] mb-1.5"><span>Jobs per week</span><span className="text-[#1B3B6F] font-extrabold">{jobs}</span></div>
                <input type="range" min={2} max={14} value={jobs} onChange={(e) => setJobs(Number(e.target.value))} className="w-full accent-[#FF6B35] cursor-pointer" />
                <div className="flex justify-between text-[11px] text-[#7B8AA3] mt-0.5"><span>Part-time</span><span>Full-time</span></div>
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[13.5px]"><span className="text-[#475569]">Service payouts</span><b>{fmt(pay)}</b></div>
                  <div className="flex items-center justify-between text-[13.5px]"><span className="text-[#475569]">Incentives &amp; bonuses</span><b className="text-[#15936B]">+{fmt(bonus)}</b></div>
                  <div className="flex items-center justify-between text-[13.5px]"><span className="text-[#475569]">Customer tips</span><b className="text-[#15936B]">+{fmt(tips)}</b></div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#EFF2F7]"><b>Total / month</b><b className="text-[#1B3B6F] text-[17px]">{fmt(total)}</b></div>
                </div>
                <a href="#apply" className="mt-4 flex items-center justify-center gap-2 w-full bg-[#FF6B35] hover:bg-[#F2541B] text-white font-semibold py-3 rounded-full text-sm transition-colors">Start earning <ArrowRight className="h-4 w-4" /></a>
              </div>
            </div>
          </section>

          {/* BENEFITS */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF6B35]">Why partner with us</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#13203A] mt-2">Everything you need to grow</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="bg-white border border-[#E7ECF3] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${b.color}`}><b.icon className="h-6 w-6" /></div>
                  <h4 className="font-bold text-[#13203A] mb-1.5">{b.title}</h4>
                  <p className="text-sm text-[#475569] leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* STEPS */}
          <section className="bg-[#F6F8FB]">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
              <div className="text-center mb-9">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF6B35]">Get started</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#13203A] mt-2">Onboard in 3 simple steps</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {STEPS.map((s) => (
                  <div key={s.n} className="bg-white border border-[#E7ECF3] rounded-2xl p-6 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-[#1B3B6F] text-white font-extrabold flex items-center justify-center mb-4">{s.n}</div>
                    <h4 className="text-lg font-bold text-[#13203A] mb-2">{s.title}</h4>
                    <p className="text-sm text-[#475569] leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* STORIES */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF6B35]">Partner stories</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#13203A] mt-2">Mechanics growing with us</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {STORIES.map((s) => (
                <div key={s.name} className="bg-white border border-[#E7ECF3] rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className={`h-11 w-11 rounded-full ${s.color} text-white font-extrabold flex items-center justify-center shrink-0`}>{s.initials}</div>
                    <div className="min-w-0"><b className="block text-sm leading-tight text-[#13203A]">{s.name}</b><span className="text-xs text-[#7B8AA3]">{s.role}</span></div>
                    <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] font-extrabold text-[#15936B] bg-[#E7F6F0] px-2.5 py-1 rounded-full shrink-0"><CheckCircle2 className="h-3 w-3" /> Verified</span>
                  </div>
                  <p className="text-sm text-[#13203A] leading-relaxed mb-4">&ldquo;{s.quote}&rdquo;</p>
                  <div className="flex items-center justify-between pt-3.5 border-t border-[#EFF2F7]">
                    <div><b className="text-xl text-[#1B3B6F]">{s.amount}</b><span className="text-[11.5px] text-[#7B8AA3] ml-1">/month now</span></div>
                    <div className="text-[#F5A623] tracking-tight">★★★★★</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* APPLY */}
          <section id="apply" className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
              <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-lg p-6 md:p-8">
                {submitted ? (
                  <div className="text-center py-10">
                    <div className="h-14 w-14 rounded-full bg-[#E7F6F0] text-[#15936B] flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="h-7 w-7" /></div>
                    <h3 className="text-xl font-extrabold text-[#13203A]">Application received!</h3>
                    <p className="text-sm text-[#475569] mt-2 max-w-sm mx-auto">Thanks {form.name || 'partner'} — our team will call you on {form.phone || 'your number'} within 48 hours to verify and onboard you.</p>
                  </div>
                ) : (
                  <form onSubmit={async (e) => { e.preventDefault(); try { await partnerAPI.apply({ type: 'mechanic', name: form.name, phone: form.phone, city: form.city, experience: form.exp, specialisation: form.spec, idNumber: form.id }) } catch {} setSubmitted(true) }}>
                    <h3 className="text-2xl font-extrabold text-[#13203A] mb-1">Apply to become a partner</h3>
                    <p className="text-[#7B8AA3] text-sm mb-5">पार्टनर बनें — Free registration, no joining fee.</p>
                    <div className="grid sm:grid-cols-2 gap-3.5">
                      <Field label="Full name"><input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ramesh Kumar" className={inputCls} /></Field>
                      <Field label="Mobile number"><input required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" className={inputCls} /></Field>
                      <Field label="City"><input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Indore" className={inputCls} /></Field>
                      <Field label="Years of experience">
                        <select value={form.exp} onChange={(e) => set('exp', e.target.value)} className={inputCls}>
                          <option>Less than 1 year</option><option>1–3 years</option><option>3–5 years</option><option>5+ years</option>
                        </select>
                      </Field>
                      <Field label="Specialisation" full>
                        <select value={form.spec} onChange={(e) => set('spec', e.target.value)} className={inputCls}>
                          <option>Two-wheeler mechanic</option><option>Car / four-wheeler mechanic</option><option>AC &amp; electrical specialist</option><option>Denting &amp; painting</option><option>All-round / multi-skill</option>
                        </select>
                      </Field>
                      <Field label="Aadhaar / ID number (for verification)" full><input value={form.id} onChange={(e) => set('id', e.target.value)} placeholder="XXXX XXXX XXXX" className={inputCls} /></Field>
                    </div>
                    <button type="submit" className="mt-3 flex items-center justify-center gap-2 w-full bg-[#FF6B35] hover:bg-[#F2541B] text-white font-semibold py-3.5 rounded-full transition-colors">Submit application <ArrowRight className="h-4 w-4" /></button>
                    <p className="text-center text-xs text-[#7B8AA3] mt-3">By applying you agree to our Partner Terms &amp; background verification.</p>
                  </form>
                )}
              </div>
              <div className="bg-gradient-to-b from-[#1B3B6F] to-[#2A5298] rounded-2xl p-6 md:p-8 text-white">
                <h3 className="text-[22px] font-extrabold mb-2">What you&rsquo;ll get</h3>
                <p className="text-[#c8d4e8] text-sm mb-6">Join India&rsquo;s fastest-growing mechanic network.</p>
                {CHECKS.map(([t, d]) => (
                  <div key={t} className="flex gap-3 items-start mb-4">
                    <div className="h-[26px] w-[26px] rounded-lg bg-white/[0.14] flex items-center justify-center shrink-0"><CheckCircle2 className="h-3.5 w-3.5 text-[#5fd6aa]" /></div>
                    <div><b className="block text-[14.5px]">{t}</b><span className="text-[12.5px] text-[#9fb2d4]">{d}</span></div>
                  </div>
                ))}
                <div className="mt-6 pt-5 border-t border-white/[0.14] flex items-center gap-3">
                  <div className="text-3xl font-extrabold">4.9★</div>
                  <div className="text-[12.5px] text-[#c8d4e8]">Average partner satisfaction from 5,000+ mechanics</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </UserLayout>
    </>
  )
}

const inputCls = 'w-full h-12 border border-[#E7ECF3] rounded-xl px-3.5 text-sm bg-[#F6F8FB] text-[#13203A] focus:outline-none focus:border-[#1B3B6F] focus:bg-white'

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">{label}</label>
      {children}
    </div>
  )
}
