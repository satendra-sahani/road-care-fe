'use client'

import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import {
  sendOtpRequest, verifyOtpRequest, registerRequest, resetOtpFlow, clearError,
} from '@/store/slices/customerAuthSlice'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import Image from 'next/image'
import { toast } from 'sonner'
import { X, ArrowLeft, Loader2, Locate, MapPin } from 'lucide-react'

type Step = 'phone' | 'otp' | 'register'

/**
 * Global login modal that mirrors the handoff bma-card design (phone → OTP →
 * profile) but is wired to the real Redux OTP auth flow. It does NOT
 * redirect — the LoginModalProvider closes it (and runs any pending action)
 * the moment auth succeeds.
 */
export function LoginModal({ onClose, dismissable = true }: { onClose: () => void; dismissable?: boolean }) {
  const dispatch = useDispatch()
  const { otpSending, otpSent, otpPurpose, otpVerifying, otpVerified, isNewUser, verificationToken, registering, error } =
    useSelector((s: RootState) => s.customerAuth)

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [detected, setDetected] = useState('')

  useEffect(() => { if (otpSent && step === 'phone') { setStep('otp'); toast.success('OTP sent to +91 ' + phone) } }, [otpSent])
  useEffect(() => { if (otpVerified && isNewUser) setStep('register') }, [otpVerified, isNewUser])
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()) } }, [error])
  useEffect(() => { if (step === 'otp' && otp.length === 6 && !otpVerifying && !otpVerified) dispatch(verifyOtpRequest({ phone, otp, purpose: otpPurpose })) }, [otp, step])

  const sendOtp = (e: React.FormEvent) => { e.preventDefault(); if (phone.length < 10) { toast.error('Please enter a valid 10-digit number'); return } dispatch(sendOtpRequest(phone)) }
  const verify = (e: React.FormEvent) => { e.preventDefault(); if (otp.length === 6) dispatch(verifyOtpRequest({ phone, otp, purpose: otpPurpose })) }
  const register = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { toast.error('Please enter your name'); return }
    if (!verificationToken) { toast.error('Session expired. Please try again.'); setStep('phone'); dispatch(resetOtpFlow()); return }
    dispatch(registerRequest({ verificationToken, fullName: fullName.trim(), email: email.trim() || undefined, address: address.trim() || undefined, city: city.trim() || undefined, pincode: pincode.trim() || undefined, latitude: lat || undefined, longitude: lng || undefined }))
  }
  const back = () => { if (step === 'otp') { setStep('phone'); setOtp('') } else if (step === 'register') { setStep('phone'); dispatch(resetOtpFlow()); setOtp('') } }
  const detect = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    setDetecting(true); setDetected('Detecting…')
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords; setLat(latitude); setLng(longitude)
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`)
        const d = await r.json()
        const a = d?.address || {}
        if (!address) setAddress([a.road, a.neighbourhood, a.suburb].filter(Boolean).join(', '))
        if (!city) setCity(a.city || a.town || a.village || a.state_district || '')
        if (!pincode) setPincode(a.postcode || '')
        setDetected(d.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
      } catch { setDetected(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`) }
      setDetecting(false)
    }, () => { setDetecting(false); setDetected(''); toast.error('Could not detect location') }, { enableHighAccuracy: true, timeout: 15000 })
  }

  const inp = 'w-full h-11 border border-[#E7ECF3] rounded-xl px-3.5 text-sm bg-[#F6F8FB] focus:outline-none focus:border-[#1B3B6F] focus:bg-white'

  return (
    <div className="fixed inset-0 z-[90] bg-[#0F2547]/30 backdrop-blur-md flex items-center justify-center p-4" onClick={dismissable ? onClose : undefined}>
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative px-6 pt-6 pb-4 text-center border-b border-[#EFF2F7]">
          {step !== 'phone' && <button onClick={back} className="absolute left-4 top-4 h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>}
          {dismissable && <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 h-9 w-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="h-5 w-5 text-gray-600" /></button>}
          <Image src="/brand-logo-v3.png" alt="Bharat Mechanics" width={170} height={54} className="h-9 w-auto object-contain mx-auto mb-3" />
          <h3 className="text-lg font-extrabold text-[#13203A]">{step === 'phone' ? 'Login or Sign up' : step === 'otp' ? 'Verify your number' : 'Complete your profile'}</h3>
          <p className="text-[13px] text-[#7B8AA3] mt-0.5">{step === 'phone' ? 'Enter your mobile number to continue' : step === 'otp' ? <>Enter the 6-digit code sent to <b>+91 {phone}</b></> : 'Just a few details to get started'}</p>
        </div>

        <div className="p-6">
          {step === 'phone' && (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">Mobile number</label>
                <div className="flex items-center border border-[#E7ECF3] rounded-xl bg-[#F6F8FB] overflow-hidden focus-within:border-[#1B3B6F] focus-within:bg-white">
                  <span className="px-3.5 py-3 text-sm font-bold text-[#475569] border-r border-[#E7ECF3]">🇮🇳 +91</span>
                  <input autoFocus type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" className="flex-1 px-3.5 py-3 bg-transparent outline-none text-[15px] tracking-wide" />
                </div>
              </div>
              <Button type="submit" disabled={otpSending || phone.length < 10} className="w-full h-12 bg-[#1B3B6F] hover:bg-[#152d55] text-white">{otpSending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending OTP…</> : 'Continue'}</Button>
              <p className="text-center text-[11.5px] text-[#7B8AA3]">By continuing you agree to our Terms &amp; Privacy Policy.</p>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verify} className="space-y-4">
              <div className="flex justify-center"><InputOTP maxLength={6} value={otp} onChange={setOtp} autoComplete="one-time-code" inputMode="numeric"><InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup></InputOTP></div>
              <Button type="submit" disabled={otpVerifying || otp.length < 6} className="w-full h-12 bg-[#1B3B6F] hover:bg-[#152d55] text-white">{otpVerifying ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying…</> : 'Verify & continue'}</Button>
              <button type="button" onClick={() => dispatch(sendOtpRequest(phone))} disabled={otpSending} className="w-full text-sm text-[#1B3B6F] hover:underline">{otpSending ? 'Resending…' : 'Resend OTP'}</button>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={register} className="space-y-3">
              <div><label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">Full name *</label><input autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inp} /></div>
              <div><label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">Email (optional)</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={inp} /></div>
              <button type="button" onClick={detect} disabled={detecting} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 rounded-xl text-sm font-semibold text-[#1B3B6F] hover:bg-blue-50 disabled:opacity-60">{detecting ? <><Loader2 className="h-4 w-4 animate-spin" /> Detecting…</> : <><Locate className="h-4 w-4" /> Detect my location</>}</button>
              {detected && !detecting && <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg"><MapPin className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /><p className="text-xs text-green-800 line-clamp-2">{detected}</p></div>}
              <div><label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, street, area" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">City</label><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inp} /></div>
                <div><label className="block text-[12.5px] font-bold text-[#475569] mb-1.5">Pincode</label><input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit" maxLength={6} className={inp} /></div>
              </div>
              <Button type="submit" disabled={registering || !fullName.trim()} className="w-full h-12 bg-[#FF6B35] hover:bg-[#e55a2a] text-white">{registering ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating account…</> : 'Create account'}</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
