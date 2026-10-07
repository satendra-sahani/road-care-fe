import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { MapPin, ShieldCheck, Loader2, CheckCircle2, AlertCircle, Clock, LocateFixed } from 'lucide-react'
import { locationRequestAPI } from '@/services/api'

// Public page behind the link our team sends to a caller (SMS / WhatsApp):
// one button — "Share my current location". The phone's position is sent ONCE
// to the booking the admin is creating; nothing is tracked afterwards.

type Phase = 'loading' | 'ready' | 'locating' | 'sending' | 'done' | 'invalid' | 'expired' | 'locked'
type Fix = { latitude: number; longitude: number; accuracy: number }

const GOOD_ENOUGH_M = 30 // stop early once the GPS is this precise
const SETTLE_MS = 8000   // otherwise take the best fix after this long
const GIVE_UP_MS = 25000

/** The best fix the phone can give within a few seconds (the first one is often a rough network guess). */
const bestFix = (): Promise<Fix> => new Promise((resolve, reject) => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) { reject(new Error('unsupported')); return }
  let best: Fix | null = null
  let done = false
  let id = -1
  let settle: ReturnType<typeof setTimeout> | undefined
  let giveUp: ReturnType<typeof setTimeout> | undefined
  const finish = (err?: Error) => {
    if (done) return
    done = true
    try { navigator.geolocation.clearWatch(id) } catch { /* noop */ }
    clearTimeout(settle); clearTimeout(giveUp)
    if (best) resolve(best); else reject(err || new Error('timeout'))
  }
  id = navigator.geolocation.watchPosition(
    (p) => {
      const f = { latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy || 9999 }
      if (!best || f.accuracy < best.accuracy) best = f
      if (f.accuracy <= GOOD_ENOUGH_M) finish()
    },
    (e) => finish(new Error(e.code === 1 ? 'denied' : e.code === 2 ? 'unavailable' : 'timeout')),
    { enableHighAccuracy: true, timeout: GIVE_UP_MS, maximumAge: 0 },
  )
  settle = setTimeout(() => { if (best) finish() }, SETTLE_MS)
  giveUp = setTimeout(() => finish(new Error('timeout')), GIVE_UP_MS)
})

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
  const token = (router.query.token as string) || ''
  const [phase, setPhase] = useState<Phase>('loading')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [fix, setFix] = useState<Fix | null>(null)
  const busy = useRef(false)

  useEffect(() => {
    if (!router.isReady) return
    if (!token) { setPhase('invalid'); return }
    let off = false
    locationRequestAPI.meta(token).then((r) => {
      if (off) return
      const d = r.data?.data || {}
      setName(d.name || '')
      setPhase(d.locked ? 'locked' : d.status === 'expired' ? 'expired' : d.status === 'captured' ? 'done' : 'ready')
    }).catch(() => { if (!off) setPhase('invalid') })
    return () => { off = true }
  }, [router.isReady, token])

  const share = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setErr('')
    setPhase('locating')
    try {
      const f = await bestFix()
      setPhase('sending')
      await locationRequestAPI.share(token, f)
      setFix(f)
      setPhase('done')
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 410) setPhase('expired')
      else if (status === 409) setPhase('locked')
      else {
        setErr(
          e?.response?.data?.message
          || (e?.message === 'denied' ? 'Location permission is blocked. Allow location for this site in your browser (tap the lock icon near the address bar → Permissions → Location → Allow), then try again.'
            : e?.message === 'unsupported' ? 'This browser cannot share location. Please open the link in Chrome.'
              : e?.message === 'unavailable' ? 'Turn on Location (GPS) in your phone settings, then try again.'
                : 'Could not get your location. Go near a window or outside, then try again.'),
        )
        setPhase('ready')
      }
    } finally { busy.current = false }
  }, [token])

  const card = 'rounded-3xl bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,32,66,.10)]'

  if (phase === 'loading') return <Shell><div className={card}><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#1B3B6F]" /></div></Shell>

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
    return (
      <Shell>
        <div className={card} data-shared>
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#16A34A]" />
          <h1 className="mt-3 text-[21px] font-extrabold text-[#13203A]">Location shared</h1>
          <p className="mt-1 text-[15px] font-semibold text-[#16A34A]">लोकेशन मिल गई, धन्यवाद!</p>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5B6B85]">Our team has your location and will send a mechanic to you. You can close this page.</p>
          {fix && fix.accuracy > 80 && <p className="mt-3 rounded-xl bg-[#FFF8E6] px-3 py-2 text-[12.5px] text-[#92400E]">The location is approximate (±{Math.round(fix.accuracy)} m). If you can, step outside and share again.</p>}
          <button type="button" onClick={share} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-[#D5DDEC] px-5 text-[14px] font-bold text-[#1B3B6F]"><LocateFixed className="h-4 w-4" />Share again</button>
        </div>
      </Shell>
    )
  }

  const working = phase === 'locating' || phase === 'sending'
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
          {phase === 'locating' ? 'Finding your location…' : phase === 'sending' ? 'Sending…' : 'Share my location'}
        </button>
        <p className="mt-2 text-[12.5px] text-[#7B8AA3]">बटन दबाएँ और “Allow” चुनें</p>
      </div>
    </Shell>
  )
}
