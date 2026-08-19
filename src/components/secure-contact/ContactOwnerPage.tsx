'use client'

// Contact owner (after scanning someone's QR) + anonymous calling overlay.
// Ported from bmc-extra.jsx ContactOwner + QRCall.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { UserLayout } from '@/components/layout/UserLayout'
import { userVehicleQrAPI, guestCallAPI } from '@/services/api'
import type { RootState } from '@/store'
import { resolveCode, maskPlate, type ScanResult } from '@/lib/secureContact'
import { getGuestSession } from '@/lib/guestSession'
import { GuestCallFlow } from '@/components/calls/GuestCallFlow'
import { Shield, Phone, Send, Check, ChevronRight, Info } from 'lucide-react'

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
  const isAuthenticated = useSelector((s: RootState) => s.customerAuth?.isAuthenticated)

  // Server-resolved vehicle (masked). Falls back to the demo vehicle only when
  // no code is present (direct visits) — a code that fails to resolve shows an
  // explicit unavailable state instead of impersonating the demo vehicle.
  const [resolved, setResolved] = useState<ScanResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  useEffect(() => {
    if (!code) return
    let cancelled = false
    setNotFound(false)
    resolveCode(code).then((r) => {
      if (cancelled) return
      if (r) setResolved(r)
      else { setNotFound(true); toast.error('This QR code is no longer active') }
    })
    return () => { cancelled = true }
  }, [code])

  const veh = resolved
    ? { em: resolved.em, name: resolved.name, plate: resolved.maskedPlate }
    : notFound
      ? { em: '🚫', name: 'Vehicle unavailable', plate: '——' }
      : DEMO
  const masked = resolved ? resolved.maskedPlate : notFound ? '——' : maskPlate(veh.plate)

  const [sent, setSent] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [calling, setCalling] = useState(false)
  const [msgVerify, setMsgVerify] = useState<string | null>(null) // guest verify-then-send

  // Send an anonymous message to the owner (they get an app notification).
  //   • logged-in customer → authenticated endpoint
  //   • guest with a verified session → guest endpoint (no login)
  //   • guest with no session → one-time OTP verify, then send (GuestCallFlow)
  // The demo (no code) keeps the old toast behaviour.
  const sendQuickMsg = async (m: string) => {
    if (sending) return
    if (notFound) { toast.error('This QR code is no longer active'); return }
    if (!code) { setSent(m); toast.success('Message sent anonymously'); return }

    const loggedIn = isAuthenticated || !!Cookies.get('customer_token')
    if (loggedIn) {
      setSending(m)
      try {
        const res = await userVehicleQrAPI.message(code, m)
        if (res.data?.success) { setSent(m); toast.success('Message sent anonymously') }
        else toast.error(res.data?.message || 'Could not send the message')
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Could not send the message')
      } finally { setSending(null) }
      return
    }

    // Guest: reuse an existing verified session, else verify once via OTP.
    const gs = getGuestSession()
    if (gs) {
      setSending(m)
      try {
        const res = await guestCallAPI.message(code, m, gs.token)
        if (res.data?.success) { setSent(m); toast.success('Message sent anonymously') }
        else toast.error(res.data?.message || 'Could not send the message')
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Could not send the message')
      } finally { setSending(null) }
      return
    }
    setMsgVerify(m) // opens the guest verify-and-send sheet
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
        <button onClick={() => setCalling(true)} disabled={!code || notFound}
          className="mt-3.5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1B3B6F] text-base font-bold text-white transition hover:bg-[#16315c] disabled:opacity-50">
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

      {calling && code && !notFound && (
        <GuestCallFlow code={code} peerName={`Owner of ${masked}`} onClose={() => setCalling(false)} />
      )}

      {msgVerify && code && !notFound && (
        <GuestCallFlow
          code={code}
          peerName={`Owner of ${masked}`}
          mode="message"
          messageText={msgVerify}
          onSent={() => setSent(msgVerify)}
          onClose={() => setMsgVerify(null)}
        />
      )}
    </UserLayout>
  )
}
