'use client'

// BM Care promo strip — matches the AI-voice banner's material design so the
// two stacked home-page bands read as a set (same gradient family, paddings,
// pill-CTA geometry, hover behaviour). Reads the subscription state and links
// into /subscription.
import Link from 'next/link'
import { planById, useBmCareSub, SUB_PLANS } from '@/lib/bmCare'
import { Shield, ChevronRight, Check } from 'lucide-react'

export function BMCareStrip({ className = '' }: { className?: string }) {
  const sub = useBmCareSub()
  const isActive = !!sub?.active
  const ap = isActive ? planById(sub!.plan) : null
  const fromPrice = SUB_PLANS[0]?.mo ?? 99

  return (
    <Link
      href="/subscription"
      className={`group/care relative block overflow-hidden rounded-2xl md:rounded-[22px] ring-1 ring-white/10 shadow-[0_12px_44px_-14px_rgba(15,37,71,0.55)] transition-all duration-300 hover:ring-white/[0.18] hover:shadow-[0_18px_54px_-14px_rgba(15,37,71,0.65)] hover:-translate-y-0.5 ${className}`}
      style={{ background: 'linear-gradient(115deg,#0E2042 0%,#1B3B6F 54%,#173461 100%)' }}
    >
      {/* Material: top hairline, gold glow, right sheen, fine grain */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="pointer-events-none absolute -left-10 top-1/2 -translate-y-1/2 w-48 h-48 bg-[#FFD68A]/[0.15] rounded-full blur-3xl" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-gradient-to-l from-[#FFD68A]/[0.06] to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.9) 0.8px,transparent 0.8px)', backgroundSize: '14px 14px' }} />

      <div className="relative flex h-full items-center gap-3 md:gap-4 px-3.5 py-2.5 md:px-5 md:py-3 lg:px-6">
        {/* Shield orb — same footprint as the AI banner's mic orb */}
        <div className="relative h-8 w-8 md:h-9 md:w-9 shrink-0 grid place-items-center rounded-full bg-gradient-to-br from-[#FFE3B0] to-[#FFC96B] ring-2 ring-white/25 shadow-[0_4px_14px_-2px_rgba(255,214,138,0.5)] text-base md:text-lg">
          {isActive ? ap!.em : '🛡️'}
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0 font-display">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13.5px] md:text-[15.5px] font-extrabold tracking-[-0.02em] text-white leading-[1.15]">
              {isActive ? ap!.name : 'BM Care'}
            </span>
            <span className={`shrink-0 rounded-full px-2 py-[3px] text-[8.5px] md:text-[9.5px] font-bold uppercase tracking-[0.16em] font-sans backdrop-blur-sm ${isActive ? 'bg-[#FFD68A] text-[#142C52]' : 'bg-white/[0.08] text-[#FFD68A] ring-1 ring-white/10'}`}>
              {isActive ? 'Active' : 'Membership'}
            </span>
          </div>
          <p className="block text-[11px] md:text-[11.5px] text-white/55 font-medium mt-0.5 truncate font-sans">
            {isActive ? 'Free services, priority & roadside — all active' : 'Free services, priority mechanics & roadside cover'}
          </p>
        </div>

        {/* Perk chips — only when the strip spans full width (stacked below lg) */}
        {!isActive && (
          <div className="hidden md:flex lg:hidden items-center gap-2 mr-0.5 font-sans" aria-hidden>
            {['Free services', 'Priority mechanic', 'Roadside cover'].map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] ring-1 ring-white/10 px-2.5 py-1 text-[10.5px] font-semibold text-white/70 whitespace-nowrap">
                <Check className="h-3 w-3 text-[#FFD68A]" strokeWidth={3} /> {p}
              </span>
            ))}
          </div>
        )}

        {/* CTA — identical geometry to the AI banner's Try Now pill */}
        <span className="relative inline-flex items-center gap-1.5 bg-[#FFD68A] text-[#142C52] group-hover/care:bg-white font-bold px-3.5 py-1.5 md:px-4 md:py-2 rounded-full text-[11.5px] md:text-[12.5px] shrink-0 shadow-[0_4px_14px_-3px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.04] transition-colors duration-300 font-sans">
          {isActive ? 'Manage' : `From ₹${fromPrice}`}
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/care:translate-x-1" />
        </span>
      </div>
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
