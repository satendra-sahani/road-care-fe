'use client'

// Home offer popup — web mirror of the app's admin-managed home popup
// (appConfig.homePopup). Restyled to the Claude Design handoff "GPS Tracker
// launch offer" dialog (two-column: dark product panel + pricing panel) while
// staying 100% admin-driven — every homePopup field is bound below, so the
// admin can still change copy/prices/CTA, disable it (enabled=false) or let
// it repeat (showOnce=false) without any code or backend change.
// It opens on the visitor's first scroll (or after 10s idle) rather than on a fixed timer.
//
// Field mapping (appConfig.homePopup → dialog):
//   title / subtitle  → headline (a " — " / " - " suffix is highlighted orange) + sub line
//   badge             → rotated orange ribbon on the product panel
//   imageUrl          → product image (falls back to the design's GPS device render)
//   offerPrice / originalPrice → big price + struck price + SAVE pill (hidden when offerPrice=0)
//   body              → if it contains "·", "•", "|" or new lines → the feature checklist;
//                       otherwise it's shown in the "limited stock" note (features use defaults)
//   ctaText / ctaTarget / secondaryText / accentColor → primary CTA + "maybe later"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { publicConfigAPI } from '@/services/api'
import { DImg, ikUrl } from '@/components/ui/DImg'
import {
  IcClose, IcCheckCircle, IcShoppingCart, IcArrowForward, IcLocalOffer,
  IcVerifiedUser, IcLocalShipping, IcHeadsetMic,
} from '@/components/icons/BmIcons'

const SESSION_KEY = 'bm_home_popup_shown'

// App navigation target → website route.
const SCREEN_ROUTES: Record<string, string> = {
  gpsplans: '/tracker', trackplans: '/tracker', tracker: '/tracker', vehicletrack: '/tracker',
  shop: '/shop', orders: '/orders', wallet: '/wallet', cashback: '/spin', spin: '/spin',
  services: '/services', subscription: '/subscription',
}

const DEFAULT_FEATURES = [
  'Live 24×7 vehicle tracking',
  'Real-time location with mobile app',
  'Geo-fencing for added safety',
  'Remote engine cut-off (anti-theft)',
  'Instant theft alerts & notifications',
]
const DEFAULT_STOCK_NOTE = 'High demand · Order now before it\'s gone.'

const fmtInr = (n: number) => Number(n || 0).toLocaleString('en-IN')

export function HomeOfferPopup() {
  const router = useRouter()
  const [cfg, setCfg] = useState<any | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let alive = true
    let opened = false
    let timer = 0
    let idle = 0
    let detach = () => {}
    publicConfigAPI.getConfig()
      .then((res) => {
        if (!alive || !res.data?.success) return
        const p = res.data.data?.homePopup
        if (!p || p.enabled === false) return
        if (p.showOnce !== false && typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return
        setCfg(p)
        // Open once the visitor starts scrolling (or after 10s idle) — never during
        // initial load, so the dialog doesn't compete with the page for first paint
        // (it used to become the page's LCP). Taps/keys don't trigger it, so it can't
        // pop over something the visitor deliberately opened (login, menu, search).
        const open = () => {
          if (!alive || opened) return
          // Another dialog (login / menu / search) is open — wait for the next scroll.
          if (document.querySelector('[role="dialog"], [aria-modal="true"]')) return
          opened = true
          detach()
          try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* noop */ }
          timer = window.setTimeout(() => { if (alive) setVisible(true) }, 600)
        }
        const events = ['scroll', 'wheel', 'touchmove'] as const
        detach = () => { events.forEach((e) => window.removeEventListener(e, open)); window.clearInterval(idle) }
        events.forEach((e) => window.addEventListener(e, open, { passive: true }))
        idle = window.setInterval(open, 10000)
      })
      .catch(() => { /* config unavailable — no popup */ })
    return () => { alive = false; detach(); window.clearTimeout(timer) }
  }, [])

  // Design behaviour: ESC closes, and the page doesn't scroll behind the dialog.
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setVisible(false) }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [visible])

  if (!visible || !cfg) return null

  const accent = cfg.accentColor || ''
  const offerPrice = Number(cfg.offerPrice) || 0
  const originalPrice = Number(cfg.originalPrice) || 0
  const imageUrl = typeof cfg.imageUrl === 'string' ? cfg.imageUrl.trim() : ''

  // Headline: "GPS Tracker — BHARATB1" → highlight the part after the dash.
  const title: string = cfg.title || 'Special Offer'
  const dash = title.search(/\s[—–-]\s/)
  const titleMain = dash > -1 ? title.slice(0, dash) : title
  const titleAccent = dash > -1 ? title.slice(dash).replace(/^\s[—–-]\s/, '') : ''

  // Body → feature checklist when it's a delimited list, else a stock note.
  const parts = String(cfg.body || '')
    .split(/\s*[·•|]\s*|\r?\n+/)
    .map((s: string) => s.trim())
    .filter(Boolean)
  const features = parts.length >= 2 ? parts.slice(0, 6) : DEFAULT_FEATURES
  const stockNote = parts.length >= 2 ? DEFAULT_STOCK_NOTE : (cfg.body || DEFAULT_STOCK_NOTE)

  const close = () => setVisible(false)
  const claim = () => {
    close()
    const target = String(cfg.ctaTarget || '').trim()
    if (/^https?:\/\//i.test(target)) { window.open(target, '_blank', 'noopener'); return }
    const route = SCREEN_ROUTES[target.toLowerCase().replace(/[^a-z]/g, '')]
    router.push(route || '/tracker')
  }

  return (
    <div
      className="fixed inset-0 z-[85] flex items-start justify-center overflow-y-auto overscroll-contain bg-[rgba(6,18,36,0.66)] p-[10px] backdrop-blur-[5px] md:items-center md:px-5 md:py-[clamp(12px,3vh,28px)]"
      style={{ animation: 'bmGpsFade .25s ease both' }}
      onClick={close}
    >
      <style>{`
        @keyframes bmGpsFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bmGpsIn { from { opacity: 0; transform: translateY(18px) scale(.97) } to { opacity: 1; transform: none } }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative m-auto w-full max-w-[1000px] overflow-hidden rounded-[18px] bg-white shadow-[0_30px_80px_rgba(3,12,28,0.45)] md:rounded-[24px]"
        style={{ animation: 'bmGpsIn .38s cubic-bezier(.2,.8,.2,1) both' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-2.5 top-2.5 z-[5] flex h-10 w-10 items-center justify-center rounded-full border-0 bg-[rgba(15,30,55,0.55)] text-white transition-[background,transform] duration-200 hover:rotate-90 hover:bg-[#F4601F] md:right-4 md:top-4"
        >
          <IcClose size={18} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.14fr)_minmax(0,1fr)]">
          {/* ── Left: product panel ─────────────────────────────────── */}
          <div
            className="relative flex flex-col overflow-hidden px-4 pb-4 pt-[18px] text-white md:px-6 md:pb-[18px] md:pt-[22px]"
            style={{
              background:
                'radial-gradient(120% 70% at 55% 100%, rgba(244,96,31,0.55) 0%, rgba(244,96,31,0.12) 38%, rgba(244,96,31,0) 60%),' +
                'radial-gradient(60% 50% at 90% 10%, rgba(26,111,212,0.25) 0%, rgba(26,111,212,0) 70%),' +
                'linear-gradient(160deg, #0C1F3C 0%, #0A1830 55%, #1A1A24 100%)',
            }}
          >
            <DImg src="/design/gps-logo.webp" alt="Bharat Mechanics" sizes="170px" className="block h-auto w-[140px] md:w-[170px]" />
            {cfg.badge && (
              <span className="absolute right-14 top-3.5 max-w-[120px] -rotate-3 rounded-lg bg-[#C94309] px-3 py-1.5 text-center text-[11px] font-bold uppercase leading-tight tracking-wide text-white shadow-[0_6px_14px_rgba(244,96,31,0.35)] md:right-[34px] md:max-w-[168px] md:text-[12px]">
                {cfg.badge}
              </span>
            )}
            <h2 className="mt-3.5 text-[24px] font-bold leading-[1.08] tracking-[-0.8px] md:text-[clamp(26px,3vw,34px)]">
              {titleMain}
              {titleAccent && <> — <span className="text-[#FF7A2F]">{titleAccent}</span></>}
            </h2>
            {cfg.subtitle && (
              <div className="mt-2 text-[14px] font-medium text-[#E6EEF8] md:text-[clamp(14px,1.6vw,19px)]">{cfg.subtitle}</div>
            )}
            <div className="relative mt-1.5">
              <DImg src="/design/gps-script.webp" alt="" aria-hidden="true" sizes="130px" className="absolute left-[-2%] top-[6%] z-[2] h-auto w-[30%] md:w-[28%]" />
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ikUrl(imageUrl, 700)}
                  width={840}
                  height={530}
                  alt={title}
                  className="ml-auto block h-auto max-h-[300px] w-[78%] object-contain object-right"
                  style={{ filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.45))' }}
                />
              ) : (
                <DImg
                  src="/design/gps-device.webp"
                  alt={title}
                  sizes="(max-width: 767px) 72vw, 400px"
                  className="ml-auto block h-auto max-h-[300px] w-[78%] object-contain object-right"
                  style={{ filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.45))' }}
                />
              )}
            </div>
            <div className="mt-auto grid grid-cols-5 gap-2 pt-2.5">
              {['Live 24×7 tracking', 'Real-time location', 'Geo-fencing alerts', 'Remote engine cut-off', 'Anti-theft instant alerts'].map((alt, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <DImg key={i} src={`/design/gps-ic${i + 1}.png`} alt={alt} sizes="90px" className="block h-auto w-full" />
              ))}
            </div>
          </div>

          {/* ── Right: pricing panel ────────────────────────────────── */}
          <div className="flex min-w-0 flex-col px-4 pb-[18px] pt-5 md:px-7 md:pt-[30px]">
            {offerPrice > 0 && (
              <>
                <div className="flex items-center gap-3 text-[12px] font-semibold tracking-[3px] text-[#BE3F09]">
                  SPECIAL OFFER PRICE<span className="h-px max-w-[60px] flex-1 bg-[#F8C9B1]" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <div className="text-[46px] font-extrabold leading-none tracking-[-2px] text-[#F2521B] md:text-[clamp(44px,4.6vw,56px)]">₹{fmtInr(offerPrice)}</div>
                  {originalPrice > offerPrice && (
                    <div className="grid justify-items-start gap-1.5">
                      <span className="text-[22px] font-bold text-[#52667C] line-through">₹{fmtInr(originalPrice)}</span>
                      <span className="rounded-lg bg-[#DDF7E6] px-2.5 py-1 text-[15px] font-bold text-[#0F7040]">SAVE ₹{fmtInr(originalPrice - offerPrice)}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="mt-4 flex items-center gap-3.5 rounded-[14px] bg-[#FFF1E8] px-3.5 py-[11px]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#BE3F09] shadow-[0_3px_10px_rgba(244,96,31,0.15)]">
                <IcLocalOffer size={22} />
              </span>
              <div className="min-w-0 leading-[1.35]">
                <div className="text-[14.5px] font-bold text-[#BE3F09]">Limited Stock Available!</div>
                <div className="text-[13px] text-[#41586F]">{stockNote}</div>
              </div>
            </div>

            <div className="mt-3 grid gap-2.5 rounded-[14px] bg-[#F6F8FC] px-4 py-3.5">
              {features.map((f: string) => (
                <div key={f} className="flex items-center gap-3 text-[14px] text-[#1E3553]">
                  <IcCheckCircle size={22} className="shrink-0 text-[#0E2B4C]" />
                  {f}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={claim}
              className="mt-4 flex min-h-[54px] w-full items-center justify-center gap-3 rounded-[14px] text-[19px] font-bold text-white shadow-[0_10px_24px_rgba(238,79,16,0.32)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(238,79,16,0.40)]"
              style={{ background: accent || 'linear-gradient(180deg,#FF6A26 0%,#EE4F10 100%)' }}
            >
              <IcShoppingCart size={22} />
              {cfg.ctaText || 'Order Now'}
              <IcArrowForward size={18} />
            </button>
            <button type="button" onClick={close} className="mt-1.5 h-9 w-full text-[12.5px] font-bold text-[#52667C] hover:text-[#0E2B4C]">
              {cfg.secondaryText || 'Maybe later'}
            </button>

            <div className="-mx-4 mt-auto grid grid-cols-3 gap-2 border-t border-[#EDF1F6] px-3 pt-4 md:-mx-7 md:px-[18px]">
              {[
                { Icon: IcVerifiedUser, a: '100% Secure', b: 'Payment' },
                { Icon: IcLocalShipping, a: 'Pan-India', b: 'Delivery' },
                { Icon: IcHeadsetMic, a: '1 Year', b: 'Warranty & Support' },
              ].map(({ Icon, a, b }) => (
                <div key={a} className="flex min-w-0 items-center gap-[7px]">
                  <Icon size={24} className="shrink-0 text-[#0E2B4C]" />
                  <div className="leading-[1.25]">
                    <div className="text-[12px] font-semibold text-[#0E2B4C]">{a}</div>
                    <div className="text-[11px] text-[#52667C]">{b}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
