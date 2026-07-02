'use client'

// Full shop job detail: customer, status flow (accept → assign → on-the-way →
// in-progress → completed), assign a mechanic, LIVE mechanic tracking map, and
// an in-app Agora call to the customer. Mirrors the app's intended behaviour
// (the app's track/call screens were fakes — this is the real wiring).
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { shopAPI } from '@/services/api'
import { WebCall, type CallHandle } from '@/components/calls/WebCall'
import { ShopLiveMap } from '@/components/shop-partner/ShopLiveMap'
import { X, Phone, MapPin, Wrench, Clock, Check, UserPlus, Loader2, Navigation, PlayCircle, Flag, User as UserIcon } from 'lucide-react'

const DIST = '#D97706', NAVY = '#1B3B6F', GREEN = '#15936B'
const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const pick = (...v: any[]) => v.find((x) => x !== undefined && x !== null && x !== '')

const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: '#FEF3E2', fg: '#B45309', label: 'New request' },
  accepted: { bg: '#FEF3E2', fg: '#B45309', label: 'Accepted · assign a mechanic' },
  mechanic_assigned: { bg: '#EAF1FE', fg: '#2563EB', label: 'Mechanic assigned' },
  on_way: { bg: '#EAF1FE', fg: '#2563EB', label: 'On the way' },
  in_progress: { bg: '#EAF1FE', fg: '#2563EB', label: 'In progress' },
  completed: { bg: '#E7F6EF', fg: GREEN, label: 'Completed' },
  rejected: { bg: '#FEE8E8', fg: '#DC2626', label: 'Rejected' },
  cancelled: { bg: '#FEE8E8', fg: '#DC2626', label: 'Cancelled' },
}

interface Mechanic { _id: string; name: string; phone?: string; specializations?: string[]; availability?: string; rating?: number; completedJobs?: number }

export function ShopOrderDetailDrawer({ order, onClose, onReload }: { order: any; onClose: () => void; onReload: () => void }) {
  const [o, setO] = useState<any>(order)
  const [busy, setBusy] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [mechs, setMechs] = useState<Mechanic[]>([])
  const [loadingMechs, setLoadingMechs] = useState(false)
  const [call, setCall] = useState<any | null>(null)

  const id = o._id || o.id
  const status = String(o.status || '').toLowerCase()
  const srId = pick(o.serviceRequest?._id, o.serviceRequest, o.serviceRequestId)
  const coordsRaw = pick(o.location?.coordinates, o.address?.coordinates, o.serviceLocation?.coordinates, o.serviceRequest?.location?.coordinates)
  const customerLatLng = coordsRaw?.latitude ? { lat: coordsRaw.latitude, lng: coordsRaw.longitude } : null
  const mechanicId = pick(o.mechanicProfile?._id, o.mechanicProfile, o.assignedMechanic?.mechanicProfileId)
  const s = STATUS[status] || { bg: '#eef1f6', fg: '#475569', label: o.status }
  const showMap = ['mechanic_assigned', 'on_way', 'in_progress'].includes(status) && !!srId
  const canCall = !!srId && !['pending', 'rejected', 'cancelled'].includes(status)

  const refetch = useCallback(async () => {
    try { const r = await shopAPI.getOrderById(id); if (r.data?.success) setO(r.data.data) } catch { /* keep */ }
    onReload()
  }, [id, onReload])

  const act = async (fn: () => Promise<any>, okMsg: string) => {
    setBusy(true)
    try { const r = await fn(); if (r.data?.success) { toast.success(okMsg); await refetch() } else toast.error(r.data?.message || 'Failed') }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed') } finally { setBusy(false) }
  }

  const openAssign = async () => {
    setAssigning(true); setLoadingMechs(true)
    try { const r = await shopAPI.getAssignedMechanics(); setMechs(r.data?.data || []) }
    catch { toast.error('Could not load mechanics') } finally { setLoadingMechs(false) }
  }
  const assign = (m: Mechanic) => act(() => shopAPI.assignMechanic(id, { mechanicProfileId: m._id, name: m.name, phone: m.phone }), `Assigned to ${m.name}`).then(() => setAssigning(false))

  const startCall = async () => {
    if (!srId) return
    setBusy(true)
    try {
      const r = await shopAPI.callCustomer(srId, 'audio')
      const d = r.data?.data
      if (r.data?.success && d?.agora?.appId) {
        setCall({
          appId: d.agora.appId, channelName: d.agora.channelName, token: d.agora.token, uid: Number(d.agora.uid),
          peerName: d.receiver?.name || o.customer?.fullName || 'Customer',
          api: { getStatus: () => shopAPI.getCallStatus(d.callId), updateStatus: (st: string, dur: number) => shopAPI.updateCallStatus(d.callId, st, dur) } as CallHandle,
        })
      } else toast.error(r.data?.message || 'Could not start the call')
    } catch (e: any) { toast.error(e.response?.data?.message || 'Could not start the call') } finally { setBusy(false) }
  }

  // Reset local order when a different one is opened.
  useEffect(() => { setO(order); setAssigning(false); setCall(null) }, [order])

  const primary = () => {
    if (status === 'pending') return (
      <div className="flex gap-2">
        <button onClick={() => act(() => shopAPI.rejectOrder(id, 'Not available'), 'Rejected')} disabled={busy} className="flex-1 h-11 rounded-xl border border-[#f3c9c9] font-bold text-[#DC2626]">Reject</button>
        <button onClick={() => act(() => shopAPI.acceptOrder(id), 'Job accepted')} disabled={busy} className="flex-1 h-11 rounded-xl font-bold text-white inline-flex items-center justify-center gap-1.5" style={{ background: GREEN }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Accept</button>
      </div>
    )
    if (status === 'accepted') return (
      <button onClick={openAssign} disabled={busy} className="w-full h-11 rounded-xl font-bold text-white inline-flex items-center justify-center gap-2" style={{ background: DIST }}><UserPlus className="h-4 w-4" /> Assign a mechanic</button>
    )
    if (status === 'mechanic_assigned') return (
      <button onClick={() => act(() => shopAPI.updateOrderStatus(id, 'on_way'), 'Mechanic on the way')} disabled={busy} className="w-full h-11 rounded-xl font-bold text-white inline-flex items-center justify-center gap-2" style={{ background: NAVY }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />} Mark on the way</button>
    )
    if (status === 'on_way') return (
      <button onClick={() => act(() => shopAPI.updateOrderStatus(id, 'in_progress'), 'Job in progress')} disabled={busy} className="w-full h-11 rounded-xl font-bold text-white inline-flex items-center justify-center gap-2" style={{ background: NAVY }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />} Start job (in progress)</button>
    )
    if (status === 'in_progress') return (
      <button onClick={() => act(() => shopAPI.updateOrderStatus(id, 'completed'), 'Job completed')} disabled={busy} className="w-full h-11 rounded-xl font-bold text-white inline-flex items-center justify-center gap-2" style={{ background: GREEN }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />} Mark completed</button>
    )
    return null
  }

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0F2547]/40 backdrop-blur-sm" />
      <div className="relative h-full w-full max-w-md overflow-y-auto bg-white p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-[#13203A]">{o.orderId || 'Job'}</h3>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-extrabold" style={{ background: s.bg, color: s.fg }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />{s.label}</span>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-[#7B8AA3] hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>

        {/* live map */}
        {showMap && <div className="mb-4"><ShopLiveMap requestId={String(srId)} customer={customerLatLng} mechanicId={mechanicId ? String(mechanicId) : undefined} /></div>}

        {/* details */}
        <div className="space-y-3 text-sm">
          <Row icon={<UserIcon className="h-4 w-4" />} label="Customer" value={o.customer?.fullName} />
          <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={o.customer?.phone} />
          <Row icon={<Wrench className="h-4 w-4" />} label="Service" value={pick(o.serviceCategory, o.serviceType, o.serviceRequest?.serviceCategory)} />
          <Row icon={<MapPin className="h-4 w-4" />} label="Address" value={pick(o.location?.address, o.address?.address, typeof o.address === 'string' ? o.address : '')} />
          <Row icon={<Clock className="h-4 w-4" />} label="Slot" value={pick(o.preferredTimeSlot, o.preferredDate ? new Date(o.preferredDate).toLocaleDateString('en-IN') : '')} />
          {o.assignedMechanic?.name && <Row icon={<Wrench className="h-4 w-4" />} label="Mechanic" value={`${o.assignedMechanic.name}${o.assignedMechanic.phone ? ' · ' + o.assignedMechanic.phone : ''}`} />}
          <Row icon={<Wrench className="h-4 w-4" />} label="Estimate" value={inr(pick(o.finalCost, o.estimatedCost, 0))} />
        </div>

        {/* call */}
        {canCall && (
          <button onClick={startCall} disabled={busy} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-bold text-white disabled:opacity-60" style={{ background: GREEN }}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />} Call customer (in-app)
          </button>
        )}

        {/* primary status action */}
        <div className="mt-3">{primary()}</div>
      </div>

      {/* Assign mechanic sheet */}
      {assigning && (
        <div className="absolute inset-0 z-[85] flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setAssigning(false)}>
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#13203A]">Assign a mechanic</h3>
              <button onClick={() => setAssigning(false)} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            {loadingMechs ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" style={{ color: DIST }} /></div>
            ) : mechs.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#7B8AA3]">No mechanics assigned to your shop yet. Add them under <b>My Mechanics</b>, or ask admin to assign platform mechanics.</div>
            ) : (
              <div className="space-y-2.5">
                {mechs.map((m) => {
                  const free = (m.availability || 'available') !== 'busy'
                  return (
                    <button key={m._id} onClick={() => free && assign(m)} disabled={!free || busy}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${free ? 'border-[#E7ECF3] hover:border-[#D97706]' : 'border-[#EEF1F6] opacity-60'}`}>
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FEF3E2] font-extrabold" style={{ color: DIST }}>{(m.name || 'M')[0].toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-bold text-[#13203A]">{m.name}</div>
                        <div className="truncate text-[12px] text-[#7B8AA3]">{(m.specializations || []).slice(0, 2).join(', ') || 'Mechanic'}{m.completedJobs ? ` · ${m.completedJobs} jobs` : ''}</div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-extrabold ${free ? 'bg-[#E7F6EF] text-[#15936B]' : 'bg-slate-100 text-slate-400'}`}>{free ? 'Available' : 'Busy'}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* In-app call */}
      {call && (
        <WebCall appId={call.appId} channelName={call.channelName} token={call.token} uid={call.uid} peerName={call.peerName} outgoing api={call.api} onClose={() => setCall(null)} />
      )}
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#EEF1F6] py-2.5">
      <span className="flex shrink-0 items-center gap-2 text-[#475569] [&>svg]:text-[#1B3B6F]">{icon} {label}</span>
      <b className="max-w-[60%] text-right text-[#13203A]">{value}</b>
    </div>
  )
}
