import { useMemo, useState } from 'react'
import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { DImg } from '@/components/ui/DImg'
import {
  IcGridView, IcBuild, IcSettings, IcBolt, IcDirectionsCar, IcTwoWheeler, IcSchedule, IcLocationOn,
  IcMyLocation, IcSearch, IcTune, IcExpandMore, IcExpandLess, IcFavoriteBorder, IcVerified, IcArrowForward,
  IcCheckCircle, IcFlashOn, IcStar, IcStore, IcVerifiedUser, IcLocalOffer, IcLocalShipping, IcGroups,
  IcHandyman, IcConstruction, IcCheck, IcArrowForwardIos,
} from '@/components/icons/BmIcons'

/* ─── Claude Design → Bharat Mechanics Mechanics ─── */

interface Mechanic {
  name: string; spec: string; skills: string[]; vehicles: string[]; rating: number
  reviews: number; jobs: number; city: string; area: string; km: number; exp: number
  response: string; visit: number; cert: boolean; avail: boolean; avatar: string; tag?: 'popular' | 'quick'
}

const MECHANICS: Mechanic[] = [
  { name: 'Rakesh Sharma', spec: 'Engine & Transmission Specialist', skills: ['Engine', 'Brakes', 'AC Service'], vehicles: ['Bike', 'Car'], rating: 4.9, reviews: 412, jobs: 1280, city: 'Mumbai', area: 'Andheri West', km: 2.3, exp: 12, response: '~12 min', visit: 299, cert: true, avail: true, avatar: '/design/mechavatar-1.png' },
  { name: 'Arjun Nair', spec: 'Premium Car Specialist', skills: ['Engine', 'AC Service'], vehicles: ['Car'], rating: 4.9, reviews: 401, jobs: 690, city: 'Bengaluru', area: 'Indiranagar', km: 1.9, exp: 11, response: '~14 min', visit: 449, cert: true, avail: true, avatar: '/design/mechavatar-2.png' },
  { name: 'Imran Qureshi', spec: 'Car Electrical & Diagnostics', skills: ['Electrical', 'AC Service'], vehicles: ['Car'], rating: 4.8, reviews: 366, jobs: 980, city: 'Mumbai', area: 'Bandra', km: 3.1, exp: 9, response: '~18 min', visit: 349, cert: true, avail: true, avatar: '/design/mechavatar-3.png', tag: 'popular' },
  { name: 'Sunil Rathod', spec: 'Two-Wheeler & Scooter', skills: ['Brakes', 'Tyres'], vehicles: ['Bike'], rating: 4.5, reviews: 189, jobs: 1120, city: 'Pune', area: 'Viman Nagar', km: 3.0, exp: 7, response: '~19 min', visit: 179, cert: false, avail: true, avatar: '/design/mechavatar-4.png' },
  { name: 'Pradeep Joshi', spec: 'Bike Engine Rebuilds', skills: ['Engine', 'Tyres'], vehicles: ['Bike'], rating: 4.4, reviews: 121, jobs: 560, city: 'Pune', area: 'Hadapsar', km: 4.7, exp: 9, response: '~28 min', visit: 199, cert: false, avail: false, avatar: '/design/mechavatar-5.png', tag: 'quick' },
  { name: 'Amit Kumar', spec: 'AC & Cooling Specialist', skills: ['AC Service', 'Electrical'], vehicles: ['Car'], rating: 4.7, reviews: 210, jobs: 430, city: 'Noida', area: 'Sector 62', km: 6.2, exp: 10, response: '~16 min', visit: 399, cert: true, avail: true, avatar: '/design/mechavatar-6.png' },
  { name: 'Suresh Patil', spec: 'Two-Wheeler Expert', skills: ['Engine', 'Tyres'], vehicles: ['Bike'], rating: 4.7, reviews: 289, jobs: 1530, city: 'Pune', area: 'Kothrud', km: 1.4, exp: 15, response: '~10 min', visit: 199, cert: true, avail: false, avatar: '/design/mechavatar-1.png' },
  { name: 'Anil Verma', spec: 'Brakes & Suspension Pro', skills: ['Brakes'], vehicles: ['Bike', 'Car'], rating: 4.6, reviews: 201, jobs: 640, city: 'Delhi', area: 'Rohini', km: 4.2, exp: 7, response: '~22 min', visit: 279, cert: false, avail: true, avatar: '/design/mechavatar-2.png' },
  { name: 'Mohammed Faisal', spec: 'AC & Cooling Systems', skills: ['AC Service', 'Electrical'], vehicles: ['Car'], rating: 4.8, reviews: 318, jobs: 720, city: 'Hyderabad', area: 'Gachibowli', km: 2.8, exp: 10, response: '~16 min', visit: 399, cert: true, avail: true, avatar: '/design/mechavatar-3.png' },
  { name: 'Deepak Yadav', spec: 'General Service & Engine', skills: ['Engine', 'Periodic Service'], vehicles: ['Bike', 'Car'], rating: 4.5, reviews: 142, jobs: 410, city: 'Jaipur', area: 'Malviya Nagar', km: 5.6, exp: 5, response: '~25 min', visit: 249, cert: false, avail: true, avatar: '/design/mechavatar-4.png' },
  { name: 'Ramesh Iyer', spec: 'Denting & Painting Master', skills: ['Denting & Painting'], vehicles: ['Car'], rating: 4.7, reviews: 176, jobs: 355, city: 'Chennai', area: 'Velachery', km: 3.9, exp: 14, response: '~30 min', visit: 899, cert: true, avail: false, avatar: '/design/mechavatar-5.png' },
  { name: 'Vikram Singh', spec: 'Battery & Electrical', skills: ['Electrical', 'Battery'], vehicles: ['Bike', 'Car'], rating: 4.6, reviews: 233, jobs: 870, city: 'Delhi', area: 'Lajpat Nagar', km: 2.1, exp: 8, response: '~15 min', visit: 229, cert: false, avail: true, avatar: '/design/mechavatar-6.png' },
  { name: 'Sandeep Kumar', spec: 'Tyres, Wheels & Alignment', skills: ['Tyres', 'Brakes'], vehicles: ['Bike', 'Car'], rating: 4.5, reviews: 198, jobs: 1040, city: 'Bengaluru', area: 'Whitefield', km: 6.3, exp: 6, response: '~20 min', visit: 149, cert: false, avail: true, avatar: '/design/mechavatar-1.png' },
  { name: 'Gaurav Mehta', spec: 'Multi-Brand Car Service', skills: ['Engine', 'Electrical', 'Periodic Service'], vehicles: ['Car'], rating: 4.7, reviews: 277, jobs: 820, city: 'Mumbai', area: 'Powai', km: 2.6, exp: 10, response: '~17 min', visit: 349, cert: false, avail: true, avatar: '/design/mechavatar-2.png' },
]

const CATS: { key: string; label: string; Icon: React.ComponentType<any>; w?: number }[] = [
  { key: 'All', label: 'All', Icon: IcGridView },
  { key: 'Engine', label: 'Engine', Icon: IcSettings },
  { key: 'Brakes', label: 'Brakes', Icon: IcBuild },
  { key: 'Electrical', label: 'Electrical', Icon: IcBolt },
  { key: 'AC Service', label: 'AC & Cooling', Icon: IcMyLocation, w: 90 },
  { key: 'Tyres', label: 'Tyres & Wheels', Icon: IcTwoWheeler, w: 96 },
  { key: 'Denting & Painting', label: 'Denting & Painting', Icon: IcConstruction, w: 112 },
  { key: 'Bike', label: 'Bike Service', Icon: IcTwoWheeler, w: 86 },
  { key: 'Periodic Service', label: 'Periodic Service', Icon: IcSchedule, w: 102 },
]
const SERVICE_TYPES = ['Car Service', 'Bike Service', 'AC Service', 'Denting & Painting', 'Tyres & Wheels', 'Battery']
const DISTANCES: [number, string][] = [[2, 'Within 2 km'], [5, 'Within 5 km'], [10, 'Within 10 km'], [0, 'Any distance']]
const RATINGS: [number, string][] = [[4.5, '4.5 & above'], [4.0, '4.0 & above'], [3.5, '3.5 & above'], [3.0, '3.0 & above']]
const SORTS: [string, string][] = [['rating', 'Top rated'], ['near', 'Nearest'], ['price', 'Lowest visit fee'], ['exp', 'Most experienced']]
const WHY = [
  { Icon: IcVerifiedUser, bg: 'rgba(255,255,255,0.12)', color: '#fff', title: 'Verified Professionals', desc: 'Background-checked experts' },
  { Icon: IcLocalOffer, bg: 'rgba(240,167,38,0.22)', color: '#F0A726', title: 'Transparent Pricing', desc: 'No hidden charges' },
  { Icon: IcLocalShipping, bg: 'rgba(23,160,90,0.22)', color: '#39C07E', title: 'Doorstep Convenience', desc: 'We come to you' },
  { Icon: IcGroups, bg: 'rgba(26,111,212,0.28)', color: '#7FB3F0', title: '10,000+ Happy Customers', desc: 'Rated 4.8/5 across India' },
]

const LABEL = 'text-[11.5px] font-bold tracking-[1.2px] text-[#52667C]'
const CHECK = 'w-4 h-4 accent-[#1A6FD4] shrink-0'
const Stars = ({ n }: { n: number }) => <span className="tracking-[1px]"><span className="text-[#F0A726]">{'★'.repeat(n)}</span><span className="text-[#D6DEE7]">{'★'.repeat(5 - n)}</span></span>

export default function MechanicsPage() {
  const [cat, setCat] = useState('All')
  const [avail, setAvail] = useState<'now' | 'today' | 'week' | ''>('now')
  const [dist, setDist] = useState(0)
  const [minRating, setMinRating] = useState(0)
  const [types, setTypes] = useState<string[]>([])
  const [sort, setSort] = useState('rating')
  const [sortOpen, setSortOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [loc, setLoc] = useState('')
  const [svc, setSvc] = useState('')
  const [open, setOpen] = useState<Record<string, boolean>>({ avail: true, dist: true, rating: true, type: true })
  const [saved, setSaved] = useState<Set<string>>(new Set())

  const typeMatch = (m: Mechanic, t: string) => {
    if (t === 'Car Service') return m.vehicles.includes('Car')
    if (t === 'Bike Service') return m.vehicles.includes('Bike')
    if (t === 'Tyres & Wheels') return m.skills.includes('Tyres')
    return m.skills.includes(t)
  }
  const catMatch = (m: Mechanic) => {
    if (cat === 'All') return true
    if (cat === 'Bike') return m.vehicles.includes('Bike')
    return m.skills.includes(cat)
  }

  const list = useMemo(() => {
    const q = svc.trim().toLowerCase()
    let l = MECHANICS.filter((m) =>
      catMatch(m) &&
      (avail !== 'now' || m.avail) &&
      (!dist || m.km <= dist) &&
      (!minRating || m.rating >= minRating) &&
      (types.length === 0 || types.some((t) => typeMatch(m, t))) &&
      (!q || m.spec.toLowerCase().includes(q) || m.skills.some((s) => s.toLowerCase().includes(q)) || m.name.toLowerCase().includes(q)) &&
      (!loc.trim() || `${m.area} ${m.city}`.toLowerCase().includes(loc.trim().toLowerCase())),
    )
    if (sort === 'rating') l = [...l].sort((a, b) => b.rating - a.rating || b.jobs - a.jobs)
    else if (sort === 'near') l = [...l].sort((a, b) => a.km - b.km)
    else if (sort === 'price') l = [...l].sort((a, b) => a.visit - b.visit)
    else if (sort === 'exp') l = [...l].sort((a, b) => b.exp - a.exp)
    return l
  }, [cat, avail, dist, minRating, types, sort, svc, loc])

  const hasFilters = cat !== 'All' || avail !== 'now' || dist || minRating || types.length || svc || loc
  const clearAll = () => { setCat('All'); setAvail('now'); setDist(0); setMinRating(0); setTypes([]); setSvc(''); setLoc('') }
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }))
  const head = (k: string, label: string) => (
    <button type="button" onClick={() => toggle(k)} className="w-full flex items-center justify-between gap-2">
      <span className={LABEL}>{label}</span>
      {open[k] ? <IcExpandLess size={16} className="text-[#94A3B8]" /> : <IcExpandMore size={16} className="text-[#94A3B8]" />}
    </button>
  )
  const toggleSave = (n: string) => setSaved((s) => { const x = new Set(s); x.has(n) ? x.delete(n) : x.add(n); return x })

  const Filters = (
    <>
      <div className="flex items-center justify-between gap-2.5">
        <span className="flex items-center gap-2 text-[14.5px] font-bold"><IcTune size={17} /> Filters</span>
        <div className="flex items-center gap-3">
          {hasFilters ? <button onClick={clearAll} className="text-[12px] font-semibold text-[#1864C8] hover:text-[#F4601F]">Clear all</button> : null}
          <button onClick={() => setShowFilters(false)} className="lg:hidden h-8 w-8 rounded-lg bg-[#F2F6FB] flex items-center justify-center" aria-label="Close filters"><IcCheck size={16} /></button>
        </div>
      </div>
      <div className="mt-4">
        {head('avail', 'AVAILABILITY')}
        {open.avail && (
          <div className="grid gap-[9px] mt-[9px] text-[12.5px]">
            {([['now', 'Available now'], ['today', 'Today'], ['week', 'This week']] as const).map(([k, l]) => (
              <label key={k} className={`flex items-center gap-[9px] cursor-pointer ${avail === k ? 'text-[#0E2B4C]' : 'text-[#41586F]'}`}>
                <input type="checkbox" checked={avail === k} onChange={() => setAvail(avail === k ? '' : k)} className={CHECK} /> {l}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="mt-[18px] pt-4 border-t border-[#EDF1F6]">
        {head('dist', 'DISTANCE')}
        {open.dist && (
          <div className="grid gap-[9px] mt-[9px] text-[12.5px]">
            {DISTANCES.map(([km, l]) => (
              <label key={l} className={`flex items-center gap-[9px] cursor-pointer ${dist === km ? 'text-[#0E2B4C]' : 'text-[#41586F]'}`}>
                <input type="radio" name="dist" checked={dist === km} onChange={() => setDist(km)} className={CHECK} /> {l}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="mt-[18px] pt-4 border-t border-[#EDF1F6]">
        {head('rating', 'RATING')}
        {open.rating && (
          <div className="grid gap-[9px] mt-[9px] text-[12px]">
            {RATINGS.map(([r, l], i) => (
              <label key={l} className={`flex items-center gap-[9px] cursor-pointer ${minRating === r ? 'text-[#0E2B4C]' : 'text-[#41586F]'}`}>
                <input type="checkbox" checked={minRating === r} onChange={() => setMinRating(minRating === r ? 0 : r)} className={CHECK} />
                <Stars n={5 - i} /> {l}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="mt-[18px] pt-4 border-t border-[#EDF1F6]">
        {head('type', 'SERVICE TYPE')}
        {open.type && (
          <div className="grid gap-[9px] mt-[9px] text-[12.5px]">
            {SERVICE_TYPES.map((t) => (
              <label key={t} className={`flex items-center gap-[9px] cursor-pointer ${types.includes(t) ? 'text-[#0E2B4C]' : 'text-[#41586F]'}`}>
                <input type="checkbox" checked={types.includes(t)} onChange={() => setTypes((x) => x.includes(t) ? x.filter((y) => y !== t) : [...x, t])} className={CHECK} /> {t}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="lg:hidden flex gap-2.5 pt-4 mt-4 border-t border-[#E6ECF3]">
        <button onClick={() => { clearAll(); setShowFilters(false) }} className="flex-1 h-11 rounded-[10px] border border-[#E1E8F0] text-[#0E2B4C] font-semibold text-[13.5px]">Clear</button>
        <button onClick={() => setShowFilters(false)} className="flex-[2] h-11 rounded-[10px] bg-[#0E2B4C] text-white font-semibold text-[13.5px]">Show results</button>
      </div>
    </>
  )

  return (
    <>
      <SEOHead
        title="Find a Trusted Mechanic"
        description="Browse verified, rated and background-checked mechanics near you, including Bharat Mechanics Certified experts. Doorstep service, transparent pricing."
      />
      <UserLayout>
        <div className="bg-[#F5F8FC] text-[#0E2B4C] text-[14px] leading-[1.5] pb-2">
          {/* HERO */}
          <div className="relative overflow-hidden bg-[linear-gradient(100deg,#0A2442_0%,#123A69_58%,#0D2E55_100%)]">
            <div className="absolute right-[6%] bottom-[-38%] w-[clamp(360px,44vw,620px)] aspect-square rounded-full bg-[radial-gradient(circle,rgba(244,96,31,0.30)_0%,rgba(244,96,31,0.10)_42%,rgba(244,96,31,0)_70%)] pointer-events-none" />
            <div className="absolute left-[-8%] top-[-30%] w-[40vw] aspect-square rounded-full bg-[radial-gradient(circle,rgba(26,111,212,0.22)_0%,rgba(26,111,212,0)_65%)] pointer-events-none" />
            <div className="relative max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(22px,3vw,36px)] flex flex-wrap items-end gap-[clamp(16px,2.6vw,32px)] text-white">
              <div className="flex-[1.1_1_380px] min-w-0 pb-[clamp(22px,3vw,36px)]">
                <div className="inline-flex items-center gap-2 bg-[rgba(244,96,31,0.16)] border border-[rgba(244,96,31,0.35)] rounded-[20px] px-[13px] py-1.5 text-[11px] font-bold tracking-[1.6px] text-[#FFB68C]"><span className="w-[7px] h-[7px] rounded-full bg-[#F4601F]" />CERTIFIED. LOCAL. TRUSTED.</div>
                <h1 className="mt-3.5 text-[clamp(28px,3.8vw,46px)] leading-[1.08] font-bold tracking-[-1.2px]">Find the right mechanic <span className="text-[#F4601F]">near you.</span></h1>
                <p className="mt-3 text-[clamp(13px,1.2vw,15px)] text-[#C3D4E6] max-w-[440px]">Verified, rated and background-checked professionals for all your car &amp; bike service needs.</p>
                <div className="flex flex-wrap gap-2.5 mt-5">
                  {[
                    { v: '12,000+', l: 'Verified mechanics', bg: '#F4601F', Icon: IcVerified },
                    { v: '4.8', l: 'Average rating', bg: '#F0A726', Icon: IcStar },
                    { v: '500+', l: 'Cities covered', bg: '#1A6FD4', Icon: IcLocationOn },
                  ].map((s) => (
                    <div key={s.l} className="flex items-center gap-2.5 bg-white/[0.07] border border-white/[0.12] rounded-[14px] px-3.5 py-2.5">
                      <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-white" style={{ background: s.bg }}><s.Icon size={17} /></span>
                      <div className="min-w-0"><div className="text-[17px] font-bold leading-[1.15]">{s.v}</div><div className="text-[11px] text-[#C3D4E6]">{s.l}</div></div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2.5 mt-[18px]">
                  {['Trained & Certified', 'Background Verified', 'Rated by Customers', 'Genuine Parts Usage'].map((t) => (
                    <span key={t} className="flex items-center gap-[7px] text-[12.5px] font-medium text-[#DCE7F3] whitespace-nowrap"><IcCheck size={15} className="text-[#39C07E]" />{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex-[1_1_340px] min-w-0 flex justify-center items-end">
                <DImg src="/design/mech-hero-v6-o.webp" alt="Experts Near You — certified Bharat Mechanics technician" loading="eager" fetchPriority="high" sizes="(max-width: 767px) 92vw, 560px" className="block w-full max-w-[560px] h-auto" />
              </div>
            </div>
          </div>

          {/* CATEGORY TILES */}
          <div className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(14px,2vw,20px)] flex items-center gap-2.5">
            <div className="flex-1 min-w-0 flex items-stretch gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {CATS.map(({ key, label, Icon, w }) => {
                const on = cat === key
                return (
                  <button key={key} onClick={() => setCat(key)} style={{ width: w || 78 }} className={`shrink-0 rounded-[12px] px-1.5 py-3 text-center border transition-colors ${on ? 'bg-[#0E2B4C] border-[#0E2B4C] text-white' : 'bg-white border-[#E6ECF3] text-[#0E2B4C] hover:border-[#1A6FD4]'}`}>
                    <span className="flex justify-center"><Icon size={22} className={on ? 'text-white' : 'text-[#1A6FD4]'} /></span>
                    <div className="text-[11px] font-semibold mt-2 leading-[1.2]">{label}</div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setShowFilters(true)} className="lg:hidden shrink-0 w-9 h-9 rounded-full bg-white border border-[#E1E8F0] flex items-center justify-center hover:border-[#1A6FD4]" aria-label="Filters"><IcTune size={16} /></button>
            <span className="hidden lg:flex shrink-0 w-9 h-9 rounded-full bg-white border border-[#E1E8F0] items-center justify-center text-[#0E2B4C]"><IcArrowForwardIos size={13} /></span>
          </div>

          {/* SEARCH BAR */}
          <div className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(12px,1.6vw,16px)]">
            <form onSubmit={(e) => e.preventDefault()} className="bg-white border border-[#E6ECF3] rounded-[14px] p-3 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-2.5 items-center">
              <label className="flex items-center gap-[9px] border border-[#E1E8F0] rounded-[10px] px-[13px] py-[11px] min-w-0 focus-within:border-[#1A6FD4]">
                <IcLocationOn size={17} className="text-[#1A6FD4] shrink-0" />
                <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Enter your location" className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#94A3B8]" />
              </label>
              <label className="flex items-center gap-[9px] border border-[#E1E8F0] rounded-[10px] px-[13px] py-[11px] min-w-0 focus-within:border-[#1A6FD4]">
                <IcHandyman size={17} className="text-[#1A6FD4] shrink-0" />
                <input value={svc} onChange={(e) => setSvc(e.target.value)} placeholder="Select service (optional)" className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#94A3B8]" />
                <IcExpandMore size={16} className="text-[#94A3B8] shrink-0" />
              </label>
              <button type="submit" className="flex items-center justify-center gap-[9px] bg-[#C94309] hover:bg-[#A93807] text-white rounded-[10px] px-[18px] py-[13px] text-[13.5px] font-semibold transition-colors"><IcSearch size={17} /> Search Mechanics</button>
            </form>
          </div>

          {/* FILTERS + RESULTS */}
          <div className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(14px,2vw,20px)] flex items-start gap-[clamp(12px,1.8vw,20px)] flex-wrap">
            <aside className="hidden lg:block lg:sticky lg:top-24 max-h-[calc(100vh-112px)] overflow-y-auto overscroll-contain flex-[1_1_210px] max-w-[250px] bg-white border border-[#E6ECF3] rounded-[14px] p-4 [scrollbar-width:thin]">{Filters}</aside>

            <div className="flex-[3_1_520px] min-w-0">
              <div className="flex items-center justify-between gap-3.5 flex-wrap">
                <div className="text-[14px] text-[#52667C]"><span className="text-[20px] font-bold text-[#0E2B4C]">{list.length}</span> mechanics found</div>
                <div className="flex items-center gap-2 text-[12.5px] text-[#52667C]">
                  <button onClick={() => setShowFilters(true)} className="lg:hidden flex items-center gap-1.5 bg-white border border-[#E1E8F0] rounded-[9px] px-3 py-2 font-semibold text-[#0E2B4C]"><IcTune size={15} /> Filters</button>
                  Sort by:
                  <div className="relative">
                    <button onClick={() => setSortOpen(!sortOpen)} className="flex items-center gap-2 bg-white border border-[#E1E8F0] rounded-[9px] px-3 py-2 font-semibold text-[#0E2B4C]">{SORTS.find((s) => s[0] === sort)![1]}<IcExpandMore size={16} className="text-[#5B7186]" /></button>
                    {sortOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />
                        <div className="absolute top-[42px] right-0 bg-white border border-[#E6ECF3] rounded-[12px] shadow-[0_18px_30px_rgba(12,42,77,0.12)] p-1.5 min-w-[190px] z-30">
                          {SORTS.map(([k, l]) => (
                            <button key={k} onClick={() => { setSort(k); setSortOpen(false) }} className={`flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg text-[12.5px] font-semibold ${sort === k ? 'text-[#1864C8] bg-[#EAF1FB]' : 'text-[#0E2B4C] hover:bg-[#F6F9FD]'}`}>{l}{sort === k && <IcCheck size={15} />}</button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {list.length === 0 ? (
                <div className="bg-white border border-dashed border-[#E6ECF3] rounded-2xl py-14 text-center mt-3.5">
                  <div className="h-[72px] w-[72px] rounded-[20px] bg-[#EAF1FB] text-[#1864C8] flex items-center justify-center mx-auto mb-4"><IcSearch size={32} /></div>
                  <h3 className="text-[20px] font-bold mb-2">No mechanics match your filters</h3>
                  <p className="text-[#52667C] max-w-sm mx-auto mb-5">Try widening the distance or clearing a filter.</p>
                  <button onClick={clearAll} className="h-11 px-6 rounded-[10px] bg-[#0E2B4C] hover:bg-[#16406F] text-white font-semibold">Clear all filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(255px,1fr))] gap-3.5 mt-3.5">
                  {list.map((m) => {
                    const badge = m.tag === 'popular' ? { t: 'Popular', cls: 'bg-[#C94309] text-white', Icon: IcStar }
                      : m.tag === 'quick' ? { t: 'Quick response', cls: 'bg-[#FFF1E2] text-[#9A4C08]', Icon: IcFlashOn }
                      : m.avail ? { t: 'Available now', cls: 'bg-[#E4F7EC] text-[#0F7040]', Icon: IcCheckCircle }
                      : { t: 'Schedule', cls: 'bg-[#EFF5FE] text-[#1864C8]', Icon: IcSchedule }
                    const isSaved = saved.has(m.name)
                    return (
                      <div key={m.name} className="bg-white border border-[#E6ECF3] rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-16px_rgba(12,42,77,0.28)]">
                        <div className="flex items-center justify-between gap-2.5 px-3.5 pt-[13px]">
                          <span className={`flex items-center gap-[5px] rounded-[14px] px-[9px] py-1 text-[10px] font-bold ${badge.cls}`}><badge.Icon size={10} />{badge.t}</span>
                          <button onClick={() => toggleSave(m.name)} aria-label="Save mechanic" className={`w-7 h-7 rounded-full bg-[#F2F6FB] flex items-center justify-center shrink-0 ${isSaved ? 'text-[#BE3F09]' : 'text-[#52667C] hover:text-[#F4601F]'}`}><IcFavoriteBorder size={14} /></button>
                        </div>
                        <div className="px-3.5 pt-[18px] pb-3.5 flex flex-col flex-1">
                          <div className="flex items-start gap-3">
                            <DImg src={m.avatar} alt="" sizes="54px" className="w-[54px] h-[54px] rounded-full object-cover shrink-0 bg-[#E9F0F8]" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-[13.5px] font-bold">{m.name}{m.cert && <IcVerified size={14} className="text-[#1A6FD4] shrink-0" />}</div>
                              <div className="text-[11.5px] text-[#52667C]">{m.spec}</div>
                              <div className="flex items-center gap-1.5 mt-[3px] text-[11.5px] text-[#52667C]"><span className="text-[#F0A726]">★</span><span className="font-bold text-[#0E2B4C]">{m.rating}</span> ({m.jobs.toLocaleString('en-IN')} jobs)</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-[9px] text-[11.5px] text-[#52667C]"><IcLocationOn size={14} />{m.area}, {m.city} · {m.km} km</div>
                          <div className="flex items-center gap-1.5 mt-[9px] flex-wrap">
                            {[...m.skills.slice(0, 2), m.vehicles.length === 1 ? m.vehicles[0] : m.skills[2] || m.vehicles[0]].map((s) => (
                              <span key={s} className="bg-[#EFF5FE] text-[#1864C8] rounded-[6px] px-[9px] py-1 text-[10.5px] font-semibold">{s}</span>
                            ))}
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-[11px] py-2.5 border-y border-[#EDF1F6] text-center">
                            <div><div className="text-[13px] font-bold">{m.exp} yrs</div><div className="text-[10.5px] text-[#52667C]">Experience</div></div>
                            <div><div className="text-[13px] font-bold">{m.response}</div><div className="text-[10.5px] text-[#52667C]">Response</div></div>
                            <div><div className="text-[13px] font-bold">₹{m.visit}</div><div className="text-[10.5px] text-[#52667C]">Visit from</div></div>
                          </div>
                          <div className="grid grid-cols-2 gap-[9px] mt-[11px]">
                            <Link href="/service" className="text-center bg-[#EFF5FE] hover:bg-[#DFEAFB] text-[#1864C8] hover:text-[#1A6FD4] rounded-[9px] py-2.5 text-[12.5px] font-semibold transition-colors">View profile</Link>
                            <Link href="/service" className="flex items-center justify-center gap-[7px] bg-[#C94309] hover:bg-[#A93807] text-white hover:text-white rounded-[9px] py-2.5 text-[12.5px] font-semibold transition-colors">{m.avail ? 'Book now' : 'Schedule'}<IcArrowForward size={14} /></Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* JOIN + LIST SHOP */}
          <section className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(20px,2.6vw,30px)] flex flex-wrap gap-[18px] items-stretch">
            <Link href="/become-mechanic" className="relative block flex-[2_1_460px] min-w-0 rounded-[20px] overflow-hidden bg-white border border-[#F3E2D3] shadow-[0_14px_34px_rgba(12,42,77,0.08)] hover:shadow-[0_18px_40px_rgba(244,96,31,0.16)] transition-shadow">
              <DImg sizes="(max-width: 767px) 92vw, 760px" src="/design/join-mechanic-v2-o.webp" alt="Are you a Mechanic? Get certified by Bharat Mechanics and grow your business — Join as a Mechanic" className="block w-full h-full min-h-[260px] object-cover object-center" />
            </Link>
            <div className="relative flex-[1_1_280px] min-w-0 rounded-[20px] overflow-hidden bg-[linear-gradient(160deg,#0C2A4D_0%,#123A69_60%,#1A4A85_100%)] text-white p-[clamp(20px,2.4vw,28px)] flex flex-col">
              <div className="absolute right-[-60px] top-[-60px] w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(26,111,212,0.45),rgba(26,111,212,0)_70%)]" />
              <span className="relative w-[54px] h-[54px] rounded-[15px] bg-[#1A6FD4] flex items-center justify-center shadow-[0_10px_22px_rgba(26,111,212,0.35)]"><IcStore size={26} /></span>
              <div className="relative text-[clamp(20px,2.2vw,26px)] font-bold leading-[1.15] mt-4">Open a <span className="text-[#7FB3F0]">service center?</span></div>
              <div className="relative text-[12.5px] text-[#C3D4E6] mt-2">List your garage and get more customers.</div>
              <div className="relative grid gap-2 mt-4 text-[12.5px] text-[#DCE7F3]">
                {['Free listing, no setup cost', 'Bookings from nearby customers', 'Manage everything from one dashboard'].map((t) => <div key={t} className="flex items-center gap-2"><IcCheck size={15} className="text-[#39C07E] shrink-0" />{t}</div>)}
              </div>
              <Link href="/list-your-shop" className="relative flex items-center justify-center gap-[9px] mt-5 px-5 py-[13px] bg-white hover:bg-[#EAF2FC] text-[#0E2B4C] hover:text-[#0E2B4C] rounded-[12px] text-[14px] font-bold transition-colors">List Your Shop <IcArrowForward size={16} /></Link>
            </div>
          </section>

          {/* WHY */}
          <section className="mt-[clamp(18px,2.4vw,26px)] bg-[linear-gradient(100deg,#0A2442_0%,#123A69_60%,#2A3F72_100%)] text-white">
            <div className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] py-[clamp(20px,2.8vw,30px)]">
              <h2 className="text-[clamp(20px,2.4vw,26px)] font-bold tracking-[-0.6px]">Why choose Bharat Mechanics?</h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(215px,1fr))] gap-[clamp(14px,2vw,24px)] mt-[18px]">
                {WHY.map((w) => (
                  <div key={w.title} className="flex items-center gap-3">
                    <span className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center shrink-0" style={{ background: w.bg, color: w.color }}><w.Icon size={22} /></span>
                    <div><div className="text-[13.5px] font-bold">{w.title}</div><div className="text-[11.5px] text-[#C3D4E6]">{w.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Mobile filter sheet */}
        {showFilters && <div className="lg:hidden fixed inset-0 bg-[#0E2B4C]/45 z-[100]" onClick={() => setShowFilters(false)} />}
        <aside className={`lg:hidden fixed left-0 right-0 bottom-0 z-[101] max-h-[86vh] overflow-y-auto bg-white rounded-t-[22px] shadow-[0_-12px_40px_rgba(12,42,77,0.2)] p-4 transition-transform duration-300 ${showFilters ? 'translate-y-0' : 'translate-y-full'}`}>{Filters}</aside>
      </UserLayout>
    </>
  )
}
