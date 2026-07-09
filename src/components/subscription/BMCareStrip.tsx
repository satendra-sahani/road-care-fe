'use client'

// BM Care promo strip — matches the AI-voice banner's material design so the
// two stacked home-page bands read as a set (same gradient family, paddings,
// pill-CTA geometry, hover behaviour). Reads the subscription state and links
// into /subscription.
import Link from 'next/link'
import { planById, useBmCareSub, SUB_PLANS } from '@/lib/bmCare'
import { Shield, ChevronRight } from 'lucide-react'

export function BMCareStrip({ className = '' }: { className?: string }) {
  const sub = useBmCareSub()
  const isActive = !!sub?.active
  const ap = isActive ? planById(sub!.plan) : null
  const fromPrice = SUB_PLANS[0]?.mo ?? 99

  return (
    <Link
      href="/subscription"
      className={`group/care relative flex h-full items-center gap-3.5 overflow-hidden rounded-[18px] md:rounded-[20px] border-l-[3px] border-l-[#FFD68A] ring-1 ring-white/10 px-4 py-3.5 md:px-5 md:py-4 shadow-[0_10px_30px_-14px_rgba(15,37,71,0.6)] transition-all duration-300 hover:ring-white/20 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(15,37,71,0.7)] ${className}`}
      style={{ background: 'linear-gradient(115deg,#0E2042 0%,#1B3B6F 58%,#173461 100%)' }}
    >
      <div className="pointer-events-none absolute -left-6 top-1/2 -translate-y-1/2 h-36 w-36 rounded-full bg-[#FFD68A]/20 blur-3xl" />

      {/* Shield orb */}
      <div className="relative h-11 w-11 md:h-12 md:w-12 shrink-0 grid place-items-center rounded-2xl bg-gradient-to-br from-[#FFE3B0] to-[#FFC96B] ring-1 ring-white/25 shadow-[0_6px_16px_-4px_rgba(255,214,138,0.55)] text-xl">
        {isActive ? ap!.em : '🛡️'}
      </div>

      {/* Copy */}
      <div className="relative flex-1 min-w-0">
        <div className="text-[15.5px] md:text-[16px] font-extrabold tracking-[-0.01em] text-white leading-tight font-display">
          {isActive ? ap!.name : 'BM Care'}
        </div>
        <p className="mt-0.5 text-[12px] md:text-[12.5px] text-white/60 font-medium truncate font-sans">
          {isActive ? 'All benefits active' : 'Free services, priority & roadside'}
        </p>
      </div>

      {/* CTA */}
      <span className="relative inline-flex items-center gap-1 rounded-full bg-[#FFD68A] text-[#142C52] font-bold px-3.5 py-2 md:px-4 text-[12px] md:text-[12.5px] shrink-0 shadow-[0_4px_14px_-3px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover/care:brightness-105 font-sans">
        {isActive ? 'Manage' : `From ₹${fromPrice}`}
        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/care:translate-x-0.5" />
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
