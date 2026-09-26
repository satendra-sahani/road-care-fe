'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IcClose } from '@/components/icons/BmIcons'

const KEY = 'bm_cookie_consent'

/**
 * Site-wide cookie consent bar. Shows once until the visitor chooses; the
 * choice is stored in localStorage. "Only essential" (and the dismiss X) is the
 * privacy-preserving default — non-essential/analytics cookies should only be
 * loaded when the stored choice is 'accepted'.
 *
 * Kept compact and shown once the page is idle, so it never competes with the
 * page's own content for first paint (it used to become the page's LCP element).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let seen = true
    try { seen = !!localStorage.getItem(KEY) } catch { /* storage blocked — do not show */ }
    if (seen) return
    const show = () => setVisible(true)
    const w = window as any
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(show, { timeout: 3000 })
      return () => w.cancelIdleCallback?.(id)
    }
    const t = setTimeout(show, 1500)
    return () => clearTimeout(t)
  }, [])

  const choose = (choice: 'accepted' | 'rejected') => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice, at: new Date().toISOString() }))
    } catch {
      /* ignore */
    }
    setVisible(false)
    // When analytics is added, gate it on choice === 'accepted'.
  }

  if (!visible) return null

  return (
    <div role="region" aria-label="Cookie consent" className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] p-2.5 max-md:bottom-[60px] sm:p-4">
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[#E6ECF3] bg-white px-3.5 py-2.5 shadow-[0_14px_44px_-14px_rgba(15,37,71,0.4)]">
        <p className="min-w-0 flex-[1_1_220px] text-[12.5px] leading-snug text-[#41586F]">
          We use cookies for sign-in, your cart and anonymous analytics.{' '}
          <Link href="/privacy#10" className="font-semibold text-[#0E2B4C] underline underline-offset-2">Cookie policy</Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => choose('accepted')}
            className="inline-flex h-9 items-center rounded-full bg-[#C94309] px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-[#A93807]"
          >
            Accept all
          </button>
          <button
            onClick={() => choose('rejected')}
            className="inline-flex h-9 items-center rounded-full bg-[#EEF2F7] px-4 text-[12.5px] font-bold text-[#0E2B4C] transition-colors hover:bg-[#E2E9F2]"
          >
            Only essential
          </button>
          <button
            onClick={() => choose('rejected')}
            aria-label="Dismiss (keep only essential cookies)"
            className="grid h-9 w-9 place-items-center rounded-full text-[#52667C] hover:bg-black/[0.04]"
          >
            <IcClose size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
