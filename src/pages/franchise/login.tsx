'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Cookies from 'js-cookie'
import { Loader2, Phone, ArrowRight, ArrowLeft } from 'lucide-react'
import { authAPI } from '@/services/api'
import { SEOHead } from '@/components/SEOHead'

// Franchise owner + team login (phone OTP). Uses its own cookie so it never
// signs anyone out of the admin panel in the same browser.
export default function FranchiseLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault(); setError('')
    if (phone.replace(/\D/g, '').length !== 10) { setError('Enter your 10-digit mobile number.'); return }
    setLoading(true)
    try {
      const r = await authAPI.sendOtp(phone.replace(/\D/g, ''), 'login')
      if (r.data?.success) { setStep('otp'); setOtp('') } else setError(r.data?.message || 'Could not send OTP.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'This number is not registered for a franchise.')
    } finally { setLoading(false) }
  }

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault(); setError('')
    if (otp.trim().length < 4) { setError('Enter the OTP.'); return }
    setLoading(true)
    try {
      const r = await authAPI.verifyOtp(phone.replace(/\D/g, ''), otp.trim(), 'login')
      const data = r.data?.data || r.data
      if (data?.user?.role !== 'franchise') { setError('This number is not a franchise account.'); setLoading(false); return }
      if (!data?.token) { setError('Login failed. Please try again.'); setLoading(false); return }
      Cookies.set('franchise_token', data.token, { expires: 7 })
      router.push('/franchise')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <>
      <SEOHead title="Franchise Login" noIndex />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Image src="/white-logo-bm.png" alt="Bharat Mechanics" width={220} height={56} className="mx-auto h-14 w-auto object-contain" priority />
            <p className="mt-2 text-sm text-gray-300">Franchise Portal</p>
          </div>
          <form onSubmit={step === 'phone' ? sendOtp : verify} className="space-y-5 rounded-2xl bg-white p-8 shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{step === 'phone' ? 'Welcome back' : 'Enter OTP'}</h2>
              <p className="mt-1 text-sm text-gray-500">{step === 'phone' ? 'Log in with your registered mobile number' : `We sent a code to +91 ${phone}`}</p>
            </div>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-600">{error}</div>}
            {step === 'phone' ? (
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-[#7B8AA3]">Mobile number</span>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 focus-within:border-[#0D9488]">
                  <Phone className="h-4 w-4 text-gray-400" /><span className="text-sm text-gray-500">+91</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoFocus className="h-12 flex-1 bg-transparent text-[15px] outline-none" placeholder="10-digit number" />
                </div>
              </label>
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-[#7B8AA3]">OTP</span>
                <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoFocus className="h-12 w-full rounded-xl border border-gray-200 px-3 text-center text-lg tracking-[0.4em] outline-none focus:border-[#0D9488]" placeholder="••••••" />
              </label>
            )}
            <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D9488] text-[15px] font-bold text-white hover:bg-[#0F766E] disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{step === 'phone' ? 'Send OTP' : 'Verify & log in'} <ArrowRight className="h-4 w-4" /></>}
            </button>
            {step === 'otp' && (
              <button type="button" onClick={() => { setStep('phone'); setError('') }} className="mx-auto flex items-center gap-1 text-[13px] font-semibold text-[#52667C]"><ArrowLeft className="h-3.5 w-3.5" /> Change number</button>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
