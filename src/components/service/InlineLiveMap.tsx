'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useLocationTracking } from '@/hooks/useLocationTracking'
import { Maximize2 } from 'lucide-react'

const LiveTrackingMap = dynamic(
  () => import('@/components/service/LiveTrackingMap'),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" /> }
)

/**
 * Inline live tracking map for the booking detail page — mirrors claude-design's
 * `.livemap` with the floating `.lm-bar`. Real GPS via useLocationTracking (socket
 * + OSRM route). Only mount this for an active job so the socket isn't opened
 * for completed/cancelled requests.
 */
export default function InlineLiveMap({ requestId, mechFirst }: { requestId: string; mechFirst: string }) {
  const {
    workerLocation,
    customerLocation,
    eta,
    trackingStatus,
    routeCoords,
    workerInfo,
  } = useLocationTracking(requestId, 'mechanic')

  const who = workerInfo.name || mechFirst
  const bar =
    trackingStatus === 'arrived' ? `${who} is at your location`
      : eta ? `${who} is on the way · ETA ~${eta}`
        : trackingStatus === 'connecting' ? 'Locating your mechanic…'
          : `${who} is on the way`

  return (
    <div className="relative h-[280px] rounded-2xl overflow-hidden border border-[#E7ECF3] shadow-sm">
      {/* lm-bar */}
      <div className="absolute top-3 left-3 right-3 z-[500] bg-white rounded-xl shadow-md px-3.5 py-2.5 flex items-center gap-2 text-[12.5px] font-bold text-[#13203A]">
        <span className="h-2 w-2 rounded-full bg-[#15936B] animate-pulse shrink-0" />
        <span className="truncate">{bar}</span>
        <Link href={`/service/${requestId}/track`} className="ml-auto shrink-0 text-[#1B3B6F] hover:text-[#152d55] inline-flex items-center gap-1" aria-label="Open full screen">
          <Maximize2 className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="absolute inset-0">
        <LiveTrackingMap
          workerLocation={workerLocation}
          customerLocation={customerLocation}
          routeCoords={routeCoords}
          trackingStatus={trackingStatus}
          type="mechanic"
        />
      </div>
    </div>
  )
}
