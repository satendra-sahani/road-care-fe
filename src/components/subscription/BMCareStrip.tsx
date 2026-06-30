'use client'

// BM Care promo strip — ported from bmc-home.jsx (home strip) + the
// SubProgressCard upsell. Reads the client-side subscription state and
// links into /subscription. Reusable on the home page and elsewhere.
import Link from 'next/link'
import { planById, useBmCareSub } from '@/lib/bmCare'
import { Shield, ChevronRight } from 'lucide-react'

export function BMCareStrip({ className = '' }: { className?: string }) {
  const sub = useBmCareSub()
  const isActive = !!sub?.active
  const ap = isActive ? planById(sub!.plan) : null

  return (
    <Link
      href="/subscription"
      className={`flex items-center gap-3.5 rounded-2xl p-3.5 text-white shadow-md transition hover:brightness-110 ${className}`}
      style={{ background: 'linear-gradient(120deg,#142C52,#24508C)' }}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#FFD68A]/30 bg-[#FFD68A]/20 text-2xl">
        {isActive ? ap!.em : '🛡️'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-[15.5px] font-extrabold">{isActive ? ap!.name : 'BM Care'}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8.5px] font-extrabold tracking-wide ${isActive ? 'bg-[#FFD68A] text-[#142C52]' : 'bg-white/15 text-white'}`}>
            {isActive ? 'ACTIVE' : 'MEMBERSHIP'}
          </span>
        </div>
        <div className="mt-0.5 text-[11.5px] font-medium opacity-80">
          {isActive ? 'Free services, priority & roadside — all active' : 'Free services, priority mechanics & roadside cover'}
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[#FFD68A] px-3 py-2 text-[11px] font-extrabold text-[#142C52]">
        {isActive ? 'Manage' : 'From ₹99'} <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}

// Profile/account variant — same data, plain card styling that sits inside
// a settings list. Mirrors the prototype's SubProgressCard upsell.
export function BMCareProfileCard() {
  const sub = useBmCareSub()
  const isActive = !!sub?.active
  if (!isActive) {
    return (
      <Link href="/subscription" className="flex items-center gap-3 rounded-2xl border-none p-3.5 text-white shadow-md"
        style={{ background: 'linear-gradient(120deg,#142C52,#24508C)' }}>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#FFD68A]/30 bg-[#FFD68A]/20 text-[22px]">🛡️</div>
        <div className="flex-1">
          <div className="text-[14.5px] font-extrabold">Join BM Care</div>
          <div className="text-[11.5px] font-medium opacity-80">Free services, priority & roadside from ₹99/mo</div>
        </div>
        <span className="whitespace-nowrap rounded-full bg-[#FFD68A] px-3 py-1.5 text-[11px] font-extrabold text-[#142C52]">Explore</span>
      </Link>
    )
  }
  const ap = planById(sub!.plan)
  const used = sub!.servicesUsed || 0
  const tot = sub!.freeTotal || 0
  const left = Math.max(0, tot - used)
  return (
    <Link href="/subscription" className="block overflow-hidden rounded-2xl shadow-md">
      <div className="flex items-center gap-3 p-3.5 text-white" style={{ background: `linear-gradient(135deg,${ap.g1},${ap.g2})` }}>
        <div className="text-2xl">{ap.em}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-[14.5px] font-extrabold">{ap.name}</span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide">
              <span className="h-[5px] w-[5px] rounded-full bg-[#7DF3B0]" /> ACTIVE
            </span>
          </div>
          <div className="mt-0.5 text-[11.5px] font-bold opacity-85">{used} used · {left} free services left</div>
        </div>
        <ChevronRight className="h-[18px] w-[18px]" />
      </div>
    </Link>
  )
}

export { Shield as BMCareIcon }
