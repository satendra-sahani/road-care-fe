'use client'

import { useEffect, useState, useCallback } from 'react'
import { shopAPI } from '@/services/api'
import { toast } from 'sonner'
import {
  Loader2, Check, X, Eye, Phone, MapPin, Clock, Wrench,
} from 'lucide-react'

const DIST = '#D97706', NAVY = '#1B3B6F', GREEN = '#15936B'

const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: '#FEF3E2', fg: '#B45309', label: 'New request' },
  accepted: { bg: '#FEF3E2', fg: '#B45309', label: 'Accepted' },
  mechanic_assigned: { bg: '#EAF1FE', fg: '#2563EB', label: 'Mechanic assigned' },
  on_way: { bg: '#EAF1FE', fg: '#2563EB', label: 'On the way' },
  in_progress: { bg: '#EAF1FE', fg: '#2563EB', label: 'In progress' },
  completed: { bg: '#E7F6EF', fg: GREEN, label: 'Completed' },
  rejected: { bg: '#FEE8E8', fg: '#DC2626', label: 'Rejected' },
  cancelled: { bg: '#FEE8E8', fg: '#DC2626', label: 'Cancelled' },
}

const FILTERS = [
  { id: 'all', label: 'All jobs' },
  { id: 'new', label: 'New', match: ['pending'] },
  { id: 'active', label: 'Active', match: ['accepted', 'mechanic_assigned', 'on_way', 'in_progress'] },
  { id: 'completed', label: 'Completed', match: ['completed'] },
  { id: 'rejected', label: 'Rejected', match: ['rejected', 'cancelled'] },
]

const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export function ShopOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [rejectFor, setRejectFor] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState<any>(null)

  const load = useCallback(async () => {
    try {
      const r = await shopAPI.getOrders()
      if (r.data?.success) setOrders(r.data.data || [])
    } catch { toast.error('Could not load jobs') } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const accept = async (id: string) => {
    setBusy(id)
    try { const r = await shopAPI.acceptOrder(id); if (r.data?.success) { toast.success('Job accepted'); load() } else toast.error(r.data?.message || 'Failed') }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed to accept') } finally { setBusy(null) }
  }
  const doReject = async () => {
    if (!reason.trim()) { toast.error('Enter a reason'); return }
    const id = rejectFor._id || rejectFor.id; setBusy(id)
    try { const r = await shopAPI.rejectOrder(id, reason.trim()); if (r.data?.success) { toast.success('Job rejected'); setRejectFor(null); setReason(''); load() } else toast.error(r.data?.message || 'Failed') }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed') } finally { setBusy(null) }
  }

  if (loading) return <div className="flex items-center justify-center h-72"><Loader2 className="h-8 w-8 animate-spin" style={{ color: DIST }} /></div>

  const f = FILTERS.find((x) => x.id === filter)
  const shown = filter === 'all' ? orders : orders.filter((o) => f?.match?.includes((o.status || '').toLowerCase()))

  return (
    <div className="p-4 md:p-6">
      {/* Filter pills */}
      <div className="flex gap-2.5 flex-wrap mb-4">
        {FILTERS.map((x) => {
          const n = x.id === 'all' ? orders.length : orders.filter((o) => x.match?.includes((o.status || '').toLowerCase())).length
          return (
            <button key={x.id} onClick={() => setFilter(x.id)}
              className={`px-[15px] py-2.5 rounded-full text-[13px] font-bold border transition ${filter === x.id ? 'text-white border-transparent' : 'bg-white text-[#475569] border-[#E7ECF3]'}`}
              style={filter === x.id ? { background: DIST } : {}}>{x.label}{n ? ` · ${n}` : ''}</button>
          )
        })}
      </div>

      {/* Jobs table */}
      <div className="bg-white border border-[#E7ECF3] rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-[18px] py-4 border-b border-[#EEF1F6]"><h3 className="text-[15.5px] font-extrabold text-[#13203A]">{shown.length} service job{shown.length === 1 ? '' : 's'}</h3></div>
        <div className="px-1 py-2 overflow-x-auto">
          {!shown.length ? (
            <div className="text-center py-12 text-[#7B8AA3] text-sm">No jobs in this view.</div>
          ) : (
            <table className="w-full min-w-[720px] border-collapse">
              <thead><tr>{['Job ID', 'Customer', 'Service', 'Slot', 'Status', ''].map((h) => <th key={h} className="text-left text-[11px] tracking-wide uppercase text-[#7B8AA3] font-extrabold px-3.5 pb-3">{h}</th>)}</tr></thead>
              <tbody>
                {shown.map((o) => {
                  const id = o._id || o.id
                  const s = STATUS[(o.status || '').toLowerCase()] || { bg: '#eef1f6', fg: '#475569', label: o.status }
                  const isNew = (o.status || '').toLowerCase() === 'pending'
                  const cust = o.customer?.fullName || 'Customer'
                  return (
                    <tr key={id} className="hover:bg-[#F6F8FB] cursor-pointer" onClick={() => setDetail(o)}>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6] text-[13px] font-bold" style={{ color: NAVY }}>{o.orderId || `#${String(id).slice(-6).toUpperCase()}`}</td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6]">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-[9px] flex items-center justify-center font-extrabold text-[12px] shrink-0" style={{ background: '#F2F6FC', color: NAVY }}>{cust[0].toUpperCase()}</div>
                          <div className="min-w-0"><b className="block text-[13.5px] text-[#13203A] leading-tight truncate">{cust}</b><span className="text-[11.5px] text-[#7B8AA3]">{o.vehicle?.type || o.serviceType || ''}</span></div>
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6]"><b className="block text-[13px] text-[#13203A]">{o.serviceCategory || (o.issues?.[0]) || 'Service'}</b><span className="text-[11.5px] text-[#7B8AA3]">{o.location?.city || o.address?.city || ''}</span></td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6] text-[12.5px] text-[#475569]">{o.preferredTimeSlot || (o.preferredDate ? new Date(o.preferredDate).toLocaleDateString('en-IN') : '—')}</td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6]"><span className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: s.bg, color: s.fg }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />{s.label}</span></td>
                      <td className="px-3.5 py-3.5 border-t border-[#EEF1F6]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1.5 justify-end">
                          {isNew ? (
                            <>
                              <button onClick={() => setRejectFor(o)} className="rounded-[9px] px-3 py-1.5 font-bold text-[12.5px] text-[#DC2626] bg-white border border-[#f3c9c9]">Reject</button>
                              <button onClick={() => accept(id)} disabled={busy === id} className="rounded-[9px] px-3 py-1.5 font-bold text-[12.5px] text-white inline-flex items-center gap-1.5 disabled:opacity-50" style={{ background: GREEN }}>{busy === id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Accept</button>
                            </>
                          ) : (
                            <button onClick={() => setDetail(o)} className="h-[34px] w-[34px] rounded-[9px] border border-[#E7ECF3] flex items-center justify-center text-[#475569] hover:border-[#1B3B6F] hover:text-[#1B3B6F]"><Eye className="h-4 w-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {rejectFor && (
        <div className="fixed inset-0 z-[80] bg-[#0F2547]/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setRejectFor(null) }}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6">
            <h3 className="text-lg font-extrabold text-[#13203A] mb-1">Reject job</h3>
            <p className="text-[13px] text-[#7B8AA3] mb-3">Tell us why you can&rsquo;t take {rejectFor.orderId || 'this job'}.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason…" className="w-full rounded-lg border border-[#E7ECF3] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/20" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setRejectFor(null); setReason('') }} className="flex-1 h-11 rounded-xl bg-gray-100 text-[#475569] font-bold">Cancel</button>
              <button onClick={doReject} className="flex-1 h-11 rounded-xl bg-[#DC2626] text-white font-bold">Reject job</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-[80] flex justify-end" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-[#0F2547]/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-lg font-extrabold text-[#13203A]">{detail.orderId || 'Job'}</h3>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold px-2.5 py-1 rounded-full mt-1" style={{ background: (STATUS[(detail.status || '').toLowerCase()] || {}).bg, color: (STATUS[(detail.status || '').toLowerCase()] || {}).fg }}>{(STATUS[(detail.status || '').toLowerCase()] || {}).label || detail.status}</span>
              </div>
              <button onClick={() => setDetail(null)} className="h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-[#7B8AA3]"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <Row icon={<Wrench className="h-4 w-4" />} label="Customer" value={detail.customer?.fullName} />
              <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={detail.customer?.phone} />
              <Row icon={<Wrench className="h-4 w-4" />} label="Service" value={detail.serviceCategory || detail.serviceType} />
              <Row icon={<MapPin className="h-4 w-4" />} label="Address" value={detail.location?.address || detail.address?.address || (typeof detail.address === 'string' ? detail.address : '')} />
              <Row icon={<Clock className="h-4 w-4" />} label="Slot" value={detail.preferredTimeSlot || (detail.preferredDate ? new Date(detail.preferredDate).toLocaleDateString('en-IN') : '')} />
              {detail.issues?.length ? <Row icon={<Wrench className="h-4 w-4" />} label="Issues" value={detail.issues.join(', ')} /> : null}
              <Row icon={<Wrench className="h-4 w-4" />} label="Estimate" value={inr(detail.finalCost || detail.estimatedCost || 0)} />
            </div>
            {detail.customer?.phone && (
              <a href={`tel:${detail.customer.phone}`} className="mt-5 w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-white font-bold" style={{ background: GREEN }}><Phone className="h-4 w-4" /> Call customer</a>
            )}
            {(detail.status || '').toLowerCase() === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setRejectFor(detail); setDetail(null) }} className="flex-1 h-11 rounded-xl border border-[#f3c9c9] text-[#DC2626] font-bold">Reject</button>
                <button onClick={() => { accept(detail._id || detail.id); setDetail(null) }} className="flex-1 h-11 rounded-xl text-white font-bold inline-flex items-center justify-center gap-1.5" style={{ background: GREEN }}><Check className="h-4 w-4" />Accept</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-[#EEF1F6]">
      <span className="flex items-center gap-2 text-[#475569] shrink-0 [&>svg]:text-[#1B3B6F]">{icon} {label}</span>
      <b className="text-[#13203A] text-right max-w-[60%]">{value}</b>
    </div>
  )
}
