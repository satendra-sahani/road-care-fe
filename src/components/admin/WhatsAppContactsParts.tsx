'use client'

// Pieces of admin → Communication → WhatsApp (WhatsAppContacts.tsx):
// the "Send WhatsApp Template" panel, the contact form, the import card and its
// preview, and small shared bits (tag pills, confirm dialog).
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle, CalendarClock, CheckCheck, CheckCircle2, Download, FileSpreadsheet, FileText, ImagePlus, Loader2, Play, RefreshCw, Save, Send,
  Upload, UploadCloud, Users, X,
} from 'lucide-react'
import { adminWhatsappAPI, adminWhatsappContactsAPI, type WaContactFilter } from '@/services/api'
import { MEDIA_ACCEPT, btnIcon, renderWaText } from './WhatsAppSender'
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

/** The WhatsApp mark (brand green unless a colour is given). */
export const WhatsAppIcon = ({ className = 'h-5 w-5', color = '#25D366' }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <path fill={color} d="M24 0C37.2547 0 48 10.7453 48 24C48 37.2547 37.2547 48 24 48C19.82 48 15.8904 46.9314 12.4678 45.0527L0 48L3.19629 35.9736C1.16368 32.4497 0 28.3606 0 24C6.76533e-07 10.7453 10.7453 6.76489e-07 24 0ZM24 4.29785C13.1194 4.29785 4.299 13.1185 4.29883 23.999C4.29883 28.1943 5.6104 32.083 7.8457 35.2783L5.7793 42.3193L13.1455 40.4434C16.2581 42.5026 19.9887 43.7012 24 43.7012V43.7002C34.8807 43.7002 43.7012 34.8797 43.7012 23.999C43.701 13.1185 34.8806 4.29785 24 4.29785ZM17.4043 12.1562C17.6982 12.1324 17.9685 12.3028 18.0938 12.5693L20.8311 18.376C20.9604 18.6506 20.9041 18.9777 20.6895 19.1924L18.6484 21.2324C18.2072 21.6737 18.0781 22.361 18.3818 22.9062C19.1265 24.2415 20.1281 25.5276 21.2881 26.7109C22.4714 27.8709 23.7574 28.8732 25.0928 29.6172C25.6381 29.9212 26.3246 29.7919 26.7666 29.3506L28.8076 27.3096C29.0222 27.0953 29.3486 27.0382 29.623 27.168L35.4297 29.9053C35.6964 30.0306 35.8677 30.3014 35.8438 30.5947C35.7811 31.3587 35.4741 32.8901 34.1016 34.2627C30.227 38.1372 23.2692 33.7536 22.9854 33.584C21.2741 32.6647 19.6483 31.4347 18.1064 29.8936C16.5651 28.3522 15.3344 26.725 14.415 25.0137C14.2445 24.7301 9.86133 17.7735 13.7363 13.8984C15.109 12.5258 16.6403 12.2189 17.4043 12.1562Z" />
  </svg>
)

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

export function Modal({ title, onClose, children, wide, busy }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; busy?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0B1730]/60 p-3" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <div className={`flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${wide ? 'max-w-[820px]' : 'max-w-[520px]'}`}>
        <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F6] px-5 py-3.5">
          <h2 className="text-[17px] font-extrabold text-[#0F172A]">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9]"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 overflow-y-auto p-5">{children}</div>
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

export function SendPanel({ audience, templates, senders, loadingTemplates, templatesError, presetKey, onClear, onSent, onReloadTemplates, inDialog }: {
  audience: Audience; templates: WaTemplate[]; senders: WaSender[]; loadingTemplates: boolean; templatesError: string
  /** `${name}::${language}` chosen elsewhere on the page (Templates tab) */
  presetKey?: string
  onClear: () => void; onSent: () => void; onReloadTemplates: () => void
  /** shown inside a dialog: the dialog already has the frame and the title */
  inDialog?: boolean
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

  const sample = info?.sample?.[0]
  const shown = vars.map((v) => fillFor(v, sample))
  const now = useMemo(() => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }), [])
  const count = info?.willSend ?? (audience.mode === 'ids' ? audience.ids.length : 0)

  return (
    <section data-send-panel className={inDialog ? '' : 'rounded-2xl border border-[#E8EDF3] bg-white p-4 shadow-sm'}>
      <div className={`flex items-center justify-between gap-2 ${inDialog ? 'hidden' : ''}`}>
        <h3 className="flex items-center gap-2 text-[15.5px] font-extrabold text-[#0F172A]"><WhatsAppIcon className="h-7 w-7" />Send WhatsApp Template</h3>
        {audience.mode !== 'none' && <button type="button" onClick={onClear} className="text-[12px] font-bold text-[#2563EB]">Clear All</button>}
      </div>

      <div className={`flex items-center justify-between gap-2 ${inDialog ? '' : 'mt-3'}`}>
        <p className="text-[12.5px] font-semibold text-[#334155]">Selected Recipients</p>
        <span data-recipient-count className={`rounded-md px-2 py-0.5 text-[11.5px] font-bold ${audience.mode === 'none' ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-[#DCFCE7] text-[#15803D]'}`}>
          {audience.mode === 'none' ? 'None selected' : `${count.toLocaleString('en-IN')} Contact${count === 1 ? '' : 's'} Selected`}
        </span>
      </div>
      {audience.mode === 'none' ? (
        <p className="mt-1.5 flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-3 py-2.5 text-[12px] text-[#64748B]"><Users className="h-4 w-4 shrink-0" />Tick contacts in the list, or press “Bulk Send” to send to everybody the filters show.</p>
      ) : (
        <div className="mt-1.5">
          <div className="flex items-center gap-1">
            {(info?.sample || []).slice(0, 5).map((p) => <span key={p.phone} title={p.name || prettyPhone(p.phone)} className="-ml-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#E2E8F0] text-[10px] font-bold text-[#334155] first:ml-0">{initials(p.name)}</span>)}
            {info && info.willSend > 5 && <span className="ml-1 text-[11.5px] text-[#64748B]">+ {(info.willSend - 5).toLocaleString('en-IN')} more</span>}
          </div>
          <p className="mt-1 text-[11.5px] text-[#64748B]">{audience.label}{info && info.optedOut > 0 && <b className="text-[#B45309]"> · {info.optedOut} opted out, left out</b>}{info && info.total - info.optedOut > info.willSend && <b className="text-[#B45309]"> · only the first {info.willSend.toLocaleString('en-IN')} per send</b>}</p>
        </div>
      )}

      <div className="mt-3.5 flex items-center justify-between"><p className="text-[12.5px] font-semibold text-[#334155]">Approved Template</p><button type="button" title="Reload templates" onClick={onReloadTemplates} className="text-[#64748B] hover:text-[#0F172A]"><RefreshCw className={`h-3.5 w-3.5 ${loadingTemplates ? 'animate-spin' : ''}`} /></button></div>
      {templatesError && !templates.length ? <p className="mt-1 rounded-lg bg-[#FFFBEB] px-3 py-2 text-[12px] text-[#B45309]">{templatesError}</p> : (
        <div className="mt-1 flex items-center gap-2">
          <select value={tplKey} onChange={(e) => setTplKey(e.target.value)} aria-label="Approved Template" className={field}>
            {!templates.length && <option value="">{loadingTemplates ? 'Loading…' : 'No approved templates'}</option>}
            {templates.map((t) => <option key={keyOf(t)} value={keyOf(t)}>{t.name} ({t.language})</option>)}
          </select>
          {tpl && <span className="flex shrink-0 items-center gap-1 rounded-md bg-[#DCFCE7] px-2 py-1 text-[11.5px] font-bold text-[#15803D]"><CheckCircle2 className="h-3.5 w-3.5" />Approved</span>}
        </div>
      )}
      {senders.length > 1 && (
        <select value={senderId} onChange={(e) => setSenderId(e.target.value)} aria-label="Send from" className={`${field} mt-2`}>{senders.map((s) => <option key={s.id} value={s.id}>From {s.display}{s.name ? ` — ${s.name}` : ''}</option>)}</select>
      )}

      {needsMedia && (
        <div className="mt-3">
          <p className="mb-1 text-[12.5px] font-semibold text-[#334155]">Header {headerType.toLowerCase()} <span className="text-red-500">*</span></p>
          <input ref={fileRef} type="file" hidden accept={MEDIA_ACCEPT[headerType]} onChange={(e) => onFile(e.target.files?.[0])} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-[12.5px] font-semibold text-[#334155]">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4 text-[#16A34A]" />}{media ? `${media.filename} — change` : `Upload the ${headerType.toLowerCase()}`}
          </button>
        </div>
      )}

      {varCount > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[12.5px] font-semibold text-[#334155]">Template Variables</p>
          <div className="space-y-2">
            {Array.from({ length: varCount }, (_, i) => (
              <div key={i}>
                <div className="flex h-10 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white focus-within:border-[#F4511E]">
                  <span className="flex w-12 shrink-0 items-center justify-center border-r border-[#E2E8F0] bg-[#F8FAFC] text-[11.5px] font-bold text-[#475569]">{`{{${i + 1}}}`}</span>
                  <input value={vars[i] || ''} aria-label={`Variable ${i + 1}`} placeholder={i === 0 ? 'e.g. Customer Name' : `Value ${i + 1}`} className="min-w-0 flex-1 px-3 text-[13.5px] outline-none placeholder:text-[#94A3B8]"
                    onChange={(e) => setVars((v) => { const n = [...v]; n[i] = e.target.value; return n })} />
                </div>
                <div className="mt-1 flex flex-wrap gap-1">{PLACEHOLDERS.map((p) => <button key={p.token} type="button" title={`Each person gets their own ${p.label.toLowerCase()}`} onClick={() => setVars((v) => { const n = [...v]; n[i] = `${(n[i] || '').trim()} ${p.token}`.trim(); return n })} className="rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE]">+ {p.label}</button>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3.5 text-[12.5px] font-semibold text-[#334155]">Send Schedule</p>
      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-[#0F172A]">
        <label className="flex cursor-pointer items-center gap-2"><input type="radio" name="wa-when" className="h-4 w-4 accent-[#F4511E]" checked={when === 'now'} onChange={() => setWhen('now')} />Send Now</label>
        <label className="flex cursor-pointer items-center gap-2"><input type="radio" name="wa-when" className="h-4 w-4 accent-[#F4511E]" checked={when === 'later'} onChange={() => setWhen('later')} />Schedule for Later</label>
      </div>
      {when === 'later' && <div className="mt-2 flex items-center gap-2"><CalendarClock className="h-4 w-4 shrink-0 text-[#64748B]" /><input type="datetime-local" value={at} min={minAt} aria-label="Send at" onChange={(e) => setAt(e.target.value)} className={field} /></div>}

      {/* phone preview */}
      <div className="mt-3.5 rounded-xl bg-[#F1F5F9] p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#334155]"><WhatsAppIcon className="h-4 w-4" />WhatsApp Preview{sample?.name ? <span className="font-normal text-[#64748B]"> · as {sample.name.split(/\s+/)[0]} gets it</span> : null}</p>
        <div className="mx-auto max-w-[290px] overflow-hidden rounded-[22px] border-[5px] border-[#111827] bg-[#EFEAE2]">
          <div className="flex items-center gap-2 bg-[#075E54] px-3 py-2 text-white"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">BM</span><span className="min-w-0"><b className="block truncate text-[12.5px] leading-tight">Bharat Mechanics</b><span className="text-[10px] opacity-80">Online</span></span></div>
          <div className="min-h-[120px] p-2.5" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,.04) 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
            {tpl ? (
              <div data-send-preview className="max-w-[92%] overflow-hidden rounded-lg rounded-tl-none bg-white shadow-sm">
                {needsMedia && <div className="flex h-[92px] items-center justify-center bg-black/10 text-[11px] text-[#64748B]">{media?.kind === 'image' ? <img src={media.previewUrl} alt="" className="h-full w-full object-cover" /> : media ? <span className="flex flex-col items-center gap-1">{headerType === 'VIDEO' ? <Play className="h-5 w-5" /> : <FileText className="h-5 w-5" />}{media.filename}</span> : <span className="flex flex-col items-center gap-1"><ImagePlus className="h-5 w-5" />{headerType.toLowerCase()}</span>}</div>}
                <div className="px-2.5 pb-1.5 pt-2 text-[12.5px] leading-normal text-[#0F172A]">
                  {headerType === 'TEXT' && tpl.headerText && <p className="mb-0.5 font-bold">{renderWaText(tpl.headerText, 'h')}</p>}
                  <p className="whitespace-pre-wrap break-words">{renderWaText((tpl.bodyText || '').replace(/\{\{\s*(\d+)\s*\}\}/g, (whole: string, n: string) => (shown[Number(n) - 1] || '').trim() || whole), 'b')}</p>
                  {tpl.footerText && <p className="mt-1 text-[10.5px] text-[#64748B]">{tpl.footerText}</p>}
                  <p className="mt-0.5 flex items-center justify-end gap-1 text-[9.5px] text-[#64748B]">{now}<CheckCheck className="h-3 w-3 text-[#53BDEB]" /></p>
                </div>
                {(tpl.buttons || []).map((b, i) => <div key={i} className="flex items-center justify-center gap-1.5 border-t border-black/10 py-1.5 text-[12px] font-medium text-[#027EB5]">{btnIcon(b.type)}{b.text}</div>)}
              </div>
            ) : <p className="py-8 text-center text-[11.5px] text-[#64748B]">Choose a template to see it here.</p>}
          </div>
        </div>
      </div>

      {missing && audience.mode !== 'none' && <p className="mt-2.5 text-[12px] font-semibold text-[#B45309]">{missing}</p>}
      <button type="button" data-send-go disabled={!!missing || sending} onClick={() => setConfirm(true)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#12A34B] text-[14px] font-bold text-white hover:bg-[#0F8F41] disabled:opacity-50">
        {when === 'later' ? <CalendarClock className="h-4 w-4" /> : <Send className="h-4 w-4" />}{when === 'later' ? 'Schedule' : 'Send'}{count ? ` to ${count.toLocaleString('en-IN')} contact${count === 1 ? '' : 's'}` : ' Template'}
      </button>

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
