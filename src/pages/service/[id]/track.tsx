'use client';

import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { ArrowLeft, Phone, Navigation, Clock, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';

const LiveTrackingMap = dynamic(
  () => import('@/components/service/LiveTrackingMap'),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" /> }
);

export default function ServiceTrackPage() {
  const router = useRouter();
  const { id } = router.query;
  const requestId = id as string;

  const {
    workerLocation,
    customerLocation,
    eta,
    distance,
    trackingStatus,
    routeCoords,
    workerInfo,
    lastUpdated,
  } = useLocationTracking(requestId || '', 'mechanic');

  if (!requestId) return null;

  const getStatusColor = () => {
    switch (trackingStatus) {
      case 'tracking': return 'bg-green-500';
      case 'arrived': return 'bg-blue-500';
      case 'paused': return 'bg-amber-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (trackingStatus) {
      case 'tracking': return 'On the way';
      case 'arrived': return 'Arrived!';
      case 'paused': return 'Location paused';
      default: return 'Connecting...';
    }
  };

  const getLastUpdatedText = () => {
    if (!lastUpdated) return '';
    const secs = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (secs < 10) return 'Just now';
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
  };

  return (
    <>
      <Head>
        <title>Track Mechanic - Road Care</title>
      </Head>

      <div className="h-screen w-full relative flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between px-4 pt-4 pb-8">
            <button
              onClick={() => router.back()}
              className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className={`h-3 w-3 rounded-full ${getStatusColor()} animate-pulse`} />
              </div>
              <span className="text-white font-bold text-sm drop-shadow-lg">
                Live Tracking
              </span>
            </div>
            <div className="w-10" />
          </div>
        </div>

        {/* ETA Chip */}
        {eta && trackingStatus === 'tracking' && (
          <div className="absolute top-20 left-4 right-4 z-20 flex justify-center">
            <div className="bg-white rounded-2xl shadow-lg px-5 py-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#FF6B35]" />
                <span className="font-bold text-gray-900">{eta}</span>
              </div>
              <div className="w-px h-5 bg-gray-200" />
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-gray-400" />
                <span className="font-semibold text-gray-500">{distance}</span>
              </div>
              {lastUpdated && (
                <>
                  <div className="w-px h-5 bg-gray-200" />
                  <span className="text-xs text-gray-400">{getLastUpdatedText()}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1">
          <LiveTrackingMap
            workerLocation={workerLocation}
            customerLocation={customerLocation}
            routeCoords={routeCoords}
            trackingStatus={trackingStatus}
            type="mechanic"
          />
        </div>

        {/* Loading overlay */}
        {trackingStatus === 'connecting' && !workerLocation && (
          <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-xs">
              <Loader2 className="h-10 w-10 text-[#FF6B35] animate-spin mx-auto mb-4" />
              <p className="font-bold text-gray-900 mb-1">Locating mechanic...</p>
              <p className="text-sm text-gray-500">
                Waiting for GPS signal. This may take a moment.
              </p>
            </div>
          </div>
        )}

        {/* Arrived banner */}
        {trackingStatus === 'arrived' && (
          <div className="absolute bottom-52 left-4 right-4 z-20">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-lg">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">{workerInfo.name} has arrived!</p>
                <p className="text-sm text-white/80">Please meet at your location</p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Card */}
        <div className="bg-white border-t border-gray-100 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-5 py-5 z-20">
          {/* Worker info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center">
              <span className="text-lg">🔧</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{workerInfo.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {workerInfo.rating > 0 && (
                  <>
                    <span className="text-amber-500 text-xs">★</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {workerInfo.rating.toFixed(1)}
                    </span>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
                <span className="text-sm text-gray-500">{getStatusText()}</span>
              </div>
            </div>
            <button className="h-11 w-11 rounded-full bg-green-50 border border-green-200 flex items-center justify-center hover:bg-green-100 transition">
              <Phone className="h-5 w-5 text-green-600" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition">
              <Phone className="h-4 w-4" />
              Call Mechanic
            </button>
            <button
              onClick={() => {
                if (workerLocation) {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${workerLocation.lat},${workerLocation.lng}&travelmode=driving`,
                    '_blank'
                  );
                }
              }}
              disabled={!workerLocation}
              className="flex-[0.7] bg-gray-50 border border-gray-200 text-[#1B3B6F] font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition disabled:opacity-50"
            >
              <Navigation className="h-4 w-4" />
              Navigate
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
