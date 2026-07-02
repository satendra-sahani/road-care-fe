'use client'

// Admin-side receiver for in-app SUPPORT calls. Uses its OWN socket (authed
// with the admin `token` cookie, isolated from the customer socketService) and
// listens on the 'support:agents' room broadcast. Any admin can answer; the
// backend tells the others it's taken.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import { io, type Socket } from 'socket.io-client'
import Cookies from 'js-cookie'
import { adminSupportAPI } from '@/services/api'
import { WebCall, type CallHandle } from './WebCall'
import { Headset, Phone, PhoneOff, Loader2 } from 'lucide-react'

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api').replace(/\/api\/?$/, '')

interface Incoming { callId: string; callerName: string; callType: 'audio' | 'video' }
interface Active { callId: string; appId: string; channelName: string; token: string; uid: number; peerName: string }

export function AdminCallProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const isAdminArea = router.pathname.startsWith('/admin') && router.pathname !== '/admin/login'
  const [incoming, setIncoming] = useState<Incoming | null>(null)
  const [active, setActive] = useState<Active | null>(null)
  const [joining, setJoining] = useState(false)
  const incomingRef = useRef<Incoming | null>(null); incomingRef.current = incoming
  const activeRef = useRef<Active | null>(null); activeRef.current = active

  useEffect(() => {
    if (!isAdminArea) return
    const token = Cookies.get('token')
    if (!token) return

    const socket: Socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true })
    const onIncoming = (data: any) => {
      if (!data?.callId || data.contextType !== 'support') return
      if (incomingRef.current || activeRef.current) return
      setIncoming({ callId: String(data.callId), callerName: String(data.callerName || 'Support call'), callType: data.callType === 'video' ? 'video' : 'audio' })
    }
    const onTaken = (data: any) => {
      // Another admin answered — clear our ring for that call.
      if (data?.callId && incomingRef.current?.callId === data.callId) setIncoming(null)
    }
    socket.on('call:incoming', onIncoming)
    socket.on('support:call-taken', onTaken)
    return () => { socket.off('call:incoming', onIncoming); socket.off('support:call-taken', onTaken); socket.disconnect() }
  }, [isAdminArea])

  const accept = async () => {
    if (!incoming || joining) return
    setJoining(true)
    try {
      const res = await adminSupportAPI.answerCall(incoming.callId)
      const agora = res.data?.data?.agora
      if (!agora?.appId || !agora?.channelName) throw new Error('join failed')
      setActive({ callId: incoming.callId, appId: agora.appId, channelName: agora.channelName, token: agora.token, uid: Number(agora.uid), peerName: incoming.callerName })
      setIncoming(null)
    } catch {
      try { await adminSupportAPI.updateCallStatus(incoming.callId, 'failed', 0) } catch { /* noop */ }
      setIncoming(null)
    } finally { setJoining(false) }
  }

  const reject = async () => {
    if (!incoming) return
    const id = incoming.callId; setIncoming(null)
    try { await adminSupportAPI.updateCallStatus(id, 'rejected', 0) } catch { /* noop */ }
  }

  const activeApi: CallHandle | null = active && {
    getStatus: () => adminSupportAPI.getCallStatus(active.callId),
    updateStatus: (status: string, duration: number) => adminSupportAPI.updateCallStatus(active.callId, status, duration),
  }

  return (
    <>
      {children}

      {incoming && !active && (
        <div className="fixed inset-x-0 top-4 z-[80] mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-[#0F2647] px-4 py-3 text-white shadow-2xl ring-1 ring-white/10">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15"><Headset className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-extrabold tracking-wide text-[#FFD68A]">SUPPORT CALL</div>
            <div className="truncate text-sm font-extrabold">{incoming.callerName}</div>
            <div className="text-[11px] font-semibold opacity-70">Incoming voice call…</div>
          </div>
          <button onClick={reject} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E5484D]"><PhoneOff className="h-5 w-5" /></button>
          <button onClick={accept} disabled={joining} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1BA672]">
            {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" fill="currentColor" />}
          </button>
        </div>
      )}

      {active && activeApi && (
        <WebCall appId={active.appId} channelName={active.channelName} token={active.token} uid={active.uid} peerName={active.peerName} outgoing={false} api={activeApi} onClose={() => setActive(null)} />
      )}
    </>
  )
}
