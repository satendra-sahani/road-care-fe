import { useMemo, useState } from 'react'
import Link from 'next/link'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import { Star, MapPin, BadgeCheck, Search, ArrowRight } from 'lucide-react'

interface Mechanic {
  id: string
  name: string
  specialty: string
  city: string
  rating: number
  jobs: number
  experience: string
  certs: string[]
}

// Starter dataset — swap for a public /common/mechanics API when available.
const MECHANICS: Mechanic[] = [
  { id: 'm1', name: 'Imran Shaikh', specialty: 'Car Mechanic', city: 'Mumbai', rating: 4.9, jobs: 1240, experience: '8 yrs', certs: ['Certified Car Mechanic', 'OBD-II'] },
  { id: 'm2', name: 'Rahul Verma', specialty: 'Two-Wheeler', city: 'Delhi', rating: 4.8, jobs: 980, experience: '6 yrs', certs: ['Certified Two-Wheeler'] },
  { id: 'm3', name: 'Suresh Patel', specialty: 'Multi-Brand', city: 'Ahmedabad', rating: 4.9, jobs: 1610, experience: '11 yrs', certs: ['Master Technician'] },
  { id: 'm4', name: 'Anil Kumar', specialty: 'EV Specialist', city: 'Bengaluru', rating: 4.7, jobs: 540, experience: '4 yrs', certs: ['EV Service Specialist', 'HV Safety'] },
  { id: 'm5', name: 'Mohammed Faizan', specialty: 'Car Mechanic', city: 'Hyderabad', rating: 4.8, jobs: 870, experience: '7 yrs', certs: ['Certified Car Mechanic'] },
  { id: 'm6', name: 'Deepak Yadav', specialty: 'Two-Wheeler', city: 'Lucknow', rating: 4.6, jobs: 620, experience: '5 yrs', certs: ['Certified Two-Wheeler'] },
  { id: 'm7', name: 'Vikram Singh', specialty: 'Multi-Brand', city: 'Jaipur', rating: 4.8, jobs: 1130, experience: '9 yrs', certs: ['Master Technician', 'OBD-II'] },
  { id: 'm8', name: 'Sandeep Nair', specialty: 'EV Specialist', city: 'Pune', rating: 4.7, jobs: 410, experience: '3 yrs', certs: ['EV Service Specialist'] },
  { id: 'm9', name: 'Ramesh Gupta', specialty: 'Car Mechanic', city: 'Kolkata', rating: 4.9, jobs: 1490, experience: '12 yrs', certs: ['Master Technician', 'AC Service'] },
]

const SPECIALTIES = ['All', 'Car Mechanic', 'Two-Wheeler', 'EV Specialist', 'Multi-Brand']
const AV_COLORS = ['bg-[#1B3B6F]', 'bg-[#FF6B35]', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600', 'bg-cyan-700']

const initials = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? 'fill-[#FFB400] text-[#FFB400]' : 'text-gray-300'}`} />
      ))}
    </span>
  )
}

export default function MechanicsPage() {
  const [q, setQ] = useState('')
  const [spec, setSpec] = useState('All')

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return MECHANICS.filter(
      (m) =>
        (spec === 'All' || m.specialty === spec) &&
        (term === '' || m.name.toLowerCase().includes(term) || m.city.toLowerCase().includes(term)),
    )
  }, [q, spec])

  const avgRating = (MECHANICS.reduce((s, m) => s + m.rating, 0) / MECHANICS.length).toFixed(1)

  return (
    <>
      <SEOHead
        title="Certified Mechanics"
        description="Browse Bharat Mechanics certified mechanics and technicians, with ratings, specialties and experience. Book trusted doorstep service."
      />
      <UserLayout>
        <div className="bg-[#F7F8FA] min-h-screen">
          {/* Hero */}
          <div className="bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] text-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <span className="text-[11px] md:text-xs font-semibold tracking-[0.18em] uppercase text-[#FF8A5B]">Certified Mechanics</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight max-w-2xl">Trusted, certified mechanics near you</h1>
              <p className="mt-3 text-sm md:text-base text-white/80 max-w-2xl leading-relaxed">
                Every Bharat Mechanics technician is trained, certified and rated by real customers &mdash; so you always
                get reliable, transparent service.
              </p>
              <div className="mt-5 flex flex-wrap gap-5 text-sm">
                <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-[#FFB400] text-[#FFB400]" /> {avgRating} average rating</span>
                <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-[#FF8A5B]" /> 100% verified &amp; certified</span>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
              <div className="relative md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name or city"
                  className="w-full pl-10 pr-3 h-10 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B6F]/30"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpec(s)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${spec === s ? 'bg-[#1B3B6F] text-white' : 'bg-white text-gray-600 ring-1 ring-black/[0.06] hover:ring-[#1B3B6F]/40'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Mechanic grid */}
            {list.length === 0 ? (
              <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] p-10 text-center text-gray-500">No mechanics match your search.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {list.map((m, idx) => (
                  <div key={m.id} className="bg-white rounded-2xl ring-1 ring-black/[0.06] shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-full ${AV_COLORS[idx % AV_COLORS.length]} text-white font-bold flex items-center justify-center shrink-0`}>
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-[#0F2545] truncate">{m.name}</h3>
                          <BadgeCheck className="h-4 w-4 text-[#1B3B6F] shrink-0" />
                        </div>
                        <p className="text-xs text-gray-500">{m.specialty} &middot; {m.experience}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1.5">
                        <Stars rating={m.rating} />
                        <span className="text-sm font-bold text-[#0F2545]">{m.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-gray-400">{m.jobs.toLocaleString('en-IN')} jobs</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-3">
                      <MapPin className="h-3.5 w-3.5" /> {m.city}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {m.certs.map((c) => (
                        <span key={c} className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#1B3B6F]/[0.06] text-[#1B3B6F]">{c}</span>
                      ))}
                    </div>

                    <Link href="/service/new" className="mt-4 flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-[#FF6B35] hover:bg-[#FF7C49] text-white text-sm font-semibold transition-colors">
                      Book this mechanic <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* Become certified */}
            <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3B6F] to-[#0F2545] text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-extrabold">Are you a mechanic?</h3>
                <p className="text-sm text-white/80 mt-1">Get certified by Bharat Mechanics and appear on this list.</p>
              </div>
              <Link href="/training" className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#FF7C49] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors whitespace-nowrap self-start md:self-auto">Get Certified <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </UserLayout>
    </>
  )
}
