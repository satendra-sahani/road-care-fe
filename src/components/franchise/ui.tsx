'use client'

// Small building blocks shared by the franchise dashboard pages.
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FR_ACCENT } from './FranchiseLayout'

export const inr = (n?: number | null) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
export const dateIN = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
export const errMsg = (e: any, fallback = 'Something went wrong') => e?.response?.data?.message || e?.message || fallback

export function Panel({ title, action, children, className }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl border border-[#E7ECF3] bg-white', className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF1F6] px-4 py-3.5 md:px-5">
          <h2 className="text-[15px] font-extrabold text-[#13203A]">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ label, value, hint, icon: Icon, tone = FR_ACCENT }: { label: string; value: React.ReactNode; hint?: string; icon?: any; tone?: string }) {
  return (
    <div className="rounded-2xl border border-[#E7ECF3] bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-[#7B8AA3]">{label}</span>
        {Icon && <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${tone}14`, color: tone }}><Icon className="h-4 w-4" /></span>}
      </div>
      <div className="mt-2 text-[24px] font-extrabold tabular-nums text-[#13203A]">{value}</div>
      {hint && <div className="mt-0.5 text-[11.5px] text-[#7B8AA3]">{hint}</div>}
    </div>
  )
}

export function PrimaryBtn({ children, loading, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button {...p} disabled={p.disabled || loading} className={cn('inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13.5px] font-bold text-white transition-colors disabled:opacity-60', className)} style={{ background: FR_ACCENT }}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}{children}
    </button>
  )
}

export function GhostBtn({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={cn('inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E1E8F0] bg-white px-3 text-[12.5px] font-bold text-[#0E2B4C] hover:border-[#0D9488] disabled:opacity-50', className)}>{children}</button>
}

export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-bold text-[#52667C]">{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-[#7B8AA3]">{hint}</span>}
    </label>
  )
}

export const inputCls = 'h-10 w-full rounded-lg border border-[#DDE4EC] bg-white px-3 text-[13.5px] text-[#13203A] outline-none focus:border-[#0D9488] disabled:bg-[#F6F8FB]'

export function Modal({ open, onClose, title, description, children, wide }: { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className={cn('max-h-[92vh] overflow-y-auto', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

const STATUS: Record<string, [string, string]> = {
  pending: ['#B45309', '#FEF3C7'], assigned: ['#1D4ED8', '#DBEAFE'], accepted: ['#1D4ED8', '#DBEAFE'],
  mechanic_assigned: ['#1D4ED8', '#DBEAFE'], on_way: ['#6D28D9', '#EDE9FE'], diagnosis: ['#C2410C', '#FFEDD5'],
  approved: ['#6D28D9', '#EDE9FE'], in_progress: ['#6D28D9', '#EDE9FE'], completed: ['#047857', '#D1FAE5'],
  payment_pending: ['#B45309', '#FEF3C7'], paid: ['#047857', '#D1FAE5'], cancelled: ['#B91C1C', '#FEE2E2'],
  rejected_quote: ['#B91C1C', '#FEE2E2'], payment_refused: ['#B91C1C', '#FEE2E2'],
}
export function StatusPill({ status }: { status?: string }) {
  const [fg, bg] = STATUS[status || ''] || ['#475569', '#F1F5F9']
  return <span className="inline-flex rounded-full px-2.5 py-0.5 text-[11.5px] font-bold capitalize" style={{ color: fg, background: bg }}>{String(status || '—').replace(/_/g, ' ')}</span>
}

export function ActivePill({ active }: { active?: boolean }) {
  return active === false
    ? <span className="inline-flex rounded-full bg-[#FEE2E2] px-2.5 py-0.5 text-[11.5px] font-bold text-[#B91C1C]">Inactive</span>
    : <span className="inline-flex rounded-full bg-[#D1FAE5] px-2.5 py-0.5 text-[11.5px] font-bold text-[#047857]">Active</span>
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-12 text-center text-[13.5px] text-[#7B8AA3]">{children}</div>
}

export function Spinner() {
  return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#0D9488]" /></div>
}

export const PLANS = [
  { key: 'standard', label: 'Standard — 5% platform fee · 8 km · ₹5,000 min wallet' },
  { key: 'pro', label: 'Pro — 3% platform fee · 20 km · ₹10,000 min wallet' },
]
export const SPECIALIZATIONS = ['Engine Repair', 'Brake System', 'Electrical', 'AC Service', 'Battery', 'Tyre Service', 'Suspension', 'Clutch', 'Oil Change', 'Body Work', 'Painting', 'General Service']
export const VEHICLE_TYPES = ['Bike', 'Scooter', 'Car', 'Auto', 'Truck', 'Bus', 'Tractor', 'Electric Vehicle']

export function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button type="button" key={o} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn('rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-colors', on ? 'border-[#0D9488] bg-[#0D9488] text-white' : 'border-[#DDE4EC] bg-white text-[#0E2B4C] hover:border-[#0D9488]')}>
            {o}
          </button>
        )
      })}
    </div>
  )
}
