// Loads Razorpay's checkout.js on demand (once) instead of on every page.
// The script pulls ~60 files (~800 KB) and third-party cookies, so it is only
// fetched on pages that can actually take a payment.
let pending: Promise<boolean> | null = null

export function loadRazorpay(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if ((window as any).Razorpay) return Promise.resolve(true)
  if (pending) return pending
  pending = new Promise<boolean>((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => resolve(!!(window as any).Razorpay)
    s.onerror = () => { pending = null; resolve(false) }
    document.body.appendChild(s)
  })
  return pending
}
