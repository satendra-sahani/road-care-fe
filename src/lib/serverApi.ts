// Server-side (getStaticProps) read of the public API. Never throws: returns
// { status, data } or null on a network error / timeout, so pages still render.
const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api').replace(/\/$/, '')

export async function serverGet<T = any>(path: string, timeoutMs = 5000): Promise<{ status: number; data: T | null } | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}${path}`, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
    let body: any = null
    try { body = await res.json() } catch { /* non-JSON */ }
    return { status: res.status, data: body?.success === false ? null : (body?.data ?? null) }
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}
