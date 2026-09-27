'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Shared page controls for admin lists (service requests, orders, payments,
 * customers, shop partners). Server- or client-side paging — the caller owns
 * page/pageSize state and passes the total count.
 */
export function AdminPagination({
  page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [10, 20, 50, 100], className, label = 'results',
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (p: number) => void
  onPageSizeChange?: (n: number) => void
  pageSizeOptions?: number[]
  className?: string
  label?: string
}) {
  const pages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const cur = Math.min(Math.max(1, page), pages)
  const from = total === 0 ? 0 : (cur - 1) * pageSize + 1
  const to = Math.min(total, cur * pageSize)

  // compact page list: 1 … 4 5 [6] 7 8 … 20
  const nums: (number | '…')[] = []
  const push = (n: number | '…') => { if (nums[nums.length - 1] !== n) nums.push(n) }
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - cur) <= 1) push(i)
    else if (nums[nums.length - 1] !== '…') push('…')
  }

  const btn = 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3', className)} aria-label="Pagination">
      <div className="flex items-center gap-3 text-xs text-[#6B7280]">
        <span>
          Showing <b className="text-[#1A1D29]">{from.toLocaleString('en-IN')}–{to.toLocaleString('en-IN')}</b> of <b className="text-[#1A1D29]">{(total || 0).toLocaleString('en-IN')}</b> {label}
        </span>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5">
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-[#1A1D29] outline-none focus:border-[#1B3B6F]"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </div>
      {pages > 1 && (
        <nav className="flex items-center gap-1">
          <button type="button" className={cn(btn, 'border-gray-200 bg-white text-[#1A1D29] hover:border-[#1B3B6F]')} disabled={cur <= 1} onClick={() => onPageChange(cur - 1)} aria-label="Previous page">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {nums.map((n, i) => n === '…'
            ? <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
            : (
              <button key={n} type="button" onClick={() => onPageChange(n)} aria-current={n === cur ? 'page' : undefined}
                className={cn(btn, n === cur ? 'border-[#1B3B6F] bg-[#1B3B6F] text-white' : 'border-gray-200 bg-white text-[#1A1D29] hover:border-[#1B3B6F]')}>
                {n}
              </button>
            ))}
          <button type="button" className={cn(btn, 'border-gray-200 bg-white text-[#1A1D29] hover:border-[#1B3B6F]')} disabled={cur >= pages} onClick={() => onPageChange(cur + 1)} aria-label="Next page">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      )}
    </div>
  )
}

/** Slice an array for client-side paging. */
export function paginate<T>(list: T[], page: number, pageSize: number): T[] {
  const start = (Math.max(1, page) - 1) * pageSize
  return list.slice(start, start + pageSize)
}
