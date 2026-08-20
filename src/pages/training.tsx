import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import {
  GraduationCap, Award, ShieldCheck, Home, User, Wrench, Cpu, Snowflake,
  Paintbrush, Zap, Star, Clock, BookOpen, CheckCircle2, ArrowRight,
  BadgeCheck, Search,
} from 'lucide-react'

interface Course {
  name: string; level: string; desc: string; weeks: string; lessons: string
  price: number; mrp: number; icon: typeof Wrench; grad: string; rating: string; enrolled: string; tag: string
}

const COURSES: Course[] = [
  { name: 'Two-Wheeler Basics', level: 'Beginner', desc: 'Learn bike servicing from scratch — engine, brakes, chain & electricals.', weeks: '4 weeks', lessons: '24 lessons', price: 6999, mrp: 10999, icon: Wrench, grad: 'from-[#1B3B6F] to-[#2A5298]', rating: '4.8', enrolled: '3.2k', tag: 'best' },
  { name: 'Advanced Car Diagnostics', level: 'Advanced', desc: 'Master OBD scanners, ECU diagnostics, and modern car repair techniques.', weeks: '8 weeks', lessons: '42 lessons', price: 18999, mrp: 27999, icon: Cpu, grad: 'from-[#7C3AED] to-[#9F67F0]', rating: '4.9', enrolled: '1.8k', tag: 'best' },
  { name: 'AC & Electrical Specialist', level: 'Intermediate', desc: 'Become an AC and auto-electrical expert with hands-on practicals.', weeks: '6 weeks', lessons: '32 lessons', price: 12999, mrp: 18999, icon: Snowflake, grad: 'from-[#2563EB] to-[#5B8DEF]', rating: '4.7', enrolled: '2.4k', tag: '' },
  { name: 'Denting & Painting Pro', level: 'Intermediate', desc: 'Showroom-finish dent removal, painting, and panel-beating skills.', weeks: '5 weeks', lessons: '28 lessons', price: 13999, mrp: 20999, icon: Paintbrush, grad: 'from-[#D97706] to-[#F4B860]', rating: '4.6', enrolled: '1.5k', tag: '' },
  { name: 'EV Maintenance', level: 'Advanced', desc: 'Future-ready training on electric vehicle batteries, motors & safety.', weeks: '7 weeks', lessons: '36 lessons', price: 21999, mrp: 31999, icon: Zap, grad: 'from-[#15936B] to-[#34C796]', rating: '4.9', enrolled: '940', tag: 'new' },
  { name: 'Customer Service & Soft Skills', level: 'Beginner', desc: 'Professional conduct, communication, and building lasting trust.', weeks: '2 weeks', lessons: '12 lessons', price: 4999, mrp: 7499, icon: Star, grad: 'from-[#FF6B35] to-[#F2541B]', rating: '4.8', enrolled: '4.1k', tag: '' },
]

const LEVELS = ['all', 'Beginner', 'Intermediate', 'Advanced']
const WHY = [
  { icon: Award, color: 'bg-[#E7F6F0] text-[#15936B]', title: 'Earn 38% more', desc: 'Certified mechanics unlock higher-value jobs and premium service tiers.' },
  { icon: ShieldCheck, color: 'bg-[#F2F6FC] text-[#1B3B6F]', title: 'Verified badge', desc: 'Stand out with a trusted certification badge on your partner profile.' },
  { icon: Home, color: 'bg-[#FFF1EB] text-[#FF6B35]', title: 'Learn anywhere', desc: 'Online video lessons in Hindi & English, plus hands-on practical sessions.' },
  { icon: User, color: 'bg-[#F1EBFE] text-[#7C3AED]', title: 'Job guarantee', desc: 'Top graduates get fast-tracked onboarding as Bharat Mechanics partners.' },
]
const CURRICULUM: [string, string, string][] = [
  ['Engine fundamentals', 'How petrol & diesel engines work, components, and common failure points.', '4 lessons · 2 hrs'],
  ['Electrical & battery systems', 'Wiring, fuses, alternators, and diagnosing electrical faults safely.', '5 lessons · 3 hrs'],
  ['Brakes & suspension', 'Brake pad replacement, fluid systems, and suspension inspection.', '4 lessons · 2.5 hrs'],
  ['AC & cooling systems', 'Gas refills, compressor checks, and cooling system maintenance.', '3 lessons · 2 hrs'],
  ['Computer diagnostics', 'Using OBD scanners, reading error codes, and modern car electronics.', '6 lessons · 4 hrs'],
  ['Customer service & safety', 'Professional conduct, workplace safety, and building trust with customers.', '3 lessons · 1.5 hrs'],
]

const SAMPLE_CERTS: Record<string, { name: string; program: string; issued: string }> = {
  'BM-AC-4821': { name: 'Ramesh Kumar', program: 'Advanced Car Diagnostics & Repair', issued: 'Jun 2026' },
  'BM-2W-100245': { name: 'Rahul Verma', program: 'Two-Wheeler Basics', issued: 'Mar 2026' },
  'BM-CAR-100871': { name: 'Imran Shaikh', program: 'AC & Electrical Specialist', issued: 'Apr 2026' },
}

const lvlColor = (l: string) => l === 'Beginner' ? 'bg-[#E7F6F0] text-[#15936B]' : l === 'Intermediate' ? 'bg-[#EAF1FE] text-[#2563EB]' : 'bg-[#F1EBFE] text-[#7C3AED]'

export default function TrainingPage() {
  const [lvl, setLvl] = useState('all')
  const [certId, setCertId] = useState('')
  const [result, setResult] = useState<null | { ok: boolean; data?: { name: string; program: string; issued: string } }>(null)
  const courses = COURSES.filter((c) => lvl === 'all' || c.level === lvl)

  const verify = (e: React.FormEvent) => {
    e.preventDefault()
    const key = certId.trim().toUpperCase()
    if (!key) return
    const found = SAMPLE_CERTS[key]
    setResult(found ? { ok: true, data: found } : { ok: false })
  }

  return (
    <>
      <SEOHead title="Training & Certification" description="Bharat Mechanics Academy — official Bharat Mechanics mechanic training and certification, online and hands-on. Certified by Bharat Mechanics." noIndex />
      <UserLayout>
        <div className="bg-white">
          {/* HERO + CERTIFICATE */}
          <section className="relative overflow-hidden bg-gradient-to-br from-[#0F2547] via-[#1B3B6F] to-[#2A5298] text-white">
            <div className="absolute -top-24 -left-10 w-[460px] h-[460px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.25),transparent_64%)] pointer-events-none" />
            <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-[#7C3AED]/25 text-[#C4B5FD] ring-1 ring-[#7C3AED]/40 rounded-full px-3 py-1 text-xs font-bold mb-4">🎓 Bharat Mechanics Academy</span>
                <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08]">Learn the skills. Earn the <span className="text-[#FF6B35]">certificate.</span></h1>
                <p className="mt-4 text-[#c8d4e8] text-base md:text-lg max-w-lg">Official Bharat Mechanics training &mdash; online and hands-on. Earn a <b className="text-white">Bharat Mechanics certificate</b>, get verified, and earn more on the platform.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#courses" className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#F2541B] text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors">Explore courses <ArrowRight className="h-4 w-4" /></a>
                  <Link href="/become-mechanic" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 ring-1 ring-white/25 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors">Become a partner</Link>
                </div>
                <div className="mt-8 flex gap-8">
                  {[['12,000+', 'Certified mechanics'], ['18', 'Courses available'], ['38%', 'Avg. earnings boost']].map(([v, l]) => (
                    <div key={l}><div className="text-2xl md:text-3xl font-extrabold">{v}</div><div className="text-[12.5px] text-[#9fb2d4]">{l}</div></div>
                  ))}
                </div>
              </div>

              {/* Certificate showcase — real sample certificate image */}
              <div className="relative rounded-2xl shadow-2xl ring-[6px] ring-white/10 overflow-hidden">
                <Image
                  src="/academy-certificate.png"
                  alt="Bharat Mechanics Academy — Certificate of Completion (sample)"
                  width={1492}
                  height={1054}
                  className="w-full h-auto block"
                  priority
                />
              </div>
            </div>
          </section>

          {/* WHY CERTIFY */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {WHY.map((w) => (
                <div key={w.title} className="bg-white border border-[#E7ECF3] rounded-2xl p-5 shadow-sm">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-3 ${w.color}`}><w.icon className="h-5 w-5" /></div>
                  <h4 className="font-bold text-sm text-[#13203A]">{w.title}</h4>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">{w.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* COURSES */}
          <section id="courses" className="bg-[#F6F8FB]">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#7C3AED]">Choose your path</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#13203A] mt-2">Popular certification courses</h2>
                <p className="text-[#475569] mt-2 text-sm">From beginner basics to advanced diagnostics — learn at your own pace.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mb-7">
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => setLvl(l)} className={`px-4 py-2.5 rounded-full font-bold text-sm border transition-colors ${lvl === l ? 'bg-[#1B3B6F] text-white border-[#1B3B6F]' : 'bg-white text-[#475569] border-[#E7ECF3] hover:border-[#1B3B6F]/40'}`}>{l === 'all' ? 'All Courses' : l}</button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((c) => {
                  const off = Math.round((1 - c.price / c.mrp) * 100)
                  return (
                    <div key={c.name} className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                      <div className={`relative h-28 bg-gradient-to-br ${c.grad} flex items-center justify-center`}>
                        <span className={`absolute top-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded-md ${lvlColor(c.level)}`}>{c.level}</span>
                        {c.tag === 'best' && <span className="absolute top-3 right-3 text-[10.5px] font-extrabold bg-white/90 text-[#D97706] px-2 py-0.5 rounded-md">★ Bestseller</span>}
                        {c.tag === 'new' && <span className="absolute top-3 right-3 text-[10.5px] font-extrabold bg-white/90 text-[#15936B] px-2 py-0.5 rounded-md">✦ New</span>}
                        <c.icon className="h-10 w-10 text-white/90" />
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h4 className="font-extrabold text-[#13203A]">{c.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#475569] my-1.5"><span className="text-[#F5A623]">★ {c.rating}</span><span className="text-[#7B8AA3] font-medium">· {c.enrolled} enrolled</span></div>
                        <p className="text-[13px] text-[#475569] leading-relaxed mb-3">{c.desc}</p>
                        <div className="flex gap-4 mb-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569]"><Clock className="h-3.5 w-3.5 text-[#1B3B6F]" /> {c.weeks}</div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569]"><BookOpen className="h-3.5 w-3.5 text-[#1B3B6F]" /> {c.lessons}</div>
                        </div>
                        <div className="inline-flex self-start items-center gap-1.5 text-[11px] font-bold text-[#15936B] bg-[#E7F6F0] px-2.5 py-1 rounded-md mb-3"><ShieldCheck className="h-3.5 w-3.5" /> Certificate included</div>
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#EFF2F7]">
                          <div><small className="text-[11px] text-[#7B8AA3]">{off}% off · limited time</small><b className="block text-[20px] text-[#1B3B6F] leading-none">₹{c.price.toLocaleString('en-IN')}<span className="text-xs text-[#7B8AA3] line-through ml-1 font-normal">₹{c.mrp.toLocaleString('en-IN')}</span></b></div>
                          <Link href="/become-mechanic" className="bg-[#1B3B6F] hover:bg-[#15315C] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Enroll</Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* CURRICULUM */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
            <div className="text-center mb-9">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#7C3AED]">What you&rsquo;ll learn</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#13203A] mt-2">Sample curriculum</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {CURRICULUM.map(([t, d, meta], i) => (
                <div key={t} className="flex gap-4 bg-white border border-[#E7ECF3] rounded-2xl p-5 shadow-sm">
                  <div className="h-10 w-10 rounded-xl bg-[#7C3AED]/[0.1] text-[#7C3AED] font-extrabold flex items-center justify-center shrink-0">{i + 1}</div>
                  <div>
                    <h4 className="font-bold text-[#13203A]">{t}</h4>
                    <p className="text-sm text-[#475569] mt-1 leading-relaxed">{d}</p>
                    <div className="text-xs text-[#7B8AA3] mt-2 font-semibold">{meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* VERIFY */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-12">
            <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-5 w-5 text-[#1B3B6F]" /><h2 className="text-lg md:text-xl font-extrabold text-[#13203A]">Verify a Certificate</h2></div>
              <p className="text-sm text-gray-500 mb-4">Enter the certificate ID printed on the certificate or technician ID card.</p>
              <form onSubmit={verify} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input value={certId} onChange={(e) => { setCertId(e.target.value); setResult(null) }} placeholder="e.g. BM-AC-4821" className="w-full pl-10 pr-3 h-11 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B6F]/30" />
                </div>
                <button type="submit" className="h-11 px-6 rounded-lg bg-[#1B3B6F] hover:bg-[#152d55] text-white text-sm font-semibold transition-colors">Verify</button>
              </form>
              {result && (
                <div className={`mt-4 rounded-xl p-4 text-sm ${result.ok ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                  {result.ok && result.data ? (
                    <div className="flex items-start gap-2"><BadgeCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" /><div><p className="font-bold">Valid certificate</p><p className="mt-0.5">{result.data.name} &mdash; {result.data.program} &middot; Issued {result.data.issued}</p></div></div>
                  ) : <p>No certificate found for that ID. Please check and try again.</p>}
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-3">Try a sample: <button type="button" onClick={() => { setCertId('BM-AC-4821'); setResult(null) }} className="underline">BM-AC-4821</button></p>
            </div>
          </section>

          {/* CTA */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-12">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3B6F] to-[#0F2547] text-white p-8 md:p-12 text-center">
              <div className="absolute -top-16 right-0 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.3),transparent_65%)]" />
              <h2 className="relative text-2xl md:text-3xl font-extrabold">Ready to get certified?</h2>
              <p className="relative text-white/80 mt-2 max-w-xl mx-auto text-sm">Join 12,000+ mechanics who upgraded their skills and earnings with Bharat Mechanics Academy.</p>
              <div className="relative mt-6 flex gap-3 justify-center flex-wrap">
                <a href="#courses" className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#F2541B] text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors">Enroll today <ArrowRight className="h-4 w-4" /></a>
                <a href="tel:+919310694349" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 ring-1 ring-white/25 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors">Talk to a counsellor</a>
              </div>
            </div>
          </section>
        </div>
      </UserLayout>
    </>
  )
}
