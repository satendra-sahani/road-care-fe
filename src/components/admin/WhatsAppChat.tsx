'use client'

// Admin — two-way WhatsApp chat inbox.
// Left: conversations (users who messaged the business number). Right: the
// selected thread + a reply box. Inbound messages arrive via the Meta webhook
// and are polled here; free-text replies only work inside WhatsApp's 24-hour
// customer-service window (outside it, use the template sender page).
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { adminWhatsappAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, Send, Search, RefreshCw, MessageSquare, Check, CheckCheck, AlertTriangle } from 'lucide-react'

interface Chat {
  phone: string
  name: string
  lastBody: string
  lastType: string
  lastDirection: 'in' | 'out'
  lastAt: string
  unread: number
  phoneNumberId: string
}
interface Message {
  _id: string
  contactPhone: string
  direction: 'in' | 'out'
  type: string
  body: string
  status?: string
  createdAt: string
}

const fmtTime = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: '2-digit', month: 'short' })
}
const prettyPhone = (p: string) => (p?.length > 10 ? `+${p.slice(0, p.length - 10)} ${p.slice(-10)}` : p)

export function WhatsAppChat() {
  const [chats, setChats] = useState<Chat[]>([])
  const [active, setActive] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [windowOpen, setWindowOpen] = useState(false)
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const activePhone = active?.phone

  const loadChats = useCallback(async () => {
    try {
      const r = await adminWhatsappAPI.getChats()
      if (r.data?.success) setChats(r.data.data || [])
    } catch {
      /* keep last known list on transient errors */
    } finally {
      setLoadingChats(false)
    }
  }, [])

  const loadThread = useCallback(async (phone: string, showSpinner = false) => {
    if (showSpinner) setLoadingThread(true)
    try {
      const r = await adminWhatsappAPI.getMessages(phone)
      if (r.data?.success) {
        setMessages(r.data.data || [])
        setWindowOpen(!!r.data.windowOpen)
      }
    } catch {
      /* ignore transient poll errors */
    } finally {
      setLoadingThread(false)
    }
  }, [])

  // Initial + polling for the conversation list.
  useEffect(() => {
    loadChats()
    const id = setInterval(loadChats, 8000)
    return () => clearInterval(id)
  }, [loadChats])

  // Load + poll the open thread; clear its unread badge locally.
  useEffect(() => {
    if (!activePhone) return
    loadThread(activePhone, true)
    setChats((prev) => prev.map((c) => (c.phone === activePhone ? { ...c, unread: 0 } : c)))
    const id = setInterval(() => loadThread(activePhone), 6000)
    return () => clearInterval(id)
  }, [activePhone, loadThread])

  // Keep the thread scrolled to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!active || !text.trim()) return
    const body = text.trim()
    setSending(true)
    try {
      const r = await adminWhatsappAPI.reply({ toPhone: active.phone, text: body, phoneNumberId: active.phoneNumberId })
      if (r.data?.success) {
        setText('')
        setMessages((prev) => [...prev, r.data.data])
        loadChats()
      } else {
        toast.error(r.data?.message || 'Failed to send')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const filtered = chats.filter(
    (c) => !search.trim() || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search.replace(/\D/g, ''))
  )

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-[#1A1D29]">WhatsApp Chat</h1>
        <p className="text-sm text-slate-500">Reply to users who message your WhatsApp business number.</p>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:grid-cols-[320px_1fr]" style={{ height: 'calc(100vh - 180px)' }}>
        {/* ── Conversation list ── */}
        <div className="flex min-h-0 flex-col border-r border-gray-100">
          <div className="flex items-center gap-2 border-b border-gray-100 p-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or number"
                className="h-9 w-full rounded-lg border border-slate-200 pl-8 pr-3 text-sm outline-none focus:border-[#1B3B6F]/50" />
            </div>
            <button onClick={loadChats} title="Refresh" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingChats ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-[13px] text-slate-400">
                <MessageSquare className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                No conversations yet.<br />They appear when a user messages your number.
              </div>
            ) : (
              filtered.map((c) => (
                <button key={c.phone} onClick={() => setActive(c)}
                  className={`flex w-full items-center gap-3 border-b border-gray-50 px-3 py-3 text-left transition-colors hover:bg-slate-50 ${active?.phone === c.phone ? 'bg-slate-50' : ''}`}>
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#1B3B6F]/10 text-sm font-bold text-[#1B3B6F]">
                    {(c.name || c.phone).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-bold text-slate-800">{c.name || prettyPhone(c.phone)}</span>
                      <span className="shrink-0 text-[11px] text-slate-400">{fmtTime(c.lastAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] text-slate-500">
                        {c.lastDirection === 'out' ? 'You: ' : ''}{c.lastBody}
                      </span>
                      {c.unread > 0 && (
                        <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-green-500 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Thread ── */}
        <div className="flex min-h-0 flex-col bg-[#F5F7FA]">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1B3B6F]/10 text-[13px] font-bold text-[#1B3B6F]">
                  {(active.name || active.phone).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-bold text-slate-800">{active.name || prettyPhone(active.phone)}</div>
                  <div className="text-[12px] text-slate-400">{prettyPhone(active.phone)}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
                {loadingThread ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
                ) : (
                  messages.map((m) => {
                    const out = m.direction === 'out'
                    return (
                      <div key={m._id} className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-[13.5px] leading-snug shadow-sm ${out ? 'rounded-br-sm bg-[#DCF8C6] text-slate-800' : 'rounded-bl-sm bg-white text-slate-800'}`}>
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10.5px] ${out ? 'text-green-700/70' : 'text-slate-400'}`}>
                            {fmtTime(m.createdAt)}
                            {out && (m.status === 'read' ? <CheckCheck className="h-3 w-3 text-blue-500" /> : m.status === 'delivered' ? <CheckCheck className="h-3 w-3" /> : m.status === 'failed' ? <AlertTriangle className="h-3 w-3 text-red-500" /> : <Check className="h-3 w-3" />)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              {!windowOpen && (
                <div className="flex items-center gap-2 border-t border-amber-100 bg-amber-50 px-4 py-2 text-[12px] text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>The 24-hour reply window is closed. Send an approved{' '}
                    <Link href="/admin/communication/whatsapp" className="font-bold underline">template</Link>{' '}
                    to re-open the conversation.</span>
                </div>
              )}
              <div className="flex items-end gap-2 border-t border-gray-100 bg-white p-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  rows={1}
                  placeholder={windowOpen ? 'Type a message…' : 'Type a message… (may be blocked outside 24h window)'}
                  className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1B3B6F]/50"
                />
                <button onClick={send} disabled={sending || !text.trim()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1B3B6F] text-white transition-colors hover:bg-[#16305c] disabled:opacity-50">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
