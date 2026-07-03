'use client'

// Admin Help & Support — live ticket queue + chat. Replies reach the user in
// real time (socket) + push. New user messages arrive here over the socket.
import { useCallback, useEffect, useRef, useState } from 'react'
import Cookies from 'js-cookie'
import { io, type Socket } from 'socket.io-client'
import { adminSupportAPI } from '@/services/api'
import { Loader2, Send, MessageSquare, Search, User as UserIcon, ChevronDown, Inbox } from 'lucide-react'

// Own socket, authed with the admin `token` cookie. The shared socketService
// singleton may already be connected with the CUSTOMER token (IncomingCallProvider
// mounts globally), in which case this admin never joins support:agents and no
// realtime messages arrive — the exact bug AdminCallProvider dodged the same way.
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api').replace(/\/api\/?$/, '')

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700',
  pending: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-200 text-slate-600',
}
// Left-edge stripe color per ticket status — mirrors the OrderManagement table pattern.
const STATUS_STRIPE: Record<string, string> = {
  open: '#f59e0b',
  pending: '#3b82f6',
  resolved: '#10b981',
  closed: '#94a3b8',
}
const fmt = (iso?: string) => { try { return new Date(iso || '').toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) } catch { return '' } }

interface Ticket { _id: string; user?: { fullName?: string; phone?: string; role?: string }; subject?: string; status: string; lastMessage?: string; lastMessageAt?: string; unreadForAdmin?: number; userRole?: string }
interface Message { _id?: string; id?: string; senderRole: string; senderName?: string; text: string; createdAt: string }

export function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [sending, setSending] = useState(false)
  const [q, setQ] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<string | null>(null)
  selectedRef.current = selectedId

  const loadTickets = useCallback(async () => {
    try {
      const r = await adminSupportAPI.getTickets({ status: statusFilter, limit: 100 })
      if (r.data?.success) setTickets(r.data.data || [])
    } catch { /* ignore */ } finally { setLoadingList(false) }
  }, [statusFilter])

  const openTicket = useCallback(async (id: string) => {
    setSelectedId(id); setLoadingDetail(true)
    try {
      const r = await adminSupportAPI.getTicket(id)
      if (r.data?.success) { setDetail(r.data.data); setMessages(r.data.data.messages || []) }
      setTickets((ts) => ts.map((t) => (t._id === id ? { ...t, unreadForAdmin: 0 } : t)))
    } catch { /* ignore */ } finally { setLoadingDetail(false); setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9 }), 60) }
  }, [])

  useEffect(() => { loadTickets() }, [loadTickets])

  // Real-time: new user messages / replies land here (dedicated admin socket).
  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) return
    const socket: Socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true })
    const onMsg = (data: any) => {
      if (!data?.ticketId) return
      if (data.ticketId === selectedRef.current && data.message?.senderRole === 'user') {
        setMessages((m) => [...m, data.message]); setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9 }), 60)
      }
      loadTickets() // refresh queue ordering + unread badges
    }
    socket.on('support:message', onMsg)
    return () => { socket.off('support:message', onMsg); socket.disconnect() }
  }, [loadTickets])

  const send = async () => {
    const body = reply.trim()
    if (!body || !selectedId || sending) return
    setSending(true); setReply('')
    setMessages((m) => [...m, { id: 'tmp' + Date.now(), senderRole: 'admin', senderName: 'You', text: body, createdAt: new Date().toISOString() }])
    setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9 }), 60)
    try { await adminSupportAPI.reply(selectedId, body); loadTickets() }
    catch { /* keep optimistic */ } finally { setSending(false) }
  }

  const setStatus = async (status: string) => {
    if (!selectedId) return
    try { await adminSupportAPI.updateTicket(selectedId, { status }); setDetail((d: any) => ({ ...d, status })); loadTickets() } catch { /* ignore */ }
  }

  const filtered = tickets.filter((t) => {
    const s = (t.user?.fullName || '') + ' ' + (t.user?.phone || '') + ' ' + (t.lastMessage || '')
    return s.toLowerCase().includes(q.toLowerCase())
  })

  const activeTicket = tickets.find((t) => t._id === selectedId)

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[520px] gap-4 p-4 md:p-6">
      {/* Ticket queue */}
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-[#F6F8FB] p-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#1B3B6F]/10">
              <MessageSquare className="h-[18px] w-[18px] text-[#1B3B6F]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-extrabold text-[#1A1D29]">Support tickets</h3>
              <p className="text-[11px] font-medium text-gray-400">{filtered.length} conversation{filtered.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 shadow-sm transition-colors focus-within:border-[#1B3B6F] focus-within:ring-2 focus-within:ring-[#1B3B6F]/10">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-9 flex-1 text-sm outline-none placeholder:text-gray-400" />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {['all', 'open', 'pending', 'resolved'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize transition-colors ${statusFilter === s ? 'bg-[#1B3B6F] text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gray-50"><Inbox className="h-5 w-5 text-gray-300" /></div>
              <span className="text-sm font-medium text-gray-400">No tickets</span>
            </div>
          ) : filtered.map((t) => (
            <button
              key={t._id}
              onClick={() => openTicket(t._id)}
              className={`flex w-full items-start gap-3 border-b border-l-[3px] border-gray-50 p-3.5 text-left transition-colors hover:bg-[#1B3B6F]/[0.03] ${selectedId === t._id ? 'bg-[#1B3B6F]/[0.05]' : ''}`}
              style={{ borderLeftColor: STATUS_STRIPE[t.status] || 'transparent' }}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EAF0FA] text-[#1B3B6F]"><UserIcon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-bold text-[#1A1D29]">{t.user?.fullName || 'User'}</span>
                  <span className="shrink-0 text-[10px] text-gray-400">{fmt(t.lastMessageAt)}</span>
                </div>
                <div className="truncate text-[12px] text-gray-500">{t.lastMessage || 'New conversation'}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-bold capitalize ${STATUS_STYLES[t.status] || 'bg-gray-100'}`}>{t.status}</span>
                  <span className="text-[9.5px] font-semibold uppercase tracking-wide text-gray-400">{t.userRole || t.user?.role || 'user'}</span>
                  {!!t.unreadForAdmin && <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-[#FF6B35] px-1 text-[9px] font-extrabold text-white shadow-sm">{t.unreadForAdmin}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {!selectedId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#1B3B6F]/5">
              <Inbox className="h-7 w-7 text-[#1B3B6F]/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-500">Select a ticket to reply</p>
              <p className="mt-0.5 text-xs text-gray-400">Choose a conversation from the queue on the left</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-[#F6F8FB] p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1B3B6F] text-[13px] font-bold text-white">
                  {(detail?.user?.fullName || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-extrabold text-[#1A1D29]">{detail?.user?.fullName || 'User'}</div>
                  <div className="truncate text-[11.5px] text-gray-500">{detail?.user?.phone} · <span className="capitalize">{detail?.userRole || detail?.user?.role || 'user'}</span></div>
                </div>
                {!!activeTicket?.unreadForAdmin && (
                  <span className="hidden shrink-0 rounded-full bg-[#FF6B35]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF6B35] sm:inline-block">{activeTicket?.unreadForAdmin} new</span>
                )}
              </div>
              <div className="relative shrink-0">
                <select value={detail?.status || 'open'} onChange={(e) => setStatus(e.target.value)} className="appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-2.5 pr-7 text-[12px] font-bold capitalize text-gray-600 shadow-sm outline-none transition-colors focus:border-[#1B3B6F]">
                  {['open', 'pending', 'resolved', 'closed'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto bg-[#F7F9FC] p-4">
              {loadingDetail ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div> : messages.map((m, i) => {
                const admin = m.senderRole === 'admin'
                return (
                  <div key={m.id || m._id || i} className={`flex ${admin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${admin ? 'rounded-br-md bg-[#1B3B6F] text-white' : 'rounded-bl-md border border-gray-100 bg-white text-[#1A1D29]'}`}>
                      {!admin && <div className="text-[10px] font-bold text-[#1B3B6F]">{m.senderName || 'User'}</div>}
                      <div className="text-[13.5px] leading-snug">{m.text}</div>
                      <div className={`mt-0.5 text-[9.5px] ${admin ? 'text-white/70' : 'text-gray-400'}`}>{fmt(m.createdAt)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-end gap-2 border-t border-gray-100 bg-white p-3.5">
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} rows={1} placeholder="Type a reply…" className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#1B3B6F] focus:ring-2 focus:ring-[#1B3B6F]/10" />
              <button onClick={send} disabled={!reply.trim() || sending} className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-[#1B3B6F] text-white shadow-sm transition-colors hover:bg-[#14305c] disabled:opacity-50 disabled:shadow-none">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
