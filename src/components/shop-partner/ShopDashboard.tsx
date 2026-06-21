'use client'

import { useEffect, useState } from 'react'
import { shopAPI } from '@/services/api'
import {
  ClipboardList, CheckCircle, AlertCircle, Users, Star, Loader2,
  Wrench, IndianRupee, ChevronRight, ShieldCheck, Clock,
} from 'lucide-react'
import Link from 'next/link'

const DIST = '#0D9488', DIST_50 = '#E6F7F4'

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-[#F2F6FC] text-[#1B3B6F]',
  accepted: 'bg-[#F2F6FC] text-[#1B3B6F]',
  mechanic_assigned: 'bg-[#EEF0FF] text-[#4F46E5]',
  on_way: 'bg-[#FFF1EB] text-[#FF6B35]',
  in_progress: 'bg-[#FFF1EB] text-[#FF6B35]',
  completed: 'bg-[#E7F6EF] text-[#15936B]',
  rejected: 'bg-[#fde8e8] text-[#b91c1c]',
  cancelled: 'bg-gray-100 text-gray-600',
}

const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export function ShopDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await shopAPI.getDashboard()
        if (res.data?.success) setData(res.data.data)
        else setError(true)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>
  }
  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5" /> Unable to load your dashboard. Please refresh.
        </div>
      </div>
    )
  }

  const { shop, stats, earnings, recentOrders } = data

  // KPIs — all from real API data
  const kpis = [
    { bg: DIST_50, fg: DIST, Icon: Wrench, val: stats?.activeOrders ?? 0, label: 'Active jobs' },
    { bg: '#F2F6FC', fg: '#1B3B6F', Icon: CheckCircle, val: stats?.totalCompleted ?? 0, label: 'Jobs completed' },
    { bg: '#E7F6EF', fg: '#15936B', Icon: IndianRupee, val: inr(earnings?.thisMonth?.totalEarning || 0), label: 'Earnings (month)' },
    { bg: '#FFF7E6', fg: '#F5A623', Icon: Star, val: shop?.rating > 0 ? Number(shop.rating).toFixed(1) : '—', label: 'Current rating' },
  ]

  const earningCards = [
    { title: 'Today', value: earnings?.today?.totalEarning || 0, jobs: earnings?.today?.count ?? 0 },
    { title: 'This week', value: earnings?.thisWeek?.totalEarning || 0, jobs: earnings?.thisWeek?.count ?? 0 },
    { title: 'This month', value: earnings?.thisMonth?.totalEarning || 0, jobs: earnings?.thisMonth?.count ?? 0 },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Verification banner */}
      <div className={`flex items-center gap-3.5 rounded-2xl px-4 md:px-5 py-3.5 ${shop?.isVerified ? 'bg-[#E7F6EF] border border-[#bfe6d3]' : 'bg-[#FFF7E6] border border-[#F5D9A0]'}`}>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${shop?.isVerified ? 'bg-[#15936B] text-white' : 'bg-[#F5A623] text-white'}`}>
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <b className="block text-[14px] text-[#13203A]">{shop?.isVerified ? 'Verified Shop Partner' : 'Verification pending'}</b>
          <span className="text-[12.5px] text-[#475569]">
            {shop?.shopName}{shop?.ownerName ? ` · ${shop.ownerName}` : ''}{shop?.commissionRate != null ? ` · Commission ${shop.commissionRate}%` : ''}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {shop?.rating > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 bg-white/70 rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-[#13203A]">
              <Star className="h-3.5 w-3.5 text-[#F5A623] fill-[#F5A623]" /> {Number(shop.rating).toFixed(1)}
              <span className="text-[11px] font-medium text-[#7B8AA3]">({shop.totalRatings || 0})</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 bg-white/70 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#1B3B6F]">
            <Users className="h-3.5 w-3.5" /> {shop?.mechanicsCount ?? 0}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm p-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ background: k.bg, color: k.fg }}>
              <k.Icon className="h-5 w-5" />
            </div>
            <div className="text-[24px] font-extrabold text-[#13203A] leading-none">{k.val}</div>
            <div className="text-[12.5px] text-[#7B8AA3] mt-1.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Earnings + pending settlement */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EEF1F6]">
            <h3 className="font-extrabold text-[15px] text-[#13203A]">Earnings overview</h3>
            <Link href="/shop-partner/earnings" className="text-[13px] font-bold" style={{ color: DIST }}>View →</Link>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            {earningCards.map((c) => (
              <div key={c.title} className="bg-[#F6F8FB] rounded-xl p-3.5">
                <p className="text-[11.5px] text-[#7B8AA3] mb-1">{c.title}</p>
                <p className="text-[18px] font-extrabold text-[#13203A]">{inr(c.value)}</p>
                <p className="text-[11px] text-[#7B8AA3] mt-0.5">{c.jobs} jobs</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EEF1F6]">
            <h3 className="font-extrabold text-[15px] text-[#13203A]">Pending settlement</h3>
            <Link href="/shop-partner/earnings" className="text-[13px] font-bold" style={{ color: DIST }}>Details →</Link>
          </div>
          <div className="p-5">
            <div className="text-[30px] font-extrabold leading-none" style={{ color: DIST }}>{inr(earnings?.pendingSettlement || 0)}</div>
            <p className="text-[12.5px] text-[#7B8AA3] mt-2">Will be paid out in your next settlement cycle.</p>
          </div>
        </div>
      </div>

      {/* Recent jobs */}
      <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EEF1F6]">
          <h3 className="font-extrabold text-[15px] text-[#13203A]">Recent jobs</h3>
          <Link href="/shop-partner/orders" className="text-[13px] font-bold" style={{ color: DIST }}>View all →</Link>
        </div>
        {!recentOrders?.length ? (
          <div className="text-center py-12 text-[#7B8AA3]">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-[#E7ECF3]" />
            <p className="text-sm">No jobs yet. New service jobs will appear here when assigned to your shop.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF1F6]">
            {recentOrders.map((o: any) => (
              <Link key={o._id} href={`/shop-partner/orders?id=${o._id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F6F8FB] transition-colors">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: DIST_50, color: DIST }}>
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <b className="text-[13.5px] text-[#13203A]">{o.orderId || `#${String(o._id).slice(-6).toUpperCase()}`}</b>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_PILL[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status?.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-[12px] text-[#7B8AA3] mt-0.5 truncate">
                    {o.customer?.fullName || 'Customer'} · {o.serviceCategory || 'Service'}
                    {o.createdAt ? <span className="inline-flex items-center gap-1"> · <Clock className="h-3 w-3" />{new Date(o.createdAt).toLocaleDateString('en-IN')}</span> : null}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-extrabold text-[#1B3B6F]">{inr(o.finalCost || o.estimatedCost || 0)}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#7B8AA3] shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
