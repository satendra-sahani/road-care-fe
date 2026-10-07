import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { ShieldCheck, Phone, Navigation, User, Car, Wrench, MapPin, Clock, AlertCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { jobLinkAPI } from '@/services/api'

// Public page behind the link in the job SMS to a garage / mechanic. An SMS (DLT)
// template may hold only one or two variables, so the SMS carries this link and
// the number to call; the job itself — customer NAME, vehicle, problem, address,
// map — is here. No login: many garages / mechanics have no app.
// The customer is called on the company's virtual number, so nobody's own number
// is on this page. Once the job is closed or given to somebody else the same link
// shows a notice instead.

type Job = {
  requestId: string; customer: string; vehicle: string; problem: string; address: string
  time: string; timeHi: string; emergency: boolean; hasPin: boolean; map: string; number: string; for: string
}
type Phase = 'loading' | 'ready' | 'invalid' | 'gone' | 'offline'

// Module scope on purpose: defined inside the page it would be a new component
// type on every render and remount everything below it.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F3F5F9' }} className="flex flex-col">
      <Head>
        <title>Service job — Bharat Mechanics</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: 'linear-gradient(120deg,#0E2042,#1B3B6F)' }}>
        <ShieldCheck className="h-5 w-5 text-[#6EE7B7]" />
        <span className="font-extrabold tracking-tight">Bharat Mechanics</span>
        <span className="ml-auto text-[11px] font-semibold uppercase tracking-wider text-white/60">Service Job</span>
      </div>
      <div className="flex flex-1 items-start justify-center p-4">
        <div className="mt-2 w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, labelHi, value }: { icon: typeof User; label: string; labelHi: string; value: string }) {
  return (
    <div className="flex gap-3 border-t border-[#EEF1F6] py-3 first:border-t-0">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF0FE]"><Icon className="h-[18px] w-[18px] text-[#1E40E0]" /></span>
      <div className="min-w-0">
        <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#7B8AA3]">{label} · <span className="normal-case">{labelHi}</span></p>
        <p className="mt-0.5 break-words text-[15.5px] font-semibold leading-snug text-[#13203A]">{value || 'Not given · नहीं दिया'}</p>
      </div>
    </div>
  )
}

export default function JobLinkPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('loading')
  const [job, setJob] = useState<Job | null>(null)

  const load = useCallback(() => {
    const token = (router.query.token as string) || (typeof window !== 'undefined' ? decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() || '') : '')
    if (!token) { setPhase('invalid'); return }
    setPhase('loading')
    jobLinkAPI.get(token)
      .then((r) => { setJob(r.data?.data || null); setPhase(r.data?.data ? 'ready' : 'invalid') })
      .catch((e) => {
        const status = e?.response?.status
        setPhase(status === 410 ? 'gone' : status === 404 ? 'invalid' : 'offline')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.token])
  useEffect(() => { if (router.isReady) load() }, [router.isReady, load])

  const card = 'rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(15,32,66,.10)]'

  if (phase === 'loading') {
    return <Shell><div className={`${card} flex items-center justify-center gap-2 py-12 text-[14px] font-semibold text-[#5B6B85]`} data-job-loading><Loader2 className="h-5 w-5 animate-spin" />Opening the job…</div></Shell>
  }

  if (phase !== 'ready' || !job) {
    const gone = phase === 'gone', offline = phase === 'offline'
    const Icon = offline ? RefreshCw : gone ? Clock : AlertCircle
    return (
      <Shell>
        <div className={`${card} text-center`} data-job-notice={phase}>
          <Icon className="mx-auto h-12 w-12 text-[#D97706]" />
          <h1 className="mt-3 text-[20px] font-extrabold text-[#13203A]">{offline ? 'Could not open the job' : gone ? 'This job is no longer with you' : 'This link is not valid'}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5B6B85]">
            {offline ? 'Check your internet and try again.' : gone ? 'The job is finished, or it has been given to somebody else.' : 'Please check the link in the message.'}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-[#5B6B85]">
            {offline ? 'इंटरनेट देखें और दोबारा कोशिश करें।' : gone ? 'यह जॉब पूरा हो गया है या किसी और को दे दिया गया है।' : 'कृपया मैसेज का लिंक दोबारा देखें।'}
          </p>
          {offline && <button type="button" onClick={load} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-[#D5DDEC] px-5 text-[14px] font-bold text-[#1B3B6F]"><RefreshCw className="h-4 w-4" />Try again</button>}
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className={card} data-job>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[20px] font-extrabold leading-snug text-[#13203A]">New service job</h1>
            <p className="text-[14.5px] font-semibold text-[#1B3B6F]">नया सर्विस जॉब{job.for ? ` · ${job.for}` : ''}</p>
          </div>
          <span className="shrink-0 rounded-lg bg-[#EEF3FD] px-2.5 py-1 text-[12.5px] font-bold text-[#1E40E0]" data-job-id>{job.requestId}</span>
        </div>
        {job.emergency && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#FEF1F1] px-3 py-2 text-[13.5px] font-bold text-[#B91C1C]" data-job-emergency>
            <AlertTriangle className="h-4 w-4 shrink-0" />Emergency — reach as soon as possible · इमरजेंसी — जल्द पहुँचें
          </p>
        )}

        <div className="mt-3">
          <Row icon={User} label="Customer" labelHi="ग्राहक" value={job.customer} />
          <Row icon={Car} label="Vehicle" labelHi="गाड़ी" value={job.vehicle} />
          <Row icon={Wrench} label="Problem" labelHi="समस्या" value={job.problem} />
          <Row icon={MapPin} label="Address" labelHi="पता" value={job.address} />
          {!job.emergency && <Row icon={Clock} label="Time" labelHi="समय" value={job.time} />}
        </div>

        {job.number && (
          <a href={`tel:${job.number}`} data-job-call
            className="mt-4 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FF5A1F] text-[16px] font-extrabold text-white shadow-[0_8px_20px_rgba(255,90,31,.35)]">
            <Phone className="h-5 w-5" />Call customer · ग्राहक को कॉल करें
          </a>
        )}
        {job.map && (
          <a href={job.map} target="_blank" rel="noopener noreferrer" data-job-map
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#D5DDEC] text-[15px] font-bold text-[#1B3B6F]">
            <Navigation className="h-[18px] w-[18px]" />{job.hasPin ? 'Open map · रास्ता देखें' : 'Find the address on map · मैप में पता खोजें'}
          </a>
        )}

        {job.number && (
          <p className="mt-4 rounded-xl bg-[#F3F5F9] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#5B6B85]" data-job-note>
            Call <b className="text-[#13203A]">{job.number}</b> from the same mobile number this message came to — the call goes to the customer. Your number is not shown to the customer.
            <br />जिस मोबाइल नंबर पर यह मैसेज आया है उसी से कॉल करें — कॉल ग्राहक को लगेगा। आपका नंबर ग्राहक को नहीं दिखेगा।
          </p>
        )}
        {!job.hasPin && job.map && <p className="mt-2 text-center text-[12px] text-[#7B8AA3]">The exact location was not shared — ask the customer on the call.</p>}
      </div>
    </Shell>
  )
}
