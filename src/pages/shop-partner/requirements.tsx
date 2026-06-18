import { useState } from 'react'
import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import {
  Bike, Car, Wrench, Zap, Droplets, Battery, Users, BadgeCheck, Hammer,
  Package, CheckCircle2, Store, ArrowRight,
} from 'lucide-react'

interface ShopType {
  id: string
  icon: typeof Bike
  label: string
  tagline: string
  manpower: string[]
  certifications: string[]
  tools: string[]
  products: string[]
}

const SHOP_TYPES: ShopType[] = [
  {
    id: 'bike',
    icon: Bike,
    label: 'Bike Repair Shop',
    tagline: 'Two-wheeler service & repair',
    manpower: ['2-3 two-wheeler mechanics', '1 senior / lead technician', '1 helper or trainee (optional)'],
    certifications: ['Certified Two-Wheeler Technician (Bharat Mechanics)', 'Basic electrical & battery handling', 'Road-safety & test-ride clearance'],
    tools: ['Tool kit (spanners, sockets, screwdrivers)', 'Hydraulic bike lift / centre stand', 'Air compressor & tyre tools', 'Battery charger & multimeter', 'Chain cleaning & lubrication kit'],
    products: ['Engine oil & lubricants', 'Brake pads, clutch plates, chains', 'Spark plugs & air filters', 'Batteries & bulbs', 'Common spares for top bike brands'],
  },
  {
    id: 'car',
    icon: Car,
    label: 'Car Repair Garage',
    tagline: 'Four-wheeler service & repair',
    manpower: ['3-5 car mechanics', '1 diagnostics technician', '1 service advisor', '1-2 helpers'],
    certifications: ['Certified Car Mechanic (Bharat Mechanics)', 'OBD-II diagnostics training', 'AC service & gas-handling certificate'],
    tools: ['2 or 4-post hydraulic car lift', 'OBD-II scanner / diagnostic tool', 'AC recovery & recharge machine', 'Engine crane & jack stands', 'Torque wrenches & full socket sets', 'Wheel alignment & balancing (optional)'],
    products: ['Engine oil, coolant, brake fluid', 'Brake pads, discs & filters', 'Batteries, belts & spark plugs', 'AC gas & cabin filters', 'Genuine / OEM spares inventory'],
  },
  {
    id: 'multi',
    icon: Wrench,
    label: 'Multi-Brand Garage',
    tagline: 'Bikes + cars, all brands',
    manpower: ['4-6 mechanics (bike + car)', '1 master technician', '1 diagnostics technician', '1 service manager', '2 helpers'],
    certifications: ['Master Technician (Bharat Mechanics)', 'Certified Car + Two-Wheeler', 'Diagnostics & quality-audit training'],
    tools: ['Car + bike hydraulic lifts', 'Universal diagnostic scanners', 'AC service station', 'Alignment & balancing machine', 'Complete pneumatic tool set'],
    products: ['Multi-brand spares (bike + car)', 'Full lubricant & fluid range', 'Brake, filter & battery stock', 'Fast-moving consumables & spares'],
  },
  {
    id: 'tyre',
    icon: Battery,
    label: 'Tyre & Battery Shop',
    tagline: 'Tyres, batteries & quick fits',
    manpower: ['2 fitment technicians', '1 battery / electrical technician', '1 helper'],
    certifications: ['Tyre fitment & balancing certificate', 'Battery testing & safe handling'],
    tools: ['Tyre changer & wheel balancer', 'Air compressor & inflators', 'Battery / load tester', 'Nitrogen inflation unit (optional)'],
    products: ['Tyres (multiple sizes & brands)', 'Batteries (bike + car)', 'Valves, weights & puncture kits', 'Distilled water & terminals'],
  },
  {
    id: 'ev',
    icon: Zap,
    label: 'EV Service Centre',
    tagline: 'Electric two / four-wheelers',
    manpower: ['2-3 EV-trained technicians', '1 high-voltage certified lead'],
    certifications: ['EV Service Specialist (Bharat Mechanics)', 'High-voltage safety certification', 'Battery / BMS diagnostics training'],
    tools: ['Insulated high-voltage tool kit', 'Battery & BMS diagnostic tools', 'Motor / controller test bench', 'Charging diagnostic equipment'],
    products: ['EV-grade spares & connectors', 'BMS & controller components', 'Charging accessories', 'Approved coolant & consumables'],
  },
  {
    id: 'wash',
    icon: Droplets,
    label: 'Car Wash & Detailing',
    tagline: 'Cleaning, polish & detailing',
    manpower: ['2-4 detailing staff', '1 supervisor'],
    certifications: ['Detailing & paint-care training', 'Chemical handling & safety'],
    tools: ['High-pressure washer', 'Foam cannon & wet/dry vacuum', 'Polisher / buffing machine', 'Steam cleaner (optional)'],
    products: ['Shampoos, foam & degreasers', 'Polish, wax & ceramic coatings', 'Microfiber cloths & applicators', 'Interior & tyre care products'],
  },
]

const GROUPS = [
  { key: 'manpower', title: 'Mechanics & Manpower', icon: Users, color: 'text-[#1B3B6F] bg-[#1B3B6F]/[0.08]' },
  { key: 'certifications', title: 'Required Certifications', icon: BadgeCheck, color: 'text-emerald-600 bg-emerald-50' },
  { key: 'tools', title: 'Tools & Equipment', icon: Hammer, color: 'text-[#FF6B35] bg-[#FF6B35]/10' },
  { key: 'products', title: 'Products & Inventory', icon: Package, color: 'text-violet-600 bg-violet-50' },
] as const

export default function RequirementsPage() {
  const [active, setActive] = useState(SHOP_TYPES[0].id)
  const shop = SHOP_TYPES.find((s) => s.id === active) as ShopType

  return (
    <>
      <SEOHead
        title="Shop Partner Requirements"
        description="See exactly what mechanics, certifications, tools and products you need to start your shop on Bharat Mechanics, by shop type."
      />
      <UserLayout>
        <div className="bg-[#F7F8FA] min-h-screen">
          {/* Hero */}
          <div className="bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] text-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                  <Store className="h-6 w-6" />
                </div>
                <span className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF8A5B]">Become a Shop Partner</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight max-w-2xl">What does your shop need to get started?</h1>
              <p className="mt-3 text-sm md:text-base text-white/80 max-w-2xl leading-relaxed">
                Pick your shop type and get a clear checklist &mdash; how many mechanics, which certifications they
                need, and the tools and products to keep in stock.
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
            {/* Shop type selector */}
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Step 1 &mdash; Choose your shop type</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {SHOP_TYPES.map((s) => {
                const on = s.id === active
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={`text-left rounded-xl p-4 ring-1 transition-all ${on ? 'bg-[#1B3B6F] text-white ring-[#1B3B6F] shadow-md' : 'bg-white text-[#0F2545] ring-black/[0.06] hover:ring-[#1B3B6F]/40'}`}
                  >
                    <s.icon className={`h-6 w-6 mb-2 ${on ? 'text-white' : 'text-[#FF6B35]'}`} />
                    <p className="font-bold text-sm leading-tight">{s.label}</p>
                    <p className={`text-[11px] mt-0.5 ${on ? 'text-white/70' : 'text-gray-400'}`}>{s.tagline}</p>
                  </button>
                )
              })}
            </div>

            {/* Requirements */}
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mt-8 mb-3">Step 2 &mdash; Requirements for {shop.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {GROUPS.map((g) => (
                <div key={g.key} className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-5 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${g.color}`}>
                      <g.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-[#0F2545]">{g.title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {(shop[g.key] as string[]).map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3B6F] to-[#0F2545] text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-extrabold">Got what it takes?</h3>
                <p className="text-sm text-white/80 mt-1">Register your shop and start receiving doorstep service jobs.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/shop-partner/login" className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#FF7C49] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors whitespace-nowrap">Apply as Shop Partner <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/training" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 ring-1 ring-white/25 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors whitespace-nowrap">Train your mechanics</Link>
              </div>
            </div>
          </div>
        </div>
      </UserLayout>
    </>
  )
}
