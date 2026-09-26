import { useState } from 'react'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import Image from 'next/image'
import { DImg } from '@/components/ui/DImg'
import { partnerAPI } from '@/services/api'
import {
  IcStore, IcSchedule, IcArrowForward, IcMap, IcGridView, IcLocalShipping, IcCreditCard, IcPersonOutline,
  IcInventory, IcReceiptLong, IcExpandMore, IcCheckCircle, IcLocalOffer, IcSupportAgent, IcHomeRepairService,
} from '@/components/icons/BmIcons'

/* ─── Claude Design → Bharat Mechanics For Shops ─── */

const BENEFITS = [
  { Icon: IcMap, bg: '#E4F5EA', color: '#17A05A', title: 'Reach all of India', desc: 'List once and sell to customers in 40+ cities — from metros to tier-3 towns.' },
  { Icon: IcGridView, bg: '#E4EEFB', color: '#1A6FD4', title: 'One simple dashboard', desc: 'Manage inventory, orders, pricing, and payouts from a single easy panel — in Hindi too.' },
  { Icon: IcLocalShipping, bg: '#FFEDE1', color: '#F4601F', title: 'We handle delivery', desc: 'Our logistics network picks up and delivers. You focus on stocking great parts.' },
  { Icon: IcCreditCard, bg: '#EDE9FE', color: '#6D4AE0', title: 'Get paid on time', desc: 'Receive payments every T+2 days directly to your bank. Transparent statements, no surprises.' },
]
const STEPS: { n: number; title: string; desc: string; Icon?: React.ComponentType<any> }[] = [
  { n: 1, title: 'Register your shop', desc: 'Sign up with your shop details and GST.', Icon: IcPersonOutline },
  { n: 2, title: 'List your parts', desc: 'Add products with photos, prices or bulk upload.', Icon: IcInventory },
  { n: 3, title: 'Receive orders', desc: 'Get notified instantly. Pack the part — we’ll pick it up.', Icon: IcReceiptLong },
  { n: 4, title: 'Get paid', desc: 'Money lands in your bank every T+2 days.' },
]
const SELLER_BENEFITS: { t: string; d: string; Icon?: React.ComponentType<any> }[] = [
  { t: '₹0 to start', d: 'No registration or listing fee' },
  { t: '2–8% low commission', d: 'Only on successful sales', Icon: IcLocalOffer },
  { t: 'Free pickup & delivery', d: 'We handle the logistics', Icon: IcLocalShipping },
  { t: 'Dedicated seller support', d: 'Get help in your language', Icon: IcSupportAgent },
]
const CATEGORIES = ['Spare parts & accessories', 'Tyres & batteries', 'Oils & lubricants', 'Car care & detailing', 'Multi-brand store']

const inputCls = 'w-full border border-[#E1E8F0] rounded-[9px] px-3 py-[11px] mt-[5px] text-[12.5px] text-[#0E2B4C] bg-white outline-none focus:border-[#1A6FD4] placeholder:text-[#94A3B8]'
const labelCls = 'block text-[11.5px] font-semibold text-[#41586F]'
const EYEBROW = 'text-[10.5px] font-bold tracking-[1.6px] text-[#BE3F09]'

export default function ListYourShopPage() {
  const [form, setForm] = useState({ shop: '', owner: '', phone: '', city: '', gst: '', cat: CATEGORIES[0], bank: '' })
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try { await partnerAPI.apply({ type: 'shop', shopName: form.shop, ownerName: form.owner, name: form.owner, phone: form.phone, city: form.city, gstNumber: form.gst, shopCategory: form.cat, bankAccount: form.bank }) } catch {}
    setBusy(false)
    setSubmitted(true)
  }

  return (
    <>
      <SEOHead
        title="List Your Shop"
        description="Sell auto parts on Bharat Mechanics. Reach lakhs of customers, manage orders from one dashboard, and get paid on time with zero setup fees."
      />
      <UserLayout>
        <div className="bg-[#F5F8FC] text-[#0E2B4C] text-[14px] leading-[1.5]">
          {/* HERO */}
          <div className="relative overflow-hidden bg-[#F2F4F7]">
            {/* design backdrop (was a CSS background-image → now an optimized, early-loading image) */}
            <Image src="/design/shop-tools-bg-v2.png" alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover object-left" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,248,251,0.55)_0%,rgba(246,248,251,0.25)_45%,rgba(246,248,251,0)_70%)]" />
            <div className="relative max-w-[1320px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(18px,2.6vw,30px)] pb-[clamp(22px,3vw,34px)] flex flex-wrap gap-[clamp(14px,2.2vw,26px)] items-center">
              <div className="flex-[1_1_340px] min-w-0">
                <div className={EYEBROW}>SELL ON BHARAT MECHANICS</div>
                <h1 className="mt-2 text-[clamp(24px,3.1vw,35px)] leading-[1.15] font-bold tracking-[-1px] max-w-[460px]">Grow your auto parts business with India&rsquo;s trusted platform</h1>
                <p className="mt-3 text-[clamp(12.5px,1.15vw,14px)] text-[#41586F] max-w-[410px]">List your spare parts, reach thousands of customers across India, and manage everything from one simple dashboard.</p>
                <div className="flex items-center gap-[clamp(12px,1.8vw,22px)] mt-5 flex-wrap">
                  {[
                    { v: '2,400+', l: 'Partner shops', Icon: IcStore, bg: '#DCEBFB', c: '#1A6FD4' },
                    { v: '₹0', l: 'Setup & listing fee', bg: '#FFE2CE', c: '#F4601F' },
                    { v: 'T+2', l: 'Days to payout', Icon: IcSchedule, bg: '#DCEBFB', c: '#1A6FD4' },
                  ].map((s) => (
                    <div key={s.l} className="flex items-center gap-2.5">
                      <span className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 text-[16px] font-bold" style={{ background: s.bg, color: s.c }}>{s.Icon ? <s.Icon size={19} /> : '₹'}</span>
                      <div><div className="text-[16px] font-bold leading-tight">{s.v}</div><div className="text-[11px] text-[#52667C]">{s.l}</div></div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-[22px] flex-wrap">
                  <a href="#apply" className="flex items-center gap-[9px] bg-[#C94309] hover:bg-[#A93807] text-white hover:text-white rounded-[11px] px-6 py-3.5 text-[14px] font-semibold transition-colors">Start selling free <IcArrowForward size={16} /></a>
                  <a href="#how" className="bg-white hover:bg-[#EAF2FC] text-[#0E2B4C] hover:text-[#0E2B4C] rounded-[11px] px-6 py-3.5 text-[14px] font-semibold transition-colors">See how it works</a>
                </div>
              </div>
              <div className="flex-[1_1_360px] min-w-0 flex justify-center">
                <DImg loading="eager" sizes="(max-width: 767px) 92vw, 640px" src="/design/shop-hero-v5-o.webp" alt="Badhte Raho Saath, Bharat Ke Saath — seller dashboard with auto parts" className="block w-full max-w-[800px] max-h-[750px] h-auto object-contain" />
              </div>
            </div>
          </div>

          {/* WHY SELL */}
          <section className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(22px,3vw,34px)]">
            <div className={EYEBROW}>WHY SELL WITH US</div>
            <h2 className="mt-1.5 text-[clamp(19px,2.3vw,26px)] font-bold tracking-[-0.6px]">Everything you need to sell more</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(215px,1fr))] gap-3.5 mt-4">
              {BENEFITS.map((b) => (
                <div key={b.title} className="bg-white border border-[#E6ECF3] rounded-[14px] p-4">
                  <span className="w-10 h-10 rounded-[11px] flex items-center justify-center" style={{ background: b.bg, color: b.color }}><b.Icon size={20} /></span>
                  <div className="mt-3 text-[14px] font-bold">{b.title}</div>
                  <p className="mt-1.5 text-[12px] text-[#52667C] leading-[1.55]">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* STEPS */}
          <section id="how" className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(18px,2.4vw,26px)]">
            <div className="bg-[#EAF1FB] rounded-[18px] px-[clamp(16px,2.4vw,28px)] py-[clamp(18px,2.4vw,26px)]">
              <div className={EYEBROW}>GET STARTED</div>
              <h2 className="mt-1.5 text-[clamp(18px,2.2vw,24px)] font-bold tracking-[-0.6px]">Start selling in 4 easy steps</h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[clamp(14px,2vw,26px)] mt-5">
                {STEPS.map((s) => (
                  <div key={s.n}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-[#C94309] text-white text-[13px] font-bold flex items-center justify-center shrink-0">{s.n}</span>
                      <span className="w-[38px] h-[38px] rounded-full bg-white flex items-center justify-center shrink-0 text-[#0E2B4C] text-[16px] font-bold">{s.Icon ? <s.Icon size={19} className="text-[#1A6FD4]" /> : '₹'}</span>
                    </div>
                    <div className="mt-3 text-[14px] font-bold">{s.title}</div>
                    <div className="mt-1 text-[12px] text-[#52667C] leading-[1.5]">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* REGISTER + BENEFITS */}
          <section id="apply" className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(18px,2.4vw,26px)] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4 items-stretch">
            <div className="bg-white border border-[#E6ECF3] rounded-[18px] p-[clamp(16px,2vw,22px)]">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="h-14 w-14 rounded-full bg-[#E4F5EA] text-[#0F7040] flex items-center justify-center mx-auto mb-4"><IcCheckCircle size={30} /></div>
                  <h3 className="text-[22px] font-bold">Shop registered!</h3>
                  <p className="text-[13px] text-[#52667C] mt-2 max-w-sm mx-auto">Thanks {form.owner || 'partner'} — our seller team will call you on {form.phone || 'your number'} to verify {form.shop || 'your shop'} and get you live.</p>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <div className={EYEBROW}>JOIN OUR SELLER NETWORK</div>
                  <h2 className="mt-1.5 text-[clamp(18px,2.1vw,23px)] font-bold tracking-[-0.6px]">Register your shop</h2>
                  <div className="mt-1 text-[12px] text-[#52667C]">अपनी दुकान रजिस्टर करें — Free, no setup cost.</div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 mt-4">
                    <div><label className={labelCls}>Shop name</label><input required value={form.shop} onChange={(e) => set('shop', e.target.value)} placeholder="Sharma Auto Parts" className={inputCls} /></div>
                    <div><label className={labelCls}>Owner name</label><input required value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="Vinod Sharma" className={inputCls} /></div>
                    <div><label className={labelCls}>Mobile number</label><input required type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" className={inputCls} /></div>
                    <div><label className={labelCls}>City</label><input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Indore" className={inputCls} /></div>
                    <div><label className={labelCls}>GST number</label><input value={form.gst} onChange={(e) => set('gst', e.target.value)} placeholder="23ABCDE1234F1Z5" className={inputCls} /></div>
                    <div>
                      <label className={labelCls}>Shop category</label>
                      <div className="relative">
                        <select aria-label="Shop category" value={form.cat} onChange={(e) => set('cat', e.target.value)} className={`${inputCls} appearance-none pr-8 text-[#41586F]`}>
                          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                        <IcExpandMore size={16} className="absolute right-2.5 top-1/2 mt-[2px] -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3"><label className={labelCls}>Bank account (for payouts)</label><input value={form.bank} onChange={(e) => set('bank', e.target.value)} placeholder="Account number" className={inputCls} /></div>
                  <button type="submit" disabled={busy} className="flex items-center justify-center gap-[9px] w-full mt-4 bg-[#C94309] hover:bg-[#A93807] text-white rounded-[10px] py-[13px] text-[14px] font-semibold transition-colors disabled:opacity-60">{busy ? 'Submitting…' : 'Register my shop'} <IcArrowForward size={16} /></button>
                  <div className="mt-2.5 text-center text-[11px] text-[#52667C]">By registering you agree to our Seller Terms &amp; verification policy.</div>
                </form>
              )}
            </div>
            <div className="relative bg-[linear-gradient(150deg,#0C2A4D_0%,#123A69_60%,#0E2F58_100%)] rounded-[18px] p-[clamp(16px,2vw,22px)] text-white overflow-hidden">
              <DImg sizes="280px" src="/design/shop-seller-v4-o.webp" alt="Grow your business with us — Bharat Mechanics partner" className="absolute right-[clamp(14px,3%,24px)] bottom-0 w-[44%] max-w-[280px] h-auto z-[1] pointer-events-none" />
              <div className="relative z-[2] max-w-[62%]">
                <h2 className="text-[clamp(18px,2.1vw,23px)] font-bold tracking-[-0.6px]">Seller benefits</h2>
                <div className="mt-1 text-[12px] text-[#C3D4E6]">Every thing you need to sell more, hassle-free.</div>
                <div className="grid gap-3 mt-4">
                  {SELLER_BENEFITS.map((b) => (
                    <div key={b.t} className="flex items-center gap-3">
                      <span className="w-[34px] h-[34px] rounded-[9px] bg-[rgba(240,167,38,0.22)] text-[#F0A726] flex items-center justify-center shrink-0 text-[15px] font-bold">{b.Icon ? <b.Icon size={17} /> : '₹'}</span>
                      <div><div className="text-[13.5px] font-bold">{b.t}</div><div className="text-[11.5px] text-[#C3D4E6]">{b.d}</div></div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-white/15">
                  <div className="text-[26px] font-bold leading-none">2,400+</div>
                  <div className="mt-1 text-[12px] text-[#C3D4E6]">shops already selling on Bharat Mechanics</div>
                </div>
              </div>
            </div>
          </section>

          {/* BRANDS */}
          <section className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(22px,3vw,32px)] text-center">
            <div className={`${EYEBROW} text-[#52667C]`}>TRUSTED BY AUTOMOTIVE BUSINESSES</div>
            <DImg sizes="(max-width: 1023px) 92vw, 980px" src="/design/shop-brands-v4.png" alt="Bosch, MANN Filter, Exide, Castrol, NGK, Philips, Lumax, Valeo, Denso, SKF" className="block w-full max-w-[980px] h-auto mx-auto mt-[18px]" />
          </section>

          {/* CTA */}
          <section className="max-w-[1200px] mx-auto px-[clamp(14px,3vw,24px)] pt-[clamp(20px,2.6vw,28px)] pb-[clamp(28px,3.4vw,40px)]">
            <div className="relative bg-[linear-gradient(100deg,#FDEBDC_0%,#FBDFC9_100%)] rounded-[18px] p-[clamp(16px,2.2vw,24px)] overflow-hidden">
              <div className="relative z-[2] flex items-center gap-[clamp(14px,2.2vw,24px)] flex-wrap">
                <span className="w-16 h-16 rounded-[18px] bg-[#C94309] text-white shadow-[0_10px_22px_rgba(244,96,31,0.28)] flex items-center justify-center shrink-0"><IcHomeRepairService size={30} /></span>
                <div className="flex-1 min-w-[220px]">
                  <div className="text-[clamp(16px,1.8vw,20px)] font-bold">List your shop and start selling today!</div>
                  <div className="text-[12.5px] text-[#41586F] mt-0.5">Join 2,400+ successful partner shops across India.</div>
                </div>
                <a href="#apply" className="flex items-center gap-[9px] bg-[#C94309] hover:bg-[#A93807] text-white hover:text-white rounded-[11px] px-[22px] py-[13px] text-[13.5px] font-semibold whitespace-nowrap transition-colors">Get started now <IcArrowForward size={16} /></a>
              </div>
            </div>
          </section>
        </div>
      </UserLayout>
    </>
  )
}
