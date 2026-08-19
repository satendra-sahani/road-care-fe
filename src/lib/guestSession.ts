// Persisted guest identity for SecureContact (vehicle-QR scans). Once a scanner
// verifies their phone via OTP (for a call or a message), we remember the
// short-lived guest token so a re-scan within its lifetime does NOT re-prompt
// for OTP. The token itself is signed server-side for 2h; we mirror that TTL.
const KEY = 'bm_guest_session'
const TTL_MS = 2 * 60 * 60 * 1000 // 2h — matches the server guest-token expiry

export interface GuestSession {
  token: string
  name: string
  phone: string
  exp: number
}

export function saveGuestSession(s: { token: string; name: string; phone: string }): void {
  try {
    if (typeof window === 'undefined') return
    const payload: GuestSession = { ...s, exp: Date.now() + TTL_MS }
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch { /* storage unavailable — non-fatal */ }
}

export function getGuestSession(): GuestSession | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as GuestSession
    if (!s?.token || !s?.exp || Date.now() > s.exp) {
      localStorage.removeItem(KEY)
      return null
    }
    return s
  } catch {
    return null
  }
}

export function clearGuestSession(): void {
  try { if (typeof window !== 'undefined') localStorage.removeItem(KEY) } catch { /* noop */ }
}
