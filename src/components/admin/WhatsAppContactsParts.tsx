'use client'

// Pieces of admin → Communication → WhatsApp (WhatsAppContacts.tsx):
// the "Send WhatsApp Template" panel, the contact form, the import card and its
// preview, and small shared bits (tag pills, confirm dialog).
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle, CalendarClock, CheckCheck, CheckCircle2, ChevronDown, Clock, Download, Eye, FileSpreadsheet, FileText, ImagePlus, Lightbulb, Loader2, MapPin, Package, Play, Plus, RefreshCw, Save, Send, Tag,
  Upload, UploadCloud, User, Users, X,
  Signal, Wifi, BatteryFull, ChevronLeft, BadgeCheck, Video, Phone, MoreVertical, Smile, Paperclip, Camera, Mic,
} from 'lucide-react'
import { adminWhatsappAPI, adminWhatsappContactsAPI, type WaContactFilter } from '@/services/api'
import { MEDIA_ACCEPT, btnIcon, renderWaText } from './WhatsAppSender'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { SAMPLE_ROWS, downloadCsv, normalizePhone, readContactsFile, type ParsedContacts } from '@/lib/contactsFile'

export interface WaContact {
  _id: string; name: string; phone: string; altPhone?: string; city?: string; type: string; tags: string[]; source: string; notes?: string
  optIn: boolean; optOutReason?: string; lastContactedAt?: string; createdAt: string
}
export interface WaTemplate {
  id: string; name: string; language: string; category?: string; bodyText?: string; varCount?: number
  headerType?: string | null; headerText?: string; footerText?: string; buttons?: { type: string; text: string }[]
}
export interface WaSender { id: string; display: string; name: string }
export type Audience = { mode: 'none' } | { mode: 'ids'; ids: string[]; label: string } | { mode: 'all'; filter: WaContactFilter; label: string }

export { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'

export const ORANGE = '#F4511E'
export const NAVY = '#0F2A4A'
export const TYPES: { value: string; label: string }[] = [
  { value: 'customer', label: 'Customer' }, { value: 'mechanic', label: 'Mechanic' }, { value: 'garage', label: 'Garage' }, { value: 'lead', label: 'Lead' }, { value: 'other', label: 'Other' },
]
export const SOURCES: Record<string, string> = { manual: 'Added by hand', import: 'Excel / CSV', app: 'App users', chat: 'Messaged us' }
export const prettyPhone = (p?: string) => { const d = String(p || '').replace(/\D/g, ''); return d.length === 12 ? `+${d.slice(0, 2)} ${d.slice(2, 7)} ${d.slice(7)}` : d }
export const initials = (n?: string) => String(n || '?').trim().split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase() || '?'
export const ago = (iso?: string) => {
  if (!iso) return 'Never'
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  return d <= 0 ? 'Today' : d === 1 ? '1 day ago' : d < 60 ? `${d} days ago` : `${Math.floor(d / 30)} months ago`
}

// a tag keeps its colour everywhere: picked from its letters
const TAG_COLOURS = ['bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-violet-100 text-violet-700', 'bg-orange-100 text-orange-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-800', 'bg-teal-100 text-teal-700', 'bg-indigo-100 text-indigo-700']
export const tagColour = (t: string) => { let h = 0; for (const c of t.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0; return TAG_COLOURS[h % TAG_COLOURS.length] }
export const TagPill = ({ tag, onRemove }: { tag: string; onRemove?: () => void }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${tagColour(tag)}`}>
    {tag}{onRemove && <button type="button" aria-label={`Remove ${tag}`} onClick={onRemove} className="-mr-0.5 opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>}
  </span>
)

export const field = 'h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13.5px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#F4511E]'
export const label = 'mb-1 block text-[12.5px] font-semibold text-[#334155]'

export function Modal({ title, onClose, children, wide, size, plain, busy }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; size?: 'xl'; plain?: boolean; busy?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0B1730]/60 p-3" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <div className={`flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${size === 'xl' ? 'h-full max-h-[960px] max-w-[1120px]' : wide ? 'max-w-[820px]' : 'max-w-[520px]'}`}>
        <div className={`flex items-center justify-between gap-3 border-b border-[#EEF2F6] px-5 py-3.5 ${plain ? 'hidden' : ''}`}>
          <h2 className="text-[17px] font-extrabold text-[#0F172A]">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9]"><X className="h-5 w-5" /></button>
        </div>
        <div className={plain ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'min-h-0 overflow-y-auto p-5'}>{children}</div>
      </div>
    </div>
  )
}

export function Confirm({ title, body, action, danger, onYes, onNo, busy }: { title: string; body: React.ReactNode; action: string; danger?: boolean; onYes: () => void; onNo: () => void; busy?: boolean }) {
  return (
    <Modal title={title} onClose={onNo} busy={busy}>
      <div className="text-[13.5px] leading-relaxed text-[#475569]">{body}</div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onNo} disabled={busy} className="h-10 rounded-lg border border-[#E2E8F0] px-4 text-[13.5px] font-bold text-[#334155] hover:bg-[#F8FAFC]">Cancel</button>
        <button type="button" data-confirm-yes onClick={onYes} disabled={busy} className={`flex h-10 items-center gap-2 rounded-lg px-4 text-[13.5px] font-bold text-white disabled:opacity-60 ${danger ? 'bg-[#DC2626] hover:bg-[#B91C1C]' : 'bg-[#12A34B] hover:bg-[#0F8F41]'}`}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}{action}
        </button>
      </div>
    </Modal>
  )
}

/** Tags typed as chips: Enter or a comma adds one; known tags are offered. */
export function TagInput({ value, onChange, known, placeholder = 'Add a tag and press Enter' }: { value: string[]; onChange: (v: string[]) => void; known: string[]; placeholder?: string }) {
  const [text, setText] = useState('')
  const add = (raw: string) => {
    const t = raw.replace(/\s+/g, ' ').trim().slice(0, 40)
    if (t && !value.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...value, known.find((k) => k.toLowerCase() === t.toLowerCase()) || t])
    setText('')
  }
  const offers = known.filter((k) => !value.includes(k) && (!text || k.toLowerCase().includes(text.toLowerCase()))).slice(0, 6)
  return (
    <div>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5 focus-within:border-[#F4511E]">
        {value.map((t) => <TagPill key={t} tag={t} onRemove={() => onChange(value.filter((x) => x !== t))} />)}
        <input value={text} aria-label="Tags" placeholder={value.length ? '' : placeholder} className="min-w-[110px] flex-1 bg-transparent px-1 text-[13.5px] outline-none placeholder:text-[#94A3B8]"
          onChange={(e) => { const v = e.target.value; if (/[,;]$/.test(v)) add(v.slice(0, -1)); else setText(v) }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(text) } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1)) }}
          onBlur={() => text && add(text)} />
      </div>
      {offers.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{offers.map((k) => <button key={k} type="button" onMouseDown={(e) => { e.preventDefault(); add(k) }} className={`rounded-md px-2 py-0.5 text-[11px] font-semibold opacity-80 hover:opacity-100 ${tagColour(k)}`}>+ {k}</button>)}</div>}
    </div>
  )
}

// ─── Add / edit one contact ──────────────────────────────────────────────────
export function ContactForm({ contact, knownTags, cities, onSaved, onCancel, compact }: {
  contact?: WaContact | null; knownTags: string[]; cities: string[]; onSaved: () => void; onCancel?: () => void; compact?: boolean
}) {
  const blank = { name: '', phone: '', altPhone: '', city: '', type: 'customer', tags: [] as string[], notes: '', optIn: true }
  const [f, setF] = useState(blank)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    setF(contact ? { name: contact.name || '', phone: contact.phone.slice(-10), altPhone: (contact.altPhone || '').slice(-10), city: contact.city || '', type: contact.type || 'customer', tags: contact.tags || [], notes: contact.notes || '', optIn: contact.optIn } : blank)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact?._id])
  const set = (p: Partial<typeof blank>) => setF((x) => ({ ...x, ...p }))
  const save = async () => {
    if (!f.name.trim()) { toast.error('Enter the full name'); return }
    if (!normalizePhone(f.phone)) { toast.error('Enter a valid 10-digit WhatsApp number'); return }
    if (f.altPhone && !normalizePhone(f.altPhone)) { toast.error('The alternate number is not a valid mobile number'); return }
    setSaving(true)
    try {
      const body = { ...f, name: f.name.trim() }
      const res = contact ? await adminWhatsappContactsAPI.update(contact._id, body) : await adminWhatsappContactsAPI.create(body)
      if (res.data?.success) { toast.success(contact ? 'Contact updated' : 'Contact saved'); if (!contact) setF(blank); onSaved() }
      else toast.error(res.data?.message || 'Could not save the contact')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not save the contact') } finally { setSaving(false) }
  }
  const phoneBox = (key: 'phone' | 'altPhone', aria: string) => (
    <div className="flex h-10 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white focus-within:border-[#F4511E]">
      <span className="flex items-center border-r border-[#E2E8F0] px-2.5 text-[13px] text-[#475569]">+91</span>
      <input value={f[key]} inputMode="numeric" maxLength={12} aria-label={aria} placeholder="98765 43210" className="min-w-0 flex-1 px-3 text-[13.5px] outline-none placeholder:text-[#94A3B8]"
        onChange={(e) => set({ [key]: e.target.value.replace(/[^\d ]/g, '') } as any)} />
    </div>
  )
  return (
    <div data-contact-form>
      <datalist id="wa-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
      <div className={`grid grid-cols-1 gap-3 ${compact ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <div><label className={label}>Full Name <span className="text-red-500">*</span></label><input className={field} value={f.name} aria-label="Full Name" placeholder="e.g. Ramesh Kumar" onChange={(e) => set({ name: e.target.value })} /></div>
        <div><label className={label}>WhatsApp Number <span className="text-red-500">*</span></label>{phoneBox('phone', 'WhatsApp Number')}</div>
        <div><label className={label}>Alternate Phone</label>{phoneBox('altPhone', 'Alternate Phone')}</div>
        <div><label className={label}>City</label><input className={field} list="wa-cities" value={f.city} aria-label="City" placeholder="e.g. Gorakhpur" onChange={(e) => set({ city: e.target.value })} /></div>
        <div><label className={label}>Type</label>
          <select className={field} value={f.type} aria-label="Type" onChange={(e) => set({ type: e.target.value })}>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
        </div>
        <div className={compact ? '' : 'sm:col-span-1'}><label className={label}>Tags</label><TagInput value={f.tags} onChange={(tags) => set({ tags })} known={knownTags} /></div>
      </div>
      <div className="mt-3"><label className={label}>Notes</label>
        <textarea rows={2} className={`${field} h-auto py-2`} value={f.notes} aria-label="Notes" placeholder="Add notes about this contact…" onChange={(e) => set({ notes: e.target.value })} />
      </div>
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-[12.5px] text-[#334155]">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#2563EB]" checked={f.optIn} aria-label="Consent" onChange={(e) => set({ optIn: e.target.checked })} />
        <span>Customer has given consent to receive WhatsApp messages{!f.optIn && <b className="block text-[11.5px] font-semibold text-[#B45309]">Without consent the contact is saved as “Opted Out” and is never sent templates.</b>}</span>
      </label>
      <div className="mt-4 flex justify-end gap-2">
        {onCancel && <button type="button" onClick={onCancel} disabled={saving} className="h-10 rounded-lg border border-[#E2E8F0] px-5 text-[13.5px] font-bold text-[#334155] hover:bg-[#F8FAFC]">Cancel</button>}
        <button type="button" data-save-contact onClick={save} disabled={saving} className="flex h-10 items-center gap-2 rounded-lg px-5 text-[13.5px] font-bold text-white disabled:opacity-60" style={{ background: ORANGE }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{contact ? 'Save Changes' : 'Save Contact'}
        </button>
      </div>
    </div>
  )
}

// ─── Import from Excel / CSV ─────────────────────────────────────────────────
export function ImportCard({ knownTags, onImported, pickRef }: { knownTags: string[]; onImported: () => void; pickRef?: React.MutableRefObject<(() => void) | null> }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [reading, setReading] = useState(false)
  const [parsed, setParsed] = useState<{ file: string; data: ParsedContacts } | null>(null)
  const [preview, setPreview] = useState(false)
  const [importing, setImporting] = useState(false)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [showPreview, setShowPreview] = useState(true)
  const [consent, setConsent] = useState(true)
  const [tags, setTags] = useState<string[]>([])
  useEffect(() => { if (pickRef) pickRef.current = () => fileRef.current?.click() }, [pickRef])

  const doImport = async (p = parsed) => {
    if (!p) return
    setImporting(true)
    try {
      const res = await adminWhatsappContactsAPI.importRows({ filename: p.file, rows: p.data.rows, options: { skipDuplicates, tags, optIn: consent } })
      if (res.data?.success) { toast.success(`Imported: ${res.data.message}`); setParsed(null); setPreview(false); onImported() }
      else toast.error(res.data?.message || 'The import failed')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'The import failed') } finally { setImporting(false) }
  }
  const onFile = async (file?: File | null) => {
    if (!file) return
    setReading(true)
    try {
      const data = await readContactsFile(file)
      const p = { file: file.name, data }
      setParsed(p)
      if (showPreview) setPreview(true)
    } catch (e: any) { toast.error(e?.message || 'This file could not be read') } finally { setReading(false); if (fileRef.current) fileRef.current.value = '' }
  }
  const tick = 'flex cursor-pointer items-center gap-2 text-[12.5px] text-[#334155]'
  const d = parsed?.data
  return (
    <div data-import-card>
      <input ref={fileRef} type="file" hidden accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => onFile(e.target.files?.[0])} />
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]) }}
        className={`flex flex-col items-center rounded-xl border border-dashed px-4 py-5 text-center ${drag ? 'border-[#16A34A] bg-[#F0FDF4]' : 'border-[#CBD5E1] bg-[#FAFBFD]'}`}>
        {reading ? <Loader2 className="h-7 w-7 animate-spin text-[#16A34A]" /> : <FileSpreadsheet className="h-7 w-7 text-[#16A34A]" />}
        {parsed ? (
          <>
            <b className="mt-1.5 max-w-full truncate text-[13.5px] text-[#0F172A]">{parsed.file}</b>
            <span className="text-[12px] text-[#475569]">{d!.total.toLocaleString('en-IN')} rows · <b className="text-[#15803D]">{d!.valid.toLocaleString('en-IN')} usable</b>{d!.invalid ? <> · <b className="text-[#B91C1C]">{d!.invalid} invalid</b></> : null}{d!.repeated ? ` · ${d!.repeated} repeated` : ''}</span>
            <span className="mt-2 flex gap-2">
              <button type="button" onClick={() => setPreview(true)} className="h-8 rounded-lg border border-[#CBD5E1] bg-white px-3 text-[12.5px] font-bold text-[#0F172A]">Preview</button>
              <button type="button" onClick={() => setParsed(null)} className="h-8 rounded-lg px-2 text-[12.5px] font-bold text-[#64748B] hover:text-[#0F172A]">Remove</button>
            </span>
          </>
        ) : (
          <>
            <b className="mt-1.5 text-[13.5px] text-[#0F172A]">Drag &amp; drop your Excel file here</b>
            <span className="text-[12px] text-[#64748B]">or <button type="button" onClick={() => fileRef.current?.click()} className="font-semibold text-[#2563EB] underline">click to browse</button> (.xlsx, .csv)</span>
            <button type="button" data-choose-file onClick={() => fileRef.current?.click()} className="mt-2.5 h-9 rounded-lg border border-[#CBD5E1] bg-white px-4 text-[13px] font-bold text-[#0F172A] hover:bg-[#F8FAFC]">Choose File</button>
          </>
        )}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        <label className={tick}><input type="checkbox" className="h-4 w-4 accent-[#2563EB]" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} />Skip numbers already saved</label>
        <label className={tick}><input type="checkbox" className="h-4 w-4 accent-[#2563EB]" checked={showPreview} onChange={(e) => setShowPreview(e.target.checked)} />Show preview before import</label>
        <label className={tick} title="For a number you already have: add this file's tags to it and fill in details that are empty. Nothing already saved is overwritten."><input type="checkbox" className="h-4 w-4 accent-[#2563EB]" checked={!skipDuplicates} onChange={(e) => setSkipDuplicates(!e.target.checked)} />Add tags to existing contacts</label>
        <label className={tick} title="Untick if these people have not agreed to WhatsApp messages: they are saved as Opted Out."><input type="checkbox" className="h-4 w-4 accent-[#2563EB]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />These contacts gave consent</label>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-3 text-[11.5px] text-[#64748B]"><span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />Columns are found automatically</span><span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />Every number is checked; invalid ones are reported</span></p>
      <div className="mt-2.5"><label className={label}>Tag every contact of this file <span className="font-normal text-[#94A3B8]">(optional)</span></label><TagInput value={tags} onChange={setTags} known={knownTags} placeholder="e.g. Diwali Offer" /></div>
      <button type="button" data-import-go disabled={!parsed || importing || !parsed.data.valid} onClick={() => (showPreview ? setPreview(true) : doImport())}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-bold text-white disabled:opacity-50" style={{ background: ORANGE }}>
        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Import Contacts{parsed ? ` (${parsed.data.valid.toLocaleString('en-IN')})` : ''}
      </button>

      {preview && d && (
        <Modal title={`Preview — ${parsed!.file}`} onClose={() => setPreview(false)} wide busy={importing}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-import-preview>
            {[['Rows in file', d.total, 'text-[#0F172A]'], ['Will be imported', d.valid, 'text-[#15803D]'], ['Invalid numbers', d.invalid, d.invalid ? 'text-[#B91C1C]' : 'text-[#0F172A]'], ['Repeated in file', d.repeated, 'text-[#0F172A]']].map(([k, v, c]) => (
              <div key={k as string} className="rounded-xl border border-[#EEF2F6] px-3 py-2"><p className="text-[11.5px] text-[#64748B]">{k}</p><b className={`text-[20px] font-extrabold ${c}`}>{Number(v).toLocaleString('en-IN')}</b></div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-[#475569]">Columns used: {d.columns.map((c) => <span key={c.field} className="mr-1.5 inline-block rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[11.5px]"><b>{c.header}</b> → {c.field === 'phone' ? 'WhatsApp number' : c.field === 'altPhone' ? 'alternate phone' : c.field}</span>)}{!d.hadHeader && <span className="text-[#B45309]"> (the file has no heading row — columns were guessed)</span>}</p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-[#EEF2F6]">
            <table className="w-full min-w-[560px] text-left text-[12.5px]">
              <thead><tr className="bg-[#F8FAFC] text-[11px] font-bold uppercase text-[#64748B]"><th className="px-3 py-2">Name</th><th className="px-3 py-2">WhatsApp number</th><th className="px-3 py-2">City</th><th className="px-3 py-2">Tags</th></tr></thead>
              <tbody>{d.rows.slice(0, 8).map((r, i) => {
                const good = normalizePhone(r.phone)
                return <tr key={i} className="border-t border-[#F1F5F9]"><td className="px-3 py-1.5">{r.name || '—'}</td><td className={`px-3 py-1.5 ${good ? '' : 'font-semibold text-[#B91C1C]'}`}>{good ? prettyPhone(good) : `${r.phone || '(empty)'} — invalid`}</td><td className="px-3 py-1.5">{r.city || '—'}</td><td className="px-3 py-1.5">{[r.tags, ...tags].filter(Boolean).join(', ') || '—'}</td></tr>
              })}</tbody>
            </table>
          </div>
          {d.total > 8 && <p className="mt-1 text-[11.5px] text-[#94A3B8]">Showing the first 8 of {d.total.toLocaleString('en-IN')} rows.</p>}
          {d.invalid > 0 && (
            <div className="mt-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-[12.5px] text-[#991B1B]">
              <b className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />{d.invalid} row{d.invalid === 1 ? '' : 's'} will be left out</b>
              <ul className="mt-1 max-h-24 list-disc overflow-y-auto pl-5">{d.invalidRows.slice(0, 20).map((r) => <li key={r.row}>Row {r.row}: {r.phone || '(empty)'} — {r.reason}</li>)}</ul>
              <button type="button" onClick={() => downloadCsv('invalid-rows.csv', [['Row', 'Number in file', 'Problem'], ...d.invalidRows.map((r) => [r.row, r.phone, r.reason])])} className="mt-1.5 font-bold underline">Download the invalid rows</button>
            </div>
          )}
          <p className="mt-3 text-[12px] text-[#64748B]">{skipDuplicates ? 'Numbers you already have are left exactly as they are.' : 'Numbers you already have get this file’s tags and any details that are empty — nothing saved is overwritten.'}{!consent && ' These contacts will be saved as Opted Out.'}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setPreview(false)} disabled={importing} className="h-10 rounded-lg border border-[#E2E8F0] px-4 text-[13.5px] font-bold text-[#334155]">Back</button>
            <button type="button" data-import-confirm onClick={() => doImport()} disabled={importing || !d.valid} className="flex h-10 items-center gap-2 rounded-lg px-5 text-[13.5px] font-bold text-white disabled:opacity-60" style={{ background: ORANGE }}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Import {d.valid.toLocaleString('en-IN')} contact{d.valid === 1 ? '' : 's'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
export const downloadSample = () => downloadCsv('whatsapp-contacts-sample.csv', SAMPLE_ROWS)

// ─── Send WhatsApp Template (to the ticked contacts, or to everybody the filters show) ──
const PLACEHOLDERS: { token: string; label: string }[] = [{ token: '{first_name}', label: 'First name' }, { token: '{name}', label: 'Full name' }, { token: '{city}', label: 'City' }]
const fillFor = (v: string, p?: { name?: string; city?: string; phone?: string }) => {
  const first = String(p?.name || '').trim().split(/\s+/)[0] || 'Customer'
  return v.replace(/\{\s*name\s*\}/gi, p?.name || 'Customer').replace(/\{\s*first[_ ]?name\s*\}/gi, first).replace(/\{\s*city\s*\}/gi, p?.city || '').replace(/\{\s*phone\s*\}/gi, String(p?.phone || '').slice(-10))
}

/** One numbered step of the send dialog. Lives outside SendPanel so React does not remount it on every keystroke. */
const Step = ({ n, title, sub, right, children }: { n: number; title: string; sub: string; right?: React.ReactNode; children: React.ReactNode }) => (
  <section className="rounded-xl border border-[#E8EDF3] bg-white p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#B91C1C] text-[13px] font-extrabold text-white">{n}</span><div><h3 className="text-[15px] font-extrabold leading-tight text-[#0F172A]">{title}</h3><p className="text-[12px] text-[#64748B]">{sub}</p></div></div>
      {right}
    </div>
    <div className="mt-3">{children}</div>
  </section>
)

/** A phone showing the Bharat Mechanics chat, with the message(s) given as children. */
export function PhoneFrame({ children, time, className = '' }: { children: React.ReactNode; time?: string; className?: string }) {
  const clock = time || new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false })
  return (
    <div data-phone-frame className={`mx-auto w-full max-w-[340px] ${className}`}>
      <div className="relative rounded-[44px] bg-[#0B0F19] p-[9px] shadow-[0_18px_40px_-12px_rgba(2,6,23,.55),inset_0_0_0_2px_#2A3140]">
        {/* side buttons */}
        <span className="absolute -left-[3px] top-[96px] h-7 w-[3px] rounded-l bg-[#2A3140]" /><span className="absolute -left-[3px] top-[134px] h-12 w-[3px] rounded-l bg-[#2A3140]" /><span className="absolute -left-[3px] top-[192px] h-12 w-[3px] rounded-l bg-[#2A3140]" /><span className="absolute -right-[3px] top-[150px] h-16 w-[3px] rounded-r bg-[#2A3140]" />
        <div className="relative flex flex-col overflow-hidden rounded-[36px] bg-[#EFEAE2]">
          {/* dynamic island */}
          <span className="absolute left-1/2 top-2.5 z-20 h-[22px] w-[92px] -translate-x-1/2 rounded-full bg-[#0B0F19]" />
          {/* status bar + chat header */}
          <div className="bg-[#075E54] px-5 pb-2.5 pt-3.5 text-white">
            <div className="flex items-center justify-between text-[12.5px] font-semibold"><span className="pl-1">{clock}</span><span className="flex items-center gap-1 pr-1"><Signal className="h-3.5 w-3.5" /><Wifi className="h-3.5 w-3.5" /><BatteryFull className="h-4 w-4" /></span></div>
            <div className="mt-2.5 flex items-center gap-2">
              <ChevronLeft className="-ml-1.5 h-5 w-5 opacity-90" />
              <img src="/apple-touch-icon.png" alt="" className="h-9 w-9 rounded-full bg-white object-cover ring-1 ring-white/30" />
              <span className="min-w-0 flex-1"><b className="flex items-center gap-1 text-[14px] leading-tight">Bharat Mechanics <BadgeCheck className="h-4 w-4 fill-[#25D366] text-[#075E54]" /></b><span className="text-[11px] opacity-80">Online</span></span>
              <Video className="h-5 w-5 opacity-90" /><Phone className="h-[18px] w-[18px] opacity-90" /><MoreVertical className="h-5 w-5 opacity-90" />
            </div>
          </div>
          {/* chat */}
          <div className="min-h-[330px] px-3 pb-3 pt-2.5" style={{ backgroundColor: '#E5DDD5', backgroundImage: 'radial-gradient(rgba(0,0,0,.06) 1px, transparent 1px), radial-gradient(rgba(255,255,255,.35) 1px, transparent 1px)', backgroundSize: '14px 14px, 22px 22px', backgroundPosition: '0 0, 7px 7px' }}>
            <div className="mb-2.5 flex justify-center"><span className="rounded-lg bg-[#D4EAF7]/90 px-2.5 py-1 text-[10.5px] font-semibold text-[#334155] shadow-sm">TODAY</span></div>
            <div className="relative ml-2 before:absolute before:-left-2 before:top-0 before:border-[7px] before:border-transparent before:border-r-white before:border-t-white before:content-['']">{children}</div>
          </div>
          {/* typing bar + home indicator */}
          <div className="flex items-center gap-2 bg-[#F0F2F5] px-2.5 pb-1.5 pt-2">
            <span className="flex h-10 flex-1 items-center gap-2 rounded-full bg-white px-3 text-[12.5px] text-[#94A3B8]"><Smile className="h-5 w-5" /><span className="flex-1">Message</span><Paperclip className="h-4 w-4" /><Camera className="h-4 w-4" /></span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00A884] text-white"><Mic className="h-5 w-5" /></span>
          </div>
          <div className="flex justify-center bg-[#F0F2F5] pb-2"><span className="h-1 w-28 rounded-full bg-[#111827]" /></div>
        </div>
      </div>
    </div>
  )
}

const VAR_ICON = [User, Tag, Clock, MapPin, Package]
export function SendPanel({ audience, templates, senders, loadingTemplates, templatesError, presetKey, onClear, onSent, onReloadTemplates, inDialog, onClose, onRemoveRecipient, onAddMore }: {
  audience: Audience; templates: WaTemplate[]; senders: WaSender[]; loadingTemplates: boolean; templatesError: string
  /** `${name}::${language}` chosen elsewhere on the page (Templates tab) */
  presetKey?: string
  onClear: () => void; onSent: () => void; onReloadTemplates: () => void
  /** shown inside a dialog: the dialog already has the frame and the title */
  inDialog?: boolean
  onClose?: () => void
  /** untick one of the selected contacts */
  onRemoveRecipient?: (id: string) => void
  /** go back to the list to tick more */
  onAddMore?: () => void
}) {
  const [tplKey, setTplKey] = useState('')
  const [senderId, setSenderId] = useState('')
  const [vars, setVars] = useState<string[]>([])
  const [media, setMedia] = useState<{ mediaId: string; kind: string; filename: string; previewUrl: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [when, setWhen] = useState<'now' | 'later'>('now')
  const [at, setAt] = useState('')
  const [info, setInfo] = useState<{ total: number; optedOut: number; willSend: number; sample: { name: string; phone: string; city?: string }[] } | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [testPhone, setTestPhone] = useState(() => { try { return localStorage.getItem('bm_wa_test_phone') || '' } catch { return '' } })
  const [testing, setTesting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const keyOf = (t: WaTemplate) => `${t.name}::${t.language}`
  const tpl = templates.find((t) => keyOf(t) === tplKey)
  const varCount = tpl?.varCount || 0
  const headerType = String(tpl?.headerType || '').toUpperCase()
  const needsMedia = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType)

  useEffect(() => { if (!tplKey && templates[0]) setTplKey(keyOf(templates[0])) }, [templates]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (presetKey && templates.some((t) => keyOf(t) === presetKey)) setTplKey(presetKey) }, [presetKey, templates]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!senderId && senders[0]) setSenderId(senders[0].id) }, [senders, senderId])
  useEffect(() => {
    setVars(Array.from({ length: varCount }, (_, i) => (i === 0 ? '{first_name}' : '')))
    setMedia((prev) => { if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl); return null })
  }, [tplKey, varCount])

  // who exactly this goes to (opted-out people are left out)
  const audKey = audience.mode === 'ids' ? `ids:${audience.ids.join(',')}` : audience.mode === 'all' ? `all:${JSON.stringify(audience.filter)}` : 'none'
  useEffect(() => {
    if (audience.mode === 'none') { setInfo(null); return }
    let off = false
    adminWhatsappContactsAPI.audience(audience.mode === 'ids' ? { ids: audience.ids } : { all: true, filter: audience.filter })
      .then((res) => { if (!off) setInfo(res.data?.data || null) }).catch(() => { if (!off) setInfo(null) })
    return () => { off = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audKey])

  const onFile = async (f?: File | null) => {
    if (!f) return
    if (f.size > 16 * 1024 * 1024) { toast.error('File too large — WhatsApp allows up to 16 MB'); return }
    setUploading(true)
    try {
      const form = new FormData(); form.append('file', f); if (senderId) form.append('phoneNumberId', senderId)
      const r = await adminWhatsappAPI.uploadMedia(form)
      if (r.data?.success && r.data.data?.mediaId) setMedia({ mediaId: r.data.data.mediaId, kind: r.data.data.kind, filename: r.data.data.filename || f.name, previewUrl: URL.createObjectURL(f) })
      else toast.error(r.data?.message || 'Upload failed')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Upload failed') } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const minAt = useMemo(() => { const d = new Date(Date.now() + 5 * 60000); d.setSeconds(0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }, [when]) // eslint-disable-line react-hooks/exhaustive-deps
  const missing = audience.mode === 'none' ? 'Tick contacts in the list, or use “Bulk Send” for everybody the filters show'
    : info && info.willSend === 0 ? 'None of these contacts can be sent to — all have opted out'
    : !tpl ? 'Choose a template' : !senderId ? 'Choose the WhatsApp number to send from'
    : vars.slice(0, varCount).some((v) => !v.trim()) ? 'Fill in every value of the template'
    : needsMedia && !media ? `Upload the ${headerType.toLowerCase()} this template needs`
    : when === 'later' && !at ? 'Choose the date and time' : ''

  const send = async () => {
    if (!tpl || audience.mode === 'none') return
    setSending(true)
    try {
      const res = await adminWhatsappContactsAPI.createBroadcast({
        ...(audience.mode === 'ids' ? { ids: audience.ids } : { all: true, filter: audience.filter }),
        templateName: tpl.name, languageCode: tpl.language, phoneNumberId: senderId, variables: vars.slice(0, varCount).map((v) => v.trim()),
        ...(needsMedia && media ? { headerMediaId: media.mediaId, headerMediaKind: headerType.toLowerCase() } : {}),
        ...(when === 'later' ? { scheduleAt: new Date(at).toISOString() } : {}),
        audienceLabel: audience.label,
      })
      if (res.data?.success) { toast.success(res.data.message || 'Sending'); setConfirm(false); onSent() }
      else toast.error(res.data?.message || 'Could not start the send')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not start the send') } finally { setSending(false) }
  }

  const sendTest = async () => {
    const d = testPhone.replace(/\D/g, '')
    const ten = d.length === 12 && d.startsWith('91') ? d.slice(2) : d
    if (!/^[6-9]\d{9}$/.test(ten)) { toast.error('Enter a 10-digit WhatsApp number'); return }
    if (!tpl) { toast.error('Choose a template'); return }
    if (needsMedia && !media) { toast.error(`Upload the ${headerType.toLowerCase()} first`); return }
    setTesting(true)
    try {
      try { localStorage.setItem('bm_wa_test_phone', ten) } catch {}
      const res = await adminWhatsappAPI.send({
        phoneNumberId: senderId, templateName: tpl.name, languageCode: tpl.language, toPhone: ten,
        variables: varCount > 0 ? vars.slice(0, varCount).map((v) => fillFor(v.trim(), { name: 'Test User', city: 'Gorakhpur', phone: ten })) : undefined,
        ...(needsMedia && media ? { headerMediaId: media.mediaId, headerMediaKind: headerType.toLowerCase() } : {}),
      })
      if (res.data?.success) { toast.success(`Test message sent to +91 ${ten}`); setTestOpen(false) }
      else toast.error(res.data?.message || 'The test could not be sent')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'The test could not be sent') } finally { setTesting(false) }
  }

  const sample = info?.sample?.[0]
  const shown = vars.map((v) => fillFor(v, sample))
  const now = useMemo(() => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }), [])
  const count = info?.willSend ?? (audience.mode === 'ids' ? audience.ids.length : 0)

  const chips = audience.mode === 'ids' ? (info?.sample || []).slice(0, 4) : []
  const preview = (
    <div data-send-preview-box className="rounded-2xl bg-[#EEF7F0] p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2"><span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]"><Eye className="h-4 w-4" /></span><div><h3 className="text-[15px] font-extrabold leading-tight text-[#0F172A]">WhatsApp Preview</h3><p className="text-[12px] text-[#64748B]">This is how the message will appear to the recipient.</p></div></div>
        <WhatsAppIcon className="h-8 w-8" />
      </div>
      <PhoneFrame>
        {tpl ? (
          <div data-send-preview className="max-w-[94%] overflow-hidden rounded-xl rounded-tl-none bg-white shadow-sm">
            {needsMedia && <div className="flex h-[120px] items-center justify-center bg-[#F1F5F9] text-[11px] text-[#64748B]">{media?.kind === 'image' ? <img src={media.previewUrl} alt="" className="h-full w-full object-cover" /> : media ? <span className="flex flex-col items-center gap-1">{headerType === 'VIDEO' ? <Play className="h-5 w-5" /> : <FileText className="h-5 w-5" />}{media.filename}</span> : <span className="flex flex-col items-center gap-1"><ImagePlus className="h-5 w-5" />{headerType.toLowerCase()} goes here</span>}</div>}
            <div className="px-3 pb-2 pt-2.5 text-[13.5px] leading-normal text-[#0F172A]">
              {headerType === 'TEXT' && tpl.headerText && <p className="mb-1 font-bold">{renderWaText(tpl.headerText, 'h')}</p>}
              <p className="whitespace-pre-wrap break-words">{renderWaText((tpl.bodyText || '').replace(/\{\{\s*(\d+)\s*\}\}/g, (whole: string, n: string) => (shown[Number(n) - 1] || '').trim() || whole), 'b')}</p>
              {tpl.footerText && <p className="mt-1 text-[11px] text-[#64748B]">{tpl.footerText}</p>}
              <p className="mt-0.5 text-right text-[10.5px] text-[#64748B]">{now}</p>
            </div>
            {(tpl.buttons || []).map((b, i) => <div key={i} className="flex items-center justify-center gap-1.5 border-t border-[#E2E8F0] py-2.5 text-[13px] font-semibold text-[#027EB5]">{btnIcon(b.type)}{b.text}</div>)}
          </div>
        ) : <p className="pt-24 text-center text-[12px] text-[#64748B]">Choose a template to see it here.</p>}
      </PhoneFrame>
      <p className="mt-3 flex items-start gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2.5 text-[11.5px] text-[#1E3A8A]"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563EB]" /><span><b>Tip:</b> This is a real-time preview. The message will look exactly like this on the customer's WhatsApp{sample?.name ? `, shown here as ${sample.name.split(/\s+/)[0]} gets it` : ''}.</span></p>
    </div>
  )

  return (
    <section data-send-panel className="flex min-h-0 flex-1 flex-col bg-[#F6F8FB]">
      {/* header */}
      <div data-send-header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#EEF2F6] bg-white px-5 pb-4 pt-5 sm:px-6">
        <div className="flex items-start gap-3.5">
          <WhatsAppIcon className="h-14 w-14 shrink-0" />
          <div><h2 className="text-[24px] font-extrabold leading-tight text-[#0F172A]">Send WhatsApp Template</h2><p className="text-[13.5px] text-[#64748B]">Fill the details below and send a personalized message to your customer.</p></div>
        </div>
        {onClose && <button type="button" onClick={onClose} disabled={sending} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9]"><X className="h-5 w-5" /></button>}
      </div>

      <div data-send-body className="scrollbar-admin grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-y-auto px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <Step n={1} title="Select Recipients" sub="Choose one or more contacts to send this template." right={
            <span data-recipient-count className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-bold ${audience.mode === 'none' ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-[#DCFCE7] text-[#15803D]'}`}>{audience.mode !== 'none' && <CheckCircle2 className="h-3.5 w-3.5" />}{audience.mode === 'none' ? 'None selected' : `${count.toLocaleString('en-IN')} Contact${count === 1 ? '' : 's'} Selected`}</span>}>
            <div className="flex flex-wrap items-center gap-2">
              {audience.mode === 'none' && <p className="flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-3 py-2.5 text-[12.5px] text-[#64748B]"><Users className="h-4 w-4 shrink-0" />Tick contacts in the list, or press “Bulk Send” to send to everybody the filters show.</p>}
              {audience.mode === 'all' && <span className="flex items-center gap-2.5 rounded-xl bg-[#F8FAFC] px-3 py-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DBEAFE] text-[#1D4ED8]"><Users className="h-4 w-4" /></span><span className="text-[12.5px]"><b className="block text-[#0F172A]">{audience.label}</b><span className="text-[#64748B]">{info ? `${info.willSend.toLocaleString('en-IN')} will receive it${info.optedOut ? ` · ${info.optedOut} opted out, left out` : ''}` : 'counting…'}</span></span></span>}
              {chips.map((p: any) => (
                <span key={p._id || p.phone} className="flex items-center gap-2.5 rounded-xl bg-[#F8FAFC] px-3 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DBEAFE] text-[11px] font-bold text-[#1D4ED8]">{initials(p.name)}</span>
                  <span className="text-[12.5px]"><b className="block text-[#0F172A]">{p.name || 'No name'}</b><span className="text-[#64748B]">{prettyPhone(p.phone)}</span></span>
                  {onRemoveRecipient && p._id && <button type="button" aria-label={`Remove ${p.name || p.phone}`} onClick={() => onRemoveRecipient(String(p._id))} className="ml-1 text-[#94A3B8] hover:text-[#0F172A]"><X className="h-4 w-4" /></button>}
                </span>
              ))}
              {audience.mode === 'ids' && count > chips.length && <span className="text-[12px] font-semibold text-[#64748B]">+ {(count - chips.length).toLocaleString('en-IN')} more</span>}
              {audience.mode === 'ids' && info && info.optedOut > 0 && <span className="text-[11.5px] font-semibold text-[#B45309]">{info.optedOut} opted out, left out</span>}
              {onAddMore && <button type="button" onClick={onAddMore} className="flex h-[52px] items-center gap-1.5 rounded-xl border border-dashed border-[#CBD5E1] px-4 text-[13px] font-bold text-[#0F172A] hover:bg-[#F8FAFC]"><Plus className="h-4 w-4" />Add More Contacts</button>}
            </div>
          </Step>

          <Step n={2} title="Choose Template" sub="Select an approved template from the list." right={<button type="button" title="Reload templates" onClick={onReloadTemplates} className="text-[#64748B] hover:text-[#0F172A]"><RefreshCw className={`h-4 w-4 ${loadingTemplates ? 'animate-spin' : ''}`} /></button>}>
            {templatesError && !templates.length ? <p className="rounded-lg bg-[#FFFBEB] px-3 py-2 text-[12px] text-[#B45309]">{templatesError}</p> : (
              <div className="relative">
                <select value={tplKey} onChange={(e) => setTplKey(e.target.value)} aria-label="Approved Template" className="h-12 w-full appearance-none rounded-xl border border-[#E2E8F0] bg-white pl-4 pr-36 text-[14px] font-semibold text-[#0F172A] outline-none focus:border-[#F4511E]">
                  {!templates.length && <option value="">{loadingTemplates ? 'Loading…' : 'No approved templates'}</option>}
                  {templates.map((t) => <option key={keyOf(t)} value={keyOf(t)}>{t.name} ({t.language})</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">{tpl && <span className="flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11.5px] font-bold text-[#15803D]"><CheckCircle2 className="h-3.5 w-3.5" />Approved</span>}<ChevronDown className="h-4 w-4 text-[#64748B]" /></span>
              </div>
            )}
            {senders.length > 1 && <select value={senderId} onChange={(e) => setSenderId(e.target.value)} aria-label="Send from" className={`${field} mt-2`}>{senders.map((s) => <option key={s.id} value={s.id}>From {s.display}{s.name ? ` — ${s.name}` : ''}</option>)}</select>}
          </Step>

          <Step n={3} title="Fill Template Details" sub="The message will be sent with these details.">
            {needsMedia && (
              <div className="mb-3">
                <input ref={fileRef} type="file" hidden accept={MEDIA_ACCEPT[headerType]} onChange={(e) => onFile(e.target.files?.[0])} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-[12.5px] font-semibold text-[#334155]">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4 text-[#16A34A]" />}{media ? `${media.filename} — change` : `Upload the header ${headerType.toLowerCase()} (required)`}
                </button>
              </div>
            )}
            {varCount > 0 ? (
              <div className="space-y-2.5">
                {Array.from({ length: varCount }, (_, i) => { const Ic = VAR_ICON[i % VAR_ICON.length]; return (
                  <div key={i}>
                    <div className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-1.5 pl-3">
                      <span className="flex w-[150px] shrink-0 items-center gap-2.5 text-[13px] font-semibold text-[#334155]"><Ic className="h-4 w-4 text-[#475569]" />Value {i + 1} <span className="font-normal text-[#94A3B8]">{`{{${i + 1}}}`}</span></span>
                      <input value={vars[i] || ''} aria-label={`Variable ${i + 1}`} placeholder={i === 0 ? 'e.g. Customer Name' : `Value ${i + 1}`} className="h-10 min-w-0 flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13.5px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#F4511E]"
                        onChange={(e) => setVars((v) => { const n = [...v]; n[i] = e.target.value; return n })} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 pl-3">{PLACEHOLDERS.map((p) => <button key={p.token} type="button" title={`Each person gets their own ${p.label.toLowerCase()}`} onClick={() => setVars((v) => { const n = [...v]; n[i] = `${(n[i] || '').trim()} ${p.token}`.trim(); return n })} className="rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE]">+ {p.label}</button>)}</div>
                  </div>
                ) })}
              </div>
            ) : <p className="rounded-xl bg-[#F8FAFC] px-3 py-3 text-[12.5px] text-[#64748B]">{tpl ? 'This template has nothing to fill in — it is sent exactly as shown in the preview.' : 'Choose a template first.'}</p>}
          </Step>

          <Step n={4} title="Send Schedule" sub="Choose when to send this message.">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] font-semibold text-[#0F172A]">
              <label className="flex cursor-pointer items-center gap-2.5"><input type="radio" name="wa-when" className="h-5 w-5 accent-[#F4511E]" checked={when === 'now'} onChange={() => setWhen('now')} />Send Now</label>
              <label className="flex cursor-pointer items-center gap-2.5"><input type="radio" name="wa-when" className="h-5 w-5 accent-[#F4511E]" checked={when === 'later'} onChange={() => setWhen('later')} />Schedule for Later</label>
              {when === 'later' && <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4 shrink-0 text-[#64748B]" /><input type="datetime-local" value={at} min={minAt} aria-label="Send at" onChange={(e) => setAt(e.target.value)} className={`${field} w-auto`} /></span>}
            </div>
          </Step>

        </div>

        <div>{preview}</div>
      </div>

      {/* footer: always in view */}
      <div data-send-footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#EEF2F6] bg-white px-5 py-3 sm:px-6">
        <p className="min-w-0 flex-1 text-[12.5px]">{audience.mode !== 'none' && missing ? <span className="font-semibold text-[#B45309]">{missing}</span> : tpl && audience.mode !== 'none' ? <span className="text-[#64748B]">Ready — WhatsApp charges for every template delivered.</span> : null}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" data-send-test-open onClick={() => setTestOpen(true)} disabled={!tpl} className="flex h-12 items-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-5 text-[14px] font-bold text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50"><Send className="h-4 w-4" />Send Test Message</button>
          <button type="button" data-send-go disabled={!!missing || sending} onClick={() => setConfirm(true)} className="flex h-12 items-center gap-2 rounded-xl px-6 text-[14px] font-bold text-white shadow-[0_6px_14px_rgba(244,81,30,.3)] disabled:opacity-50" style={{ background: ORANGE }}>
            <WhatsAppIcon className="h-5 w-5" color="#fff" />{when === 'later' ? 'Schedule WhatsApp Message' : 'Send WhatsApp Message'}{count ? ` (${count.toLocaleString('en-IN')})` : ''}
          </button>
        </div>
      </div>

      {testOpen && tpl && (
        <Modal title="Send a test message" onClose={() => setTestOpen(false)} busy={testing}>
          <p className="mb-3 text-[12.5px] text-[#64748B]">Sends <b className="text-[#0F172A]">{tpl.name}</b> with the values filled above to one number, so you can see it on a real phone. Placeholders like {'{first_name}'} are shown as “Test User”.</p>
          <label className="mb-1 block text-[12.5px] font-semibold text-[#334155]">WhatsApp number</label>
          <div className="flex h-10 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white focus-within:border-[#F4511E]"><span className="flex items-center border-r border-[#E2E8F0] px-2.5 text-[13px] text-[#475569]">+91</span><input autoFocus value={testPhone} inputMode="numeric" aria-label="Test number" placeholder="98765 43210" onChange={(e) => setTestPhone(e.target.value.replace(/[^\d ]/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter') sendTest() }} className="min-w-0 flex-1 px-3 text-[13.5px] outline-none" /></div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setTestOpen(false)} disabled={testing} className="h-10 rounded-lg border border-[#E2E8F0] px-4 text-[13.5px] font-bold text-[#334155]">Cancel</button>
            <button type="button" data-send-test onClick={sendTest} disabled={testing} className="flex h-10 items-center gap-2 rounded-lg bg-[#12A34B] px-5 text-[13.5px] font-bold text-white disabled:opacity-60">{testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send test</button>
          </div>
        </Modal>
      )}

      {confirm && tpl && (
        <Confirm title={when === 'later' ? 'Schedule this send?' : 'Send this template now?'} action={when === 'later' ? 'Yes, schedule it' : `Yes, send to ${count.toLocaleString('en-IN')}`} busy={sending} onNo={() => setConfirm(false)} onYes={send}
          body={<>
            <p><b className="text-[#0F172A]">{tpl.name}</b> will go to <b className="text-[#0F172A]">{count.toLocaleString('en-IN')} contact{count === 1 ? '' : 's'}</b> ({audience.mode !== 'none' ? audience.label : ''}){when === 'later' && at ? <> on <b className="text-[#0F172A]">{new Date(at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</b></> : null}.</p>
            {info && info.optedOut > 0 && <p className="mt-1.5">{info.optedOut} opted-out contact{info.optedOut === 1 ? ' is' : 's are'} left out.</p>}
            <p className="mt-1.5">WhatsApp charges for every template delivered, and a sent message cannot be taken back.</p>
          </>} />
      )}
    </section>
  )
}

export const downloadIcon = <Download className="h-4 w-4" />
