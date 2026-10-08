'use client'

// Request details → "Booking fee".
// A booking the customer did not pay for in the app (one the team made on a call, or one
// whose payment window was closed) still owes its booking fee. From here the admin sends
// the customer a link to pay it online — by WhatsApp or SMS, or copies it — sends it again
// as often as needed, and sees where it stands: what was sent, whether the link was opened,
// and whether the fee is paid (the card checks by itself while it is open).
// With an approved template the message goes out by itself; otherwise WhatsApp opens with
// the text ready, or the SMS text is copied.
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Check, CheckCircle2, ChevronDown, Clock, Copy, IndianRupee, Loader2, MessageSquareText, RefreshCw } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { adminPayLinkAPI } from '@/services/api'

type Lang = 'hi' | 'en'
type Channel = 'whatsapp' | 'sms' | 'link'
type Msg = { mode: 'auto' | 'manual'; text: string }
type Sent = { channel: Channel; mode: 'sent' | 'manual' | 'failed'; detail?: string; auto: boolean; by: string; at: string }
type Data = {
  state: 'due' | 'paid' | 'closed' | 'none'; amount: number; requestId: string; lang: Lang; customer: string; phoneOk: boolean
  separate: boolean; link: string; whatsapp: Msg | null; sms: Msg | null; sent: Sent[]; paidThroughLink?: boolean
  test?: boolean; testPayment?: boolean // one of the team's test phone numbers: Razorpay test mode, no real money
  opens?: number; lastOpenedAt?: string | null // how often the customer opened the link
  paidAt?: string | null; paymentId?: string   // a paid fee: when, and the gateway's payment id
}

const LANG_KEY = 'bm_job_message_lang' // the same choice as the "calls" card next to it
const CHECK_EVERY_MS = 15000           // while the fee is unpaid and the card is on screen
const NAME: Record<Channel, string> = { whatsapp: 'WhatsApp', sms: 'SMS', link: 'Link' }
const clock = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const copyText = async (t: string) => { try { await navigator.clipboard.writeText(t); return true } catch { return false } }
const errorOf = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback
// what happened with the newest message on a channel, in words
const outcome = (s: Sent) => s.mode === 'sent' ? 'Sent to the customer'
  : s.mode === 'failed' ? `Not sent — ${s.detail || 'the provider refused it'}`
  : s.channel === 'link' ? 'Copied' : s.channel === 'whatsapp' ? 'Opened in WhatsApp to send by hand' : 'Text copied to send by hand'

export function PaymentLinkPanel({ requestId, feeStatus, status, focus, onFocused, onPaid }: {
  requestId: string; feeStatus?: string; status?: string
  /** bring the card into view (the list's "Payment link" action) */
  focus?: boolean; onFocused?: () => void
  /** the fee got paid while the card was open */
  onPaid?: () => void
}) {
  const [data, setData] = useState<Data | null>(null)
  const [lang, setLang] = useState<Lang>('hi')
  const [busy, setBusy] = useState('')
  const [copied, setCopied] = useState(false)
  const [showText, setShowText] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const [flash, setFlash] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const alive = useRef(true)
  const last = useRef<{ id: string; state: Data['state'] } | null>(null)
  const paidCb = useRef(onPaid); paidCb.current = onPaid
  const focusedCb = useRef(onFocused); focusedCb.current = onFocused
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => { try { const l = localStorage.getItem(LANG_KEY); if (l === 'en' || l === 'hi') setLang(l) } catch { /* ignore */ } }, [])

  const load = useCallback(async (): Promise<Data['state'] | null> => {
    try {
      const res = await adminPayLinkAPI.preview(requestId, lang)
      if (!alive.current || !res.data?.success) return null
      const d = res.data.data as Data
      // it was unpaid a moment ago and is paid now: the customer just paid
      if (last.current?.id === requestId && last.current.state === 'due' && d.state === 'paid') {
        toast.success(`Booking fee ₹${d.amount} is paid${d.testPayment ? ' (test payment)' : ''}`)
        paidCb.current?.()
      }
      last.current = { id: requestId, state: d.state }
      setData(d); setCheckedAt(new Date())
      return d.state
    } catch { return null /* the card simply stays as it is */ }
  }, [requestId, lang])
  // again when the fee is paid or the request moves on
  useEffect(() => { load() }, [load, feeStatus, status])

  // an unpaid fee is checked again every few seconds, and when the admin comes back to this tab
  const due = data?.state === 'due'
  useEffect(() => {
    if (!due) return
    const again = () => { if (document.visibilityState === 'visible') load() }
    const t = setInterval(again, CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', again)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', again) }
  }, [due, load])

  // opened from the list's "Payment link" action: show this card
  const shown = !!data && (data.state === 'due' || data.state === 'paid')
  useEffect(() => {
    if (!focus || !data) return
    if (shown && root.current) { root.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); setFlash(true) }
    focusedCb.current?.()
  }, [focus, data, shown])
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => { if (alive.current) setFlash(false) }, 2500)
    return () => clearTimeout(t)
  }, [flash])

  const chooseLang = (l: Lang) => { setLang(l); try { localStorage.setItem(LANG_KEY, l) } catch { /* ignore */ } }

  const checkNow = async () => {
    if (checking) return
    setChecking(true)
    const state = await load()
    if (!alive.current) return
    setChecking(false)
    if (state === 'due') toast.info('Not paid yet')
    else if (state === null) toast.error('Could not check right now — try again')
  }

  const send = async (channel: Channel) => {
    if (!data || busy) return
    const msg = channel === 'link' ? null : data[channel]
    const manual = !msg || msg.mode !== 'auto'
    // opened / copied now, while this is still the click (a tab opened later is blocked as a pop-up)
    let tab: Window | null = null
    if (channel === 'whatsapp' && manual) { tab = window.open('', '_blank'); if (tab) tab.opener = null }
    if (channel === 'sms' && manual && !(await copyText(msg!.text))) {
      setShowText(true)
      toast.info('The browser did not allow copying — the SMS is shown below, copy it from there')
      return
    }
    if (channel === 'link') {
      if (!(await copyText(data.link))) { toast.info('The browser did not allow copying — select the link and copy it'); return }
      setCopied(true); setTimeout(() => alive.current && setCopied(false), 2000)
    }
    setBusy(channel)
    try {
      const res = await adminPayLinkAPI.send(requestId, { channel, lang })
      const d = res.data?.data
      if (!res.data?.success || !d) throw new Error(res.data?.message || 'Could not send')
      if (d.mode === 'sent') toast.success(d.detail)
      else if (d.mode === 'failed') { tab?.close(); toast.error(d.detail) }
      else if (channel === 'whatsapp') {
        if (tab) { tab.location.href = d.waLink; toast.success(`WhatsApp opened for ${data.customer} — press send there`) }
        else toast.info('Allow pop-ups for this site, then press WhatsApp again', { action: { label: 'Open WhatsApp', onClick: () => window.open(d.waLink, '_blank', 'noopener') } })
      } else if (channel === 'sms') toast.success('SMS copied — paste it in your phone’s Messages')
      else toast.success('Payment link copied')
    } catch (e: any) {
      tab?.close()
      toast.error(errorOf(e, 'Could not send'))
    } finally {
      if (alive.current) { setBusy(''); load() }
    }
  }

  if (!data || data.state === 'none' || data.state === 'closed') return null
  const ring = flash ? ' ring-2 ring-offset-2 ring-amber-400' : ''

  if (data.state === 'paid') {
    return (
      <div ref={root} data-pay-panel="paid" className={`flex items-start gap-2 rounded-xl border border-green-100 bg-green-50/70 p-3 text-xs text-green-900 transition-shadow${ring}`}>
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
        <div className="min-w-0">
          <span><b>Booking fee ₹{data.amount} — paid online</b>{data.paidThroughLink ? ' through the payment link' : ''}.{data.separate ? ' It is a separate fee: not part of the bill for the work.' : ' It is adjusted in the bill for the work.'}{data.testPayment && <b data-pay-testpaid className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-800">Test payment — no real money</b>}</span>
          {(data.paidAt || data.paymentId) && (
            <p data-pay-paidinfo className="mt-1 break-all text-[11px] text-green-800/80">
              {data.paidAt ? `Paid on ${clock(data.paidAt)}` : ''}{data.paidAt && data.paymentId ? ' · ' : ''}{data.paymentId ? `Payment ID ${data.paymentId}` : ''}
            </p>
          )}
        </div>
      </div>
    )
  }

  // the newest message on each channel (the list comes newest first)
  const lastOn = (c: Channel) => data.sent.find((s) => s.channel === c)
  const went = (c: Channel) => data.sent.some((s) => s.channel === c && s.mode !== 'failed')
  const anySent = data.sent.some((s) => s.channel !== 'link' && s.mode !== 'failed')
  const opens = data.opens || 0
  return (
    <div ref={root} data-pay-panel="due" className={`rounded-xl border border-amber-200 bg-amber-50/70 p-4 transition-shadow${ring}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
          <IndianRupee className="h-3 w-3" /> Booking fee ₹{data.amount} — not paid yet
        </h4>
        <div className="flex overflow-hidden rounded-md border border-amber-200 bg-white text-[11px] font-semibold" role="group" aria-label="Message language">
          {(['hi', 'en'] as Lang[]).map((l) => (
            <button key={l} onClick={() => chooseLang(l)} aria-pressed={lang === l} className={`px-2 py-0.5 transition-colors ${lang === l ? 'bg-amber-600 text-white' : 'text-amber-800 hover:bg-amber-50'}`}>
              {l === 'hi' ? 'हिंदी' : 'English'}
            </button>
          ))}
        </div>
      </div>

      <div data-pay-status="due" className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs">
        <span className="font-semibold text-[#374151]">Payment status</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800"><Clock className="h-3 w-3" /> Not paid</span>
        <span data-pay-opens className="text-[#6B7280]">
          {opens > 0
            ? `Link opened ${opens} ${opens === 1 ? 'time' : 'times'}${data.lastOpenedAt ? ` · last ${clock(data.lastOpenedAt)}` : ''}`
            : anySent ? 'Link not opened yet' : 'Link not sent yet'}
        </span>
        <button data-pay-check onClick={checkNow} disabled={checking} title="This card also checks by itself every few seconds while it is open"
          className="ml-auto inline-flex h-7 items-center gap-1 rounded-md border border-amber-200 bg-white px-2 font-bold text-amber-800 transition-colors hover:bg-amber-50 disabled:opacity-60">
          {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Check now
        </button>
      </div>

      <p className="text-xs leading-relaxed text-[#4B5563]">
        Send {data.customer} the link to pay it online. Anybody can pay through the link — the customer, or somebody paying for them.
      </p>

      {data.test && <p data-pay-testnote className="mt-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-900">Test phone number — this link takes a Razorpay TEST payment. No real money is charged.</p>}
      {!data.phoneOk && <p data-pay-nophone className="mt-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-amber-900">This request has no valid customer mobile number — copy the link and pass it on yourself.</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button data-pay-send="whatsapp" onClick={() => send('whatsapp')} disabled={!!busy || !data.phoneOk}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
          {busy === 'whatsapp' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <WhatsAppIcon className="h-3.5 w-3.5" color="currentColor" />}
          {went('whatsapp') ? 'Resend on WhatsApp' : data.whatsapp?.mode === 'auto' ? 'Send on WhatsApp' : 'WhatsApp'}
        </button>
        <button data-pay-send="sms" onClick={() => send('sms')} disabled={!!busy || !data.phoneOk}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#1B3B6F] bg-white px-3 text-xs font-bold text-[#1B3B6F] transition-colors hover:bg-[#EEF3FB] disabled:opacity-50">
          {busy === 'sms' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareText className="h-3.5 w-3.5" />}
          {data.sms?.mode === 'auto' ? (went('sms') ? 'Resend SMS' : 'Send SMS') : (went('sms') ? 'Copy SMS again' : 'Copy SMS')}
        </button>
        <button data-pay-send="link" onClick={() => send('link')} disabled={!!busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-[#374151] transition-colors hover:bg-gray-50 disabled:opacity-50">
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />} Copy link
        </button>
      </div>

      <p data-pay-link className="mt-2 break-all font-mono text-[11px] text-[#6B7280]">{data.link}</p>

      {data.sent.length > 0 && (
        <div data-pay-sentlist className="mt-2 divide-y divide-amber-100 rounded-lg border border-amber-100 bg-white">
          {(['whatsapp', 'sms', 'link'] as Channel[]).map((c) => {
            const s = lastOn(c)
            if (!s) return null
            const tone = s.mode === 'sent' ? 'text-green-700' : s.mode === 'failed' ? 'text-red-700' : 'text-[#6B7280]'
            return (
              // one line on a wide screen; on a phone the time goes under the outcome
              <div key={c} data-pay-sent={c} data-pay-sent-mode={s.mode} className="grid grid-cols-[64px_1fr] items-baseline gap-x-2 gap-y-0.5 px-3 py-1.5 text-[11.5px] sm:grid-cols-[64px_1fr_auto]">
                <b className="text-[#1A1D29]">{NAME[c]}</b>
                <span className={`min-w-0 break-words ${tone}`}>{outcome(s)}</span>
                <span className="col-start-2 text-[#6B7280] sm:col-start-3">{clock(s.at)}{s.auto ? ' · by the system' : s.by ? ` · ${s.by}` : ''}</span>
              </div>
            )
          })}
        </div>
      )}
      {checkedAt && <p data-pay-checked className="mt-1.5 text-[10.5px] text-[#9CA3AF]">Status checked at {checkedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit' })} — this card checks again by itself.</p>}

      <button onClick={() => setShowText((v) => !v)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:underline" aria-expanded={showText}>
        <ChevronDown className={`h-3 w-3 transition-transform ${showText ? 'rotate-180' : ''}`} /> {showText ? 'Hide the messages' : 'See the messages'}
      </button>
      {showText && (
        <div className="mt-2 space-y-2">
          {data.whatsapp && <pre data-pay-text="whatsapp" className="whitespace-pre-wrap break-words rounded-lg border border-amber-100 bg-white p-2.5 font-sans text-xs text-[#1A1D29]">{data.whatsapp.text}</pre>}
          {data.sms && <pre data-pay-text="sms" className="whitespace-pre-wrap break-words rounded-lg border border-amber-100 bg-white p-2.5 font-sans text-xs text-[#1A1D29]">{data.sms.text}</pre>}
        </div>
      )}
    </div>
  )
}
