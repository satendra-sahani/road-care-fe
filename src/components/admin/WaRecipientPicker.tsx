'use client'

// "Send to" of a WhatsApp send: one box that takes several people.
//   • type a name or a number → your contacts are suggested; Enter / a click adds one
//   • a 10-digit number that is nobody's contact can be added as it is
//   • several numbers pasted at once (commas, spaces, new lines) are all added
//   • "Add everyone with" a tag, of a type (customers, mechanics, garages…) or from a city
//     adds that whole group as one chip
// Each choice is a chip with a ×. Nobody is counted twice: a person who is in a group and was
// also added by hand gets one message (see splitRecipients). Opted-out contacts cannot be added
// and are left out of a group.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Phone, Search, Users, X } from 'lucide-react'
import { adminWhatsappContactsAPI } from '@/services/api'
import { SearchSelect } from './SearchSelect'
import { TYPES, initials, prettyPhone, type WaContact } from './WhatsAppContactsParts'

export type WaPerson = { kind: 'contact'; id: string; name: string; phone: string } | { kind: 'number'; phone: string }
export type WaGroupBy = 'tag' | 'type' | 'city'
/** ids = null while the group's people are being fetched */
export type WaGroup = { kind: 'group'; by: WaGroupBy; value: string; ids: string[] | null; phones: string[]; names: string[]; optedOut: number; failed?: boolean }
export type WaRecipient = WaPerson | WaGroup

const BY_LABEL: Record<WaGroupBy, string> = { tag: 'Tag', type: 'Type', city: 'City' }
const typeLabel = (v: string) => TYPES.find((t) => t.value === v)?.label || v
export const groupTitle = (g: { by: WaGroupBy; value: string }) => `${BY_LABEL[g.by]}: ${g.by === 'type' ? `${typeLabel(g.value)}s` : g.value}`
/** "98765 43210", "+91 98765-43210", "09876543210" → "919876543210"; anything else → '' */
export const waNumber = (text: string) => {
  let d = String(text || '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  return /^[6-9]\d{9}$/.test(d) ? `91${d}` : ''
}
/** every mobile number in a pasted text, however it is written: "98765 43210, +91-98111-22222\n09822233344" */
export const waNumbersIn = (text: string) => [...new Set((String(text || '').match(/(?<!\d)(?:(?:\+|00)?91[\s-]*|0)?[6-9](?:[\s-]?\d){9}(?!\d)/g) || []).map(waNumber).filter(Boolean))]
const keyOf = (r: WaRecipient) => (r.kind === 'group' ? `g:${r.by}:${r.value}` : `p:${r.phone}`)

/**
 * Who really gets a message: every contact once (by hand or through a group), and the typed
 * numbers that are not one of those contacts. loading = a group is still being fetched.
 */
export function splitRecipients(list: WaRecipient[]) {
  const contacts = new Map<string, { id: string; phone: string; name: string }>()
  let loading = false, failed = false, optedOut = 0
  for (const r of list) {
    if (r.kind === 'contact') contacts.set(r.phone, { id: r.id, phone: r.phone, name: r.name })
    if (r.kind === 'group') {
      if (r.failed) failed = true
      else if (!r.ids) loading = true
      else { optedOut += r.optedOut; r.ids.forEach((id, i) => { if (!contacts.has(r.phones[i])) contacts.set(r.phones[i], { id, phone: r.phones[i], name: r.names[i] || '' }) }) }
    }
  }
  const numbers = [...new Set(list.filter((r): r is Extract<WaPerson, { kind: 'number' }> => r.kind === 'number').map((r) => r.phone))].filter((p) => !contacts.has(p))
  return { contacts: [...contacts.values()], numbers, total: contacts.size + numbers.length, loading, failed, optedOut }
}

type Count = { value: string; count: number }
type Option = { key: string; add: () => void; node: React.ReactNode; off?: boolean }

export function WaRecipientPicker({ value, onChange, disabled }: { value: WaRecipient[]; onChange: (next: WaRecipient[]) => void; disabled?: boolean }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hits, setHits] = useState<WaContact[]>([])
  const [searching, setSearching] = useState(false)
  const [active, setActive] = useState(0)
  const [meta, setMeta] = useState<{ tags: Count[]; types: Count[]; cities: Count[] }>({ tags: [], types: [], cities: [] })
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const latest = useRef(value)
  latest.current = value
  const asked = useRef(0)

  useEffect(() => {
    adminWhatsappContactsAPI.meta().then((r) => { const d = r.data?.data; if (d) setMeta({ tags: d.tags || [], types: d.types || [], cities: d.cities || [] }) }).catch(() => {})
  }, [])
  // suggestions: the contacts that match what is typed (the newest ones while nothing is typed)
  useEffect(() => {
    if (!open) return
    const mine = ++asked.current
    setSearching(true)
    const t = setTimeout(() => {
      adminWhatsappContactsAPI.list({ search: q.trim() || undefined, limit: 8 })
        .then((r) => { if (mine === asked.current) setHits(r.data?.data || []) })
        .catch(() => { if (mine === asked.current) setHits([]) })
        .finally(() => { if (mine === asked.current) setSearching(false) })
    }, q.trim() ? 220 : 0)
    return () => clearTimeout(t)
  }, [q, open])
  useEffect(() => { setActive(0) }, [q, hits.length])
  useEffect(() => {
    if (!open) return
    const off = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', off)
    return () => document.removeEventListener('mousedown', off)
  }, [open])

  const have = useMemo(() => new Set(value.map(keyOf)), [value])
  const push = (r: WaRecipient) => { if (!latest.current.some((x) => keyOf(x) === keyOf(r))) onChange([...latest.current, r]) }
  const remove = (k: string) => onChange(latest.current.filter((x) => keyOf(x) !== k))
  const addContact = (c: WaContact) => { push({ kind: 'contact', id: c._id, name: c.name || '', phone: c.phone }); setQ(''); input.current?.focus() }
  const addNumber = (phone: string) => {
    const known = hits.find((c) => c.phone === phone)
    if (known && known.optIn) addContact(known)
    else if (!known) { push({ kind: 'number', phone }); setQ(''); input.current?.focus() }
  }
  const addGroup = (by: WaGroupBy, v: string) => {
    if (!v) return
    const g: WaGroup = { kind: 'group', by, value: v, ids: null, phones: [], names: [], optedOut: 0 }
    if (have.has(keyOf(g))) return
    push(g)
    setQ('')
    const settle = (patch: Partial<WaGroup>) => onChange(latest.current.map((x) => (keyOf(x) === keyOf(g) ? { ...(x as WaGroup), ...patch } : x)))
    const filter = by === 'tag' ? { tag: v } : by === 'type' ? { type: v } : { city: v }
    Promise.all([
      adminWhatsappContactsAPI.list({ ...filter, optIn: 'in', limit: 5000 }),
      adminWhatsappContactsAPI.audience({ all: true, filter }),
    ]).then(([rows, aud]) => {
      const people: WaContact[] = rows.data?.data || []
      settle({ ids: people.map((p) => p._id), phones: people.map((p) => p.phone), names: people.map((p) => p.name || ''), optedOut: aud.data?.data?.optedOut || 0 })
    }).catch(() => settle({ ids: [], failed: true }))
  }

  // what the list under the box offers, top to bottom
  const typed = waNumber(q)
  const text = q.trim().toLowerCase()
  const options: Option[] = []
  if (typed && !hits.some((c) => c.phone === typed)) {
    options.push({ key: `n:${typed}`, off: have.has(`p:${typed}`), add: () => addNumber(typed), node: <><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]"><Phone className="h-4 w-4" /></span><span className="min-w-0 flex-1"><b className="block text-[13.5px] text-[#0F172A]">Send to {prettyPhone(typed)}</b><span className="text-[11.5px] text-[#64748B]">{have.has(`p:${typed}`) ? 'Already added' : 'Not one of your contacts — added as a number'}</span></span></> })
  }
  for (const c of hits) {
    const added = have.has(`p:${c.phone}`)
    options.push({ key: `c:${c._id}`, off: added || !c.optIn, add: () => addContact(c), node: <><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E0E7FF] text-[11px] font-bold text-[#3730A3]">{initials(c.name || '?')}</span><span className="min-w-0 flex-1"><b className="block truncate text-[13.5px] text-[#0F172A]">{c.name || 'No name'}</b><span className="block truncate text-[11.5px] text-[#64748B]">{prettyPhone(c.phone)} · {typeLabel(c.type)}{c.city ? ` · ${c.city}` : ''}{c.tags?.length ? ` · ${c.tags.slice(0, 3).join(', ')}` : ''}</span></span>{added ? <span className="shrink-0 text-[11.5px] font-semibold text-[#15803D]">Added</span> : !c.optIn ? <span className="shrink-0 text-[11.5px] font-semibold text-[#B45309]">Opted out</span> : null}</> })
  }
  if (text) {
    const groups: { by: WaGroupBy; value: string; count: number }[] = [
      ...meta.tags.filter((t) => t.value.toLowerCase().includes(text)).map((t) => ({ by: 'tag' as const, ...t })),
      ...meta.types.filter((t) => `${t.value} ${typeLabel(t.value)}s`.toLowerCase().includes(text)).map((t) => ({ by: 'type' as const, ...t })),
      ...meta.cities.filter((t) => t.value.toLowerCase().includes(text)).map((t) => ({ by: 'city' as const, ...t })),
    ].slice(0, 6)
    for (const g of groups) {
      const added = have.has(`g:${g.by}:${g.value}`)
      options.push({ key: `g:${g.by}:${g.value}`, off: added, add: () => addGroup(g.by, g.value), node: <><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#B45309]"><Users className="h-4 w-4" /></span><span className="min-w-0 flex-1"><b className="block truncate text-[13.5px] text-[#0F172A]">Everyone — {groupTitle(g)}</b><span className="text-[11.5px] text-[#64748B]">{g.count.toLocaleString('en-IN')} contact{g.count === 1 ? '' : 's'}</span></span>{added && <span className="shrink-0 text-[11.5px] font-semibold text-[#15803D]">Added</span>}</> })
    }
  }
  const usable = options.filter((o) => !o.off)

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false) } return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(options.length - 1, a + 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); return }
    if (e.key === 'Backspace' && !q && value.length) { remove(keyOf(value[value.length - 1])); return }
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      if (!q.trim()) return
      e.preventDefault()
      // a whole number typed → that number; otherwise the highlighted suggestion
      if (typed && (e.key !== 'Enter' || options[active]?.key === `n:${typed}` || !usable.length)) { addNumber(typed); return }
      const pick = options[active] && !options[active].off ? options[active] : usable[0]
      if (pick && e.key !== ',') pick.add()
    }
  }
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // two or more numbers in what was pasted → a chip each (one number is simply typed in)
    const numbers = waNumbersIn(e.clipboardData.getData('text'))
    if (numbers.length < 2) return
    e.preventDefault()
    const now = new Set(latest.current.map(keyOf))
    onChange([...latest.current, ...numbers.filter((p) => !now.has(`p:${p}`)).map((p) => ({ kind: 'number' as const, phone: p }))])
    setQ('')
  }

  const pickGroup = (by: WaGroupBy, list: Count[], word: string) => (
    <SearchSelect value="" onChange={(v) => addGroup(by, v)} ariaLabel={`Add by ${word}`} placeholder={`Search ${word}…`}
      className="h-9 w-[112px] rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-[12.5px] font-semibold text-[#0F172A] outline-none focus:border-[#F4511E]"
      options={[{ value: '', label: `By ${word}` }, ...list.map((t) => ({ value: t.value, label: by === 'type' ? `${typeLabel(t.value)}s` : t.value, hint: t.count.toLocaleString('en-IN') }))]} />
  )

  return (
    <div ref={root} data-wa-recipients>
      {/* whole groups — above the box, so the open suggestions never cover them */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5" data-add-group>
        <span className="mr-0.5 text-[12px] font-semibold text-[#64748B]">Add everyone with</span>
        {pickGroup('tag', meta.tags, 'tag')}
        {pickGroup('type', meta.types, 'type')}
        {pickGroup('city', meta.cities, 'city')}
      </div>
      {/* the box and, right under it, its suggestions */}
      <div className="relative">
      <div onClick={() => { if (!disabled) { input.current?.focus(); setOpen(true) } }}
        className={`flex min-h-[44px] cursor-text flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 ${open ? 'border-[#F4511E]' : 'border-[#E2E8F0]'} ${disabled ? 'opacity-60' : ''}`}>
        {value.map((r) => {
          const k = keyOf(r)
          const x = <button type="button" aria-label="Remove" disabled={disabled} onClick={(e) => { e.stopPropagation(); remove(k) }} className="-mr-0.5 ml-0.5 flex h-4 w-4 items-center justify-center rounded-full opacity-60 hover:bg-black/10 hover:opacity-100"><X className="h-3 w-3" /></button>
          if (r.kind === 'group') {
            return (
              <span key={k} data-chip="group" title={r.failed ? 'Could not load this group' : r.optedOut ? `${r.optedOut} opted out — left out` : undefined}
                className={`inline-flex h-7 max-w-full items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold ${r.failed ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                <Users className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{groupTitle(r)}</span>
                {r.failed ? <span>· failed</span> : r.ids ? <span className="font-bold">· {r.ids.length.toLocaleString('en-IN')}</span> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}{x}
              </span>
            )
          }
          return (
            <span key={k} data-chip={r.kind} className={`inline-flex h-7 max-w-full items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold ${r.kind === 'contact' ? 'bg-[#E0E7FF] text-[#3730A3]' : 'bg-[#DCFCE7] text-[#166534]'}`}>
              {r.kind === 'contact' ? <span className="truncate">{r.name || 'Contact'}</span> : <Phone className="h-3.5 w-3.5 shrink-0" />}
              <span className={r.kind === 'contact' ? 'font-normal opacity-80' : ''}>{prettyPhone(r.phone)}</span>{x}
            </span>
          )
        })}
        <span className="flex min-w-[160px] flex-1 items-center gap-1.5 pl-1">
          {!value.length && <Search className="h-4 w-4 shrink-0 text-[#94A3B8]" />}
          <input ref={input} value={q} disabled={disabled} aria-label="Send to" role="combobox" aria-expanded={open} aria-controls="wa-recipient-list" autoComplete="off"
            placeholder={value.length ? 'Add another name or number…' : 'Type a name or a 10-digit number…'}
            onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={onKey} onPaste={onPaste}
            className="h-7 min-w-0 flex-1 bg-transparent text-[13.5px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]" />
        </span>
      </div>

      {open && !disabled && (
        <div id="wa-recipient-list" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[272px] overflow-y-auto rounded-xl border border-[#E3E8EF] bg-white py-1 shadow-lg">
          {options.length === 0 && (
            <p className="flex items-center gap-2 px-3 py-3 text-[13px] text-[#64748B]">
              {searching ? <><Loader2 className="h-4 w-4 animate-spin" />Looking…</> : text ? <>Nobody matches “{q.trim()}”. Type the full 10-digit number to send to it.</> : 'No contacts yet — type a 10-digit number.'}
            </p>
          )}
          {options.map((o, i) => (
            <div key={o.key} role="option" aria-selected={i === active} aria-disabled={o.off} data-option={o.key.slice(0, 1)} onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); if (!o.off) o.add() }}
              className={`flex items-center gap-2.5 px-3 py-2 ${o.off ? 'cursor-default opacity-55' : 'cursor-pointer'} ${i === active && !o.off ? 'bg-[#F1F5F9]' : ''}`}>{o.node}</div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
