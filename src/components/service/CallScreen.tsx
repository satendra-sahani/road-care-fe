'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, Phone, Mic, MicOff, Volume2, Grid3x3, MapPin } from 'lucide-react';

interface CallScreenProps {
  name: string;
  role?: string;
  rating?: number;
  /** avatar background colour */
  color?: string;
  address?: string;
  /** real phone number — used by the keypad to place an actual device call */
  phone?: string;
  onClose: () => void;
}

/**
 * Full-screen in-app call screen — faithful to claude-design `openCall()`.
 * Encrypted/masked call experience: rings → "Calling…" → connected timer,
 * with mute / speaker / keypad controls and an end-call button.
 * The keypad opens the real device dialer when a phone number is available.
 */
export default function CallScreen({ name, role, rating, color = '#1B3B6F', address, phone, onClose }: CallScreenProps) {
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    const connectT = setTimeout(() => {
      setConnected(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }, 2400);
    return () => {
      clearTimeout(connectT);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const close = () => {
    setLeaving(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(onClose, 200);
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col text-white transition-opacity duration-200 ${leaving ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(180deg,#13203A 0%,#0F2547 55%,#0b1c3a 100%)' }}
    >
      <style jsx>{`
        @keyframes ringPulse { 0% { transform: scale(.6); opacity: .55; } 100% { transform: scale(1.9); opacity: 0; } }
        .cs-ring { animation: ringPulse 2.2s ease-out infinite; }
      `}</style>

      {/* Top — encrypted/private banner */}
      <div className="pt-8 px-6 flex justify-center">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/70 bg-white/10 rounded-full px-3 py-1.5">
          <Shield className="h-3.5 w-3.5" /> Encrypted call · number stays private
        </span>
      </div>

      {/* Middle — avatar with rings, name, status */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
        <div className="relative h-32 w-32 flex items-center justify-center mb-2">
          {!connected && [0, 0.55, 1.1].map((d, i) => (
            <span
              key={i}
              className="cs-ring absolute h-28 w-28 rounded-full border border-white/40"
              style={{ animationDelay: `${d}s` }}
            />
          ))}
          <div
            className="h-28 w-28 rounded-full flex items-center justify-center text-3xl font-extrabold shadow-2xl"
            style={{ background: color }}
          >
            {initials}
          </div>
        </div>
        <div className="text-2xl font-extrabold">{name}</div>
        {(role || rating) && (
          <div className="text-sm text-white/65">
            {role}{role && rating ? ' · ' : ''}{rating ? `★ ${rating}` : ''}
          </div>
        )}
        <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold">
          {connected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-[#15936B] animate-pulse" />
              <span>{mmss}</span>
            </>
          ) : (
            <>
              <Phone className="h-4 w-4" />
              <span className="animate-pulse">Calling…</span>
            </>
          )}
        </div>
      </div>

      {/* Bottom — location, controls, end call */}
      <div className="px-6 pb-10">
        {address && (
          <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-white/55 mb-6">
            <MapPin className="h-3.5 w-3.5" /> {address}
          </div>
        )}
        <div className="flex items-center justify-center gap-8 mb-8">
          <CallCtrl label="Mute" active={muted} onClick={() => setMuted((m) => !m)}>
            {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </CallCtrl>
          <CallCtrl label="Speaker" active={speaker} onClick={() => setSpeaker((s) => !s)}>
            <Volume2 className="h-6 w-6" />
          </CallCtrl>
          <CallCtrl
            label="Keypad"
            active={false}
            onClick={() => { if (phone) window.location.href = `tel:${phone}`; }}
          >
            <Grid3x3 className="h-6 w-6" />
          </CallCtrl>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={close}
            aria-label="End call"
            className="h-16 w-16 rounded-full bg-[#E5484D] hover:bg-[#d23b40] flex items-center justify-center shadow-xl transition-colors active:scale-95"
          >
            <Phone className="h-7 w-7 rotate-[135deg]" />
          </button>
          <span className="text-[12px] text-white/55">End call</span>
        </div>
      </div>
    </div>
  );
}

function CallCtrl({ children, label, active, onClick }: { children: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className={`h-14 w-14 rounded-full flex items-center justify-center transition-colors active:scale-95 ${active ? 'bg-white text-[#13203A]' : 'bg-white/12 text-white hover:bg-white/20'}`}
      >
        {children}
      </button>
      <span className="text-[11.5px] text-white/60">{label}</span>
    </div>
  );
}
