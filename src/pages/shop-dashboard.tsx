import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SEOHead } from '@/components/SEOHead'
import {
  LayoutDashboard, Wrench, Users, IndianRupee, CreditCard, Star, Store,
  ShieldCheck, Settings, Menu, Search, Bell, Check, X, Phone, MapPin, Plus,
  ArrowRight, AlertTriangle, Package, Navigation,
} from 'lucide-react'

const ACC = '#D97706', ACC50 = '#FEF3E2'

interface Job { id: string; cust: string; in: string; ph: string; veh: string; svc: string; issue: string; addr: string; dist: string; slot: string; status: string; step: number; parts: [string, number, number][]; labour: number; c: [number, number] }

const INIT_JOBS: Job[] = [
  { id: 'SRV-2026-0041', cust: 'Satendra Verma', in: 'SV', ph: '+91 98120 00041', veh: 'Bike · Bajaj Pulsar 150', svc: 'Home Service', issue: 'Chain broken, needs replacement', addr: 'CCV Road, Vijay Nagar, Indore', dist: '2.4 km', slot: 'Today · 10:00 AM – 12:00 PM', status: 'new', step: 0, parts: [['Chain & Sprocket Kit', 1, 1500]], labour: 99, c: [22.7510, 75.8920] },
  { id: 'SRV-2026-0040', cust: 'Anita Deshmukh', in: 'AD', ph: '+91 98120 00040', veh: 'Car · Maruti Swift', svc: 'Doorstep Service', issue: 'AC not cooling, gas refill needed', addr: 'Scheme 54, Indore', dist: '4.1 km', slot: 'Today · 2:00 PM – 4:00 PM', status: 'new', step: 0, parts: [['AC Gas Refill', 1, 1200]], labour: 599, c: [22.7470, 75.8890] },
  { id: 'SRV-2026-0039', cust: 'Rahul Mehta', in: 'RM', ph: '+91 98120 00039', veh: 'Bike · Royal Enfield', svc: 'Home Service', issue: 'Engine oil change & general check', addr: 'Palasia Square, Indore', dist: '1.8 km', slot: 'Today · 11:00 AM – 1:00 PM', status: 'ontheway', step: 3, parts: [['Engine Oil 1L — MOTUL', 1, 490], ['Oil Filter', 1, 180]], labour: 299, c: [22.7244, 75.8839] },
  { id: 'SRV-2026-0038', cust: 'Priya Nair', in: 'PN', ph: '+91 98120 00038', veh: 'Car · Hyundai i20', svc: 'Doorstep Service', issue: 'Front brake pads worn out', addr: 'Bhawarkua, Indore', dist: '3.6 km', slot: 'Today · 9:00 AM – 11:00 AM', status: 'inprogress', step: 4, parts: [['Brake Pad Set — Bosch', 1, 1250]], labour: 450, c: [22.6890, 75.8650] },
  { id: 'SRV-2026-0037', cust: 'Vikram Singh', in: 'VS', ph: '+91 98120 00037', veh: 'Bike · Honda Activa', svc: 'Home Service', issue: 'Battery dead, replacement', addr: 'Rajwada, Indore', dist: '5.2 km', slot: 'Yesterday · 4:00 PM', status: 'completed', step: 5, parts: [['Battery — Exide', 1, 1899]], labour: 200, c: [22.7180, 75.8550] },
  { id: 'SRV-2026-0036', cust: 'Sana Khan', in: 'SK', ph: '+91 98120 00036', veh: 'Car · Tata Nexon', svc: 'Doorstep Service', issue: 'Full periodic service', addr: 'MR 10, Indore', dist: '6.0 km', slot: 'Yesterday · 1:00 PM', status: 'completed', step: 5, parts: [['Air Filter — K&N', 1, 1100], ['Engine Oil 4L', 1, 1960]], labour: 899, c: [22.7600, 75.8400] },
  { id: 'SRV-2026-0035', cust: 'Deepak Joshi', in: 'DJ', ph: '+91 98120 00035', veh: 'Auto · Bajaj RE', svc: 'Home Service', issue: 'Clutch slipping', addr: 'Sudama Nagar, Indore', dist: '7.4 km', slot: 'Today · 5:00 PM', status: 'accepted', step: 1, parts: [['Clutch Plate Set', 1, 800]], labour: 350, c: [22.6950, 75.8300] },
]
const STEPS = ['New', 'Accepted', 'Assigned', 'On the way', 'In progress', 'Completed']
const ST: Record<string, { label: string; cls: string }> = {
  new: { label: 'New request', cls: 'bg-[#FEF3E2] text-[#D97706]' },
  accepted: { label: 'Accepted', cls: 'bg-[#F2F6FC] text-[#1B3B6F]' },
  assigned: { label: 'Assigned', cls: 'bg-[#F2F6FC] text-[#1B3B6F]' },
  ontheway: { label: 'On the way', cls: 'bg-[#EAF1FE] text-[#2563EB]' },
  inprogress: { label: 'In progress', cls: 'bg-[#FFF1EB] text-[#FF6B35]' },
  completed: { label: 'Completed', cls: 'bg-[#E7F6F0] text-[#15936B]' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-600' },
  paid: { label: 'Paid', cls: 'bg-[#E7F6F0] text-[#15936B]' },
  pending: { label: 'Scheduled', cls: 'bg-[#FEF3E2] text-[#D97706]' },
  verified: { label: 'Verified', cls: 'bg-[#E7F6F0] text-[#15936B]' },
}
const STAFF = [['Ramesh Kumar', 'Car · 4-wheeler', 'RK', 'online', true, '4.9', 312, '+91 98700 00001'], ['Sunil Pawar', 'Two-wheeler', 'SP', 'online', true, '4.7', 210, '+91 98700 00002'], ['Imran Shaikh', 'AC & Electrical', 'IS', 'offline', true, '4.6', 154, '+91 98700 00003'], ['Vijay Patil', 'Denting & Paint', 'VP', 'online', false, '4.4', 62, '+91 98700 00004']]
const REVIEWS = [['Vikram Singh', 'VS', 5, 'Battery replaced at home within an hour. Ramesh was polite and the price was exactly as quoted.', 'Honda Activa · 2 days ago'], ['Sana Khan', 'SK', 5, 'Excellent full service. They picked up and dropped my Nexon, transparent billing.', 'Tata Nexon · 3 days ago'], ['Priya Nair', 'PN', 4, 'Good brake job, slightly delayed but mechanic called to update. Would book again.', 'Hyundai i20 · 5 days ago'], ['Rahul Mehta', 'RM', 5, 'AC cooling fixed perfectly. Very professional and genuine parts.', 'Royal Enfield · 1 week ago'], ['Anita Deshmukh', 'AD', 4, 'Quick response and fair pricing. Mechanic was knowledgeable.', 'Maruti Swift · 1 week ago']]
const TXNS = [['Job SRV-2026-0037 payout', 'Credit', '+₹2,099', '14 Jun · 2:40 PM'], ['Platform commission (25%)', 'Debit', '−₹700', '14 Jun · 2:40 PM'], ['Job SRV-2026-0036 payout', 'Credit', '+₹3,759', '13 Jun · 6:10 PM'], ['Withdrawal to HDFC ••4821', 'Debit', '−₹15,000', '12 Jun · 11:00 AM'], ['Job SRV-2026-0034 payout', 'Credit', '+₹1,450', '11 Jun · 5:25 PM']]
const SPECS = ['Engine Repair', 'Brake System', 'Electrical', 'AC Service', 'Battery', 'Tyre Service', 'Suspension', 'Clutch', 'Oil Change', 'Body Work', 'Painting', 'General Service', 'Denting', 'Washing', 'Towing']
const SPECS_ON = ['Engine Repair', 'Brake System', 'AC Service', 'Battery', 'Oil Change', 'General Service', 'Electrical']
const VTYPES = ['Bike', 'Scooter', 'Car', 'Auto', 'Truck', 'Bus', 'Tractor', 'EV']
const VTYPES_ON = ['Bike', 'Scooter', 'Car', 'Auto']
const NAV: [string, string, any, string?][] = [['dashboard', 'Dashboard', LayoutDashboard], ['jobs', 'Jobs & Orders', Wrench, '3'], ['mechanics', 'My Mechanics', Users, '6'], ['earnings', 'Earnings & Wallet', IndianRupee], ['settlements', 'Settlements', CreditCard], ['ratings', 'Ratings & Reviews', Star], ['profile', 'Shop Profile', Store], ['kyc', 'KYC & Verification', ShieldCheck], ['settings', 'Settings', Settings]]
const TITLES: Record<string, [string, string]> = { dashboard: ['Dashboard', 'Welcome back, Sharma Auto Care 👋'], jobs: ['Jobs & Orders', 'Service requests from customers'], mechanics: ['My Mechanics', 'Your shop staff & assigned mechanics'], earnings: ['Earnings & Wallet', 'Your balance, payouts & transactions'], settlements: ['Settlements', 'Settlement cycle & history'], ratings: ['Ratings & Reviews', 'Your reputation on the platform'], profile: ['Shop Profile', 'Manage your shop details & service area'], kyc: ['KYC & Verification', 'Documents & approval status'], settings: ['Settings', 'Account preferences'] }
const jobTotal = (j: Job) => j.parts.reduce((s, l) => s + l[1] * l[2], 0) + j.labour
const inr = (n: number) => n.toLocaleString('en-IN')

function Badge({ s }: { s: string }) { const m = ST[s] || ST.pending; return <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full ${m.cls}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{m.label}</span> }
function KPI({ bg, fg, Icon, trend, dir, val, label }: any) {
  return <div className="bg-white border border-[#E7ECF3] rounded-2xl p-4 shadow-sm"><div className="flex items-center justify-between mb-2.5"><div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: bg, color: fg }}><Icon className="h-5 w-5" /></div>{trend && <span className={`text-[11px] font-bold ${dir === 'down' ? 'text-red-500' : 'text-[#15936B]'}`}>{trend}</span>}</div><div className="text-2xl font-extrabold text-[#13203A]">{val}</div><div className="text-[12.5px] text-[#7B8AA3]">{label}</div></div>
}
const Card = ({ title, link, onLink, children, action, className = '' }: any) => (
  <div className={`bg-white border border-[#E7ECF3] rounded-2xl shadow-sm overflow-hidden ${className}`}>
    {title && <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#EFF2F7]"><h3 className="font-extrabold text-[15px] text-[#13203A]">{title}</h3>{link && <button onClick={onLink} className="text-[12.5px] font-bold" style={{ color: ACC }}>{link}</button>}{action}</div>}
    <div className="p-3.5">{children}</div>
  </div>
)
const Th = ({ children }: any) => <th className="text-left text-[11px] font-bold uppercase tracking-wider text-[#7B8AA3] px-3 py-2.5 whitespace-nowrap">{children}</th>
const Field = ({ l, v }: any) => <div className="mb-3.5"><label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">{l}</label><input defaultValue={v} className="w-full h-[46px] border border-[#E7ECF3] rounded-[11px] px-3.5 text-sm bg-[#F6F8FB]" /></div>
const Chip = ({ on, children, onClick }: any) => <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-[12.5px] font-semibold border transition-colors ${on ? 'text-white border-transparent' : 'bg-white text-[#475569] border-[#E7ECF3]'}`} style={on ? { background: ACC } : {}}>{children}</button>

export default function ShopDashboard() {
  const [view, setView] = useState('dashboard')
  const [jobs, setJobs] = useState<Job[]>(INIT_JOBS)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [call, setCall] = useState<{ name: string; num: string } | null>(null)
  const [sbOpen, setSbOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [avail, setAvail] = useState(true)
  const [cycle, setCycle] = useState('weekly')
  const [specs, setSpecs] = useState<string[]>(SPECS_ON)
  const [vtypes, setVtypes] = useState<string[]>(VTYPES_ON)

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 2600) }
  const accept = (id: string) => { setJobs((j) => j.map((x) => x.id === id ? { ...x, status: 'accepted', step: 1 } : x)); flash(`Job ${id} accepted`) }
  const reject = (id: string) => { setJobs((j) => j.map((x) => x.id === id ? { ...x, status: 'rejected', step: 0 } : x)); flash(`Job ${id} rejected`) }
  const advance = (id: string) => { setJobs((j) => j.map((x) => { if (x.id !== id) return x; const step = Math.min(5, x.step + 1); const status = ['new', 'accepted', 'assigned', 'ontheway', 'inprogress', 'completed'][step]; return { ...x, step, status } })); flash(`Job ${id} → ${STEPS[Math.min(5, (jobs.find((j) => j.id === id)?.step ?? 0) + 1)]}`) }
  const go = (k: string) => { setView(k); setSbOpen(false); window.scrollTo(0, 0) }
  const toggle = (arr: string[], set: any, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const drawer = jobs.find((o) => o.id === drawerId)
  const newJobs = jobs.filter((o) => o.status === 'new')
  const online = STAFF.filter((m) => m[3] === 'online')
  const [title, sub] = TITLES[view]

  const JobRow = (j: Job) => (
    <tr key={j.id} className="border-t border-[#EFF2F7] hover:bg-[#F6F8FB] cursor-pointer" onClick={() => setDrawerId(j.id)}>
      <td className="px-3 py-3 font-bold text-[#1B3B6F] text-[13px] whitespace-nowrap">{j.id}</td>
      <td className="px-3 py-3"><div className="flex items-center gap-2.5"><span className="h-8 w-8 rounded-full bg-[#1B3B6F] text-white text-[11px] font-bold flex items-center justify-center shrink-0">{j.in}</span><div><b className="block text-[13px] text-[#13203A]">{j.cust}</b><span className="text-[11.5px] text-[#7B8AA3]">{j.veh}</span></div></div></td>
      <td className="px-3 py-3"><b className="block text-[13px] text-[#13203A]">{j.issue.split(',')[0]}</b><span className="text-[11.5px] text-[#7B8AA3]">{j.dist} away</span></td>
      <td className="px-3 py-3 text-[12.5px] text-[#475569] whitespace-nowrap">{j.slot.replace(' · ', ' ')}</td>
      <td className="px-3 py-3"><Badge s={j.status} /></td>
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        {j.status === 'new' ? <div className="flex gap-1.5 justify-end"><button onClick={() => reject(j.id)} className="h-8 px-3 rounded-lg border border-red-200 text-red-600 text-[12.5px] font-bold">Reject</button><button onClick={() => accept(j.id)} className="h-8 px-3 rounded-lg text-white text-[12.5px] font-bold inline-flex items-center gap-1" style={{ background: ACC }}><Check className="h-3.5 w-3.5" /> Accept</button></div> : <button onClick={() => setDrawerId(j.id)} className="h-8 w-8 rounded-lg border border-[#E7ECF3] flex items-center justify-center text-[#1B3B6F] ml-auto"><MapPin className="h-4 w-4" /></button>}
      </td>
    </tr>
  )
  const Table = ({ head, children }: any) => <div className="overflow-x-auto"><table className="w-full min-w-[680px]"><thead><tr>{head.map((h: string, i: number) => <Th key={i}>{h}</Th>)}</tr></thead><tbody>{children}</tbody></table></div>

  const VerifiedBanner = (
    <div className="flex items-center gap-3 bg-[#E7F6F0] border border-[#bfe8d6] rounded-2xl px-4 py-3.5 mb-5 flex-wrap">
      <div className="h-9 w-9 rounded-xl bg-[#15936B] text-white flex items-center justify-center shrink-0"><Check className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1"><b className="block text-[#13203A]">Verified Shop Partner</b><span className="text-[12.5px] text-[#475569]">KYC approved · GST compliant · Active since Jan 2025</span></div>
      <button onClick={() => setAvail(!avail)} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 border border-[#E7ECF3]"><b className="text-[13px]">{avail ? 'Accepting jobs' : 'Not accepting'}</b><span className="w-11 h-6 rounded-full relative transition-colors" style={{ background: avail ? '#15936B' : '#CBD5E1' }}><span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all ${avail ? 'right-[3px]' : 'left-[3px]'}`} /></span></button>
    </div>
  )

  function render() {
    if (view === 'jobs') return (
      <>
        <div className="flex items-center gap-2 flex-wrap mb-4">{['All jobs', 'New', 'Active', 'Completed', 'Rejected'].map((p, i) => <Chip key={p} on={i === 0}>{p}</Chip>)}<button onClick={() => setAvail(!avail)} className="ml-auto flex items-center gap-2 text-[13px] font-semibold"><span className="hidden sm:inline">{avail ? 'Accepting' : 'Paused'}</span><span className="w-11 h-6 rounded-full relative" style={{ background: avail ? ACC : '#CBD5E1' }}><span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white ${avail ? 'right-[3px]' : 'left-[3px]'}`} /></span></button></div>
        <Card title={`${jobs.length} service jobs`}><Table head={['Job ID', 'Customer', 'Service', 'Slot', 'Status', '']}>{jobs.map(JobRow)}</Table></Card>
      </>
    )
    if (view === 'mechanics') return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <KPI bg={ACC50} fg={ACC} Icon={Users} val={STAFF.length} label="Total mechanics" />
          <KPI bg="#E7F6F0" fg="#15936B" Icon={Check} trend="live" val={online.length} label="Online now" />
          <KPI bg="#FFF7E6" fg="#F5A623" Icon={Star} val="4.7" label="Avg. rating" />
          <KPI bg={ACC50} fg={ACC} Icon={ShieldCheck} val={STAFF.filter((m) => m[4]).length} label="Verified" />
        </div>
        <div className="flex items-center gap-2 mb-4">{['All', 'Online', 'Verified'].map((p, i) => <Chip key={p} on={i === 0}>{p}</Chip>)}<button onClick={() => flash('Invite mechanic')} className="ml-auto h-9 px-3.5 rounded-lg text-white text-[13px] font-bold inline-flex items-center gap-1" style={{ background: ACC }}><Plus className="h-4 w-4" /> Add mechanic</button></div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {STAFF.map((m, i) => (
            <div key={i} className="bg-white border border-[#E7ECF3] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3"><div className="relative h-11 w-11 rounded-full bg-[#1B3B6F] text-white font-bold flex items-center justify-center">{m[2]}<span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${m[3] === 'online' ? 'bg-[#15936B]' : 'bg-[#94A3B8]'}`} /></div><div><div className="flex items-center gap-1 font-bold text-[#13203A]">{m[0]}{m[4] && <Check className="h-3.5 w-3.5 text-[#15936B]" />}</div><span className="text-[12px] text-[#7B8AA3]">{m[1]}</span></div></div>
              <div className="grid grid-cols-3 gap-2 mt-3 py-3 border-y border-[#EFF2F7] text-center"><div><b className="block text-[13px]">{m[6]}</b><span className="text-[10.5px] text-[#7B8AA3]">Jobs</span></div><div><b className="block text-[13px]">★{m[5]}</b><span className="text-[10.5px] text-[#7B8AA3]">Rating</span></div><div><b className="block text-[13px]">{m[4] ? 'Verified' : 'Pending'}</b><span className="text-[10.5px] text-[#7B8AA3]">Status</span></div></div>
              <div className="flex gap-2 mt-3"><button onClick={() => setCall({ name: m[0] as string, num: m[7] as string })} className="flex-1 h-9 rounded-lg border border-[#E7ECF3] text-[13px] font-semibold text-[#475569] inline-flex items-center justify-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Call</button><button className="flex-1 h-9 rounded-lg text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5" style={{ background: ACC }}><MapPin className="h-3.5 w-3.5" /> Track</button></div>
            </div>
          ))}
        </div>
      </>
    )
    if (view === 'earnings') return (
      <>
        <div className="grid lg:grid-cols-2 gap-4 mb-5">
          <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#0F2547,#1B3B6F)' }}>
            <div className="text-[13px] text-[#aec6dd] font-semibold">Wallet balance</div>
            <div className="text-[42px] font-extrabold leading-none my-1">₹68,420</div>
            <div className="text-[12.5px] text-[#aec6dd] mb-4">Available for withdrawal · {cycle} settlement</div>
            <div className="flex gap-2.5"><button onClick={() => flash('Withdrawal requested')} className="h-10 px-4 rounded-lg text-white font-semibold inline-flex items-center gap-1.5" style={{ background: ACC }}><ArrowRight className="h-4 w-4 rotate-90" /> Withdraw</button><button onClick={() => go('settlements')} className="h-10 px-4 rounded-lg bg-white/15 text-white font-semibold">View settlements</button></div>
          </div>
          <Card title="Commission structure">{[['Platform commission', '25%', '#13203A'], ['Your share', '75%', '#15936B'], ['Settlement cycle', cycle, '#13203A']].map(([l, v, c], i) => <div key={l as string} className={`flex items-center justify-between py-2.5 ${i ? 'border-t border-[#EFF2F7]' : ''}`}><span className="text-[13.5px] text-[#475569]">{l}</span><b className="capitalize" style={{ color: c as string }}>{v}</b></div>)}</Card>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <KPI bg="#E7F6F0" fg="#15936B" Icon={IndianRupee} dir="up" trend="▲ 14%" val="₹8.4L" label="Total earnings" />
          <KPI bg="#F2F6FC" fg="#1B3B6F" Icon={CreditCard} trend="25%" val="₹2.8L" label="Commission paid" />
          <KPI bg={ACC50} fg={ACC} Icon={IndianRupee} dir="up" trend="▲ 9%" val="₹1.86L" label="This month" />
          <KPI bg="#FFF7E6" fg="#F5A623" Icon={AlertTriangle} val="₹42.8k" label="Pending" />
        </div>
        <Card title="Wallet transactions" link="Download →"><Table head={['Description', 'Type', 'Amount', 'Date', 'Status']}>{TXNS.map((t, i) => <tr key={i} className="border-t border-[#EFF2F7]"><td className="px-3 py-3 font-semibold text-[13px] text-[#13203A]">{t[0]}</td><td className="px-3 py-3 text-[13px] text-[#475569]">{t[1]}</td><td className={`px-3 py-3 font-bold text-[13px] ${t[1] === 'Credit' ? 'text-[#15936B]' : 'text-red-600'}`}>{t[2]}</td><td className="px-3 py-3 text-[13px] text-[#475569] whitespace-nowrap">{t[3]}</td><td className="px-3 py-3"><Badge s="paid" /></td></tr>)}</Table></Card>
      </>
    )
    if (view === 'settlements') return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5"><KPI bg="#E7F6F0" fg="#15936B" Icon={IndianRupee} dir="up" trend="▲ 9%" val="₹38.4L" label="Settled (month)" /><KPI bg={ACC50} fg={ACC} Icon={AlertTriangle} trend="21 Jun" val="₹42.8k" label="Pending settlement" /><KPI bg="#F2F6FC" fg="#1B3B6F" Icon={Check} val="14 Jun" label="Last settled" /><KPI bg="#EAF1FE" fg="#2563EB" Icon={CreditCard} val="HDFC ••4821" label="Payout account" /></div>
        <Card title="Settlement cycle" className="mb-4"><p className="text-[13px] text-[#475569] mb-3">Choose how often payouts are credited to your bank account.</p><div className="flex gap-2 flex-wrap">{['daily', 'weekly', 'biweekly', 'monthly'].map((c) => <Chip key={c} on={cycle === c} onClick={() => { setCycle(c); flash(`Settlement cycle set to ${c}`) }}>{c[0].toUpperCase() + c.slice(1)}</Chip>)}</div></Card>
        <Card title="Settlement history"><Table head={['Reference', 'Type', 'Amount', 'Status', 'Date', '']}>{[['SETL-0418', 'Weekly settlement', '₹3,84,200', 'paid', '14 Jun'], ['SETL-0411', 'Weekly settlement', '₹4,12,800', 'paid', '7 Jun'], ['SETL-0404', 'Weekly settlement', '₹3,56,100', 'paid', '31 May'], ['SETL-NEXT', 'Upcoming settlement', '₹42,800', 'pending', '21 Jun']].map((p, i) => <tr key={i} className="border-t border-[#EFF2F7]"><td className="px-3 py-3 font-bold text-[#1B3B6F] text-[13px]">{p[0]}</td><td className="px-3 py-3 text-[13px]">{p[1]}</td><td className="px-3 py-3 font-bold text-[13px]">{p[2]}</td><td className="px-3 py-3"><Badge s={p[3]} /></td><td className="px-3 py-3 text-[13px] text-[#475569]">{p[4]}</td><td className="px-3 py-3"><button className="text-[12.5px] font-bold" style={{ color: ACC }}>Statement</button></td></tr>)}</Table></Card>
      </>
    )
    if (view === 'ratings') return (
      <>
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Card title=""><div className="flex items-center gap-5"><div className="text-center"><div className="text-5xl font-extrabold text-[#13203A]">4.8</div><div className="text-[#F5A623] text-lg">★★★★★</div><div className="text-[12px] text-[#7B8AA3] mt-1">1,284 ratings</div></div><div className="flex-1">{[[5, 72], [4, 18], [3, 6], [2, 3], [1, 1]].map(([s, w]) => <div key={s} className="flex items-center gap-2 mb-1"><span className="text-[11px] w-6 text-[#7B8AA3]">{s}★</span><div className="flex-1 h-1.5 rounded-full bg-[#EFF2F7] overflow-hidden"><div className="h-full bg-[#F5A623]" style={{ width: `${w}%` }} /></div><span className="text-[11px] w-8 text-right text-[#7B8AA3]">{w}%</span></div>)}</div></div></Card>
          <Card title="Reputation"><div className="text-2xl font-extrabold text-[#15936B] mb-1">Top 5%</div><div className="text-[12.5px] text-[#7B8AA3] mb-3">Ranked among Indore shops</div>{[['On-time arrival', '96%'], ['Repeat customers', '41%'], ['Avg. response time', '4 min'], ['Completion rate', '98%']].map(([l, v]) => <div key={l} className="flex justify-between text-[13.5px] py-2 border-t border-[#EFF2F7]"><span className="text-[#475569]">{l}</span><b>{v}</b></div>)}</Card>
        </div>
        <Card title="Recent customer reviews">{REVIEWS.map((r, i) => <div key={i} className="flex gap-3 py-3 border-b border-[#EFF2F7] last:border-0"><div className="h-9 w-9 rounded-full bg-[#1B3B6F] text-white text-xs font-bold flex items-center justify-center shrink-0">{r[1]}</div><div className="flex-1"><div className="flex items-center justify-between"><b className="text-[13.5px] text-[#13203A]">{r[0]}</b><span className="text-[#F5A623] text-sm">{'★'.repeat(r[2] as number)}<span className="text-[#E7ECF3]">{'★'.repeat(5 - (r[2] as number))}</span></span></div><p className="text-[13px] text-[#475569] mt-1">{r[3]}</p><div className="text-[11.5px] text-[#7B8AA3] mt-1">{r[4]}</div></div></div>)}</Card>
      </>
    )
    if (view === 'profile') return (
      <>
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Card title="Shop details"><Field l="Shop name" v="Sharma Auto Care" /><div className="grid grid-cols-2 gap-3"><Field l="Phone" v="+91 98120 00099" /><Field l="Email" v="sharma.autocare@gmail.com" /></div><Field l="Full address" v="12 CCV Road, Vijay Nagar, Indore, MP 452010" /><button onClick={() => flash('Shop profile saved')} className="h-11 px-5 rounded-lg text-white font-semibold inline-flex items-center gap-2" style={{ background: ACC }}><Check className="h-4 w-4" /> Save profile</button></Card>
          <Card title="Logo & availability"><div className="flex items-center gap-3.5 mb-4"><div className="h-[72px] w-[72px] rounded-2xl flex items-center justify-center font-extrabold text-2xl" style={{ background: ACC50, color: ACC }}>SA</div><button className="h-10 px-4 rounded-lg border border-[#E7ECF3] text-[#475569] font-semibold inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> Upload logo</button></div><div className="flex items-center justify-between bg-[#F6F8FB] rounded-xl px-3.5 py-3 mb-4"><b className="text-[13.5px]">Available for new jobs</b><button onClick={() => setAvail(!avail)} className="w-11 h-6 rounded-full relative" style={{ background: avail ? ACC : '#CBD5E1' }}><span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white ${avail ? 'right-[3px]' : 'left-[3px]'}`} /></button></div><div className="grid grid-cols-2 gap-3"><Field l="Opens" v="09:00 AM" /><Field l="Closes" v="08:00 PM" /></div><div className="text-[12.5px] text-[#7B8AA3]">Working days: Mon–Sat</div></Card>
        </div>
        <Card title="Specializations" className="mb-4"><div className="flex flex-wrap gap-2">{SPECS.map((s) => <Chip key={s} on={specs.includes(s)} onClick={() => toggle(specs, setSpecs, s)}>{s}</Chip>)}</div></Card>
        <Card title="Vehicle types serviced"><div className="flex flex-wrap gap-2">{VTYPES.map((v) => <Chip key={v} on={vtypes.includes(v)} onClick={() => toggle(vtypes, setVtypes, v)}>{v}</Chip>)}</div></Card>
      </>
    )
    if (view === 'kyc') return (
      <>
        <div className="flex items-center gap-3 bg-[#E7F6F0] border border-[#bfe8d6] rounded-2xl px-4 py-3.5 mb-5"><div className="h-9 w-9 rounded-xl bg-[#15936B] text-white flex items-center justify-center shrink-0"><Check className="h-5 w-5" /></div><div><b className="block text-[#13203A]">KYC Verified ✓</b><span className="text-[12.5px] text-[#475569]">Approved on 12 Jan 2025 · You can receive jobs and payouts.</span></div></div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card title="Identity details"><Field l="Owner full name" v="Rajesh Sharma" /><div className="grid grid-cols-2 gap-3"><Field l="Aadhaar number" v="XXXX XXXX 4821" /><Field l="PAN number" v="ABCDE1234F" /></div><Field l="GST number (optional)" v="23ABCDE1234F1Z5" /><button onClick={() => flash('KYC details submitted for review')} className="h-11 px-5 rounded-lg text-white font-semibold inline-flex items-center gap-2" style={{ background: ACC }}><ArrowRight className="h-4 w-4" /> Update details</button></Card>
          <Card title="Documents">{[['Aadhaar Card', 'XXXX XXXX 4821', 'verified'], ['PAN Card', 'ABCDE1234F', 'verified'], ['GST Certificate', '23ABCDE1234F1Z5', 'verified'], ['Trade License', 'Pending upload', 'pending'], ['Owner Photo', 'Rajesh Sharma', 'verified']].map((d, i) => <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#EFF2F7] last:border-0"><div className="h-9 w-9 rounded-lg bg-[#F6F8FB] flex items-center justify-center"><FileIcon /></div><div className="flex-1 min-w-0"><b className="block text-[13px] text-[#13203A]">{d[0]}</b><span className="text-[11.5px] text-[#7B8AA3]">{d[1]}</span></div><Badge s={d[2]} /></div>)}<button onClick={() => flash('Upload dialog')} className="mt-3 h-10 w-full rounded-lg border border-dashed border-[#E7ECF3] text-[#475569] font-semibold inline-flex items-center justify-center gap-1.5"><Plus className="h-4 w-4" /> Upload a document</button></Card>
        </div>
      </>
    )
    if (view === 'settings') return (
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Account"><Field l="Login email" v="sharma.autocare@gmail.com" /><Field l="Password" v="••••••••••" /><button onClick={() => flash('Settings saved')} className="h-11 px-5 rounded-lg text-white font-semibold inline-flex items-center gap-2" style={{ background: ACC }}><Check className="h-4 w-4" /> Save changes</button></Card>
        <Card title="Notifications">{['New job alerts', 'Settlement updates', 'Customer reviews', 'Low-rating warnings'].map((t, i) => <Toggle key={t} label={t} init={i < 3} />)}<div className="mt-4 p-3.5 rounded-xl text-[12.5px]" style={{ background: ACC50, color: '#8a5a08' }}>🔒 Your bank details can only be changed by the admin team for security.</div></Card>
      </div>
    )
    // dashboard
    return (
      <>
        {VerifiedBanner}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <KPI bg={ACC50} fg={ACC} Icon={Wrench} dir="up" trend={`▲ ${jobs.filter((j) => ['accepted', 'assigned', 'ontheway', 'inprogress'].includes(j.status)).length}`} val={jobs.filter((j) => ['accepted', 'assigned', 'ontheway', 'inprogress'].includes(j.status)).length} label="Active jobs" />
          <KPI bg="#F2F6FC" fg="#1B3B6F" Icon={Check} dir="up" trend="▲ 32" val="1,284" label="Jobs completed" />
          <KPI bg="#E7F6F0" fg="#15936B" Icon={IndianRupee} dir="up" trend="▲ 14%" val="₹1.86L" label="Earnings (month)" />
          <KPI bg="#FFF7E6" fg="#F5A623" Icon={Star} dir="up" trend="▲ 0.1" val="4.8" label="Current rating" />
        </div>
        {newJobs.length > 0 && (
          <div className="bg-white border border-[#bfe8d6] rounded-2xl shadow-sm overflow-hidden mb-5">
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#E7F6F0' }}><h3 className="font-extrabold text-[15px] text-[#15936B]">⚡ {newJobs.length} new job requests awaiting action</h3><button onClick={() => go('jobs')} className="text-[12.5px] font-bold" style={{ color: ACC }}>View all →</button></div>
            <div className="p-3 space-y-2">{newJobs.map((j) => (
              <div key={j.id} className="flex items-center gap-3 flex-wrap"><span className="h-9 w-9 rounded-full bg-[#1B3B6F] text-white text-[11px] font-bold flex items-center justify-center">{j.in}</span><div className="min-w-0 flex-1 cursor-pointer" onClick={() => setDrawerId(j.id)}><b className="block text-[13px] text-[#13203A]">{j.cust} · {j.id}</b><span className="text-[11.5px] text-[#7B8AA3]">{j.issue.split(',')[0]} · {j.veh}</span></div><span className="font-bold text-[13px]">₹{inr(jobTotal(j))}</span><button onClick={() => setCall({ name: j.cust, num: j.ph })} className="h-8 w-8 rounded-lg border border-[#E7ECF3] flex items-center justify-center text-[#15936B]"><Phone className="h-4 w-4" /></button><button onClick={() => reject(j.id)} className="h-8 px-3 rounded-lg border border-red-200 text-red-600 text-[12.5px] font-bold">Reject</button><button onClick={() => accept(j.id)} className="h-8 px-3 rounded-lg text-white text-[12.5px] font-bold inline-flex items-center gap-1" style={{ background: ACC }}><Check className="h-3.5 w-3.5" /> Accept</button></div>
            ))}</div>
          </div>
        )}
        <div className="grid lg:grid-cols-[1fr_360px] gap-4 mb-5">
          <Card title="Earnings overview" link="Wallet →" onLink={() => go('earnings')}>
            <div className="flex items-end gap-2.5 h-40 px-1">{[[58, 32], [72, 40], [64, 36], [88, 52], [76, 44], [95, 60], [82, 50]].map((d, i) => <div key={i} className="flex-1 flex flex-col items-center gap-1"><div className="w-full flex items-end gap-1 h-full justify-center"><i className="w-2.5 rounded-t-sm" style={{ height: `${d[0]}%`, background: '#1B3B6F' }} /><i className="w-2.5 rounded-t-sm" style={{ height: `${d[1]}%`, background: ACC }} /></div><span className="text-[10px] text-[#7B8AA3]">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span></div>)}</div>
            <div className="flex gap-4 mt-3 text-[12px] text-[#475569]"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#1B3B6F]" /> Labour</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: ACC }} /> Parts</span></div>
          </Card>
          <Card title="Job status"><div className="flex items-center gap-4"><div className="h-28 w-28 rounded-full shrink-0 flex items-center justify-center" style={{ background: 'conic-gradient(#15936B 0% 68%, #FF6B35 68% 84%, #2A5298 84% 95%, #CBD5E1 95% 100%)' }}><div className="h-20 w-20 rounded-full bg-white flex flex-col items-center justify-center"><b className="text-xl font-extrabold text-[#13203A]">86</b><span className="text-[11px] text-[#7B8AA3]">this week</span></div></div><div className="flex-1 space-y-1.5 text-[12.5px]">{[['Completed', 58, '#15936B'], ['In progress', 14, '#FF6B35'], ['On the way', 9, '#2A5298'], ['New', 5, '#CBD5E1']].map((d) => <div key={d[0] as string} className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: d[2] as string }} /><span className="flex-1 text-[#475569]">{d[0]}</span><b>{d[1]}</b></div>)}</div></div></Card>
        </div>
        <Card title="Recent jobs" link="View all →" onLink={() => go('jobs')}><Table head={['Job ID', 'Customer', 'Service', 'Slot', 'Status', '']}>{jobs.slice(0, 5).map(JobRow)}</Table></Card>
      </>
    )
  }

  return (
    <>
      <SEOHead title="Shop Partner Dashboard" description="Bharat Mechanics shop partner console." noIndex />
      <div className="min-h-screen bg-[#F6F8FB] flex">
        {sbOpen && <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setSbOpen(false)} />}
        <aside className={`fixed lg:sticky top-0 z-50 h-screen w-64 bg-white border-r border-[#E7ECF3] flex flex-col transition-transform ${sbOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="px-5 py-4 border-b border-[#EFF2F7]"><Image src="/brand-logo-v3.png" alt="Bharat Mechanics" width={150} height={48} className="h-8 w-auto object-contain" /></div>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#EFF2F7]"><div className="h-10 w-10 rounded-full text-white font-bold flex items-center justify-center shrink-0" style={{ background: ACC }}>SA</div><div className="min-w-0 flex-1"><b className="block text-[13.5px] text-[#13203A] truncate">Sharma Auto Care</b><span className="text-[11.5px] text-[#7B8AA3]">Shop Partner · Indore</span></div><ShieldCheck className="h-4 w-4 text-[#15936B]" /></div>
          <nav className="flex-1 overflow-y-auto py-2 px-2.5 scrollbar-ultra-narrow">
            {NAV.map(([key, label, Icon, badge]) => { const active = view === key
              return <button key={key} onClick={() => go(key)} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13.5px] font-semibold mb-0.5 transition-colors ${active ? 'text-white' : 'text-[#475569] hover:bg-[#F6F8FB]'}`} style={active ? { background: ACC } : {}}><Icon className="h-[18px] w-[18px]" /> {label}{badge && <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-[#FF6B35] text-white'}`}>{badge}</span>}</button> })}
          </nav>
          <div className="border-t border-[#EFF2F7] p-2.5"><Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-semibold text-[#475569] hover:bg-[#F6F8FB]"><ArrowRight className="h-[18px] w-[18px] rotate-180" /> Back to website</Link></div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E7ECF3] px-4 md:px-6 py-3 flex items-center gap-3">
            <button onClick={() => setSbOpen(true)} className="lg:hidden h-9 w-9 rounded-lg border border-[#E7ECF3] flex items-center justify-center"><Menu className="h-5 w-5" /></button>
            <div className="min-w-0"><h1 className="text-base md:text-lg font-extrabold text-[#13203A] truncate">{title}</h1><p className="text-[12px] text-[#7B8AA3] truncate hidden sm:block">{sub}</p></div>
            <button className="ml-auto hidden md:flex items-center gap-2 h-10 px-3.5 rounded-xl bg-[#F6F8FB] border border-[#E7ECF3] text-[13px] text-[#7B8AA3]"><Search className="h-4 w-4" /> Search jobs, customers…</button>
            <button className="relative h-10 w-10 rounded-xl border border-[#E7ECF3] flex items-center justify-center"><Bell className="h-5 w-5 text-[#475569]" /><span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#FF6B35] text-white text-[9px] font-bold flex items-center justify-center">3</span></button>
            <div className="hidden sm:flex items-center gap-2"><div className="h-9 w-9 rounded-full text-white font-bold flex items-center justify-center text-sm" style={{ background: ACC }}>SA</div><b className="text-sm text-[#13203A]">Sharma</b></div>
          </header>
          <div className="p-4 md:p-6 max-w-[1400px] mx-auto">{render()}</div>
        </div>
      </div>

      {/* Job drawer */}
      {drawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setDrawerId(null)} />
          <aside className="fixed right-0 top-0 h-screen w-full max-w-md bg-white z-[61] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7ECF3]"><div><div className="font-extrabold text-[#13203A]">{drawer.id}</div><Badge s={drawer.status} /></div><button onClick={() => setDrawerId(null)} className="h-9 w-9 rounded-lg bg-[#F6F8FB] flex items-center justify-center"><X className="h-4 w-4" /></button></div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex items-center gap-3"><div className="h-11 w-11 rounded-full bg-[#1B3B6F] text-white font-bold flex items-center justify-center">{drawer.in}</div><div className="flex-1"><b className="block text-[#13203A]">{drawer.cust}</b><span className="text-[12.5px] text-[#7B8AA3]">{drawer.veh}</span></div><button onClick={() => setCall({ name: drawer.cust, num: drawer.ph })} className="h-10 w-10 rounded-lg flex items-center justify-center text-white" style={{ background: '#15936B' }}><Phone className="h-5 w-5" /></button></div>
              <div className="rounded-xl overflow-hidden border border-[#E7ECF3] h-44"><iframe title="map" className="w-full h-full" loading="lazy" src={`https://maps.google.com/maps?q=${drawer.c[0]},${drawer.c[1]}&z=14&output=embed`} /></div>
              <div className="flex items-start gap-2 text-[13px] text-[#475569]"><MapPin className="h-4 w-4 text-[#7B8AA3] mt-0.5 shrink-0" /> {drawer.addr} · <b>{drawer.dist}</b></div>
              <div><h4 className="font-bold text-[#13203A] mb-3 text-sm">Job tracking</h4><div className="space-y-0">{STEPS.map((st, i) => { const done = drawer.status === 'completed' || i < drawer.step; const curr = i === drawer.step && drawer.status !== 'completed' && drawer.status !== 'rejected'
                return <div key={st} className="flex gap-3 pb-4 last:pb-0"><div className="flex flex-col items-center"><div className={`h-5 w-5 rounded-full flex items-center justify-center ${done ? 'text-white' : curr ? 'border-2' : 'bg-[#EFF2F7]'}`} style={done ? { background: ACC } : curr ? { borderColor: ACC } : {}}>{done && <Check className="h-3 w-3" />}{curr && <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACC }} />}</div>{i < STEPS.length - 1 && <span className="w-px flex-1 bg-[#EFF2F7]" />}</div><div className="-mt-0.5"><b className="block text-[13px] text-[#13203A]">{st}</b><span className="text-[11.5px] text-[#7B8AA3]">{done ? 'Completed' : curr ? 'In progress' : 'Pending'}</span></div></div> })}</div></div>
              <div><h4 className="font-bold text-[#13203A] mb-3 text-sm">Parts & labour</h4>{drawer.parts.map((l, i) => <div key={i} className="flex items-center gap-3 py-2 border-b border-[#EFF2F7]"><div className="h-9 w-9 rounded-lg bg-[#F6F8FB] flex items-center justify-center"><Package className="h-4 w-4 text-[#1B3B6F]" /></div><b className="flex-1 text-[13px] text-[#13203A]">{l[0]}</b><span className="text-[12px] text-[#7B8AA3]">×{l[1]}</span><span className="font-bold text-[13px]">₹{inr(l[2])}</span></div>)}<div className="flex items-center justify-between py-2 border-b border-[#EFF2F7]"><span className="flex-1 text-[13px] text-[#475569]">Labour charge</span><span className="font-bold text-[13px]">₹{inr(drawer.labour)}</span></div><div className="flex items-center justify-between pt-3"><span className="text-[#475569] font-semibold text-sm">Job total</span><b className="text-lg">₹{inr(jobTotal(drawer))}</b></div></div>
            </div>
            <div className="p-4 border-t border-[#E7ECF3] flex gap-2.5">
              {drawer.status === 'new' ? <><button onClick={() => reject(drawer.id)} className="flex-1 h-12 rounded-lg border border-red-200 text-red-600 font-semibold">Reject</button><button onClick={() => accept(drawer.id)} className="flex-1 h-12 rounded-lg text-white font-semibold inline-flex items-center justify-center gap-2" style={{ background: ACC }}><Check className="h-4 w-4" /> Accept job</button></>
                : drawer.status === 'completed' ? <button disabled className="flex-1 h-12 rounded-lg text-white font-semibold inline-flex items-center justify-center gap-2" style={{ background: '#15936B' }}><Check className="h-4 w-4" /> Completed</button>
                : drawer.status === 'rejected' ? <button disabled className="flex-1 h-12 rounded-lg bg-[#7B8AA3] text-white font-semibold">Job rejected</button>
                : <><button onClick={() => setCall({ name: drawer.cust, num: drawer.ph })} className="h-12 px-4 rounded-lg font-semibold" style={{ background: '#E7F6F0', color: '#15936B' }}><Phone className="h-5 w-5" /></button><button onClick={() => advance(drawer.id)} className="flex-1 h-12 rounded-lg text-white font-semibold inline-flex items-center justify-center gap-2" style={{ background: ACC }}><Navigation className="h-4 w-4" /> Mark {STEPS[drawer.step + 1] || 'Completed'}</button></>}
            </div>
          </aside>
        </>
      )}

      {/* Call modal */}
      {call && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setCall(null) }}>
          <div className="bg-white rounded-2xl p-7 text-center w-full max-w-xs"><div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white animate-pulse" style={{ background: ACC }}><Phone className="h-7 w-7" /></div><b className="block text-lg text-[#13203A]">{call.name}</b><div className="text-[#7B8AA3] mt-1">{call.num}</div><div className="flex gap-2.5 mt-5"><button onClick={() => setCall(null)} className="flex-1 h-11 rounded-lg border border-[#E7ECF3] font-semibold text-[#475569]">Cancel</button><a href={`tel:${call.num.replace(/\s/g, '')}`} className="flex-1 h-11 rounded-lg text-white font-semibold inline-flex items-center justify-center gap-2" style={{ background: '#15936B' }}><Phone className="h-4 w-4" /> Call now</a></div></div>
        </div>
      )}

      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] bg-[#13203A] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-[#5fd6aa]" /> {toast}</div>}
    </>
  )
}

function Toggle({ label, init }: { label: string; init: boolean }) {
  const [on, setOn] = useState(init)
  return <div className="flex items-center justify-between py-3 border-b border-[#EFF2F7]"><b className="text-[13.5px] text-[#13203A]">{label}</b><button onClick={() => setOn(!on)} className="w-11 h-6 rounded-full relative transition-colors" style={{ background: on ? ACC : '#CBD5E1' }}><span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all ${on ? 'right-[3px]' : 'left-[3px]'}`} /></button></div>
}
function FileIcon() { return <ShieldCheck className="h-4 w-4 text-[#1B3B6F]" /> }
