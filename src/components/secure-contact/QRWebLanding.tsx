'use client'

// Public web landing shown to non-app users who scan a vehicle QR.
// Resolves the code against the backend (masked info only — the owner's
// identity/phone never reaches the browser). Standalone, no auth.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { resolveCode, type ScanResult } from '@/lib/secureContact'
import { GuestCallFlow } from '@/components/calls/GuestCallFlow'
import { Shield, Phone, Send, Check, Apple, Play, Wrench, Loader2, SearchX } from 'lucide-react'

const DEMO: ScanResult = { code: '', em: '🚗', name: 'Maruti Swift VXi', maskedPlate: 'DL 8C XY ••21' }

export function QRWebLanding({ code }: { code: string }) {
  const router = useRouter()
  const [veh, setVeh] = useState<ScanResult | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading')
  const [done, setDone] = useState<'call' | 'msg' | null>(null)
  const [calling, setCalling] = useState(false)

  useEffect(() => {
    if (!code) return // router.query hydrates on the next render
    let cancelled = false
    setState('loading')
    resolveCode(code).then((r) => {
      if (cancelled) return
      if (r) { setVeh(r); setState('ok') }
      else if (code.toUpperCase() === 'DEMO') { setVeh(DEMO); setState('ok') }
      else setState('notfound')
    })
    return () => { cancelled = true }
  }, [code])

  const masked = veh?.maskedPlate || ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F6F8] to-white">
      {/* header */}
      <div className="px-6 pb-8 pt-7 text-center text-white" style={{ background: 'linear-gradient(160deg,#142C52,#24508C)' }}>
        <div className="inline-flex items-center gap-2 text-[13px] font-extrabold">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#FF6B35]"><Wrench className="h-3.5 w-3.5" /></span>
          Bharat Mechanics
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-extrabold tracking-wide text-[#FFD68A]">
          <Shield className="h-3.5 w-3.5" fill="currentColor" /> SECURECONTACT
        </div>
        <h1 className="mt-3.5 font-display text-2xl font-extrabold leading-tight">You scanned a parked<br />vehicle&apos;s QR</h1>
        <p className="mt-2 text-[13.5px] font-semibold leading-relaxed text-white/80">Reach the owner without ever seeing their number.</p>
      </div>

      <div className="-mt-4 px-[18px] pb-8">
        {state === 'loading' ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-6 text-sm font-bold text-slate-500 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" /> Looking up this vehicle…
          </div>
        ) : state === 'notfound' ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-lg">
            <SearchX className="mx-auto h-10 w-10 text-slate-300" />
            <div className="mt-3 font-display text-lg font-extrabold text-[#0F2545]">No vehicle found</div>
            <div className="mt-1 text-[12.5px] font-bold text-slate-600">This QR code isn&apos;t registered (or was deactivated by the owner).</div>
          </div>
        ) : (
          <>
            {/* vehicle card */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg">
              <div className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-2xl bg-[#EAF0FA] text-[28px]">{veh!.em}</div>
              <div className="flex-1">
                <div className="text-[15.5px] font-extrabold text-[#0F2545]">{veh!.name}</div>
                <div className="text-[13px] font-extrabold tracking-widest text-[#1B3B6F]">{masked}</div>
              </div>
              <span className="rounded-lg bg-[#E6F7F0] px-2.5 py-1.5 text-center text-[10.5px] font-extrabold leading-tight text-[#1BA672]">VERIFIED</span>
            </div>

            {done === 'msg' ? (
              <div className="mt-3.5 rounded-2xl bg-[#E6F7F0] p-5 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#1BA672]"><Check className="h-7 w-7 text-white" strokeWidth={3} /></div>
                <div className="mt-3 font-display text-lg font-extrabold text-[#0F2545]">Message sent!</div>
                <div className="mt-1 text-[12.5px] font-bold text-slate-700">The owner has been alerted. Numbers stay private.</div>
              </div>
            ) : (
              <div className="mt-3.5 grid gap-3">
                {/* Real in-browser voice call (guest verifies name+phone+OTP once);
                    message continues to the contact page. Owner stays anonymous. */}
                <button onClick={() => setCalling(true)}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#1BA672] text-[15.5px] font-bold text-white shadow-[0_8px_20px_-6px_rgba(27,166,114,.5)]">
                  <Phone className="h-5 w-5" fill="currentColor" /> Call owner — free
                </button>
                <button onClick={() => router.push(`/contact-owner?code=${encodeURIComponent(veh!.code)}`)}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-slate-200 bg-white text-[15.5px] font-bold text-[#1B3B6F]">
                  <Send className="h-[18px] w-[18px]" /> Send a message
                </button>
              </div>
            )}
          </>
        )}

        {calling && veh && (
          <GuestCallFlow code={veh.code} peerName={`Owner of ${veh.maskedPlate}`} onClose={() => setCalling(false)} />
        )}

        {/* app upsell */}
        <div className="mt-5 rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(150deg,#1B3B6F,#2D5BA0)' }}>
          <div className="flex items-center gap-3">
            <div className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-2xl bg-[#FF6B35] text-2xl"><Wrench className="h-6 w-6" /></div>
            <div className="flex-1">
              <div className="text-[14.5px] font-extrabold">Get the full experience</div>
              <div className="text-[11.5px] font-semibold opacity-80">Book mechanics, order parts &amp; track service</div>
            </div>
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <div className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-black text-xs font-bold"><Apple className="h-4 w-4" /> App Store</div>
            <div className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-black text-xs font-bold"><Play className="h-4 w-4" /> Google Play</div>
          </div>
        </div>
        <button onClick={() => router.push('/')} className="mt-3 h-11 w-full text-[13px] font-bold text-slate-500">Continue on web instead</button>
      </div>
    </div>
  )
}
