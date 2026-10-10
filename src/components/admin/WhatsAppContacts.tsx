'use client'

// Admin → Communication → WhatsApp: "WhatsApp & Contacts".
//   Contacts       the address book: search, filters, tags, opt-in, bulk actions.
//                  Three dialogs open from its buttons: Add Contact, Import from Excel,
//                  and Send WhatsApp Template (to the ticked contacts or to everybody
//                  the filters show)
//   Send Template  one template to one number (the earlier page) + the bulk sends so far
//   Sent History   every message sent, its delivery status and who wrote back (WhatsAppSentHistory.tsx)
//   Segments       the tags, as ready-made groups to send to
//   Templates      the approved templates
//   Import History what each imported file added
// Backend: /api/admin/whatsapp-contacts (services/whatsappContactService.js).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Ban, BarChart3, Check, ChevronLeft, ChevronRight, Download, FileSpreadsheet, History, LayoutTemplate, Loader2, MoreVertical, Pencil, Plus, RefreshCw, Search,
  Send, Tag, Tags, Trash2, Upload, UserPlus, Users, X, XCircle,
} from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { WhatsAppSender } from '@/components/admin/WhatsAppSender'
import { WhatsAppSentHistory } from '@/components/admin/WhatsAppSentHistory'
import { WhatsAppTemplatesTab, WA_MANAGER_URL } from '@/components/admin/WhatsAppTemplatesTab'
import { adminWhatsappAPI, adminWhatsappContactsAPI, type WaContactFilter } from '@/services/api'
import { downloadCsv } from '@/lib/contactsFile'
import {
  Confirm, ContactForm, ImportCard, Modal, NAVY, ORANGE, SOURCES, SendPanel, TYPES, TagPill, WhatsAppIcon, ago, downloadSample, field, initials, prettyPhone, tagColour,
  type Audience, type WaContact, type WaSender, type WaTemplate,
} from './WhatsAppContactsParts'

type Count = { value: string; count: number }
type Meta = { total: number; optedIn: number; optedOut: number; sent30d: number; tags: Count[]; cities: Count[]; types: Count[]; sources: Count[] }
type ImportRow = { _id: string; filename: string; kind: string; total: number; added: number; updated: number; skipped: number; invalid: number; invalidRows: { row: number; phone: string; reason: string }[]; tags: string[]; createdAt: string; by?: { fullName?: string } }
type Broadcast = { _id: string; templateName: string; status: string; total: number; sent: number; failed: number; skipped: number; audience?: string; scheduledAt?: string; createdAt: string; finishedAt?: string; by?: { fullName?: string } }
type Tab = 'contacts' | 'send' | 'history' | 'segments' | 'templates' | 'imports'

const EMPTY: Meta = { total: 0, optedIn: 0, optedOut: 0, sent30d: 0, tags: [], cities: [], types: [], sources: [] }
const TABS: { key: Tab; label: string; Icon: typeof Users }[] = [
  { key: 'contacts', label: 'Contacts', Icon: Users }, { key: 'send', label: 'Send Template', Icon: Send }, { key: 'history', label: 'Sent History', Icon: BarChart3 }, { key: 'segments', label: 'Segments', Icon: Tags },
  { key: 'templates', label: 'Templates', Icon: LayoutTemplate }, { key: 'imports', label: 'Import History', Icon: History },
]
const sel = 'h-10 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] font-medium text-[#0F172A] outline-none focus:border-[#F4511E]'
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
const BSTATUS: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Scheduled', cls: 'bg-blue-100 text-blue-700' }, queued: { label: 'Starting', cls: 'bg-amber-100 text-amber-800' }, running: { label: 'Sending', cls: 'bg-amber-100 text-amber-800' },
  done: { label: 'Completed', cls: 'bg-emerald-100 text-emerald-700' }, cancelled: { label: 'Stopped', cls: 'bg-slate-200 text-slate-700' },
}

export function WhatsAppContacts() {
  const [tab, setTab] = useState<Tab>('contacts')
  const [meta, setMeta] = useState<Meta>(EMPTY)
  const [rows, setRows] = useState<WaContact[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(8)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [filter, setFilter] = useState<Required<Omit<WaContactFilter, 'search'>>>({ tag: 'all', city: 'all', type: 'all', optIn: 'all', last: 'all', source: 'all' })
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [allMatching, setAllMatching] = useState(false)
  const [imports, setImports] = useState<ImportRow[]>([])
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [templates, setTemplates] = useState<WaTemplate[]>([])
  const [senders, setSenders] = useState<WaSender[]>([])
  const [tplLoading, setTplLoading] = useState(true)
  const [tplError, setTplError] = useState('')
  const [presetKey, setPresetKey] = useState('')
  const [tplCounts, setTplCounts] = useState<{ approved: number; total: number } | null>(null)
  const [editing, setEditing] = useState<WaContact | null>(null)
  const [adding, setAdding] = useState(false)
  const [menu, setMenu] = useState('')
  const [tagDlg, setTagDlg] = useState<'add' | 'remove' | null>(null)
  const [tagText, setTagText] = useState('')
  const [confirm, setConfirm] = useState<null | { title: string; body: React.ReactNode; action: string; run: () => Promise<void> }>(null)
  const [busy, setBusy] = useState(false)
  const [manageTags, setManageTags] = useState(false)
  const [failedOf, setFailedOf] = useState<null | { name: string; rows: { name: string; phone: string; error: string }[] }>(null)
  const [importOpen, setImportOpen] = useState(false) // "Import from Excel" dialog
  const [sendOpen, setSendOpen] = useState(false)     // "Send WhatsApp Template" dialog

  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 350); return () => clearTimeout(t) }, [search])
  const query: WaContactFilter = useMemo(() => {
    const q: WaContactFilter = {}
    if (debounced) q.search = debounced
    for (const k of Object.keys(filter) as (keyof typeof filter)[]) if (filter[k] !== 'all') q[k] = filter[k]
    return q
  }, [debounced, filter])
  const queryKey = JSON.stringify(query)
  const filtersOn = queryKey !== '{}'

  const loadMeta = useCallback(() => adminWhatsappContactsAPI.meta().then((r) => setMeta(r.data?.data || EMPTY)).catch(() => {}), [])
  const loadRows = useCallback(async () => {
    setLoading(true)
    try {
      const r = await adminWhatsappContactsAPI.list({ ...query, page, limit: perPage })
      setRows(r.data?.data || []); setPages(r.data?.pagination?.pages || 1); setTotal(r.data?.pagination?.total || 0)
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not load the contacts') } finally { setLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, page, perPage])
  const loadImports = useCallback(() => adminWhatsappContactsAPI.imports(30).then((r) => setImports(r.data?.data || [])).catch(() => {}), [])
  const loadBroadcasts = useCallback(() => adminWhatsappContactsAPI.broadcasts(30).then((r) => setBroadcasts(r.data?.data || [])).catch(() => {}), [])
  const loadTemplates = useCallback(async () => {
    setTplLoading(true); setTplError('')
    try {
      const [s, t] = await Promise.all([adminWhatsappAPI.getSenders(), adminWhatsappAPI.getTemplates()])
      setSenders(s.data?.data || []); setTemplates(t.data?.data || [])
      if (!(t.data?.data || []).length) setTplError(t.data?.message || 'There are no approved templates yet. Create one in WhatsApp Manager.')
    } catch (e: any) { setTplError(e?.response?.data?.message || 'Could not load the templates. Check the WhatsApp keys in Key Management.') } finally { setTplLoading(false) }
  }, [])
  const refresh = useCallback(() => { loadRows(); loadMeta() }, [loadRows, loadMeta])

  useEffect(() => { loadRows() }, [loadRows])
  useEffect(() => { loadMeta(); loadImports(); loadBroadcasts(); loadTemplates() }, [loadMeta, loadImports, loadBroadcasts, loadTemplates])
  useEffect(() => { setPage(1); setAllMatching(false) }, [queryKey, perPage])
  // a send in progress: keep its numbers moving
  useEffect(() => {
    if (!broadcasts.some((b) => ['queued', 'running'].includes(b.status))) return
    const t = setInterval(() => { loadBroadcasts(); loadMeta() }, 4000)
    return () => clearInterval(t)
  }, [broadcasts, loadBroadcasts, loadMeta])
  useEffect(() => { if (!menu) return; const off = () => setMenu(''); window.addEventListener('click', off); return () => window.removeEventListener('click', off) }, [menu])

  const knownTags = meta.tags.map((t) => t.value)
  const cities = meta.cities.map((c) => c.value)
  const pageIds = rows.map((r) => r._id)
  const pageAllPicked = pageIds.length > 0 && pageIds.every((id) => picked.has(id))
  const count = allMatching ? total : picked.size
  const target = () => (allMatching ? { all: true, filter: query } : { ids: [...picked] })
  const clearPicked = () => { setPicked(new Set()); setAllMatching(false) }
  const toggle = (id: string) => { setAllMatching(false); setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n }) }
  const togglePage = () => { setAllMatching(false); setPicked((p) => { const n = new Set(p); if (pageAllPicked) pageIds.forEach((id) => n.delete(id)); else pageIds.forEach((id) => n.add(id)); return n }) }
  const filterWords = () => {
    const bits: string[] = []
    if (query.tag) bits.push(`tag “${query.tag}”`)
    if (query.city) bits.push(query.city)
    if (query.type) bits.push(TYPES.find((t) => t.value === query.type)?.label || query.type)
    if (query.optIn) bits.push(query.optIn === 'in' ? 'opted in' : 'opted out')
    if (query.source) bits.push(SOURCES[query.source] || query.source)
    if (query.last) bits.push({ '7d': 'contacted in 7 days', '30d': 'contacted in 30 days', '90d': 'contacted in 90 days', older: 'not contacted in 30 days', never: 'never contacted' }[query.last] || query.last)
    if (query.search) bits.push(`“${query.search}”`)
    return bits.length ? `All contacts: ${bits.join(', ')}` : 'All contacts'
  }
  const audience: Audience = allMatching ? { mode: 'all', filter: query, label: filterWords() } : picked.size ? { mode: 'ids', ids: [...picked], label: `${picked.size} selected contact${picked.size === 1 ? '' : 's'}` } : { mode: 'none' }
  const toSend = () => { setTab('contacts'); setSendOpen(true) }

  const bulk = async (action: 'addTag' | 'removeTag' | 'optIn' | 'optOut' | 'delete', tag?: string) => {
    setBusy(true)
    try {
      const r = await adminWhatsappContactsAPI.bulk({ ...target(), action, tag })
      if (r.data?.success) { toast.success(r.data.message || 'Done'); if (action === 'delete') clearPicked(); refresh() }
      else toast.error(r.data?.message || 'Could not do that')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not do that') } finally { setBusy(false) }
  }
  const exportCsv = async () => {
    try {
      const r = await adminWhatsappContactsAPI.list({ ...query, page: 1, limit: 5000 })
      let list: WaContact[] = r.data?.data || []
      if (!allMatching && picked.size) list = list.filter((c) => picked.has(c._id))
      if (!list.length) { toast.error('Nothing to export'); return }
      downloadCsv(`whatsapp-contacts-${new Date().toISOString().slice(0, 10)}.csv`, [
        ['Name', 'WhatsApp Number', 'Alternate Phone', 'City', 'Type', 'Tags', 'Opt-in', 'Last Contacted', 'Source', 'Notes'],
        ...list.map((c) => [c.name, c.phone.slice(-10), (c.altPhone || '').slice(-10), c.city || '', c.type, c.tags.join(', '), c.optIn ? 'Opted In' : 'Opted Out', c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleDateString('en-IN') : '', SOURCES[c.source] || c.source, c.notes || '']),
      ])
      toast.success(`${list.length.toLocaleString('en-IN')} contacts exported`)
    } catch { toast.error('Could not export') }
  }
  const askDelete = (ids?: string[]) => {
    const n = ids ? ids.length : count
    setConfirm({
      title: `Delete ${n.toLocaleString('en-IN')} contact${n === 1 ? '' : 's'}?`, action: 'Delete',
      body: <>They are removed from the address book. Their WhatsApp chats stay. This cannot be undone.</>,
      run: async () => {
        if (ids && ids.length === 1) { const r = await adminWhatsappContactsAPI.remove(ids[0]); if (r.data?.success) { toast.success('Contact deleted'); setPicked((p) => { const s = new Set(p); s.delete(ids[0]); return s }); refresh() } else toast.error(r.data?.message || 'Could not delete') }
        else await bulk('delete')
      },
    })
  }
  const setOpt = async (c: WaContact, optIn: boolean) => {
    try { const r = await adminWhatsappContactsAPI.update(c._id, { optIn }); if (r.data?.success) { toast.success(optIn ? 'Opted in' : 'Opted out — will not be sent templates'); refresh() } else toast.error(r.data?.message || 'Could not update') } catch { toast.error('Could not update') }
  }
  const syncApp = () => setConfirm({
    title: 'Bring in the app’s users?', action: 'Yes, bring them in',
    body: <>Customers, mechanics and garages already registered on Bharat Mechanics are added to the address book with a tag for what they are. Numbers you already have are left as they are.</>,
    run: async () => { const r = await adminWhatsappContactsAPI.syncApp(); if (r.data?.success) { toast.success(r.data.message); refresh(); loadImports() } else toast.error(r.data?.message || 'Could not bring them in') },
  })

  const pager = useMemo(() => {
    const out: (number | '…')[] = []
    for (let p = 1; p <= pages; p++) if (p === 1 || p === pages || Math.abs(p - page) <= 1 || (page <= 3 && p <= 5) || (page >= pages - 2 && p >= pages - 4)) out.push(p); else if (out[out.length - 1] !== '…') out.push('…')
    return out
  }, [pages, page])

  const card = 'rounded-2xl border border-[#E8EDF3] bg-white shadow-sm'
  const bulkBtn = 'flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[12.5px] font-bold text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50'

  return (
    <div className="min-h-screen">
      <AdminHeader search={{ value: search, onChange: (v) => { setSearch(v); setTab('contacts') }, placeholder: 'Search contacts, tags, cities…' }} />
      <div className="space-y-4 p-4 sm:p-6">
        {/* title + numbers */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E9FBF0]"><WhatsAppIcon className="h-7 w-7" /></span>
            <div>
              <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-[#0F172A]">{tab === 'templates' ? 'WhatsApp Templates' : 'WhatsApp & Contacts'}</h1>
              <p className="text-[13.5px] text-[#64748B]">{tab === 'templates' ? 'Create and manage approved WhatsApp templates to engage with your customers.' : 'Manage your contacts and send approved WhatsApp templates to engage with your customers.'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className={`${card} flex items-center gap-3 px-4 py-3`}><WhatsAppIcon className="h-10 w-10" /><div>{tab === 'templates'
              ? <><b className="block text-[19px] font-extrabold leading-tight text-[#0F172A]">{tplCounts ? tplCounts.approved : '…'}</b><span className="text-[12px] text-[#64748B]">Total Templates{tplCounts && tplCounts.total > tplCounts.approved ? ` · ${tplCounts.total - tplCounts.approved} in review / rejected` : ''}</span></>
              : <><b data-total-contacts className="block text-[19px] font-extrabold leading-tight text-[#0F172A]">{meta.total.toLocaleString('en-IN')}</b><span className="text-[12px] text-[#64748B]">Total Contacts{meta.optedOut ? ` · ${meta.optedOut} opted out` : ''}</span></>}</div></div>
            <div className={`${card} flex items-center gap-3 px-4 py-3`}><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0F2FE] text-[#0284C7]"><Send className="h-5 w-5" /></span><div><b className="block text-[19px] font-extrabold leading-tight text-[#0F172A]">{meta.sent30d.toLocaleString('en-IN')}</b><span className="text-[12px] text-[#64748B]">Messages Sent (Last 30 days)</span></div></div>
          </div>
        </div>

        {/* tabs + main buttons */}
        <div className={`${card} flex flex-wrap items-center justify-between gap-3 px-3`}>
          <div className="flex overflow-x-auto">
            {TABS.map(({ key, label: text, Icon }) => (
              <button key={key} type="button" data-tab={key} onClick={() => setTab(key)} className={`flex h-12 items-center gap-2 whitespace-nowrap border-b-2 px-3.5 text-[13.5px] font-bold ${tab === key ? '' : 'border-transparent text-[#475569] hover:text-[#0F172A]'}`} style={tab === key ? { borderColor: ORANGE, color: ORANGE } : undefined}>
                <Icon className="h-4 w-4" />{text}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 py-2">
            {tab === 'templates'
              ? <a href={WA_MANAGER_URL} target="_blank" rel="noopener noreferrer" data-create-template title="Templates are made and approved in Meta's WhatsApp Manager" className="flex h-10 items-center gap-2 rounded-lg px-4 text-[13.5px] font-bold text-white" style={{ background: ORANGE }}><Plus className="h-4 w-4" />Create Template</a>
              : <button type="button" data-add-contact onClick={() => setAdding(true)} className="flex h-10 items-center gap-2 rounded-lg px-4 text-[13.5px] font-bold text-white" style={{ background: ORANGE }}><UserPlus className="h-4 w-4" />Add Contact</button>}
            <button type="button" data-import-excel onClick={() => setImportOpen(true)} className="flex h-10 items-center gap-2 rounded-lg border border-[#0F172A] bg-white px-4 text-[13.5px] font-bold text-[#0F172A] hover:bg-[#F8FAFC]"><Upload className="h-4 w-4" />Import Excel</button>
            <button type="button" data-bulk-send onClick={() => { if (!total) { toast.error('There are no contacts to send to'); return } setAllMatching(true); setPicked(new Set()); toSend() }} className="flex h-10 items-center gap-2 rounded-lg px-4 text-[13.5px] font-bold text-white" style={{ background: NAVY }}><Send className="h-4 w-4" />Bulk Send</button>
          </div>
        </div>

        {tab === 'contacts' && (
          <div>
            <div className="min-w-0 space-y-4">
              {/* filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#94A3B8]" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search contacts" placeholder="Search by name, phone or tag…" className={`${field} pl-9`} />
                </div>
                <select className={sel} aria-label="Tag" value={filter.tag} onChange={(e) => setFilter((f) => ({ ...f, tag: e.target.value }))}><option value="all">All Tags</option>{meta.tags.map((t) => <option key={t.value} value={t.value}>{t.value} ({t.count})</option>)}</select>
                <select className={sel} aria-label="City" value={filter.city} onChange={(e) => setFilter((f) => ({ ...f, city: e.target.value }))}><option value="all">All Cities</option>{meta.cities.map((t) => <option key={t.value} value={t.value}>{t.value} ({t.count})</option>)}</select>
                <select className={sel} aria-label="Customer type" value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}><option value="all">All Customer Types</option>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                <select className={sel} aria-label="Opt-in status" value={filter.optIn} onChange={(e) => setFilter((f) => ({ ...f, optIn: e.target.value }))}><option value="all">Opt-in Status</option><option value="in">Opted In</option><option value="out">Opted Out</option></select>
                <select className={sel} aria-label="Last contacted" value={filter.last} onChange={(e) => setFilter((f) => ({ ...f, last: e.target.value }))}><option value="all">Last Contacted</option><option value="7d">In the last 7 days</option><option value="30d">In the last 30 days</option><option value="90d">In the last 90 days</option><option value="older">Not in the last 30 days</option><option value="never">Never</option></select>
                <select className={sel} aria-label="Source" value={filter.source} onChange={(e) => setFilter((f) => ({ ...f, source: e.target.value }))}><option value="all">All Sources</option>{Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                {filtersOn && <button type="button" onClick={() => { setSearch(''); setFilter({ tag: 'all', city: 'all', type: 'all', optIn: 'all', last: 'all', source: 'all' }) }} className="h-10 px-2 text-[12.5px] font-bold text-[#2563EB]">Clear</button>}
              </div>

              {/* quick tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-[#334155]">Quick Tags:</span>
                {meta.tags.length === 0 && <span className="text-[12.5px] text-[#94A3B8]">No tags yet — add one to a contact, or tag a whole import.</span>}
                {meta.tags.slice(0, 8).map((t) => (
                  <button key={t.value} type="button" data-quick-tag onClick={() => setFilter((f) => ({ ...f, tag: f.tag === t.value ? 'all' : t.value }))}
                    className={`rounded-full px-3 py-1 text-[12px] font-semibold ${tagColour(t.value)} ${filter.tag === t.value ? 'ring-2 ring-[#0F172A]/40' : ''}`}>{t.value} ({t.count})</button>
                ))}
                <button type="button" onClick={() => setManageTags(true)} className="ml-auto flex items-center gap-1 text-[12.5px] font-bold text-[#2563EB]"><Plus className="h-3.5 w-3.5" />Manage Tags</button>
              </div>

              {/* table */}
              <div className={`${card} overflow-hidden`}>
                <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF2F6] px-3 py-2.5">
                  <label className="flex h-9 items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 text-[12.5px] font-bold text-[#0F172A]">
                    <input type="checkbox" className="h-4 w-4 accent-[#2563EB]" aria-label="Select this page" checked={allMatching || pageAllPicked} onChange={togglePage} />{count.toLocaleString('en-IN')} selected
                  </label>
                  <button type="button" data-bulk-send-template className={bulkBtn} disabled={!count} onClick={toSend}><Send className="h-3.5 w-3.5" />Send Template</button>
                  <button type="button" data-bulk-add-tag className={bulkBtn} disabled={!count || busy} onClick={() => { setTagText(''); setTagDlg('add') }}><Tag className="h-3.5 w-3.5" />Add Tag</button>
                  <button type="button" className={bulkBtn} disabled={!count || busy} onClick={() => { setTagText(''); setTagDlg('remove') }}><XCircle className="h-3.5 w-3.5" />Remove Tag</button>
                  <button type="button" className={bulkBtn} onClick={exportCsv} title={count ? 'Export the selected contacts' : 'Export every contact the filters show'}><Download className="h-3.5 w-3.5" />Export</button>
                  <button type="button" data-bulk-delete className={`${bulkBtn} border-[#FECACA] text-[#DC2626]`} disabled={!count || busy} onClick={() => askDelete()}><Trash2 className="h-3.5 w-3.5" />Delete</button>
                  {!allMatching && pageAllPicked && total > rows.length && <button type="button" data-select-all onClick={() => setAllMatching(true)} className="text-[12.5px] font-bold text-[#2563EB]">Select all {total.toLocaleString('en-IN')} {filtersOn ? 'matching' : 'contacts'}</button>}
                  {allMatching && <button type="button" onClick={clearPicked} className="text-[12.5px] font-bold text-[#2563EB]">Clear selection</button>}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-[13px]">
                    <thead>
                      <tr className="whitespace-nowrap text-[12px] font-bold text-[#475569]">
                        <th className="w-10 px-3 py-2.5"></th><th className="px-2 py-2.5">Name</th><th className="px-2 py-2.5">Phone</th><th className="px-2 py-2.5">Tags</th><th className="px-2 py-2.5">City</th><th className="px-2 py-2.5">Opt-in</th><th className="px-2 py-2.5">Last Contacted</th><th className="sticky right-0 bg-white px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && rows.length === 0 && <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-[#94A3B8]" /></td></tr>}
                      {!loading && rows.length === 0 && (
                        <tr><td colSpan={8} className="px-4 py-12 text-center">
                          <b className="block text-[15px] text-[#0F172A]">{filtersOn ? 'No contact matches these filters' : 'No contacts yet'}</b>
                          <span className="mt-1 block text-[13px] text-[#64748B]">{filtersOn ? 'Try clearing a filter or the search.' : 'Use “Add Contact” or “Import Excel” above, or bring in the people already registered in the app.'}</span>
                          {!filtersOn && <button type="button" data-sync-app onClick={syncApp} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-[12.5px] font-bold text-[#0F172A] hover:bg-[#F8FAFC]"><Users className="h-3.5 w-3.5" />Bring in app users</button>}
                        </td></tr>
                      )}
                      {rows.map((c) => {
                        const on = allMatching || picked.has(c._id)
                        return (
                          <tr key={c._id} data-contact-row className={`border-t border-[#F1F5F9] ${on ? 'bg-[#F8FAFF]' : ''}`}>
                            <td className="px-3 py-2"><input type="checkbox" className="h-4 w-4 accent-[#2563EB]" aria-label={`Select ${c.name || c.phone}`} checked={on} onChange={() => toggle(c._id)} /></td>
                            <td className="px-2 py-2"><span className="flex items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E2E8F0] text-[11px] font-bold text-[#334155]">{initials(c.name)}</span><span className="min-w-0"><b className="block max-w-[150px] truncate font-semibold text-[#0F172A]">{c.name || 'No name'}</b>{c.notes && <span className="block max-w-[150px] truncate text-[11px] text-[#94A3B8]" title={c.notes}>{c.notes}</span>}</span></span></td>
                            <td className="whitespace-nowrap px-2 py-2 text-[#0F172A]"><span className="flex items-center gap-1.5"><WhatsAppIcon className="h-4 w-4 shrink-0" />{prettyPhone(c.phone)}</span></td>
                            <td className="px-2 py-2"><span className="flex max-w-[190px] flex-wrap gap-1">{c.tags.slice(0, 2).map((t) => <TagPill key={t} tag={t} />)}{c.tags.length > 2 && <span className="text-[11px] text-[#64748B]" title={c.tags.slice(2).join(', ')}>+{c.tags.length - 2}</span>}{!c.tags.length && <span className="text-[#CBD5E1]">—</span>}</span></td>
                            <td className="px-2 py-2 text-[#334155]">{c.city || <span className="text-[#CBD5E1]">—</span>}</td>
                            <td className="px-2 py-2">{c.optIn
                              ? <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[11.5px] font-semibold text-[#15803D]"><Check className="h-3 w-3" />Opted In</span>
                              : <span title={c.optOutReason ? `Reason: ${c.optOutReason}` : undefined} className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-[#FEE2E2] px-2 py-0.5 text-[11.5px] font-semibold text-[#B91C1C]"><Ban className="h-3 w-3" />Opted Out</span>}</td>
                            <td className="whitespace-nowrap px-2 py-2 text-[#334155]">{ago(c.lastContactedAt)}</td>
                            <td className={`sticky right-0 px-3 py-2 ${on ? 'bg-[#F8FAFF]' : 'bg-white'} ${menu === c._id ? 'z-10' : ''}`}>
                              <span className="relative flex items-center justify-end gap-1">
                                <button type="button" title={c.optIn ? 'Send a template to this contact' : 'Opted out — cannot be sent templates'} disabled={!c.optIn} onClick={() => { setAllMatching(false); setPicked(new Set([c._id])); toSend() }} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#16A34A] hover:bg-[#F0FDF4] disabled:opacity-30"><WhatsAppIcon className="h-[18px] w-[18px]" /></button>
                                <button type="button" data-row-menu aria-label="More actions" onClick={(e) => { e.stopPropagation(); setMenu((m) => (m === c._id ? '' : c._id)) }} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#475569] hover:bg-[#F1F5F9]"><MoreVertical className="h-[18px] w-[18px]" /></button>
                                {menu === c._id && (
                                  <span className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white py-1 text-left shadow-lg">
                                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-[#F8FAFC]" onClick={() => setEditing(c)}><Pencil className="h-3.5 w-3.5" />Edit</button>
                                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-[#F8FAFC]" onClick={() => setOpt(c, !c.optIn)}>{c.optIn ? <><Ban className="h-3.5 w-3.5" />Mark opted out</> : <><Check className="h-3.5 w-3.5" />Mark opted in</>}</button>
                                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[#DC2626] hover:bg-[#FEF2F2]" onClick={() => askDelete([c._id])}><Trash2 className="h-3.5 w-3.5" />Delete</button>
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
                  <span data-showing>{total ? `Showing ${((page - 1) * perPage + 1).toLocaleString('en-IN')}–${Math.min(total, page * perPage).toLocaleString('en-IN')} of ${total.toLocaleString('en-IN')} contacts` : 'No contacts'}</span>
                  <span className="flex items-center gap-1">
                    <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                    {pager.map((p, i) => p === '…' ? <span key={`e${i}`} className="px-1">…</span> : <button key={p} type="button" onClick={() => setPage(p)} className={`h-8 min-w-8 rounded-lg px-2 text-[12.5px] font-bold ${p === page ? 'text-white' : 'border border-[#E2E8F0] text-[#0F172A]'}`} style={p === page ? { background: NAVY } : undefined}>{p}</button>)}
                    <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                  </span>
                  <select className={`${sel} h-8`} aria-label="Per page" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>{[8, 20, 50, 100].map((n) => <option key={n} value={n}>{n} per page</option>)}</select>
                </div>
              </div>

            </div>
          </div>
        )}

        {tab === 'send' && (
          <div className="space-y-4">
            <section className={`${card} overflow-hidden`} data-broadcasts>
              <div className="flex items-center justify-between border-b border-[#EEF2F6] px-4 py-3"><h3 className="text-[15.5px] font-extrabold text-[#0F172A]">Bulk sends</h3><button type="button" onClick={loadBroadcasts} className="flex items-center gap-1 text-[12.5px] font-bold text-[#2563EB]"><RefreshCw className="h-3.5 w-3.5" />Refresh</button></div>
              {broadcasts.length === 0 ? <p className="px-4 py-6 text-[13px] text-[#64748B]">No bulk sends yet. In Contacts, tick people (or press “Bulk Send”) and send a template from the panel on the right.</p> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[13px]">
                  <thead><tr className="bg-[#F8FAFC] text-[11.5px] font-bold uppercase text-[#64748B]"><th className="px-4 py-2">When</th><th className="px-2 py-2">Template</th><th className="px-2 py-2">To</th><th className="px-2 py-2">Result</th><th className="px-2 py-2">Status</th><th className="px-4 py-2"></th></tr></thead>
                  <tbody>{broadcasts.map((b) => {
                    const s = BSTATUS[b.status] || { label: b.status, cls: 'bg-slate-100 text-slate-700' }
                    return (
                      <tr key={b._id} data-broadcast-row className="border-t border-[#F1F5F9]">
                        <td className="whitespace-nowrap px-4 py-2.5 text-[#475569]">{b.status === 'scheduled' && b.scheduledAt ? <>for {when(b.scheduledAt)}</> : when(b.createdAt)}</td>
                        <td className="px-2 py-2.5 font-semibold text-[#0F172A]">{b.templateName}</td>
                        <td className="max-w-[240px] px-2 py-2.5 text-[#475569]"><span className="block truncate" title={b.audience}>{b.total.toLocaleString('en-IN')} · {b.audience || 'contacts'}</span></td>
                        <td className="whitespace-nowrap px-2 py-2.5"><b className="text-[#15803D]">{b.sent} sent</b>{b.failed ? <> · <b className="text-[#DC2626]">{b.failed} failed</b></> : null}{b.skipped ? ` · ${b.skipped} skipped` : ''}</td>
                        <td className="px-2 py-2.5"><span className={`rounded-md px-2 py-0.5 text-[11.5px] font-bold ${s.cls}`}>{s.label}</span></td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right">
                          {b.failed > 0 && <button type="button" className="mr-3 text-[12.5px] font-bold text-[#2563EB]" onClick={async () => { const r = await adminWhatsappContactsAPI.broadcast(b._id); setFailedOf({ name: b.templateName, rows: r.data?.data?.failedRecipients || [] }) }}>Why failed?</button>}
                          {['scheduled', 'queued', 'running'].includes(b.status) && <button type="button" className="text-[12.5px] font-bold text-[#DC2626]" onClick={async () => { const r = await adminWhatsappContactsAPI.cancelBroadcast(b._id); toast[r.data?.success ? 'success' : 'error'](r.data?.message || 'Done'); loadBroadcasts() }}>{b.status === 'scheduled' ? 'Cancel' : 'Stop'}</button>}
                        </td>
                      </tr>
                    )
                  })}</tbody>
                </table></div>
              )}
            </section>
            <div className={`${card} overflow-hidden`}><WhatsAppSender /></div>
          </div>
        )}

        {tab === 'history' && <WhatsAppSentHistory senders={senders} knownTags={knownTags} />}

        {tab === 'segments' && (
          <section className={`${card} p-4`} data-segments>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-[15.5px] font-extrabold text-[#0F172A]">Segments</h3><p className="text-[12.5px] text-[#64748B]">Every tag is a ready-made group. Open it, or send it a template.</p></div><button type="button" onClick={() => setManageTags(true)} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-[12.5px] font-bold text-[#0F172A]"><Tags className="h-3.5 w-3.5" />Manage Tags</button></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...TYPES.map((t) => ({ kind: 'type' as const, value: t.value, text: `${t.label}s`, count: meta.types.find((x) => x.value === t.value)?.count || 0 })).filter((x) => x.count), ...meta.tags.map((t) => ({ kind: 'tag' as const, value: t.value, text: t.value, count: t.count }))].map((s) => (
                <div key={`${s.kind}:${s.value}`} data-segment className="rounded-xl border border-[#EEF2F6] p-3">
                  <div className="flex items-center justify-between gap-2"><span className={`rounded-md px-2 py-0.5 text-[12px] font-bold ${s.kind === 'tag' ? tagColour(s.value) : 'bg-[#F1F5F9] text-[#334155]'}`}>{s.text}</span><span className="text-[10.5px] font-semibold uppercase text-[#94A3B8]">{s.kind === 'tag' ? 'Tag' : 'Type'}</span></div>
                  <b className="mt-2 block text-[22px] font-extrabold text-[#0F172A]">{s.count.toLocaleString('en-IN')}</b><span className="text-[12px] text-[#64748B]">contacts</span>
                  <div className="mt-2.5 flex gap-2">
                    <button type="button" className="h-8 flex-1 rounded-lg border border-[#E2E8F0] text-[12.5px] font-bold text-[#0F172A] hover:bg-[#F8FAFC]" onClick={() => { setSearch(''); setFilter({ tag: s.kind === 'tag' ? s.value : 'all', city: 'all', type: s.kind === 'type' ? s.value : 'all', optIn: 'all', last: 'all', source: 'all' }); setTab('contacts') }}>View</button>
                    <button type="button" data-segment-send className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg text-[12.5px] font-bold text-white" style={{ background: NAVY }} onClick={() => { setSearch(''); setFilter({ tag: s.kind === 'tag' ? s.value : 'all', city: 'all', type: s.kind === 'type' ? s.value : 'all', optIn: 'all', last: 'all', source: 'all' }); setPicked(new Set()); setTimeout(() => setAllMatching(true), 0); toSend() }}><Send className="h-3.5 w-3.5" />Send</button>
                  </div>
                </div>
              ))}
              {meta.tags.length === 0 && meta.total === 0 && <p className="col-span-full py-6 text-center text-[13px] text-[#64748B]">Add contacts and tags first — the segments appear here.</p>}
            </div>
          </section>
        )}

        {tab === 'templates' && (
          <WhatsAppTemplatesTab senders={senders} onCounts={setTplCounts}
            onUse={(key) => { setPresetKey(key); setTab('contacts'); if (count) setSendOpen(true); else toast.info(`“${key.split('::')[0]}” is chosen. Tick contacts and press Send Template, or press Bulk Send.`) }} />
        )}

        {tab === 'imports' && (
          <section className={`${card} overflow-hidden`} data-imports>
            <div className="flex items-center justify-between border-b border-[#EEF2F6] px-4 py-3"><h3 className="text-[15.5px] font-extrabold text-[#0F172A]">Import History</h3><button type="button" onClick={downloadSample} className="flex items-center gap-1 text-[12.5px] font-bold text-[#2563EB]"><Download className="h-3.5 w-3.5" />Download sample file</button></div>
            {imports.length === 0 ? <p className="px-4 py-8 text-center text-[13px] text-[#64748B]">Nothing imported yet. Use “Import Excel” to add contacts from a file.</p> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[13px]">
                <thead><tr className="bg-[#F8FAFC] text-[11.5px] font-bold uppercase text-[#64748B]"><th className="px-4 py-2">File</th><th className="px-2 py-2">When</th><th className="px-2 py-2">Rows</th><th className="px-2 py-2">New</th><th className="px-2 py-2">Updated</th><th className="px-2 py-2">Already there</th><th className="px-2 py-2">Invalid</th><th className="px-4 py-2">By</th></tr></thead>
                <tbody>{imports.map((im) => (
                  <tr key={im._id} data-import-row className="border-t border-[#F1F5F9] align-top">
                    <td className="px-4 py-2.5"><span className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 shrink-0 text-[#16A34A]" /><b className="max-w-[260px] truncate text-[#0F172A]">{im.filename || 'Import'}</b></span>{im.tags?.length > 0 && <span className="mt-1 flex flex-wrap gap-1">{im.tags.map((t) => <TagPill key={t} tag={t} />)}</span>}</td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-[#475569]">{when(im.createdAt)}</td>
                    <td className="px-2 py-2.5">{im.total.toLocaleString('en-IN')}</td><td className="px-2 py-2.5 font-bold text-[#15803D]">{im.added}</td><td className="px-2 py-2.5">{im.updated}</td><td className="px-2 py-2.5">{im.skipped}</td>
                    <td className="px-2 py-2.5">{im.invalid > 0 ? <button type="button" className="font-bold text-[#DC2626] underline" title="Download the rows that were left out" onClick={() => downloadCsv(`invalid-${(im.filename || 'import').replace(/\.\w+$/, '')}.csv`, [['Row', 'Number in file', 'Problem'], ...im.invalidRows.map((r) => [r.row, r.phone, r.reason])])}>{im.invalid}</button> : 0}</td>
                    <td className="px-4 py-2.5 text-[#475569]">{im.by?.fullName || '—'}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </section>
        )}
      </div>

      {/* dialogs */}
      {importOpen && (
        <Modal title="Import from Excel" onClose={() => setImportOpen(false)}>
          <div className="mb-3 flex items-center justify-between gap-2 text-[12.5px] text-[#64748B]"><span>An Excel (.xlsx) or CSV file with names and WhatsApp numbers.</span><button type="button" data-download-sample onClick={downloadSample} className="flex shrink-0 items-center gap-1 font-bold text-[#2563EB]"><Download className="h-3.5 w-3.5" />Download Sample</button></div>
          <ImportCard knownTags={knownTags} onImported={() => { setImportOpen(false); refresh(); loadImports() }} />
          <button type="button" onClick={() => { setImportOpen(false); syncApp() }} className="mt-3 flex w-full items-center justify-center gap-1.5 text-[12.5px] font-bold text-[#2563EB]"><Users className="h-3.5 w-3.5" />Or bring in the people already registered in the app</button>
        </Modal>
      )}
      {sendOpen && (
        <Modal title="Send WhatsApp Template" onClose={() => setSendOpen(false)}>
          <SendPanel inDialog audience={audience} templates={templates} senders={senders} loadingTemplates={tplLoading} templatesError={tplError} presetKey={presetKey}
            onClear={() => { clearPicked(); setSendOpen(false) }} onReloadTemplates={loadTemplates}
            onSent={() => { setSendOpen(false); clearPicked(); loadBroadcasts(); loadMeta(); setTimeout(() => { loadBroadcasts(); loadRows(); loadMeta() }, 2500) }} />
        </Modal>
      )}
      {adding && <Modal title="Add Contact" onClose={() => setAdding(false)}><ContactForm knownTags={knownTags} cities={cities} onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); refresh() }} /></Modal>}
      {editing && <Modal title="Edit Contact" onClose={() => setEditing(null)}><ContactForm contact={editing} knownTags={knownTags} cities={cities} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} /></Modal>}
      {tagDlg && (
        <Modal title={tagDlg === 'add' ? `Add a tag to ${count.toLocaleString('en-IN')} contact${count === 1 ? '' : 's'}` : `Remove a tag from ${count.toLocaleString('en-IN')} contact${count === 1 ? '' : 's'}`} onClose={() => setTagDlg(null)} busy={busy}>
          {tagDlg === 'add' ? <input autoFocus value={tagText} onChange={(e) => setTagText(e.target.value)} aria-label="Tag" placeholder="e.g. VIP" className={field} onKeyDown={(e) => { if (e.key === 'Enter' && tagText.trim()) { bulk('addTag', tagText).then(() => setTagDlg(null)) } }} /> : null}
          <div className="mt-2 flex flex-wrap gap-1.5">{knownTags.map((t) => <button key={t} type="button" onClick={() => setTagText(t)} className={`rounded-md px-2 py-1 text-[12px] font-semibold ${tagColour(t)} ${tagText === t ? 'ring-2 ring-[#0F172A]/40' : ''}`}>{t}</button>)}{tagDlg === 'remove' && !knownTags.length && <span className="text-[13px] text-[#64748B]">There are no tags yet.</span>}</div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setTagDlg(null)} className="h-10 rounded-lg border border-[#E2E8F0] px-4 text-[13.5px] font-bold text-[#334155]">Cancel</button>
            <button type="button" data-tag-apply disabled={!tagText.trim() || busy} onClick={() => bulk(tagDlg === 'add' ? 'addTag' : 'removeTag', tagText).then(() => setTagDlg(null))} className="h-10 rounded-lg px-5 text-[13.5px] font-bold text-white disabled:opacity-50" style={{ background: ORANGE }}>{tagDlg === 'add' ? 'Add Tag' : 'Remove Tag'}</button>
          </div>
        </Modal>
      )}
      {manageTags && (
        <Modal title="Manage Tags" onClose={() => setManageTags(false)}>
          {meta.tags.length === 0 && <p className="text-[13px] text-[#64748B]">No tags yet. A tag is made the first time you put it on a contact or on an import.</p>}
          <div className="space-y-2" data-manage-tags>{meta.tags.map((t) => (
            <div key={t.value} className="flex items-center gap-2 rounded-xl border border-[#EEF2F6] px-3 py-2">
              <TagPill tag={t.value} /><span className="flex-1 text-[12.5px] text-[#64748B]">{t.count.toLocaleString('en-IN')} contact{t.count === 1 ? '' : 's'}</span>
              <button type="button" className="text-[12.5px] font-bold text-[#2563EB]" onClick={async () => { const to = window.prompt(`New name for “${t.value}”`, t.value); if (!to || to.trim() === t.value) return; const r = await adminWhatsappContactsAPI.renameTag(t.value, to); toast[r.data?.success ? 'success' : 'error'](r.data?.message || 'Done'); refresh() }}>Rename</button>
              <button type="button" className="text-[12.5px] font-bold text-[#DC2626]" onClick={() => setConfirm({ title: `Remove the tag “${t.value}”?`, action: 'Remove tag', body: <>It is taken off {t.count.toLocaleString('en-IN')} contact{t.count === 1 ? '' : 's'}. The contacts themselves stay.</>, run: async () => { const r = await adminWhatsappContactsAPI.deleteTag(t.value); toast[r.data?.success ? 'success' : 'error'](r.data?.message || 'Done'); refresh() } })}>Delete</button>
            </div>
          ))}</div>
        </Modal>
      )}
      {failedOf && (
        <Modal title={`Not delivered — ${failedOf.name}`} onClose={() => setFailedOf(null)} wide>
          <p className="mb-2 text-[12.5px] text-[#64748B]">WhatsApp refused these. The reason is in its own words.</p>
          <div className="overflow-x-auto rounded-xl border border-[#EEF2F6]"><table className="w-full text-left text-[12.5px]"><thead><tr className="bg-[#F8FAFC] text-[11px] font-bold uppercase text-[#64748B]"><th className="px-3 py-2">Contact</th><th className="px-3 py-2">Number</th><th className="px-3 py-2">Reason</th></tr></thead>
            <tbody>{failedOf.rows.map((r, i) => <tr key={i} className="border-t border-[#F1F5F9]"><td className="px-3 py-1.5">{r.name || '—'}</td><td className="whitespace-nowrap px-3 py-1.5">{prettyPhone(r.phone)}</td><td className="px-3 py-1.5 text-[#B91C1C]">{r.error}</td></tr>)}</tbody></table></div>
        </Modal>
      )}
      {confirm && <Confirm title={confirm.title} body={confirm.body} action={confirm.action} danger={/delete|remove/i.test(confirm.action)} busy={busy} onNo={() => setConfirm(null)} onYes={async () => { setBusy(true); try { await confirm.run() } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not do that') } finally { setBusy(false); setConfirm(null) } }} />}
    </div>
  )
}
