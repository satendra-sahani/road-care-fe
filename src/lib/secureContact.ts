// ════════════════════════════════════════════════════════════
// SecureContact — vehicle QR store + deterministic QR matrix.
// Ported from the customer-app prototype (bmc-extra.jsx: MY_VEHICLES,
// QRMatrix, bmc_myveh). Client-side localStorage persistence.
// ════════════════════════════════════════════════════════════
import { useSyncExternalStore, useCallback } from 'react'

export interface Vehicle {
  id: string
  em: string
  name: string
  plate: string
  code: string
}

export const MY_VEHICLES: Vehicle[] = [
  { id: 'v1', em: '🏍️', name: 'Honda Activa 6G', plate: 'DL 3S AB 1234', code: 'AB1234' },
  { id: 'v2', em: '🚗', name: 'Maruti Swift VXi', plate: 'DL 8C XY 4821', code: 'XY4821' },
]

export const VEHICLE_EMOJIS = ['🏍️', '🛵', '🚗', '🚙', '🚚', '🛺']

const KEY = 'bmc_myveh'

const read = (): Vehicle[] => {
  if (typeof window === 'undefined') return MY_VEHICLES
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    return Array.isArray(s) && s.length ? s : MY_VEHICLES
  } catch { return MY_VEHICLES }
}

let data: Vehicle[] = read()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((f) => f())
const persist = () => {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* ignore */ }
  }
}

export const vehicleStore = {
  subscribe(f: () => void) { listeners.add(f); return () => { listeners.delete(f) } },
  get() { return data },
  save(list: Vehicle[]) { data = list; persist(); emit() },
  add(v: Omit<Vehicle, 'id'>) { data = [...data, { ...v, id: 'v' + Date.now() }]; persist(); emit(); return data.length - 1 },
  update(index: number, patch: Partial<Vehicle>) { data = data.map((x, i) => (i === index ? { ...x, ...patch } : x)); persist(); emit() },
  remove(index: number) { data = data.filter((_, i) => i !== index); persist(); emit() },
  byCode(code: string) { return data.find((v) => v.code.toUpperCase() === code.toUpperCase()) },
}

export function useVehicles(): Vehicle[] {
  const subscribe = useCallback((f: () => void) => vehicleStore.subscribe(f), [])
  const get = useCallback(() => vehicleStore.get(), [])
  return useSyncExternalStore(subscribe, get, () => MY_VEHICLES)
}

// Mask a plate's last 2 chars, e.g. "DL 8C XY 4821" -> "DL 8C XY ••21"
export const maskPlate = (plate: string): string => {
  const compact = plate.replace(/\s+/g, ' ').trim()
  return compact.replace(/(\w{2})(\s*)$/, '••$1')
}

export const plateToCode = (plate: string): string =>
  (plate.replace(/[^A-Za-z0-9]/g, '').slice(-6) || 'NEW000').toUpperCase()

// Deterministic pseudo-QR matrix (faithful to the prototype). 25×25 with
// three finder rings, quiet zones, and seeded data fill. Returns 0/1 grid.
export function qrMatrix(id: string): number[][] {
  const n = 25
  let s = ([...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0) || 7
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
  const inBox = (r: number, c: number, R: number, C: number) => r >= R && r < R + 7 && c >= C && c < C + 7
  const finder = (r: number, c: number) => inBox(r, c, 0, 0) || inBox(r, c, 0, n - 7) || inBox(r, c, n - 7, 0)
  const quiet = (r: number, c: number) => (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8)
  const ringOn = (r: number, c: number, R: number, C: number) => {
    const rr = r - R, cc = c - C
    return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4)
  }
  const g: number[][] = []
  for (let r = 0; r < n; r++) {
    const row: number[] = []
    for (let c = 0; c < n; c++) {
      if (r < 7 && c < 7) row.push(ringOn(r, c, 0, 0) ? 1 : 0)
      else if (r < 7 && c >= n - 7) row.push(ringOn(r, c, 0, n - 7) ? 1 : 0)
      else if (r >= n - 7 && c < 7) row.push(ringOn(r, c, n - 7, 0) ? 1 : 0)
      else if (finder(r, c) || quiet(r, c)) row.push(0)
      else row.push(rnd() > 0.52 ? 1 : 0)
    }
    g.push(row)
  }
  return g
}
