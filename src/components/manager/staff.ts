// Things the field-staff app keeps on the phone (localStorage), per logged-in
// executive: the half-filled garage form (so a dropped network or an accidental
// back never loses a visit) and the daily target shown on the home screen.
const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string | null) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* storage blocked */ } }

let scope = '' // the logged-in executive's id (set by StaffAuthGuard)
export const setStaffScope = (id: string) => { scope = id }
const draftKey = () => `bm_garage_draft:${scope}`
const targetKey = () => `bm_staff_target:${scope}`

export const loadDraft = <T,>(): T | null => { try { return JSON.parse(read(draftKey()) || 'null') } catch { return null } }
export const saveDraft = (d: unknown) => write(draftKey(), JSON.stringify(d))
export const clearDraft = () => write(draftKey(), null)

export const getTarget = () => { const n = Number(read(targetKey())); return n > 0 && n <= 50 ? n : 5 }
export const saveTarget = (n: number) => write(targetKey(), String(Math.min(50, Math.max(1, Math.round(n) || 5))))

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
