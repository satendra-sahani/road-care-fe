'use client'

import { useEffect, useState } from 'react'
import { shopAPI } from '@/services/api'
import { toast } from 'sonner'
import { Loader2, Clock } from 'lucide-react'

const DIST = '#D97706', DIST_50 = '#FEF3E2', DIST_2 = '#B45309', NAVY = '#1B3B6F', GREEN = '#15936B', BLUE = '#2563EB'
const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const CYCLES = ['daily', 'weekly', 'biweekly', 'monthly']

function Kpi({ bg, fg, path, val, label }: { bg: string; fg: string; path: string; val: string; label: string }) {
  return (
    <div className="bg-white border border-[#E7ECF3] rounded-2xl p-[18px] shadow-sm">
      <div className="h-[42px] w-[42px] rounded-xl flex items-center justify-center mb-3" style={{ background: bg, color: fg }}>
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
      </div>
      <div className="text-[24px] font-extrabold tracking-tight text-[#13203A] leading-none">{val}</div>
      <div className="text-[13px] text-[#7B8AA3] mt-1.5">{label}</div>
    </div>
  )
}

export function ShopSettlements() {
  const [data, setData] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [cycle, setCycle] = useState('weekly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [d, s] = await Promise.all([shopAPI.getDashboard(), shopAPI.getSettlements().catch(() => null)])
        if (d.data?.success) { setData(d.data.data); setCycle(d.data.data?.shop?.settlementCycle || 'weekly') }
        const list = s?.data?.data?.settlements || s?.data?.data || []
        setItems(Array.isArray(list) ? list : [])
      } catch { /* */ } finally { setLoading(false) }
    })()
  }, [])

  const changeCycle = async (c: string) => {
    setCycle(c)
    try { await shopAPI.updateProfile({ settlementCycle: c }); toast.success(`Settlement cycle set to ${c}`) }
    catch { toast.error('Could not update cycle') }
  }

  if (loading) return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>
  const earnings = data?.earnings || {}

  return (
    <div className="p-4 md:p-6 space-y-[18px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi bg="#E7F6EF" fg={GREEN} path="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" val={inr((data?.shop?.totalEarnings) || 0)} label="Settled (total)" />
        <Kpi bg={DIST_50} fg={DIST_2} path="M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" val={inr(earnings.pendingSettlement || 0)} label="Pending settlement" />
        <Kpi bg="#F2F6FC" fg={NAVY} path="M3 9l1-5h16l1 5M3 9h18v11H3z" val={String(items.length)} label="Settlements" />
        <Kpi bg="#EAF1FE" fg={BLUE} path="M2 5h20v14H2zM2 10h20" val="Bank" label="Payout method" />
      </div>

      {/* Cycle chips */}
      <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
        <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Settlement cycle</h3></div>
        <div className="p-[18px]">
          <p className="text-[13px] text-[#475569] mb-3">Choose how often payouts are credited to your bank account.</p>
          <div className="flex flex-wrap gap-2.5">
            {CYCLES.map((c) => (
              <button key={c} onClick={() => changeCycle(c)} className={`capitalize text-[13px] font-bold rounded-full px-3.5 py-2 border transition ${cycle === c ? 'text-white border-transparent' : 'bg-white text-[#475569] border-[#E7ECF3]'}`} style={cycle === c ? { background: DIST } : {}}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
        <div className="px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">Settlement history</h3></div>
        <div className="px-1 py-2 overflow-x-auto">
          {!items.length ? (
            <div className="text-center py-12 text-[#7B8AA3] text-sm flex flex-col items-center gap-2"><Clock className="h-8 w-8 text-[#E7ECF3]" /> No settlements yet. Completed jobs settle to your bank each cycle.</div>
          ) : (
            <table className="w-full min-w-[620px] border-collapse">
              <thead><tr>{['Reference', 'Amount', 'Status', 'Date'].map((h) => <th key={h} className="text-left text-[11px] tracking-wide uppercase text-[#7B8AA3] font-extrabold px-3.5 pb-3">{h}</th>)}</tr></thead>
              <tbody>
                {items.map((s: any, i: number) => {
                  const paid = ['paid', 'completed'].includes((s.status || '').toLowerCase())
                  return (
                    <tr key={s._id || i} className="hover:bg-[#F6F8FB]">
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6] text-[13px] font-bold" style={{ color: NAVY }}>{s.reference || s.settlementId || `#${String(s._id || i).slice(-6).toUpperCase()}`}</td>
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
