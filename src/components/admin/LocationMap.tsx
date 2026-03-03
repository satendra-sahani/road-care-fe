'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapMarker {
  id: string
  lat: number
  lng: number
  name: string
  role: string
  color: string
  address: string
  phone: string
  isActive: boolean
}

interface LocationMapProps {
  markers: MapMarker[]
  selectedId: string | null
  onMarkerClick: (id: string) => void
}

// Create a colored SVG marker icon
function createMarkerIcon(color: string, isSelected: boolean) {
  const size = isSelected ? 36 : 28
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z"
        fill="${color}" stroke="${isSelected ? '#1B3B6F' : 'white'}" stroke-width="${isSelected ? 2 : 1.5}"/>
      <circle cx="12" cy="8" r="3" fill="white"/>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

export default function LocationMap({ markers, selectedId, onMarkerClick }: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // India center
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    markersLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return

    markersLayerRef.current.clearLayers()

    if (markers.length === 0) return

    markers.forEach(m => {
      const isSelected = m.id === selectedId
      const icon = createMarkerIcon(m.color, isSelected)

      const marker = L.marker([m.lat, m.lng], { icon })
        .bindPopup(`
          <div style="min-width:160px;font-family:system-ui,sans-serif;">
            <p style="font-weight:600;font-size:13px;margin:0 0 4px;">${m.name}</p>
            <p style="font-size:11px;color:#6B7280;margin:0 0 2px;text-transform:capitalize;">${m.role}</p>
            ${m.address ? `<p style="font-size:11px;color:#9CA3AF;margin:0 0 2px;">${m.address}</p>` : ''}
            ${m.phone ? `<p style="font-size:11px;color:#9CA3AF;margin:0;">${m.phone}</p>` : ''}
          </div>
        `, { closeButton: false, className: 'custom-popup' })
        .on('click', () => onMarkerClick(m.id))

      markersLayerRef.current!.addLayer(marker)

      // Open popup for selected marker
      if (isSelected) {
        marker.openPopup()
      }
    })

    // Fit bounds to all markers
    if (!selectedId) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number]))
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      }
    }
  }, [markers, selectedId, onMarkerClick])

  // Center on selected marker
  useEffect(() => {
    if (!mapRef.current || !selectedId) return

    const selected = markers.find(m => m.id === selectedId)
    if (selected) {
      mapRef.current.setView([selected.lat, selected.lng], 14, { animate: true })
    }
  }, [selectedId, markers])

  return (
    <>
      <style>{`
        .custom-marker { background: none !important; border: none !important; }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 4px;
        }
        .custom-popup .leaflet-popup-tip {
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
      `}</style>
      <div ref={mapContainerRef} className="w-full h-full" />
    </>
  )
}
