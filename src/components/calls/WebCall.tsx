'use client'

// In-browser voice call over Agora — shared by the guest caller, the logged-in
// caller, and the receiver answering an incoming call. Numbers are never
// exposed: everyone talks over an Agora channel keyed by a server-issued token.
import { useEffect, useRef, useState } from 'react'
import { Shield, Mic, MicOff, PhoneOff, Loader2 } from 'lucide-react'

export interface CallHandle {
  // Poll the backend for the call's status (to detect the peer hanging up).
  getStatus: () => Promise<any>
  // Report a status change (answered / completed / rejected …).
  updateStatus: (status: string, duration: number) => Promise<any>
}

interface WebCallProps {
  appId: string
  channelName: string
  token: string
  uid: number
  peerName: string
  outgoing?: boolean // true = we placed the call, false = we answered
  api: CallHandle
  onClose: () => void
}

type Phase = 'connecting' | 'ringing' | 'live' | 'ended'

export function WebCall({ appId, channelName, token, uid, peerName, outgoing = true, api, onClose }: WebCallProps) {
  const [phase, setPhase] = useState<Phase>(outgoing ? 'ringing' : 'connecting')
  const [sec, setSec] = useState(0)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientRef = useRef<any>(null)
  const micTrackRef = useRef<any>(null)
  const startedAtRef = useRef<number>(0)
  const endedRef = useRef(false)
  const phaseRef = useRef<Phase>(phase)
  phaseRef.current = phase

  // Duration timer (once live)
  useEffect(() => {
    if (phase !== 'live') return
    const t = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const endCall = async (report = true) => {
    if (endedRef.current) return
    endedRef.current = true
    const duration = startedAtRef.current ? Math.round((Date.now() - startedAtRef.current) / 1000) : 0
    setPhase('ended')
    try { micTrackRef.current?.stop?.(); micTrackRef.current?.close?.() } catch { /* noop */ }
    try { await clientRef.current?.leave?.() } catch { /* noop */ }
    if (report) { try { await api.updateStatus('completed', duration) } catch { /* offline */ } }
    setTimeout(onClose, 900)
  }

  useEffect(() => {
    let cancelled = false
    let statusTimer: ReturnType<typeof setInterval> | null = null

    const start = async () => {
      let AgoraRTC: any
      try {
        AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      } catch {
        if (!cancelled) setError('Calling is not supported in this browser.')
        return
      }
      if (cancelled) return

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      // Remote audio → play as soon as the other side publishes.
      client.on('user-published', async (user: any, mediaType: string) => {
        try {
          await client.subscribe(user, mediaType)
          if (mediaType === 'audio') user.audioTrack?.play()
        } catch { /* subscribe race — ignore */ }
        if (!endedRef.current && phaseRef.current !== 'live') {
          startedAtRef.current = Date.now()
          setPhase('live')
          if (outgoing) { try { api.updateStatus('answered', 0) } catch { /* noop */ } }
        }
      })
      // Peer left the channel → end the call.
      client.on('user-left', () => { if (!endedRef.current) endCall(true) })

      try {
        await client.join(appId, channelName, token, uid)
        const mic = await AgoraRTC.createMicrophoneAudioTrack()
        if (cancelled) { mic.close(); return }
        micTrackRef.current = mic
        await client.publish([mic])
      } catch (e: any) {
        if (cancelled) return
        const msg = /permission|NotAllowed|denied/i.test(String(e?.message || e))
          ? 'Microphone permission denied. Allow mic access to talk.'
          : 'Could not connect the call. Please try again.'
        setError(msg)
        endCall(true)
        return
      }

      // Poll backend so we drop the call if the peer rejects / ends elsewhere.
      statusTimer = setInterval(async () => {
        if (endedRef.current) return
        try {
          const res = await api.getStatus()
          const st = res?.data?.data?.status
          if (st && ['completed', 'missed', 'rejected', 'failed'].includes(st)) endCall(false)
        } catch { /* transient */ }
      }, 3000)
    }

    start()
    return () => {
      cancelled = true
      if (statusTimer) clearInterval(statusTimer)
      try { micTrackRef.current?.close?.() } catch { /* noop */ }
      try { clientRef.current?.removeAllListeners?.(); clientRef.current?.leave?.() } catch { /* noop */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    try { micTrackRef.current?.setEnabled?.(!next) } catch { /* noop */ }
  }

  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  const status = error ? error
    : phase === 'connecting' ? 'Connecting securely…'
    : phase === 'ringing' ? 'Ringing…'
    : phase === 'live' ? `${mm}:${ss}`
    : 'Call ended'

  return (
    <div className="fixed inset-0 z-[80] flex flex-col text-white" style={{ background: 'linear-gradient(180deg,#0F2647,#1B3B6F 55%,#24508C)' }}>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[11.5px] font-extrabold tracking-wide text-[#FFD68A]">
          <Shield className="h-3.5 w-3.5" fill="currentColor" /> SECURE LINE · NUMBER HIDDEN
        </div>
        <div className="relative mt-8 h-[130px] w-[130px]">
          {phase !== 'live' && !error && <span className="absolute inset-0 animate-ping rounded-full border-2 border-white/30" />}
          <div className="flex h-[130px] w-[130px] items-center justify-center rounded-full bg-white/15 text-[60px]">🚗</div>
        </div>
        <div className="mt-6 font-display text-2xl font-extrabold">{peerName}</div>
        <div className="mt-1.5 text-sm font-bold opacity-85">via Bharat Mechanics SecureContact</div>
        <div className={`mt-4 text-lg font-extrabold tabular-nums tracking-wide ${error ? 'text-red-300' : phase === 'live' ? 'text-[#7DF3B0]' : 'text-white'}`}>
          {status}
        </div>
      </div>
      <div className="px-10 pb-12">
        {!error && (
          <div className="mb-6 flex justify-center">
            <button onClick={toggleMute} className="flex flex-col items-center gap-2 text-white">
              <span className={`grid h-[58px] w-[58px] place-items-center rounded-full ${muted ? 'bg-white text-[#1B3B6F]' : 'bg-white/15 text-white'}`}>
                {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </span>
              <span className="text-xs font-bold opacity-85">{muted ? 'Unmute' : 'Mute'}</span>
            </button>
          </div>
        )}
        <button onClick={() => endCall(true)}
          className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#E5484D] shadow-[0_12px_30px_-8px_rgba(229,72,77,.7)]">
          {phase === 'ended' ? <Loader2 className="h-7 w-7 animate-spin text-white" /> : <PhoneOff className="h-7 w-7 text-white" />}
        </button>
      </div>
    </div>
  )
}
