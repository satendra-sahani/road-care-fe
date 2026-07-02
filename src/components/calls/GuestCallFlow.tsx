'use client'

// Guest calling flow for the public SecureContact landing: an anonymous
// scanner enters name + phone + OTP, then talks to the vehicle owner over
// Agora (numbers hidden both ways). If the visitor is already logged in as a
// customer, the OTP step is skipped and the authenticated call path is used.
import { useState } from 'react'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { guestCallAPI, userCallAPI } from '@/services/api'
import { WebCall, type CallHandle } from './WebCall'
import { Shield, Phone, X, Loader2, ArrowRight } from 'lucide-react'

interface Props {
  code: string
  peerName: string // e.g. "Owner of DL 8C XY ••21"
  onClose: () => void
}

type Step = 'form' | 'otp' | 'placing' | 'incall'
interface Live { callId: string; appId: string; channelName: string; token: string; uid: number; api: CallHandle }

export function GuestCallFlow({ code, peerName, onClose }: Props) {
  const loggedIn = typeof window !== 'undefined' && !!Cookies.get('customer_token')
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [guestToken, setGuestToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [live, setLive] = useState<Live | null>(null)

  const sendOtp = async () => {
    if (busy) return
    if (name.trim().length < 2) return toast.error('Please enter your name')
    if (phone.trim().length < 10) return toast.error('Please enter a valid phone number')
    setBusy(true)
    try {
      const res = await guestCallAPI.sendOtp(phone.trim())
      if (res.data?.success) { setStep('otp'); toast.success('OTP sent') }
      else toast.error(res.data?.message || 'Could not send OTP')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not send OTP')
    } finally { setBusy(false) }
  }

  // Place the call once we have a guest token (or immediately, when logged in).
  const placeGuestCall = async (token: string) => {
    setStep('placing')
    try {
      const res = await guestCallAPI.call(code, 'audio', token)
      const d = res.data?.data
      if (!res.data?.success || !d?.agora?.appId) throw new Error(res.data?.message || 'Call failed')
      setLive({
        callId: d.callId, appId: d.agora.appId, channelName: d.agora.channelName,
        token: d.agora.token, uid: Number(d.agora.uid),
        api: {
          getStatus: () => guestCallAPI.getStatus(d.callId, token),
          updateStatus: (s: string, dur: number) => guestCallAPI.updateStatus(d.callId, s, dur, token),
        },
      })
      setStep('incall')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Could not place the call')
      onClose()
    }
  }

  const verifyAndCall = async () => {
    if (busy) return
    if (otp.trim().length < 4) return toast.error('Enter the OTP')
    setBusy(true)
    try {
      const res = await guestCallAPI.verifyOtp(phone.trim(), name.trim(), otp.trim())
      if (res.data?.success && res.data.data?.guestToken) {
        setGuestToken(res.data.data.guestToken)
        await placeGuestCall(res.data.data.guestToken)
      } else {
        toast.error(res.data?.message || 'Invalid OTP')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Verification failed')
    } finally { setBusy(false) }
  }

  // Logged-in shortcut: authenticated call, no OTP.
  const placeUserCall = async () => {
    setStep('placing')
    try {
      const res = await userCallAPI.callVehicleOwner(code, 'audio')
      const d = res.data?.data
      if (!res.data?.success || !d?.agora?.appId) throw new Error(res.data?.message || 'Call failed')
      setLive({
        callId: d.callId, appId: d.agora.appId, channelName: d.agora.channelName,
        token: d.agora.token, uid: Number(d.agora.uid),
        api: {
          getStatus: () => userCallAPI.getStatus(d.callId),
          updateStatus: (s: string, dur: number) => userCallAPI.updateStatus(d.callId, s, dur),
        },
      })
      setStep('incall')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Could not place the call')
      onClose()
    }
  }

  if (step === 'incall' && live) {
    return (
      <WebCall
        appId={live.appId} channelName={live.channelName} token={live.token} uid={live.uid}
        peerName={peerName} outgoing api={live.api} onClose={onClose}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide text-[#1B3B6F]">
            <Shield className="h-3.5 w-3.5" fill="currentColor" /> SECURECONTACT
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500"><X className="h-4 w-4" /></button>
        </div>
        <h2 className="font-display text-xl font-extrabold text-[#0F2545]">Call {peerName}</h2>
        <p className="mt-1 text-[12.5px] font-semibold text-slate-500">Your number stays private — the owner never sees it.</p>

        {step === 'placing' ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B3B6F]" />
            <p className="text-sm font-bold text-slate-600">Connecting your call…</p>
          </div>
        ) : loggedIn ? (
          <div className="mt-5">
            <button onClick={placeUserCall}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#1BA672] py-3.5 font-extrabold text-white">
              <Phone className="h-5 w-5" fill="currentColor" /> Call now
            </button>
          </div>
        ) : step === 'form' ? (
          <div className="mt-5 space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
              className="h-12 w-full rounded-xl border-[1.5px] border-slate-200 px-4 text-[15px] font-semibold text-[#0F2545] outline-none focus:border-[#1B3B6F]" />
            <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Your phone number" inputMode="numeric" maxLength={10}
              className="h-12 w-full rounded-xl border-[1.5px] border-slate-200 px-4 text-[15px] font-semibold tracking-wide text-[#0F2545] outline-none focus:border-[#1B3B6F]" />
            <button onClick={sendOtp} disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] font-extrabold text-white disabled:opacity-60">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />} Send OTP
            </button>
            <p className="text-center text-[11px] font-semibold text-slate-400">We verify your number once to stop spam calls.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-[12.5px] font-semibold text-slate-600">Enter the OTP sent to <b>{phone}</b></p>
            <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} placeholder="6-digit OTP" inputMode="numeric" maxLength={6}
              className="h-12 w-full rounded-xl border-[1.5px] border-slate-200 px-4 text-center text-lg font-extrabold tracking-[0.4em] text-[#0F2545] outline-none focus:border-[#1B3B6F]" />
            <button onClick={verifyAndCall} disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1BA672] font-extrabold text-white disabled:opacity-60">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" fill="currentColor" />} Verify &amp; call
            </button>
            <button onClick={() => setStep('form')} className="w-full text-center text-[12px] font-bold text-slate-500">Change number</button>
          </div>
        )}
      </div>
    </div>
  )
}
