'use client'

import { useEffect, useState } from 'react'
import { shopAPI } from '@/services/api'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Wrench, CheckCircle, IndianRupee, Star, Loader2, AlertCircle,
  ShieldCheck, Zap, Check, Eye,
} from 'lucide-react'

const DIST = '#D97706', DIST_50 = '#FEF3E2', DIST_2 = '#B45309', NAVY = '#1B3B6F', GREEN = '#15936B', ORANGE = '#FF6B35', STAR = '#F5A623'
const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

const STATUS_PILL: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: '#FEF3E2', fg: DIST_2, label: 'New' },
  accepted: { bg: '#FEF3E2', fg: DIST_2, label: 'Accepted' },
  mechanic_assigned: { bg: '#EAF1FE', fg: '#2563EB', label: 'Assigned' },
  on_way: { bg: '#EAF1FE', fg: '#2563EB', label: 'On the way' },
  in_progress: { bg: '#EAF1FE', fg: '#2563EB', label: 'In progress' },
  completed: { bg: '#E7F6EF', fg: GREEN, label: 'Completed' },
  rejected: { bg: '#FEE8E8', fg: '#DC2626', label: 'Rejected' },
  cancelled: { bg: '#FEE8E8', fg: '#DC2626', label: 'Cancelled' },
}

export function ShopDashboard() {
  const [data, setData] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [available, setAvailable] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    try {
      const [d, o] = await Promise.all([shopAPI.getDashboard(), shopAPI.getOrders().catch(() => null)])
      if (d.data?.success) { setData(d.data.data); setAvailable(d.data.data?.shop?.isAvailable !== false) } else setError(true)
      const list = o?.data?.data || []
      setOrders(Array.isArray(list) ? list : [])
    } catch { setError(true) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const toggleAvail = async () => {
    const next = !available; setAvailable(next)
    try { await shopAPI.updateProfile({ isAvailable: next }); toast.success(next ? 'Now accepting jobs' : 'Not accepting jobs') }
    catch { setAvailable(!next); toast.error('Could not update') }
  }
  const accept = async (id: string) => {
    setBusy(id)
    try { const r = await shopAPI.acceptOrder(id); if (r.data?.success) { toast.success('Job accepted'); load() } else toast.error(r.data?.message || 'Failed') }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed to accept') } finally { setBusy(null) }
  }
  const reject = async (id: string) => {
    setBusy(id)
    try { const r = await shopAPI.rejectOrder(id, 'Rejected by shop'); if (r.data?.success) { toast.success('Job rejected'); load() } else toast.error(r.data?.message || 'Failed') }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed') } finally { setBusy(null) }
  }

  if (loading) return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>
  if (error || !data) return <div className="p-6"><div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Unable to load your dashboard.</div></div>

  const { shop, stats, earnings } = data
  const newJobs = orders.filter((o) => (o.status || '').toLowerCase() === 'pending')
  const recent = orders.slice(0, 5)

  const kpis = [
    { bg: DIST_50, fg: DIST_2, Icon: Wrench, val: String(stats?.activeOrders ?? 0), label: 'Active jobs', trend: newJobs.length ? `▲ ${newJobs.length}` : '' },
    { bg: '#F2F6FC', fg: NAVY, Icon: CheckCircle, val: String(stats?.totalCompleted ?? 0), label: 'Jobs completed', trend: stats?.completedToday ? `▲ ${stats.completedToday}` : '' },
    { bg: '#E7F6EF', fg: GREEN, Icon: IndianRupee, val: inr(earnings?.thisMonth?.totalEarning || 0), label: 'Earnings (month)', trend: '' },
    { bg: '#FFF7E6', fg: STAR, Icon: Star, val: shop?.rating > 0 ? Number(shop.rating).toFixed(1) : '—', label: 'Current rating', trend: '' },
  ]

  // 7-day earnings chart frame (real weekly total; bars sized by available data)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekTotal = earnings?.thisWeek?.totalEarning || 0
  const dayVals = days.map(() => 0) // no per-day API yet → empty bars for a new shop
  const maxD = Math.max(1, ...dayVals)

  // donut
  const seg = { completed: stats?.totalCompleted ?? 0, active: stats?.activeOrders ?? 0, pending: stats?.pendingOrders ?? 0 }
  const totalSeg = Math.max(1, seg.completed + seg.active + seg.pending)
  const p1 = (seg.completed / totalSeg) * 100, p2 = p1 + (seg.active / totalSeg) * 100
  const donut = `conic-gradient(${GREEN} 0 ${p1}%, ${ORANGE} ${p1}% ${p2}%, ${NAVY} ${p2}% 100%)`

  return (
    <div className="p-4 md:p-6">
      {/* Verification banner + availability toggle */}
      <div className={`flex items-center gap-3.5 rounded-2xl px-4 md:px-5 py-4 mb-[18px] ${shop?.isVerified ? 'bg-[#E7F6EF] border border-[#bfe8d6]' : 'bg-[#FEF3E2] border border-[#f0d8a8]'}`}>
        <div className="h-[46px] w-[46px] rounded-[13px] flex items-center justify-center text-white shrink-0" style={{ background: shop?.isVerified ? GREEN : DIST }}><ShieldCheck className="h-6 w-6" /></div>
        <div className="min-w-0"><b className="block text-[15px] text-[#13203A]">{shop?.isVerified ? 'Verified Shop Partner' : 'Verification pending'}</b>
          <span className="text-[13px] text-[#475569]">{shop?.shopName}{shop?.commissionRate != null ? ` · Commission ${shop.commissionRate}%` : ''} · {shop?.mechanicsCount ?? 0} mechanics</span></div>
        <div className="ml-auto flex items-center gap-2.5 bg-white border border-[#E7ECF3] rounded-[11px] pl-3.5 pr-2 py-2 shrink-0">
          <b className="text-[13px] text-[#13203A] hidden sm:block">{available ? 'Accepting jobs' : 'Not accepting'}</b>
          <button onClick={toggleAvail} className={`w-[46px] h-[27px] rounded-full relative transition ${available ? 'bg-[#15936B]' : 'bg-[#E7ECF3]'}`}>
            <span className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow transition-all ${available ? 'left-[22px]' : 'left-[3px]'}`} />
          </button>
        </div>
      </div>

      {/* KPIs with trend badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-[18px]">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-[#E7ECF3] rounded-2xl p-[18px] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="h-[42px] w-[42px] rounded-xl flex items-center justify-center" style={{ background: k.bg, color: k.fg }}><k.Icon className="h-[21px] w-[21px]" /></div>
              {k.trend && <span className="text-[12px] font-extrabold px-2 py-[3px] rounded-md" style={{ color: GREEN, background: '#E7F6EF' }}>{k.trend}</span>}
            </div>
            <div className="text-[27px] font-extrabold tracking-tight text-[#13203A] leading-none">{k.val}</div>
            <div className="text-[13px] text-[#7B8AA3] mt-1.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* New job requests awaiting action */}
      {newJobs.length > 0 && (
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm mb-[18px]">
          <div className="flex items-center justify-between px-[18px] py-4 border-b border-[#EEF1F6]">
            <h3 className="text-[15.5px] font-extrabold text-[#13203A] flex items-center gap-2"><Zap className="h-[18px] w-[18px]" style={{ color: ORANGE }} /> {newJobs.length} new job request{newJobs.length === 1 ? '' : 's'} awaiting action</h3>
            <Link href="/shop-partner/orders" className="text-[12.5px] font-bold" style={{ color: DIST }}>View all →</Link>
          </div>
          <div className="divide-y divide-[#EEF1F6]">
            {newJobs.slice(0, 4).map((o) => {
              const id = o._id || o.id
              return (
                <div key={id} className="flex items-center gap-3 px-[18px] py-3.5">
                  <div className="h-9 w-9 rounded-[10px] flex items-center justify-center font-extrabold text-[12px] shrink-0" style={{ background: '#F2F6FC', color: NAVY }}>{(o.customer?.fullName || 'C')[0].toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <b className="block text-[13.5px] text-[#13203A] truncate">{o.customer?.fullName || 'Customer'} · {o.orderId || `#${String(id).slice(-6).toUpperCase()}`}</b>
                    <span className="text-[12px] text-[#7B8AA3] truncate block">{o.serviceCategory || o.issues?.[0] || 'Service'} · {o.vehicle?.type || o.serviceType || ''}</span>
                  </div>
                  <b className="text-[14px] text-[#13203A] shrink-0 hidden sm:block">{inr(o.estimatedCost || o.finalCost || 0)}</b>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => reject(id)} disabled={busy === id} className="rounded-[9px] px-3 py-1.5 font-bold text-[12.5px] text-[#DC2626] bg-white border border-[#f3c9c9] disabled:opacity-50">Reject</button>
                    <button onClick={() => accept(id)} disabled={busy === id} className="rounded-[9px] px-3 py-1.5 font-bold text-[12.5px] text-white inline-flex items-center gap-1.5 disabled:opacity-50" style={{ background: GREEN }}>{busy === id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Accept</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Earnings chart + Job status donut */}
      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-4 mb-[18px]">
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Earnings overview</h3><Link href="/shop-partner/wallet" className="text-[12.5px] font-bold" style={{ color: DIST }}>Wallet →</Link></div>
          <div className="p-[18px]">
            <div className="flex items-baseline gap-2 mb-3"><b className="text-[22px] font-extrabold text-[#13203A]">{inr(weekTotal)}</b><span className="text-[12px] text-[#7B8AA3]">this week</span></div>
            <div className="h-[170px] flex items-end gap-2.5 pt-2">
              {days.map((d, i) => (
                <div key={d} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <div className="w-full flex gap-1 items-end justify-center h-full">
                    <i className="w-[13px] rounded-t-[5px]" style={{ height: `${(dayVals[i] / maxD) * 100}%`, minHeight: 4, background: NAVY }} />
                    <i className="w-[13px] rounded-t-[5px]" style={{ height: `${(dayVals[i] / maxD) * 60}%`, minHeight: 4, background: DIST }} />
                  </div>
                  <span className="text-[11.5px] text-[#7B8AA3] font-semibold">{d}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-[18px] mt-2"><span className="flex items-center gap-1.5 text-[12px] text-[#475569] font-semibold"><i className="h-[11px] w-[11px] rounded-sm" style={{ background: NAVY }} />Labour</span><span className="flex items-center gap-1.5 text-[12px] text-[#475569] font-semibold"><i className="h-[11px] w-[11px] rounded-sm" style={{ background: DIST }} />Parts</span></div>
          </div>
        </div>
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Job status</h3></div>
          <div className="p-[18px] flex items-center gap-5">
            <div className="relative h-[128px] w-[128px] rounded-full shrink-0" style={{ background: donut }}>
              <div className="absolute inset-[18px] bg-white rounded-full flex flex-col items-center justify-center">
                <b className="text-[24px] font-extrabold text-[#13203A] leading-none">{seg.completed + seg.active + seg.pending}</b><span className="text-[11px] text-[#7B8AA3]">total</span>
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
          {!recent.length ? <div className="text-center py-10 text-[#7B8AA3] text-sm">No jobs yet. New service jobs will appear here when assigned to your shop.</div> : (
            <table className="w-full min-w-[640px] border-collapse">
              <thead><tr>{['Job ID', 'Customer', 'Service', 'Status', ''].map((h) => <th key={h} className="text-left text-[11px] tracking-wide uppercase text-[#7B8AA3] font-extrabold px-3.5 pb-3">{h}</th>)}</tr></thead>
              <tbody>
                {recent.map((o) => {
                  const id = o._id || o.id; const s = STATUS_PILL[(o.status || '').toLowerCase()] || { bg: '#eef1f6', fg: '#475569', label: o.status }
                  return (
                    <tr key={id} className="hover:bg-[#F6F8FB]">
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6] text-[13px] font-bold" style={{ color: NAVY }}>{o.orderId || `#${String(id).slice(-6).toUpperCase()}`}</td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6]"><div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-[9px] flex items-center justify-center font-extrabold text-[12px] shrink-0" style={{ background: '#F2F6FC', color: NAVY }}>{(o.customer?.fullName || 'C')[0].toUpperCase()}</div><div className="min-w-0"><b className="block text-[13.5px] text-[#13203A] leading-tight truncate">{o.customer?.fullName || 'Customer'}</b><span className="text-[11.5px] text-[#7B8AA3]">{o.vehicle?.type || o.serviceType || ''}</span></div></div></td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6] text-[13px] text-[#475569]">{o.serviceCategory || 'Service'}</td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6]"><span className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.fg }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />{s.label}</span></td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6] text-right"><Link href={`/shop-partner/orders?id=${id}`} className="inline-flex h-8 w-8 rounded-lg border border-[#E7ECF3] items-center justify-center text-[#1B3B6F]"><Eye className="h-4 w-4" /></Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pending settlement + mechanics + reputation */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Pending settlement</h3><Link href="/shop-partner/settlements" className="text-[12.5px] font-bold" style={{ color: DIST }}>Details →</Link></div>
          <div className="p-[18px]"><div className="text-[32px] font-extrabold leading-none" style={{ color: DIST_2 }}>{inr(earnings?.pendingSettlement || 0)}</div><p className="text-[12.5px] text-[#7B8AA3] mt-2 capitalize">Next payout · {shop?.settlementCycle || 'weekly'} cycle</p></div>
        </div>
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Mechanics</h3><Link href="/shop-partner/mechanics" className="text-[12.5px] font-bold" style={{ color: DIST }}>Manage →</Link></div>
          <div className="p-[18px]"><div className="text-[32px] font-extrabold leading-none" style={{ color: NAVY }}>{shop?.mechanicsCount ?? 0}</div><p className="text-[12.5px] text-[#7B8AA3] mt-2">Mechanics on your team</p></div>
        </div>
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Reputation</h3></div>
          <div className="p-[18px] text-center"><div className="text-[36px] font-extrabold leading-none" style={{ color: STAR }}>{shop?.rating > 0 ? Number(shop.rating).toFixed(1) : '—'}</div>
            <div className="flex items-center justify-center gap-0.5 my-2">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= Math.round(shop?.rating || 0) ? 'fill-[#F5A623] text-[#F5A623]' : 'text-[#E7ECF3]'}`} />)}</div>
            <p className="text-[12.5px] text-[#7B8AA3]">{shop?.totalRatings || 0} customer ratings</p></div>
        </div>
      </div>
    </div>
  )
}
