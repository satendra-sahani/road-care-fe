'use client'

// BM Care subscription — ported from the customer-app prototype
// (bmc-extra.jsx: Subscription / SubPay / SubProgressCard). Faithful
// UI + the prototype's client-side localStorage persistence via
// `@/lib/bmCare`. Rendered inside the customer UserLayout.
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { UserLayout } from '@/components/layout/UserLayout'
import { useLoginModal } from '@/components/auth/LoginModalProvider'
import { userMembershipAPI } from '@/services/api'
import type { RootState } from '@/store'
import {
  SUB_PLANS, planById, planKeyById, fmtDate, bmCareStore, useBmCareSub,
  type SubPlan, type Cycle,
} from '@/lib/bmCare'
import {
  Shield, Wrench, Check, ChevronRight, ChevronLeft, ArrowRight,
  Smartphone, CreditCard, Wallet, Landmark, Tag, PartyPopper, Loader2,
} from 'lucide-react'

const inr = (n: number) => n.toLocaleString('en-IN')

declare global { interface Window { Razorpay: any } }

// Robust Razorpay web-SDK loader (falls back if the _document tag hasn't loaded)
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

const PAY_OPTS: { id: string; t: string; s: string; icon: React.ReactNode }[] = [
  { id: 'upi', t: 'UPI', s: 'Google Pay, PhonePe, Paytm', icon: <Smartphone className="h-5 w-5 text-[#1B3B6F]" /> },
  { id: 'card', t: 'Card', s: 'Credit / Debit card', icon: <CreditCard className="h-5 w-5 text-[#1B3B6F]" /> },
  { id: 'wallet', t: 'BM Wallet', s: '₹420 available', icon: <Wallet className="h-5 w-5 text-[#1BA672]" /> },
  { id: 'nb', t: 'Net Banking', s: 'All major banks', icon: <Landmark className="h-5 w-5 text-[#1B3B6F]" /> },
]

export function SubscriptionPage() {
  const router = useRouter()
  const sub = useBmCareSub()
  const isActive = !!sub?.active

  const [step, setStep] = useState<'browse' | 'pay' | 'success'>('browse')
  const [cycle, setCycle] = useState<Cycle>(sub?.cycle || 'yr')
  const [sel, setSel] = useState<SubPlan['id']>(isActive ? sub!.plan : 'plus')
  const [payMethod, setPayMethod] = useState('upi')

  const plan = planById(sel)
  const price = cycle === 'yr' ? plan.yr : plan.mo
  const moEquiv = cycle === 'yr' ? Math.round(plan.yr / 12) : plan.mo
  const yrSave = plan.mo * 12 - plan.yr

  const { openLogin } = useLoginModal()
  const isAuthenticated = useSelector((s: RootState) => s.customerAuth?.isAuthenticated)
  const [paying, setPaying] = useState(false)

  // Real subscription: login gate → backend order (price from admin Plan
  // Pricing, never client-claimed) → Razorpay → verify → server membership.
  const doPay = async () => {
    if (paying) return
    if (!isAuthenticated && !Cookies.get('customer_token')) {
      openLogin(() => { doPay() })
      return
    }
    setPaying(true)
    try {
      const res = await userMembershipAPI.subscribe(planKeyById(plan.id), cycle)
      const payload = res.data?.data

      // Free plan — activated immediately, no payment sheet
      if (payload?.membership) {
        bmCareStore.applyServerMembership(payload.membership)
        setStep('success')
        setPaying(false)
        return
      }

      const rzp = payload?.razorpay
      if (!rzp?.orderId || !rzp?.keyId) throw new Error('Could not start the payment')
      const ok = await loadRazorpay()
      if (!ok || typeof window.Razorpay === 'undefined') {
        toast.error('Payment gateway not loaded. Please refresh and try again.')
        setPaying(false)
        return
      }

      const options = {
        key: rzp.keyId,
        amount: rzp.amount,
        currency: rzp.currency || 'INR',
        name: 'Bharat Mechanics · BM Care',
        description: `${plan.name} membership · ${cycle === 'yr' ? 'yearly' : 'monthly'}`,
        order_id: rzp.orderId,
        handler: async (response: any) => {
          try {
            const vr = await userMembershipAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            if (vr.data?.success && vr.data.data) {
              bmCareStore.applyServerMembership(vr.data.data)
              setStep('success')
            } else {
              toast.error(vr.data?.message || 'Verification pending — contact support if not active shortly.')
            }
          } catch {
            toast.error('Payment verification failed. Contact support.')
          } finally {
            setPaying(false)
          }
        },
        theme: { color: '#1B3B6F' },
        modal: { ondismiss: () => { toast.info('Payment cancelled — no money was charged.'); setPaying(false) } },
      }
      new window.Razorpay(options).open()
      return // paying state cleared by handler/ondismiss
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not complete the payment')
    }
    setPaying(false)
  }

  // ── SUCCESS ──────────────────────────────────────────────
  if (step === 'success') {
    return (
      <UserLayout>
        <div className="mx-auto max-w-md px-5 py-10 text-center">
          <div className="mx-auto flex h-[104px] w-[104px] items-center justify-center rounded-full bg-[#1BA672] shadow-[0_14px_40px_rgba(27,166,114,.4)]">
            <Check className="h-14 w-14 text-white" strokeWidth={3} />
          </div>
          <h1 className="mt-6 font-display text-2xl font-extrabold text-[#0F2545]">
            Payment successful <PartyPopper className="inline h-6 w-6 text-[#FF6B35]" />
          </h1>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
            {plan.em} <b>{plan.name}</b> is now active.<br />
            Renews {fmtDate(sub?.renew ? new Date(sub.renew) : new Date(Date.now() + (cycle === 'yr' ? 365 : 30) * 864e5))}.
          </p>
          <div className="mt-7 space-y-3">
            <button onClick={() => setStep('browse')}
              className="h-12 w-full rounded-xl bg-[#1B3B6F] font-bold text-white transition hover:bg-[#16315c]">
              View my plan
            </button>
            <button onClick={() => router.push('/')}
              className="h-12 w-full rounded-xl border border-slate-200 font-bold text-slate-600 transition hover:bg-slate-50">
              Back to home
            </button>
          </div>
        </div>
      </UserLayout>
    )
  }

  // ── PAY ──────────────────────────────────────────────────
  if (step === 'pay') {
    return (
      <UserLayout>
        <div className="mx-auto max-w-md">
          <div className="text-white" style={{ background: 'linear-gradient(165deg,#142C52,#1B3B6F 60%,#24508C)' }}>
            <div className="flex items-center gap-3 px-4 py-4">
              <button onClick={() => setStep('browse')} className="grid h-9 w-9 place-items-center rounded-full bg-white/15">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#7DF3B0]">
                  <Shield className="h-3.5 w-3.5" /> SECURE PAYMENT
                </div>
                <div className="font-display text-lg font-extrabold leading-tight">Confirm &amp; Pay</div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-28 pt-4">
            {/* plan summary */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
                style={{ background: `linear-gradient(150deg,${plan.g1},${plan.g2})` }}>{plan.em}</div>
              <div className="flex-1">
                <div className="text-[15px] font-extrabold text-[#0F2545]">{plan.name}</div>
                <div className="text-xs font-semibold text-slate-500">{cycle === 'yr' ? 'Annual' : 'Monthly'} membership · auto-renews</div>
              </div>
              <button onClick={() => setStep('browse')} className="text-xs font-extrabold text-[#12A4B4]">Change</button>
            </div>

            {/* payment methods */}
            <h3 className="mb-2.5 mt-5 text-base font-extrabold text-[#0F2545]">Payment <span className="text-[#FF6B35]">method</span></h3>
            <div className="space-y-2.5">
              {PAY_OPTS.map((o) => {
                const on = payMethod === o.id
                return (
                  <button key={o.id} onClick={() => setPayMethod(o.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${on ? 'border-2 border-[#1B3B6F] bg-[#EAF0FA]' : 'border border-slate-200 bg-white'}`}>
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${on ? 'bg-white' : 'bg-slate-50'}`}>{o.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#0F2545]">{o.t}</div>
                      <div className="text-[11.5px] font-semibold text-slate-500">{o.s}</div>
                    </div>
                    <span className={`h-5 w-5 shrink-0 rounded-full ${on ? 'border-[6px] border-[#1B3B6F]' : 'border-2 border-slate-300'}`} />
                  </button>
                )
              })}
            </div>

            {/* bill */}
            <h3 className="mb-2.5 mt-5 text-base font-extrabold text-[#0F2545]">Bill <span className="text-[#FF6B35]">details</span></h3>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <BillRow k={`${plan.name} · ${cycle === 'yr' ? 'yearly' : 'monthly'}`} v={`₹${inr(cycle === 'yr' ? plan.mo * 12 : plan.mo)}`} />
              {cycle === 'yr' && <BillRow k="Annual saving (20%)" v={`−₹${inr(yrSave)}`} green />}
              <BillRow k="GST (18%)" v="Included" />
              <div className="my-2.5 border-t border-dashed border-slate-200" />
              <BillRow k="To pay" v={`₹${inr(price)}`} bold />
            </div>
            {cycle === 'yr' && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#E6F7F0] py-2.5">
                <Tag className="h-4 w-4 text-[#1BA672]" />
                <span className="text-[12.5px] font-extrabold text-[#1BA672]">You save ₹{inr(yrSave)} with yearly billing</span>
              </div>
            )}
          </div>

          {/* pay CTA */}
          <div className="sticky bottom-0 flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3">
            <div>
              <div className="text-[11px] font-bold leading-none text-slate-500">Total</div>
              <div className="mt-0.5 text-xl font-extrabold text-[#0F2545]">₹{inr(price)}</div>
            </div>
            <button onClick={doPay} disabled={paying}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF6B35] py-3.5 font-bold text-white transition hover:bg-[#E55A2B] disabled:opacity-70">
              {paying ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Shield className="h-[18px] w-[18px]" />}
              {paying ? 'Processing…' : `Pay ₹${inr(price)}`}
            </button>
          </div>
        </div>
      </UserLayout>
    )
  }

  // ── BROWSE / MANAGE ──────────────────────────────────────
  const ap = isActive ? planById(sub!.plan) : null
  return (
    <UserLayout>
      <div className="mx-auto max-w-md">
        {/* header band */}
        <div className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(165deg,#142C52,#1B3B6F 60%,#24508C)' }}>
          <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(255,255,255,.12),transparent 70%)' }} />
          <div className="relative px-4 pt-5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide text-[#FFD68A]">
              <Shield className="h-3.5 w-3.5" fill="#FFD68A" /> MEMBERSHIP
            </div>
            <div className="font-display text-2xl font-extrabold leading-tight">BM Care</div>
          </div>
          <p className="relative px-4 pb-5 pt-1 text-[13.5px] font-semibold leading-snug text-white/80">
            Save on every service. Free periodic maintenance, priority mechanics &amp; roadside cover — all year round.
          </p>
        </div>

        <div className="px-4 pb-8">
          {/* active plan management */}
          {isActive && ap && (
            <div className="mt-3.5 overflow-hidden rounded-2xl shadow-lg">
              <div className="relative p-4 text-white" style={{ background: `linear-gradient(145deg,${ap.g1},${ap.g2})` }}>
                <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-extrabold tracking-wide">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7DF3B0] shadow-[0_0_6px_#7DF3B0]" /> ACTIVE
                </div>
                <div className="text-3xl">{ap.em}</div>
                <div className="mt-1 font-display text-2xl font-extrabold">{ap.name}</div>
                <div className="mt-0.5 text-[12.5px] font-bold text-white/85">
                  {sub!.cycle === 'yr' ? 'Annual' : 'Monthly'} · renews {fmtDate(new Date(sub!.renew))}
                </div>
              </div>
              <div className="bg-white p-4">
                <div className="flex gap-2.5">
                  {(() => {
                    const fl = (sub!.freeTotal || 0) - (sub!.servicesUsed || 0)
                    const road = sub!.roadTotal === -1 ? '∞' : String(Math.max(0, (sub!.roadTotal || 0) - (sub!.roadUsed || 0)))
                    return [
                      [`${fl}/${sub!.freeTotal || 0}`, 'Free services left'],
                      [`${sub!.partsDisc || 0}%`, 'Parts discount'],
                      [road, 'Roadside left'],
                    ] as [string, string][]
                  })().map(([v, l]) => (
                    <div key={l} className="flex-1 rounded-xl bg-slate-50 px-1 py-2.5 text-center">
                      <div className="font-display text-lg font-extrabold text-[#1B3B6F]">{v}</div>
                      <div className="mt-0.5 text-[10px] font-extrabold leading-tight text-slate-500">{l}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push('/service')}
                  className="mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B3B6F] font-bold text-white transition hover:bg-[#16315c]">
                  <Wrench className="h-[18px] w-[18px]" /> Book a free service
                </button>
                <button onClick={() => { bmCareStore.cancel() }}
                  className="mt-2.5 h-10 w-full text-[13px] font-extrabold text-slate-500">
                  Turn off auto-renew
                </button>
              </div>
            </div>
          )}

          <h3 className="mb-3.5 mt-5 text-base font-extrabold text-[#0F2545]">
            {isActive ? 'Change' : 'Choose your'} <span className="text-[#FF6B35]">plan</span>
          </h3>

          {/* billing toggle */}
          <div className="mb-3.5 flex rounded-2xl bg-[#EAF0FA] p-1">
            {([['mo', 'Monthly'], ['yr', 'Yearly']] as [Cycle, string][]).map(([id, lb]) => (
              <button key={id} onClick={() => setCycle(id)}
                className={`h-10 flex-1 rounded-xl text-[13.5px] font-extrabold transition ${cycle === id ? 'bg-[#1B3B6F] text-white' : 'bg-transparent text-[#1B3B6F]'}`}>
                {lb}{id === 'yr' && <span className={`ml-1.5 text-[10px] font-extrabold ${cycle === id ? 'text-[#FFD68A]' : 'text-[#1BA672]'}`}>SAVE 20%</span>}
              </button>
            ))}
          </div>

          {/* plan cards */}
          {SUB_PLANS.map((p) => {
            const on = sel === p.id
            const pr = cycle === 'yr' ? p.yr : p.mo
            return (
              <button key={p.id} onClick={() => setSel(p.id)}
                className={`relative mb-3 block w-full rounded-2xl bg-white p-4 text-left transition ${on ? 'border-2 border-[#1B3B6F] shadow-[0_12px_28px_-12px_rgba(27,59,111,.4)]' : 'border border-slate-200 shadow-sm'}`}>
                {p.tag && (
                  <div className="absolute -top-2.5 right-3.5 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold tracking-wide text-white shadow"
                    style={{ background: `linear-gradient(110deg,${p.g1},${p.g2})` }}>{p.tag}</div>
                )}
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
                    style={{ background: `linear-gradient(150deg,${p.g1},${p.g2})` }}>{p.em}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-extrabold text-[#0F2545]">{p.name}</div>
                    <div className="text-[11.5px] font-semibold text-slate-500">{p.tagline}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-xl font-extrabold leading-none text-[#0F2545]">₹{inr(pr)}</div>
                    <div className="text-[10.5px] font-extrabold text-slate-500">/{cycle === 'yr' ? 'yr' : 'mo'}</div>
                  </div>
                </div>
                <div className={`mt-3 grid ${on ? 'gap-2' : 'gap-1.5'}`}>
                  {(on ? p.perks : p.perks.slice(0, 3)).map((pk, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#E6F7F0]">
                        <Check className="h-3 w-3 text-[#1BA672]" strokeWidth={3} />
                      </span>
                      <span className="text-[12.5px] font-semibold leading-snug text-slate-700">{pk}</span>
                    </div>
                  ))}
                  {!on && p.perks.length > 3 && (
                    <div className="ml-[26px] text-[11.5px] font-extrabold text-[#1B3B6F]">+{p.perks.length - 3} more benefits</div>
                  )}
                </div>
              </button>
            )
          })}

          <div className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-[#E6F7F0] py-2.5">
            <Shield className="h-4 w-4 text-[#1BA672]" />
            <span className="text-xs font-extrabold text-[#1BA672]">Cancel anytime · No lock-in · Pause when you travel</span>
          </div>

          {/* subscribe CTA (browse only) */}
          {!isActive && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <div>
                <div className="text-[11px] font-bold leading-none text-slate-500">{plan.name} · {cycle === 'yr' ? 'yearly' : 'monthly'}</div>
                <div className="mt-0.5 text-xl font-extrabold text-[#0F2545]">₹{inr(price)}<span className="text-xs font-bold text-slate-500"> /{cycle === 'yr' ? 'yr' : 'mo'}</span></div>
                {cycle === 'yr' && <div className="text-[10.5px] font-extrabold text-[#1BA672]">≈ ₹{moEquiv}/mo · save ₹{inr(yrSave)}</div>}
              </div>
              <button onClick={() => setStep('pay')}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF6B35] py-3.5 font-bold text-white transition hover:bg-[#E55A2B]">
                Subscribe <ArrowRight className="h-[18px] w-[18px]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  )
}

function BillRow({ k, v, bold, green }: { k: string; v: string; bold?: boolean; green?: boolean }) {
  return (
    <div className="flex justify-between py-1">
      <span className={`${bold ? 'text-[14.5px] font-extrabold' : 'text-[13px] font-bold'} text-slate-700`}>{k}</span>
      <span className={`${bold ? 'text-[17px] font-extrabold' : 'text-[13.5px] font-extrabold'} ${green ? 'text-[#1BA672]' : 'text-[#0F2545]'}`}>{v}</span>
    </div>
  )
}
