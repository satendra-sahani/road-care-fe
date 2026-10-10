'use client'

import { useRouter } from 'next/router'
import { IcCheckCircle } from '@/components/icons/BmIcons'

// The "free registration, limited time" strip shown on /register/mechanic and
// /register/shop when the visitor comes from a WhatsApp / campaign link
// (?offer=free or ?src=wa). Nothing else on the page changes: registration
// never asks for a payment, this only says so loudly.
export function RegisterOffer({ who }: { who: 'mechanic' | 'shop' }) {
  const { query } = useRouter()
  const on = query.offer === 'free' || query.src === 'wa'
  if (!on) return null
  const city = typeof query.city === 'string' && query.city.trim() ? query.city.trim().slice(0, 40) : ''
  return (
    <div data-register-offer className="mt-5 overflow-hidden rounded-2xl border border-[#F8D9C4] bg-[linear-gradient(135deg,#FFF6EF,#FFFFFF)] shadow-[0_12px_30px_-22px_rgba(201,67,9,0.6)]">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-[#C94309] px-3 py-1 text-[11.5px] font-bold uppercase tracking-wide text-white">Limited-time offer</span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold leading-snug text-[#0E2B4C] sm:text-[17px]">
            Free registration{city ? <> — Bharat Mechanics is now in {city}</> : <> — Bharat Mechanics is now in your city</>}
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[#41586F]">
            {who === 'shop' ? 'List your garage' : 'Join as a mechanic'} today at no cost. No payment is asked now, you only fill in your details and verify your number.
            <span lang="hi" className="mt-0.5 block text-[13px] text-[#52667C]">
              {who === 'shop' ? 'अपना गैरेज आज ही मुफ़्त में जोड़ें।' : 'आज ही मुफ़्त में मैकेनिक रजिस्टर करें।'} अभी कोई पैसा नहीं देना है, सिर्फ़ जानकारी भरें और नंबर वेरिफाई करें।
            </span>
          </p>
        </div>
        <ul className="grid shrink-0 gap-1.5 text-[12.5px] font-semibold text-[#13864D] sm:text-right">
          {['₹0 registration', 'No payment now', 'Jobs on your phone'].map((t) => (
            <li key={t} className="flex items-center gap-1.5 sm:justify-end"><IcCheckCircle size={16} />{t}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
