'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

const KEY = 'bm_cookie_consent'

/**
 * Site-wide cookie consent banner. Shows once until the visitor chooses; the
 * choice is stored in localStorage. "Only essential" (and the dismiss X) is the
 * privacy-preserving default — non-essential/analytics cookies should only be
 * loaded when the stored choice is 'accepted'.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true)
    } catch {
      /* storage blocked — do not show */
    }
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
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_14px_44px_-14px_rgba(15,37,71,0.4)] ring-1 ring-black/5 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFF1E8] text-[#FF6B35]">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-relaxed text-[#334155] md:text-sm">
              We use cookies to keep you signed in, remember your cart, and improve Bharat Mechanics with
              anonymous analytics. You can accept all, or keep only the essential ones. See our{' '}
              <Link href="/privacy#10" className="font-semibold text-[#1B3B6F] underline underline-offset-2">
                Cookie &amp; Privacy Policy
              </Link>
              .
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => choose('accepted')}
                className="inline-flex items-center rounded-full bg-[#FF6B35] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#F2541B]"
              >
                Accept all
              </button>
              <button
                onClick={() => choose('rejected')}
                className="inline-flex items-center rounded-full bg-[#EEF2F7] px-4 py-2 text-[13px] font-bold text-[#1B3B6F] transition-colors hover:bg-[#E2E9F2]"
              >
                Only essential
              </button>
            </div>
          </div>
          <button
            onClick={() => choose('rejected')}
            aria-label="Dismiss (keep only essential cookies)"
            className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#94A3B8] hover:bg-black/[0.04]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
