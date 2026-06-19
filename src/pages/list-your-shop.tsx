import { useState } from 'react'
import { SEOHead } from '@/components/SEOHead'
import { UserLayout } from '@/components/layout/UserLayout'
import {
  Globe, LayoutDashboard, Truck, Banknote, TrendingUp, ShieldCheck,
  Receipt, CheckCircle2, ArrowRight,
} from 'lucide-react'

const BENEFITS = [
  { icon: Globe, color: 'bg-[#FEF3E2] text-[#D97706]', title: 'Reach all of India', desc: 'List once and sell to customers in 40+ cities — metros to tier-2 and tier-3 towns.' },
  { icon: LayoutDashboard, color: 'bg-[#F2F6FC] text-[#1B3B6F]', title: 'One simple dashboard', desc: 'Manage inventory, orders, pricing, and payouts from a single easy panel — in Hindi too.' },
  { icon: Truck, color: 'bg-[#E7F6F0] text-[#15936B]', title: 'We handle delivery', desc: 'Our logistics network picks up and delivers. You focus on stocking great parts.' },
  { icon: Banknote, color: 'bg-[#FFF1EB] text-[#FF6B35]', title: 'On-time payments', desc: 'Get paid every T+2 days, directly to your bank. Transparent statements, no surprises.' },
  { icon: TrendingUp, color: 'bg-[#EAF1FE] text-[#2563EB]', title: 'Grow with insights', desc: 'See what is selling, trending searches, and demand in your area to stock smarter.' },
  { icon: ShieldCheck, color: 'bg-[#F1EBFE] text-[#7C3AED]', title: 'Verified seller badge', desc: 'Earn trust with a verified badge, ratings, and reviews that win repeat buyers.' },
]

const STEPS = [
  { n: 1, title: 'Register your shop', desc: 'Sign up with your shop name, GST, and bank details in minutes.' },
  { n: 2, title: 'List your parts', desc: 'Add products with photos & prices, or bulk-upload your catalogue.' },
  { n: 3, title: 'Receive orders', desc: 'Get notified instantly. Pack the part — we pick it up for delivery.' },
  { n: 4, title: 'Get paid', desc: 'Money lands in your bank every T+2 days with clear statements.' },
]

const FEES: [string, string][] = [
  ['₹0', 'Registration & listing fee'],
  ['2–8%', 'Low commission, only on sales'],
  ['T+2', 'Guaranteed payout to your bank'],
]

const CHART = [45, 62, 50, 78, 66, 90, 72]

const inputCls = 'w-full h-12 border border-[#E7ECF3] rounded-xl px-3.5 text-sm bg-[#F6F8FB] text-[#13203A] focus:outline-none focus:border-[#D97706] focus:bg-white'

export default function ListYourShopPage() {
  const [form, setForm] = useState({ shop: '', owner: '', phone: '', city: '', gst: '', cat: 'Spare parts & accessories', bank: '' })
  const [submitted, setSubmitted] = useState(false)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <>
      <SEOHead
        title="List Your Shop"
        description="Sell auto parts on Bharat Mechanics. Reach lakhs of customers, manage orders from one dashboard, and get paid on time with zero setup fees."
      />
      <UserLayout>
        <div className="bg-white">
          {/* HERO */}
          <section className="relative overflow-hidden bg-gradient-to-br from-[#7C4408] via-[#B45309] to-[#D97706] text-white">
            <div className="absolute -top-24 -right-12 w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(255,220,150,0.25),transparent_64%)] pointer-events-none" />
            <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-white/[0.18] text-white rounded-full px-3 py-1 text-xs font-bold mb-4">🏪 Sell on Bharat Mechanics</span>
                <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08]">Take your spare-parts shop online.</h1>
                <p className="mt-4 text-[#FCE9CF] text-base md:text-lg max-w-lg">Reach lakhs of customers across India, manage orders from one dashboard, and get paid on time — with zero setup fees.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#apply" className="inline-flex items-center gap-2 bg-white text-[#B45309] hover:bg-[#FEF3E2] font-semibold px-6 py-3 rounded-full text-sm shadow-lg transition-colors">Start selling free <ArrowRight className="h-4 w-4" /></a>
                  <a href="#how" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 ring-1 ring-white/30 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors">See how it works</a>
                </div>
                <div className="mt-8 flex gap-8">
                  {[['2,400+', 'Partner shops'], ['₹0', 'Setup & listing fee'], ['T+2', 'Days to payout']].map(([v, l]) => (
                    <div key={l}><div className="text-2xl md:text-3xl font-extrabold">{v}</div><div className="text-[12.5px] text-[#FCE9CF]">{l}</div></div>
                  ))}
                </div>
              </div>

              {/* Dashboard mock */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden text-[#13203A]">
                <div className="bg-[#F6F8FB] border-b border-[#E7ECF3] px-4 py-3.5 flex items-center gap-2">
                  <span className="h-[11px] w-[11px] rounded-full bg-[#FF5F57]" /><span className="h-[11px] w-[11px] rounded-full bg-[#FEBC2E]" /><span className="h-[11px] w-[11px] rounded-full bg-[#28C840]" />
                  <span className="ml-2 text-xs font-semibold text-[#7B8AA3]">Seller Dashboard · Sharma Auto Parts</span>
                </div>
                <div className="p-5">
                  <div className="flex gap-3 mb-3.5">
                    {[['Today’s sales', '₹18,450', '▲ 12% vs yesterday'], ['Orders', '34', '▲ 6 new'], ['Rating', '4.8★', '312 reviews']].map(([l, v, u]) => (
                      <div key={l} className="flex-1 bg-[#F6F8FB] rounded-xl p-3.5">
                        <div className="text-[11px] text-[#7B8AA3] font-semibold">{l}</div>
                        <div className="text-[22px] font-extrabold text-[#1B3B6F] mt-0.5">{v}</div>
                        <div className="text-[11px] text-[#15936B] font-bold">{u}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-[#7B8AA3] font-bold mb-1">This week</div>
                  <div className="h-[90px] flex items-end gap-1.5">
                    {CHART.map((h, i) => (
                      <i key={i} className="flex-1 rounded-t-md bg-gradient-to-b from-[#D97706] to-[#F4B860]" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  {[['Brake Pad Set · Bosch', 'Order #BM-20418 · Indore', '₹1,250'], ['Engine Oil 1L · MOTUL', 'Order #BM-20417 · Bhopal', '₹490']].map(([t, s, a]) => (
                    <div key={s} className="flex items-center gap-3 p-3 border border-[#E7ECF3] rounded-xl mt-2.5">
                      <div className="h-[38px] w-[38px] rounded-lg bg-[#F6F8FB] flex items-center justify-center"><Receipt className="h-5 w-5 text-[#D97706]" /></div>
                      <div className="min-w-0"><b className="block text-[13px]">{t}</b><span className="text-[11.5px] text-[#7B8AA3]">{s}</span></div>
                      <div className="ml-auto font-extrabold text-[#1B3B6F]">{a}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FEE BAND */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10">
            <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm p-8 grid sm:grid-cols-3 gap-6 text-center">
              {FEES.map(([v, l]) => (
                <div key={l}><div className="text-3xl md:text-[38px] font-extrabold text-[#D97706]">{v}</div><div className="text-sm text-[#475569] mt-1">{l}</div></div>
              ))}
            </div>
          </section>

          {/* BENEFITS */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#D97706]">Why sell with us</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#13203A] mt-2">Built for India&rsquo;s parts sellers</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="bg-white border border-[#E7ECF3] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${b.color}`}><b.icon className="h-6 w-6" /></div>
                  <h4 className="font-bold text-[#13203A] mb-1.5">{b.title}</h4>
                  <p className="text-sm text-[#475569] leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* STEPS */}
          <section id="how" className="bg-[#F6F8FB]">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
              <div className="text-center mb-9">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#D97706]">Get started</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#13203A] mt-2">Start selling in 4 steps</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STEPS.map((s) => (
                  <div key={s.n} className="bg-white border border-[#E7ECF3] rounded-2xl p-6 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-[#D97706] text-white font-extrabold flex items-center justify-center mb-3.5">{s.n}</div>
                    <h4 className="text-base font-bold text-[#13203A] mb-1.5">{s.title}</h4>
                    <p className="text-[13.5px] text-[#475569] leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* APPLY */}
          <section id="apply" className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
              <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-lg p-6 md:p-8">
                {submitted ? (
                  <div className="text-center py-10">
                    <div className="h-14 w-14 rounded-full bg-[#FEF3E2] text-[#D97706] flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="h-7 w-7" /></div>
                    <h3 className="text-xl font-extrabold text-[#13203A]">Shop registered!</h3>
                    <p className="text-sm text-[#475569] mt-2 max-w-sm mx-auto">Thanks {form.owner || 'partner'} — our seller team will call you on {form.phone || 'your number'} to verify {form.shop || 'your shop'} and get you live.</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}>
                    <h3 className="text-2xl font-extrabold text-[#13203A] mb-1">Register your shop</h3>
                    <p className="text-[#7B8AA3] text-sm mb-5">अपनी दुकान रजिस्टर करें — Free, no setup cost.</p>
                    <div className="grid sm:grid-cols-2 gap-3.5">
                      <Field label="Shop name"><input required value={form.shop} onChange={(e) => set('shop', e.target.value)} placeholder="Sharma Auto Parts" className={inputCls} /></Field>
                      <Field label="Owner name"><input required value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="Vinod Sharma" className={inputCls} /></Field>
                      <Field label="Mobile number"><input required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" className={inputCls} /></Field>
                      <Field label="City"><input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Indore" className={inputCls} /></Field>
                      <Field label="GST number"><input value={form.gst} onChange={(e) => set('gst', e.target.value)} placeholder="23ABCDE1234F1Z5" className={inputCls} /></Field>
                      <Field label="Shop category">
                        <select value={form.cat} onChange={(e) => set('cat', e.target.value)} className={inputCls}>
                          <option>Spare parts &amp; accessories</option><option>Tyres &amp; batteries</option><option>Oils &amp; lubricants</option><option>Car care &amp; detailing</option><option>Multi-brand store</option>
                        </select>
                      </Field>
                      <Field label="Bank account (for payouts)" full><input value={form.bank} onChange={(e) => set('bank', e.target.value)} placeholder="Account number" className={inputCls} /></Field>
                    </div>
                    <button type="submit" className="mt-3 flex items-center justify-center gap-2 w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3.5 rounded-full transition-colors">Register my shop <ArrowRight className="h-4 w-4" /></button>
                    <p className="text-center text-xs text-[#7B8AA3] mt-3">By registering you agree to our Seller Terms &amp; verification policy.</p>
                  </form>
                )}
              </div>
              <div className="bg-gradient-to-b from-[#B45309] to-[#D97706] rounded-2xl p-6 md:p-8 text-white">
                <h3 className="text-[22px] font-extrabold mb-2">Seller benefits</h3>
                <p className="text-[#FCE9CF] text-sm mb-6">Everything you need to sell more, hassle-free.</p>
                {([['₹0 to start', 'No registration or listing fee'], ['Free pickup & delivery', 'We handle the logistics'], ['Dedicated support', 'Seller helpline in your language']] as [string, string][]).map(([t, d]) => (
                  <div key={t} className="flex gap-3 items-start mb-4">
                    <div className="h-[26px] w-[26px] rounded-lg bg-white/[0.18] flex items-center justify-center shrink-0"><CheckCircle2 className="h-3.5 w-3.5 text-white" /></div>
                    <div><b className="block text-[14.5px]">{t}</b><span className="text-[12.5px] text-[#FCE9CF]">{d}</span></div>
                  </div>
                ))}
                <div className="mt-6 pt-5 border-t border-white/20 flex items-center gap-3">
                  <div className="text-3xl font-extrabold">2,400+</div>
                  <div className="text-[12.5px] text-[#FCE9CF]">shops already selling on Bharat Mechanics</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </UserLayout>
    </>
  )
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">{label}</label>
      {children}
    </div>
  )
}
