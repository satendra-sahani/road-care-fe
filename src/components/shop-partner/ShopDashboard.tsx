'use client'

import { useEffect, useState } from 'react'
import { shopAPI } from '@/services/api'
import Link from 'next/link'
import {
  Wrench, CheckCircle, IndianRupee, Star, Loader2, AlertCircle,
  ShieldCheck, Users, ChevronRight, Wallet as WalletIcon, AlertTriangle, Plus, Eye,
} from 'lucide-react'

const DIST = '#D97706', DIST_50 = '#FEF3E2', NAVY = '#1B3B6F', GREEN = '#15936B', ORANGE = '#FF6B35'
const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

const STATUS: Record<string, { cls: string; bg: string; fg: string; label: string }> = {
  pending: { cls: 'pending', bg: '#FEF3E2', fg: '#B45309', label: 'New' },
  accepted: { cls: 'active', bg: '#E7F6EF', fg: GREEN, label: 'Accepted' },
  mechanic_assigned: { cls: 'transit', bg: '#EAF1FE', fg: '#2563EB', label: 'Assigned' },
  on_way: { cls: 'transit', bg: '#EAF1FE', fg: '#2563EB', label: 'On the way' },
  in_progress: { cls: 'processing', bg: '#FEF3E2', fg: '#B45309', label: 'In progress' },
  completed: { cls: 'delivered', bg: '#E7F6EF', fg: GREEN, label: 'Completed' },
  rejected: { cls: 'cancelled', bg: '#FEE8E8', fg: '#DC2626', label: 'Rejected' },
  cancelled: { cls: 'cancelled', bg: '#FEE8E8', fg: '#DC2626', label: 'Cancelled' },
}

export function ShopDashboard() {
  const [data, setData] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [mechs, setMechs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const [res, w, m] = await Promise.all([
          shopAPI.getDashboard(),
          shopAPI.getWallet().catch(() => null),
          shopAPI.getAssignedMechanics().catch(() => null),
        ])
        if (res.data?.success) setData(res.data.data); else setError(true)
        if (w?.data?.success) setWallet(w.data.data)
        const ml = m?.data?.data?.mechanics || m?.data?.data || []
        setMechs(Array.isArray(ml) ? ml : [])
      } catch { setError(true) } finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>
  if (error || !data) {
    return <div className="p-6"><div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Unable to load your dashboard.</div></div>
  }

  const { shop, stats, earnings, recentOrders } = data

  const kpis = [
    { bg: DIST_50, fg: DIST, Icon: Wrench, val: String(stats?.activeOrders ?? 0), label: 'Active jobs' },
    { bg: '#F2F6FC', fg: NAVY, Icon: CheckCircle, val: String(stats?.totalCompleted ?? 0), label: 'Jobs completed' },
    { bg: '#E7F6EF', fg: GREEN, Icon: IndianRupee, val: inr(earnings?.thisMonth?.totalEarning || 0), label: 'Earnings (month)' },
    { bg: '#FFF7E6', fg: '#F5A623', Icon: Star, val: shop?.rating > 0 ? Number(shop.rating).toFixed(1) : '—', label: 'Current rating' },
  ]

  // Earnings bars (real periods)
  const periods = [
    { label: 'Today', v: earnings?.today?.totalEarning || 0 },
    { label: 'This week', v: earnings?.thisWeek?.totalEarning || 0 },
    { label: 'This month', v: earnings?.thisMonth?.totalEarning || 0 },
  ]
  const maxE = Math.max(1, ...periods.map((p) => p.v))

  // Job-status donut (real pipeline)
  const seg = {
    completed: stats?.totalCompleted ?? 0,
    active: stats?.activeOrders ?? 0,
    pending: stats?.pendingOrders ?? 0,
  }
  const totalSeg = Math.max(1, seg.completed + seg.active + seg.pending)
  const p1 = (seg.completed / totalSeg) * 100
  const p2 = p1 + (seg.active / totalSeg) * 100
  const donut = `conic-gradient(${GREEN} 0 ${p1}%, ${ORANGE} ${p1}% ${p2}%, ${NAVY} ${p2}% 100%)`

  return (
    <div className="p-4 md:p-6">
      {/* Verification banner */}
      <div className={`flex items-center gap-3.5 rounded-2xl px-4 md:px-5 py-4 mb-[18px] ${shop?.isVerified ? 'bg-[#E7F6EF] border border-[#bfe8d6]' : 'bg-[#FEF3E2] border border-[#f0d8a8]'}`}>
        <div className="h-[46px] w-[46px] rounded-[13px] flex items-center justify-center text-white shrink-0" style={{ background: shop?.isVerified ? GREEN : DIST }}>
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <b className="block text-[15px] text-[#13203A]">{shop?.isVerified ? 'Verified Shop Partner' : 'Verification pending'}</b>
          <span className="text-[13px] text-[#475569]">{shop?.shopName}{shop?.commissionRate != null ? ` · Commission ${shop.commissionRate}%` : ''} · {shop?.mechanicsCount ?? 0} mechanics</span>
        </div>
      </div>

      {/* Wallet strip — ₹2000 minimum */}
      {wallet && (
        <Link href="/shop-partner/wallet" className="flex items-center gap-3.5 rounded-2xl px-4 md:px-5 py-3.5 mb-[18px] text-white shadow-sm transition hover:-translate-y-0.5"
          style={{ background: wallet.belowMinimum ? 'linear-gradient(135deg,#b91c1c,#dc2626)' : `linear-gradient(135deg, ${DIST}, #F59E0B)` }}>
          <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">{wallet.belowMinimum ? <AlertTriangle className="h-5 w-5" /> : <WalletIcon className="h-5 w-5" />}</div>
          <div className="min-w-0 flex-1"><b className="block text-[18px] font-extrabold leading-tight">{inr(wallet.balance || 0)}</b>
            <span className="text-[12px] text-white/85">{wallet.belowMinimum ? `Below ₹${(wallet.minBalance ?? 2000).toLocaleString('en-IN')} minimum · add ${inr(wallet.shortfall || 0)}` : `Wallet · minimum ${inr(wallet.minBalance ?? 2000)} maintained`}</span></div>
          <span className="shrink-0 inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5 text-[12.5px] font-bold"><Plus className="h-3.5 w-3.5" /> Add money</span>
        </Link>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-[18px]">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-[#E7ECF3] rounded-2xl p-[18px] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="h-[42px] w-[42px] rounded-xl flex items-center justify-center" style={{ background: k.bg, color: k.fg }}><k.Icon className="h-[21px] w-[21px]" /></div>
            </div>
            <div className="text-[27px] font-extrabold tracking-tight text-[#13203A] leading-none">{k.val}</div>
            <div className="text-[13px] text-[#7B8AA3] mt-1.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Earnings + job status */}
      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-4 mb-[18px]">
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Earnings overview</h3><Link href="/shop-partner/earnings" className="text-[12.5px] font-bold" style={{ color: DIST }}>Wallet →</Link></div>
          <div className="p-[18px]">
            <div className="h-[180px] flex items-end gap-6 pt-2.5">
              {periods.map((p) => (
                <div key={p.label} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <span className="text-[12px] font-extrabold text-[#13203A]">{inr(p.v)}</span>
                  <div className="w-full max-w-[64px] rounded-t-md" style={{ height: `${Math.max(6, (p.v / maxE) * 100)}%`, background: `linear-gradient(180deg, ${DIST}, #F59E0B)` }} />
                  <div className="text-[11.5px] text-[#7B8AA3] font-semibold">{p.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Job status</h3></div>
          <div className="p-[18px] flex items-center gap-5">
            <div className="relative h-[120px] w-[120px] rounded-full shrink-0" style={{ background: donut }}>
              <div className="absolute inset-[18px] bg-white rounded-full flex flex-col items-center justify-center">
                <b className="text-[22px] font-extrabold text-[#13203A] leading-none">{seg.completed + seg.active + seg.pending}</b>
                <span className="text-[11px] text-[#7B8AA3]">total</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5 text-[13px]">
              <div className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: GREEN }} />Completed<b className="ml-auto font-extrabold">{seg.completed}</b></div>
              <div className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: ORANGE }} />Active<b className="ml-auto font-extrabold">{seg.active}</b></div>
              <div className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: NAVY }} />New / pending<b className="ml-auto font-extrabold">{seg.pending}</b></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent jobs table */}
      <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm mb-[18px]">
        <div className="flex items-center justify-between px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Recent jobs</h3><Link href="/shop-partner/orders" className="text-[12.5px] font-bold" style={{ color: DIST }}>View all →</Link></div>
        <div className="px-1 py-2 overflow-x-auto">
          {!recentOrders?.length ? (
            <div className="text-center py-10 text-[#7B8AA3] text-sm">No jobs yet. New service jobs will appear here.</div>
          ) : (
            <table className="w-full min-w-[640px] border-collapse">
              <thead><tr>{['Job ID', 'Customer', 'Service', 'Status', ''].map((h) => <th key={h} className="text-left text-[11px] tracking-wide uppercase text-[#7B8AA3] font-extrabold px-3.5 pb-3">{h}</th>)}</tr></thead>
              <tbody>
                {recentOrders.map((o: any) => {
                  const s = STATUS[o.status] || { bg: '#eef1f6', fg: '#475569', label: o.status }
                  return (
                    <tr key={o._id} className="hover:bg-[#F6F8FB]">
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6] text-[13px] font-bold" style={{ color: NAVY }}>{o.orderId || `#${String(o._id).slice(-6).toUpperCase()}`}</td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6]">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-[9px] flex items-center justify-center font-extrabold text-[12px] shrink-0" style={{ background: '#F2F6FC', color: NAVY }}>{(o.customer?.fullName || 'C')[0].toUpperCase()}</div>
                          <div className="min-w-0"><b className="block text-[13.5px] text-[#13203A] leading-tight truncate">{o.customer?.fullName || 'Customer'}</b><span className="text-[11.5px] text-[#7B8AA3]">{o.vehicle?.type || o.serviceType || ''}</span></div>
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6] text-[13px] text-[#475569]">{o.serviceCategory || 'Service'}</td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6]"><span className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.fg }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />{s.label}</span></td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6] text-right">
                        <Link href={`/shop-partner/orders?id=${o._id}`} className="inline-flex h-8 w-8 rounded-lg border border-[#E7ECF3] items-center justify-center text-[#1B3B6F]"><Eye className="h-4 w-4" /></Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pending settlement + mechanics + rating */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Pending settlement</h3><Link href="/shop-partner/earnings" className="text-[12.5px] font-bold" style={{ color: DIST }}>Details →</Link></div>
          <div className="p-[18px]"><div className="text-[32px] font-extrabold leading-none" style={{ color: DIST }}>{inr(earnings?.pendingSettlement || 0)}</div><p className="text-[12.5px] text-[#7B8AA3] mt-2">Paid out in your next settlement cycle.</p></div>
        </div>
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Mechanics</h3><Link href="/shop-partner/mechanics" className="text-[12.5px] font-bold" style={{ color: DIST }}>Manage →</Link></div>
          <div className="p-[18px] space-y-3">
            {mechs.length ? mechs.slice(0, 4).map((m: any, i: number) => {
              const nm = m.name || m.fullName || m.user?.fullName || 'Mechanic'
              return (
                <div key={m._id || i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-[12px] font-extrabold shrink-0" style={{ background: `linear-gradient(135deg, ${NAVY}, ${'#2A5298'})` }}>{nm.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0"><b className="block text-[13.5px] text-[#13203A] leading-tight truncate">{nm}</b><span className="text-[11.5px] text-[#7B8AA3]">{m.specialization || m.spec || 'Mechanic'}</span></div>
                </div>
              )
            }) : <div className="flex items-center gap-2 text-[#7B8AA3] text-sm"><Users className="h-5 w-5" /> No mechanics yet.</div>}
          </div>
        </div>
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Reputation</h3></div>
          <div className="p-[18px] text-center">
            <div className="text-[36px] font-extrabold leading-none" style={{ color: '#F5A623' }}>{shop?.rating > 0 ? Number(shop.rating).toFixed(1) : '—'}</div>
            <div className="flex items-center justify-center gap-0.5 my-2">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= Math.round(shop?.rating || 0) ? 'fill-[#F5A623] text-[#F5A623]' : 'text-[#E7ECF3]'}`} />)}</div>
            <p className="text-[12.5px] text-[#7B8AA3]">{shop?.totalRatings || 0} customer ratings</p>
          </div>
        </div>
      </div>
    </div>
  )
}
