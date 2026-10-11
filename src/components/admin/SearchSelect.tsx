'use client'

// A dropdown you can type into: the list narrows as you type, Enter picks the
// highlighted match, Esc closes. Used for the filter bars in admin (status,
// priority, service, vehicle, city…) where a plain select gets long.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

/** hint = a quiet second word at the right of the option (a template's category…); it is searched too */
export type SearchSelectOption = { value: string; label: string; hint?: string }

// What is typed against what is listed: case does not matter, "_" and "-" count as spaces
// (template names are written bm_mechanic_assigned), and every typed word has to be there,
// in any order — "assigned hi" finds "bm_mechanic_assigned_new (hi)".
const plain = (s: string) => s.toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim()

export function SearchSelect({ value, onChange, options, placeholder = 'Search…', className = '', icon, ariaLabel, align = 'left', trailing, menuClassName = 'w-[240px]' }: {
  value: string
  onChange: (value: string) => void
  /** the first option is normally the "All …" one */
  options: SearchSelectOption[]
  placeholder?: string
  /** classes for the closed button (height, width, border…) */
  className?: string
  /** shown at the left of the closed button */
  icon?: React.ReactNode
  ariaLabel?: string
  align?: 'left' | 'right'
  /** shown in the closed button, before the arrow (a status badge…) */
  trailing?: React.ReactNode
  /** width of the open list — 'w-full' makes it as wide as the button */
  menuClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const current = options.find((o) => o.value === value) || options[0]
  const shown = useMemo(() => {
    const words = plain(q).split(' ').filter(Boolean)
    if (!words.length) return options
    return options.filter((o) => { const text = plain(`${o.label} ${o.hint || ''}`); return words.every((w) => text.includes(w)) })
  }, [options, q])

  useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => input.current?.focus(), 0) } }, [open])
  useEffect(() => { setActive(0) }, [q])
  useEffect(() => {
    if (!open) return
    const off = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', off)
    return () => document.removeEventListener('mousedown', off)
  }, [open])
  useEffect(() => { list.current?.children[active]?.scrollIntoView?.({ block: 'nearest' }) }, [active])

  const pick = (v: string) => { onChange(v); setOpen(false) }
  const onKey = (e: React.KeyboardEvent) => {
    // Esc closes this list only — not a dialog the dropdown sits in (that one listens on the window)
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); return }
    if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) pick(shown[active].value) }
  }

  return (
    <div ref={root} className="relative" data-search-select={ariaLabel}>
      <button type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 text-left ${className}`}>
        {icon}
        <span className="min-w-0 flex-1 truncate">{current?.label ?? ''}</span>
        {trailing}
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className={`absolute top-full z-50 mt-1 ${menuClassName} overflow-hidden rounded-xl border border-[#E3E8EF] bg-white shadow-lg ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="flex items-center gap-2 border-b border-[#EEF2F6] px-3">
            <Search className="h-4 w-4 shrink-0 text-[#94A3B8]" />
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder={placeholder} aria-label={`${ariaLabel || 'Filter'} search`}
              className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[#94A3B8]" />
          </div>
          <ul ref={list} role="listbox" className="max-h-[260px] overflow-y-auto py-1">
            {shown.length === 0 && <li className="px-3 py-2.5 text-[13px] text-[#94A3B8]">Nothing matches “{q}”</li>}
            {shown.map((o, i) => (
              <li key={o.value} role="option" aria-selected={o.value === value} onMouseEnter={() => setActive(i)} onClick={() => pick(o.value)}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-[13.5px] text-[#1F2937] ${i === active ? 'bg-[#F1F5F9]' : ''}`}>
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && <span className="shrink-0 text-[11.5px] font-medium text-[#94A3B8]">{o.hint}</span>}
                {o.value === value && <Check className="h-4 w-4 shrink-0 text-[#16305C]" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
