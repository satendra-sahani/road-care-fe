'use client'

import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Cookies from 'js-cookie'
import { IcArrowBack, IcArrowForward, IcHeadsetMic, IcLock } from '@/components/icons/BmIcons'
import { garageFieldAPI } from '@/services/api'
import { ORANGE, SUPPORT_PHONE } from '@/components/manager/StaffShell'

// Field-staff login (phone OTP). Staff accounts are created by the admin only —
// there is no sign-up here; an unknown number is told to contact the admin.
export default function ManagerLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wait, setWait] = useState(0) // seconds until "resend" is allowed

  useEffect(() => { if (Cookies.get('staff_token')) router.replace('/manager/garage') }, [router])
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t) }, [wait])

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault(); setError('')
    if (!/^[6-9]\d{9}$/.test(phone)) { setError('Sahi 10-digit mobile number daalein'); return }
    setLoading(true)
    try {
      await garageFieldAPI.sendOtp(phone)
      setStep('otp'); setOtp(''); setWait(30)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'OTP nahi bheja ja saka. Internet check karke dobara try karein.')
    } finally { setLoading(false) }
  }

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault(); setError('')
    if (otp.length < 4) { setError('OTP daalein'); return }
    setLoading(true)
    try {
      const r = await garageFieldAPI.verifyOtp(phone, otp)
      const token = r.data?.data?.token
      if (!token) throw new Error('no token')
      Cookies.set('staff_token', token, { expires: 30 })
      router.replace('/manager/garage')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'OTP galat hai. Dobara try karein.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#E9EEF5]">
      <Head>
        <title>Staff Login · Bharat Mechanics Field</title>
        <meta key="robots" name="robots" content="noindex, nofollow" />
        <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </Head>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-white px-5 pb-6 pt-10">
        <Image src="/brand-logo-v3.png" alt="Bharat Mechanics" width={220} height={58} priority className="mx-auto h-[52px] w-auto object-contain" />
        <p className="mt-2 text-center text-[12.5px] font-bold uppercase tracking-[0.14em] text-[#8A97AB]">Field Staff</p>

        <form onSubmit={step === 'phone' ? sendOtp : verify} className="mt-10">
          <h1 className="text-[24px] font-extrabold leading-tight text-[#13203A]">{step === 'phone' ? 'Staff Login' : 'OTP daalein'}</h1>
          <p className="mb-6 mt-1.5 text-[14px] text-[#64748B]">
            {step === 'phone' ? 'Apne registered mobile number se login karein.' : <>+91 {phone} par 6-digit OTP bheja gaya hai.</>}
          </p>

          {step === 'phone' ? (
            <label className="block">
              <span className="mb-1.5 block text-[13.5px] font-semibold text-[#13203A]">Mobile number</span>
              <div className="flex h-[54px] overflow-hidden rounded-xl border border-[#D9E1EC] bg-white focus-within:border-[#1B3B6F]">
                <span className="flex items-center border-r border-[#E6EBF2] px-3.5 text-[16px] font-semibold text-[#13203A]">+91</span>
                <input className="min-w-0 flex-1 px-3.5 text-[17px] tracking-wide text-[#13203A] outline-none placeholder:text-[#9AA6B8]" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="tel-national" autoFocus placeholder="10-digit number" />
              </div>
            </label>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-[13.5px] font-semibold text-[#13203A]">OTP</span>
              <input className="h-[54px] w-full rounded-xl border border-[#D9E1EC] bg-white px-3 text-center text-[22px] font-bold tracking-[0.45em] text-[#13203A] outline-none focus:border-[#1B3B6F]" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="••••••" />
            </label>
          )}

          {error && <p role="alert" className="mt-3 rounded-lg bg-[#FEF2F2] px-3 py-2.5 text-[13.5px] font-semibold text-[#B91C1C]">{error}</p>}

          <button type="submit" disabled={loading} className="mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-bold text-white active:opacity-90 disabled:opacity-70" style={{ background: ORANGE }}>
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <>{step === 'phone' ? 'OTP bhejein' : 'Login karein'} <IcArrowForward size={20} /></>}
          </button>

          {step === 'otp' && (
            <div className="mt-4 flex items-center justify-between text-[13.5px] font-bold">
              <button type="button" onClick={() => { setStep('phone'); setError('') }} className="flex items-center gap-1 text-[#475569]"><IcArrowBack size={17} /> Number badlein</button>
              <button type="button" onClick={() => sendOtp()} disabled={wait > 0 || loading} className="text-[#1B3B6F] disabled:text-[#9AA6B8]">{wait > 0 ? `OTP dobara bhejein (${wait}s)` : 'OTP dobara bhejein'}</button>
            </div>
          )}
        </form>

        <div className="mt-auto space-y-3 pt-10">
          <p className="flex items-start gap-2 rounded-xl bg-[#F1F5F9] px-3 py-3 text-[12.5px] leading-snug text-[#475569]">
            <span className="mt-0.5 shrink-0 text-[#1B3B6F]"><IcLock size={17} /></span>
            Yeh app sirf Bharat Mechanics ke field staff ke liye hai. Staff account admin banata hai — yahan khud se register nahi hota.
          </p>
          <a href={`tel:+91${SUPPORT_PHONE}`} className="flex items-center justify-center gap-1.5 text-[13.5px] font-bold text-[#1B3B6F]"><IcHeadsetMic size={18} /> Login mein dikkat? Call karein</a>
        </div>
      </div>
    </div>
  )
}
