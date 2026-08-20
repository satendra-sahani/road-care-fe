'use client'

// Home offer popup — web mirror of the app's admin-managed home popup
// (appConfig.homePopup): same content, pricing strip and CTA. Shown once per
// browser session on the home page; the admin can disable it (enabled=false)
// or let it repeat (showOnce=false). App screen names in ctaTarget are mapped
// to their website routes.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { publicConfigAPI } from '@/services/api'
import { X, ArrowRight } from 'lucide-react'

const SESSION_KEY = 'bm_home_popup_shown'

// App navigation target → website route.
const SCREEN_ROUTES: Record<string, string> = {
  gpsplans: '/tracker', trackplans: '/tracker', tracker: '/tracker', vehicletrack: '/tracker',
  shop: '/shop', orders: '/orders', wallet: '/wallet', cashback: '/spin', spin: '/spin',
  services: '/services', subscription: '/subscription',
}

const fmtInr = (n: number) => Number(n || 0).toLocaleString('en-IN')

export function HomeOfferPopup() {
  const router = useRouter()
  const [cfg, setCfg] = useState<any | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let alive = true
    publicConfigAPI.getConfig()
      .then((res) => {
        if (!alive || !res.data?.success) return
        const p = res.data.data?.homePopup
        if (!p || p.enabled === false) return
        if (p.showOnce !== false && typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return
        setCfg(p)
        setTimeout(() => {
          try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* noop */ }
          setVisible(true)
        }, 900)
      })
      .catch(() => { /* config unavailable — no popup */ })
    return () => { alive = false }
  }, [])

  if (!visible || !cfg) return null

  const gradient: string[] = Array.isArray(cfg.gradient) && cfg.gradient.length >= 2 ? cfg.gradient : ['#FF4D8D', '#FF6B35', '#8C5CFF']
  const accent = cfg.accentColor || '#FF6B35'
  const offerPrice = Number(cfg.offerPrice) || 0
  const originalPrice = Number(cfg.originalPrice) || 0
  const imageUrl = typeof cfg.imageUrl === 'string' ? cfg.imageUrl.trim() : ''

  const close = () => setVisible(false)
  const claim = () => {
    close()
    const target = String(cfg.ctaTarget || '').trim()
    if (/^https?:\/\//i.test(target)) { window.open(target, '_blank', 'noopener'); return }
    const route = SCREEN_ROUTES[target.toLowerCase().replace(/[^a-z]/g, '')]
    router.push(route || '/tracker')
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 p-4" onClick={close}>
      <div className="w-full max-w-[380px] overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* gradient header */}
        <div className="relative px-5 pb-5 pt-6 text-center text-white" style={{ background: `linear-gradient(135deg, ${gradient.join(', ')})` }}>
          <button onClick={close} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/20 text-white"><X className="h-4 w-4" /></button>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="mx-auto h-20 w-20 rounded-2xl object-cover shadow-lg" />
          ) : (
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-4xl">{cfg.emoji || '🎉'}</div>
          )}
          <h2 className="mt-3 text-[22px] font-extrabold leading-tight">{cfg.title || 'Special Offer'}</h2>
          {cfg.subtitle && <p className="mt-0.5 text-[13px] font-bold text-white/85">{cfg.subtitle}</p>}
          {cfg.badge && (
            <span className="mt-2.5 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide">{cfg.badge}</span>
          )}
        </div>

        <div className="px-5 pb-5 pt-4 text-center">
          {offerPrice > 0 && (
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-[32px] font-black tracking-tight" style={{ color: accent }}>₹{fmtInr(offerPrice)}</span>
              {originalPrice > offerPrice && (
                <>
                  <span className="text-[15px] font-bold text-slate-400 line-through">₹{fmtInr(originalPrice)}</span>
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-extrabold text-emerald-700">SAVE ₹{fmtInr(originalPrice - offerPrice)}</span>
                </>
              )}
            </div>
          )}
          {cfg.body && <p className="mt-2 text-[13px] font-semibold leading-relaxed text-slate-600">{cfg.body}</p>}

          <button onClick={claim}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-extrabold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}>
            {cfg.ctaText || 'Claim & Explore'} <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={close} className="mt-1.5 h-9 w-full text-[12.5px] font-bold text-slate-400">{cfg.secondaryText || 'Maybe later'}</button>
        </div>
      </div>
    </div>
  )
}
