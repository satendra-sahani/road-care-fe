'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LatLng {
  lat: number;
  lng: number;
}

interface LiveTrackingMapProps {
  workerLocation: LatLng | null;
  customerLocation: LatLng | null;
  routeCoords: LatLng[];
  trackingStatus: 'connecting' | 'tracking' | 'paused' | 'arrived';
  type: 'mechanic' | 'delivery';
}

// Custom marker icons
const createIcon = (color: string, emoji: string) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:40px;height:40px;border-radius:50%;
      background:${color};border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 3px 10px rgba(0,0,0,0.3);
      font-size:18px;
    ">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const mechanicIcon = createIcon('#FF6B35', '🔧');
const deliveryIcon = createIcon('#3B82F6', '🚚');
const customerIcon = createIcon('#1B3B6F', '📍');

// Auto-fit bounds when both markers are present
function FitBounds({
  workerLocation,
  customerLocation,
}: {
  workerLocation: LatLng | null;
  customerLocation: LatLng | null;
}) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (workerLocation && customerLocation && !hasFitted.current) {
      const bounds = L.latLngBounds(
        [workerLocation.lat, workerLocation.lng],
        [customerLocation.lat, customerLocation.lng]
      );
      map.fitBounds(bounds, { padding: [60, 60] });
      hasFitted.current = true;
    }
  }, [workerLocation, customerLocation, map]);

  return null;
}

export default function LiveTrackingMap({
  workerLocation,
  customerLocation,
  routeCoords,
  trackingStatus,
  type,
}: LiveTrackingMapProps) {
  const center = customerLocation || workerLocation || { lat: 26.85, lng: 80.95 };
  const workerIcon = type === 'mechanic' ? mechanicIcon : deliveryIcon;
  const routeColor = type === 'mechanic' ? '#FF6B35' : '#3B82F6';

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds
        workerLocation={workerLocation}
        customerLocation={customerLocation}
      />

      {/* Driving route polyline */}
      {routeCoords.length > 1 && (
        <Polyline
          positions={routeCoords.map((c) => [c.lat, c.lng] as [number, number])}
          color={routeColor}
          weight={5}
          opacity={0.8}
        />
      )}

      {/* Fallback dotted line */}
      {routeCoords.length === 0 && workerLocation && customerLocation && (
        <Polyline
          positions={[
            [workerLocation.lat, workerLocation.lng],
            [customerLocation.lat, customerLocation.lng],
          ]}
          color="#9CA3AF"
          weight={2}
          dashArray="8 8"
        />
      )}

      {/* Worker marker */}
      {workerLocation && (
        <Marker
          position={[workerLocation.lat, workerLocation.lng]}
          icon={workerIcon}
        />
      )}

      {/* Customer marker */}
      {customerLocation && (
        <Marker
          position={[customerLocation.lat, customerLocation.lng]}
          icon={customerIcon}
        />
      )}
    </MapContainer>
  );
}
