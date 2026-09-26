// Services landing (/services) — restyled to the Claude Design handoff
// ("Bharat Mechanics Services"). Static marketing page: the category tiles
// filter the service list (preserving the previous tab filter), and every
// CTA still routes to the real booking wizard (/service), /emergency or tel:.
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { ScaledStage } from '@/components/home/ScaledStage'
import { DImg } from '@/components/ui/DImg'
import {
  IcArrowForward, IcStar, IcSchedule, IcVerifiedUser, IcSearch, IcCalendarToday,
  IcPerson, IcCreditCard, IcSettings, IcCall, IcBuild, IcDirectionsCar, IcTwoWheeler,
  IcLocalShipping, IcLocationOn, IcExpandMore, IcGroups, IcCheckCircle,
} from '@/components/icons/BmIcons'

interface Service {
  name: string; desc: string; price: string; mrp: string; badge: string; badgeTone: 'orange' | 'green'
  time: string; cat: string; rating: string; booked: string; pop: boolean; img: string
}

const SERVICES: Service[] = [
  { name: 'Periodic Service', desc: 'Complete 30-point inspection, oil change, filter clean & top-ups.', price: '2,499', mrp: '3,200', badge: 'Most booked', badgeTone: 'orange', time: '3-4 hrs', cat: 'periodic', rating: '4.8', booked: '12.4k', pop: true, img: '/design/svccard-oil.png' },
  { name: 'AC Service & Gas Refill', desc: 'AC inspection, gas top-up, cooling coil clean & odour removal.', price: '1,799', mrp: '2,250', badge: 'Save 20%', badgeTone: 'green', time: '2 hrs', cat: 'ac', rating: '4.7', booked: '8.1k', pop: false, img: '/design/svccard-ac.png' },
  { name: 'Brake Service', desc: 'Brake pad check, fluid top-up, rotor inspection & adjustment.', price: '999', mrp: '1,300', badge: 'Save 25%', badgeTone: 'orange', time: '1-2 hrs', cat: 'repairs', rating: '4.9', booked: '9.6k', pop: false, img: '/design/svccard-brake.png' },
  { name: 'Battery Replacement', desc: 'Genuine battery with old-battery buyback & free fitting.', price: '4,499', mrp: '5,200', badge: 'Save 15%', badgeTone: 'green', time: '45 min', cat: 'batteries', rating: '4.8', booked: '5.3k', pop: false, img: '/design/svc-battery.png' },
  { name: 'Oil Change', desc: 'Premium engine oil + filter replacement at your doorstep.', price: '599', mrp: '999', badge: 'Most booked', badgeTone: 'orange', time: '45 min', cat: 'periodic', rating: '4.9', booked: '15.2k', pop: true, img: '/design/svc-oil.png' },
  { name: 'Denting & Painting', desc: 'Dent removal, primer & paint match with showroom finish.', price: '1,499', mrp: '2,100', badge: 'Save 30%', badgeTone: 'green', time: '1 day', cat: 'denting', rating: '4.7', booked: '3.8k', pop: false, img: '/design/svc-paint.png' },
  { name: 'Car Spa & Detailing', desc: 'Foam wash, interior vacuum, polish & ceramic coating options.', price: '899', mrp: '1,400', badge: 'Save 35%', badgeTone: 'green', time: '2-3 hrs', cat: 'detailing', rating: '4.8', booked: '6.9k', pop: false, img: '/design/help-car.png' },
  { name: 'Roadside Assistance', desc: '24/7 emergency help — jump-start, flat tyre, towing & fuel.', price: '499', mrp: '750', badge: 'Most booked', badgeTone: 'orange', time: '30 min ETA', cat: 'emergency', rating: '4.9', booked: '4.2k', pop: true, img: '/design/svc-roadside.png' },
  { name: 'Wheel Alignment & Balancing', desc: 'Computerised alignment, balancing & tyre rotation.', price: '799', mrp: '1,100', badge: 'Save 27%', badgeTone: 'green', time: '1 hr', cat: 'tyres', rating: '4.6', booked: '3.1k', pop: false, img: '/design/svc-brake.png' },
]

/* Design category tiles — clicking one filters the list (click again to clear) */
const CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: 'periodic', label: 'Periodic Service', icon: '/design/svcicon-periodic.png' },
  { key: 'repairs', label: 'Repairs', icon: '/design/svcicon-repairs.png' },
  { key: 'ac', label: 'AC & Cooling', icon: '/design/svcicon-accool.png' },
  { key: 'batteries', label: 'Batteries', icon: '/design/svcicon-batteries.png' },
  { key: 'tyres', label: 'Tyres & Wheels', icon: '/design/svcicon-tyres.png' },
  { key: 'denting', label: 'Denting & Painting', icon: '/design/svcicon-denting.png' },
  { key: 'detailing', label: 'Detailing', icon: '/design/svcicon-detailing.png' },
  { key: 'emergency', label: 'Emergency', icon: '/design/svcicon-emergency.png' },
]

const BRANDS: { name: string; logo: string }[] = [
  { name: 'Maruti Suzuki', logo: '/design/brand-maruti.png' },
  { name: 'Hyundai', logo: '/design/brand-hyundai.png' },
  { name: 'Tata', logo: '/design/brand-tata.png' },
  { name: 'Mahindra', logo: '/design/brand-mahindra.png' },
  { name: 'Honda', logo: '/design/brand-honda.png' },
  { name: 'Toyota', logo: '/design/brand-toyota.png' },
  { name: 'Kia', logo: '/design/brand-kia.png' },
  { name: 'Renault', logo: '/design/brand-renault.png' },
  { name: 'Skoda', logo: '/design/brand-skoda.png' },
  { name: 'Volkswagen', logo: '/design/brand-vw.png' },
]

const STEPS = [
  { Icon: IcSearch, title: 'Choose a service', desc: 'Pick from service categories' },
  { Icon: IcCalendarToday, title: 'Pick a time slot', desc: 'Same-day or schedule later' },
  { Icon: IcPerson, title: 'Mechanic arrives', desc: 'Track live to your doorstep' },
  { Icon: IcCreditCard, title: 'Pay after service', desc: 'Rate your mechanic & relax' },
]

const SERVICE_AREAS: [string, string][] = [
  ['gorakhpur', 'Gorakhpur'], ['deoria', 'Deoria'], ['kushinagar', 'Kushinagar'], ['padrauna', 'Padrauna'], ['kasia', 'Kasia'],
  ['hata', 'Hata'], ['kaptanganj', 'Kaptanganj'], ['ramkola', 'Ramkola'], ['rudrapur', 'Rudrapur'], ['salempur', 'Salempur'],
  ['gauri-bazar', 'Gauri Bazar'], ['chauri-chaura', 'Chauri Chaura'], ['tamkuhi-raj', 'Tamkuhi Raj'], ['khadda', 'Khadda'],
  ['bhatpar-rani', 'Bhatpar Rani'], ['barhaj', 'Barhaj'], ['maharajganj', 'Maharajganj'], ['ghughli', 'Ghughli'],
]

const WHY = [
  { Icon: IcVerifiedUser, fg: '#17A05A', bg: '#E4F5EA', title: 'Certified Mechanics', desc: 'ID-verified, trained & rated' },
  { Icon: IcSettings, fg: '#1A6FD4', bg: '#E4EEFB', title: 'Genuine Parts Only', desc: 'OEM with invoice' },
  { Icon: IcSchedule, fg: '#F4601F', bg: '#FFEDE1', title: 'On-time, Live Tracked', desc: 'Know your mechanic ETA' },
  { Icon: IcCreditCard, fg: '#6D4AE0', bg: '#EDE9FE', title: 'Transparent Pricing', desc: 'No hidden charges' },
]

const HERO_CARDS = [
  { icon: '/design/sv-ic1.webp', a: '30-day', b: 'Warranty', sub: 'On every service' },
  { icon: '/design/sv-ic2.webp', a: 'Verified', b: 'Mechanics', sub: 'Trained & Trusted' },
  { icon: '/design/sv-ic3.webp', a: 'Live', b: 'Tracking', sub: 'Track your mechanic' },
  { icon: '/design/sv-ic4.webp', a: 'Pay After', b: 'Service', sub: 'No advance payment' },
]

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] font-bold tracking-[1.9px] text-[#BE3F09]">{children}</div>
)
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-1.5 text-[clamp(19px,2.3vw,26px)] font-bold tracking-[-0.6px]">{children}</h2>
)
const ViewAll = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="flex items-center gap-2 whitespace-nowrap text-[13px] font-semibold text-[#1864C8] hover:text-[#F4601F]">
    {children} <IcArrowForward size={14} />
  </Link>
)

export default function ServicesLandingPage() {
  const router = useRouter()
  const [cat, setCat] = useState<string>('all')
  const list = SERVICES.filter((s) => cat === 'all' || s.cat === cat)

  /* Booking card (design) — hands the choices to the real booking wizard */
  const [vehicle, setVehicle] = useState<'car' | 'bike' | 'suv'>('car')
  const [model, setModel] = useState('')
  const [location, setLocation] = useState('')
  const startBooking = (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = new URLSearchParams({ vehicle })
    if (model.trim()) q.set('model', model.trim())
    if (location.trim()) q.set('location', location.trim())
    router.push(`/service?${q.toString()}`)
  }

  const heroCopy = (
    <>
      <span className="inline-flex items-center gap-[9px] whitespace-nowrap rounded-[20px] bg-[#FFE8DA] px-3.5 py-1.5 text-[11.5px] font-bold tracking-[1.4px] text-[#BE3F09]"><IcBuild size={15} />CAR &amp; BIKE SERVICE AT YOUR DOORSTEP</span>
      <h1 className="mt-3.5 text-[46px] font-extrabold leading-[1.06] tracking-[-1.5px] text-[#0E2B4C] max-md:text-[30px]">Expert Car &amp; Bike<br />Service,<br /><span className="text-[#F4601F]">Whenever You <span className="relative inline-block">Need.<svg viewBox="0 0 120 12" preserveAspectRatio="none" className="absolute -bottom-[7px] left-0 h-2 w-full"><path d="M2 9 C40 3 80 3 118 7" fill="none" stroke="#F4601F" strokeWidth="4" strokeLinecap="round" /></svg></span></span></h1>
      <p className="mt-[18px] max-w-[440px] text-[16px] leading-[1.5] text-[#41586F] max-md:text-[14px]">Certified mechanics, genuine parts and transparent pricing. Book in 60 seconds — we come to you.</p>
      <div className="mt-[18px] grid grid-cols-4 gap-2.5 max-md:grid-cols-2">
        {HERO_CARDS.map((c) => (
          <div key={c.a} className="min-w-0 rounded-[14px] bg-white px-2 py-3 text-center shadow-[0_6px_18px_rgba(12,42,77,0.08)]">
            <DImg src={c.icon} alt="" sizes="40px" className="mx-auto block h-10 w-10 object-contain" />
            <div className="mt-2 text-[13px] font-bold leading-[1.2] text-[#0E2B4C]">{c.a}<br />{c.b}</div>
            <div className="mt-[5px] text-[10.5px] leading-[1.3] text-[#52667C]">{c.sub}</div>
          </div>
        ))}
      </div>
      <DImg src="/design/sv-script2.webp" alt="Har Gaadi Ka Saathi" sizes="(max-width: 767px) 96px, 250px" className="ml-1.5 mt-3.5 block h-auto w-[250px] max-md:hidden" />
    </>
  )

  const bookingCard = (
    <form onSubmit={startBooking} className="box-border w-full rounded-[18px] bg-white p-6 shadow-[0_20px_44px_rgba(12,42,77,0.16)]">
      <div className="flex items-start justify-between gap-2.5">
        <div><div className="text-[24px] font-extrabold tracking-[-0.4px] text-[#0E2B4C] max-md:text-[20px]">Book a Service</div><div className="mt-0.5 text-[13.5px] text-[#52667C]">It takes just 60 seconds</div></div>
        <DImg src="/design/sv-quick.webp" alt="Quick & Easy" sizes="78px" className="box-border h-auto w-[78px] shrink-0 rounded-[10px] bg-[#FFF3EC] px-1.5 py-1" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {([['car', 'Car', IcDirectionsCar], ['bike', 'Bike', IcTwoWheeler], ['suv', 'SUV', IcLocalShipping]] as const).map(([k, l, I]) => (
          <button key={k} type="button" onClick={() => setVehicle(k)} className={`grid justify-items-center gap-1 rounded-xl px-1 py-3 text-[13px] font-semibold transition-colors ${vehicle === k ? 'border-[1.5px] border-[#F4601F] bg-[#FFF3EC] text-[#BE3F09]' : 'border border-[#E1E8F0] bg-white text-[#0E2B4C]'}`}>
            <I size={26} className={vehicle === k ? 'text-[#F4601F]' : 'text-[#1A6FD4]'} />{l}
          </button>
        ))}
      </div>
      <div className="mt-4 text-[13.5px] font-bold text-[#0E2B4C]">Select brand &amp; model</div>
      <label className="mt-2 flex h-[46px] items-center gap-2.5 rounded-[10px] border border-[#E1E8F0] px-3.5 text-[13.5px] focus-within:border-[#1A6FD4]">
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Maruti Suzuki Swift" className="min-w-0 flex-1 bg-transparent text-[#0E2B4C] outline-none placeholder:text-[#7B8DA3]" />
        <IcExpandMore size={16} className="shrink-0 text-[#41586F]" />
      </label>
      <div className="mt-3.5 text-[13.5px] font-bold text-[#0E2B4C]">Service location</div>
      <label className="mt-2 flex h-[46px] items-center gap-2.5 rounded-[10px] border border-[#E1E8F0] px-3.5 text-[13.5px] focus-within:border-[#1A6FD4]">
        <IcLocationOn size={18} className="shrink-0 text-[#1A6FD4]" />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Detected automatically" className="min-w-0 flex-1 bg-transparent text-[#0E2B4C] outline-none placeholder:text-[#1E3553]" />
        <IcExpandMore size={16} className="shrink-0 text-[#41586F]" />
      </label>
      <button type="submit" className={`mt-[18px] flex w-full items-center justify-center gap-2.5 rounded-xl bg-[linear-gradient(180deg,#FF6A26_0%,#F0520F_100%)] font-bold text-white shadow-[0_10px_22px_rgba(240,82,15,0.28)] transition-transform hover:-translate-y-px h-[54px] text-[16px] max-md:h-[50px] max-md:text-[15px]`}>Check available slots <IcArrowForward size={18} /></button>
      <div className="mt-4 flex items-center justify-between gap-1.5 whitespace-nowrap border-t border-[#EDF1F6] pt-3.5 text-[10.5px] tracking-[-0.1px] text-[#41586F]">
        <span className="flex items-center gap-1"><IcCalendarToday size={14} className="text-[#1A6FD4]" />Instant Booking</span>
        <span className="flex items-center gap-1"><IcVerifiedUser size={14} className="text-[#1A6FD4]" />Secure &amp; Safe</span>
        <span className="flex items-center gap-1"><IcSchedule size={14} className="text-[#1A6FD4]" />On-Time Service</span>
      </div>
    </form>
  )

  const stats = (
    <div className="z-[7] flex items-center rounded-[14px] bg-white/[0.96] px-1 py-3 shadow-[0_10px_26px_rgba(12,42,77,0.12)] max-md:grid max-md:grid-cols-3 max-md:px-0">
      {[[IcGroups, '50,000+', '', 'Happy Customers', '#F7931E'], [IcStar, '4.8/5', '', 'Customer Rating', '#F7931E'], [IcDirectionsCar, '100+', ' Cities', 'Across India', '#1A6FD4']].map(([I, v, suffix, l, c]: any, i) => (
        <div key={l} className="contents">
          {i > 0 && <span className="h-[34px] w-px bg-[#DCE4EE] max-md:hidden" />}
          <div className="flex min-w-0 items-center gap-3 px-[18px] max-md:flex-col max-md:gap-1 max-md:px-1 max-md:text-center">
            <I size={30} style={{ color: c }} />
            <div className="leading-[1.25]"><div className="whitespace-nowrap text-[18px] font-extrabold text-[#0E2B4C]">{v}<span className="text-[13px] font-semibold">{suffix}</span></div><div className="whitespace-nowrap text-[12.5px] text-[#41586F] max-md:whitespace-normal">{l}</div></div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <SEOHead
        title="Car & Bike Service at Home – Gorakhpur"
        description="Doorstep car & bike service in Gorakhpur, Deoria, Kushinagar & Maharajganj: oil change from ₹599, AC, brakes, battery, 24/7 roadside help. Pay after service."
        keywords="mechanic near me, bike mechanic near me, car mechanic near me, bike mistri near me, car repair near me, puncture repair near me, car service at home, bike service at home, doorstep mechanic, 24 hour mechanic near me, towing service near me, battery jump start, car AC repair near me, two wheeler service near me, car service price, oil change near me, car AC gas refill, wheel alignment near me, Gorakhpur, Deoria, Kushinagar, Padrauna, Kasia, Hata, Kaptanganj, Maharajganj"
      />
      <UserLayout>
        <div className="bg-[#F5F8FC] text-[14px] leading-[1.5] text-[#0E2B4C] [overflow-x:clip]">

          {/* ═══ Hero — design's 1600×560 composed canvas; stacks on mobile ═══ */}
          <div className="mx-auto max-w-[1220px] px-[clamp(14px,3vw,24px)] pt-[clamp(12px,1.8vw,20px)]">
            <ScaledStage
              className="aspect-[1600/560] max-md:!aspect-auto"
              stageClassName="h-[560px] w-[1600px] max-md:!static max-md:grid max-md:!h-auto max-md:!w-auto max-md:gap-3.5 max-md:px-3.5 max-md:pb-4 max-md:![transform:none]"
              stageStyle={{ borderRadius: 24, overflow: 'hidden', background: 'radial-gradient(45% 60% at 58% 55%,#E7EEF7 0%,rgba(231,238,247,0) 70%),linear-gradient(110deg,#F8FAFD 0%,#F1F5FA 38%,#E6EDF5 70%,#DCE5F0 100%)', boxShadow: '0 14px 34px rgba(12,42,77,0.09)' }}
            >
              <div className="absolute bottom-[-30%] right-[-4%] h-[70%] w-[40%] rounded-full opacity-85 max-md:hidden" style={{ background: 'radial-gradient(closest-side,#FF8A4C 0%,#F4601F 55%,rgba(244,96,31,0) 100%)' }} />
              <div className="absolute bottom-0 left-[32%] right-0 h-[22%] bg-[linear-gradient(180deg,rgba(214,224,236,0)_0%,#D6E0EC_100%)] max-md:hidden" />
              <DImg src="/design/sv-store.webp" alt="Bharat Mechanics service centre" sizes="(max-width: 767px) 96px, 300px" className="absolute left-[49.5%] top-0 z-[1] h-auto w-[25%] max-md:hidden" />
              <DImg src="/design/sv-car.webp" alt="" sizes="(max-width: 767px) 96px, 270px" className="absolute left-[27%] top-[38%] z-[2] h-auto w-[23%] max-md:hidden" />
              <DImg src="/design/sv-bike.webp" alt="" sizes="(max-width: 767px) 96px, 190px" className="absolute bottom-[8%] left-[56.5%] z-[3] h-auto w-[16.5%] max-md:hidden" />
              <DImg src="/design/sv-girl.webp" alt="Bharat Mechanics technician giving a thumbs up" loading="eager" fetchPriority="high" sizes="(max-width: 767px) 32px, 300px" className="absolute bottom-0 left-[37.5%] z-[4] h-[92%] w-auto max-w-[25%] object-contain object-bottom max-md:hidden" />
              <DImg src="/design/sv-script1.webp" alt="Drive Repair Repeat" sizes="(max-width: 767px) 96px, 90px" className="absolute left-[34.5%] top-[12%] z-[5] h-auto w-[7%] max-md:hidden" />
              <div className="relative z-[6] box-border w-[36%] pb-7 pl-[38px] pt-[30px] max-md:w-auto max-md:px-0.5 max-md:pb-0 max-md:pt-[18px]">{heroCopy}</div>
              <div className="absolute right-[26px] top-1/2 z-[8] w-[372px] -translate-y-1/2 max-md:static max-md:w-auto max-md:translate-y-0">{bookingCard}</div>
              <div className="absolute bottom-[18px] left-[30.5%] max-md:static">{stats}</div>
            </ScaledStage>
          </div>

          {/* ═══ Explore services — tiles double as the list filter ═══ */}
          <section className="mx-auto max-w-[1200px] px-[clamp(14px,3vw,24px)] pt-[clamp(22px,3vw,32px)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><Eyebrow>EXPLORE SERVICES</Eyebrow><H2>Service categories for every need</H2></div>
              <ViewAll href="/service">View all services</ViewAll>
            </div>
            <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-3">
              {CATEGORIES.map((c) => {
                const on = cat === c.key
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCat(on ? 'all' : c.key)}
                    aria-pressed={on}
                    className={`rounded-[14px] border bg-white px-2.5 py-3.5 text-center transition-colors hover:border-[#F4601F] ${on ? 'border-[#F4601F] shadow-[0_8px_20px_rgba(244,96,31,0.15)]' : 'border-[#E6ECF3]'}`}
                  >
                    <DImg src={c.icon} alt="" sizes="46px" className="mx-auto block h-[46px] w-[46px] object-contain" />
                    <div className="mt-2.5 text-[12px] font-bold leading-[1.3]">{c.label}</div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ═══ Most booked — service cards ═══ */}
          <section className="mx-auto max-w-[1200px] px-[clamp(14px,3vw,24px)] pt-[clamp(22px,3vw,32px)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><Eyebrow>MOST BOOKED</Eyebrow><H2>Popular services, transparent prices</H2></div>
              <ViewAll href="/service">View all services</ViewAll>
            </div>
            <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <div key={s.name} className="flex flex-col overflow-hidden rounded-2xl border border-[#E6ECF3] bg-white">
                  <div className="relative">
                    <DImg src={s.img} alt={s.name} sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 380px" className="block h-[120px] w-full object-cover" />
                    <span className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-2xl px-[11px] py-[5px] text-[10.5px] font-bold text-white ${s.badgeTone === 'green' ? 'bg-[#13864D]' : 'bg-[#C94309]'}`}>
                      {s.pop && <IcStar size={11} />}
                      {s.badge}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
                    <div className="text-[15.5px] font-bold">{s.name}</div>
                    <div className="mt-1 flex items-center gap-[7px] text-[12px] text-[#52667C]">
                      <span className="text-[#F0A726]">★</span><span className="font-bold text-[#0E2B4C]">{s.rating}</span> · {s.booked} booked
                    </div>
                    <p className="mt-2 text-[12.5px] leading-[1.5] text-[#41586F]">{s.desc}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11.5px] text-[#52667C]">
                      <span className="flex items-center gap-1.5"><IcSchedule size={14} /> {s.time}</span>
                      <span className="flex items-center gap-1.5"><IcVerifiedUser size={14} /> 30-day warranty</span>
                    </div>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-[#EDF1F6] pt-3.5">
                      <div>
                        <div className="text-[11px] text-[#52667C]">Starts at</div>
                        <div className="flex items-baseline gap-[7px]">
                          <span className="text-[18px] font-bold">₹{s.price}</span>
                          <span className="text-[12px] text-[#52667C] line-through">₹{s.mrp}</span>
                        </div>
                      </div>
                      <Link href="/service" className="whitespace-nowrap rounded-[9px] bg-[#0E2B4C] px-[22px] py-[11px] text-[13px] font-semibold text-white transition-colors hover:bg-[#F4601F]">Book Now</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ Vehicles we service ═══ */}
          <section className="mx-auto max-w-[1200px] px-[clamp(14px,3vw,24px)] pt-[clamp(22px,3vw,32px)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><Eyebrow>ALL MAKES, ALL MODELS</Eyebrow><H2>Vehicles we service</H2></div>
              <ViewAll href="/service">View all brands</ViewAll>
            </div>
            <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(92px,1fr))] gap-2.5">
              {BRANDS.map((b) => (
                <Link key={b.name} href="/service" className="rounded-xl border border-[#E6ECF3] bg-white px-2 py-3 text-center transition-colors hover:border-[#F4601F]">
                  <DImg src={b.logo} alt="" sizes="96px" className="block h-[34px] w-full object-contain" />
                  <div className="mt-2 text-[11px] font-semibold">{b.name}</div>
                </Link>
              ))}
              <Link href="/service" className="flex flex-col items-center justify-center rounded-xl border border-[#E6ECF3] bg-white px-2 py-3 text-center transition-colors hover:border-[#F4601F]">
                <div className="text-[17px] font-bold text-[#1864C8]">+40</div>
                <div className="text-[11px] font-semibold text-[#1864C8]">More</div>
              </Link>
            </div>
          </section>

          {/* ═══ Booking in 4 easy steps ═══ */}
          <section className="mx-auto max-w-[1200px] px-[clamp(14px,3vw,24px)] pt-[clamp(22px,3vw,32px)]">
            <Eyebrow>SIMPLE PROCESS</Eyebrow>
            <H2>Booking in 4 easy steps</H2>
            <div className="mt-5 grid grid-cols-1 gap-[clamp(12px,2.4vw,30px)] sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <div key={s.title} className="relative rounded-[14px] border border-[#E6ECF3] bg-white p-4">
                  <span className="absolute -top-[13px] left-3.5 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#C94309] text-[12.5px] font-bold text-white">{i + 1}</span>
                  <span className="ml-[34px] flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[#EFF5FE] text-[#1864C8]"><s.Icon size={18} /></span>
                  <div className="mt-3 text-[13.5px] font-bold">{s.title}</div>
                  <div className="mt-0.5 text-[11.5px] text-[#52667C]">{s.desc}</div>
                  {i < STEPS.length - 1 && <span className="absolute -right-[22px] top-1/2 hidden text-[16px] text-[#BE3F09] lg:block">→</span>}
                </div>
              ))}
            </div>
          </section>

          {/* ═══ Why Bharat Mechanics ═══ */}
          <section className="mx-auto max-w-[1200px] px-[clamp(14px,3vw,24px)] pt-[clamp(22px,3vw,32px)]">
            <Eyebrow>WHY BHARAT MECHANICS</Eyebrow>
            <H2>Trusted by 10,000+ customers across India</H2>
            <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {WHY.map((w) => (
                <div key={w.title} className="flex items-center gap-3 rounded-[14px] border border-[#E6ECF3] bg-white px-4 py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]" style={{ background: w.bg, color: w.fg }}><w.Icon size={19} /></span>
                  <div><div className="text-[13px] font-bold">{w.title}</div><div className="text-[11.5px] text-[#52667C]">{w.desc}</div></div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ Service areas — links to the city guides (local SEO) ═══ */}
          <section className="mx-auto max-w-[1200px] px-[clamp(14px,3vw,24px)] pt-[clamp(22px,3vw,32px)]">
            <Eyebrow>SERVICE AREAS</Eyebrow>
            <H2>Mechanic near you in Purvanchal</H2>
            <p className="mt-1.5 max-w-[760px] text-[13px] leading-relaxed text-[#52667C]">
              Doorstep car &amp; bike service, puncture repair and 24/7 roadside help across Gorakhpur, Deoria, Kushinagar and Maharajganj districts.
            </p>
            <ul className="mt-3.5 flex flex-wrap gap-2">
              {SERVICE_AREAS.map(([slug, name]) => (
                <li key={slug}>
                  <Link href={`/blog/mechanic-in-${slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-[#E6ECF3] bg-white px-3.5 py-2 text-[13px] font-medium text-[#0E2B4C] transition-colors hover:border-[#F4601F] hover:text-[#BE3F09]">
                    <IcLocationOn size={14} className="text-[#C94309]" /> {name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/blog#service-areas" className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-semibold text-[#1864C8] hover:underline">All 43 areas <IcArrowForward size={14} /></Link>
              </li>
            </ul>
          </section>

          {/* ═══ Need help right now? — design's 2012×327 roadside band; stacks under 1100px ═══ */}
          <section className="mx-auto max-w-[1200px] px-[clamp(14px,3vw,24px)] pb-[clamp(28px,3.5vw,40px)] pt-[clamp(22px,3vw,32px)]">
            <>
              <div className="flex flex-col overflow-hidden rounded-[18px] min-[1101px]:hidden bg-[linear-gradient(90deg,#012A58_0%,#01346B_45%,#023F7C_70%,#02386F_100%)] px-4 pt-5 text-white shadow-[0_12px_30px_rgba(1,42,88,0.25)]">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(160deg,#FF7A2E,#F4601F)] shadow-[0_8px_20px_rgba(0,0,0,0.25)]"><IcCall size={26} /></span>
                  <div><h2 className="text-[24px] font-bold leading-[1.1] tracking-[-0.02em]">Need help <span className="text-[#F4601F]">right now?</span></h2><div className="mt-1.5 text-[14px] text-[#DCE6F3]">Get instant roadside assistance anywhere in India.</div></div>
                </div>
                <div className="mt-[18px] flex flex-wrap items-center gap-3">
                  {[[IcSchedule, '24/7', 'Support'], [IcLocationOn, 'Pan India', 'Coverage'], [IcCheckCircle, 'Verified', 'Mechanics']].map(([I, a, b]: any) => (
                    <div key={a} className="flex items-center gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#0F4E97]"><I size={18} /></span><span className="text-[12px] leading-[1.35] text-[#C9D8EC]"><strong className="font-semibold text-white">{a}</strong><br />{b}</span></div>
                  ))}
                  <a href="tel:+919310694349" className="flex h-12 flex-[1_1_220px] items-center justify-center gap-2 rounded-[11px] bg-[linear-gradient(180deg,#FF7A2E,#F4601F)] text-[14.5px] font-semibold text-white shadow-[0_8px_20px_rgba(244,96,31,0.35)] hover:text-white"><IcCall size={17} />Call for Assistance<IcArrowForward size={17} /></a>
                  <Link href="/emergency" className="flex h-12 flex-[1_1_220px] items-center justify-center gap-2 rounded-[11px] border-[1.5px] border-white/75 text-[14.5px] font-semibold text-white hover:bg-white/[0.08] hover:text-white"><IcLocationOn size={17} />Track Your Request<IcArrowForward size={17} /></Link>
                </div>
                <DImg src="/design/nh-truck2.webp" alt="Bharat Mechanics roadside assistance tow truck and mechanic" sizes="(min-width: 1101px) 96px, 560px" className="mx-auto mt-[18px] block aspect-[891/542] h-auto w-[min(100%,560px)]" />
              </div>
              <ScaledStage className="hidden aspect-[2012/327] min-[1101px]:block" stageClassName="h-[327px] w-[2012px]" initialScale={0.5586} stageStyle={{ borderRadius: 34, overflow: 'hidden', background: 'linear-gradient(90deg,#012A58 0%,#01346B 45%,#023F7C 70%,#02386F 100%)', boxShadow: '0 12px 30px rgba(1,42,88,0.25)', color: '#fff' }}>
                <DImg src="/design/nh-city2.webp" alt="" sizes="(max-width: 1100px) 96px, 450px" className="absolute bottom-1 left-[640px] z-[1] h-[300px] w-auto opacity-75" />
                <div className="absolute right-0 top-0 h-full w-[300px] bg-[linear-gradient(160deg,#FF7A2E_0%,#F4601F_55%,#E24E12_100%)]" style={{ clipPath: 'polygon(38% 0,100% 0,100% 100%,62% 100%,20% 58%)' }} />
                <div className="absolute right-[200px] top-0 h-[170px] w-2 -skew-x-[34deg] bg-[#F4601F] opacity-70" />
                <div className="absolute bottom-0 left-[1050px] right-0 h-[70px] bg-[linear-gradient(180deg,rgba(255,140,40,0)_0%,rgba(255,140,40,0.35)_100%)] [mask-image:linear-gradient(90deg,transparent,#000_40%)]" />
                <DImg src="/design/nh-truck2.webp" alt="" sizes="(max-width: 1100px) 96px, 280px" className="absolute bottom-0 left-[1318px] z-[2] h-[292px] w-auto" />
                <DImg src="/design/nh-script2.webp" alt="On the Road Always With You" sizes="(max-width: 1100px) 96px, 100px" className="absolute right-[22px] top-[22px] z-[3] h-auto w-[165px]" />
                <div className="absolute left-[67px] top-[55px] z-[4]">
                  <div className="flex items-center gap-12">
                    <span className="flex h-[111px] w-[116px] shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(160deg,#FF7A2E,#F4601F)] shadow-[0_8px_20px_rgba(0,0,0,0.25)]"><IcCall size={54} /></span>
                    <div>
                      <h2 className="whitespace-nowrap text-[58px] font-bold leading-[1.1] tracking-[-0.02em]">Need help <span className="text-[#F4601F]">right now?</span></h2>
                      <div className="mt-3 whitespace-nowrap text-[27px] text-[#DCE6F3]">Get instant roadside assistance anywhere in India.</div>
                    </div>
                  </div>
                  <div className="mt-[38px] flex items-center gap-[22px]">
                    {[[IcSchedule, '24/7', 'Support'], [IcLocationOn, 'Pan India', 'Coverage'], [IcCheckCircle, 'Verified', 'Mechanics']].map(([I, a, b]: any, i) => (
                      <div key={a} className={`flex items-center gap-3.5 ${i ? 'border-l border-white/[0.18] pl-[22px]' : ''}`}><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0F4E97]"><I size={29} /></span><span className="text-[20px] leading-[1.35] text-[#C9D8EC]"><strong className="font-semibold text-white">{a}</strong><br />{b}</span></div>
                    ))}
                    <a href="tel:+919310694349" className="ml-6 flex h-[70px] w-[310px] items-center justify-center gap-3 whitespace-nowrap rounded-[14px] bg-[linear-gradient(180deg,#FF7A2E,#F4601F)] text-[22px] font-semibold text-white shadow-[0_8px_20px_rgba(244,96,31,0.35)] hover:brightness-105 hover:text-white"><IcCall size={26} />Call for Assistance<IcArrowForward size={22} /></a>
                    <Link href="/emergency" className="box-border flex h-[70px] w-[280px] items-center justify-center gap-2.5 whitespace-nowrap rounded-[14px] border-[1.5px] border-white/75 text-[21px] font-semibold text-white hover:bg-white/[0.08] hover:text-white"><IcLocationOn size={22} />Track Your Request<IcArrowForward size={20} /></Link>
                  </div>
                </div>
              </ScaledStage>
            </>
          </section>
        </div>
      </UserLayout>
    </>
  )
}
