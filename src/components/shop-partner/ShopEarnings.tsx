'use client'

import { useEffect, useState } from 'react'
import { shopAPI } from '@/services/api'
import Link from 'next/link'
import { Loader2, Clock } from 'lucide-react'

const DIST = '#D97706', DIST_50 = '#FEF3E2', DIST_2 = '#B45309', NAVY = '#1B3B6F', GREEN = '#15936B', STAR = '#F5A623'
const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

function Kpi({ bg, fg, path, val, label }: { bg: string; fg: string; path: string; val: string; label: string }) {
  return (
    <div className="bg-white border border-[#E7ECF3] rounded-2xl p-[18px] shadow-sm">
      <div className="h-[42px] w-[42px] rounded-xl flex items-center justify-center mb-3" style={{ background: bg, color: fg }}>
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
      </div>
      <div className="text-[27px] font-extrabold tracking-tight text-[#13203A] leading-none">{val}</div>
      <div className="text-[13px] text-[#7B8AA3] mt-1.5">{label}</div>
    </div>
  )
}

export function ShopEarnings() {
  const [data, setData] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [settlements, setSettlements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [d, w, s] = await Promise.all([
          shopAPI.getDashboard(),
          shopAPI.getWallet().catch(() => null),
          shopAPI.getSettlements().catch(() => null),
        ])
        if (d.data?.success) setData(d.data.data)
        if (w?.data?.success) setWallet(w.data.data)
        const list = s?.data?.data?.settlements || s?.data?.data || []
        setSettlements(Array.isArray(list) ? list : [])
      } catch { /* */ } finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>

  const shop = data?.shop || {}
  const earnings = data?.earnings || {}
  const commission = shop.commissionRate ?? 25
  const cycle = shop.settlementCycle || 'weekly'
  const balance = wallet?.balance || 0

  return (
    <div className="p-4 md:p-6 space-y-[18px]">
      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-4">
        {/* Wallet balance (navy) */}
        <div className="rounded-2xl text-white p-[22px]" style={{ background: `linear-gradient(135deg, #0F2547, ${NAVY})` }}>
          <div className="text-[13px] text-[#aec6dd] font-semibold">Wallet balance</div>
          <div className="text-[42px] font-extrabold my-1 leading-none">{inr(balance)}</div>
          <div className="text-[12.5px] text-[#aec6dd] mb-[18px] capitalize">Available for withdrawal · {cycle} settlement</div>
          <div className="flex gap-2.5">
            <Link href="/shop-partner/wallet" className="inline-flex items-center gap-2 text-white font-bold text-[14px] rounded-[11px] px-[18px] py-[11px]" style={{ background: DIST }}>Add / withdraw</Link>
          </div>
        </div>
        {/* Commission structure */}
        <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
          <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Commission structure</h3></div>
          <div className="p-[18px]">
            <div className="flex items-center justify-between py-2.5"><span className="text-[13.5px] text-[#475569]">Platform commission</span><b>{commission}%</b></div>
            <div className="flex items-center justify-between py-2.5 border-t border-[#EEF1F6]"><span className="text-[13.5px] text-[#475569]">Your share</span><b style={{ color: GREEN }}>{100 - commission}%</b></div>
            <div className="flex items-center justify-between py-2.5 border-t border-[#EEF1F6]"><span className="text-[13.5px] text-[#475569]">Settlement cycle</span><b className="capitalize">{cycle}</b></div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi bg="#E7F6EF" fg={GREEN} path="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5" val={inr(shop.totalEarnings || earnings.thisMonth?.totalEarning || 0)} label="Total earnings" />
        <Kpi bg="#F2F6FC" fg={NAVY} path="M16 8l-8 8M8 8h8v8" val={inr(shop.totalCommissionPaid || 0)} label="Commission paid" />
        <Kpi bg={DIST_50} fg={DIST_2} path="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" val={inr(earnings.thisMonth?.totalEarning || 0)} label="This month" />
        <Kpi bg="#FFF7E6" fg={STAR} path="M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" val={inr(earnings.pendingSettlement || 0)} label="Pending" />
      </div>

      {/* Settlements / transactions */}
      <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Settlements</h3></div>
        <div className="px-1 py-2 overflow-x-auto">
          {!settlements.length ? (
            <div className="text-center py-12 text-[#7B8AA3] text-sm flex flex-col items-center gap-2"><Clock className="h-8 w-8 text-[#E7ECF3]" /> No settlements yet. Completed jobs settle to your bank each cycle.</div>
          ) : (
            <table className="w-full min-w-[620px] border-collapse">
              <thead><tr>{['Reference', 'Amount', 'Status', 'Date'].map((h) => <th key={h} className="text-left text-[11px] tracking-wide uppercase text-[#7B8AA3] font-extrabold px-3.5 pb-3">{h}</th>)}</tr></thead>
              <tbody>
                {settlements.map((s: any, i: number) => {
                  const paid = (s.status || '').toLowerCase() === 'paid' || (s.status || '').toLowerCase() === 'completed'
                  return (
                    <tr key={s._id || i} className="hover:bg-[#F6F8FB]">
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6] text-[13px] font-bold" style={{ color: NAVY }}>{s.reference || s.settlementId || s.orderId || `#${String(s._id || i).slice(-6).toUpperCase()}`}</td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6] font-extrabold text-[#13203A]">{inr(s.amount || s.netAmount || 0)}</td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6]"><span className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold px-2.5 py-1 rounded-full" style={{ background: paid ? '#E7F6EF' : '#FEF3E2', color: paid ? GREEN : DIST_2 }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: paid ? GREEN : DIST_2 }} />{paid ? 'Paid' : (s.status || 'Pending')}</span></td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6] text-[12.5px] text-[#475569]">{s.settledAt || s.createdAt ? new Date(s.settledAt || s.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
