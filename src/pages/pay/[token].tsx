import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { ShieldCheck, IndianRupee, CheckCircle2, AlertCircle, Clock, Loader2, RefreshCw, Lock } from 'lucide-react'
import { payLinkAPI } from '@/services/api'
import { loadRazorpay } from '@/lib/loadRazorpay'

// Public page behind the "pay your booking fee" link our team sends by SMS / WhatsApp
// (in an SMS it is written /pay?c=<code>). One fee, one button. No login — the customer,
// or somebody paying for them, can pay. The amount comes from the server; this page never
// decides it. After the payment is confirmed the booking fee of that request is marked paid.

type Info = { requestId: string; name: string; amount: number; state: 'due' | 'paid' | 'closed' | 'none'; emergency: boolean; service: string; vehicle: string; separate: boolean; test?: boolean }
type Phase = 'loading' | 'ready' | 'paying' | 'done' | 'invalid' | 'offline'

// The approved WhatsApp button opens …/pay/%7B%7B1%7D%7D<code>: the literal "{{1}}" is not part of the code.
const cleanCode = (c: string) => String(c || '').trim().replace(/^(?:\{\{1\}\}|%7B%7B1%7D%7D)/i, '')

// Module scope on purpose: defined inside the page it would be a new component
// type on every render and remount everything below it.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F3F5F9' }} className="flex flex-col">
      <Head>
        <title>Pay booking fee — Bharat Mechanics</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: 'linear-gradient(120deg,#0E2042,#1B3B6F)' }}>
        <ShieldCheck className="h-5 w-5 text-[#6EE7B7]" />
        <span className="font-extrabold tracking-tight">Bharat Mechanics</span>
        <span className="ml-auto text-[11px] font-semibold uppercase tracking-wider text-white/60">Booking Fee</span>
      </div>
      <div className="flex flex-1 items-start justify-center p-4">
        <div className="mt-4 w-full max-w-md">{children}</div>
      </div>
      <p className="flex items-center justify-center gap-1.5 px-6 pb-6 text-center text-[11.5px] text-[#7B8AA3]"><Lock className="h-3 w-3" /> Secure payment by Razorpay — UPI, card or net banking</p>
    </div>
  )
}

export default function PayBookingFeePage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('loading')
  const [info, setInfo] = useState<Info | null>(null)
  const [err, setErr] = useState('')
  const code = useRef('')

  const load = useCallback(() => {
    const token = cleanCode((router.query.token as string) || (typeof window !== 'undefined' ? decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() || '') : ''))
    code.current = token
    if (!token) { setPhase('invalid'); return }
    setPhase('loading')
    payLinkAPI.info(token)
      .then((r) => { const d = r.data?.data; if (!d) { setPhase('invalid'); return } setInfo(d); setPhase(d.state === 'paid' ? 'done' : 'ready') })
      .catch((e) => setPhase(e?.response?.status === 404 ? 'invalid' : 'offline'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.token])
  useEffect(() => { if (router.isReady) load() }, [router.isReady, load])
  useEffect(() => { loadRazorpay() }, []) // warm the payment window

  const pay = async () => {
    if (phase !== 'ready' || !info) return
    setErr('')
    setPhase('paying')
    const fail = (message: string) => { setErr(message); setPhase('ready') }
    try {
      if (!(await loadRazorpay()) || typeof (window as any).Razorpay === 'undefined') return fail('The payment window could not be opened. Check your internet and try again.')
      const res = await payLinkAPI.order(code.current)
      const order = res.data?.data
      if (!order?.orderId || !order?.keyId) return fail(res.data?.message || 'Could not start the payment. Please try again.')
      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Bharat Mechanics',
        image: 'https://bharatmechanics.com/favicon.png',
        description: `Booking fee · ${info.requestId}`,
        order_id: order.orderId,
        theme: { color: '#1B3B6F' },
        modal: { ondismiss: () => fail('Payment was not completed. You were not charged — press the button to try again.') },
        handler: async (response: any) => {
          try {
            const v = await payLinkAPI.verify(code.current, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            if (v.data?.data?.state === 'paid') { setInfo((i) => (i ? { ...i, state: 'paid' } : i)); setPhase('done') }
            else fail('We could not confirm the payment yet. If money was deducted, it is safe — please contact our team with your booking number.')
          } catch (e: any) {
            fail(e?.response?.data?.message || 'We could not confirm the payment. If money was deducted, please contact our team with your booking number.')
          }
        },
      })
      rzp.open()
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 409) { load(); return } // already paid / closed meanwhile: show what is true now
      fail(e?.response?.data?.message || 'Could not start the payment. Please try again.')
    }
  }

  const card = 'rounded-3xl bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,32,66,.10)]'

  if (phase === 'loading') {
    return <Shell><div className={`${card} flex items-center justify-center gap-2 py-12 text-[14px] font-semibold text-[#5B6B85]`} data-pay-loading><Loader2 className="h-5 w-5 animate-spin" />Opening your booking…</div></Shell>
  }

  if (phase === 'invalid' || phase === 'offline' || !info) {
    const offline = phase === 'offline'
    return (
      <Shell>
        <div className={card} data-pay-notice={offline ? 'offline' : 'invalid'}>
          {offline ? <RefreshCw className="mx-auto h-12 w-12 text-[#D97706]" /> : <AlertCircle className="mx-auto h-12 w-12 text-[#D97706]" />}
          <h1 className="mt-3 text-[20px] font-extrabold text-[#13203A]">{offline ? 'Could not open the booking' : 'This link is not valid'}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5B6B85]">{offline ? 'Check your internet and try again.' : 'Please check the link in the message, or ask our team to send it again.'}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-[#5B6B85]">{offline ? 'इंटरनेट देखें और दोबारा कोशिश करें।' : 'कृपया मैसेज का लिंक दोबारा देखें।'}</p>
          {offline && <button type="button" onClick={load} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-[#D5DDEC] px-5 text-[14px] font-bold text-[#1B3B6F]"><RefreshCw className="h-4 w-4" />Try again</button>}
        </div>
      </Shell>
    )
  }

  if (phase === 'done' || info.state === 'paid') {
    return (
      <Shell>
        <div className={card} data-pay-done>
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#16A34A]" />
          <h1 className="mt-3 text-[21px] font-extrabold text-[#13203A]">Booking fee paid</h1>
          <p className="mt-1 text-[15px] font-semibold text-[#16A34A]">भुगतान मिल गया, धन्यवाद!</p>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5B6B85]">₹{info.amount} received for booking <b className="text-[#13203A]">{info.requestId}</b>. Your booking is confirmed — our team will send a mechanic to you.</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#7B8AA3]">{info.separate ? 'This is a separate booking fee. The bill for the work is paid after the job is done.' : 'This fee is adjusted in the bill for the work.'} You can close this page.</p>
        </div>
      </Shell>
    )
  }

  if (info.state !== 'due') {
    return (
      <Shell>
        <div className={card} data-pay-notice="closed">
          <Clock className="mx-auto h-12 w-12 text-[#D97706]" />
          <h1 className="mt-3 text-[20px] font-extrabold text-[#13203A]">Nothing to pay here</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5B6B85]">Booking {info.requestId} is closed, or it has no booking fee to pay.</p>
          <p className="mt-1 text-[14px] leading-relaxed text-[#5B6B85]">इस बुकिंग के लिए कोई भुगतान बाकी नहीं है।</p>
        </div>
      </Shell>
    )
  }

  const working = phase === 'paying'
  return (
    <Shell>
      <div className={card} data-pay-due>
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF0FE]"><IndianRupee className="h-8 w-8 text-[#1E40E0]" /></span>
        {/* one of the team's test phone numbers: the payment runs in Razorpay test mode */}
        {info.test && <p className="mt-3 rounded-lg bg-[#FFF8E6] px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-[#92400E]" data-pay-test>Test mode — no real money is charged</p>}
        <h1 className="mt-4 text-[21px] font-extrabold leading-snug text-[#13203A]">{info.name ? `Hi ${info.name}, pay` : 'Pay'} your booking fee</h1>
        <p className="mt-1 text-[15px] font-semibold text-[#1B3B6F]">बुकिंग फीस का भुगतान करें</p>

        <div className="mt-4 rounded-2xl bg-[#F6F8FB] px-4 py-3 text-left text-[13.5px] text-[#475569]">
          <div className="flex justify-between gap-3 py-1"><span>Booking</span><b className="text-[#13203A]" data-pay-request>{info.requestId}</b></div>
          {(info.service || info.vehicle) && <div className="flex justify-between gap-3 py-1"><span>Service</span><b className="text-right text-[#13203A]">{[info.service, info.vehicle].filter(Boolean).join(' · ')}</b></div>}
          <div className="mt-1 flex items-center justify-between gap-3 border-t border-dashed border-[#DDE3EE] pt-2"><span>{info.emergency ? 'Emergency booking fee' : 'Booking fee'}</span><b className="text-[22px] font-extrabold text-[#1B3B6F]" data-pay-amount>₹{info.amount}</b></div>
        </div>

        {err && <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#FEF1F1] px-3 py-2.5 text-left text-[13px] text-[#B91C1C]" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{err}</p>}
        <button type="button" onClick={pay} disabled={working} data-pay-button
          className="mt-5 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FF5A1F] text-[16px] font-extrabold text-white shadow-[0_8px_20px_rgba(255,90,31,.35)] disabled:opacity-70">
          {working ? <Loader2 className="h-5 w-5 animate-spin" /> : <IndianRupee className="h-5 w-5" />}
          {working ? 'Opening payment…' : `Pay ₹${info.amount}`}
        </button>
        <p className="mt-3 text-[12.5px] leading-relaxed text-[#7B8AA3]" data-pay-note>
          {info.separate
            ? 'This is a separate, non-refundable booking fee. The mechanic tells you the cost of the work before starting, and you pay that bill after the job is done.'
            : 'This booking fee is non-refundable and is adjusted in the bill for the work.'}
        </p>
      </div>
    </Shell>
  )
}
