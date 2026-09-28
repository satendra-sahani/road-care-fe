'use client'

import { useCallback, useEffect, useState } from 'react'
import { IndianRupee, CalendarDays, BadgePercent, CheckCircle2 } from 'lucide-react'
import { franchiseAPI } from '@/services/api'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { Panel, Stat, Spinner, Empty, inr, dateIN } from './ui'

// What the franchise earns: its share of the value of every paid job done by its
// shops / mechanics (or booked by it). Credited to the owner's wallet automatically.
export function FranchiseEarnings() {
  const [rows, setRows] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await franchiseAPI.earnings({ page, limit: 20 })
      setRows(r.data?.data || []); setSummary(r.data?.summary || null); setTotal(r.data?.pagination?.total || 0)
    } finally { setLoading(false) }
  }, [page])
  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total earned" value={inr(summary?.total)} icon={IndianRupee} tone="#047857" />
        <Stat label="This month" value={inr(summary?.thisMonth)} icon={CalendarDays} />
        <Stat label="Paid jobs" value={summary?.jobs ?? 0} hint={`Total job value ${inr(summary?.jobValue)}`} icon={CheckCircle2} />
        <Stat label="Your share" value={`${summary?.pct ?? 0}%`} hint="of every paid job's value" icon={BadgePercent} tone="#1D4ED8" />
      </div>
      <div className="rounded-xl border border-[#CCFBF1] bg-[#F0FDFA] px-4 py-3 text-[12.5px] text-[#115E59]">
        You earn {summary?.pct ?? 0}% of the bill of every job your mechanics and shops complete (and jobs you book), once the customer has paid. It is added to your wallet automatically — usually within a few minutes.
      </div>
      <Panel title="Earnings by job">
        {loading ? <Spinner /> : rows.length === 0 ? <Empty>No earnings yet. They appear here as soon as a job is paid.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F8FAFC] text-left text-[11.5px] font-bold uppercase tracking-wide text-[#7B8AA3]">
                <tr><th className="px-4 py-3">Job</th><th className="px-4 py-3">Done by</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3 text-right">Job value</th><th className="px-4 py-3 text-right">You earned</th><th className="px-4 py-3">Date</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-t border-[#EEF1F6]">
                    <td className="px-4 py-3"><b className="font-mono text-[12.5px]">{r.requestId}</b><div className="text-[11.5px] text-[#7B8AA3]">{r.serviceCategory}</div></td>
                    <td className="px-4 py-3">{r.shopPartner?.shopName || r.mechanic?.user?.fullName || '—'}</td>
                    <td className="px-4 py-3">{r.customer?.fullName || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{inr(r.franchiseEarning?.jobValue)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-[#047857]">+{inr(r.franchiseEarning?.amount)}</td>
                    <td className="px-4 py-3 text-[#52667C]">{dateIN(r.franchiseEarning?.creditedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination page={page} pageSize={20} total={total} onPageChange={setPage} label="jobs" />
      </Panel>
    </div>
  )
}
