'use client'

// Admin → Communication → WhatsApp → "Sent History": every message the business
// number sent, what became of it (sent → delivered → read, or failed) and whether
// the person wrote back — cards, a day-by-day chart, the rates, and the list.
// WhatsApp does not report link clicks, so "replied" is the engagement shown.
// Backend: /api/admin/whatsapp-contacts/sent (services/whatsappSentService.js).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Archive, ArrowDown, ArrowUp, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, CircleAlert, Copy, Download, Loader2, MessageSquareReply, MoreVertical,
  RefreshCw, RotateCw, Search, Send, Tag, XCircle,
} from 'lucide-react'
import { adminWhatsappContactsAPI } from '@/services/api'
import { downloadCsv } from '@/lib/contactsFile'
import { Confirm, Modal, NAVY, ORANGE, TagPill, WhatsAppIcon, field, initials, prettyPhone, tagColour, type WaSender } from './WhatsAppContactsParts'

type Totals = { sent: number; delivered: number; read: number; failed: number; replied: number }
type Day = Totals & { date: string }
type Stats = {
  totals: Totals; standing: { delivered: number; read: number; failed: number; waiting: number }
  rates: { delivery: number; read: number; reply: number; failure: number; optOut: number }; optOuts: number
  change: Record<keyof Totals, number | null>; days: Day[]
  byTemplate: (Totals & { template: string; readRate: number; replyRate: number })[]
  options: { templates: string[]; senders: string[]; campaigns: { _id: string; label: string }[] }
}
type Row = {
  _id: string; waMessageId?: string; contactPhone: string; contactName: string; tags: string[]; type: string; templateName?: string; body?: string
  status: string; error?: string; createdAt: string; deliveredAt?: string; readAt?: string; failedAt?: string; repliedAt?: string; canResend: boolean
}
type Reply = { phone: string; name: string; template: string; at: string; text: string; kind: string }

// one colour per measure, the same everywhere on the page (validated for colour-blind separation);
// "failed" wears the reserved critical red, never a series colour
const C = { sent: '#2a78d6', delivered: '#1baf7a', read: '#eda100', replied: '#4a3aa7', failed: '#d03b3b', optOut: '#ec835a', waiting: '#cbd5e1' }
const SERIES: { key: 'sent' | 'delivered' | 'read' | 'replied'; label: string }[] = [{ key: 'sent', label: 'Sent' }, { key: 'delivered', label: 'Delivered' }, { key: 'read', label: 'Read' }, { key: 'replied', label: 'Replied' }]
const n = (v: number) => v.toLocaleString('en-IN')
const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const time = (s?: string) => (s ? new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '')
const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const sel = 'h-10 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] font-medium text-[#0F172A] outline-none focus:border-[#F4511E]'
const card = 'rounded-2xl border border-[#E8EDF3] bg-white shadow-sm'

const STATUS: Record<string, { label: string; cls: string; Icon: typeof Check }> = {
  replied: { label: 'Replied', cls: 'bg-[#EDE9FE] text-[#4a3aa7]', Icon: MessageSquareReply },
  read: { label: 'Read', cls: 'bg-[#DBEAFE] text-[#1D4ED8]', Icon: CheckCheck },
  delivered: { label: 'Delivered', cls: 'bg-[#DCFCE7] text-[#15803D]', Icon: CheckCheck },
  sent: { label: 'Sent', cls: 'bg-[#E0F2FE] text-[#0369A1]', Icon: Check },
  accepted: { label: 'Sent', cls: 'bg-[#E0F2FE] text-[#0369A1]', Icon: Check },
  failed: { label: 'Failed', cls: 'bg-[#FEE2E2] text-[#B91C1C]', Icon: XCircle },
}
const standingOf = (r: Row) => (r.status === 'failed' ? 'failed' : r.repliedAt ? 'replied' : r.status)

function StatCard({ icon, tint, value, label, change, sub, goodWhenUp = true }: { icon: React.ReactNode; tint: string; value: number; label: string; change: number | null; sub: string; goodWhenUp?: boolean }) {
  const up = (change ?? 0) >= 0
  const good = change === null ? null : up === goodWhenUp
  return (
    <div data-sent-card className={`${card} flex items-center gap-3.5 p-4`}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: tint }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <b className="text-[22px] font-extrabold leading-tight text-[#0F172A]">{n(value)}</b>
          {change !== null && <span title="Compared with the same number of days before" className={`flex items-center text-[12px] font-bold ${good ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>{up ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}{Math.abs(change)}%</span>}
        </div>
        <p className="text-[13px] text-[#334155]">{label}</p>
        <p className="truncate text-[11.5px] text-[#64748B]">{sub}</p>
      </div>
    </div>
  )
}

/** Sent / delivered / read / replied per day (per week when the period is long). */
function ActivityChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState(-1)
  const buckets = useMemo(() => {
    if (days.length <= 45) return days.map((d) => ({ ...d, label: dayLabel(d.date), title: dayLabel(d.date) }))
    const out: (Day & { label: string; title: string })[] = []
    for (let i = 0; i < days.length; i += 7) {
      const w = days.slice(i, i + 7)
      const sum = (k: keyof Totals) => w.reduce((a, d) => a + d[k], 0)
      out.push({ date: w[0].date, sent: sum('sent'), delivered: sum('delivered'), read: sum('read'), replied: sum('replied'), failed: sum('failed'), label: dayLabel(w[0].date), title: `${dayLabel(w[0].date)} – ${dayLabel(w[w.length - 1].date)}` })
    }
    return out
  }, [days])
  const max = Math.max(1, ...buckets.map((b) => b.sent))
  const top = max <= 4 ? 4 : Math.ceil(max / (max > 100 ? 50 : max > 20 ? 10 : 4)) * (max > 100 ? 50 : max > 20 ? 10 : 4)
  const ticks = [top, top * 0.75, top * 0.5, top * 0.25, 0]
  const every = Math.max(1, Math.ceil(buckets.length / 11))
  const empty = buckets.every((b) => b.sent === 0)
  return (
    <div data-activity-chart>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h3 className="text-[15.5px] font-extrabold text-[#0F172A]">Message Activity</h3><p className="text-[12px] text-[#64748B]">Messages sent, delivered, read and replied to, {days.length > 45 ? 'week by week' : 'day by day'}</p></div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#334155]">{SERIES.map((s) => <span key={s.key} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: C[s.key] }} />{s.label}</span>)}</div>
      </div>
      <div className="relative mt-3 flex h-[190px] gap-2">
        <div className="flex w-9 shrink-0 flex-col justify-between pb-5 text-right text-[10.5px] text-[#94A3B8]">{ticks.map((t) => <span key={t}>{t >= 1000 ? `${Math.round(t / 100) / 10}K` : Math.round(t)}</span>)}</div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 bottom-5 top-1.5 flex flex-col justify-between">{ticks.map((t) => <i key={t} className="block h-px w-full bg-[#EEF2F6]" />)}</div>
          {empty && <p className="absolute inset-0 flex items-center justify-center pb-5 text-[12.5px] text-[#94A3B8]">Nothing was sent in this period.</p>}
          <div className="absolute inset-x-0 bottom-0 top-1.5 flex">
            {buckets.map((b, i) => (
              <div key={b.date} className="relative flex min-w-0 flex-1 flex-col" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)}>
                <div className={`flex flex-1 items-end justify-center gap-[2px] px-[1px] ${hover === i ? 'bg-[#F8FAFC]' : ''}`}>
                  {SERIES.map((s) => <i key={s.key} className="block w-full max-w-[7px] rounded-t-[3px]" style={{ height: `${(b[s.key] / top) * 100}%`, background: C[s.key], minHeight: b[s.key] ? 2 : 0 }} />)}
                </div>
                <span className="flex h-5 justify-center whitespace-nowrap pt-1 text-[10.5px] text-[#94A3B8]">{i % every === 0 ? b.label : ''}</span>
                {hover === i && (
                  <div className={`pointer-events-none absolute bottom-8 z-10 w-[150px] rounded-lg border border-[#E2E8F0] bg-white p-2 text-[11.5px] shadow-lg ${i > buckets.length / 2 ? 'right-1/2' : 'left-1/2'}`}>
                    <b className="mb-1 block text-[#0F172A]">{b.title}</b>
                    {SERIES.map((s) => <span key={s.key} className="flex items-center justify-between gap-2 text-[#475569]"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: C[s.key] }} />{s.label}</span><b className="text-[#0F172A]">{n(b[s.key])}</b></span>)}
                    {b.failed > 0 && <span className="flex items-center justify-between gap-2 text-[#475569]"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: C.failed }} />Failed</span><b className="text-[#0F172A]">{n(b.failed)}</b></span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Where every message of the period stands now — the parts add up to the total. */
function StatusDonut({ s }: { s: Stats }) {
  const parts = [
    { key: 'delivered', label: 'Delivered', value: s.standing.delivered, color: C.delivered }, { key: 'read', label: 'Read', value: s.standing.read, color: C.read },
    { key: 'failed', label: 'Failed', value: s.standing.failed, color: C.failed }, { key: 'waiting', label: 'Not delivered yet', value: s.standing.waiting, color: C.waiting },
  ]
  const total = s.totals.sent
  const R = 52; const L = 2 * Math.PI * R
  let at = 0
  return (
    <div data-status-donut>
      <h3 className="text-[15.5px] font-extrabold text-[#0F172A]">Message Status</h3>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <svg viewBox="0 0 140 140" className="h-[132px] w-[132px] shrink-0" role="img" aria-label={`Of ${total} messages: ${parts.map((p) => `${p.value} ${p.label.toLowerCase()}`).join(', ')}`}>
          <circle cx="70" cy="70" r={R} fill="none" stroke="#F1F5F9" strokeWidth="20" />
          {total > 0 && parts.filter((p) => p.value > 0).map((p) => {
            const len = (p.value / total) * L
            const gap = parts.filter((x) => x.value > 0).length > 1 ? 2 : 0
            const el = <circle key={p.key} cx="70" cy="70" r={R} fill="none" stroke={p.color} strokeWidth="20" strokeDasharray={`${Math.max(0, len - gap)} ${L}`} strokeDashoffset={-at} transform="rotate(-90 70 70)"><title>{`${p.label}: ${n(p.value)}`}</title></circle>
            at += len
            return el
          })}
          <text x="70" y="68" textAnchor="middle" className="fill-[#0F172A] text-[19px] font-extrabold">{n(total)}</text>
          <text x="70" y="85" textAnchor="middle" className="fill-[#64748B] text-[10.5px]">Total</text>
        </svg>
        <ul className="min-w-[150px] flex-1 space-y-1.5 text-[12.5px]">
          {parts.map((p) => <li key={p.key} className="flex items-center justify-between gap-3 text-[#475569]"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />{p.label}</span><span><b className="text-[#0F172A]">{n(p.value)}</b> <span className="text-[#94A3B8]">({total ? Math.round((p.value / total) * 1000) / 10 : 0}%)</span></span></li>)}
          <li className="flex items-center justify-between gap-3 border-t border-[#F1F5F9] pt-1.5 text-[#475569]"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: C.optOut }} />Opted out</span><b className="text-[#0F172A]">{n(s.optOuts)}</b></li>
        </ul>
      </div>
    </div>
  )
}

export function WhatsAppSentHistory({ senders, knownTags }: { senders: WaSender[]; knownTags: string[] }) {
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 29 * 86400000)))
  const [to, setTo] = useState(() => iso(new Date()))
  const [f, setF] = useState({ sender: 'all', template: 'all', status: 'all', tag: 'all', campaign: 'all' })
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [replies, setReplies] = useState<Reply[]>([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [menu, setMenu] = useState('')
  const [busy, setBusy] = useState(false)
  const [tagDlg, setTagDlg] = useState<'addTag' | 'removeTag' | null>(null)
  const [tagText, setTagText] = useState('')
  const [confirm, setConfirm] = useState<null | { title: string; body: React.ReactNode; action: string; run: () => Promise<void> }>(null)

  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 350); return () => clearTimeout(t) }, [search])
  const base = useMemo(() => {
    const q: Record<string, string> = { from, to }
    for (const k of ['sender', 'template', 'tag', 'campaign'] as const) if (f[k] !== 'all') q[k] = f[k]
    if (debounced) q.search = debounced
    return q
  }, [from, to, f.sender, f.template, f.tag, f.campaign, debounced])
  const baseKey = JSON.stringify(base)

  const loadStats = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([adminWhatsappContactsAPI.sentStats(base), adminWhatsappContactsAPI.sentReplies(base)])
      setStats(s.data?.data || null); setReplies(r.data?.data || [])
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not load the numbers') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseKey])
  const loadRows = useCallback(async () => {
    setLoading(true)
    try {
      const r = await adminWhatsappContactsAPI.sent({ ...base, ...(f.status !== 'all' ? { status: f.status } : {}), page, limit: perPage })
      setRows(r.data?.data || []); setPages(r.data?.pagination?.pages || 1); setTotal(r.data?.pagination?.total || 0)
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not load the messages') } finally { setLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseKey, f.status, page, perPage])
  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadRows() }, [loadRows])
  useEffect(() => { setPage(1); setPicked(new Set()) }, [baseKey, f.status, perPage])
  useEffect(() => { if (!menu) return; const off = () => setMenu(''); window.addEventListener('click', off); return () => window.removeEventListener('click', off) }, [menu])
  const refresh = () => { loadStats(); loadRows() }

  const senderName = (id: string) => { const s = senders.find((x) => x.id === id); return s ? s.display : `Number …${id.slice(-4)}` }
  const pageIds = rows.map((r) => r._id)
  const allPicked = pageIds.length > 0 && pageIds.every((id) => picked.has(id))
  const pickedFailed = rows.filter((r) => picked.has(r._id) && r.canResend).map((r) => r._id)
  const filtersOn = f.sender !== 'all' || f.template !== 'all' || f.status !== 'all' || f.tag !== 'all' || f.campaign !== 'all' || !!search
  const act = async (fn: () => Promise<any>) => {
    setBusy(true)
    try { const r = await fn(); toast[r.data?.success ? 'success' : 'error'](r.data?.message || (r.data?.success ? 'Done' : 'Could not do that')); if (r.data?.success) { setPicked(new Set()); refresh() } }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not do that') } finally { setBusy(false) }
  }
  const askResend = (ids: string[]) => setConfirm({
    title: `Send ${ids.length} failed message${ids.length === 1 ? '' : 's'} again?`, action: 'Send again',
    body: <>The same template with the same values goes out once more. People who have opted out since are skipped. WhatsApp charges for every template delivered.</>,
    run: () => act(() => adminWhatsappContactsAPI.sentResend(ids)),
  })
  const exportCsv = async () => {
    try {
      const r = await adminWhatsappContactsAPI.sent({ ...base, ...(f.status !== 'all' ? { status: f.status } : {}), page: 1, limit: 5000 })
      let list: Row[] = r.data?.data || []
      if (picked.size) list = list.filter((x) => picked.has(x._id))
      if (!list.length) { toast.error('Nothing to export'); return }
      const dt = (s?: string) => (s ? new Date(s).toLocaleString('en-IN') : '')
      downloadCsv(`whatsapp-sent-${from}-to-${to}.csv`, [
        ['Message ID', 'Recipient', 'Number', 'Tags', 'Template', 'Sent At', 'Delivered At', 'Read At', 'Replied At', 'Status', 'Failure Reason'],
        ...list.map((x) => [x.waMessageId || '', x.contactName, x.contactPhone.slice(-10), x.tags.join(', '), x.templateName || 'Chat message', dt(x.createdAt), dt(x.deliveredAt), dt(x.readAt), dt(x.repliedAt), STATUS[standingOf(x)]?.label || x.status, x.error || '']),
      ])
      toast.success(`${n(list.length)} messages exported`)
    } catch { toast.error('Could not export') }
  }
  const pager = useMemo(() => {
    const out: (number | '…')[] = []
    for (let p = 1; p <= pages; p++) if (p === 1 || p === pages || Math.abs(p - page) <= 1 || (page <= 3 && p <= 5) || (page >= pages - 2 && p >= pages - 4)) out.push(p); else if (out[out.length - 1] !== '…') out.push('…')
    return out
  }, [pages, page])
  const T = stats?.totals
  const bulkBtn = 'flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[12.5px] font-bold text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50'
  const step = (at?: string, colour = '#16A34A') => (at ? <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="flex h-4 w-4 items-center justify-center rounded-full text-white" style={{ background: colour }}><Check className="h-2.5 w-2.5" /></span>{time(at)}</span> : <span className="text-[#CBD5E1]">—</span>)

  return (
    <div className="space-y-4" data-sent-history>
      {/* title + period */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <WhatsAppIcon className="h-11 w-11" />
          <div><h2 className="text-[22px] font-extrabold leading-tight text-[#0F172A]">Sent History</h2><p className="text-[13px] text-[#64748B]">Track every WhatsApp message, its delivery status and who wrote back.</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] text-[#0F172A]"><CalendarDays className="h-4 w-4 text-[#64748B]" />
            <input type="date" value={from} max={to} aria-label="From date" onChange={(e) => e.target.value && setFrom(e.target.value)} className="bg-transparent outline-none" /><span className="text-[#94A3B8]">–</span>
            <input type="date" value={to} min={from} max={iso(new Date())} aria-label="To date" onChange={(e) => e.target.value && setTo(e.target.value)} className="bg-transparent outline-none" />
          </label>
          <select className={sel} aria-label="Sender number" value={f.sender} onChange={(e) => setF((x) => ({ ...x, sender: e.target.value }))}><option value="all">All numbers</option>{(stats?.options.senders || []).map((s) => <option key={s} value={s}>{senderName(s)}</option>)}</select>
          <button type="button" onClick={exportCsv} className="flex h-10 items-center gap-2 rounded-lg border border-[#0F172A] bg-white px-4 text-[13.5px] font-bold text-[#0F172A] hover:bg-[#F8FAFC]"><Download className="h-4 w-4" />Export</button>
          <button type="button" onClick={refresh} title="Refresh" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#475569]"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      {/* cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={<Send className="h-5 w-5" style={{ color: C.sent }} />} tint="#E3EEFB" value={T?.sent || 0} label="Total Sent" change={stats?.change.sent ?? null} sub="in this period" />
        <StatCard icon={<Check className="h-5 w-5" style={{ color: C.delivered }} />} tint="#DFF5EC" value={T?.delivered || 0} label="Delivered" change={stats?.change.delivered ?? null} sub={`${stats?.rates.delivery ?? 0}% delivery rate`} />
        <StatCard icon={<CheckCheck className="h-5 w-5" style={{ color: '#B47B00' }} />} tint="#FCF1D6" value={T?.read || 0} label="Read" change={stats?.change.read ?? null} sub={`${stats?.rates.read ?? 0}% of delivered`} />
        <StatCard icon={<MessageSquareReply className="h-5 w-5" style={{ color: C.replied }} />} tint="#E6E3F6" value={T?.replied || 0} label="Replied" change={stats?.change.replied ?? null} sub={`${stats?.rates.reply ?? 0}% reply rate`} />
        <StatCard icon={<XCircle className="h-5 w-5" style={{ color: C.failed }} />} tint="#FBE3E3" value={T?.failed || 0} label="Failed" change={stats?.change.failed ?? null} sub={`${stats?.rates.failure ?? 0}% failure rate`} goodWhenUp={false} />
      </div>

      {/* chart + rates + status */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,0.75fr)_minmax(0,0.85fr)]">
        <div className={`${card} min-w-0 p-4`}><ActivityChart days={stats?.days || []} /></div>
        <div className={`${card} min-w-0 p-4`} data-key-metrics>
          <h3 className="text-[15.5px] font-extrabold text-[#0F172A]">Key Metrics</h3>
          <ul className="mt-3 space-y-3.5">
            {[['Delivery Rate', stats?.rates.delivery, C.delivered, 'delivered ÷ sent'], ['Read Rate', stats?.rates.read, C.read, 'read ÷ delivered'], ['Reply Rate', stats?.rates.reply, C.replied, 'replied ÷ delivered'], ['Failure Rate', stats?.rates.failure, C.failed, 'failed ÷ sent'], ['Opt-out Rate', stats?.rates.optOut, C.optOut, 'opted out ÷ delivered']].map(([k, v, c, how]) => (
              <li key={k as string} title={how as string}>
                <span className="flex items-center justify-between text-[12.5px] text-[#475569]"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: c as string }} />{k}</span><b className="text-[#0F172A]">{Number(v || 0)}%</b></span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#F1F5F9]"><i className="block h-full rounded-full" style={{ width: `${Math.min(100, Number(v || 0))}%`, background: c as string }} /></span>
              </li>
            ))}
          </ul>
        </div>
        <div className={`${card} min-w-0 p-4`}>{stats ? <StatusDonut s={stats} /> : <Loader2 className="mx-auto mt-10 h-5 w-5 animate-spin text-[#94A3B8]" />}</div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#94A3B8]" /><input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search messages" placeholder="Search by name, phone, message ID…" className={`${field} pl-9`} /></div>
        <select className={sel} aria-label="Template" value={f.template} onChange={(e) => setF((x) => ({ ...x, template: e.target.value }))}><option value="all">All Templates</option>{(stats?.options.templates || []).map((t) => <option key={t} value={t}>{t}</option>)}<option value="chat">Chat messages (not templates)</option></select>
        <select className={sel} aria-label="Status" value={f.status} onChange={(e) => setF((x) => ({ ...x, status: e.target.value }))}><option value="all">All Status</option><option value="sent">Sent, not delivered yet</option><option value="delivered">Delivered, not read</option><option value="read">Read</option><option value="replied">Replied</option><option value="failed">Failed</option></select>
        <select className={sel} aria-label="Tag" value={f.tag} onChange={(e) => setF((x) => ({ ...x, tag: e.target.value }))}><option value="all">All Tags</option>{knownTags.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        <select className={`${sel} max-w-[230px]`} aria-label="Campaign" value={f.campaign} onChange={(e) => setF((x) => ({ ...x, campaign: e.target.value }))}><option value="all">All Campaigns</option><option value="single">Single sends only</option>{(stats?.options.campaigns || []).map((c) => <option key={c._id} value={c._id}>{c.label}</option>)}</select>
        {filtersOn && <button type="button" onClick={() => { setSearch(''); setF({ sender: 'all', template: 'all', status: 'all', tag: 'all', campaign: 'all' }) }} className="h-10 rounded-lg border border-[#BFDBFE] px-3 text-[13px] font-bold text-[#2563EB]">Clear Filters</button>}
      </div>

      {/* table */}
      <div className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF2F6] px-3 py-2.5">
          <label className="flex h-9 items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 text-[12.5px] font-bold text-[#0F172A]"><input type="checkbox" className="h-4 w-4 accent-[#2563EB]" aria-label="Select this page" checked={allPicked} onChange={() => setPicked((p) => { const s = new Set(p); if (allPicked) pageIds.forEach((id) => s.delete(id)); else pageIds.forEach((id) => s.add(id)); return s })} />{picked.size} selected</label>
          <button type="button" data-resend-failed className={bulkBtn} disabled={!pickedFailed.length || busy} title={picked.size && !pickedFailed.length ? 'None of the selected messages failed' : undefined} onClick={() => askResend(pickedFailed)}><RotateCw className="h-3.5 w-3.5" />Resend Failed{pickedFailed.length ? ` (${pickedFailed.length})` : ''}</button>
          <button type="button" className={bulkBtn} disabled={!picked.size || busy} onClick={() => { setTagText(''); setTagDlg('addTag') }}><Tag className="h-3.5 w-3.5" />Add Tag</button>
          <button type="button" className={bulkBtn} disabled={!picked.size || busy} onClick={() => { setTagText(''); setTagDlg('removeTag') }}><XCircle className="h-3.5 w-3.5" />Remove Tag</button>
          <button type="button" className={bulkBtn} onClick={exportCsv}><Download className="h-3.5 w-3.5" />Export</button>
          <button type="button" data-archive className={bulkBtn} disabled={!picked.size || busy} onClick={() => setConfirm({ title: `Archive ${picked.size} message${picked.size === 1 ? '' : 's'}?`, action: 'Archive', body: <>They leave Sent History and its numbers. They stay in the person’s chat.</>, run: () => act(() => adminWhatsappContactsAPI.sentArchive([...picked])) })}><Archive className="h-3.5 w-3.5" />Archive</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-[12.5px]">
            <thead><tr className="whitespace-nowrap text-[12px] font-bold text-[#475569]"><th className="w-10 px-3 py-2.5"></th><th className="px-2 py-2.5">#</th><th className="px-2 py-2.5">Message ID</th><th className="px-2 py-2.5">Recipient</th><th className="px-2 py-2.5">Contact / Tags</th><th className="px-2 py-2.5">Template</th><th className="px-2 py-2.5">Sent At</th><th className="px-2 py-2.5">Delivered</th><th className="px-2 py-2.5">Read</th><th className="px-2 py-2.5">Replied</th><th className="px-2 py-2.5">Status</th><th className="px-3 py-2.5 text-right">Actions</th></tr></thead>
            <tbody>
              {loading && rows.length === 0 && <tr><td colSpan={12} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-[#94A3B8]" /></td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={12} className="px-4 py-12 text-center"><b className="block text-[15px] text-[#0F172A]">{filtersOn ? 'No message matches these filters' : 'Nothing was sent in this period'}</b><span className="mt-1 block text-[13px] text-[#64748B]">{filtersOn ? 'Clear a filter or widen the dates.' : 'Send a template from the Contacts tab — it will show up here with its delivery status.'}</span></td></tr>}
              {rows.map((r, i) => {
                const st = STATUS[standingOf(r)] || { label: r.status, cls: 'bg-slate-100 text-slate-700', Icon: Check }
                return (
                  <tr key={r._id} data-sent-row className={`border-t border-[#F1F5F9] ${picked.has(r._id) ? 'bg-[#F8FAFF]' : ''}`}>
                    <td className="px-3 py-2"><input type="checkbox" className="h-4 w-4 accent-[#2563EB]" aria-label="Select message" checked={picked.has(r._id)} onChange={() => setPicked((p) => { const s = new Set(p); if (s.has(r._id)) s.delete(r._id); else s.add(r._id); return s })} /></td>
                    <td className="px-2 py-2 text-[#64748B]">{(page - 1) * perPage + i + 1}</td>
                    <td className="px-2 py-2 font-mono text-[11.5px] text-[#334155]" title={r.waMessageId}>{r.waMessageId ? `${r.waMessageId.slice(0, 12)}…` : '—'}</td>
                    <td className="px-2 py-2"><span className="flex items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E2E8F0] text-[11px] font-bold text-[#334155]">{initials(r.contactName)}</span><span className="min-w-0"><b className="block max-w-[150px] truncate font-semibold text-[#0F172A]">{r.contactName || 'Not in contacts'}</b><span className="whitespace-nowrap text-[11.5px] text-[#64748B]">{prettyPhone(r.contactPhone)}</span></span></span></td>
                    <td className="px-2 py-2"><span className="flex max-w-[170px] flex-wrap gap-1">{r.tags.slice(0, 2).map((t) => <TagPill key={t} tag={t} />)}{r.tags.length > 2 && <span className="text-[11px] text-[#64748B]" title={r.tags.slice(2).join(', ')}>+{r.tags.length - 2}</span>}{!r.tags.length && <span className="text-[#CBD5E1]">—</span>}</span></td>
                    <td className="max-w-[170px] px-2 py-2 text-[#0F172A]" title={r.body}><span className="block truncate">{r.templateName || <i className="text-[#64748B]">Chat message</i>}</span></td>
                    <td className="whitespace-nowrap px-2 py-2 text-[#334155]">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}<span className="block text-[11.5px] text-[#64748B]">{time(r.createdAt)}</span></td>
                    <td className="px-2 py-2 text-[#334155]">{step(r.deliveredAt)}</td>
                    <td className="px-2 py-2 text-[#334155]">{step(r.readAt, '#2563EB')}</td>
                    <td className="px-2 py-2 text-[#334155]">{step(r.repliedAt, C.replied)}</td>
                    <td className="px-2 py-2"><span title={r.status === 'failed' && r.error ? r.error : undefined} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-bold ${st.cls}`}><st.Icon className="h-3 w-3" />{st.label}</span>{r.status === 'failed' && r.error && <span className="mt-0.5 block max-w-[150px] truncate text-[10.5px] text-[#B91C1C]" title={r.error}>{r.error}</span>}</td>
                    <td className="px-3 py-2">
                      <span className="relative flex justify-end">
                        <button type="button" aria-label="More actions" onClick={(e) => { e.stopPropagation(); setMenu((m) => (m === r._id ? '' : r._id)) }} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#475569] hover:bg-[#F1F5F9]"><MoreVertical className="h-[18px] w-[18px]" /></button>
                        {menu === r._id && (
                          <span className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white py-1 text-left text-[13px] shadow-lg">
                            {r.canResend && <button type="button" className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[#F8FAFC]" onClick={() => askResend([r._id])}><RotateCw className="h-3.5 w-3.5" />Send again</button>}
                            {r.waMessageId && <button type="button" className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[#F8FAFC]" onClick={() => { navigator.clipboard?.writeText(r.waMessageId || ''); toast.success('Message ID copied') }}><Copy className="h-3.5 w-3.5" />Copy message ID</button>}
                            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[#F8FAFC]" onClick={() => act(() => adminWhatsappContactsAPI.sentArchive([r._id]))}><Archive className="h-3.5 w-3.5" />Archive</button>
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF2F6] px-4 py-2.5 text-[12.5px] text-[#475569]">
          <span data-sent-showing>{total ? `Showing ${n((page - 1) * perPage + 1)}–${n(Math.min(total, page * perPage))} of ${n(total)} messages` : 'No messages'}</span>
          <span className="flex items-center gap-1">
            <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            {pager.map((p, i) => p === '…' ? <span key={`e${i}`} className="px-1">…</span> : <button key={p} type="button" onClick={() => setPage(p)} className={`h-8 min-w-8 rounded-lg px-2 text-[12.5px] font-bold ${p === page ? 'text-white' : 'border border-[#E2E8F0] text-[#0F172A]'}`} style={p === page ? { background: NAVY } : undefined}>{p}</button>)}
            <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </span>
          <label className="flex items-center gap-2">Rows per page<select className={`${sel} h-8`} aria-label="Rows per page" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>{[8, 20, 50, 100].map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
        </div>
      </div>

      {/* templates + replies */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className={`${card} min-w-0 p-4`} data-template-performance>
          <h3 className="text-[15.5px] font-extrabold text-[#0F172A]">Replies &amp; Engagement by Template</h3>
          <p className="text-[12px] text-[#64748B]">WhatsApp does not report link clicks, so a reply is the engagement measured here: the person wrote back within 3 days.</p>
          {(stats?.byTemplate || []).length === 0 ? <p className="py-6 text-center text-[12.5px] text-[#94A3B8]">No templates were sent in this period.</p> : (
            <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[460px] text-left text-[12.5px]">
              <thead><tr className="text-[11.5px] font-bold uppercase text-[#64748B]"><th className="py-2">Template</th><th className="px-2 py-2 text-right">Sent</th><th className="px-2 py-2 text-right">Delivered</th><th className="px-2 py-2 text-right">Read</th><th className="px-2 py-2 text-right">Replied</th><th className="py-2 text-right">Reply rate</th></tr></thead>
              <tbody>{stats!.byTemplate.map((t) => <tr key={t.template} className="border-t border-[#F1F5F9]"><td className="max-w-[200px] truncate py-2 font-semibold text-[#0F172A]">{t.template}</td><td className="px-2 py-2 text-right">{n(t.sent)}</td><td className="px-2 py-2 text-right">{n(t.delivered)}</td><td className="px-2 py-2 text-right">{n(t.read)} <span className="text-[#94A3B8]">({t.readRate}%)</span></td><td className="px-2 py-2 text-right">{n(t.replied)}</td><td className="py-2 text-right font-bold text-[#0F172A]">{t.replyRate}%</td></tr>)}</tbody>
            </table></div>
          )}
        </div>
        <div className={`${card} min-w-0 p-4`} data-recent-replies>
          <h3 className="text-[15.5px] font-extrabold text-[#0F172A]">Recent Replies</h3>
          {replies.length === 0 ? <p className="py-6 text-center text-[12.5px] text-[#94A3B8]">Nobody has replied in this period yet.</p> : (
            <ul className="mt-2">{replies.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 border-t border-[#F1F5F9] py-2 first:border-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E2E8F0] text-[11px] font-bold text-[#334155]">{initials(r.name)}</span>
                <span className="min-w-0 flex-1"><b className="block truncate text-[12.5px] text-[#0F172A]">{r.name || prettyPhone(r.phone)}</b><span className="block truncate text-[12px] text-[#475569]">{r.text || (r.kind === 'text' ? '(message)' : `(${r.kind})`)}</span>{r.template && <span className="text-[11px] text-[#94A3B8]">after “{r.template}”</span>}</span>
                <span className="shrink-0 text-right text-[11px] text-[#64748B]">{new Date(r.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}<span className="block">{time(r.at)}</span></span>
              </li>
            ))}</ul>
          )}
        </div>
      </div>
      <p className="flex items-start gap-1.5 text-[11.5px] text-[#94A3B8]"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />Delivered and read times come from WhatsApp. “Read” is only reported for people who keep read receipts on, so the real number is at least this much. Messages sent before this page existed show their status but not the times.</p>

      {tagDlg && (
        <Modal title={tagDlg === 'addTag' ? `Tag the ${picked.size} recipient${picked.size === 1 ? '' : 's'}` : `Remove a tag from the ${picked.size} recipient${picked.size === 1 ? '' : 's'}`} onClose={() => setTagDlg(null)} busy={busy}>
          {tagDlg === 'addTag' && <input autoFocus value={tagText} onChange={(e) => setTagText(e.target.value)} aria-label="Tag" placeholder="e.g. Follow-up" className={field} />}
          <div className="mt-2 flex flex-wrap gap-1.5">{knownTags.map((t) => <button key={t} type="button" onClick={() => setTagText(t)} className={`rounded-md px-2 py-1 text-[12px] font-semibold ${tagColour(t)} ${tagText === t ? 'ring-2 ring-[#0F172A]/40' : ''}`}>{t}</button>)}</div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setTagDlg(null)} className="h-10 rounded-lg border border-[#E2E8F0] px-4 text-[13.5px] font-bold text-[#334155]">Cancel</button>
            <button type="button" disabled={!tagText.trim() || busy} onClick={() => act(() => adminWhatsappContactsAPI.sentTag([...picked], tagDlg, tagText)).then(() => setTagDlg(null))} className="h-10 rounded-lg px-5 text-[13.5px] font-bold text-white disabled:opacity-50" style={{ background: ORANGE }}>{tagDlg === 'addTag' ? 'Add Tag' : 'Remove Tag'}</button>
          </div>
        </Modal>
      )}
      {confirm && <Confirm title={confirm.title} body={confirm.body} action={confirm.action} busy={busy} onNo={() => setConfirm(null)} onYes={async () => { await confirm.run(); setConfirm(null) }} />}
    </div>
  )
}
