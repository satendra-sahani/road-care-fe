'use client'

// Shop-partner Ratings & Reviews — overall rating + customer reviews pulled
// from completed orders (customerRating / customerReview).
import { useEffect, useMemo, useState } from 'react'
import { shopAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, Star, MessageSquare, User as UserIcon } from 'lucide-react'

const DIST = '#D97706', STAR = '#F5A623'
const fmtDate = (iso?: string) => { try { return new Date(iso || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '' } }

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return <span className="inline-flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className="shrink-0" style={{ width: size, height: size, color: i <= Math.round(n) ? STAR : '#E2E8F0', fill: i <= Math.round(n) ? STAR : '#E2E8F0' }} />)}</span>
}

export function ShopRatings() {
  const [orders, setOrders] = useState<any[]>([])
  const [dashRating, setDashRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      shopAPI.getOrders({ limit: 200 }).catch(() => null),
      shopAPI.getDashboard().catch(() => null),
    ]).then(([o, d]) => {
      const list = o?.data?.data || o?.data?.orders || o?.data || []
      setOrders(Array.isArray(list) ? list : [])
      const r = d?.data?.data?.shop?.rating ?? d?.data?.data?.rating
      if (typeof r === 'number') setDashRating(r)
    }).catch(() => toast.error('Could not load ratings')).finally(() => setLoading(false))
  }, [])

  const reviews = useMemo(() => orders
    .filter((o) => o.customerRating || o.customerReview)
    .sort((a, b) => new Date(b.ratedAt || b.updatedAt || 0).getTime() - new Date(a.ratedAt || a.updatedAt || 0).getTime()), [orders])

  const rated = reviews.filter((o) => o.customerRating)
  const avg = dashRating ?? (rated.length ? rated.reduce((a, o) => a + (o.customerRating || 0), 0) / rated.length : 0)
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: rated.filter((o) => Math.round(o.customerRating) === star).length }))

  if (loading) return <div className="flex h-72 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>

  return (
    <div className="p-4 md:p-6 space-y-[18px] max-w-4xl">
      {/* summary */}
      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E7ECF3] bg-white p-5 shadow-sm">
          <div className="text-[42px] font-black leading-none text-[#13203A]">{avg ? avg.toFixed(1) : '—'}</div>
          <Stars n={avg} size={18} />
          <div className="mt-1.5 text-[12px] font-semibold text-[#7B8AA3]">{rated.length} rating{rated.length === 1 ? '' : 's'}</div>
        </div>
        <div className="rounded-2xl border border-[#E7ECF3] bg-white p-4 shadow-sm">
          {dist.map((d) => {
            const pct = rated.length ? (d.count / rated.length) * 100 : 0
            return (
              <div key={d.star} className="flex items-center gap-2.5 py-1">
                <span className="w-8 text-[12px] font-bold text-[#475569]">{d.star}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F1F4F8]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: STAR }} /></div>
                <span className="w-8 text-right text-[11.5px] font-semibold text-[#7B8AA3]">{d.count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* reviews */}
      <div className="rounded-2xl border border-[#E7ECF3] bg-white shadow-sm">
        <div className="border-b border-[#EEF1F6] px-[18px] py-3.5"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Customer reviews</h3></div>
        {reviews.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#E7ECF3]"><MessageSquare className="h-6 w-6 text-slate-300" /></div>
            <div className="mt-3 text-[15px] font-extrabold text-[#13203A]">No reviews yet</div>
            <div className="text-[13px] text-[#7B8AA3]">Ratings from completed jobs will show here.</div>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F4F8]">
            {reviews.map((o) => (
              <div key={o._id || o.orderId} className="flex gap-3 px-[18px] py-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F2F6FC] text-[#1B3B6F]"><UserIcon className="h-[18px] w-[18px]" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-bold text-[#13203A]">{o.customer?.fullName || 'Customer'}</span>
                    <span className="text-[11px] text-[#9AA7B8]">{fmtDate(o.ratedAt || o.updatedAt)}</span>
                  </div>
                  {o.customerRating ? <Stars n={o.customerRating} /> : null}
                  {o.customerReview ? <p className="mt-1 text-[13px] text-[#475569]">{o.customerReview}</p> : null}
                  <div className="mt-1 text-[11px] font-semibold text-[#9AA7B8]">{o.orderId || ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
