'use client'

// SearchSelect's sibling for picking SEVERAL: a dropdown you can type into, where each
// option is ticked on or off and the list stays open until you are done. Nothing ticked
// means "all" (the closed button then shows the "All …" label).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

export type MultiOption = { value: string; label: string; hint?: string; color?: string }

const plain = (s: string) => s.toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim()

export function MultiSearchSelect({ values, onChange, options, allLabel, noun, placeholder = 'Search…', className = '', ariaLabel, align = 'left' }: {
  values: string[]
  onChange: (values: string[]) => void
  options: MultiOption[]
  /** shown when nothing is ticked — "All Cities" */
  allLabel: string
  /** for "3 cities" when several are ticked */
  noun: string
  placeholder?: string
  className?: string
  ariaLabel?: string
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const on = useMemo(() => new Set(values), [values])
  const shown = useMemo(() => {
    const words = plain(q).split(' ').filter(Boolean)
    return words.length ? options.filter((o) => { const t = plain(`${o.label} ${o.hint || ''}`); return words.every((w) => t.includes(w)) }) : options
  }, [options, q])
  const chosen = options.filter((o) => on.has(o.value))
  const text = !chosen.length ? allLabel : chosen.length === 1 ? chosen[0].label : `${chosen.length} ${noun}`

  useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => input.current?.focus(), 0) } }, [open])
  useEffect(() => { setActive(0) }, [q])
  useEffect(() => {
    if (!open) return
    const off = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', off)
    return () => document.removeEventListener('mousedown', off)
  }, [open])
  useEffect(() => { list.current?.children[active]?.scrollIntoView?.({ block: 'nearest' }) }, [active])

  const toggle = (v: string) => onChange(on.has(v) ? values.filter((x) => x !== v) : [...values, v])
  const onKey = (e: React.KeyboardEvent) => {
    // Esc closes this list only — not a dialog it may sit in
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); return }
    if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) toggle(shown[active].value) }
  }

  return (
    <div ref={root} className="relative" data-multi-select={ariaLabel}>
      <button type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 text-left ${className}`}>
        {chosen.length > 0 && <span className="flex shrink-0 -space-x-1">{chosen.slice(0, 3).map((o) => <i key={o.value} className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: o.color || '#16305C' }} />)}</span>}
        <span className="min-w-0 flex-1 truncate">{text}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className={`absolute top-full z-50 mt-1 w-[260px] overflow-hidden rounded-xl border border-[#E3E8EF] bg-white shadow-lg ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="flex items-center gap-2 border-b border-[#EEF2F6] px-3">
            <Search className="h-4 w-4 shrink-0 text-[#94A3B8]" />
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder={placeholder} aria-label={`${ariaLabel || 'Filter'} search`}
              className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[#94A3B8]" />
          </div>
          <ul ref={list} role="listbox" aria-multiselectable className="max-h-[260px] overflow-y-auto py-1">
            {shown.length === 0 && <li className="px-3 py-2.5 text-[13px] text-[#94A3B8]">{options.length ? <>Nothing matches “{q}”</> : 'Nothing to choose from yet'}</li>}
            {shown.map((o, i) => {
              const ticked = on.has(o.value)
              return (
                <li key={o.value} role="option" aria-selected={ticked} onMouseEnter={() => setActive(i)} onClick={() => toggle(o.value)}
                  className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13.5px] text-[#1F2937] ${i === active ? 'bg-[#F1F5F9]' : ''}`}>
                  <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border ${ticked ? 'border-transparent text-white' : 'border-[#CBD5E1] bg-white'}`} style={ticked ? { background: o.color || '#16305C' } : undefined}>{ticked && <Check className="h-3.5 w-3.5" />}</span>
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="shrink-0 text-[11.5px] font-medium text-[#94A3B8]">{o.hint}</span>}
                </li>
              )
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-[#EEF2F6] px-3 py-2 text-[12.5px] font-bold">
            <button type="button" onClick={() => onChange([])} disabled={!values.length} className="text-[#2563EB] disabled:text-[#94A3B8]">Clear ({values.length})</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-[#16305C] px-3 py-1 text-white">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
