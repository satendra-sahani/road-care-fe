// Shared look-and-feel for admin service requests: the requests table and the
// Map View (ServiceManagement.tsx, ServiceRequestsMap.tsx).
import { IcTwoWheeler, IcBikeScooter, IcDirectionsCar, IcLocalShipping } from '@/components/icons/BmIcons'

export const PRIORITY_PILL: Record<string, { label: string; fg: string; bg: string }> = {
  low:      { label: 'Low',      fg: '#15803D', bg: '#DCFCE7' },
  medium:   { label: 'Medium',   fg: '#7E22CE', bg: '#F3E8FF' },
  normal:   { label: 'Normal',   fg: '#B45309', bg: '#FEF3C7' },
  high:     { label: 'High',     fg: '#DC2626', bg: '#FEE2E2' },
  urgent:   { label: 'Urgent',   fg: '#FFFFFF', bg: '#DC2626' },
  critical: { label: 'Critical', fg: '#FFFFFF', bg: '#991B1B' },
}

/** pill colours + the pin colour used on maps */
export const STATUS_PILL: Record<string, { fg: string; bg: string; pin: string; label: string }> = {
  pending:           { fg: '#B45309', bg: '#FEF3C7', pin: '#F97316', label: 'Pending' },
  assigned:          { fg: '#1D4ED8', bg: '#DBEAFE', pin: '#2563EB', label: 'Assigned' },
  accepted:          { fg: '#4338CA', bg: '#E0E7FF', pin: '#4F46E5', label: 'Accepted' },
  mechanic_assigned: { fg: '#4338CA', bg: '#E0E7FF', pin: '#4F46E5', label: 'Mechanic Assigned' },
  on_way:            { fg: '#0E7490', bg: '#CFFAFE', pin: '#0891B2', label: 'On Way' },
  diagnosis:         { fg: '#7E22CE', bg: '#F3E8FF', pin: '#9333EA', label: 'Diagnosis' },
  approved:          { fg: '#047857', bg: '#D1FAE5', pin: '#059669', label: 'Approved' },
  in_progress:       { fg: '#1D4ED8', bg: '#DBEAFE', pin: '#2563EB', label: 'In Progress' },
  'in-progress':     { fg: '#1D4ED8', bg: '#DBEAFE', pin: '#2563EB', label: 'In Progress' },
  completed:         { fg: '#15803D', bg: '#DCFCE7', pin: '#16A34A', label: 'Completed' },
  payment_pending:   { fg: '#C2410C', bg: '#FFEDD5', pin: '#EA580C', label: 'Payment Pending' },
  paid:              { fg: '#15803D', bg: '#DCFCE7', pin: '#16A34A', label: 'Paid' },
  rejected_quote:    { fg: '#BE123C', bg: '#FFE4E6', pin: '#E11D48', label: 'Quote Rejected' },
  payment_refused:   { fg: '#B91C1C', bg: '#FEE2E2', pin: '#DC2626', label: 'Payment Refused' },
  cancelled:         { fg: '#DC2626', bg: '#FEE2E2', pin: '#DC2626', label: 'Cancelled' },
}

export const vehicleIconFor = (type?: string) => {
  const t = String(type || '').toLowerCase()
  if (/truck|tempo|pickup|bus|lcv|hcv/.test(t)) return IcLocalShipping
  if (/scoot/.test(t)) return IcBikeScooter
  if (/bike|motor|two|2/.test(t)) return IcTwoWheeler
  return IcDirectionsCar
}

type Pt = { latitude?: number; longitude?: number } | null | undefined
export const kmBetween = (a: Pt, b: Pt) => {
  if (a?.latitude == null || a?.longitude == null || b?.latitude == null || b?.longitude == null) return null
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude), dLng = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export const initialsOf = (name?: string) => String(name || '?').trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase()

export const vehicleName = (v?: { type?: string; brand?: string; model?: string }) =>
  [v?.brand, v?.model].filter(Boolean).join(' ') || (v?.type ? v.type.charAt(0).toUpperCase() + v.type.slice(1) : 'Vehicle')
