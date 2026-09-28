'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store, Wrench, ClipboardList, IndianRupee, Wallet, Plus } from 'lucide-react'
import { franchiseAPI } from '@/services/api'
import { useFranchise } from './FranchiseContext'
import { Panel, Stat, StatusPill, Spinner, Empty, inr, dateIN } from './ui'

const PIPE: [string, string[]][] = [
  ['Pending', ['pending']], ['Assigned', ['assigned', 'accepted', 'mechanic_assigned', 'on_way']],
  ['In progress', ['diagnosis', 'approved', 'in_progress']], ['Completed', ['completed', 'payment_pending']], ['Paid', ['paid']],
]

export function FranchiseDashboard() {
  const { me } = useFranchise()
  const [d, setD] = useState<any>(null)
  useEffect(() => { franchiseAPI.dashboard().then((r) => setD(r.data?.data)).catch(() => setD({})) }, [])
  if (!d) return <Spinner />
  const by = d.requests?.byStatus || {}
  const count = (ks: string[]) => ks.reduce((a, k) => a + (by[k] || 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Shops" value={d.shops ?? 0} hint={`${d.activeShops ?? 0} active`} icon={Store} />
        <Stat label="Mechanics" value={d.mechanics ?? 0} icon={Wrench} />
        <Stat label="Service requests" value={d.requests?.total ?? 0} icon={ClipboardList} />
        <Stat label="Total earnings" value={inr(d.earnings?.total)} hint={`${d.earnings?.jobs || 0} paid jobs · ${d.earnings?.pct ?? me?.franchise?.earningPct}% of each`} icon={IndianRupee} tone="#047857" />
        {me?.isOwner
          ? <Stat label="Wallet" value={inr(d.walletBalance)} hint="100% withdrawable" icon={Wallet} tone="#1D4ED8" />
          : <Stat label="Your role" value="Team" hint="Operations access" icon={Wallet} tone="#1D4ED8" />}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PIPE.map(([label, ks]) => (
          <Link key={label} href={`/franchise/requests`} className="rounded-2xl border border-[#E7ECF3] bg-white p-3.5 hover:border-[#0D9488]">
            <div className="text-[22px] font-extrabold tabular-nums text-[#13203A]">{count(ks)}</div>
            <div className="text-[12px] font-semibold text-[#7B8AA3]">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Recent requests" className="lg:col-span-2" action={<Link href="/franchise/requests" className="text-[12.5px] font-bold text-[#0D9488]">View all</Link>}>
          {(d.recentRequests || []).length === 0 ? <Empty>No requests yet.</Empty> : (
            <ul className="divide-y divide-[#EEF1F6]">
              {d.recentRequests.map((r: any) => (
                <li key={r._id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                  <div className="min-w-0">
                    <b className="font-mono text-[12.5px]">{r.requestId}</b> <span className="text-[#52667C]">· {r.serviceCategory}</span>
                    <div className="truncate text-[11.5px] text-[#7B8AA3]">{r.customer?.fullName} · {dateIN(r.createdAt)}</div>
                  </div>
                  <StatusPill status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Quick actions">
          <div className="grid gap-2 p-4">
            {[['Book a job for a customer', '/franchise/requests'], ['Add a mechanic', '/franchise/mechanics'], ['Add a shop', '/franchise/shops']].map(([t, h]) => (
              <Link key={h} href={h} className="flex items-center gap-2 rounded-xl border border-[#E7ECF3] px-3.5 py-3 text-[13.5px] font-bold text-[#13203A] hover:border-[#0D9488]"><Plus className="h-4 w-4 text-[#0D9488]" /> {t}</Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
