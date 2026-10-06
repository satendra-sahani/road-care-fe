// The field executive app has no login. Everything that identifies the phone
// lives in localStorage: a random staff key (scopes "my garages" on the server),
// the executive's name + mobile, and the half-filled form (so a dropped network
// or an accidental back never loses a visit).
const K_KEY = 'bm_staff_key'
const K_ME = 'bm_staff_me'
const K_DRAFT = 'bm_garage_draft'

const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string | null) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* storage blocked */ } }

let memKey = '' // fallback when storage is blocked (private mode): lasts for the visit

export function getStaffKey(): string {
  let k = read(K_KEY) || memKey
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(k)) {
    const b = new Uint8Array(24)
    crypto.getRandomValues(b)
    k = Array.from(b, (x) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[x % 62]).join('')
    memKey = k
    write(K_KEY, k)
  }
  return k
}

export type StaffMe = { name: string; phone: string; target: number }
export function getStaff(): StaffMe | null {
  try {
    const m = JSON.parse(read(K_ME) || 'null')
    return m && m.name && /^\d{10}$/.test(m.phone) ? { name: String(m.name), phone: String(m.phone), target: Number(m.target) > 0 ? Number(m.target) : 5 } : null
  } catch { return null }
}
export const saveStaff = (m: StaffMe) => write(K_ME, JSON.stringify(m))

export const loadDraft = <T,>(): T | null => { try { return JSON.parse(read(K_DRAFT) || 'null') } catch { return null } }
export const saveDraft = (d: unknown) => write(K_DRAFT, JSON.stringify(d))
export const clearDraft = () => write(K_DRAFT, null)

/** Shrink a phone photo (often 5–10 MB) to ≤1600 px JPEG before upload — field networks are slow. */
export async function compressImage(file: File, max = 1600, quality = 0.8): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file
  try {
    const url = URL.createObjectURL(file)
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
    URL.revokeObjectURL(url)
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    if (scale === 1 && file.size < 600 * 1024) return file
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', quality))
    return blob && blob.size < file.size ? blob : file
  } catch { return file }
}
