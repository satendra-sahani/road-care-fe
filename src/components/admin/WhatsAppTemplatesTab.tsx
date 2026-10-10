'use client'

// Admin → Communication → WhatsApp → "Templates": every template of the WhatsApp
// account, as the customer sees it — the sample banner, the text with its example
// values, the buttons — with its approval status. Search, category / language /
// status / date filters, grid or list, pages of 9. View Details, Send Test (to one
// number), Use Template (hands it to the send dialog).
// Templates themselves are created and approved in Meta's WhatsApp Manager.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle, CalendarDays, CheckCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock, Copy, ExternalLink, Eye, FileText, LayoutGrid, List, Loader2, MoreVertical, Phone,
  Play, RefreshCw, Search, Send, Upload, X, XCircle,
} from 'lucide-react'
import { adminWhatsappAPI } from '@/services/api'
import { renderWaText } from './WhatsAppSender'
import { Modal, NAVY, ORANGE, field, prettyPhone, type WaSender } from './WhatsAppContactsParts'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'

export interface WaTemplateFull {
  id: string; name: string; language: string; status: string; category: string; rejectedReason: string; quality: string; updatedAt: string | null
  headerType: string | null; headerText: string; headerSample: string; bodyText: string; varCount: number; bodyExample: string[]; footerText: string
  buttons: { type: string; text: string; url?: string; phone?: string }[]
}
export const WA_MANAGER_URL = 'https://business.facebook.com/wa/manage/message-templates/'

const LANG: Record<string, string> = { en: 'EN', en_US: 'EN', en_GB: 'EN', hi: 'HI', hi_IN: 'HI' }
const LANG_NAME: Record<string, string> = { en: 'English', en_US: 'English (US)', en_GB: 'English (UK)', hi: 'Hindi' }
const STATUS: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  APPROVED: { label: 'Approved', cls: 'bg-[#DCFCE7] text-[#15803D]', Icon: CheckCircle2 },
  PENDING: { label: 'In review', cls: 'bg-[#FEF3C7] text-[#B45309]', Icon: Clock },
  REJECTED: { label: 'Rejected', cls: 'bg-[#FEE2E2] text-[#B91C1C]', Icon: XCircle },
  PAUSED: { label: 'Paused', cls: 'bg-[#E2E8F0] text-[#334155]', Icon: AlertTriangle },
  DISABLED: { label: 'Disabled', cls: 'bg-[#E2E8F0] text-[#334155]', Icon: AlertTriangle },
}
const REASON: Record<string, string> = {
  INCORRECT_CATEGORY: 'Meta says the category does not fit the text (for example a utility template that reads like marketing).',
  ABUSIVE_CONTENT: 'Meta found the content abusive or against its rules.',
  INVALID_FORMAT: 'The format is not valid (variables at the start / end, too many variables, bad buttons…).',
  SCAM: 'Meta flagged it as a possible scam.',
  TAG_CONTENT_MISMATCH: 'The content does not match the category chosen.',
}
const PAGE = 9
const sel = 'h-10 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] font-medium text-[#0F172A] outline-none focus:border-[#F4511E]'
const keyOf = (t: { name: string; language: string }) => `${t.name}::${t.language}`
const pretty = (name: string) => name.replace(/_/g, ' ')
const btnIcon = (type: string) => { const t = String(type).toUpperCase(); return t === 'URL' ? <ExternalLink className="h-3.5 w-3.5" /> : t === 'PHONE_NUMBER' ? <Phone className="h-3.5 w-3.5" /> : t === 'COPY_CODE' ? <Copy className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" /> }
const fill = (text: string, values: string[]) => text.replace(/\{\{\s*(\d+)\s*\}\}/g, (whole, n) => (values[Number(n) - 1] || '').trim() || whole)
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

/** The message as the customer sees it on the phone. */
function Preview({ t, values, time = '10:30 AM', compact }: { t: WaTemplateFull; values?: string[]; time?: string; compact?: boolean }) {
  const v = values && values.some((x) => x?.trim()) ? values : t.bodyExample
  const media = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(String(t.headerType || '').toUpperCase())
  return (
    <div data-template-preview className="rounded-xl bg-[#EFEAE2] p-2.5" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,.04) 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
      <div className="overflow-hidden rounded-lg rounded-tl-none bg-white shadow-sm">
        {media && (
          <div className={`flex ${compact ? 'h-[118px]' : 'h-[160px]'} items-center justify-center overflow-hidden bg-[#F1F5F9] text-[#64748B]`}>
            {t.headerType === 'IMAGE' && t.headerSample ? <img src={t.headerSample} alt="" className="h-full w-full object-cover" loading="lazy" />
              : <span className="flex flex-col items-center gap-1 text-[11.5px]">{t.headerType === 'VIDEO' ? <Play className="h-6 w-6" /> : <FileText className="h-6 w-6" />}{String(t.headerType).toLowerCase()} header</span>}
          </div>
        )}
        <div className={`px-2.5 pb-1.5 pt-2 ${compact ? 'text-[12.5px]' : 'text-[13.5px]'} leading-normal text-[#0F172A]`}>
          {t.headerType === 'TEXT' && t.headerText && <p className="mb-1 font-bold">{renderWaText(fill(t.headerText, v), 'h')}</p>}
          <p className={`whitespace-pre-wrap break-words ${compact ? 'line-clamp-[7]' : ''}`}>{renderWaText(fill(t.bodyText, v), 'b')}</p>
          {t.footerText && <p className="mt-1 text-[11px] text-[#64748B]">{t.footerText}</p>}
          <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-[#64748B]">{time}<CheckCheck className="h-3 w-3 text-[#53BDEB]" /></p>
        </div>
        {t.buttons.map((b, i) => <div key={i} className="flex items-center justify-center gap-1.5 border-t border-black/10 py-1.5 text-[12.5px] font-medium text-[#027EB5]">{btnIcon(b.type)}{b.text}</div>)}
      </div>
    </div>
  )
}

export function WhatsAppTemplatesTab({ senders, onUse, onCounts }: { senders: WaSender[]; onUse: (key: string) => void; onCounts?: (c: { approved: number; total: number }) => void }) {
  const [all, setAll] = useState<WaTemplateFull[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState('')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('all')
  const [language, setLanguage] = useState('all')
  const [status, setStatus] = useState('APPROVED')
  const [since, setSince] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [menu, setMenu] = useState('')
  const [details, setDetails] = useState<WaTemplateFull | null>(null)
  const [test, setTest] = useState<WaTemplateFull | null>(null)

  const load = useCallback(async (fresh = false) => {
    setLoading(true); setFailed('')
    try {
      const r = await adminWhatsappAPI.getAllTemplates(fresh)
      const list: WaTemplateFull[] = r.data?.data || []
      setAll(list); setCounts(r.data?.counts || {})
      onCounts?.({ approved: list.filter((t) => t.status === 'APPROVED').length, total: list.length })
    } catch (e: any) { setFailed(e?.response?.data?.message || 'Could not load the templates. Check the WhatsApp keys in Key Management.') } finally { setLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (!menu) return; const off = () => setMenu(''); window.addEventListener('click', off); return () => window.removeEventListener('click', off) }, [menu])
  useEffect(() => { setPage(1) }, [q, category, language, status, since, from, to])

  const categories = useMemo(() => [...new Set(all.map((t) => t.category).filter(Boolean))].sort(), [all])
  const languages = useMemo(() => [...new Set(all.map((t) => t.language))].sort(), [all])
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    const dayMs = 86400000
    const fromAt = since === 'custom' ? (from ? new Date(`${from}T00:00:00`).getTime() : 0) : since === 'all' ? 0 : Date.now() - Number(since) * dayMs
    const toAt = since === 'custom' && to ? new Date(`${to}T23:59:59`).getTime() : Infinity
    return all
      .filter((t) => status === 'all' || t.status === status)
      .filter((t) => category === 'all' || t.category === category)
      .filter((t) => language === 'all' || t.language === language)
      .filter((t) => { if (!fromAt && toAt === Infinity) return true; const at = t.updatedAt ? new Date(t.updatedAt).getTime() : 0; return at >= fromAt && at <= toAt })
      .filter((t) => !s || `${t.name} ${pretty(t.name)} ${t.bodyText} ${t.headerText} ${t.category} ${t.buttons.map((b) => b.text).join(' ')}`.toLowerCase().includes(s))
      .sort((a, b) => (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0) || a.name.localeCompare(b.name))
  }, [all, q, category, language, status, since, from, to])
  const pages = Math.max(1, Math.ceil(shown.length / PAGE))
  const rows = shown.slice((page - 1) * PAGE, page * PAGE)
  const filtersOn = !!q || category !== 'all' || language !== 'all' || since !== 'all'
  const pager = useMemo(() => {
    const out: (number | '…')[] = []
    for (let p = 1; p <= pages; p++) if (p === 1 || p === pages || Math.abs(p - page) <= 1) out.push(p); else if (out[out.length - 1] !== '…') out.push('…')
    return out
  }, [pages, page])
  const heading = status === 'APPROVED' ? 'Approved Templates' : status === 'PENDING' ? 'Templates in review' : status === 'REJECTED' ? 'Rejected Templates' : 'All Templates'
  const sub = status === 'APPROVED' ? 'These templates are approved in WhatsApp Manager and ready to send.' : status === 'PENDING' ? 'Meta is still reviewing these — usually a few minutes to a day.' : status === 'REJECTED' ? 'Meta refused these. Change the text in WhatsApp Manager and submit again.' : 'Every template of the WhatsApp account, whatever its status.'
  const copyName = (t: WaTemplateFull) => { navigator.clipboard?.writeText(t.name); toast.success('Template name copied') }
  const StatusPill = ({ t }: { t: WaTemplateFull }) => { const s = STATUS[t.status] || STATUS.PAUSED; return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-bold ${s.cls}`}><s.Icon className="h-3 w-3" />{s.label}</span> }
  const Lang = ({ t }: { t: WaTemplateFull }) => <span className="rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[10.5px] font-bold text-[#1D4ED8]">{LANG[t.language] || t.language.toUpperCase()}</span>

  return (
    <div className="space-y-3" data-templates>
      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#94A3B8]" /><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search templates" placeholder="Search templates…" className={`${field} pl-9`} /></div>
        <select className={sel} aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All Categories</option>{categories.map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}</select>
        <select className={sel} aria-label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}><option value="all">All Languages</option>{languages.map((l) => <option key={l} value={l}>{LANG_NAME[l] || l}</option>)}</select>
        <select className={sel} aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="APPROVED">Approved ({counts.APPROVED || 0})</option><option value="PENDING">In review ({counts.PENDING || 0})</option><option value="REJECTED">Rejected ({counts.REJECTED || 0})</option><option value="all">All status ({all.length})</option>
        </select>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] text-[#0F172A]"><CalendarDays className="h-4 w-4 text-[#64748B]" />
          <select className="bg-transparent font-medium outline-none" aria-label="Updated" value={since} onChange={(e) => setSince(e.target.value)}><option value="all">Any date</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="custom">Between dates…</option></select>
          {since === 'custom' && <><input type="date" value={from} max={to || undefined} aria-label="From date" onChange={(e) => setFrom(e.target.value)} className="bg-transparent outline-none" /><span className="text-[#94A3B8]">–</span><input type="date" value={to} min={from || undefined} aria-label="To date" onChange={(e) => setTo(e.target.value)} className="bg-transparent outline-none" /></>}
        </label>
        {filtersOn && <button type="button" onClick={() => { setQ(''); setCategory('all'); setLanguage('all'); setSince('all'); setFrom(''); setTo('') }} className="h-10 px-2 text-[12.5px] font-bold text-[#2563EB]">Clear</button>}
      </div>

      <section className="rounded-2xl border border-[#E8EDF3] bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${status === 'REJECTED' ? 'bg-[#FEE2E2] text-[#B91C1C]' : status === 'PENDING' ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#DCFCE7] text-[#15803D]'}`}>{status === 'REJECTED' ? <XCircle className="h-5 w-5" /> : status === 'PENDING' ? <Clock className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</span>
            <div><h3 className="text-[16px] font-extrabold text-[#0F172A]">{heading} <span className="text-[13px] font-semibold text-[#64748B]">({shown.length})</span></h3><p className="text-[12.5px] text-[#64748B]">{sub}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => load(true)} className="flex h-9 items-center gap-1.5 text-[12.5px] font-bold text-[#2563EB]"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Reload</button>
            <span className="flex overflow-hidden rounded-lg border border-[#E2E8F0]">
              <button type="button" aria-label="Grid view" onClick={() => setView('grid')} className={`flex h-9 w-9 items-center justify-center ${view === 'grid' ? 'text-white' : 'text-[#475569] hover:bg-[#F8FAFC]'}`} style={view === 'grid' ? { background: NAVY } : undefined}><LayoutGrid className="h-4 w-4" /></button>
              <button type="button" aria-label="List view" onClick={() => setView('list')} className={`flex h-9 w-9 items-center justify-center ${view === 'list' ? 'text-white' : 'text-[#475569] hover:bg-[#F8FAFC]'}`} style={view === 'list' ? { background: NAVY } : undefined}><List className="h-4 w-4" /></button>
            </span>
          </div>
        </div>

        {failed && !all.length ? <p className="rounded-lg bg-[#FFFBEB] px-3 py-2.5 text-[13px] text-[#B45309]">{failed}</p>
          : loading && !all.length ? <div className="flex justify-center py-14"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
          : rows.length === 0 ? <p className="py-12 text-center text-[13px] text-[#64748B]">{filtersOn ? 'No template matches these filters.' : status === 'APPROVED' ? 'No approved templates yet. Create one in WhatsApp Manager — it shows up here once Meta approves it.' : 'Nothing here.'}</p>
          : view === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((t) => (
                <div key={keyOf(t)} data-template-card className="flex flex-col rounded-xl border border-[#EEF2F6] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2"><b className="truncate text-[13.5px] text-[#0F172A]" title={t.name}>{t.name}</b><Lang t={t} /></span>
                    <span className="relative flex shrink-0 items-center gap-1.5"><StatusPill t={t} />
                      <button type="button" aria-label="More" onClick={(e) => { e.stopPropagation(); setMenu((m) => (m === keyOf(t) ? '' : keyOf(t))) }} className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] hover:bg-[#F1F5F9]"><MoreVertical className="h-4 w-4" /></button>
                      {menu === keyOf(t) && (
                        <span className="absolute right-0 top-8 z-20 w-52 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white py-1 text-left text-[13px] shadow-lg">
                          <button type="button" className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[#F8FAFC]" onClick={() => copyName(t)}><Copy className="h-3.5 w-3.5" />Copy template name</button>
                          <a className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[#F8FAFC]" href={WA_MANAGER_URL} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" />Open in WhatsApp Manager</a>
                        </span>
                      )}
                    </span>
                  </div>
                  <Preview t={t} compact />
                  {t.status === 'REJECTED' && t.rejectedReason && <p className="mt-2 rounded-lg bg-[#FEF2F2] px-2.5 py-1.5 text-[11.5px] text-[#991B1B]"><b>{t.rejectedReason.replace(/_/g, ' ')}:</b> {REASON[t.rejectedReason] || 'See WhatsApp Manager for Meta’s note.'}</p>}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setDetails(t)} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#E2E8F0] text-[12px] font-bold text-[#0F172A] hover:bg-[#F8FAFC]"><Eye className="h-3.5 w-3.5" />View Details</button>
                    <button type="button" onClick={() => (t.status === 'APPROVED' ? setTest(t) : toast.info('Only approved templates can be sent.'))} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#E2E8F0] text-[12px] font-bold text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50"><Send className="h-3.5 w-3.5" />Send Test</button>
                    <button type="button" data-use-template onClick={() => (t.status === 'APPROVED' ? onUse(keyOf(t)) : toast.info('Only approved templates can be sent.'))} className="flex h-9 items-center justify-center gap-1 rounded-lg text-[12px] font-bold text-white disabled:opacity-50" style={{ background: ORANGE }}><Upload className="h-3.5 w-3.5" />Use Template</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-[13px]">
              <thead><tr className="bg-[#F8FAFC] text-[11.5px] font-bold uppercase text-[#64748B]"><th className="px-3 py-2">Template</th><th className="px-2 py-2">Language</th><th className="px-2 py-2">Category</th><th className="px-2 py-2">Header</th><th className="px-2 py-2">Values</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Updated</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
              <tbody>{rows.map((t) => (
                <tr key={keyOf(t)} data-template-row className="border-t border-[#F1F5F9]">
                  <td className="max-w-[320px] px-3 py-2"><b className="block truncate text-[#0F172A]">{t.name}</b><span className="block truncate text-[11.5px] text-[#64748B]">{t.bodyText.replace(/\s+/g, ' ')}</span></td>
                  <td className="px-2 py-2"><Lang t={t} /></td><td className="px-2 py-2 text-[#475569]">{t.category ? t.category.charAt(0) + t.category.slice(1).toLowerCase() : '—'}</td>
                  <td className="px-2 py-2 text-[#475569]">{t.headerType ? String(t.headerType).toLowerCase() : '—'}</td><td className="px-2 py-2 text-[#475569]">{t.varCount}</td>
                  <td className="px-2 py-2"><StatusPill t={t} /></td><td className="whitespace-nowrap px-2 py-2 text-[#475569]">{when(t.updatedAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button type="button" className="mr-2 text-[12.5px] font-bold text-[#2563EB]" onClick={() => setDetails(t)}>Details</button>
                    <button type="button" className="mr-2 text-[12.5px] font-bold text-[#2563EB]" onClick={() => (t.status === 'APPROVED' ? setTest(t) : toast.info('Only approved templates can be sent.'))}>Send test</button>
                    <button type="button" className="text-[12.5px] font-bold" style={{ color: ORANGE }} onClick={() => (t.status === 'APPROVED' ? onUse(keyOf(t)) : toast.info('Only approved templates can be sent.'))}>Use</button>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>
          )}

        {shown.length > PAGE && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-[#475569]">
            <span data-templates-showing>Showing {(page - 1) * PAGE + 1}–{Math.min(shown.length, page * PAGE)} of {shown.length} templates</span>
            <span className="flex items-center gap-1">
              <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              {pager.map((p, i) => p === '…' ? <span key={`e${i}`} className="px-1">…</span> : <button key={p} type="button" onClick={() => setPage(p)} className={`h-8 min-w-8 rounded-lg px-2 text-[12.5px] font-bold ${p === page ? 'text-white' : 'border border-[#E2E8F0] text-[#0F172A]'}`} style={p === page ? { background: NAVY } : undefined}>{p}</button>)}
              <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </span>
          </div>
        )}
      </section>

      {details && (
        <Modal title={details.name} onClose={() => setDetails(null)} wide>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-3 text-[13px]">
              <div className="flex flex-wrap items-center gap-2"><StatusPill t={details} /><Lang t={details} /><span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10.5px] font-bold text-[#475569]">{details.category}</span>{details.quality !== 'UNKNOWN' && <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10.5px] font-bold text-[#475569]">Quality: {details.quality.toLowerCase()}</span>}<span className="text-[12px] text-[#64748B]">Updated {when(details.updatedAt)}</span></div>
              {details.status === 'REJECTED' && <p className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-[12.5px] text-[#991B1B]"><b>Rejected — {details.rejectedReason.replace(/_/g, ' ') || 'no reason given'}.</b> {REASON[details.rejectedReason] || ''} Fix it in WhatsApp Manager and submit again.</p>}
              {details.status === 'PENDING' && <p className="rounded-lg bg-[#FFFBEB] px-3 py-2 text-[12.5px] text-[#B45309]">Meta is reviewing this template. It can be sent once it is approved.</p>}
              <div><p className="mb-1 text-[11.5px] font-bold uppercase text-[#64748B]">Header</p><p className="text-[#0F172A]">{details.headerType ? (details.headerType === 'TEXT' ? details.headerText : `${details.headerType.charAt(0) + details.headerType.slice(1).toLowerCase()} — a ${details.headerType.toLowerCase()} is attached when sending`) : 'None'}</p></div>
              <div><p className="mb-1 text-[11.5px] font-bold uppercase text-[#64748B]">Body</p><pre className="whitespace-pre-wrap rounded-lg bg-[#F8FAFC] p-3 font-sans text-[13px] text-[#0F172A]">{details.bodyText}</pre></div>
              {details.varCount > 0 && <div><p className="mb-1 text-[11.5px] font-bold uppercase text-[#64748B]">Values to fill when sending</p><ul className="space-y-1">{Array.from({ length: details.varCount }, (_, i) => <li key={i} className="flex items-center gap-2"><span className="rounded bg-[#FEF3C7] px-1.5 py-0.5 text-[11px] font-bold text-[#B45309]">{`{{${i + 1}}}`}</span><span className="text-[#475569]">example: <i>{details.bodyExample[i] || '—'}</i></span></li>)}</ul></div>}
              {details.footerText && <div><p className="mb-1 text-[11.5px] font-bold uppercase text-[#64748B]">Footer</p><p className="text-[#475569]">{details.footerText}</p></div>}
              {details.buttons.length > 0 && <div><p className="mb-1 text-[11.5px] font-bold uppercase text-[#64748B]">Buttons</p><ul className="space-y-1">{details.buttons.map((b, i) => <li key={i} className="flex items-center gap-2 text-[#0F172A]">{btnIcon(b.type)}<b>{b.text}</b><span className="text-[12px] text-[#64748B]">{b.type === 'URL' ? b.url : b.type === 'PHONE_NUMBER' ? b.phone : b.type.replace(/_/g, ' ').toLowerCase()}</span></li>)}</ul></div>}
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" onClick={() => copyName(details)} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-[12.5px] font-bold text-[#0F172A]"><Copy className="h-3.5 w-3.5" />Copy name</button>
                <a href={WA_MANAGER_URL} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-[12.5px] font-bold text-[#0F172A]"><ExternalLink className="h-3.5 w-3.5" />WhatsApp Manager</a>
                {details.status === 'APPROVED' && <button type="button" onClick={() => { setTest(details); setDetails(null) }} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-[12.5px] font-bold text-[#0F172A]"><Send className="h-3.5 w-3.5" />Send test</button>}
                {details.status === 'APPROVED' && <button type="button" onClick={() => { onUse(keyOf(details)); setDetails(null) }} className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-bold text-white" style={{ background: ORANGE }}><Upload className="h-3.5 w-3.5" />Use template</button>}
              </div>
            </div>
            <div><p className="mb-1.5 text-center text-[10.5px] font-bold uppercase tracking-wider text-[#64748B]">As the customer sees it</p><Preview t={details} /></div>
          </div>
        </Modal>
      )}
      {test && <SendTest t={test} senders={senders} onClose={() => setTest(null)} />}
    </div>
  )
}

/** Send one template to one number, to see it on a real phone. */
function SendTest({ t, senders, onClose }: { t: WaTemplateFull; senders: WaSender[]; onClose: () => void }) {
  const [phone, setPhone] = useState(() => { try { return localStorage.getItem('bm_wa_test_phone') || '' } catch { return '' } })
  const [values, setValues] = useState<string[]>(() => Array.from({ length: t.varCount }, (_, i) => t.bodyExample[i] || ''))
  const [senderId, setSenderId] = useState(senders[0]?.id || '')
  const [media, setMedia] = useState<{ mediaId: string; kind: string; filename: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const mediaKind = String(t.headerType || '').toLowerCase()
  const needsMedia = ['image', 'video', 'document'].includes(mediaKind)
  const digits = phone.replace(/\D/g, '')
  const okPhone = /^[6-9]\d{9}$/.test(digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits)
  const missing = !okPhone ? 'Enter a 10-digit WhatsApp number' : values.some((v) => !v.trim()) ? 'Fill in every value' : !senderId ? 'No WhatsApp number to send from' : needsMedia && !media && !t.headerSample ? `Upload the ${mediaKind} for the header` : ''
  const onFile = async (f?: File | null) => {
    if (!f) return
    setUploading(true)
    try {
      const form = new FormData(); form.append('file', f); if (senderId) form.append('phoneNumberId', senderId)
      const r = await adminWhatsappAPI.uploadMedia(form)
      if (r.data?.success && r.data.data?.mediaId) setMedia({ mediaId: r.data.data.mediaId, kind: r.data.data.kind, filename: r.data.data.filename || f.name })
      else toast.error(r.data?.message || 'Upload failed')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Upload failed') } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }
  const send = async () => {
    if (missing) { toast.error(missing); return }
    setSending(true)
    try {
      try { localStorage.setItem('bm_wa_test_phone', phone) } catch {}
      const r = await adminWhatsappAPI.send({
        phoneNumberId: senderId, templateName: t.name, languageCode: t.language, toPhone: phone, variables: values.length ? values.map((v) => v.trim()) : undefined,
        ...(needsMedia ? (media ? { headerMediaId: media.mediaId, headerMediaKind: mediaKind } : { headerMediaLink: t.headerSample, headerMediaKind: mediaKind }) : {}),
      })
      if (r.data?.success) { toast.success(`Test sent to ${prettyPhone(digits.length === 10 ? `91${digits}` : digits)}`); onClose() }
      else toast.error(r.data?.message || 'Could not send the test')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not send the test') } finally { setSending(false) }
  }
  return (
    <Modal title={`Send a test — ${t.name}`} onClose={onClose} wide busy={sending}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <p className="text-[12.5px] text-[#64748B]">Sends this template once to a number of your choice, so you can see it on a real phone. WhatsApp charges for it like any template.</p>
          <div><label className="mb-1 block text-[12.5px] font-semibold text-[#334155]">Send to (WhatsApp number)</label>
            <div className="flex h-10 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white focus-within:border-[#F4511E]"><span className="flex items-center border-r border-[#E2E8F0] px-2.5 text-[13px] text-[#475569]">+91</span><input value={phone} inputMode="numeric" aria-label="Test number" placeholder="98765 43210" onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))} className="min-w-0 flex-1 px-3 text-[13.5px] outline-none" /></div>
          </div>
          {senders.length > 1 && <div><label className="mb-1 block text-[12.5px] font-semibold text-[#334155]">Send from</label><select value={senderId} onChange={(e) => setSenderId(e.target.value)} aria-label="Send from" className={field}>{senders.map((s) => <option key={s.id} value={s.id}>{s.display}{s.name ? ` — ${s.name}` : ''}</option>)}</select></div>}
          {needsMedia && (
            <div><label className="mb-1 block text-[12.5px] font-semibold text-[#334155]">Header {mediaKind}</label>
              <input ref={fileRef} type="file" hidden accept={mediaKind === 'image' ? 'image/*' : mediaKind === 'video' ? 'video/*' : '.pdf,.doc,.docx'} onChange={(e) => onFile(e.target.files?.[0])} />
              <div className="flex items-center gap-2 text-[12.5px] text-[#475569]"><span className="flex-1">{media ? <b className="text-[#0F172A]">{media.filename}</b> : t.headerSample ? 'The template’s sample is used.' : 'Upload one to send.'}</span><button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-8 rounded-lg border border-[#E2E8F0] px-3 text-[12px] font-bold text-[#0F172A]">{uploading ? 'Uploading…' : media ? 'Change' : 'Upload another'}</button></div>
            </div>
          )}
          {t.varCount > 0 && <div><p className="mb-1 text-[12.5px] font-semibold text-[#334155]">Values</p><div className="space-y-2">{values.map((v, i) => <div key={i} className="flex h-10 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white focus-within:border-[#F4511E]"><span className="flex w-12 shrink-0 items-center justify-center border-r border-[#E2E8F0] bg-[#F8FAFC] text-[11.5px] font-bold text-[#475569]">{`{{${i + 1}}}`}</span><input value={v} aria-label={`Value ${i + 1}`} onChange={(e) => setValues((a) => { const n = [...a]; n[i] = e.target.value; return n })} className="min-w-0 flex-1 px-3 text-[13.5px] outline-none" /></div>)}</div></div>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={sending} className="h-10 rounded-lg border border-[#E2E8F0] px-4 text-[13.5px] font-bold text-[#334155]">Cancel</button>
            <button type="button" data-send-test onClick={send} disabled={sending || !!missing} className="flex h-10 items-center gap-2 rounded-lg bg-[#12A34B] px-5 text-[13.5px] font-bold text-white disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send test</button>
          </div>
          {missing && <p className="text-right text-[12px] text-[#B45309]">{missing}</p>}
        </div>
        <div><p className="mb-1.5 flex items-center justify-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#64748B]"><WhatsAppIcon className="h-3.5 w-3.5" />Preview</p><Preview t={t} values={values} /></div>
      </div>
    </Modal>
  )
}

export const X_ICON = X
