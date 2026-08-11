'use client'

// Admin — WhatsApp-style two-way chat inbox.
// Inbound messages arrive via the Meta webhook and are polled here (fast, so it
// feels realtime); the admin can reply with text, files, emoji reactions and
// quoted replies. Free-text/media only works inside WhatsApp's 24-hour window.
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { adminWhatsappAPI } from '@/services/api'
import { toast } from 'sonner'
import {
  Loader2, Send, Search, RefreshCw, MessageSquare, Check, CheckCheck, AlertTriangle,
  Paperclip, X, Reply, SmilePlus, FileText, Download, Play, Bell, BellOff,
  Maximize2, ExternalLink,
} from 'lucide-react'

interface Chat {
  phone: string; name: string; lastBody: string; lastType: string
  lastDirection: 'in' | 'out'; lastAt: string; unread: number; phoneNumberId: string
}
interface Reaction { emoji: string; by: 'user' | 'admin' | '' }
interface Message {
  _id: string; waMessageId?: string; contactPhone: string
  direction: 'in' | 'out'; type: string; body: string; status?: string
  mediaId?: string; mediaMime?: string; mediaFilename?: string
  contextWaId?: string; reaction?: Reaction; createdAt: string
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const fmtListTime = (iso: string) => {
  const d = new Date(iso), now = new Date()
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: '2-digit', month: 'short' })
}
const dayLabel = (iso: string) => {
  const d = new Date(iso), now = new Date()
  const y = new Date(now); y.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
}
const prettyPhone = (p: string) => (p?.length > 10 ? `+${p.slice(0, p.length - 10)} ${p.slice(-10)}` : p)
const previewText = (t: string, type: string) => {
  if (t) return t
  switch (type) {
    case 'image': return '📷 Photo'
    case 'video': return '🎥 Video'
    case 'audio': return '🎵 Audio'
    case 'sticker': return '🎨 Sticker'
    case 'document': return '📄 Document'
    default: return type === 'text' ? '' : `[${type}]`
  }
}

// Cache media object-URLs by mediaId so re-polling doesn't refetch/flicker.
const mediaUrlCache = new Map<string, string>()
type LightboxItem = { url: string; type: 'image' | 'video'; name?: string }

async function fetchMediaUrl(mediaId: string): Promise<string> {
  const cached = mediaUrlCache.get(mediaId)
  if (cached) return cached
  const r = await adminWhatsappAPI.mediaBlob(mediaId)
  const url = URL.createObjectURL(r.data)
  mediaUrlCache.set(mediaId, url)
  return url
}

function useMediaUrl(mediaId?: string) {
  const [url, setUrl] = useState<string>(() => (mediaId && mediaUrlCache.get(mediaId)) || '')
  useEffect(() => {
    let alive = true
    if (!mediaId || mediaUrlCache.get(mediaId)) return
    fetchMediaUrl(mediaId).then((u) => { if (alive) setUrl(u) }).catch(() => {})
    return () => { alive = false }
  }, [mediaId])
  return url
}

// Short beep via WebAudio (no asset needed) for new-message pings.
const playPing = () => {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext)
    if (!Ctx) return
    const ctx = new Ctx()
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = 880
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
    o.start(); o.stop(ctx.currentTime + 0.26)
    setTimeout(() => ctx.close(), 400)
  } catch { /* ignore */ }
}

// ── Media bubbles (consistent thumbnail size + full-view) ───────────────────
const THUMB = 'block h-auto max-h-[280px] w-full max-w-[260px] rounded-lg object-cover'
const loadingBox = (w = 'w-[220px]', h = 'h-[160px]') =>
  <div className={`flex ${w} ${h} items-center justify-center rounded-lg bg-black/5`}><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>

function ImageMsg({ m, onOpen }: { m: Message; onOpen?: (i: LightboxItem) => void }) {
  const url = useMediaUrl(m.mediaId)
  if (!url) return loadingBox('w-[200px]', 'h-[200px]')
  return (
    <div className="group/img relative w-fit cursor-pointer" onClick={() => onOpen?.({ url, type: 'image', name: m.mediaFilename || 'photo.jpg' })}>
      <img src={url} alt="" className={THUMB} />
      <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover/img:opacity-100">
        <Maximize2 className="h-3.5 w-3.5" />
      </span>
    </div>
  )
}

function VideoMsg({ m, onOpen }: { m: Message; onOpen?: (i: LightboxItem) => void }) {
  const url = useMediaUrl(m.mediaId)
  if (!url) return loadingBox('w-[240px]', 'h-[160px]')
  return (
    <div className="group/vid relative w-fit">
      <video src={url} className={THUMB} />
      <button onClick={() => onOpen?.({ url, type: 'video', name: m.mediaFilename || 'video.mp4' })}
        className="absolute inset-0 m-auto grid h-12 w-12 place-items-center rounded-full bg-black/55 text-white transition-transform hover:scale-110">
        <Play className="h-6 w-6 fill-white" />
      </button>
      <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover/vid:opacity-100">
        <Maximize2 className="h-3.5 w-3.5" />
      </span>
    </div>
  )
}

function AudioMsg({ m }: { m: Message }) {
  const url = useMediaUrl(m.mediaId)
  return url ? <audio src={url} controls className="w-[240px]" /> : <div className="text-xs text-slate-400">Loading audio…</div>
}

// Documents load lazily — only fetched when the admin opens/downloads them.
function DocMsg({ m }: { m: Message }) {
  const [busy, setBusy] = useState<'open' | 'download' | null>(null)
  const act = async (mode: 'open' | 'download') => {
    if (!m.mediaId) return
    setBusy(mode)
    try {
      const url = await fetchMediaUrl(m.mediaId)
      if (mode === 'open') {
        window.open(url, '_blank', 'noopener')
      } else {
        const a = document.createElement('a')
        a.href = url; a.download = m.mediaFilename || 'document'
        document.body.appendChild(a); a.click(); a.remove()
      }
    } catch { /* ignore */ } finally { setBusy(null) }
  }
  return (
    <div className="w-[240px] rounded-lg bg-black/5 p-2.5">
      <div className="flex items-center gap-2">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white"><FileText className="h-5 w-5 text-[#1B3B6F]" /></div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-slate-700">{m.mediaFilename || 'Document'}</p>
          <p className="text-[11px] uppercase text-slate-400">{(m.mediaMime || '').split('/')[1] || 'file'}</p>
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
        <button onClick={() => act('open')} disabled={!!busy}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-white px-2 py-1.5 text-[12px] font-semibold text-[#1B3B6F] hover:bg-slate-50 disabled:opacity-50">
          {busy === 'open' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />} Open
        </button>
        <button onClick={() => act('download')} disabled={!!busy}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-white px-2 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
          {busy === 'download' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Save
        </button>
      </div>
    </div>
  )
}

function MediaContent({ m, onOpen }: { m: Message; onOpen?: (i: LightboxItem) => void }) {
  if (!m.mediaId) return null
  if (m.type === 'image' || m.type === 'sticker') return <ImageMsg m={m} onOpen={onOpen} />
  if (m.type === 'video') return <VideoMsg m={m} onOpen={onOpen} />
  if (m.type === 'audio') return <AudioMsg m={m} />
  return <DocMsg m={m} />
}

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
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [reactionFor, setReactionFor] = useState<string | null>(null)
  const [notifOn, setNotifOn] = useState(false)
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const chatTimesRef = useRef<Record<string, string>>({})
  const firstChatsLoad = useRef(true)
  const activePhone = active?.phone

  // Map waMessageId → message, for rendering quoted replies.
  const byWaId: Record<string, Message> = {}
  for (const m of messages) if (m.waMessageId) byWaId[m.waMessageId] = m

  const notify = useCallback((title: string, body: string) => {
    playPing()
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
        const n = new Notification(title, { body, icon: '/logo.png', tag: 'wa-chat' })
        n.onclick = () => { window.focus(); n.close() }
      }
    } catch { /* ignore */ }
  }, [])

  const enableNotifications = async () => {
    try {
      if (typeof Notification === 'undefined') { toast.error('Notifications not supported'); return }
      const perm = await Notification.requestPermission()
      setNotifOn(perm === 'granted')
      if (perm === 'granted') toast.success('Notifications on'); else toast.error('Notifications blocked in browser')
    } catch { /* ignore */ }
  }

  const loadChats = useCallback(async () => {
    try {
      const r = await adminWhatsappAPI.getChats()
      if (r.data?.success) {
        const list: Chat[] = r.data.data || []
        // Detect newly-arrived inbound messages → ping + desktop notification.
        if (!firstChatsLoad.current) {
          for (const c of list) {
            const prev = chatTimesRef.current[c.phone]
            if (c.lastDirection === 'in' && (!prev || new Date(c.lastAt) > new Date(prev)) && c.phone !== activePhone) {
              notify(c.name || prettyPhone(c.phone), previewText(c.lastBody, c.lastType) || 'New message')
            }
          }
        }
        chatTimesRef.current = Object.fromEntries(list.map((c) => [c.phone, c.lastAt]))
        firstChatsLoad.current = false
        setChats(list)
      }
    } catch { /* keep last list on transient errors */ } finally { setLoadingChats(false) }
  }, [activePhone, notify])

  const prevThreadCount = useRef(0)
  const loadThread = useCallback(async (phone: string, showSpinner = false) => {
    if (showSpinner) { setLoadingThread(true); prevThreadCount.current = 0 }
    try {
      const r = await adminWhatsappAPI.getMessages(phone)
      if (r.data?.success) {
        const data: Message[] = r.data.data || []
        // Ping if a new inbound landed in the open thread.
        const inbound = data.filter((m) => m.direction === 'in')
        if (!showSpinner && data.length > prevThreadCount.current && inbound.length) {
          const last = data[data.length - 1]
          if (last.direction === 'in') playPing()
        }
        prevThreadCount.current = data.length
        setMessages(data)
        setWindowOpen(!!r.data.windowOpen)
      }
    } catch { /* ignore transient poll errors */ } finally { setLoadingThread(false) }
  }, [])

  // Conversation list — fast poll for realtime feel.
  useEffect(() => {
    loadChats()
    const id = setInterval(loadChats, 3000)
    return () => clearInterval(id)
  }, [loadChats])

  // Open thread — fast poll + clear unread locally.
  useEffect(() => {
    if (!activePhone) return
    setReplyTo(null); setPendingFile(null); setReactionFor(null)
    loadThread(activePhone, true)
    setChats((prev) => prev.map((c) => (c.phone === activePhone ? { ...c, unread: 0 } : c)))
    const id = setInterval(() => loadThread(activePhone), 2500)
    return () => clearInterval(id)
  }, [activePhone, loadThread])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  // Ask for notification permission on mount (best-effort).
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotifOn(Notification.permission === 'granted')
      if (Notification.permission === 'default') Notification.requestPermission().then((p) => setNotifOn(p === 'granted')).catch(() => {})
    }
  }, [])

  const send = async () => {
    if (!active) return
    if (pendingFile) return sendFile()
    if (!text.trim()) return
    const body = text.trim()
    setSending(true)
    try {
      const r = await adminWhatsappAPI.reply({
        toPhone: active.phone, text: body, phoneNumberId: active.phoneNumberId,
        contextMessageId: replyTo?.waMessageId,
      })
      if (r.data?.success) {
        setText(''); setReplyTo(null)
        setMessages((prev) => [...prev, r.data.data]); loadChats()
      } else toast.error(r.data?.message || 'Failed to send')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to send') } finally { setSending(false) }
  }

  const sendFile = async () => {
    if (!active || !pendingFile) return
    setSending(true)
    try {
      const form = new FormData()
      form.append('file', pendingFile)
      form.append('toPhone', active.phone)
      if (active.phoneNumberId) form.append('phoneNumberId', active.phoneNumberId)
      if (text.trim()) form.append('caption', text.trim())
      const r = await adminWhatsappAPI.sendMedia(form)
      if (r.data?.success) {
        setText(''); setPendingFile(null); setReplyTo(null)
        setMessages((prev) => [...prev, r.data.data]); loadChats()
      } else toast.error(r.data?.message || 'Failed to send file')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to send file') } finally { setSending(false) }
  }

  const react = async (m: Message, emoji: string) => {
    setReactionFor(null)
    if (!active || !m.waMessageId) return
    // Toggle off if the same emoji is tapped again.
    const same = m.reaction?.by === 'admin' && m.reaction?.emoji === emoji
    setMessages((prev) => prev.map((x) => (x._id === m._id ? { ...x, reaction: { emoji: same ? '' : emoji, by: 'admin' } } : x)))
    try {
      await adminWhatsappAPI.react({ toPhone: active.phone, messageId: m.waMessageId, emoji: same ? '' : emoji, phoneNumberId: active.phoneNumberId })
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to react') }
  }

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setPendingFile(f)
    if (fileRef.current) fileRef.current.value = ''
  }

  const filtered = chats.filter(
    (c) => !search.trim() || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search.replace(/\D/g, ''))
  )

  // WhatsApp doodle-ish background (subtle).
  const chatBg = {
    backgroundColor: '#ECE5DD',
    backgroundImage: 'radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)',
    backgroundSize: '18px 18px',
  } as React.CSSProperties

  let lastDay = ''

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#1A1D29]">WhatsApp Chat</h1>
          <p className="text-sm text-slate-500">Reply to users who message your WhatsApp business number.</p>
        </div>
        <button onClick={enableNotifications}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${notifOn ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
          {notifOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          {notifOn ? 'Notifications on' : 'Turn on notifications'}
        </button>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:grid-cols-[330px_1fr]" style={{ height: 'calc(100vh - 180px)' }}>
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
                  className={`flex w-full items-center gap-3 border-b border-gray-50 px-3 py-3 text-left transition-colors hover:bg-slate-50 ${active?.phone === c.phone ? 'bg-slate-100' : ''}`}>
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1B3B6F]/10 text-sm font-bold text-[#1B3B6F]">
                    {(c.name || c.phone).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-bold text-slate-800">{c.name || prettyPhone(c.phone)}</span>
                      <span className={`shrink-0 text-[11px] ${c.unread > 0 ? 'font-bold text-emerald-600' : 'text-slate-400'}`}>{fmtListTime(c.lastAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] text-slate-500">
                        {c.lastDirection === 'out' ? 'You: ' : ''}{previewText(c.lastBody, c.lastType)}
                      </span>
                      {c.unread > 0 && (
                        <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Thread ── */}
        <div className="flex min-h-0 flex-col" style={active ? chatBg : { backgroundColor: '#F5F7FA' }}>
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-black/5 bg-[#F0F2F5] px-4 py-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1B3B6F]/10 text-[13px] font-bold text-[#1B3B6F]">
                  {(active.name || active.phone).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-bold text-slate-800">{active.name || prettyPhone(active.phone)}</div>
                  <div className="text-[12px] text-slate-500">{prettyPhone(active.phone)}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4 md:px-8" onClick={() => setReactionFor(null)}>
                {loadingThread ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                ) : (
                  messages.map((m) => {
                    const out = m.direction === 'out'
                    const quoted = m.contextWaId ? byWaId[m.contextWaId] : undefined
                    const day = dayLabel(m.createdAt)
                    const showDay = day !== lastDay
                    lastDay = day
                    return (
                      <div key={m._id}>
                        {showDay && (
                          <div className="my-3 flex justify-center">
                            <span className="rounded-lg bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm">{day}</span>
                          </div>
                        )}
                        <div className={`group flex items-center gap-1.5 ${out ? 'justify-end' : 'justify-start'}`}>
                          {/* hover actions (left of outbound) */}
                          {out && (
                            <MsgActions m={m} onReply={() => setReplyTo(m)} onReact={() => setReactionFor(reactionFor === m._id ? null : m._id)} />
                          )}
                          <div className="relative max-w-[78%]">
                            <div className={`rounded-lg px-2.5 py-1.5 text-[13.5px] leading-snug shadow-sm ${out ? 'rounded-tr-none bg-[#D9FDD3] text-slate-800' : 'rounded-tl-none bg-white text-slate-800'}`}>
                              {/* quoted reply */}
                              {quoted && (
                                <div className="mb-1 border-l-[3px] border-emerald-500 bg-black/5 px-2 py-1 rounded">
                                  <p className="text-[11px] font-bold text-emerald-700">{quoted.direction === 'out' ? 'You' : (active.name || 'User')}</p>
                                  <p className="truncate text-[12px] text-slate-500">{previewText(quoted.body, quoted.type)}</p>
                                </div>
                              )}
                              {(m.mediaId) && <div className="mb-1"><MediaContent m={m} onOpen={setLightbox} /></div>}
                              {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                              <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10.5px] ${out ? 'text-emerald-800/60' : 'text-slate-400'}`}>
                                {fmtTime(m.createdAt)}
                                {out && (m.status === 'read' ? <CheckCheck className="h-3.5 w-3.5 text-sky-500" /> : m.status === 'delivered' ? <CheckCheck className="h-3.5 w-3.5" /> : m.status === 'failed' ? <AlertTriangle className="h-3 w-3 text-red-500" /> : <Check className="h-3.5 w-3.5" />)}
                              </div>
                            </div>
                            {/* reaction badge */}
                            {m.reaction?.emoji && (
                              <span className={`absolute -bottom-2 ${out ? 'left-2' : 'right-2'} rounded-full bg-white px-1 text-[12px] shadow`}>{m.reaction.emoji}</span>
                            )}
                            {/* reaction picker */}
                            {reactionFor === m._id && (
                              <div className={`absolute z-10 ${out ? 'right-0' : 'left-0'} -top-10 flex gap-0.5 rounded-full bg-white px-1.5 py-1 shadow-lg`} onClick={(e) => e.stopPropagation()}>
                                {REACTIONS.map((e) => (
                                  <button key={e} onClick={() => react(m, e)} className="rounded-full px-1 text-[18px] leading-none transition-transform hover:scale-125">{e}</button>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* hover actions (right of inbound) */}
                          {!out && (
                            <MsgActions m={m} onReply={() => setReplyTo(m)} onReact={() => setReactionFor(reactionFor === m._id ? null : m._id)} />
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* 24h-window notice */}
              {!windowOpen && (
                <div className="flex items-center gap-2 border-t border-amber-100 bg-amber-50 px-4 py-2 text-[12px] text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>The 24-hour reply window is closed. Send an approved{' '}
                    <Link href="/admin/communication/whatsapp" className="font-bold underline">template</Link>{' '}to re-open the chat.</span>
                </div>
              )}

              {/* Reply preview */}
              {replyTo && (
                <div className="flex items-center gap-2 border-t border-black/5 bg-[#F0F2F5] px-3 pt-2">
                  <div className="flex-1 border-l-[3px] border-emerald-500 bg-white px-2 py-1 rounded">
                    <p className="text-[11px] font-bold text-emerald-700">{replyTo.direction === 'out' ? 'You' : (active.name || 'User')}</p>
                    <p className="truncate text-[12px] text-slate-500">{previewText(replyTo.body, replyTo.type)}</p>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-black/5"><X className="h-4 w-4" /></button>
                </div>
              )}

              {/* Pending file preview */}
              {pendingFile && (
                <div className="flex items-center gap-2 border-t border-black/5 bg-[#F0F2F5] px-3 pt-2">
                  <div className="flex flex-1 items-center gap-2 rounded bg-white px-2 py-1.5">
                    {pendingFile.type.startsWith('image/')
                      ? <img src={URL.createObjectURL(pendingFile)} alt="" className="h-10 w-10 rounded object-cover" />
                      : <FileText className="h-6 w-6 text-[#1B3B6F]" />}
                    <span className="max-w-[220px] truncate text-[12.5px] text-slate-600">{pendingFile.name}</span>
                  </div>
                  <button onClick={() => setPendingFile(null)} className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-black/5"><X className="h-4 w-4" /></button>
                </div>
              )}

              {/* Composer */}
              <div className="flex items-end gap-2 border-t border-black/5 bg-[#F0F2F5] p-2.5">
                <input ref={fileRef} type="file" hidden onChange={onPickFile}
                  accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" />
                <button onClick={() => fileRef.current?.click()} title="Attach file"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-black/5">
                  <Paperclip className="h-5 w-5" />
                </button>
                <textarea
                  value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  rows={1}
                  placeholder={pendingFile ? 'Add a caption…' : windowOpen ? 'Type a message…' : 'Type a message… (may be blocked outside 24h)'}
                  className="max-h-28 min-h-[42px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1B3B6F]/40"
                />
                <button onClick={send} disabled={sending || (!text.trim() && !pendingFile)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#12A34B] text-white transition-colors hover:bg-[#0f8f41] disabled:opacity-50">
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full-screen media viewer */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <div className="absolute right-4 top-4 flex gap-2">
            <a href={lightbox.url} download={lightbox.name || 'file'} onClick={(e) => e.stopPropagation()}
              title="Download" className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
              <Download className="h-5 w-5" />
            </a>
            <button onClick={() => setLightbox(null)} title="Close"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
              <X className="h-5 w-5" />
            </button>
          </div>
          {lightbox.type === 'video'
            ? <video src={lightbox.url} controls autoPlay className="max-h-[90vh] max-w-[92vw] rounded-lg" onClick={(e) => e.stopPropagation()} />
            : <img src={lightbox.url} alt="" className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />}
        </div>
      )}
    </div>
  )
}

// Hover-revealed reply + react buttons for a message.
function MsgActions({ m, onReply, onReact }: { m: Message; onReply: () => void; onReact: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      <button onClick={(e) => { e.stopPropagation(); onReact() }} title="React"
        className="grid h-7 w-7 place-items-center rounded-full bg-white/70 text-slate-500 shadow-sm hover:bg-white"><SmilePlus className="h-4 w-4" /></button>
      <button onClick={(e) => { e.stopPropagation(); onReply() }} title="Reply"
        className="grid h-7 w-7 place-items-center rounded-full bg-white/70 text-slate-500 shadow-sm hover:bg-white"><Reply className="h-4 w-4" /></button>
    </div>
  )
}
