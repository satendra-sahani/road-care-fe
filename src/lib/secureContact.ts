// ════════════════════════════════════════════════════════════
// SecureContact — vehicle QR store. Vehicles sync with the backend
// (/user/vehicle-qr, server-assigned unique codes) when logged in;
// the localStorage cache below is the offline/SSR fallback.
// ════════════════════════════════════════════════════════════
import { useSyncExternalStore, useCallback } from 'react'
import Cookies from 'js-cookie'
import { userVehicleQrAPI } from '@/services/api'

export interface Vehicle {
  id: string
  em: string
  name: string
  plate: string
  code: string
  serverId?: string // backend VehicleQr _id once synced
}

// QR payload — a URL so any phone camera opens the public landing page;
// the in-app scanners extract the trailing code.
export const qrPayload = (code: string) => `https://bharatmechanics.com/v/${code.toUpperCase()}`

export const VEHICLE_EMOJIS = ['🏍️', '🛵', '🚗', '🚙', '🚚', '🛺']

const KEY = 'bmc_myveh'
const EMPTY: Vehicle[] = []
// Old builds seeded these demo codes into localStorage — strip them so real
// users never see vehicles that aren't theirs.
const DEMO_CODES = ['AB1234', 'XY4821']

const read = (): Vehicle[] => {
  if (typeof window === 'undefined') return EMPTY
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    const list: Vehicle[] = Array.isArray(s) ? s : []
    return list.filter((v) => v?.serverId || !DEMO_CODES.includes(String(v?.code || '').toUpperCase()))
  } catch { return EMPTY }
}

let data: Vehicle[] = read()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((f) => f())
const persist = () => {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* ignore */ }
  }
}

// ── server sync ─────────────────────────────────────────────
// Backend is the source of truth when logged in (server-assigned codes that
// scanners can actually resolve). Only called with a customer_token cookie —
// an unauthenticated call would 401-redirect to /login.
let serverLoaded = false
let serverFetching = false
const syncFromServer = async () => {
  if (serverLoaded || serverFetching || typeof window === 'undefined') return
  if (!Cookies.get('customer_token')) return
  serverFetching = true
  try {
    const res = await userVehicleQrAPI.getMine()
    const list = res.data?.data
    if (res.data?.success && Array.isArray(list)) {
      serverLoaded = true
      if (list.length > 0) {
        data = list.map((v: any) => ({
          id: v._id, serverId: v._id, em: v.em || '🚗', name: v.name, plate: v.plate, code: v.code,
        }))
      } else {
        // Server says no vehicles — drop any stale cache (e.g. a previous
        // account's plates on a shared browser).
        data = []
      }
      persist(); emit()
    }
  } catch { /* offline — cache stands; retried on next mount */ }
  finally { serverFetching = false }
}

export const vehicleStore = {
  subscribe(f: () => void) {
    syncFromServer() // no-op once loaded / logged out
    listeners.add(f)
    return () => { listeners.delete(f) }
  },
  get() { return data },
  save(list: Vehicle[]) { data = list; persist(); emit() },
  add(v: Omit<Vehicle, 'id'>) {
    const localId = 'v' + Date.now()
    data = [...data, { ...v, id: localId }]
    persist(); emit()
    const index = data.length - 1
    // Write-through: register on the server; adopt its unique code + id.
    // Patch by the optimistic local id — the list may have been re-synced or
    // reordered by the time the response lands.
    if (typeof window !== 'undefined' && Cookies.get('customer_token')) {
      userVehicleQrAPI.register({ name: v.name, em: v.em, plate: v.plate })
        .then((res) => {
          const srv = res.data?.data
          if (res.data?.success && srv) {
            data = data.map((x) => (x.id === localId ? { ...x, serverId: srv._id, code: srv.code } : x))
            persist(); emit()
          }
        })
        .catch(() => { /* offline — stays local-only */ })
    }
    return index
  },
  update(index: number, patch: Partial<Vehicle>) {
    // The QR code is server-owned once registered — a recomputed local code
    // would render a QR the server can't resolve (or a stranger's code).
    const safe = { ...patch }
    if (data[index]?.serverId) { delete safe.code; delete safe.serverId }
    data = data.map((x, i) => (i === index ? { ...x, ...safe } : x))
    persist(); emit()
    const v = data[index]
    if (v?.serverId && typeof window !== 'undefined' && Cookies.get('customer_token')) {
      userVehicleQrAPI.update(v.serverId, { name: v.name, em: v.em, plate: v.plate }).catch(() => {})
    }
  },
  remove(index: number) {
    const v = data[index]
    data = data.filter((_, i) => i !== index)
    persist(); emit()
    if (v?.serverId && typeof window !== 'undefined' && Cookies.get('customer_token')) {
      userVehicleQrAPI.remove(v.serverId).catch(() => {})
    }
  },
  byCode(code: string) { return data.find((v) => v.code.toUpperCase() === code.toUpperCase()) },
}

// Resolve a scanned/entered code — public backend endpoint first (works for
// ANY registered vehicle, no login needed), local cache as fallback.
export interface ScanResult { code: string; name: string; em: string; maskedPlate: string }
export async function resolveCode(code: string): Promise<ScanResult | null> {
  const clean = code.trim().toUpperCase()
  if (!clean) return null
  try {
    const res = await userVehicleQrAPI.resolvePublic(clean)
    if (res.data?.success && res.data.data) return res.data.data as ScanResult
    return null
  } catch (e: any) {
    // Server answered "not found" (or deactivated) — that's authoritative.
    // Only fall back to the local cache when the server was unreachable.
    if (e?.response?.status) return null
  }
  const local = vehicleStore.byCode(clean)
  return local ? { code: local.code, name: local.name, em: local.em, maskedPlate: maskPlate(local.plate) } : null
}

export function useVehicles(): Vehicle[] {
  const subscribe = useCallback((f: () => void) => vehicleStore.subscribe(f), [])
  const get = useCallback(() => vehicleStore.get(), [])
  return useSyncExternalStore(subscribe, get, () => EMPTY)
}

// Mask the chars before the last 2, e.g. "DL 8C XY 4821" -> "DL 8C XY ••21"
export const maskPlate = (plate: string): string => {
  const compact = plate.replace(/\s+/g, ' ').trim()
  const masked = compact.replace(/\w\w(\s*\w\w)$/, '••$1')
  return masked === compact && compact.length > 2 ? '••' + compact.slice(-2) : masked
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
