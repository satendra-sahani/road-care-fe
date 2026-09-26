import { useState } from 'react'
import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { DImg } from '@/components/ui/DImg'
import {
  IcSchedule, IcMenuBook, IcVerified, IcArrowForward, IcSchool, IcEngineering, IcBuild, IcSettings, IcBolt,
  IcHandyman, IcMyLocation, IcGpsFixed, IcSupportAgent, IcSearch, IcCheck, IcCheckCircle, IcCancel, IcCall,
  IcMilitaryTech, IcGroups, IcHomeRepairService,
} from '@/components/icons/BmIcons'

/* ─── Claude Design → Bharat Mechanics Training ─── */

interface Course {
  name: string; level: string; desc: string; weeks: string; lessons: string
  price: number; mrp: number; img: string; alt: string; rating: string; enrolled: string
}

const COURSES: Course[] = [
  { name: 'Two-Wheeler Basics', level: 'Beginner', desc: 'Learn bike servicing from scratch — engine, brakes, chain & electricals.', weeks: '4 weeks', lessons: '24 lessons', price: 6999, mrp: 10999, img: '/design/trc-1-v3-o.webp', alt: 'Two-wheeler servicing', rating: '4.8', enrolled: '3.2k' },
  { name: 'Advanced Car Diagnostics', level: 'Advanced', desc: 'Master OBD scanners, ECU diagnostics, and modern car repair techniques.', weeks: '8 weeks', lessons: '42 lessons', price: 18999, mrp: 27999, img: '/design/trc-2-v3-o.webp', alt: 'Car diagnostics with OBD scanner', rating: '4.9', enrolled: '1.8k' },
  { name: 'AC & Electrical Specialist', level: 'Intermediate', desc: 'Become an AC and auto-electrical expert with hands-on practicals.', weeks: '6 weeks', lessons: '32 lessons', price: 12999, mrp: 18999, img: '/design/trc-3-v3-o.webp', alt: 'Car AC vents service', rating: '4.7', enrolled: '2.4k' },
  { name: 'Denting & Painting Pro', level: 'Intermediate', desc: 'Learn dent removal, surface preparation, painting and finish techniques.', weeks: '5 weeks', lessons: '28 lessons', price: 13999, mrp: 20999, img: '/design/trc-4-v3-o.webp', alt: 'Denting and painting work', rating: '4.6', enrolled: '1.5k' },
  { name: 'EV Maintenance', level: 'Advanced', desc: 'Understand EV systems, battery maintenance, diagnostics and high-voltage safety.', weeks: '7 weeks', lessons: '36 lessons', price: 21999, mrp: 31999, img: '/design/trc-5-v3-o.webp', alt: 'EV battery and high-voltage cabling', rating: '4.9', enrolled: '940' },
  { name: 'Customer Service & Soft Skills', level: 'Beginner', desc: 'Improve communication, customer handling and professional skills for a successful career.', weeks: '2 weeks', lessons: '12 lessons', price: 4999, mrp: 7499, img: '/design/trc-6-v3-o.webp', alt: 'Mechanic speaking with a customer', rating: '4.8', enrolled: '4.1k' },
]

const LEVELS: [string, string][] = [['all', 'All Courses'], ['Beginner', 'Beginner'], ['Intermediate', 'Intermediate'], ['Advanced', 'Advanced']]
const HERO_POINTS = [
  { Icon: IcMilitaryTech, bg: '#F4601F', t: 'Industry-recognised certifications', d: 'Valued by garages across India' },
  { Icon: IcGroups, bg: '#1A6FD4', t: 'Learn from experts', d: 'Trainers with 10+ years on the job' },
  { Icon: IcHandyman, bg: '#17A05A', t: 'Practical, hands-on training', d: 'Real vehicles, real workshop tools' },
]
const CURRICULUM: { t: string; d: string; lessons: string; hrs: string; Icon: React.ComponentType<any> }[] = [
  { t: 'Engine fundamentals', d: 'How petrol & diesel engines work, components, and common failure points.', lessons: '4 lessons', hrs: '2 hrs', Icon: IcSettings },
  { t: 'Electrical & battery systems', d: 'Wiring, fuses, alternators, and diagnosing electrical faults safely.', lessons: '5 lessons', hrs: '3 hrs', Icon: IcBolt },
  { t: 'Brakes & suspension', d: 'Brake pad replacement, fluid systems, and suspension inspection.', lessons: '4 lessons', hrs: '2.5 hrs', Icon: IcBuild },
  { t: 'AC & cooling systems', d: 'Gas refills, compressor checks, and cooling system maintenance.', lessons: '3 lessons', hrs: '2 hrs', Icon: IcMyLocation },
  { t: 'Computer diagnostics', d: 'Using OBD scanners, reading error codes, and modern car electronics.', lessons: '6 lessons', hrs: '4 hrs', Icon: IcGpsFixed },
  { t: 'Customer service & safety', d: 'Professional conduct, workplace safety, and building trust with customers.', lessons: '3 lessons', hrs: '1.5 hrs', Icon: IcSupportAgent },
]

const SAMPLE_CERTS: Record<string, { name: string; program: string; issued: string }> = {
  'BM-AC-4821': { name: 'Ramesh Kumar', program: 'Advanced Car Diagnostics & Repair', issued: 'Jun 2026' },
  'BM-2W-100245': { name: 'Rahul Verma', program: 'Two-Wheeler Basics', issued: 'Mar 2026' },
  'BM-CAR-100871': { name: 'Imran Shaikh', program: 'AC & Electrical Specialist', issued: 'Apr 2026' },
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`
const EYEBROW = 'inline-flex items-center gap-2 text-[10.5px] font-bold tracking-[1.6px] text-[#BE3F09]'

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
      <SEOHead title="Training & Certification" description="Bharat Mechanics Academy — official Bharat Mechanics mechanic training and certification, online and hands-on. Certified by Bharat Mechanics." />
      <UserLayout>
        <div className="bg-[#F5F8FC] text-[#0E2B4C] text-[14px] leading-[1.5]">
          {/* HERO + COURSES */}
          <section id="courses" className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(18px,2.4vw,28px)]">
            <div className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(110deg,#0A2442_0%,#123A69_58%,#1A4A85_100%)] text-white px-[clamp(18px,2.6vw,32px)] py-[clamp(18px,2.4vw,28px)] flex flex-wrap items-center gap-[clamp(16px,2.4vw,30px)]">
              <div className="absolute right-[-80px] top-[-90px] w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(244,96,31,0.30),rgba(244,96,31,0)_70%)] pointer-events-none" />
              <div className="absolute left-[-60px] bottom-[-110px] w-[240px] h-[240px] rounded-full bg-[radial-gradient(circle,rgba(26,111,212,0.40),rgba(26,111,212,0)_70%)] pointer-events-none" />
              <div className="relative flex-[1_1_320px] min-w-0">
                <span className="inline-flex items-center gap-2 whitespace-nowrap bg-[rgba(244,96,31,0.16)] border border-[rgba(244,96,31,0.45)] text-[#FF9A62] rounded-[20px] px-3 py-[5px] text-[10.5px] font-bold tracking-[1.6px]"><span className="w-1.5 h-1.5 rounded-full bg-[#F4601F]" />CHOOSE YOUR PATH</span>
                <h1 className="mt-3 text-[clamp(25px,3.2vw,38px)] leading-[1.12] font-bold tracking-[-1.1px]">Popular <span className="text-[#F4601F]">certification</span> courses</h1>
                <p className="mt-2 text-[clamp(12.5px,1.15vw,14px)] text-[#C3D4E6] max-w-[460px]">From beginner basics to advanced diagnostics — learn at your own pace.</p>
                <div className="flex items-center gap-1 mt-[18px] flex-wrap bg-white/[0.08] border border-white/[0.14] rounded-[20px] p-[5px] w-fit max-w-full">
                  {LEVELS.map(([k, l]) => (
                    <button key={k} onClick={() => setLvl(k)} className={`rounded-[22px] text-[13px] font-semibold whitespace-nowrap transition-colors ${lvl === k ? 'bg-[#C94309] text-white px-3.5 py-[9px] shadow-[0_6px_14px_rgba(244,96,31,0.35)]' : 'text-[#DCE7F4] hover:text-white px-3 py-[9px]'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <DImg src="/design/tr-script1-v2-o.webp" alt="Skills Today Better Tomorrow" sizes="(max-width: 767px) 96px, 104px" className="relative hidden md:block w-[104px] h-auto shrink-0 self-center brightness-0 invert drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]" />
              <div className="relative flex-[1_1_300px] min-w-0 max-w-[420px] grid gap-2.5">
                {HERO_POINTS.map((p) => (
                  <div key={p.t} className="flex items-center gap-3 min-w-0 bg-white/[0.08] border border-white/[0.14] rounded-[14px] px-3.5 py-3">
                    <span className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 text-white" style={{ background: p.bg }}><p.Icon size={20} /></span>
                    <div className="min-w-0"><div className="text-[13px] font-bold leading-tight">{p.t}</div><div className="text-[11.5px] text-[#C3D4E6]">{p.d}</div></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-[clamp(12px,1.8vw,18px)] mt-[clamp(16px,2vw,22px)]">
              {courses.map((c, ci) => {
                const off = Math.round(((c.mrp - c.price) / c.mrp) * 100)
                return (
                  <div key={c.name} className="bg-white border border-[#E6ECF3] rounded-[18px] overflow-hidden flex flex-col shadow-[0_6px_18px_rgba(12,42,77,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(12,42,77,0.10)]">
                    <DImg src={c.img} alt={c.alt} loading={ci === 0 ? 'eager' : 'lazy'} fetchPriority={ci === 0 ? 'high' : 'auto'} sizes="(max-width: 639px) 92vw, 380px" className="block h-auto w-full aspect-[2.41] object-cover object-center" />
                    <div className="px-4 pt-3.5 pb-4 flex flex-col flex-1">
                      <div className="text-[15px] font-bold leading-tight">{c.name}</div>
                      <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap mt-1 text-[11.5px] text-[#52667C]">
                        <span><span className="text-[#F0A726]">★</span> <span className="font-bold text-[#0E2B4C]">{c.rating}</span> · {c.enrolled} enrolled</span>
                        <span className="flex items-center gap-1"><IcSchedule size={13} />{c.weeks}</span>
                        <span className="flex items-center gap-1"><IcMenuBook size={13} />{c.lessons}</span>
                      </div>
                      <p className="mt-[9px] text-[12.5px] text-[#41586F] leading-[1.55]">{c.desc}</p>
                      <div className="flex items-center gap-[7px] mt-[11px] px-2.5 py-2 bg-[#F1FAF5] rounded-[9px] text-[11.5px] font-semibold text-[#0F7040]"><IcVerified size={15} /> Bharat Mechanics certificate included</div>
                      <div className="flex items-center justify-between gap-3 mt-auto pt-3.5 border-t border-[#EDF1F6] flex-wrap">
                        <div>
                          <div className="flex items-baseline gap-2"><span className="text-[18px] font-bold">{inr(c.price)}</span><span className="text-[12px] text-[#52667C] line-through">{inr(c.mrp)}</span></div>
                          <span className="inline-block mt-0.5 whitespace-nowrap bg-[#FFEDE1] text-[#BE3F09] rounded-[6px] px-[7px] py-0.5 text-[10.5px] font-bold">{off}% OFF</span>
                        </div>
                        <Link href="/become-mechanic" className="flex items-center gap-2 bg-[#C94309] hover:bg-[#A93807] text-white hover:text-white rounded-[10px] px-5 py-3 text-[13px] font-semibold whitespace-nowrap shadow-[0_8px_16px_rgba(244,96,31,0.26)] transition-colors">Enroll now <IcArrowForward size={15} /></Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* CURRICULUM */}
          <section className="bg-[#EEF3F9] mt-[clamp(20px,2.8vw,32px)]">
            <div className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] py-[clamp(20px,2.8vw,32px)]">
              <div className="flex items-end justify-between gap-[18px] flex-wrap">
                <div>
                  <span className={EYEBROW}><span className="w-1.5 h-1.5 rounded-full bg-[#F4601F]" />WHAT YOU&rsquo;LL LEARN</span>
                  <h2 className="mt-2 text-[clamp(20px,2.5vw,28px)] font-bold tracking-[-0.8px]">Sample curriculum</h2>
                  <p className="mt-1 text-[12.5px] text-[#52667C]">Practical knowledge. Real-world skills. Career-ready training.</p>
                </div>
                <div className="flex items-center gap-[clamp(10px,1.6vw,20px)] flex-wrap">
                  {[{ Icon: IcSchool, bg: '#FFEDE1', c: '#F4601F', t: 'Expert instructors' }, { Icon: IcHandyman, bg: '#DCEBFB', c: '#1A6FD4', t: 'Hands-on practicals' }, { Icon: IcSchedule, bg: '#EDE9FE', c: '#6D4AE0', t: 'Flexible learning' }].map((x) => (
                    <span key={x.t} className="flex items-center gap-[9px] text-[11.5px] font-semibold">
                      <span className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0" style={{ background: x.bg, color: x.c }}><x.Icon size={17} /></span>{x.t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3.5 mt-[18px]">
                {CURRICULUM.map((m, i) => (
                  <div key={m.t} className="flex items-center gap-3 bg-white rounded-[14px] px-4 py-3.5">
                    <span className="w-[30px] h-[30px] rounded-full bg-[#FFEDE1] text-[#BE3F09] text-[12.5px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="w-[38px] h-[38px] rounded-[10px] bg-[#EFF5FE] text-[#1864C8] flex items-center justify-center shrink-0"><m.Icon size={19} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold">{m.t}</div>
                      <div className="text-[11.5px] text-[#52667C] leading-snug">{m.d}</div>
                    </div>
                    <div className="hidden sm:flex flex-col gap-1.5 shrink-0">
                      <span className="bg-[#F1F5FA] rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap">{m.lessons}</span>
                      <span className="bg-[#F1F5FA] rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap">{m.hrs}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* VERIFY */}
          <section id="verify" className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(20px,2.6vw,30px)]">
            <div className="relative overflow-hidden bg-[linear-gradient(115deg,#FFFFFF_0%,#F3F8FF_55%,#E6F0FC_100%)] border border-[#DCE7F4] rounded-[22px] shadow-[0_14px_34px_rgba(12,42,77,0.07)] px-[clamp(18px,2.6vw,32px)] py-[clamp(14px,1.8vw,22px)] grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[clamp(14px,2vw,24px)] items-center">
              <div>
                <span className={EYEBROW}><span className="w-1.5 h-1.5 rounded-full bg-[#F4601F]" />VERIFY CREDENTIALS</span>
                <h2 className="mt-2 text-[clamp(20px,2.5vw,28px)] font-bold tracking-[-0.8px]">Verify a Certificate</h2>
                <p className="mt-2 text-[12.5px] text-[#41586F] max-w-[420px]">Check any Bharat Mechanics certificate in seconds. Enter the ID printed on the certificate or technician ID card.</p>
                <form onSubmit={verify} className="flex items-center gap-3 mt-4 flex-wrap">
                  <label className="flex items-center gap-2.5 flex-[1_1_240px] min-w-0 bg-white border-[1.5px] border-[#D5E2F1] focus-within:border-[#1A6FD4] rounded-[11px] px-[15px] py-[13px] shadow-[0_2px_8px_rgba(12,42,77,0.04)]">
                    <IcSearch size={18} className="text-[#94A3B8] shrink-0" />
                    <input value={certId} onChange={(e) => setCertId(e.target.value)} placeholder="e.g. BM-AC-4821" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#94A3B8] uppercase" />
                  </label>
                  <button type="submit" className="flex items-center gap-2 bg-[#C94309] hover:bg-[#A93807] text-white rounded-[11px] px-[26px] py-3.5 text-[14px] font-semibold whitespace-nowrap shadow-[0_8px_18px_rgba(244,96,31,0.28)] transition-colors"><IcVerified size={17} /> Verify</button>
                </form>
                <div className="mt-2.5 text-[11.5px] text-[#52667C]">Try a sample: <button type="button" onClick={() => { setCertId('BM-AC-4821'); setResult({ ok: true, data: SAMPLE_CERTS['BM-AC-4821'] }) }} className="font-semibold text-[#1864C8] hover:text-[#F4601F]">BM-AC-4821</button></div>
                {result && (
                  <div className={`mt-4 rounded-[12px] p-3.5 text-[13px] border ${result.ok ? 'bg-[#F1FAF5] text-[#0F7040] border-[#BFE8D2]' : 'bg-[#FFF1F2] text-[#B91C1C] border-[#FECDD3]'}`}>
                    {result.ok && result.data ? (
                      <div className="flex items-start gap-2"><IcCheckCircle size={20} className="text-[#17A05A] mt-0.5 shrink-0" /><div><p className="font-bold">Valid certificate</p><p className="mt-0.5">{result.data.name} &mdash; {result.data.program} &middot; Issued {result.data.issued}</p></div></div>
                    ) : (
                      <div className="flex items-start gap-2"><IcCancel size={20} className="text-[#E0384E] mt-0.5 shrink-0" /><div><p className="font-bold">No certificate found</p><p className="mt-0.5">Check the ID and try again, or call us on +91 93106 94349.</p></div></div>
                    )}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex items-center justify-end">
                <DImg sizes="(max-width: 767px) 92vw, 460px" src="/design/tr-cert-v3-o.webp" alt="Bharat Mechanics certificate — Authentic, Verified, Trusted, Certified Mechanic" className="block w-full max-w-[460px] h-auto" />
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] mt-[clamp(20px,2.6vw,30px)] pb-[clamp(22px,3vw,34px)]">
            <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(110deg,#0A2442_0%,#123A69_55%,#1E4B86_100%)] text-white shadow-[0_20px_44px_rgba(10,36,66,0.22)] flex flex-wrap items-stretch">
              <div className="absolute right-[6%] bottom-[-120px] w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(244,96,31,0.38),rgba(244,96,31,0)_68%)] pointer-events-none" />
              <div className="absolute left-[-90px] top-[-110px] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(26,111,212,0.42),rgba(26,111,212,0)_70%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:18px_18px] pointer-events-none" />
              <div className="relative z-[2] flex-[1_1_280px] min-w-0 self-center pl-[clamp(20px,3vw,40px)] pr-[clamp(14px,2vw,28px)] py-[clamp(22px,3vw,38px)]">
                <span className="inline-flex items-center gap-2 whitespace-nowrap bg-[rgba(244,96,31,0.16)] border border-[rgba(244,96,31,0.45)] text-[#FF9A62] rounded-[20px] px-3 py-[5px] text-[10.5px] font-bold tracking-[1.6px]"><span className="w-1.5 h-1.5 rounded-full bg-[#F4601F]" />JOIN OUR GROWING COMMUNITY</span>
                <h2 className="mt-3.5 text-[clamp(26px,3.4vw,42px)] leading-[1.1] font-bold tracking-[-1.2px]">Ready to get <span className="text-[#F4601F]">certified?</span></h2>
                <p className="mt-2.5 text-[clamp(13px,1.2vw,14.5px)] text-[#C3D4E6] max-w-[440px]">Join 12,000+ mechanics who upgraded their skills and earnings with Bharat Mechanics Academy.</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
                  {['Practical, hands-on training', 'Industry-recognised certificate', 'Placement support'].map((t) => (
                    <span key={t} className="flex items-center gap-[7px] whitespace-nowrap text-[12.5px] font-medium text-[#DCE7F4]"><span className="w-[18px] h-[18px] rounded-full bg-[rgba(57,192,126,0.2)] flex items-center justify-center shrink-0"><IcCheck size={12} className="text-[#39C07E]" /></span>{t}</span>
                  ))}
                </div>
              </div>
              <div className="relative z-[1] flex-[0_1_200px] max-w-[340px] grow mx-auto self-stretch flex items-end justify-center px-[clamp(14px,2vw,26px)] pt-[clamp(10px,2vw,22px)]">
                <DImg sizes="340px" src="/design/tr-cta-figure-v7-o.webp" alt="Skilled Mechanics Stronger India — certified technician" className="block w-full max-w-[400px] h-auto max-h-[clamp(240px,30vw,340px)] object-contain object-bottom" />
              </div>
              <div className="relative z-[2] flex-[0_0_250px] max-w-full ml-auto self-center pl-[clamp(14px,2vw,20px)] pr-[clamp(20px,3vw,40px)] py-[clamp(18px,2.4vw,30px)] grid gap-2.5">
                <a href="#courses" className="flex items-center justify-center gap-[9px] bg-[#C94309] hover:bg-[#A93807] text-white hover:text-white rounded-[12px] px-[26px] py-[15px] text-[14.5px] font-semibold whitespace-nowrap shadow-[0_10px_22px_rgba(244,96,31,0.35)] transition-colors">Enroll today <IcArrowForward size={16} /></a>
                <a href="tel:+919310694349" className="flex items-center justify-center gap-[9px] bg-white/[0.08] hover:bg-white/[0.16] text-white hover:text-white border-[1.5px] border-white/30 rounded-[12px] px-6 py-[15px] text-[14.5px] font-semibold whitespace-nowrap transition-colors"><IcCall size={16} /> Talk to a counsellor</a>
                <div className="flex items-center gap-3 mt-1.5 bg-white/[0.07] border border-white/[0.14] rounded-[14px] pl-2 pr-3.5 py-2">
                  <DImg src="/design/tr-avatars.png" alt="" sizes="60px" className="h-9 w-auto" />
                  <div className="text-[11.5px] text-[#C3D4E6] leading-snug"><span className="font-bold text-white">12,000+ trained mechanics</span><br />across India</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </UserLayout>
    </>
  )
}
