'use client'

// SecureContact web scanner — live camera QR scanning where the browser
// supports it (BarcodeDetector: Chrome/Edge on Android & desktop), with a
// manual code-entry fallback that works everywhere. Resolved codes open the
// contact-owner page.
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { UserLayout } from '@/components/layout/UserLayout'
import { resolveCode } from '@/lib/secureContact'
import { QrCode, Camera, CameraOff, ArrowRight, Loader2, SearchX } from 'lucide-react'

// Accept full QR payloads (https://bharatmechanics.com/v/CODE) or bare codes.
const parseCode = (raw: string): string => {
  const m = raw.match(/\/v\/([A-Z0-9]+)/i)
  if (m) return m[1].toUpperCase()
  const bare = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  return bare.length >= 4 && bare.length <= 10 ? bare : ''
}

type CamState = 'starting' | 'live' | 'unsupported' | 'denied'

export function ScanPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const busyRef = useRef(false)
  const [cam, setCam] = useState<CamState>('starting')
  const [manual, setManual] = useState('')
  const [state, setState] = useState<'idle' | 'resolving' | 'notfound'>('idle')

  const handleCode = async (raw: string) => {
    if (busyRef.current) return
    const code = parseCode(raw)
    if (!code) return
    busyRef.current = true
    setState('resolving')
    const found = await resolveCode(code)
    if (found) {
      router.push(`/contact-owner?code=${encodeURIComponent(found.code)}`)
      return // navigation takes over
    }
    setState('notfound')
    setTimeout(() => { busyRef.current = false; setState('idle') }, 2200)
  }

  // Camera + scan loop — only where BarcodeDetector exists.
  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setInterval> | null = null
    let stopped = false

    const start = async () => {
      const BD = (window as any).BarcodeDetector
      if (!BD || !navigator.mediaDevices?.getUserMedia) { setCam('unsupported'); return }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, audio: false,
        })
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setCam('live')
        const detector = new BD({ formats: ['qr_code'] })
        timer = setInterval(async () => {
          if (busyRef.current || !videoRef.current || videoRef.current.readyState < 2) return
          try {
            const codes = await detector.detect(videoRef.current)
            const value = codes?.[0]?.rawValue
            if (value) handleCode(String(value))
          } catch { /* transient decode error — keep scanning */ }
        }, 400)
      } catch {
        setCam('denied')
      }
    }
    start()
    return () => {
      stopped = true
      if (timer) clearInterval(timer)
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <UserLayout>
      <div className="mx-auto max-w-md px-4 pb-10" style={{ background: 'linear-gradient(180deg,#E6F6F8,#F4F6FB 70%)' }}>
        <div className="pt-5">
          <h1 className="font-display text-2xl font-extrabold text-[#0F2545]">Scan vehicle QR</h1>
          <p className="text-[12.5px] font-semibold text-slate-500">SecureContact · reach the owner privately</p>
        </div>

        {/* viewfinder */}
        <div className="relative mt-4 overflow-hidden rounded-3xl bg-[#0c1118]" style={{ aspectRatio: '1 / 1' }}>
          <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          {cam !== 'live' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              {cam === 'starting' ? (
                <><Loader2 className="h-8 w-8 animate-spin text-white/70" /><p className="text-sm font-bold text-white/70">Starting camera…</p></>
              ) : cam === 'denied' ? (
                <><CameraOff className="h-9 w-9 text-white/60" /><p className="text-sm font-bold text-white/80">Camera permission denied</p><p className="text-xs font-semibold text-white/60">Allow camera access in your browser, or type the code below.</p></>
              ) : (
                <><Camera className="h-9 w-9 text-white/60" /><p className="text-sm font-bold text-white/80">Camera scanning isn&apos;t supported in this browser</p><p className="text-xs font-semibold text-white/60">Use Chrome on Android — or type the code printed under the QR below.</p></>
              )}
            </div>
          )}
          {/* corner frame */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className={`h-3/5 w-3/5 rounded-3xl border-[3px] ${state === 'notfound' ? 'border-red-400' : 'border-white/50'}`} />
          </div>
          {state === 'resolving' && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-bold text-white"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking code…</span>
            </div>
          )}
          {state === 'notfound' && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-bold text-red-300"><SearchX className="h-3.5 w-3.5" /> No vehicle found — try again</span>
            </div>
          )}
        </div>

        {/* manual entry — works in every browser */}
        <p className="mt-4 text-center text-xs font-bold text-slate-500">Or type the code printed under the QR</p>
        <div className="mt-2 flex gap-2.5">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter' && manual.trim()) handleCode(manual) }}
            placeholder="e.g. XY4821"
            maxLength={10}
            className="h-13 flex-1 rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3.5 text-[15px] font-extrabold tracking-[0.2em] text-[#0F2545] outline-none focus:border-[#1B3B6F]"
          />
          <button
            onClick={() => manual.trim() && handleCode(manual)}
            disabled={!manual.trim() || state === 'resolving'}
            className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-[#FF6B35] text-white disabled:opacity-50"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <button onClick={() => router.push('/vehicle-qr')}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-slate-200 bg-white text-sm font-extrabold text-[#1B3B6F]">
          <QrCode className="h-[18px] w-[18px]" /> Show my vehicle QR instead
        </button>
      </div>
    </UserLayout>
  )
}
