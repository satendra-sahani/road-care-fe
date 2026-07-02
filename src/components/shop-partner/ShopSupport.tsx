'use client'

// Shop-partner Help & Support — live chat with the admin desk + in-app voice
// call (Agora), mirroring the app. Reuses /common/support (works for the shop
// role) and the shared WebCall component.
import { useCallback, useEffect, useRef, useState } from 'react'
import Cookies from 'js-cookie'
import { io, type Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { supportAPI } from '@/services/api'
import { WebCall, type CallHandle } from '@/components/calls/WebCall'
import { Loader2, Send, Phone, Headset } from 'lucide-react'

const DIST = '#D97706'
// Own socket authed with the shop `token` cookie — the shared socketService may
// already be connected with the customer token (IncomingCallProvider mounts
// globally), which would leave this shop out of its user room → no realtime.
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api').replace(/\/api\/?$/, '')
const fmt = (iso?: string) => { try { return new Date(iso || '').toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) } catch { return '' } }

interface Msg { id?: string; _id?: string; senderRole: string; senderName?: string; text: string; createdAt: string }
interface Live { callId: string; appId: string; channelName: string; token: string; uid: number; api: CallHandle }

export function ShopSupport() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [calling, setCalling] = useState(false)
  const [live, setLive] = useState<Live | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const countRef = useRef(0)
  const toEnd = () => setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }), 60)

  const load = useCallback(async (silent = false) => {
    try {
      const r = await supportAPI.getThread()
      if (r.data?.success && r.data.data?.messages) {
        setMessages(r.data.data.messages)
        if (r.data.data.messages.length !== countRef.current) { countRef.current = r.data.data.messages.length; toEnd() }
      }
    } catch { /* offline */ } finally { if (!silent) setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Real-time admin replies (dedicated socket authed with the shop `token`).
  useEffect(() => {
    const token = Cookies.get('token')
    const onMsg = (data: any) => { if (data?.message?.senderRole === 'admin') { setMessages((m) => [...m, data.message]); toEnd() } }
    let socket: Socket | null = null
    if (token) {
      socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true })
      socket.on('support:message', onMsg)
    }
    const poll = setInterval(() => load(true), 6000) // fallback
    return () => { if (socket) { socket.off('support:message', onMsg); socket.disconnect() } clearInterval(poll) }
  }, [load])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true); setText('')
    setMessages((m) => [...m, { id: 'tmp' + Date.now(), senderRole: 'user', text: body, createdAt: new Date().toISOString() }]); toEnd()
    try {
      const r = await supportAPI.sendMessage(body)
      if (r.data?.success && r.data.data?.messages) { setMessages(r.data.data.messages); countRef.current = r.data.data.messages.length }
    } catch { toast.error('Could not send. Check your connection.'); setText(body) } finally { setSending(false) }
  }

  const callSupport = async () => {
    if (calling) return
    setCalling(true)
    try {
      const r = await supportAPI.call('audio')
      const d = r.data?.data
      if (r.data?.success && d?.agora?.appId) {
        setLive({
          callId: d.callId, appId: d.agora.appId, channelName: d.agora.channelName, token: d.agora.token, uid: Number(d.agora.uid),
          api: { getStatus: () => supportAPI.getCallStatus(d.callId), updateStatus: (s: string, dur: number) => supportAPI.updateCallStatus(d.callId, s, dur) },
        })
      } else toast.error(r.data?.message || 'Support is unavailable right now')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Could not connect to support') } finally { setCalling(false) }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto flex h-[calc(100vh-150px)] min-h-[480px] max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#E7ECF3] bg-white shadow-sm">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-[#EEF1F6] px-4 py-3.5" style={{ background: '#FFF9F0' }}>
          <div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: DIST }}><Headset className="h-5 w-5" /></div>
          <div className="flex-1">
            <div className="text-[15px] font-extrabold text-[#13203A]">Help &amp; Support</div>
            <div className="text-[12px] text-[#7B8AA3]">Chat with our team · we reply within minutes</div>
          </div>
          <button onClick={callSupport} disabled={calling} className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-bold text-white disabled:opacity-60" style={{ background: DIST }}>
            {calling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />} Call
          </button>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto bg-[#F7F9FB] p-4">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" style={{ color: DIST }} /></div>
          ) : (
            <>
              <div className="mx-auto max-w-md rounded-2xl bg-white p-4 text-center shadow-sm">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#FEF3E2]" style={{ color: DIST }}><Headset className="h-5 w-5" /></div>
                <div className="mt-2 text-[14px] font-extrabold text-[#13203A]">Hi 👋 How can we help?</div>
                <div className="text-[12.5px] text-[#7B8AA3]">Ask about orders, payouts, KYC or your account — or tap Call to talk to us.</div>
              </div>
              {messages.map((m, i) => {
                const mine = m.senderRole === 'user'
                return (
                  <div key={m.id || m._id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-white ${mine ? 'rounded-br-md' : 'rounded-bl-md border border-[#E7ECF3] bg-white !text-[#13203A]'}`} style={mine ? { background: DIST } : {}}>
                      {!mine && <div className="text-[10px] font-bold" style={{ color: DIST }}>{m.senderName || 'Support'}</div>}
                      <div className="text-[13.5px] leading-snug">{m.text}</div>
                      <div className={`mt-0.5 text-[9.5px] ${mine ? 'text-white/70' : 'text-[#9AA7B8]'}`}>{fmt(m.createdAt)}</div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* input */}
        <div className="flex items-end gap-2 border-t border-[#EEF1F6] p-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} rows={1} placeholder="Type your message…" className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-[#E7ECF3] px-3.5 py-3 text-sm outline-none focus:border-[#D97706]" />
          <button onClick={send} disabled={!text.trim() || sending} className="grid h-[44px] w-[44px] place-items-center rounded-xl text-white disabled:opacity-50" style={{ background: DIST }}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {live && (
        <WebCall appId={live.appId} channelName={live.channelName} token={live.token} uid={live.uid} peerName="Bharat Mechanics Support" outgoing api={live.api} onClose={() => setLive(null)} />
      )}
    </div>
  )
}
