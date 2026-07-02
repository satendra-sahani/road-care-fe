'use client'

// Live tracking for the shop: watches the assigned mechanic's GPS over the
// socket (room tracking:<serviceRequestId>) and plots it against the customer's
// location. Reuses the shared leaflet LiveTrackingMap renderer. The customer
// now also broadcasts its own GPS (type 'customer'), so the customer pin moves
// live too — falling back to the static order location until the first update.
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Cookies from 'js-cookie'
import socketService from '@/services/socketService'
import { shopAPI } from '@/services/api'
import { Loader2 } from 'lucide-react'

const LiveTrackingMap = dynamic(() => import('@/components/service/LiveTrackingMap'), {
  ssr: false,
  loading: () => <div className="grid h-full w-full place-items-center bg-slate-100"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>,
})

interface LatLng { lat: number; lng: number }

export function ShopLiveMap({ requestId, customer, mechanicId }: { requestId: string; customer: LatLng | null; mechanicId?: string }) {
  const [worker, setWorker] = useState<LatLng | null>(null)
  const [liveCustomer, setLiveCustomer] = useState<LatLng | null>(null)
  const [status, setStatus] = useState<'connecting' | 'tracking' | 'paused' | 'arrived'>('connecting')
  const [updated, setUpdated] = useState<Date | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    if (!requestId) return
    socketService.connect(Cookies.get('token')) // shop socket
    socketService.watchTracking(
      requestId,
      (d: any) => {
        if (!mounted.current || !d.latitude || !d.longitude) return
        if (d.type === 'customer') { setLiveCustomer({ lat: d.latitude, lng: d.longitude }); return }
        setWorker({ lat: d.latitude, lng: d.longitude }); setStatus('tracking'); setUpdated(new Date())
      },
      (d: any) => { if (mounted.current) setStatus(d.active ? 'tracking' : 'paused') },
    )
    // Seed from last-known GPS so a pin shows before the first socket update.
    if (mechanicId) {
      shopAPI.mechanicLocation(mechanicId).then((r) => {
        const c = r.data?.data?.currentLocation
        if (mounted.current && c?.latitude && c?.longitude && !worker) setWorker({ lat: c.latitude, lng: c.longitude })
      }).catch(() => {})
    }
    return () => { mounted.current = false; socketService.unwatchTracking(requestId) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, mechanicId])

  return (
    <div className="overflow-hidden rounded-xl border border-[#E7ECF3]">
      <div className="h-[240px] w-full">
        <LiveTrackingMap workerLocation={worker} customerLocation={liveCustomer || customer} routeCoords={[]} trackingStatus={status} type="mechanic" />
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-[11.5px] font-semibold text-[#7B8AA3]">
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${status === 'tracking' ? 'bg-[#15936B]' : 'bg-slate-300'}`} />
          {status === 'tracking' ? 'Mechanic live' : status === 'connecting' ? 'Locating mechanic…' : 'Waiting for mechanic to start'}
        </span>
        {updated && <span>Updated {updated.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span>}
      </div>
    </div>
  )
}
