'use client'

// Contact owner (after scanning someone's QR) + anonymous calling overlay.
// Ported from bmc-extra.jsx ContactOwner + QRCall.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { UserLayout } from '@/components/layout/UserLayout'
import { useLoginModal } from '@/components/auth/LoginModalProvider'
import { userVehicleQrAPI } from '@/services/api'
import type { RootState } from '@/store'
import { resolveCode, maskPlate, type ScanResult } from '@/lib/secureContact'
import { Shield, Phone, Send, Check, ChevronRight, Info, Volume2, PhoneOff } from 'lucide-react'

const QUICK_MSGS = [
  'Please move your vehicle 🙏',
  "You're blocking my car",
  "I'll be there in 5 min",
  'Your lights are left on',
]

const DEMO = { em: '🚗', name: 'Maruti Swift VXi', plate: 'DL 8C XY 4821' }

export function ContactOwnerPage() {
  const router = useRouter()
  const code = typeof router.query.code === 'string' ? router.query.code : undefined
  const { openLogin } = useLoginModal()
  const isAuthenticated = useSelector((s: RootState) => s.customerAuth?.isAuthenticated)

  // Server-resolved vehicle (masked). Falls back to the demo vehicle when no
  // code is present — the previous behaviour for direct visits.
  const [resolved, setResolved] = useState<ScanResult | null>(null)
  useEffect(() => {
    if (!code) return
    let cancelled = false
    resolveCode(code).then((r) => { if (!cancelled && r) setResolved(r) })
    return () => { cancelled = true }
  }, [code])

  const veh = resolved ? { em: resolved.em, name: resolved.name, plate: resolved.maskedPlate } : DEMO
  const masked = resolved ? resolved.maskedPlate : maskPlate(veh.plate)

  const [sent, setSent] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [calling, setCalling] = useState(false)

  // Real anonymous message via the platform (owner gets an app notification).
  // Requires login; the demo (no code) keeps the old toast behaviour.
  const sendQuickMsg = async (m: string) => {
    if (sending) return
    if (!code) { setSent(m); toast.success('Message sent anonymously'); return }
    if (!isAuthenticated && !Cookies.get('customer_token')) {
      openLogin(() => { sendQuickMsg(m) })
      return
    }
    setSending(m)
    try {
      const res = await userVehicleQrAPI.message(code, m)
      if (res.data?.success) { setSent(m); toast.success('Message sent anonymously') }
      else toast.error(res.data?.message || 'Could not send the message')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not send the message')
    } finally {
      setSending(null)
    }
  }

  return (
    <UserLayout>
      <div className="mx-auto max-w-md px-4 pb-10" style={{ background: 'linear-gradient(180deg,#E6F6F8,#F4F6FB 70%)' }}>
        <div className="pt-5">
          <h1 className="font-display text-2xl font-extrabold text-[#0F2545]">Contact owner</h1>
          <p className="text-[12.5px] font-semibold text-slate-500">Connected via SecureContact</p>
        </div>

        {/* vehicle */}
        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[20px] bg-[#EAF0FA] text-[34px]">{veh.em}</div>
          <div className="mt-3 font-display text-xl font-extrabold text-[#0F2545]">{veh.name}</div>
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-[#EAF0FA] px-3 py-1 text-sm font-extrabold tracking-widest text-[#1B3B6F]">{masked}</div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#E6F7F0] px-3 py-1.5 text-xs font-extrabold text-[#1BA672]">
            <Shield className="h-3.5 w-3.5" /> Owner&apos;s number stays private
          </div>
        </div>

        {/* call */}
        <button onClick={() => setCalling(true)}
          className="mt-3.5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1B3B6F] text-base font-bold text-white transition hover:bg-[#16315c]">
          <Phone className="h-5 w-5" fill="currentColor" /> Call owner anonymously
        </button>

        {/* quick messages */}
        <h3 className="mb-2.5 mt-5 text-base font-extrabold text-[#0F2545]">Send a quick <span className="text-[#FF6B35]">message</span></h3>
        <div className="grid gap-2.5">
          {QUICK_MSGS.map((m) => (
            <button key={m} onClick={() => sendQuickMsg(m)} disabled={sending !== null}
              className={`flex items-center gap-3 rounded-2xl bg-white p-3.5 text-left shadow-sm disabled:opacity-60 ${sent === m ? 'border-[1.5px] border-[#1BA672]' : 'border border-slate-100'}`}>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFF1EA]"><Send className="h-[17px] w-[17px] text-[#FF6B35]" /></div>
              <span className="flex-1 text-[13.5px] font-bold text-[#0F2545]">{sending === m ? 'Sending…' : m}</span>
              {sent === m ? <Check className="h-[18px] w-[18px] text-[#1BA672]" strokeWidth={3} /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2.5 rounded-2xl bg-[#EAF0FA] px-3.5 py-3">
          <Info className="mt-0.5 h-[17px] w-[17px] shrink-0 text-[#1B3B6F]" />
          <span className="text-xs font-bold leading-snug text-slate-700">Calls and messages are routed through Bharat Mechanics. Neither of you ever sees the other&apos;s phone number.</span>
        </div>
      </div>

      {calling && <QRCallOverlay vehicle={veh} masked={masked} onHangup={() => setCalling(false)} />}
    </UserLayout>
  )
}

function QRCallOverlay({ vehicle, masked, onHangup }: { vehicle: { em: string; name: string }; masked: string; onHangup: () => void }) {
  const [phase, setPhase] = useState<'connecting' | 'ringing' | 'live'>('connecting')
  const [sec, setSec] = useState(0)
  const [mute, setMute] = useState(false)
  const [spk, setSpk] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('ringing'), 1500)
    const t2 = setTimeout(() => setPhase('live'), 4200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  useEffect(() => {
    if (phase !== 'live') return
    const t = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  const status = phase === 'connecting' ? 'Connecting securely…' : phase === 'ringing' ? 'Ringing…' : `${mm}:${ss}`

  return (
    <div className="fixed inset-0 z-[70] flex flex-col text-white" style={{ background: 'linear-gradient(180deg,#0F2647,#1B3B6F 55%,#24508C)' }}>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[11.5px] font-extrabold tracking-wide text-[#FFD68A]">
          <Shield className="h-3.5 w-3.5" fill="currentColor" /> SECURE LINE · NUMBER HIDDEN
        </div>
        <div className="relative mt-8 h-[130px] w-[130px]">
          {phase !== 'live' && <span className="absolute inset-0 animate-ping rounded-full border-2 border-white/30" />}
          <div className="flex h-[130px] w-[130px] items-center justify-center rounded-full bg-white/15 text-[60px]">{vehicle.em}</div>
        </div>
        <div className="mt-6 font-display text-2xl font-extrabold">Owner of {masked}</div>
        <div className="mt-1.5 text-sm font-bold opacity-85">{vehicle.name} · via Bharat Mechanics</div>
        <div className={`mt-4 text-xl font-extrabold tabular-nums tracking-wide ${phase === 'live' ? 'text-[#7DF3B0]' : 'text-white'}`}>{status}</div>
      </div>
      <div className="px-10 pb-12">
        <div className="mb-6 flex justify-center gap-7">
          <CallCtl label="Mute" active={mute} onClick={() => setMute((m) => !m)} icon={<Phone className="h-6 w-6" fill={mute ? 'currentColor' : 'none'} />} />
          <CallCtl label="Speaker" active={spk} onClick={() => setSpk((s) => !s)} icon={<Volume2 className="h-6 w-6" />} />
        </div>
        <button onClick={onHangup}
          className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#E5484D] shadow-[0_12px_30px_-8px_rgba(229,72,77,.7)]">
          <PhoneOff className="h-7 w-7 text-white" />
        </button>
      </div>
    </div>
  )
}

function CallCtl({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 text-white">
      <span className={`grid h-[58px] w-[58px] place-items-center rounded-full ${active ? 'bg-white text-[#1B3B6F]' : 'bg-white/15 text-white'}`}>{icon}</span>
      <span className="text-xs font-bold opacity-85">{label}</span>
    </button>
  )
}
