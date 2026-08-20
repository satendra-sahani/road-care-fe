'use client'

// Global incoming-call listener for logged-in customers on the website. Keeps
// an authenticated socket open and, when the backend emits 'call:incoming'
// (someone scanned this user's vehicle QR and called), shows a FULL-SCREEN
// ringing screen with a ringtone + vibration so it can't be missed. Accept →
// join the Agora channel; reject → tell the backend.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSelector } from 'react-redux'
import Cookies from 'js-cookie'
import socketService from '@/services/socketService'
import { userCallAPI } from '@/services/api'
import { WebCall, type CallHandle } from './WebCall'
import type { RootState } from '@/store'
import { Shield, Phone, PhoneOff, Loader2 } from 'lucide-react'

interface IncomingCall {
  callId: string
  callerName: string
  callType: 'audio' | 'video'
  contextType?: string
}
interface ActiveCall {
  callId: string
  appId: string
  channelName: string
  token: string
  uid: number
  peerName: string
}

// A ringtone via the Web Audio API (no asset needed) + vibration. Loops until
// stopped. Best-effort: if the browser blocks audio, the full-screen visual and
// vibration still grab attention.
function createRinger() {
  let ctx: any = null
  let timer: ReturnType<typeof setInterval> | null = null
  let dead = false
  const tick = () => {
    if (dead) return
    try {
      if (ctx) {
        const now = ctx.currentTime
        for (const [f, at] of [[523, 0], [659, 0.4]] as const) {
          const o = ctx.createOscillator(); const g = ctx.createGain()
          o.type = 'sine'; o.frequency.value = f
          g.gain.setValueAtTime(0.0001, now + at)
          g.gain.exponentialRampToValueAtTime(0.28, now + at + 0.04)
          g.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.34)
          o.connect(g); g.connect(ctx.destination)
          o.start(now + at); o.stop(now + at + 0.4)
        }
      }
    } catch { /* audio blocked */ }
    try { (navigator as any).vibrate?.([400, 200, 400]) } catch { /* no vibration */ }
  }
  return {
    start() {
      dead = false
      try {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext
        if (AC) { ctx = new AC(); if (ctx.state === 'suspended') ctx.resume?.() }
      } catch { /* no audio context */ }
      tick()
      timer = setInterval(tick, 1700)
    },
    stop() {
      dead = true
      if (timer) { clearInterval(timer); timer = null }
      try { ctx?.close?.() } catch { /* noop */ }
      ctx = null
      try { (navigator as any).vibrate?.(0) } catch { /* noop */ }
    },
  }
}

const Ctx = createContext<null>(null)
export const useIncomingCall = () => useContext(Ctx)

export function IncomingCallProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useSelector((s: RootState) => s.customerAuth?.isAuthenticated)
  const [incoming, setIncoming] = useState<IncomingCall | null>(null)
  const [active, setActive] = useState<ActiveCall | null>(null)
  const [joining, setJoining] = useState(false)
  const incomingRef = useRef<IncomingCall | null>(null)
  incomingRef.current = incoming
  const activeRef = useRef<ActiveCall | null>(null)
  activeRef.current = active

  const endIncoming = async (status: string) => {
    const id = incomingRef.current?.callId
    setIncoming(null)
    if (id) { try { await userCallAPI.updateStatus(id, status, 0) } catch { /* noop */ } }
  }

  // Attach the incoming-call listener ONCE per auth session. Using refs for the
  // busy check keeps the listener stable so no event is missed while a call is
  // being set up (the handler registry also re-binds it across reconnects).
  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && !!Cookies.get('customer_token')
    if (!isAuthenticated && !hasToken) return

    socketService.ensureConnected()
    const handler = (data: any) => {
      if (!data?.callId) return
      // The socket authenticates with the CUSTOMER token cookie, so on the
      // admin/shop panels (often the same browser) a customer's incoming call
      // would ring over the wrong dashboard. Suppress it there — the call
      // still rings on the customer's app/customer-facing web pages.
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      if (path.startsWith('/admin') || path.startsWith('/shop-partner')) return
      if (incomingRef.current || activeRef.current) return // already busy
      setIncoming({
        callId: String(data.callId),
        callerName: String(data.callerName || 'Incoming call'),
        callType: data.callType === 'video' ? 'video' : 'audio',
        contextType: data.contextType,
      })
    }
    const unsub = socketService.on('call:incoming', handler)
    return () => { unsub() }
  }, [isAuthenticated])

  // Ring (sound + vibration) while an incoming call is pending; auto-miss after 45s.
  useEffect(() => {
    if (!incoming || active) return
    const ringer = createRinger()
    ringer.start()
    const timeout = setTimeout(() => { endIncoming('missed') }, 45000)
    return () => { ringer.stop(); clearTimeout(timeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming, active])

  const accept = async () => {
    if (!incoming || joining) return
    setJoining(true)
    try {
      const res = await userCallAPI.join(incoming.callId)
      const agora = res.data?.data?.agora
      if (!agora?.appId || !agora?.channelName) throw new Error('join failed')
      setActive({
        callId: incoming.callId,
        appId: agora.appId,
        channelName: agora.channelName,
        token: agora.token,
        uid: Number(agora.uid),
        peerName: incoming.callerName,
      })
      setIncoming(null)
    } catch {
      try { await userCallAPI.updateStatus(incoming.callId, 'failed', 0) } catch { /* noop */ }
      setIncoming(null)
    } finally {
      setJoining(false)
    }
  }

  const activeApi: CallHandle | null = active && {
    getStatus: () => userCallAPI.getStatus(active.callId),
    updateStatus: (status: string, duration: number) => userCallAPI.updateStatus(active.callId, status, duration),
  }

  return (
    <Ctx.Provider value={null}>
      {children}

      {/* Full-screen incoming ring */}
      {incoming && !active && (
        <div className="fixed inset-0 z-[80] flex flex-col text-white" style={{ background: 'linear-gradient(180deg,#0F2647,#1B3B6F 55%,#24508C)' }}>
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[11.5px] font-extrabold tracking-wide text-[#FFD68A]">
              <Shield className="h-3.5 w-3.5" fill="currentColor" /> SECURECONTACT
            </div>
            <div className="relative mt-10 h-[132px] w-[132px]">
              <span className="absolute inset-0 animate-ping rounded-full border-2 border-white/30" />
              <span className="absolute -inset-2 animate-pulse rounded-full bg-[#1BA672]/20" />
              <div className="flex h-[132px] w-[132px] items-center justify-center rounded-full bg-white/15 text-[62px]">🚗</div>
            </div>
            <div className="mt-7 font-display text-2xl font-extrabold">{incoming.callerName}</div>
            <div className="mt-2 text-sm font-bold opacity-85">Incoming voice call · number stays private</div>
          </div>
          <div className="flex items-center justify-center gap-16 px-10 pb-16">
            <button onClick={() => endIncoming('rejected')} className="flex flex-col items-center gap-2">
              <span className="grid h-[70px] w-[70px] place-items-center rounded-full bg-[#E5484D] shadow-[0_12px_30px_-8px_rgba(229,72,77,.7)]">
                <PhoneOff className="h-7 w-7 text-white" />
              </span>
              <span className="text-xs font-bold opacity-85">Decline</span>
            </button>
            <button onClick={accept} disabled={joining} className="flex flex-col items-center gap-2">
              <span className="grid h-[70px] w-[70px] place-items-center rounded-full bg-[#1BA672] shadow-[0_12px_30px_-8px_rgba(27,166,114,.7)]">
                {joining ? <Loader2 className="h-7 w-7 animate-spin text-white" /> : <Phone className="h-7 w-7 text-white" fill="currentColor" />}
              </span>
              <span className="text-xs font-bold opacity-85">{joining ? 'Connecting…' : 'Accept'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Live call */}
      {active && activeApi && (
        <WebCall
          appId={active.appId}
          channelName={active.channelName}
          token={active.token}
          uid={active.uid}
          peerName={active.peerName}
          outgoing={false}
          api={activeApi}
          onClose={() => setActive(null)}
        />
      )}
    </Ctx.Provider>
  )
}
