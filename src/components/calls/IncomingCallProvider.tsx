'use client'

// Global incoming-call listener for logged-in customers on the website. Keeps
// an authenticated socket open and, when the backend emits 'call:incoming'
// (e.g. someone scanned this user's vehicle QR and called), shows a ringing
// modal. Accept → join the Agora channel; reject → tell the backend.
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

const Ctx = createContext<null>(null)
export const useIncomingCall = () => useContext(Ctx)

export function IncomingCallProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useSelector((s: RootState) => s.customerAuth?.isAuthenticated)
  const [incoming, setIncoming] = useState<IncomingCall | null>(null)
  const [active, setActive] = useState<ActiveCall | null>(null)
  const [joining, setJoining] = useState(false)
  const incomingRef = useRef<IncomingCall | null>(null)
  incomingRef.current = incoming

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && !!Cookies.get('customer_token')
    if (!isAuthenticated && !hasToken) return

    socketService.ensureConnected()
    const handler = (data: any) => {
      if (!data?.callId) return
      // Ignore a second ring while already busy.
      if (incomingRef.current || active) return
      setIncoming({
        callId: String(data.callId),
        callerName: String(data.callerName || 'Incoming call'),
        callType: data.callType === 'video' ? 'video' : 'audio',
        contextType: data.contextType,
      })
    }
    const unsub = socketService.on('call:incoming', handler)
    return () => { unsub() }
  }, [isAuthenticated, active])

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
      // Could not join — mark missed and drop the prompt.
      try { await userCallAPI.updateStatus(incoming.callId, 'failed', 0) } catch { /* noop */ }
      setIncoming(null)
    } finally {
      setJoining(false)
    }
  }

  const reject = async () => {
    if (!incoming) return
    const id = incoming.callId
    setIncoming(null)
    try { await userCallAPI.updateStatus(id, 'rejected', 0) } catch { /* noop */ }
  }

  const activeApi: CallHandle | null = active && {
    getStatus: () => userCallAPI.getStatus(active.callId),
    updateStatus: (status: string, duration: number) => userCallAPI.updateStatus(active.callId, status, duration),
  }

  return (
    <Ctx.Provider value={null}>
      {children}

      {/* Ringing prompt */}
      {incoming && !active && (
        <div className="fixed inset-x-0 top-4 z-[70] mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-[#0F2647] px-4 py-3 text-white shadow-2xl ring-1 ring-white/10">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-2xl">🚗</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-[10px] font-extrabold tracking-wide text-[#FFD68A]">
              <Shield className="h-3 w-3" fill="currentColor" /> SECURECONTACT
            </div>
            <div className="truncate text-sm font-extrabold">{incoming.callerName}</div>
            <div className="text-[11px] font-semibold opacity-70">Incoming voice call…</div>
          </div>
          <button onClick={reject} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E5484D]">
            <PhoneOff className="h-5 w-5" />
          </button>
          <button onClick={accept} disabled={joining} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1BA672]">
            {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" fill="currentColor" />}
          </button>
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
