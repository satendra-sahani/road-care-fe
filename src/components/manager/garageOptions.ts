// Options shared by the field executive app (/manager/garage) and the admin
// Garage Partners page. Keys match the backend enums (models/Garage.js).
import {
  IcTwoWheeler, IcBikeScooter, IcDirectionsCar, IcLocalShipping, IcAlbum, IcBatteryChargingFull, IcBuildCircle,
  IcBolt, IcCarRepair, IcBuild, IcAcUnit, IcSettings, IcTrackChanges, IcOpacity, IcMoreHoriz,
} from '@/components/icons/BmIcons'

export const VEHICLES = [
  { key: 'bike', label: 'Bike', Icon: IcTwoWheeler },
  { key: 'scooter', label: 'Scooter', Icon: IcBikeScooter },
  { key: 'car', label: 'Car', Icon: IcDirectionsCar },
  { key: 'truck', label: 'Truck', Icon: IcLocalShipping },
] as const

export const SERVICES = [
  { key: 'puncture', label: 'Puncture & Tyre Repair', Icon: IcAlbum },
  { key: 'battery', label: 'Battery / Jump-start', Icon: IcBatteryChargingFull },
  { key: 'engine', label: 'Engine Repair', Icon: IcBuildCircle },
  { key: 'electrical', label: 'Electrical Work', Icon: IcBolt },
  { key: 'towing', label: 'Towing / Breakdown', Icon: IcCarRepair },
  { key: 'general_service', label: 'General Service', Icon: IcBuild },
  { key: 'ac', label: 'AC Service', Icon: IcAcUnit },
  { key: 'clutch_gear', label: 'Clutch & Gear', Icon: IcSettings },
  { key: 'brakes', label: 'Brakes', Icon: IcTrackChanges },
  { key: 'oil_change', label: 'Oil Change', Icon: IcOpacity },
  { key: 'other', label: 'Other Work', Icon: IcMoreHoriz },
] as const

export const DAYS = [
  { key: 'none', label: 'Koi nahi (roz khulta hai)' },
  { key: 'sunday', label: 'Sunday' }, { key: 'monday', label: 'Monday' }, { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' }, { key: 'thursday', label: 'Thursday' }, { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
] as const

export const DISTANCES = [5, 10, 15, 20, 30]
export const SIZES = [{ key: 'small', label: 'Chhota (1–2 bay)' }, { key: 'medium', label: 'Medium (3–5 bay)' }, { key: 'large', label: 'Bada (6+ bay)' }] as const
export const MECH_VEHICLES = ['Bike', 'Scooter', 'Car', 'Koi nahi']

export const STATUS = {
  pending: { label: 'Pending Verification', short: 'Pending', fg: '#B45309', bg: '#FEF3C7', pin: '#F59E0B' },
  active: { label: 'Active', short: 'Active', fg: '#15803D', bg: '#DCFCE7', pin: '#16A34A' },
  inactive: { label: 'Inactive', short: 'Inactive', fg: '#B91C1C', bg: '#FEE2E2', pin: '#DC2626' },
} as const
export type GarageStatus = keyof typeof STATUS

export const serviceLabel = (k: string) => SERVICES.find((s) => s.key === k)?.label || k
export const vehicleLabel = (k: string) => VEHICLES.find((v) => v.key === k)?.label || k

/** "09:00" → "09:00 AM" */
export const time12 = (t?: string) => {
  const m = /^(\d{2}):(\d{2})$/.exec(t || '')
  if (!m) return t || ''
  const h = Number(m[1])
  return `${String(h % 12 || 12).padStart(2, '0')}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`
}
export const waLink = (phone?: string) => `https://wa.me/91${String(phone || '').replace(/\D/g, '').slice(-10)}`
export const mapsLink = (loc?: { lat?: number; lng?: number } | null, address?: string) =>
  loc?.lat != null && loc?.lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`
