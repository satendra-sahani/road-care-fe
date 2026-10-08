'use client'

// Request details → "Booking fee".
// A booking the customer did not pay for in the app (one the team made on a call, or one
// whose payment window was closed) still owes its booking fee. From here the admin sends
// the customer a link to pay it online — by WhatsApp or SMS, or copies it — and sees
// whether it was paid. With an approved template the message goes out by itself;
// otherwise WhatsApp opens with the text ready, or the SMS text is copied.
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Check, CheckCircle2, ChevronDown, Copy, IndianRupee, Loader2, MessageSquareText } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { adminPayLinkAPI } from '@/services/api'

type Lang = 'hi' | 'en'
type Channel = 'whatsapp' | 'sms' | 'link'
type Msg = { mode: 'auto' | 'manual'; text: string }
type Sent = { channel: Channel; mode: 'sent' | 'manual' | 'failed'; detail?: string; auto: boolean; by: string; at: string }
type Data = {
  state: 'due' | 'paid' | 'closed' | 'none'; amount: number; requestId: string; lang: Lang; customer: string; phoneOk: boolean
  separate: boolean; link: string; whatsapp: Msg | null; sms: Msg | null; sent: Sent[]; paidThroughLink?: boolean
}

const LANG_KEY = 'bm_job_message_lang' // the same choice as the "calls" card next to it
const CHANNEL: Record<Channel, string> = { whatsapp: 'WhatsApp', sms: 'SMS', link: 'Link copied' }
const clock = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const copyText = async (t: string) => { try { await navigator.clipboard.writeText(t); return true } catch { return false } }
const errorOf = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback

export function PaymentLinkPanel({ requestId, feeStatus, status }: { requestId: string; feeStatus?: string; status?: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [lang, setLang] = useState<Lang>('hi')
  const [busy, setBusy] = useState('')
  const [copied, setCopied] = useState(false)
  const [showText, setShowText] = useState(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => { try { const l = localStorage.getItem(LANG_KEY); if (l === 'en' || l === 'hi') setLang(l) } catch { /* ignore */ } }, [])

  const load = useCallback(async () => {
    try {
      const res = await adminPayLinkAPI.preview(requestId, lang)
      if (alive.current && res.data?.success) setData(res.data.data)
    } catch { /* the card simply stays away */ }
  }, [requestId, lang])
  // again when the fee is paid or the request moves on
  useEffect(() => { load() }, [load, feeStatus, status])

  const chooseLang = (l: Lang) => { setLang(l); try { localStorage.setItem(LANG_KEY, l) } catch { /* ignore */ } }

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

  if (data.state === 'paid') {
    return (
      <div data-pay-panel="paid" className="flex items-start gap-2 rounded-xl border border-green-100 bg-green-50/70 p-3 text-xs text-green-900">
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
        <span><b>Booking fee ₹{data.amount} — paid online</b>{data.paidThroughLink ? ' through the payment link' : ''}.{data.separate ? ' It is a separate fee: not part of the bill for the work.' : ' It is adjusted in the bill for the work.'}</span>
      </div>
    )
  }

  const lastSent = data.sent.find((s) => s.mode !== 'failed')
  return (
    <div data-pay-panel="due" className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
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
      <p className="text-xs leading-relaxed text-[#4B5563]">
        Send {data.customer} the link to pay it online. Anybody can pay through the link — the customer, or somebody paying for them.
      </p>

      {!data.phoneOk && <p data-pay-nophone className="mt-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-amber-900">This request has no valid customer mobile number — copy the link and pass it on yourself.</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button data-pay-send="whatsapp" onClick={() => send('whatsapp')} disabled={!!busy || !data.phoneOk}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
          {busy === 'whatsapp' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <WhatsAppIcon className="h-3.5 w-3.5" color="currentColor" />}
          {data.whatsapp?.mode === 'auto' ? 'Send on WhatsApp' : 'WhatsApp'}
        </button>
        <button data-pay-send="sms" onClick={() => send('sms')} disabled={!!busy || !data.phoneOk}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#1B3B6F] bg-white px-3 text-xs font-bold text-[#1B3B6F] transition-colors hover:bg-[#EEF3FB] disabled:opacity-50">
          {busy === 'sms' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareText className="h-3.5 w-3.5" />}
          {data.sms?.mode === 'auto' ? 'Send SMS' : 'Copy SMS'}
        </button>
        <button data-pay-send="link" onClick={() => send('link')} disabled={!!busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-[#374151] transition-colors hover:bg-gray-50 disabled:opacity-50">
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />} Copy link
        </button>
      </div>

      <p data-pay-link className="mt-2 break-all font-mono text-[11px] text-[#6B7280]">{data.link}</p>
      {lastSent && (
        <p data-pay-last className="mt-1 text-[11px] text-[#6B7280]">
          Last: {CHANNEL[lastSent.channel]}{lastSent.mode === 'sent' ? ' sent' : lastSent.channel === 'link' ? '' : ' (by hand)'} · {clock(lastSent.at)}{lastSent.auto ? ' · by the system' : lastSent.by ? ` · ${lastSent.by}` : ''}
        </p>
      )}

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
