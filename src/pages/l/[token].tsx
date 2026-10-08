import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { MapPin, ShieldCheck, Loader2, CheckCircle2, AlertCircle, Clock, LocateFixed } from 'lucide-react'
import { locationRequestAPI } from '@/services/api'

// Public page behind the link our team sends to a caller (SMS / WhatsApp):
// one button — "Share my current location". Nothing is tracked afterwards.
//
// Speed and exactness pull in opposite directions (a phone's first answer comes
// from the network, the exact GPS fix takes a few seconds more), so a share is a
// short burst: the FIRST fix goes to our team at once — the customer is done in
// a second or two — and the page then keeps sending sharper fixes for a few
// seconds while the GPS settles. The server keeps the sharpest one.

type Phase = 'ready' | 'locating' | 'done' | 'invalid' | 'expired' | 'locked'
type Fix = { latitude: number; longitude: number; accuracy: number }
type Fail = 'denied' | 'unsupported' | 'timeout' | { status?: number; message?: string }

const FIRST_GOOD_M = 50    // a first fix this sharp is sent the moment it arrives
const FIRST_WAIT_MS = 2000 // a rougher one gets this long to improve, then goes anyway
const DONE_M = 15          // sharp enough — stop here
const REFINE_MS = 14000    // keep sharpening this long after the first send
const NO_FIX_MS = 15000    // no position at all → say what to do
const EXACT_M = 30
const ROUGH_M = 100

type Handlers = {
  /** rejects on an HTTP error */
  send: (fix: Fix, refining: boolean) => Promise<unknown>
  /** after every fix the server accepted; refining=false is the last one */
  onShared: (fix: Fix, refining: boolean) => void
  /** nothing could be shared (or the link is no longer usable) */
  onFail: (why: Fail) => void
}

/** Runs one share. Returns stop(). */
function startShare(h: Handlers): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) { h.onFail('unsupported'); return () => {} }
  let best: Fix | null = null   // sharpest fix seen so far
  let sent: Fix | null = null   // sharpest fix the server has
  let busy = false              // one request at a time
  let started = false           // the first send is under way
  let waiting = false           // a rough first fix is being given time to improve
  let over = false              // GPS stopped
  let closed = false            // the final fix went out (or the share failed)
  let watchId = -1
  const timers: ReturnType<typeof setTimeout>[] = []
  const later = (fn: () => void, ms: number) => { timers.push(setTimeout(fn, ms)) }
  const stopGps = () => {
    over = true
    try { navigator.geolocation.clearWatch(watchId) } catch { /* noop */ }
    timers.forEach(clearTimeout)
  }

  const flush = async (final: boolean) => {
    if (busy || closed || !best) return
    const fix = best
    const sharper = !sent || fix.accuracy < sent.accuracy - Math.max(3, sent.accuracy * 0.1)
    if (!sharper && !final) return
    busy = true
    try {
      await h.send(fix, !final)
      sent = fix
      if (final) closed = true
      h.onShared(fix, !final)
    } catch (e: any) {
      const status = e?.response?.status
      if (!sent || status === 409 || status === 410) {
        closed = true
        stopGps()
        h.onFail({ status, message: e?.response?.data?.message })
        return
      }
      // a refinement that did not get through is no reason to alarm anyone:
      // the first fix is already with our team
      if (final) { closed = true; h.onShared(sent, false) }
    } finally { busy = false }
    if (closed) return
    if (over) flush(true)                 // the window closed while this one was in flight
    else if (best !== sent) flush(false)  // a sharper fix arrived meanwhile
  }
  const end = () => { if (over) return; stopGps(); flush(true) }
  const begin = () => {
    if (started) return
    started = true
    if (best && best.accuracy <= DONE_M) { stopGps(); flush(true); return } // already exact: one request, done
    flush(false)
    later(end, REFINE_MS)
  }
  const onFix = (p: GeolocationPosition) => {
    if (over) return
    const fix = { latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy > 0 ? p.coords.accuracy : 9999 }
    if (!best || fix.accuracy < best.accuracy) best = fix
    if (!started) {
      if (best.accuracy <= FIRST_GOOD_M) begin()
      else if (!waiting) { waiting = true; later(begin, FIRST_WAIT_MS) }
    } else if (sent) {
      if (best.accuracy <= DONE_M) end()
      else flush(false)
    }
  }

  // a quick answer from the network (or a fix a few seconds old) …
  navigator.geolocation.getCurrentPosition(onFix, () => {}, { enableHighAccuracy: false, timeout: 6000, maximumAge: 15000 })
  // … and fresh GPS fixes as they sharpen
  watchId = navigator.geolocation.watchPosition(
    onFix,
    (e) => { if (e.code === 1 && !started && !closed) { closed = true; stopGps(); h.onFail('denied') } },
    { enableHighAccuracy: true, timeout: NO_FIX_MS, maximumAge: 0 },
  )
  later(() => { if (!best && !closed) { closed = true; stopGps(); h.onFail('timeout') } }, NO_FIX_MS)
  return () => { closed = true; stopGps() }
}

// Module scope on purpose: defined inside the page it would be a new component
// type on every render and remount everything below it.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F3F5F9' }} className="flex flex-col">
      <Head>
        <title>Share your location — Bharat Mechanics</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: 'linear-gradient(120deg,#0E2042,#1B3B6F)' }}>
        <ShieldCheck className="h-5 w-5 text-[#6EE7B7]" />
        <span className="font-extrabold tracking-tight">Bharat Mechanics</span>
        <span className="ml-auto text-[11px] font-semibold uppercase tracking-wider text-white/60">Share Location</span>
      </div>
      <div className="flex flex-1 items-start justify-center p-4">
        <div className="mt-6 w-full max-w-md">{children}</div>
      </div>
      <p className="px-6 pb-6 text-center text-[11.5px] leading-relaxed text-[#7B8AA3]">Your location is shared once with the Bharat Mechanics team for this service request. We do not track you.</p>
    </div>
  )
}

export default function ShareLocationPage() {
  const router = useRouter()
  // the button is on screen before the router is ready — read the token from the address then
  // The approved WhatsApp button opens …/l/%7B%7B1%7D%7D<code> (its address was registered with a
  // literal "{{1}}" before the real code): that part is not the code.
  const tokenNow = () => ((router.query.token as string) || (typeof window !== 'undefined' ? decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() || '') : '')).replace(/^(?:\{\{1\}\}|%7B%7B1%7D%7D)/i, '')
  const [phase, setPhase] = useState<Phase>('ready')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [fix, setFix] = useState<Fix | null>(null)
  const [refining, setRefining] = useState(false)
  const stop = useRef<(() => void) | null>(null)
  const running = useRef(false)

  // The page shows the button straight away; whether the link is still good is
  // checked alongside (it only ever swaps the card for a notice).
  useEffect(() => {
    if (!router.isReady) return
    const token = tokenNow()
    if (!token) { setPhase('invalid'); return }
    let off = false
    locationRequestAPI.meta(token).then((r) => {
      if (off) return
      const d = r.data?.data || {}
      setName(d.name || '')
      if (d.locked) setPhase('locked')
      else if (d.status === 'expired') setPhase('expired')
      else if (d.status === 'captured') setPhase((p) => (p === 'ready' ? 'done' : p))
    }).catch((e) => { if (!off && e?.response?.status === 404) setPhase('invalid') })
    return () => { off = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])
  useEffect(() => () => { stop.current?.() }, [])

  const share = useCallback(() => {
    if (running.current) return
    const token = tokenNow()
    if (!token) { setPhase('invalid'); return }
    running.current = true
    setErr('')
    setPhase('locating')
    stop.current = startShare({
      send: (f, more) => locationRequestAPI.share(token, { ...f, refining: more }),
      onShared: (f, more) => {
        setFix(f); setRefining(more); setPhase('done')
        if (!more) running.current = false
      },
      onFail: (why) => {
        running.current = false
        setRefining(false)
        if (typeof why === 'object') {
          if (why.status === 410) { setPhase('expired'); return }
          if (why.status === 409) { setPhase('locked'); return }
          if (why.status === 404) { setPhase('invalid'); return }
        }
        setErr(
          (typeof why === 'object' && why.message)
          || (why === 'denied' ? 'Location permission is blocked. Allow location for this site in your browser (tap the lock icon near the address bar → Permissions → Location → Allow), then try again.'
            : why === 'unsupported' ? 'This browser cannot share location. Please open the link in Chrome.'
              : why === 'timeout' ? 'Could not get your location. Turn on Location (GPS) in your phone, go near a window or outside, then try again.'
                : 'Could not send your location. Check your internet and try again.'),
        )
        setPhase('ready')
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const card = 'rounded-3xl bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,32,66,.10)]'

  if (phase === 'invalid' || phase === 'expired' || phase === 'locked') {
    const Icon = phase === 'expired' ? Clock : phase === 'locked' ? CheckCircle2 : AlertCircle
    return (
      <Shell>
        <div className={card}>
          <Icon className={`mx-auto h-12 w-12 ${phase === 'locked' ? 'text-[#16A34A]' : 'text-[#D97706]'}`} />
          <h1 className="mt-3 text-[20px] font-extrabold text-[#13203A]">{phase === 'expired' ? 'This link has expired' : phase === 'locked' ? 'Your request is already booked' : 'This link is not valid'}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5B6B85]">
            {phase === 'expired' ? 'Please ask our team to send a new link.' : phase === 'locked' ? 'We already have your location. Our team will call you if anything needs to change.' : 'Please check the link in the message, or ask our team to send it again.'}
          </p>
        </div>
      </Shell>
    )
  }

  if (phase === 'done') {
    const acc = fix ? Math.round(fix.accuracy) : null
    const rough = !refining && acc != null && acc > ROUGH_M
    return (
      <Shell>
        <div className={card} data-shared data-refining={refining ? '1' : '0'}>
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#16A34A]" />
          <h1 className="mt-3 text-[21px] font-extrabold text-[#13203A]">Location shared</h1>
          <p className="mt-1 text-[15px] font-semibold text-[#16A34A]">लोकेशन मिल गई, धन्यवाद!</p>
          {refining ? (
            <p className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#EEF3FD] px-3 py-2.5 text-[13px] font-semibold text-[#1E40E0]" data-refining-note>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>Making it more exact{acc != null ? ` (±${acc} m)` : ''}… keep this page open a few seconds<br /><span className="font-normal">और सटीक लोकेशन ली जा रही है…</span></span>
            </p>
          ) : (
            <p className="mt-2 text-[14px] leading-relaxed text-[#5B6B85]">
              Our team has your location{acc != null && acc <= EXACT_M ? ` (exact, ±${acc} m)` : acc != null && !rough ? ` (±${acc} m)` : ''} and will send a mechanic to you. You can close this page.
            </p>
          )}
          {rough && (
            <p className="mt-3 rounded-xl bg-[#FFF8E6] px-3 py-2.5 text-left text-[12.5px] leading-relaxed text-[#92400E]" data-rough-note>
              <b>The location is only approximate (±{acc} m).</b> For an exact one: turn on Location (GPS), allow <b>precise location</b> for your browser in phone Settings, step outside, then press “Share again”.
              <br />लोकेशन अनुमानित है। GPS चालू करें, खुले में जाएँ और दोबारा भेजें।
            </p>
          )}
          <button type="button" onClick={share} disabled={refining} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-[#D5DDEC] px-5 text-[14px] font-bold text-[#1B3B6F] disabled:opacity-50"><LocateFixed className="h-4 w-4" />Share again</button>
        </div>
      </Shell>
    )
  }

  const working = phase === 'locating'
  return (
    <Shell>
      <div className={card}>
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF0FE]"><MapPin className="h-8 w-8 text-[#1E40E0]" /></span>
        <h1 className="mt-4 text-[21px] font-extrabold leading-snug text-[#13203A]">{name ? `Hi ${name}, share` : 'Share'} your current location</h1>
        <p className="mt-1 text-[15px] font-semibold text-[#1B3B6F]">अपनी अभी की लोकेशन भेजें</p>
        <p className="mt-2 text-[14px] leading-relaxed text-[#5B6B85]">Our mechanic needs to know exactly where you are. Press the button and tap <b>Allow</b> when your phone asks.</p>
        {err && <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#FEF1F1] px-3 py-2.5 text-left text-[13px] text-[#B91C1C]" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{err}</p>}
        <button type="button" onClick={share} disabled={working} data-share
          className="mt-5 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FF5A1F] text-[16px] font-extrabold text-white shadow-[0_8px_20px_rgba(255,90,31,.35)] disabled:opacity-70">
          {working ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
          {working ? 'Finding your location…' : 'Share my location'}
        </button>
        <p className="mt-2 text-[12.5px] text-[#7B8AA3]">बटन दबाएँ और “Allow” चुनें</p>
      </div>
    </Shell>
  )
}
