import Link from 'next/link'
import { IcArrowForward, IcBuild, IcStore } from '@/components/icons/BmIcons'

/**
 * "Register as Mechanic / Register Your Shop" calls-to-action used on public
 * pages (/mechanics, /shop). Three looks:
 *  - hero:   two pill buttons for dark hero backgrounds
 *  - strip:  a slim one-line bar (light pages)
 *  - banner: a full-width navy banner
 */
export function PartnerRegisterCta({ variant }: { variant: 'hero' | 'strip' | 'banner' }) {
  if (variant === 'hero') {
    return (
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <span className="w-full text-[12.5px] font-medium text-[#C3D4E6] sm:w-auto">Mechanic or garage owner?</span>
        <Link href="/register/mechanic" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#C94309] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#A93807] hover:text-white">
          <IcBuild size={16} /> Register as Mechanic
        </Link>
        <Link href="/register/shop" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/20 hover:text-white">
          <IcStore size={16} /> Register Your Shop
        </Link>
      </div>
    )
  }

  if (variant === 'strip') {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-[14px] border border-[#F8D9C4] bg-[linear-gradient(90deg,#FFF6EF,#FFFFFF)] px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#FFEDE1] text-[#C94309]"><IcStore size={19} /></span>
        <p className="min-w-0 flex-[1_1_220px] text-[13.5px] leading-snug text-[#41586F]">
          <b className="text-[#0E2B4C]">Run a garage, parts shop or work as a mechanic?</b> Join Bharat Mechanics free and get customers near you.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/register/shop" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#C94309] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#A93807] hover:text-white">
            Register Your Shop <IcArrowForward size={15} />
          </Link>
          <Link href="/register/mechanic" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#D6E2F0] bg-white px-4 text-[13px] font-semibold text-[#0E2B4C] transition-colors hover:border-[#0E2B4C] hover:text-[#0E2B4C]">
            Register as Mechanic
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[18px] bg-[linear-gradient(120deg,#0C2A4D_0%,#123A69_60%,#1A4A85_100%)] p-[clamp(18px,2.4vw,28px)] text-white">
      <div className="pointer-events-none absolute right-[-70px] top-[-70px] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(244,96,31,0.35),rgba(244,96,31,0)_70%)]" />
      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="min-w-0 flex-[1_1_300px]">
          <div className="text-[11px] font-bold tracking-[1.6px] text-[#FFB68C]">GROW WITH BHARAT MECHANICS</div>
          <div className="mt-1.5 text-[clamp(19px,2.2vw,24px)] font-bold leading-tight">Sell parts or offer service? Register in minutes.</div>
          <p className="mt-1.5 text-[13px] text-[#C3D4E6]">Free registration · Verified leads near you · Weekly payouts to your bank / UPI</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/register/shop" className="inline-flex h-11 items-center gap-2 rounded-[11px] bg-[#C94309] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#A93807] hover:text-white">
            <IcStore size={17} /> Register Your Shop
          </Link>
          <Link href="/register/mechanic" className="inline-flex h-11 items-center gap-2 rounded-[11px] bg-white px-5 text-[14px] font-semibold text-[#0E2B4C] transition-colors hover:bg-[#EAF2FC] hover:text-[#0E2B4C]">
            <IcBuild size={17} /> Register as Mechanic
          </Link>
        </div>
      </div>
    </div>
  )
}
