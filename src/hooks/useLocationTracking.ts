import { useState, useEffect, useRef, useCallback } from 'react';
import socketService from '@/services/socketService';
import { mechanicLocationAPI, deliveryLocationAPI } from '@/services/api';
import Cookies from 'js-cookie';

interface LatLng {
  lat: number;
  lng: number;
}

interface RouteCoord {
  lat: number;
  lng: number;
}

export function useLocationTracking(
  requestId: string,
  type: 'mechanic' | 'delivery'
) {
  const [workerLocation, setWorkerLocation] = useState<LatLng | null>(null);
  const [customerLocation, setCustomerLocation] = useState<LatLng | null>(null);
  const [eta, setEta] = useState('');
  const [distance, setDistance] = useState('');
  const [trackingStatus, setTrackingStatus] = useState<
    'connecting' | 'tracking' | 'paused' | 'arrived'
  >('connecting');
  const [routeCoords, setRouteCoords] = useState<RouteCoord[]>([]);
  const [workerInfo, setWorkerInfo] = useState({
    name: type === 'mechanic' ? 'Mechanic' : 'Delivery Partner',
    photo: '',
    rating: 0,
    phone: '',
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);
  const mountedRef = useRef(true);

  // Haversine distance in km
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Fetch OSRM driving route
  const fetchRoute = useCallback(
    async (wLat: number, wLng: number, cLat: number, cLng: number) => {
      try {
        const resp = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${wLng},${wLat};${cLng},${cLat}?overview=full&geometries=geojson`
        );
        const data = await resp.json();
        if (data.code === 'Ok' && data.routes?.[0]) {
          const r = data.routes[0];
          const coords = r.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => ({ lat, lng })
          );
          setRouteCoords(coords);
          const durationMin = Math.ceil(r.duration / 60);
          const distKm = r.distance / 1000;
          setEta(`${durationMin} min`);
          setDistance(
            distKm >= 1
              ? `${distKm.toFixed(1)} km`
              : `${Math.round(r.distance)} m`
          );
        }
      } catch {
        // Fallback haversine
        const dist = haversine(wLat, wLng, cLat, cLng);
        setDistance(dist >= 1 ? `${dist.toFixed(1)} km` : `${Math.round(dist * 1000)} m`);
        const etaMin = Math.ceil((dist * 1.4) / 0.5);
        setEta(`${etaMin} min`);
      }
    },
    []
  );

  // Handle location update
  const handleLocationUpdate = useCallback(
    (lat: number, lng: number) => {
      if (!mountedRef.current) return;
      setWorkerLocation({ lat, lng });
      setTrackingStatus('tracking');
      setLastUpdated(new Date());

      // Check arrived
      if (customerLocation) {
        const dist = haversine(lat, lng, customerLocation.lat, customerLocation.lng);
        if (dist < 0.2) {
          setTrackingStatus('arrived');
          setEta('Arrived');
          setDistance('< 200 m');
          return;
        }
      }

      // Throttled route fetch (every 30s, immediate first time)
      if (routeFetchRef.current) clearTimeout(routeFetchRef.current);
      if (customerLocation) {
        const delay = routeCoords.length === 0 ? 0 : 30000;
        routeFetchRef.current = setTimeout(
          () => fetchRoute(lat, lng, customerLocation.lat, customerLocation.lng),
          delay
        );
      }
    },
    [customerLocation, routeCoords.length, fetchRoute]
  );

  // Get customer GPS — and share it live with the tracking room (throttled ~5s)
  // so the mechanic/shop see the customer move, not just a static booking pin.
  const lastEmitRef = useRef(0);
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setCustomerLocation({ lat, lng });
        const now = Date.now();
        if (requestId && now - lastEmitRef.current > 5000) {
          lastEmitRef.current = now;
          socketService.sendLocation(requestId, lat, lng, 'customer');
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [requestId]);

  // Socket + REST polling
  useEffect(() => {
    mountedRef.current = true;

    const token = Cookies.get('customer_token');
    if (token) socketService.connect(token);

    socketService.watchTracking(
      requestId,
      (data) => {
        // The worker marker is driven only by mechanic/delivery updates — never
        // by our own 'customer' broadcast echoed back in a multi-watcher room.
        if (mountedRef.current && data.latitude && data.longitude && data.type !== 'customer') {
          handleLocationUpdate(data.latitude, data.longitude);
        }
      },
      (data) => {
        if (!mountedRef.current) return;
        if (data.active === false) setTrackingStatus('arrived');
        else if (data.active === true) setTrackingStatus('tracking');
      }
    );

    const pollLocation = async () => {
      try {
        const result =
          type === 'mechanic'
            ? await mechanicLocationAPI.get(requestId)
            : await deliveryLocationAPI.get(requestId);

        const d = result.data?.data || result.data;
        if (d?.trackingActive && d.latitude && d.longitude && mountedRef.current) {
          handleLocationUpdate(d.latitude, d.longitude);
          const info = d.mechanic || d.deliveryBoy;
          if (info) {
            setWorkerInfo((prev) => ({
              name: info.name || prev.name,
              photo: info.photo || prev.photo,
              rating: info.rating || prev.rating,
              phone: info.phone || info.user?.phone || prev.phone,
            }));
          }
        }
      } catch {}
      pollCountRef.current++;
    };

    // Initial poll
    pollLocation();

    // Smart polling: 5s for first 60s, then 10s
    const smartPoll = () => {
      const interval = pollCountRef.current < 12 ? 5000 : 10000;
      pollRef.current = setTimeout(() => {
        if (mountedRef.current) {
          pollLocation();
          smartPoll();
        }
      }, interval);
    };
    smartPoll();

    return () => {
      mountedRef.current = false;
      socketService.unwatchTracking(requestId);
      if (pollRef.current) clearTimeout(pollRef.current);
      if (routeFetchRef.current) clearTimeout(routeFetchRef.current);
    };
  }, [requestId, type, handleLocationUpdate]);

  return {
    workerLocation,
    customerLocation,
    eta,
    distance,
    trackingStatus,
    routeCoords,
    workerInfo,
    lastUpdated,
  };
}
