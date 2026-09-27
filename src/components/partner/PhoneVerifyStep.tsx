'use client'

import { useEffect, useRef, useState } from 'react'
import { partnerRegisterAPI } from '@/services/api'
import { IcArrowForward, IcAutorenew, IcCheckCircle, IcLock, IcPhone } from '@/components/icons/BmIcons'

export type PartnerExisting = {
  exists: boolean
  role?: string
  name?: string
  mechanic?: { isVerified: boolean } | null
  shop?: { isVerified: boolean; shopName?: string } | null
}
export type VerifiedPhone = { phone: string; token: string; existing: PartnerExisting }

const inputCls =
  'h-12 w-full rounded-xl border border-[#D6E2F0] bg-white px-4 text-[15px] text-[#0E2B4C] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#1A6FD4] focus:ring-2 focus:ring-[#1A6FD4]/15 disabled:bg-[#F2F6FC]'
const primaryBtn =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C94309] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#A93807] disabled:cursor-not-allowed disabled:opacity-60'

/**
 * Step 1 of self-registration: verify the mobile number with an SMS OTP.
 * The number becomes the partner's login (mechanic app / Shop Partner panel).
 */
export function PhoneVerifyStep({ initialPhone = '', onVerified, loginHint }: {
  initialPhone?: string
  onVerified: (v: VerifiedPhone) => void
  loginHint: string
}) {
  const [phone, setPhone] = useState(initialPhone.replace(/\D/g, '').slice(-10))
  const [otp, setOtp] = useState('')
  const [stage, setStage] = useState<'phone' | 'otp'>('phone')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const otpRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (initialPhone && !phone) setPhone(initialPhone.replace(/\D/g, '').slice(-10)) }, [initialPhone]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])
  useEffect(() => { if (stage === 'otp') otpRef.current?.focus() }, [stage])

  const send = async () => {
    setError('')
    if (phone.length !== 10) { setError('Enter your 10-digit mobile number'); return }
    setBusy(true)
    try {
      const r = await partnerRegisterAPI.sendOtp(phone)
      if (r.data?.success) { setStage('otp'); setOtp(''); setCooldown(30) }
      else setError(r.data?.message || 'Could not send OTP. Please try again.')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not send OTP. Please try again.')
    } finally { setBusy(false) }
  }

  const verify = async () => {
    setError('')
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return }
    setBusy(true)
    try {
      const r = await partnerRegisterAPI.verifyOtp(phone, otp)
      const d = r.data?.data
      if (r.data?.success && d?.partnerToken) onVerified({ phone, token: d.partnerToken, existing: d.existing || { exists: false } })
      else setError(r.data?.message || 'Invalid OTP')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally { setBusy(false) }
  }

  // auto-verify once 6 digits are in
  useEffect(() => { if (stage === 'otp' && otp.length === 6 && !busy) verify() }, [otp]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto w-full max-w-[460px] rounded-2xl border border-[#E6ECF3] bg-white p-5 shadow-[0_16px_40px_-24px_rgba(14,43,76,0.35)] sm:p-7">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFEDE1] text-[#C94309]">{stage === 'phone' ? <IcPhone size={24} /> : <IcLock size={24} />}</span>
      <h2 className="mt-4 text-[20px] font-bold text-[#0E2B4C]">{stage === 'phone' ? 'Verify your mobile number' : 'Enter the OTP'}</h2>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[#52667C]">
        {stage === 'phone' ? loginHint : <>We sent a 6-digit code to <b className="text-[#0E2B4C]">+91 {phone}</b>.</>}
      </p>

      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => { e.preventDefault(); stage === 'phone' ? send() : verify() }}
      >
        {stage === 'phone' ? (
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-[#41586F]">Mobile number</span>
            <div className="flex overflow-hidden rounded-xl border border-[#D6E2F0] bg-white focus-within:border-[#1A6FD4] focus-within:ring-2 focus-within:ring-[#1A6FD4]/15">
              <span className="flex items-center border-r border-[#E6ECF3] bg-[#F7FAFE] px-3.5 text-[14px] font-semibold text-[#0E2B4C]">+91</span>
              <input
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                aria-label="Mobile number"
                className="h-12 min-w-0 flex-1 px-3.5 text-[15px] tracking-wide text-[#0E2B4C] outline-none placeholder:text-[#94A3B8]"
              />
            </div>
          </label>
        ) : (
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-[#41586F]">6-digit OTP</span>
            <input
              ref={otpRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •"
              aria-label="OTP"
              className={`${inputCls} text-center text-[20px] font-semibold tracking-[0.5em]`}
            />
          </label>
        )}

        {error && <p role="alert" className="rounded-lg bg-[#FDECEC] px-3 py-2 text-[13px] text-[#B42318]">{error}</p>}

        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? <IcAutorenew size={18} className="animate-spin" /> : stage === 'otp' ? <IcCheckCircle size={18} /> : null}
          {stage === 'phone' ? (busy ? 'Sending OTP…' : 'Send OTP') : busy ? 'Verifying…' : 'Verify & continue'}
          {!busy && stage === 'phone' && <IcArrowForward size={18} />}
        </button>

        {stage === 'otp' && (
          <div className="flex items-center justify-between pt-1 text-[13px]">
            <button type="button" onClick={() => { setStage('phone'); setOtp(''); setError('') }} className="font-medium text-[#1864C8] hover:underline">Change number</button>
            <button type="button" onClick={send} disabled={cooldown > 0 || busy} className="font-semibold text-[#C94309] hover:underline disabled:text-[#94A3B8] disabled:no-underline">
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

/** 3-step progress indicator shared by /register/mechanic and /register/shop. */
export function RegisterSteps({ step }: { step: 1 | 2 | 3 }) {
  const items = ['Verify mobile', 'Your details', 'Done']
  return (
    <ol className="mx-auto flex w-full max-w-[520px] items-center" aria-label="Registration progress">
      {items.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const done = n < step
        const active = n === step
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-[13px] font-bold ${done ? 'bg-[#13864D] text-white' : active ? 'bg-[#C94309] text-white' : 'bg-[#E6ECF3] text-[#52667C]'}`} aria-current={active ? 'step' : undefined}>
                {done ? '✓' : n}
              </span>
              <span className={`whitespace-nowrap text-[11.5px] font-semibold ${active ? 'text-[#0E2B4C]' : 'text-[#52667C]'}`}>{label}</span>
            </div>
            {i < items.length - 1 && <span className={`mx-2 mb-5 h-[2px] flex-1 rounded ${done ? 'bg-[#13864D]' : 'bg-[#E6ECF3]'}`} />}
          </li>
        )
      })}
    </ol>
  )
}
