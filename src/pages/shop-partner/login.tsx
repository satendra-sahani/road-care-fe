'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { authAPI } from '@/services/api'
import Cookies from 'js-cookie'
import { Loader2, Phone, ArrowRight, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function ShopLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    if (phone.trim().length < 10) { setError('Enter a valid 10-digit mobile number.'); return }
    setLoading(true)
    try {
      const res = await authAPI.sendOtp(phone.trim(), 'login')
      if (res.data?.success) { setStep('otp'); setOtp('') }
      else setError(res.data?.message || 'Could not send OTP.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'This mobile number is not registered as a shop partner.')
    } finally { setLoading(false) }
  }

  const verifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    if (otp.trim().length < 4) { setError('Enter the OTP.'); return }
    setLoading(true)
    try {
      const res = await authAPI.verifyOtp(phone.trim(), otp.trim(), 'login')
      const data = res.data?.data || res.data
      if (data?.user?.role !== 'shop') {
        setError('This account is not a shop partner account.')
        setLoading(false)
        return
      }
      const token = data?.token
      if (token) { Cookies.set('token', token, { expires: 7 }); router.push('/shop-partner') }
      else setError('Login failed. Please try again.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2545] via-[#1B3B6F] to-[#0F2545] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <Image
              src="/white-logo-bm.png"
              alt="Bharat Mechanics"
              width={220}
              height={56}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>
          <p className="text-gray-400 text-sm mt-1">Shop Partner Portal</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{step === 'phone' ? 'Welcome Back' : 'Enter OTP'}</h2>
            <p className="text-gray-500 text-sm mt-1">
              {step === 'phone' ? 'Login with your registered mobile number' : `We sent a code to +91 ${phone}`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">{error}</div>
          )}

          {step === 'phone' ? (
            <form onSubmit={sendOtp} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Mobile number</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-500">
                    <Phone className="h-4 w-4" /><span className="text-sm font-semibold">+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-[72px] pr-4 py-2.5 border rounded-lg text-sm tracking-wide focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    placeholder="10-digit number"
                    autoFocus
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#FF6B35] hover:bg-[#e55a28] text-white py-2.5" disabled={loading || phone.length < 10}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {loading ? 'Sending OTP…' : 'Send OTP'} {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">OTP</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-2.5 border rounded-lg text-center text-lg font-bold tracking-[0.4em] focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  placeholder="------"
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#FF6B35] hover:bg-[#e55a28] text-white py-2.5" disabled={loading || otp.length < 4}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {loading ? 'Verifying…' : 'Verify & Login'}
              </Button>
              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => { setStep('phone'); setError('') }} className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-3.5 w-3.5" /> Change number
                </button>
                <button type="button" onClick={() => sendOtp()} className="font-semibold text-[#FF6B35] hover:underline" disabled={loading}>Resend OTP</button>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-gray-500">Contact admin to register your shop partner account</p>
        </div>
      </div>
    </div>
  )
}
