'use client'

// Request details → "Calls without sharing numbers".
// The garage / mechanic and the customer talk through the company's virtual
// number: each is sent that number (the mechanic together with the job), calls
// it from their own phone, and is connected to the other side — neither sees
// the other's number, and neither needs the app. From here the admin sends the
// two messages, can ring both and join them, and sees the calls made so far.
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Check, ChevronDown, Copy, Loader2, Pause, Play, MessageSquareText, PhoneCall, PhoneForwarded, ShieldCheck, TriangleAlert } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { adminMaskedCallAPI } from '@/services/api'

type Side = 'partner' | 'customer'
type Channel = 'whatsapp' | 'sms'
type Lang = 'hi' | 'en'
type Party = { name: string; role: string; phone: string; whatsapp: { mode: 'auto' | 'manual'; text: string }; sms: { mode: 'auto' | 'manual'; text: string } }
type Sent = { id: string; to: Side; channel: Channel; mode: 'sent' | 'manual' | 'failed'; name: string; auto: boolean; by: string; at: string }
type Call = { _id: string; direction: 'inbound' | 'connect'; fromRole?: string; toRole?: string; status: string; duration?: number; createdAt: string; recording?: { status?: string; duration?: number } }
type Share = { configured: boolean; number: string; status: string; blocked: string; lang: Lang; partner: Party | null; customer: Party | null; sent: Sent[]; calls: Call[] }

const LANG_KEY = 'bm_job_message_lang'
const ROLE: Record<string, string> = { customer: 'Customer', mechanic: 'Mechanic', shop: 'Garage', team: 'Our team', unknown: 'Unknown caller' }
const CALL_STATUS: Record<string, { label: string; tone: string }> = {
  connected: { label: 'Talked', tone: 'text-green-700' },
  dialing: { label: 'Ringing', tone: 'text-blue-700' },
  started: { label: 'Starting', tone: 'text-blue-700' },
  menu: { label: 'Choosing a job', tone: 'text-blue-700' },
  unanswered: { label: 'Not answered', tone: 'text-amber-700' },
  no_match: { label: 'No one to connect', tone: 'text-amber-700' },
  failed: { label: 'Could not start', tone: 'text-red-700' },
}
// +918065522664 → +91 80655 22664
const pretty = (n: string) => { const d = String(n || '').replace(/\D/g, ''); return d.length === 12 && d.startsWith('91') ? `+91 ${d.slice(2, 7)} ${d.slice(7)}` : n }
const clock = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const talkTime = (s?: number) => { const n = Math.max(0, Math.round(s || 0)); return n < 60 ? `${n}s` : `${Math.floor(n / 60)}m ${n % 60}s` }
const copyText = async (t: string) => { try { await navigator.clipboard.writeText(t); return true } catch { return false } }
const errorOf = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback

export function RequestCallPanel({ requestId, status }: { requestId: string; status?: string }) {
  const [data, setData] = useState<Share | null>(null)
  const [failed, setFailed] = useState('')
  const [lang, setLang] = useState<Lang>('hi')
  const [busy, setBusy] = useState('')
  const [copied, setCopied] = useState(false)
  const [preview, setPreview] = useState<Side | null>(null)
  // call recordings: which one is loading / playing
  const [recLoading, setRecLoading] = useState('')
  const [recPlaying, setRecPlaying] = useState('')
  const audio = useRef<HTMLAudioElement | null>(null)
  useEffect(() => () => { audio.current?.pause() }, [])
  const playRecording = async (id: string) => {
    audio.current?.pause()
    if (recPlaying === id) { setRecPlaying(''); return }
    setRecPlaying('')
    setRecLoading(id)
    try {
      // recordings are private files: the server hands out a link that works for a few minutes
      const res = await adminMaskedCallAPI.recording(id)
      const src = res.data?.data?.url
      if (!res.data?.success || !src) { toast.error(res.data?.message || 'This recording cannot be played.'); return }
      const a = new Audio(src)
      a.onended = () => setRecPlaying('')
      a.onerror = () => { setRecPlaying(''); toast.error('The browser could not play this recording.') }
      audio.current = a
      await a.play()
      setRecPlaying(id)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not get the recording. Please try again.')
    } finally { setRecLoading('') }
  }
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    try { const saved = localStorage.getItem(LANG_KEY); if (saved === 'en' || saved === 'hi') setLang(saved) } catch { /* private window */ }
    return () => { alive.current = false }
  }, [])

  const load = useCallback(async (quiet = false) => {
    try {
      const res = await adminMaskedCallAPI.share(requestId, lang)
      if (!alive.current) return
      if (res.data?.success) { setData(res.data.data); setFailed('') }
      else if (!quiet) setFailed(res.data?.message || 'Could not load')
    } catch (e: any) {
      if (alive.current && !quiet) setFailed(errorOf(e, 'Could not load'))
    }
  }, [requestId, lang])

  // again when the request is assigned / moves on: who can be reached changes with it
  useEffect(() => { load() }, [load, status])

  const chooseLang = (l: Lang) => { setLang(l); try { localStorage.setItem(LANG_KEY, l) } catch { /* ignore */ } }

  const send = async (to: Side, channel: Channel) => {
    const party = data?.[to]
    if (!party || busy) return
    const manual = party[channel].mode !== 'auto'
    // Opened and copied now, while this is still the click: a tab opened after
    // the reply comes back is treated as a pop-up and blocked.
    let tab: Window | null = null
    if (manual && channel === 'whatsapp') { tab = window.open('', '_blank'); if (tab) tab.opener = null }
    if (manual && channel === 'sms' && !(await copyText(party.sms.text))) {
      // nothing was copied, so nothing is recorded as sent — the text is shown to copy by hand
      setPreview(to)
      toast.info('The browser did not allow copying — the SMS is shown below, copy it from there')
      return
    }
    setBusy(`${to}:${channel}`)
    try {
      const res = await adminMaskedCallAPI.send({ serviceRequestId: requestId, to, channel, lang })
      const d = res.data?.data
      if (!res.data?.success || !d) throw new Error(res.data?.message || 'Could not send')
      if (d.mode === 'sent') toast.success(d.detail)
      else if (d.mode === 'failed') { tab?.close(); toast.error(d.detail) }
      else if (channel === 'whatsapp') {
        if (tab) { tab.location.href = d.waLink; toast.success(`WhatsApp opened for ${party.name} — press send there`) }
        else toast.info('Allow pop-ups for this site, then press WhatsApp again', { action: { label: 'Open WhatsApp', onClick: () => window.open(d.waLink, '_blank', 'noopener') } })
      } else toast.success(`SMS for ${party.name} copied — paste it in your phone’s Messages`)
    } catch (e: any) {
      tab?.close()
      toast.error(errorOf(e, 'Could not send'))
    } finally {
      if (alive.current) { setBusy(''); load(true) }
    }
  }

  const connect = async () => {
    if (busy || !data?.partner || !data?.customer) return
    setBusy('connect')
    try {
      const res = await adminMaskedCallAPI.connect({ serviceRequestId: requestId })
      if (!res.data?.success) throw new Error(res.data?.message || 'The call could not be started')
      toast.success(res.data.message || 'Calling')
    } catch (e: any) {
      toast.error(errorOf(e, 'The call could not be started'))
    } finally {
      if (alive.current) { setBusy(''); load(true) }
    }
  }

  if (failed && !data) {
    return (
      <div data-call-panel="error" className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-[#6B7280]">
        Calls through the company number: {failed}.{' '}
        <button onClick={() => load()} className="font-semibold text-[#1B3B6F] underline">Try again</button>
      </div>
    )
  }
  if (!data) {
    return <div data-call-panel="loading" className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-[#6B7280]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading call options…</div>
  }

  const open = !data.blocked
  const lastSent = (to: Side) => data.sent.find((s) => s.to === to && s.mode !== 'failed')
  const rows: { to: Side; party: Party | null; title: string; gets: string }[] = [
    { to: 'partner', party: data.partner, title: data.partner ? `${ROLE[data.partner.role] || 'Mechanic'} · ${data.partner.name}` : 'Garage / mechanic', gets: 'Job details + the number to call the customer' },
    { to: 'customer', party: data.customer, title: data.customer ? `Customer · ${data.customer.name}` : 'Customer', gets: 'Who got the job + the number to call them' },
  ]

  return (
    <div data-call-panel={open ? 'ready' : 'blocked'} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
          <ShieldCheck className="h-3 w-3" /> Calls without sharing numbers
        </h4>
        <div className="flex overflow-hidden rounded-md border border-emerald-200 bg-white text-[11px] font-semibold" role="group" aria-label="Message language">
          {(['hi', 'en'] as Lang[]).map((l) => (
            <button key={l} onClick={() => chooseLang(l)} aria-pressed={lang === l} className={`px-2 py-0.5 transition-colors ${lang === l ? 'bg-emerald-700 text-white' : 'text-emerald-800 hover:bg-emerald-50'}`}>
              {l === 'hi' ? 'हिंदी' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {data.number ? (
        <div className="flex flex-wrap items-center gap-2">
          <PhoneCall className="h-4 w-4 text-emerald-700" />
          <span data-call-number className="font-mono text-base font-bold text-[#1A1D29]">{pretty(data.number)}</span>
          <button
            onClick={async () => { if (await copyText(data.number)) { setCopied(true); setTimeout(() => alive.current && setCopied(false), 2000) } }}
            className="rounded p-1 text-[#6B7280] transition-colors hover:bg-white hover:text-[#1B3B6F]" title="Copy the number" aria-label="Copy the number"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      ) : null}
      <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
        Both sides call this one number from their own phone and are connected to each other. Neither sees the other&apos;s number, and no app or internet is needed.
      </p>

      {data.blocked && (
        <div data-call-blocked className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" /> <span>{data.blocked}</span>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {rows.map(({ to, party, title, gets }) => {
          const last = lastSent(to)
          const off = !open || !party
          return (
            <div key={to} data-call-row={to} className="rounded-lg border border-emerald-100 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1A1D29]">{title}</p>
                  <p className="text-[11px] text-[#6B7280]">{gets}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    data-send={`${to}:whatsapp`} disabled={off || !!busy} onClick={() => send(to, 'whatsapp')}
                    className="flex h-8 items-center gap-1.5 rounded-md bg-[#16A34A] px-2.5 text-xs font-bold text-white transition-colors hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {busy === `${to}:whatsapp` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <WhatsAppIcon className="h-3.5 w-3.5" color="currentColor" />} WhatsApp
                  </button>
                  <button
                    data-send={`${to}:sms`} disabled={off || !!busy} onClick={() => send(to, 'sms')}
                    className="flex h-8 items-center gap-1.5 rounded-md border border-[#1B3B6F] bg-white px-2.5 text-xs font-bold text-[#1B3B6F] transition-colors hover:bg-[#EEF3FD] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {busy === `${to}:sms` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareText className="h-3.5 w-3.5" />} SMS
                  </button>
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px]">
                {last ? (
                  <span data-sent={to} className="flex items-center gap-1 text-green-700">
                    <Check className="h-3 w-3" />
                    {last.mode === 'sent' ? `Sent by ${last.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}` : last.channel === 'whatsapp' ? 'Opened in WhatsApp' : 'SMS text copied'} · {clock(last.at)}{last.auto ? ' · automatic' : last.by ? ` · ${last.by}` : ''}
                  </span>
                ) : <span className="text-[#9CA3AF]">{party ? 'Not sent yet' : to === 'partner' ? 'Nobody with a phone number is assigned yet' : 'No valid phone number on file'}</span>}
                {party && (
                  <button onClick={() => setPreview(preview === to ? null : to)} aria-expanded={preview === to} className="flex items-center gap-0.5 font-semibold text-[#1B3B6F] hover:underline">
                    {preview === to ? 'Hide message' : 'See message'} <ChevronDown className={`h-3 w-3 transition-transform ${preview === to ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {party && preview === to && (
                <div data-preview={to} className="mt-2 space-y-2">
                  {(['whatsapp', 'sms'] as Channel[]).map((ch) => (
                    <div key={ch} className="rounded-md border border-gray-200 bg-gray-50 p-2">
                      <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                        <span>{ch === 'whatsapp' ? 'WhatsApp' : 'SMS'} · {party[ch].mode === 'auto' ? 'sent by the system' : 'you send it'}</span>
                        <button onClick={async () => { if (await copyText(party[ch].text)) toast.success('Message copied') }} className="flex items-center gap-1 normal-case text-[#1B3B6F] hover:underline"><Copy className="h-3 w-3" /> Copy</button>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-[#1A1D29]">{party[ch].text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <button
          data-connect disabled={!open || !data.partner || !data.customer || !!busy} onClick={connect}
          className="flex h-8 items-center gap-1.5 rounded-md bg-[#1B3B6F] px-3 text-xs font-bold text-white transition-colors hover:bg-[#162f59] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy === 'connect' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PhoneForwarded className="h-3.5 w-3.5" />} Connect them now
        </button>
        <span className="text-[11px] text-[#6B7280]">Rings the {data.partner ? (ROLE[data.partner.role] || 'mechanic').toLowerCase() : 'mechanic'} first, then the customer — both see only the company number.</span>
      </div>

      {data.calls.length > 0 && (
        <div data-call-log className="mt-3 border-t border-emerald-100 pt-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Calls on this job</p>
          <ul className="space-y-0.5">
            {data.calls.map((c) => {
              const s = CALL_STATUS[c.status] || { label: c.status, tone: 'text-[#6B7280]' }
              return (
                <li key={c._id} className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#4B5563]">
                  <span className="w-[104px] text-[#6B7280]">{clock(c.createdAt)}</span>
                  <span>{c.direction === 'connect' ? 'Started here: ' : ''}{ROLE[c.fromRole || 'unknown'] || c.fromRole} → {ROLE[c.toRole || 'unknown'] || c.toRole || '—'}</span>
                  <span className={`font-semibold ${s.tone}`}>{s.label}{c.status === 'connected' && c.duration ? ` · ${talkTime(c.duration)}` : ''}</span>
                  {c.recording?.status && (
                    <button type="button" data-call-recording onClick={() => playRecording(c._id)} disabled={recLoading === c._id}
                      title={c.recording.status === 'failed' ? 'The recording is not on our storage yet — press to try again' : 'Play the recording of this call'}
                      className="inline-flex h-6 items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">
                      {recLoading === c._id ? <Loader2 className="h-3 w-3 animate-spin" /> : recPlaying === c._id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      {recPlaying === c._id ? 'Stop' : 'Recording'}{c.recording.duration ? ` · ${talkTime(c.recording.duration)}` : ''}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default RequestCallPanel
