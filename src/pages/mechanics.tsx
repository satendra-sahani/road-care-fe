import { useMemo, useState } from 'react'
import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import {
  Star, MapPin, ShieldCheck, BadgeCheck, Truck, User, ChevronRight,
  ArrowRight, IndianRupee,
} from 'lucide-react'

interface Mechanic {
  name: string; spec: string; skills: string[]; vehicles: string[]; rating: number
  reviews: number; jobs: number; city: string; area: string; km: number; exp: number
  response: string; visit: number; cert: boolean; avail: boolean; grad: number
}

const MECHANICS: Mechanic[] = [
  { name: 'Rakesh Sharma', spec: 'Engine & Transmission Specialist', skills: ['Engine', 'Brakes'], vehicles: ['Bike', 'Car'], rating: 4.9, reviews: 412, jobs: 1280, city: 'Mumbai', area: 'Andheri West', km: 2.3, exp: 12, response: '~12 min', visit: 299, cert: true, avail: true, grad: 0 },
  { name: 'Imran Qureshi', spec: 'Car Electrical & Diagnostics', skills: ['Electrical', 'AC'], vehicles: ['Car'], rating: 4.8, reviews: 366, jobs: 980, city: 'Mumbai', area: 'Bandra', km: 3.1, exp: 9, response: '~18 min', visit: 349, cert: true, avail: true, grad: 1 },
  { name: 'Suresh Patil', spec: 'Two-Wheeler Expert', skills: ['Engine', 'Tyres'], vehicles: ['Bike'], rating: 4.7, reviews: 289, jobs: 1530, city: 'Pune', area: 'Kothrud', km: 1.4, exp: 15, response: '~10 min', visit: 199, cert: true, avail: false, grad: 2 },
  { name: 'Anil Verma', spec: 'Brakes & Suspension Pro', skills: ['Brakes'], vehicles: ['Bike', 'Car'], rating: 4.6, reviews: 201, jobs: 640, city: 'Delhi', area: 'Rohini', km: 4.2, exp: 7, response: '~22 min', visit: 279, cert: false, avail: true, grad: 3 },
  { name: 'Mohammed Faisal', spec: 'AC & Cooling Systems', skills: ['AC', 'Electrical'], vehicles: ['Car'], rating: 4.8, reviews: 318, jobs: 720, city: 'Hyderabad', area: 'Gachibowli', km: 2.8, exp: 10, response: '~16 min', visit: 399, cert: true, avail: true, grad: 4 },
  { name: 'Deepak Yadav', spec: 'General Service & Engine', skills: ['Engine'], vehicles: ['Bike', 'Car'], rating: 4.5, reviews: 142, jobs: 410, city: 'Jaipur', area: 'Malviya Nagar', km: 5.6, exp: 5, response: '~25 min', visit: 249, cert: false, avail: true, grad: 5 },
  { name: 'Ramesh Iyer', spec: 'Denting & Painting Master', skills: ['Denting'], vehicles: ['Car'], rating: 4.7, reviews: 176, jobs: 355, city: 'Chennai', area: 'Velachery', km: 3.9, exp: 14, response: '~30 min', visit: 899, cert: true, avail: false, grad: 0 },
  { name: 'Vikram Singh', spec: 'Battery & Electrical', skills: ['Electrical'], vehicles: ['Bike', 'Car'], rating: 4.6, reviews: 233, jobs: 870, city: 'Delhi', area: 'Lajpat Nagar', km: 2.1, exp: 8, response: '~15 min', visit: 229, cert: false, avail: true, grad: 1 },
  { name: 'Sandeep Kumar', spec: 'Tyres, Wheels & Alignment', skills: ['Tyres', 'Brakes'], vehicles: ['Bike', 'Car'], rating: 4.5, reviews: 198, jobs: 1040, city: 'Bengaluru', area: 'Whitefield', km: 6.3, exp: 6, response: '~20 min', visit: 149, cert: false, avail: true, grad: 2 },
  { name: 'Arjun Nair', spec: 'Premium Car Specialist', skills: ['Engine', 'AC'], vehicles: ['Car'], rating: 4.9, reviews: 401, jobs: 690, city: 'Bengaluru', area: 'Indiranagar', km: 1.9, exp: 11, response: '~14 min', visit: 449, cert: true, avail: true, grad: 3 },
  { name: 'Pradeep Joshi', spec: 'Bike Engine Rebuilds', skills: ['Engine', 'Tyres'], vehicles: ['Bike'], rating: 4.4, reviews: 121, jobs: 560, city: 'Pune', area: 'Hadapsar', km: 4.7, exp: 9, response: '~28 min', visit: 199, cert: false, avail: false, grad: 4 },
  { name: 'Naveen Reddy', spec: 'Denting, Painting & Body', skills: ['Denting', 'Brakes'], vehicles: ['Car'], rating: 4.6, reviews: 164, jobs: 330, city: 'Hyderabad', area: 'Kukatpally', km: 3.4, exp: 13, response: '~26 min', visit: 799, cert: true, avail: true, grad: 5 },
  { name: 'Gaurav Mehta', spec: 'Multi-Brand Car Service', skills: ['Engine', 'Electrical'], vehicles: ['Car'], rating: 4.7, reviews: 277, jobs: 820, city: 'Mumbai', area: 'Powai', km: 2.6, exp: 10, response: '~17 min', visit: 349, cert: false, avail: true, grad: 0 },
  { name: 'Sunil Rathod', spec: 'Two-Wheeler & Scooter', skills: ['Brakes', 'Tyres'], vehicles: ['Bike'], rating: 4.5, reviews: 189, jobs: 1120, city: 'Pune', area: 'Viman Nagar', km: 3.0, exp: 7, response: '~19 min', visit: 179, cert: false, avail: true, grad: 1 },
]

const GRADS = ['from-[#1B3B6F] to-[#2A5298]', 'from-[#F2541B] to-[#FF6B35]', 'from-[#15936B] to-[#1FB07F]', 'from-[#7C3AED] to-[#9F67F0]', 'from-[#0F766E] to-[#14938A]', 'from-[#B45309] to-[#D97706]']
const SPECS = ['All', 'Engine', 'Brakes', 'Electrical', 'AC', 'Tyres', 'Denting']
const SORTS: [string, string][] = [['rating', 'Top rated'], ['near', 'Nearest'], ['price', 'Lowest visit fee']]
const TRUST = [
  { icon: ShieldCheck, color: 'bg-[#F2F6FC] text-[#1B3B6F]', title: 'BM Certified', desc: 'Trained & tested' },
  { icon: User, color: 'bg-[#E7F6F0] text-[#15936B]', title: 'Verified IDs', desc: 'Background-checked' },
  { icon: Truck, color: 'bg-[#FFF1EB] text-[#FF6B35]', title: 'Doorstep Service', desc: 'They come to you' },
  { icon: IndianRupee, color: 'bg-[#F1EBFE] text-[#7C3AED]', title: 'Transparent Pricing', desc: 'No hidden charges' },
]

const initials = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('')

export default function MechanicsPage() {
  const [spec, setSpec] = useState('All')
  const [certOnly, setCertOnly] = useState(false)
  const [availOnly, setAvailOnly] = useState(false)
  const [sort, setSort] = useState('rating')

  const list = useMemo(() => {
    let l = MECHANICS.filter((m) =>
      (spec === 'All' || m.skills.includes(spec)) &&
      (!certOnly || m.cert) &&
      (!availOnly || m.avail),
    )
    if (sort === 'rating') l = [...l].sort((a, b) => b.rating - a.rating)
    else if (sort === 'near') l = [...l].sort((a, b) => a.km - b.km)
    else if (sort === 'price') l = [...l].sort((a, b) => a.visit - b.visit)
    return l
  }, [spec, certOnly, availOnly, sort])

  return (
    <>
      <SEOHead
        title="Find a Trusted Mechanic"
        description="Browse verified, rated and background-checked mechanics near you, including Bharat Mechanics Certified experts. Doorstep service, transparent pricing."
      />
      <UserLayout>
        <div className="bg-white">
          {/* HERO */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0F2547] via-[#1B3B6F] to-[#2A5298] text-white">
            <div className="absolute -top-16 right-6 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(255,107,53,0.18),transparent_65%)]" />
            <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-9 md:py-11">
              <div className="flex items-center gap-1.5 text-[12.5px] text-white/70 mb-2.5">
                <Link href="/" className="hover:text-white">Home</Link><ChevronRight className="h-3.5 w-3.5" /><span className="text-white">Mechanics</span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
                <div>
                  <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Find a Trusted Mechanic</h1>
                  <p className="mt-2 text-white/75 text-sm md:text-base max-w-xl">Verified, rated and background-checked mechanics near you — with <b className="text-white">Bharat Mechanics Certified</b> experts for guaranteed quality.</p>
                  <div className="mt-5 flex items-center gap-5 md:gap-7">
                    {[['12,000+', 'Verified mechanics'], ['3,200+', 'BM Certified'], ['4.8★', 'Avg. rating']].map(([v, l], i) => (
                      <div key={l} className="flex items-center gap-5 md:gap-7">
                        {i > 0 && <span className="h-8 w-px bg-white/15" />}
                        <div><b className="block text-lg md:text-xl font-extrabold">{v}</b><span className="text-[11.5px] text-white/65">{l}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
                <Link href="/become-mechanic" className="inline-flex items-center gap-2 self-start bg-white/10 hover:bg-white/20 ring-1 ring-white/25 text-white font-semibold px-5 py-3 rounded-full text-sm transition-colors whitespace-nowrap"><User className="h-4 w-4" /> Are you a mechanic? Join us</Link>
              </div>
            </div>
          </div>

          {/* SPEC SCROLLER */}
          <div className="bg-white border-b border-[#E7ECF3] sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {SPECS.map((s) => (
                <button key={s} onClick={() => setSpec(s)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${spec === s ? 'bg-[#1B3B6F] text-white' : 'bg-[#F2F6FC] text-[#475569] hover:bg-[#E8EEF7]'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
            {/* TRUST STRIP */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {TRUST.map((t) => (
                <div key={t.title} className="flex items-center gap-3 bg-white border border-[#E7ECF3] rounded-2xl px-4 py-3.5 shadow-sm">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${t.color}`}><t.icon className="h-5 w-5" /></div>
                  <div><b className="block text-[13.5px] text-[#13203A] leading-tight">{t.title}</b><span className="text-[11.5px] text-[#7B8AA3]">{t.desc}</span></div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setCertOnly((v) => !v)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${certOnly ? 'bg-[#1B3B6F] text-white' : 'bg-white text-[#475569] ring-1 ring-[#E7ECF3]'}`}><ShieldCheck className="h-3.5 w-3.5" /> BM Certified</button>
                <button onClick={() => setAvailOnly((v) => !v)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${availOnly ? 'bg-[#15936B] text-white' : 'bg-white text-[#475569] ring-1 ring-[#E7ECF3]'}`}><span className="h-2 w-2 rounded-full bg-current" /> Available now</button>
                <span className="text-sm text-[#7B8AA3] ml-1">{list.length} mechanics</span>
              </div>
              <div className="flex items-center gap-2">
                {SORTS.map(([k, label]) => (
                  <button key={k} onClick={() => setSort(k)} className={`px-3 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${sort === k ? 'bg-[#FF6B35] text-white' : 'bg-white text-[#475569] ring-1 ring-[#E7ECF3]'}`}>{label}</button>
                ))}
              </div>
            </div>

            {/* DIRECTORY */}
            {list.length === 0 ? (
              <div className="bg-white border border-[#E7ECF3] rounded-2xl p-12 text-center text-[#7B8AA3]">No mechanics match your filters.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {list.map((m) => (
                  <div key={m.name} className={`relative bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col ${m.cert ? 'border-[#15936B]/30' : 'border-[#E7ECF3]'}`}>
                    {m.cert && <span className="absolute top-0 right-5 inline-flex items-center gap-1 bg-[#15936B] text-white text-[10.5px] font-extrabold px-2.5 py-1 rounded-b-lg"><ShieldCheck className="h-3 w-3" /> BM Certified</span>}
                    <div className="flex items-start gap-3">
                      <div className={`relative h-12 w-12 rounded-full bg-gradient-to-br ${GRADS[m.grad]} text-white font-extrabold flex items-center justify-center shrink-0`}>
                        {initials(m.name)}
                        <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${m.avail ? 'bg-[#15936B]' : 'bg-[#9CA3AF]'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 font-bold text-[#13203A] leading-tight">{m.name}{m.cert && <BadgeCheck className="h-4 w-4 text-[#15936B] shrink-0" />}</div>
                        <div className="text-[12.5px] text-[#7B8AA3]">{m.spec}</div>
                        <div className="flex items-center gap-1 text-[12.5px] font-bold text-[#475569] mt-0.5"><span className="text-[#F5A623]">★</span> {m.rating} <span className="text-[#7B8AA3] font-medium">({m.jobs.toLocaleString('en-IN')} jobs)</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12.5px] text-[#475569] mt-3"><MapPin className="h-3.5 w-3.5 text-[#7B8AA3]" /> {m.area}, {m.city} <span className="text-[#7B8AA3]">· {m.km} km</span></div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {m.skills.map((s) => <span key={s} className="text-[11px] font-semibold text-[#1B3B6F] bg-[#F2F6FC] px-2 py-1 rounded-md">{s === 'AC' ? 'AC Service' : s}</span>)}
                      <span className="text-[11px] font-semibold text-[#7B8AA3] bg-[#F6F8FB] px-2 py-1 rounded-md">{m.vehicles.join(' · ')}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 py-3 border-y border-[#EFF2F7] text-center">
                      <div><b className="block text-[14px] text-[#13203A]">{m.exp} yrs</b><span className="text-[10.5px] text-[#7B8AA3]">Experience</span></div>
                      <div><b className="block text-[14px] text-[#13203A]">{m.response}</b><span className="text-[10.5px] text-[#7B8AA3]">Response</span></div>
                      <div><b className="block text-[14px] text-[#1B3B6F]">₹{m.visit}</b><span className="text-[10.5px] text-[#7B8AA3]">Visit from</span></div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Link href="/service" className="flex-1 text-center text-sm font-semibold text-[#1B3B6F] bg-[#F2F6FC] hover:bg-[#E8EEF7] py-2.5 rounded-lg transition-colors">View profile</Link>
                      <Link href="/service" className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-[#FF6B35] hover:bg-[#F2541B] py-2.5 rounded-lg transition-colors">{m.avail ? 'Book now' : 'Schedule'} <ArrowRight className="h-3.5 w-3.5" /></Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Become certified CTA */}
            <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3B6F] to-[#0F2547] text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-extrabold">Are you a mechanic?</h3>
                <p className="text-sm text-white/80 mt-1">Get certified by Bharat Mechanics and appear on this list.</p>
              </div>
              <Link href="/training" className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#F2541B] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors whitespace-nowrap self-start md:self-auto">Get Certified <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </UserLayout>
    </>
  )
}
