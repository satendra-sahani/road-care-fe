'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { partnerRegisterAPI } from '@/services/api'
import { IcCheckCircle, IcAccountBalanceWallet, IcLocationOn, IcVerifiedUser } from '@/components/icons/BmIcons'

export type PartnerPlan = { key: string; name: string; platformFeePct: number; rangeKm: number; minWallet: number; tagline?: string }

// Fallback shown while /plans loads (same values as the backend config).
const FALLBACK_PLANS: PartnerPlan[] = [
  { key: 'standard', name: 'Standard', platformFeePct: 5, rangeKm: 8, minWallet: 5000, tagline: 'Good for a single mechanic or a small garage' },
  { key: 'pro', name: 'Pro', platformFeePct: 3, rangeKm: 20, minWallet: 10000, tagline: 'Lower fee and a wider area for busy shops' },
]
const FALLBACK_TERMS = [
  'No payment is needed to register. Top up the minimum wallet balance from your panel / app before you start taking jobs; the platform fee for each job is deducted from your wallet or from the job payment.',
  'When a customer cancels after you have been assigned, the customer’s registration (booking) fee is credited to you as a visit charge.',
  'Withdrawals: any amount above your minimum wallet balance can be withdrawn and is credited to your bank / UPI within 2 hours to 5 working days.',
  'Full withdrawal: if you withdraw your entire balance (including the minimum), it is processed within 30 days and job routing pauses until the minimum is restored.',
  'Keep your KYC, bank / UPI and contact details accurate. Bharat Mechanics may pause routing for unverified, inactive or below-minimum accounts.',
]

const inr = (n: number) => '₹' + n.toLocaleString('en-IN')

/**
 * Plan picker + partner terms with acceptance. Used by /register/mechanic and
 * /register/shop (same plans and terms for both). Nothing is paid here.
 */
export function PartnerPlanTerms({ plan, onPlanChange, accepted, onAcceptedChange, who = 'partner', name }: {
  plan: string
  onPlanChange: (key: string) => void
  accepted: boolean
  onAcceptedChange: (v: boolean) => void
  who?: 'mechanic' | 'shop' | 'partner'
  name?: string
}) {
  const [plans, setPlans] = useState<PartnerPlan[]>(FALLBACK_PLANS)
  const [terms, setTerms] = useState<string[]>(FALLBACK_TERMS)

  useEffect(() => {
    let alive = true
    partnerRegisterAPI.getPlans().then((r) => {
      const d = r.data?.data
      if (!alive || !d) return
      if (Array.isArray(d.plans) && d.plans.length) setPlans(d.plans)
      if (Array.isArray(d.terms) && d.terms.length) setTerms(d.terms.filter((t: string) => !/^Choose a plan/.test(t)))
    }).catch(() => { /* fallback copy is shown */ })
    return () => { alive = false }
  }, [])

  const chosen = plans.find((p) => p.key === plan)

  return (
    <div className="space-y-5">
      {/* Plan picker */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-start gap-3 px-5 pt-5 pb-3 border-b border-gray-50">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#1B3B6F]/10 text-[#1B3B6F]"><IcAccountBalanceWallet size={18} /></div>
          <div>
            <h3 className="text-sm font-bold text-[#1A1D29]">Choose your partner plan <span className="text-red-500">*</span></h3>
            <p className="mt-0.5 text-xs text-[#6B7280]">Same plans for mechanics and shops. No payment now — you add the wallet balance later, before taking jobs.</p>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2" role="radiogroup" aria-label="Partner plan">
          {plans.map((p) => {
            const on = p.key === plan
            return (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onPlanChange(p.key)}
                className={`relative rounded-2xl border-2 p-4 text-left transition-colors ${on ? 'border-[#C94309] bg-[#FFF6EF]' : 'border-[#E6ECF3] bg-white hover:border-[#F4B48F]'}`}
              >
                {p.key === 'pro' && <span className="absolute right-3 top-3 rounded-full bg-[#0E2B4C] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white">Lower fee</span>}
                <div className="flex items-center gap-2">
                  <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${on ? 'border-[#C94309] bg-[#C94309] text-white' : 'border-[#CBD5E1]'}`}>{on && <IcCheckCircle size={14} />}</span>
                  <span className="text-[16px] font-bold text-[#0E2B4C]">{p.name}</span>
                </div>
                {p.tagline && <p className="mt-1 text-[12px] text-[#52667C]">{p.tagline}</p>}
                <dl className="mt-3 space-y-1.5 text-[13px]">
                  <div className="flex items-baseline justify-between gap-2"><dt className="text-[#52667C]">Platform fee</dt><dd className="font-bold text-[#0E2B4C]">{p.platformFeePct}% per request</dd></div>
                  <div className="flex items-baseline justify-between gap-2"><dt className="text-[#52667C]">Jobs within</dt><dd className="font-bold text-[#0E2B4C]">{p.rangeKm} km</dd></div>
                  <div className="flex items-baseline justify-between gap-2"><dt className="text-[#52667C]">Minimum wallet</dt><dd className="font-bold text-[#0E2B4C]">{inr(p.minWallet)}</dd></div>
                </dl>
              </button>
            )
          })}
        </div>
        {chosen && (
          <p className="px-5 pb-4 text-[12.5px] text-[#41586F]">
            <b>{chosen.name}:</b> you keep {100 - chosen.platformFeePct}% of every job, receive jobs up to {chosen.rangeKm} km away, and keep at least {inr(chosen.minWallet)} in your wallet.
          </p>
        )}
      </div>

      {/* Terms */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-start gap-3 px-5 pt-5 pb-3 border-b border-gray-50">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#1B3B6F]/10 text-[#1B3B6F]"><IcVerifiedUser size={18} /></div>
          <div>
            <h3 className="text-sm font-bold text-[#1A1D29]">Partner terms &amp; conditions</h3>
            <p className="mt-0.5 text-xs text-[#6B7280]">Please read before you register. Full terms are on the <Link href="/terms#15-partners" className="font-semibold text-[#1864C8] underline">Terms page</Link>.</p>
          </div>
        </div>
        <div className="p-5">
          <ul className="space-y-2.5 text-[13.5px] leading-relaxed text-[#41586F]">
            <li className="flex gap-2.5"><IcLocationOn size={18} className="mt-0.5 shrink-0 text-[#C94309]" /><span><b className="text-[#0E2B4C]">Your plan:</b> {chosen ? `${chosen.name} — ${chosen.platformFeePct}% platform fee on every service request, jobs within ${chosen.rangeKm} km, minimum wallet ${inr(chosen.minWallet)}.` : 'choose a plan above.'}</span></li>
            {terms.map((t) => <li key={t} className="flex gap-2.5"><IcCheckCircle size={18} className="mt-0.5 shrink-0 text-[#13864D]" /><span>{t}</span></li>)}
          </ul>
          <label className={`mt-4 flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 ${accepted ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-[#1B3B6F]/40'}`}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#1B3B6F]" checked={accepted} onChange={(e) => onAcceptedChange(e.target.checked)} />
            <span className="text-sm text-[#1A1D29]">
              I{name ? <>, <b>{name}</b>,</> : null} have read and accept the partner terms above — the {chosen?.name || 'selected'} plan, the minimum wallet balance, the cancellation / visit-charge rule and the withdrawal rules — and confirm my details are correct.
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
